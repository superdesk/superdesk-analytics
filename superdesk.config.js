/**
 * This is the default configuration file for the Superdesk application. By default,
 * the app will use the file with the name "superdesk.config.js" found in the current
 * working directory, but other files may also be specified using relative paths with
 * the SUPERDESK_CONFIG environment variable or the grunt --config flag.
 */

module.exports = function(grunt) {
    return {
        defaultRoute: '/workspace',
        requiredMediaMetadata: ['headline', 'description_text', 'alt_text'],
        features: {
            swimlane: {columnsLimit: 4}
        },
        ingest: {
            PROVIDER_DASHBOARD_DEFAULTS: {
                show_log_messages: true,
                show_ingest_count: true,
                show_time: true,
                log_messages: 'error',
                show_status: true
            },
            DEFAULT_SCHEDULE: {minutes: 5, seconds: 0},
            DEFAULT_IDLE_TIME: {hours: 0, minutes: 0},
        },
        search: {
            slugline: 1, headline: 1, unique_name: 1, story_text: 1,
            byline: 1, keywords: 1, creator: 1, from_desk: 1,
            to_desk: 1, spike: 1, scheduled: 1, company_codes: 1,
            useDefaultTimezone: 1, ingest_provider: 1, raw_search: 1,
            featuremedia: 1, marked_desks: 1
        },

        // default timezone for the app
        defaultTimezone: 'Europe/London',

        // model date and time formats
        model: {
            dateformat: 'DD/MM/YYYY',
            timeformat: 'HH:mm:ss',
        },

        // view formats for datepickers/timepickers
        view: {
            dateformat: 'DD/MM/YYYY',
            timeformat: 'HH:mm',
        },
    };
};
