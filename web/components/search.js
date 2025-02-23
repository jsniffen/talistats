import {element as e, state, ref, onMany} from "../tiny.js";

export const search = (placeholder, setState) => {
	return e(`input[type=search][placeholder='${placeholder}']`, {
		oninput: e => setState(e.target.value),
	});
};
