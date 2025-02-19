import {element as e, state, ref, onMany} from "../tiny.js";
import {getOpponents, getFormats, getAggregateHeroWinrate, getHeroWinrate, getDistinctHeroes, getHeroGamesPlayed} from "../db.js";
import {round, heroLink} from "../util.js";

const [onOpponents, setOpponents] = state([]);
const [onGoing, setGoing] = state(3);
const [onFormat, setFormat] = state("");

const formatDropdown = hero => {
	const formats = getFormats(hero);
	setFormat(formats[0]);

	return e("select[name=select]", { onchange: e => setFormat(e.target.value) },
		...formats.map(format => e("option", format)),
	);
};

const opponentDropdown = hero => {
	const opponents = getOpponents(hero);
	setOpponents(opponents);

	const onchange = (e, name) => {
		if (e.target.checked) {
			setOpponents(opps => opps.concat([name]));
		} else {
			setOpponents(opps => {
				return opps.filter(x => x != name);
			});
		}
	};

	return e("details.dropdown",
		e("summary", "Opponents"),
		e("ul",
			...opponents.map(name => {
				return e("li",
					e("label",
						e("input[type=checkbox][checked]", {onchange: e => onchange(e, name)}),
						name,
					),
				);
			}),
		),
	);
}

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

const heroWinrate = (winrate, opponents) => {
	return e("div", 
		...winrate.filter(w => opponents.includes(w.opp)).map(w => {
			return e("div",
				heroLink(w.opp, true),
				e("progress.progress-bar", {value: w.winrate, max: 100}),
				e("span.progress-bar-text", `${Math.round(w.winrate*100)/100}% (${w.wins}/${w.total})`),
			);
		}),
	);
};

const statistics = hero => {
	const winrates = getAggregateHeroWinrate(hero);
	return e("table",
		e("thead",
			e("th", "Format"),
			e("th", "# Games"),
			e("th", "Winrate"),
		),
		e("tbody",
			...winrates.map(row => {
				return e("tr",
					e("td", row.format),
					e("td", row.total),
					e("td", round(row.winrate), "%"),
				);
			}),
		),
	);
};

export const heroPage = hero => {
	const winrateDiv = ref();
	const html = e("div",
		e("h1", hero),
		e("h3", "Statistics"),
		statistics(hero),
		e("h3", "Winrates"),
		e("div.grid",
			opponentDropdown(hero),
			goingDropdown(),
			formatDropdown(hero),
		),
		e("div", {ref: winrateDiv}),
	);

	onMany((formats, opponents, going) => {
		winrateDiv.element.innerHTML = "";

		let first = null;
		if (going == 3) first = null;
		if (going == 2) first = false;
		if (going == 1) first = true;

		const winrate = getHeroWinrate(hero, first, formats);
		winrateDiv.element.append(heroWinrate(winrate, opponents));
	}, onFormat, onOpponents, onGoing);


	return html;
};
