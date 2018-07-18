var path = require('path');
var webpack = require('webpack');
var lodash = require('lodash');

module.exports = function makeConfig(grunt) {
    var appConfigPath = path.join(process.cwd(), 'superdesk.config.js');

    if (process.env.SUPERDESK_CONFIG) {
        appConfigPath = path.join(process.cwd(), process.env.SUPERDESK_CONFIG);
    }
    if (grunt.option('config')) {
        appConfigPath = path.join(process.cwd(), grunt.option('config'));
    }

    const sdConfig = lodash.defaultsDeep(require(appConfigPath)(grunt), getDefaults(grunt));

    return {
        entry: [path.join(__dirname, 'index')],
        devtool: 'inline-source-map', //just do inline source maps instead of the default
        output: {
            path: path.join(process.cwd(), 'dist'),
            filename: 'app.bundle.js',
        },
        resolve: {
            modules: [
                __dirname,
                path.join(__dirname, 'client'),
                path.join(__dirname, 'node_modules/superdesk-core'),
                path.join(__dirname, 'node_modules/superdesk-core/styles/sass'),
                path.join(__dirname, 'node_modules/superdesk-core/node_modules'),
                'node_modules'
            ],
            extensions: ['.js', '.jsx', '.json'],
            alias: {
                images: path.resolve(__dirname, 'node_modules/superdesk-core/images'),
                apps: path.resolve(__dirname, 'node_modules/superdesk-core/scripts/apps'),
                core: path.resolve(__dirname, 'node_modules/superdesk-core/scripts/core'),
                vendor: path.resolve(__dirname, 'node_modules/superdesk-core/scripts/vendor'),

                'angular-embedly': path.resolve(
                    __dirname,
                    'node_modules/angular-embedly/em-minified/angular-embedly.min'
                ),
                'jquery-gridster': path.resolve(
                    __dirname,
                    'node_modules/gridster/dist/jquery.gridster.min'
                ),
                'rangy-saverestore': path.resolve(
                    __dirname,
                    'node_modules/rangy/lib/rangy-selectionsaverestore'
                ),
            }
        },
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules\/(?!(superdesk-core)\/).*/,
                    loader: 'babel-loader',
                    options: {
                        plugins: ['transform-object-rest-spread'],
                        cacheDirectory: true,
                        presets: ['es2015', 'react'],
                    }
                },
                {
                    test: /\.html$/,
                    loader: 'html-loader'
                },
                {
                    test: /\.css$/,
                    use: [
                        'style-loader',
                        'css-loader'
                    ]
                },
                {
                    test: /\.scss$/,
                    use: [
                        'style-loader',
                        'css-loader',
                        'sass-loader'
                    ]
                },
                {
                    test: /\.json$/,
                    use: ['json-loader']
                },
                {
                    test: /\.(png|gif|jpeg|jpg|woff|woff2|eot|ttf|svg)(\?.*$|$)/,
                    loader: 'file-loader'
                }
            ],
        },
        externals: {
            cheerio: 'window',
            'react/addons': true,
            'react/lib/ExecutionEnvironment': true,
            'react/lib/ReactContext': true
        },

        // Define mock gettext ('required when running unit_tests for planning)
        plugins: [
            new webpack.DefinePlugin({gettext: 'function gettext(msg) { return msg; }'}),
            new webpack.ProvidePlugin({
                $: 'jquery',
                'window.$': 'jquery',
                jQuery: 'jquery',
                'window.jQuery': 'jquery',
                moment: 'moment',
                // MediumEditor needs to be globally available, because
                // its plugins will not be able to find it otherwise.
                MediumEditor: 'medium-editor',
            }),
            new webpack.DefinePlugin({
                __SUPERDESK_CONFIG__: JSON.stringify(sdConfig),
            }),
        ],
    };
}

// getDefaults returns the default configuration for the app
function getDefaults(grunt) {
    var version;

    try {
        version = require('git-rev-sync').short('..');
    } catch (err) {
        // pass
    }

    return {
        // application version
        version: version || grunt.file.readJSON(path.join(__dirname, 'package.json')).version,

        // raven settings
        raven: {
            dsn: process.env.SUPERDESK_RAVEN_DSN || '',
        },

        // backend server URLs configuration
        server: {
            url: grunt.option('server') || process.env.SUPERDESK_URL || 'http://localhost:5000/api',
            ws: grunt.option('ws') || process.env.SUPERDESK_WS_URL || 'ws://0.0.0.0:5100',
        },

        // iframely settings
        iframely: {
            key: process.env.IFRAMELY_KEY || '',
        },

        // google settings
        google: {
            key: process.env.GOOGLE_KEY || '',
        },

        // settings for various analytics
        analytics: {
            piwik: {
                url: process.env.PIWIK_URL || '',
                id: process.env.PIWIK_SITE_ID || '',
            },
            ga: {
                id: process.env.TRACKING_ID || '',
            },
        },

        // editor configuration
        editor: {
            // if true, the editor will not have a toolbar
            disableEditorToolbar: grunt.option('disableEditorToolbar'),
        },

        // default timezone for the app
        defaultTimezone: grunt.option('defaultTimezone') || 'Europe/London',

        // model date and time formats
        model: {
            dateformat: 'DD/MM/YYYY',
            timeformat: 'HH:mm:ss',
        },

        // view formats for datepickers/timepickers
        view: {
            dateformat: process.env.VIEW_DATE_FORMAT || 'DD/MM/YYYY',
            timeformat: process.env.VIEW_TIME_FORMAT || 'HH:mm',
        },

        // if environment name is not set
        isTestEnvironment: !!grunt.option('environmentName') || !!process.env.SUPERDESK_ENVIRONMENT,

        // environment name
        environmentName: grunt.option('environmentName') || process.env.SUPERDESK_ENVIRONMENT,

        // route to be redirected to from '/'
        defaultRoute: '/workspace',

        // override language translations
        langOverride: {},

        // app features
        features: {
            // tansa spellchecker
            useTansaProofing: false,

            // replace editor2
            onlyEditor3: false,
        },

        // tansa config
        tansa: {
            profile: {
                nb: 1,
                nn: 2,
            },
        },

        // workspace defaults
        workspace: {
            ingest: false,
            content: false,
            tasks: false,
            analytics: true,
        },

        // ingest defaults
        ingest: {
            PROVIDER_DASHBOARD_DEFAULTS: {
                show_log_messages: true,
                show_ingest_count: true,
                show_time: true,
                log_messages: 'error',
                show_status: true,
            },
            DEFAULT_SCHEDULE: {minutes: 5, seconds: 0},
            DEFAULT_IDLE_TIME: {hours: 0, minutes: 0},
        },

        // list of languages available in user profile
        profileLanguages: [
            'en',
            'el',
            'en_GB',
            'es',
            'da',
            'ar',
            'de_DE',
            'ru_RU',
            'nb',
            'uk_UA',
            'pt_BR',
            'pl',
        ],
    };
}
