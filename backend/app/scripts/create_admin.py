"""Run: python -m app.scripts.create_admin"""
import asyncio
from sqlalchemy import select
from app.database import async_session_maker
from app.models.user import User
from app.auth.jwt import get_password_hash


async def main():
    async with async_session_maker() as db:
        result = await db.execute(select(User).where(User.email == "admin@embroidery.com"))
        existing = result.scalar_one_or_none()
        if existing:
            print("Admin user already exists.")
            return
        admin = User(
            name="Admin",
            email="admin@embroidery.com",
            hashed_password=get_password_hash("Admin@123"),
            role="admin",
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        print("Admin user created: admin@embroidery.com / Admin@123")


if __name__ == "__main__":
    asyncio.run(main())
