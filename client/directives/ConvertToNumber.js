/**
 * @ngdoc directive
 * @module superdesk.apps.analytics
 * @name sda-convert-to-number
 * @description A directive that converts input value to an integer (base 10)
 */
export function ConvertToNumber() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
            // Convert the variable from a string to an integer from the input
            ngModel.$parsers.push((value) => (parseInt(value, 10)));

            // Convert the variable from an integer to a string for the input
            ngModel.$formatters.push((value) => ('' + value));
        },
    };
}
