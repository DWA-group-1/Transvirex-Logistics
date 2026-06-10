import asyncio
from app.database import SessionMaker
from app.models import User, Role
from app.security import hash_password


async def main():
    async with SessionMaker() as db:
        admin = User(
            email="admin@transvirex.local",
            hashed_password=hash_password("changeme"),
            role=Role.MANAGER,
            is_admin=True,
        )
        db.add(admin)
        await db.commit()


if __name__ == "__main__":
    asyncio.run(main())