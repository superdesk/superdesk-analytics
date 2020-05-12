import {appConfig} from 'appConfig';

import {gettext} from '../../utils';

SearchReport.$inject = ['lodash', 'moment', 'api', '$q'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics
 * @name SearchReport
 * @requires lodash
 * @requires moment
 * @requires api
 * @requires $q
 * @description Search service used to query the reporting endpoints
 */
export function SearchReport(_, moment, api, $q) {
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
        name: gettext('Urgency'),
    }, {
        qcode: 'task.desk',
        name: gettext('Desk'),
    }, {
        qcode: 'task.user',
        name: gettext('User'),
    }, {
        qcode: 'subject.qcode',
        name: gettext('Subject'),
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

        if (_.get(report, 'dates.start')) {
            report.dates.start = moment(report.dates.start, appConfig.model.dateformat)
                .format('YYYY-MM-DD');
        }

        if (_.get(report, 'dates.end')) {
            report.dates.end = moment(report.dates.end, appConfig.model.dateformat)
                .format('YYYY-MM-DD');
        }

        if (_.get(report, 'dates.date')) {
            report.dates.date = moment(report.dates.date, appConfig.model.dateformat)
                .format('YYYY-MM-DD');
        }

        if (_.get(report, 'dates.filter') && report.dates.filter !== 'range') {
            delete report.dates.start;
            delete report.dates.end;
        }

        return report;
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
     * @name SearchReport#query
     * @param {String} endpoint - The name of the endpoint to query
     * @param {Object} params - The parameters used to search elastic
     * @return {Object}
     * @description Constructs an elastic query then sends that query to the provided endpoint
     */
    this.query = function(endpoint, params) {
        return api.query(endpoint, constructParams(params))
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
