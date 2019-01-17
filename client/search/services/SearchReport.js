SearchReport.$inject = ['lodash', 'config', 'moment', 'api', '$q', 'gettext', 'gettextCatalog'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics
 * @name SearchReport
 * @requires lodash
 * @requires config
 * @requires moment
 * @requires api
 * @requires $q
 * @requires gettext
 * @requires gettextCatalog
 * @description Search service used to query the reporting endpoints
 */
export function SearchReport(_, config, moment, api, $q, gettext, gettextCatalog) {
    /**
     * @ngdoc property
     * @name SearchReport#itemStates
     * @type {Array<Object>}
     * @description Common item states for use with reports
     */
    this.itemStates = [{
        qcode: 'published',
        name: gettext('Published'),
    }, {
        qcode: 'killed',
        name: gettext('Killed'),
    }, {
        qcode: 'corrected',
        name: gettext('Corrected'),
    }, {
        qcode: 'recalled',
        name: gettext('Recalled'),
    }];

    /**
     * @ngdoc method
     * @name SearchReport#filterItemStates
     * @param {Array<String>} states - Array of item state qcodes
     * @return {Array<Object>}
     * @description Filters the common item states for use with report filters
     */
    this.filterItemStates = (states) => (
        this.itemStates.filter(
            (state) => states.indexOf(state.qcode) > -1
        )
    );

    /**
     * @ngdoc property
     * @name SearchReport#dataFields
     * @type {Array<Object>}
     * @description Common data fields for use with reports
     */
    this.dataFields = [{
        qcode: 'anpa_category.qcode',
        name: gettext('Category'),
    }, {
        qcode: 'genre.qcode',
        name: gettext('Genre'),
    }, {
        qcode: 'source',
        name: gettext('Source'),
    }, {
        qcode: 'urgency',
        name: gettextCatalog.getString('Urgency'),
    }, {
        qcode: 'task.desk',
        name: gettext('Desk'),
    }, {
        qcode: 'task.user',
        name: gettext('User'),
    }];

    /**
     * @ngdoc method
     * @name SearchReport#filterDataFields
     * @param {Array<String>} sources - Array of field qcodes
     * @return {Array<Object>}
     * @description Filters the common data fields for use with report filters
     */
    this.filterDataFields = (sources) => (
        this.dataFields.filter(
            (source) => sources.indexOf(source.qcode) > -1
        )
    );

    /**
     * @ngdoc method
     * @name convertDatesForServer
     * @param {Object} params - Report parameters
     * @return {Object}
     * @description Clones the parameters and modifies the date fields for use with the server
     */
    const convertDatesForServer = (params) => {
        const report = _.cloneDeep(params);

        if (_.get(report, 'start_date')) {
            report.start_date = moment(report.start_date, config.model.dateformat)
                .format('YYYY-MM-DD');
        } else if (_.get(report, 'dates.start')) {
            report.dates.start = moment(report.dates.start, config.model.dateformat)
                .format('YYYY-MM-DD');
        }

        if (_.get(report, 'end_date')) {
            report.end_date = moment(report.end_date, config.model.dateformat)
                .format('YYYY-MM-DD');
        } else if (_.get(report, 'dates.end')) {
            report.dates.end = moment(report.dates.end, config.model.dateformat)
                .format('YYYY-MM-DD');
        }

        if (_.get(report, 'date')) {
            report.date = moment(report.date, config.model.dateformat)
                .format('YYYY-MM-DD');
        } else if (_.get(report, 'dates.date')) {
            report.dates.date = moment(report.dates.date, config.model.dateformat)
                .format('YYYY-MM-DD');
        }

        if (report.date_filter && report.date_filter !== 'range') {
            delete report.start_date;
            delete report.end_date;
        } else if (_.get(report, 'dates.filter') && report.dates.filter !== 'range') {
            delete report.dates.start;
            delete report.dates.end;
        }

        return report;
    };

    /**
     * @ngdoc method
     * @name getUTCOffset
     * @param {String} format - The format of the response
     * @return {String}
     * @description Generates the UTC offset using the format provided
     */
    const getUTCOffset = function(format = 'ZZ') {
        if (_.get(config, 'search.useDefaultTimezone') && _.get(config, 'defaultTimezone')) {
            return moment.tz(config.defaultTimezone).format(format);
        }

        return moment().format(format);
    };

    /**
     * @ngdoc method
     * @name getFilterAndDates
     * @param {Object} params - Report parameters
     * @return {Object}
     * @description Returns the date filter, start, end and date fields from the report parameters
     */
    const getFilterAndDates = (params) => {
        const dateFilter = _.get(params, 'date_filter') || _.get(params, 'dates.filter');
        const startDate = _.get(params, 'start_date') || _.get(params, 'dates.start');
        const endDate = _.get(params, 'end_date') || _.get(params, 'dates.end');
        const date = _.get(params, 'date') || _.get(params, 'dates.date');
        const relative = _.get(params, 'dates.relative');
        const relativeDays = _.get(params, 'dates.relative_days');

        return {dateFilter, startDate, endDate, date, relative, relativeDays};
    };

    /**
     * @ngdoc method
     * @name filterValues
     * @param {Array|boolean} value - The value to check
     * @return {boolean}
     * @description Returns true if this variable has a value to keep
     */
    const filterValues = (value) => {
        if (_.isArray(value)) {
            return value.length > 0;
        } else if (_.isBoolean(value)) {
            return value !== false;
        }

        return value !== null;
    };

    /**
     * @ngdoc method
     * @name filterNullParams
     * @param {Object} params - Report parameters
     * @description Filters our null values from the report parameters
     */
    const filterNullParams = (params) => {
        // If states filter is provided as an array
        // Then convert it to boolean attributes here
        if (Array.isArray(_.get(params, 'must.states')) && params.must.states.length > 0) {
            const states = params.must.states;

            params.must.states = {};
            states.forEach((state) => {
                params.must.states[state] = true;
            });
        } else if (Array.isArray(_.get(params, 'must_not.states')) && params.must_not.states.length > 0) {
            const states = params.must_not.states;

            params.must_not.states = {};
            states.forEach((state) => {
                params.must_not.states[state] = true;
            });
        }

        params.must = _.pickBy(params.must || {}, filterValues);
        params.must_not = _.pickBy(params.must_not || {}, filterValues);
        params.chart = _.pickBy(params.chart || {}, filterValues);

        if (params.must.states) {
            const states = _.pickBy(params.must.states, filterValues);

            if (_.isEqual(states, {})) {
                delete params.must.states;
            } else {
                params.must.states = states;
            }
        }
        if (params.must_not.states) {
            const states = _.pickBy(params.must_not.states, filterValues);

            if (_.isEqual(states, {})) {
                delete params.must_not.states;
            } else {
                params.must_not.states = states;
            }
        }
    };

    /**
     * @ngdoc method
     * @name SearchReport#formatDate
     * @param {String} date - Date string in the format from config.model.dateformat
     * @param {Boolean} endOfDay - If true, sets the time to the end of the day
     * @return {String}|null
     * @description If date is supplied, then returns a date/time string used in elastic query
     */
    const formatDate = function(date, endOfDay = false) {
        if (date) {
            const timeSuffix = endOfDay ? 'T23:59:59' : 'T00:00:00';
            const utcOffset = getUTCOffset();

            return moment(date, config.model.dateformat).format('YYYY-MM-DD') + timeSuffix + utcOffset;
        }

        return null;
    };

    /**
     * @ngdoc method
     * @name getFilterValues
     * @param {Object} filter - The must/must_not filter
     * @return {Object}
     * @description Returns the values for the filter attribute in the report parameters
     */
    const getFilterValues = (filter) => {
        if (_.isArray(filter) || _.isBoolean(filter)) {
            return filter;
        }

        return _.filter(
            Object.keys(filter),
            (name) => !!filter[name]
        );
    };

    this._filterDesks = (query, desks, must, params) => {
        query[must].push({terms: {'task.desk': desks}});
    };

    this._filterUsers = (query, users, must, params) => {
        query[must].push({terms: {'task.user': users}});
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

    this._filterUrgencies = (query, urgencies, must, params) => {
        query[must].push(
            {terms: {urgency: urgencies.map((val) => parseInt(val, 10))}}
        );
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

    this._includeRewrites = (query, params) => {
        const rewrites = params.rewrites || 'include';

        if (rewrites === 'include') {
            return;
        }

        const must = rewrites === 'only' ? 'must' : 'must_not';

        query[must].push({
            and: [
                {term: {state: 'published'}},
                {exists: {field: 'rewrite_of'}},
            ],
        });
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
        const {dateFilter, startDate, endDate, date, relative, relativeDays} = getFilterAndDates(params);

        if (!dateFilter) {
            return;
        }

        const timeZone = getUTCOffset('Z');
        let lt = null;
        let gte = null;

        switch (dateFilter) {
        case 'range':
            lt = formatDate(endDate, true);
            gte = formatDate(startDate);
            break;
        case 'day':
            lt = formatDate(date, true);
            gte = formatDate(date);
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
        case 'relative':
            lt = 'now';
            gte = `now-${relative}h`;
            break;
        case 'relative_days':
            lt = 'now';
            gte = `now-${relativeDays}d`;
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
     * @name constructParams
     * @param {Object} args - Report parameters
     * @return {Object}
     * @description Modifies the report parameters for use with an API call
     */
    const constructParams = (args) => {
        const params = convertDatesForServer(args);

        filterNullParams(params);
        delete params.aggs;
        delete params.repos;
        delete params.return_type;

        const payload = {params};

        if (args.aggs) {
            payload.aggs = args.aggs;
        }

        if (args.repos) {
            payload.repo = _.pickBy(args.repos, filterValues);
        }

        if (args.return_type) {
            payload.return_type = args.return_type;
        }

        if (args.size) {
            payload.size = args.size;
            payload.max_results = args.size;
        }

        if (args.page) {
            payload.page = args.page;
        }

        if (args.sort) {
            payload.sort = args.sort;
        }

        return payload;
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
            desks: this._filterDesks,
            users: this._filterUsers,
            categories: this._filterCategories,
            sources: this._filterSources,
            genre: this._filterGenre,
            urgency: this._filterUrgencies,
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
        this._includeRewrites(query, params);

        ['must', 'must_not'].forEach((must) => {
            _.forEach(params[must], (filter, field) => {
                const values = getFilterValues(filter);
                const func = queryFuncs[field];

                if (_.isArray(values) && _.isEmpty(values) || !func) {
                    return;
                }

                func(query, values, must, params);
            });
        });

        const payload = {
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

        if (_.get(params, 'aggs')) {
            payload.aggs = params.aggs;
        }

        return payload;
    };

    /**
     * @ngdoc method
     * @name SearchReport#query
     * @param {String} endpoint - The name of the endpoint to query
     * @param {Object} params - The parameters used to search elastic
     * @param {Object} asObject - Send as param object or elastic query
     * @return {Object}
     * @description Constructs an elastic query then sends that query to the provided endpoint
     */
    this.query = function(endpoint, params, asObject = false) {
        return api.query(
            endpoint,
            asObject ? constructParams(params) : constructQuery(params)
        )
            .then(
                (response) => (
                    _.get(response, '_items.length', 0) === 1 ?
                        response._items[0] :
                        response
                )
            );
    };

    /**
     * @ngdoc method
     * @name SearchReport#loadArchiveItem
     * @param {String} itemId - The ID of the item to load
     * @return {Promise<Object>} The item or an error
     * @description Attempts to load an item from archive, published or archived using the provided ID
     */
    this.loadArchiveItem = function(itemId) {
        return api.query('search', {
            repo: 'archive,published,archived',
            source: {
                query: {
                    filtered: {
                        filter: {
                            or: [
                                {term: {_id: itemId}},
                                {term: {item_id: itemId}},
                            ],
                        },
                    },
                },
                sort: [{versioncreated: 'desc'}],
                from: 0,
                size: 1,
            },
        })
            .then((result) => {
                if (_.get(result, '_items.length') < 1) {
                    return $q.reject(gettext('Item not found!'));
                }

                return result._items[0];
            });
    };
}
