import {element as e} from "../tiny.js";

export const toggle = (placeholder, setState) => {
	return e("fieldset",
		e("label",
			e("input[type=checkbox][role=switch]", { onchange: e => setState(e.target.checked) }),
			placeholder,
		),
	);
};
