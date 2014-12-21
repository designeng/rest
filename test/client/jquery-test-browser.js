/*
 * Copyright 2012-2014 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

(function (buster, define) {
	'use strict';

	var assert, refute, fail, failOnThrow;

	assert = buster.assertions.assert;
	refute = buster.assertions.refute;
	fail = buster.assertions.fail;
	failOnThrow = buster.assertions.failOnThrow;

	define('rest/client/jquery-test', function (require) {

		var rest, responsePromise, when, client;

		client = require('rest/client/jquery');
		rest = require('rest');
		responsePromise = require('rest/util/responsePromise');
		when = require('when');

		buster.testCase('rest/client/jquery', {
			'should make a GET by default': function () {
				var request = { path: '/' };
				return client(request).then(function (response) {
					var jqXHR, name;
					jqXHR = response.raw.jqXHR;
					assert.same(request, response.request);
					assert.equals(response.request.method, 'GET');
					assert.equals(jqXHR.responseText, response.entity);
					assert.equals(jqXHR.status, response.status.code);
					assert.equals(jqXHR.statusText, response.status.text);
					for (name in response.headers) {
						/*jshint forin:false */
						assert.equals(jqXHR.getResponseHeader(name), response.headers[name]);
					}
					refute(request.canceled);
				}).otherwise(fail);
			},
			'should make an explicit GET': function () {
				var request = { path: '/', method: 'GET' };
				return client(request).then(function (response) {
					var jqXHR, name;
					jqXHR = response.raw.jqXHR;
					assert.same(request, response.request);
					assert.equals(response.request.method, 'GET');
					assert.equals(jqXHR.responseText, response.entity);
					assert.equals(jqXHR.status, response.status.code);
					assert.equals(jqXHR.statusText, response.status.text);
					for (name in response.headers) {
						/*jshint forin:false */
						assert.equals(jqXHR.getResponseHeader(name), response.headers[name]);
					}
					refute(request.canceled);
				}).otherwise(fail);
			},
			'should make a POST with an entity': function () {
				var request = { path: '/', entity: 'hello world' };
				return client(request).then(function (response) {
					var jqXHR, name;
					jqXHR = response.raw.jqXHR;
					assert.same(request, response.request);
					assert.equals(response.request.method, 'POST');
					assert.equals(jqXHR.responseText, response.entity);
					assert.equals(jqXHR.status, response.status.code);
					assert.equals(jqXHR.statusText, response.status.text);
					for (name in response.headers) {
						/*jshint forin:false */
						assert.equals(jqXHR.getResponseHeader(name), response.headers[name]);
					}
					refute(request.canceled);
				}).otherwise(fail);
			},
			'should make an explicit POST with an entity': function () {
				var request = { path: '/', entity: 'hello world', method: 'POST' };
				return client(request).then(function (response) {
					var jqXHR, name;
					jqXHR = response.raw.jqXHR;
					assert.same(request, response.request);
					assert.equals(response.request.method, 'POST');
					assert.equals(jqXHR.responseText, response.entity);
					assert.equals(jqXHR.status, response.status.code);
					assert.equals(jqXHR.statusText, response.status.text);
					for (name in response.headers) {
						/*jshint forin:false */
						assert.equals(jqXHR.getResponseHeader(name), response.headers[name]);
					}
					refute(request.canceled);
				}).otherwise(fail);
			},
			'should mixin additional properties': {
				requiresSupportFor: { timeout: XMLHttpRequest && 'timeout' in new XMLHttpRequest() },
				'': function () {
					var request = { path: '/', mixin: { timeout: 1000, foo: 'bar' } };
					return client(request).then(function (response) {
						var transformed = response.raw.transformed;
						assert.equals(transformed.timeout, 1000);
						assert.equals(transformed.foo, 'bar');
					}).otherwise(fail);
				}
			},
			'//should abort the request if canceled': function (done) {
				// TODO find an endpoint that takes a bit to respond, cached files may return synchronously
				// this test misbehavies in IE6, the response is recieved before the request can cancel
				var request = { path: '/wait/' + new Date().getTime() };
				when.all([
					client(request).then(
						fail,
						failOnThrow(function (response) {
							assert(request.canceled);
							try {
								// accessing 'status' will throw in older Firefox
								assert.same(0, response.raw.status);
							}
							catch (e) {
								// ignore
							}

							// this assertion is true in every browser except for IE 6
							// assert.same(XMLHttpRequest.UNSENT || 0, response.raw.readyState);
							assert(response.raw.readyState <= 3);
						})
					),
					when({}, function () {
						// push into when's nextTick resolution
						refute(request.canceled);
						request.cancel();
					})
				]).then(done, done);
			},
			'should propogate request errors': function () {
				// TODO follow up with Sauce Labs
				// this test is valid, but fails with sauce as their proxy returns a 400
				var request = { path: 'http://localhost:1234' };
				return client(request).then(
					fail,
					failOnThrow(function (response) {
						assert.same('', response.error);
					})
				);
			},
			'should not make a request that has already been canceled': function () {
				var request = { canceled: true, path: '/' };
				return client(request).then(
					fail,
					failOnThrow(function (response) {
						assert.same(request, response.request);
						assert(request.canceled);
						assert.same('precanceled', response.error);
					})
				);
			},
			'should normalize a string to a request object': function () {
				return client('/').then(function (response) {
					assert.same('/', response.request.path);
				}).otherwise(fail);
			},
			'should not be the default client': function () {
				rest.resetDefaultClient();
				refute.same(client, rest.getDefaultClient());
			},
			'should support interceptor wrapping': function () {
				assert(typeof client.wrap === 'function');
			},
			'should return a ResponsePromise': function () {
				assert(client() instanceof responsePromise.ResponsePromise);
			}
		});

	});

}(
	this.buster || require('buster'),
	typeof define === 'function' && define.amd ? define : function (id, factory) {
		var packageName = id.split(/[\/\-]/)[0], pathToRoot = id.replace(/[^\/]+/g, '..');
		pathToRoot = pathToRoot.length > 2 ? pathToRoot.substr(3) : pathToRoot;
		factory(function (moduleId) {
			return require(moduleId.indexOf(packageName) === 0 ? pathToRoot + moduleId.substr(packageName.length) : moduleId);
		});
	}
	// Boilerplate for AMD and Node
));