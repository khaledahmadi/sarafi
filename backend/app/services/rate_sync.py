"""Background sync of exchange rates from sarafi.af into PostgreSQL."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.rate_sources import RATE_SOURCES, get_rate_source
from app.models.currency import Currency
from app.services.sarafi_af_rates import CURRENCY_META, SarafiAfRate, fetch_market_rates

logger = logging.getLogger(__name__)


def compute_is_stale(last_success_at: datetime | None, now: datetime, stale_after_seconds: int) -> bool:
    if last_success_at is None:
        return True
    return (now - last_success_at).total_seconds() > stale_after_seconds


def compute_backoff_delay(
    consecutive_failures: int,
    base_interval: int,
    max_backoff: int,
) -> int:
    if consecutive_failures <= 0:
        return base_interval
    return min(base_interval * (2 ** (consecutive_failures - 1)), max_backoff)


@dataclass
class RateSyncStatus:
    rate_source: str
    source_url: str = ""
    source_label_fa: str = ""
    source_label_en: str = ""
    last_attempt_at: datetime | None = None
    last_success_at: datetime | None = None
    last_error: str | None = None
    currencies_updated: int = 0
    currencies_created: int = 0
    is_running: bool = False
    consecutive_failures: int = 0
    next_sync_in_seconds: int = 0
    using_cached_rates: bool = False


sync_status_by_source: dict[str, RateSyncStatus] = {
    source_id: RateSyncStatus(
        rate_source=source_id,
        source_url=cfg.url,
        source_label_fa=cfg.label_fa,
        source_label_en=cfg.label_en,
    )
    for source_id, cfg in RATE_SOURCES.items()
}


def _has_cached_rates(db: Session, rate_source: str) -> bool:
    count = db.scalar(
        select(func.count()).select_from(Currency).where(Currency.rate_source == rate_source)
    )
    return bool(count and count > 0)


def sync_rates_from_sarafi_af(
    db: Session,
    rates: list[SarafiAfRate],
    *,
    rate_source: str,
) -> dict[str, int]:
    updated = 0
    created = 0

    for rate in rates:
        row = db.scalar(
            select(Currency).where(
                Currency.rate_source == rate_source,
                Currency.code == rate.code,
            )
        )
        meta = CURRENCY_META.get(
            rate.code,
            {"name_fa": rate.code, "name_en": rate.code, "name_ps": rate.code, "flag": None},
        )

        if row is None:
            db.add(
                Currency(
                    rate_source=rate_source,
                    code=rate.code,
                    name_fa=meta["name_fa"],
                    name_en=meta.get("name_en"),
                    name_ps=meta.get("name_ps"),
                    flag=meta.get("flag"),
                    buy_rate=rate.buy_rate,
                    sell_rate=rate.sell_rate,
                    sort_order=rate.sort_order,
                    is_active=True,
                )
            )
            created += 1
            continue

        changed = False
        if row.buy_rate != rate.buy_rate:
            row.buy_rate = rate.buy_rate
            changed = True
        if row.sell_rate != rate.sell_rate:
            row.sell_rate = rate.sell_rate
            changed = True
        if row.sort_order != rate.sort_order:
            row.sort_order = rate.sort_order
            changed = True
        # Keep localized names in sync when meta provides them.
        if meta.get("name_en") and row.name_en != meta.get("name_en"):
            row.name_en = meta.get("name_en")
            changed = True
        if meta.get("name_ps") and row.name_ps != meta.get("name_ps"):
            row.name_ps = meta.get("name_ps")
            changed = True
        if changed:
            updated += 1

    db.commit()
    return {"updated": updated, "created": created}


async def run_rate_sync(source_key: str | None = None) -> dict:
    sources = [get_rate_source(source_key)] if source_key else list(RATE_SOURCES.values())
    results: list[dict] = []

    for source in sources:
        status = sync_status_by_source[source.id]
        status.is_running = True
        status.last_attempt_at = datetime.now(UTC)
        try:
            rates = await fetch_market_rates(source.id)
            with SessionLocal() as db:
                counts = sync_rates_from_sarafi_af(db, rates, rate_source=source.id)
                status.using_cached_rates = False
            status.last_success_at = datetime.now(UTC)
            status.last_error = None
            status.consecutive_failures = 0
            status.currencies_updated = counts["updated"]
            status.currencies_created = counts["created"]
            logger.info(
                "Rate sync complete for %s: %s updated, %s created",
                source.id,
                counts["updated"],
                counts["created"],
            )
            results.append({"ok": True, "rate_source": source.id, **counts})
        except Exception as exc:
            status.consecutive_failures += 1
            status.last_error = str(exc)
            with SessionLocal() as db:
                status.using_cached_rates = _has_cached_rates(db, source.id)
            logger.warning(
                "Rate sync failed for %s (attempt %s); cached=%s: %s",
                source.id,
                status.consecutive_failures,
                status.using_cached_rates,
                exc,
            )
            results.append(
                {
                    "ok": False,
                    "rate_source": source.id,
                    "message": str(exc),
                    "using_cached_rates": status.using_cached_rates,
                    "consecutive_failures": status.consecutive_failures,
                }
            )
        finally:
            status.is_running = False

    if len(results) == 1:
        return results[0]
    return {"ok": all(item.get("ok") for item in results), "results": results}


async def rate_sync_loop() -> None:
    if not settings.RATE_SYNC_ENABLED:
        logger.info("Rate sync disabled")
        return

    logger.info(
        "Starting rate sync loop (every %ss, stale after %ss) for %s markets",
        settings.RATE_SYNC_INTERVAL_SECONDS,
        settings.RATE_SYNC_STALE_AFTER_SECONDS,
        ", ".join(RATE_SOURCES),
    )

    failure_count = 0
    while True:
        result = await run_rate_sync()
        if result.get("ok"):
            failure_count = 0
            delay = settings.RATE_SYNC_INTERVAL_SECONDS
        else:
            failure_count += 1
            delay = compute_backoff_delay(
                failure_count,
                settings.RATE_SYNC_INTERVAL_SECONDS,
                settings.RATE_SYNC_FAILURE_BACKOFF_MAX_SECONDS,
            )
        for status in sync_status_by_source.values():
            status.next_sync_in_seconds = delay
        await asyncio.sleep(delay)
