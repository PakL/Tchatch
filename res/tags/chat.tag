<chat onclick={ hideemoticons }>
	<div class="user" name="user">
		<div each={ users }>
			<span class="badges"><raw content={ badges }></span>
			<span class="name" style="color:{ color }">{ name }</span>
		</div>
	</div>
	<div class="chatmessages" name="chatmessages"><div>
		<message each={ msg in messages } msg={ msg } />
	</div></div>
	<div class="sendmessage" name="sendmessage" style="display:none">
		<div class="emoticons" name="emoticons" style="display:none">
			<div class="emoticon_sets" each={ e in emotes }>
				<a each={ e }><span style="background-image:url(http://static-cdn.jtvnw.net/emoticons/v1/{ id }/1.0)" data-code={ code } title={ code } onclick={ addemote } class="ignoreemothide"></a>
			</div>
		</div>
		<input type="text" name="sendmessage_inp" placeholder="Sende eine Nachricht...">
		<div class="btns">
			<a name="sendmessage_send" onclick={ send_message }><span class="icon icon-send"></span></a>
			<a name="sendmessage_emot" class="ignoreemothide" onclick={ showemoticons }><span class="icon icon-sentiment_satisfied ignoreemothide"></span></a>
		</div>
	</div>

	<style>
		chat {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
		}
		chat > .chatmessages {
			padding: 0;
			height: 100%;
			overflow: auto;
			overflow-wrap: break-word;
			font-size: 0.9em;
		}
		chat > .chatmessages message {
			margin: 5px 10px;
		}
		chat > .chatmessages.compact {
			float: right;
			width: 300px;
		}
		chat > .chatmessages.compact message > .timestamp {
			display: none;
		}
		chat > .user {
			padding: 0;
			float: right;
			width: 300px;
			height: 100%;
			overflow: auto;
		}
		chat > .user > div {
			margin: 3px 10px;
			line-height: 18px;
		}
		chat > .user > div img {
			display: inline-block;
			height: 18px;
			margin: 1px 3px 1px 0;
			min-width: 18px;
			vertical-align: middle;
		}
		chat > .sendmessage {
			position: relative;
			width: calc(100% - 300px);
			height: 40px;
		}
		chat > .sendmessage > .emoticons {
			position: absolute;
			width: 300px;
			height: 300px;
			overflow: auto;
			border: 1px solid #000;
			right: 35px;
			top: -300px;
			box-shadow: 0 2px 5px rgba(0,0,0, 0.5);
			text-align: center;
			z-index: 101;
		}
		chat > .sendmessage > .emoticons > .emoticon_sets {
			padding: 10px 0;
			border-bottom: 1px solid #dad8de;
		}
		chat > .sendmessage > .emoticons a > span {
			display: inline-block;
			height: 38px;
			min-width: 38px;
			cursor: pointer;
			background-position: center center;
			background-repeat: no-repeat;
		}
		chat > .sendmessage > input {
			position: absolute;
			bottom: 0px;
			padding-right: 60px;
		}
		chat > .sendmessage > .btns {
			font-size: 1.3em;
			position: absolute;
			right: 5px;
			bottom: 4px;
		}
		chat > .sendmessage > .btns > a {
			float: right;
			margin-right: 5px;
			cursor: pointer;
		}
	</style>
	<script>
		let RandExp = require("randexp");

		var self = this;
		this.messages = [];
		this.users = [];
		this.emotes = [];
		this.lastscolltop = 0;
		this.compact = false;
		this._chat = null;
		this._channel = "";

		this.user.style.display = "none";

		this.updating = false;
		this.repeatupdate = false;
		throttleupdate() {
			if(!self.updating) {
				self.repeatupdate = false;
				self.updating = true;
				self.update();
			} else {
				self.repeatupdate = true;
			}
		};

		this.chatmessages.addEventListener("scroll", () => {
			if(scrolled_to_bottom(self.chatmessages, self.chatmessages.childNodes[0])) {
				self.lastscolltop = self.chatmessages.scrollTop;
			}
		});
		this.on("updated", () => {
			if(self.users.length > 0 && !self.compact) {
				self.user.style.display = "block";
				self.chatmessages.style.height = "calc(100% - 40px)";
				self.sendmessage.style.display = "block";
			}
			if(self.chatmessages.scrollTop == self.lastscolltop) {
				self.chatmessages.scrollTop = self.chatmessages.childNodes[0].offsetHeight;
				self.lastscolltop = self.chatmessages.scrollTop;
			}
			self.updating = false;
			if(self.repeatupdate) {
				self.throttleupdate();
			}
		});
		this.sendmessage_inp.addEventListener("keyup", (e) => { if(e.which == 13) self.send_message(); });

		addmsg(msg) {
			self.messages.push(msg);
			while(self.messages.length > 200)
				self.messages.shift();

			self.throttleupdate();
		}

		clearmsg(username) {
			if(typeof(username) == "undefined") {
				self.messages = [];
			} else {
				var c = 0;
				for(var i = 0; i < self.messages.length; i++) {
					if(self.messages[i].user == username) {
						self.messages[i].message = "<span class=\"d\">&lt;Nachricht gelöscht&gt;</span>";
						c++;
					}
				}
			}
			self.throttleupdate();
		}

		joinusr(user) {
			if(!self.updateusr(user)) {
				self.users.push(user);
			}

			self.users.sort(function(a, b){
				if(a.sort > b.sort) return -1;
				else if(a.sort < b.sort) return 1;

				return a.user.localeCompare(b.user);
			});
			/*if(this.users.length > 3)
				this.users = [];*/
			self.throttleupdate();
		}
		updateusr(user) {
			for(var i = 0; i < self.users.length; i++) {
				if(self.users[i].user == user.user) {
					if(user.user != user.name) self.users[i].name = user.name;
					if(self.users[i].sort <= user.sort) {
						self.users[i].sort = user.sort;
						self.users[i].badges = user.badges;
					}
					self.users[i].color = user.color;
					return true;
				}
			}
			return false;
		}
		partusr(username) {
			var index = -1;
			for(var i = 0; i < self.users.length; i++) {
				if(self.users[i].user == username) {
					index = i;
					break;
				}
			}
			if(index >= 0) {
				self.users.splice(index, 1);
			}
		}

		setcompact(c) {
			if(c != self.compact) {
				if(c) {
					self.chatmessages.classList.add("compact");
					self.user.style.display = "none";
					self.sendmessage.style.width = "300px";
					self.sendmessage.style.left = "calc(100% - 300px)";
					self.sendmessage.style.clear = "both";
				} else {
					self.chatmessages.classList.remove("compact");
					self.user.style.display = "block";
					self.sendmessage.style.width = "calc(100% - 300px)";
					self.sendmessage.style.left = "0";
					self.sendmessage.style.clear = "none";
				}
				self.compact = c;
			}
		}

		setemotes(emotes) {
			self.emotes = [];
			for(i in emotes.emoticon_sets) {
				if(emotes.emoticon_sets.hasOwnProperty(i))
					self.emotes.push(emotes.emoticon_sets[i]);
			}
			self.throttleupdate();
		}
		showemoticons(e) {
			self.emoticons.style.display = "block";
		}
		hideemoticons(e) {
			if(!e.target.classList.contains("ignoreemothide")) {
				self.emoticons.style.display = "none";
			}
		}
		addemote(e) {
			var code = e.target.dataset.code;
			var raex = new RandExp(code.replace("\\&lt\\;", "<").replace("\\&gt\\;", ">")).gen();
			self.sendmessage_inp.value += " " + raex;
		}

		send_message() {
			if(self._chat == null) return;
			if(self.sendmessage_inp.hasAttribute("readonly")) return;

			var m = self.sendmessage_inp.value;
			self.sendmessage_inp.setAttribute("readonly", "readonly");
			self._chat.sendmsg(self._channel, m);
		}

		hookchat(chat, channel) {
			self._chat = chat;
			self._channel = channel;
			return self;
		}
		setmessageavail() {
			self.sendmessage_inp.value = "";
			self.sendmessage_inp.removeAttribute("readonly");
		}
	</script>
</chat>