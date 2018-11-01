SourceFilters.$inject = [
    'lodash',
    '$q',
    'userList',
    'desks',
    'metadata',
    'gettextCatalog',
    'searchReport',
];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics
 * @name sdaSourceFilters
 * @requires lodash
 * @requires $q
 * @requires userList
 * @requires desks
 * @requires metadata
 * @requires gettextCatalog
 * @requires searchReport
 * @description A directive that provides desk, user, source and metadata filters for reports
 */
export function SourceFilters(
    _,
    $q,
    userList,
    desks,
    metadata,
    gettextCatalog,
    searchReport
) {
    return {
        template: require('../views/report-fitlers.html'),
        scope: {
            fields: '=?',
            params: '=',
            runQuery: '=',
        },
        link: function(scope) {
            /**
             * @ngdoc method
             * @name SourceFilters#init
             * @description Loads data for all the fields used
             */
            this.init = () => {
                scope.flags = {ready: false};

                if (angular.isUndefined(scope.params.rewrites)) {
                    scope.params.rewrites = 'include';
                }

                if (angular.isUndefined(scope.fields)) {
                    scope.fields = [
                        'desks',
                        'users',
                        'categories',
                        'genre',
                        'sources',
                        'urgency',
                        'states',
                    ];
                }

                const loaders = {};

                scope.fields.forEach((field) => {
                    const filter = _.get(scope, `filters[${field}]`);

                    if (filter && !_.get(loaders, filter.source) && _.get(filter, 'fetch')) {
                        loaders[filter.source] = filter.fetch();
                    }
                });

                $q.all(loaders)
                    .then((data) => {
                        scope.fields.forEach((field) => {
                            this.onLoadFilter(
                                _.get(scope, `filters[${field}]`),
                                data
                            );
                        });

                        scope.flags.ready = true;
                    });
            };

            scope.$watch('params', (newParams) => {
                // If the fields are not ready, don't worry about updating their values
                if (!scope.flags.ready) {
                    return;
                }

                if (angular.isUndefined(scope.params.rewrites)) {
                    scope.params.rewrites = 'include';
                }

                scope.fields.forEach((field) => {
                    const filter = _.get(scope, `filters[${field}]`);

                    if (!filter.enabled) {
                        return;
                    }

                    this.onParamsChanged(filter, newParams);
                });
            });

            /**
             * @ngdoc method
             * @name SourceFilters#loadSources
             * @description Load the list of sources from published and archived collections
             */
            this.loadSources = () => (
                scope.runQuery({
                    aggs: {group: {field: 'source'}},
                    repos: {
                        ingest: false,
                        archive: false,
                        published: true,
                        archived: true,
                    }
                })
                    .then((data) => (
                        _.map(
                            Object.keys(_.get(data, 'groups') || {}),
                            (source) => ({
                                _id: source,
                                name: source.toUpperCase(),
                            })
                        )
                    ))
            );

            /**
             * @ngdoc method
             * @name SourceFilters#onLoadFilter
             * @param {Object} filter - The filter field object
             * @param {Array} data - The data that was loaded for this field
             * @description Finalises loading of the filter field provided
             */
            this.onLoadFilter = (filter, data) => {
                if (!filter) {
                    return;
                }

                filter.items = _.sortBy(
                    filter.receive(data),
                    filter.labelField
                );

                this.onParamsChanged(filter, scope.params);

                filter.enabled = true;
            };

            /**
             * @ngdoc method
             * @name SourceFilters#onParamsChanged
             * @param {Object} filter - The filter field object
             * @param {Object} newParams - The new report parameters
             * @description Updates/Sets filter values for the given report parameters
             */
            this.onParamsChanged = (filter, newParams) => {
                let selected = [];

                if (_.get(newParams, `must[${filter.name}].length`, 0) > 0) {
                    filter.exclude = false;
                    selected = newParams.must[filter.name];
                } else if (_.get(newParams, `must_not[${filter.name}].length`, 0) > 0) {
                    filter.exclude = true;
                    selected = newParams.must_not[filter.name];
                }

                filter.selected = filter.items.filter(
                    (item) => (
                        selected.indexOf(item[filter.keyField]) >= 0
                    )
                );
            };

            /**
             * @ngdoc method
             * @name SourceFilters#onFilterChanged
             * @param {Object} filter - The filter field object
             * @description Updates the report parameters when the input field changes
             */
            scope.onFilterChanged = (filter) => {
                const values = filter.selected.map((item) => item[filter.keyField]);

                if (!filter.exclude) {
                    if (!_.get(scope, 'params.must')) {
                        scope.params.must = {};
                    }

                    scope.params.must[filter.name] = values;
                    if (_.get(scope, `params.must_not[${filter.name}]`)) {
                        delete scope.params.must_not[filter.name];
                    }
                } else {
                    if (!_.get(scope, 'params.must_not')) {
                        scope.params.must_not = {};
                    }

                    scope.params.must_not[filter.name] = values;
                    if (_.get(scope, `params.must[${filter.name}]`)) {
                        delete scope.params.must[filter.name];
                    }
                }
            };

            /**
             * @ngdoc property
             * @name SourceFilters#filters
             * @type {Object}
             * @description The list of available filters and their configuration for usage
             */
            scope.filters = {
                desks: {
                    name: 'desks',
                    label: gettextCatalog.getString('Desks'),
                    placeholder: gettextCatalog.getString('Search ') + gettextCatalog.getString('Desks'),
                    keyField: '_id',
                    labelField: 'name',
                    source: 'desks',
                    items: [],
                    selected: [],
                    exclude: false,
                    enabled: false,
                    fetch: () => desks.fetchDesks(),
                    receive: (data) => _.get(data, 'desks._items') || [],
                },
                users: {
                    name: 'users',
                    label: gettextCatalog.getString('Users'),
                    placeholder: gettextCatalog.getString('Search ') + gettextCatalog.getString('Users'),
                    keyField: '_id',
                    labelField: 'display_name',
                    source: 'users',
                    items: [],
                    selected: [],
                    exclude: false,
                    enabled: false,
                    fetch: () => userList.getAll(),
                    receive: (data) => _.get(data, 'users') || [],
                },
                categories: {
                    name: 'categories',
                    label: gettextCatalog.getString('Categories'),
                    placeholder: gettextCatalog.getString('Search ') + gettextCatalog.getString('Categories'),
                    keyField: 'qcode',
                    labelField: 'name',
                    source: 'metadata',
                    items: [],
                    selected: [],
                    exclude: false,
                    enabled: false,
                    fetch: () => metadata.initialize(),
                    receive: () => _.get(metadata, 'values.categories') || [],
                },
                genre: {
                    name: 'genre',
                    label: gettextCatalog.getString('Genre'),
                    placeholder: gettextCatalog.getString('Search ') + gettextCatalog.getString('Genre'),
                    keyField: 'qcode',
                    labelField: 'name',
                    source: 'metadata',
                    items: [],
                    selected: [],
                    exclude: false,
                    enabled: false,
                    fetch: () => metadata.initialize(),
                    receive: () => _.get(metadata, 'values.genre') || [],
                },
                sources: {
                    name: 'sources',
                    label: gettextCatalog.getString('Source'),
                    placeholder: gettextCatalog.getString('Search ') + gettextCatalog.getString('Source'),
                    keyField: '_id',
                    labelField: 'name',
                    source: 'sources',
                    items: [],
                    selected: [],
                    exclude: false,
                    enabled: false,
                    fetch: () => this.loadSources(),
                    receive: (data) => _.get(data, 'sources') || [],
                },
                urgency: {
                    name: 'urgency',
                    label: gettextCatalog.getString('Urgency'),
                    placeholder: gettextCatalog.getString('Search ') + gettextCatalog.getString('Urgency'),
                    keyField: 'qcode',
                    labelField: 'name',
                    source: 'metadata',
                    items: [],
                    selected: [],
                    exclude: false,
                    enabled: false,
                    fetch: () => metadata.initialize(),
                    receive: () => (_.get(metadata, 'values.urgency') || []),
                    minLength: 1,
                },
                states: {
                    name: 'states',
                    label: gettextCatalog.getString('Content State'),
                    placeholder: gettextCatalog.getString('Search ') + gettextCatalog.getString('Content State'),
                    keyField: 'qcode',
                    labelField: 'name',
                    source: null,
                    items: searchReport.filterItemStates(
                        ['published', 'killed', 'corrected', 'recalled']
                    ),
                    selected: [],
                    exclude: false,
                    enabled: false,
                    fetch: () => $q.when(),
                    receive: () => scope.filters.states.items,
                }
            };

            this.init();
        }
    };
}
