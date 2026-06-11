import asyncio
import os

from sqlalchemy import select
from transvirex_common.database import create_session_factory
from transvirex_common.security import hash_password

from app.config import settings
from app.models import Role, User


async def main() -> None:
    email = os.getenv("SEED_ADMIN_EMAIL", "admin@transvirex.local")
    password = os.getenv("SEED_ADMIN_PASSWORD", "changeme")

    session_maker = create_session_factory(settings.database_url)
    async with session_maker() as db:
        existing = await db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            print(f"admin '{email}' already exists, skipping")
            return
        db.add(
            User(
                email=email,
                hashed_password=hash_password(password),
                role=Role.MANAGER,
                is_admin=True,
            )
        )
        await db.commit()
        print(f"seeded admin '{email}'")


if __name__ == "__main__":
    asyncio.run(main())