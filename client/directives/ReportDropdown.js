/**
 * @ngdoc directive
 * @module superdesk.apps.analytics
 * @name sdReportDropdown
 * @description A directive that generates a dropdown selector for the registered reports
 */
export function ReportDropdown() {
    return {
        requires: '^sdaAnalyticsContainer',
        template: require('../views/report-dropdown.html'),
    };
}
