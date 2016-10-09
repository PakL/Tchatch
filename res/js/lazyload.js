let watching_element = null;
let watching_callback = null;
let watching_content = document.querySelector(".content");


let scrolled_to_bottom = function(scroller, scrollcontent) {
	if((scroller.offsetHeight + scroller.scrollTop) >= scrollcontent.offsetHeight) {
		return true;
	}
	return false;
}


let watch_check = function() {
	if(scrolled_to_bottom(watching_content, watching_element)) {
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