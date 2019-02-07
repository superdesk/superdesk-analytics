/**
 * This file is part of Superdesk.
 *
 * Copyright 2018 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import * as ctrl from './controllers';
import * as directives from './directives';
import './widgets';

function cacheIncludedTemplates($templateCache) {
    $templateCache.put(
        'publishing-performance-report-panel.html',
        require('./views/publishing-performance-report-panel.html')
    );
    $templateCache.put(
        'publishing-performance-report-parameters.html',
        require('./views/publishing-performance-report-parameters.html')
    );
}
cacheIncludedTemplates.$inject = ['$templateCache'];

/**
 * @ngdoc module
 * @module superdesk.analytics.publishing-performance-report
 * @name superdesk.analytics.publishing-performance-report
 * @packageName analytics.publishing-performance-report
 * @description Superdesk analytics generate report of Publishing Performance statistics.
 */
angular.module('superdesk.analytics.publishing-performance-report',
    ['superdesk.analytics.publishing-performance-report.widgets']
)
    .controller('PublishingPerformanceReportController', ctrl.PublishingPerformanceReportController)

    .directive('sdaPublishingPerformanceReportPreview', directives.PublishingPerformanceReportPreview)

    .run(cacheIncludedTemplates)

    .config(['reportsProvider', 'gettext', function(reportsProvider, gettext) {
        reportsProvider.addReport({
            id: 'publishing_performance_report',
            label: gettext('Publishing Performance'),
            sidePanelTemplate: 'publishing-performance-report-panel.html',
            priority: 600,
            privileges: {publishing_performance_report: 1},
            allowScheduling: true,
        });
    }]);
