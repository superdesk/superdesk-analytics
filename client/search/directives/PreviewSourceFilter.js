import {SOURCE_FILTERS, SOURCE_FILTER_FIELDS} from './SourceFilters';


PreviewSourceFilter.$inject = ['lodash', 'chartConfig', 'gettext', 'gettextCatalog'];

/**
 * @ngdoc directive
 * @module superdesk.analytics.search
 * @name sdaPreviewSourceFilter
 * @requires lodash
 * @requires chartConfig
 * @requires gettext
 * @requires gettextCatalog
 * @description A directive that renders a preview for the source filters
 */
export function PreviewSourceFilter(_, chartConfig, gettext, gettextCatalog) {
    return {
        template: require('../views/preview-source-filter.html'),
        link: function(scope) {
            scope.flags = {ready: false};
            const params = _.get(scope, 'report.params') || {};
            const paramNames = Object.keys(SOURCE_FILTER_FIELDS).map(
                (field) => SOURCE_FILTER_FIELDS[field].paramName
            );

            const mustFields = paramNames.filter(
                (field) => _.get(params.must || {}, field)
            );
            const mustNotFields = paramNames.filter(
                (field) => _.get(params.must_not || {}, field)
            );

            const uniqueFields = _.uniq(_.concat(mustFields, mustNotFields));

            const init = () => {
                chartConfig.loadTranslations(scope.enabledFieldTypes)
                    .then(() => {
                        scope.enabledFields.forEach((filter) => {
                            if (_.get(filter, 'exclude') === null) {
                                filter.enabled = false;
                                return;
                            }

                            const translations = chartConfig.getTranslationNames(filter.field);

                            let values = !filter.exclude ?
                                _.get(params, `must[${filter.paramName}]`) :
                                _.get(params, `must_not[${filter.paramName}]`);

                            if (!Array.isArray(values)) {
                                values = Object.keys(values).filter((value) => values[value]);
                            }

                            filter.viewValue = values.map((value) => translations[value] || value)
                                .join(', ');

                            if (!filter.viewValue) {
                                filter.enabled = false;
                            }
                        });

                        switch (_.get(params, 'rewrites') || 'include') {
                        case 'include':
                            scope.rewrites = gettext('Include rewrites');
                            break;
                        case 'exclude':
                            scope.rewrites = gettext('Exclude rewrites');
                            break;
                        case 'only':
                            scope.rewrites = gettext('Rewrites only');
                            break;
                        }

                        scope.flags.ready = true;
                    });
            };

            const isExcluded = (filter) => {
                let values = _.get(params, `must[${filter}]`);

                if (values) {
                    if (!Array.isArray(values)) {
                        values = Object.keys(values);
                    }

                    if (_.get(values, 'length', 0) > 0) {
                        return false;
                    }
                }

                values = _.get(params, `must_not[${filter}]`);

                if (values) {
                    if (!Array.isArray(values)) {
                        values = Object.keys(values);
                    }

                    if (_.get(values, 'length', 0) > 0) {
                        return true;
                    }
                }

                return null;
            };

            const filters = {
                [SOURCE_FILTERS.DESKS]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.DESKS],
                    label: gettextCatalog.getString('Desks'),
                    enabled: uniqueFields.indexOf('desks') > -1,
                    exclude: isExcluded(SOURCE_FILTERS.DESKS),
                },
                [SOURCE_FILTERS.USERS]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.USERS],
                    label: gettextCatalog.getString('Users'),
                    enabled: uniqueFields.indexOf('users') > -1,
                    exclude: isExcluded(SOURCE_FILTERS.USERS),
                },
                [SOURCE_FILTERS.CATEGORIES]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.CATEGORIES],
                    label: gettextCatalog.getString('Categories'),
                    enabled: uniqueFields.indexOf('categories') > -1,
                    exclude: isExcluded(SOURCE_FILTERS.CATEGORIES),
                },
                [SOURCE_FILTERS.GENRE]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.GENRE],
                    label: gettextCatalog.getString('Genre'),
                    enabled: uniqueFields.indexOf('genre') > -1,
                    exclude: isExcluded(SOURCE_FILTERS.GENRE),
                },
                [SOURCE_FILTERS.SOURCES]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.SOURCES],
                    label: gettextCatalog.getString('Sources'),
                    enabled: uniqueFields.indexOf('sources') > -1,
                    exclude: isExcluded(SOURCE_FILTERS.SOURCES),
                },
                [SOURCE_FILTERS.URGENCY]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.URGENCY],
                    label: gettextCatalog.getString('Urgency'),
                    enabled: uniqueFields.indexOf('urgency') > -1,
                    exclude: isExcluded(SOURCE_FILTERS.URGENCY),
                },
                [SOURCE_FILTERS.STATES]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.STATES],
                    label: gettextCatalog.getString('States'),
                    enabled: uniqueFields.indexOf('states') > -1,
                    exclude: isExcluded(SOURCE_FILTERS.STATES),
                },
                [SOURCE_FILTERS.INGEST_PROVIDERS]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.INGEST_PROVIDERS],
                    label: gettextCatalog.getString('Ingest Providers'),
                    enabled: uniqueFields.indexOf('ingest_providers') > -1,
                    exclude: isExcluded(SOURCE_FILTERS.INGEST_PROVIDERS),
                },
                [SOURCE_FILTERS.STAGES]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.STAGES],
                    label: gettextCatalog.getString('Stages'),
                    enabled: uniqueFields.indexOf('stages') > -1,
                    exclude: isExcluded(SOURCE_FILTERS.STAGES),
                },
                [SOURCE_FILTERS.STATS.DESK_TRANSITIONS.ENTER]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.STATS.DESK_TRANSITIONS.ENTER],
                    label: gettextCatalog.getString('Enter Desk Actions'),
                    enabled: uniqueFields.indexOf(
                        SOURCE_FILTER_FIELDS[SOURCE_FILTERS.STATS.DESK_TRANSITIONS.ENTER].paramName
                    ) > -1,
                    exclude: isExcluded(
                        SOURCE_FILTER_FIELDS[SOURCE_FILTERS.STATS.DESK_TRANSITIONS.ENTER].paramName
                    ),
                },
                [SOURCE_FILTERS.STATS.DESK_TRANSITIONS.EXIT]: {
                    ...SOURCE_FILTER_FIELDS[SOURCE_FILTERS.STATS.DESK_TRANSITIONS.EXIT],
                    label: gettextCatalog.getString('Exit Desk Actions'),
                    enabled: uniqueFields.indexOf(
                        SOURCE_FILTER_FIELDS[SOURCE_FILTERS.STATS.DESK_TRANSITIONS.EXIT].paramName
                    ) > -1,
                    exclude: isExcluded(
                        SOURCE_FILTER_FIELDS[SOURCE_FILTERS.STATS.DESK_TRANSITIONS.EXIT].paramName
                    ),
                },
            };

            scope.enabledFieldNames = Object.keys(filters).filter((field) => filters[field].enabled);
            scope.enabledFieldTypes = scope.enabledFieldNames.map((field) => filters[field].field);
            scope.enabledFields = scope.enabledFieldNames.map((field) => filters[field]);

            init();
        },
    };
}
