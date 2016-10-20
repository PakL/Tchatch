const path = require("path");
const fs = require("fs");
const md5File = require("md5-file");

let twauth = new Auth();
riot.mount(document.querySelector("#server_chat"));

nw.Window.get().on("close", () => {
	if(twchat != null) {
		twchat.disconnect();
	}
	nw.Window.get().close(true);
});

nw.Window.get().on("new-win-policy", (frame, url, policy) => {
	nw.Shell.openExternal(url);
	policy.ignore();
});

document.querySelector("#closechannel").style.display = "none";

window.addEventListener("load", () => {
	add_menulistener("closechannel", function() {
		if(opencontent.substr(0, 8) == "channel_") {
			var ch = opencontent.substr(8);
			if(confirm("Möchtest du den Kanal " + ch + " schließen?")) {
				opencontent = "channel_";
				close_channel(ch);
				document.querySelector("nav").querySelector(".home").click();
			}
		}
	});

	var nwdir = path.dirname(process.execPath);
	var righthash = "";
	if(process.platform == "win32") {
		var ffmpegpath = path.join(nwdir, "ffmpeg.dll");
		righthash = "8e9501b4d1ea6553db96efb9c699c1e3";
	} else if(process.platform == "linux") {
		nwdir = path.join(nwdir, "lib");
		var ffmpegpath = path.join(nwdir, "libffmpeg.so");
		righthash = "db1d4dbc7ed55b2ef724ded20b12fae9";
	} else {
		nwdir = path.join(nwdir, "..", "Contents/Versions/54.0.2840.59/nwjs Framework.framework");
		var ffmpegpath = path.join(nwdir, "libffmpeg.dylib");
		righthash = "d98ce56567e87aee1c447c2b02216520";
	}
	try {
		fs.accessSync(ffmpegpath);
		var hash = md5File.sync(ffmpegpath);
		if(hash != righthash) {
			var msg  = "Hallo lieber Nutzer, und vielen Dank dass du Tchatch eine Chance gibst.\n";
				msg += "\n";
				msg += "<u>Nun zum blöden Teil:</u>\n";
				msg += "aus rechtlichen Gründen kann ich Tchatch nicht mit dem <i>H264-Codec</i>\n";
				msg += "verteilen, der benötigt wird um Streams zu gucken. <i>Aber wenn du es bis\n";
				msg += "hierhin geschafft hast, ist das auch kein Problem mehr für dich.</i>\n";
				msg += "\n";
				msg += "Lade einfach die entsprechende ffmpeg-Version für dein System herunter\n";
				msg += "und ersetze die ffmpeg-Library in '<b>" + nwdir + "</b>'.\n";
				msg += "\n";
				msg += "» <a href=\"https://github.com/iteufel/nwjs-ffmpeg-prebuilt/releases/tag/0.18.1\" target=\"_blank\">Zu den ffmpeg-Downloads</a>";
			new_modal("Stream-Wiedergabe", msg, true);
		}
	} catch(err) {
		alert("Something went terrible wrong. You shouldn't be able to see this...");
	}

});