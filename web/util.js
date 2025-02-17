import {element as e} from "../tiny.js";

export const heroLink = hero => {
	return e(`a[href='/#/heroes/${hero}']`, hero);
};

export const round = winrate => {
	return Math.round(winrate*100)/100;
}
