import {formatDate} from '../../utils';

ChartConfig.$inject = ['lodash', 'notify', 'gettext', 'moment', 'config'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.charts
 * @name ChartConfig
 * @param lodash
 * @param notify
 * @param gettext
 * @param moment
 * @param config
 * @description Highchart Config generator
 */
export function ChartConfig(_, notify, gettext, moment, config) {
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

        /**
         * @ngdoc method
         * @name HighchartConfig#getParent
         * @return {Object}
         * @description Returns the parent data source's field and data attributes
         */
        getParent() {
            return {
                field: _.get(this.sources, '[0].field') || '',
                data: _.get(this.sources, '[0].data') || {},
            };
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getChild
         * @return {Object}
         * @description Returns the child data source's field and data attributes
         */
        getChild() {
            return {
                field: _.get(this.sources, '[1].field') || '',
                data: _.get(this.sources, '[1].data') || {},
            };
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
         * @name HighchartConfig#getTitleConfig
         * @return {Object}
         * @description Returns the title config to use for the chart
         */
        getTitleConfig() {
            return {text: this.getTitle()};
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
         * @name HighchartConfig#getSubtitleConfig
         * @return {string}
         * @description Returns the subtitle config to use for the chart
         */
        getSubtitleConfig() {
            return {text: this.getSubtitle()};
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getSourceName
         * @param {string} field - The field attribute of the source, i.e. anpa_category.qcode
         * @return {string}
         * @description Returns the name for the given source
         */
        getSourceName(field) {
            return field;
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getXAxisConfig
         * @return {Object}
         * @description Returns the title and categories config for the X Axis
         */
        getXAxisConfig() {
            const {field, data} = this.getParent();

            return {
                title: {text: this.getXAxisTitle()},
                categories: this.getSourceTitles(
                    field,
                    this.getSortedKeys(data)
                ),
            };
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getXAxisTitle
         * @return {string}
         * @description Returns the title for the X Axis (defaults to primary data field name)
         */
        getXAxisTitle() {
            const {field} = this.getParent();

            return this.getSourceName(field);
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getYAxisConfig
         * @return {Object}
         * @description Returns the title and stack config for the Y Axis
         */
        getYAxisConfig() {
            return {
                title: {text: this.getYAxisTitle()},
                stackLabels: {enabled: this.isMultiSource()},
                allowDecimals: false,
            };
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
            return keys;
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
            return qcode;
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
         * @name HighchartConfig#getSeriesData
         * @return {Object}
         * @description Returns the Highcharts config for the series data
         */
        getSeriesData() {
            return !this.isMultiSource() ?
                this.getSingleSeriesData() :
                this.getMultiSeriesData();
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getSingleSeriesData
         * @return {Object}
         * @description Returns the name and data attributes for single series data
         */
        getSingleSeriesData() {
            const {data} = this.getParent();

            return [{
                name: this.getYAxisTitle(),
                data: _.map(
                    this.getSortedKeys(data),
                    (source) => _.get(data, source) || 0
                ),
            }];
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getMultiSeriesData
         * @return {Object}
         * @description Returns the name and data attributes for stacked series data
         */
        getMultiSeriesData() {
            const {data: parentData} = this.getParent();
            const {data: childData, field: childType} = this.getChild();

            return Object.keys(childData).map(
                (child) => ({
                    name: '' + this.getSourceTitle(childType, child),
                    data: _.map(
                        this.getSortedKeys(parentData),
                        (parent) => _.get(parentData, `['${parent}']['${child}']`) || 0
                    ),
                })
            );
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getLegend
         * @return {Object}
         * @description Returns the config for the Highcharts legend
         */
        getLegend() {
            if (!this.isMultiSource()) {
                return {enabled: false};
            }

            const {field} = this.getChild();

            return {
                enabled: true,
                title: {text: this.getSourceName(field)},
            };
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getPlotOptions
         * @return {Object}
         * @description Returns the config for the Highcharts plot options
         */
        getPlotOptions() {
            if (!this.isMultiSource()) {
                return {
                    bar: {
                        colorByPoint: true,
                        dataLabels: {enabled: true},
                    },
                    column: {
                        colorByPoint: true,
                        dataLabels: {enabled: true},
                    },
                };
            }

            return {
                bar: {
                    stacking: 'normal',
                    colorByPoint: false,
                },
                column: {
                    stacking: 'normal',
                    colorByPoint: false,
                },
            };
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getTooltip
         * @return {Object}
         * @description Returns the config for the Highcharts tooltip options
         */
        getTooltip() {
            return !this.isMultiSource() ? {
                // Show the tooltip on the one line
                headerFormat: '{point.x}: {point.y}',
                pointFormat: '',
            } : {
                // Show the tooltip on the one line
                headerFormat: '{series.name}/{point.x}: {point.y}',
                pointFormat: '',
            };
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#getChart
         * @return {Object}
         * @description Returns the type and zoomType config for the Highcharts chart options
         */
        getChart() {
            return {
                type: this.chartType,
                zoomType: this.chartType === 'bar' ? 'y' : 'x',
            };
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
         * @name HighchartConfig#genHighchartsConfig
         * @return {Object}
         * @description Generates and returns the Highcharts config
         */
        genHighchartsConfig() {
            return {
                id: this.id,
                type: this.chartType,
                chart: this.getChart(),
                title: this.getTitleConfig(),
                subtitle: this.getSubtitleConfig(),
                xAxis: this.getXAxisConfig(),
                yAxis: this.getYAxisConfig(),
                legend: this.getLegend(),
                tooltip: this.getTooltip(),
                plotOptions: this.getPlotOptions(),
                series: this.getSeriesData(),
            };
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#genSingleTableConfig
         * @return {Object}
         * @description Generates and returns config for a single column table
         */
        genSingleTableConfig() {
            const xAxis = this.getXAxisConfig();
            const seriesData = this.getSeriesData();

            const headers = [xAxis.title.text, gettext('Published Stories')];
            const tableRows = [];
            const {data, field} = this.getParent();

            _.forEach(this.getSortedKeys(data) || [], (group) => {
                tableRows.push([
                    this.getSourceTitle(field, group),
                    data[group] || 0
                ]);
            });

            return {
                id: this.id,
                type: 'table',
                chart: {type: 'column'},
                xAxis: xAxis,
                series: seriesData,
                headers: headers,
                rows: tableRows,
                title: this.getTitle(),
                subtitle: this.getSubtitle(),
            };
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#genSingleTableConfig
         * @return {Object}
         * @description Generates and returns config for a double column table
         */
        genMultiTableConfig() {
            const xAxis = this.getXAxisConfig();
            const seriesData = this.getSeriesData();
            const {data} = this.getParent();

            const headers = [xAxis.title.text].concat(
                seriesData.map((series) => series.name),
                gettext('Total Stories')
            );

            const tableRows = (this.getSortedKeys(data) || []).map((group) => [group]);

            seriesData.forEach((series) => {
                series.data.forEach((count, index) => {
                    tableRows[index].push(count);
                });
            });

            tableRows.forEach((row) => {
                row.push(
                    _.sum(
                        _.drop(row)
                    )
                );
            });

            return {
                id: this.id,
                type: 'table',
                chart: {type: 'column'},
                xAxis: xAxis,
                series: seriesData,
                headers: headers,
                rows: tableRows,
                title: this.getTitle(),
                subtitle: this.getSubtitle(),
            };
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#genTableConfig
         * @return {Object}
         * @description Generates and returns config for either a single or double column table
         */
        genTableConfig() {
            return !this.isMultiSource() ?
                this.genSingleTableConfig() :
                this.genMultiTableConfig();
        }

        /**
         * @ngdoc method
         * @name HighchartConfig#genConfig
         * @return {Object}
         * @description Generates and returns the Highcharts or Table configs based on chart options
         */
        genConfig() {
            if (this.chartType === 'table') {
                this.config = this.genTableConfig();
            } else {
                this.config = Object.assign(
                    {},
                    self.defaultConfig,
                    this.genHighchartsConfig()
                );
            }

            return this.config;
        }
    }

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
     * @param {Object} report - The params for the report
     * @return {String}
     * @description Generates a subtitle string based on the dates of the report
     */
    self.generateSubtitleForDates = (report) => {
        const dateFilter = _.get(report, 'date_filter') || _.get(report, 'dates.filter');

        if (dateFilter === 'range') {
            const start = _.get(report, 'start_date') || _.get(report, 'dates.start');
            const end = _.get(report, 'end_date') || _.get(report, 'dates.end');

            if (moment(start, config.model.dateformat).isValid() &&
                moment(end, config.model.dateformat).isValid()
            ) {
                return formatDate(moment, config, start) +
                    ' - ' +
                    formatDate(moment, config, end);
            }
        } else if (dateFilter === 'yesterday') {
            return moment()
                .subtract(1, 'days')
                .format('dddd Do MMMM YYYY');
        } else if (dateFilter === 'last_week') {
            const startDate = moment()
                .subtract(1, 'weeks')
                .startOf('week')
                .format('LL');
            const endDate = moment()
                .subtract(1, 'weeks')
                .endOf('week')
                .format('LL');

            return startDate + ' - ' + endDate;
        } else if (dateFilter === 'last_month') {
            return moment()
                .subtract(1, 'months')
                .format('MMMM YYYY');
        }

        return null;
    };
}
