import {getErrorMessage, secondsToHumanReadable} from '../../utils';
import {DATE_FILTERS} from '../../search/directives/DateFilters';
import {SOURCE_FILTERS} from '../../search/directives/SourceFilters';
import {SDChart} from '../../charts/SDChart';

ProductionTimeReportController.$inject = [
    '$scope',
    'savedReports',
    'chartConfig',
    'lodash',
    'searchReport',
    'moment',
    'notify',
    'gettext',
    'gettextCatalog',
    '$interpolate',
    '$q',
    'config',
];

/**
 * @ngdoc controller
 * @module superdesk.analytics.production-time-report
 * @name ProductionTimeReportController
 * @requires $scope
 * @requires savedReports
 * @requires chartConfig
 * @requires lodash
 * @requires searchReport
 * @requires moment
 * @requires notify
 * @requires gettext
 * @requires gettextCatalog
 * @required $interpolate
 * @requires $q
 * @requires config
 * @description Controller for Production Time Reports
 */
export function ProductionTimeReportController(
    $scope,
    savedReports,
    chartConfig,
    _,
    searchReport,
    moment,
    notify,
    gettext,
    gettextCatalog,
    $interpolate,
    $q,
    config
) {
    /**
     * @ngdoc method
     * @name ProductionTimeReportController#init
     * @description Initialises the scope parameters
     */
    this.init = () => {
        $scope.currentTab = 'parameters';

        $scope.form = {
            datesError: null,
            submitted: false,
        };

        $scope.dateFilters = [
            DATE_FILTERS.RELATIVE,
            DATE_FILTERS.DAY,
            DATE_FILTERS.LAST_MONTH,
            DATE_FILTERS.LAST_WEEK,
            DATE_FILTERS.RANGE,
            DATE_FILTERS.RELATIVE,
            DATE_FILTERS.RELATIVE_DAYS,
            DATE_FILTERS.YESTERDAY
        ];

        this.initDefaultParams();
        savedReports.selectReportFromURL();

        this.chart = chartConfig.newConfig('chart', _.get($scope, 'currentParams.params.chart.type'));
        $scope.updateChartConfig();

        $scope.sourceFilters = [
            SOURCE_FILTERS.DESKS,
            SOURCE_FILTERS.USERS,
            SOURCE_FILTERS.CATEGORIES,
            SOURCE_FILTERS.GENRE,
            SOURCE_FILTERS.SOURCES,
            SOURCE_FILTERS.URGENCY,
            SOURCE_FILTERS.INGEST_PROVIDERS,
            SOURCE_FILTERS.STATS.DESK_TRANSITIONS.ENTER,
            SOURCE_FILTERS.STATS.DESK_TRANSITIONS.EXIT,
        ];
    };

    /**
     * @ngdoc method
     * @name ProductionTimeReportController#initDefaultParams
     * @description Initialises the default report parameters
     */
    this.initDefaultParams = () => {
        $scope.item_states = searchReport.filterItemStates(
            ['published', 'killed', 'corrected', 'recalled']
        );

        $scope.chart_types = chartConfig.filterChartTypes(
            ['bar', 'column']
        );

        $scope.currentParams = {
            report: 'production_time_report',
            params: {
                dates: {
                    filter: 'range',
                    start: moment()
                        .subtract(30, 'days')
                        .format(config.model.dateformat),
                    end: moment().format(config.model.dateformat),
                },
                must: {
                    desk_transitions: {min: 1},
                },
                must_not: {},
                repos: {archive_statistics: true},
                chart: {
                    type: _.get($scope, 'chart_types[1].qcode') || 'column',
                    sort_order: 'desc',
                    title: null,
                    subtitle: null,
                },
                stats: {
                    avg: true,
                    min: false,
                    max: false,
                    sum: false,
                },
            },
        };

        $scope.defaultReportParams = _.cloneDeep($scope.currentParams);
    };

    /**
     * @ngdoc method
     * @name ProductionTimeReportController#updateChartConfig
     * @description Updates the local HighchartConfig instance parameters
     */
    $scope.updateChartConfig = () => {
        this.chart.chartType = _.get($scope, 'currentParams.params.chart.type');
        this.chart.sortOrder = _.get($scope, 'currentParams.params.chart.sort_order');
        this.chart.title = _.get($scope, 'currentParams.params.chart.title');
        this.chart.subtitle = _.get($scope, 'currentParams.params.chart.subtitle');
    };

    /**
     * @ngdoc method
     * @name ProductionTimeReportController#onFilterChanged
     * @description Updates the chart config and resets form submitted when date filters are changed
     */
    $scope.onFilterChanged = () => {
        $scope.updateChartConfig();
        $scope.form.submitted = false;
    };

    /**
     * @ngdoc method
     * @name ProductionTimeReportController#generateTitle
     * @return {String}
     * @description Returns the title to use for the Highcharts config
     */
    $scope.generateTitle = () => {
        if (_.get($scope, 'currentParams.params.chart.title')) {
            return $scope.currentParams.params.chart.title;
        }

        return gettext('Production Times');
    };

    /**
     * @ngdoc method
     * @name ProductionTimeReportController#generateSubtitle
     * @return {String}
     * @description Returns the subtitle to use for the Highcharts config based on the date parameters
     */
    $scope.generateSubtitle = () => {
        if (_.get($scope, 'currentParams.params.chart.subtitle')) {
            return $scope.currentParams.params.chart.subtitle;
        }

        return chartConfig.generateSubtitleForDates(
            _.get($scope, 'currentParams.params') || {}
        );
    };

    $scope.isDirty = () => true;

    $scope.$watch(() => savedReports.currentReport._id, (newReportId) => {
        if (newReportId) {
            $scope.currentParams = _.cloneDeep(savedReports.currentReport);
            $scope.changePanel('advanced');
        } else {
            $scope.currentParams = _.cloneDeep($scope.defaultReportParams);
        }

        $scope.updateChartConfig();
    });

    /**
     * @ngdoc method
     * @name ProductionTimeReportController#runQuery
     * @param {Object} params - The report parameters used to search the data
     * @return {Object}
     * @description Queries the DeskActivityReport API and returns it's response
     */
    $scope.runQuery = (params) => searchReport.query(
        'production_time_report',
        params,
        true
    );

    /**
     * @ngdoc method
     * @name ProductionTimeReportController#generate
     * @description Updates the Highchart configs in the report's content view
     */
    $scope.generate = () => {
        $scope.changeContentView('report');
        $scope.form.submitted = true;

        const params = _.cloneDeep($scope.currentParams.params);

        if ($scope.form.datesError) {
            return;
        }

        $scope.runQuery(params)
            .then((data) => {
                this.createChart(
                    Object.assign(
                        {},
                        $scope.currentParams.params,
                        data
                    )
                )
                    .then((chartConfig) => {
                        $scope.changeReportParams(chartConfig);
                        $scope.form.submitted = false;
                    });
            }, (error) => {
                notify.error(
                    getErrorMessage(
                        error,
                        gettext('Error. The Production Time report could not be generated!')
                    )
                );
            });
    };

    /**
     * @ngdoc method
     * @name ProductionTimeReportController#changeTab
     * @param {String} tabName - The name of the tab to change to
     * @description Change the current tab in the filters panel
     */
    $scope.changeTab = (tabName) => {
        $scope.currentTab = tabName;
    };

    /**
     * @ngdoc method
     * @name ProductionTimeReportController#createChart
     * @param {Object} report - The report parameters used to search the data
     * @return {Object}
     * @description Generate the Chart and Table configs from the report parameters
     */
    this.createChart = (report) => {
        const deskStats = _.get(report, 'desk_stats') || {};
        const deskIds = Object.keys(deskStats);
        const statTypes = ['sum', 'max', 'avg', 'min']
            .filter((statType) => report.stats[statType]);
        const sortOrder = _.get(report, 'chart.sort_order') || 'desc';

        const getSumStats = (deskId) => (
            _.sum(
                _.filter(
                    deskStats[deskId],
                    (value, stat) => statTypes.indexOf(stat) >= 0
                )
            )
        );

        const sortedDeskIds = _.sortBy(
            deskIds,
            (deskId) => (
                sortOrder === 'asc' ? getSumStats(deskId) : -getSumStats(deskId)
            )
        );

        chartConfig.setTranslation('production_stats', gettext('Production Stats'), {
            min: gettext('Minimum'),
            sum: gettext('Sum'),
            avg: gettext('Average'),
            max: gettext('Maximum'),
        });

        return chartConfig.loadTranslations(['task.desk'])
            .then(() => {
                const chart = new SDChart.Chart({
                    id: 'production_time_report',
                    chartType: 'highcharts',
                    title: $scope.generateTitle(),
                    subtitle: $scope.generateSubtitle(),
                    useUTC: false,
                    fullHeight: true,
                    legendTitle: gettext('Production Time'),
                    tooltipHeader: '{series.name}/{point.x}: {point.y}',
                    dataLabels: true,
                    colourByPoint: false,
                    defaultConfig: chartConfig.defaultConfig,
                    translations: chartConfig.translations,
                    dataLabelFormatter: function() {
                        return secondsToHumanReadable(
                            this.y,
                            gettext,
                            $interpolate
                        );
                    },
                    tooltipFormatter: function() {
                        return this.x +
                            ' - ' +
                            this.series.name +
                            ' time: ' +
                            secondsToHumanReadable(
                                this.y,
                                gettext,
                                $interpolate
                            );
                    }
                });

                const axis = chart.addAxis()
                    .setOptions({
                        type: 'category',
                        defaultChartType: _.get($scope, 'currentParams.params.chart.type'),
                        yTitle: gettext('Time spent producing content'),
                        categoryField: 'task.desk',
                        categories: sortedDeskIds,
                        stackLabels: false,
                        yAxisLabelFormatter: function() {
                            return secondsToHumanReadable(
                                this.value,
                                gettext,
                                $interpolate
                            );
                        },
                    });

                statTypes.forEach(
                    (statType) => {
                        axis.addSeries()
                            .setOptions({
                                field: 'production_stats',
                                name: statType,
                                stack: 0,
                                stackType: 'normal',
                                data: _.map(
                                    sortedDeskIds,
                                    (deskId) => _.get(deskStats[deskId], statType) || 0
                                )
                            });
                    }
                );

                return {
                    charts: [chart.genConfig()],
                    wrapCharts: report.chart.type === 'table',
                    height500: true,
                    fullWidth: true,
                    multiChart: false,
                    marginBottom: true,
                };
            });
    };

    /**
     * @ngdoc method
     * @name ProductionTimeReportController#getReportParams
     * @return {Promise}
     * @description Returns the current report parameters
     */
    $scope.getReportParams = () => (
        $q.when(_.cloneDeep($scope.currentParams))
    );

    this.init();
}
