import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    try:
        client = AsyncIOMotorClient("mongodb+srv://admin:IGEPSezzITDoDR6T@astro.8avqer2.mongodb.net/?appName=Astro")
        db = client["astrovedic"]
        docs = await db.products.find().to_list(100)
        print("Products:", len(docs))
    except Exception as e:
        print("Error:", e)

asyncio.run(test())
