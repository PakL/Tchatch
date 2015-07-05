var RandExp = require('randexp');

var timestamp = function(){
	var d = new Date();
	return ((d.getHours() < 10) ? "0" : "")+d.getHours() + ":" + ((d.getMinutes() < 10) ? "0" : "")+d.getMinutes();
};

var scrolledToBottom = true;
$(document).scroll(function(e){
	var maxScroll = $(document).height() - $(window).height();
	if($(document).scrollTop() >= maxScroll) {
		scrolledToBottom = true;
		var activeChannel = $(".tab-title.active").children("a").get(0).getAttribute("controls");
		if(scrolledToBottom) {
			$("#opentab"+activeChannel).css("font-weight", "normal");
		}
	}
	else scrolledToBottom = false;
});


var findEmoticons = function(text){
	var emotestring = "";
	if(typeof(emoticons) !== "undefined" && emoticons != null) {
		for(var i = 0; i < emoticons.emoticons.length; i++) {
			var e = emoticons.emoticons[i];
			if(e.emoticon_set != null && e.emoticon_set != 0) continue; //TODO: Für Turbo-Nutzer müssen noch andere Emoticon-Sets unterstützt werden

			var regex = new RegExp("(\\s|^)("+e.code.replace("\\&lt\\;", "<").replace("\\&gt\\;", ">")+")($|\\s)", "g");
			var matched = false;
			while(match = regex.exec(text)) {
				if(!matched) {
					emotestring += "/"+e.id+":";
					matched = true;
				}
				regex.lastIndex = match.index+1;
				var ni = -1;

				var start = match.index;
				if(match[1].length > 0) start++;
				var end = start+match[2].length-1;
				ni = end+1;
				emotestring += start+"-"+end+",";
			}
			if(matched)
				emotestring = emotestring.substr(0, emotestring.length-1);
		}
		emotestring = emotestring.substr(1);
	}
	return emotestring;
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
			lasti = (replacings[i].end+1);
		}
		textWoe += text.substring(lasti);
	} else {
		textWoe = text;
	}

	if(typeof(username) != "undefined") {
		var regex = new RegExp("(@"+username+")", "gi");
		var match = text.match(regex);
		if(match !== null) match = match[0];
		if(match && textWoe.match(regex)) {
			gui.Window.get().requestAttention(3);
			var start = text.indexOf(match);
			var end = start+(match.length-1);
			replacings.push({ "replaceWith": '<span class="nick">{__NEEDLE__}</span>', "start": start, "end": end });
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
						if(match !== null) match = match[0];
						var start = text.indexOf(match);
						var end = start+(match.length-1);
						replacings.push({ "replaceWith": '<span style="font-weight:bold;'+(highlights[i].color.length > 0 ? "color:"+highlights[i].color+";" : "")+'">{__NEEDLE__}</span>', "start": start, "end": end });
						break;
					case "2":
						highlightMessage = true;
						highlightMessageCol = highlights[i].color;
						break;
				}
			}
		} catch(e) {}
	}

	text = text.replace(/(^|\s)(http(s?):\/\/([^ ]+))($|\s)/ig, "$1<a href=\"$2\" target=\"_external\">$2</a>$5");

	replacings.sort(function(a, b){
		return (a.start < b.start ? -1 : 1);
	});
	var lasti = 0;
	for(var i = 0; i < replacings.length; i++) {
		newtext += text.substring(lasti, replacings[i].start).replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
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
var manageTags = function(chat, tags, nick, channel) {
	if(typeof(tags.color) == "string" && tags.color.length > 0)
		chat.colors[nick] == tags.color;

	if(typeof(tags["display-name"]) == "string" && tags["display-name"].length > 0)
		chat.displayName[nick] = tags["display-name"];

	if(typeof(tags.turbo) == "string" && tags.turbo == "1" && chat.turbo.indexOf(nick) < 0)
		chat.turbo.push(nick);

	if(typeof(chat.subscribers[channel]) == "undefined") chat.subscribers[channel] = [];
	if(typeof(tags.subscriber) == "string" && tags.subscriber == "1" && chat.subscribers[channel].indexOf(nick) < 0)
		chat.subscribers[channel].push(nick);

	if(typeof(chat.mods[channel]) == "undefined") chat.mods[channel] = [];
	if(typeof(chat.global_mod[channel]) == "undefined") chat.global_mod[channel] = [];
	if(typeof(chat.admin[channel]) == "undefined") chat.admin[channel] = [];
	if(typeof(chat.staff[channel]) == "undefined") chat.staff[channel] = [];
	if(typeof(tags["user-type"]) == "string" && tags["user-type"].length > 0) {
		if(chat.mods[channel].indexOf(nick) < 0) chat.mods[channel].splice(chat.mods[channel].indexOf(nick), 1);
		if(chat.global_mod[channel].indexOf(nick) < 0) chat.global_mod[channel].splice(chat.global_mod[channel].indexOf(nick), 1);
		if(chat.admin[channel].indexOf(nick) < 0) chat.admin[channel].splice(chat.admin[channel].indexOf(nick), 1);
		if(chat.staff[channel].indexOf(nick) < 0) chat.staff[channel].splice(chat.staff[channel].indexOf(nick), 1);

		if(tags["user-type"] == "mod") chat.mods[channel].push(nick);
		if(tags["user-type"] == "global_mod" && chat.global_mod[channel].indexOf(nick) < 0) chat.global_mod[channel].push(nick);
		if(tags["user-type"] == "admin" && chat.admin[channel].indexOf(nick) < 0) chat.admin[channel].push(nick);
		if(tags["user-type"] == "staff" && chat.staff[channel].indexOf(nick) < 0) chat.staff[channel].push(nick);
	}
};
var getIcon = function(chat, channel, nick) {
	var icon = '';
	if(typeof(chat.mods[channel]) == "undefined") chat.mods[channel] = [];
	if(typeof(chat.global_mod[channel]) == "undefined") chat.global_mod[channel] = [];
	if(typeof(chat.admin[channel]) == "undefined") chat.admin[channel] = [];
	if(typeof(chat.staff[channel]) == "undefined") chat.staff[channel] = [];
	if(typeof(chat.subscribers[channel]) == "undefined") chat.subscribers[channel] = [];

	if(typeof(chat.badges[channel]) == "undefined") {
		if(chat.mods[channel].indexOf(nick) >= 0) icon = '<span class="icon-sword"></span>';
		if(nick == channel) icon = '<span class="icon-video-camera"></span>';
	} else {
		var b = chat.badges[channel];
		if(chat.mods[channel].indexOf(nick) >= 0) icon = '<img src="'+b.mod.image+'" style="height:18px;width:18px;" alt="mod">';
		if(chat.global_mod[channel].indexOf(nick) >= 0) icon = '<img src="'+b.global_mod.image+'" style="height:18px;width:18px;" alt="global_mod">';
		if(chat.admin[channel].indexOf(nick) >= 0) icon = '<img src="'+b.admin.image+'" style="height:18px;width:18px;" alt="admin">';
		if(chat.staff[channel].indexOf(nick) >= 0) icon = '<img src="'+b.staff.image+'" style="height:18px;width:18px;" alt="staff">';


		if(chat.turbo.indexOf(nick) >= 0) icon += '<img src="'+b.turbo.image+'" style="height:18px;width:18px;" alt="turbo">';

		if(chat.subscribers[channel].indexOf(nick) >= 0 &&
			(typeof(b.subscriber) != "undefined" && b.subscriber != null) &&
			(typeof(b.subscriber.image) != "undefined" && b.subscriber.image != null)) {
			icon += '<img src="'+b.subscriber.image+'" style="height:18px;width:18px;" alt="subscriber">'
		}

		if(nick == channel) icon = '<img src="'+b.broadcaster.image+'" style="height:18px;width:18px;" alt="broadcaster">';
	}
	icon += " ";
	return icon;
};
var appendToChannel = function(chat, channel, html) {
	if($("#"+channel).length) {
		$("#"+channel).append(html);
		if(typeof(global.localStorage.history) != "undefined" && global.localStorage.history == "true")
			fs.appendFile(chat.historyfile[channel], html);
	}
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
var refreshNextTime = false;
var doNotRefresh = false;
var refreshUserList = function(channel, chat){
	if(doNotRefresh) {
		refreshNextTime = true;
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
			var disNam = u;
			if(typeof(chat.displayName[u]) == "string") disNam = chat.displayName[u];
			var icon = getIcon(chat, channel, u);
			var c = getColor(disNam);
			if(typeof(colors[u]) != "undefined") c = colors[u];

			list += '<div style="color:'+c+'">'+icon+' <span class="nick">'+disNam+'</div></div>';
		}
		userlist.html(list);
		doNotRefresh = true;
		window.setTimeout(function(){
			doNotRefresh = false;
			if(refreshNextTime) {
				refreshNextTime = false;
				refreshUserList(channel, chat);
			}
		}, 3000);
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

var Chat = (function(){
	function Chat(userinfo, token) {
		this.userinfo = userinfo;
		this.token = token;
		this.channels = [];
		this.badges = [];

		this.users = [];
		this.mods = [];
		this.global_mod = [];
		this.admin = [];
		this.staff = [];
		this.subwait = [];
		this.subscribers = [];

		this.colors = [];
		this.turbo = [];
		this.displayName = [];

		this.channelstatus = [];
		this.channelgame = [];
		this.channelviewers = [];

		this.historyfile = [];

		var _this = this;
		this.irc = new TwitchChat({ host: "irc.twitch.tv" });
		this.irc.on("connect", function(connection){
			if(connection.connected) {
				_this.irc.auth(_this.userinfo.name, _this.token);
			}
		});
		this.irc.on("registered", function(){
			$("#status").text(getTranslation("done"));
		});
		this.irc.on("motd", function(){
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
			if(typeof(global.localStorage.reopen) != "undefined") {
				var reopen = JSON.parse(global.localStorage.reopen);
				for(var i = 0; i < reopen.length; i++)
					_this.join(reopen[i]);
			}
		});


		this.irc.on("join", function(nick, channel){
			channel = channel.substr(1);

			if(typeof(_this.users[channel]) == "undefined") _this.users[channel] = [];
			if(_this.users[channel].indexOf(nick) < 0)
				_this.users[channel].push(nick);

			if(_this.users[channel].length > 100) return;

			var appending = $("<div />").addClass("message").addClass("server").html('['+timestamp()+'] '+util.format(getTranslation("joined_channel"), '<span class="nick">'+nick+'</span>'));
			appendToChannel(_this, channel, appending.prop('outerHTML'));

			refreshUserList(channel, _this);
		});
		this.irc.on("part", function(nick, channel){
			channel = channel.substr(1);

			if(typeof(_this.users[channel]) == "undefined") _this.users[channel] = [];
			var i = _this.users[channel].indexOf(nick);
			if(i >= 0)
				_this.users[channel].splice(i, 1);

			if(_this.users[channel].length > 100) return;

			var appending = $("<div />").addClass("message").addClass("server").html('['+timestamp()+'] '+util.format(getTranslation("part_channel"), '<span class="nick">'+nick+'</span>'));
			appendToChannel(_this, channel, appending.prop('outerHTML'));

			refreshUserList(channel, _this);
		});
		this.onuserstate = function(to, tags) {
			if(typeof(tags) == "undefined") tags = [];
			if(to.substr(0, 1) == "#") {
				to = to.substr(1);
				var nick = _this.userinfo.name;

				manageTags(_this, tags, nick, to);
			}
		};
		this.irc.on("userstate", _this.onuserstate);
		this.onnotice = function(channel, text, tags)  {
			channel = channel.substr(1);
			if(typeof(tags["msg-id"]) == "string") {
				var trans = getTranslation("notice_"+tags["msg-id"]);
				if(trans.substr(0, 14) != "MISSING_LANG::") {
					if(tags["msg-id"] == "slow_on") {
						var m = text.match(/^This room is now in slow mode\. You may send messages every ([0-9]+) seconds\.$/);
						trans = util.format(trans, m[1]);
					}
					if(tags["msg-id"] == "host_on") {
						var m = text.match(/^Now hosting (.*?)\.$/);
						trans = util.format(trans, '<a onclick="chat.join(\''+m[1]+'\');">'+m[1]+'</a>');
					}
					text = trans;
				}
			}
			var appending = $("<div />").addClass("message").addClass("server").html('['+timestamp()+'] '+text);
			appendToChannel(_this, channel, appending.prop('outerHTML'));
		};
		this.onmessage = function(prefix, nick, to, text, tags){
			if(typeof(tags) == "undefined") tags = [];
			if(to.substr(0, 1) == "#") {
				to = to.substr(1);

				manageTags(_this, tags, nick, to);

				if($("#"+to).length <= 0) _this.join(to, true);

				var icon = getIcon(_this, to, nick);
				var emotes = "";
				if(typeof(tags.emotes) == "string") emotes = tags.emotes;
				text = replaceEmoticons(text, _this.userinfo.name, emotes);

				var displayname = nick;
				if(typeof(_this.displayName[nick]) == "string") displayname = _this.displayName[nick];

				var c = getColor(displayname);
				if(typeof(_this.colors[nick]) != "undefined") c = _this.colors[nick];

				$("#opentab"+to).css("font-weight", "bold");
				var appending = $("<div />").addClass("message").html('['+timestamp()+'] '+icon+'<span class="nick by" style="color:'+c+'">'+displayname+'</span>: <span class="dmsg">'+text+'</span>');
				appendToChannel(_this, to, appending.prop('outerHTML'));


				if(typeof(_this.users[to]) == "undefined") _this.users[to] = [];
				if(_this.users[to].indexOf(nick) < 0) {
					_this.users[to].push(nick);
					refreshUserList(to, _this);
				}
			}
		};

		this.onaction = function(prefix, nick, to, text, tags){
			if(typeof(tags) == "undefined") tags = [];
			if(to.substr(0, 1) == "#") { // Yep, it's a channel
				to = to.substr(1);

				manageTags(_this, tags, nick, to);

				if($("#"+to).length <= 0) _this.join(to, true);

				text = text.replace(/\&/g, "&amp;").replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
				var icon = getIcon(_this, to, nick);
				var emotes = "";
				if(typeof(tags.emotes) == "string") emotes = tags.emotes;
				text = replaceEmoticons(text, _this.userinfo.name, emotes);

				var displayname = nick;
				if(typeof(_this.displayName[nick]) == "string") displayname = _this.displayName[nick];

				var c = getColor(displayname);
				if(typeof(_this.colors[nick]) != "undefined") c = _this.colors[nick];

				$("#opentab"+to).css("font-weight", "bold");
				var appending = $("<div />").addClass("message").addClass("action").html('['+timestamp()+'] '+icon+'<span style="color:'+c+'"><span class="nick by">'+displayname+'</span> <span class="dmsg">'+text+'</span></span>');
				appendToChannel(_this, to, appending.prop('outerHTML'));

				if(typeof(_this.users[to]) == "undefined") _this.users[to] = [];
				if(_this.users[to].indexOf(nick) < 0) {
					_this.users[to].push(nick);
					refreshUserList(to, _this);
				}
			}
		}

		this.irc.on("message", _this.onmessage);
		this.irc.on("action", _this.onaction);
		this.irc.on("notice", _this.onnotice);
		this.irc.on("names", function(channel, nicks){
			channel = channel.substr(1);
			_this.users[channel] = nicks;

			refreshUserList(channel, _this);
		});
		this.irc.on("mode+", function(channel, mode, nick){
			channel = channel.substr(1);
			var appending = $("<div />").addClass("message").addClass("server").html('['+timestamp()+'] '+util.format(getTranslation("got_mod"), '<span class="nick">'+nick+'</span>'));
			appendToChannel(_this, channel, appending.prop('outerHTML'));

			if(typeof(_this.users[channel]) == "undefined") _this.users[channel] = [];
			if(_this.users[channel].indexOf(nick) < 0)
				_this.users[channel].push(nick);

			if(typeof(_this.mods[channel]) == "undefined") _this.mods[channel] = [];
			if(_this.mods[channel].indexOf(nick) < 0) {
				_this.mods[channel].push(nick);
			}

			refreshUserList(channel, _this);
		});
		this.irc.on("mode-", function(channel, mode, nick){
			channel = channel.substr(1);
			var appending = $("<div />").addClass("message").addClass("server").html('['+timestamp()+'] '+util.format(getTranslation("remove_mod"), '<span class="nick">'+nick+'</span>'));
			appendToChannel(_this, channel, appending.prop('outerHTML'));

			if(typeof(_this.users[channel]) == "undefined") _this.users[channel] = [];
			if(_this.users[channel].indexOf(nick) < 0)
				_this.users[channel].push(nick);

			if(typeof(_this.mods[channel]) == "undefined") _this.mods[channel] = [];
			var i = _this.mods[channel].indexOf(nick);
			if(i >= 0)
				_this.mods[channel].splice(i, 1);

			refreshUserList(channel, _this);
		});

		this.irc.on("clearuser", function(channel, user){
			var channel = channel.substr(1);
			if(global.localStorage.clearchat == "true") {
				$("#"+channel).find(".message .nick.by").each(function(){
					var n = $(this).text();
					if(n.toLowerCase() == user.toLowerCase()) {
						$(this).parent().find(".dmsg").addClass("server").text(getTranslation("message_deleted"));
					}
				});
			}
		});
		this.irc.on("clearchat", function(channel, user){
			var channel = channel.substr(1);
			if(global.localStorage.clearchat == "true") {
				$("#"+channel).find(".message").remove();
			}
		});



		this.irc.on("incoming", function(msg){
			if(!msg.match(/ PRIVMSG #/)) {
				var scrolltobottom = scrolledToBottom;
				$("#server").append($("<div />").addClass("message").html("["+timestamp()+"] > "+msg));
				if($("#opentabserver").parent().is(".active") && scrolltobottom) $(document).scrollTop($(document).height());
			}
		})
		this.irc.on("outgoing", function(msg){
			var scrolltobottom = scrolledToBottom;
			$("#server").append($("<div />").addClass("message").html("["+timestamp()+"] < "+msg));
			if($("#opentabserver").parent().is(".active") && scrolltobottom) $(document).scrollTop($(document).height());
		});
		this.irc.on("error", function(err){
			//console.log(err);
		});

		$("#status").text(getTranslation("connection_to_irc"));

		autoRefreshStatus(this);
	};
	Chat.prototype.disconnect = function(cb){
		var _this = this;

		global.localStorage.reopen = JSON.stringify(_this.channels);
		var arrpart = function(i) {
			if(i < _this.channels.length) {
				_this.part(_this.channels[i], function(){
					arrpart(i++);
				});
			} else {
				_this.irc.disconnect();
				_this.channels = [];
				cb();
			}
		};
		arrpart(0);
	};
	Chat.prototype.part = function(channel, cb) {
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
	Chat.prototype.join = function(channel, joined){
		if(typeof(joined) == "undefined") joined = false;
		channel = channel.toLowerCase();
		if(channel.length <= 0) return;
		if(channel == "server" || channel == "start") return;
		if(this.channels.indexOf(channel) >= 0) return;
		this.channels.push(channel);

		this.channelstatus[channel] = "";
		this.channelgame[channel] = "";

		this.historyfile[channel] = gui.App.dataPath+"/history/"+channel+"."+Date.parse(new Date())+".html";

		$("#opentabserver").parent().after('<li class="tab-title" role="presentational" ><a href="#'+channel+'" role="tab" tabindex="0" aria-selected="false" controls="'+channel+'" id="opentab'+channel+'">#'+channel+'</a></li>');
		$("#content").append('<section role="tabpanel" aria-hidden="true" class="content channel" id="'+channel+'"><div class="userlist"></div><input type="text" id="msg'+channel+'" class="postmessage" placeholder="'+getTranslation("send_a_message")+'"><a class="emoticonbtn" id="emote'+channel+'"><span class="icon-smile"></span></a><div class="emoticons" id="emotes'+channel+'"></div></section>');


		$("#"+channel).bind("DOMSubtreeModified", function(){
			if($("#opentab"+channel).length) {
				if($("#opentab"+channel).parent().is(".active") && scrolledToBottom) {
					$(document).scrollTop($(document).height());
					$("img").load(function(){ $(this).unbind(); $(document).scrollTop($(document).height()); });
				}
			}
		});
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

		var _this = this;
		https.get({
			"method": "GET", "host": "api.twitch.tv", "path": "/kraken/chat/"+channel+"/emoticons",
			"headers": { "Accept": "application/vnd.twitchtv.v3+json" }
		}, function(resp){
			var data = "";
			resp.on("data", function(chunk){
				data += chunk;
			}).on("end", function(){
				if(resp.statusCode == 200) {
					var e = JSON.parse(data);
					for(var i = 0; i < e.emoticons.length; i++) {
						$("#emotes"+channel).append($("<a />").css("background-image", "url("+e.emoticons[i].url+")").attr("data-code", e.emoticons[i].regex).attr("title", new RandExp(e.emoticons[i].regex).gen()));
					}
					$("#emote"+channel).click(function(){
						$("#emotes"+channel).toggle();
					});
					$("#emotes"+channel+" a").click(function(){
						$("#msg"+channel).val($("#msg"+channel).val()+" "+new RandExp($(this).attr("data-code").replace("\\&lt\\;", "<").replace("\\&gt\\;", ">")).gen()).focus();
					});
					$(document).foundation('tooltip', 'reflow');
				}
			});
		});

		window.setTimeout(function(){
			$(window).resize();

			$("#msg"+channel).keyup(function(e){
				var c = $(this).attr("id").substr(3);
				if(e.which == 13) {
					$("#emotes"+c).hide();

					var message = $(this).val();
					$(this).val('');
					_this.sendMessage(c, message);
				}
			});
			$("#opentab"+channel).mouseup(function(e){
				var c = $(this).attr("id").substr(7);
				if(e.which == 2) {
					_this.part(c);
					e.preventDefault();
					return false;
				} else if(e.which == 3) {
					var menu = new gui.Menu();
					var mi_close = new gui.MenuItem({ label: getTranslation("close_channel"), click: function(){ _this.part(c); } });
					menu.append(mi_close);
					menu.popup(e.clientX, e.clientY);

					e.preventDefault();
					return false;
				}
			});
		}, 1);
	};
	Chat.prototype.refreshStatus = function(channel, cb){
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
						_this.channelgame[channel] = getTranslation("channel_offline");
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
	Chat.prototype.sendMessage = function(channel, message) {
		if(typeof(channel) != "string" || typeof(message) != "string") return;
		if(channel.length <= 0 || message.length <= 0) return;

		var eevent = "message";
		this.irc.say("#"+channel, message);
		if(message.match(/^\/me /i)) {
			eevent = "action";
			message = message.substr(4);
		}

		if(eevent != "message" || message.substr(0, 1) != "/") {
			var emotes = findEmoticons(message);
			var n = this.userinfo.name;
			if(eevent == "action") {
				this.onaction({}, n, "#"+channel, message, {"emotes": emotes});
			} else {
				this.onmessage({}, n, "#"+channel, message, {"emotes": emotes});
			}
		}
	};
	Chat.prototype.isModeratorIn = function(channel) {
		if(channel == this.userinfo.name) return true;
		if(chat.mods.hasOwnProperty(channel) && chat.mods[channel].indexOf(this.userinfo.name) >= 0) return true;
		if(chat.global_mod.hasOwnProperty(channel) && chat.global_mod[channel].indexOf(this.userinfo.name) >= 0) return true;
		if(chat.admin.hasOwnProperty(channel) && chat.admin[channel].indexOf(this.userinfo.name) >= 0) return true;
		if(chat.staff.hasOwnProperty(channel) && chat.staff[channel].indexOf(this.userinfo.name) >= 0) return true;
		return false;
	};

	return Chat;
})();