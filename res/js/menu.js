let menuopen = false;
let opencontent = "";
let menulistener = [];

$("a.menu").click(function(){
	var nav = $(this).parent().parent().parent();
	if(!menuopen) {
		nav.find("ul").css({ "width": "auto", "position": "static" });
		var nw = nav.width();
		nav.find("ul").css({ "width": "52px" }).animate({ "width": nw + "px" }, 200).filter(".bottom").css({"position": "absolute"});
		menuopen = true;
	} else {
		nav.find("ul").animate({ "width": "52px" }, 200);
		menuopen = false;
	}
});

$("nav").find("a").not(".menu").click(function(e){
	var href = $(this).attr("href").substring(1);
	if($(".content").find("#" + href).length > 0) {
		if(typeof(menulistener[opencontent+" leaving"]) != "undefined") {
			for(var i = 0; i < menulistener[opencontent+" leaving"].length; i++) {
				menulistener[opencontent+" leaving"][i](this);
			}
		}

		console.log("Opening content " + href);
		$(".content").children("div").hide().filter("#" + href).show();

		opencontent = href;
	} else {
		console.log("No content found for " + href);
	}

	if(typeof(menulistener[href]) != "undefined") {
		for(var i = 0; i < menulistener[href].length; i++) {
			menulistener[href][i](this);
		}
	}

	e.preventDefault();
	return false;
});

let add_menulistener = function(content, cb) {
	if(typeof(content) != "string" || typeof(cb) != "function") return;

	if(typeof(menulistener[content]) == "undefined") menulistener[content] = [];
	menulistener[content].push(cb);
}