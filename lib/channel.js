let open_channel = function(channel) {
	if(twchat == null) return;

	var modal = new_modal("Kanal wird geöffnet", "Lass' mich kurz ein paar Daten über diesen Channel suchen...", false);
	twauth.twitch.getChannel(channel, function(err, channel){
		close_modal(modal);
		if(err) {
			alert("Ein Fehler ist aufgetreten, während ich Daten geladen habe...");
			return;
		}


		https.get({
			"method": "GET", "host": "badges.twitch.tv", "path": "/v1/badges/channels/" + channel._id + "/display"
		}, function(resp){
			var data = "";
			resp.on("data", function(chunk){
				data += chunk;
			}).on("end", function(){

				twchat.channelbadges[channel.name] = JSON.parse(data).badge_sets;
				
				var check = document.querySelectorAll("#channel_" + channel.name);
				if(check.length > 0) {
					var navlinks = document.querySelector("nav").childNodes[0].querySelectorAll("a");
					for(var i = 0; i < navlinks.length; i++) {
						if(navlinks[i].getAttribute("href") == "#channel_" + channel.name) {
							navlinks[i].click();
							return;
						}
					}
				}


				var m = document.querySelector("nav").childNodes[0];
				var nl = document.createElement("li");
				nl.innerHTML = "<a href=\"#channel_" + channel.name + "\"><span class=\"icon logo\" style=\"background-image:url(" + channel.logo+ ");\"></span> <span>" + channel.display_name + "</span>";
				m.appendChild(nl);

				var streamel = document.createElement("stream");
				streamel.setAttribute("id", "channel_" + channel.name);
				streamel.style.display = "none";
				document.querySelector(".content").appendChild(streamel);

				riot.mount(streamel, channel);

				rebind_menu();
				nl.childNodes[0].click();

				twchat.join(channel.name);

			});
		});

	});
}