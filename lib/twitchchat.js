var WebSocketClient = require("websocket").client;

var util = require("util");
var events = require("events");

function TwitchChat(options) {
	var self = this;
	this.options = {
		"host": "irc.twitch.tv",
		"port": 80
	};
	if(typeof(options) == "object") {
		for(var i in options) {
			if(options.hasOwnProperty(i))
				this.options[i] = options[i];
		}
	}
	this.socket = new WebSocketClient();
	this.socket.on("connect", function(c){
		self.connected(c);
		self.emit("connect", c);
	});
	this.socket.on("connectFailed", function(e){
		self.emit("connectFailed", e);
	});
	this.socket.connect("ws://"+this.options.host+":"+this.options.port+"/", null);

	this.namelists = {};

	events.EventEmitter.call(this);
}
util.inherits(TwitchChat, events.EventEmitter);
TwitchChat.prototype.connected = function(connection) {
	var self = this;
	this.connection = connection;
	this.connection.on("error", function(e){
		self.emit("error", e);
	});
	this.connection.on("close", function(code, desc){
		self.emit("close", code, desc);
		self.connection.close();
	});
	this.connection.on("message", function(msg){
		if(msg.type != "utf8") return;
		var message = msg.utf8Data.trim();
		self.emit("incoming", message);
		self.slaughter(message);
	});
};
TwitchChat.prototype.disconnect = function() {
	if(typeof(this.connection) != "undefined" && this.connection.connected) {
		this.connection.close();
	}
};
TwitchChat.prototype.auth = function(username, oauthkey) {
	var self = this;
	this.once("motd", function(){ self.capreq(); });
	this.sendCLRF("PASS oauth:"+oauthkey);
	this.sendCLRF("NICK "+username);
};
TwitchChat.prototype.capreq = function() {
	this.sendCLRF("CAP REQ :twitch.tv/membership");
	this.sendCLRF("CAP REQ :twitch.tv/commands");
	this.sendCLRF("CAP REQ :twitch.tv/tags");
};
TwitchChat.prototype.slaughter = function(msg) {
	var p = msg.substr(0, 1);
	var tags = "";
	var prefix = {"user": "", "host": ""};
	if(p == "@") {
		tags = msg.substring(1, msg.indexOf(" ", 1));
		msg = msg.substr(msg.indexOf(" ", 1)+1);
		p = msg.substr(0, 1);
	}
	if(p == ":") {
		prefix = msg.substring(1, msg.indexOf(" ", 1));
		var matches = prefix.match(/^((.*?)!(.*?)@)?(.*?)$/);
		if(typeof(matches[3]) != "string") matches[3] = "";
		prefix = {"user": matches[3], "host": matches[4] };
		msg = msg.substr(msg.indexOf(" ", 1)+1);
	}
	var action = msg.substring(0, msg.indexOf(" ", 1));
	var attach = msg.substr(msg.indexOf(" ")+1);

	this.emit("raw", tags, prefix, action, attach);

	var tags = tags.split(";");
	var ntags = {};
	for(var i = 0; i < tags.length; i++) {
		var sp = tags[i].split("=", 2);
		if(sp.length < 2) continue;
		var unescape = sp[1].replace(/[^\\]\\:/g, ";");
		unescape = unescape.replace(/[^\\]\\s/g, " ");
		unescape = unescape.replace(/[^\\]\\r/g, "\r");
		unescape = unescape.replace(/[^\\]\\n/g, "\n");
		unescape = unescape.replace(/[^\\]\\\\/g, "\\");
		ntags[sp[0]] = unescape;
	}
	tags = ntags;

	switch(true) {
		case (action == "PING"):
			this.sendCLRF("PONG "+attach);
			break;
		case (action == "004"):
			this.emit("registered");
			break;
		case (action == "372"):
			var params = attach.split(" :", 2);
			this.motd = params[1].trim();
			break;
		case (action == "376"):
			this.emit("motd", this.motd);
			break;
		case (action == "PRIVMSG"):
			var params = attach.split(" :", 2);
			if(params.length == 2) {
				var actionprefix = new RegExp("^ ?\x01ACTION ");
				var to = params[0];
				var msg = params[1];
				if(msg.match(actionprefix)) {
					msg = msg.replace(actionprefix, "");
					this.emit("action", prefix, prefix.user, to, msg, tags);
				} else {
					this.emit("message", prefix, prefix.user, to, msg, tags);
				}
			}
			break;

		// twitch.tv/membership
		case (action == "353"):
			var args = attach.split(" ", 4);
			if(args.length == 4) {
				var channel = args[2].substr(1);
				if(!this.namelists.hasOwnProperty(channel) || typeof(this.namelists[channel]) == "undefined") this.namelists[channel] = [];
				var names = args[3].substr(1).split(" ");
				for(var i = 0; i < names.length; i++) {
					this.namelists[channel].push(names[i]);
				}
			}
			break;
		case (action == "366"):
			var args = attach.split(" ", 3);
			if(args.length >= 2) {
				var channel = args[1].substr(1);
				if(!this.namelists.hasOwnProperty(channel) || typeof(this.namelists[channel]) == "undefined") this.namelists[channel] = [];

				this.emit("names", channel, this.namelists[channel]);
				this.namelists[channel] = undefined;
			}
			break;
		case (action == "JOIN"):
			this.emit("join", prefix.user, attach);
			break;
		case (action == "PART"):
			this.emit("part", prefix.user, attach);
			break;
		case (action == "MODE"):
			var args = attach.split(" ", 3);
			if(args.length == 3) {
				var channel = args[0];
				var mode = args[1];
				var user = args[2];
				if(mode.substr(0, 1) == "+")
					this.emit("mode+", channel, mode, user);
				else
					this.emit("mode-", channel, mode, user);

				this.emit("mode", channel, mode, user);
			}
			break;

		// twitch.tv/commands
		case (action == "NOTICE"):
			var args = attach.split(" :", 2);
			if(args.length == 2) {
				var channel = args[0];
				var msg = args[1];
				this.emit("notice", channel, msg, tags);
			}
			break;
		case (action == "CLEARCHAT"):
			if(attach.indexOf(" :") >= 0) {
				var args = attach.split(" :", 2);
				var channel = args[0];
				var user = args[1];
				this.emit("clearuser", channel, user);
			} else {
				var channel = attach;
				this.emit("clearchat", channel);
			}
			break;

		// twitch.tv/tags
		case (action == "USERSTATE"):
			var channel = attach;
			this.emit("userstate", channel, tags);
			break;
		case (action == "ROOMSTATE"):
			var channel = attach;
			this.emit("roomstate", channel, tags);
			break;
	}
};
TwitchChat.prototype.join = function(channel) {
	this.sendCLRF("JOIN "+channel);
};
TwitchChat.prototype.part = function(channel, cb) {
	this.sendCLRF("PART "+channel);
	if(typeof(cb) == "function") {
		this.once("part", cb);
	}
};
TwitchChat.prototype.say = function(dest, msg) {
	this.sendCLRF("PRIVMSG "+dest+" :"+msg);
};
TwitchChat.prototype.sendCLRF = function(message) {
	if(this.connection.connected) {
		this.connection.sendUTF(message + "\r\n");
		if(message.substr(0, 5) == "PASS ") {
			var pwlength = (message.length-5)
			message = "PASS ";
			for(var i = 0; i < pwlength; i++) message = message+"*";
		}
		this.emit("outgoing", message);
	}
};