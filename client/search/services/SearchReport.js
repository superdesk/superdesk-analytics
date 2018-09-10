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

    this._getFilterValues = (filter) => {
        if (_.isArray(filter) || _.isBoolean(filter)) {
            return filter;
        }

        return _.filter(
            Object.keys(filter),
            (name) => !!filter[name]
        );
    };

    this._filterCategories = (query, categories, must, params) => {
        const field = _.get(params, 'category_field') || 'qcode';

        query[must].push({terms: {[`anpa_category.${field}`]: categories}});
    };

    this._filterSources = (query, sources, must, params) => {
        query[must].push({terms: {source: sources}});
    };

    this._filterGenre = (query, genres, must, params) => {
        query[must].push({terms: {'genre.qcode': genres}});
    };

    this._filterIngestProviders = (query, ingests, must, params) => {
        query[must].push({terms: {ingest_provider: ingests}});
    };

    this._filterStages = (query, stages, must, params) => {
        query[must].push({terms: {'task.stage': stages}});
    };

    this._filterStates = (query, states, must, params) => {
        query[must].push({terms: {state: states}});
    };

    this._filterRewrites = (query, value, must, params) => {
        if (value) {
            query[must].push({exists: {field: 'rewrite_of'}});
        }
    };

    this._setRepos = (query, params) => {
        if (_.get(params, 'repos')) {
            query.repo = _.compact(
                _.map(params.repos, (value, repo) => value && repo)
            ).join(',');
        } else {
            query.repo = '';
        }
    };

    this._setSize = (query, params) => {
        query.size = _.get(params, 'size') || 0;
    };

    this._setSort = (query, params) => {
        query.sort = _.get(params, 'sort') || [{versioncreated: 'desc'}];
    };

    this._filterDates = (query, params) => {
        if (!_.get(params, 'date_filter')) {
            return;
        }

        const timeZone = getUTCOffset('Z');
        let lt = null;
        let gte = null;

        switch (params.date_filter) {
        case 'range':
            lt = formatDate(params.end_date, true);
            gte = formatDate(params.start_date);
            break;
        case 'day':
            lt = formatDate(params.date, true);
            gte = formatDate(params.date);
            break;
        case 'yesterday':
            lt = 'now/d';
            gte = 'now-1d/d';
            break;
        case 'last_week':
            lt = 'now/w';
            gte = 'now-1w/w';
            break;
        case 'last_month':
            lt = 'now/M';
            gte = 'now-1M/M';
            break;
        }

        if (lt !== null && gte !== null) {
            query.must.push({
                range: {
                    versioncreated: {
                        lt: lt,
                        gte: gte,
                        time_zone: timeZone,
                    },
                },
            });
        }
    };

    /**
     * @ngdoc method
     * @name SearchReport@constructQuery
     * @param {Object} params - The parameters used to construct the elastic query
     * @return {Object}
     * @description Constructs an elastic query based on the provided parameters
     */
    const constructQuery = (params) => {
        const queryFuncs = {
            categories: this._filterCategories,
            sources: this._filterSources,
            genre: this._filterGenre,
            ingest_providers: this._filterIngestProviders,
            stages: this._filterStages,
            states: this._filterStates,
            rewrites: this._filterRewrites,
        };

        let query = {
            must: [],
            must_not: [],
        };

        this._setRepos(query, params);
        this._setSize(query, params);
        this._setSort(query, params);
        this._filterDates(query, params);

        ['must', 'must_not'].forEach((must) => {
            _.forEach(params[must], (filter, field) => {
                const values = this._getFilterValues(filter);
                const func = queryFuncs[field];

                if (_.isArray(values) && _.isEmpty(values) || !func) {
                    return;
                }

                func(query, values, must, params);
            });
        });

        return {
            source: {
                query: {
                    filtered: {
                        filter: {
                            bool: {
                                must: query.must,
                                must_not: query.must_not,
                            },
                        },
                    },
                },
                sort: query.sort,
                size: query.size,
            },
            repo: query.repo,
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
