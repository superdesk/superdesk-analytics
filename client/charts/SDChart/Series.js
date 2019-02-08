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

        /**
         * @ngdoc property
         * @name SDChart.Series#colourIndex
         * @type {Number}
         * @description The colour index to use for this series
         */
        this.colourIndex = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Series#dataLabelConfig
         * @type {Object}
         * @description Config to use for the data labels of this series
         */
        this.dataLabelConfig = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Series#colours
         * @type {Array<String>|Object}
         * @description Array or Object of colours to use for the data points
         */
        this.colours = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Series#size
         * @type {Number}
         * @description Size of the chart
         */
        this.size = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Series#semiCircle
         * @type {Boolean}
         * @description If the chart type is a pie, then render a semi circle
         */
        this.semiCircle = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Series#center
         * @type {Array<String>}
         * @description The x and y offset of the center of the chart
         */
        this.center = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Series#showInLegend
         * @type {Boolean}
         * @description If true, show the point names in the legend
         */
        this.showInLegend = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Series#groupPadding
         * @type {Number}
         * @description Padding between each value groups, in x axis units.
         */
        this.groupPadding = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Series#pointPadding
         * @type {Number}
         * @description Padding between each column or bar, in x axis units.
         */
        this.pointPadding = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Series#borderWidth
         * @type {Number}
         * @description The width of the border surrounding each column or bar.
         */
        this.borderWidth = undefined;

        /**
         * @ngdoc property
         * @name SDChart.Series#maxPointWidth
         * @type {Number}
         * @description The maximum allowed pixel width for a column, translated to the height of a bar in a bar chart
         */
        this.maxPointWidth = undefined;
    }

    /**
     * @ngdoc method
     * @name SDChart.Series#setOptions
     * @param {string} [options.type=this.axis.defaultChartType] - The chart type
     * @param {Object|Array} [options.data] - The data to add to the series
     * @param {string} [options.field] - The field type for the data
     * @param {string} [options.name] - The field name for the data
     * @param {Number} [options.stack] - The stack number
     * @param {string} [options.stackType] - The type of stacking to perform
     * @param {string} [options.colourIndex] - The colour index to use for this series
     * @param {Array<String>|Object} [options.colours] - Array or Object of colours to use for the data points
     * @param {Number} [options.size] - Size of the chart
     * @param {Boolean} [options.semiCircle] - If the chart type is a pie, then render a semi circle
     * @param {Array<String>} [options.center] - The x and y offset of the center of the chart
     * @param {Boolean} [options.showInLegend] - If true, show the point names in the legend
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
    getData(series) {
        if (this.data === undefined || Array.isArray(this.data)) {
            return this.data;
        } else if (this.axis.categories !== undefined) {
            const names = this.chart.getTranslationNames(this.axis.categoryField);

            return this.axis.getCategories().map(
                (categoryId, index) => ({
                    name: names[categoryId] || categoryId,
                    y: get(this.data, categoryId) || 0,
                    className: get(this.colours, categoryId) || get(this.colours, index) || '',
                })
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
     * @name SDChart.Series#setDataConfig
     * @param {Object} series
     * @description Sets the data config for this series
     */
    setDataConfig(series) {
        const name = this.getName();
        const data = this.getData(series);

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
    }

    /**
     * @ngdoc method
     * @name SDChart.Series#setPointConfig
     * @param {Object} series
     * @description Sets the point config for this series
     */
    setPointConfig(series) {
        if (this.axis.pointStart !== undefined) {
            series.pointStart = this.axis.pointStart;
        }

        if (this.axis.pointInterval !== undefined) {
            series.pointInterval = this.axis.pointInterval;
        }

        if (this.size) {
            series.size = this.size;
        }

        if (series.type === 'pie' && this.semiCircle !== undefined) {
            series.startAngle = -90;
            series.endAngle = 90;
            series.innerSize = '50%';
            series.slicedOffset = 0;
        }

        ['center', 'showInLegend', 'groupPadding', 'pointPadding', 'borderWidth', 'maxPointWidth'].forEach(
            (field) => {
                if (this[field] !== undefined) {
                    series[field] = this[field];
                }
            }
        );
    }

    /**
     * @ngdoc method
     * @name SDChart.Series#setStyleConfig
     * @param {Object} series
     * @description Sets the style config for this series
     */
    setStyleConfig(series) {
        if (this.colourIndex !== undefined) {
            series.colorIndex = this.colourIndex;
        }

        if (this.dataLabelConfig !== undefined) {
            series.dataLabels = this.dataLabelConfig;
        }
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

        this.setDataConfig(series);
        this.setPointConfig(series);
        this.setStyleConfig(series);

        return series;
    }
}
