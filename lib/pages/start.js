let last_start_refresh = 0;
let last_start_offset = 0;
let last_search_query = "";

let display_streams = function(err, body) {
	var streams_container = $("#start_streams");

	streams_container.find(".start_streams_load").remove();
	if(!err) {
		if(typeof(body.streams) == "undefined" && typeof(body.featured) != "undefined") {
			body.streams = [];
			for(var i = 0; i < body.featured.length; i++) {
				body.steams.push(body.featured[i].stream);
			}
		}

		last_start_offset += body.streams.length;
		for(var i = 0; i < body.streams.length; i++) {
			var stream = body.streams[i];
			streams_container.append(
				$("<div />").addClass("stream_preview").css("background-image", "url(" + stream.preview.medium + ")")
					.append($("<div />").addClass("viewer").append($("<span />").addClass("icon icon-person")).append(" " + stream.viewers))
					.append($("<div />").addClass("title").text(stream.channel.status))
					.append($("<div />").addClass("game").text(stream.game))
			);
		}

		if(body.streams.length > 0 && opencontent == "start") {
			console.log("There were " + body.streams.length + " streams found");
			$(".content").on("scroll", _.throttle(function(){
				if($("#start_lazyload").isInView()) {
					load_streams();
				}
			}, 100)).trigger("scroll");
		}
	} else {
		streams_container.text("Beim Laden ist ein Fehler aufgetreten.");
	}
}

let load_streams = function(){
	$(".content").off("scroll");
	var streams_container = $("#start_streams");

	streams_container.append($("<div />").addClass("start_streams_load").text("Lade. Bitte warten."));

	if(last_search_query.length > 0) {
		twauth.twitch.searchStreams({ "query": last_search_query, "limit": 25, "offset": last_start_offset }, display_streams);
	} else {
		twauth.twitch.getFeaturedStreams({ "limit": 25, "offset": last_start_offset }, display_streams);
	}
}

$(document).ready(function(){
	add_menulistener("start leaving", function(){
		$(".content").off("scroll");
	});

	add_menulistener("start", function() {
		if(last_start_refresh > Date.now()-60000) return;

		last_search_query = "";
		last_start_offset = 0;
		$("#start_streamsheading").text("Hier sind ein paar Streams:");
		$("#start_streams").html("");
		load_streams();

		last_start_refresh = Date.now();
	});

	$("#start_search").keyup(function(e){
		if(e.which == 13) {
			last_search_query = $(this).val();
			last_start_offset = 0;
			$("#start_streamsheading").text("Hier sind deine Suchergebnisse:");
			$("#start_streams").html("");
			load_streams();
		}
	});
	
	$("a.home").click();
});