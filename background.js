chrome.app.runtime.onLaunched.addListener(function (launchData) {
	chrome.app.window.create(
		'browser.html', {
			id: 'mainC9Window',
			state: 'maximized',
			frame: 'none'
		}
	);
});
