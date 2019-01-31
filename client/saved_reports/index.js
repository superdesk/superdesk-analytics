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

import './styles/saved_reports.scss';

/**
 * @ngdoc module
 * @module superdesk.analytics.saved_reports
 * @name superdesk.analytics.saved_reports
 * @packageName analytics.saved_reports
 * @description Saved Analytic Reports
 */
angular.module('superdesk.analytics.saved_reports', [])
    .service('savedReports', svc.SavedReportsService)

    .directive('sdaSaveReportForm', directives.SaveReportForm)
    .directive('sdaSavedReportList', directives.SavedReportList)
    .directive('sdaSavedReportItem', directives.SavedReportItem)
    .directive('sdaSaveGenerateReport', directives.SaveGenerateReport);
