ContentPublishingReportFilters.$inject = [
    'lodash',
    '$q',
    'userList',
    'desks',
    'metadata',
];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.content-publishing-report
 * @name ContentPublishingReportFilters
 * @requires lodash
 * @requires $q
 * @requires userList
 * @requires desks
 * @requires metadata
 * @description Directive to render the report filter tab
 */
export function ContentPublishingReportFilters(
    _,
    $q,
    userList,
    desks,
    metadata
) {
    return {
        template: require('../views/content-publishing-report-filters.html'),
        link: function(scope) {
            this.init = () => {
                scope.desks = {list: [], selected: []};
                scope.users = {list: [], selected: []};
                scope.categories = {list: [], selected: []};
                scope.genre = {list: [], selected: []};
                scope.sources = {list: [], selected: []};
                scope.urgency = {list: [], selected: {}};

                $q.all({
                    metadata: metadata.initialize(),
                    query: this.querySources(),
                    desks: desks.fetchDesks(),
                    users: userList.getAll(),
                })
                    .then((data) => {
                        this.loadSources(_.get(data, 'query') || {});
                        this.onLoadSelect('sources', 'qcode');

                        scope.categories.list = _.get(metadata, 'values.categories') || [];
                        this.onLoadSelect('categories', 'qcode');

                        scope.genre.list = _.get(metadata, 'values.genre') || [];
                        this.onLoadSelect('genre', 'qcode');

                        scope.urgency.list = _.get(metadata, 'values.urgency') || [];
                        this.onLoadCheck('urgency');

                        scope.desks.list = _.get(data, 'desks._items') || [];
                        this.onLoadSelect('desks', '_id');

                        // Add 'name' attribute to all users
                        // so that user input can be controlled with sd-meta-terms
                        scope.users.list = _.map(
                            _.get(data, 'users') || [],
                            (user) => ({
                                ...user,
                                name: _.get(user, 'display_name') || '',
                            })
                        );
                        this.onLoadSelect('users', '_id');
                    });
            };

            /**
             * @ngdoc method
             * @name ContentPublishingReportFilters#querySources
             * @description Searches the published/archived repos for the list of sources
             */
            this.querySources = () => (
                scope.runQuery({
                    params: {
                        aggs: {group: {field: 'source'}},
                        repos: {
                            ingest: false,
                            archive: false,
                            published: true,
                            archived: true,
                        }
                    }
                })
            );

            /**
             * @ngdoc method
             * @name ContentPublishingReportFilters#loadSources
             * @param {object} data - Aggregation data retrieved from the Search API
             * @description Updates the list of available sources based on the aggregation data
             */
            this.loadSources = (data) => {
                scope.sources.list = _.map(
                    _.get(data, 'buckets.source') || [],
                    (item) => ({
                        qcode: _.get(item, 'key') || '',
                        name: _.get(item, 'key') || ''
                    })
                );
            };

            /**
             * @ngdoc method
             * @name ContentPublishingReportFilters#onLoadSelect
             * @param {String} field - The name of the field that was loaded
             * @param {String} key - The key attribute of the source to use
             * @description Loads the associated data for select input
             */
            this.onLoadSelect = (field, key = null) => {
                // If for some reason the field is not in the scope
                // then set it up now
                if (!scope[field]) {
                    scope[field] = {list: [], selected: []};
                }

                scope[field].selected = [];

                // Same goes for the currentParams must filter
                if (!_.get(scope, `currentParams.params.must[${field}]`)) {
                    scope.currentParams.params.must[field] = [];
                }

                scope[field].selected = scope[field].list.filter(
                    (item) => (
                        scope.currentParams.params.must[field].indexOf(
                            key !== null ? item[key] : item
                        ) > -1
                    )
                );
            };

            /**
             * @ngdoc method
             * @name ContentPublishingReportFilters#onLoadCheck
             * @param {String} field - The name of the field that was loaded
             * @param {String} key - The key attribute of the source to use
             * @description Loads the associated data for checkbox input
             */
            this.onLoadCheck = (field, key = null) => {
                // If for some reason the field is not in the scope
                // then set it up now
                if (!scope[field]) {
                    scope[field] = {list: [], selected: {}};
                }

                scope[field].selected = {};

                // Same goes for the currentParams must filter
                if (!_.get(scope, `currentParams.params.must[${field}]`)) {
                    scope.currentParams.params.must[field] = [];
                }

                scope.currentParams.params.must[field].forEach((item) => {
                    if (key !== null) {
                        scope[field].selected[item[key]] = true;
                    } else {
                        scope[field].selected[item] = true;
                    }
                });
            };

            /**
             * @ngdoc method
             * @name ContentPublishingReportFilters#onUpdateSelect
             * @param {String} field - The name of the field that was loaded
             * @param {String} key - The key attribute of the source to use
             * @description Updates the report parameters from a select input
             */
            scope.onUpdateSelect = (field, key = null) => {
                // Make sure the currentParams has a must filter
                if (!_.get(scope, `currentParams.params.must[${field}]`)) {
                    scope.currentParams.params.must[field] = [];
                }

                scope.currentParams.params.must[field] = key !== null ?
                    scope[field].selected.map((item) => item[key]) :
                    _.cloneDeep(scope[field].selected);
            };

            /**
             * @ngdoc method
             * @name ContentPublishingReportFilters#onUpdateUrgency
             * @description Updates the report parameters for the urgency input (checkbox input)
             */
            scope.onUpdateUrgency = () => {
                // Make sure the currentParams has a must filter
                if (!_.get(scope, 'currentParams.params.must.urgency')) {
                    scope.currentParams.params.must.urgency = [];
                }

                scope.currentParams.params.must.urgency = _.map(
                    Object.keys(
                        _.pickBy(
                            scope.urgency.selected,
                            (val) => val === true
                        )
                    ),
                    Number
                );
            };

            this.init();
        },
    };
}
