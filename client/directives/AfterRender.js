AfterRender.$inject = ['$timeout'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics
 * @name sdAfterRender
 * @requires $timeout
 * @description A directive that runs the given funtion after the DOM rendering
 */
export function AfterRender($timeout) {
    return {
        restrict: 'A',
        terminal: true,
        transclude: false,
        link: function(scope, element, attrs, controller) {
            $timeout(scope.$eval(attrs.sdAfterRender), 0);
        }
    };
}
