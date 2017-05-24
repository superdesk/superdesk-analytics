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
    .directive('sdContentQuotaReportPanel', directive.ContentQuotaReportPanel)
    .directive('sdContentQuotaReportView', directive.ContentQuotaReportView)

    .config(['superdeskProvider', function(superdesk) {
        superdesk.activity('content-quota-reports', {
            label: gettext('Content Quota Report'),
            template: require('./views/content-quota-report.html'),
            topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
            category: 'analytics',
            priority: -800
        });
    }]);
