/**
 * This file is part of Superdesk.
 *
 * Copyright 2013-2018 Sourcefabric z.u. and contributors.
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
        'user-activity-report-panel.html',
        require('./views/user-activity-report-panel.html')
    );
    $templateCache.put(
        'user-activity-report-parameters.html',
        require('./views/user-activity-report-parameters.html')
    );
}
cacheIncludedTemplates.$inject = ['$templateCache'];

/**
 * @ngdoc module
 * @module superdesk.analytics.user-activity-report
 * @name superdesk.analytics.user-activity-report
 * @packageName analytics.user-activity-report
 * @description Superdesk analytics generate report of User Activity.
 */
angular.module('superdesk.analytics.user-activity-report', [])
    .controller('UserActivityReportController', ctrl.UserActivityReportController)

    .directive('sdaUserActivityReportTooltip', directives.UserActivityReportTooltip)
    .directive('sdaItemTimelineTooltip', directives.ItemTimelineTooltip)

    .run(cacheIncludedTemplates)

    .config(['reportsProvider', function(reportsProvider) {
        reportsProvider.addReport({
            id: 'user_activity_report',
            label: gettext('User Activity'),
            sidePanelTemplate: 'user-activity-report-panel.html',
            priority: 800,
            privileges: {user_activity_report: 1},
            allowScheduling: false,
            required_features: ['user_activity_report'],
        });
    }]);
