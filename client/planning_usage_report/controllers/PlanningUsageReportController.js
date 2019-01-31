import {getErrorMessage} from '../../utils';
import {DATE_FILTERS} from '../../search/directives/DateFilters';

PlanningUsageReportController.$inject = [
    '$scope',
    'savedReports',
    'searchReport',
    'moment',
    'config',
    'lodash',
    'notify',
    'gettext',
    'chartConfig',
    '$q',
];

/**
 * @ngdoc controller
 * @module superdesk.analytics.planning-usage-report
 * @name PlanningUsageReportController
 * @requires $scope
 * @requires savedReports
 * @requires searchReport
 * @requires moment
 * @requires config
 * @requires lodash
 * @requires notify
 * @requires gettext
 * @requires chartConfig
 * @requires $q
 * @description Controller for Planning Usage Reports
 */
export function PlanningUsageReportController(
    $scope,
    savedReports,
    searchReport,
    moment,
    config,
    _,
    notify,
    gettext,
    chartConfig,
    $q
) {
    /**
     * @ngdoc method
     * @name PlanningUsageReportController#init
     * @description Initialises the scope parameters and custom field translations
     */
    this.init = () => {
        $scope.dateFilters = [
            DATE_FILTERS.YESTERDAY,
            DATE_FILTERS.LAST_WEEK,
            DATE_FILTERS.LAST_MONTH,
            DATE_FILTERS.RANGE,
        ];

        this.initDefaultParams();
        savedReports.selectReportFromURL();

        chartConfig.fieldTranslations.planning_usage = () => {
            chartConfig.setTranslation(
                'planning_usage',
                gettext('Item Type'),
                {
                    events: gettext('Events'),
                    planning: gettext('Planning'),
                    coverages: gettext('Coverages'),
                    assignments: gettext('Assignments'),
                }
            );

            return null;
        };

        this.chart = chartConfig.newConfig('planning_usage_report', 'bar');
        $scope.updateChartConfig();
    };

    /**
     * @ngdoc method
     * @name PlanningUsageReportController#initDefaultParams
     * @description Initialises the default report parameters
     */
    this.initDefaultParams = () => {
        $scope.chart_types = chartConfig.filterChartTypes(
            ['bar', 'column', 'table']
        );

        $scope.currentParams = {
            report: 'planning_usage_report',
            params: {
                dates: {
                    filter: 'range',
                    start: moment()
                        .subtract(30, 'days')
                        .format(config.model.dateformat),
                    end: moment().format(config.model.dateformat),
                },
                must: {},
                must_not: {},
                chart: {
                    type: 'bar',
                    sort_order: 'desc',
                    title: null,
                    subtitle: null,
                },
            },
        };

        $scope.defaultReportParams = _.cloneDeep($scope.currentParams);
    };

    /**
     * @ngdoc method
     * @name PlanningUsageReportController#updateChartConfig
     * @description Updates the local HighchartConfig instance parameters
     */
    $scope.updateChartConfig = () => {
        const config = _.get($scope, 'currentParams.params.chart') || {};

        this.chart.chartType = _.get(config, 'type') || 'bar';
        this.chart.sortOrder = _.get(config, 'sort_order') || 'desc';
        this.chart.title = _.get(config, 'title');
        this.chart.subtitle = _.get(config, 'subtitle');
    };

    /**
     * @ngdoc method
     * @name PlanningUsageReportController#generateTitle
     * @return {String}
     * @description Returns the title to use for the Highcharts config
     */
    $scope.generateTitle = () => {
        if (_.get($scope, 'currentParams.params.chart.title')) {
            return $scope.currentParams.params.chart.title;
        }

        return gettext('Planning Module Usage');
    };

    /**
     * @ngdoc method
     * @name PlanningUsageReportController#generateSubtitle
     * @return {String}
     * @description Returns the subtitle to use for the Highcharts config based on the date parameters
     */
    $scope.generateSubtitle = () => chartConfig.generateSubtitleForDates(
        _.get($scope, 'currentParams.params') || {}
    );

    $scope.isDirty = () => true;

    $scope.$watch(() => savedReports.currentReport._id, (newReportId) => {
        if (newReportId) {
            $scope.currentParams = _.cloneDeep(savedReports.currentReport);
            $scope.changePanel('advanced');
        } else {
            $scope.currentParams = _.cloneDeep($scope.defaultReportParams);
        }
    });

    /**
     * @ngdoc method
     * @name PlanningUsageReportController#onDateFilterChange
     * @description When the date filter changes, clear the date input fields if the filter is not 'range'
     */
    $scope.onDateFilterChange = () => {
        if ($scope.currentParams.params.dates.filter !== 'range') {
            $scope.currentParams.params.dates.start = null;
            $scope.currentParams.params.dates.end = null;
        }

        $scope.updateChartConfig();
    };

    /**
     * @ngdoc method
     * @name PlanningUsageReportController#generate
     * @description Updates the Highchart configs in the report's content view
     */
    $scope.generate = () => {
        $scope.changeContentView('report');

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
                    });
            }, (error) => {
                notify.error(
                    getErrorMessage(
                        error,
                        gettext('Error. The Planning Usage Report could not be generated!')
                    )
                );
            });
    };

    /**
     * @ngdoc method
     * @name PlanningUsageReportController#createChart
     * @param {Object} report - The report parameters used to search the data
     * @return {Object}
     * @description Generates the Highcharts config from the report parameters
     */
    this.createChart = (report) => {
        this.chart.clearSources();

        this.chart.getTitle = $scope.generateTitle;
        this.chart.getSubtitle = $scope.generateSubtitle;
        this.chart.getYAxisTitle = () => gettext('Items Created');

        this.chart.addSource('task.user', _.get(report, 'group'));
        this.chart.addSource('planning_usage', _.get(report, 'subgroup'));

        return this.chart.loadTranslations()
            .then(() => this.chart.genConfig())
            .then((config) => ({
                charts: [config],
                wrapCharts: report.chart.type === 'table',
                height500: false,
                fullWidth: true,
                multiChart: false,
            }));
    };

    /**
     * @ngdoc method
     * @name PlanningUsageReportController#getReportParams
     * @return {Promise}
     * @description Loads field translations for this report and returns them along with current report params
     * This is used so that saving this report will also save the translations with it
     */
    $scope.getReportParams = () => (
        chartConfig.loadTranslations(['task.user', 'planning_usage'], true)
            .then(() => (
                $q.when(
                    Object.assign(
                        {},
                        $scope.currentParams,
                        {translations: chartConfig.translations}
                    )
                )
            ))
    );

    this.init();
}
