<stream-preview onclick={ openstream }>
	<div class="channel">
		<div class="viewers"><span class="icon icon-person"></span> { viewers }</div>
		{ display_name }
	</div>
	<div class="title">{ title }</div>
	<div class="game">{ game }</div>

	<script>
		if(typeof(opts.data) != "undefined") {
			opts = opts.data;
		}

		this.viewers = opts.viewers;
		this.display_name = opts.channel.display_name;
		this.title = opts.channel.status;
		this.game = opts.game;

		this.root.style.backgroundImage = "url(" + opts.preview.medium + ")"

		openstream(e) {
			open_channel(opts.channel.name);
		}
	</script>
</stream-preview>