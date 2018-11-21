import {SDChart} from '../';

describe('SDChart.Series', () => {
    const genConfig = (axisConfig, seriesConfig) => {
        const chart = new SDChart.Chart({});

        const axis = chart.addAxis()
            .setOptions(axisConfig);

        if (Array.isArray(seriesConfig)) {
            seriesConfig.forEach((series) => {
                axis.addSeries()
                    .setOptions(series);
            });
        } else {
            axis.addSeries()
                .setOptions(seriesConfig);
        }

        return chart.genConfig();
    };

    it('can generate default config', () => {
        expect(genConfig(
            {},
            {}
        )).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'bar',
            }],
        }));

        expect(genConfig(
            {defaultChartType: 'column'},
            {}
        )).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'column',
            }],
        }));

        expect(genConfig(
            {index: 1},
            {}
        )).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 1,
                type: 'bar',
            }],
        }));
    });

    it('can add multiple series to an axis', () => {
        expect(genConfig(
            {},
            [{}, {}]
        )).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'bar',
            }, {
                xAxis: 0,
                type: 'bar',
            }]
        }));

        expect(genConfig(
            {},
            [
                {type: 'column'},
                {type: 'line'}
            ]
        )).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'column',
            }, {
                xAxis: 0,
                type: 'line',
            }]
        }));

        expect(genConfig(
            {},
            [
                {stack: 0, stackType: 'normal'},
                {stack: 0, stackType: 'normal'}
            ]
        )).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'bar',
                stack: 0,
                stacking: 'normal',
            }, {
                xAxis: 0,
                type: 'bar',
                stack: 0,
                stacking: 'normal',
            }]
        }));
    });

    it('can generate config for series data', () => {
        expect(genConfig(
            {},
            {name: 'Test Data', data: [5, 2, 8, 1]}
        )).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'bar',
                name: 'Test Data',
                data: [5, 2, 8, 1],
            }],
        }));


        expect(genConfig(
            {},
            [
                {name: 'Test Data 1', data: [5, 2, 8, 1]},
                {name: 'Test Data 2', data: [3, 1, 18, 3]},
            ]
        )).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'bar',
                name: 'Test Data 1',
                data: [5, 2, 8, 1],
            }, {
                xAxis: 0,
                type: 'bar',
                name: 'Test Data 2',
                data: [3, 1, 18, 3],
            }],
        }));
    });

    it('can generate category based config', () => {
        expect(genConfig(
            {categories: ['b', 'c', 'a']},
            {name: 'Test Data', data: {a: 2, b: 6, c: 10}}
        )).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'bar',
                name: 'Test Data',
                data: [6, 10, 2],
            }],
        }));

        const chart = new SDChart.Chart({});

        chart.setTranslation('categories', 'Category', {
            a: 'Advisories',
            b: 'Basketball',
            c: 'Cricket',
        });

        const axis = chart.addAxis()
            .setOptions({
                type: 'category',
                categories: ['b', 'c', 'a'],
                categoryField: 'categories',
                xTitle: chart.getTranslationTitle('categories'),
            });

        axis.addSeries()
            .setOptions({
                field: 'categories',
                data: {a: 2, b: 6, c: 10}
            });

        expect(chart.genConfig()).toEqual(jasmine.objectContaining({
            xAxis: [{
                type: 'category',
                allowDecimals: false,
                categories: ['Basketball', 'Cricket', 'Advisories'],
                title: {text: 'Category'},
            }],
            series: [{
                xAxis: 0,
                type: 'bar',
                name: 'Category',
                data: [6, 10, 2],
            }],
        }));
    });
});
