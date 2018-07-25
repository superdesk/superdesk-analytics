import {generateSubtitle} from '../../utils';

SourceCategoryController.$inject = [
    '$scope',
    'gettext',
    'moment',
    'config',
    'lodash',
    'searchReport',
    'notify',
    'sourceCategoryChart',
];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.source-category-report
 * @name SourceCategoryController
 * @requires $scope
 * @requires gettext
 * @requires moment
 * @requires config
 * @requires lodash
 * @requires searchReport
 * @requires notify
 * @requires sourceCategoryChart
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
    sourceCategoryChart
) {
    /**
     * @ngdoc method
     * @name SourceCategoryController#init
     * @description Initializes the scope parameters for use with the form and charts
     */
    this.init = () => {
        $scope.categories = [];
        $scope.sources = [];
        $scope.params = {};
        $scope.reportData = {};
        $scope.currentTab = 'parameters';

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

        $scope.params = {
            start_date: moment()
                .subtract(30, 'days')
                .format(config.view.dateformat),
            end_date: moment().format(config.view.dateformat),
            chartType: $scope.chart_types[0].qcode,
            repos: {
                ingest: false,
                archive: false,
                published: true,
                archived: true,
            },
            dateFilter: 'range',
            min: 1,
            max: null,
            sort_order: 'desc',
            categories: {},
            sources: {},
            exclude_rewrites: false,
        };

        // Set the default values for excluded_states for the form
        $scope.params.excluded_states = _.mapValues(
            _.keyBy($scope.item_states, 'qcode'),
            (state) => state.default_exclude
        );
    };

    /**
     * @ngdoc method
     * @name SourceCategoryController#runQuery
     * @returns {Promise<Object>} - Search API query response
     * @description Sends the current form parameters to the search API
     */
    this.runQuery = () => searchReport.query('source_category_report', $scope.params);

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
            $scope.params.sources[source] = $scope.params.sources[source] || false;
        });

        Object.keys($scope.params.sources).forEach((source) => {
            if (!_.get(data.sources, source)) {
                delete $scope.params.sources[source];
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
            (category) => data.categories[category] >= $scope.params.min
        );

        $scope.categories = _.isEmpty(categories) ?
            [] :
            categories;

        $scope.categories.forEach((category) => {
            $scope.params.categories[category] = $scope.params.categories[category] || false;
        });

        Object.keys($scope.params.categories).forEach((category) => {
            if (!_.get(data.categories, category)) {
                delete $scope.params.categories[category];
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
            $scope.reportData = data;
            $scope.reportData = Object.assign({}, data, {
                chartType: $scope.params.chartType,
                title: $scope.params.title,
                subtitle: $scope.params.subtitle,
                min: $scope.params.min,
                max: $scope.params.max,
                dateFilter: $scope.params.dateFilter,
                start_date: $scope.params.start_date,
                end_date: $scope.params.end_date,
                sort_order: $scope.params.sort_order,
            });

            $scope.changeReportParams(
                sourceCategoryChart.createChart($scope.reportData)
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
    $scope.generateSubtitlePlaceholder = () => generateSubtitle(moment, config, $scope.params);

    /**
     * @ngdoc method
     * @name SourceCategoryController#onDateFilterChange
     * @description When the date filter changes, clear the date input fields if the filter is not 'range'
     */
    $scope.onDateFilterChange = () => {
        if ($scope.params.dateFilter !== 'range') {
            $scope.params.start_date = null;
            $scope.params.end_date = null;
        }
    };

    /**
     * @ngdoc method
     * @name SourceCategoryController#onDateChange
     * @description Auto-selects 'range' as the date filter if the user inputs a date
     */
    $scope.onDateChange = function() {
        if ($scope.params.dateFilter !== 'range') {
            $scope.params.dateFilter = 'range';
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

    this.init();
}
