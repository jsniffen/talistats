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
