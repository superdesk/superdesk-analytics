describe('sda-preview-date-filter', () => {
    let $compile;
    let $rootScope;
    let element;

    beforeEach(window.module('superdesk.analytics.search'));
    beforeEach(window.module('angularMoment'));

    beforeEach(inject((_$compile_, _$rootScope_) => {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
    }));

    const compileElement = (dates) => {
        const scope = $rootScope.$new();

        scope.report = {params: {dates: dates}};
        element = $compile('<div sda-preview-date-filter></div>')(scope);

        $rootScope.$digest();
    };

    it('render for "yesterday"', () => {
        compileElement({filter: 'yesterday'});
        expect(element.html()).toContain('Yesterday</p>');
    });

    it('render for "last_week"', () => {
        compileElement({filter: 'last_week'});
        expect(element.html()).toContain('Last Week</p>');
    });

    it('render for "last_month"', () => {
        compileElement({filter: 'last_month'});
        expect(element.html()).toContain('Last Month</p>');
    });

    it('render for "range"', () => {
        compileElement({filter: 'range', start: '01/01/2018', end: '30/06/2018'});
        expect(element.html()).toContain('From:</span> January 1, 2018');
        expect(element.html()).toContain('To:</span> June 30, 2018');
    });

    it('render for "day"', () => {
        compileElement({filter: 'day', date: '25/03/2018'});
        expect(element.html()).toContain('March 25, 2018</p>');
    });

    it('render for "relative"', () => {
        compileElement({filter: 'relative', relative: 12});
        expect(element.html()).toContain('<span translate="">Last</span> 12 <span translate="">hours</span>');

        compileElement({filter: 'relative', relative: '72'});
        expect(element.html()).toContain('<span translate="">Last</span> 72 <span translate="">hours</span>');
    });
});
