/**
 * This file is part of Superdesk.
 *
 * Copyright 2018 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import {gettext} from 'superdesk-core/scripts/core/utils';

import * as ctrl from './controllers';
import * as directives from './directives';

function cacheIncludedTemplates($templateCache) {
    $templateCache.put(
        'planning-usage-report-panel.html',
        require('./views/planning-usage-report-panel.html')
    );
    $templateCache.put(
        'planning-usage-report-parameters.html',
        require('./views/planning-usage-report-parameters.html')
    );
}
cacheIncludedTemplates.$inject = ['$templateCache'];

/**
 * @ngdoc module
 * @module superdesk.analytics.planning-usage-report
 * @name superdesk.analytics.planning-usage-report
 * @packageName analytics.planning-usage-report
 * @description Superdesk analytics generate report of Planning module usage.
 */
angular.module('superdesk.analytics.planning-usage-report', [])
    .controller('PlanningUsageReportController', ctrl.PlanningUsageReportController)

    .directive('sdaPlanningUsageReportPreview', directives.PlanningUsageReportPreview)

    .run(cacheIncludedTemplates)

    .config(['reportsProvider', function(reportsProvider) {
        reportsProvider.addReport({
            id: 'planning_usage_report',
            label: gettext('Planning Usage'),
            sidePanelTemplate: 'planning-usage-report-panel.html',
            priority: 400,
            privileges: {planning_usage_report: 1},
            required_features: ['events', 'planning', 'assignments'],
            allowScheduling: true,
        });
    }]);
