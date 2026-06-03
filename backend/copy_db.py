import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys
import logging

logging.basicConfig(level=logging.INFO)

async def copy_database(source_uri: str, target_uri: str, db_name: str):
    logging.info(f"Connecting to source MongoDB...")
    source_client = AsyncIOMotorClient(source_uri)
    source_db = source_client[db_name]

    logging.info(f"Connecting to target MongoDB...")
    target_client = AsyncIOMotorClient(target_uri)
    target_db = target_client[db_name]

    collections = await source_db.list_collection_names()
    
    for coll_name in collections:
        logging.info(f"Copying collection: {coll_name}...")
        source_coll = source_db[coll_name]
        target_coll = target_db[coll_name]
        
        # Clear existing data in target
        await target_coll.delete_many({})
        
        # Get all documents
        cursor = source_coll.find({})
        docs = await cursor.to_list(length=None)
        
        if docs:
            await target_coll.insert_many(docs)
            logging.info(f"  -> Copied {len(docs)} documents.")
        else:
            logging.info(f"  -> Collection {coll_name} is empty.")

    logging.info("Database copy completed successfully!")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python copy_db.py <LOCAL_MONGO_URI> <TARGET_MONGO_URI>")
        sys.exit(1)
        
    local_uri = sys.argv[1]
    target_uri = sys.argv[2]
    db_name = "astrovedic"
    
    asyncio.run(copy_database(local_uri, target_uri, db_name))
