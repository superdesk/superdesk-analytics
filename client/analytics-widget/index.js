/**
 * This file is part of Superdesk.
 *
 * Copyright 2016 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */


/**
 * @ngdoc module
 * @module superdesk.analytics.analytics-widget
 * @name superdesk.analytics.analytics-widget
 * @packageName analytics.analytics-widget
 * @description Superdesk analytics widget.
 */

angular.module('superdesk.analytics.analytics-widget', [])
    .config(['dashboardWidgetsProvider', function(dashboardWidgets) {
        dashboardWidgets.addWidget('analytics', {
            label: gettext('Analytics widget'),
            multiple: true,
            icon: 'archive',
            max_sizex: 2,
            max_sizey: 3,
            sizex: 1,
            sizey: 2,
            thumbnail: require('./thumbnail.svg'),
            template: require('./analytics-widget.html'),
            configurationTemplate: require('./configuration.html'),
            description: 'This wiget allows you to view the analytics reports',
            custom: true
        });
    }]);
