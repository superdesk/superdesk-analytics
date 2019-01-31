/**
 * This file is part of Superdesk.
 *
 * Copyright 2018 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import * as svc from './services';
import * as directives from './directives';
import './styles/scheduled_reports.scss';

function cacheIncludedTemplates($templateCache) {
    $templateCache.put(
        'scheduled-reports-modal.html',
        require('./views/scheduled-reports-modal.html')
    );
}
cacheIncludedTemplates.$inject = ['$templateCache'];

/**
 * @ngdoc module
 * @module superdesk.apps.analytics
 * @name scheduled_reports
 * @packageName superdesk.apps.analytics.scheduled_reports
 * @description Module providing directives/service to manage scheduling of reports
 */
angular.module('superdesk.analytics.scheduled_reports', [])
    .directive('sdaReportPreviewProxy', directives.ReportPreviewProxy)
    .directive('sdaScheduledReportsList', directives.ScheduledReportsList)
    .directive('sdaScheduledReportsModal', directives.ScheduledReportsModal)
    .directive('sdaReportScheduleInput', directives.ReportScheduleInput)

    .service('scheduledReports', svc.ScheduledReportsService)

    .run(cacheIncludedTemplates);
