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
        'desk-activity-report-panel.html',
        require('./views/desk-activity-report-panel.html')
    );
    $templateCache.put(
        'desk-activity-report-parameters.html',
        require('./views/desk-activity-report-parameters.html')
    );
}
cacheIncludedTemplates.$inject = ['$templateCache'];

/**
 * @ngdoc module
 * @module superdesk.analytics.desk-activity-report
 * @name superdesk.analytics.desk-activity-report
 * @packageName analytics.desk-activity-report
 * @description Superdesk analytics generate report of Desk Activity.
 */
angular.module('superdesk.analytics.desk-activity-report', [])
    .controller('DeskActivityReportController', ctrl.DeskActivityReportController)

    .directive('sdaDeskActivityReportPreview', directives.DeskActivityReportPreview)

    .run(cacheIncludedTemplates)

    .config(['reportsProvider', 'gettext', function(reportsProvider, gettext) {
        reportsProvider.addReport({
            id: 'desk_activity_report',
            label: gettext('Desk Activity'),
            sidePanelTemplate: 'desk-activity-report-panel.html',
            priority: 200,
            privileges: {desk_activity_report: 1},
            allowScheduling: true,
            required_features: ['desk_activity_report'],
        });
    }]);
