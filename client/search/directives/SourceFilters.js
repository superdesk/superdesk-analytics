import {
    ENTER_DESK_OPERATIONS,
    EXIT_DESK_OPERATIONS,
    getTranslatedOperations,
} from '../../utils';

/**
 * @ngdoc property
 * @module superdesk.analytics.search
 * @name SOURCE_FILTERS
 * @type {Object}
 * @description Available source filters
 */
export const SOURCE_FILTERS = {
    DESKS: 'desks',
    USERS: 'users',
    CATEGORIES: 'categories',
    GENRE: 'genre',
    SOURCES: 'sources',
    URGENCY: 'urgency',
    STATES: 'states',
    INGEST_PROVIDERS: 'ingest_providers',
    STAGES: 'stages',
    STATS: {
        DESK_TRANSITIONS: {
            ENTER: 'stats_desk_transition_enter',
            EXIT: 'stats_desk_transition_exit',
        }
    }
};

/**
 * @ngdoc property
 * @module superdesk.analytics.search
 * @name SOURCE_FILTER_FIELDS
 * @type {Object}
 * @description Field configs for each filter in SOURCE_FILTERS
 */
export const SOURCE_FILTER_FIELDS = {
    [SOURCE_FILTERS.DESKS]: {
        paramName: SOURCE_FILTERS.DESKS,
        keyField: '_id',
        labelField: 'name',
        source: 'desks',
        field: 'task.desk',
    },
    [SOURCE_FILTERS.USERS]: {
        paramName: SOURCE_FILTERS.USERS,
        keyField: '_id',
        labelField: 'display_name',
        source: 'users',
        field: 'task.user',
    },
    [SOURCE_FILTERS.CATEGORIES]: {
        paramName: SOURCE_FILTERS.CATEGORIES,
        keyField: 'qcode',
        labelField: 'name',
        source: 'metadata',
        field: 'anpa_category.qcode',
    },
    [SOURCE_FILTERS.GENRE]: {
        paramName: SOURCE_FILTERS.GENRE,
        keyField: 'qcode',
        labelField: 'name',
        source: 'metadata',
        field: 'genre.qcode',
    },
    [SOURCE_FILTERS.SOURCES]: {
        paramName: SOURCE_FILTERS.SOURCES,
        keyField: '_id',
        labelField: 'name',
        source: 'sources',
        field: 'source',
    },
    [SOURCE_FILTERS.URGENCY]: {
        paramName: SOURCE_FILTERS.URGENCY,
        keyField: 'qcode',
        labelField: 'name',
        source: 'metadata',
        field: 'urgency',
    },
    [SOURCE_FILTERS.STATES]: {
        paramName: SOURCE_FILTERS.STATES,
        keyField: 'qcode',
        labelField: 'name',
        source: null,
        field: 'state',
    },
    [SOURCE_FILTERS.INGEST_PROVIDERS]: {
        paramName: SOURCE_FILTERS.INGEST_PROVIDERS,
        keyField: '_id',
        labelField: 'name',
        source: 'ingest_providers',
        field: 'ingest_providers',
    },
    [SOURCE_FILTERS.STAGES]: {
        paramName: SOURCE_FILTERS.STAGES,
        keyField: '_id',
        labelField: 'name',
        source: 'desks',
        field: 'stages',
    },
    [SOURCE_FILTERS.STATS.DESK_TRANSITIONS.ENTER]: {
        paramName: 'desk_transitions.enter',
        keyField: 'operation',
        labelField: 'name',
        source: null,
        field: 'desk_transitions.enter',
    },
    [SOURCE_FILTERS.STATS.DESK_TRANSITIONS.EXIT]: {
        paramName: 'desk_transitions.exit',
        keyField: 'operation',
        labelField: 'name',
        source: null,
        field: 'desk_transitions.exit',
    },
};

/**
 * @ngdoc proprety
 * @module superdesk.analytics.search
 * @name DEFAULT_SOURCE_FILTERS
 * @type {Array<String>}
 * @description Default list of source filters
 */
export const DEFAULT_SOURCE_FILTERS = [
    SOURCE_FILTERS.DESKS,
    SOURCE_FILTERS.USERS,
    SOURCE_FILTERS.CATEGORIES,
    SOURCE_FILTERS.GENRE,
    SOURCE_FILTERS.SOURCES,
    SOURCE_FILTERS.URGENCY,
    SOURCE_FILTERS.STATES,
    SOURCE_FILTERS.INGEST_PROVIDERS,
    SOURCE_FILTERS.STAGES,
];


SourceFilters.$inject = [
    'lodash',
    '$q',
    'userList',
    'desks',
    'metadata',
    'gettext',
    'gettextCatalog',
    'searchReport',
    'ingestSources',
];

/**
 * @ngdoc directive
 * @module superdesk.analytics.search
 * @name sdaSourceFilters
 * @requires lodash
 * @requires $q
 * @requires userList
 * @requires desks
 * @requires metadata
 * @requires gettext
 * @requires gettextCatalog
 * @requires searchReport
 * @requires ingestSources
 * @description A directive that provides desk, user, source and metadata filters for reports
 */
export function SourceFilters(
    _,
    $q,
    userList,
    desks,
    metadata,
    gettext,
    gettextCatalog,
    searchReport,
    ingestSources
) {
    return {
        template: require('../views/source-fitlers.html'),
        scope: {
            fields: '=?',
            params: '=',
            paddingBottom: '=?',
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
                    scope.fields = DEFAULT_SOURCE_FILTERS;
                }

                if (angular.isUndefined(scope.paddingBottom)) {
                    scope.paddingBottom = true;
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
                searchReport.query(
                    'content_publishing_report',
                    {
                        aggs: {group: {field: 'source'}},
                        repos: {
                            ingest: false,
                            archive: false,
                            published: true,
                            archived: true,
                        }
                    },
                    true
                )
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

                if (_.get(newParams, `must[${filter.paramName}].length`, 0) > 0) {
                    filter.exclude = false;
                    selected = _.get(newParams.must, filter.paramName);
                } else if (_.get(newParams, `must_not[${filter.paramName}].length`, 0) > 0) {
                    filter.exclude = true;
                    selected = _.get(newParams.must_not, filter.paramName);
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

                    _.set(scope.params.must, filter.paramName, values);
                    if (_.get(scope, `params.must_not[${filter.paramName}]`)) {
                        _.unset(scope.params.must_not, filter.paramName);
                    }
                } else {
                    if (!_.get(scope, 'params.must_not')) {
                        scope.params.must_not = {};
                    }

                    _.set(scope.params.must_not, filter.paramName, values);
                    if (_.get(scope, `params.must[${filter.paramName}]`)) {
                        _.unset(scope.params.must, filter.paramName);
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
                [SOURCE_FILTERS.DESKS]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.DESKS],
                    label: gettextCatalog.getString('Desks'),
                    placeholder: gettextCatalog.getString('Search ') + gettextCatalog.getString('Desks'),
                    items: [],
                    selected: [],
                    exclude: false,
                    enabled: false,
                    fetch: () => desks.initialize(),
                    receive: () => _.get(desks, 'desks._items') || [],
                    minLength: 1,
                },
                [SOURCE_FILTERS.USERS]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.USERS],
                    label: gettextCatalog.getString('Users'),
                    placeholder: gettextCatalog.getString('Search ') + gettextCatalog.getString('Users'),
                    items: [],
                    selected: [],
                    exclude: false,
                    enabled: false,
                    fetch: () => userList.getAll(),
                    receive: (data) => _.get(data, 'users') || [],
                    minLength: 1,
                },
                [SOURCE_FILTERS.CATEGORIES]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.CATEGORIES],
                    label: gettextCatalog.getString('Categories'),
                    placeholder: gettextCatalog.getString('Search ') + gettextCatalog.getString('Categories'),
                    items: [],
                    selected: [],
                    exclude: false,
                    enabled: false,
                    fetch: () => metadata.initialize(),
                    receive: () => _.get(metadata, 'values.categories') || [],
                    minLength: 1,
                },
                [SOURCE_FILTERS.GENRE]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.GENRE],
                    label: gettextCatalog.getString('Genre'),
                    placeholder: gettextCatalog.getString('Search ') + gettextCatalog.getString('Genre'),
                    items: [],
                    selected: [],
                    exclude: false,
                    enabled: false,
                    fetch: () => metadata.initialize(),
                    receive: () => _.get(metadata, 'values.genre') || [],
                    minLength: 1,
                },
                [SOURCE_FILTERS.SOURCES]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.SOURCES],
                    label: gettextCatalog.getString('Source'),
                    placeholder: gettextCatalog.getString('Search ') + gettextCatalog.getString('Source'),
                    items: [],
                    selected: [],
                    exclude: false,
                    enabled: false,
                    fetch: () => this.loadSources(),
                    receive: (data) => _.get(data, 'sources') || [],
                    minLength: 1,
                },
                [SOURCE_FILTERS.URGENCY]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.URGENCY],
                    label: gettextCatalog.getString('Urgency'),
                    placeholder: gettextCatalog.getString('Search ') + gettextCatalog.getString('Urgency'),
                    items: [],
                    selected: [],
                    exclude: false,
                    enabled: false,
                    fetch: () => metadata.initialize(),
                    receive: () => (_.get(metadata, 'values.urgency') || []),
                    minLength: 1,
                },
                [SOURCE_FILTERS.STATES]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.STATES],
                    label: gettextCatalog.getString('Content State'),
                    placeholder: gettextCatalog.getString('Search ') + gettextCatalog.getString('Content State'),
                    items: searchReport.filterItemStates(
                        ['published', 'killed', 'corrected', 'recalled']
                    ),
                    selected: [],
                    exclude: false,
                    enabled: false,
                    fetch: () => $q.when(),
                    receive: () => scope.filters.states.items,
                    minLength: 1,
                },
                [SOURCE_FILTERS.INGEST_PROVIDERS]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.INGEST_PROVIDERS],
                    label: gettextCatalog.getString('Ingest Providers'),
                    placeholder: gettextCatalog.getString('Search ') + gettextCatalog.getString('Ingest Providers'),
                    items: [],
                    selected: [],
                    exclude: false,
                    enabled: false,
                    fetch: () => ingestSources.initialize(),
                    receive: () => _.filter(
                        _.get(ingestSources, 'providers') || [],
                        (provider) => !_.get(provider, 'search_provider')
                    ),
                    minLength: 1,
                },
                [SOURCE_FILTERS.STAGES]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.STAGES],
                    label: gettextCatalog.getString('Stages'),
                    placeholder: gettextCatalog.getString('Search ') + gettextCatalog.getString('Stages'),
                    items: [],
                    selected: [],
                    exclude: false,
                    enabled: false,
                    fetch: () => desks.initialize(),
                    receive: () => {
                        const deskStages = [];

                        _.forEach((desks.deskStages), (stages, deskId) => {
                            const deskName = _.get(desks.deskLookup, `[${deskId}].name`) || '';

                            deskStages.push(
                                ...stages.map((stage) => ({
                                    _id: stage._id,
                                    name: deskName + '/' + stage.name
                                }))
                            );
                        });

                        return deskStages;
                    },
                    minLength: 1,
                },
                [SOURCE_FILTERS.STATS.DESK_TRANSITIONS.ENTER]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.STATS.DESK_TRANSITIONS.ENTER],
                    label: gettextCatalog.getString('Enter Desk Actions'),
                    placeholder: gettextCatalog.getString('Search ') + gettextCatalog.getString('Enter Actions'),
                    items: [],
                    selected: [],
                    exclude: false,
                    enabled: false,
                    fetch: () => $q.when(),
                    receive: () => {
                        const operationTranslations = getTranslatedOperations(gettext);

                        return ENTER_DESK_OPERATIONS.map(
                            (operation) => ({
                                operation: operation,
                                name: operationTranslations[operation],
                            })
                        );
                    },
                    minLength: 1,
                },
                [SOURCE_FILTERS.STATS.DESK_TRANSITIONS.EXIT]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.STATS.DESK_TRANSITIONS.EXIT],
                    label: gettextCatalog.getString('Exit Desk Actions'),
                    placeholder: gettextCatalog.getString('Search ') + gettextCatalog.getString('Exit Actions'),
                    items: [],
                    selected: [],
                    exclude: false,
                    enabled: false,
                    fetch: () => $q.when(),
                    receive: () => {
                        const operationTranslations = getTranslatedOperations(gettext);

                        return EXIT_DESK_OPERATIONS.map(
                            (operation) => ({
                                operation: operation,
                                name: operationTranslations[operation],
                            })
                        );
                    },
                    minLength: 1,
                }
            };

            this.init();
        }
    };
}
