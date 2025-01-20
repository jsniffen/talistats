import {element as e, state, ref, onMany} from "../tiny.js";
import {getHeroWinrate, getDistinctHeroes, getHeroGamesPlayed} from "../db.js";

const [onHero, setHero] = state("");
const [onGoing, setGoing] = state(3);

const heroDropdown = () => {
	const heroes = getDistinctHeroes();
	setHero(heroes[0]);

	const onchange = e => setHero(e.target.value);

	return e("select.form-select", {onchange},
		...heroes.map(name => e("option", name)),
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
				e("label",
					e("input[type=checkbox][name='Second'][checked]", {onchange: e => setGoing(g =>  g + (e.target.checked ? 2 : -2))}),
					"Second"
				),
			),
		),
	);
}

const heroWinrate = winrate => {
	return e("div", 
		e("h3", "Winrates"),
		...winrate.map(w => {
			return e("div",
				e("span", w.opp),
				e("progress.progress-bar", {value: w.winrate, max: 100}),
				e("span.progress-bar-text", `${Math.round(w.winrate*100)/100}% (${w.wins}/${w.total})`),
			);
		}),
	);
};

export const heroPage = () => {
	const winrateDiv = ref();
	const html = e("div",
		e("div.grid",
			heroDropdown(),
			goingDropdown(),
		),

		e("div", {ref: winrateDiv}),
	);

	onMany((hero, going) => {
		winrateDiv.element.innerHTML = "";

		let first = null;
		if (going == 3) first = null;
		if (going == 2) first = false;
		if (going == 1) first = true;

		const winrate = getHeroWinrate(hero, first);
		console.log(winrate);

		winrateDiv.element.append(heroWinrate(winrate));
	}, onHero, onGoing);


	return html;
};
