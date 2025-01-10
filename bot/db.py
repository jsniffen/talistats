import aiosqlite
import sqlite3

DB_NAME = "talistats.sqlite"

def create_tables():
    with sqlite3.connect(DB_NAME) as db:
        cursor = db.cursor()

        cursor.execute("""create table if not exists cards
            (id text, name text, pitch integer, num_copies integer,
                blocked integer, pitched integer, played integer,
                match_id text, player integer)
        """)

        cursor.execute("""create table if not exists matches
            (id text,
                p1_hero text, p1_avg_value real,
                p2_hero text, p2_avg_value real,
                format text, first integer, winner integer,
                turns integer, date timestamp
            )
        """)

        db.commit()

async def insert_card(cursor, card, match_id, player):
    await cursor.execute("""insert into cards
            (id, name, pitch, num_copies, blocked, pitched, played, match_id, player)
            values (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (card.id, card.name, card.pitch, card.num_copies, card.blocked,
            card.pitched, card.played, match_id, player))


async def insert_match(match, format="cc"):
    p1, p2 = match.players
    async with aiosqlite.connect(DB_NAME) as db:
        cursor = await db.cursor()
        await cursor.execute("""insert into matches
            (id, p1_hero, p1_avg_value, p2_hero, p2_avg_value, format, first, winner, turns, date)
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (match.id, p1.hero, p1.avg_value, p2.hero, p2.avg_value, format,
                    match.first(), match.winner(), match.turns, match.date))

        for card in p1.cards:
            await insert_card(cursor, card, match.id, 1)

        for card in p2.cards:
            await insert_card(cursor, card, match.id, 2)

        await db.commit()

async def match_exists(match):
    p1, p2 = match.players
    async with aiosqlite.connect(DB_NAME) as db:
        async with db.execute("""
                select * from matches
                where p1_hero == ?
                and p1_avg_value == ?
                and p2_hero == ?
                and p2_avg_value == ?
                and first == ?
                and winner == ?
                and turns == ?
                and date >= Datetime(?, '-1 hour')
            """, (p1.hero, p1.avg_value, p2.hero, p2.avg_value,
                match.first(), match.winner(), match.turns, match.date)) as cursor:
            async for row in cursor:
                return True
        return False

async def distinct_heroes(ctx):
    query = """
        select distinct(p1_hero) from matches where p1_hero like '%' || ? || '%'
        union
        select distinct(p2_hero) from matches where p2_hero like '%' || ? || '%'
    """
    async with aiosqlite.connect(DB_NAME) as db:
        async with db.execute(query, (ctx.value, ctx.value)) as cursor:
            heroes = []
            async for row in cursor:
                heroes.append(row[0])
            return heroes

async def distinct_cards(ctx):
    query = "select distinct(name) from cards where name like concat('%', ?, '%')"
    async with aiosqlite.connect(DB_NAME) as db:
        async with db.execute(query, (ctx.value, ctx.value)) as cursor:
            cards = []
            async for row in cursor:
                cards.append(row[0])
            return cards

async def winrates(hero):
    query = """
	select hero, opp, (cast(sum(win) as float)/count(*))*100 as winrate from 
	(
		select p1_hero as hero, p2_hero as opp, winner == 1 as win from matches where p1_hero == ?
		union all
		select p2_hero as hero, p1_hero as opp, winner == 2 as win from matches where p2_hero == ?
	) group by opp
    """
    async with aiosqlite.connect(DB_NAME) as db:
        async with db.execute(query, (hero, hero)) as cursor:
            results = []
            async for row in cursor:
                results.append({
                    "hero": row[0],
                    "opponent": row[1],
                    "winrate": row[2],
                })
            return results

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
