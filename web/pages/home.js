import {element as e, state, ref} from "../tiny.js";
import {getMostRecentMatches} from "../db.js";
import {localDate, heroLink} from "../util.js";
import {decklist} from "../components/decklist.js";
import {search} from "../components/search.js";
import {reporter} from "../components/reporter.js";
import {scroll} from "../components/scroll.js";

const recentMatches = () => {
	const tbody = ref();

	const [onQuery, setQuery] = state("");
	const [onScroll, setScroll] = scroll;

	let matches = [];

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

	onScroll(scroll => {
		const page = 50;

		const start = (scroll-1)*50
		const end = scroll*50;

		tbody.element.append(...matches.slice(start, end).map(match => {
			const p1_score = match.winner == 1 ? 1 : 0;
			const p2_score = match.winner == 2 ? 1 : 0;

			return e("tr",
				e("td", decklist(match.id, 1), " ", heroLink(match.p1_hero), " ", reporter(match.reporter == 1 || match.reporter == 3)),
				e("td", p1_score + " - " + p2_score),
				e("td", decklist(match.id, 2), " ", heroLink(match.p2_hero), " ", reporter(match.reporter == 2 || match.reporter == 3)),
				e("td", match.turns),
				e("td", localDate(match.date)),
				e("td", match.format),
			);
		}));
	});

	onQuery(query => {
		tbody.element.innerHTML = "";
		matches = getMostRecentMatches(query);
		setScroll(1);
	});

	return html;
};

export const homePage = () => {
	return e("div", recentMatches());
};
