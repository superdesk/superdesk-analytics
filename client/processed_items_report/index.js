/**
 * This file is part of Superdesk.
 *
 * Copyright 2016 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import * as directive from './directives';
import * as svc from './services';

/**
 * @ngdoc module
 * @module superdesk.analytics.processed-items-report
 * @name superdesk.analytics.processed-items-report
 * @packageName analytics.processed-items-report
 * @description Superdesk analytics processed items report.
 */
angular.module('superdesk.analytics.processed-items-report', [])
    .service('processedItemsChart', svc.ProcessedItemsChart)

    .directive('sdProcessedItemsReportContainer', directive.ProcessedItemsReportContainer)
    .directive('sdProcessedItemsReportPanel', directive.ProcessedItemsReportPanel)
    .directive('sdProcessedItemsReportView', directive.ProcessedItemsReportView)

    .config(['superdeskProvider', function(superdesk) {
        superdesk.activity('processed-items-report', {
            label: gettext('Processed Items Report'),
            template: require('./views/processed-items-report.html'),
            topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
            category: 'analytics',
            priority: -800
        });
    }]);