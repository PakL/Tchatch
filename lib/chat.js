var parse = require('irc-message').parse;

var timestamp = function(){
	var d = new Date();
	return ((d.getHours() < 10) ? "0" : "")+d.getHours() + ":" + ((d.getMinutes() < 10) ? "0" : "")+d.getMinutes();
};
var scrolledToBottom = function() {
	var scrollbefore = $(document).scrollTop();
	$(document).scrollTop($(document).height());
	var scrollafter = $(document).scrollTop();

	$(document).scrollTop(scrollbefore);
	if(scrollafter == scrollbefore) {
		return true;
	}
	return false;
};
var replaceEmoticons = function(text, username, emotes){
	var replacings = [];
	var newtext = "";
	var textWoe = "";
	if(typeof(emotes) == "string") {
		var e = emotes.split("/");
		for(var i = 0; i < e.length; i++) {
			var splits = e[i].split(":", 2);
			if(splits.length == 2) {
				var eid = splits[0];
				var ranges = splits[1].split(",");
				for(var j = 0; j < ranges.length; j++) {
					var indexes = [];
					indexes = ranges[j].split("-", 2);
					if(indexes.length == 2)
						replacings.push({ "replaceWith": '<img src="http://static-cdn.jtvnw.net/emoticons/v1/'+eid+'/1.0" alt="{__NEEDLE__}" title="{__NEEDLE__}">', "start": parseInt(indexes[0]), "end": parseInt(indexes[1]) });
				}
			}
		}
		replacings.sort(function(a, b){
			return (a.start < b.start ? -1 : 1);
		});
		var lasti = 0;
		for(var i = 0; i < replacings.length; i++) {
			textWoe += text.substring(lasti, replacings[i].start);
			if(i > 0) console.log(lasti, " => ", replacings[i].start);
			lasti = (replacings[i].end+1);
		}
		textWoe += text.substring(lasti);
	} else {
		textWoe = text;
	}

	if(typeof(username) != "undefined") {
		var regex = new RegExp("(@"+username+")", "gi");
		var match = text.match(regex);
		if(match && textWoe.match(regex)) {
			gui.Window.get().requestAttention(3);
			var start = text.indexOf(match);
			var end = start+(match.length-1);
			replacings.push({ "replaceWith": '<span class="nick">'+match+'</span>', "start": start, "end": end });
		}
	}

	var highlights = loadHighlights();
	var highlightMessage = false;
	var highlightMessageCol = "";
	for(var i = 0; i < highlights.length; i++) {
		try {
			var regex = new RegExp(highlights[i].regex, "gi");
			if(textWoe.match(regex) && text.match(regex)) {
				gui.Window.get().requestAttention(1);
				switch(highlights[i].type) {
					case "1":
						var match = text.match(regex);
						var start = text.indexOf(match);
						var end = start+(match.length-1);
						replacings.push({ "replaceWith": '<span style="font-weight:bold;'+(highlights[i].color.length > 0 ? "color:"+highlights[i].color+";" : "")+'">'+match+'</span>', "start": start, "end": end });
						break;
					case "2":
						highlightMessage = true;
						highlightMessageCol = highlights[i].color;
						break;
				}
			}
		} catch(e) {}
	}

	text = text.replace(/(^|\s)(http(s?):\/\/([^ ]+))($|\s)/ig, "$1<a href=\"$2\" target=\"_external\">$2</a>$3");

	replacings.sort(function(a, b){
		return (a.start < b.start ? -1 : 1);
	});
	var lasti = 0;
	for(var i = 0; i < replacings.length; i++) {
		newtext += text.substring(lasti, replacings[i].start);
		if(i > 0) console.log(lasti, " => ", replacings[i].start);
		newtext += replacings[i].replaceWith.replace(/\{__NEEDLE__\}/g, text.substring(replacings[i].start, replacings[i].end+1));
		lasti = (replacings[i].end+1);
	}
	newtext += text.substring(lasti);
	text = newtext;

	//text = text.replace(/(([a-z0-9\-\.]{5,128})(\/([^ ]+)?)?)/ig, "<a href=\"http://$1\" target=\"_external\">$1</a>")
	if(highlightMessage)
		text = '<span style="font-weight:bold;'+(highlightMessageCol.length > 0 ? 'color:'+highlightMessageCol+';' : '')+'">'+text+'</span>';

	return text;
};
var getIcon = function(chat, channel, nick) {
	var icon = '';
	if(typeof(chat.mods[channel]) == "undefined") chat.mods[channel] = [];
	if(typeof(chat.subscribers[channel]) == "undefined") chat.subscribers[channel] = [];
	if(typeof(chat.badges[channel]) == "undefined") {
		if(chat.mods[channel].indexOf(nick) >= 0) icon = '<span class="icon-sword"></span> ';
		if(nick == channel) icon = '<span class="icon-video-camera"></span> ';
	} else {
		var b = chat.badges[channel];
		if(chat.mods[channel].indexOf(nick) >= 0) icon = '<img src="'+b.mod.image+'" style="height:18px;width:18px;" alt="mod"> ';
		if(chat.turbo.indexOf(nick) >= 0) icon = '<img src="'+b.turbo.image+'" style="height:18px;width:18px;" alt="turbo"> ';

		if(chat.subscribers[channel].indexOf(nick) >= 0 &&
			(typeof(b.subscriber) != "undefined" && b.subscriber != null) &&
			(typeof(b.subscriber.image) != "undefined" && b.subscriber.image != null)) {
			icon += '<img src="'+b.subscriber.image+'" style="height:18px;width:18px;" alt="subscriber"> '
		}

		if(nick == channel) icon = '<img src="'+b.broadcaster.image+'" style="height:18px;width:18px;" alt="broadcaster"> ';
	}
	return icon;
};
var defaultColors = [
	["Red", "#FF0000"],
	["Blue", "#0000FF"],
	["Green", "#00FF00"],
	["FireBrick", "#B22222"],
	["Coral", "#FF7F50"],
	["YellowGreen", "#9ACD32"],
	["OrangeRed", "#FF4500"],
	["SeaGreen", "#2E8B57"],
	["GoldenRod", "#DAA520"],
	["Chocolate", "#D2691E"],
	["CadetBlue", "#5F9EA0"],
	["DodgerBlue", "#1E90FF"],
	["HotPink", "#FF69B4"],
	["BlueViolet", "#8A2BE2"],
	["SpringGreen", "#00FF7F"]
];
var getColor = function(name) {
	var n = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
	return defaultColors[n % defaultColors.length][1];
}
var refreshing = false;
var doNotRefresh = false;
var refreshUserList = function(channel, chat){
	if(doNotRefresh) {
		if(!refreshing) {
			refreshing = true;
			window.setTimeout(function(){ doNotRefresh = false; refreshing = false; refreshUserList(channel, chat); }, 3000);
		}
	} else {
		var users = (typeof(chat.users[channel]) != "undefined" ? chat.users[channel] : []);
		var mods = (typeof(chat.mods[channel]) != "undefined" ? chat.mods[channel] : []);
		var colors = (typeof(chat.colors) != "undefined" ? chat.colors : []);

		var userlist = $("#"+channel+" .userlist");
		var list = '';

		users = users.sort(function(a, b){
			if(mods.indexOf(a) >= 0) {
				if(mods.indexOf(b) >= 0)
					return a.localeCompare(b);
				else
					return -1;
			} else if(mods.indexOf(b) >= 0) {
				return 1;
			}
			return a.localeCompare(b);
		});

		for(var i = 0; i < users.length; i++) {
			var u = users[i];
			if(chat.displayName.indexOf(u) >= 0) u = chat.displayName[u];
			var icon = getIcon(chat, channel, u);
			var c = getColor(u);
			if(typeof(colors[u]) != "undefined") c = colors[u];

			list += '<div style="color:'+c+'">'+icon+' '+u+'</div>';
		}
		userlist.html(list);
		doNotRefresh = true;
	}
};

var refreshStart = 0;
var autoRefreshStatus = function(chat) {
	refreshStart = Date.parse(new Date());
	var refresh = function(c, i){
		chat.refreshStatus(c[i], function(){
			if(i < c.length)
				refresh(c, (i+1));
			else {
				var end = Date.parse(new Date());
				var dif = (end-refreshStart);
				window.setTimeout(function(){
					autoRefreshStatus(chat);
				}, (60000-dif));
			}
		});
	};
	if(chat.channels.length > 0)
		refresh(chat.channels, 0);
	else {
		var end = Date.parse(new Date());
		var dif = (end-refreshStart);
		window.setTimeout(function(){
			autoRefreshStatus(chat);
		}, (60000-dif));
	}
};

var TwitchChat = (function(){
	function TwitchChat(userinfo, token) {
		this.userinfo = userinfo;
		this.token = token;
		this.channels = [];
		this.badges = [];

		this.users = [];
		this.mods = [];
		this.subwait = [];
		this.subscribers = [];

		this.colors = [];
		this.turbo = [];
		this.displayName = [];

		this.channelstatus = [];
		this.channelgame = [];
		this.channelviewers = [];

		var _this = this;
		this.irc = new irc.Client("irc.twitch.tv", userinfo.display_name, {
			"autoConnect": false,
			"floodProtection": false,
			"floodProtectionDelay": 20,
			"sasl": true,
			"userName": userinfo.name,
			"password": "oauth:"+token
		});
		this.irc.on("registered", function(msg){
			_this.irc.send("CAP REQ", "twitch.tv/membership");
			_this.irc.send("CAP REQ", "twitch.tv/commands");
			_this.irc.send("CAP REQ", "twitch.tv/tags");
			$("#status").text("Fertig.");
			$("#joinchannel").removeAttr("disabled").keyup(function(e){
				if(e.which == 13) {
					var channelname = $(this).val().toLowerCase().replace(/[^0-9a-z_]/ig, "");
					_this.join(channelname);
					$(this).val('');
				}
			});
			$("#joinbutton").click(function(){
				var channelname = $("#joinchannel").val().toLowerCase().replace(/[^0-9a-z_]/ig, "");
				_this.join(channelname);
				$("#joinchannel").val('');
			});
		});


		this.irc.on("join", function(channel, nick, msg){
			channel = channel.substr(1);

			if(typeof(_this.users[channel]) == "undefined") _this.users[channel] = [];
			if(_this.users[channel].indexOf(nick) < 0)
				_this.users[channel].push(nick);

			if(_this.users[channel].length > 100) return;

			var scrolltobottom = scrolledToBottom();
			if($("#"+channel).length) $("#"+channel).append($("<div />").addClass("message").addClass("server").html('['+timestamp()+'] <span class="nick">'+nick+'</span> ist dem Kanal beigetreten'));
			if($("#opentab"+channel).length) {
				if($("#opentab"+channel).parent().is(".active") && scrolltobottom) window.setTimeout(function(){ $(document).scrollTop($(document).height()); }, 0);
				else $("#opentab"+channel).css("font-weight", "bold");
			}

			refreshUserList(channel, _this);
		});
		this.irc.on("part", function(channel, nick, reason, msg){
			channel = channel.substr(1);

			if(typeof(_this.users[channel]) == "undefined") _this.users[channel] = [];
			var i = _this.users[channel].indexOf(nick);
			if(i >= 0)
				_this.users[channel].splice(i, 1);

			if(_this.users[channel].length > 100) return;

			var scrolltobottom = scrolledToBottom();
			if($("#"+channel).length) $("#"+channel).append($("<div />").addClass("message").addClass("server").html('['+timestamp()+'] <span class="nick">'+nick+'</span> hat den Kanal verlassen'));
			if($("#opentab"+channel).length) {
				if($("#opentab"+channel).parent().is(".active") && scrolltobottom) window.setTimeout(function(){ $(document).scrollTop($(document).height()); }, 0);
				else $("#opentab"+channel).css("font-weight", "bold");
			}

			refreshUserList(channel, _this);
		});
		this.irc.on("kick", function(channel, nick, by, reason, msg){
			channel = channel.substr(1);
			var scrolltobottom = scrolledToBottom();
			if($("#"+channel).length) $("#"+channel).append($("<div />").addClass("message").addClass("server").html('['+timestamp()+'] <span class="nick">'+nick+'</span> wurde von '+by+' aus dem Kanal geworfen ('+reason+')'));
			if($("#opentab"+channel).length) {
				if($("#opentab"+channel).parent().is(".active") && scrolltobottom) window.setTimeout(function(){ $(document).scrollTop($(document).height()); }, 0);
				else $("#opentab"+channel).css("font-weight", "bold");
			}
			if(typeof(_this.users[channel]) == "undefined") _this.users[channel] = [];
			var i = _this.users[channel].indexOf(nick);
			if(i >= 0)
				_this.users[channel].splice(i, 1);

			refreshUserList(channel, _this);
		});
		this.onuserstate = function(to, tags) {
			if(typeof(tags) == "undefined") tags = [];
			if(to.substr(0, 1) == "#") {
				to = to.substr(1);
				var nick = _this.userinfo.name;

				if(typeof(tags.color) == "string")
					_this.colors[nick] == tags.color;
				if(typeof(tags["display-name"]) == "string")
					_this.displayName[nick] = tags["display-name"];
				if(typeof(tags.turbo) == "string" && tags.turbo == "1" && _this.turbo.indexOf(nick) < 0)
					_this.turbo.push(nick);
				if(typeof(_this.subscribers[to]) == "undefined") _this.subscribers[to] = [];
				if(typeof(tags.subscriber) == "string" && tags.subscriber == "1" && _this.subscribers[to].indexOf(nick) < 0)
					_this.subscribers[to].push(nick);
				if(typeof(_this.mods[to]) == "undefined") _this.mods[to] = [];
				if(typeof(tags["user-type"]) == "string" && tags["user-type"] != "" && _this.mods[to].indexOf(nick) < 0)
					_this.mods[to].push(nick);
			}
		};
		this.onnotice = function(channel, text)  {
			channel = channel.substr(1);
			var scrolltobottom = scrolledToBottom();
			if($("#"+channel).length) $("#"+channel).append($("<div />").addClass("message").addClass("server").html('['+timestamp()+'] '+text));
			if($("#opentab"+channel).length) {
				if($("#opentab"+channel).parent().is(".active") && scrolltobottom) window.setTimeout(function(){ $(document).scrollTop($(document).height()); }, 0);
				else $("#opentab"+channel).css("font-weight", "bold");
			}
		};
		this.onmessage = function(nick, to, text, msg, tags){
			if(typeof(tags) == "undefined") tags = [];
			if(to.substr(0, 1) == "#") {
				to = to.substr(1);

				if(typeof(tags.color) == "string")
					_this.colors[nick] == tags.color;
				if(typeof(tags["display-name"]) == "string")
					_this.displayName[nick] = tags["display-name"];
				if(typeof(tags.turbo) == "string" && tags.turbo == "1" && _this.turbo.indexOf(nick) < 0)
					_this.turbo.push(nick);
				if(typeof(_this.subscribers[to]) == "undefined") _this.subscribers[to] = [];
				if(typeof(tags.subscriber) == "string" && tags.subscriber == "1" && _this.subscribers[to].indexOf(nick) < 0)
					_this.subscribers[to].push(nick);
				if(typeof(_this.mods[to]) == "undefined") _this.mods[to] = [];
				if(typeof(tags["user-type"]) == "string" && tags["user-type"] != "" && _this.mods[to].indexOf(nick) < 0)
					_this.mods[to].push(nick);

				var scrolltobottom = scrolledToBottom();
				if($("#"+to).length <= 0) _this.join(to, true);

				//TODO: Hier muss eine Lösung gegen XSS her...
				//text = text.replace(/\&/g, "&amp;").replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
				var icon = getIcon(_this, to, nick);
				var emotes = "";
				if(typeof(tags.emotes) == "string") emotes = tags.emotes;
				text = replaceEmoticons(text, _this.userinfo.name, emotes);
				var c = getColor(nick);
				if(typeof(_this.colors[nick]) != "undefined") c = _this.colors[nick];

				var displayname = nick;
				if(typeof(_this.displayName[nick]) == "string") displayname = _this.displayName[nick];
				$("#"+to).append($("<div />").addClass("message").html('['+timestamp()+'] '+icon+'<span class="nick" style="color:'+c+'">'+displayname+'</span>: '+text));
				if($("#opentab"+to).length) {
					if($("#opentab"+to).parent().is(".active") && scrolltobottom) window.setTimeout(function(){ $(document).scrollTop($(document).height()); }, 0);
					else $("#opentab"+to).css("font-weight", "bold");
				}

				if(typeof(_this.users[to]) == "undefined") _this.users[to] = [];
				if(_this.users[to].indexOf(nick) < 0) {
					_this.users[to].push(nick);
					refreshUserList(to, _this);
				}
			}
		};
		this.irc.on("message", _this.onmessage);
		this.irc.on("action", function(from, to, text, msg){
			if(to.substr(0, 1) == "#") { // Yep, it's a channel
				to = to.substr(1);
				var scrolltobottom = scrolledToBottom();
				if($("#"+to).length <= 0) _this.join(to, true);

				text = text.replace(/\&/g, "&amp;").replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
				var icon = getIcon(_this, to, from);
				text = replaceEmoticons(text, _this.userinfo.name);
				var c = getColor(from);
				if(typeof(_this.colors[from]) != "undefined") c = _this.colors[from];

				$("#"+to).append($("<div />").addClass("message").addClass("action").html('['+timestamp()+'] '+icon+'<span style="color:'+c+'"><span class="nick">'+from+'</span> '+text+'</span>'));
				if($("#opentab"+to).length) {
					if($("#opentab"+to).parent().is(".active") && scrolltobottom) window.setTimeout(function(){ $(document).scrollTop($(document).height()); }, 1);
					else $("#opentab"+to).css("font-weight", "bold");
				}

				if(typeof(_this.users[to]) == "undefined") _this.users[to] = [];
				if(_this.users[to].indexOf(from) < 0) {
					_this.users[to].push(from);
					refreshUserList(to, _this);
				}
			}
		});
		this.irc.on("names", function(channel, nicks){
			channel = channel.substr(1);
			var nn = [];
			$.each(nicks, function(index, val) {
				nn.push(index);
			});
			_this.users[channel] = nn;


			refreshUserList(channel, _this);
		});
		this.irc.on("+mode", function(channel, by, mode, argument, msg){
			channel = channel.substr(1);
			var scrolltobottom = scrolledToBottom();
			if($("#"+channel).length) $("#"+channel).append($("<div />").addClass("message").addClass("server").html('['+timestamp()+'] <span class="nick">'+by+'</span> schaltet +'+mode+' bei <span class="nick">'+msg.args[2]+'</span>'));
			if($("#opentab"+channel).length) {
				if($("#opentab"+channel).parent().is(".active") && scrolltobottom) window.setTimeout(function(){ $(document).scrollTop($(document).height()); }, 1);
				else $("#opentab"+channel).css("font-weight", "bold");
			}

			if(typeof(_this.mods[channel]) == "undefined") _this.mods[channel] = [];
			if(_this.mods[channel].indexOf(msg.args[2]) < 0) {
				_this.mods[channel].push(msg.args[2]);
			}

			refreshUserList(channel, _this);
		});
		this.irc.on("-mode", function(channel, by, mode, argument, msg){
			channel = channel.substr(1);
			var scrolltobottom = scrolledToBottom();
			if($("#"+channel).length) $("#"+channel).append($("<div />").addClass("message").addClass("server").html('['+timestamp()+'] <span class="nick">'+by+'</span> entfernt -'+mode+' bei <span class="nick">'+msg.args[2]+'</span>'));
			if($("#opentab"+channel).length) {
				if($("#opentab"+channel).parent().is(".active") && scrolltobottom) window.setTimeout(function(){ $(document).scrollTop($(document).height()); }, 1);
				else $("#opentab"+channel).css("font-weight", "bold");
			}

			if(typeof(_this.mods[channel]) == "undefined") _this.mods[channel] = [];
			var i = _this.mods[channel].indexOf(msg.args[2]);
			if(i >= 0)
				_this.mods[channel].splice(i, 1);

			refreshUserList(channel, _this);
		});



		this.irc.on("raw", function(msg){
			var pmsg = parse(msg.rawCommand+" :"+msg.args.join(" "));

			if(pmsg.command != "PRIVMSG") {
				var scrolltobottom = scrolledToBottom();
				$("#server").append($("<div />").addClass("message").html("["+timestamp()+"] "+msg.rawCommand+" :"+msg.args.join(" ")));
				if($("#opentabserver").parent().is(".active") && scrolltobottom) $(document).scrollTop($(document).height());
				//console.log(msg);
			}

			if(pmsg.command == "PRIVMSG" && pmsg.params[0].substr(0, 1) == "#") {
				var nick = pmsg.prefix.substr(0, pmsg.prefix.indexOf("!"));
				var to = pmsg.params[0];
				var text = pmsg.params[1];
				var tags = pmsg.tags;
				_this.onmessage(nick, to, text, msg, tags);
			} else if(pmsg.command == "USERSTATE") {
				var to = pmsg.params[0];
				_this.onuserstate(to, pmsg.tags);
			} else if(pmsg.command == "NOTICE") {
				var to = pmsg.params[0];
				var text = pmsg.params[1];
				_this.onnotice(to, text);
			}


			if(msg.command == "PRIVMSG") {
				if(msg.args[0].substr(0, 1) == "#") {
					var channel = msg.args[0].substr(1);
					var nick = msg.user;
					var i = _this.subwait.indexOf(nick);
					if(i >= 0) {
						if(typeof(_this.subscribers[channel]) == "undefined") _this.subscribers[channel] = [];
						if(_this.subscribers[channel].indexOf(nick) < 0)
							_this.subscribers[channel].push(nick);

						_this.subwait.splice(i, 1);
					}
				}
			}
		}).on("error", function(err){
			//console.log(err);
		});

		var waitasec = null;
		$(document).scroll(function(){
			if(waitasec != null) clearTimeout(waitasec);
			waitasec = window.setTimeout(function(){
				var activeChannel = $(".tab-title.active").children("a").get(0).getAttribute("controls");
				if(scrolledToBottom()) {
					$("#opentab"+activeChannel).css("font-weight", "normal");
				}
			}, 500);
		});

		$("#status").text("Verbinde zu IRC-Schnittstelle...");
		this.irc.connect();

		autoRefreshStatus(this);
	};
	TwitchChat.prototype.disconnect = function(cb){
		var _this = this;
		var arrpart = function(i) {
			if(i < _this.channels.length) {
				_this.part(_this.channels[i], function(){
					arrpart(i++);
				});
			} else {
				_this.irc.disconnect("Bye");
				_this.channels = [];
				cb();
			}
		};
		arrpart(0);
	};
	TwitchChat.prototype.part = function(channel, cb) {
		if(this.channels.indexOf(channel) < 0) return;
		var _this = this;
		this.irc.part("#"+channel, function(){
			var i = _this.channels.indexOf(channel);
			_this.channels.splice(i, 1);
			if($("#"+channel).length) {
				$("#opentabserver").click();
				$("#"+channel).remove();
				$("#opentab"+channel).parent().remove();
			}
			if(typeof(cb) != "undefined")
				cb();
		});
	};
	TwitchChat.prototype.join = function(channel, joined){
		if(typeof(joined) == "undefined") joined = false;
		channel = channel.toLowerCase();
		if(channel == "server" || channel == "start") return;
		if(this.channels.indexOf(channel) >= 0) return;
		this.channels.push(channel);

		this.channelstatus[channel] = "";
		this.channelgame[channel] = "";

		$("#opentabserver").parent().after('<li class="tab-title" role="presentational" ><a href="#'+channel+'" role="tab" tabindex="0" aria-selected="false" controls="'+channel+'" id="opentab'+channel+'">#'+channel+'</a></li>');
		$("#content").append('<section role="tabpanel" aria-hidden="true" class="content channel" id="'+channel+'"><div class="userlist"></div><input type="text" id="msg'+channel+'" class="postmessage" placeholder="Eine Nachricht senden"></section>');

		if(!joined) {
			this.irc.join("#"+channel);
			$("#opentab"+channel).click();
		}

		var _this = this;
		https.get({
			"method": "GET", "host": "api.twitch.tv", "path": "/kraken/chat/"+channel+"/badges",
			"headers": { "Accept": "application/vnd.twitchtv.v3+json" }
		}, function(resp){
			var data = "";
			resp.on("data", function(chunk){
				data += chunk;
			}).on("end", function(){
				if(resp.statusCode == 200) {
					var badges = JSON.parse(data);
					_this.badges[channel] = badges;
				}
			});
		});

		window.setTimeout(function(){
			$(window).resize();

			$("#msg"+channel).keyup(function(e){
				var c = $(this).attr("id").substr(3);
				if(e.which == 13) {
					var message = $(this).val();
					var eevent = "message";
					if(message.match(/^\/me /i)) {
						eevent = "action";
						message = message.substr(4);
						_this.irc.action("#"+c, message);
					} else {
						_this.irc.say("#"+c, message);
					}

					$(this).val('');

					if(eevent != "message" || message.substr(0, 1) != "/") {
						var n = _this.userinfo.name;
						_this.irc.emit(eevent, n, "#"+c, message, {
							prefix: n+"!"+n+"@"+n+".tmi.twitch.tv",
							nick: n,
							user: n,
							host: n+".tmi.twitch.tv",
							rawCommand: n+"!"+n+"@"+n+".tmi.twitch.tv PRIVMSG "+n+" "+message,
							command: "PRIVMSG",
							commandType: "normal",
							args: [n, message]
						});
					}
				}
			});
			$("#opentab"+channel).click(function(e){
				var c = $(this).attr("id").substr(7);
				if(e.which == 2) {
					_this.part(c);
					e.preventDefault();
					return false;
				}
			});
		}, 1);
	};
	TwitchChat.prototype.refreshStatus = function(channel, cb){
		var _this = this;
		https.get({
			"method": "GET", "host": "api.twitch.tv", "path": "/kraken/streams/"+channel,
			"headers": { "Accept": "application/vnd.twitchtv.v3+json" }
		}, function(resp){
			var data = "";
			resp.on("data", function(chunk){
				data += chunk;
			}).on("end", function(){
				var streamdata = JSON.parse(data);
				if(resp.statusCode == 200 && streamdata.stream != null) {
					_this.channelstatus[channel] = streamdata.stream.channel.status;
					_this.channelgame[channel] = streamdata.stream.game;
					_this.channelviewers[channel] = streamdata.stream.viewers;
				} else {
					if(typeof(_this.channelstatus[channel]) == "undefined") {
						_this.channelstatus[channel] = "";
						_this.channelgame[channel] = "Channel ist offline";
					}
					_this.channelviewers[channel] = 0;
				}
				for(var i = 0; i < openwindows.length; i++) {
					if(typeof(openwindows[i].window.getChannelName) != "undefined") {
						var wc = openwindows[i].window.getChannelName();
						if(wc == channel) {
							openwindows[i].window.newViewerData({
								status: _this.channelstatus[wc],
								game: _this.channelgame[wc],
								viewers: _this.channelviewers[wc]
							});
						}
					}
				}

				var opentab = $(".tab-title.active").children("a").get(0).getAttribute("controls");
				if(opentab == channel) {
					$("#channel_status").text(_this.channelstatus[channel]).show();
					$("#channel_game").text(_this.channelgame[channel]).show();
					$("#channel_viewers").text(_this.channelviewers[channel]).show();
					$(window).resize();
				}
				if(typeof(cb) != "undefined") cb();
			});
		});
	};
	return TwitchChat;
})();