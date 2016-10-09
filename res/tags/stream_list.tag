<stream-list>
	<stream-preview each={ stream in streams } data={ stream }></stream-preview>
	<div name="loading" style="display:none">Lade Daten...</div>

	<script>
		this.store = opts.streams;
		this.streams = this.store.streams;

		var self = this;
		this.store.on("loading", () => {
			self.loading.style.display = "block";
		});
		this.store.on("streams_update", (data) => {
			self.loading.style.display = "none";
			self.streams = data.streams;
			self.update();
		});
	</script>
</stream-list>