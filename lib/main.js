let twauth = new Auth();
riot.mount(document.querySelector("#server_chat"));

nw.Window.get().on("close", () => {
	if(twchat != null) {
		twchat.disconnect();
	}
	nw.Window.get().close(true);
});

nw.Window.get().on("new-win-policy", (frame, url, policy) => {
	policy.ignore();

	nw.Shell.openExternal(url);
});