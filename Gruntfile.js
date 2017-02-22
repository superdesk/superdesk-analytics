'use strict'

var path = require('path');

module.exports = function(grunt) {

    // util for grunt.template
    grunt.toJSON = function(input) {
        return JSON.stringify(input)
    }

    var config = {
        pkg: grunt.file.readJSON(path.join(__dirname, 'package.json')),
        tmpDir: '.tmp',
        distDir: 'dist',
        specDir: 'spec',
        tasksDir: 'tasks',
        coreDir: __dirname,
        poDir: 'po',
        livereloadPort: 35729
    };

    grunt.initConfig(config)

    require('load-grunt-tasks')(grunt, {
        config: path.join(__dirname, 'package'),
        pattern: [
            'grunt-*',
            '@*/grunt-*'
        ]
    });
    require('load-grunt-config')(grunt, {
        config: config,
        configPath: path.join(__dirname, 'tasks', 'options')
    })

    grunt.registerTask('hint', ['eslint'])

    grunt.registerTask('test', ['ngtemplates:dev', 'karma:unit']);
    grunt.registerTask('ci', ['test', 'hint']);
    grunt.registerTask('ci:travis', ['ngtemplates:dev', 'karma:travis', 'hint']);

    // Development server
    grunt.registerTask('server', [
        'clean',
        'copy:index',
        'copy:config',
        'copy:locales',
        'ngtemplates:gen-apps',
        'ngtemplates:dev',
        'webpack-dev-server:start'
    ]);

    grunt.registerTask('package', ['ci', 'build']);
    grunt.registerTask('default', ['server']);
};
