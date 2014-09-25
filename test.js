/* global describe: false */
/* global it: false */
/* global beforeEach: false */
/* global afterEach: false */
/* jshint unused: false */
/* jshint expr: true */
/* jshint maxcomplexity: 10 */

'use strict';

var should = require('should'),
	store = require('./lib/tos-sessionstore'),
	uuid = require('uuid');

describe('session store', function () {

	var fakeConnect = { session: { Store: function () {} } };

	describe('set and get', function (done) {
		it('can set a session and get it back', function (done) {
			var uniqueKey = uuid.v4(),
				futureExpireDate = new Date(),
				uniqueSession,
				testStore;
			
			// expires next year
			futureExpireDate.setFullYear(futureExpireDate.getFullYear() + 1);
			
			uniqueSession = { one:uuid.v4(), two:uuid.v4(), cookie: { expires: futureExpireDate.toString() } },
			testStore = store(fakeConnect, 'http://session.timeofstorms.com')({});
			
			testStore.set(uniqueKey, uniqueSession, function (err, res) {
				if (err) {
					done(err);
				} else {
					testStore.get(uniqueKey, function (err, sess) {
						if (err) {
							done(err);
						} else {
							if (uniqueSession.one !== sess.one ||
								uniqueSession.two !== sess.two) {
								done('wrong session data');
							} else {
								done();
							}
						}
					});
				}
			});
		});
		it('gets undefined if session has never been put', function (done) {
			var uniqueKey = uuid.v4(),
				testStore = store(fakeConnect, 'http://session.timeofstorms.com')({});

			testStore.get(uniqueKey, function (err, sess) {
				if (err === undefined && sess === undefined) {
					done();
				} else {
					done('should have returned undefined when getting non-existing session');
				}
			});
		});
		it('gets expired if session has expired', function (done) {
			var uniqueKey = uuid.v4(),
				pastExpireDate = new Date(),
				uniqueSession,
				testStore;
			
			// expires last year
			pastExpireDate.setFullYear(pastExpireDate.getFullYear() - 1);
			
			uniqueSession = { one:uuid.v4(), two:uuid.v4(), cookie: { expires: pastExpireDate.toString() } },
			testStore = store(fakeConnect, 'http://session.timeofstorms.com')({});
			
			testStore.set(uniqueKey, uniqueSession, function (err, res) {
				if (err) {
					done(err);
				} else {
					testStore.get(uniqueKey, function (err, sess) {
						if (err === 'expired') {
							done();
						} else {
							done('session should have expired');
						}
					});
				}
			});
		});
	});
});