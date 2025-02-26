console.log("Extension started!");

const animationTime = 3000;

const reportMatch = async (server, format, match_id, player) => {
	console.log("Talistats: reporting match", server, format, match_id, player);
	const url = server.url + "?" + new URLSearchParams({format, match_id, player}).toString();

	try {
		const resp = await fetch(url);
		if (resp.status != 200) {
			return `${server.name}: Internal server error`;
		}

		const text = await resp.text();
		return `${server.name}: ${text}`;
	} catch (e) {
		console.error(e);
		return `${server.name}: Internal server error`;
	}
};

const getFormat = async (gameName) => {
	console.log("Talistats: getting match format", gameName);
	const playerID = 1;
	const url = "https://api.talishar.net/game/APIs/GetLobbyInfo.php";

	try {
		const resp = await fetch(url, {method: "POST", body: JSON.stringify({ gameName, playerID })});
		if (resp.status != 200) {
			return null;
		}
		const data = await resp.json();
		const format = data?.format ?? null;
		const talisharFormats = {
			cc: "cc",
			openformatcc: "cc",
			compcc: "cc",
			blitz: "blitz",
			compblitz: "blitz",
			openformatblitz: "blitz",
			llcc: "ll",
			openformatllcc: "ll",
			draft: "draft",
			commoner: "commoner",
			clash: "clash",
		};
		return format in talisharFormats ? talisharFormats[format] : null;
	} catch (e) {
		return null;
	}
};

const createStatus = msg => {
	const body = document.body;

	const popup = document.createElement("div");
	popup.classList.add("pico");
	popup.classList.add("talistats-popup");

	const h3 = document.createElement("h3");
	h3.textContent = "Talistats";
	popup.append(h3);

	const status = document.createElement("div");
	popup.append(status);

	const article = document.createElement("article");
	article.textContent = msg;
	status.append(article);

	body.append(popup);

	setTimeout(() => {
		popup.classList.add("talistats-popup-hidden");
		setTimeout(() => {
			popup.remove();
		}, 1000);
	}, animationTime);
};

const createPopup = () => {
	const body = document.body;

	const popup = document.createElement("div");
	popup.classList.add("pico");
	popup.classList.add("talistats-popup");

	const upload = document.createElement("div");
	upload.classList.add("talistats-transition");
	popup.append(upload);

	const h3 = document.createElement("h3");
	h3.textContent = "Talistats";
	upload.append(h3);

	const uploadText = document.createElement("div");
	uploadText.textContent = "Reporting match";
	upload.append(uploadText);

	const progressBar = document.createElement("progress");
	progressBar.setAttribute("max", "100");
	progressBar.setAttribute("value", "0");
	progressBar.onclick = () => {
		popup.remove();
	};
	upload.append(progressBar);

	const interval = setInterval(() => {
		const value = parseInt(progressBar.getAttribute("value"));
		progressBar.setAttribute("value", value+2);
	}, animationTime/50);

	setTimeout(() => {
		progressBar.setAttribute("value", 100);
		clearInterval(interval);
	}, animationTime);

	let cancelled = false
	const input = document.createElement("button");
	input.setAttribute("type", "button");
	input.textContent = "Cancel";
	input.onclick = e => {
		cancelled = true;
		popup.remove();
	};
	upload.append(input);

	const status = document.createElement("div");
	popup.append(status);

	body.append(popup);

	const setStatus = msg => {
		const article = document.createElement("article");
		article.textContent = msg;
		status.append(article);
	};

	const remove = () => {
		popup.classList.add("talistats-popup-hidden");
		setTimeout(() => {
			popup.remove();
		}, 1000);
	}

	const isCancelled = () => {
		return cancelled; 
	}

	return [setStatus, remove, isCancelled];
};

const onGameEndDetected = async () => {
	console.log("Talistats: end game detected");

	const gameName = location.href.split("/").slice(-1)[0];
	const format = await getFormat(gameName);

	if (format == null) {
		console.log("Talistats error: could not determine format!");
		createStatus("Unable to determine match format");
		return;
	}

	chrome.runtime.sendMessage({ from: "content_script", gameName }, {}, async (response) => {
		const player = response?.player ?? 0;

		chrome.storage.sync.get({talistats: {}}, async (items) => {
			console.log("Talistats:", gameName, format, player, items);

			const servers = (items?.talistats ?? []).filter(server => server?.name && server?.url);

			if (servers.length == 0) {
				console.log("Talistats error: please set the servers!");
				createStatus("Please set a valid server in the extension settings");
				return;
			}

			const [setStatus, remove, isCancelled] = createPopup();
			setTimeout(async () => {
				if (isCancelled()) {
					console.log("CANCELLED");
					return;
				}

				for (const server of servers) {
					const response = await reportMatch(server, format, gameName, player);
					setStatus(response);
				}

				setTimeout(() => {
					remove();
				}, animationTime - 1000);
			}, animationTime);
		});
	});
};

const observer = new MutationObserver((records, observer) => {
	for (const record of records) {
		for (const node of record.addedNodes) {
			if (node.nodeType == 1) {
				const candidates = node.querySelectorAll("h3");
				for (const h3 of candidates) {
					if (h3.textContent == "Game Over Summary") {
						setTimeout(() => {
							if (document.body.contains(h3)) {
								onGameEndDetected();
							}
						}, 500);
					}
				}
			}
		}
	}
});
observer.observe(document.querySelector("body"), {childList: true, subtree: true});
