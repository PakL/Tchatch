var timestamp = function(){
	var d = new Date();
	return ((d.getHours() < 10) ? "0" : "")+d.getHours() + ":" + ((d.getMinutes() < 10) ? "0" : "")+d.getMinutes();
};

var scrolledToBottom = true;
$(document).scroll(function(e){
	var maxScroll = $(document).height() - $(window).height();
	if($(document).scrollTop() >= maxScroll) {
		scrolledToBottom = true;
		var activeChannel = $(".tabs-title.is-active").children("a").get(0).getAttribute("controls");
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

	var regex = new RegExp('(^|\\s)(http(s?):\/\/([^ ]+))($|\\s)', 'ig');
	while(match = regex.exec(text)) {
		replacings.push({ "replaceWith": match[1] + "<a href=\"" + match[2] + "\" target=\"_external\">" + match[2] + "</a>" + match[5], "start": match.index, "end": (match.index-1)+match[0].length });
	}

	replacings.sort(function(a, b){
		return (a.start < b.start ? -1 : 1);
	});

	var replacingsdump = replacings;
	replacings = [];
	for(var i = 0; i < replacingsdump.length; i++) {
		var overlaps = false;
		for(var j = 0; j < replacings.length; j++) {
			if((replacingsdump[i].start > replacings[j].start && replacingsdump[i].start < replacings[j].end) || (replacingsdump[i].end > replacings[j].start && replacingsdump[i].end < replacings[j].end)) {
				console.log('Overlapping shit');
				overlaps = true;
				break;
			} 
		}
		if(!overlaps) replacings.push(replacingsdump[i]);
	}

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
	var refresh = false;

	if(typeof(tags.color) == "string" && tags.color.length > 0) {
		chat.colors[nick] = tags.color;
		if(typeof(chat.colors[nick]) != "string" || chat.colors[nick] != tags.color) refresh = true;
	}

	if(typeof(tags["display-name"]) == "string" && tags["display-name"].length > 0) {
		chat.displayName[nick] = tags["display-name"];
		if(typeof(chat.displayName[nick]) != "string" || chat.displayName[nick] != tags["display-name"]) refresh = true;
	}

	if(typeof(tags.turbo) == "string" && tags.turbo == "1" && chat.turbo.indexOf(nick) < 0) {
		chat.turbo.push(nick);
		refresh = true;
	}

	if(typeof(channel) == "string") {
		if(typeof(chat.subscribers[channel]) == "undefined") chat.subscribers[channel] = [];
		if(typeof(tags.subscriber) == "string" && tags.subscriber == "1" && chat.subscribers[channel].indexOf(nick) < 0) {
			chat.subscribers[channel].push(nick);
			refresh = true;
		}

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

		if(refresh) refreshUserList(channel, chat);
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
		while($("#"+channel + " > .message").length > 200) {
			$("#"+channel + " > .message:first").remove();
		}
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