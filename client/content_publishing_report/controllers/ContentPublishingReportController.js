import {getErrorMessage} from '../../utils';

ContentPublishingReportController.$inject = [
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
    '$interpolate',
    'metadata',
    'contentPublishingReports',
];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.content-publishing-report
 * @name ContentPublishingReportController
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
 * @requires $interpolate
 * @requires metadata
 * @requires contentPublishingReports
 * @description Controller for Content Publishing reports
 */
export function ContentPublishingReportController(
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
    chartConfig,
    $interpolate,
    metadata,
    contentPublishingReports
) {
    /**
     * @ngdoc method
     * @name ContentPublishingReportController#init
     * @description Initialises the scope parameters
     */
    this.init = () => {
        $scope.currentTab = 'parameters';
        this.initDefaultParams();
        savedReports.selectReportFromURL();
    };

    /**
     * @ngdoc method
     * @name ContentPublishingReportController#initDefaultParams
     * @description Initialises the default report parameters
     */
    this.initDefaultParams = () => {
        $scope.item_states = searchReport.filterItemStates(
            ['published', 'killed', 'corrected', 'recalled']
        );

        $scope.chart_types = chartConfig.filterChartTypes(
            ['bar', 'column', 'table']
        );

        $scope.report_groups = searchReport.filterDataFields(
            ['anpa_category.qcode', 'genre.qcode', 'source', 'urgency']
        );

        $scope.currentParams = {
            report: 'content_publishing_report',
            params: {
                dates: {
                    filter: 'range',
                    start: moment()
                        .subtract(30, 'days')
                        .format(config.model.dateformat),
                    end: moment().format(config.model.dateformat),
                },
                must: {
                    categories: [],
                    genre: [],
                    sources: [],
                    urgency: [],
                    desks: [],
                    users: [],
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
                repos: {
                    ingest: false,
                    archive: false,
                    published: true,
                    archived: true,
                },
                min: 1,
                aggs: {
                    group: {
                        field: _.get($scope, 'report_groups[0].qcode') || 'anpa_category.qcode',
                        size: 0,
                    },
                },
                chart: {
                    type: _.get($scope, 'chart_types[0].qcode') || 'bar',
                    sort_order: 'desc',
                    title: null,
                    subtitle: null,
                },
            },
        };

        $scope.defaultReportParams = _.cloneDeep($scope.currentParams);

        $scope.group_by = _.cloneDeep($scope.report_groups);
        $scope.updateGroupOptions();
    };

    /**
     * @ngdoc method
     * @name ContentPublishingReportController#updateGroupOptions
     * @description Updates the available group/subgroup options when the user changes the group
     */
    $scope.updateGroupOptions = () => {
        $scope.subgroup_by = _.filter(
            $scope.report_groups,
            (group) => group.qcode !== $scope.currentParams.params.aggs.group.field
        );

        if (_.get($scope, 'currentParams.params.aggs.subgroup.field.length', 0) < 1) {
            delete $scope.currentParams.params.aggs.subgroup;
        } else {
            $scope.currentParams.params.aggs.subgroup.size = 0;

            if ($scope.currentParams.params.aggs.group.field === $scope.currentParams.params.aggs.subgroup.field) {
                $scope.currentParams.params.aggs.subgroup.field = null;
            }
        }
    };

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
     * @name ContentPublishingReportController#generateSubtitilePlaceholder
     * @return {String}
     * @description Based on the date filters, returns the placeholder to use for the subtitle
     */
    $scope.generateSubtitlePlaceholder = () =>
        contentPublishingReports.generateSubtitle($scope.currentParams.params);

    /**
     * @ngdoc ContentPublishingReportController#generateTitlePlaceholder
     * @return {String}
     * @description Based on the group/subgroup, returns the placeholder to use for the title
     */
    $scope.generateTitlePlaceholder = () =>
        contentPublishingReports.generateTitle($scope.currentParams.params);

    /**
     * @ngdoc method
     * @name ContentPublishingReportController#onDateFilterChange
     * @description When the date filter changes, clear the date input fields if the filter is not 'range'
     */
    $scope.onDateFilterChange = () => {
        if ($scope.currentParams.params.dates.filter !== 'range') {
            $scope.currentParams.params.dates.start = null;
            $scope.currentParams.params.dates.end = null;
        }
    };

    /**
     * @ngdoc method
     * @name ContentPublishingReportController#runQuery
     * @param {Object} params - The report parameters used to search the data
     * @return {Object}
     * @description Queries the ContentPublishing API and returns it's response
     */
    $scope.runQuery = (params) => searchReport.query(
        'content_publishing_report',
        params,
        true
    );

    /**
     * @ngdoc method
     * @name ContentPublishingReportController#generate
     * @description Updates the Highchart configs in the report's content view
     */
    $scope.generate = () => {
        $scope.changeContentView('report');

        const params = _.cloneDeep($scope.currentParams.params);

        if (!_.get(params, 'aggs.subgroup.field')) {
            delete params.aggs.subgroup;
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
     * @name ContentPublishingReportController#changeTab
     * @param {String} tabName - The name of the tab to change to
     * @description Change the current tab in the filters panel
     */
    $scope.changeTab = (tabName) => {
        $scope.currentTab = tabName;
    };

    /**
     * @ngdoc method
     * @name ContentPublishingReportController#createChart
     * @param {Object} report - The report parameters used to search the data
     * @return {Object}
     * @description Generates the Highcharts config from the report parameters
     */
    this.createChart = (report) => (
        contentPublishingReports.createChart(report)
            .then((chart) => {
                const config = chart.genConfig();

                return {
                    charts: [config],
                    wrapCharts: report.chart.type === 'table',
                    height500: false,
                    fullWidth: true,
                    multiChart: false,
                };
            })
    );

    this.init();
}
