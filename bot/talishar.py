from dataclasses import dataclass
from datetime import datetime
from typing import List
import requests
import uuid

@dataclass
class Card:
    id: str
    name: str
    pitch: int
    num_copies: int
    blocked: int
    pitched: int
    played: int

@dataclass
class Player:
    hero: str
    score: int
    avg_value: float
    cards: List[Card]
    first: bool

    def __str__(self):
        return f"{self.hero} ({"1st" if self.first else "2nd"}, {self.avg_value})"

@dataclass
class Match:
    id: str
    turns: int
    date: datetime
    players: List[Player]

    @classmethod
    def from_match_stats(cls, p1, p2):
        # NOTE(Julian): The talishar gameName is not unique for rematches,
        # so we have to generate our own ID to ensure it's globally unique.
        id = str(uuid.uuid4())

        turns = p1["turns"]
        date = datetime.now()

        players = []
        for p in [p1, p2]:
            hero = p["character"][0]["cardName"]
            score = p["result"]
            avg_value = p["averageValuePerTurn"]
            first = p["firstPlayer"] == 1

            cards = []
            for card in p["character"] + p["cardResults"]:
                cards.append(Card(
                    id=card["cardId"],
                    name=card["cardName"],
                    pitch=0 if "pitchValue" not in card else card["pitchValue"],
                    num_copies=card["numCopies"],
                    blocked=0 if "blocked" not in card else card["blocked"],
                    pitched=0 if "pitched" not in card else card["pitched"],
                    played=0 if "played" not in card else card["played"],
                ))

            players.append(Player(hero=hero, score=score, avg_value=avg_value,
                cards=cards, first=first))

        return cls(id=id, turns=turns, date=date, players=players)

    def first(self):
        return 1 if self.players[0].first else 2

    def winner(self):
        return 1 if self.players[0].score == 1 else 2

    def is_over(self):
        return self.players[0].score == 1 or self.players[1].score == 1

    def get_winner_loser(self):
        if self.players[0].score == 1:
            return self.players[0], self.players[1]
        else:
            return self.players[1], self.players[0]

    def summary(self):
        if not self.is_over():
            return f"{self.players[0]} vs. {self.players[1]} is still in progress"

        winner, loser = self.get_winner_loser()

        return f"{winner} beat {loser} in {self.turns} turns"


def get_match_stats(match_id):
    p1 = requests.get(f"https://api.talishar.net/game/zzGameStatsAPI.php?gameName={match_id}&playerID=1").json()
    p2 = requests.get(f"https://api.talishar.net/game/zzGameStatsAPI.php?gameName={match_id}&playerID=2").json()

    return Match.from_match_stats(p1, p2)
