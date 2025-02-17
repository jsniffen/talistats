import {element as e, state, ref, onMany} from "../tiny.js";
import {getAggregateWinrates} from "../db.js";

const heroLink = hero => {
	return e(`a[href='/#/heroes/${hero}']`, hero);
};

const round = winrate => {
	return Math.round(winrate*100)/100;
}

const [onFormat, setFormat] = state("cc");
const [onQuery, setQuery] = state("");
const [onOrder, setOrder] = state(["hero", "asc"]);

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

export const heroesPage = () => {
	const tbody = ref();

	const html = e("div",
		e("div.grid",
			e("select[name=select]", { onchange: e => setFormat(e.target.value) },
				...["cc", "draft", "ll", "sealed", "blitz"].map(format => e("option", format)),
			),
			e("input[type=search][placeholder='Search for a Hero']", {
				oninput: e => setQuery(e.target.value),
			}),
		),
		e("table", 
			e("thead",
				e("th.sortable.sort.sort-asc", "Hero", { onclick: e => thOnClick(e.target, "hero") }),
				e("th.sortable", "# Games", { onclick: e => thOnClick(e.target, "total") }),
				e("th.sortable", "Winrate", { onclick: e => thOnClick(e.target, "winrate") }),
			),
			e("tbody", {tbody}),
		),
	);


	onMany((format, query, order) => {
		const winrates = getAggregateWinrates(format, order[0], order[1], query);

		tbody.element.innerHTML = "";

		tbody.element.append(...winrates.map(row => {
			return e("tr",
				e("td", heroLink(row.hero)),
				e("td", row.total),
				e("td", round(row.winrate), "%"),
			);
		}));
	}, onFormat, onQuery, onOrder);

	return html;
};
