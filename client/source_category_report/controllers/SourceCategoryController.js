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
    '$q',
    'chartConfig',
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
 * @requires $q
 * @requires chartConfig
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
    $q,
    chartConfig
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

        this.initDefaultParams();
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

        $scope.currentParams = {
            report: 'source_category_report',
            params: {
                start_date: moment()
                    .subtract(30, 'days')
                    .format(config.model.dateformat),
                end_date: moment().format(config.model.dateformat),
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
                must: {
                    categories: {},
                    sources: {},
                },
                must_not: {
                    rewrites: false,
                    states: {},
                },
            },
        };

        // Set the default values for excluded_states for the form
        $scope.currentParams.params.must_not.states = _.mapValues(
            _.keyBy($scope.item_states, 'qcode'),
            (state) => state.default_exclude
        );

        $scope.defaultReportParams = _.cloneDeep($scope.currentParams);

        savedReports.selectReportFromURL();
    };

    /**
     * @ngdoc method
     * @name SourceCategoryController#isDirty
     * @returns {boolean}
     * @description Returns true if the report parameters are not equal to the default parameters
     */
    $scope.isDirty = () => !_.isEqual($scope.currentParams, $scope.defaultReportParams);

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
     * @name SourceCategoryController#runQuery
     * @param {Object} params - Parameters used for searching the API
     * @returns {Promise<Object>} - Search API query response
     * @description Sends the current form parameters to the search API
     */
    this.runQuery = (params) => searchReport.query(
        'source_category_report',
        params
    );

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
            $scope.currentParams.params.must.sources[source] =
                $scope.currentParams.params.must.sources[source] || false;
        });

        Object.keys($scope.currentParams.params.must.sources).forEach((source) => {
            if (!_.get(data.sources, source)) {
                delete $scope.currentParams.params.must.sources[source];
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
            $scope.currentParams.params.must.categories[category] =
                $scope.currentParams.params.must.categories[category] || false;
        });

        Object.keys($scope.currentParams.params.must.categories).forEach((category) => {
            if (!_.get(data.categories, category)) {
                delete $scope.currentParams.params.must.categories[category];
            }
        });
    };

    /**
     * @ngdoc method
     * @name SourceCategoryController#generate
     * @description Using the current form parameters, query the Search API and update the chart configs
     */
    $scope.generate = () => {
        $scope.changeContentView('report');

        this.runQuery({
            ...$scope.currentParams.params,
            category_field: 'name',
        }).then((data) => {
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
    $scope.generateSubtitlePlaceholder = () => chartConfig.generateSubtitleForDates(
        _.get($scope, 'currentParams.params') || {}
    );

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
            // If the tab has changed to filters, then reload the list of
            // categories and sources based on what is available in the
            // published and archived collections
            this.runQuery({}).then((data) => {
                this.updateSources(data);
                this.updateCategories(data);
            });
        }
    };

    $scope.getReportParams = () => (
        $q.when(_.cloneDeep($scope.currentParams))
    );

    this.init();
}
