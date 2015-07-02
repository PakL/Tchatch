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
		"method": "GET", "host": "api.twitch.tv", "path": "/kraken/chat/emoticon_images",
		"headers": { "Accept": "application/vnd.twitchtv.v3+json", "Client-ID": encodeURIComponent(client_id) }
	}, function(resp){
		var data = "";
		resp.on("data", function(chunk){
			data += chunk;
			$("#status").text("Lade Emoticons...");
		}).on("end", function(){
			if(resp.statusCode == 200) {
				fs.writeFile(gui.App.dataPath+"/emoticon_images.json", data, function (err) {
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
			}
		});
	})
};

var compareVersions = function(v1, v2) {
	if(v1 == v2) return 0;
	var split1 = v1.split(".");
	var split2 = v2.split(".");
	if(split1.length == split2.length) {
		if(parseInt(split1[0]) == parseInt(split2[0])) {
			if(parseInt(split1[1]) == parseInt(split2[1])) {
					if(parseInt(split1[2]) == parseInt(split2[2])) {
						return 0;
					} else {
						return (parseInt(split1[2]) > parseInt(split2[2])) ? 1 : -1;
					}
			} else {
				return (parseInt(split1[1]) > parseInt(split2[1])) ? 1 : -1;
			}
		} else {
			return (parseInt(split1[0]) > parseInt(split2[0])) ? 1 : -1;
		}
	} else {
		return 0;
	}
};
var checkforupdate = function() {
	var panel = $("#checkforupdate").text('Suche nach Updates...').unbind();
	https.get({
		"method": "GET", "host": "api.github.com", "path": "/repos/PakL/Tchatch/releases",
		"headers": { "User-Agent": "Tchatch v"+gui.App.manifest.version+" github.com/PakL/Tchatch" }
	}, function(resp){
		var data = "";
		resp.on("data", function(chunk){
			data += chunk;
		}).on("end", function(){
			var releases = JSON.parse(data);
			var newest = { "tag_name": "v"+gui.App.manifest.version };
			for(var i = 0; i < releases.length; i++) {
				var release = releases[i];
				var tag = release.tag_name.substr(1);
				if(compareVersions(tag, newest.tag_name.substr(1)) > 0) {
					newest = release;
				}
			}
			console.log(newest.tag_name, "<>", "v"+gui.App.manifest.version);
			if(newest.tag_name == ("v"+gui.App.manifest.version)) {
				panel.text('Dein Tchatch ist aktuell. Hier klicken um nach neuen Versionen zu suchen.').click(checkforupdate);
			} else {
				panel.text('Neue Version '+newest.tag_name+" verfügbar: ");
				if(typeof(newest.assets) != "undefined") {
					for(var i = 0; i < newest.assets.length; i++) {
						var asset = newest.assets[i];
						panel.append($("<a />").text(asset.name).attr("href", asset.browser_download_url).attr("target", "_external")).append(" ");
					}
				}
			}
		});
	});
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

	$("#historyswitch").change(function(){
		var c = $(this).is(":checked");
		if(c) {
			localStorage.history = "true";
		} else {
			localStorage.history = "false";
		}
	});
	if(typeof(localStorage.history) == "undefined") {
		localStorage.history = "false";
	} else {
		if(localStorage.history == "true") {
			$("#historyswitch").attr("checked", "checked").change();
		}
	}
	$("#openhistory").click(function(){
		gui.Shell.openExternal("file://"+gui.App.dataPath+"/history/");
	});
	try {
		fs.accessSync(gui.App.dataPath+"/history/");
	} catch(e){
		fs.mkdirSync(gui.App.dataPath+"/history/");
	}

	$("#status").text("Fertig.");

	$("#navigation").on('toggled', function (event, tab) {
		var opentab = $(tab).children("a").get(0).getAttribute("controls");
		if(oldtab == opentab) return;
		$("#showstream, #popoutstream, #openmanager").addClass("disabled").unbind();
		$("#channel_status,#channel_game,#channel_viewers").text("").hide();
		if(opentab != "start") {
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

					var w = gui.Window.open("windows/channelpopout.html?channel="+activetab, { position: 'center', width: 620, height: 378, toolbar: false, icon: "icon.png" });

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
					var w = gui.Window.open("windows/channelmgr.html?channel="+activetab+"&token="+token, { position: 'center', width: 1040, height: 570, toolbar: false, icon: "icon.png" });
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
			setTimeout(function(){ $(document).scrollTop($(document).height()); }, 0);
		}
		$(window).resize();
		oldtab = opentab;
	});

	if(require('os').type() == "Linux") {
		$("#showstream,#popoutstream").hide();
	}

	if(typeof(localStorage.lastAuth) != "undefined")
		twitchAuth(localStorage.lastAuth);
	else
		$("#start").append($("<a />").attr("id", "loginlink").addClass("button").html('Über <span class="icon-twitch"></span> einloggen').click(startlogin));

	if(fs.existsSync(gui.App.dataPath+"/emoticon_images.json")) {
		fs.readFile(gui.App.dataPath+"/emoticon_images.json", function(err, data){
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

	checkforupdate();
});
