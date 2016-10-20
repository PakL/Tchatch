let new_modal = function(title, message, closeable) {
	if(typeof(closeable) != "boolean") closeable = true;

	var modal = document.createElement("modal");
	document.querySelector("body").appendChild(modal);

	message = message.replace(/\n/g, "<br>");
	riot.mount(modal, {title: title, message: message, closeable: closeable });
	return modal;
}

let close_modal = function(modal) {
	modal.style.opacity = 0;
	setTimeout(() => { modal.parentNode.removeChild(modal); }, 500);
};