import {Series} from './Series';
import {map, get} from 'lodash';


/**
 * @ngdoc class
 * @name SDChart.Axis
 * @description Class instance for adding an Axis with series of data to a chart
 */
export class Axis {
    /**
     * @ngdoc method
     * @name SDChart.Axis#constructor
     * @param {SDChart.Chart} chart - The parent Chart instance
     * @description Sets the initial data for the axis
     */
    constructor(chart) {
        /**
         * @ngdoc property
         * @name SDChart.Axis#chart
         * @type {SDChart.Chart}
         * @description The parent Chart instance
         */
        this.chart = chart;

        /**
         * @ngdoc property
         * @name SDChart.Axis#type
         * @type {string}
         * @description The Axis type, i.e. linear, logarithmic, datetime or category
         */
        this.type = 'linear';

        /**
         * @ngdoc property
         * @name SDChart.Axis#defaultChartType
         * @type {string}
         * @description The default chart type for child series
         */
        this.defaultChartType = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Axis#index
         * @type {Number}
         * @description The Axis index assigned by parent chart
         */
        this.index = 0;

        /**
         * @ngdoc property
         * @name SDChart.Axis#categories
         * @type {Array.<string>}
         * @description The category names to use
         */
        this.categories = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Axis#categoryField
         * @type {String}
         * @description Field used to translate category names
         */
        this.categoryField = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Axis#allowDecimals
         * @type {Boolean}
         * @description Use whole number on this axis
         */
        this.allowDecimals = false;

        /**
         * @ngdoc property
         * @name SDChart.Series#pointStart
         * @type {Number}
         * @description The starting point for the data
         */
        this.pointStart = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Series#pointInterval
         * @type {Number}
         * @description The intervals between points
         */
        this.pointInterval = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Series#stackLabels
         * @type {Boolean}
         * @description If true, then place labels at the top of stack
         */
        this.stackLabels = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Series#yTitle
         * @type {string}
         * @description The title used on the y-axis
         */
        this.yTitle = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Series#xTitle
         * @type {string}
         * @description The title used on the x-axis
         */
        this.xTitle = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Axis#series
         * @type {Array.<SDChart.Series>}
         * @description Array of axis series data
         */
        this.series = [];
    }

    /**
     * @ngdoc method
     * @name SDChart.Axis#setOptions
     * @param {string} [options.type='linear'] - The Axis type, i.e. linear, logarithmic, datetime or category
     * @param {string} [options.defaultChartType] - The default chart type for child series
     * @param {Number} [options.index=0] - The Axis index assigned by parent chart
     * @param {string} [options.categoryField] - Field used to translate category names
     * @param {Array.<string>} [options.categories] - The list of categories
     * @param {Boolean} [options.allowDecimals=false] - Use whole number on this axis
     * @param {Number} [options.pointStart] - The starting point
     * @param {Number} [options.pointInterval] - The intervals between points
     * @param {Boolean} [options.stackLabels] - If true, then place labels at the top of stack
     * @param {string} [options.yTitle] - The title used on the y-axis
     * @param {string} [options.xTitle] - The title used on the x-axis
     * @return {SDChart.Axis}
     * @description Sets the options for the axis
     */
    setOptions(options) {
        Object.keys(options).forEach((key) => {
            this[key] = options[key];
        });

        return this;
    }

    /**
     * @ngdoc method
     * @name SDChart.Axis#addSeries
     * @return {SDChart.Series}
     * @description Add a new data series to this axis sources
     */
    addSeries() {
        const series = new Series(this);

        this.series.push(series);
        return series;
    }

    /**
     * @ngdoc method
     * @name SDChart.Axis#getCategories
     * @return {Object}
     * @description Returns translated category field names
     */
    getCategories() {
        if (this.categories !== undefined && this.categoryField !== undefined) {
            const names = this.chart.getTranslationNames(this.categoryField);

            return map(
                this.categories,
                (category) => get(names, category) || category
            );
        }

        return this.categories;
    }

    /**
     * @ngdoc method
     * @name SDChart.Axis#genXAxisConfig
     * @param {Object} config
     * @return {{type: string}}
     * @description Generate the x-axis config
     */
    genXAxisConfig(config) {
        const axisConfig = {type: this.type};

        if (this.categories !== undefined) {
            axisConfig.categories = this.getCategories();
        }

        if (this.allowDecimals !== undefined) {
            axisConfig.allowDecimals = this.allowDecimals;
        }

        if (this.chart.startOfWeek !== undefined) {
            axisConfig.startOfWeek = this.chart.startOfWeek;
        }

        if (this.xTitle !== undefined) {
            axisConfig.title = {text: this.xTitle};
        }

        return axisConfig;
    }

    /**
     * @ngdoc method
     * @name SDChart.Axis#genYAxisConfig
     * @param {Object} config
     * @return {{allowDecimals: Boolean, stackLabels: Boolean}}
     * @description Generate the y-axis config
     */
    genYAxisConfig(config) {
        const axisConfig = {};

        if (this.allowDecimals !== undefined) {
            axisConfig.allowDecimals = this.allowDecimals;
        }

        if (this.stackLabels !== undefined) {
            axisConfig.stackLabels = {enabled: this.stackLabels};
        }

        if (this.yTitle !== undefined) {
            axisConfig.title = {text: this.yTitle};
        }

        return axisConfig;
    }

    /**
     * @ngdoc method
     * @name SDChart.Axis#genConfig
     * @param {Object} config
     * @return {{type: string}}
     * @description Generate the config
     */
    genConfig(config) {
        if (!get(config, 'xAxis')) {
            config.xAxis = [];
        }

        config.xAxis.push(this.genXAxisConfig(config));

        if (!get(config, 'yAxis')) {
            config.yAxis = [];
        }

        config.yAxis.push(this.genYAxisConfig(config));

        if (!get(config, 'series')) {
            config.series = [];
        }

        this.series.forEach((series) => {
            config.series.push(series.genConfig(config));
        });

        return config;
    }
}