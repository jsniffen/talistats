from boto3 import session
from dotenv import load_dotenv
import os

load_dotenv()

ACCESS_ID = os.getenv("DO_ACCESS_ID")
SECRET_KEY = os.getenv("DO_SECRET_KEY")
ENDPOINT = os.getenv("DO_ENDPOINT")
SPACE = os.getenv("DO_SPACE")
DB_NAME = "talistats.sqlite"

# Initiate session
session = session.Session()
client = session.client("s3",
                        endpoint_url=ENDPOINT,
                        aws_access_key_id=ACCESS_ID,
                        aws_secret_access_key=SECRET_KEY)


if __name__ == "__main__":
    client.upload_file(DB_NAME, SPACE, DB_NAME)
