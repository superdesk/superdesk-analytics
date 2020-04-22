import {appConfig} from 'appConfig';

import {getErrorMessage} from '../../utils';
import {CHART_FIELDS, CHART_TYPES} from '../../charts/directives/ChartOptions';
import {DATE_FILTERS} from '../../search/common';

FeaturemediaUpdatesReportController.$inject = [
    '$scope',
    'gettext',
    'gettextCatalog',
    'lodash',
    'savedReports',
    'searchReport',
    'notify',
    'moment',
    '$q',
    'chartConfig',
    'reportConfigs',
];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.featuremedia-updates-report
 * @name FeaturemediaUpdatesReportController
 * @requires $scope
 * @requires gettext
 * @requires gettextCatalog
 * @requires lodash
 * @requires savedReports
 * @requires searchReport
 * @requires notify
 * @requires moment
 * @requires $q
 * @requires chartConfig
 * @requires reportConfigs
 * @description Controller for Publishing Performance reports
 */
export function FeaturemediaUpdatesReportController(
    $scope,
    gettext,
    gettextCatalog,
    _,
    savedReports,
    searchReport,
    notify,
    moment,
    $q,
    chartConfig,
    reportConfigs
) {
    function resetParams() {
        $scope.currentParams = _.cloneDeep($scope.defaultReportParams);
    }

    const reportName = 'featuremedia_updates_report';

    /**
     * @ngdoc method
     * @name FeaturemediaUpdatesReportController#init
     * @description Initialises the scope parameters
     */
    this.init = () => {
        $scope.form = {
            datesError: null,
            submitted: false,
            showErrors: false,
        };
        $scope.config = reportConfigs.getConfig(reportName);
        $scope.chartFields = [
            CHART_FIELDS.TITLE,
            CHART_FIELDS.SUBTITLE,
            CHART_FIELDS.SORT,
            CHART_FIELDS.PAGE_SIZE,
        ];

        this.initDefaultParams();
        savedReports.selectReportFromURL();

        this.chart = chartConfig.newConfig('chart', 'table');
        $scope.updateChartConfig();

        document.addEventListener('sda-source-filters--clear', resetParams);

        $scope.$on('$destroy', () => {
            document.removeEventListener('sda-source-filters--clear', resetParams);
        });
    };

    /**
     * @ngdoc method
     * @name FeaturemediaUpdatesReportController#initDefaultParams
     * @description Initialises the default report parameters
     */
    this.initDefaultParams = () => {
        $scope.item_states = searchReport.filterItemStates(
            ['published', 'killed', 'corrected', 'recalled']
        );

        $scope.report_groups = searchReport.filterDataFields(
            ['task.desk', 'task.user', 'anpa_category.qcode', 'source', 'urgency', 'genre.qcode']
        );

        $scope.currentParams = {
            report: reportName,
            params: $scope.config.defaultParams({
                dates: {
                    filter: DATE_FILTERS.RANGE,
                    start: moment()
                        .subtract(30, 'days')
                        .format(appConfig.model.dateformat),
                    end: moment().format(appConfig.model.dateformat),
                },
                must: {},
                must_not: {},
                min: 1,
                size: 15,
                page: 1,
                chart: {
                    type: CHART_TYPES.TABLE,
                    sort_order: 'desc',
                    title: null,
                    subtitle: null,
                },
            }),
        };

        $scope.defaultReportParams = _.cloneDeep($scope.currentParams);
    };

    /**
     * @ngdoc method
     * @name FeaturemediaUpdatesReportController#updateChartConfig
     * @description Updates the local HighchartConfig instance parameters
     */
    $scope.updateChartConfig = () => {
        this.chart.title = _.get($scope, 'currentParams.params.chart.title');
        this.chart.subtitle = _.get($scope, 'currentParams.params.chart.subtitle');
    };

    /**
     * @ngdoc method
     * @name FeaturemediaUpdatesReportController#generateTitle
     * @return {String}
     * @description Returns the title to use for the Highcharts config
     */
    $scope.generateTitle = () => {
        if (_.get($scope, 'currentParams.params.chart.title')) {
            return $scope.currentParams.params.chart.title;
        }

        return gettext('Changes to Featuremedia');
    };

    /**
     * @ngdoc method
     * @name FeaturemediaUpdatesReportController#generateSubtitle
     * @return {String}
     * @description Returns the subtitle to use for the Highcharts config based on the date parameters
     */
    $scope.generateSubtitle = () => chartConfig.generateSubtitleForDates(
        _.get($scope, 'currentParams.params') || {}
    );

    $scope.isDirty = () => true;

    $scope.$watch(() => savedReports.currentReport, (newReport) => {
        if (_.get(newReport, '_id')) {
            $scope.currentParams = _.cloneDeep(savedReports.currentReport);
        } else {
            resetParams();
        }
    }, true);

    /**
     * @ngdoc method
     * @name FeaturemediaUpdatesReportController#onDateFilterChange
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
     * @name FeaturemediaUpdatesReportController#generate
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
                        gettext('Error. The Publishing Report could not be generated!')
                    )
                );
            });
    };

    /**
     * @ngdoc method
     * @name FeaturemediaUpdatesReportController#createChart
     * @param {Object} report - The report parameters used to search the data
     * @return {Object}
     * @description Generates the Highcharts config from the report parameters
     */
    this.createChart = (report) => (
        $q.when({
            charts: [report],
            title: $scope.generateTitle(report),
            subtitle: $scope.generateSubtitle(),
        })
    );

    /**
     * @ngdoc method
     * @name FeaturemediaUpdatesReportController#getReportParams
     * @return {Promise}
     * @description Loads field translations for this report and returns them along with current report params
     * This is used so that saving this report will also save the translations with it
     */
    $scope.getReportParams = () => (
        $q.when(_.cloneDeep($scope.currentParams))
    );

    this.init();
}
