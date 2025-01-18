from flask import Flask, request

app = Flask(__name__)

@app.route('/')
def index():
    match_id = request.args.get("match_id", "")
    format = request.args.get("format", "")
    return 'Hello, World!' + match_id + format
