Table.$inject = ['lodash'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.charts
 * @name sdaTable
 * @requires lodash
 * @description A directive that renders a sortable and clickable html table
 */
export function Table(_) {
    return {
        scope: {
            title: '=',
            subtitle: '=',
            headers: '=',
            rows: '=',
            page: '=',
            onCellClicked: '=',
        },
        replace: true,
        template: require('../views/table.html'),
        link: function(scope) {
            /**
             * @ngdoc method
             * @name sdaTable#onHeaderClicked
             * @param {Object} header - The header column that was clicked
             * @description Determines the sort filter based on the header data
             */
            scope.onHeaderClicked = (header) => {
                // If the header entry does not have a field attribute
                // then sorting by this column is disabled
                if (!header.field) {
                    return;
                }

                let newOrder;

                if (_.get(scope, 'page.sort.field') === header.field) {
                    // If the header.field is already sorted, then toggle the sort order
                    if (_.get(scope, 'page.sort.order') === 'asc') {
                        newOrder = 'desc';
                    } else {
                        newOrder = 'asc';
                    }
                } else {
                    // Otherwise set order to descending by default on first click
                    newOrder = 'desc';
                }

                scope.page = {
                    ...scope.page,
                    no: 1,
                    sort: {
                        field: header.field,
                        order: newOrder,
                    },
                };
            };
        },
    };
}
