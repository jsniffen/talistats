import {element as e, ref} from "../tiny.js";

export const numberRange = (placeholder, setState, min=0, max=10) => {
	const num = ref();
	setState(min);

	return e("div",
		e("div", placeholder, ": ", e("span", min, { num })),
		e(`input[type=range][placeholder=${placeholder}][min=${min}][max=${max}][value=${min}]`, {
			onchange: e => {
				const n = parseInt(e.target.value);
				setState(n);
			},
			oninput: e => {
				num.element.innerHTML = e.target.value;
			},
		}),
	);
};
