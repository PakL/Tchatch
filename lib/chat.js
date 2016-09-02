var RandExp = require('randexp');

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
		this.mutationobserver = [];

		var _this = this;
		this.irc = new TwitchChat();
		this.irc.on("connect", function(){
			_this.irc.auth(_this.userinfo.name, _this.token);
		});
		this.irc.on("registered", function(){
			$("#status").text(getTranslation("done"));
			/*_this.whisperirc = new TwitchChat({ host: "199.9.253.119" });
			_this.whisperirc.on("connect", function(){
				_this.whisperirc.auth(_this.userinfo.name, _this.token);
				_this.whisperirc.on("capack", function(){
					var scrolltobottom = scrolledToBottom;
					$("#server").append($("<div />").addClass("message").html("["+timestamp()+"] > "+getTranslation("you_can_whisper_now")));
					if($("#opentabserver").parent().is(".is-active") && scrolltobottom) $(document).scrollTop($(document).height());
				});
				_this.whisperirc.on("whisper", _this.onwhisper);
			});*/
		});
		this.irc.on("capack", function(){
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

				$(".postmessage").removeAttr("disabled");
			}
		});

		this.irc.on("close", function(){
			global.localStorage.reopen = JSON.stringify(_this.channels);
			$("#joinchannel").attr("disabled", "disabled");
			$(".postmessage").attr("disabled", "disabled");

			_this.users = [];
			_this.mods = [];
			_this.global_mod = [];
			_this.admin = [];
			_this.staff = [];
			_this.subwait = [];
			_this.subscribers = [];
		});


		this.irc.on("join", function(nick, channel){
			channel = channel.substr(1);

			if(typeof(_this.users[channel]) == "undefined") _this.users[channel] = [];
			if(_this.users[channel].indexOf(nick) < 0)
				_this.users[channel].push(nick);

			if(_this.users[channel].length > 100) return;

			var appending = $("<div />").addClass("message").addClass("server").html('['+timestamp()+'] '+util.format(getTranslation("joined_channel"), '<span class="nick">'+nick+'</span>'));
			if(global.localStorage.showservermsgs == "true") {
				appendToChannel(_this, channel, appending.prop('outerHTML'));
			}

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
			if(global.localStorage.showservermsgs == "true") {
				appendToChannel(_this, channel, appending.prop('outerHTML'));
			}

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
		this.onwhisper = function(prefix, nick, to, text, tags){
			if(typeof(tags) == "undefined") tags = [];

			manageTags(_this, tags, nick);

			if($("#usr_"+to).length <= 0) _this.joinWhisper(to);

			text = text.replace(/\&/g, "&amp;").replace(/\</g, "&lt;").replace(/\>/g, "&gt;");
			var emotes = "";
			if(typeof(tags.emotes) == "string") emotes = tags.emotes;
			text = replaceEmoticons(text, _this.userinfo.name, emotes);

			var displayname = nick;
			if(typeof(_this.displayName[nick]) == "string") displayname = _this.displayName[nick];

			var c = getColor(displayname);
			if(typeof(_this.colors[nick]) != "undefined") c = _this.colors[nick];

			$("#opentabusr_"+to).css("font-weight", "bold");
			var appending = $("<div />").addClass("message").addClass("action").html('['+timestamp()+'] <span class="nick" style="color:'+c+'">'+displayname+'</span>: '+text+'</span>');
			appendToChannel(_this, "usr_"+to, appending.prop('outerHTML'));
		}
		
		this.irc.on("whisper", _this.onwhisper);

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
			if(global.localStorage.showservermsgs == "true") {
				appendToChannel(_this, channel, appending.prop('outerHTML'));
			}

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
			if(global.localStorage.showservermsgs == "true") {
				appendToChannel(_this, channel, appending.prop('outerHTML'));
			}

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
						var dmsg = $(this).parent().find(".dmsg");
						var hidden = $("<span />").css("display", "none").html(dmsg.html());
						var deletemsg = $("<span />").addClass("del").text(getTranslation("message_deleted"));
						dmsg.addClass("server")
							.html(deletemsg)
							.append(hidden)
							.mouseenter(function(){ $(this).find("span").hide().not(".del").show(); })
							.mouseleave(function(){ $(this).find("span").hide();$(this).find(".del").show(); });
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
				if($("#opentabserver").parent().is(".is-active") && scrolltobottom) $(document).scrollTop($(document).height());
			}
		})
		this.irc.on("outgoing", function(msg){
			var scrolltobottom = scrolledToBottom;
			$("#server").append($("<div />").addClass("message").html("["+timestamp()+"] < "+msg));
			if($("#opentabserver").parent().is(".is-active") && scrolltobottom) $(document).scrollTop($(document).height());
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
				if(typeof(_this.whisperirc) != "undefined")
					_this.whisperirc.disconnect();
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
				_this.mutationobserver[channel].disconnect();
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

		$("#opentabserver").parent().after('<li class="tabs-title" role="presentational" ><a href="#'+channel+'" role="tab" tabindex="0" aria-selected="false" controls="'+channel+'" id="opentab'+channel+'">#'+channel+'</a></li>');
		$("#content").append('<section role="tabpanel" aria-hidden="true" class="tabs-panel content channel" id="'+channel+'"><div class="userlist"></div><input type="text" id="msg'+channel+'" class="postmessage" placeholder="'+getTranslation("send_a_message")+'"><a class="emoticonbtn" id="emote'+channel+'"><span class="icon-smile"></span></a><div class="emoticons" id="emotes'+channel+'"></div></section>');


		this.mutationobserver[channel] = new MutationObserver(function(mutations){
			if($("#opentab"+channel).length) {
				if($("#opentab"+channel).parent().is(".is-active") && scrolledToBottom) {
					$(document).scrollTop($(document).height());
					$("img").load(function(){ $(this).unbind(); $(document).scrollTop($(document).height()); });
				}
			}
		});
		this.mutationobserver[channel].observe($("#"+channel).get(0), {childList: true});

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
					Foundation.reInit('tooltip');
				}
			});
		});

		Foundation.reInit('tabs');

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
			$("#opentab"+channel).click(function(e){
				if(e.which == 2) {
					e.preventDefault();
					return false;
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

	Chat.prototype.joinWhisper = function(user){
		user = user.toLowerCase();
		if(user.length <= 0) return;
		if($("#usr_"+user).length > 0) return;

		$("#opentabserver").parent().after('<li class="tabs-title user" role="presentational" ><a href="#usr_'+user+'" role="tab" tabindex="0" aria-selected="false" controls="usr_'+user+'" id="opentabusr_'+user+'">@'+user+'</a></li>');
		$("#content").append('<section role="tabpanel" aria-hidden="true" class="tabs-panel content channel user" id="usr_'+user+'"><input type="text" id="msgusr_'+user+'" class="postmessage user" placeholder="'+getTranslation("send_a_message")+'"><a class="emoticonbtn user" id="emoteusr_'+user+'"><span class="icon-smile"></span></a><div class="emoticons user" id="emotesusr_'+user+'"></div></section>');


		this.mutationobserver["usr_"+user] = new MutationObserver(function(mutations){
			if($("#opentabusr_"+user).length) {
				if($("#opentabusr_"+user).parent().is(".is-active") && scrolledToBottom) {
					$(document).scrollTop($(document).height());
					$("img").load(function(){ $(this).unbind(); $(document).scrollTop($(document).height()); });
				}
			}
		});
		this.mutationobserver["usr_"+user].observe($("#usr_"+user).get(0), {childList: true});

		var _this = this;
		https.get({
			"method": "GET", "host": "api.twitch.tv", "path": "/kraken/chat/"+user+"/emoticons",
			"headers": { "Accept": "application/vnd.twitchtv.v3+json" }
		}, function(resp){
			var data = "";
			resp.on("data", function(chunk){
				data += chunk;
			}).on("end", function(){
				if(resp.statusCode == 200) {
					var e = JSON.parse(data);
					for(var i = 0; i < e.emoticons.length; i++) {
						$("#emotesusr_"+user).append($("<a />").css("background-image", "url("+e.emoticons[i].url+")").attr("data-code", e.emoticons[i].regex).attr("title", new RandExp(e.emoticons[i].regex).gen()));
					}
					$("#emoteusr_"+user).click(function(){
						$("#emotesusr_"+user).toggle();
					});
					$("#emotesusr_"+user+" a").click(function(){
						$("#msgusr_"+user).val($("#msgusr_"+user).val()+" "+new RandExp($(this).attr("data-code").replace("\\&lt\\;", "<").replace("\\&gt\\;", ">")).gen()).focus();
					});
					Foundation.reInit('tooltip');
				}
			});
		});

		
		Foundation.reInit('tabs');

		window.setTimeout(function(){
			$(window).resize();

			$("#msgusr_"+user).keyup(function(e){
				var c = $(this).attr("id").substr(7);
				if(e.which == 13) {
					$("#emotesusr_"+c).hide();

					var message = $(this).val();
					$(this).val('');
					_this.sendWhisper(c, message);
				}
			});
			$("#opentabusr_"+user).mouseup(function(e){
				var c = $(this).attr("id").substr(11);
				if(e.which == 2) {
					$("#opentabserver").click();
					$("#usr_"+c).remove();
					$("#opentabusr_"+c).parent().remove();
					e.preventDefault();
					return false;
				} else if(e.which == 3) {
					var menu = new gui.Menu();
					var mi_close = new gui.MenuItem({ label: getTranslation("close_channel"), click: function(){
						$("#opentabserver").click();
						$("#usr_"+c).remove();
						$("#opentabusr_"+c).parent().remove();
					} });
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

				var opentab = $(".tabs-title.is-active").children("a").get(0).getAttribute("controls");
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

		if(message.substr(0, 3) == "/w ") {
			var message = message.substr(3);
			var to = message.substring(0, message.indexOf(" "));
			var msg = message.substring(message.indexOf(" ")+1);
			this.sendWhisper(to, msg);
			return;
		}

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
	Chat.prototype.sendWhisper = function(to, message) {
		if(typeof(to) != "string" || typeof(message) != "string") return;
		if(to.length <= 0 || message.length <= 0) return;

		this.irc.say("#jtv", "/w "+to+" "+message);

		var emotes = findEmoticons(message);
		this.onwhisper({}, this.userinfo.name, to, message, {"emotes": emotes});
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