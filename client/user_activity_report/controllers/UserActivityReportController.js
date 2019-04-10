import {
    getErrorMessage,
    getUtcOffsetInMinutes,
    getTranslatedOperations,
    compileAndGetHTML,
} from '../../utils';
import {DATE_FILTERS} from '../../search/common';
import {SOURCE_FILTERS} from '../../search/directives/SourceFilters';
import {CHART_FIELDS} from '../../charts/directives/ChartOptions';
import {SDChart} from '../../charts/SDChart';

UserActivityReportController.$inject = [
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
    'userList',
    '$timeout',
    '$compile',
    'reportConfigs',
];

/**
 * @ngdoc controller
 * @module superdesk.analytics.user-activity-report
 * @name UserActivityReportController
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
 * @requires userList
 * @requires $timeout
 * @requires $compile
 * @requires reportConfigs
 * @description Controller for User Activity Reports
 */
export function UserActivityReportController(
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
    userList,
    $timeout,
    $compile,
    reportConfigs
) {
    const reportName = 'user_activity_report';

    /**
     * @ngdoc method
     * @name UserActivityReportController#init
     * @description Initialises the scope parameters
     */
    this.init = () => {
        $scope.config = reportConfigs.getConfig(reportName);
        $scope.form = {
            submitted: false,
            userError: null,
            datesError: null,
        };

        $scope.chartFields = [
            CHART_FIELDS.TITLE,
            CHART_FIELDS.SUBTITLE,
        ];

        this.loadUserSelections();

        this.initDefaultParams();
        savedReports.selectReportFromURL();

        this.chart = chartConfig.newConfig('chart', _.get($scope, 'currentParams.params.chart.type'));
        $scope.updateChartConfig();

        $scope.sourceFilters = [
            SOURCE_FILTERS.CATEGORIES,
            SOURCE_FILTERS.GENRE,
            SOURCE_FILTERS.SOURCES,
            SOURCE_FILTERS.URGENCY,
            SOURCE_FILTERS.STATES,
            SOURCE_FILTERS.INGEST_PROVIDERS,
        ];

        $scope.translatedOperations = getTranslatedOperations(gettext);
        $scope.selectedItem = null;
    };

    /**
     * @ngdoc method
     * @name UserActivityReportController#initDefaultParams
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
                    filter: DATE_FILTERS.DAY,
                    date: moment().format(config.model.dateformat),
                },
                must: {
                    user_locks: null,
                },
                must_not: {},
                chart: {
                    title: null,
                    subtitle: null,
                },
                size: 200,
            }),
        };

        $scope.defaultReportParams = _.cloneDeep($scope.currentParams);
    };

    /**
     * @ngdoc method
     * @name UserActivityReportController#loadUserSelections
     * @description Loads the list of user for selection
     */
    this.loadUserSelections = () => {
        $scope.users = [];
        $scope.usersById = {};

        return userList.getAll()
            .then((users) => {
                $scope.users = users || [];
                $scope.usersById = _.keyBy(users, '_id');
            });
    };

    /**
     * @ngdoc method
     * @name UserActivityReportController#updateChartConfig
     * @description Updates the local HighchartConfig instance parameters
     */
    $scope.updateChartConfig = () => {
        this.chart.chartType = _.get($scope, 'currentParams.params.chart.type');
        this.chart.sortOrder = _.get($scope, 'currentParams.params.chart.sort_order');
        this.chart.title = _.get($scope, 'currentParams.params.chart.title');
        this.chart.subtitle = _.get($scope, 'currentParams.params.chart.subtitle');
    };

    /**
     * @ngdoc method
     * @name UserActivityReportController#generateTitle
     * @return {String}
     * @description Returns the title to use for the Highcharts config
     */
    $scope.generateTitle = () => {
        if (_.get($scope, 'currentParams.params.chart.title')) {
            return $scope.currentParams.params.chart.title;
        }

        const userId = _.get($scope, 'currentParams.params.must.user_locks');
        const userName = (_.get($scope.usersById, userId) || {}).display_name || '';

        return gettext('User Activity - ') + userName;
    };

    /**
     * @ngdoc method
     * @name UserActivityReportController#generateSubtitle
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
    });

    /**
     * @ngdoc method
     * @name UserActivityReportController#validateParams
     * @return {boolean}
     * @description Validates is a user has been selected or not
     */
    $scope.validateParams = () => {
        $scope.form.userError = null;

        if (!$scope.currentParams.params.must.user_locks) {
            $scope.form.userError = gettext('A user is required');
        }

        return $scope.form.userError === null && $scope.form.datesError === null;
    };

    /**
     * @ngdoc method
     * @name UserActivityReportController#generate
     * @description Updates the Highchart configs in the report's content view
     */
    $scope.generate = (selectedItem = null) => {
        $scope.changeContentView('report');
        $scope.form.submitted = true;
        $scope.previousSelectedItem = $scope.selectedItem;
        $scope.selectedItem = selectedItem;

        if (!$scope.validateParams()) {
            $scope.form.showErrors = true;
            return;
        }

        $scope.form.showErrors = false;
        $scope.beforeGenerateChart();

        const params = _.cloneDeep($scope.currentParams.params);

        return $scope.runQuery(params)
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
     * @name UserActivityReportController#createChart
     * @param {Object} report - The report parameters used to search the data
     * @return {Object}
     * @description Generate the Chart and Table configs from the report parameters
     */
    this.createChart = (report) => {
        const items = _.get(report, 'items', []);
        let configs = [];

        if (items.length > 0) {
            // If the currently selected news item is still available in the new generated report
            // then continue to show the news item's timeline
            if ($scope.selectedItem === null &&
                items.findIndex((item) => _.get(item, '_id') === _.get($scope, 'previousSelectedItem._id')) > -1
            ) {
                $scope.selectedItem = $scope.previousSelectedItem;
            }

            configs.push(this.genChartConfig(report));

            if ($scope.selectedItem !== null) {
                const itemConfig = this.genItemConfig(report);

                if (itemConfig !== null) {
                    configs.push(itemConfig);
                }
            }
        }

        return $q.when({
            charts: configs,
            wrapCharts: report.chart.type === 'table',
            height500: false,
            fullWidth: true,
            fullHeight: false,
            multiChart: false,
            marginBottom: true,
        });
    };

    /**
     * @ngdoc method
     * @name UserActivityReportController#getUtcOffset
     * @param {Object} report
     * @return {Number}
     * @description returns the UTC offset in minutes for the given report
     */
    this.getUtcOffset = (report) => (
        // Calculate the UTC Offset in minutes for the start date of the results
        // This will cause an issue if a report crosses over the daylight savings change
        // Any data after the daylight savings change will be 1 hour out
        getUtcOffsetInMinutes(
            report.start,
            config.defaultTimezone,
            moment
        )
    );

    /**
     * @ngdoc method
     * @name UserActivityReportController#getOperationsFromTimeline
     * @param {Number} start - The start timestamp in ms
     * @param {Number} finish - The finish timestamp in ms
     * @param {Object} item - The timeline of operations
     * @return {Array<String>}
     * @description Filters the list of timeline entries based on the range given, and returns the
     * translated operation names
     */
    this.getOperationsFromTimeline = (start, finish, item) => (
        _.filter(
            item.timeline,
            (entry) => (
                (_.get(entry, 'operation_timestamp', 0) * 1000) >= start &&
                (_.get(entry, 'operation_timestamp', 0) * 1000) <= finish
            )
        ).map(
            (entry) => _.get($scope.translatedOperations, entry.operation) || entry.operation
        )
    );

    /**
     * @ngdoc method
     * @name UserActivityReportController#genChartConfig
     * @param {Object} report - The report statistics/parameters used to generate chart config
     * @return {Object}
     * @description Generates the Highchart config for the users activity for the chosen day
     */
    this.genChartConfig = (report) => {
        const utcOffset = this.getUtcOffset(report);
        let min = _.get(report, 'min') * 1000;
        let max = _.get(report, 'max') * 1000;
        let duration = max - min;

        // Adds a margin around the entire chart
        min -= duration * 0.01;
        max += duration * 0.01;
        duration = max - min;

        // Minimum size that an entry should be (100 steps in the chart)
        const threshold = duration * 0.01;

        const onPointClick = (event) => {
            $scope.generate(items[event.point.y])
                .then(() => {
                    // After the new item timeline report is rendered
                    // Scroll it into view
                    $timeout(() => {
                        $scope.$applyAsync(() => {
                            const ele = document.getElementById('item_timeline_report');

                            ele.scrollIntoView();
                        });
                    }, 100);
                });
        };

        const generateTooltip = (event) => {
            const point = event.chart.hoverPoint;
            const item = items[point.y];
            const operations = this.getOperationsFromTimeline(point.x, point.x2, item);

            return compileAndGetHTML(
                $compile,
                $scope,
                '<sda-user-activity-report-tooltip></sda-user-activity-report-tooltip>',
                {
                    item: item,
                    point: point,
                    operations: operations,
                }
            );
        };

        const chart = new SDChart.Chart({
            id: reportName,
            chartType: 'highcharts',
            title: $scope.generateTitle(),
            subtitle: $scope.generateSubtitle(),
            timezoneOffset: utcOffset,
            useUTC: false,
            fullHeight: false,
            onPointClick: onPointClick,
            tooltipFormatter: generateTooltip,
            defaultConfig: chartConfig.defaultConfig,
        });

        const axis = chart.addAxis()
            .setOptions({
                type: 'datetime',
                defaultChartType: 'xrange',
                xMin: min,
                xMax: max,
                yTitle: gettext('Slugline'),
            });

        const data = [];
        const categories = [];
        const items = [];

        let index = 0;

        (_.get(report, 'items') || []).forEach(
            (item) => {
                let currentLocks = null;

                (_.get(item, 'activity') || []).forEach(
                    (locks) => {
                        // Convert timestamps to ms
                        locks[0] = locks[0] * 1000;
                        locks[1] = locks[1] * 1000;

                        if (currentLocks === null) {
                            currentLocks = {
                                x: locks[0],
                                x2: locks[1],
                                y: index,
                            };
                        } else if (locks[0] - currentLocks.x2 < threshold) {
                            // If the new lock is too close to the previous lock then merge them into the one
                            // This ensures no single entry is too small (i.e. the threshold)
                            currentLocks.x2 = locks[1];
                        } else {
                            if (currentLocks.x2 - currentLocks.x < threshold) {
                                // If the current locks are too small for the report
                                // then extend them using the minimum threshold
                                currentLocks.x2 += threshold - (currentLocks.x2 - currentLocks.x);
                            }

                            data.push(currentLocks);
                            currentLocks = {
                                x: locks[0],
                                x2: locks[1],
                                y: index,
                            };
                        }
                    }
                );

                if ((currentLocks.x2 - currentLocks.x) < threshold) {
                    // If the current locks are too small for the report
                    // then extend them using the minimum threshold
                    currentLocks.x2 += threshold - (currentLocks.x2 - currentLocks.x);
                }

                data.push(currentLocks);

                categories.push(_.get(item, 'slugline'));
                items.push(item);
                index += 1;
            }
        );

        // Dynamically calculates the height of the chart (200 if there is only 1 entry)
        chart.height = index === 1 ?
            100 :
            100 + (index * 25);

        axis.addSeries()
            .setOptions({
                data: data,
                groupPadding: 0,
                pointPadding: 0,
                borderWidth: 0,
                maxPointWidth: 15,
            });

        const conf = chart.genConfig();

        conf.yAxis[0].categories = categories;
        conf.yAxis[0].reversed = true;
        conf.xAxis.push(_.cloneDeep(conf.xAxis[0]));
        conf.xAxis[1].linkedTo = 0;
        conf.xAxis[1].opposite = true;
        return conf;
    };

    /**
     * @ngdoc method
     * @name UserActivityReportController#genItemConfig
     * @param {Object} report - The report statistics/parameters used to generate chart config
     * @return {Object}
     * @description Generates a Highchart config for the item timeline
     */
    this.genItemConfig = (report) => {
        const utcOffset = this.getUtcOffset(report);
        const timeline = _.get($scope.selectedItem, 'timeline') || [];
        const first = _.first(timeline);
        const last = _.last(timeline);

        if (!first || !last) {
            return null;
        }

        let min = _.get(first, 'operation_timestamp') * 1000;
        let max = _.get(last, 'operation_timestamp') * 1000;
        let duration = max - min;

        // Adds a margin around the entire chart
        min -= duration * 0.05;
        max += duration * 0.05;

        const operations = _.uniq(timeline.map((entry) => entry.operation));
        const operationToIndex = {};
        const tooltips = {};

        _.forEach(operations, (name, index) => {
            operationToIndex[name] = index;
        });

        const generateTooltip = (event) => (
            compileAndGetHTML(
                $compile,
                $scope,
                '<sda-item-timeline-tooltip></sda-item-timeline-tooltip>',
                tooltips[event.chart.hoverPoint.x].data
            )
        );

        const chart = new SDChart.Chart({
            id: 'item_timeline_report',
            chartType: 'highcharts',
            title: _.get($scope.selectedItem, 'slugline') + ' - ' + _.get($scope.selectedItem, 'headline'),
            subtitle: gettext('Timeline'),
            timezoneOffset: utcOffset,
            useUTC: false,
            fullHeight: false,
            tooltipFormatter: generateTooltip,
            legendTitle: gettext('Users'),
            defaultConfig: chartConfig.defaultConfig,
        });

        const axis = chart.addAxis()
            .setOptions({
                type: 'datetime',
                defaultChartType: 'spline',
                yAxisLabelFormat: null,
                xMin: min,
                xMax: max,
            });

        let colourIndex = 0;
        const userTimelines = {};

        _.forEach(timeline, (entry) => {
            const operation = _.get(entry, 'operation');
            const timestamp = _.get(entry, 'operation_timestamp') * 1000;
            const userId = _.get(entry, 'task.user');

            if (!_.get(userTimelines, userId)) {
                userTimelines[userId] = {
                    data: [],
                    colour: colourIndex,
                    name: _.get($scope.usersById, userId, {}).display_name || '',
                };

                // Increase the colourIndex so the next unique user
                // gets a different colour in the chart
                colourIndex += 1;
                if (colourIndex > 9) {
                    colourIndex = 0;
                }
            }

            const userTimeline = userTimelines[userId];
            const lastOperation = _.last(userTimeline.data);

            // If the previous lock was an unlock, then add a break in the report
            // This segments out the different actions and their operations on this item
            if ((userTimeline.data.length > 1 && operation === 'item_lock') ||
                _.get(lastOperation, 'operation') === 'item_unlock'
            ) {
                userTimeline.data.push({
                    x: timestamp,
                    y: null,
                });
            }

            userTimeline.data.push({
                x: timestamp,
                y: _.get(operationToIndex, operation),
                marker: {enabled: true},
            });

            if (!_.get(tooltips, timestamp)) {
                tooltips[timestamp] = {
                    operations: [],
                    user: userId,
                };
            }

            tooltips[timestamp].operations.push($scope.translatedOperations[operation]);
        });

        // Combine the data used to generate the tooltips
        Object.keys(tooltips).forEach((timestamp) => {
            const tooltip = tooltips[timestamp];

            tooltips[timestamp].data = {
                timestamp: timestamp,
                userName: _.get($scope.usersById, tooltip.user, {}).display_name || '',
                operations: tooltip.operations,
            };
        });

        // For each user, add a new series to the chart
        Object.keys(userTimelines).forEach((userId) => {
            const userTimeline = userTimelines[userId];

            axis.addSeries()
                .setOptions({
                    name: userTimeline.name,
                    data: userTimeline.data,
                    colourIndex: userTimeline.colour,
                    dataLabelConfig: {
                        enabled: true,
                        shape: 'callout',
                        y: -10,
                        formatter: function() {
                            return $scope.translatedOperations[operations[this.y]];
                        },
                    },
                });
        });

        return chart.genConfig();
    };

    /**
     * @ngdoc method
     * @name UserActivityReportController#getReportParams
     * @return {Promise}
     * @description Returns the current report parameters
     */
    $scope.getReportParams = () => (
        $q.when(_.cloneDeep($scope.currentParams))
    );

    this.init();
}
