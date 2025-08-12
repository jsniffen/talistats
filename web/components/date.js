import {element as e, state, ref, onMany} from "../tiny.js";

export const date = (placeholder, setState) => {
	return e("div",
		e("div", placeholder),
		e("input[type=date]", {
			oninput: e => setState(e.target.value),
		})
	)
};
