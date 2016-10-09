let timestamp = function(){
	var d = new Date();
	return ((d.getHours() < 10) ? "0" : "")+d.getHours() + ":" + ((d.getMinutes() < 10) ? "0" : "")+d.getMinutes();
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

var findEmoticons = function(text, emoticons){
	var emotestring = "";
	if(typeof(emoticons) !== "undefined" && emoticons != null) {
		for(set in emoticons.emoticon_sets) {
			if(!emoticons.emoticon_sets.hasOwnProperty(set)) continue;
			for(var i = 0; i < emoticons.emoticon_sets[set].length; i++) {
				var e = emoticons.emoticon_sets[set][i];

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
		}
		emotestring = emotestring.substr(1);
	}
	return emotestring;
};
var replaceEmoticons = function(text, emotes){
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

	//if(typeof(username) != "undefined") {
	/*	var regex = new RegExp("(@[a-z0-9_-]+)", "gi");
		var match = text.match(regex);
		if(match !== null) match = match[0];
		if(match && textWoe.match(regex)) {
			gui.Window.get().requestAttention(3);
			var start = text.indexOf(match);
			var end = start+(match.length-1);
			replacings.push({ "replaceWith": '<span class="nick">{__NEEDLE__}</span>', "start": start, "end": end });
		}*/
	//}

	/*var highlights = loadHighlights();
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
	}*/

	var regex = new RegExp('(^|\\s)(http(s?):\/\/([^ ]+))($|\\s)', 'ig');
	while(match = regex.exec(text)) {
		replacings.push({ "replaceWith": match[1] + "<a href=\"" + match[2] + "\" target=\"_blank\">" + match[2] + "</a>" + match[5], "start": match.index, "end": (match.index-1)+match[0].length });
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
	newtext += text.substring(lasti).replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
	text = newtext;

	//text = text.replace(/(([a-z0-9\-\.]{5,128})(\/([^ ]+)?)?)/ig, "<a href=\"http://$1\" target=\"_external\">$1</a>")
	/*if(highlightMessage)
		text = '<span style="font-weight:bold;'+(highlightMessageCol.length > 0 ? 'color:'+highlightMessageCol+';' : '')+'">'+text+'</span>';*/

	return text;
};