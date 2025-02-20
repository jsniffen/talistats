from discord.ext import tasks
from dotenv import load_dotenv
from datetime import datetime
import boto3
import os
import traceback
import asyncio 

load_dotenv()

ACCESS_ID = os.getenv("DO_ACCESS_ID")
SECRET_KEY = os.getenv("DO_SECRET_KEY")
ENDPOINT = os.getenv("DO_ENDPOINT")
SPACE = os.getenv("DO_SPACE")
DB_NAME = "talistats.sqlite"

def download_db():
    s3 = boto3.client("s3", endpoint_url=ENDPOINT, aws_access_key_id=ACCESS_ID, aws_secret_access_key=SECRET_KEY)
    s3.download_file(SPACE, DB_NAME, DB_NAME)

@tasks.loop(minutes=1)
async def upload_db():
    try:
        s3 = boto3.client("s3", endpoint_url=ENDPOINT, aws_access_key_id=ACCESS_ID, aws_secret_access_key=SECRET_KEY)

        s3.upload_file(DB_NAME, SPACE, DB_NAME)
        s3.put_object_acl(ACL='public-read', Bucket=SPACE, Key=DB_NAME)
        print(f"Successfully uploaded {DB_NAME} to {SPACE}")

        date = datetime.today().strftime('%Y_%m_%d')
        DATE_DB_NAME = f"{date}_{DB_NAME}"
        s3.upload_file(DB_NAME, SPACE, DATE_DB_NAME)
        s3.put_object_acl(ACL='public-read', Bucket=SPACE, Key=DATE_DB_NAME)
        print(f"Successfully uploaded {DATE_DB_NAME} to {SPACE}")

    except Exception as e:
        print(f"Failed to upload {DB_NAME} to {SPACE}")
        print(traceback.format_exc())
        print(e)
