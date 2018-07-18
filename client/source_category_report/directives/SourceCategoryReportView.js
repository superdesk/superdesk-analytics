SourceCategoryReportView.$inject = ['sourceCategoryReport', 'sourceCategoryChart', '$timeout'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.source-category-report
 * @name sdSourceCategoryReportView
 * @requires sourceCategoryReport
 * @requires sourceCategoryChart
 * @requires $timeout
 * @description A directive that displays the generated source/category report
 */
export function SourceCategoryReportView(sourceCategoryReport, sourceCategoryChart, $timeout) {
    return {
        template: require('../views/source-category-report-view.html'),
        scope: {},
        link: function(scope, element, attrs) {
            scope.config = [];

            /**
             * @ngdoc method
             * @name sdSourceCategoryReportView#generateChart
             * @description Generate the Source/Cateogry chart
             */
            scope.generateChart = () => {
                scope.config = sourceCategoryChart.createChart(scope.report);
            };

            scope.$on('view:source_category_report', (event, args) => {
                scope.report = args;
                scope.generateChart();
            });
        },
    };
}
