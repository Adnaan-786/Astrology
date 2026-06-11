import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def main():
    load_dotenv("backend/.env")
    client = AsyncIOMotorClient(os.getenv("MONGODB_URL"))
    db = client.get_database("astrovedic")
    docs = await db.blog.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
    for doc in docs:
        print(f"Title: {doc.get('title')}, Cover Image: {doc.get('cover_image')}")

asyncio.run(main())
