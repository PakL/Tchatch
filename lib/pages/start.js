let last_start_refresh = 0;
let last_start_offset = 0;
let last_search_query = "";
let last_start_streams = null;

let StreamStore = function(streams){
	this.streams = streams;
	riot.observable(this);
	this.trigger("streams_update", {streams: this.streams});
}
StreamStore.prototype.append = function(streams) {
	this.streams = this.streams.concat(streams);
	this.trigger("streams_update", {streams: this.streams});
}
StreamStore.prototype.clear = function() {
	this.streams = [];
	this.trigger("streams_update", {streams: this.streams});
}
StreamStore.prototype.loading = function() {
	this.trigger("loading");
}

let display_streams = function(err, body) {
	if(!err) {
		if(typeof(body.featured) != "undefined") {
			body.streams = [];
			for(var i = 0; i < body.featured.length; i++) {
				body.streams[i] = body.featured[i].stream;
			}
		}

		console.log("There were " + body.streams.length + " streams found");

		last_start_offset += body.streams.length;
		last_start_streams.append(body.streams);

		if(body.streams.length > 0 && opencontent == "start") {
			watch_lazy(document.querySelector("#start"), () => { load_streams(); })
		}
	} else {
		last_start_streams.clear(body.streams);
		streams_container.innerText = "Beim Laden ist ein Fehler aufgetreten.";
	}
}

let load_streams = function(){
	unwatch_lazy();

	last_start_streams.loading();

	if(last_search_query.length > 0) {
		document.querySelector("#start_streamsheading").innerText = "Hier sind deine Suchergebnisse:";
		console.log("Search for streams started...");
		twauth.twitch.searchStreams({ "query": last_search_query, "limit": 25, "offset": last_start_offset }, display_streams);
	} else {
		document.querySelector("#start_streamsheading").innerText = "Hier sind ein paar Streams:";
		console.log("Loading featured stream...");
		twauth.twitch.getFeaturedStreams({ "limit": 25, "offset": last_start_offset }, display_streams);
	}
}

window.addEventListener("load", () => {
	add_menulistener("start leaving", function(){
		unwatch_lazy();
	});

	add_menulistener("start", function() {
		if(last_start_refresh > Date.now()-60000) return;

		last_search_query = "";
		last_start_offset = 0;
		last_start_streams.clear();
		load_streams();

		last_start_refresh = Date.now();
	});


	document.querySelector("#start_search").addEventListener("keyup", (e) => {
		if(e.keyCode == 13) {
			last_search_query = document.querySelector("#start_search").value;
			last_start_offset = 0;
			last_start_streams.clear();
			load_streams();
		}
	});
	
	last_start_streams = new StreamStore();
	riot.mount(document.querySelector("#start_streams"), { streams: last_start_streams });
	document.querySelector("a.home").click();
});