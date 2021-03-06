"use strict";

(function(db) {

	var driver = impress.require('pg');

	if (driver) {
		db.drivers.pgsql = driver;
		db.pgsql = {};

		// Open pgsql database
		//
		// Example:
		//
		// open({
		//   name: "databaseName",
		//   url: "postgres://username:password@host/database",
		//   tables: ['table1', 'table2', ...]
		// }, callback);
		//
		// callback after connection established
		//
		db.pgsql.open = function(database, callback) {
			database.retryCounter++;
			var connection = new driver.Client(database.url);
			connection.slowTime = database.slowTime;

			db.pgsql.upgrade(connection);

			connection.connect(function(err) {
				if (err) {
					database.application.log.error(JSON.stringify(err));
					setTimeout(function() {
						if (database.retryCounter<=database.retryCount) db.pgsql.open(database, callback);
					}, database.retryInterval);
				}
				database.retryCounter = 0;
			});

			connection.on('query', function(err, res, query) {
				if (err) database.application.log.error('PgSQL Error['+err.code+']: '+err.toString()+'\t'+query.text);
				if (impress.log.debug) database.application.log.debug(query.text);
			});

			connection.on('slow', function(err, res, query, executionTime) {
				database.application.log.slow(executionTime+'ms\t'+query.text);
			});

			connection.on('error', function(err) {
				database.application.log.error(JSON.stringify(err));
			});

			database.connection = connection;
			callback(null);
		};

		db.pgsql.upgrade = function(connection) {

			connection.slowTime = 2000;

			connection.query = connection.query.override(function(sql, values, callback) {
				var startTime = new Date().getTime();
				if (typeof(values) == 'function') {
					callback = values;
					values = [];
				}
				var query = this.inherited(sql, values, function(err, res) {
					var endTime = new Date().getTime(),
						executionTime = endTime-startTime;
					connection.emit('query', err, res, query);
					if (connection.slowTime && (executionTime >= connection.slowTime)) connection.emit('slow', err, res, query, executionTime);
					if (callback) callback(err, res);
				});
				return query;
			});

		}

	}

} (global.db = global.db || {}));