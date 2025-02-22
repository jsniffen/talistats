import {element as e, state, ref, onMany} from "../tiny.js";
import {getDecklist} from "../db.js";
import {pitch} from "./pitch.js";

let visibleModal = null;
const animationDuration = 400;

const closeModal = modal => {
	visibleModal = null;
	const html = document.documentElement;
	html.classList.add("modal-is-closing");
	setTimeout(() => {
		html.classList.remove("modal-is-closing", "modal-is-open");
		modal.close();
	}, animationDuration);
};

const openModal = modal => {
	const html = document.documentElement;
	html.classList.add("modal-is-open", "modal-is-opening");
	setTimeout(() => {
		html.classList.remove("modal-is-opening");
		visibleModal = modal;
	}, animationDuration);
	modal.showModal();
};

document.addEventListener("keydown", (event) => {
	if (event.key === "Escape" && visibleModal) {
		closeModal(visibleModal);
	}
});

const documentOnClick = e => {
	if (visibleModal && !visibleModal.querySelector("article")?.contains(e.target)) closeModal(visibleModal);
};
document.addEventListener("click", documentOnClick);

export const decklist = (match_id, player) => {
	const showDecklist = () => {
		const decklist = getDecklist(player, match_id);

		const modal = document.getElementById("modal");
		modal.innerHTML = "";
		modal.append(e("article", 
			...decklist.sort((a, b) => a.pitch - b.pitch).map(row => {
				return e("div.card",
					`(${row.num_copies}) `,
					row.name,
					pitch(row),
				)
			}),
		));
		openModal(modal);
	};


	return e("i.decklist.si-file-empty", { onclick: showDecklist });
};

