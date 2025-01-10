from dotenv import load_dotenv
import db
import discord
import os
import storage
import talishar
import traceback

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

@bot.command()
async def report(ctx, match_id: discord.Option(str), format: discord.Option(str, default="cc", choices=formats)):
    try:
        match = talishar.get_match_stats(match_id)

        if not match.is_over():
            await ctx.respond(f"Cannot add result: {match.summary()}")
            return 

        if await db.match_exists(match):
            await ctx.respond(f"Cannot add duplicate result: {match.summary()}")
            return

        await db.insert_match(match)
        await ctx.respond(f"Added result: {match.summary()}")

        print(f"Successfully handled report: match_id={match_id} format={format}")
    except Exception:
        print(f"Failed to handle report: match_id={match_id} format={format}")
        print(traceback.format_exc())
        await ctx.respond("Error retrieving results from talishar")

@bot.command()
async def cardstats(ctx, card_name: str):
    # not case sensitive fix
    real_name = ' '.join([word.capitalize() for word in card_name.lower().split()])

    stats = await db.card_stats(real_name)
    
    if real_name in stats:
        response = f"Winrate for {real_name} by play count:\n"
        for played, data in stats[real_name].items():
            response += (f"Played {played} time(s) in {data['played']} matches.\n"
                         f"Winrate: {data['winrate']:.2f}%\n")
    else:
        response = f"No data found for card {real_name}."
    
    await ctx.send(response)


if __name__ == "__main__":
    # try:
    #     os.remove("talistats.sqlite")
    # except Exception as e:
    #     print(e)
    #     pass
    storage.download_db()

    db.create_tables()
    print("Starting bot...")
    bot.run(os.getenv("BOT_TOKEN"))
