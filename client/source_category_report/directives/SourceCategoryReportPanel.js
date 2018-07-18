import {generateSubtitle} from '../../utils';

SourceCategoryReportPanel.$inject = [
    'notify', '$rootScope', 'sourceCategoryReport', 'config', 'moment', 'gettext',
];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.source-category-report
 * @name sdSourceCategoryReportPanel
 * @requires notify
 * @requires $rootScope
 * @requires sourceCategoryReport
 * @requires config
 * @requires moment
 * @description A directive that generates the sidebar containing report parameters
 */
export function SourceCategoryReportPanel(notify, $rootScope, sourceCategoryReport, config, moment, gettext) {
    return {
        template: require('../views/source-category-report-panel.html'),
        scope: {toggleFilters: '&'},
        link: function(scope, element, attrs, controller) {
            /**
             * @ngdoc method
             * @name sdSourceCategoryReportPanel#generate
             * @returns {Promise}
             * @description Generate the report
             */
            scope.generate = function() {
                return sourceCategoryReport.generate(scope.report).then(
                    (data) => {
                        $rootScope.$broadcast('view:source_category_report', Object.assign({}, data, {
                            chartType: scope.report.chartType,
                            title: scope.report.title,
                            subtitle: scope.report.subtitle,
                            min: scope.report.min,
                            max: scope.report.max,
                            dateFilter: scope.report.dateFilter,
                            start_date: scope.report.start_date,
                            end_date: scope.report.end_date,
                            sort_order: scope.report.sort_order,
                        }));
                    }, (error) => {
                    notify.error(angular.isDefined(error.data._message) ?
                            error.data._message :
                            gettext('Error. The source category report could not be generated.')
                        );
                }
                );
            };

            /**
             * @ngdoc method
             * @name sdSourceCategoryReportPanel#generateSubtitlePlaceholder
             * @returns {string}
             * @description Based on the date filters, returns the placeholder to use for the subtitle
             */
            scope.generateSubtitlePlaceholder = function() {
                return generateSubtitle(moment, config, scope.report);
            };

            /**
             * @ngdoc method
             * @name sdSourceCategoryReportPanel#onDateFilterChange
             * @description When the date filter changes, clear the date input fields if the filter is not 'range'
             */
            scope.onDateFilterChange = function() {
                if (scope.report.dateFilter !== 'range') {
                    scope.report.start_date = null;
                    scope.report.end_date = null;
                }
            };

            /**
             * @ngdoc method
             * @name sdSourceCategoryReportPanel#onDateChange
             * @description Auto-selects 'range' as the date filter if the user inputs a date
             */
            scope.onDateChange = function() {
                if (scope.report.dateFilter !== 'range') {
                    scope.report.dateFilter = 'range';
                }
            };

            /**
             * @ngdoc method
             * @name sdSourceCategoryReportPanel#initialize
             * @description Initialises the form default values
             */
            scope.initialize = function() {
                scope.item_states = [{
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
                }, {
                    qcode: 'rewrite_of',
                    name: gettext('Rewrite'),
                    default_exclude: false,
                }];

                scope.chart_types = [{
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

                scope.report = {
                    start_date: moment()
                        .subtract(30, 'days')
                        .format(config.view.dateformat),
                    end_date: moment().format(config.view.dateformat),
                    chartType: scope.chart_types[0].qcode,
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
                };

                // Set the default values for excluded_states for the form
                scope.report.excluded_states = _.mapValues(
                    _.keyBy(scope.item_states, 'qcode'),
                    (state) => state.default_exclude
                );
            };

            scope.initialize();
        },
    };
}
