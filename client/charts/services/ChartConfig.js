import {formatDate, getTranslatedOperations} from '../../utils';
import {SDChart} from '../SDChart';

ChartConfig.$inject = [
    'lodash',
    'notify',
    'gettext',
    'gettextCatalog',
    'moment',
    'config',
    '$q',
    'userList',
    'desks',
    'metadata',
    '$interpolate',
    'ingestSources',
];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.charts
 * @name ChartConfig
 * @param lodash
 * @param notify
 * @param gettext
 * @param gettextCatalog
 * @param moment
 * @param config
 * @param $q
 * @param userList
 * @param desks
 * @param metadata
 * @param $interpolate
 * @param ingestSources
 * @description Highchart Config generator
 */
export function ChartConfig(
    _,
    notify,
    gettext,
    gettextCatalog,
    moment,
    config,
    $q,
    userList,
    desks,
    metadata,
    $interpolate,
    ingestSources
) {
    const self = this;

    /**
     * @ngdoc property
     * @name ChartConfig#defaultConfig
     * @type {Object}
     * @description The default config attributes applied to generated configs
     */
    self.defaultConfig = {
        credits: {enabled: false},
        exporting: {
            fallbackToExportServer: false,
            error: () => {
                notify.error(
                    gettext('Failed to export the chart;')
                );
            },
            buttons: {
                contextButton: {
                    menuItems: [
                        'printChart',
                        'downloadPNG',
                        'downloadJPEG',
                        'downloadSVG',
                        'downloadPDF',
                        'downloadCSV',
                    ],
                },
            },
        },
    };

    /**
     * @ngdoc property
     * @name ChartConfig#chartTypes
     * @type {Array<Object>}
     * @description List of available chart types to generate configs for
     */
    self.chartTypes = [{
        qcode: 'bar',
        name: gettext('Bar'),
    }, {
        qcode: 'column',
        name: gettext('Column'),
    }, {
        qcode: 'table',
        name: gettext('Table'),
    }, {
        qcode: 'area',
        name: gettext('Area'),
    }, {
        qcode: 'line',
        name: gettext('Line'),
    }, {
        qcode: 'pie',
        name: gettext('Pie'),
    }, {
        qcode: 'scatter',
        name: gettext('Scatter'),
    }, {
        qcode: 'spline',
        name: gettext('Spline'),
    }];

    /**
     * @ngdoc method
     * @name ChartConfig#filterChartTypes
     * @param {Array<String>} types - An array of type names to filter for
     * @returns {Array<Object>}
     * @description Returns an array of chart types for use with report params
     */
    self.filterChartTypes = (types) => (
        self.chartTypes.filter(
            (chartType) => types.indexOf(chartType.qcode) > -1
        )
    );

    self.translations = {};

    /**
     * @ngdoc class
     * @name HighchartConfig
     * @description Class instance for generating a config for use with Highcharts
     * @param {string} id - The id to be given to the chart
     * @param {string} chartType - The qcode of the chart type to generate
     */
    class HighchartConfig {
        constructor(id, chartType) {
            this.id = id;
            this.config = {};
            this.title = '';
            this.subtitle = '';
            this.chartType = chartType;
            this.sources = [];
            this.sortOrder = 'desc';
            this.shadow = true;
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#isMultiSource
         * @return {boolean}
         * @description Returns true if this chart has multiple data sources
         */
        isMultiSource() {
            return this.sources.length > 1;
        }

        getSource(index) {
            const source = this.sources[index] || {};

            return {
                field: _.get(source, 'field') || '',
                data: _.get(source, 'data') || {},
            };
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getParent
         * @return {Object}
         * @description Returns the parent data source's field and data attributes
         */
        getParent() {
            return this.getSource(0);
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getChild
         * @return {Object}
         * @description Returns the child data source's field and data attributes
         */
        getChild() {
            return this.getSource(1);
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getTitle
         * @return {string}
         * @description Returns the title string to use for the chart
         */
        getTitle() {
            return this.title;
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getSubtitle
         * @return {string}
         * @description Returns the subtitle string to use for the chart
         */
        getSubtitle() {
            return this.subtitle;
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getSourceName
         * @param {string} field - The field attribute of the source, i.e. anpa_category.qcode
         * @return {string}
         * @description Returns the name for the given source
         */
        getSourceName(field) {
            return self.getTranslationTitle(field);
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getYAxisTitle
         * @return {string}
         * @description Returns the title for the Y Axis (defaults to 'Published Stories')
         */
        getYAxisTitle() {
            return gettext('Published Stories');
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getSourceTitles
         * @param {string} field - The field attribute of the source (i.e. anpa_category.qcode)
         * @param {Array<String>} keys - An array of key values for the data sources
         * @return {Array}
         * @description Returns the list of titles used for the data sources
         */
        getSourceTitles(field, keys) {
            const names = self.getTranslationNames(field);

            return keys.map((qcode) => _.get(names, qcode) || qcode);
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getSourceTitle
         * @param {string} field - The field attribute of the source (i.e. anpa_category.qcode)
         * @param {string} qcode - The key value for the specific data source
         * @return {string}
         * @description Returns the name for the specific data source
         */
        getSourceTitle(field, qcode) {
            return self.getTranslationNames(field)[qcode] || qcode;
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getSortedKeys
         * @param {Object} data - The source data to get the keys for
         * @return {Array<string>}
         * @description Returns array of keys based on sorting of the data (using this.sortOrder)
         */
        getSortedKeys(data) {
            return !this.isMultiSource() ?
                this.getSingleSortedKeys(data) :
                this.getMultiSortedKeys(data);
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getSingleSortedKeys
         * @param {Object} data - The source data to get the keys for
         * @return {Array<string>}
         * @description Returns array of keys for single series data
         */
        getSingleSortedKeys(data) {
            return _.sortBy(
                Object.keys(data),
                (group) => this.sortOrder === 'asc' ?
                    data[group] :
                    -data[group]
            );
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getMultiSortedKeys
         * @param {Object} data - The source data to get the keys for
         * @return {Array<string>}
         * @description Returns array of keys for stacked series data
         */
        getMultiSortedKeys(data) {
            return _.sortBy(
                Object.keys(data),
                (group) => this.sortOrder === 'asc' ?
                    _.sum(_.values(data[group])) :
                    -_.sum(_.values(data[group]))
            );
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#addSource
         * @param {string} field - The sources field attribute (i.e. anpa_category.qcode)
         * @param {Object} data - An object containing the source data
         * @description Adds the provided sources field and data to this chart config
         */
        addSource(field, data) {
            this.sources.push({field, data});
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#clearSources
         * @description Clears the sources array
         */
        clearSources() {
            this.sources = [];
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#genHighchartsConfig
         * @return {Object}
         * @description Generates and returns the Highcharts config
         */
        genHighchartsConfig() {
            const configType = this.chartType === 'table' ? 'table' : 'highcharts';
            const chart = new SDChart.Chart({
                id: this.id,
                chartType: configType,
                title: this.getTitle(),
                subtitle: this.getSubtitle(),
                defaultConfig: self.defaultConfig,
                fullHeight: true,
                shadow: this.shadow,
            });

            chart.translations = self.translations;
            chart.tooltipPoint = '';

            const parent = this.getParent();

            const axisOptions = {
                type: 'category',
                defaultChartType: this.chartType === 'table' ? 'column' : this.chartType,
                yTitle: this.getYAxisTitle(),
                xTitle: chart.getTranslationTitle(parent.field),
                categoryField: parent.field,
                categories: this.getSortedKeys(parent.data),
            };

            if (!this.isMultiSource()) {
                chart.tooltipHeader = '{point.x}: {point.y}';
                chart.dataLabels = true;
                chart.colourByPoint = true;

                chart.addAxis()
                    .setOptions({
                        ...axisOptions,
                        stackLabels: false,
                    })
                    .addSeries()
                    .setOptions({
                        field: parent.field,
                        data: _.map(
                            this.getSortedKeys(parent.data),
                            (source) => _.get(parent.data, source) || 0
                        ),
                    });
            } else {
                const child = this.getChild();

                chart.legendTitle = this.getSourceName(child.field);
                chart.tooltipHeader = '{series.name}/{point.x}: {point.y}';
                chart.dataLabels = false;
                chart.colourByPoint = false;

                const axis = chart.addAxis()
                    .setOptions({
                        ...axisOptions,
                        stackLabels: true,
                    });

                Object.keys(child.data).forEach((group) => {
                    axis.addSeries()
                        .setOptions({
                            field: child.field,
                            name: group,
                            stack: 0,
                            stackType: 'normal',
                            data: _.map(
                                this.getSortedKeys(parent.data),
                                (parentKey) => _.get(parent.data, `['${parentKey}']['${group}']`) || 0
                            ),
                        });
                });
            }

            return chart.genConfig();
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#genConfig
         * @return {Object}
         * @description Generates and returns the Highcharts or Table configs based on chart options
         */
        genConfig() {
            return this.loadTranslations()
                .then(() => {
                    this.config = this.genHighchartsConfig();
                    return this.config;
                });
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#loadTranslations
         * @param {String} parentField - Name of the first field (defaults to Parent)
         * @param {String} childField - Name of the second field (defaults to Child)
         * @param {boolean} clearCurrent - Clears current translations if true
         * @return {Promise} Resolves when all translations have been loaded
         * @description Loads data for translating id/qcode to display names
         */
        loadTranslations(parentField = null, childField = null, clearCurrent = false) {
            return self.loadTranslations(
                [
                    parentField || this.getParent().field,
                    childField || this.getChild().field,
                ],
                clearCurrent
            );
        }
    }

    /**
     * @ngdoc method
     * @name ChartConfig#setTranslation
     * @param {String} field - The name of the field for this translation
     * @param {String} title - The title of the field name
     * @param {Object} names - Map of id/qcode to display names
     * @description Saves the provided field translations
     */
    self.setTranslation = (field, title, names = {}) => {
        self.translations[field.replace(/\./g, '_')] = {title, names};
    };

    /**
     * @ngdoc method
     * @name ChartConfig#getTranslations
     * @param {String} field - Name of the field to get translations for
     * @return {Object}
     * @description Helper function to get the translations for a field
     */
    self.getTranslations = (field) => (
        self.translations[field.replace(/\./g, '_')] || {}
    );

    /**
     * @ngdoc method
     * @name ChartConfig#getTranslationTitle
     * @param {String} field - Name of the field to get translated title for
     * @return {String}
     * @description Helper function to get the translated title for a field
     */
    self.getTranslationTitle = (field) => (
        self.getTranslations(field).title || field
    );

    /**
     * @ngdoc method
     * @name ChartConfig#getTranslationNames
     * @param {String} field - Name of the field to get translated names for
     * @return {Object}
     * @description Helper function to get the translated id->name map for a field
     */
    self.getTranslationNames = (field) => (
        self.getTranslations(field).names || {}
    );

    /**
     * @ngdoc propery
     * @name fieldTranslations
     * @type {Object}
     * @description Externally editable map of functions for field name & values translations
     */
    self.fieldTranslations = {
        'task.desk': () => (
            desks.initialize()
                .then(() => {
                    self.setTranslation(
                        'task.desk',
                        gettext('Desk'),
                        _.fromPairs(_.map(
                            _.get(desks, 'desks._items') || [],
                            (desk) => [_.get(desk, '_id'), _.get(desk, 'name')]
                        ))
                    );
                })
        ),
        'task.user': () => (
            userList.getAll()
                .then((users) => {
                    self.setTranslation(
                        'task.user',
                        gettext('User'),
                        _.fromPairs(_.map(
                            users || [],
                            (user) => [_.get(user, '_id'), _.get(user, 'display_name')]
                        ))
                    );
                })
        ),
        'anpa_category.qcode': () => (
            metadata.initialize()
                .then(() => {
                    self.setTranslation(
                        'anpa_category.qcode',
                        gettext('Category'),
                        _.fromPairs(_.map(
                            _.get(metadata, 'values.categories') || [],
                            (item) => [_.get(item, 'qcode'), _.get(item, 'name')]
                        ))
                    );
                })
        ),
        'genre.qcode': () => (
            metadata.initialize()
                .then(() => {
                    self.setTranslation(
                        'genre.qcode',
                        gettext('Genre'),
                        _.fromPairs(_.map(
                            _.get(metadata, 'values.genre') || [],
                            (item) => [_.get(item, 'qcode'), _.get(item, 'name')]
                        ))
                    );
                })
        ),
        urgency: () => (
            metadata.initialize()
                .then(() => {
                    self.setTranslation(
                        'urgency',
                        gettextCatalog.getString('Urgency'),
                        _.fromPairs(_.map(
                            _.get(metadata, 'values.urgency') || [],
                            (item) => [_.get(item, 'qcode'), _.get(item, 'name')]
                        ))
                    );
                })
        ),
        state: () => {
            self.setTranslation(
                'state',
                gettext('State'),
                {
                    published: gettext('Published'),
                    killed: gettext('Killed'),
                    corrected: gettext('Corrected'),
                    updated: gettext('Updated'),
                    recalled: gettext('Recalled'),
                }
            );

            return null;
        },
        source: () => {
            self.setTranslation(
                'source',
                gettext('Source')
            );

            return null;
        },
        ingest_providers: () => (
            ingestSources.initialize()
                .then(() => {
                    self.setTranslation(
                        'ingest_providers',
                        gettext('Ingest Providers'),
                        _.fromPairs(
                            _.map(
                                _.get(ingestSources, 'providers') || [],
                                (item) => [_.get(item, '_id'), _.get(item, 'name')]
                            )
                        )
                    );
                })
        ),
        stages: () => (
            desks.initialize()
                .then(() => {
                    const deskStages = [];

                    _.forEach((desks.deskStages), (stages, deskId) => {
                        const deskName = _.get(desks.deskLookup, `[${deskId}].name`) || '';

                        deskStages.push(
                            ...stages.map((stage) => ({
                                _id: stage._id,
                                name: deskName + '/' + stage.name,
                            }))
                        );
                    });

                    self.setTranslation(
                        'stages',
                        gettext('Stages'),
                        _.fromPairs(
                            _.map(
                                deskStages,
                                (item) => [_.get(item, '_id'), _.get(item, 'name')]
                            )
                        )
                    );
                })
        ),
        operation: () => {
            self.setTranslation(
                'operation',
                gettext('Operation'),
                getTranslatedOperations(gettext)
            );
        },
    };

    /**
     * @ngdoc method
     * @name ChartConfig#loadTranslations
     * @param {Array} fields - Array of field names to load translations for
     * @param {boolean} clearCurrent - Clears current translations if true
     * @return {Promise} Resolves when all translations have been loaded
     * @description Loads data for translating id/qcode to display names
     */
    self.loadTranslations = (fields, clearCurrent = false) => {
        if (clearCurrent) {
            self.translations = {};
        }

        const promises = [];

        fields.forEach(
            (field) => {
                if (_.get(self.fieldTranslations, field)) {
                    const promise = self.fieldTranslations[field]();

                    if (promise !== null) {
                        promises.push(promise);
                    }
                }
            }
        );

        return $q.all(promises);
    };

    /**
     * @ngdoc method
     * @name ChartConfig#newConfig
     * @returns {HighchartConfig}
     * @description Returns a new HighchartConfig instance
     */
    self.newConfig = (id, chartType) => (
        new HighchartConfig(id, chartType)
    );

    /**
     * @ngdoc method
     * @name ChartConfig#generateSubtitleForDates
     * @param {Object} params - The params for the report
     * @return {String}
     * @description Generates a subtitle string based on the dates of the report
     */
    self.generateSubtitleForDates = (params) => {
        if (_.get(params, 'chart.subtitle')) {
            return params.chart.subtitle;
        }

        const filters = {
            range: () => {
                const start = _.get(params, 'dates.start');
                const end = _.get(params, 'dates.end');

                if (moment(start, config.model.dateformat).isValid() &&
                    moment(end, config.model.dateformat).isValid()
                ) {
                    return formatDate(moment, config, start) +
                        ' - ' +
                        formatDate(moment, config, end);
                }
            },
            yesterday: () => (
                moment()
                    .subtract(1, 'days')
                    .format('dddd Do MMMM YYYY')
            ),
            last_week: () => {
                const startDate = moment()
                    .subtract(1, 'weeks')
                    .startOf('week')
                    .format('LL');
                const endDate = moment()
                    .subtract(1, 'weeks')
                    .endOf('week')
                    .format('LL');

                return startDate + ' - ' + endDate;
            },
            last_month: () => (
                moment()
                    .subtract(1, 'months')
                    .format('MMMM YYYY')
            ),
            day: () => (
                moment(_.get(params, 'dates.date'), config.model.dateformat)
                    .format('dddd Do MMMM YYYY')
            ),
            relative: () => (
                $interpolate(
                    gettext('Last {{hours}} hours')
                )({hours: _.get(params, 'dates.relative')})
            ),
            relative_days: () => (
                $interpolate(
                    gettext('Last {{days}} days')
                )({days: _.get(params, 'dates.relative_days')})
            ),
        };

        const dateFilter = _.get(params, 'dates.filter');

        return _.get(filters, dateFilter) ?
            filters[dateFilter]() :
            null;
    };
}
