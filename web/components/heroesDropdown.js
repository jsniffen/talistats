import {element as e, state, ref} from "../tiny.js";
import {getDistinctHeroes} from "../db.js";

export const heroesDropdown = (placeholder,  setState) => {
	const [onAll, setAll] = state(true);
	const options = ref();

	const heroes = getDistinctHeroes();
	setState(heroes);

	const onchange = (checked, name) => {
		if (checked) {
			setState(s => s.concat([name]));
		} else {
			setState(s => {
				return s.filter(x => x != name);
			});
		}
	};

	const html =  e("details.dropdown",
		e("summary", placeholder),
		e("ul", { options },
			e("li",
				e("label",
					e("input[type=checkbox][checked]", {onchange: e => setAll(e.target.checked)}),
					"Select All",
				),
			),
			...heroes.map(name => {
				return e("li",
					e("label",
						e("input[type=checkbox][checked]", {onchange: e => onchange(e.target.checked, name)}),
						name,
					),
				);
			}),
		),
	);

	onAll(all => {
		if (all) {
			setState(heroes);
		} else {
			setState([]);
		}
		options.element.querySelectorAll("input").forEach(n => n.checked = all);
	});

	return html;
};
