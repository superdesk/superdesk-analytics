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

            const mustFields = Object.keys(_.get(params, 'must') || {});
            const mustNotFields = Object.keys(_.get(params, 'must_not') || {});
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
                                _.get(params, `must[${filter.name}]`) :
                                _.get(params, `must_not[${filter.name}]`);

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
                desks: {
                    name: 'desks',
                    field: 'task.desk',
                    source: 'desks',
                    label: gettextCatalog.getString('Desks'),
                    enabled: uniqueFields.indexOf('desks') > -1,
                    exclude: isExcluded('desks'),
                },
                users: {
                    name: 'users',
                    field: 'task.user',
                    source: 'users',
                    label: gettextCatalog.getString('Users'),
                    enabled: uniqueFields.indexOf('users') > -1,
                    exclude: isExcluded('users'),
                },
                categories: {
                    name: 'categories',
                    field: 'anpa_category.qcode',
                    source: 'metadata',
                    label: gettextCatalog.getString('Categories'),
                    enabled: uniqueFields.indexOf('categories') > -1,
                    exclude: isExcluded('categories'),
                },
                genre: {
                    name: 'genre',
                    field: 'genre.qcode',
                    source: 'metadata',
                    label: gettextCatalog.getString('Genre'),
                    enabled: uniqueFields.indexOf('genre') > -1,
                    exclude: isExcluded('genre'),
                },
                sources: {
                    name: 'sources',
                    field: 'source',
                    source: 'sources',
                    label: gettextCatalog.getString('Sources'),
                    enabled: uniqueFields.indexOf('sources') > -1,
                    exclude: isExcluded('sources'),
                },
                urgency: {
                    name: 'urgency',
                    field: 'urgency',
                    source: 'metadata',
                    label: gettextCatalog.getString('Urgency'),
                    enabled: uniqueFields.indexOf('urgency') > -1,
                    exclude: isExcluded('urgency'),
                },
                states: {
                    name: 'states',
                    field: 'state',
                    source: null,
                    label: gettextCatalog.getString('States'),
                    enabled: uniqueFields.indexOf('states') > -1,
                    exclude: isExcluded('states'),
                },
                ingest_providers: {
                    name: 'ingest_providers',
                    field: 'ingest_providers',
                    source: 'ingest_providers',
                    label: gettextCatalog.getString('Ingest Providers'),
                    enabled: uniqueFields.indexOf('ingest_providers') > -1,
                    exclude: isExcluded('ingest_providers'),
                },
                stages: {
                    name: 'stages',
                    field: 'stages',
                    source: 'desks',
                    label: gettextCatalog.getString('Stages'),
                    enabled: uniqueFields.indexOf('stages') > -1,
                    exclude: isExcluded('stages'),
                },
            };

            scope.enabledFieldNames = Object.keys(filters).filter((field) => filters[field].enabled);
            scope.enabledFieldTypes = scope.enabledFieldNames.map((field) => filters[field].field);
            scope.enabledFields = scope.enabledFieldNames.map((field) => filters[field]);

            init();
        }
    };
}
