from dotenv import load_dotenv
import db
import discord
import os
import storage
import talishar
import traceback
import server

load_dotenv()

bot = discord.Bot()

formats = ["cc", "draft", "ll", "sealed", "blitz"]

@bot.event
async def on_ready():
    if os.getenv("ENV") == "prod":
        storage.upload_db.start()

@bot.command()
async def report(ctx, match_id: discord.Option(str), format: discord.Option(str, default="cc", choices=formats)):
    try:
        match_id = match_id if match_id.isnumeric() else match_id.split("/")[-1]

        match = talishar.get_match_stats(match_id)

        if match.players[0].hero == "":
            await ctx.respond(f"Cannot add result: Hero 1 is invalid")
            return

        if match.players[1].hero == "":
            await ctx.respond(f"Cannot add result: Hero 2 is invalid")
            return

        if not match.is_over():
            await ctx.respond(f"Cannot add result: {match.summary()}")
            return

        duplicate_match_id, _ = await db.get_duplicate_match(match)
        if duplicate_match_id is not None:
            await ctx.respond(f"Cannot add duplicate result: {match.summary()}")
            return

        await db.insert_match(match)
        await ctx.respond(f"Added result: {match.summary()}")

        print(f"Successfully handled report: match_id={match_id} format={format}")
    except Exception:
        print(f"Failed to handle report: match_id={match_id} format={format}")
        print(traceback.format_exc())
        await ctx.respond("Error retrieving results from talishar")

if __name__ == "__main__":
    try:
        storage.download_db()
    except:
        pass

    db.create_tables()
    server.start()

    print("Starting bot...")
    bot.run(os.getenv("BOT_TOKEN"))
