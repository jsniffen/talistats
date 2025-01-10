# TODO:
#   - add better logging
#   - add a way to filter format?


from dotenv import load_dotenv
import db
import discord
import os
import talishar
import traceback
import threading

load_dotenv()

bot = discord.Bot()
mutex = threading.Lock()
queue = []
waitingLobby = dict()
activeMatches = dict()

def createSubmitPanel():
    embed = discord.Embed(
        title = "**IMPORTANT**",
        description = "Please submit your match once you are finished playing",
        color = discord.Colour.red()
    )
    return embed

def createQueuePanel():
    embed = discord.Embed(
        title = "Flesh and Blood Queue",
        description = "",
        color = discord.Colour.red()
    )
    embed.add_field(name="", value=f"**Players in queue: {str(len(queue))}**")
    return embed

async def resetqueue(interaction):
    await interaction.message.delete()
    await interaction.channel.send(embed=createQueuePanel(), view=QueueButtons())

async def pairMatch():
    playerID1 = queue.pop()
    playerID2 = queue.pop()
    player1 = await bot.fetch_user(playerID1)
    player2 = await bot.fetch_user(playerID2)
    waitingLobby[playerID1] = playerID2
    await player1.send("Hello Flesh and Blood Player! Please create a PRIVATE lobby using this link and then paste the join link back into this DM. \n\n https://talishar.net/game/create")
    await player2.send("Your opponent has been found, please wait while they create a lobby!")

class SubmitButtons(discord.ui.View):
    def __init__(self, matchID=None, player=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.matchID = matchID
        self.player = player

    @discord.ui.button(row=0, label="Game Completed", style=discord.ButtonStyle.primary)
    async def button_callback(self, button, interaction):
        try:
            if self.matchID in activeMatches.keys():

                otherPlayer = await bot.fetch_user(activeMatches[self.matchID][1 - self.player])
                match = talishar.get_match_stats(self.matchID)

                if not match.is_over():
                    await interaction.response.send_message(f"Cannot add result: {match.summary()}")

                if await db.match_exists(match):
                    await interaction.response.send_message(f"Cannot add duplicate result: {match.summary()}")

                await db.insert_match(match)

                await interaction.response.send_message(f"Added result: {match.summary()}")
                await otherPlayer.send("Your match has been submitted by your opponent, thank you for playing!")

                await interaction.message.delete()
                with mutex:
                    del activeMatches[self.matchID]
            else:
                await interaction.response.send_message("Your match was already submitted, deleting this message")
                await interaction.message.delete()
        
        except Exception:
            print(traceback.format_exc())
            await interaction.followup.send("Error submitting your match")

    @discord.ui.button(row=0, label="Opponent No-show", style=discord.ButtonStyle.danger)
    async def second_button_callback(self, button, interaction):
        try:
            with mutex:
                if self.matchID in activeMatches.keys():
                    otherPlayer = await bot.fetch_user(activeMatches[self.gameId][1 - self.player])
                    del activeMatches[self.matchID]
            
            await interaction.response.send_message("Thank you for informing us, we have closed this match")
            await interaction.message.delete()
            await otherPlayer.send("Your opponent has noted that you did not show up for your match, please try to be available for your next match!")
        except Exception:
            print(traceback.format_exc())
            await interaction.followup.send("Error submitting the no-show")

class QueueButtons(discord.ui.View):
    @discord.ui.button(row=0, label="Enter Queue", style=discord.ButtonStyle.primary)
    async def button_callback(self, button, interaction):
        try:
            if interaction.user.id not in queue:
                with mutex:
                    queue.append(interaction.user.id)

                    if len(queue) >= 2:
                        await pairMatch()
                    await resetqueue(interaction)

                await interaction.response.send_message("You Entered", ephemeral=True)
            else:
                await interaction.response.send_message("You were already in queue", ephemeral=True)

        except Exception:
            print(traceback.format_exc())
            await interaction.response.send_message("Error adding to queue")

    @discord.ui.button(row=0, label="Leave Queue", style=discord.ButtonStyle.danger)
    async def second_button_callback(self, button, interaction):
        try:
            if interaction.user.id in queue.keys():
                with mutex:
                    queue.remove(interaction.user.id)
                    await resetqueue(interaction)
                await interaction.response.send_message("You left", ephemeral=True)
            else:
                await interaction.response.send_message("You were not in queue", ephemeral=True)
        
        except Exception:
            print(traceback.format_exc())
            await interaction.response.send_message("Error removing from queue")

    @discord.ui.button(row=0, label="Status", style=discord.ButtonStyle.secondary)
    async def third_button_callback(self, button, interaction):
        try:
            if interaction.user.id in queue:
                await interaction.response.send_message("You are in queue", ephemeral=True)
            else:
                await interaction.response.send_message("You are not in queue", ephemeral=True)
        
        except Exception:
            print(traceback.format_exc())
            await interaction.response.send_message("Error checking status")

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
async def createqueue(ctx):
    try:
        await ctx.send(embed=createQueuePanel(), view=QueueButtons())
        await ctx.respond("Queue Created!", ephemeral=True)   

    except Exception:
        print(traceback.format_exc())
        await ctx.respond("Error Creating Queue")

@bot.event
async def on_message(message: discord.Message):
    try:
        if str(message.channel.type) == "private" and message.author.id in waitingLobby.keys(): 
            if "https://talishar.net/game/join/" in message.content and len(message.content.replace("https://talishar.net/game/join/", "")) == 6:
                gameID = message.content.replace("https://talishar.net/game/join/", "")
                with mutex:
                    activeMatches[gameID] = [message.author.id, waitingLobby[message.author.id]]
                    otherPlayer = await bot.fetch_user(waitingLobby[message.author.id])
                    del waitingLobby[message.author.id]

                await otherPlayer.send(f"Please join the lobby at {message.content}.")
                await message.author.send(embed=createSubmitPanel(), view=SubmitButtons(matchID=gameID, player=0))
                await otherPlayer.send(embed=createSubmitPanel(), view=SubmitButtons(matchID=gameID, player=1))

    except Exception:
        print(traceback.format_exc())
        await message.author.send("Unknown Message Error")

if __name__ == "__main__":
    # try:
    #     os.remove("talistats.sqlite")
    # except Exception as e:
    #     print(e)
    #     pass

    db.create_tables()
    print("Starting bot...")
    bot.run(os.getenv("BOT_TOKEN"))
