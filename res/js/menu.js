let menuopen = false;
let opencontent = "";
let menulistener = [];


document.querySelector("a.menu").addEventListener("click", () => {
	var m = document.querySelector("a.menu");
	var nav = m.parentNode.parentNode.parentNode;
	var ul = nav.querySelectorAll("ul");
	if(!menuopen) {
		var newwidth = nav.offsetWidth;
		for(var i = 0; i < ul.length; i++) {
			ul[i].style.width = "auto";
			if(ul[i].offsetWidth > newwidth) {
				newwidth = ul[i].offsetWidth;
			}
			ul[i].style.width = "52px";
		}
		
		// This needs a timeout, or the animation for the bottom list is not shown. Don't ask me, this is not my fault.
		setTimeout(() => {
			for(var i = 0; i < ul.length; i++) {
				ul[i].style.width = newwidth + "px";
			}
		}, 10);
		menuopen = true;
	} else {
		for(var i = 0; i < ul.length; i++) {
			ul[i].style.width = "52px";
		}
		menuopen = false;
	}
});

var navlinks = document.querySelectorAll("nav a");
for(var i = 0; i < navlinks.length; i++) {
	var a = navlinks[i];
	if(!a.classList.contains("menu")) {
		a.addEventListener("click", function(e) {
			var href = this.getAttribute("href");
			if(href == null || href.length == 0) return;
			href = href.substring(1)
			var content = document.querySelector(".content");
			if(content.querySelectorAll("#" + href).length > 0) {
				if(typeof(menulistener[opencontent+" leaving"]) != "undefined") {
					for(var i = 0; i < menulistener[opencontent+" leaving"].length; i++) {
						menulistener[opencontent+" leaving"][i](this);
					}
				}

				console.log("Opening content " + href);
				var contentdivs = content.childNodes;
				for(var j = 0; j < contentdivs.length; j++) {
					if(contentdivs[j].nodeName.toLowerCase() != "div") continue;
					contentdivs[j].style.display = "none";
					if(contentdivs[j].getAttribute("id") == href) {
						contentdivs[j].style.display = "block";
					}
				}

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
	}
}

let add_menulistener = function(content, cb) {
	if(typeof(content) != "string" || typeof(cb) != "function") return;

	if(typeof(menulistener[content]) == "undefined") menulistener[content] = [];
	menulistener[content].push(cb);
}