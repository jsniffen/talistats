import {element as e} from "../tiny.js";
import {getHeroGamesPlayed} from "../db.js";

export const homePage = () => {
	const results = getHeroGamesPlayed();

	const labels = results.map(x => x.hero);
	const data = results.map(x => x.numMatches);

	console.log(labels);
	console.log(data);

	const canvas = e("canvas");
	const chart = new Chart(canvas, {
		type: "pie",
		data: {
			labels: labels,
			datasets: [{
				label: "numMatches",
				data: data,
			}],
		},
		options: {
			responsive: true,
			plugins: {
				legend: {
					position: "top",
				},
				title: {
					display: true,
					text: "Hero Distribution"
				}
			}
		},
	});

	return e("div", canvas);
};
