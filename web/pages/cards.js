import {element as e, state, ref, onMany} from "../tiny.js";
import {getCardStats} from "../db.js";
import {heroesDropdown} from "../components/heroesDropdown.js";
import {round} from "../util.js";
import {pitch} from "../components/pitch.js";
import {numberRange}  from "../components/numberRange.js";
import {toggle} from "../components/toggle.js";
import {scroll} from "../components/scroll.js";

export const cardsPage = () => {
	const tbody = ref();
	const oppDropdownElement = ref();

	const [onQuery, setQuery] = state("");
	const [onGoing, setGoing] = state(3);

	const [onHeroes, setHeroes] = state([])
	const [onOpponents, setOpponents] = state([]);

	const [onMinTurns, setMinTurns] = state(0);
	const [onMinGames, setMinGames] = state(0);

	const [onFormat, setFormat] = state("cc");
	const [onOrder, setOrder] = state(["winrate", "desc"]);
	const [onMustPlay, setMustPlay] = state(false);
	const [onMustBeReported, setMustBeReported] = state(false);

	const [onScroll, setScroll] = scroll;

	let stats = [];

	const search = () => {
		return e("input[type=search][placeholder='Search for a Card']", {
			oninput: e => setQuery(e.target.value),
		});
	};

	const formatDropdown = hero => {
		return e("select[name=select]", { onchange: e => setFormat(e.target.value) },
			...["cc", "draft", "ll", "sealed", "blitz"].map(format => e("option", format)),
		);
	};

	const goingDropdown = going => {
		const onchange = e => setGoing(e.target.value);
		return e("details.dropdown",
			e("summary", "Going"),
			e("ul",
				e("li",
					e("label",
						e("input[type=checkbox][name='First'][checked]", {onchange: e => setGoing(g =>  g + (e.target.checked ? 1 : -1))}),
						"First"
					),
				),
				e("li",
					e("label",
						e("input[type=checkbox][name='Second'][checked]", {onchange: e => setGoing(g =>  g + (e.target.checked ? 2 : -2))}),
						"Second"
					),
				),
			),
		);
	}

	const thOnClick = (e, by) => {
		e.classList.add("sort");

		if (e.classList.contains("sort-desc")) {
			e.classList.remove("sort-desc");
			e.classList.add("sort-asc");
			setOrder([by, "asc"]);
		} else {
			e.classList.remove("sort-asc");
			e.classList.add("sort-desc");
			setOrder([by, "desc"]);
		}

		e.parentNode.childNodes.forEach(node => {
			if (node == e) return;

			node.classList.remove("sort");
			node.classList.remove("sort-desc");
			node.classList.remove("sort-asc");
		});
	};

	const html =  e("div",
		e("h3", "Hero"),
		heroesDropdown("Heroes", setHeroes),
		e("div.grid",
			formatDropdown(),
			goingDropdown(),
			heroesDropdown("Opponents", setOpponents),
		),
		e("div.grid",
			numberRange("Min Turns", setMinTurns, 0, 30),
			numberRange("Min Games", setMinGames, 0, 100),
		),
		search(),
		toggle("Must be played", setMustPlay),
		toggle("Internal games only", setMustBeReported),
		e("table",
			e("thead",
				e("th.sortable", "Name", { onclick: e => thOnClick(e.target, "name") }),
				e("th.sortable", "# Games", { onclick: e => thOnClick(e.target, "total") }),
				e("th.sortable", "Avg Played", { onclick: e => thOnClick(e.target, "avg_played") }),
				e("th.sortable", "Avg Blocked", { onclick: e => thOnClick(e.target, "avg_blocked") }),
				e("th.sortable", "Avg Pitched", { onclick: e => thOnClick(e.target, "avg_pitched") }),
				e("th.sortable.sort.sort-desc", "Winrate", { onclick: e => thOnClick(e.target, "winrate") }),
			),
			e("tbody", { tbody }),
		),
	);

	onScroll(scroll => {
		const page = 50;
		const start = (scroll-1)*50
		const end = scroll*50;

		tbody.element.append(...stats.slice(start, end).map(row => {
			return e("tr",
				e("td.cardrow", row.name, pitch(row)),
				e("td", row.total),
				e("td", round(row.avg_played)),
				e("td", round(row.avg_blocked)),
				e("td", round(row.avg_pitched)),
				e("td", round(row.winrate), "%"),
			);
		}));
	});

	onMany((heroes, opponents, going, format, order, mustPlay, query, minTurns, minGames, mustBeReported) => {
		tbody.element.innerHTML = "";

		let first = null;
		if (going == 3) first = null;
		if (going == 2) first = false;
		if (going == 1) first = true;

		stats = getCardStats(query, heroes, opponents, first, format, order[0], order[1], mustPlay, minTurns, minGames, mustBeReported);
		setScroll(1);
	}, onHeroes, onOpponents, onGoing, onFormat, onOrder, onMustPlay, onQuery, onMinTurns, onMinGames, onMustBeReported);

	return html;
};
