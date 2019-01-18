import {
    getErrorMessage,
    getUtcOffsetInMinutes,
    ENTER_DESK_OPERATIONS,
    EXIT_DESK_OPERATIONS,
} from '../../utils';
import {DATE_FILTERS} from '../../search/directives/DateFilters';
import {SDChart} from '../../charts/SDChart';

DeskActivityReportController.$inject = [
    '$scope',
    'savedReports',
    'chartConfig',
    'lodash',
    'searchReport',
    'moment',
    'notify',
    'gettext',
    'gettextCatalog',
    '$q',
    'config',
    'deployConfig',
    'desks',
];

/**
 * @ngdoc controller
 * @module superdesk.analytics.desk-activity-report
 * @name DeskActivityReportController
 * @requires $scope
 * @requires savedReports
 * @requires chartConfig
 * @requires lodash
 * @requires searchReport
 * @requires moment
 * @requires notify
 * @requires gettext
 * @requires gettextCatalog
 * @requires $q
 * @requires config
 * @requires deployConfig
 * @requires desks
 * @description Controller for Desk Activity Reports
 */
export function DeskActivityReportController(
    $scope,
    savedReports,
    chartConfig,
    _,
    searchReport,
    moment,
    notify,
    gettext,
    gettextCatalog,
    $q,
    config,
    deployConfig,
    desks
) {
    /**
     * @ngdoc method
     * @name DeskActivityReportController#init
     * @description Initialises the scope parameters
     */
    this.init = () => {
        $scope.currentTab = 'parameters';

        $scope.form = {
            deskError: null,
            datesError: null,
        };

        $scope.dateFilters = [];

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

        $scope.chart_types = chartConfig.filterChartTypes(
            ['bar', 'column']
        );

        $scope.intervals = [{
            qcode: 'hourly',
            name: gettext('Hourly'),
        }, {
            qcode: 'daily',
            name: gettext('Daily'),
        }];

        $scope.currentParams = {
            report: 'desk_activity_report',
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
                repos: {archive_statistics: true},
                chart: {
                    type: _.get($scope, 'chart_types[1].qcode') || 'column',
                    sort_order: 'desc',
                    title: null,
                    subtitle: null,
                },
                histogram: {
                    interval: 'daily',
                },
                desk: null,
            },
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
        if ($scope.currentParams.params.histogram.interval === 'hourly') {
            $scope.dateFilters = [
                DATE_FILTERS.YESTERDAY,
                DATE_FILTERS.DAY,
                DATE_FILTERS.RELATIVE,
            ];
        } else {
            $scope.dateFilters = [
                DATE_FILTERS.LAST_WEEK,
                DATE_FILTERS.LAST_MONTH,
                DATE_FILTERS.RANGE,
                DATE_FILTERS.RELATIVE_DAYS,
            ];
        }

        // If the current date filter is no longer available after changing interval type
        // Then default to the first available date filter
        if ($scope.dateFilters.indexOf($scope.currentParams.params.dates.filter) < 0) {
            $scope.currentParams.params.dates.filter = $scope.dateFilters[0];
        }

        $scope.form.datesError = null;
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

    $scope.$watch(() => savedReports.currentReport._id, (newReportId) => {
        if (newReportId) {
            $scope.currentParams = _.cloneDeep(savedReports.currentReport);
            $scope.changePanel('advanced');
        } else {
            $scope.currentParams = _.cloneDeep($scope.defaultReportParams);
        }

        $scope.updateChartConfig();
        $scope.onIntervalChanged();
    });

    /**
     * @ngdoc method
     * @name DeskActivityReportController#runQuery
     * @param {Object} params - The report parameters used to search the data
     * @return {Object}
     * @description Queries the DeskActivityReport API and returns it's response
     */
    $scope.runQuery = (params) => searchReport.query(
        'desk_activity_report',
        params,
        true
    );

    /**
     * @ngdoc method
     * @name DeskActivityReportController#validateParams
     * @param {Object} params - The report parameters to validate
     * @return {Boolean}
     * @description Returns true if date and desk filters are valid, false if not
     */
    this.validateParams = (params) => {
        $scope.form.deskError = null;
        $scope.form.datesError = null;

        this.validateDesk(params);
        this.validateDates(params);

        return $scope.form.deskError === null && $scope.form.datesError === null;
    };

    /**
     * @ngdoc method
     * @name DeskActivityReportController#validateDesk
     * @param {Object} params - The report parameters to validate
     * @description Validates desk parameter
     */
    this.validateDesk = (params) => {
        if (!_.get(params, 'desk')) {
            $scope.form.deskError = gettext('A desk is required');
        }
    };

    /**
     * @ngdoc method
     * @name DeskActivityReportController#validateDates
     * @param {Object} params - The report parameters to validate
     * @description Validates date parameters
     */
    this.validateDates = (params) => {
        const interval = _.get(params, 'histogram.interval');
        const dates = _.get(params, 'dates');
        const dateFilter = _.get(dates, 'filter');

        if (interval === 'daily') {
            if (dateFilter === 'range') {
                if (!dates.start || !dates.end) {
                    $scope.form.datesError = gettext('Start and End dates is required');
                } else if (moment(dates.end).diff(moment(dates.start), 'days') > 31) {
                    $scope.form.datesError = gettext('Range cannot be greater than 31 days');
                }
            } else if (dateFilter === 'relative_days' && !dates.relative_days) {
                $scope.form.datesError = gettext('Number of days is required');
            }
        } else if (interval === 'hourly') {
            if (dateFilter === 'day' && !dates.date) {
                $scope.form.datesError = gettext('Date field is required');
            } else if (dateFilter === 'relative' && !dates.relative) {
                $scope.form.datesError = gettext('Number of hours is required');
            }
        }
    };

    /**
     * @ngdoc method
     * @name DeskActivityReportController#generate
     * @description Updates the Highchart configs in the report's content view
     */
    $scope.generate = () => {
        $scope.changeContentView('report');

        const params = _.cloneDeep($scope.currentParams.params);

        if (!this.validateParams(params)) {
            return;
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
                        gettext('Error. The Desk Activity report could not be generated!')
                    )
                );
            });
    };

    /**
     * @ngdoc method
     * @name DeskActivityReportController#changeTab
     * @param {String} tabName - The name of the tab to change to
     * @description Change the current tab in the filters panel
     */
    $scope.changeTab = (tabName) => {
        $scope.currentTab = tabName;
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
            config.defaultTimezone,
            moment
        );

        const chart = new SDChart.Chart({
            id: 'desk_activity_report',
            chartType: 'highcharts',
            title: $scope.generateTitle(),
            subtitle: $scope.generateSubtitle(),
            startOfWeek: deployConfig.getSync('start_of_week', 0),
            timezoneOffset: utcOffset,
            useUTC: false,
            fullHeight: true,
            legendTitle: gettext('Desk Transitions'),
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
