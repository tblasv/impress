(function(impress) {
	/**
	 * @namespace impress
	 * @mixes application
	 */

	require('./global');
	require('./impress.constants');
	require('./impress.utils');
	require('./impress.client');

	/** @type {boolean} */
	impress.isMainApplication = true;

	/** @type {boolean} */
	impress.isWin = !!process.platform.match(/^win/);


	// Node.js internal modules
	//
	/**
	 * @namespace
	 * @see {@link http://nodejs.org/api/os.html}
	 */
	impress.os = require('os');

	/**
	 * @namespace
	 * @see {@link http://nodejs.org/api/vm.html}
	 */
	impress.vm = require('vm');

	/**
	 * @namespace
	 * @see {@link http://nodejs.org/api/domain.html}
	 */
	impress.domain = require('domain');

	/**
	 * @namespace
	 * @see {@link http://nodejs.org/api/crypto.html}
	 */
	impress.crypto = require('crypto');

	/**
	 * @namespace
	 * @see {@link http://nodejs.org/api/net.html}
	 */
	impress.net = require('net');

	/**
	 * @namespace
	 * @see {@link http://nodejs.org/api/http.html}
	 */
	impress.http = require('http');

	/**
	 * @namespace
	 * @see {@link http://nodejs.org/api/https.html}
	 */
	impress.https = require('https');

	/**
	 * @namespace
	 * @see {@link http://nodejs.org/api/dns.html}
	 */
	impress.dns = require('dns');

	/**
	 * @namespace
	 * @see {@link http://nodejs.org/api/dgram.html}
	 */
	impress.dgram = require('dgram');

	/**
	 * @namespace
	 * @see {@link http://nodejs.org/api/url.html}
	 */
	impress.url = require('url');

	/**
	 * @namespace
	 * @see {@link http://nodejs.org/api/path.html}
	 */
	impress.path = require('path');

	/**
	 * @namespace
	 * @see {@link http://nodejs.org/api/fs.html}
	 */
	impress.fs = require('fs');
	
	//impress.util = require('util');

	/**
	 * @namespace
	 * @see {@link http://nodejs.org/api/events.html}
	 */
	impress.events = require('events');

	/**
	 * @namespace
	 * @see {@link http://nodejs.org/api/cluster.html}
	 */
	impress.cluster = require('cluster');

	/**
	 * @namespace
	 * @see {@link http://nodejs.org/api/querystring.html}
	 */
	impress.querystring = require('querystring');

	/**
	 * @namespace
	 * @see {@link http://nodejs.org/api/readline.html}
	 */
	impress.readline = require('readline');

	/**
	 * @namespace
	 * @see {@link http://nodejs.org/api/stream.html} 
	 */
	impress.stream = require('stream');

	/**
	 * @namespace
	 * @see {@link http://nodejs.org/api/zlib.html}
	 */
	impress.zlib = require('zlib');

	/**
	 * @namespace
	 * @see {@link http://nodejs.org/api/child_process.html}
	 */
	impress.exec = require('child_process').exec;

	// External modules
	//
	/**
	 * @namespace
	 * @see {@link https://github.com/caolan/async}
	 */
	impress.async = require('async');

	/**
	 * @namespace
	 * @see {@link https://github.com/substack/node-mkdirp}
	 */
	impress.mkdirp = require('mkdirp');

	/**
	 * @namespace
	 * @see {@link https://github.com/Marak/colors.js}
	 */
	impress.colors = require('colors');

	/**
	 * @namespace
	 * @see {@link https://github.com/andrewrk/node-multiparty}
	 */
	impress.multiparty = require('multiparty');

	/**
	 * @namespace
	 * @see {@link https://github.com/ashtuchkin/iconv-lite}
	 */
	impress.iconv = require('iconv-lite');

	/**
	 * @namespace
	 * @see {@link https://github.com/npm/npm}
	 */
	impress.npm = require("npm");


	/**
	 * Path to root directory
	 * @type {string}
	 */
	impress.dir = process.cwd().replace(/\\/g, '/');

	/**
	 * Path to "[root]/applications" directory
	 * @type {string}
	 */
	impress.applicationsDir = impress.dir+'/applications';

	/**
	 * Path to default template pages. (error.template, index.template, introspection.template)
	 * @type {string}
	 */
	impress.templatesDir = impress.path.dirname(__dirname)+'/templates/';

	function logException(err) {
		var path = impress.isWin ? impress.dir.replace(/\//g, '\\') : impress.dir,
			rxPath = new RegExp(escapeRegExp(path), 'g'),
			stack = err.stack.replace(rxPath, '');
		if (impress.cluster.isMaster) console.log('Exception in master process'.red);
		if (impress.log) {
			stack = stack.replace(/\n\s{4,}at/g, ';');
			impress.log.error(stack);
		} else console.log(stack);
	}

	process.on('uncaughtException', function(err) {
		logException(err);
		impress.shutdown();
	});

	/**
	 * Impress safe require
	 * @param {string} moduleName
	 * @returns {*}
	 */
	impress.require = function(moduleName) {
		var lib = null;
		try { lib = require(moduleName); } catch(err) {}
		if (impress.cluster.isMaster && lib === null) {
			console.log(
				'Warning: module '+moduleName+' is not installed\n'.yellow.bold+
				'  You need to install it using '+('npm install '+moduleName).bold+' or disable in config\n'
			);
			if (impress.log) impress.log.error('Warning: module '+moduleName+' is not installed');
		}
		return lib;
	};

	/**
	 * @type {{forkCount: number, eventCount: number, requestCount: number, responseCount: number}}
	 */
	impress.stat = {
		forkCount: 0,
		eventCount: 0,
		requestCount:  0,
		responseCount: 0
	};

	/** @type {Object<name,application>} */
	impress.applications = {};

	/**
	 * @namespace impress.server
	 * @see {@link http://nodejs.org/api/events.html#events_class_events_eventemitter.html|impress.events.EventEmitter}
	 * @extends impress.events.EventEmitter
	 */
	impress.server = new impress.events.EventEmitter();

	/** @type {string} */
	impress.configDir = impress.dir+'/config';

	/** @type {Array} */
	impress.workers = [];

	/** @type {Array} */
	impress.longWorkers = [];

	/**
	 * Mixin application methods to given object
	 * Application should have:
	 * 	.dir       - application root
	 * 	.configDir - application configuration
	 */
	function mixinApplication(/** @mixin application */ application) {

		/**
		 *
		 * Compile, execute and save script exports to cache or get exports from cache,
		 * callback(err, key, exports), where exports - function or object exported from script
		 *
		 * @param key
		 * @param fileName
		 * @param callback
		 */
		application.createScript = function(key, fileName, callback) {
			var application = this,
				exports = application.cache.scripts[fileName];
			if (exports) callback(null, key, exports);
			else {
				impress.fs.readFile(fileName, function(err, code) {
					if (!err) {
						var scriptName = fileName.replace(application.isMainApplication ? impress.dir : impress.applicationsDir, ''),
							script = impress.vm.createScript(code, scriptName);
						exports = script.runInNewContext(application.sandbox);
						application.cache.scripts[fileName] = exports;
					}
					callback(null, key, exports);
				});
			}
		};

		/**
		 * Run script in application context
		 *
		 * @param fileName
		 * @param client
		 * @param callback
		 */
		application.runScript = function(fileName, client, callback) {
			var itemName = impress.path.basename(fileName, '.js');
			this.createScript(null, fileName, function(err, key, fn) {
				if (itemName == 'access') {
					client.access = fn;
					callback();
				} else if (itemName == 'meta') {
					client.meta = fn;
					callback();
				} else {
					var executionDomain = impress.domain.create();
					executionDomain.on('error', function(err) {
						client.error(500);
						logException(err);
						callback();
					});
					executionDomain.run(function() {
						fn(client, callback);
					});
				}
			});
		};

		/**
		 * Create application sandbox
		 */
		application.createSandbox = function() {
			var sandbox = { module:{} },
				modules = (impress.config && impress.config.sandbox) ? impress.config.sandbox.modules : impress.defaultSandboxModules;
			for (var i = 0; i < modules.length; i++) {
				var moduleName = modules[i],
					module = impress[moduleName];
				if (!module) module = global[moduleName];
				if (module) sandbox[moduleName] = module;
			}
			sandbox.application = this;
			this.sandbox = impress.vm.createContext(sandbox);
		};
		application.createSandbox();

		/**
		 * Load configuration files
		 * 		callback(application)
		 * @param callback
		 */
		application.loadConfig = function(callback) {
			var application = this;
			application.config = {};
			impress.fs.readdir(application.configDir, function(err, files) {
				if (files) {
					var cbCount = files.length, cbIndex = 0;
					for (var i in files) {
						var file = files[i],
							configFile = application.configDir+'/'+file;
						if (file.indexOf(".js") != -1) {
							var sectionName = file.replace('.js', '');
							application.createScript(sectionName, configFile, function(err, key, exports) {
								application.config[key] = exports;
								if (++cbIndex>=cbCount && callback) callback(application);
							});
						} else if (++cbIndex>=cbCount && callback) callback(application);
					}
				} else callback(application);
			});
			impress.utils.watchCache(application, application.configDir+'/');
		};

		/**
		 * Preprocess application configuration
		 */
		application.preprocessConfig = function() {
			var application = this,
				config = application.config;
			if (config.hosts) application.hostsRx = arrayRegExp(config.hosts);
			if (config.files && config.files.static) config.files.staticRx = arrayRegExp(config.files.static);
			if (config.application) config.application.slowTime = duration(config.application.slowTime || impress.defaultSlowTime);

			// Prepare application routes
			if (config.routes) {
				var routes = config.routes;
				for (var i = 0; i < routes.length; ++i) {
					var route = routes[i];
					route.urlRx = new RegExp('^'+route.url.replace(/(\/|\?|\.)/g, "\\$1").replace(/\(\\\.\*\)/, "(.*)")+'$');
					route.slowTime = duration(route.slowTime || impress.defaultSlowTime);
				}
			}
		};

		/**
		 * Create or clear application cache
		 */
		application.clearCache = function() {
			delete this.config;
			if (this.cache) {
				for (var watcherPath in this.cache.watchers) {
					var watcher = this.cache.watchers[watcherPath];
					for (var key in watcher.timers) clearTimeout(watcher.timers[key]);
					watcher.close();
				}
			}
			this.cache = {
				templates: [], // template body cache indexed by file name
				files:     [], // file override/inherited cache indexed by file name
				scripts:   [], // compiled vm scripts
				watchers:  [], // directory watchers indexed by directory name
				static:    [], // static files cache
				pages:     []  // rendered pages cache
			}
		};
		application.clearCache();
	}

	mixinApplication(impress);

	// Load plugins
	//
	function loadPlugins() {
		if (impress.config.plugins) {
			if (impress.cluster.isMaster && impress.config.plugins.indexOf("impress.log") == -1) {
				console.log('Warning: plugin impress.log.js is not included into config require section'.yellow.bold);
			}
			// Load plugins
			for (var i = 0; i < impress.config.plugins.length; i++) {
				var pluginName = './plugins/'+impress.config.plugins[i]+'.js',
					cache = require.cache[require.resolve(pluginName)];
				if (!cache) require(pluginName);
			}
		}
	}

	// Load applications
	//
	function loadApplications(callback) {
		impress.fs.readdir(impress.applicationsDir, function(err, apps) {
			var cbCount = apps.length, cbIndex = 0;
			for (var i in apps) {
				var appName = apps[i],
					appDir = impress.applicationsDir+'/'+appName,
					stats = impress.fs.statSync(appDir);
				if (stats.isDirectory() && (!impress.workerApplicationName || impress.workerApplicationName == appName)) {
					var application = new impress.events.EventEmitter();
					extend(application, { name:appName, dir:appDir, configDir:appDir+'/config', users:[], sessions:[] });
					mixinApplication(application);
					application.loadConfig(function(application) {
						application.preprocessConfig();
						impress.applications[application.name] = application;
						if (global.db) db.openApplicationDatabases(application, function() {
							if (++cbIndex>=cbCount && callback) callback();
						}); else if (++cbIndex>=cbCount && callback) callback();
					});
				} else if (++cbIndex>=cbCount && callback) callback();
			}
		});
	}

	// Fatal error with process termination
	//
	function fatalError(msg) {
		impress.log.error(msg);
		console.log(msg.red);
		process.exit(1);
	}

	var isFirstStart = true;


	/**
	 * Start servers
	 */
	impress.server.start = function() {
		impress.workerId = impress.cluster.isMaster ? 0 : process.env['WORKER_ID'];
		impress.serverName = process.env['WORKER_SERVER_NAME'];
		if (impress.cluster.isMaster) console.log('Impress Application Server'.bold.green+' starting, reading configuration'.green);
		impress.loadConfig(function() {
			loadPlugins();
			if (impress.log) impress.log.open();
			if (impress.workerId == 'long') {
				impress.nodeId = impress.config.cluster.name+'L'+process.pid;
				impress.processMarker = 'Worker'+'('+impress.nodeId+')';
				impress.workerApplicationName = process.env["WORKER_APPNAME"];
				impress.workerApplicationFile = process.env["WORKER_FILE"];
				impress.workerApplicationClient = JSON.parse(process.env["WORKER_CLIENT"]);
			} else {
				impress.nodeId = impress.config.cluster.name+'N'+impress.workerId;
				process.title = 'impress'+(impress.cluster.isMaster ? ' srv':' '+impress.nodeId);
				impress.processMarker = (impress.cluster.isMaster ? 'Master':'Worker')+'('+process.pid+'/'+impress.nodeId+')';
			}
			if (impress.cluster.isMaster && impress.config.cluster && impress.config.cluster.check) {
				console.log('Startup check: '.green+impress.config.cluster.check);
				impress.http.get(impress.config.cluster.check, function(res) {
					if (res.statusCode == 404) startup();
					else fatalError('Status: server is already started');
				}).on('error', startup);
			} else startup();
		});

		function startup() {
			if (!impress.workerApplicationName) startWorkers();
			loadApplications(function() {
				impress.server.emit("start");
				if (impress.cluster.isMaster) {
					impress.log.server('Started');
					impress.server.emit("master");
				} else impress.server.emit("worker");
				if (impress.workerApplicationName) {
					var application = impress.applications[impress.workerApplicationName];
					application.runScript(impress.workerApplicationFile, impress.workerApplicationClient, function() {
						process.exit(0);
					});
				}
			});
			if (!impress.workerApplicationName) {
				startServers();
				if (impress.health) impress.health.init();
				if (impress.cloud)  impress.cloud.init();
				if (global.cms) cms.init();
			}

			// Set garbage collection interval
			var gcInterval = duration(impress.config.cluster.gc);
			if (typeof(global.gc) === 'function' && gcInterval > 0) {
				setInterval(function() {
					global.gc();
				}, gcInterval*1000);
			}
			isFirstStart = false;
		}
	};

	/**
	 * Unload configuration and stop server
	 * @param callback
	 */
	impress.server.stop = function(callback) {
		var servers = impress.config.servers,
			cbCount = Object.keys(servers).length,
			cbIndex = 0;
		for (var serverName in servers) {
			var server = servers[serverName];
			if (server.listener) server.listener.close(function() {
				if (++cbIndex>=cbCount && callback) {
					impress.clearCache();
					for (var appName in impress.applications) impress.applications[appName].clearCache();
					callback();
				}
			}); else if (++cbIndex>=cbCount && callback) callback();
		}
	};

	/**
	 * Reload configuration and restart server
	 */
	impress.server.restart = function() {
		if (impress.config) impress.stop(function() {
			if (impress.cluster.isMaster) console.log('Reloading server configuration'.green);
			//TODO reload config after restart
			//impress.config = loadConfig(configDir); //loadConfig is not exist
			//loadApplications();
			//preprocessConfiguration();
			impress.start();
		});
	};

	/**
	 * Final shutdown
	 */
	impress.shutdown = function() {
		if (impress.cluster.isMaster) {
			var workerId;
			impress.log.server('Stopped');
			impress.server.stop();
			for (workerId = 0; workerId < impress.workers.length; workerId++) {
				impress.workers[workerId].kill();
			}
			for (workerId = 0; workerId < impress.longWorkers.length; workerId++) {
				impress.longWorkers[workerId].kill();
			}
			console.log('Impress shutting down'.bold.green);
		}
		if (impress.log) impress.log.close(function() {
			process.exit(0);
		});
	};

	// Start TCP, HTTP and HTTPS servers
	//
	function startServers() {
		var servers = impress.config.servers,
			workerId = 0;
		for (var serverName in servers) {
			var server = servers[serverName],
				single = impress.config.cluster.strategy == "single",
				specialization = impress.config.cluster.strategy == "specialization",
				cloned = impress.config.cluster.strategy == "multiple" || impress.config.cluster.strategy == "sticky",
				master = impress.cluster.isMaster,
				certificate = null;

			if (server.protocol == "https") {
				if (server.key && server.cert) {
					var certDir = impress.configDir+'/ssl/';
					certificate = {
						key:  impress.fs.readFileSync(certDir+server.key),
						cert: impress.fs.readFileSync(certDir+server.cert)
					};
				} else fatalError('SSL certificate is not configured for HTTPS');
			}
			if (master) {
				if (single) {
					if (server.protocol == "https")
						server.listener = impress.https.createServer(certificate, impress.dispatcher);
					else server.listener = impress.http.createServer(impress.dispatcher);
					if (impress.websocket) impress.websocket.upgradeServer(server.listener);
				} else if (cloned) {
					if (impress.config.cluster.strategy == "sticky")
						server.listener = impress.net.createServer(balancer);
					else server.listener = {
						close: function(callback) { callback(); },
						on: function() { },
						listen: function() { }
					};
				} else if (specialization && isFirstStart) impress.fork(workerId++, serverName);
				console.log('  listen on '+server.address+':'+server.port);
			} else if (cloned || impress.serverName == serverName) {
				if (server.protocol == "https")
					server.listener = impress.https.createServer(certificate, impress.dispatcher);
				else server.listener = impress.http.createServer(impress.dispatcher);
				if (impress.websocket) impress.websocket.upgradeServer(server.listener);
			}
			if (server.listener) {
				server.listener.slowTime = duration(server.slowTime || impress.defaultSlowTime);
				server.listener.on('error', function(e) {
					if (e.code == 'EADDRINUSE' || e.code == 'EACCESS' || e.code == 'EACCES') fatalError('Can`t bind to host/port');
				});
				server.listener.serverName = serverName;
				if ((master && !specialization) || (!master && !cloned)) {
					if (server.nagle === false) {
						server.listener.on('connection', function(socket) {
							socket.setNoDelay();
						});
					}
					server.listener.listen(server.port, server.address);
				} else {
					if (impress.config.cluster.strategy == "sticky") server.listener.listen(null);
					else server.listener.listen(server.port, server.address);
				}
			}
		}
	}	

	// Start workers
	//
	function startWorkers() {
		process.on('SIGINT', impress.shutdown);
		process.on('SIGTERM', impress.shutdown);

		if (impress.cluster.isMaster) {
			impress.forkCount = 0;
			impress.workers = [];
			if (impress.config.cluster.strategy == "multiple" || impress.config.cluster.strategy == "sticky") {
				for (var workerId = 0; workerId < impress.config.cluster.workers; workerId++) {
					if (isFirstStart) impress.fork(workerId);
				}
			}
		} else {
			process.on('message', function(message, socket) {
				if (message.name == 'impress:socket') {
					var servers = impress.config.servers;
					for (var serverName in servers) {
						var server = servers[serverName];
						if (server.address == message.address && server.port == message.port) {
							socket.server = server.listener;
							server.listener.emit('connection', socket);
						}
					}
				} else if (impress.sse && message.name == 'impress:event') {
					// Retranslate events from master to worker
					if (message.user) impress.sse.sendToUser(null, message.user, message.event, message.data, true);
					else if (message.channel) impress.sse.sendToChannel(null, message.channel, message.event, message.data, true);
					else if (message.global) impress.sse.sendGlobal(null, message.event, message.data, true);
				}
			});
		}
	}

	/**
	 * Fork new worker
	 * bind worker to serverName from config if serverName defined
	 *
	 * @param workerId
	 * @param serverName
	 */
	impress.fork = function(workerId, serverName) {
		var worker, env = {};
		env["WORKER_ID"] = workerId+1;
		if (typeof(serverName) !== "undefined") env["WORKER_SERVER_NAME"] = serverName;
		worker = impress.cluster.fork(env);
		worker.nodeId = impress.config.cluster.name+'N'+(workerId+1);
		impress.workers[workerId] = worker;

		worker.on('exit', function(code, signal) {
			if (worker && !worker.suicide) {
				impress.stat.forkCount++;
				impress.fork(workerId);
			}
		});
	
		// Initialize IPC for interprocess event routing, from worker to master
		worker.on('message', function(msg) {
			if (msg.name == 'impress:event') { // propagate to all workers except of original sender
				impress.stat.eventCount++;
				if (impress.cluster.isMaster && impress.config.cloud && (impress.config.cloud.type == "server")) {
					impress.cloud.req.send(JSON.stringify(msg));
				}
				for (var id = 0; id < impress.workers.length; id++) {
					if ((id != workerId) && impress.workers[id]) impress.workers[id].send(msg);
				}
			}
		});
	};

	/**
	 * Dispatch requests
	 *
	 * @param req
	 * @param res
	 */
	impress.dispatcher = function(req, res) {
		impress.stat.requestCount++;
		var client = new impress.Client(req, res),
			isDispatched = false,
			staticRx = null;
		for (var appName in impress.applications) {
			var application = impress.applications[appName];
			if (application.hostsRx.test(client.host)) {
				client.application = application;
				if (application.config.files.staticRx) staticRx = application.config.files.staticRx;
				if (application.config.application.slowTime) client.slowTime = application.config.application.slowTime;
				client.hostDir = application.dir+'/app';
				if (staticRx && staticRx.test(client.url)) {
					client.static();
					return;
				} else {
					if (application.config.routes) {
						for (var iRoute = 0; iRoute < application.config.routes.length; ++iRoute) {
							var route = application.config.routes[iRoute],
								match = req.url.match(route.urlRx);
							if (match) {
								if (route.slowTime) client.slowTime = route.slowTime;
								var urlRoute = req.url;
								if (route.rewrite && match.length > 1) {
									urlRoute = route.rewrite.replace(/\[([0-9]+)\]/g, function(s, key) {
										return match[key] || s;
									});
								} else urlRoute = route.rewrite;
								if (route.host) client.proxy(route.host, route.port || 80, urlRoute);
								else {
									if (req.isRouted) client.error(508); else {
										req.url = urlRoute;
										req.isRouted = true;
										impress.dispatcher(req, res);
									}
								}
								return;
							}
						}
					}
					if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
						var contentType = req.headers['content-type'];
						if (contentType && contentType.startsWith('multipart')) {
							var form = new impress.multiparty.Form();
							form.parse(req, function(err, fields, files) {
								if (err) {
									client.error(400);
									return;
								} else {
									client.files = files;
									client.fields = fields;
									client.restoreSession();
								}
							});
						} else {
							client.data = "";
							req.on("data", function(chunk) {
								client.data += chunk;
							});
							req.on("end", function() {
								client.fields = impress.querystring.parse(client.data);
								client.restoreSession();
							});
						}
					} else client.restoreSession();
					return;
				}
			}
		}
		if (!isDispatched) client.error(404);
	};

	/**
	 * Generate SID
	 *
	 * @param config
	 * @returns {*}
	 */
	impress.generateSID = function(config) {
		var key = generateKey(
			config.sessions.length-2,
			config.sessions.characters
		);
		return key+impress.crcSID(config, key);
	};

	/**
	 * Calculate SID CRC
	 *
	 * @param config
	 * @param key
	 * @returns {string}
	 */
	impress.crcSID = function(config, key) {
		var c1 = key.indexOf(key.charAt(key.length-1)),
			c2 = key.indexOf(key.charAt(key.length-2)),
			s1 = config.sessions.characters.charAt(c1),
			s2 = config.sessions.characters.charAt(c2);
		return s1+s2;
	};

	/**
	 * Validate SID
	 *
	 * @param config
	 * @param sid
	 * @returns {boolean}
	 */
	impress.validateSID = function(config, sid) {
		if (!sid) return false;
		var crc = sid.substr(sid.length-2),
			key = sid.substr(0, sid.length-2);
		return impress.crcSID(config, key) == crc;
	};

	/**
	 * Balancer for sticky mode
	 *
	 * @param socket
	 */
	function balancer(socket) {
		var ip;
		if (impress.config.cluster.strategy == "sticky") ip = ip2int(socket.remoteAddress);
		else if (impress.config.cluster.strategy == "multiple") ip = ~~(Math.random()*impress.workers.length);

		var worker = impress.workers[Math.abs(ip) % impress.workers.length],
			server = impress.config.servers[socket.server.serverName];
		worker.send({ name: 'impress:socket', address: server.address, port: server.port }, socket);
	}


	/**
	 * Substitute variables with values
	 * @param tpl - template body
	 * @param data - global data structure to visualize
	 * @param cur - current position in data structure
	 * @returns {string} - result body
	 */
	impress.subst = function(tpl, data, cur) {
		tpl = tpl.replace(/@([\-\.0-9a-zA-Z]+)@/g, function(s, key) {
			var name, pos = key.indexOf(".");
			if (pos == 0) name = cur+key; else name = key;
			var value = impress.value(data, name);
			if (typeof(value) == 'object') value = '[not found: '+key+']';
			return value;
		});
		return tpl;
	};

	/**
	 * Return value from data structure
	 * @param data
	 * @param name
	 * @returns {*}
	 */
	impress.value = function(data, name) {
		var obj = data;
		name = name.split(".");
		for (var i = 0; i < name.length; ++i) obj = obj[name[i]] || obj;
		return obj;
	};


} (global.impress = /** @class */global.impress || {}));