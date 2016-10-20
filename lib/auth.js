const TwitchApi = require("twitch-api");
const http = require("http");
const https = require("https");

let twchat = null;

let Auth = function(){
	this.client_id = "11vhuxdssb9pc3s2uqpa7s3s0252hyk";
	this.redirect = "http://localhost:8086/";
	this.needscope = ["chat_login", "user_subscriptions", "user_read", "user_follows_edit", "channel_read", "channel_editor", "channel_commercial"];
	this.token = "";
	this.userinfo = [];
	this.editorof = [];

	this.twitch = new TwitchApi({
		"clientId": this.client_id,
		"redirectUri": this.redirect,
		"scopes": this.needscope
	});
}

Auth.prototype.login = function() {
	this.respserver = http.createServer((req, resp) => {
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
	}, (win) => {
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
		var self = this;
		this.twitch.getAuthenticatedUser(this.token, function(err, body){

			https.get({
				"method": "GET", "host": "badges.twitch.tv", "path": "/v1/badges/global/display"
			}, function(resp){
				var data = "";
				resp.on("data", function(chunk){
					data += chunk;
				}).on("end", function(){

					self.userinfo = body;
					close_modal(modal);
					if(err) {
						alert("Fehler bei Abfrage der Benutzerdaten.");
					} else {
						document.querySelector("#start_greeting").innerText = "Hallo " + body.display_name+ "!";
						document.querySelector("#start_greeting").onclick = function(){ open_channel(self.userinfo.name); };
						document.querySelector(".loginbtn").innerHTML = "<span class=\"icon logo\" style=\"background-image:url(" + body.logo+ ");\"></span> <span>" + body.display_name + "</span>";
						
						twchat = new Chat();
						twchat.badges = JSON.parse(data).badge_sets;
					}

				});
			});

		});
	} else {
		document.querySelector("#start_greeting").innerText = "Anmeldung fehlgeschlagen.";
	}
}

Auth.prototype.logout = function() {
	global.localStorage.lastAuth = "";
	this.token = "";

	document.querySelector("#start_greeting").innerText = "Hallo Gast! Ohne dich einzuloggen kannst du hier nicht viel tun.";
	document.querySelector("#start_greeting").onclick = function(){};
	document.querySelector(".loginbtn").innerHTML = "<span class=\"icon icon-person\"></span> <span>Einloggen</span>";
}