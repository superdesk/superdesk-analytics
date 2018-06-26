SourceCategoryReportPanel.$inject = [
    'notify', '$rootScope', 'sourceCategoryReport', 'config', 'moment',
];

export function SourceCategoryReportPanel(notify, $rootScope, sourceCategoryReport, config, moment) {
    return {
        template: require('../views/source-category-report-panel.html'),
        scope: {},
        link: function(scope, element, attrs, controller) {
            scope.generate = function() {
                function onSuccess(sourceCategoryReport) {
                    $rootScope.$broadcast('view:source_category_report', sourceCategoryReport);
                    notify.success(gettext('The source category report was generate successfully'));
                }

                function onFail(error) {
                    if (angular.isDefined(error.data._message)) {
                        notify.error(error.data._message);
                    } else {
                        notify.error(gettext('Error. The source category report could not be generated.'));
                    }
                }

                return sourceCategoryReport.generate(scope.report).then(onSuccess, onFail);
            };

            scope.report = {
                start_date: moment()
                    .subtract(30, 'days')
                    .format(config.view.dateformat),
                end_date: moment().format(config.view.dateformat),
            };
        }
    };
}
