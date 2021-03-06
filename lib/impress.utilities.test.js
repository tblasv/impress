"use strict";

(function(impress) {

	var config = {
		sessions: {
			characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
			length:     64
		}
	};

	impress.test({
		"impress.generateSID": [
			[ config, function(result) {
				return result.length == 64
			} ],
		],
		"impress.crcSID": [
			[ config, generateKey(config.sessions.length-2, config.sessions.characters), function(result) {
				return result.length == 2
			} ],
		],
		"impress.validateSID": [
			[ config, "2XpU8oAewXwKJJSQeY0MByY403AyXprFdhB96zPFbpJxlBqHA3GfBYeLxgHxBhhU", true ],
			[ config, "2XpU8oAewXwKJJSQeY0MByY403AyXprFdhB96zPFbpJxlBqHA3GfBYeLxgHxBhhZ", false ],
			[ config, "WRONG-STRING", false ],
			[ config, "", false ],
		],
		"impress.subst": [
			[ "Hello, @name@", { name:"Ali" }, "", true, "Hello, Ali" ],
			[ "Hello, @.name@", { person: { name:"Ali" } }, "person", true, "Hello, Ali" ],
		],
		"impress.dataByPath": [
			[ { item: { subitem: { value: "Gagarin" } } }, "item.subitem.value", "Gagarin" ],
		],
		"impress.htmlEscape": [
			[ "text", "text" ],
			[ "<tag>", "&lt;tag&gt;" ],
			[ "You &amp; Me", "You &amp;amp; Me" ],
			[ "You & Me", "You &amp; Me" ],
			[ "\"Quotation\"", "&quot;Quotation&quot;" ],
		],
		"impress.fileExt": [
			[ "/dir/dir/file.txt", "txt" ],
			[ "/dir/dir/file.txt", "txt" ],
			[ "\\dir\\file.txt",   "txt" ],
			[ "/dir/dir/file.txt", "txt" ],
			[ "/dir/file.txt",     "txt" ],
			[ "/dir/file.TXt",     "txt" ],
			[ "//file.txt",        "txt" ],
			[ "file.txt",          "txt" ],
			[ "/",                 ""    ],
			[ ".",                 ""    ],
			[ "",                  ""    ],
		],
		"impress.isTimeEqual": [
			[ "2014-01-01", "2014-01-01", true],
		]
	});

} (global.impress = global.impress || {}));