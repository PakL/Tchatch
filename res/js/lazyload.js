let watching_element = null;
let watching_callback = null;
let watching_content = document.querySelector(".content");

let watch_check = function() {
	if((window.innerHeight + watching_content.scrollTop) >= watching_element.offsetHeight) {
		console.log("Scrolled to bottom");
		watching_callback();
	}
};

let watch_lazy = function(element, tocall) {
	if(watching_element != null) {
		unwatch_lazy();
	}
	watching_element = element;
	watching_callback = tocall;
	watching_content.addEventListener("scroll", watch_check);
	watch_check();
};

let unwatch_lazy = function() {
	watching_content.removeEventListener("scroll", watch_check);
	watching_element = null;
	watching_callback = null;
};