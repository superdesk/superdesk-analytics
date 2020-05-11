import {gettext} from 'superdesk-core/scripts/core/utils';

import {DATE_FILTERS} from '../../search/common';
import {SOURCE_FILTERS} from '../../search/directives/SourceFilters';
import {getErrorMessage} from '../../utils';
import {CHART_FIELDS, CHART_TYPES} from '../../charts/directives/ChartOptions';

UpdateTimeReportController.$inject = [
    '$scope',
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
 * @module superdesk.apps.analytics.update-time-report
 * @name UpdateTimeReportController
 * @requires $scope
 * @requires lodash
 * @requires savedReports
 * @requires searchReport
 * @requires notify
 * @requires moment
 * @requires $q
 * @requires chartConfig
 * @requires reportConfigs
 * @description Controller for Update Time reports
 */
export function UpdateTimeReportController(
    $scope,
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

    const reportName = 'update_time_report';

    /**
     * @ngdoc method
     * @name UpdateTimeReportController#init
     * @description Initialises the scope parameters
     */
    this.init = () => {
        $scope.form = {
            datesError: null,
            submitted: false,
            showErrors: false,
        };
        $scope.config = reportConfigs.getConfig(reportName);

        $scope.sourceFilters = [
            SOURCE_FILTERS.DESKS,
            SOURCE_FILTERS.USERS,
            SOURCE_FILTERS.CATEGORIES,
            SOURCE_FILTERS.GENRE,
            SOURCE_FILTERS.SOURCES,
            SOURCE_FILTERS.URGENCY,
            SOURCE_FILTERS.INGEST_PROVIDERS,
            SOURCE_FILTERS.PUBLISH_PARS,
        ];

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
     * @name UpdateTimeReportController#initDefaultParams
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
                    filter: DATE_FILTERS.YESTERDAY,
                },
                must: {
                    categories: [],
                    genre: [],
                    sources: [],
                    urgency: [],
                    desks: [],
                    users: [],
                    publish_pars: 0,
                },
                must_not: {
                    rewrites: false,
                    states: {
                        published: false,
                        killed: false,
                        corrected: false,
                        recalled: false,
                    },
                },
                min: 1,
                chart: {
                    type: CHART_TYPES.TABLE,
                    title: null,
                    subtitle: null,
                },
                size: 15,
                page: 1,
                sort: [{time_to_next_update_publish: 'desc'}],
            }),
        };

        $scope.defaultReportParams = _.cloneDeep($scope.currentParams);
    };

    /**
     * @ngdoc method
     * @name UpdateTimeReportController#updateChartConfig
     * @description Updates the local HighchartConfig instance parameters
     */
    $scope.updateChartConfig = () => {
        this.chart.title = _.get($scope, 'currentParams.params.chart.title');
        this.chart.subtitle = _.get($scope, 'currentParams.params.chart.subtitle');
    };

    /**
     * @ngdoc method
     * @name UpdateTimeReportController#generateTitle
     * @return {String}
     * @description Returns the title to use for the Highcharts config
     */
    $scope.generateTitle = () => {
        if (_.get($scope, 'currentParams.params.chart.title')) {
            return $scope.currentParams.params.chart.title;
        }

        return gettext('Update Time');
    };

    /**
     * @ngdoc method
     * @name UpdateTimeReportController#generateSubtitle
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

    $scope.$on('analytics:update-params', (e, newParams) => {
        Object.keys(newParams).forEach((key) => {
            $scope.currentParams.params[key] = newParams[key];
        });

        $scope.generate();
    });

    /**
     * @ngdoc method
     * @name UpdateTimeReportController#onDateFilterChange
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
     * @name UpdateTimeReportController#generate
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
                        data._items ? data : {_items: [data]}
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
     * @name UpdateTimeReportController#createChart
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
     * @name UpdateTimeReportController#getReportParams
     * @return {Promise}
     * @description Loads field translations for this report and returns them along with current report params
     * This is used so that saving this report will also save the translations with it
     */
    $scope.getReportParams = () => (
        $q.when(_.cloneDeep($scope.currentParams))
    );

    this.init();
}
