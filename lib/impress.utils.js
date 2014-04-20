(function(impress) {

	var utils = impress.utils = {};

	utils.fileExt = function(fileName) {
		return impress.path.extname(fileName).replace('.','');
	};


	utils.isTimeEqual = function(since, mtime) {
		return (new Date(mtime)).getTime() == (new Date(since)).getTime();
	};


	// Refresh static in memory cache with compression and minification
	//    required parameters: filePath, stats
	//    optional parameters: client, httpCode
	//
	utils.compress = function(filePath, stats, application, client, httpCode) {
		impress.fs.readFile(filePath, function(error, data) {
			if (error) {
				if (client) client.error(404);
			} else {
				var ext = client ? client.typeExt : utils.fileExt(filePath);
				if (ext == 'js' && application.config.files.minify) {
					data = impress.minify(data);
					stats.size = data.length;
				}
				if (!inArray(impress.compressedExt, ext) && stats.size>impress.compressAbove) {
					impress.zlib.gzip(data, function(err, data) {
						stats.size = data.length;
						if (client) {
							client.res.writeHead(httpCode, utils.baseHeader(ext, stats, true));
							client.end(data);
						}
						application.cache.static[filePath] = {data:data, stats:stats, compressed: true};
					});
				} else {
					if (client) {
						client.res.writeHead(httpCode, utils.baseHeader(ext, stats));
						client.end(data);
					}
					application.cache.static[filePath] = {data:data, stats:stats, compressed: false};
				}
				utils.watchCache(application, filePath);
			}
		});
	};

	// Send HTTP headers
	//
	utils.baseHeader = function(ext, stats, compressed) {
		compressed = typeof(compressed) !== 'undefined' ? compressed : false;
		var header = {
			'Transfer-Encoding': 'chunked',
			'Content-Type': impress.mimeTypes[ext],
			'Cache-Control': 'public'
		};
		if (!inArray(impress.compressedExt, ext) && compressed) header['Content-encoding'] = 'gzip';
		if (stats) {
			//var start = 0, end = stats.size-1;
			//header['Accept-Ranges' ] = 'bytes';
			//header['Content-Range' ] = 'bytes '+start+'-'+end+'/'+stats.size;
			header['Content-Length'] = stats.size;
			header['Last-Modified' ] = stats.mtime.toGMTString();
		}
		return header;
	};



	// Clear cache hash starts with given substring
	//
	function clearCacheStartingWith(cache, startsWith, callback) {
		for (var key in cache) {
			if (key.startsWith(startsWith)) {
				delete cache[key];
				if (callback) callback(key);
			}
		}
	}

	// Cache watchers
	//
	utils.watchCache = function(application, filePath) {
		var path = filePath;
		if (!filePath.endsWith("/")) path = impress.path.dirname(path)+"/";
		if (application) {
			var watcher = application.cache.watchers[path];
			if (!watcher) {
				impress.fs.exists(path, function(exists) {
					if (exists) {
						watcher = impress.fs.watch(path, function(event, fileName) {
							var filePath = (fileName) ? path+fileName : path,
								ext = utils.fileExt(fileName),
								watcher = application.cache.watchers[path];
							if (watcher.timers[filePath]) clearTimeout(watcher.timers[filePath]);
							watcher.timers[filePath] = setTimeout(function() {
								impress.fs.stat(filePath, function(err, stats) {
									if (err) return;
									if (stats.isFile()) {
										if (application.cache.static[filePath]) {
											// Replace static files memory cache
											impress.fs.exists(filePath, function(exists) {
												if (exists) utils.compress(filePath, stats, application);
											});
										} else if (ext == 'js' && (filePath in application.cache.scripts)) {
											// Replace changed js file in cache
											impress.fs.exists(filePath, function(exists) {
												if (exists) {
													application.cache.scripts[filePath] = null;
													application.createScript('', filePath, function(err, key, exports) {
														application.cache.scripts[filePath] = exports;
														if (filePath.startsWith(application.configDir)) {
															var sectionName = filePath.replace(application.configDir+'/','').replace('.js', '');
															application.config[sectionName] = exports;
															application.preprocessConfig();
														}
													});
												} else {
													delete application.cache.scripts[filePath];
													if (filePath.startsWith(application.configDir)) {
														var sectionName = filePath.replace(application.configDir+'/','').replace('.js', '');
														delete application.config[sectionName];
													}
												}
											});
										} else if (ext == 'template') {
											// Replace changed template file in cache
											delete application.cache.templates[filePath];
											delete application.cache.files[filePath];
											impress.fs.exists(filePath, function(exists) {
												if (exists) impress.fs.readFile(filePath, 'utf8', function(err, tpl) {
													if (!err) {
														if (!tpl) tpl = impress.fileIsEmpty;
														else tpl = tpl.replace(/^[\uBBBF\uFEFF]/, '');
														application.cache.templates[filePath] = tpl;
														clearCacheStartingWith(application.cache.pages, path);
													}
												});
											});
										}
									} else {
										// Clear cache for all changed folders (created or deleted files)
										clearCacheStartingWith(application.cache.static, filePath);
										clearCacheStartingWith(application.cache.files, filePath, function(used) {
											var ext = utils.fileExt(used);
											if (ext == 'js' && (used in application.cache.scripts)) {
												delete application.cache.scripts[used];
											} else if (ext == 'template' && (used in application.cache.templates)) {
												delete application.cache.templates[used];
											}
										});
										clearCacheStartingWith(application.cache.pages, filePath);
									}
								});
							}, 2000);
						});
						watcher.timers = [];
						application.cache.watchers[path] = watcher;
					}
				});
			}
		}
	}

} (global.impress = global.impress || {}));
