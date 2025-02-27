import {element as e} from "../tiny.js";

export const heroLink = (hero, contrast=false) => {
	if (contrast) {
		return e(`a.contrast[href='/#/heroes/${hero}']`, hero);
	} else {
		return e(`a[href='/#/heroes/${hero}']`, hero);
	}
};

export const round = winrate => {
	return Math.round(winrate*100)/100;
}

export const localDate = date => {
	const utcDate = new Date(date);

	const localOffsetMinutes = utcDate.getTimezoneOffset();
	const localDate = new Date(utcDate.getTime() - (localOffsetMinutes * 60 * 1000));

	return localDate.toLocaleString();
};

export const listToSqlSet = list => {
	return list.map(x => x.replaceAll("'", "''")).map(x => `'${x}'`).join(",");
};
