<modal onclick={ close }>
	
	<div class="modalv">
		<div class="modalh">
			<div class="modal">
				<a class="{modalclose: true, notclosable: !opts.closeable}" onclick="{ close }">&times;</a>
				<h1>{ opts.title }</h1>
				<div class="message"><raw content="{ opts.message }" /></div>
			</div>
		</div>
	</div>

	<style>
		modal {
			display: table;
			position: absolute;
			top: 0; left: 0; right: 0; bottom: 0;
			width: 100%; height: 100%;
			z-index: 1000;

			transition: opacity .5s ease-in;
		}
		modal > .modalv {
			display: table-row;
			text-align: center;
		}
		modal > .modalv > .modalh {
			display: table-cell;
			vertical-align: middle;
		}
		modal > .modalv > .modalh > .modal {
			display: inline-block;
			text-align: left;
			margin: auto;
			box-shadow: 0 0 5px rgba(0,0,0, 0.3);
			padding: 10px;
			max-width: 90%;
		}
		modal > .modalv > .modalh > .modal > a.modalclose {
			cursor: pointer;
			float: right;
			margin-left: 20px;
		}

		modal > .modalv > .modalh > .modal > a.modalclose.notclosable {
			display: none;
		}
		modal > .modalv > .modalh > .modal > h1 {
			float: left;
			margin: 0;
			margin-bottom: 10px;
		}
		modal > .modalv > .modalh > .modal > div {
			clear: both;
		}
	</style>
	<script>
		close(e) {
			if(opts.closeable) {
				_self = this.root;
				_self.style.opacity = 0;
				setTimeout(function(){ _self.parentNode.removeChild(_self); }, 500);
			}
		}
	</script>

</modal>