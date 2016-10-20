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
		<statistic name="statistic" />
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
			padding-left: 62px;
			padding-right: 300px;
			font-size: 1.5em;
		}
		stream > header > h1 > input {
			box-sizing: border-box;
			width: 100%;
			font-size: 1em;
			font-family: sans-serif;
		}
		stream > header > h2 {
			padding: 10px;
			padding-top: 0;
			padding-left: 62px;
			padding-right: 300px;
			margin: 0;
			font-size: 1.2em;
		}
		stream > header > h2 > input {
			box-sizing: border-box;
			width: 100%;
			font-size: 1em;
			font-family: sans-serif;
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
		stream > .stream-content > chat {
			top: 30px;
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
		this.editmode = 0;

		this.on("mount", function(){
			self.tplayer = new Twitch.Player(self.playerid, {width: 1280, height: 720, channel: self.opts.name});
			self.tplayer.addEventListener(Twitch.Player.READY, () => {
				self.tplayer.setMuted(false);
				self.tplayer.setQuality("low");

				var f = self.player.querySelector("iframe");
				f.style.width = "100%"; f.style.height = "100%";

				self.resizeplayerdump();
				self.hideplayeroverlay();
			});
			self.update_streamdata();

			if(twauth.editorof.indexOf(self.opts.name) >= 0) {
				var hstatus = self.root.querySelector("h1");
				var hgame = self.root.querySelector("h2");
				hstatus.style.cursor = "pointer";
				hstatus.onclick = function() {
					if((self.editmode & 2) != 2) {
						var status = self.title;
						var inp = document.createElement("input");
						inp.setAttribute("type", "text");
						inp.value = status;
						inp.addEventListener("keyup", (e) => {
							if(e.which == 27) { // Esc
								hstatus.innerHTML = ""; hstatus.innerText = self.title;
								self.editmode = self.editmode ^ 2;
								self.resizeplayerdump();
							} else if(e.which == 13) { // Enter
								var m = new_modal("Neuer Stream-Status", "Der neue Stream-Status wird gespeichert. Bitte warten.", false);
								update_channel_data(self.opts.name, inp.value, self.game, (err) => {
									close_modal(m);
									self.editmode = self.editmode ^ 2;
									if(!err) {
										self.title = inp.value;
										hstatus.innerHTML = ""; hstatus.innerText = self.title;
										self.resizeplayerdump();
									} else {
										alert("Stream-Status konnte nicht gespeichert werden.");
									}
								});
							}
						});
						hstatus.innerHTML = "";
						hstatus.appendChild(inp);
						self.editmode = self.editmode | 2;
					}
				};
				
				hgame.style.cursor = "pointer";
				hgame.onclick = function() {
					if((self.editmode & 4) != 4) {
						var game = self.game;
						var inp = document.createElement("input");
						inp.setAttribute("type", "text");
						inp.setAttribute("list", "game_search_" + self.playerid);
						inp.value = game;
						var dl = document.createElement("datalist");
						dl.setAttribute("id", "game_search_" + self.playerid);
						var datalisttimeout = null;
						inp.addEventListener("keyup", (e) => {
							if(e.which == 27) { // Esc
								hgame.innerHTML = ""; hgame.innerText = self.game;
								self.editmode = self.editmode ^ 4;
								self.resizeplayerdump();
							} else if(e.which == 13) { // Enter
								var m = new_modal("Neues Stream-Spiel", "Das neue Stream-Spiel wird gespeichert. Bitte warten.", false);
								update_channel_data(self.opts.name, self.title, inp.value, (err) => {
									close_modal(m);
									self.editmode = self.editmode ^ 4;
									if(!err) {
										self.game = inp.value;
										hgame.innerHTML = ""; hgame.innerText = self.game;
										
										if(self.game != null && self.game.length > 0) {
											self.gameboxart.setAttribute("src", "https://static-cdn.jtvnw.net/ttv-boxart/" + encodeURIComponent(self.game) + "-52x72.jpg");
										} else {
											self.gameboxart.setAttribute("src", "https://static-cdn.jtvnw.net/ttv-boxart/404_boxart-52x72.jpg");
										}
										self.resizeplayerdump();
									} else {
										alert("Stream-Status konnte nicht gespeichert werden.");
									}
								});
							} else {
								if(datalisttimeout != null) clearTimeout(datalisttimeout);
								datalisttimeout = setTimeout(() => {
									search_games(inp.value, (games) => {
										dl.innerHTML = "";
										for(var i = 0; i < games.length; i++) {
											var opt = document.createElement("option");
											opt.value = games[i].name;
											dl.appendChild(opt);
										}
									});
								}, 500);
							}
						});
						hgame.innerHTML = "";
						hgame.appendChild(dl);
						hgame.appendChild(inp);
						self.resizeplayerdump();
						self.editmode = self.editmode | 4;
					}
				};
			}
		});
		window.addEventListener("resize", () => {
			self.resizeplayerdump();
		});

		this.title = opts.status;
		this.game = opts.game;
		if(this.game != null && this.game.length > 0) {
			this.gameboxart.setAttribute("src", "https://static-cdn.jtvnw.net/ttv-boxart/" + encodeURIComponent(this.game) + "-52x72.jpg");
		} else {
			this.gameboxart.setAttribute("src", "https://static-cdn.jtvnw.net/ttv-boxart/404_boxart-52x72.jpg");
		}

		update_streamdata() {
			get_stream_data(self.opts.name, (data) => {
				self.title = data.status;
				self.game = data.game;
				if(self.game != null && self.game.length > 0) {
					self.gameboxart.setAttribute("src", "https://static-cdn.jtvnw.net/ttv-boxart/" + encodeURIComponent(self.game) + "-52x72.jpg");
				} else {
					self.gameboxart.setAttribute("src", "https://static-cdn.jtvnw.net/ttv-boxart/404_boxart-52x72.jpg");
				}
				self.statistic._tag.update_viewer(data.viewers);
				self.statistic._tag.update_follower(data.followers);
				self.statistic._tag.update_following(data.following, self.opts.name);
				self.update();
				self.resizeplayerdump();

				setTimeout(self.update_streamdata, 60000 - (Date.now() % 60000)); // Wait till next full minute
			});
		}

		resizeplayerdump() {
			self.streamcontent.style.top = self.header.offsetHeight + "px";
			self.playerdump.style.height = self.header.offsetHeight + "px";
			self.playerdump.style.width = ((16 / 9) * self.header.offsetHeight) + "px";
			self.playerdump.querySelector(".playerstater").style.lineHeight = self.header.offsetHeight + "px";

			if(self.playerstate == 1) {
				self.player.style.height = "auto";
				self.player.style.width = "auto";
				self.player.style.top = self.header.offsetHeight +30 + "px";
				self.player.style.right = "300px";
				self.player.style.left = 0;
				self.player.style.bottom = 0;

				self.showplayeroverlay();
				self.chat._tag.setcompact(true);
			} else {
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

		hideplayeroverlay() {
			var framecontent = self.player.querySelector("iframe").contentDocument;
			var overlays = framecontent.querySelectorAll("div,button");
			for(var i = 0; i < overlays.length; i++) {
				if(!overlays[i].classList.contains("player-video") && !overlays[i].classList.contains("player")) {
					overlays[i].style.visibility = "hidden";
				}
			}
		}
		showplayeroverlay() {
			var framecontent = self.player.querySelector("iframe").contentDocument;
			var overlays = framecontent.querySelectorAll("div,button");
			for(var i = 0; i < overlays.length; i++) {
				if(!overlays[i].classList.contains("player-video") && !overlays[i].classList.contains("player")) {
					overlays[i].style.visibility = "visible";
				}
			}
		}

		changeplayerstate(e) {
			if(self.playerstate == 0) {
				self.playerstate = 1;
				self.tplayer.setQuality("high");
			} else {
				self.playerstate = 0;
				self.tplayer.setQuality("low");
			}

			self.resizeplayerdump();
		}
	</script>
</stream>