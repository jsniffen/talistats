import {element as e, state, ref, onMany} from "../tiny.js";

export const heroPage = hero => {
	const html = e("div",
		hero
	);

	return html;
};
