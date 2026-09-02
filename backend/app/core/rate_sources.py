from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class RateSourceConfig:
    id: str
    slug: str
    label_fa: str
    label_en: str
    label_ps: str
    url: str


SARAI_SHAHZADA = "sarai_shahzada"
DA_AFG_BANK = "da_afg_bank"
DEFAULT_RATE_SOURCE = SARAI_SHAHZADA

RATE_SOURCES: dict[str, RateSourceConfig] = {
    SARAI_SHAHZADA: RateSourceConfig(
        id=SARAI_SHAHZADA,
        slug="sarai-shahzada",
        label_fa="سرای شهزاده",
        label_en="Sarai Shahzada",
        label_ps="سرای شهزاده",
        url="https://sarafi.af/en/exchange-rates/sarai-shahzada",
    ),
    DA_AFG_BANK: RateSourceConfig(
        id=DA_AFG_BANK,
        slug="da-afg-bank",
        label_fa="د افغانستان بانک",
        label_en="Da AFG Bank",
        label_ps="د افغانستان بانک",
        url="https://sarafi.af/en/exchange-rates/da-afg-bank",
    ),
}


def normalize_rate_source(source: str | None) -> str:
    key = (source or DEFAULT_RATE_SOURCE).strip().lower().replace("-", "_")
    if key in RATE_SOURCES:
        return key
    slug_map = {cfg.slug.replace("-", "_"): cfg.id for cfg in RATE_SOURCES.values()}
    slug_map.update({cfg.slug: cfg.id for cfg in RATE_SOURCES.values()})
    if key in slug_map:
        return slug_map[key]
    return DEFAULT_RATE_SOURCE


def get_rate_source(source: str | None) -> RateSourceConfig:
    return RATE_SOURCES[normalize_rate_source(source)]
