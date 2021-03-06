"use strict";

(function(db) {

	var driver = impress.require('mongodb');

	if (driver) {
		db.drivers.mongodb = driver;
		db.mongodb = {};
		var client = driver.MongoClient;

		// ObjectID from string: db.mongodb.oid(str)
		//
		db.mongodb.oid = db.drivers.mongodb.ObjectID;

		// Open mongodb database
		//
		// Example:
		//
		// open({
		//   name: "databaseName",
		//   url: "mongodb://username:password@host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]",
		//   collections: ['collection1', 'collection2', ...]
		// }, callback);
		//
		// callback after connection established
		//
		db.mongodb.open = function(database, callback) {
			var cbCount = database.collections.length,
				cbIndex = 0,
				cb = function() { if (++cbIndex>=cbCount && callback) callback(); },
				collectionName;
			client.connect(database.url, function(err, clientConnection) {
				if (!err && database.collections.length>0) {
					database.connection = clientConnection;
					database.oid = db.mongodb.oid;
					for (var i = 0; i < database.collections.length; i++) {
						collectionName = database.collections[i];
						clientConnection.createCollection(collectionName, function(err, collection) {
							database[collection.collectionName] = collection;
							cb();
						});
					}
				} else callback();
			});
		};
	}

} (global.db = global.db || {}));