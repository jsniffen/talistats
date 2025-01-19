from bottle import route, run, request
import _thread as thread
import db
import talishar
import asyncio


@route('/')
def index():
    match_id = request.query.match_id
    format = request.query.format

    match = talishar.get_match_stats(match_id)

    if not match.is_over():
        return f"Cannot add result: {match.summary()}"

    # loop = asyncio.new_event_loop()
    # asyncio.set_event_loop(loop)

    if asyncio.run(db.match_exists(match)):
    # if loop.run_until_complete(db.match_exists(match)):
        return f"Cannot add duplicate result: {match.summary()}"

    # loop.run_until_complete(db.insert_match(match))
    asyncio.run(db.insert_match(match))
    return f"Added result: {match.summary()}"

def start(port=8080):
    thread.start_new_thread(run, (), {"host":"0.0.0.0", "port":port})
