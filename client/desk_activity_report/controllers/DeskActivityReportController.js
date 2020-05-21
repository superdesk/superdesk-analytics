import {appConfig} from 'appConfig';

import {
    getErrorMessage,
    getUtcOffsetInMinutes,
    ENTER_DESK_OPERATIONS,
    EXIT_DESK_OPERATIONS,
    gettext,
} from '../../utils';
import {CHART_FIELDS, CHART_TYPES} from '../../charts/directives/ChartOptions';
import {SDChart} from '../../charts/SDChart';
import {REPORT_CONFIG} from '../../services/ReportConfigService';
import {searchReport} from '../../search/services/SearchReport';

DeskActivityReportController.$inject = [
    '$scope',
    'savedReports',
    'chartConfig',
    'lodash',
    'moment',
    'notify',
    '$q',
    'desks',
    'reportConfigs',
];

/**
 * @ngdoc controller
 * @module superdesk.analytics.desk-activity-report
 * @name DeskActivityReportController
 * @requires $scope
 * @requires savedReports
 * @requires chartConfig
 * @requires lodash
 * @requires moment
 * @requires notify
 * @requires $q
 * @requires desks
 * @requires reportConfigs
 * @description Controller for Desk Activity Reports
 */
export function DeskActivityReportController(
    $scope,
    savedReports,
    chartConfig,
    _,
    moment,
    notify,
    $q,
    desks,
    reportConfigs
) {
    function resetParams() {
        $scope.currentParams = _.cloneDeep($scope.defaultReportParams);
    }

    const reportName = 'desk_activity_report';

    /**
     * @ngdoc method
     * @name DeskActivityReportController#init
     * @description Initialises the scope parameters
     */
    this.init = () => {
        $scope.form = {
            deskError: null,
            datesError: null,
            submitted: false,
            showErrors: false,
        };

        this.updateConfig();

        $scope.chartFields = [
            CHART_FIELDS.TITLE,
            CHART_FIELDS.SUBTITLE,
            CHART_FIELDS.TYPE,
        ];

        this.loadDeskSelections();

        this.initDefaultParams();
        savedReports.selectReportFromURL();

        this.chart = chartConfig.newConfig('chart', _.get($scope, 'currentParams.params.chart.type'));
        $scope.updateChartConfig();
        $scope.onIntervalChanged();

        $scope.sourceFilters = [
            'categories',
            'genre',
            'sources',
            'urgency',
            'states',
            'ingest_providers',
        ];

        document.addEventListener('sda-source-filters--clear', resetParams);

        $scope.$on('$destroy', () => {
            document.removeEventListener('sda-source-filters--clear', resetParams);
        });
    };

    this.updateConfig = () => {
        $scope.config = reportConfigs.getConfig(reportName, {
            [REPORT_CONFIG.DATE_FILTERS]: (filter) => {
                const interval = _.get($scope, 'currentParams.params.histogram.interval');

                return _.get(filter, interval);
            },
        });
    };

    /**
     * @ngdoc method
     * @name DeskActivityReportController#initDefaultParams
     * @description Initialises the default report parameters
     */
    this.initDefaultParams = () => {
        $scope.item_states = searchReport.filterItemStates(
            ['published', 'killed', 'corrected', 'recalled']
        );

        $scope.intervals = [{
            qcode: 'hourly',
            name: gettext('Hourly'),
        }, {
            qcode: 'daily',
            name: gettext('Daily'),
        }];

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
                chart: {
                    type: CHART_TYPES.COLUMN,
                    sort_order: 'desc',
                    title: null,
                    subtitle: null,
                },
                histogram: {
                    interval: 'daily',
                },
                desk: null,
            }),
        };

        $scope.defaultReportParams = _.cloneDeep($scope.currentParams);
    };

    /**
     * @ngdoc method
     * @name DeskActivityReportController#loadDeskSelections
     * @description Loads the list of desks for user selection
     */
    this.loadDeskSelections = () => {
        $scope.desks = [];

        return desks.initialize()
            .then(() => {
                $scope.desks = _.get(desks, 'desks._items') || [];
            });
    };

    /**
     * @ngdoc method
     * @name DeskActivityReportController#updateChartConfig
     * @description Updates the local HighchartConfig instance parameters
     */
    $scope.updateChartConfig = () => {
        this.chart.chartType = _.get($scope, 'currentParams.params.chart.type');
        this.chart.sortOrder = _.get($scope, 'currentParams.params.chart.sort_order');
        this.chart.title = _.get($scope, 'currentParams.params.chart.title');
        this.chart.subtitle = _.get($scope, 'currentParams.params.chart.subtitle');

        $scope.form.datesError = null;
    };

    /**
     * @ngdoc method
     * @name DeskActivityReportController#onIntervalChanged
     * @description Updates the available date filters when histogram interval changes
     */
    $scope.onIntervalChanged = () => {
        this.updateConfig();
        $scope.form.datesError = null;
    };

    $scope.onDeskChanged = () => {
        this.validateParams($scope.currentParams.params);
    };

    /**
     * @ngdoc method
     * @name DeskActivityReportController#getIntervalName
     * @description Gets the translated name of the selected histogram interval
     */
    this.getIntervalName = () => {
        const interval = _.get($scope, 'currentParams.params.histogram.interval') || 'daily';

        switch (interval) {
        case 'hourly':
            return gettext('Hourly');
        case 'daily':
        default:
            return gettext('Daily');
        }
    };

    /**
     * @ngdoc method
     * @name DeskActivityReportController#generateTitle
     * @return {String}
     * @description Returns the title to use for the Highcharts config
     */
    $scope.generateTitle = () => {
        if (_.get($scope, 'currentParams.params.chart.title')) {
            return $scope.currentParams.params.chart.title;
        }

        return this.getIntervalName() + ' ' + gettext('Desk Activity');
    };

    /**
     * @ngdoc method
     * @name DeskActivityReportController#generateSubtitle
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
            resetParams();
        }

        $scope.updateChartConfig();
        $scope.onIntervalChanged();
    }, true);

    /**
     * @ngdoc method
     * @name DeskActivityReportController#validateParams
     * @param {Object} params - The report parameters to validate
     * @return {Boolean}
     * @description Returns true if date and desk filters are valid, false if not
     */
    this.validateParams = (params) => {
        $scope.form.deskError = null;

        if (!_.get(params, 'desk')) {
            $scope.form.deskError = gettext('A desk is required');
        }

        return $scope.form.deskError === null && $scope.form.datesError === null;
    };

    /**
     * @ngdoc method
     * @name DeskActivityReportController#generate
     * @description Updates the Highchart configs in the report's content view
     */
    $scope.generate = () => {
        $scope.changeContentView('report');
        $scope.form.submitted = true;
        const params = _.cloneDeep($scope.currentParams.params);

        if (!this.validateParams(params)) {
            $scope.form.showErrors = true;
            return;
        }

        $scope.form.showErrors = false;
        $scope.beforeGenerateChart();

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
                        gettext('Error. The Desk Activity report could not be generated!')
                    )
                );
            });
    };

    /**
     * @ngdoc method
     * @name DeskActivityReportController#createChart
     * @param {Object} report - The report parameters used to search the data
     * @return {Object}
     * @description Generate the Chart and Table configs from the report parameters
     */
    this.createChart = (report) => (
        $q.when({
            charts: [
                this.genChartConfig(report),
                this.genTableConfig(report),
            ],
            wrapCharts: report.chart.type === 'table',
            height500: true,
            fullWidth: true,
            multiChart: false,
            marginBottom: true,
        })
    );

    /**
     * @ngdoc method
     * @name DeskActivityReportController#genChartConfig
     * @param {Object} report - The report statistics/parameters used to generate chart config
     * @return {Object}
     * @description Generates a Highchart config based on the report statistics/parameters
     */
    this.genChartConfig = (report) => {
        // Calculate the UTC Offset in minutes for the start date of the results
        // This will cause an issue if a report crosses over the daylight savings change
        // Any data after the daylight savings change will be 1 hour out
        const utcOffset = getUtcOffsetInMinutes(
            report.start,
            appConfig.defaultTimezone
        );

        const chart = new SDChart.Chart({
            id: reportName,
            chartType: 'highcharts',
            title: $scope.generateTitle(),
            subtitle: $scope.generateSubtitle(),
            startOfWeek: appConfig.start_of_week || appConfig.startingDay || 0,
            timezoneOffset: utcOffset,
            useUTC: false,
            fullHeight: false,
            legendTitle: gettext('Desk Transitions'),
            defaultConfig: chartConfig.defaultConfig,
        });

        chart.setTranslation('desk_transition', gettext('Desk Transitions'), {
            incoming: gettext('Incoming'),
            outgoing: gettext('Outgoing'),
        });

        const axis = chart.addAxis()
            .setOptions({
                type: 'datetime',
                defaultChartType: _.get($scope, 'currentParams.params.chart.type'),
                pointStart: Date.parse(_.get(report, 'start')),
                pointInterval: _.get(report, 'interval'),
                stackLabels: false,
                yTitle: gettext('Desk Activity'),
            });

        axis.addSeries()
            .setOptions({
                field: 'desk_transition',
                name: 'incoming',
                data: _.get(report, 'incoming'),
            });

        axis.addSeries()
            .setOptions({
                field: 'desk_transition',
                name: 'outgoing',
                data: _.get(report, 'outgoing'),
            });

        return chart.genConfig();
    };

    /**
     * @ngdoc method
     * @name DeskActivityReportController#genTableConfig
     * @param {Object} report - The report statistics/parameters used to generate table config
     * @return {Object}
     * @description Generates a table config based on the report statistics/parameters
     */
    this.genTableConfig = (report) => {
        let dateHeader;

        switch ($scope.currentParams.params.histogram.interval) {
        case 'hourly':
            dateHeader = gettext('Date/Time');
            break;
        case 'daily':
        default:
            dateHeader = gettext('Date');
            break;
        }

        const topHeaders = [
            {text: ''},
            {text: gettext('Incoming'), colspan: 7},
            {text: gettext('Outgoing'), colspan: 6},
        ];

        const headers = [
            dateHeader,

            gettext('Total'),
            gettext('Create'),
            gettext('Fetch'),
            gettext('Duplicate'),
            gettext('Sent To'),
            gettext('Deschedule'),
            gettext('Unspike'),

            gettext('Total'),
            gettext('Publish'),
            gettext('Spike'),
            gettext('Sent From'),
            gettext('Publish Scheduled'),
            gettext('Publish Embargo'),
        ];

        const rows = [];

        _.get(report, 'histogram', []).forEach(
            (activity) => {
                let dateFormat;

                switch ($scope.currentParams.params.histogram.interval) {
                case 'hourly':
                    dateFormat = 'MMM Do HH:mm';
                    break;
                case 'daily':
                default:
                    dateFormat = 'MMM Do';
                    break;
                }

                let totalIncoming = 0;
                const incomingRows = ENTER_DESK_OPERATIONS.map(
                    (field) => {
                        const count = _.get(activity, `incoming[${field}]`, 0);

                        totalIncoming += count;
                        return count;
                    }
                );

                let totalOutgoing = 0;
                const outgoingRows = EXIT_DESK_OPERATIONS.map(
                    (field) => {
                        const count = _.get(activity, `outgoing[${field}]`, 0);

                        totalOutgoing += count;
                        return count;
                    }
                );

                rows.push([].concat(
                    moment(_.get(activity, 'interval', '')).format(dateFormat),
                    totalIncoming,
                    incomingRows,
                    totalOutgoing,
                    outgoingRows
                ));
            }
        );

        return {
            id: 'desk_report_table',
            type: 'table',
            chart: {type: 'column'},
            top_headers: topHeaders,
            headers: headers,
            title: gettext('Desk Activity'),
            rows: rows,
        };
    };

    /**
     * @ngdoc method
     * @name DeskActivityReportController#getReportParams
     * @return {Promise}
     * @description Returns the current report parameters
     */
    $scope.getReportParams = () => (
        $q.when(_.cloneDeep($scope.currentParams))
    );

    this.init();
}
