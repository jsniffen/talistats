import {element as e, state, ref, onMany} from "../tiny.js";
import {getOpponents, getDistinctHeroes, getCardStats} from "../db.js";
import {round} from "../util.js";

export const cardsPage = () => {
	const tbody = ref();
	const oppDropdownElement = ref();

	const [onQuery, setQuery] = state("");
	const [onHero, setHero] = state("");
	const [onGoing, setGoing] = state(3);
	const [onOpponent, setOpponent] = state("all");
	const [onFormat, setFormat] = state("cc");
	const [onOrder, setOrder] = state(["winrate", "desc"]);
	const [onMustPlay, setMustPlay] = state(false);

	const search = () => {
		return e("input[type=search][placeholder='Search for a Card']", {
			oninput: e => setQuery(e.target.value),
		});
	};

	const pitch = card => {
		let pitch = "";
		if (card.pitch == 1) {
			pitch = e("div.pitch.pitch-1");
		} else if (card.pitch == 2) {
			pitch = e("div.pitch.pitch-2");
		} else if (card.pitch == 3) {
			pitch = e("div.pitch.pitch-3");
		}
		return pitch;
	};

	const mustPlaySwitch = () => {
		return e("fieldset",
			e("label",
				e("input[type=checkbox][role=switch]", { onchange: e => setMustPlay(e.target.checked) }),
				"Must be Played",
			),
		);
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

	const heroDropdown = () => {
		const heroes = getDistinctHeroes();
		setHero(heroes[0]);

		return e("select[name=select]", { onchange: e => setHero(e.target.value) },
			...heroes.map(hero => e("option", hero)),
		);
	};

	const oppDropdown = (hero, opp) => {
		const heroes = getOpponents(hero);

		const options = [e("option[value='all']", "All Opponents"), ...heroes.map(hero => e("option", hero))]
		options.forEach(option => {
			if (option.value == opp) option.selected = true
		});

		return e("select[name=select]", { onchange: e => setOpponent(e.target.value) },
			...options,
		);
	};

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
		heroDropdown(),
		e("div.grid",
			formatDropdown(),
			goingDropdown(),
			e("div", {oppDropdownElement}),
		),
		search(),
		mustPlaySwitch(),
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

	onMany((hero, opp, going, format, order, mustPlay, query) => {
		tbody.element.innerHTML = "";
		oppDropdownElement.element.innerHTML = "";
		oppDropdownElement.element.append(oppDropdown(hero, opp));

		let first = null;
		if (going == 3) first = null;
		if (going == 2) first = false;
		if (going == 1) first = true;

		if (opp == "all") opp = null;

		const stats = getCardStats(query, hero, opp, first, format, order[0], order[1], mustPlay);
		tbody.element.append(...stats.map(row => {
			return e("tr",
				e("td.cardrow", row.name, pitch(row)),
				e("td", row.total),
				e("td", round(row.avg_played)),
				e("td", round(row.avg_blocked)),
				e("td", round(row.avg_pitched)),
				e("td", round(row.winrate), "%"),
			);
		}));
	}, onHero, onOpponent, onGoing, onFormat, onOrder, onMustPlay, onQuery);

	return html;
};
