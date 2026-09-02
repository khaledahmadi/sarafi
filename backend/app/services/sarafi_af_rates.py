"""Fetch and parse sarafi.af market rates."""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

import httpx

from app.core.config import settings
from app.core.rate_sources import RATE_SOURCES, RateSourceConfig, get_rate_source

logger = logging.getLogger(__name__)

# Currencies quoted per 1,000 units on sarafi.af (IRR, PKR, JPY).
PER_1K_CODES = frozenset({"IRR", "PKR", "JPY"})

CURRENCY_META: dict[str, dict[str, str]] = {
    "USD": {
        "name_fa": "دالر آمریکا",
        "name_en": "US Dollar",
        "name_ps": "د امریکا ډالر",
        "flag": "🇺🇸",
    },
    "EUR": {"name_fa": "یورو", "name_en": "Euro", "name_ps": "یورو", "flag": "🇪🇺"},
    "GBP": {
        "name_fa": "پوند انگلیس",
        "name_en": "British Pound",
        "name_ps": "د انګلستان پونډ",
        "flag": "🇬🇧",
    },
    "IRR": {
        "name_fa": "ریال ایران (۱هزار)",
        "name_en": "Iranian Rial (1k)",
        "name_ps": "د ایران ریال (۱ زره)",
        "flag": "🇮🇷",
    },
    "PKR": {
        "name_fa": "روپیه پاکستان (۱هزار)",
        "name_en": "Pakistani Rupee (1k)",
        "name_ps": "د پاکستان روپۍ (۱ زره)",
        "flag": "🇵🇰",
    },
    "INR": {
        "name_fa": "روپیه هند (۱هزار)",
        "name_en": "Indian Rupee (1k)",
        "name_ps": "د هند روپۍ (۱ زره)",
        "flag": "🇮🇳",
    },
    "SAR": {
        "name_fa": "ریال سعودی",
        "name_en": "Saudi Riyal",
        "name_ps": "د سعودي ریال",
        "flag": "🇸🇦",
    },
    "AED": {
        "name_fa": "درهم امارات",
        "name_en": "UAE Dirham",
        "name_ps": "د اماراتو درهم",
        "flag": "🇦🇪",
    },
    "CHF": {
        "name_fa": "فرانک سوئیس",
        "name_en": "Swiss Franc",
        "name_ps": "د سویس فرانک",
        "flag": "🇨🇭",
    },
    "AUD": {
        "name_fa": "دالر استرالیا",
        "name_en": "Australian Dollar",
        "name_ps": "د استرالیا ډالر",
        "flag": "🇦🇺",
    },
    "CAD": {
        "name_fa": "دالر کانادا",
        "name_en": "Canadian Dollar",
        "name_ps": "د کانادا ډالر",
        "flag": "🇨🇦",
    },
    "RUB": {
        "name_fa": "روبل روسیه",
        "name_en": "Russian Ruble",
        "name_ps": "د روسیې روبل",
        "flag": "🇷🇺",
    },
    "DKK": {
        "name_fa": "کرون دانمارک",
        "name_en": "Danish Krone",
        "name_ps": "د ډنمارک کرون",
        "flag": "🇩🇰",
    },
    "SEK": {
        "name_fa": "کرون سویدن",
        "name_en": "Swedish Krona",
        "name_ps": "د سویډن کرون",
        "flag": "🇸🇪",
    },
    "NOK": {
        "name_fa": "کرون نروژ",
        "name_en": "Norwegian Krone",
        "name_ps": "د ناروې کرون",
        "flag": "🇳🇴",
    },
    "TRY": {
        "name_fa": "لیر ترکیه",
        "name_en": "Turkish Lira",
        "name_ps": "د ترکیې لیر",
        "flag": "🇹🇷",
    },
    "CNY": {
        "name_fa": "یوان چین",
        "name_en": "Chinese Yuan",
        "name_ps": "د چین یوان",
        "flag": "🇨🇳",
    },
    "KWD": {
        "name_fa": "دینار کویت",
        "name_en": "Kuwaiti Dinar",
        "name_ps": "د کویت دینار",
        "flag": "🇰🇼",
    },
    "QAR": {
        "name_fa": "ریال قطر",
        "name_en": "Qatari Riyal",
        "name_ps": "د قطر ریال",
        "flag": "🇶🇦",
    },
    "BHD": {
        "name_fa": "دینار بحرین",
        "name_en": "Bahraini Dinar",
        "name_ps": "د بحرین دینار",
        "flag": "🇧🇭",
    },
    "JPY": {
        "name_fa": "ین ژاپن (۱هزار)",
        "name_en": "Japanese Yen (1k)",
        "name_ps": "د جاپان ین (۱ زره)",
        "flag": "🇯🇵",
    },
}


@dataclass(frozen=True, slots=True)
class SarafiAfRate:
    code: str
    buy_rate: Decimal
    sell_rate: Decimal
    sort_order: int


def parse_market_rates(html: str, source: RateSourceConfig) -> list[SarafiAfRate]:
    table_match = re.search(
        r'<table class="homeRates exchangeRatesTable[^>]*>.*?<tbody>(.*?)</tbody>',
        html,
        re.DOTALL | re.IGNORECASE,
    )
    if not table_match:
        raise ValueError(f"sarafi.af rates table not found for {source.id}")

    market_path = f"/exchange-rates/{source.slug}"
    rows: list[SarafiAfRate] = []
    for index, row_html in enumerate(re.findall(r"<tr>(.*?)</tr>", table_match.group(1), re.DOTALL)):
        code_match = re.search(rf"{re.escape(market_path)}/([A-Z]+)-AFN", row_html)
        buy_match = re.search(r'class="buyRate">([^<]+)</b>', row_html)
        sell_match = re.search(r'class="sellRate">([^<]+)</b>', row_html)
        if not code_match or not buy_match or not sell_match:
            continue

        code = code_match.group(1).upper()
        try:
            buy_rate = _parse_rate(buy_match.group(1))
            sell_rate = _parse_rate(sell_match.group(1))
        except InvalidOperation as exc:
            raise ValueError(f"invalid rate for {code}") from exc

        if sell_rate < buy_rate:
            raise ValueError(f"sell rate below buy rate for {code}")

        rows.append(SarafiAfRate(code=code, buy_rate=buy_rate, sell_rate=sell_rate, sort_order=index + 1))

    if not rows:
        raise ValueError(f"no sarafi.af rates parsed for {source.id}")

    return rows


def parse_sarai_shahzada_rates(html: str) -> list[SarafiAfRate]:
    return parse_market_rates(html, RATE_SOURCES["sarai_shahzada"])


def _parse_rate(raw: str) -> Decimal:
    cleaned = raw.strip().replace(",", "")
    return Decimal(cleaned)


async def fetch_market_html(source: RateSourceConfig) -> str:
    headers = {
        "User-Agent": "SarafiDigitalSuite/1.0 (+https://github.com/sarafi-digital-suite)",
        "Accept": "text/html,application/xhtml+xml",
    }
    timeout = httpx.Timeout(settings.RATE_SYNC_HTTP_TIMEOUT_SECONDS)
    async with httpx.AsyncClient(headers=headers, timeout=timeout, follow_redirects=True) as client:
        response = await client.get(source.url)
        response.raise_for_status()
        return response.text


async def fetch_market_rates(source_key: str) -> list[SarafiAfRate]:
    source = get_rate_source(source_key)
    html = await fetch_market_html(source)
    rates = parse_market_rates(html, source)
    logger.info("Fetched %s rates from sarafi.af (%s)", len(rates), source.id)
    return rates


async def fetch_sarai_shahzada_rates() -> list[SarafiAfRate]:
    return await fetch_market_rates("sarai_shahzada")
