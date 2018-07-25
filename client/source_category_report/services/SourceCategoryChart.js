import {generateSubtitle} from '../../utils';

SourceCategoryChart.$inject = ['lodash', 'chartManager', 'gettext', 'moment', 'config', '$interpolate', 'notify'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.source-category-report
 * @name SourceCategoryChart
 * @requires lodash
 * @requires chartManager
 * @requires gettext
 * @requires moment
 * @requires config
 * @requires $interpolate
 * @requires notify
 * @description Source/Category chart generation service
 */
export function SourceCategoryChart(_, chartManager, gettext, moment, config, $interpolate, notify) {
    /**
     * @ngdoc method
     * @name SourceCategoryChart#getCategories
     * @param {Object} report
     * @returns {Array}
     * @description Returns an array of the categories sorted in descending order, filtered based on min/max values
     */
    const getCategories = function(report) {
        const min = report.min;
        const max = report.max;
        const sortOrder = report.sort_order || 'desc';

        let categories = _.pickBy(
            report.categories,
            (category) => (!min || category >= min) && (!max || category <= max)
        );

        return _.orderBy(Object.keys(categories), (category) => categories[category], sortOrder);
    };

    /**
     * @ngdoc method
     * @name SourceCategoryChart#getSeriesData
     * @param {Object} report
     * @param {Object} categories
     * @returns {Object}
     * @description Returns the series data to be used by Highcharts api
     */
    const getSeriesData = function(report, categories) {
        const sources = report.sources;

        return _.map(sources, (totals, source) => ({
            name: source,
            data: _.map(categories, (category) => _.get(totals, category) || 0),
        }));
    };

    /**
     * @ngdoc method
     * @name SourceCategoryChart#getTitle
     * @param {Object} report
     * @returns {string}
     * @description Returns the title to use for the chart
     */
    const getTitle = function(report) {
        return {
            text: report.title || gettext('Published Stories per Category with Source breakdown'),
        };
    };

    /**
     * @ngdoc method
     * @name SourceCategoryChart#getSubtitle
     * @param {Object} report
     * @returns {string}
     * @description Returns the subtitle to use for the chart
     */
    const getSubtitle = function(report) {
        return {
            text: report.subtitle || generateSubtitle(moment, config, report),
        };
    };

    /**
     * @ngdoc method
     * @name SourceCategoryChart#generateConfig
     * @param {Object} report - The report data
     * @return {Array}
     * @description Returns a generic config with the provided report data
     */
    const generateConfig = function(report) {
        const categories = getCategories(report);
        const chartType = report.chartType || 'bar';

        return [{
            id: 'generic',
            type: chartType,
            chart: {
                type: chartType,
                zoomType: chartType === 'bar' ? 'y' : 'x',
            },
            title: getTitle(report),
            subtitle: getSubtitle(report),
            xAxis: {
                title: {text: gettext('Category')},
                categories: categories,
            },
            yAxis: {
                title: {text: gettext('Stories')},
                stackLabels: {enabled: true},
            },
            legend: {enabled: true},
            tooltip: {
                // Show the tooltip on the one line
                headerFormat: '{series.name}/{point.x}: {point.y}',
                pointFormat: '',
            },
            plotOptions: {
                bar: {stacking: 'normal', size: null},
                column: {stacking: 'normal', size: null},
            },
            series: getSeriesData(report, categories),
        }];
    };

    /**
     * @ngdoc method
     * @name SourceCategoryChart#getBasePieConfig
     * @param {String} category - The name of the category
     * @param {number} count - The number of stores in this category
     * @return {Object}
     * @description Returns a generic Pie Chart Highchart config for the provided Category
     */
    const getBasePieConfig = function(category, count) {
        return {
            id: category,
            type: 'pie',
            chart: {type: 'pie'},
            title: {text: category},
            subtitle: {
                text: $interpolate(
                    gettext('{{ count }} Stories')
                )({count}),
            },
            tooltip: {
                pointFormat: '{series.name}: {point.percentage:.1f}% ({point.y})',
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    dataLabels: {
                        enabled: true,
                        format: '{point.name}: {point.percentage:.1f}% ({point.y})',
                    },
                    size: 300,
                },
            },
            series: [{
                name: category,
                colorByPoint: true,
                data: [],
            }],
        };
    };

    /**
     * @ngdoc method
     * @name SourceCategoryChart#generatePieConfig
     * @param {Object} report - The report data
     * @return {Array}
     * @description Returns an Array of Pie Chart Highcharts configs, one for each category in the report data
     */
    const generatePieConfig = function(report) {
        const categories = getCategories(report);
        const sources = report.sources;

        const configs = {};
        const colours = [
            '#7cb5ec',
            '#434348',
            '#90ed7d',
            '#f7a35c',
            '#8085e9',
            '#f15c80',
            '#e4d354',
            '#2b908f',
            '#f45b5b',
            '#91e8e1',
        ];

        categories.forEach((category) => {
            configs[category] = getBasePieConfig(category, report.categories[category]);
        });

        let i = 0;

        Object.keys(sources).forEach((source) => {
            Object.keys(sources[source]).forEach((category) => {
                configs[category].series[0].data.push({
                    name: source,
                    y: sources[source][category],
                    color: colours[i],
                });
            });

            i += 1;
        });

        const charts = [];

        categories.forEach((category) => {
            charts.push(configs[category]);
        });

        return charts;
    };

    /**
     * @ngdoc method
     * @name SourceCategoryChart#generateTableConfig
     * @param {Object} report - The report data
     * @return {Array}
     * @description Returns a Table Config for the provided report data
     */
    const generateTableConfig = function(report) {
        const categories = getCategories(report);
        const seriesData = getSeriesData(report, categories);
        const tableRows = [];

        seriesData.forEach((series) => {
            tableRows.push([series.name].concat(series.data, _.sum(series.data)));
        });

        return [{
            id: 'table',
            type: 'table',
            chart: {type: 'column'},
            xAxis: {categories: categories},
            series: seriesData,
            headers: [].concat(
                gettext('Category'),
                categories,
                gettext('Total Stories')
            ),
            rows: tableRows,
            title: getTitle(report).text,
            subtitle: getSubtitle(report).text,
        }];
    };

    /**
     * @ngdoc method
     * @name SourceCategoryChart#createChart
     * @param {Object} report
     * @returns {Object}
     * @description Create an of Highchart configs based on the given report parameters
     */
    this.createChart = function(report) {
        switch (report.chartType) {
        case 'pie':
            return {
                charts: generatePieConfig(report),
                wrapCharts: true,
                height500: true,
                fullWidth: false,
            };
        case 'table':
            return {
                charts: generateTableConfig(report),
                wrapCharts: true,
                height500: false,
                fullWidth: true,
            };
        default:
            return {
                charts: generateConfig(report),
                wrapCharts: false,
                height500: false,
                fullWidth: true,
            };
        }
    };
}
