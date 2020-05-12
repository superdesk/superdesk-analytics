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
        'featuremedia-updates-report-panel.html',
        require('./views/featuremedia-updates-report-panel.html')
    );
    $templateCache.put(
        'featuremedia-updates-report-parameters.html',
        require('./views/featuremedia-updates-report-parameters.html')
    );
    $templateCache.put(
        'featuremedia-updates-report-view.html',
        require('./views/featuremedia-updates-report-view.html')
    );
}
cacheIncludedTemplates.$inject = ['$templateCache'];

/**
 * @ngdoc module
 * @module superdesk.analytics.featuremedia-updates-report
 * @name superdesk.analytics.featuremedia-updates-report
 * @packageName analytics.featuremedia-updates-report
 * @description Superdesk analytics generate report of updates to Featuremedia.
 */
angular.module('superdesk.analytics.featuremedia-updates-report', [])
    .controller('FeaturemediaUpadtesReportController', ctrl.FeaturemediaUpdatesReportController)

    .directive('sdaFeaturemediaUpdatesReportPreview', directives.FeaturemediaUpdatesReportPreview)
    .directive('sdaFeaturemediaUpdatesTable', directives.FeaturemediaUpdatesTable)

    .run(cacheIncludedTemplates)

    .config(['reportsProvider', function(reportsProvider) {
        reportsProvider.addReport({
            id: 'featuremedia_updates_report',
            label: gettext('Featuremedia Updates'),
            sidePanelTemplate: 'featuremedia-updates-report-panel.html',
            priority: 300,
            privileges: {featuremedia_updates_report: 1},
            allowScheduling: true,
            reportTemplate: 'featuremedia-updates-report-view.html',
        });
    }]);
