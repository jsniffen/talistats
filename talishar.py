from dataclasses import dataclass
from typing import List
import requests

@dataclass
class Card:
    match_id: str
    player: int
    player_name: str

    id: str
    name: str
    pitch: int
    num_copies: int

    blocked: int
    pitched: int
    played: int

@dataclass
class Match:
    id: str
    turns: int
    first_player: int

    p1_hero: str
    p1_score: int
    p1_avg_value: float
    p1_cards: List[Card]

    p2_hero: str
    p2_score: int
    p2_avg_value: float
    p2_cards: List[Card]

    @classmethod
    def from_match_stats(cls, p1, p2):
        id = p1["gameId"]
        turns = p1["turns"]
        first_player = 1 if p1["firstPlayer"] == 1 else 2

        p1_hero = p1["character"][0]["cardName"]
        p1_score = p1["result"]
        p1_avg_value = p1["averageValuePerTurn"]
        p1_cards = []

        for card in p1["character"] + p1["cardResults"]:
            p1_cards.append(Card(
                match_id=id,
                player=1,
                player_name=p1_hero,
                id=card["cardId"],
                name=card["cardName"],
                pitch=0 if "pitch" not in card else card["pitch"],
                num_copies=card["numCopies"],
                blocked=0 if "blocked" not in card else card["blocked"],
                pitched=0 if "pitched" not in card else card["pitched"],
                played=0 if "played" not in card else card["played"],
            ))

        p2_hero = p2["character"][0]["cardName"]
        p2_score = p2["result"]
        p2_avg_value = p2["averageValuePerTurn"]
        p2_cards = []

        for card in p2["character"] + p2["cardResults"]:
            p2_cards.append(Card(
                match_id=id,
                player=2,
                player_name=p2_hero,
                id=card["cardId"],
                name=card["cardName"],
                pitch=0 if "pitch" not in card else card["pitch"],
                num_copies=card["numCopies"],
                blocked=0 if "blocked" not in card else card["blocked"],
                pitched=0 if "pitched" not in card else card["pitched"],
                played=0 if "played" not in card else card["played"],
            ))

        return cls(id=id, first_player=first_player, turns=turns,
                        p1_hero=p1_hero, p1_score=p1_score, p1_avg_value=p1_avg_value, p1_cards=p1_cards,
                        p2_hero=p2_hero, p2_score=p2_score, p2_avg_value=p2_avg_value, p2_cards=p2_cards)

    def is_over(self):
        return self.p1_score == 1 or self.p2_score == 1

    def summary(self):
        p1 = f"{self.p1_hero} ({self.p1_avg_value})"
        p2 = f"{self.p2_hero} ({self.p2_avg_value})"
        
        if not self.is_over():
            return f"#{self.id} {p1} vs. {p2} is still in progress"

        winner = p1 if self.p1_score else p2
        loser = p1 if self.p2_score else p2

        return f"#{self.id} {winner} beat {loser} in {self.turns} turns"


def get_match_stats(match_id):
    p1 = requests.get(f"https://api.talishar.net/game/zzGameStatsAPI.php?gameName={match_id}&playerID=1").json()
    p2 = requests.get(f"https://api.talishar.net/game/zzGameStatsAPI.php?gameName={match_id}&playerID=2").json()

    return Match.from_match_stats(p1, p2)

