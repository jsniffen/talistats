const sql = await initSqlJs({locateFile: fn => `https://sql.js.org/dist/${fn}`});
const resp = await fetch("https://talistats-db.nyc3.cdn.digitaloceanspaces.com/talistats-db/talistats.sqlite");
const buf = await resp.arrayBuffer();
const db = new sql.Database(new Uint8Array(buf));

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
