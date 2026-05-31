import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    db = AsyncIOMotorClient("mongodb://localhost:27017").astrovedic
    result = await db.users.update_one({"email": "akshatsharma7730@gmail.com"}, {"$set": {"wallet_balance": 5000}})
    print("Matched:", result.matched_count, "Modified:", result.modified_count)

asyncio.run(main())
