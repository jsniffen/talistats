import aiosqlite
import sqlite3

DB_NAME = "talistats.sqlite"

def create_tables():
    with sqlite3.connect(DB_NAME) as db:
        cursor = db.cursor()

        cursor.execute("""create table if not exists cards
            (id text, name text, pitch integer, num_copies integer,
                match_id text, player integer, player_name text,
                blocked integer, pitched integer, played integer
            )
        """)

        cursor.execute("""create table if not exists matches
            (id text,
                player_1_name text, player_1_score integer, player_1_avg_value real,
                player_2_name text, player_2_score integer, player_2_avg_value real,
                first_player integer, turns integer
            )
        """)

        db.commit()

async def insert_card(cursor, card):
    await cursor.execute("insert into cards values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (card.id, card.name, card.pitch, card.num_copies, card.match_id,
            card.player, card.player_name, card.blocked, card.pitched, card.played))


async def insert_match(match):
    async with aiosqlite.connect(DB_NAME) as db:
        cursor = await db.cursor()
        await cursor.execute("insert into matches values (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (match.id,
                    match.p1_hero, match.p1_score, match.p1_avg_value,
                    match.p2_hero, match.p2_score, match.p2_avg_value,
                    match.first_player, match.turns))

        for card in match.p1_cards + match.p2_cards:
            await cursor.execute("insert into cards values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (card.id, card.name, card.pitch, card.num_copies, card.match_id,
                    card.player, card.player_name, card.blocked, card.pitched, card.played))

        await db.commit()

async def match_exists(match):
    async with aiosqlite.connect(DB_NAME) as db:
        async with db.execute("select * from matches where id == ?", (match.id,)) as cursor:
            async for row in cursor:
                return True
        return False

async def distinct_heroes(ctx):
    async with aiosqlite.connect(DB_NAME) as db:
        async with db.execute("select distinct(player_name) from cards where player_name like concat('%', ?, '%')", (ctx.value,)) as cursor:
            heroes = []
            async for row in cursor:
                heroes.append(row[0])
            return heroes

async def get_winrate(hero):
    query = """
        select cast(wins as float)/(wins+losses)*100 as winrate from (select
                sum(case when player_1_name == ? and player_1_score == 1 or player_2_name == ? and player_2_score == 1 then 1 else 0 end) as wins,
                sum(case when player_1_name == ? and player_1_score == 0 or player_2_name == ? and player_2_score == 0 then 1 else 0 end) as losses
                from matches)
    """
    async with aiosqlite.connect(DB_NAME) as db:
        async with db.execute(query, (hero, hero, hero, hero)) as cursor:
            async for row in cursor:
                return row[0]
            return None
