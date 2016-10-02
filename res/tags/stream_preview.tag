<stream-preview onclick={ openstream}>
	<div class="channel">
		<div class="viewers"><span class="icon icon-person"></span> { opts.viewers }</div>
		{ opts.channel.display_name }
	</div>
	<div class="title">{ opts.channel.status }</div>
	<div class="game">{ opts.game }</div>

	<script>
		this.root.style.backgroundImage = "url(" + opts.preview.medium + ")"

		openstream(e) {
			alert("This is the part where I should open the channel " + opts.channel.name);
		}
	</script>
</stream-preview>