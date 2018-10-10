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

/**
 * @ngdoc module
 * @module superdesk.apps.analytics
 * @name email_report
 * @packageName superdesk.apps.analytics.email_report
 * @description Module providing directives/service to email report charts
 */
angular.module('superdesk.analytics.email_report', [])
    .service('emailReport', svc.EmailReportService)

    .directive('sdaEmailReportModal', directives.EmailReportModal);
