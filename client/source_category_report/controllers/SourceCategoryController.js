import {generateSubtitle, getErrorMessage} from '../../utils';

SourceCategoryController.$inject = [
    '$scope',
    'gettext',
    'moment',
    'config',
    'lodash',
    'searchReport',
    'notify',
    'sourceCategoryChart',
    'savedReports',
    '$rootScope',
    'session',
    '$location',
];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.source-category-report
 * @name SourceCategoryController
 * @requires gettext
 * @requires moment
 * @requires config
 * @requires lodash
 * @requires searchReport
 * @requires notify
 * @requires sourceCategoryChart
 * @requires savedReports
 * @requires $rootScope
 * @requires session
 * @requires $location
 * @description Controller for Source/Category reports
 */
export function SourceCategoryController(
    $scope,
    gettext,
    moment,
    config,
    _,
    searchReport,
    notify,
    sourceCategoryChart,
    savedReports,
    $rootScope,
    session,
    $location
) {
    /**
     * @ngdoc method
     * @name SourceCategoryController#init
     * @description Initializes the scope parameters for use with the form and charts
     */
    this.init = () => {
        $scope.categories = [];
        $scope.sources = [];
        $scope.currentTab = 'parameters';
        $scope.currentPanel = 'advanced';

        this.initDefaultParams();

        this.deregisterReportsUpdate = $rootScope.$on(
            'savedreports:update',
            angular.bind(this, this.onSavedReportUpdated)
        );
        $scope.$on('$destroy', angular.bind(this, this.onDestroy));
    };

    /**
     * @ngdoc method
     * @name SourceCategoryController#initDefaultParams
     * @description Sets the default report parameters
     */
    this.initDefaultParams = () => {
        $scope.item_states = [{
            qcode: 'published',
            name: gettext('Published'),
            default_exclude: false,
        }, {
            qcode: 'killed',
            name: gettext('Killed'),
            default_exclude: false,
        }, {
            qcode: 'corrected',
            name: gettext('Corrected'),
            default_exclude: false,
        }, {
            qcode: 'recalled',
            name: gettext('Recalled'),
            default_exclude: false,
        }];

        $scope.chart_types = [{
            qcode: 'bar',
            name: gettext('Bar'),
        }, {
            qcode: 'column',
            name: gettext('Column'),
        }, {
            qcode: 'pie',
            name: gettext('Pie'),
        }, {
            qcode: 'scatter',
            name: gettext('Scatter'),
        }, {
            qcode: 'table',
            name: gettext('Table'),
        }];

        $scope.currentTemplate = {};

        $scope.currentParams = {
            params: {},
            report: 'source_category_report',
        };

        $scope.currentParams.params = {
            start_date: moment()
                .subtract(30, 'days')
                .format(config.view.dateformat),
            end_date: moment().format(config.view.dateformat),
            chart_type: $scope.chart_types[0].qcode,
            repos: {
                ingest: false,
                archive: false,
                published: true,
                archived: true,
            },
            date_filter: 'range',
            min: 1,
            max: null,
            sort_order: 'desc',
            categories: {},
            sources: {},
            exclude_rewrites: false,
        };

        // Set the default values for excluded_states for the form
        $scope.currentParams.params.excluded_states = _.mapValues(
            _.keyBy($scope.item_states, 'qcode'),
            (state) => state.default_exclude
        );

        $scope.defaultReportParams = _.cloneDeep($scope.currentParams);

        // If a savedReport (template) is in the url, then load and apply its values
        if ($location.search().template) {
            savedReports.fetchById($location.search().template)
                .then((savedReport) => {
                    $scope.selectReport(savedReport);
                }, (error) => {
                    if (_.get(error, 'status') === 404) {
                        notify.error(gettext('Saved report not found!'));
                    } else {
                        notify.error(
                            getErrorMessage(error, gettext('Failed to load the saved report!'))
                        );
                    }
                });
        }
    };

    /**
     * @ngdoc method
     * @name SourceCategoryController#isDirty
     * @returns {boolean}
     * @description Returns true if the report parameters are not equal to the default parameters
     */
    $scope.isDirty = () => !_.isEqual($scope.currentParams, $scope.defaultReportParams);

    /**
     * @ngdoc method
     * @name SourceCategoryController#clearFilters
     * @description Sets the current report parameters to the default values, and clears the currently
     * selected saved report/template
     */
    $scope.clearFilters = () => {
        $scope.currentParams = _.cloneDeep($scope.defaultReportParams);
        $scope.currentTemplate = {};
        $location.search('template', null);
    };

    /**
     * @ngdoc method
     * @name SourceCategoryController#selectReport
     * @param {object} selectedReport - The saved report/template to select
     * @description Selects the provided saved report/template and sets the form values
     */
    $scope.selectReport = (selectedReport) => {
        $scope.currentTemplate = _.cloneDeep(selectedReport);
        $scope.currentParams = _.cloneDeep(selectedReport);
        $scope.changePanel('advanced');
        $location.search('template', _.get(selectedReport, '_id'));
    };

    /**
     * @ngdoc method
     * @name SourceCategoryController#onReportSaved
     * @param {Promise<object>} response - Promise with the API save response
     * @description If the save is successful, select that report and notify the user, otherwise notify the
     * user if the save fails
     */
    $scope.onReportSaved = (response) => (
        response.then((savedReport) => {
            $scope.selectReport(savedReport);
            notify.success(gettext('Report saved!'));
        }, (error) => {
            notify.error(
                getErrorMessage(error, gettext('Failed to delete the saved report!'))
            );
        })
    );

    /**
     * @ngdoc method
     * @name SourceCategoryController#onReportDeleted
     * @param {Promise<object>} response - Promise with the API remove response
     * @description Notify the user of the result when deleting a saved report
     */
    $scope.onReportDeleted = (response) => (
        response.then(() => {
            notify.success(gettext('Report deleted!'));
        }, (error) => {
            notify.error(
                getErrorMessage(error, gettext('Failed to delete the saved report!'))
            );
        })
    );

    /**
     * @ngdoc method
     * @name SourceCategoryController#onDestroy
     * @description Make sure to reset the defaultReportParams to empty object on controller destruction
     */
    this.onDestroy = () => {
        $scope.defaultReportParams = {};
        this.deregisterReportsUpdate();
    };

    /**
     * @ngdoc method
     * @name SourceCategoryController#onSavedReportUpdated
     * @param {object} event - The websocket event object
     * @param {object} data - The websocket data (saved report details)
     * @description Respond when a saved report is created/updated/deleted
     * (from a websocket notification from the server)
     */
    this.onSavedReportUpdated = (event, data) => {
        const reportType = _.get(data, 'report_type');
        const operation = _.get(data, 'operation');
        const reportId = _.get(data, 'report_id');
        const userId = _.get(data, 'user_id');
        const sessionId = _.get(data, 'session_id');

        const currentUserId = _.get(session, 'identity._id');
        const currentSessionId = _.get(session, 'sessionId');

        // Disregard if this update is not the same type as this report
        if (reportType !== 'source_category_report') {
            return;
        }

        // Disregard if this update is not for the currently used template
        if (reportId !== _.get($scope.currentTemplate, '_id')) {
            return;
        }

        if (operation === 'delete') {
            // If the saved report was deleted, then unset the currentTemplate
            $scope.$applyAsync(() => {
                $scope.currentTemplate = {};

                // Remove the saved report ID from the url parameters
                $location.search('template', null);

                if (sessionId !== currentSessionId) {
                    notify.warning(gettext('The Saved Report you are using was deleted!'));
                }
            });
        } else if (operation === 'update' && userId !== currentUserId) {
            // Otherwise if this report was updated in a different session,
            // then notify the current user
            $scope.$applyAsync(() => {
                notify.warning(gettext('The Saved Report you are using was updated!'));
            });
        }
    };

    /**
     * @ngdoc method
     * @name SourceCategoryController#runQuery
     * @returns {Promise<Object>} - Search API query response
     * @description Sends the current form parameters to the search API
     */
    this.runQuery = () => searchReport.query('source_category_report', $scope.currentParams.params);

    /**
     * @ngdoc method
     * @name SourceCategoryController#updateSources
     * @param {object} data - Aggregation data retrieved from the Search API
     * @description Updates the list of available sources based on the aggregation data
     */
    this.updateSources = (data) => {
        $scope.sources = _.isEmpty(data.sources) ?
            [] :
            Object.keys(data.sources);

        $scope.sources.forEach((source) => {
            $scope.currentParams.params.sources[source] = $scope.currentParams.params.sources[source] || false;
        });

        Object.keys($scope.currentParams.params.sources).forEach((source) => {
            if (!_.get(data.sources, source)) {
                delete $scope.currentParams.params.sources[source];
            }
        });
    };

    /**
     * @ngdoc method
     * @name SourceCategoryController#updateCategories
     * @param {object} data - Aggregation data retrieved from the Search API
     * @description Updates the list of available categories based on the aggregation data
     */
    this.updateCategories = (data) => {
        let categories = _.filter(
            Object.keys(data.categories),
            (category) => data.categories[category] >= $scope.currentParams.params.min
        );

        $scope.categories = _.isEmpty(categories) ?
            [] :
            categories;

        $scope.categories.forEach((category) => {
            $scope.currentParams.params.categories[category] =
                $scope.currentParams.params.categories[category] || false;
        });

        Object.keys($scope.currentParams.params.categories).forEach((category) => {
            if (!_.get(data.categories, category)) {
                delete $scope.currentParams.params.categories[category];
            }
        });
    };

    /**
     * @ngdoc method
     * @name SourceCategoryController#generate
     * @description Using the current form parameters, query the Search API and update the chart configs
     */
    $scope.generate = () => {
        this.runQuery().then((data) => {
            const reportData = Object.assign({}, data, {
                chart_type: $scope.currentParams.params.chart_type,
                title: $scope.currentParams.params.title,
                subtitle: $scope.currentParams.params.subtitle,
                min: $scope.currentParams.params.min,
                max: $scope.currentParams.params.max,
                date_filter: $scope.currentParams.params.date_filter,
                start_date: $scope.currentParams.params.start_date,
                end_date: $scope.currentParams.params.end_date,
                sort_order: $scope.currentParams.params.sort_order,
            });

            $scope.changeReportParams(
                sourceCategoryChart.createChart(reportData)
            );
        }, (error) => {
            notify.error(angular.isDefined(error.data._message) ?
                error.data._message :
                gettext('Error. The source category report could not be generated.')
            );
        });
    };

    /**
     * @ngdoc method
     * @name SourceCategoryController#generateSubtitilePlaceholder
     * @return {String}
     * @description Based on the date filters, returns the placeholder to use for the subtitle
     */
    $scope.generateSubtitlePlaceholder = () => generateSubtitle(moment, config, $scope.currentParams.params);

    /**
     * @ngdoc method
     * @name SourceCategoryController#onDateFilterChange
     * @description When the date filter changes, clear the date input fields if the filter is not 'range'
     */
    $scope.onDateFilterChange = () => {
        if ($scope.currentParams.params.date_filter !== 'range') {
            $scope.currentParams.params.start_date = null;
            $scope.currentParams.params.end_date = null;
        }
    };

    /**
     * @ngdoc method
     * @name SourceCategoryController#onDateChange
     * @description Auto-selects 'range' as the date filter if the user inputs a date
     */
    $scope.onDateChange = function() {
        if ($scope.currentParams.params.date_filter !== 'range') {
            $scope.currentParams.params.date_filter = 'range';
        }
    };

    /**
     * @ngdoc method
     * @name SourceCategoryController#changeTab
     * @param {String} tabName - The name of the tab to change to
     * @description Changes the current inner tab to use in the side panel
     */
    $scope.changeTab = (tabName) => {
        if ($scope.currentTab === tabName) {
            return;
        }

        $scope.currentTab = tabName;
        if ($scope.currentTab === 'filters') {
            this.runQuery().then((data) => {
                this.updateSources(data);
                this.updateCategories(data);
            });
        }
    };

    /**
     * @ngdoc method
     * @name SourceCategoryController#changePanel
     * @param {String} panelName - The name of the panel to change to
     * @description Changes the current outter tab (panel) to use in the side panel
     */
    $scope.changePanel = (panelName) => {
        $scope.currentPanel = panelName;
    };

    this.init();
}
