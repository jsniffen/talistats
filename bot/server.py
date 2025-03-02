from bottle import route, run, request
import _thread as thread
import db
import talishar
import asyncio


@route('/')
def index():
    match_id = request.query.match_id
    format = request.query.format
    reporter = int(request.query.get("player", 0))

    match = talishar.get_match_stats(match_id)

    if match.players[0].hero == "":
        return f"Cannot add result: Hero 1 is invalid"

    if match.players[1].hero == "":
        return f"Cannot add result: Hero 2 is invalid"

    if not match.is_over():
        return f"Cannot add result: {match.summary()}"

    duplicate_match_id, current_reporter = asyncio.run(db.get_duplicate_match(match))
    if duplicate_match_id is not None:
        if reporter == 0 or reporter == current_reporter or current_reporter == 3:
            return f"Cannot add duplicate result: {match.summary()}"
        elif current_reporter == 0:
            new_reporter = reporter
        else:
            new_reporter = 3

        asyncio.run(db.update_match_reporter(duplicate_match_id, new_reporter))
        return f"Added {format} result: {match.summary()}"

    asyncio.run(db.insert_match(match, format, reporter))
    return f"Added {format} result: {match.summary()}"

def start(port=8080):
    thread.start_new_thread(run, (), {"host":"0.0.0.0", "port":port})
