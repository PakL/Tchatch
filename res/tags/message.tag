<message>
	<span class="timestamp">{ opts.msg.timestamp }</span>
	<span class="badges"><raw content={ badges } /></span>
	<span class="username" style="color:{ opts.msg.color }">{ opts.msg.display_name }</span>
	<span class="message" name="message"><raw content={ message_msg } /></span>

	<style>
		message {
			display: block;
			line-height: 1.5em;
		}
		message > .timestamp {
			color: #777;
		}
		message > .timestamp:before {
			content: "[";
		}
		message > .timestamp:after {
			content: "] ";
		}
		message > .username {
			font-weight: bold;
		}
		message > .username:after {
			content: ": ";
		}
		message > .message .d {
			color: #777;
		}
		message > .badges  img {
			display: inline-block;
			height: 18px;
			margin: 1px 3px 1px 0;
			min-width: 18px;
			vertical-align: middle;
		}
		message > .message img {
			vertical-align: middle;
			margin: -5px 0;
			display: inline-block;
		}
		message > .message a {
			text-decoration: none;
		}
	</style>
	<script>
		var self = this;
		this.message_msg = opts.msg.message;
		this.badges = "";
		if(typeof(opts.msg.badges) == "string") {
			this.badges = opts.msg.badges;
		}

		this.root.classList.add("user_" + opts.msg.user);

		this.on("update", () => {
			self.message_msg = opts.msg.message;
		});
		this.on("mount", () => {
			var links = self.root.querySelectorAll("a");
			for(var i = 0; i < links.length; i++) {
				links[i].style.color = opts.msg.color;
			}
		});
	</script>
</message>