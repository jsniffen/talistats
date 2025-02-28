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
async def winrate(ctx, hero: discord.Option(str, autocomplete=db.distinct_heroes)):
    try:
        winrates = await db.winrates(hero)

        lines = [f"{x['hero']} vs. {x['opponent']}: {x['winrate']:.0f}%" for x in winrates]
        await ctx.respond("\n".join(lines))
        print(f"Successfully handled winrate: hero={hero}")
    except:
        print(f"Failed to handle winrate: hero={hero}")
        print(traceback.format_exc())
        await ctx.respond(f"Error calculating winrate for {hero}")

if __name__ == "__main__":
    try:
        storage.download_db()
    except:
        pass

    db.create_tables()
    server.start()

    print("Starting bot...")
    bot.run(os.getenv("BOT_TOKEN"))
