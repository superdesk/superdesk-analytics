import {gettext} from 'superdesk-core/scripts/core/utils';

import {DATE_FILTERS} from '../../../search/common';
import {CHART_FIELDS} from '../../../charts/directives/ChartOptions';
import {SDChart} from '../../../charts/SDChart';
import {CHART_COLOURS} from '../../../charts/directives/ChartColourPicker';
import {getErrorMessage} from '../../../utils';


PublishingActionsWidgetController.$inject = [
    '$scope',
    'lodash',
    'notify',
    'searchReport',
    'chartConfig',
    'desks',
    '$interval',
    'reportConfigs',
];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.publishing-performance-report.widgets
 * @name PublishingActionsWidgetController
 * @requires $scope
 * @requires lodash
 * @requires notify
 * @requires searchReport
 * @requires chartConfig
 * @requires desks
 * @requires $interval
 * @requires reportConfigs
 * @description Controller for use with the PublishingActions widget and settings views
 */
export function PublishingActionsWidgetController(
    $scope,
    _,
    notify,
    searchReport,
    chartConfig,
    desks,
    $interval,
    reportConfigs
) {
    /**
     * @ngdoc method
     * @name PublishingActionsWidgetController#init
     * @param {Boolean} forSettings - True if init for use with the settings, false for the widget view
     * @description Initialises the scope/controller for use with widget or settings view
     */
    this.init = (forSettings) => {
        $scope.ready = false;

        // This fixes an issue when a controller is created, deleted and created again quickly
        // Reduces the chance of multiple api queries happening
        $scope.$applyAsync(() => (
            desks.initialize()
                .then(() => {
                    $scope.currentDesk = desks.getCurrentDesk();

                    if (!_.get($scope, 'widget.configuration')) {
                        $scope.widget.configuration = this.getDefaultConfig();
                    }

                    if (forSettings) {
                        this.initForSettings();
                    } else {
                        this.initForWidget();
                        $scope.ready = true;
                    }
                })
        ));
    };

    /**
     * @ngdoc method
     * @name PublishingActionsWidgetController#getDefaultConfig
     * @return {Object}
     * @description Returns the default config to use for this widget
     */
    this.getDefaultConfig = () => ({
        dates: {filter: DATE_FILTERS.TODAY},
        chart: {
            sort_order: 'desc',
            title: _.get($scope, 'widget.label', gettext('Publishing Performance')),
            colours: {
                published: CHART_COLOURS.GREEN,
                killed: CHART_COLOURS.RED,
                corrected: CHART_COLOURS.BLUE,
                updated: CHART_COLOURS.YELLOW,
                recalled: CHART_COLOURS.BLACK,
            },
        },
    });

    /**
     * @ngdoc method
     * @name PublishingActionsWidgetController#initForSettings
     * @description Initialise this controller for use with the settings view
     */
    this.initForSettings = () => {
        $scope.chartFields = [
            CHART_FIELDS.TITLE,
            CHART_FIELDS.SORT,
        ];

        reportConfigs.loadAll()
            .then(() => {
                $scope.reportConfig = reportConfigs.getConfig('publishing_performance_report');
                $scope.ready = true;
            });
    };

    /**
     * @ngdoc method
     * @name PublishingActionsWidgetController#initForWidget
     * @description Initialise this controller for use with the widget view
     */
    this.initForWidget = () => {
        /**
         * @ngdoc property
         * @name PublishingActionsWidgetController#chartConfig
         * @type {Object}
         * @description The config used to send to the sda-chart directive
         */
        $scope.chartConfig = null;

        /**
         * @ngdoc property
         * @name PublishingActionsWidgetController#interval
         * @type {Number}
         * @description Used to cancel the $interval for this widget on destruction
         */
        this.interval = null;

        /**
         * @ngdoc method
         * @name PublishingActionsWidgetController#runQuery
         * @param {Object} params - Parameters to pass to the API
         * @return {Promise<Object>}
         * @description Sends the query to the API and returns the generated report
         */
        this.runQuery = (params) => searchReport.query(
            'publishing_performance_report',
            params,
            true
        );

        /**
         * @ngdoc method
         * @name PublishingActionsWidgetController#genConfig
         * @param {Object} params - Parameters used for the API
         * @param {Object} report - The generated report from the API
         * @description Generate the highchart config based on the params and report data
         */
        this.genConfig = (params, report) => {
            chartConfig.loadTranslations(['state'])
                .then(() => {
                    const numCategories = Object.values(report.subgroups)
                        .filter((value) => value > 0)
                        .length;
                    const numLegendRows = Math.ceil(numCategories / 2);
                    let legendOffset;
                    let center;

                    switch (numLegendRows) {
                    case 1:
                        legendOffset = [0, -10];
                        center = ['50%', '100%'];
                        break;
                    case 2:
                        legendOffset = [0, 0];
                        center = ['50%', '100%'];
                        break;
                    case 3:
                        legendOffset = [0, 10];
                        center = ['50%', '110%'];
                        break;
                    }

                    const chart = new SDChart.Chart({
                        id: $scope.widget._id + '-' + $scope.widget.multiple_id,
                        fullHeight: true,
                        exporting: false,
                        defaultConfig: chartConfig.defaultConfig,
                        legendFormat: '{y} {name}',
                        legendOffset: legendOffset,
                        shadow: false,
                        translations: chartConfig.translations,
                    });
                    const field = _.get(params, 'aggs.subgroup.field');

                    chart.addAxis()
                        .setOptions({
                            type: 'linear',
                            defaultChartType: 'pie',
                            categoryField: field,
                            categories: Object.keys(report.subgroups),
                            sortOrder: _.get(params, 'chart.sort_order') || 'asc',
                            excludeEmpty: true,
                        })
                        .addSeries()
                        .setOptions({
                            field: field,
                            data: report.subgroups,
                            colours: _.get(params, 'chart.colours'),
                            size: 260,
                            semiCircle: true,
                            center: center,
                            showInLegend: true,
                        });

                    $scope.chartConfig = chart.genConfig();
                    $scope.title = $scope.widget.configuration.chart.title || _.get($scope, 'widget.label');
                });
        };

        $scope.$watch(
            'widget.configuration',
            () => $scope.generateChart(),
            true
        );

        /**
         * @ngdoc method
         * @name PublishingActionsWidgetController#generateChart
         * @description Sends the params to the API, then generates the new config
         */
        $scope.generateChart = () => {
            const params = Object.assign(
                {},
                _.get($scope, 'widget.configuration') || {},
                {
                    must: {desks: [$scope.currentDesk._id]},
                    must_not: {},
                    aggs: {
                        group: {field: 'task.desk'},
                        subgroup: {field: 'state'},
                    },
                }
            );

            this.runQuery(params)
                .then(
                    (report) => this.genConfig(params, report),
                    (error) => {
                        notify.error(
                            getErrorMessage(
                                error,
                                gettext('Error. The report could not be generated.')
                            )
                        );
                    }
                );
        };

        this.interval = $interval($scope.generateChart, 60000);
        $scope.$on('$destroy', () => {
            $interval.cancel(this.interval);
            this.interval = null;
        });
    };
}
