/**
 * This file is part of Superdesk.
 *
 * Copyright 2016 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import * as svc from './services';
import * as directive from './directives';

function cacheIncludedTemplates($templateCache) {
    $templateCache.put('content-quota-report-side-panel.html', require('./views/content-quota-report-side-panel.html'));
}
cacheIncludedTemplates.$inject = ['$templateCache'];

/**
 * @ngdoc module
 * @module superdesk.analytics.content-quota-reports
 * @name superdesk.analytics.content-quota-reports
 * @packageName analytics.content-quota-reports
 * @description Superdesk analytics content quota reports.
 */
angular.module('superdesk.analytics.content-quota-report', [])
    .service('contentQuotaChart', svc.ContentQuotaChart)
    .service('contentQuotaReport', svc.ContentQuotaReport)

    .directive('sdContentQuotaReportContainer', directive.ContentQuotaReportContainer)
    .directive('sdContentQuotaReportForm', directive.ContentQuotaReportForm)
    .directive('sdContentQuotaReportPanel', directive.ContentQuotaReportPanel)
    .directive('sdContentQuotaReportView', directive.ContentQuotaReportView)

    .run(cacheIncludedTemplates)

    .config(['reportsProvider', 'gettext', function(reportsProvider, gettext) {
        reportsProvider.addReport({
            id: 'content_quota_report',
            label: gettext('Content Quota Report'),
            sidePanelTemplate: 'content-quota-report-side-panel.html',
            priority: 400,
            privileges: {content_quota_report: 1},
        });
    }]);
