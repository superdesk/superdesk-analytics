SearchReport.$inject = ['lodash', 'config', 'moment', 'api', '$q'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics
 * @name SearchReport
 * @requires lodash
 * @requires config
 * @requires moment
 * @requires api
 * @requires $q
 * @description Search service used to query the reporting endpoints
 */
export function SearchReport(_, config, moment, api, $q) {
    const getUTCOffset = function(format = 'ZZ') {
        if (_.get(config, 'search.useDefaultTimezone') && _.get(config, 'defaultTimezone')) {
            return moment.tz(config.defaultTimezone).format(format);
        }

        return moment().format(format);
    };

    /**
     * @ngdoc method
     * @name SearchReport#formatDate
     * @param {String} date - Date string in the format from config.view.dateformat
     * @param {Boolean} endOfDay - If true, sets the time to the end of the day
     * @return {String}|null
     * @description If date is supplied, then returns a date/time string used in elastic query
     */
    const formatDate = function(date, endOfDay = false) {
        if (date) {
            const timeSuffix = endOfDay ? 'T23:59:59' : 'T00:00:00';
            const utcOffset = getUTCOffset();

            return moment(date, config.view.dateformat).format('YYYY-MM-DD') + timeSuffix + utcOffset;
        }

        return null;
    };

    /**
     * @ngdoc method
     * @name SearchReport@constructQuery
     * @param {Object} _params - The parameters used to construct the elastic query
     * @return {Object}
     * @description Constructs an elastic query based on the provided parameters
     */
    const constructQuery = function(_params) {
        let params = {
            must: [],
            must_not: [],
        };
        let repo = '';

        const filterDates = function() {
            if (!_.get(_params, 'dateFilter')) {
                return;
            }

            const timeZone = getUTCOffset('Z');

            switch (_params.dateFilter) {
            case 'range':
                params.must.push({
                    range: {
                        versioncreated: {
                            lt: formatDate(_params.end_date, true),
                            gte: formatDate(_params.start_date),
                            time_zone: timeZone,
                        },
                    },
                });
                break;
            case 'yesterday':
                params.must.push({
                    range: {
                        versioncreated: {
                            lt: 'now/d',
                            gte: 'now-1d/d',
                            time_zone: timeZone,
                        },
                    },
                });
                break;
            case 'last_week':
                params.must.push({
                    range: {
                        versioncreated: {
                            lt: 'now/w',
                            gte: 'now-1w/w',
                            time_zone: timeZone,
                        },
                    },
                });
                break;
            case 'last_month':
                params.must.push({
                    range: {
                        versioncreated: {
                            lt: 'now/M',
                            gte: 'now-1M/M',
                            time_zone: timeZone,
                        },
                    },
                });
                break;
            }
        };

        const excludeStates = function() {
            if (!_.get(_params, 'excluded_states')) {
                return;
            }

            const excludedStates = _.compact(
                _.map(_params.excluded_states, (value, state) => value && state)
            );

            if (_.get(excludedStates, 'length', 0) > 0) {
                params.must_not.push({terms: {state: excludedStates}});
            }
        };

        const setRepos = function() {
            if (!_.get(_params, 'repos')) {
                return;
            }

            repo = _.compact(
                _.map(_params.repos, (value, repo) => value && repo)
            ).join(',');
        };

        const filterCategories = function() {
            if (!_.get(_params, 'categories')) {
                return;
            }

            const categories = _.filter(
                Object.keys(_params.categories),
                (category) => !!_params.categories[category]
            );

            if (!_.isEmpty(categories)) {
                params.must.push({terms: {'anpa_category.name': categories}});
            }
        };

        const filterSources = function() {
            if (!_.get(_params, 'sources')) {
                return;
            }

            const sources = _.filter(
                Object.keys(_params.sources),
                (source) => !!_params.sources[source]
            );

            if (!_.isEmpty(sources)) {
                params.must.push({terms: {source: sources}});
            }
        };

        const filterRewrites = function() {
            if (_.get(_params, 'exclude_rewrites')) {
                params.must_not.push({exists: {field: 'rewrite_of'}});
            }
        };

        filterDates();
        excludeStates();
        setRepos();
        filterCategories();
        filterSources();
        filterRewrites();

        return {
            source: {
                query: {
                    filtered: {
                        filter: {
                            bool: params,
                        },
                    },
                },
                sort: [{versioncreated: 'desc'}],
                size: 0,
            },
            repo: repo,
        };
    };

    /**
     * @ngdoc method
     * @name SearchReport#query
     * @param {String} endpoint - The name of the endpoint to query
     * @param {Object} params - The parameters used to search elastic
     * @return {Object}
     * @description Constructs an elastic query then sends that query to the provided endpoint
     */
    this.query = function(endpoint, params) {
        return api.query(endpoint, constructQuery(params))
            .then((items) => $q.when(_.get(items, '_items[0]') || {}));
    };
}
