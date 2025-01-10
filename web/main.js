import {element as e, mount} from "./tiny.js";
import {getDistinctHeroes} from "./db.js";

mount("main", () => {
	const heroes = getDistinctHeroes();
	return e("div", ...heroes.map(hero => e("div", hero)));
});
