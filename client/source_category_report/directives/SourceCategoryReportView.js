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
        link: function(scope, element, attrs, controller) {
            var chart = null;

            /**
             * @ngdoc method
             * @name sdSourceCategoryReportView#generateChart
             * @description Generate the Source/Cateogry chart
             */
            scope.generateChart = () => {
                chart = sourceCategoryChart.createChart(scope.report, 'source-category');
            };

            scope.$on('view:source_category_report', (event, args) => {
                scope.report = args;
                $timeout(scope.generateChart, 0);
            });

            scope.$on('$destroy', () => {
                if (angular.isDefined(chart)) {
                    if (angular.isDefined(chart.destroy)) {
                        chart.destroy();
                    }
                    chart = null;
                }
            });
        },
    };
}
