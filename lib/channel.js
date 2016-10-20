let open_channel = function(channel) {
	if(twchat == null) return;

	var modal = new_modal("Kanal wird geöffnet", "Lass' mich kurz ein paar Daten über diesen Channel suchen...", false);
	twauth.twitch.getChannel(channel, function(err, channel){
		if(err) {
			alert("Ein Fehler ist aufgetreten, während ich Daten geladen habe...");
			return;
		}
		var i = twauth.editorof.indexOf(channel.name);
		if(i >= 0) {
			twauth.editorof.splice(i, 1);
		}

		twauth.twitch.updateChannel(channel.name, twauth.token, { "channel": {"test": "true"} },(err, body) => {
			if(!err) {
				twauth.editorof.push(channel.name);
			}

			https.get({
				"method": "GET", "host": "badges.twitch.tv", "path": "/v1/badges/channels/" + channel._id + "/display"
			}, function(resp){
				var data = "";
				resp.on("data", function(chunk){
					data += chunk;
				}).on("end", function(){
					close_modal(modal);

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

	});
}

let close_channel = function(channel) {
	twchat.part(channel, () => {
		var n = document.querySelector("nav").querySelectorAll("a");
		for(var i = 0; i < n.length; i++) {
			if(n[i].getAttribute("href") == "#channel_" + channel) {
				var li = n[i].parentNode;
				n[i].parentNode.parentNode.removeChild(li);
			}
		}
		document.querySelector(".content").removeChild(document.querySelector("#channel_" + channel));
	});
} 

let get_stream_data = function(channel, callback) {
	if(typeof(channel) != "string" || typeof(callback) != "function") return;
	var userfollowschannel = false;
	twauth.twitch.getUserFollowsChannel(twauth.userinfo.name, channel, (err, body) => {
		if(!err) userfollowschannel = true;
		twauth.twitch.getChannelStream(channel, (err, body) => {
			if(!err && body.stream != null) {
				callback({ "game": body.stream.channel.game, "status": body.stream.channel.status, "viewers": body.stream.viewers, "followers": body.stream.channel.followers, "following": userfollowschannel });
			} else {
				twauth.twitch.getChannel(channel, (err, body) => {
					callback({ "game": body.game, "status": body.status, "viewers": null, "followers": body.followers, "following": userfollowschannel });
				});
			}
		});
	})
}

let follow_channel = function(channel, callback) {
	twauth.twitch.userFollowChannel(twauth.userinfo.name, channel, twauth.token, {}, (err, body) => {
		if(typeof(callback) == "function") callback(err);
	});
}
let unfollow_channel = function(channel, callback) {
	twauth.twitch.userUnfollowChannel(twauth.userinfo.name, channel, twauth.token, (err, body) => {
		if(typeof(callback) == "function") callback(err);
	});
}

let update_channel_data = function(channel, status, game, callback) {
	twauth.twitch.updateChannel(channel, twauth.token, { "channel": {"status": status, "game": game} },(err, body) => {
		if(typeof(callback) == "function") callback(err);
	});
}

let search_games = function(query, callback) {
	if(typeof(callback) != "function") return;

	twauth.twitch.searchGames({ "query": query, "type": "suggest", "live": false }, (err, body) => {
		if(err) {
			callback([]);
		} else {
			callback(body.games);
		}
	});
}