if(typeof(global.localStorage.latestversion) != "string")
	global.localStorage.latestversion = "0.0.0";
if(global.localStorage.latestversion == "0.0.0")
	global.localStorage.lastAuth = "";

window.addEventListener("load", () => {
	if(global.localStorage.latestversion != nw.App.manifest.version) {
		https.get({
			"method": "GET", "host": "api.github.com", "path": "/repos/PakL/Tchatch/releases",
			"headers": { "User-Agent": "Tchatch v"+nw.App.manifest.version+" github.com/PakL/Tchatch" }
		}, function(resp){
			var data = "";
			resp.on("data", function(chunk){
				data += chunk;
			}).on("end", function(){
				var releases = JSON.parse(data);
				console.log(releases);
				for(var i = 0; i < releases.length; i++) {
					if(releases[i].tag_name == "v" + nw.App.manifest.version) {
						new_modal("Changelog für " + releases[i].tag_name, "<b>" + releases[i].name + "</b>\n\n"+ releases[i].body, true);
						global.localStorage.latestversion = nw.App.manifest.version;
					}
				}
			});
		});
	}
});