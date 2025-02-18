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
