var colorSelect = $("<select />")
	.append($("<option />").val("").text(getTranslation("color_none")))
	.append($("<option />").val("#ff0000").text(getTranslation("color_red")))
	.append($("<option />").val("#00ff00").text(getTranslation("color_green")))
	.append($("<option />").val("#0000ff").text(getTranslation("color_blue")));
var highlightRows = 0;
var loadHighlights = function(fillTable){
	if(typeof(fillTable) != "boolean") fillTable = false;
	var h = [];
	if(typeof(global.localStorage.highlights) != "undefined")
		var h = JSON.parse(global.localStorage.highlights);

	if(fillTable) {
		var dataTable = $("#optHighlightData").html('');
		for(var i = 0; i < h.length; i++) {
			var c = colorSelect.clone();
			var r = $("<tr />")
				.append($("<td />").append($("<input />").attr("type", "text").val(h[i].regex)))
				.append($("<td />").append($("<input />").attr("type", "radio").attr("name", "type"+i).val("1")))
				.append($("<td />").append($("<input />").attr("type", "radio").attr("name", "type"+i).val("2")))
				.append($("<td />").append(c))
				.append($("<td />").append($("<span />").addClass("icon-bin").click(function(){ $(this).parent().parent().remove(); })));
			r.find("input[type=radio]").each(function(){ if($(this).val() == h[i].type) $(this).attr("checked", "checked"); });
			r.find("select option").each(function(){ if($(this).val() == h[i].color) $(this).attr("selected", "selected"); });
			dataTable.append(r);
			highlightRows = (i+1);
		}
	}

	return h;
};
var saveHighlights = function(){
	global.localStorage.highlights = "";
	var h = [];
	$("#optHighlightData").children("tr").each(function(){
		var r = $(this);
		var regex = r.find("input[type=text]").val();
		var type = r.find("input[type=radio]:checked").val();
		var color = r.find("select option:selected").val();
		h.push({"regex": regex, "type": type, "color": color});
	});
	global.localStorage.highlights = JSON.stringify(h);
};

$(document).ready(function(){
	$("#highlightOptions").on("open.zf.reveal", function(){
		loadHighlights(true);
	});
	$("#highlightOptions").on("closed.zf.reveal", function(){
		saveHighlights();
	});
	$("#optHighlightAdd").click(function(){
		var c = colorSelect.clone();
		var r = $("<tr />")
			.append($("<td />").append($("<input />").attr("type", "text").val("")))
			.append($("<td />").append($("<input />").attr("type", "radio").attr("name", "type"+highlightRows).val("1").attr("checked", "checked")))
			.append($("<td />").append($("<input />").attr("type", "radio").attr("name", "type"+highlightRows).val("2")))
			.append($("<td />").append(c))
			.append($("<td />").append($("<span />").addClass("icon-bin").click(function(){ $(this).parent().parent().remove(); })));
		r.find("select option:first").attr("selected", "selected");
		highlightRows++;
		$("#optHighlightData").append(r);
	});
});