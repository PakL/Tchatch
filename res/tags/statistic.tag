<statistic>
	<div class="viewer">Zuschauer: <span name="viewer_trend" class="steady_trend"></span> <span name="viewer">{ viewer_num }</span></div>
	<div class="follower">Anhänger: <span name="follower_trend" class="steady_trend"></span> <span name="follower">{ follower_num }</span></div>

	<div class="following"><span class="icon icon-favorite_border" name="followicon"></span></div>

	<style>
		statistic {
			display: block;
			height: 30px;
		}
		statistic > .viewer {
			display: inline-block;
			line-height: 30px;
			margin-left: 10px;
		}
		statistic > .follower {
			display: inline-block;
			line-height: 30px;
			margin-left: 10px;
		}
		statistic > .following {
			display: inline-block;
			float: right;
			line-height: 30px;
			margin-right: 10px;
			cursor: pointer;
		}
		statistic > .following > .icon-favorite_border:after {
			content: " Folgen";
			font-family: sans-serif;
		}
		statistic > .following > .icon-favorite:after {
			content: " Nicht mehr folgen";
			font-family: sans-serif;
		}
		.steady_trend:before {
			color: #000000;
			font-weight: bold;
			content: "―";
			font-size: 1.2em;
		}
		.upwards_trend:before {
			color: #68a92f;
			font-weight: bold;
			content: "˄";
			font-size: 1.2em;
		}
		.downwards_trend:before {
			color: #a92f2f;
			font-weight: bold;
			content: "˅";
			font-size: 1.2em;
		}
		.viewer.offline:after {
			content: " (Zuletzt bekannter Wert)";
		}
	</style>
	<script>
		var self = this;
		this.viewer_num = 0;
		this.follower_num = 0;

		update_viewer(newviewer) {
			var classlist = self.viewer_trend.classList;
			classlist.remove("steady_trend"); classlist.remove("upwards_trend"); classlist.remove("downwards_trend");
			if(newviewer == null) {
				classlist.add("steady_trend");
				self.viewer.classList.add("offline");
			} else {
				if(self.viewer.classList.contains("offline")) {
					self.viewer.classList.remove("offline");
				}
				if(self.viewer_num == newviewer) {
					classlist.add("steady_trend");
				} else if(self.viewer_num > newviewer) {
					classlist.add("downwards_trend");
				} else if(self.viewer_num < newviewer) {
					classlist.add("upwards_trend");
				}
				self.viewer_num = newviewer;
			}
		}
		update_follower(newfollower) {
			var classlist = self.follower_trend.classList;
			classlist.remove("steady_trend"); classlist.remove("upwards_trend"); classlist.remove("downwards_trend");
			if(self.follower_num == newfollower) {
				classlist.add("steady_trend");
			} else if(self.follower_num > newfollower) {
				classlist.add("downwards_trend");
			} else if(self.follower_num < newfollower) {
				classlist.add("upwards_trend");
			}
			self.follower_num = newfollower;
		}

		update_following(following, channel) {
			var classlist = self.followicon.classList;
			classlist.remove("icon-favorite_border"); classlist.remove("icon-favorite"); self.followicon.onclick = function(){};
			if(following) {
				classlist.add("icon-favorite");
				self.followicon.onclick = function(){
					var m = new_modal("Nicht mehr folgen", "Dem Channel wird gleich nicht mehr gefolgt. Einen Moment, bitte.", false);
					unfollow_channel(channel, (err)=>{
						close_modal(m);
						if(!err) {
							self.update_following(false, channel);
						}
					});
				};
			} else {
				classlist.add("icon-favorite_border");
				self.followicon.onclick = function(){
					var m = new_modal("Folgen", "Dem Channel wird gleich gefolgt. Einen Moment, bitte.", false);
					follow_channel(channel, (err)=>{
						close_modal(m);
						if(!err) {
							self.update_following(true, channel);
						}
					});
				};
			}
		}
	</script>
</statistic>