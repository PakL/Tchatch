<raw>
	<script>
		var self = this;

		this.root.innerHTML = this.opts.content

		refresh() {
			var links = self.root.querySelectorAll("a");
			for(var i = 0; i < links.length; i++) {
				if(typeof(self.opts.linkcolor) == "string" && self.opts.linkcolor.length > 0) {
					links[i].style.color = self.opts.linkcolor;
				}
				links[i].onclick = function(e) {
					nw.Shell.openExternal(this.getAttribute("href"));
					e.preventDefault();
					return false;
				};
			}
		}

		this.on("updated", () => {
			self.root.innerHTML = self.opts.content;
			self.refresh();
		});
		this.on("mount", () => {
			self.refresh();
		})
	</script>
</raw>
