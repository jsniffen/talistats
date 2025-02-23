import {element as e, state, ref} from "../tiny.js";
import {getMostRecentMatches} from "../db.js";
import {localDate, heroLink} from "../util.js";
import {decklist} from "../components/decklist.js";
import {search} from "../components/search.js";

const recentMatches = () => {
	const tbody = ref();

	const [onQuery, setQuery] = state("");

	const html = e("div",
		search("Search for a hero", setQuery),
		e("table", 
			e("thead",
				e("th", "Hero 1"),
				e("th", "Result"),
				e("th", "Hero 2"),
				e("th", "# Turns"),
				e("th", "Date"),
				e("th", "Format"),
			),
			e("tbody", { tbody }),
		),
	);

	onQuery(query => {
		tbody.element.innerHTML = "";

		const matches = getMostRecentMatches(query, 20);
		tbody.element.append(...matches.map(match => {
			const p1_score = match.winner == 1 ? 1 : 0;
			const p2_score = match.winner == 2 ? 1 : 0;

			return e("tr",
				e("td", decklist(match.id, 1), " ", heroLink(match.p1_hero)),
				e("td", p1_score + " - " + p2_score),
				e("td", decklist(match.id, 2), " ", heroLink(match.p2_hero)),
				e("td", match.turns),
				e("td", localDate(match.date)),
				e("td", match.format),
			);
		}));
	});

	return html;
};

export const homePage = () => {
	return e("div", recentMatches());
};
