<stream-preview onclick={ openstream }>
	<div class="channel">
		<div class="viewers"><span class="icon icon-person"></span> { viewers }</div>
		{ display_name }
	</div>
	<div class="title">{ title }</div>
	<div class="game">{ game }</div>

	<style>
		stream-preview {
			background-size: contain;
			background-position: center top;
			background-repeat: no-repeat;
			display: inline-block;
			margin-right: 10px; margin-bottom: 10px;
			width: 320px;
			padding-top: 155px;
			vertical-align: top;
			cursor: pointer;
		}
		stream-preview > .channel:before {
			content: "●";
		}
		stream-preview > .channel {
			line-height: 25px;
			padding: 0 3px;
		}
		stream-preview > .channel > .viewers {
			float: right;
		}
		stream-preview > .title {
			overflow-wrap: break-word;
			font-weight: bold;
			padding: 3px;
		}
		stream-preview > .game {
			font-size: 0.9em;
			padding: 3px;
			padding-top: 0;
		}
	</style>
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