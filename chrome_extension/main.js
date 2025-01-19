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

const reportMatch = format => {
	chrome.storage.sync.get({talistatsURL: ""}, async items => {
		if (items.talistatsURL == "") {
			setStatus("Error: Set the Talistats URL in the extension options page");
			return;
		}

		const match_id = location.href.split("/").slice(-1)[0];

		const URL = items.talistatsURL + "?" + new URLSearchParams({format, match_id}).toString();
		try {
			const resp = await fetch(URL);
			if (resp.status != 200) {
				setStatus("Internal server error");
				return;
			}

			const text = await resp.text();
			setStatus(text);
		} catch (e) {
			console.log(e);
			setStatus("Internal server error");
		}
	});
};

const createDiv = (endGameStats) => {
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
	const button = buttons.firstChild.cloneNode(true);
	button.textContent = "Report Match";
	button.onclick = () => reportMatch(select.value);

	div.append(button);

	const status = document.createElement("div");
	status.setAttribute("id", "talistats-status");
	div.append(status);

	buttons.insertAdjacentElement("afterend", div);
};

const observer = new MutationObserver((records, observer) => {
	if (talistatsDivExists()) return;

	const endGameStats = document.querySelector("div[class^='_endGameStats']")
	if (endGameStats) {
		createDiv(endGameStats);
	}
});


observer.observe(document.querySelector("body"), {childList: true, subtree: true});
