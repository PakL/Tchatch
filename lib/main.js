var gui = require("nw.gui");
var http = require("http");
var https = require("https");
var fs = require("fs");
var util = require("util");

var chat = null;
var emoticons = null;
var oldtab = "start";

var w = gui.Window.get();
w.on("close", function(){
	var _this = this;
	if(chat != null) {
		chat.disconnect(function(){
			chat = null;
			_this.hide();
			nw.App.closeAllWindows();
		});
	} else {
		this.hide();
		this.close(true);
	}
});

var openwindows = [];
var addopenwindow = function(w) {
	w.on("closed", function(){
		var i = openwindows.indexOf(this);
		if(i >= 0) openwindows.splice(i, 1);
	});
	openwindows.push(w);
};

var loadEmoticons = function() {
	$("#status").text(getTranslation("loading_emoticons"));
	https.get({
		"method": "GET", "host": "api.twitch.tv", "path": "/kraken/chat/emoticon_images",
		"headers": { "Accept": "application/vnd.twitchtv.v3+json", "Client-ID": encodeURIComponent(client_id) }
	}, function(resp){
		var data = "";
		resp.on("data", function(chunk){
			data += chunk;
			$("#status").text(getTranslation("loading_emoticons"));
		}).on("end", function(){
			if(resp.statusCode == 200) {
				fs.writeFile(gui.App.dataPath+"/emoticon_images.json", data, function (err) {
					if(!err) {
						emoticons = JSON.parse(data);
						$("#status").text(getTranslation("done"));
					} else {
						$("#status").text(getTranslation("error_loading_emoticons"));
						console.log(err);
					}
				});
			} else {
				$("#status").text(getTranslation("error_loading_emoticons"));
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
	var panel = $("#checkforupdate").text(getTranslation("searching_update")).unbind();
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
			if(newest.tag_name == ("v"+gui.App.manifest.version)) {
				panel.text(getTranslation("version_up_to_date")).click(checkforupdate);
			} else {
				panel.text(util.format(getTranslation("new_version_available"), newest.tag_name)+": ");
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
	$(document).delegate(".nick", "mouseup", function(e){
		var nick = $(this).text();
		var opentab = $(".tabs-title.is-active").children("a").get(0).getAttribute("controls");
		if(opentab != "start" && opentab != "server" && chat != null) {
			if(e.which == 1) {
				$("#msg"+opentab).val("@"+nick+": "+$("#msg"+opentab).val()).focus();
			} else if(e.which == 3) {
				var menu = new gui.Menu();
				var mi_nick = new gui.MenuItem({ label: nick, click: function(){ chat.join(nick); } });
				menu.append(mi_nick);
				var mi_whisper = new gui.MenuItem({ label: getTranslation("start_whisper"), click: function(){ chat.joinWhisper(nick); } });
				menu.append(mi_whisper);

				if(chat.isModeratorIn(opentab)) {
					var mi_sep = new gui.MenuItem({ type: "separator" });
					menu.append(mi_sep);

					var menu_timeouts = new gui.Menu();
					var	mit_five = new gui.MenuItem({ label: getTranslation("timeout_five"), click: function(){ chat.sendMessage(opentab, "/timeout "+nick+" 300"); } });
					menu_timeouts.append(mit_five);
					var	mit_ten = new gui.MenuItem({ label: getTranslation("timeout_ten"), click: function(){ chat.sendMessage(opentab, "/timeout "+nick+" 600"); } });
					menu_timeouts.append(mit_ten);
					var	mit_twenty = new gui.MenuItem({ label: getTranslation("timeout_twenty"), click: function(){ chat.sendMessage(opentab, "/timeout "+nick+" 1200"); } });
					menu_timeouts.append(mit_twenty);
					var	mit_thirty = new gui.MenuItem({ label: getTranslation("timeout_thirty"), click: function(){ chat.sendMessage(opentab, "/timeout "+nick+" 1800"); } });
					menu_timeouts.append(mit_thirty);
					var	mit_clear = new gui.MenuItem({ label: getTranslation("timeout_clear"), click: function(){  chat.sendMessage(opentab, "/timeout "+nick+" 1"); } });
					menu_timeouts.append(mit_clear);

					var mi_timeout = new gui.MenuItem({ label: getTranslation("timeout"), click: function(){  chat.sendMessage(opentab, "/timeout "+nick+" 600"); }, submenu: menu_timeouts });
					var mi_ban = new gui.MenuItem({ label: getTranslation("ban"), click: function(){ chat.sendMessage(opentab, "/ban "+nick); } });

					menu.append(mi_timeout);
					menu.append(mi_ban);
				}
				menu.popup(e.clientX, e.clientY);
			}
		} else if(opentab == "start") {
			$(document).scrollTop(0);
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
			var css = "<link rel=\"stylesheet\" type=\"text/css\" href=\"/style/dark.css\">";
			for(var i = 0; i < openwindows.length; i++) {
				$(openwindows[i].window.document).find("head").append(css);
			}
			$("head").append(css);
			global.localStorage.darktheme = "true";
		} else {
			for(var i = 0; i < openwindows.length; i++) {
				$(openwindows[i].window.document).find("link").each(function(){
					if($(this).attr("href") == "/style/dark.css") $(this).remove();
				});
			}
			$("link").each(function(){
				if($(this).attr("href") == "/style/dark.css")
					$(this).remove();
			});
			global.localStorage.darktheme = "false";
		}
	});
	if(typeof(global.localStorage.darktheme) != "undefined") {
		if(global.localStorage.darktheme == "true") {
			$("#darkswitcher").attr("checked", "checked").change();
		}
	}

	$("#historyswitch").change(function(){
		var c = $(this).is(":checked");
		if(c) {
			global.localStorage.history = "true";
		} else {
			global.localStorage.history = "false";
		}
	});
	if(typeof(global.localStorage.history) == "undefined") {
		global.localStorage.history = "false";
	} else {
		if(global.localStorage.history == "true") {
			$("#historyswitch").attr("checked", "checked").change();
		}
	}
	$("#openhistory").click(function(){
		gui.Shell.openItem("file://" + gui.App.dataPath+"/history/");
	});
	try {
		fs.accessSync(gui.App.dataPath+"/history/");
	} catch(e){
		fs.mkdirSync(gui.App.dataPath+"/history/");
	}


	$("#showservermsgswitch").change(function(){
		var c = $(this).is(":checked");
		if(c) {
			global.localStorage.showservermsgs = "true";
		} else {
			global.localStorage.showservermsgs = "false";
		}
	});
	if(typeof(global.localStorage.showservermsgs) == "undefined") {
		global.localStorage.showservermsgs = "true";
	}
	if(global.localStorage.showservermsgs == "true") {
		$("#showservermsgswitch").attr("checked", "checked").change();
	}

	$("#clearchatswitch").change(function(){
		var c = $(this).is(":checked");
		if(c) {
			global.localStorage.clearchat = "true";
		} else {
			global.localStorage.clearchat = "false";
		}
	});
	if(typeof(global.localStorage.clearchat) == "undefined") {
		global.localStorage.clearchat = "true";
	}
	if(global.localStorage.clearchat == "true") {
		$("#clearchatswitch").attr("checked", "checked").change();
	}

	$("#navigation a").click(function(e){
		if(e.which == 2) {
			e.preventDefault();
			return false;
		}
	});
	$("#navigation").on('change.zf.tabs', function (event, tab) {
		var opentab = $(tab).children("a").get(0).getAttribute("controls");
		if(oldtab == opentab) return;
		var isuser = $(tab).is(".user");
		$("#showstream, #popoutstream, #openmanager").addClass("disabled").unbind();
		$("#channel_status,#channel_game,#channel_viewers").text("").hide();
		if(opentab != "start") {
			if(opentab != "server" && !isuser) {
				$("#showstream").removeClass("disabled").click(function(){
					var activetab = $(".tabs-title.is-active").children("a").get(0).getAttribute("controls");
					if($("#"+activetab).children("iframe").length) {
						$("#"+activetab).children("iframe").remove();
						$("#"+activetab).css("margin-top", "0");
					} else {
						$("#"+activetab).prepend('<iframe frameborder="0" scrolling="no" nwdisable nwfaketop src="http://player.twitch.tv/?channel='+activetab+'"></iframe>');
						$("#"+activetab).css("margin-top", "378px");
					}
					$(window).resize();
				});
				$("#openmanager").removeClass("disabled").click(function(){
					var activetab = $(".tabs-title.is-active").children("a").get(0).getAttribute("controls");
					if(activetab == "server" || activetab == "start") {
						if(typeof(userinfo.name) != "undefined") {
							activetab = userinfo.name;
						} else {
							return;
						}
					}
					gui.Window.open("windows/channelmgr.html?channel="+activetab+"&token="+token, { position: 'center', width: 1040, height: 570, icon: "icon.png" }, function(w){
						w.on("loaded", function(){
							if(typeof(global.localStorage.darktheme) != "undefined") {
								if(global.localStorage.darktheme == "true") {
									$(w.window.document).find("head").append("<link rel=\"stylesheet\" type=\"text/css\" href=\"app://./style/dark.css\">");

								}
							}
							chat.refreshStatus(activetab);
						});
						addopenwindow(w, false);
					});
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

		$("#status").text(getTranslation("done"));
	});

	if(require('os').type() == "Linux") {
		$("#showstream,#popoutstream").hide();
	}

	if(typeof(global.localStorage.lastAuth) != "undefined")
		twitchAuth(global.localStorage.lastAuth);
	else {
		$("#start").prepend("<br>").prepend($("<a />").attr("id", "loginlink").addClass("button").html(util.format(getTranslation("login_with_twitch"), '<span class="icon-twitch"></span>')).click(startlogin));
		$("#server").append($("<div />").addClass("message").html("["+timestamp()+"] > "+getTranslation("please_login")));
		$("#status").text(getTranslation("please_login"));
	}

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
