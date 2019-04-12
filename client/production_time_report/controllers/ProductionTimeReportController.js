import {getErrorMessage, secondsToHumanReadable} from '../../utils';
import {SOURCE_FILTERS} from '../../search/directives/SourceFilters';
import {CHART_TYPES, CHART_FIELDS} from '../../charts/directives/ChartOptions';
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
    'reportConfigs',
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
 * @requires reportConfigs
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
    config,
    reportConfigs
) {
    const reportName = 'production_time_report';

    /**
     * @ngdoc method
     * @name ProductionTimeReportController#init
     * @description Initialises the scope parameters
     */
    this.init = () => {
        $scope.config = reportConfigs.getConfig(reportName);
        $scope.form = {
            datesError: null,
            submitted: false,
            showErrors: false,
        };

        $scope.chartFields = [
            CHART_FIELDS.TITLE,
            CHART_FIELDS.SUBTITLE,
            CHART_FIELDS.TYPE,
            CHART_FIELDS.SORT,
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

        $scope.currentParams = {
            report: reportName,
            params: $scope.config.defaultParams({
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
                chart: {
                    type: CHART_TYPES.COLUMN,
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
            }),
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

    $scope.$watch(() => savedReports.currentReport, (newReport) => {
        if (_.get(newReport, '_id')) {
            $scope.currentParams = _.cloneDeep(savedReports.currentReport);
        } else {
            $scope.currentParams = _.cloneDeep($scope.defaultReportParams);
        }

        $scope.updateChartConfig();
    }, true);

    /**
     * @ngdoc method
     * @name ProductionTimeReportController#generate
     * @description Updates the Highchart configs in the report's content view
     */
    $scope.generate = () => {
        $scope.changeContentView('report');
        $scope.form.submitted = true;

        if ($scope.form.datesError) {
            $scope.form.showErrors = true;
            return;
        }

        $scope.form.showErrors = false;
        $scope.beforeGenerateChart();

        const params = _.cloneDeep($scope.currentParams.params);

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
                const chartType = _.get($scope, 'currentParams.params.chart.type') || CHART_TYPES.COLUMN;
                const chart = new SDChart.Chart({
                    id: reportName,
                    chartType: chartType === 'table' ? 'table' : 'highcharts',
                    title: $scope.generateTitle(),
                    subtitle: $scope.generateSubtitle(),
                    useUTC: false,
                    fullHeight: true,
                    legendTitle: gettext('Production Time'),
                    tooltipHeader: '{series.name}/{point.x}: {point.y}',
                    dataLabels: false,
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
                    },
                });

                const axis = chart.addAxis()
                    .setOptions({
                        type: 'category',
                        defaultChartType: chartType,
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
                                ),
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
