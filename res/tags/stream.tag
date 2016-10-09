<stream>
	<div name="playerdump" class="playerdump">
		<div class="playerstater" onclick={ changeplayerstate }><span class="icon icon-tab_unselected"></span></div>
	</div>
	<header name="header">
		<img src="https://static-cdn.jtvnw.net/ttv-static/404_boxart-52x72.jpg" name="gameboxart" alt="">
		<h1>{ title }</h1>
		<h2>{ game }</h2>
	</header>
	<div name="player" class="player"></div>
	<div class="stream-content" name="streamcontent">
		<chat name="chat" />
	</div>

	<style>
		stream {
			position: relative;
			height: 100%;
			overflow: auto;
		}
		stream > .playerdump {
			position: absolute;
			top: 0;
			right: 0;
			height: 1280px;
			width: 720px;
		}
		stream > .playerdump > .playerstater {
			position: relative;
			cursor: pointer;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			z-index: 101;
			line-height: 72px;
			text-align: center;
			font-size: 1.6em;
			color: #fff;
		}
		stream > header {
			min-height: 72px;
		}
		stream > header > h1 {
			margin: 0;
			padding: 10px;
			padding-bottom: 0;
			font-size: 1.5em;
			width: 710px;
		}
		stream > header > h2 {
			padding: 10px;
			padding-top: 0;
			margin: 0;
			font-size: 1.2em;
			width: 710px;
		}

		stream > header > img {
			float: left;
			width: 52px;
			height: 72px;
			margin-right: 10px;
		}

		stream > .stream-content {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			overflow: auto;
		}
		stream > .player {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
		}
		stream > .player > iframe {
			position: absolute;
			top: 0;
			left: 0;
			z-index: 100;
		}
	</style>

	<script>
		var self = this;
		this.playerid = "player_" + Date.now();
		this.player.setAttribute("id", this.playerid);

		this.playerstate = 0;

		this.on("mount", function(){
			self.tplayer = new Twitch.Player(self.playerid, {width: 1280, height: 720, channel: opts.name});
			self.tplayer.addEventListener(Twitch.Player.READY, () => {
				self.tplayer.setQuality("low");
				self.tplayer.setMuted(false);
				self.tplayer.setVolume(0.5);

				self.streamcontent.style.top = self.header.offsetHeight + "px";
				self.playerdump.style.height = self.header.offsetHeight + "px";
				self.playerdump.style.width = ((16 / 9) * self.header.offsetHeight) + "px";

				var f = self.player.querySelector("iframe");
				f.style.width = "100%"; f.style.height = "100%";

				self.player.style.height = self.playerdump.style.height;
				self.player.style.width = self.playerdump.style.width;
				self.player.style.top = 0;
				self.player.style.right = 0;
				self.player.style.left = "auto";
				self.player.style.bottom = "auto";

			});
			self.tplayer.addEventListener(Twitch.Player.PLAY, () => {
				if(self.playerstate == 0) {
					self.hideplayeroverlay();
				}
			});
		});

		this.title = opts.status;
		this.game = opts.game;
		if(this.game != null && this.game.length > 0) {
			this.gameboxart.setAttribute("src", "https://static-cdn.jtvnw.net/ttv-boxart/" + encodeURIComponent(this.game) + "-52x72.jpg");
		} else {
			this.gameboxart.setAttribute("src", "https://static-cdn.jtvnw.net/ttv-boxart/404_boxart-52x72.jpg");
		}

		hideplayeroverlay() {
			var framecontent = self.player.querySelector("iframe").contentDocument;
			var overlays = framecontent.querySelectorAll("div,button");
			for(var i = 0; i < overlays.length; i++) {
				if(!overlays[i].classList.contains("player-video") && !overlays[i].classList.contains("player")) {
					overlays[i].style.visibility = "hidden";
				}
			}
			self.playerdump.querySelector(".icon").style.display = "none";
		}
		showplayeroverlay() {
			var framecontent = self.player.querySelector("iframe").contentDocument;
			var overlays = framecontent.querySelectorAll("div,button");
			for(var i = 0; i < overlays.length; i++) {
				if(!overlays[i].classList.contains("player-video") && !overlays[i].classList.contains("player")) {
					overlays[i].style.visibility = "visible";
				}
			}
			self.playerdump.querySelector(".icon").style.display = "inline";
		}

		changeplayerstate(e) {
			if(self.playerstate == 0) {
				self.playerstate = 1;
				
				self.tplayer.setQuality("high");

				self.player.style.height = "auto";
				self.player.style.width = "auto";
				self.player.style.top = self.header.offsetHeight + "px";
				self.player.style.right = "300px";
				self.player.style.left = 0;
				self.player.style.bottom = 0;

				self.showplayeroverlay();
				self.chat._tag.setcompact(true);
			} else {
				self.playerstate = 0;

				self.tplayer.setQuality("low");

				self.player.style.height = self.playerdump.style.height;
				self.player.style.width = self.playerdump.style.width;
				self.player.style.top = 0;
				self.player.style.right = 0;
				self.player.style.left = "auto";
				self.player.style.bottom = "auto";

				self.hideplayeroverlay();
				self.chat._tag.setcompact(false);
			}
		}
	</script>
</stream>