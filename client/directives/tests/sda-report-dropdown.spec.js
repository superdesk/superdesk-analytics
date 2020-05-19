describe('sda-report-dropdown', () => {
    let $compile;
    let $rootScope;
    let scope;

    let reports;
    let currentReport;
    let changeReport;

    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.core.activity'));
    beforeEach(window.module('superdesk.core.services.pageTitle'));
    beforeEach(window.module('superdesk.analytics'));

    beforeEach(inject((_$compile_, _$rootScope_) => {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
    }));

    beforeEach(inject(($httpBackend) => {
        $httpBackend.whenGET(/api$/).respond({_links: {child: []}});
    }));

    beforeEach(() => {
        reports = [
            {},
            {id: 'report_1', label: 'Report 1'},
            {id: 'report_2', label: 'Report 2'},
            {id: 'report_3', label: 'Report 3'},
        ];
        changeReport = jasmine.createSpy();
    });

    const getElement = () => {
        scope = $rootScope.$new();
        scope.reports = reports;
        scope.currentReport = currentReport;
        scope.changeReport = changeReport;

        const element = $compile('<div sda-report-dropdown></div>')(scope);

        $rootScope.$digest();
        return element;
    };

    it('Renders the list of empty reports', () => {
        reports = [];
        const element = getElement();

        expect(element.find('button')
            .first()
            .html()
        ).toContain('Select A Report');
        expect(element.find('li').length).toBe(0);
    });

    it('Renders list with multiple reports', () => {
        const element = getElement();

        expect(element.find('button')
            .first()
            .html()
        ).toContain('Select A Report');

        const menuItems = element.find('li').children('button');

        expect(menuItems.length).toBe(4);

        expect($(menuItems[0]).text()).toBe('');
        expect($(menuItems[1]).text()).toBe('Report 1');
        expect($(menuItems[2]).text()).toBe('Report 2');
        expect($(menuItems[3]).text()).toBe('Report 3');

        $(menuItems[2]).click();
        $rootScope.$apply();

        expect(changeReport.calls.count()).toBe(1);
        expect(changeReport).toHaveBeenCalledWith(
            jasmine.objectContaining({id: 'report_2', label: 'Report 2'})
        );
    });

    it('Renders the currently selected report', () => {
        const element = getElement();

        expect(element.find('button')
            .first()
            .html()
        ).toContain('Select A Report');

        scope.currentReport = reports[2];
        $rootScope.$digest();

        expect(element.find('button')
            .first()
            .html()
        ).toContain('Report 2');
    });
});
