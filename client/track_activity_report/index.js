/**
 * This file is part of Superdesk.
 *
 * Copyright 2016 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import * as svc from './services';
import * as directive from './directives';

function cacheIncludedTemplates($templateCache) {
    $templateCache.put(
        'track-activity-report-side-panel.html',
        require('./views/track-activity-report-side-panel.html')
    );
}
cacheIncludedTemplates.$inject = ['$templateCache'];


/**
 * @ngdoc module
 * @module superdesk.analytics.track-activity-report
 * @name superdesk.analytics.track-activity-report
 * @packageName analytics.track-activity-report
 * @description Superdesk analytics track activity report.
 */
angular.module('superdesk.analytics.track-activity-report', [])
    .service('trackActivityChart', svc.TrackActivityChart)
    .service('trackActivityReport', svc.TrackActivityReport)

    .directive('sdTrackActivityReportContainer', directive.TrackActivityReportContainer)
    .directive('sdTrackActivityReportPanel', directive.TrackActivityReportPanel)
    .directive('sdTrackActivityReportView', directive.TrackActivityReportView)

    .run(cacheIncludedTemplates)

    .config(['reportsProvider', 'gettext', function(reportsProvider, gettext) {
        reportsProvider.addReport({
            id: 'track_activity_report',
            label: gettext('Track Activity Report'),
            sidePanelTemplate: 'track-activity-report-side-panel.html',
            priority: 300,
            privileges: {track_activity_report: 1},
        });
    }]);
