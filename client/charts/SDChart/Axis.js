import {Series} from './Series';
import {map, get, sortBy, filter} from 'lodash';


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

        /**
         * @ngdoc property
         * @name SDChart.Axis#yAxisLabelFormatter
         * @type {Function}
         * @description Callback function to dynamically generate y-axis labels
         */
        this.yAxisLabelFormatter = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Axis#yAxisLabelFormat
         * @type {String}
         * @description Format to use for the labels on the y axis
         */
        this.yAxisLabelFormat = '{value}';

        /**
         * @ngdoc property
         * @name SDChart.Axis#xMin
         * @type {Number}
         * @description The minimum value on the x axis
         */
        this.xMin = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Axis#xMax
         * @type {Number}
         * @description The maximum value on the x axis
         */
        this.xMax = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Axis#sortOrder
         * @type {String}
         * @description If undefined, do not sort, otherwise sort categories in ascending or descending
         * order based on series values (if series data is provided as an object)
         */
        this.sortOrder = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Axis#excludeEmpty
         * @type {Boolean}
         * @description If true, remove values with 0 from the categories and series
         */
        this.excludeEmpty = false;

        /**
         * @ngdoc property
         * @name SDChart.Axis#includeTotal
         * @type {Boolean}
         * @description If true, then adds the 'Total' column in table outputs
         */
        this.includeTotal = true;

        this._sortedCategories = undefined;
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
     * @param {Number} [options.xMin] - The minimum value on the x axis
     * @param {Number} [options.xMax] - The maximum value on the x axis
     * @param {String} [options.sortOrder] - If undefined, do not sort, otherwise sort categories in
     * ascending or descending order based on series values (if series data is provided as an object)
     * @param {Boolean} [options.excludeEmpty=false] If true, remove values with 0 from the categories and series
     * @param {Boolean} [options.includeTotal] - If true, then adds the 'Total' column in table outputs
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
        if (this._sortedCategories !== undefined) {
            return this._sortedCategories;
        }

        if (this.categories === undefined) {
            return undefined;
        }

        let categories = this.categories;

        if (this.series.length === 1 && typeof this.series[0].data === 'object') {
            const data = this.series[0].data;

            if (this.excludeEmpty === true) {
                categories = filter(
                    categories,
                    (categoryId) => data[categoryId]
                );
            }

            if (this.sortOrder !== undefined) {
                categories = sortBy(
                    categories,
                    (categoryId) => (
                        this.sortOrder === 'asc' ? data[categoryId] : -data[categoryId]
                    )
                );
            }
        }

        this._sortedCategories = categories;
        return categories;
    }

    /**
     * @ngdoc method
     * @name SDChart.Axis#getTranslatedCategories
     * @return {Array<String>}
     * @description Returns categories sorted and translated
     */
    getTranslatedCategories() {
        let categories = this.getCategories();

        if (!this.categoryField) {
            return categories;
        }

        const names = this.chart.getTranslationNames(this.categoryField);

        return categories.map(
            (categoryId) => names[categoryId] || categoryId
        );
    }

    /**
     * @ngdoc method
     * @name SDChart.Axis#genXAxisConfig
     * @param {Object} config
     * @return {{type: string}}
     * @description Generate the x-axis config
     */
    genXAxisConfig(config) {
        const axisConfig = {
            type: this.type === 'table' ? 'category' : this.type,
        };

        if (this.categories !== undefined) {
            axisConfig.categories = this.getCategories();

            if (this.categoryField !== undefined) {
                const names = this.chart.getTranslationNames(this.categoryField);

                axisConfig.categories = map(
                    axisConfig.categories,
                    (categoryId) => get(names, categoryId) || categoryId
                );
            }
        }

        if (this.allowDecimals !== undefined) {
            axisConfig.allowDecimals = this.allowDecimals;
        }

        if (this.chart.startOfWeek !== undefined) {
            axisConfig.startOfWeek = this.chart.startOfWeek;
        }

        axisConfig.title = {text: this.xTitle};

        if (this.xMin !== undefined) {
            axisConfig.min = this.xMin;
        }

        if (this.xMax !== undefined) {
            axisConfig.max = this.xMax;
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

        axisConfig.title = {text: this.yTitle};

        if (!axisConfig.labels) {
            axisConfig.labels = {};
        }

        if (this.yAxisLabelFormatter !== undefined) {
            axisConfig.labels.enabled = true;
            axisConfig.labels.formatter = this.yAxisLabelFormatter;
        } else if (this.yAxisLabelFormat) {
            axisConfig.labels.enabled = true;
            axisConfig.labels.format = this.yAxisLabelFormat;
        } else {
            axisConfig.labels.enabled = false;
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
