let last_start_refresh = 0;
let last_start_offset = 0;
let last_search_query = "";

let display_streams = function(err, body) {
	var streams_container = document.querySelector("#start_streams");

	streams_container.removeChild(streams_container.querySelector(".start_streams_load"));
	if(!err) {
		if(typeof(body.featured) != "undefined") {
			body.streams = [];
			for(var i = 0; i < body.featured.length; i++) {
				body.streams[i] = body.featured[i].stream;
			}
		}

		console.log("There were " + body.streams.length + " streams found");

		last_start_offset += body.streams.length;
		for(var i = 0; i < body.streams.length; i++) {
			var stream = body.streams[i];

			var sp = document.createElement("stream-preview");
			streams_container.appendChild(sp);

			riot.mount(sp, stream);
		}

		if(body.streams.length > 0 && opencontent == "start") {
			watch_lazy(document.querySelector("#start"), () => { load_streams(); })
		}
	} else {
		streams_container.innerText = "Beim Laden ist ein Fehler aufgetreten.";
	}
}

let load_streams = function(){
	unwatch_lazy();

	var streams_container = document.querySelector("#start_streams");

	var load_note = document.createElement("div");
	load_note.classList.add("start_streams_load");
	load_note.innerText = "Lade. Bitte warten.";
	streams_container.appendChild(load_note);

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
		document.querySelector("#start_streams").innerHTML = "";
		load_streams();

		last_start_refresh = Date.now();
	});


	document.querySelector("#start_search").addEventListener("keyup", (e) => {
		if(e.keyCode == 13) {
			last_search_query = document.querySelector("#start_search").value;
			last_start_offset = 0;
			document.querySelector("#start_streams").innerHTML = "";
			load_streams();
		}
	});
	
	document.querySelector("a.home").click();
});