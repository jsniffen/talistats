import {element as e, mount, router} from "./tiny.js";
import {getAllWinrates} from "./db.js";
import {homePage} from "./pages/home.js";
import {heroPage} from "./pages/hero.js";
import {heroesPage} from "./pages/heroes.js";

const winrates = () => {
	const winrates = getAllWinrates();
	const heroes = new Set(winrates.map(w => w.hero));

	const data = {};
	for (const hero of heroes) {
		data[hero] = {};
		for (const opp of heroes) {
			data[hero][opp] = "-";
			for (const winrate of winrates) {
				if (winrate.hero == hero && winrate.opp == opp) {
					data[hero][opp] = winrate;
				}
			}
		}
	}

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
			if (winrate == "-") {
				row.append(e("td", winrate));
			} else {
				const total = `${winrate.wins}/${winrate.total}`
				row.append(e(`td[data-tooltip=${total}]`, winrate.winrate + "%"));
			}
		}
		table.append(row);
	}

	return e("div.winrates", table);
};

mount("main", () => {
	return router({
		"/#/heroes": () => {
			return heroesPage();
		},
		"/#/heroes/:hero": (args) => {
			return heroPage(decodeURI(args.hero));
		},
		// "/#/hero": () => {
		// 	return heroPage();
		// },
		"/#/winrates": () => {
			return winrates();
		},
		"*": () => {
			return homePage();
		},
	});
});
