import '../styles/renditions-preview.scss';

RenditionsPreview.$inject = [];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics
 * @name sdaRenditionsPreview
 * @description A directive that renders renditions (in a similar way to authoring/editor)
 */
export function RenditionsPreview() {
    return {
        template: require('../views/renditions-preview.html'),
    };
}
