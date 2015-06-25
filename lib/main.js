var gui = require("nw.gui");
var irc = require("irc");
var http = require("http");
var https = require("https");
var fs = require("fs");

var chat = null;
var emoticons = null;
var oldtab = "start";

var openwindows = [];

var w = gui.Window.get();
w.on("close", function(){
	for(var i = 0; i < openwindows.length; i++) {
		openwindows[i].close();
	}
	openwindows = [];

	var _this = this;
	if(chat != null) {
		chat.disconnect(function(){
			_this.hide();
			_this.close(true);
		});
	} else {
		this.hide();
		this.close(true);
	}
});

var addopenwindow = function(w) {
	w.on("closed", function(){
		var i = openwindows.indexOf(this);
		if(i >= 0) openwindows.splice(i, 1);
	});
	openwindows.push(w);
};

var loadEmoticons = function() {
	$("#status").text("Lade Emoticons...");
	https.get({
		"method": "GET", "host": "api.twitch.tv", "path": "/kraken/chat/emoticons",
		"headers": { "Accept": "application/vnd.twitchtv.v3+json", "Client-ID": encodeURIComponent(client_id) }
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
};

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

	$("#darkswitcher").change(function(){
		var c = $(this).is(":checked");
		if(c) {
			var css = "<link rel=\"stylesheet\" type=\"text/css\" href=\"app://./style/dark.css\">";
			for(var i = 0; i < openwindows.length; i++) {
				$(openwindows[i].window.document).find("head").append(css);
			}
			$("head").append(css);
			localStorage.darktheme = "true";
		} else {
			for(var i = 0; i < openwindows.length; i++) {
				$(openwindows[i].window.document).find("link").each(function(){
					if($(this).attr("href") == "app://./style/dark.css") $(this).remove();
				});
			}
			$("link").each(function(){
				if($(this).attr("href") == "app://./style/dark.css")
					$(this).remove();
			});
			localStorage.darktheme = "false";
		}
	});
	if(typeof(localStorage.darktheme) != "undefined") {
		if(localStorage.darktheme == "true") {
			$("#darkswitcher").attr("checked", "checked").change();
		}
	}

	$("#status").text("Fertig.");

	$("#navigation").on('toggled', function (event, tab) {
		var opentab = $(tab).children("a").get(0).getAttribute("controls");
		if(oldtab == opentab) return;
		$("#showstream, #popoutstream, #openmanager").addClass("disabled").unbind();
		$("#channel_status,#channel_game,#channel_viewers").text("").hide();
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
					
					var w = gui.Window.open("windows/channelpopout.html?channel="+activetab, { position: 'center', width: 620, height: 378, toolbar: false });

					addopenwindow(w, false);
				});
				$("#openmanager").removeClass("disabled").click(function(){
					var activetab = $(".tab-title.active").children("a").get(0).getAttribute("controls");
					if(activetab == "server" || activetab == "start") {
						if(typeof(userinfo.name) != "undefined") {
							activetab = userinfo.name;
						} else {
							return;
						}
					}
					var w = gui.Window.open("windows/channelmgr.html?channel="+activetab+"&token="+token, { position: 'center', width: 1040, height: 570, toolbar: false });
					w.on("loaded", function(){
						if(typeof(localStorage.darktheme) != "undefined") {
							if(localStorage.darktheme == "true") {
								$(w.window.document).find("head").append("<link rel=\"stylesheet\" type=\"text/css\" href=\"app://./style/dark.css\">");

							}
						}
						chat.refreshStatus(activetab);
					});
					addopenwindow(w, false);
				});
				$("#channel_status").text(chat.channelstatus[opentab]).show();
				$("#channel_game").text(chat.channelgame[opentab]).show();
				$("#channel_viewers").text(chat.channelviewers[opentab]).show();
				chat.refreshStatus(opentab);
			}
		}
		$(window).resize();
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