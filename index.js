// styles
import './client/styles/analytics.scss';

// scripts
import analyticsModule from './client';

// configureAnalytics.$inject = ['superdeskProvider']
// function configureAnalytics(superdesk) {
//     superdesk
//         .activity('/analytics', {
//             label: gettext('Analytics'),
//             description: gettext('Analytics'),
//             when: '/analytics',
//             templateUrl: './client/views/analytics.html',
//             topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
//             sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
//             category: 'analytics',
//             priority: -800
//         })
// }

// export default analyticsModule.config(configureAnalytics)
export default analyticsModule;
