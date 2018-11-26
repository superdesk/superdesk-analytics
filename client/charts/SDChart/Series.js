import {map, get} from 'lodash';

/**
 * @ngdoc class
 * @name SDChart.Series
 * @description Class instance for adding a series to an axis
 */
export class Series {
    /**
     * @ngdoc method
     * @name SDChart.Series#constructor
     * @param {SDChart.Axis} axis - The parent Axis instance
     * @description Sets the initial data for the series
     */
    constructor(axis) {
        /**
         * @ngdoc property
         * @name SDChart.Series#axis
         * @type {SDChart.Axis}
         * @description The parent Axis instance
         */
        this.axis = axis;

        /**
         * @ngdoc property
         * @name SDChart.Series#chart
         * @type {SDChart.Chart}
         * @description The parent Chart instance
         */
        this.chart = this.axis.chart;

        /**
         * @ngdoc property
         * @name SDChart.Series#type
         * @type {string}
         * @description The chart type
         */
        this.type = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Series#data
         * @type {Object|Array}
         * @description The data of the series
         */
        this.data = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Series#field
         * @type {string}
         * @description The field type for the data
         */
        this.field = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Series#name
         * @type {string}
         * @description The field name (if any)
         */
        this.name = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Series#stack
         * @type {Number}
         * @description The stack number
         */
        this.stack = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Series#stackType
         * @type {string}
         * @description The type of stacking to perform (undefined, normal, percentage)
         */
        this.stackType = undefined;
    }

    /**
     * @ngdoc method
     * @name SDChart.Series#setOptions
     * @param {string} [options.type=this.axis.defaultChartType] - The chart type
     * @param {Object|Array} options.data - The data to add to the series
     * @param {string} [options.field] - The field type for the data
     * @param {string} [options.name] - The field name for the data
     * @param {Number} [options.stack] - The stack number
     * @param {string} [options.stackType] - The type of stacking to perform
     * @return {SDChart.Series}
     * @description Sets the options for the series
     */
    setOptions(options) {
        Object.keys(options).forEach((key) => {
            this[key] = options[key];
        });

        return this;
    }

    /**
     * @ngdoc method
     * @name SDChart.Series#getData
     * @return {Array}
     * @description Returns the data for this series
     */
    getData() {
        if (this.data === undefined) {
            return undefined;
        } else if (Array.isArray(this.data)) {
            return this.data;
        }

        if (this.axis.categories !== undefined) {
            return map(
                this.axis.categories,
                (source) => get(this.data, source) || 0
            );
        }

        return map(
            Object.keys(this.data),
            (source) => get(this.data, source) || 0
        );
    }

    /**
     * @ngdoc method
     * @name SDChart.Series#getName
     * @return {string}
     * @description Returns the name of the field type
     */
    getName() {
        if (this.field === undefined) {
            return this.name;
        }

        const name = this.name !== undefined ?
            get(this.chart.getTranslationNames(this.field), this.name) || this.name :
            this.chart.getTranslationTitle(this.field) || this.name;

        return '' + (name || this.field);
    }

    /**
     * @ngdoc method
     * @name SDChart.Series#genConfig
     * @param {Object} config - The config object
     * @return {Object}
     * @description Sets the series config for the axis
     */
    genConfig(config) {
        const series = {
            xAxis: this.axis.index,
            type: this.type !== undefined ? this.type : this.axis.defaultChartType || 'bar',
        };
        const name = this.getName();
        const data = this.getData();

        if (name !== undefined) {
            series.name = name;
        }

        if (data !== undefined) {
            series.data = data;
        }

        if (this.stack !== undefined) {
            series.stacking = this.stackType !== undefined ? this.stackType : 'normal';
            series.stack = this.stack;
        }

        if (this.axis.pointStart !== undefined) {
            series.pointStart = this.axis.pointStart;
        }

        if (this.axis.pointInterval !== undefined) {
            series.pointInterval = this.axis.pointInterval;
        }

        return series;
    }
}
