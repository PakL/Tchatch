
$(document).ready(function(){
	add_menulistener("user", function(){
		if(twauth.token.length > 0) {
			if(confirm("Möchten Sie ausloggen?")) {
				twauth.logout();
			}
		} else {
			twauth.login();
		}
	});
	if(typeof(global.localStorage.lastAuth) == "string" && global.localStorage.lastAuth.length > 0) {
		twauth.auth(global.localStorage.lastAuth);
	}
});