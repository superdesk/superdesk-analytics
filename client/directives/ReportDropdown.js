
export function ReportDropdown() {
    return {
        scope: {
            currentReport: '<',
            _changeReport: '&changeReport',
            reports: '<',
        },
        template: require('../views/report-dropdown.html'),
        link: (scope) => {
            scope.isActive = (report) => scope.currentReport.id === report.id;

            scope.changeReport = function(report) {
                scope._changeReport({report: report});
            };
        },
    };
}
