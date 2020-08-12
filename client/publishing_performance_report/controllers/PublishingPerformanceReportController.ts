import {cloneDeep} from 'lodash';
import moment from 'moment';

import {appConfig, superdeskApi} from '../../superdeskApi';
import {
    CHART_SORT,
    CHART_TYPE,
    DATA_FIELD,
    DATE_FILTER,
    ITEM_STATE,
    REPORT_RESPONSE_TYPE,
} from '../../interfaces';

import {getErrorMessage} from '../../utils';
import {CHART_FIELDS, CHART_TYPES} from '../../charts/directives/ChartOptions';
import {searchReportService} from '../../search/services/SearchReport';


PublishingPerformanceReportController.$inject = [
    '$scope',
    'savedReports',
    'notify',
    'chartConfig',
    'reportConfigs',
];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.publishing-performance-report
 * @name PublishingPerformanceReportController
 * @requires $scope
 * @requires savedReports
 * @requires notify
 * @requires chartConfig
 * @requires reportConfigs
 * @description Controller for Publishing Performance reports
 */
export function PublishingPerformanceReportController(
    $scope,
    savedReports,
    notify,
    chartConfig,
    reportConfigs,
) {
    const gettext = superdeskApi.localization.gettext;

    function resetParams() {
        $scope.currentParams = cloneDeep($scope.defaultReportParams);
    }

    const reportName = 'publishing_performance_report';

    /**
     * @ngdoc method
     * @name PublishingPerformanceReportController#init
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
            CHART_FIELDS.TYPE,
            CHART_FIELDS.SORT,
        ];

        this.initDefaultParams();
        savedReports.selectReportFromURL();

        this.chart = chartConfig.newConfig(
            'chart',
            $scope?.currentParams?.params?.chart?.type ?? CHART_TYPES.COLUMN,
        );
        $scope.updateChartConfig(true);

        document.addEventListener('sda-source-filters--clear', resetParams);

        $scope.$on('$destroy', () => {
            document.removeEventListener('sda-source-filters--clear', resetParams);
        });
    };

    /**
     * @ngdoc method
     * @name PublishingPerformanceReportController#initDefaultParams
     * @description Initialises the default report parameters
     */
    this.initDefaultParams = () => {
        $scope.item_states = searchReportService.filterItemStates([
            ITEM_STATE.PUBLISHED,
            ITEM_STATE.KILLED,
            ITEM_STATE.CORRECTED,
            ITEM_STATE.RECALLED,
        ]);

        $scope.report_groups = searchReportService.filterDataFields([
            DATA_FIELD.DESK,
            DATA_FIELD.USER,
            DATA_FIELD.CATEGORY,
            DATA_FIELD.SOURCE,
            DATA_FIELD.URGENCY,
            DATA_FIELD.GENRE,
            DATA_FIELD.SUBJECT,
            DATA_FIELD.AUTHOR,
        ]);

        $scope.currentParams = {
            report: reportName,
            params: $scope.config.defaultParams({
                dates: {
                    filter: DATE_FILTER.RANGE,
                    start: moment()
                        .subtract(30, 'days')
                        .format(appConfig.model.dateformat),
                    end: moment().format(appConfig.model.dateformat),
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
                        field: $scope?.report_groups?.[0].qcode ?? DATA_FIELD.DESK,
                        size: 0,
                    },
                    subgroup: {
                        field: DATA_FIELD.STATE,
                    },
                },
                chart: {
                    type: CHART_TYPES.COLUMN,
                    sort_order: CHART_SORT.DESCENDING,
                    title: null,
                    subtitle: null,
                },
                show_all_desks: 0,
                return_type: REPORT_RESPONSE_TYPE.AGGREGATIONS,
            }),
        };

        $scope.defaultReportParams = cloneDeep($scope.currentParams);

        $scope.group_by = cloneDeep($scope.report_groups);
    };

    /**
     * @ngdoc method
     * @name PublishingPerformanceReportController#updateChartConfig
     * @param {boolean} reloadTranslations - Reloads text translations if true
     * @description Updates the local HighchartConfig instance parameters
     */
    $scope.updateChartConfig = (reloadTranslations = false) => {
        this.chart.chartType = $scope?.currentParams?.params?.chart.type;
        this.chart.sortOrder = $scope?.currentParams?.params?.chart?.sort_order;
        this.chart.title = $scope?.currentParams?.params?.chart?.title;
        this.chart.subtitle = $scope?.currentParams?.params?.chart?.subtitle;

        this.chart.clearSources();
        this.chart.addSource(
            $scope?.currentParams?.params?.aggs?.group?.field,
            {},
        );

        this.chart.addSource(
            $scope?.currentParams?.params?.aggs?.subgroup?.field,
            {},
        );

        if (reloadTranslations) {
            this.chart.loadTranslations();
        }
    };

    /**
     * @ngdoc method
     * @name PublishingPerformanceReportController#generateTitle
     * @return {String}
     * @description Returns the title to use for the Highcharts config
     */
    $scope.generateTitle = (report) => generateTitle(
        this.chart,
        $scope?.currentParams?.params ?? {},
        report,
    );

    /**
     * @ngdoc method
     * @name PublishingPerformanceReportController#generateSubtitle
     * @return {String}
     * @description Returns the subtitle to use for the Highcharts config based on the date parameters
     */
    $scope.generateSubtitle = () => chartConfig.generateSubtitleForDates(
        $scope?.currentParams?.params ?? {},
    );

    $scope.isDirty = () => true;

    $scope.$watch(() => savedReports.currentReport, (newReport) => {
        if (newReport?._id != null) {
            $scope.currentParams = cloneDeep(savedReports.currentReport);
        } else {
            resetParams();
        }
    }, true);

    /**
     * @ngdoc method
     * @name PublishingPerformanceReportController#onDateFilterChange
     * @description When the date filter changes, clear the date input fields if the filter is not 'range'
     */
    $scope.onDateFilterChange = () => {
        if ($scope.currentParams.params.dates.filter !== DATE_FILTER.RANGE) {
            $scope.currentParams.params.dates.start = null;
            $scope.currentParams.params.dates.end = null;
        }

        $scope.updateChartConfig();
    };

    /**
     * @ngdoc method
     * @name PublishingPerformanceReportController#generate
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

        const params = cloneDeep($scope.currentParams.params);

        if (params.chart.type === 'table' && params.aggs.group.field == 'task.desk') {
            params.show_all_desks = 1;
        }

        $scope.runQuery(params)
            .then((data) => {
                this.createChart(
                    Object.assign(
                        {},
                        $scope.currentParams.params,
                        data,
                    ),
                )
                    .then((chartConfig) => {
                        $scope.changeReportParams(chartConfig);
                        $scope.form.submitted = false;
                    });
            }, (error) => {
                notify.error(
                    getErrorMessage(
                        error,
                        gettext('Error. The Publishing Report could not be generated!'),
                    ),
                );
            });
    };

    /**
     * @ngdoc method
     * @name PublishingPerformanceReportController#createChart
     * @param {Object} report - The report parameters used to search the data
     * @return {Object}
     * @description Generates the Highcharts config from the report parameters
     */
    this.createChart = (report) => {
        this.chart.clearSources();

        if (Object.keys(report.groups).length === 1 && report?.subgroups != null) {
            this.chart.addSource(
                report?.aggs?.subgroup?.field,
                report.subgroups,
            );
        } else {
            this.chart.addSource(
                report?.aggs?.group?.field,
                report.groups,
            );

            if (report?.subgroups != null) {
                this.chart.addSource(
                    report?.aggs?.subgroup?.field,
                    report.subgroups,
                );
            }
        }

        this.chart.getTitle = () => $scope.generateTitle(report);
        this.chart.getSubtitle = $scope.generateSubtitle;
        this.chart.getChildKeys = () => [
            ITEM_STATE.PUBLISHED,
            ITEM_STATE.RECALLED,
            ITEM_STATE.KILLED,
            ITEM_STATE.CORRECTED,
            ITEM_STATE.UPDATED,
        ];

        return this.chart.loadTranslations(report?.aggs?.group?.field)
            .then(() => this.chart.genConfig())
            .then((config) => ({
                charts: [config],
                wrapCharts: report.chart.type === CHART_TYPE.TABLE,
                height500: false,
                fullWidth: true,
                multiChart: false,
            }));
    };

    /**
     * @ngdoc method
     * @name PublishingPerformanceReportController#getReportParams
     * @return {Promise}
     * @description Loads field translations for this report and returns them along with current report params
     * This is used so that saving this report will also save the translations with it
     */
    $scope.getReportParams = () => {
        const groupField = $scope?.currentParams?.params?.aggs?.group?.field;
        const subgroupField = $scope?.currentParams?.params?.aggs?.subgroup?.field;

        return chartConfig.loadTranslations([groupField, subgroupField], true)
            .then(() => Object.assign(
                {},
                $scope.currentParams,
                {translations: chartConfig.translations},
            ));
    };

    this.init();
}

/**
 * @ngdoc method
 * @name generateTitle
 * @param {HighchartConfig} chart - HighchartConfig instance
 * @param {Object} params - Report parameters
 * @param {Object} report - Report results
 * @return {String}
 * @description Construct the title for the chart based on report parameters and results
 */
export const generateTitle = (chart, params, report = null) => {
    const gettext = superdeskApi.localization.gettext;

    if (params?.chart?.title != null) {
        return params.chart.title;
    }

    const parentField = params?.aggs?.group?.field;
    const parentName = chart.getSourceName(parentField);

    if (report && Object.keys(report.groups).length === 1 && report?.subgroups != null) {
        const dataName = chart.getSourceTitle(
            parentField,
            Object.keys(report.groups)[0],
        );

        return gettext(
            'Published Stories for {{group}}: {{data}}',
            {group: parentName, data: dataName},
        );
    }

    return gettext('Published Stories per {{group}}', {group: parentName});
};
