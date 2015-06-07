var gui = require("nw.gui");
var irc = require("irc");
var http = require("http");
var https = require("https");
var fs = require("fs");

var chat = null;
var emoticons = null;
var oldtab = "start";

var w = gui.Window.get();
w.on("close", function(){
	var _this = this;
	if(chat != null) {
		chat.disconnect(function(){
			_this.hide();
			_this.close(true);
		});
	} else {
		_this.hide();
		_this.close(true);
	}
});

var loadEmoticons = function() {
	$("#status").text("Lade Emoticons...");
	https.get({
		"method": "GET",
		"host": "api.twitch.tv",
		"path": "/kraken/chat/emoticons",
		"headers": {
			"Accept": "application/vnd.twitchtv.v3+json"
		}
	}, function(resp){
		var data = "";
		resp.on("data", function(chunk){
			data += chunk;
			$("#status").text("Lade Emoticons...");
		}).on("end", function(){
			if(resp.statusCode == 200) {
				fs.writeFile(gui.App.dataPath+"/emoticons.json", data, function (err) {
					if(!err) {
						emoticons = JSON.parse(data);
						$("#status").text("Fertig.");
					} else {
						$("#status").text("Fehler beim Speichern der Emoticons.");
						console.log(err);
					}
				});
			} else {
				$("#status").text("Fehler beim Speichern der Emoticons.");
				console.log(data);
			}
		});
	})
}

$(document).ready(function(){
	$(document).delegate("a", "click", function(e){
		if($(this).attr("target") == "_external") {
			gui.Shell.openExternal($(this).attr("href"));
			e.preventDefault();
			return false;
		}
	});
	$(window).resize(function(){
		$("body").css("margin-top", $("#navigation").outerHeight());
		$(".userlist").css("top", $("#navigation").outerHeight());
		$(".channel iframe").css("top", $("#navigation").outerHeight());
	});
	$(window).resize();

	$("#status").text("Fertig.");

	$("#navigation").on('toggled', function (event, tab) {
		var opentab = $(tab).children("a").get(0).getAttribute("controls");
		if(oldtab == opentab) return;
		if(opentab != "start") {
			$(document).scrollTop($(document).height());
			if(opentab != "server") {
				$("#showstream").removeClass("disabled").click(function(){
					var activetab = $(".tab-title.active").children("a").get(0).getAttribute("controls");
					if($("#"+activetab).children("iframe").length) {
						$("#"+activetab).children("iframe").remove();
						$("#"+activetab).css("margin-top", "0");
					} else {
						$("#"+activetab).prepend('<iframe frameborder="0" scrolling="no" nwdisable nwfaketop src="http://www-cdn.jtvnw.net/swflibs/TwitchPlayer.swf?channel='+activetab+'"></iframe>');
						$("#"+activetab).css("margin-top", "378px");
					}
					$(window).resize();
				});
				$("#popoutstream").removeClass("disabled").click(function(){
					var activetab = $(".tab-title.active").children("a").get(0).getAttribute("controls");
					if($("#"+activetab).children("iframe").length) {
						$("#"+activetab).children("iframe").remove();
						$("#"+activetab).css("margin-top", "0");
						$(window).resize();
					}
					
					gui.Window.open("channelpopout.html?channel="+activetab, { position: 'center', width: 620, height: 378, toolbar: false });
				});
			} else {
				$("#showstream, #popoutstream").addClass("disabled").unbind('click');
			}
		} else {
			$("#showstream, #popoutstream").addClass("disabled").unbind('click');
		}
		oldtab = opentab;
	});

	if(typeof(localStorage.lastAuth) != "undefined")
		twitchAuth(localStorage.lastAuth);
	else
		$("#start").append($("<a />").attr("id", "loginlink").addClass("button").html('Über <span class="icon-twitch"></span> einloggen').click(startlogin));

	if(fs.existsSync(gui.App.dataPath+"/emoticons.json")) {
		fs.readFile(gui.App.dataPath+"/emoticons.json", function(err, data){
			if(err) console.log(err);
			if(typeof(data) != "undefined" && data != null && data.length > 0) {
				emoticons = JSON.parse(data);
				//console.log(emoticons);
			} else {
				loadEmoticons();
			}
		});
	} else {
		loadEmoticons();
	}
});