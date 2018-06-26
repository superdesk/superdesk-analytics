import {generateSubtitle} from '../../utils';

SourceCategoryChart.$inject = ['lodash', 'Highcharts', 'gettext', 'moment', 'config'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.source-category-report
 * @name SourceCategoryChart
 * @requires lodash
 * @requires Highcharts
 * @requires gettext
 * @requires moment
 * @requires config
 * @description Source/Category chart generation service
 */
export function SourceCategoryChart(_, Highcharts, gettext, moment, config) {
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
            report.report.categories,
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
        const sources = report.report.sources;

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
     * @name SourceCategoryChart#createChart
     * @param {Object} report
     * @param {Object} renderTo
     * @returns {Highcharts.Chart}
     * @description Create a chart based on the given report parameters
     */
    this.createChart = function(report, renderTo) {
        const categories = getCategories(report);
        const chartType = report.chartType || 'bar';

        const chartData = {
            chart: {
                type: chartType,
                shadow: true,
                zoomType: chartType === 'bar' ? 'y' : 'x',
            },
            title: getTitle(report),
            subtitle: getSubtitle(report),
            xAxis: {
                title: {text: gettext('Category')},
                categories: categories,
                scrollbar: {enabled: true},
            },
            yAxis: {
                title: {text: gettext('Stories')},
                stackLabels: {enabled: true},
                scrollbar: {enabled: true},
            },
            legend: {enabled: true},
            tooltip: {
                // Show the tooltip on the one line
                headerFormat: '<b>{series.name}/{point.x}:</b> {point.y}',
                pointFormat: '',
            },
            plotOptions: {
                bar: {stacking: 'normal'},
                column: {stacking: 'normal'},
            },
            series: getSeriesData(report, categories),
            credits: {enabled: false},
            exporting: {
                fallbackToExportServer: false,
                error: (options, error) => {
                    console.error('Failed to export the chart\n', options, '\n', error);
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

        return Highcharts.chart(renderTo, chartData);
    };
}
