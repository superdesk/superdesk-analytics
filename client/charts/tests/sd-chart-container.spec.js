describe('sd-chart-container', () => {
    let $compile;
    let $rootScope;
    let $timeout;
    let scope;
    let iscope;
    let configs;

    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.core.activity'));
    beforeEach(window.module('superdesk.analytics'));

    beforeEach(inject((_$compile_, _$rootScope_, _$timeout_) => {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $timeout = _$timeout_;
    }));

    beforeEach(() => {
        configs = [{
            id: 'test-chart-1',
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
        scope.configs = configs;

        const element = $compile(`<div
            sd-chart-container
            data-configs="configs"
        ></div>`)(scope);

        $rootScope.$digest();
        iscope = element.isolateScope();

        $timeout.flush(5000);

        return element;
    };

    it('renders 1 svg element', () => {
        const element = getElement([configs[0]]);

        expect(element.html()).toContain('sd-chart__container');
        expect(element.find('svg').length).toBe(1);
    });

    it('renders 2 svg elements', () => {
        const element = getElement([configs[0], configs[1]]);

        expect(element.html()).toContain('sd-chart__container');
        expect(element.find('svg').length).toBe(2);
    });

    it('updates the charts when config is updated', () => {
        const element = getElement([configs[0]]);

        expect(element.html()).toContain('sd-chart__container');
        expect(element.find('svg').length).toBe(1);

        iscope.configs = [configs[0], configs[1]];

        $rootScope.$digest();
        $timeout.flush(5000);

        expect(element.html()).toContain('sd-chart__container');
        expect(element.find('svg').length).toBe(2);
    });
});
