from datetime import UTC, datetime, timedelta

from app.services.rate_sync import compute_backoff_delay, compute_is_stale


def test_compute_is_stale_when_never_synced() -> None:
    now = datetime.now(UTC)
    assert compute_is_stale(None, now, 90) is True


def test_compute_is_stale_when_recent() -> None:
    now = datetime.now(UTC)
    last = now - timedelta(seconds=30)
    assert compute_is_stale(last, now, 90) is False


def test_compute_is_stale_when_old() -> None:
    now = datetime.now(UTC)
    last = now - timedelta(seconds=120)
    assert compute_is_stale(last, now, 90) is True


def test_compute_backoff_delay_resets_on_success() -> None:
    assert compute_backoff_delay(0, 30, 300) == 30


def test_compute_backoff_delay_exponential() -> None:
    assert compute_backoff_delay(1, 30, 300) == 30
    assert compute_backoff_delay(2, 30, 300) == 60
    assert compute_backoff_delay(3, 30, 300) == 120
    assert compute_backoff_delay(4, 30, 300) == 240
    assert compute_backoff_delay(5, 30, 300) == 300
