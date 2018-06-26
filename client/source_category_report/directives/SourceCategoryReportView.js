SourceCategoryReportView.$inject = ['sourceCategoryReport', 'sourceCategoryChart', '$timeout'];

export function SourceCategoryReportView(sourceCategoryReport, sourceCategoryChart, $timeout) {
    return {
        template: require('../views/source-category-report-view.html'),
        scope: {},
        link: function(scope, element, attrs, controller) {
            var chart = null;

            scope.generateChart = () => {
                chart = sourceCategoryChart.createChart(scope.report, 'source-category');
            };

            scope.$on('view:source_category_report', (event, args) => {
                scope.report = args;
                $timeout(scope.generateChart, 0);
            });

            scope.$on('$destroy', () => {
                if (angular.isDefined(chart)) {
                    chart.destroy();
                    chart = null;
                }
            });
        }
    };
}
