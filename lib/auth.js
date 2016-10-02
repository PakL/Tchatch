const TwitchApi = require("twitch-api");
const http = require("http");

let Auth = function(){
	this.client_id = "11vhuxdssb9pc3s2uqpa7s3s0252hyk";
	this.redirect = "http://localhost:8086/";
	this.needscope = ["chat_login", "user_read", "channel_read", "channel_editor", "channel_commercial"];
	this.token = "";
	this.userinfo = [];

	this.twitch = new TwitchApi({
		"clientId": this.client_id,
		"redirectUri": this.redirect,
		"scopes": this.needscope
	});
}

Auth.prototype.login = function() {
	this.respserver = http.createServer(function(req, resp){
		var response = "<!DOCTYPE html>\r\n<html><head><meta charset=\"utf-8\"></head><body><script type=\"text/javascript\">window.close();</script></body></html>";
		resp.writeHead(200, {"Content-Length": response.length, "Content-Type": "text/html; charset=utf-8"});
		resp.end(response);
	}).listen(8086);

	var authurl = this.twitch.getAuthorizationUrl().replace(/response_type=code/, "response_type=token");
	let _self = this;
	nw.Window.open(authurl + "&force_verify=true", {
		"title": "Twitch.tv OAuth2",
		"width": 400,
		"height": 500,
		"position": "center"
	}, function(win) {
		this.authwin = win;
		this.authwin.on("close", function(){
			_self.auth(this.window.document.location.hash);
			_self.respserver.close();
			this.close(true);
		});
	});
}

Auth.prototype.auth = function(hash) {
	if(typeof(hash) != "string" || hash.length == 0) hash = "#";

	global.localStorage.lastAuth = hash;
	hash = hash.substr(1);
	var argss = [];
	var args = hash.split("&");
	args.map(function(v){
		var s = v.split("=", 2);
		argss[decodeURIComponent(s[0])] = decodeURIComponent(s[1]);
	});

	if(typeof(argss.access_token) == "string") {
		var modal = new_modal("Einen Moment...", "Deine Benutzerdaten werden geladen. Einen Moment, bitte.", false);
		this.token = argss.access_token;
		this.twitch.getAuthenticatedUser(this.token, function(err, body){
			close_modal(modal);
			if(err) {
				alert("Fehler bei Abfrage der Benutzerdaten.");
			} else {
				$("#start_greeting").text("Hallo " + body.name+ "!");
				$(".loginbtn").html("").append($("<span />").addClass("icon logo").css("background-image", "url(" + body.logo + ")")).append(" ").append($("<span />").text(body.name));
			}
		});
	} else {
		$("#start").text("Anmeldung fehlgeschlagen.");
	}
}

Auth.prototype.logout = function() {
	global.localStorage.lastAuth = "";
	this.token = "";
	$(".loginbtn").html("").append($("<span />").addClass("icon icon-person")).append(" ").append($("<span />").text("Einloggen"));
}