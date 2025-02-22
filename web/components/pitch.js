import {element as e} from "../tiny.js";

export const pitch = card => {
	let pitch = "";
	if (card.pitch == 1) {
		pitch = e("div.pitch.pitch-1");
	} else if (card.pitch == 2) {
		pitch = e("div.pitch.pitch-2");
	} else if (card.pitch == 3) {
		pitch = e("div.pitch.pitch-3");
	}
	return pitch;
};
