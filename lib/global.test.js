"use strict";

(function(impress) {

    global.testing = {
		strSpaces: "   string with leading ant trailing spaces   ",
	};

	impress.test({
		"isServer": [ [ [], true ] ],
		"extend": [
			[ { f1:1 }, { f1:1 } ],
			[ { f1:1 }, {}, { f1:1 } ],
			[ {}, {}, {} ],
			[ {}, null, {} ],
			[ { f1:1 }, { f2:2 }, { f1:1, f2:2 } ],
			[ null, null, null ],
			[ null, null ],
			[ null ],
			[ "Hello" , "Hello" ],
			[ "Hello", { f2:2 }, "Hello" ],
			[ 2, 3, 2 ],
			[ null, {}, null ],
			[ [], { f2:2 }, [] ],
			[ [], [], [] ],
			[ [], null, [] ],
			[ [], "Hello", ["H","e","l","l","o"] ],
		],
		"clone": [
			[ { f1:1 }, { f1:1 } ],
			[ {}, {} ],
			[ [], [] ],
			[ null, null ],
			[ { f1:1 }, { f2:2 }, { f1:1, f2:2 } ],
			[ { f1:1, sub: { f2:2, a1:[1,2] } }, { f1:1, sub:{ f2:2, a1:[1,2] } } ],
			[ { f1:1, sub: { f2:2, a1:[1,2] } }, { f3:3, a2:[3,4] }, { f1:1, sub:{ f2:2, a1:[1,2] }, f3:3, a2:[3,4] } ],
		],
		"arrayDelete": [
			[ [ "e1", "e2" ], "e1", 1 ],
			[ [ "e1", "e2" ], "e3", 0 ],
			[ [ ], "e3", 0 ],
			[ null, "e3", 0 ],
			[ [ null, "e1" ], "e1", 1 ],
			[ [ null, "e1" ], null, 1 ],
		],
		"inArray": [
			[ [1,2,3], 1, true ],
			[ [1,2,3], 4, false ],
			[ ["e1","e2","e3"], "e3", true ],
			[ ["e1","e2","e3"], "e4", false ],
			[ [1,null,3], null, true ],
		],
		"arrayRegExp": [
			[ ["*"],                 "^.*$" ],
			[ ["/css/*","/folder*"], "^((\\/css\\/.*)|(\\/folder.*))$" ],
			[ ["/","/js/*"],         "^((\\/)|(\\/js\\/.*))$" ],
			[ ["/css/*.css"],        "^\\/css\\/.*\\.css$" ],
			[ ["*/css/*"],           "^.*\\/css\\/.*$" ],
		],
		"duration": [
			[ "1d",             86400000 ],
			[ "10h",            36000000 ],
			[ "7m",               420000 ],
			[ "13s",               13000 ],
			[ "2d 43s",        172843000 ],
			[ "5d 17h 52m 1s", 496321000 ],
			[ "1s",                 1000 ],
			[ "",                      0 ],
			[ "15",                    0 ],
			[ "10q",                   0 ],
		],
		"generateKey": [
			[ 4, 'ABC', function(value) {
				return (value.length == 4);
			} ],
			[ 8, 'A', "AAAAAAAA" ],
		],
		"generateGUID": [
			[ function(value) {
				return (value.length == 36);
			} ],
		],
		"ip2int": [
			[ '127.0.0.1',        2130706433 ],
			[ '10.0.0.1',          167772161 ],
			[ '192.168.1.10',    -1062731510 ],
			[ '165.225.133.150', -1511946858 ],
			[ '0.0.0.0',                   0 ],
			[ 'wrong-string',           null ],
			[ '',                 2130706433 ],
		],
		"escapeRegExp": [
			[ "/path/to/res?search=this.that", "\\\\/path\\\\/to\\\\/res\\\\?search=this\\\\.that" ],
		],
		"lastSlash": [
			[ "/path", "/path/" ],
			[ "/path/", "/path/" ],
			[ "/", "/" ],
			[ "", "/" ],
		],
		"isScalar": [
			[ "value1", true ],
			[ 50,       true ],
			[ true,     true ],
			[ null,     false ],
			[ [],       false ],
			[ {},       false ],
			[ "",       true ],
		],
		"random": [
			[ 0, 10, function(result) {
				return (result>=0 && result<=10);
			} ],
			[ 10, 10, 10 ],
		],
		"shuffle": [
			[ [1,2,3], function(result) {
				return JSON.stringify(result.sort()) == "[1,2,3]";
			} ],
		],
		"bytesToSize": [
			[               0, "0"      ],
			[               1, "1"      ],
			[             100, "100"    ],
			[            1000, "1000"   ],
			[            1023, "1023"   ],
			[            1024, "1 Kb"   ],
			[            1025, "1 Kb"   ],
			[            1111, "1 Kb"   ],
			[            2222, "2 Kb"   ],
			[           10000, "10 Kb"  ],
			[         1000000, "977 Kb" ],
			[       100000000, "95 Mb"  ],
			[     10000000000, "9 Gb"   ],
			[   1000000000000, "931 Gb" ],
			[ 100000000000000, "91 Tb"  ],
		],
	});

} (global.impress = global.impress || {}));