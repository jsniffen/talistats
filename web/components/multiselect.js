import {element as e, state, ref, onMany} from "../tiny.js";

export const multiselect = () => {
	return e("div.multiselect",
		e("span.chevron"),
		e("input[type=search]"),
	);
};
