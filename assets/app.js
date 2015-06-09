var viewIsLoaded = false;
window.onload = function() {
	var webview = document.querySelector('#mainwebview');
	var browserControl = new BrowserControl('#mainwebview', webview.src);
	var titlebar = new TitleBar('left', 'assets/icon16.png', 'Cloud 9 IDE Shortcut', true, browserControl);
	titlebar.bind();

	var isLoaded = false;
	var loading = setTimeout(function() {
		document.querySelector('#mainwebview').reload();
	}, 10000);

	webview.addEventListener('contentload', function() {
		if (loading) {
			clearTimeout(loading);
			loading = null;
		}
		if (!isLoaded) {
			isLoaded = true;
		}
	});
	webview.addEventListener('permissionrequest', function(e) {
		if (e.permission === 'download') {
			if (e.url.search('c9.io') !== -1 || e.url.search('cloud9beta.com') !== -1) {
				e.request.allow();
			}
		}
		else if (e.permission === 'fullscreen') {
			e.request.allow();
		}
	});
	webview.addEventListener('loadstart', function() {
		viewIsLoaded = false;
	});
	webview.addEventListener('loadstop', function() {
		viewIsLoaded = true;
	});
	webview.addEventListener('newwindow', function(e) {
		e.preventDefault();
		document.querySelector('#mainwebview').src = e.targetUrl;
		//window.open(e.targetUrl);
	});
	webview.addEventListener('dialog', function(e) {
		if (e.messageType === 'prompt') {
			console.error('prompt dialog not handled!');
			return;
		}

		document.querySelector('#dialog-title').innerHTML = 'Dialog ' + e.messageType;
		document.querySelector('#dialog-content').innerHTML = e.messageText;

		if (e.messageType === 'confirm') {
			document.querySelector('#dialog-cancel').style.display = 'inline';
		}
		else {
			document.querySelector('#dialog-cancel').style.display = 'none';
		}

		e.preventDefault();

		returnDialog = e.dialog;

		document.querySelector('#dialog').showModal();
	});

	var returnDialog = null;
	document.querySelector('#dialog').addEventListener('close', function() {
		if (returnDialog) {
			returnDialog.cancel();
			returnDialog = null;
		}
	});
	document.querySelector('#dialog-ok').addEventListener('click', function() {
		returnDialog.ok();
		returnDialog = null;
		document.querySelector('#dialog').close();
	});
	document.querySelector('#dialog-cancel').addEventListener('click', function() {
		returnDialog.cancel();
		returnDialog = null;
		document.querySelector('#dialog').close();
	});
};
