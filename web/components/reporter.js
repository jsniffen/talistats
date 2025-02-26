import {element as e} from "../tiny.js";

export const reporter = show => {
	return show
		? e("span.reporter[data-tooltip='This player reported the match']", e("i.si-star")) : "";
};
