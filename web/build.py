import os

with open("env.js", "w") as file:
    db_url = os.environ["DB_URL"]
    file.write(f"""export const DB_URL = "{db_url}";""")
