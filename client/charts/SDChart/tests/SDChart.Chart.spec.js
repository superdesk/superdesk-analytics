import {SDChart} from '../';

describe('SDChart.Chart', () => {
    const genConfig = (config) => (
        (new SDChart.Chart(config)).genConfig()
    );

    it('can generate default config', () => {
        expect(
            genConfig({id: 'test_chart'})
        ).toEqual({
            id: 'test_chart',
            type: 'highcharts',
            chart: {},
            time: {useUTC: true},
            legend: {enabled: false},
            tooltip: {enabled: false},
            plotOptions: {series: {dataLabels: {enabled: false}}},
            fullHeight: false,
            shadow: true,
            title: {text: ''},
        });

        expect(genConfig({
            id: 'test_chart',
            defaultConfig: {
                credits: {enabled: false},
                title: {text: 'Default Title'},
                subtitle: {text: 'Default Subtitle'},
                plotOptions: {series: {shadow: true}},
            },
        })).toEqual({
            id: 'test_chart',
            type: 'highcharts',
            chart: {},
            time: {useUTC: true},
            legend: {enabled: false},
            tooltip: {enabled: false},
            plotOptions: {
                series: {
                    dataLabels: {enabled: false},
                    shadow: true,
                },
            },
            credits: {enabled: false},
            title: {text: 'Default Title'},
            subtitle: {text: 'Default Subtitle'},
            fullHeight: false,
            shadow: true,
        });
    });

    it('can set different options', () => {
        expect(
            genConfig({chartType: 'table'})
        ).toEqual(jasmine.objectContaining({
            type: 'table',
        }));

        expect(
            genConfig({title: 'Test Title'})
        ).toEqual(jasmine.objectContaining({
            title: {text: 'Test Title'},
        }));

        expect(
            genConfig({subtitle: 'Test Subtitle'})
        ).toEqual(jasmine.objectContaining({
            subtitle: {text: 'Test Subtitle'},
        }));

        expect(
            genConfig({timezoneOffset: 660})
        ).toEqual(jasmine.objectContaining({
            time: {
                timezoneOffset: 660,
                useUTC: true,
            },
        }));

        expect(
            genConfig({useUTC: false})
        ).toEqual(jasmine.objectContaining({
            time: {useUTC: false},
        }));

        expect(
            genConfig({height: 400})
        ).toEqual(jasmine.objectContaining({
            chart: {height: 400},
        }));

        expect(
            genConfig({legendTitle: 'Test Legend'})
        ).toEqual(jasmine.objectContaining({
            legend: {
                enabled: true,
                title: {text: 'Test Legend'},
                useHTML: true,
            },
        }));

        expect(
            genConfig({
                tooltipHeader: 'Tool Header {point.x}',
                tooltipPoint: 'Tool Point {point.y}',
            })
        ).toEqual(jasmine.objectContaining({
            tooltip: {
                enabled: true,
                headerFormat: 'Tool Header {point.x}',
                pointFormat: 'Tool Point {point.y}',
            },
        }));

        expect(
            genConfig({
                dataLabels: true,
                colourByPoint: true,
            })
        ).toEqual(jasmine.objectContaining({
            plotOptions: {
                series: {dataLabels: {enabled: true}},
                bar: {colorByPoint: true},
                column: {colorByPoint: true},
            },
        }));

        expect(
            genConfig({
                dataLabels: false,
                colourByPoint: false,
            })
        ).toEqual(jasmine.objectContaining({
            plotOptions: {
                series: {dataLabels: {enabled: false}},
                bar: {colorByPoint: false},
                column: {colorByPoint: false},
            },
        }));

        expect(
            genConfig({fullHeight: true})
        ).toEqual(jasmine.objectContaining({
            fullHeight: true,
        }));
    });
});
