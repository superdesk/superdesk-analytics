/**
 * This file is part of Superdesk.
 *
 * Copyright 2013-2018 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import * as ctrl from './controllers';
import * as directives from './directives';

function cacheIncludedTemplates($templateCache) {
    $templateCache.put(
        'production-time-report-panel.html',
        require('./views/production-time-report-panel.html')
    );
    $templateCache.put(
        'production-time-report-parameters.html',
        require('./views/production-time-report-parameters.html')
    );
}
cacheIncludedTemplates.$inject = ['$templateCache'];

/**
 * @ngdoc module
 * @module superdesk.analytics.production-time-report
 * @name superdesk.analytics.production-time-report
 * @packageName analytics.production-time-report
 * @description Superdesk analytics generate report of Production Times.
 */
angular.module('superdesk.analytics.production-time-report', [])
    .controller('ProductionTimeReportController', ctrl.ProductionTimeReportController)

    .directive('sdaProductionTimeReportPreview', directives.ProductionTimeReportPreview)

    .run(cacheIncludedTemplates)

    .config(['reportsProvider', 'gettext', function(reportsProvider, gettext) {
        reportsProvider.addReport({
            id: 'production_time_report',
            label: gettext('Production Time'),
            sidePanelTemplate: 'production-time-report-panel.html',
            priority: 600,
            privileges: {production_time_report: 1},
            allowScheduling: true,
            required_features: ['production_time_report'],
        });
    }]);
