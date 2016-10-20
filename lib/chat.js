let Chat = function() {
	var self = this;
	this.servertag = document.querySelector("#server_chat")._tag;
	this.sendingmessage = "";

	this.channel = {};
	this.badges = {};
	this.channelbadges = {};
	this.channelemotes = {};

	this.irc = new TwitchChat();
	this.irc.on("connect", () => {
		self.irc.auth(twauth.userinfo.name, twauth.token);
	});
	this.irc.on("registered", () => {

	});
	this.irc.on("outgoing", (msg) => {
		self.servertag.addmsg({ "timestamp": timestamp(), "display_name": ">", "message": msg, "user": twauth.userinfo.name });
	});
	this.irc.on("incoming", (msg) => {
		if(self.sendingmessage.length > 0) {
			for(to in self.channel) {
				if(!self.channel.hasOwnProperty(to)) continue;
				self.channel[to].setmessageavail();
			}
		}
		if(!msg.match(/ PRIVMSG #/)) {
			self.servertag.addmsg({ "timestamp": timestamp(), "display_name": "<", "message": msg, "user": "server" });
		}
	});
	this.irc.on("userstate", (to, tags) => {
		if(to.substr(0, 1) == "#") to = to.substr(1);
		var self = this;
		var emotesets = "0";
		if(typeof(tags["emote-sets"]) != "undefined") emotesets = tags["emote-sets"];
		if(this.sendingmessage.length > 0) {

			if(typeof(this.channelemotes[emotesets]) != "undefined") {
				if(this.sendingmessage.substr(0, 4).trim().toLowerCase() == "/me") {
					if(this.sendingmessage.substr(4).length > 0) {
						tags.emotes = findEmoticons(this.sendingmessage.substr(4), this.channelemotes[emotesets]);
						this.irc.emit("action", "", twauth.userinfo.name, to, this.sendingmessage.substr(4), tags);
					} else {
						this.channel[to].setmessageavail();
					}
				} else {
					tags.emotes = findEmoticons(this.sendingmessage, this.channelemotes[emotesets]);
					this.irc.emit("message", "", twauth.userinfo.name, to, this.sendingmessage, tags);
				}
				this.sendingmessage = "";
			} else {

				https.get({
					"method": "GET", "host": "api.twitch.tv", "path": "/kraken/chat/emoticon_images?emotesets=" + emotesets,
					"headers": { "Accept": "application/vnd.twitchtv.v3+json", "Client-ID": encodeURIComponent(twauth.client_id) }
				}, function(resp){
					var data = "";
					resp.on("data", function(chunk){
						data += chunk;
					}).on("end", function(){

						self.channelemotes[emotesets] = JSON.parse(data);
						self.channel[to].setemotes(self.channelemotes[emotesets]);
						if(self.sendingmessage.substr(0, 4).trim().toLowerCase() == "/me") {
							if(self.sendingmessage.substr(4).length > 0) {
								tags.emotes = findEmoticons(self.sendingmessage.substr(4), self.channelemotes[emotesets]);
								self.irc.emit("action", "", twauth.userinfo.name, to, self.sendingmessage.substr(4), tags);
							} else {
								self.channel[to].setmessageavail();
							}
						} else {
							tags.emotes = findEmoticons(self.sendingmessage, self.channelemotes[emotesets]);
							self.irc.emit("message", "", twauth.userinfo.name, to, self.sendingmessage, tags);
						}
						self.sendingmessage = "";

					});
				});

			}
		} else if(typeof(this.channelemotes[emotesets]) == "undefined") {

			https.get({
				"method": "GET", "host": "api.twitch.tv", "path": "/kraken/chat/emoticon_images?emotesets=" + emotesets,
				"headers": { "Accept": "application/vnd.twitchtv.v3+json", "Client-ID": encodeURIComponent(twauth.client_id) }
			}, function(resp){
				var data = "";
				resp.on("data", function(chunk){
					data += chunk;
				}).on("end", function(){

					self.channelemotes[emotesets] = JSON.parse(data);
					self.channel[to].setemotes(self.channelemotes[emotesets]);

				});
			});


		} else {

			this.channel[to].setemotes(this.channelemotes[emotesets]);

		}
	});

	this.irc.on("join", (user, to) => {
		if(to.substr(0, 1) == "#") to = to.substr(1);
		if(typeof(self.channel[to]) != "undefined" && self.channel[to] != null) {
			var badges = ""; var sort = 0;
			if(to == user) {
				if(typeof(this.channelbadges.broadcaster) != "undefined") {
					badges += "<img src=\"" + this.channelbadges.broadcaster.versions["1"].image_url_1x + "\" title=\"" + this.channelbadges.broadcaster.versions["1"].title + "\">";
				} else if(typeof(this.badges.broadcaster) != "undefined") {
					badges += "<img src=\"" + this.badges.broadcaster.versions["1"].image_url_1x + "\" title=\"" + this.badges.broadcaster.versions["1"].title + "\">";
				}
				sort += 99;
			}

			self.channel[to].joinusr({ "user": user, "sort": sort, "badges": badges, "name": user, "color": getColor(user) });
		}
	});
	this.irc.on("part", (user, to) => {
		if(to.substr(0, 1) == "#") to = to.substr(1);
		if(typeof(self.channel[to]) != "undefined" && self.channel[to] != null) {
			self.channel[to].partusr(user);
		}
	});
	this.irc.on("names", (to, users) => {
		if(to.substr(0, 1) == "#") to = to.substr(1);
		if(typeof(self.channel[to]) != "undefined" && self.channel[to] != null) {
			for(var i = 0; i < users.length; i++) {
				var user = users[i];
				var badges = ""; var sort = 0;
				if(to == user) {
					if(typeof(this.channelbadges.broadcaster) != "undefined") {
						badges += "<img src=\"" + this.channelbadges.broadcaster.versions["1"].image_url_1x + "\" title=\"" + this.channelbadges.broadcaster.versions["1"].title + "\">";
					} else if(typeof(this.badges.broadcaster) != "undefined") {
						badges += "<img src=\"" + this.badges.broadcaster.versions["1"].image_url_1x + "\" title=\"" + this.badges.broadcaster.versions["1"].title + "\">";
					}
					sort += 99;
				}

				self.channel[to].joinusr({ "user": user, "sort": sort, "badges": badges, "name": user, "color": getColor(user) });
			}
		}
	});

	this.irc.on("message", (prefix, user, to, msg, tags) => { self.showmsg(prefix, user, to, msg, tags); });
	this.irc.on("action", (prefix, user, to, msg, tags) => { self.showmsg(prefix, user, to, msg, tags, true); });
	this.irc.on("notice", (to, msg, tags) => {
		if(to.substr(0, 1) == "#") to = to.substr(1);
		self.channel[to].addmsg({ "timestamp": timestamp(), "badges": "", "display_name": "", "message": msg.replace(/\</g, "&lt;").replace(/\>/g, "&gt;"), "user": "_" + to, "color": "#777777", "action": true });
	});
	this.irc.on("usernotice", (to, tags) => {
		if(typeof(tags["system-msg"]) != "undefined") {
			var msg = tags["system-msg"].replace(/\\s/g, " ");
			self.channel[to].addmsg({ "timestamp": timestamp(), "badges": "", "display_name": "", "message": "<span style=\"font-weight:bold;\">" + msg.replace(/\</g, "&lt;").replace(/\>/g, "&gt;") + "</span>", "user": "_" + to, "color": "#777777", "action": true });
		}
	});

	this.irc.on("clearuser", (to, user) => {
		if(to.substr(0, 1) == "#") to = to.substr(1);
		if(typeof(self.channel[to]) != "undefined" && self.channel[to] != null) {
			self.channel[to].clearmsg(user);
		}
	});
	this.irc.on("clearchat", (to) => {
		if(to.substr(0, 1) == "#") to = to.substr(1);
		if(typeof(self.channel[to]) != "undefined" && self.channel[to] != null) {
			self.channel[to].clearmsg();
		}
	});
}

Chat.prototype.showmsg = function(prefix, user, to, msg, tags, action) {
	var self = this;
	if(typeof(tags) == "undefined") tags = [];
	if(to.substr(0, 1) == "#") to = to.substr(1);
	if(typeof(action) != "boolean") action = false;

	if(typeof(self.channel[to]) != "undefined" && self.channel[to] != null) {
		var display_name = user;
		if(typeof(tags["display-name"]) == "string" && tags["display-name"].length > 0) display_name = tags["display-name"];

		var color = "#000000";
		
		if(typeof(tags.color) == "string" && tags.color.length > 0)
			color = tags.color;
		else
			color = getColor(display_name);
		
		var emotes = "";
		if(typeof(tags.emotes) == "string") emotes = tags.emotes;
		msg = replaceEmoticons(msg, emotes);

		var badges = ""; var sort = 0;
		if(typeof(tags.badges) != "string") tags.badges = "";

		var bsplit = tags.badges.split(",");
		for(var i = 0; i < bsplit.length; i++) {
			if(bsplit[i].length <= 0) continue;
			var bver = bsplit[i].split("/");
			switch(bver[0]) {
				default: sort += 1; break;
				case "admin": sort += 100; break;
				case "broadcaster": sort += 99; break;
				case "global_mod": sort += 7; break;
				case "moderator": sort += 6; break;
				case "subscriber": sort += 3; break;
			}
			if(typeof(this.channelbadges[bver[0]]) != "undefined" && typeof(this.channelbadges[bver[0]].versions[bver[1]]) != "undefined") {
				badges += "<img src=\"" + this.channelbadges[bver[0]].versions[bver[1]].image_url_1x + "\" title=\"" + this.channelbadges[bver[0]].versions[bver[1]].title + "\">";
			} else if(typeof(this.badges[bver[0]]) != "undefined" && typeof(this.badges[bver[0]].versions[bver[1]]) != "undefined") {
				badges += "<img src=\"" + this.badges[bver[0]].versions[bver[1]].image_url_1x + "\" title=\"" + this.badges[bver[0]].versions[bver[1]].title + "\">";
			}
		}

		//console.log("addmsg", user, msg);
		self.channel[to].addmsg({ "timestamp": timestamp(), "badges": badges, "display_name": display_name, "message": msg, "user": user, "color": color, "action": action });

		//console.log("joinusr", user);
		self.channel[to].joinusr({ "user": user, "sort": sort, "badges": badges, "name": display_name, "color": color });
	}
}

Chat.prototype.join = function(channel) {
	var cel = document.querySelector("#channel_" + channel);
	if(cel != null) {
		var chattag = cel.querySelector("chat")._tag;
		this.channel[channel] = chattag.hookchat(this, channel);
		this.irc.join(channel);
	} else {
		console.log("You need to create the channel ui first.");
	}
}
Chat.prototype.part = function(channel, cb) {
	this.irc.part(channel, cb);
}

Chat.prototype.sendmsg = function(channel, message) {
	this.sendingmessage = message;
	this.irc.say(channel, message);
}

Chat.prototype.disconnect = function() {
	this.irc.disconnect();
}