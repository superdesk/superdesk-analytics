ArchivePreviewProxy.$inject = ['$compile', 'lodash'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics
 * @name sdaArchivePreviewProxy
 * @requires $compile
 * @requires lodash
 * @description A directive that compiles and renders a preview directive based on
 * the scope.preview.type
 */
export function ArchivePreviewProxy($compile, _) {
    return {
        scope: {
            preview: '=',
            close: '='
        },
        link: function(scope, element) {
            /**
             * @ngdoc method
             * @name sdaArchivePreviewProxy#changePreviewDirective
             * @description Creates and compiles the angular preview directive
             * for the provided preview item/type
             */
            const changePreviewDirective = () => {
                const previewType = _.get(scope.preview, 'type');
                let template;

                if (previewType === 'archive') {
                    // Directive is the same one used in monitoring/search preview
                    template = `
                        <div class="sd-item-preview"
                            sd-item-preview
                            data-item="preview.item"
                            data-close="close()"
                            data-show-history-tab="true"
                            data-hide-actions-menu="true"
                        ></div>
                    `;
                } else if (previewType) {
                    // Custom preview directive
                    template = `<div sda-${previewType}></div>`;
                }

                // Make sure to destroy the existing directive
                if (element[0].children.length > 0) {
                    angular.element(element[0]).empty();
                }

                if (template) {
                    angular.element(element[0]).append($compile(template)(scope)[0]);
                }
            };

            scope.$watch('preview', (newPreview, oldPreview) => {
                // Only change the directive if the type has changed
                if (_.get(newPreview, 'type') !== _.get(oldPreview, 'type')) {
                    changePreviewDirective();
                }
            });
        },
    };
}
