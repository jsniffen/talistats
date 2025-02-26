const games = {};

chrome.webRequest.onBeforeRequest.addListener(details => {
	const url = new URL(details.url);
	const playerID = url.searchParams.get("playerID");
	const gameName = url.searchParams.get("gameName");
	
	if (playerID == null || gameName == null) return;
	games[gameName] = playerID;

}, {urls: ["*://*.talishar.net/game/*"], types: []});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message?.from !== "content_script") {
		console.error("Unexpected message", message);
	}
	const from = "service_worker";
	const gameName = message?.gameName;
	const player = gameName in games ? games[gameName] : 0;
	sendResponse({from, gameName, player});
});
