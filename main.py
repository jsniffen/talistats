# TODO:
#   - add better logging
#   - add a way to filter format?


from dotenv import load_dotenv
import db
import discord
import os
import talishar
import traceback

load_dotenv()

bot = discord.Bot()

@bot.command()
async def winrate(ctx, hero: discord.Option(str, autocomplete=db.distinct_heroes)):
    try:
        winrate = await db.get_winrate(hero)
        await ctx.respond(f"{hero} winrate: {winrate:.0f}%")
    except:
        print(traceback.format_exc())
        await ctx.respond(f"Error calculating winrate for {hero}")

@bot.command()
async def report(ctx, match_id: discord.Option(str)):
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

    except Exception:
        print(traceback.format_exc())
        await ctx.respond("Error retrieving results from talishar")

@bot.command()
async def cardstats(ctx, card_id: str):
    stats = await db.card_stats(card_id)
    if card_id in stats:
        response = f"**Winrate for card {card_id} by play count:**\n"
        for played, data in stats[card_id].items():
            response += (f"Played {played} time: {data['played']} matches, "
                         f"Winrate: {data['winrate']:.2f}%\n")
    else:
        response = f"No data found for card {card_id}."
    
    await ctx.send(response)

if __name__ == "__main__":
    # try:
    #     os.remove("talistats.sqlite")
    # except Exception as e:
    #     print(e)
    #     pass

    db.create_tables()
    print("Starting bot...")
    bot.run(os.getenv("BOT_TOKEN"))