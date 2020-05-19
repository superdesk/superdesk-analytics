describe('sda-chart-container', () => {
    let $compile;
    let $rootScope;
    let $timeout;
    let scope;
    let configs;

    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.core.activity'));
    beforeEach(window.module('superdesk.core.services.pageTitle'));
    beforeEach(window.module('superdesk.analytics'));

    beforeEach(inject((_$compile_, _$rootScope_, _$timeout_) => {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $timeout = _$timeout_;
    }));

    beforeEach(inject(($httpBackend) => {
        $httpBackend.whenGET(/api$/).respond({_links: {child: []}});
    }));

    beforeEach(() => {
        configs = [{
            id: 'test-chart-1',
            type: 'bar',
            chart: {type: 'bar'},
            title: {text: 'Fruit Consumption'},
            xAxis: {categories: ['Apples', 'Bananas', 'Oranges']},
            yAxis: {title: {text: 'Fruit eaten'}},
            series: [
                {name: 'Jane', data: [1, 0, 4]},
                {name: 'John', data: [5, 7, 3]},
            ],
        }, {
            id: 'test-chart-2',
            type: 'bar',
            chart: {type: 'bar'},
            title: {text: 'Fruit Consumption'},
            xAxis: {categories: ['Apples', 'Bananas', 'Oranges']},
            yAxis: {title: {text: 'Fruit eaten'}},
            series: [
                {name: 'Jane', data: [1, 0, 4]},
                {name: 'John', data: [5, 7, 3]},
            ],
        }];
    });

    const getElement = (configs) => {
        scope = $rootScope.$new();
        scope.reportConfigs = {charts: configs};

        // Mock sda-analytics-container by providing sdaAnalyticsContainerController onto a fake parent element
        const elem = angular.element('<fake-parent><div sda-chart-container></div></fake-parent>');

        elem.data('$sdaAnalyticsContainerController', {});
        const element = $compile(elem)(scope);

        $rootScope.$digest();
        $timeout.flush(5000);

        return element;
    };

    it('renders 1 svg element', () => {
        const element = getElement([configs[0]]);

        expect(element.html()).toContain('sda-chart__container');
        expect(element.find('svg').length).toBe(1);
    });

    it('renders 2 svg elements', () => {
        const element = getElement([configs[0], configs[1]]);

        expect(element.html()).toContain('sda-chart__container');
        expect(element.find('svg').length).toBe(2);
    });

    it('updates the charts when config is updated', () => {
        const element = getElement([configs[0]]);

        expect(element.html()).toContain('sda-chart__container');
        expect(element.find('svg').length).toBe(1);

        scope.reportConfigs = {charts: [configs[0], configs[1]]};

        $rootScope.$digest();
        $timeout.flush(5000);

        expect(element.html()).toContain('sda-chart__container');
        expect(element.find('svg').length).toBe(2);
    });
});
