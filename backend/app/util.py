from datetime import datetime, timezone


def now_utc() -> datetime:
    """Naive UTC timestamp, consistent across the app and DB columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
