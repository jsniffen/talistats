import {element as e} from "../tiny.js";
import {getMostRecentMatches} from "../db.js";
import {localDate, heroLink} from "../util.js";

const recentMatches = () => {
	const matches = getMostRecentMatches();

	return e("table", 
		e("thead",
			e("th", "Hero 1"),
			e("th", "Result"),
			e("th", "Hero 2"),
			e("th", "# Turns"),
			e("th", "Date"),
			e("th", "Format"),
		),
		e("tbody",
			...matches.slice(0, 20).map(match => {
				const p1_score = match.winner == 1 ? 1 : 0;
				const p2_score = match.winner == 2 ? 1 : 0;

				return e("tr",
					e("td", heroLink(match.p1_hero)),
					e("td", p1_score + " - " + p2_score),
					e("td", heroLink(match.p2_hero)),
					e("td", match.turns),
					e("td", localDate(match.date)),
					e("td", match.format),
				);
			}),
		),
	);
};

export const homePage = () => {
	return e("div", recentMatches());
};
