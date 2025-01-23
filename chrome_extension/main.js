const classPrefix = "_endGameStats";

const talistatsDivExists = () => {
	return document.querySelector("div#talistats") !== null;
};

const setStatus = msg => {
	const status = document.getElementById("talistats-status");
	if (status) {
		status.textContent = msg;
	}
};

const reportMatch = async (name, url, format) => {
	const match_id = location.href.split("/").slice(-1)[0];

	url = url + "?" + new URLSearchParams({format, match_id}).toString();

	try {
		const resp = await fetch(url);
		if (resp.status != 200) {
			setStatus(`${name}: Internal server error`);
			return;
		}

		const text = await resp.text();
		setStatus(`${name}: ${text}`);
	} catch (e) {
		console.log(e);
		setStatus(`${name}: Internal server error`);
	}

};

const createDiv = (endGameStats) => {
	chrome.storage.sync.get({talistats: []}, async items => {
		const div = document.createElement("div");
		div.setAttribute("id", "talistats");
		div.style.maxWidth = "250px";

		const h2 = document.createElement("h2");
		h2.textContent = "Talistats";
		h2.style.marginBottom = "0";
		div.append(h2);

		const label = document.createElement("label");
		const strong = document.createElement("strong");
		strong.textContent = "Format";
		label.append(strong);
		const select = document.createElement("select");
		["cc", "draft", "ll", "sealed", "blitz"].forEach(format => {
			const option = document.createElement("option");
			option.textContent = format;
			select.append(option);
		});
		label.append(select);
		div.append(label);

		const buttons = endGameStats.querySelector("div[class^='_buttons']");

		if (items.talistats.length == 0) {
			const message = document.createElement("div");
			message.textContent = "Set the Talistats servers in the extension options page";
			div.append(message);
		} else {
			items.talistats.forEach(option => {
				const {name, url} = option;

				const button = buttons.firstChild.cloneNode(true);
				button.style.marginBottom = "5px";
				button.textContent = `Report to ${name}`;
				button.onclick = () => reportMatch(name, url, select.value);
				div.append(button);
			})
		}

		const status = document.createElement("div");
		status.setAttribute("id", "talistats-status");
		div.append(status);

		buttons.insertAdjacentElement("afterend", div);
	});
};

const observer = new MutationObserver((records, observer) => {
	if (talistatsDivExists()) return;

	const endGameStats = document.querySelector("div[class^='_endGameStats']")
	if (endGameStats) {
		createDiv(endGameStats);
	}
});


observer.observe(document.querySelector("body"), {childList: true, subtree: true});
