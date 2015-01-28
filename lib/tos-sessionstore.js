/* jshint maxcomplexity: 10 */
/* jshint expr: true */
/* jshint proto: true */
/* jshint unused: vars */
var request = require('superagent');

// export a constructor for session store
module.exports = function (connect, url) {
	'use strict';
	var Store = connect.session.Store;

	// construct with options (passed to connect's Store)
	function SessionStore(options) {
		if (!(this instanceof SessionStore)) {
			return new SessionStore(options);
		}
		options = options || {};
		Store.call(this, options);
		this.ttl = 60000;
	}

	// Inherit from `Store`.
	SessionStore.prototype.__proto__ = Store.prototype;

	// Attempt to fetch session by the given `sid`.
	SessionStore.prototype.get = function (sid, fn) {
		var dbkey = sid.split('.')[0]; // get rid of sid cruft
		request.get(url + '/session/' + dbkey)
			.accept('application/json')
			.end(function (err, res) {
				var expires;
				if (err) {
					fn(err);
				} else if (res.status !== 200) {
					fn();
				} else {
					var sess = res.body.session;
					expires = 'string' === typeof sess.cookie.expires ? new Date(sess.cookie.expires) : sess.cookie.expires;
					if (!expires || (new Date()) < expires) {
						fn(null, sess);
					} else {
						// just fire off a delete and hope - don't need to handle the response
						request.del(url + '/session/' + dbkey).end();
						fn('expired');
					}
				}
			});
	};

	// set the session, callback is optional
	SessionStore.prototype.set = function (sid, session, fn) {
		var dbkey = sid.split('.')[0]; // get rid of sid cruft
		request.put(url + '/session/' + dbkey)
			.accept('application/json')
			.set('Content-type', 'application/json')
			.send(session)
			.end();
		fn && fn.apply(this, arguments);
	};

	// destroy session, callback is optional
	SessionStore.prototype.destroy = function (sid, fn) {
		var dbkey = sid.split('.')[0]; // get rid of sid cruft
		request.del(url + '/session/' + dbkey)
			.end(function (err, res) { // caution here: arity of callback determines first argument
				if (err) {
					fn && fn(err);
				} else {
					fn && fn();
				}
			});
	};

	// return the constructor as the export
	return SessionStore;
};
