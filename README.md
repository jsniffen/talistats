# Talistats
A discord bot for tracking talishar matches.

## Setup
1) run `pip install -r requirements.txt`
2) create a .env file containing `BOT_TOKEN=${token}`
3) run `python main.py`

## Goals

### Hero representation

```
select p, count(p) as count from (
select player_1_name as p from matches
union
select player_2_name as p from matches)
group by p
```

### Win rates

* Overall for each hero
	select cast(wins as float)/(wins+losses)*100 as winrate from (select
				sum(case when p1_hero == "Kano, Dracai of Aether" and winner == 1 or p2_hero == "Kano, Dracai of Aether" and winner == 2 then 1 else 0 end) as wins,
				sum(case when p1_hero == "Kano, Dracai of Aether" and winner != 1 or p2_hero == "Kano, Dracai of Aether" and winner != 2 then 1 else 0 end) as losses
				from matches)


* Individual winrate for each matchup
	select hero, opp, (cast(sum(win) as float)/count(*))*100 as winrate, sum(win) as wins, count(*) as total from 
	(
		select p1_hero as hero, p2_hero as opp, winner == 1 as win from matches where p1_hero == "Kano, Dracai of Aether"
		union all
		select p2_hero as hero, p1_hero as opp, winner == 2 as win from matches where p2_hero == "Kano, Dracai of Aether"
	) group by opp

### Deck lists played for each matchup

### Win % change depending on card's presented

select cast(sum(win) as float)*100/count(*) as winrate, sum(win) as wins, count(*) as total from (select m.winner == c.player as win, (case when c.player == 1 then m.p1_hero else m.p2_hero end) as hero, case when c.player == 1 then m.p2_hero else m.p1_hero end as opp from cards c
join matches m on m.id == c.match_id
where "EVR123" in (select distinct(id) from cards where match_id == c.match_id and (player == c.player))
and ((c.player == 1 and m.p1_hero == "Kano, Dracai of Aether") or (c.player == 2 and m.p2_hero == "Kano, Dracai of Aether"))
group by match_id, player)
