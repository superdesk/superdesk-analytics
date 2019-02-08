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
            }],
        }));

        expect(genConfig(
            {},
            [
                {type: 'column'},
                {type: 'line'},
            ]
        )).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'column',
            }, {
                xAxis: 0,
                type: 'line',
            }],
        }));

        expect(genConfig(
            {},
            [
                {stack: 0, stackType: 'normal'},
                {stack: 0, stackType: 'normal'},
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
            }],
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
                data: [
                    {name: 'b', y: 6, className: ''},
                    {name: 'c', y: 10, className: ''},
                    {name: 'a', y: 2, className: ''},
                ],
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
                data: {a: 2, b: 6, c: 10},
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
                data: [
                    {name: 'Basketball', y: 6, className: ''},
                    {name: 'Cricket', y: 10, className: ''},
                    {name: 'Advisories', y: 2, className: ''},
                ],
            }],
        }));
    });

    it('can sort data', () => {
        let chart = new SDChart.Chart({});

        chart.addAxis()
            .setOptions({
                type: 'category',
                categories: ['a', 'b', 'c'],
                sortOrder: 'asc',
                xTitle: 'Category',
            })
            .addSeries()
            .setOptions({
                data: {a: 1, b: 10, c: 3},
            });

        expect(chart.genConfig()).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'bar',
                data: [
                    {name: 'a', y: 1, className: ''},
                    {name: 'c', y: 3, className: ''},
                    {name: 'b', y: 10, className: ''},
                ],
            }],
        }));

        chart = new SDChart.Chart({});

        chart.addAxis()
            .setOptions({
                type: 'category',
                categories: ['a', 'b', 'c'],
                sortOrder: 'desc',
                xTitle: 'Category',
            })
            .addSeries()
            .setOptions({
                data: {a: 1, b: 10, c: 3},
            });

        expect(chart.genConfig()).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'bar',
                data: [
                    {name: 'b', y: 10, className: ''},
                    {name: 'c', y: 3, className: ''},
                    {name: 'a', y: 1, className: ''},
                ],
            }],
        }));

        chart = new SDChart.Chart({});

        chart.addAxis()
            .setOptions({
                type: 'category',
                categories: ['a', 'b', 'c'],
                xTitle: 'Category',
            })
            .addSeries()
            .setOptions({
                data: {a: 1, b: 10, c: 3},
            });

        expect(chart.genConfig()).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'bar',
                data: [
                    {name: 'a', y: 1, className: ''},
                    {name: 'b', y: 10, className: ''},
                    {name: 'c', y: 3, className: ''},
                ],
            }],
        }));
    });

    it('can exclude empty data', () => {
        let chart = new SDChart.Chart({});

        chart.addAxis()
            .setOptions({
                type: 'category',
                categories: ['a', 'b', 'c'],
                xTitle: 'Category',
                excludeEmpty: true,
            })
            .addSeries()
            .setOptions({
                data: {a: 1, b: 0, c: 3},
            });

        expect(chart.genConfig()).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'bar',
                data: [
                    {name: 'a', y: 1, className: ''},
                    {name: 'c', y: 3, className: ''},
                ],
            }],
        }));

        chart = new SDChart.Chart({});

        chart.addAxis()
            .setOptions({
                type: 'category',
                categories: ['a', 'b', 'c'],
                xTitle: 'Category',
                excludeEmpty: false,
            })
            .addSeries()
            .setOptions({
                data: {a: 1, b: 0, c: 3},
            });

        expect(chart.genConfig()).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'bar',
                data: [
                    {name: 'a', y: 1, className: ''},
                    {name: 'b', y: 0, className: ''},
                    {name: 'c', y: 3, className: ''},
                ],
            }],
        }));
    });

    it('can set colours', () => {
        let chart = new SDChart.Chart({});

        chart.addAxis()
            .setOptions({
                type: 'category',
                categories: ['a', 'b', 'c'],
                xTitle: 'Category',
            })
            .addSeries()
            .setOptions({
                data: {a: 1, b: 10, c: 3},
                colours: {a: 'sda-blue', b: 'sda-green', c: 'sda-orange'},
            });

        expect(chart.genConfig()).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'bar',
                data: [
                    {name: 'a', y: 1, className: 'sda-blue'},
                    {name: 'b', y: 10, className: 'sda-green'},
                    {name: 'c', y: 3, className: 'sda-orange'},
                ],
            }],
        }));

        chart = new SDChart.Chart({});

        chart.addAxis()
            .setOptions({
                type: 'category',
                categories: ['a', 'b', 'c'],
                xTitle: 'Category',
            })
            .addSeries()
            .setOptions({
                data: {a: 1, b: 10, c: 3},
                colours: ['sda-blue', 'sda-green', 'sda-orange'],
            });

        expect(chart.genConfig()).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'bar',
                data: [
                    {name: 'a', y: 1, className: 'sda-blue'},
                    {name: 'b', y: 10, className: 'sda-green'},
                    {name: 'c', y: 3, className: 'sda-orange'},
                ],
            }],
        }));
    });

    it('can set the size', () => {
        const chart = new SDChart.Chart({});

        chart.addAxis()
            .setOptions({
                type: 'category',
                categories: ['a', 'b', 'c'],
                xTitle: 'Category',
            })
            .addSeries()
            .setOptions({
                data: {a: 1, b: 10, c: 3},
                size: 260,
            });

        expect(chart.genConfig()).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'bar',
                size: 260,
                data: [
                    {name: 'a', y: 1, className: ''},
                    {name: 'b', y: 10, className: ''},
                    {name: 'c', y: 3, className: ''},
                ],
            }],
        }));
    });

    it('can set pie chart to be a semi-circle', () => {
        let chart = new SDChart.Chart({});

        chart.addAxis()
            .setOptions({
                type: 'category',
                defaultChartType: 'pie',
                categories: ['a', 'b', 'c'],
                xTitle: 'Category',
            })
            .addSeries()
            .setOptions({
                data: {a: 1, b: 10, c: 3},
                semiCircle: true,
            });

        expect(chart.genConfig()).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'pie',
                startAngle: -90,
                endAngle: 90,
                innerSize: '50%',
                slicedOffset: 0,
                data: [
                    {name: 'a', y: 1, className: ''},
                    {name: 'b', y: 10, className: ''},
                    {name: 'c', y: 3, className: ''},
                ],
            }],
        }));

        // Ignores semiCircle if chart type is not a pie chart
        chart = new SDChart.Chart({});
        chart.addAxis()
            .setOptions({
                type: 'category',
                defaultChartType: 'bar',
                categories: ['a', 'b', 'c'],
                xTitle: 'Category',
            })
            .addSeries()
            .setOptions({
                data: {a: 1, b: 10, c: 3},
                semiCircle: true,
            });

        expect(chart.genConfig()).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'bar',
                data: [
                    {name: 'a', y: 1, className: ''},
                    {name: 'b', y: 10, className: ''},
                    {name: 'c', y: 3, className: ''},
                ],
            }],
        }));
    });

    it('can set the center of the chart', () => {
        const chart = new SDChart.Chart({});

        chart.addAxis()
            .setOptions({
                type: 'category',
                categories: ['a', 'b', 'c'],
                xTitle: 'Category',
            })
            .addSeries()
            .setOptions({
                data: {a: 1, b: 10, c: 3},
                center: ['50%', '75%'],
            });

        expect(chart.genConfig()).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'bar',
                center: ['50%', '75%'],
                data: [
                    {name: 'a', y: 1, className: ''},
                    {name: 'b', y: 10, className: ''},
                    {name: 'c', y: 3, className: ''},
                ],
            }],
        }));
    });

    it('can set showInLegend of the chart', () => {
        let chart = new SDChart.Chart({});

        chart.addAxis()
            .setOptions({
                type: 'category',
                categories: ['a', 'b', 'c'],
                xTitle: 'Category',
            })
            .addSeries()
            .setOptions({
                data: {a: 1, b: 10, c: 3},
                showInLegend: true,
            });

        expect(chart.genConfig()).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'bar',
                showInLegend: true,
                data: [
                    {name: 'a', y: 1, className: ''},
                    {name: 'b', y: 10, className: ''},
                    {name: 'c', y: 3, className: ''},
                ],
            }],
        }));

        chart = new SDChart.Chart({});

        chart.addAxis()
            .setOptions({
                type: 'category',
                categories: ['a', 'b', 'c'],
                xTitle: 'Category',
            })
            .addSeries()
            .setOptions({
                data: {a: 1, b: 10, c: 3},
                showInLegend: false,
            });

        expect(chart.genConfig()).toEqual(jasmine.objectContaining({
            series: [{
                xAxis: 0,
                type: 'bar',
                showInLegend: false,
                data: [
                    {name: 'a', y: 1, className: ''},
                    {name: 'b', y: 10, className: ''},
                    {name: 'c', y: 3, className: ''},
                ],
            }],
        }));
    });
});
