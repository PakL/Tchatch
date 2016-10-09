<raw>
	<script>
		this.root.innerHTML = opts.content
		var self = this;
		this.on("updated", () => {
			self.root.innerHTML = self.opts.content;
		});
	</script>
</raw>
