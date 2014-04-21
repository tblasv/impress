module.exports = function(grunt) {
	'use strict';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jsdoc: {
			dist: {
				src: ['./lib/**/*.js', 'README.md'],
				options: {
					destination:  './docs/gen-doc/<%= pkg.version %>/',
					configure: './docs/conf.json',
					template: './node_modules/jaguarjs-jsdoc',
					'private': false
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-jsdoc');
};
