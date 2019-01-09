import {SDChart} from '../';

describe('SDChart.Axis', () => {
    const genConfig = (config) => {
        const chart = new SDChart.Chart({});

        chart.addAxis()
            .setOptions(config);

        return chart.genConfig();
    };

    it('can generate default config', () => {
        expect(
            genConfig({})
        ).toEqual(jasmine.objectContaining({
            xAxis: [{
                type: 'linear',
                allowDecimals: false,
                title: {text: undefined},
            }],
            yAxis: [{
                allowDecimals: false,
                title: {text: undefined},
                labels: {
                    enabled: true,
                    format: '{value}',
                },
            }],
            series: [],
        }));
    });

    it('can set different options', () => {
        expect(
            genConfig({type: 'datetime'})
        ).toEqual(jasmine.objectContaining({
            xAxis: [{
                type: 'datetime',
                allowDecimals: false,
                title: {text: undefined},
            }],
        }));

        expect(
            genConfig({defaultChartType: 'column'})
        ).toEqual(jasmine.objectContaining({
            chart: {zoomType: 'x'},
        }));

        expect(
            genConfig({defaultChartType: 'bar'})
        ).toEqual(jasmine.objectContaining({
            chart: {zoomType: 'y'},
        }));

        expect(
            genConfig({categories: ['cat1', 'cat2', 'cat3']})
        ).toEqual(jasmine.objectContaining({
            xAxis: [{
                type: 'linear',
                allowDecimals: false,
                categories: ['cat1', 'cat2', 'cat3'],
                title: {text: undefined},
            }],
        }));

        expect(
            genConfig({allowDecimals: true})
        ).toEqual(jasmine.objectContaining({
            xAxis: [{
                type: 'linear',
                allowDecimals: true,
                title: {text: undefined},
            }],
            yAxis: [{
                allowDecimals: true,
                title: {text: undefined},
                labels: {
                    enabled: true,
                    format: '{value}',
                },
            }],
        }));

        expect(
            genConfig({stackLabels: false})
        ).toEqual(jasmine.objectContaining({
            yAxis: [{
                allowDecimals: false,
                stackLabels: {enabled: false},
                title: {text: undefined},
                labels: {
                    enabled: true,
                    format: '{value}',
                },
            }],
        }));

        expect(
            genConfig({stackLabels: true})
        ).toEqual(jasmine.objectContaining({
            yAxis: [{
                allowDecimals: false,
                stackLabels: {enabled: true},
                title: {text: undefined},
                labels: {
                    enabled: true,
                    format: '{value}',
                },
            }],
        }));

        expect(
            genConfig({xTitle: 'Test X Title'})
        ).toEqual(jasmine.objectContaining({
            xAxis: [{
                type: 'linear',
                allowDecimals: false,
                title: {text: 'Test X Title'},
            }],
        }));

        expect(
            genConfig({yTitle: 'Test Y Title'})
        ).toEqual(jasmine.objectContaining({
            yAxis: [{
                allowDecimals: false,
                title: {text: 'Test Y Title'},
                labels: {
                    enabled: true,
                    format: '{value}',
                },
            }],
        }));
    });

    it('can translate categories', () => {
        const chart = new SDChart.Chart({});

        chart.setTranslation('categories', 'Category', {
            a: 'Advisories',
            b: 'Basketball',
            c: 'Cricket',
        });

        chart.addAxis()
            .setOptions({
                type: 'category',
                categories: ['b', 'c', 'a'],
                categoryField: 'categories',
                xTitle: chart.getTranslationTitle('categories'),
            });

        expect(chart.genConfig()).toEqual(jasmine.objectContaining({
            xAxis: [{
                type: 'category',
                allowDecimals: false,
                categories: ['Basketball', 'Cricket', 'Advisories'],
                title: {text: 'Category'},
            }],
        }));
    });
});
