var language = {};

var getTranslation = function(transName) {
	if(language.translation == "undefined" || typeof(language.translation[transName]) == "undefined") return "MISSING_LANG::"+transName;
	else {
		return language.translation[transName];
	}
}

var fillLanguage = function() {
	$(".lang").each(function(){
		var classes = $(this).attr('class').split(/\s+/);
		for(var i = 0; i < classes.length; i++)
			if(classes[i] != "lang")
				$(this).html(getTranslation(classes[i].substr(5)).replace(/</g, "&gt;").replace(/>/g, "&lt;").replace(/\n/g, "<br>"));
	});
	$("#joinchannel").attr("placeholder", getTranslation("channel_name"));
	$(".postmessage").attr("placeholder", getTranslation("send_a_message"));
}

var availableLanguages = function(){
	var files = fs.readdirSync("languages");
	var languages = [];
	for(var i = 0; i < files.length; i++) {
		var f = files[i];
		if(f.substr(f.lastIndexOf(".")) == ".json") {
			var lf = fs.readFileSync("languages/"+f, { "encoding": "utf8" });
			try {
				var lang = JSON.parse(lf);
				if(typeof(lang.language) == "string") {
					languages.push({ "file": f, "lang": lang.language });
				}
			} catch(e) {}
		}
	}
	return languages;
}

var loadLanguagePack = function(file){
	fs.accessSync("languages/"+file);
	var lf = fs.readFileSync("languages/"+file, { "encoding": "utf8" });
	var lang = JSON.parse(lf);
	if(typeof(lang.language) == "string" && typeof(lang.translation) == "object") {
		language = lang;
	}
}

var languageLoaded = false;
if(typeof(localStorage.language) != "string") {
	var ls = navigator.language.split("-");
	localStorage.language = ls[0]+".json";
	try {
		loadLanguagePack(localStorage.language);
		languageLoaded = true;
	} catch(e) {
		try {
			loadLanguagePack("en.json");
			languageLoaded = true;
			localStorage.language = "en.json";
		} catch(e2) {}
	}
} else {
	try {
		loadLanguagePack(localStorage.language);
		languageLoaded = true;
	} catch(e) {}
}
if(!languageLoaded) {
	var al = availableLanguages();
	if(al.length > 0) {
		try {
			loadLanguagePack(al[0].file);
			languageLoaded = true;
			localStorage.language = al[0].file;
		} catch(e) {}
	}
}
if(!languageLoaded) {
	alert("Unable to load any language pack!");
	w.close();
}


$(document).ready(function(){
	var al = availableLanguages();
	$("#languageswitch").html('');
	for(var i = 0; i < al.length; i++) {
		var option = $("<option />").text(al[i].lang).val(al[i].file);
		if(localStorage.language == al[i].file) option.attr("selected", "selected");
		$("#languageswitch").append(option);
	}
	$("#languageswitch").change(function(){
		var file = $(this).find("option:selected").val();
		try {
			loadLanguagePack(file);
			languageLoaded = true;
			localStorage.language = file;
			fillLanguage();
		} catch(e) {}
	});
});