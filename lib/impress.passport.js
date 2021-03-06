"use strict";

(function(impress) {

    impress.passport = impress.passport || {};

	impress.passport.mixinApplication = function (application) {
		if (application.config.passport) {
			application.passport = {};
			var passport = application.config.passport.lib,
				strategies = {},
				handlers = [passport.initialize(), passport.session()],
				providers = application.config.passport.strategies;
			if (providers) {
				var provider, providerId;
				for (var providerName in providers) {
					provider = providers[providerName];
					providerId = application.name+'/'+providerName;
					provider.param.passReqToCallback = true;
					passport.use(providerId, new provider.strategy(provider.param, provider.authenticate));
					strategies[providerName] = {
						authenticate: passport.authenticate(providerId, { scope: provider.scope || '' }),
						authenticateCallback: passport.authenticate(providerId, {
							successRedirect: provider.successRedirect,
							failureRedirect: provider.failureRedirect
						})
					};
				}
				application.passport.mixinClient = function(client) {
					client.passport = {};
					client.passport.strategies = strategies;
					client.req.query = client.query;
					client.res.redirect = function (url) { client.redirect(url); client.res.end(); };
					client.passport.init = function() {
						if (!client.session) client.startSession();
						client.req.session = client.application.sessions[client.session];
						impress.async.eachSeries(handlers, function(handler, callback) {
							handler(client.req, client.res, callback);
						}, function(err) {
                            if (client.req.user) {
                                client.logged = true;
                                client.user = client.req.user;
                            }
							client.processing();
						});
					}
				};
			}
		}
	};

} (global.impress = global.impress || {}));