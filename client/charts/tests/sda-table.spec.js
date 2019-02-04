describe('sda-table', () => {
    let $compile;
    let scope;
    let $rootScope;
    let data;
    let element;

    beforeEach(window.module('superdesk.core.notify'));
    beforeEach(window.module('superdesk.analytics.charts'));

    beforeEach(inject((_$compile_, _$rootScope_) => {
        $compile = _$compile_;
        $rootScope = _$rootScope_;

        element = null;

        data = {
            title: 'Test Table',
            subtitle: 'Fake Data',
            headers: [
                {title: 'one', field: 'one'},
                {title: 'two'},
                {title: 'three', field: 'three'},
            ],
            rows: [
                [{label: 1}, {label: 2}, {label: 3, clickable: true, tooltip: 'View data', custom: {data: [3]}}],
                [{label: 4}, {label: 5}, {label: 6, clickable: true, tooltip: 'View data'}],
                [{label: 7}, {label: 8}, {label: 9, clickable: true, tooltip: 'View data'}],
            ],
            page: {
                no: 1,
                max: 5,
                sort: {
                    field: 'one',
                    order: 'desc',
                },
            },
            onCellClicked: jasmine.createSpy(),
        };
    }));

    const setElement = () => {
        scope = $rootScope.$new();
        Object.keys(data).forEach((key) => {
            scope[key] = data[key];
        });

        const template = angular.element(`<div><div
    sda-table
    data-title="title"
    data-subtitle="subtitle"
    data-headers="headers"
    data-rows="rows"
    data-page="page"
    data-on-cell-clicked="onCellClicked"
</div>`);

        element = $compile(template)(scope);

        $rootScope.$digest();
    };

    const getHeader = (index) => $(
        element.find('thead')
            .first()
            .find('tr')
            .first()
            .find('th')
            .get(index)
    );

    const getBodyRow = (index) => $(
        element.find('tbody')
            .first()
            .find('tr')
            .get(index)
    );

    const getCell = (row, column) => $(
        getBodyRow(row)
            .find('td')
            .get(column)
    );

    const stripWhitespace = (elem) => (
        elem.text().replace(/\s+/g, '')
    );

    const trim = (elem) => (
        elem.text().trim()
    );

    it('renders the table', () => {
        setElement();

        // Test titles
        expect(trim(element.find('.sda-chart__table-header-title'))).toBe('Test Table');
        expect(trim(element.find('.sda-chart__table-header-subtitle'))).toBe('Fake Data');

        // Test header
        expect(trim(getHeader(0))).toBe('one');
        expect(trim(getHeader(1))).toBe('two');
        expect(trim(getHeader(2))).toBe('three');

        // Test size of the table
        expect(element.find('table').length).toBe(1);
        expect(element.find('tbody')
            .first()
            .find('tr')
            .length
        ).toBe(3);

        // Test data of each row
        expect(getBodyRow(0).find('td').length).toBe(3);
        expect(stripWhitespace(getBodyRow(0))).toBe('123');
        expect(stripWhitespace(getBodyRow(1))).toBe('456');
        expect(stripWhitespace(getBodyRow(2))).toBe('789');

        // Renders the pagination directive if page.max > 1
        scope.page = {...data.page, max: 1};
        scope.$digest();
        expect(element.find('.pagination-box').length).toBe(0);

        scope.page = {...data.page, max: 5};
        scope.$digest();
        expect(element.find('.pagination-box').length).toBe(1);

        // Renders panel-info when no rows are to be rendered
        expect(element.find('.panel-info').length).toBe(0);
        scope.rows = [];
        scope.$digest();
        expect(element.find('.panel-info').length).toBe(1);
    });

    it('executes callback on cell clicked', () => {
        setElement();

        // Test onCellClicked on cells with clickable=true
        getCell(0, 0).click();
        getCell(0, 1).click();
        getCell(0, 2).click();
        expect(data.onCellClicked.calls.count()).toBe(1);
        expect(data.onCellClicked.calls.mostRecent().args).toEqual(
            [{label: 3, clickable: true, tooltip: 'View data', custom: {data: [3]}}]
        );

        getCell(1, 2).click();
        expect(data.onCellClicked.calls.count()).toBe(2);
        expect(data.onCellClicked.calls.mostRecent().args).toEqual(
            [{label: 6, clickable: true, tooltip: 'View data'}]
        );

        getCell(2, 2).click();
        expect(data.onCellClicked.calls.count()).toBe(3);
        expect(data.onCellClicked.calls.mostRecent().args).toEqual(
            [{label: 9, clickable: true, tooltip: 'View data'}]
        );
    });

    it('sorts on header click', () => {
        setElement();

        // Test initial values
        expect(scope.page.sort).toEqual({field: 'one', order: 'desc'});
        expect(getHeader(0).find('.icon-chevron-up-thin').length).toBe(0);
        expect(getHeader(0).find('.icon-chevron-down-thin').length).toBe(1);
        expect(getHeader(1).find('.icon-chevron-up-thin').length).toBe(0);
        expect(getHeader(1).find('.icon-chevron-down-thin').length).toBe(0);
        expect(getHeader(2).find('.icon-chevron-up-thin').length).toBe(0);
        expect(getHeader(2).find('.icon-chevron-down-thin').length).toBe(0);

        // Clicking on already selected header toggles the order
        getHeader(0).click();
        expect(scope.page.sort).toEqual({field: 'one', order: 'asc'});
        expect(getHeader(0).find('.icon-chevron-up-thin').length).toBe(1);
        expect(getHeader(0).find('.icon-chevron-down-thin').length).toBe(0);
        expect(getHeader(1).find('.icon-chevron-up-thin').length).toBe(0);
        expect(getHeader(1).find('.icon-chevron-down-thin').length).toBe(0);
        expect(getHeader(2).find('.icon-chevron-up-thin').length).toBe(0);
        expect(getHeader(2).find('.icon-chevron-down-thin').length).toBe(0);

        // Test clicking on non-sortable header field
        // page value stays the same
        getHeader(1).click();
        expect(scope.page.sort).toEqual({field: 'one', order: 'asc'});
        expect(getHeader(0).find('.icon-chevron-up-thin').length).toBe(1);
        expect(getHeader(0).find('.icon-chevron-down-thin').length).toBe(0);
        expect(getHeader(1).find('.icon-chevron-up-thin').length).toBe(0);
        expect(getHeader(1).find('.icon-chevron-down-thin').length).toBe(0);
        expect(getHeader(2).find('.icon-chevron-up-thin').length).toBe(0);
        expect(getHeader(2).find('.icon-chevron-down-thin').length).toBe(0);

        // Clicking on a non-selected header defaults to descending order
        getHeader(2).click();
        expect(scope.page.sort).toEqual({field: 'three', order: 'desc'});
        expect(getHeader(0).find('.icon-chevron-up-thin').length).toBe(0);
        expect(getHeader(0).find('.icon-chevron-down-thin').length).toBe(0);
        expect(getHeader(1).find('.icon-chevron-up-thin').length).toBe(0);
        expect(getHeader(1).find('.icon-chevron-down-thin').length).toBe(0);
        expect(getHeader(2).find('.icon-chevron-up-thin').length).toBe(0);
        expect(getHeader(2).find('.icon-chevron-down-thin').length).toBe(1);

        // Again clicking on already selected header toggles the order
        getHeader(2).click();
        expect(scope.page.sort).toEqual({field: 'three', order: 'asc'});
        expect(getHeader(0).find('.icon-chevron-up-thin').length).toBe(0);
        expect(getHeader(0).find('.icon-chevron-down-thin').length).toBe(0);
        expect(getHeader(1).find('.icon-chevron-up-thin').length).toBe(0);
        expect(getHeader(1).find('.icon-chevron-down-thin').length).toBe(0);
        expect(getHeader(2).find('.icon-chevron-up-thin').length).toBe(1);
        expect(getHeader(2).find('.icon-chevron-down-thin').length).toBe(0);
    });
});
