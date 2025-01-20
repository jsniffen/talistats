import os

with open("env.js", "w") as file:
    db_url = os.environ["DB_URL"]
    file.write("export const DB_URL = \"")
    file.write(db_url)
    file.write("\";")
