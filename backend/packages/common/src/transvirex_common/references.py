from datetime import datetime, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

_BUMP = text("""
    INSERT INTO counters (entity, year, last_value)
    VALUES (:entity, :year, 1)
    ON CONFLICT (entity, year)
    DO UPDATE SET last_value = counters.last_value + 1
    RETURNING last_value
    """)


async def next_reference(
    session: AsyncSession,
    entity: str,
    prefix: str,
    *,
    year: int | None = None,
    width: int = 4,
) -> str:
    y = year or datetime.now(timezone.utc).year
    result = await session.execute(_BUMP, {"entity": entity, "year": y})
    seq = result.scalar_one()
    return f"{prefix}-{y}-{seq:0{width}d}"
