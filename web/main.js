import {element as e, mount} from "./tiny.js";
import {getAllWinrates} from "./db.js";

mount("main", () => {
	const winrates = getAllWinrates();
	console.log(winrates);
	const heroes = new Set(winrates.map(w => w.hero));

	const data = {};
	for (const hero of heroes) {
		data[hero] = {};
		for (const opp of heroes) {
			data[hero][opp] = 0;
			for (const winrate of winrates) {
				if (winrate.hero == hero && winrate.opp == opp) {
					data[hero][opp] = winrate.winrate;
				}
			}
		}
	}

	console.log(data);

	const table = e("table");

	const header = e("tr");
	header.append(e("td"));
	for (const hero of heroes) {
		header.append(e("td", hero));
	}
	table.append(header);

	for (const [hero, matchup] of Object.entries(data)) {
		const row = e("tr")
		row.append(e("td", hero));
		for (const [opp, winrate] of Object.entries(matchup)) {
			row.append(e("td", winrate + "%"));
		}
		table.append(row);
	}

	return e("div", table);
});
