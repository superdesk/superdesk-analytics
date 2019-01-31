import {DATE_FILTERS} from '../../search/directives/DateFilters';
import {SOURCE_FILTERS} from '../../search/directives/SourceFilters';
import {getErrorMessage} from '../../utils';

UpdateTimeReportController.$inject = [
    '$scope',
    'gettext',
    'gettextCatalog',
    'lodash',
    'savedReports',
    'searchReport',
    'notify',
    'moment',
    'config',
    '$q',
    'chartConfig',
];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.update-time-report
 * @name UpdateTimeReportController
 * @requires $scope
 * @requires gettext
 * @requires gettextCatalog
 * @requires lodash
 * @requires savedReports
 * @requires searchReport
 * @requires notify
 * @requires moment
 * @requires config
 * @requires $q
 * @requires chartConfig
 * @description Controller for Update Time reports
 */
export function UpdateTimeReportController(
    $scope,
    gettext,
    gettextCatalog,
    _,
    savedReports,
    searchReport,
    notify,
    moment,
    config,
    $q,
    chartConfig
) {
    /**
     * @ngdoc method
     * @name UpdateTimeReportController#init
     * @description Initialises the scope parameters
     */
    this.init = () => {
        $scope.dateFilters = [
            DATE_FILTERS.YESTERDAY,
            DATE_FILTERS.RELATIVE,
            DATE_FILTERS.DAY,
            DATE_FILTERS.RANGE,
            DATE_FILTERS.LAST_WEEK,
            DATE_FILTERS.LAST_MONTH,
            DATE_FILTERS.RELATIVE_DAYS,
        ];

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

        $scope.form = {submitted: false};

        this.initDefaultParams();
        savedReports.selectReportFromURL();

        this.chart = chartConfig.newConfig('chart', 'table');
        $scope.updateChartConfig();
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
            report: 'update_time_report',
            params: {
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
                repos: {archive_statistics: true},
                min: 1,
                chart: {
                    type: 'table',
                    title: null,
                    subtitle: null,
                },
                size: 15,
                page: 1,
                sort: [{time_to_next_update_publish: 'desc'}],
            },
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

    $scope.$watch(() => savedReports.currentReport._id, (newReportId) => {
        if (newReportId) {
            $scope.currentParams = _.cloneDeep(savedReports.currentReport);
            $scope.changePanel('advanced');
        } else {
            $scope.currentParams = _.cloneDeep($scope.defaultReportParams);
        }
    });

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
                        $scope.form.submitted = true;
                        $scope.changeReportParams(chartConfig);
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
