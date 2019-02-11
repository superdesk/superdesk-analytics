import {getErrorMessage} from '../../utils';
import {DATE_FILTERS} from '../../search/directives/DateFilters';
import {CHART_TYPES} from '../../charts/directives/ChartOptions';

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
    $interpolate
) {
    /**
     * @ngdoc method
     * @name ContentPublishingReportController#init
     * @description Initialises the scope parameters
     */
    this.init = () => {
        $scope.dateFilters = [
            DATE_FILTERS.YESTERDAY,
            DATE_FILTERS.LAST_WEEK,
            DATE_FILTERS.LAST_MONTH,
            DATE_FILTERS.RANGE,
        ];

        $scope.chartTypes = [
            CHART_TYPES.BAR,
            CHART_TYPES.COLUMN,
            CHART_TYPES.TABLE,
        ];

        this.initDefaultParams();
        savedReports.selectReportFromURL();

        this.chart = chartConfig.newConfig('chart', _.get($scope, 'currentParams.params.chart.type'));
        $scope.updateChartConfig();
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
                min: 1,
                aggs: {
                    group: {
                        field: _.get($scope, 'report_groups[0].qcode') || 'anpa_category.qcode',
                        size: 0,
                    },
                },
                chart: {
                    type: CHART_TYPES.COLUMN,
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
     * @name ContentPublishingReportController#updateChartConfig
     * @param {boolean} reloadTranslations - Reloads text translations if true
     * @description Updates the local HighchartConfig instance parameters
     */
    $scope.updateChartConfig = (reloadTranslations = false) => {
        this.chart.chartType = _.get($scope, 'currentParams.params.chart.type');
        this.chart.sortOrder = _.get($scope, 'currentParams.params.chart.sort_order');
        this.chart.title = _.get($scope, 'currentParams.params.chart.title');
        this.chart.subtitle = _.get($scope, 'currentParams.params.chart.subtitle');

        this.chart.clearSources();
        this.chart.addSource(
            _.get($scope, 'currentParams.params.aggs.group.field'),
            {}
        );

        this.chart.addSource(
            _.get($scope, 'currentParams.params.aggs.subgroup.field'),
            {}
        );

        if (reloadTranslations) {
            this.chart.loadTranslations();
        }
    };

    /**
     * @ngdoc method
     * @name ContentPublishingReportController#generateTitle
     * @return {String}
     * @description Returns the title to use for the Highcharts config
     */
    $scope.generateTitle = () => generateTitle(
        $interpolate,
        gettextCatalog,
        this.chart,
        _.get($scope, 'currentParams.params') || {}
    );

    /**
     * @ngdoc method
     * @name ContentPublishingReportController#generateSubtitle
     * @return {String}
     * @description Returns the subtitle to use for the Highcharts config based on the date parameters
     */
    $scope.generateSubtitle = () => chartConfig.generateSubtitleForDates(
        _.get($scope, 'currentParams.params') || {}
    );

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
     * @name ContentPublishingReportController#onDateFilterChange
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
     * @name ContentPublishingReportController#generate
     * @description Updates the Highchart configs in the report's content view
     */
    $scope.generate = () => {
        $scope.beforeGenerateChart();
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
     * @name ContentPublishingReportController#createChart
     * @param {Object} report - The report parameters used to search the data
     * @return {Object}
     * @description Generates the Highcharts config from the report parameters
     */
    this.createChart = (report) => {
        this.chart.clearSources();

        this.chart.addSource(
            _.get(report, 'aggs.group.field'),
            report.groups
        );

        if (_.get(report, 'subgroups')) {
            this.chart.addSource(
                _.get(report, 'aggs.subgroup.field'),
                report.subgroups
            );
        }

        this.chart.getTitle = () => $scope.generateTitle(report);
        this.chart.getSubtitle = $scope.generateSubtitle;

        return this.chart.genConfig()
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
     * @name ContentPublishingReportController#getReportParams
     * @return {Promise}
     * @description Loads field translations for this report and returns them along with current report params
     * This is used so that saving this report will also save the translations with it
     */
    $scope.getReportParams = () => {
        const groupField = _.get($scope.currentParams, 'params.aggs.group.field');
        const subgroupField = _.get($scope.currentParams, 'params.aggs.subgroup.field');

        return chartConfig.loadTranslations([groupField, subgroupField], true)
            .then(() => (
                $q.when(
                    Object.assign(
                        {},
                        $scope.currentParams,
                        {translations: chartConfig.translations}
                    )
                )
            ));
    };

    this.init();
}

/**
 * @ngdoc method
 * @name generateTitle
 * @param {angular.IInterpolateService} $interpolate
 * @param {Object} gettextCatalog - angular-gettext
 * @param {HighchartConfig} chart - HighchartConfig instance
 * @param {Object} params - Report parameters
 * @return {String}
 * @description Construct the title for the chart based on report parameters and results
 */
export const generateTitle = ($interpolate, gettextCatalog, chart, params) => {
    if (_.get(params, 'chart.title')) {
        return params.chart.title;
    }

    const parentField = _.get(params, 'aggs.group.field');
    const parentName = chart.getSourceName(parentField);

    if (_.get(params, 'aggs.subgroup.field.length', 0) > 0) {
        const childField = _.get(params, 'aggs.subgroup.field');
        const childName = chart.getSourceName(childField);

        return $interpolate(
            gettextCatalog.getString(
                'Published Stories per {{ group }} with {{ subgroup }} breakdown'
            )
        )({group: parentName, subgroup: childName});
    }

    return $interpolate(
        gettextCatalog.getString(
            'Published Stories per {{ group }}'
        )
    )({group: parentName});
};
