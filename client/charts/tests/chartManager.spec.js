describe('chartManager', () => {
    let mocks;
    let chartManager;
    let config;

    beforeEach(window.module('superdesk.core.notify'));
    beforeEach(window.module('superdesk.analytics.charts'));

    beforeEach(() => {
        mocks = {
            chart: {
                destroy: jasmine.createSpy(),
                reflow: jasmine.createSpy(),
                exportChartLocal: jasmine.createSpy(),
                getCSV: jasmine.createSpy(),
            },
        };

        mocks.highcharts = {
            setOptions: jasmine.createSpy(),
            chart: jasmine.createSpy().and.returnValue(mocks.chart),
        };

        window.module(($provide) => {
            $provide.value('Highcharts', mocks.highcharts);
        });

        inject(($injector) => {
            chartManager = $injector.get('chartManager');
        });

        config = {
            id: 'test-chart-1',
            chart: {type: 'bar'},
            title: {text: 'Fruit Consumption'},
            xAxis: {categories: ['Apples', 'Bananas', 'Oranges']},
            yAxis: {title: {text: 'Fruit eaten'}},
            series: [
                {name: 'Jane', data: [1, 0, 4]},
                {name: 'John', data: [5, 7, 3]},
            ],
        };
    });

    it('sets highcharts options on load', () => {
        expect(mocks.highcharts.setOptions.calls.count()).toBe(1);
        expect(chartManager.charts).toEqual({});
    });

    it('renders the chart and saves the instance', () => {
        // Creates the initial chart instance
        chartManager.create('target', config, config.id);
        expect(mocks.chart.destroy.calls.count()).toBe(0);
        expect(mocks.highcharts.chart.calls.count()).toBe(1);
        expect(mocks.highcharts.chart).toHaveBeenCalledWith(
            'target',
            Object.assign({}, config, chartManager.defaultConfig)
        );
        expect(Object.keys(chartManager.charts)).toEqual([config.id]);

        mocks.highcharts.chart.calls.reset();

        // Destroys the previous instance and creates a new instance
        chartManager.create('target', config, config.id);
        expect(mocks.chart.destroy.calls.count()).toBe(1);
        expect(mocks.highcharts.chart.calls.count()).toBe(1);
        expect(mocks.highcharts.chart).toHaveBeenCalledWith(
            'target',
            Object.assign({}, config, chartManager.defaultConfig)
        );
        expect(Object.keys(chartManager.charts)).toEqual([config.id]);

        mocks.chart.destroy.calls.reset();
        mocks.highcharts.chart.calls.reset();

        // Destroys and removes the instance from the service
        chartManager.destroy(config.id);
        expect(mocks.chart.destroy.calls.count()).toBe(1);
        expect(chartManager.charts).toEqual({});
    });
});
