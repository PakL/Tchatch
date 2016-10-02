let new_modal = function(title, message, closeable) {
	if(typeof(closeable) != "boolean") closeable = true;

	var modal = $("<div />").addClass("modal");

	if(closeable) {
		modal.append($("<a />").addClass("modalclose").html("&times;").click(function(){ $(this).parent().parent().parent().parent().fadeOut(function(){$(this).remove();}); }));
	}
	modal
		.append($("<h1 />").text(title))
		.append($("<div />").html(message.replace(/</g, "&lt;").replace(/\n/g, "<br>")));

	$("body").append( $("<div />").addClass("modalbg").append($("<div />").addClass("modalv").append($("<div />").addClass("modalh").append(modal))).click(function(){ if(closeable) $(this).fadeOut(function(){$(this).remove();}); }) );
	return modal;
}

let close_modal = function(modal) {
	if($(modal).is(".modal")) {
		$(modal).parent().parent().parent().fadeOut(function(){$(this).remove();});
	}
};