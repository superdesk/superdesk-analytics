import {formatDateForServer} from '../../utils';

SourceCategoryReport.$inject = ['lodash', 'api', 'session', '$q', 'moment', 'config'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.source-category-report
 * @name SourceCategoryReport
 * @requires lodash
 * @requires api
 * @requires session
 * @requires $q
 * @requires moment
 * @requires config
 * @description Source/Category API query service
 */
export function SourceCategoryReport(_, api, session, $q, moment, config) {
    /**
     * @ngdoc method
     * @name SourceCategoryReport#genQuery
     * @param {Object} params
     * @returns {Object} Elastic search query to run
     * @description Generate the elastic search query based on provided parameters
     */
    const genQuery = function(params) {
        const mustNot = [];
        const must = [];

        const excludedStates = _.compact(
            _.map(params.excluded_states, (value, state) => value && state)
        );

        mustNot.push({terms: {state: excludedStates}});

        switch (params.dateFilter) {
        case 'range':
            must.push({
                range: {
                    versioncreated: {
                        lt: formatDateForServer(moment, config, params.end_date, 1),
                        gte: formatDateForServer(moment, config, params.start_date),
                    },
                },
            });
            break;
        case 'yesterday':
            must.push({
                range: {
                    versioncreated: {
                        lt: 'now/d',
                        gte: 'now-1d/d',
                    },
                },
            });
            break;
        case 'last_week':
            must.push({
                range: {
                    versioncreated: {
                        lt: 'now/w',
                        gte: 'now-1w/w',
                    },
                },
            });
            break;
        case 'last_month':
            must.push({
                range: {
                    versioncreated: {
                        lt: 'now/M',
                        gte: 'now-1M/M',
                    },
                },
            });
            break;
        }

        return {
            query: {
                filtered: {
                    filter: {
                        bool: {
                            must: must,
                            must_not: mustNot,
                        },
                    },
                },
            },
            size: 0,
        };
    };

    /**
     * @ngdoc method
     * @name SourceCategoryReport#genRepos
     * @param {Object} params
     * @returns {Array} List of repos to search on
     * @description Generate the list of repos based on the supplied params
     */
    const genRepos = function(params) {
        return _.compact(
            _.map(params.repos, (value, repo) => value && repo)
        );
    };

    /**
     * @ngdoc method
     * @name SourceCategoryReport#generate
     * @param {Object} params
     * @returns {Promise}
     * @description Generate the Source/Category report
     */
    this.generate = function(params) {
        return api('source_category_report', session.identity).save({}, {
            query: genQuery(params),
            repos: genRepos(params),
        });
    };
}
