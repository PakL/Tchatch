let last_favorites_offset = 0;
let last_favorites_streams = null;

let display_fav_streams = function(err, body) {
	if(!err) {
		last_favorites_offset += body.streams.length;
		last_favorites_streams.append(body.streams);

		if(last_favorites_offset < body._total && opencontent == "favorites") {
			watch_lazy(document.querySelector("#favorites"), () => { load_fav_streams(); })
		}
	} else {
		last_start_streams.clear(body.streams);
	}
}

let load_fav_streams = function(){
	unwatch_lazy();

	if(typeof(twauth.token) == "string" && twauth.token.length > 0) {
		last_favorites_streams.loading();
		twauth.twitch.getAuthenticatedUserFollowedStreams(twauth.token, { "stream_type": "live", "limit": 25, "offset": last_favorites_offset }, display_fav_streams);
	} else {
		alert("Du musst erst einloggen, um deine Favoriten anzuzeigen.");
	}
}

window.addEventListener("load", () => {
	add_menulistener("favorites leaving", function(){
		unwatch_lazy();
	});

	add_menulistener("favorites", function() {
		last_favorites_offset = 0;
		last_favorites_streams.clear();
		load_fav_streams();
	});
	
	last_favorites_streams = new StreamStore();
	riot.mount(document.querySelector("#favorites_streams"), { streams: last_favorites_streams });
});