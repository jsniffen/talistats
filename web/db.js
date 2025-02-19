import {DB_URL} from "./env.js";

const sql = await initSqlJs({locateFile: fn => `https://sql.js.org/dist/${fn}`});
const resp = await fetch(DB_URL);
const buf = await resp.arrayBuffer();
const db = new sql.Database(new Uint8Array(buf));

export const getMostRecentMatches = () => {
	const stmt = db.prepare("select * from matches order by date desc");
	const result = stmt.get();

	let rows = [];
	while (stmt.step()) {
		rows.push(stmt.getAsObject());
	}
	return rows;
};

export const getCards = (query, limit) => {
	const stmt = db.prepare(`
		select distinct(name), id, pitch from cards
		where name like concat("%", $query, "%")
		limit $limit
	`);
	stmt.bind({$query: query, $limit: limit});
	const result = stmt.get();

	let rows = [];
	while (stmt.step()) {
		rows.push(stmt.getAsObject());
	}
	return rows;
};

export const getDistinctHeroes = () => {
	const stmt = db.prepare(`
        select distinct(p1_hero) as hero from matches
        union
        select distinct(p2_hero) as hero from matches
	`);
	const result = stmt.get();

	let rows = [];
	while (stmt.step()) {
		rows.push(stmt.getAsObject());
	}
	return rows.map(row => row.hero);
};

export const getAggregateHeroWinrate = (hero) => {
	const stmt = db.prepare(`
		select hero, format, count(*) as total, (cast(sum(win) as float)/count(*))*100 as winrate from (
		select p1_hero as hero, p2_hero as opp, winner == 1 as win, format from matches
		union all
		select p2_hero as hero, p1_hero as opp, winner == 2 as win, format from matches)
		where hero == $hero
		group by hero, format
	`);
	stmt.bind({$hero: hero});
	const result = stmt.get();

	let rows = [];
	while (stmt.step()) {
		rows.push(stmt.getAsObject());
	}
	return rows;
};

export const getAggregateWinrates = (format, orderBy, order, query) => {
	const stmt = db.prepare(`
		select hero, count(*) as total, (cast(sum(win) as float)/count(*))*100 as winrate from (
		select p1_hero as hero, p2_hero as opp, winner == 1 as win from matches where format == $format
		union all
		select p2_hero as hero, p1_hero as opp, winner == 2 as win from matches where format == $format)
		where ($query is null or hero like concat("%", $query, "%"))
		group by hero
		order by
		case when $orderBy == 'hero' and $order == 'asc' then hero end asc,
		case when $orderBy == 'hero' and $order == 'desc' then hero end desc,
		case when $orderBy == 'total' and $order == 'asc' then total end asc,
		case when $orderBy == 'total' and $order == 'desc' then total end desc,
		case when $orderBy == 'winrate' and $order == 'asc' then winrate end asc,
		case when $orderBy == 'winrate' and $order == 'desc' then winrate end desc
	`);
	stmt.bind({$format: format, $query: query, $orderBy: orderBy, $order: order});
	const result = stmt.get();

	let rows = [];
	while (stmt.step()) {
		rows.push(stmt.getAsObject());
	}
	return rows;
};

export const getAllWinrates = () => {
	const stmt = db.prepare(`
		select hero, opp, sum(win) as wins, count(*) as total, (cast(sum(win) as float)/count(*))*100 as winrate from (
		select p1_hero as hero, p2_hero as opp, winner == 1 as win from matches
		union all
		select p2_hero as hero, p1_hero as opp, winner == 2 as win from matches)
		group by hero, opp
		order by hero, opp
	`);
	const result = stmt.get();

	let rows = [];
	while (stmt.step()) {
		rows.push(stmt.getAsObject());
	}
	return rows;
};

export const getFormats = hero => {
	const stmt = db.prepare(`
		select distinct format from (
		select p1_hero as hero, p2_hero as opp, format from matches
		union all
		select p2_hero as hero, p1_hero as opp, format from matches)
		where hero == $hero
	`);
	stmt.bind({$hero: hero});
	const result = stmt.get();

	let rows = [];
	while (stmt.step()) {
		rows.push(stmt.getAsObject());
	}
	return rows.map(r => r.format);
};

export const getOpponents = hero => {
	const stmt = db.prepare(`
		select distinct opp from (
		select p1_hero as hero, p2_hero as opp from matches
		union all
		select p2_hero as hero, p1_hero as opp from matches)
		where hero == $hero
		order by opp
	`);
	stmt.bind({$hero: hero});
	const result = stmt.get();

	let rows = [];
	while (stmt.step()) {
		rows.push(stmt.getAsObject());
	}
	return rows.map(r => r.opp);
};

export const getHeroWinrate = (hero, first, format) => {
	const stmt = db.prepare(`
		select hero, opp, format, sum(win) as wins, count(*) as total, (cast(sum(win) as float)/count(*))*100 as winrate from (
		select p1_hero as hero, p2_hero as opp, winner == 1 as win, first == 1 as first, format from matches
		union all
		select p2_hero as hero, p1_hero as opp, winner == 2 as win, first == 2 as first, format from matches)
		where hero == $hero and ($first is null or first == $first) and (format == $format)
		group by hero, opp
		order by opp
	`);
	stmt.bind({$hero: hero, $first: first, $format: format});
	const result = stmt.get();

	let rows = [];
	while (stmt.step()) {
		rows.push(stmt.getAsObject());
	}
	return rows;
};

export const getHeroGamesPlayed = () => {
	const stmt = db.prepare(`
		select hero, count(*) as numMatches from (
		select p1_hero as hero from matches
		union all
		select p2_hero as hero from matches
		) group by hero
	`);
	const result = stmt.get();

	let rows = [];
	while (stmt.step()) {
		rows.push(stmt.getAsObject());
	}
	return rows;
};

export const getMatches = (hero, heroInclude, heroExclude, opp, oppInclude, oppExclude, format, first) => {
	const heroIncludeList = heroInclude.map(id => `'${id}'`).join(",");
	const heroExcludeList = heroExclude.map(id => `'${id}'`).join(",");
	const oppIncludeList = oppInclude.map(id => `'${id}'`).join(",");
	const oppExcludeList = oppExclude.map(id => `'${id}'`).join(",");
	const query = `
		with hero_matches as (
			select * from (
			select p1_hero as hero, p2_hero as opp, p1_avg_value as hero_avg_value, p2_avg_value as opp_avg_value, winner == 1 as win, first == 1 as first, 1 as hero_player, 2 as opp_player, * from matches
			union all
			select p2_hero as hero, p1_hero as opp, p2_avg_value as hero_avg_value, p1_avg_value as opp_avg_value, winner == 2 as win, first == 2 as first, 2 as hero_player, 1 as opp_player, * from matches)
			where hero == $hero and opp == $opp and ($first is null or first == $first) and (format == $format)
		)

		select * from hero_matches m join cards c on m.id == c.match_id
		group by m.id
		having
			count(distinct case when c.id in (${heroIncludeList}) and c.player == hero_player then c.id end) = ${heroInclude.length}
			and count(distinct case when c.id not in (${heroExcludeList}) and c.player == hero_player then c.id end) = count(distinct case when c.player == hero_player then c.id end)
			and count(distinct case when c.id in (${oppIncludeList}) and c.player == opp_player then c.id end) = ${oppInclude.length}
			and count(distinct case when c.id not in (${oppExcludeList}) and c.player == opp_player then c.id end) = count(distinct case when c.player == opp_player then c.id end)
	`;
	const stmt = db.prepare(query);
	stmt.bind({$hero: hero, $first: first, $opp: opp, $format: format});

	let rows = [];
	while (stmt.step()) {
		rows.push(stmt.getAsObject());
	}
	return rows;
};

export const getDecklist = (player, match_id) => {
	const stmt = db.prepare(`
		select * from cards where match_id == $match_id and player == $player
	`);
	stmt.bind({$player: player, $match_id: match_id});
	const result = stmt.get();

	let rows = [];
	while (stmt.step()) {
		rows.push(stmt.getAsObject());
	}
	return rows;
};

export const getCardStats = (query, hero, opp, first, format, orderBy, order, mustPlay) => {
	const stmt = db.prepare(`
		select sum(win) as wins, count(*) as total, (cast(sum(win) as float)/count(*))*100 as winrate,
		(cast(sum(played) as float)/count(*)) as avg_played, sum(played) as total_played,
		(cast(sum(pitched) as float)/count(*)) as avg_pitched, sum(pitched) as total_pitched,
		(cast(sum(blocked) as float)/count(*)) as avg_blocked, sum(blocked) as total_blocked,
		* from (
			select player == winner as win, player == first as first, case when player == 1 then p1_hero else p2_hero end as hero, case when player == 1 then p2_hero else p1_hero end as opp, c.id as card_id, * from cards c
			join matches m on m.id == c.match_id
			where (not $mustPlay or played > 0) and ($query is null or name like concat("%", $query, "%"))
		)
		where name != "" and hero == $hero and ($opp is null or opp == $opp) and ($first is null or $first == first) and $format == format
		group by card_id
		order by
		case when $orderBy == 'name' and $order == 'asc' then name end asc,
		case when $orderBy == 'name' and $order == 'desc' then name end desc,
		case when $orderBy == 'total' and $order == 'asc' then total end asc,
		case when $orderBy == 'total' and $order == 'desc' then total end desc,
		case when $orderBy == 'winrate' and $order == 'asc' then winrate end asc,
		case when $orderBy == 'winrate' and $order == 'desc' then winrate end desc,
		case when $orderBy == 'avg_played' and $order == 'asc' then avg_played end asc,
		case when $orderBy == 'avg_played' and $order == 'desc' then avg_played end desc,
		case when $orderBy == 'avg_pitched' and $order == 'asc' then avg_pitched end asc,
		case when $orderBy == 'avg_pitched' and $order == 'desc' then avg_pitched end desc,
		case when $orderBy == 'avg_blocked' and $order == 'asc' then avg_blocked end asc,
		case when $orderBy == 'avg_blocked' and $order == 'desc' then avg_blocked end desc
	`);
	stmt.bind({$query: query, $hero: hero, $opp: opp, $first: first, $format: format, $orderBy: orderBy, $order: order, $mustPlay: mustPlay});
	const result = stmt.get();

	let rows = [];
	while (stmt.step()) {
		rows.push(stmt.getAsObject());
	}
	return rows;

};
