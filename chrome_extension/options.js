const saveOptions = () => {
	const talistats = [
		{
			url: document.getElementById("server-1-url").value.trim(),
			name: document.getElementById("server-1-name").value.trim(),
		},
		{
			url: document.getElementById("server-2-url").value.trim(),
			name: document.getElementById("server-2-name").value.trim(),
		},
	];

	chrome.storage.sync.set({talistats}, () => {
		const status = document.getElementById("status");
		status.textContent = "Options Saved";
		setTimeout(() => {
			status.textContent = "";
		}, 750);
	});
};

const restoreOptions = () => {
	chrome.storage.sync.get({talistats: []}, items => {
		items.talistats.forEach((item, i) => {
			const {url, name} = item;

			document.getElementById(`server-${i+1}-url`).value = url;
			document.getElementById(`server-${i+1}-name`).value = name;
		});
	});
};
 
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
