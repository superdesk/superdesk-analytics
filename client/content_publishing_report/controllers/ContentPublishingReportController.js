import {appConfig} from 'appConfig';

import {getErrorMessage, gettext} from '../../utils';
import {CHART_TYPES} from '../../charts/directives/ChartOptions';
import {searchReportService} from '../../search/services/SearchReport';
import {superdeskApi} from '../../superdeskApi';

ContentPublishingReportController.$inject = [
    '$scope',
    'lodash',
    'savedReports',
    'notify',
    'moment',
    '$q',
    'chartConfig',
    '$interpolate',
    'reportConfigs',
];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.content-publishing-report
 * @name ContentPublishingReportController
 * @requires $scope
 * @requires lodash
 * @requires savedReports
 * @requires notify
 * @requires moment
 * @requires $q
 * @requires chartConfig
 * @requires $interpolate
 * @requires reportConfigs
 * @description Controller for Content Publishing reports
 */
export function ContentPublishingReportController(
    $scope,
    _,
    savedReports,
    notify,
    moment,
    $q,
    chartConfig,
    $interpolate,
    reportConfigs
) {
    function resetParams() {
        $scope.currentParams = _.cloneDeep($scope.defaultReportParams);
    }

    const reportName = 'content_publishing_report';

    /**
     * @ngdoc method
     * @name ContentPublishingReportController#init
     * @description Initialises the scope parameters
     */
    this.init = () => {
        $scope.form = {
            datesError: null,
            submitted: false,
            showErrors: false,
        };
        $scope.config = reportConfigs.getConfig(reportName);

        this.initDefaultParams();
        savedReports.selectReportFromURL();

        this.chart = chartConfig.newConfig('chart', _.get($scope, 'currentParams.params.chart.type'));
        $scope.updateChartConfig();

        document.addEventListener('sda-source-filters--clear', resetParams);

        $scope.$on('$destroy', () => {
            document.removeEventListener('sda-source-filters--clear', resetParams);
        });
    };

    /**
     * @ngdoc method
     * @name ContentPublishingReportController#initDefaultParams
     * @description Initialises the default report parameters
     */
    this.initDefaultParams = () => {
        $scope.item_states = searchReportService.filterItemStates(
            ['published', 'killed', 'corrected', 'recalled']
        );

        $scope.report_groups = searchReportService.filterDataFields(
            ['anpa_category.qcode', 'genre.qcode', 'source', 'urgency', 'subject.qcode', 'authors.parent', 'language']
        );

        $scope.currentParams = {
            report: reportName,
            params: $scope.config.defaultParams({
                dates: {
                    filter: 'range',
                    start: moment()
                        .subtract(30, 'days')
                        .format(appConfig.model.dateformat),
                    end: moment().format(appConfig.model.dateformat),
                },
                must: {},
                must_not: {},
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
            }),
        };

        $scope.defaultReportParams = _.cloneDeep($scope.currentParams);

        $scope.group_by = $scope.group_by = _.cloneDeep($scope.report_groups);

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
        const excludedSchemes = new Set(['languages', 'author_roles', 'genre']);

        const customVocab = getCustomVocabulariesData().filter(
            (item) => !excludedSchemes.has(item.qcode.scheme));

        $scope.group_by = [...$scope.report_groups, ...customVocab.filter(
            (item) => !new Set($scope.report_groups.map((item) => item.name)).has(item.name))];

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

        chartConfig.loadTranslations([
            _.get($scope, 'currentParams.params.aggs.group.field'),
            _.get($scope, 'currentParams.params.aggs.subgroup.field'),
        ]);
    };

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
        $scope.changeContentView('report');
        $scope.form.submitted = true;

        if ($scope.form.datesError) {
            $scope.form.showErrors = true;
            return;
        }

        $scope.form.showErrors = false;
        $scope.beforeGenerateChart();

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
 * @param {HighchartConfig} chart - HighchartConfig instance
 * @param {Object} params - Report parameters
 * @return {String}
 * @description Construct the title for the chart based on report parameters and results
 */
export const generateTitle = (chart, params) => {
    if (_.get(params, 'chart.title')) {
        return params.chart.title;
    }

    let parentField = _.get(params, 'aggs.group.field');

    if (parentField.startsWith('{"scheme')) {
        const obj = JSON.parse(parentField);

        parentField = getCustomVocabulariesData().find(
            (value) => value.qcode.scheme == obj.scheme)?.name;
    }

    const parentName = chart.getSourceName(parentField);

    if (_.get(params, 'aggs.subgroup.field.length', 0) > 0) {
        const childField = _.get(params, 'aggs.subgroup.field');
        const childName = chart.getSourceName(childField);

        return gettext(
            'Published Stories per {{group}} with {{subgroup}} breakdown',
            {group: parentName, subgroup: childName}
        );
    }

    return gettext('Published Stories per {{group}}', {group: parentName});
};

export function getCustomVocabulariesData() {
    return superdeskApi.entities.vocabulary.getCustomVocabulary().map((data) => {
        return {'name': data['display_name'], 'qcode': {'scheme': data['_id']}};
    });
}
