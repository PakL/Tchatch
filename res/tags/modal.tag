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