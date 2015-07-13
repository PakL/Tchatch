var net = require("net");
var util = require("util");
var events = require("events");

function TwitchChat(options) {
	var self = this;
	this.buffer = "";
	this.clrf = "\r\n";

	this.options = {
		"host": "irc.twitch.tv",
		"port": 6667
	};
	if(typeof(options) == "object") {
		for(var i in options) {
			if(options.hasOwnProperty(i))
				this.options[i] = options[i];
		}
	}
	this.socket = new net.Socket();
	this.socket.setEncoding("utf8");
	this.socket.on("connect", function(c){
		self.emit("connect", c);
	});
	this.socket.on("error", function(e){
		self.emit("error", e);
	});
	this.socket.on("close", function(had_error){
		self.emit("close", had_error);
	})
	this.socket.on("data", function(data){
		self.buffer += data;
		while(self.buffer.indexOf(self.clrf) >= 0) {
			var i = self.buffer.indexOf(self.clrf);
			var message = self.buffer.substring(0, i);
			self.buffer = self.buffer.substring(i + self.clrf.length);
			self.emit("incoming", message);
			self.slaughter(message);
		}
	});
	this.socket.connect(this.options.port, this.options.host);

	this.namelists = {};

	events.EventEmitter.call(this);
}
util.inherits(TwitchChat, events.EventEmitter);
TwitchChat.prototype.disconnect = function() {
	if(typeof(this.socket) != "undefined") {
		this.socket.end();
	}
};
TwitchChat.prototype.auth = function(username, oauthkey) {
	var self = this;
	this.once("motd", function(){ self.capreq(); });
	this.sendCLRF("PASS oauth:"+oauthkey);
	this.sendCLRF("NICK "+username);
};
TwitchChat.prototype.capreq = function() {
	this.capMembership = false;
	this.capCommands = false;
	this.capTags = false;
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
			if(params.length >= 2) {
				var actionprefix = new RegExp("^ ?\x01ACTION ");
				var to = params[0];
				var msg = attach.substr(attach.indexOf(" :")+2);
				if(msg.match(actionprefix)) {
					msg = msg.replace(actionprefix, "");
					this.emit("action", prefix, prefix.user, to, msg, tags);
				} else {
					this.emit("message", prefix, prefix.user, to, msg, tags);
				}
			}
			break;
		case (action == "WHISPER"):
			var params = attach.split(" :", 2);
			if(params.length >= 2) {
				var to = params[0];
				var msg = attach.substr(attach.indexOf(" :")+2);
				this.emit("whisper", prefix, prefix.user, prefix.user, msg, tags);
			}
			break;

		// ACK
		case (action == "CAP"):
			if(attach == "* ACK :twitch.tv/membership")
				this.capMembership = true;
			if(attach == "* ACK :twitch.tv/commands")
				this.capCommands = true;
			if(attach == "* ACK :twitch.tv/tags")
				this.capTags = true;

			if(this.capMembership && this.capCommands && this.capTags) {
				this.emit("capack");
			}
			break;

		// twitch.tv/membership
		case (action == "353"):
			var args = attach.split(" :");
			if(args.length == 2) {
				var a = args[0].split(" ");
				var channel = a[2].substr(1);
				if(!this.namelists.hasOwnProperty(channel) || typeof(this.namelists[channel]) == "undefined") this.namelists[channel] = [];
				var names = args[1].split(" ");
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

				this.emit("names", "#"+channel, this.namelists[channel]);
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
	if(typeof(this.socket) != "undefined") {
		this.socket.write(message + this.clrf, "utf8");
		if(message.substr(0, 5) == "PASS ") {
			var pwlength = (message.length-5)
			message = "PASS ";
			for(var i = 0; i < pwlength; i++) message = message+"*";
		}
		this.emit("outgoing", message);
	}
};