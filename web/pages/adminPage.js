import {element as e, ref} from "../tiny.js";
import {submit} from "../db.js";

export const adminPage = () => {
	const input = ref();

	const onclick = () => {
		const rows = submit(input.element.value);
		console.log(rows);
	};

	return e("div",
		e("form",
			e("fieldset[role=group]",
				e("input[type=text][placeholder=Query]", { input }),
				e("button", { onclick }, "Submit"),
			),
		),
	);
};
