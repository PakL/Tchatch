var client_id = '11vhuxdssb9pc3s2uqpa7s3s0252hyk';
var redirect = 'http://localhost:8086/';
var needscope = 'chat_login+user_read+channel_read+channel_editor+channel_commercial';
var token = "";
var userinfo = [];

var startlogin = function() {
	var respserver = http.createServer(function(req, resp){
		var response = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><script type="text/javascript">window.close();</'+'script></body></html>';
		resp.writeHead(200, {"Content-Length": response.length, "Content-Type": "text/html; charset=utf-8"});
		resp.end(response);
	}).listen(8086);
	var login = gui.Window.open('https://api.twitch.tv/kraken/oauth2/authorize?response_type=token&amp;client_id='+encodeURIComponent(client_id)+'&amp;redirect_uri='+encodeURIComponent(redirect)+'&amp;scope='+needscope, {
		"title": "Twitch.tv OAuth2",
		"toolbar": false,
		"width": 400,
		"height": 500,
		"position": "center"
	});
	login.on("close", function(){
		this.hide();
		respserver.close();
		twitchAuth(this.window.document.location.hash);
		this.close(true);
	});
	login.focus();
};

var twitchAuth = function(hash) {
	localStorage.lastAuth = hash;
	hash = hash.substr(1);
	var argss = [];
	var args = hash.split("&");
	args.map(function(v){
		var s = v.split("=", 2);
		argss[decodeURIComponent(s[0])] = decodeURIComponent(s[1]);
	});
	$("#loginlink").remove();
	if(typeof(argss.access_token) != "undefined") {
		var scopes = argss.scope.split("+");
		var need = needscope.split("+");
		var has = [];
		for(var i = 0; i < scopes.length; i++){
			for(var j = 0; j < need.length; j++) {
				if(need[j] == scopes[i]) {
					has.push(need[j]);
					break;
				}
			}
		}
		if(has.length != scopes.length) {
			$("#start").prepend($("<a />").attr("id", "loginlink").addClass("button").html('Über <span class="icon-twitch"></span> einloggen').click(startlogin).after('<br>'));
			return;
		}
		$("#status").text("Lade Benutzerdaten...");
		token = argss.access_token;
		https.get({
			"method": "GET",
			"host": "api.twitch.tv",
			"path": "/kraken/user",
			"headers": {
				"Accept": "application/vnd.twitchtv.v3+json",
				"Authorization": "OAuth "+token
			}
		}, function(resp){
			var data = "";
			resp.on("data", function(chunk){
				data += chunk;
			}).on("end", function(){
				$("#status").text("Fertig.");
				if(resp.statusCode == 200) {
					userinfo = JSON.parse(data);
					$("#userinfo_displayname").text(userinfo.display_name);
					
					chat = new TwitchChat(userinfo, token);
				} else {
					$("#start").prepend($("<a />").attr("id", "loginlink").addClass("button").html('Über <span class="icon-twitch"></span> einloggen').click(startlogin).after('<br>'));
				}
			});
		});
	} else {
		$("#start").prepend($("<a />").attr("id", "loginlink").addClass("button").html('Über <span class="icon-twitch"></span> einloggen').click(startlogin).after('<br>'));
	}
};