import {forEach, get, sum, drop, cloneDeep} from 'lodash';

import {Axis} from './Axis';

/**
 * @ngdoc class
 * @name SDChart.Chart
 * @description Class instance for generating a config for use with Highcharts
 */
export class Chart {
    /**
     * @ngdoc method
     * @name SDChart.Chart#constructor
     * @param {String} options.id - The id to be given to the chart
     * @param {String} [options.chartType='highcharts'] - The chart type, i.e. highcharts/table
     * @param {String} [options.title] - The title of the chart
     * @param {String} [options.subtitle] - The subtitle of the chart
     * @param {Number} [options.startOfWeek] - The starting day of the week (0=Sunday, 6=Saturday)
     * @param {Number} [options.timezoneOffset] - The UTC offset in minutes for the timezone to use
     * @param {Boolean} [options.useUTC=true] - Use UTC in the datetime fields
     * @param {Number} [options.height] - The height of the chart
     * @param {String} [options.legendTitle] - The title for the legend
     * @param {String} [options.tooltipHeader] - The tooltip header format
     * @param {String} [options.tooltipPoint] - The tooltip point format
     * @param {Boolean} [options.dataLabels=false] - Enable/Disable data labels
     * @param {Boolean} [options.colourByPoint=false] - One colour per series or one colour per point
     * @param {Boolean} [options.fullHeight=false] - Forces the chart to render full height
     * @param {Object} [options.defaultConfig={}] - Default config options for this chart
     * @param {String} [options.zoomType] - The zoom type applied to highcharts
     * @description Initialise the data for the chart config
     */
    constructor(options) {
        if (!('chartType' in options)) {
            options.chartType = 'highcharts';
        }

        if (!('useUTC' in options)) {
            options.useUTC = true;
        }

        if (!('dataLabels' in options)) {
            options.dataLabels = false;
        }

        if (!('fullHeight' in options)) {
            options.fullHeight = false;
        }

        if (!('defaultConfig' in options)) {
            options.defaultConfig = {};
        }

        /**
         * @ngdoc property
         * @name SDChart.Chart#id
         * @type {string}
         * @description The ID to be given to the chart
         */
        this.id = options.id;

        /**
         * @ngdoc property
         * @name SDChart.Chart#chartType
         * @type {string}
         * @description The chart type, i.e. highcharts/table
         */
        this.chartType = options.chartType;

        /**
         * @ngdoc property
         * @name SDChart.Chart#title
         * @type {string}
         * @description The title of the chart
         */
        this.title = options.title;

        /**
         * @ngdoc property
         * @name SDChart.Chart#subtitle
         * @type {string}
         * @description The subtitle of the chart
         */
        this.subtitle = options.subtitle;

        /**
         * @ngdoc property
         * @name SDChart.Chart#startOfWeek
         * @type {Number}
         * @description The starting day of the week (0=Sunday, 6=Saturday)
         */
        this.startOfWeek = options.startOfWeek;

        /**
         * @ngdoc property
         * @name SDChart.Chart#timezoneOffset
         * @type {Number}
         * @description The UTC offset in minutes for the timezone to use
         */
        this.timezoneOffset = options.timezoneOffset;

        /**
         * @ngdoc property
         * @name SDChart.Chart#useUTC
         * @type {Boolean}
         * @description Use UTC in the datetime fields
         */
        this.useUTC = options.useUTC;

        /**
         * @ngdoc property
         * @name SDChart.Chart#height
         * @type {Number}
         * @description The height of the chart
         */
        this.height = options.height;

        /**
         * @ngdoc property
         * @name SDChart.Chart#tooltipHeader
         * @type {String}
         * @description The tooltip header format
         */
        this.tooltipHeader = options.tooltipHeader;

        /**
         * @ngdoc property
         * @name SDChart.Chart#tooltipPoint
         * @type {String}
         * @description The tooltip point format
         */
        this.tooltipPoint = options.tooltipPoint;

        /**
         * @ngdoc property
         * @name SDChart.Chart#legendTitle
         * @type {String}
         * @description The title for the legend
         */
        this.legendTitle = options.legendTitle;

        /**
         * @ngdoc property
         * @name SDChart.Chart#dataLabels
         * @type {Boolean}
         * @description Enable/Disable data labels
         */
        this.dataLabels = options.dataLabels;

        /**
         * @ngdoc property
         * @name SDChart.Chart#colourByPoint
         * @type {Boolean}
         * @description One colour per series or one colour per point
         */
        this.colourByPoint = options.colourByPoint;

        /**
         * @ngdoc property
         * @name SDChart.Chart#fullHeight
         * @description Forces the chart to render full height
         */
        this.fullHeight = options.fullHeight;

        /**
         * @ngdoc property
         * @name SDChart.Chart#zoomType
         * @description The zoom type applied to highcharts
         */
        this.zoomType = options.zoomType;

        /**
         * @ngdoc property
         * @name SDChart.Chart#axis
         * @type {Array.<SDChart.Axis>}
         * @description Array of chart axes
         */
        this.axis = [];

        /**
         * @ngdoc property
         * @name SDChart.Chart#config
         * @type {Object}
         * @description Property to store the generated chart config
         */
        this.config = {};

        /**
         * @ngdoc property
         * @name SDChart.Chart#translations
         * @type {Object}
         * @description Field name & values translations
         */
        this.translations = {};

        /**
         * @ngdoc property
         * @name @SDChart.Chart#defaultConfig
         * @type {Object}
         * @description Default config options for this chart
         */
        this.defaultConfig = options.defaultConfig;
    }

    /**
     * @ngdoc method
     * @name SDChart.Chart#getTitle
     * @return {string}
     * @description Returns the title string to use for the chart
     */
    getTitle() {
        return this.title;
    }

    /**
     * @ngdoc method
     * @name SDChart.Chart#genTitleConfig
     * @return {Object}
     * @description Sets the title config to use for the chart
     */
    genTitleConfig(config) {
        const title = this.getTitle();

        if (title !== undefined) {
            if (!get(config, 'title')) {
                config.title = {};
            }
            config.title.text = title;
        }

        return config;
    }

    /**
     * @ngdoc method
     * @name SDChart.Chart#getSubtitle
     * @return {string}
     * @description Returns the subtitle string to use for the chart
     */
    getSubtitle() {
        return this.subtitle;
    }

    /**
     * @ngdoc method
     * @name SDChart.Chart#genSubtitleConfig
     * @return {Object}
     * @description Sets the subtitle config to use for the chart
     */
    genSubtitleConfig(config) {
        const subtitle = this.getSubtitle();

        if (subtitle !== undefined) {
            if (!get(config, 'subtitle')) {
                config.subtitle = {};
            }
            config.subtitle.text = subtitle;
        }

        return config;
    }

    /**
     * @ngdoc method
     * @name SDChart.Chart#genLegendConfig
     * @param {Object} config
     * @description Sets the legend config to use for the chart
     */
    genLegendConfig(config) {
        if (!get(config, 'legend')) {
            config.legend = {};
        }

        if (this.legendTitle === undefined) {
            config.legend.enabled = false;
        } else {
            config.legend.enabled = true;
            config.legend.title = {text: this.legendTitle};
        }

        return config;
    }

    /**
     * @ngdoc method
     * @name SDChart.Chart#genTooltipConfig
     * @param {Object} config
     * @description Sets the tooltip config to use for the chart
     */
    genTooltipConfig(config) {
        if (!get(config, 'tooltip')) {
            config.tooltip = {};
        }

        if (this.tooltipHeader !== undefined) {
            config.tooltip.headerFormat = this.tooltipHeader;
        }

        if (this.tooltipPoint !== undefined) {
            config.tooltip.pointFormat = this.tooltipPoint;
        }

        return config;
    }

    /**
     * @ngdoc method
     * @name SDChart.Chart#genPlotConfig
     * @param {Object} config
     * @description Sets the plot options config to use for the chart
     */
    genPlotConfig(config) {
        if (!get(config, 'plotOptions')) {
            config.plotOptions = {};
        }

        if (this.dataLabels !== undefined) {
            if (!get(config, 'plotOptions.series')) {
                config.plotOptions.series = {};
            }

            if (!get(config, 'plotOptions.series.dataLabels')) {
                config.plotOptions.series.dataLabels = {};
            }

            config.plotOptions.series.dataLabels.enabled = this.dataLabels;
        }

        if (this.colourByPoint !== undefined) {
            if (!get(config, 'plotOptions.bar')) {
                config.plotOptions.bar = {};
            }

            if (!get(config, 'plotOptions.column')) {
                config.plotOptions.column = {};
            }

            config.plotOptions.bar.colorByPoint = this.colourByPoint;
            config.plotOptions.column.colorByPoint = this.colourByPoint;
        }

        return config;
    }

    /**
     * @ngdoc method
     * @name SDChart.Chart#addAxis
     * @return {SDChart.Axis}
     * @description Add a new Axis to this chart
     */
    addAxis() {
        const axis = new Axis(this);

        this.axis.push(axis);
        return axis;
    }

    /**
     * @ngdoc method
     * @name SDChart.Chart#genChartConfig
     * @param {Object} config
     * @description Generates the chart config
     */
    genChartConfig(config) {
        if (!get(config, 'chart')) {
            config.chart = {};
        }

        if (this.height !== undefined) {
            config.chart.height = this.height;
        }

        if (this.fullHeight !== undefined) {
            config.fullHeight = this.fullHeight;
        }

        if (this.axis.length < 1 || this.axis.length > 1) {
            return config;
        }

        if (this.zoomType !== undefined) {
            config.chart.zoomType = this.zoomType;
        } else if (this.axis.length > 0) {
            config.chart.zoomType = this.axis[0].defaultChartType === 'bar' ?
                'y' :
                'x';
        }

        return config;
    }

    /**
     * @ngdoc method
     * @name SDChart.Chart#genTimeConfig
     * @param {Object} config
     * @description Generates the time config to use for the chart
     */
    genTimeConfig(config) {
        if (!get(config, 'time')) {
            config.time = {};
        }

        if (this.useUTC !== undefined) {
            config.time.useUTC = this.useUTC;
        }

        if (this.timezoneOffset !== undefined) {
            config.time.timezoneOffset = this.timezoneOffset;
        }

        return config;
    }

    /**
     * @ngdoc method
     * @name SDChart.Chart#genHighchartsConfig
     * @param {Object} config
     * @description Generates the config for use with highcharts
     */
    genHighchartsConfig(config) {
        config.id = this.id;
        config.type = this.chartType;

        this.genChartConfig(config);
        this.genTitleConfig(config);
        this.genSubtitleConfig(config);
        this.genTimeConfig(config);
        this.genLegendConfig(config);
        this.genTooltipConfig(config);
        this.genPlotConfig(config);

        this.axis.forEach((axis) => axis.genConfig(config));

        return config;
    }

    /**
     * @ngdoc method
     * @name SDChart.Chart#genSingleTableConfig
     * @param {Object} config
     * @description Generates the single table config
     */
    genSingleTableConfig(config) {
        const axis = this.axis[0];
        const headers = [axis.xTitle, axis.yTitle];
        const rows = [];

        forEach(axis.getCategories(), (category, index) => {
            rows.push([
                category,
                axis.series[0].data[index]
            ]);
        });

        return {
            id: this.id,
            type: this.chartType,
            chart: {type: 'column'},
            xAxis: config.xAxis,
            series: config.series,
            headers: headers,
            rows: rows,
            title: this.getTitle(),
            subtitle: this.getSubtitle(),
        };
    }

    /**
     * @ngdoc method
     * @name SDChart.Chart#genMultiTableConfig
     * @param {Object} config
     * @description Generates the multi table config
     */
    genMultiTableConfig(config) {
        const axis = this.axis[0];

        const headers = [axis.xTitle].concat(
            axis.series.map((series) => series.getName()),
            'Total Stories'
        );

        const rows = axis.getCategories().map((category) => ([category]));

        forEach(axis.series, (series) => {
            series.getData().forEach((count, index) => {
                rows[index].push(count);
            });
        });

        rows.forEach((row) => {
            row.push(
                sum(
                    drop(row)
                )
            );
        });

        return {
            id: this.id,
            type: this.chartType,
            chart: {type: 'column'},
            xAxis: config.xAxis,
            series: config.series,
            headers: headers,
            rows: rows,
            title: this.getTitle(),
            subtitle: this.getSubtitle(),
        };
    }

    /**
     * @ngdoc method
     * @name SDChart.Chart#genTableConfig
     * @param {Object} config
     * @description Generates the table config
     */
    genTableConfig(config) {
        this.genHighchartsConfig(config);

        if (this.axis.length === 1) {
            if (this.axis[0].series.length === 1) {
                this.config = this.genSingleTableConfig(config);
            } else {
                this.config = this.genMultiTableConfig(config);
            }
        }
    }

    /**
     * @ngdoc method
     * @name SDChart.Chart#genConfig
     * @return {Object} - The config to use with highcharts
     * @description Generates the config for this chart
     */
    genConfig() {
        this.config = cloneDeep(this.defaultConfig);

        if (this.chartType === 'table') {
            this.genTableConfig(this.config);
        } else {
            this.genHighchartsConfig(this.config);
        }

        return this.config;
    }

    /**
     * @ngdoc method
     * @name SDChart.Chart#setTranslation
     * @param {string} field - The name of the field for this translation
     * @param {string} title - The title of the field name
     * @param {Object} [names={}] - Map of id/qcode to display names
     * @description Saves the provided field translations
     */
    setTranslation(field, title, names = {}) {
        this.translations[field.replace(/\./g, '_')] = {title, names};
    }

    /**
     * @ngdoc method
     * @name SDChart.Chart#getTranslation
     * @param {string} field - Name of the field to get translations for
     * @return {{title: string, names: Object}}
     * @description Helper function to get the translations for a field
     */
    getTranslation(field) {
        return this.translations[(field || '').replace(/\./g, '_')] || {};
    }

    /**
     * @ngdoc method
     * @name SDChart.Chart#getTranslationTitle
     * @param {string} field - Name of the field to get translated title for
     * @return {string}
     * @description Helper function to get the translated title for a field
     */
    getTranslationTitle(field) {
        return this.getTranslation(field).title || field;
    }

    /**
     * @ngdoc method
     * @name SDChart.Chart#getTranslationNames
     * @param {string} field - Name of the field to get translated title for
     * @return {Object}
     * @description Helper function to get the translated title for a field
     */
    getTranslationNames(field) {
        return this.getTranslation(field).names || {};
    }
}
