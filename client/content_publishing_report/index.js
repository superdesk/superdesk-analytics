/**
 * This file is part of Superdesk.
 *
 * Copyright 2018 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import {gettext} from '../utils';
import * as ctrl from './controllers';
import * as directives from './directives';

function cacheIncludedTemplates($templateCache) {
    $templateCache.put(
        'content-publishing-report-panel.html',
        require('./views/content-publishing-report-panel.html')
    );
    $templateCache.put(
        'content-publishing-report-parameters.html',
        require('./views/content-publishing-report-parameters.html')
    );
}
cacheIncludedTemplates.$inject = ['$templateCache'];

/**
 * @ngdoc module
 * @module superdesk.analytics.content-publishing-report
 * @name superdesk.analytics.content-publishing-report
 * @packageName analytics.content-publishing-report
 * @description Superdesk analytics generate report of content publishing statistics.
 */
angular.module('superdesk.analytics.content-publishing-report', [])
    .controller('ContentPublishingReportController', ctrl.ContentPublishingReportController)

    .directive('sdaContentPublishingReportPreview', directives.ContentPublishingReportPreview)

    .run(cacheIncludedTemplates)

    .config(['reportsProvider', function(reportsProvider) {
        reportsProvider.addReport({
            id: 'content_publishing_report',
            label: gettext('Content Publishing'),
            sidePanelTemplate: 'content-publishing-report-panel.html',
            priority: 100,
            privileges: {content_publishing_report: 1},
            allowScheduling: true,
        });
    }]);
