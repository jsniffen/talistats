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
                first_player integer, turns integer, date timestamp
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
        await cursor.execute("insert into matches values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (match.id,
                    match.p1_hero, match.p1_score, match.p1_avg_value,
                    match.p2_hero, match.p2_score, match.p2_avg_value,
                    match.first_player, match.turns, match.date))

        for card in match.p1_cards + match.p2_cards:
            await cursor.execute("insert into cards values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (card.id, card.name, card.pitch, card.num_copies, card.match_id,
                    card.player, card.player_name, card.blocked, card.pitched, card.played))

        await db.commit()

async def match_exists(match):
    async with aiosqlite.connect(DB_NAME) as db:
        async with db.execute("""
                select * from matches
                where player_1_name == ?
                and player_1_score == ?
                and player_1_avg_value == ?
                and player_2_name == ?
                and player_2_score == ?
                and player_2_avg_value == ?
                and first_player == ?
                and turns == ?
                and date >= Datetime(?, '-1 hour')
            """, (match.p1_hero, match.p1_score, match.p1_avg_value,
                match.p2_hero, match.p2_score, match.p2_avg_value,
                match.first_player, match.turns, match.date)) as cursor:
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

async def card_stats(card_id):
    query = """
        SELECT card_id, played, SUM(CASE WHEN match_result = 1 THEN 1 ELSE 0 END) AS wins, COUNT(*) AS total_matches
        FROM cards
        GROUP BY card_id, played
    """

    async with aiosqlite.connect(DB_NAME) as db:
        async with db.execute(query, (card_id,)) as cursor:
            card_stats = {}

            async for row in cursor:
                card_id = row[0]
                played = row[1]
                wins = row[2]
                total_matches = row[3]

                if card_id not in card_stats:
                    card_stats[card_id] = {}

                if played > 0:
                    winrate = (wins / total_matches) if total_matches > 0 else 0
                    card_stats[card_id][played] = {
                        "played": total_matches,
                        "wins": wins,
                        "winrate": winrate
                    }
                
        return card_stats