const saveOptions = () => {
	const talistatsURL = document.getElementById("talistats-url").value;

	chrome.storage.sync.set({talistatsURL}, () => {
		const status = document.getElementById("status");
		status.textContent = "Options Saved";
		setTimeout(() => {
			status.textContent = "";
		}, 750);
	});
};

const restoreOptions = () => {
	chrome.storage.sync.get({talistatsURL: ""}, items => {
		document.getElementById("talistats-url").value = items.talistatsURL;
	});
};
 
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
