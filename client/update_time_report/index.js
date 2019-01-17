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

function cacheIncludedTemplates($templateCache) {
    $templateCache.put(
        'update-time-report-panel.html',
        require('./views/update-time-report-panel.html')
    );
    $templateCache.put(
        'update-time-report-parameters.html',
        require('./views/update-time-report-parameters.html')
    );
    $templateCache.put(
        'update-time-report-view.html',
        require('./views/update-time-report-view.html')
    );
}
cacheIncludedTemplates.$inject = ['$templateCache'];

/**
 * @ngdoc module
 * @module superdesk.analytics.update-time-report
 * @name superdesk.analytics.update-time-report
 * @packageName analytics.update-time-report
 * @description Superdesk analytics generate report of time to first publish of updates.
 */
angular.module('superdesk.analytics.update-time-report', [])
    .controller('UpdateTimeReportController', ctrl.UpdateTimeReportController)

    .directive('sdaUpdateTimeReportPreview', directives.UpdateTimeReportPreview)
    .directive('sdaUpdateTimeTable', directives.UpdateTimeTable)

    .run(cacheIncludedTemplates)

    .config(['reportsProvider', 'gettext', function(reportsProvider, gettext) {
        reportsProvider.addReport({
            id: 'update_time_report',
            label: gettext('Update Time'),
            sidePanelTemplate: 'update-time-report-panel.html',
            priority: 600,
            privileges: {update_time_report: 1},
            allowScheduling: true,
            reportTemplate: 'update-time-report-view.html',
        });
    }]);
