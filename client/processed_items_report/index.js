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

function cacheIncludedTemplates($templateCache) {
    $templateCache.put(
        'processed-items-report-side-panel.html',
        require('./views/processed-items-report-side-panel.html')
    );
}
cacheIncludedTemplates.$inject = ['$templateCache'];

/**
 * @ngdoc module
 * @module superdesk.analytics.processed-items-report
 * @name superdesk.analytics.processed-items-report
 * @packageName analytics.processed-items-report
 * @description Superdesk analytics processed items report.
 */
angular.module('superdesk.analytics.processed-items-report', [])
    .service('processedItemsChart', svc.ProcessedItemsChart)
    .service('processedItemsReport', svc.ProcessedItemsReport)

    .directive('sdProcessedItemsReportContainer', directive.ProcessedItemsReportContainer)
    .directive('sdProcessedItemsReportForm', directive.ProcessedItemsReportForm)
    .directive('sdProcessedItemsReportPanel', directive.ProcessedItemsReportPanel)
    .directive('sdProcessedItemsReportView', directive.ProcessedItemsReportView)

    .run(cacheIncludedTemplates)

    .config(['reportsProvider', 'gettext', function(reportsProvider, gettext) {
        reportsProvider.addReport({
            id: 'processed_items_report',
            label: gettext('Processed Items Report'),
            sidePanelTemplate: 'processed-items-report-side-panel.html',
            priority: 200,
            privileges: {processed_items_report: 1},
        });
    }]);
