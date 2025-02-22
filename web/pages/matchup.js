import {element as e, state, ref, onMany} from "../tiny.js";
import {getOpponents, getDecklist, getMatches, getDistinctHeroes, getCards} from "../db.js";
import {round, heroLink} from "../util.js";
import {decklist} from "../components/decklist.js";

export const matchup = () => {
	const heroCardsIncluded = ref();
	const heroCardsExcluded = ref();
	const opponentCardsIncluded = ref();
	const opponentCardsExcluded = ref();

	const matchRows = ref();
	const statsRows = ref();
	const oppDropdownElement = ref();

	const [onHero, setHero] = state("");
	const [onGoing, setGoing] = state(3);
	const [onOpponent, setOpponent] = state("");

	const [onHeroCards, setHeroCards] = state({});
	const [onOpponentCards, setOpponentCards] = state({});

	const [onFormat, setFormat] = state("cc");

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

	const deleteHeroCard = card => {
		setHeroCards(cards => { 
			delete cards[card.id]
			return cards;
		});
	};

	const deleteOpponentCard = card => {
		setOpponentCards(cards => { 
			delete cards[card.id]
			return cards;
		});
	};

	const heroDropdown = () => {
		const heroes = getDistinctHeroes();
		setHero(heroes[0]);

		return e("select[name=select]", { onchange: e => setHero(e.target.value) },
			...heroes.map(hero => e("option", hero)),
		);
	};

	const opponentDropdown = () => {
		const heroes = getDistinctHeroes();
		setOpponent(heroes[0]);

		return e("select[name=select]", { onchange: e => setOpponent(e.target.value) },
			...heroes.map(hero => e("option", hero)),
		);
	};

	const oppDropdown = (hero, opp) => {
		const heroes = getOpponents(hero);

		const options = heroes.map(hero => e("option", hero))
		options.forEach(option => {
			if (option.value == opp) option.selected = true
		});

		return e("select[name=select]", { onchange: e => setOpponent(e.target.value) },
			...options,
		);
	};

	const cardSearchResult = card => {
		const heroInclude = () => {
			setHeroCards(cards => {
				return {
					...cards,
					[card.id]: {
						id: card.id,
						pitch: card.pitch,
						name: card.name,
						include: 1,
					},
				}
			});
		};

		const heroExclude = () => {
			setHeroCards(cards => {
				return {
					...cards,
					[card.id]: {
						id: card.id,
						pitch: card.pitch,
						name: card.name,
						include: -1,
					},
				}
			});
		};

		const opponentInclude = () => {
			setOpponentCards(cards => {
				return {
					...cards,
					[card.id]: {
						id: card.id,
						pitch: card.pitch,
						name: card.name,
						include: 1,
					},
				}
			});
		};

		const opponentExclude = () => {
			setOpponentCards(cards => {
				return {
					...cards,
					[card.id]: {
						id: card.id,
						pitch: card.pitch,
						name: card.name,
						include: -1,
					},
				}
			});
		};

		return e("div.card-search-result", card.name,
			pitch(card),
			e("button.card-search-result", { onclick: heroInclude }, "Hero ", e("i.si-check")),
			e("button.card-search-result", { onclick: heroExclude}, "Hero ", e("i.si-x")),
			e("button.card-search-result", { onclick: opponentInclude }, "Opponent ", e("i.si-check")),
			e("button.card-search-result", { onclick: opponentExclude }, "Opponent ", e("i.si-x")),
		);
	};

	let results = ref();
	const documentOnClick = e => {
		if (results.element && !results.element.contains(e.target)) results.element.hidden = true;
	};
	document.addEventListener("click", documentOnClick);

	const cardSearch = () => {
		const [onQuery, setQuery] = state("");
		results = ref();

		const html = e("div.cardsearch",
			e("input.search[type=search][placeholder='Find a card']", {oninput: e => setQuery(e.target.value)}),
			e("article.search-results", {hidden: true, results}),
		);


		onQuery(q => {
			results.element.innerHTML = "";
			results.element.hidden = true;

			if (q == "") {
				return;
			}

			const cards = getCards(q, 10);
			if (cards.length > 0) {
				results.element.hidden = false;

				results.element.append(...cards.map(cardSearchResult));
			}
		}, true);

		return html;
	};

	const heroCard = card => {
		return e("div.card",
			card.name,
			pitch(card),
			e("i.card-delete.si-x", { onclick: () => deleteHeroCard(card) }),
		);
	};

	const opponentCard = card => {
		return e("div.card",
			card.name,
			pitch(card),
			e("i.card-delete.si-x", { onclick: () => deleteOpponentCard(card) }),
		);
	};

	const html = e("div", { style: "margin-bottom: 20px" },
		e("h3", "Filters"),
		cardSearch(),
		e("div.grid",
			formatDropdown(),
			goingDropdown(),
		),
		e("div",
			e("h3", "Hero"),
			heroDropdown(),
			e("article.card-list",
				e("div", 
					e("h5", "Included"),
					e("div.card-list-list", {heroCardsIncluded}),
				),
				e("div.vr"),
				e("div", 
					e("h5", "Excluded"),
					e("div.card-list-list", {heroCardsExcluded}),
				),
			),
		),
		e("div",
			e("h3", "Opponent"),
			e("div", {oppDropdownElement}),
			e("article.card-list",
				e("div", 
					e("h5", "Included"),
					e("div.card-list-list", {opponentCardsIncluded}),
				),
				e("div.vr"),
				e("div", 
					e("h5", "Excluded"),
					e("div.card-list-list", {opponentCardsExcluded}),
				),
			),
		),
		e("div",
			e("h3", "Statistics"),
			e("table",
				e("thead",
					e("th", "# Games"),
					e("th", "Winrate"),
				),
				e("tbody", {statsRows}),
			),
		),
		e("div",
			e("h3", "Matches"),
			e("table",
				e("thead",
					e("th", "Hero"),
					e("th", "Result"),
					e("th", "Opponent"),
					e("th", "Hero Avg Value"),
					e("th", "Opp Avg Value"),
					e("th", "Going"),
					e("th", "# Turns"),
					e("th", "Date"),
					e("th", "Format"),
				),
				e("tbody", {matchRows}),
			),
		),
	);

	onMany((hero, opponent, heroCards, opponentCards, format, going) => {
		heroCardsIncluded.element.innerHTML = "";
		heroCardsExcluded.element.innerHTML = "";
		opponentCardsIncluded.element.innerHTML = "";
		opponentCardsExcluded.element.innerHTML = "";
		matchRows.element.innerHTML = "";
		statsRows.element.innerHTML = "";
		oppDropdownElement.element.innerHTML = "";

		oppDropdownElement.element.append(oppDropdown(hero, opponent));

		const heroIncluded = [];
		const heroExcluded = [];
		const oppIncluded = [];
		const oppExcluded = [];

		for (const [id, card] of Object.entries(heroCards)) {
			if (card.include > 0) {
				heroCardsIncluded.element.append(heroCard(card));
				heroIncluded.push(id);
			} else {
				heroCardsExcluded.element.append(heroCard(card));
				heroExcluded.push(id);
			}
		}

		for (const [id, card] of Object.entries(opponentCards)) {
			if (card.include > 0) {
				opponentCardsIncluded.element.append(opponentCard(card));
				oppIncluded.push(id);
			} else {
				opponentCardsExcluded.element.append(opponentCard(card));
				oppExcluded.push(id);
			}
		}

		let first = null;
		if (going == 3) first = null;
		if (going == 2) first = false;
		if (going == 1) first = true;

		const matches = getMatches(hero, heroIncluded, heroExcluded, opponent, oppIncluded, oppExcluded, format, first);
		if (matches.length == 0) return;

		matchRows.element.append(...matches.map(match => {
			const p1_score = match.win ? 1 : 0;
			const p2_score = match.win ? 0 : 1;
			const date = new Date(match.date);
			return e("tr",
				e("td", decklist(match.match_id, match.hero_player), " ", heroLink(match.hero)),
				e("td", p1_score + " - " + p2_score),
				e("td", decklist(match.match_id, match.opp_player), " ", heroLink(match.opp)),
				e("td", match.hero_avg_value),
				e("td", match.opp_avg_value),
				e("td", match.first ? "1st" : "2nd"),
				e("td", match.turns),
				e("td", date.toLocaleDateString('en-US', {month: 'numeric', day: 'numeric', year: 'numeric'})),
				e("td", match.format),
			);
		}));

		const wins = matches.filter(x => x.win).length;
		const total = matches.length;
		const winrate = round(wins*100.0/total);
		statsRows.element.append(e("tr",
			e("td", total),
			e("td", round(winrate), "%"),
		));

	}, onHero, onOpponent, onHeroCards, onOpponentCards, onFormat, onGoing);

	return html;
};
