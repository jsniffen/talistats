import {element as e, state, ref, onMany} from "../tiny.js";

export const scroll = state(1);

const [onScroll, setScroll] = scroll;

window.addEventListener("scroll", () => {
	if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
		setScroll(scroll => scroll+1);
	}
});

