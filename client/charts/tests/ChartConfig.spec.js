describe('chartConfig', () => {
    let chartConfig;

    beforeEach(window.module('angularMoment'));
    beforeEach(window.module('superdesk.core.notify'));
    beforeEach(window.module('superdesk.analytics.charts'));

    beforeEach(() => {
        inject(($injector) => {
            chartConfig = $injector.get('chartConfig');
        });
    });

    const genSingleChart = (chartId, chartType) => {
        const chart = chartConfig.newConfig(chartId, chartType);

        chart.addSource('anpa_category.qcode', {a: 3, b: 4, c: 1});
        return chart;
    };

    const genStackedChart = (chartId, chartType) => {
        const chart = chartConfig.newConfig(chartId, chartType);

        chart.addSource('anpa_category.qcode', {
            a: {
                1: 1,
                3: 1,
            },
            b: {
                1: 1,
                3: 2,
            },
            c: {
                1: 2,
                3: 1,
                5: 1,
            },
        });
        chart.addSource('urgency', {1: 4, 3: 4, 5: 1});
        return chart;
    };

    it('can generate single series', () => {
        const chart = genSingleChart('cid', 'bar');

        chart.title = 'Charts';
        chart.subtitle = 'For Today';

        expect(chart.isMultiSource()).toBe(false);

        expect(chart.genConfig()).toEqual({
            id: 'cid',
            type: 'bar',
            chart: {
                type: 'bar',
                zoomType: 'y',
            },
            title: {text: 'Charts'},
            subtitle: {text: 'For Today'},
            xAxis: {
                title: {text: 'anpa_category.qcode'},
                categories: ['b', 'a', 'c'],
            },
            yAxis: {
                title: {text: 'Published Stories'},
                stackLabels: {enabled: false},
                allowDecimals: false,
            },
            legend: {enabled: false},
            tooltip: {
                headerFormat: '{point.x}: {point.y}',
                pointFormat: '',
            },
            plotOptions: {
                bar: {
                    colorByPoint: true,
                    dataLabels: {enabled: true},
                },
                column: {
                    colorByPoint: true,
                    dataLabels: {enabled: true},
                },
            },
            series: [{
                name: 'Published Stories',
                data: [4, 3, 1],
            }],
            credits: {enabled: false},
            exporting: {
                fallbackToExportServer: false,
                error: jasmine.any(Function),
                buttons: {
                    contextButton: {
                        menuItems: [
                            'printChart',
                            'downloadPNG',
                            'downloadJPEG',
                            'downloadSVG',
                            'downloadPDF',
                            'downloadCSV',
                        ],
                    },
                },
            },
        });
    });

    it('can sort single series', () => {
        const chart = genSingleChart('cid', 'bar');
        let config;

        chart.sortOrder = 'asc';
        config = chart.genConfig();
        expect(config.xAxis).toEqual({
            title: {text: 'anpa_category.qcode'},
            categories: ['c', 'a', 'b'],
        });
        expect(config.series).toEqual([{
            name: 'Published Stories',
            data: [1, 3, 4],
        }]);

        chart.sortOrder = 'desc';
        config = chart.genConfig();
        expect(config.xAxis).toEqual({
            title: {text: 'anpa_category.qcode'},
            categories: ['b', 'a', 'c'],
        });
        expect(config.series).toEqual([{
            name: 'Published Stories',
            data: [4, 3, 1],
        }]);
    });

    it('can generate stacked series', () => {
        const chart = genStackedChart('cid', 'column');

        chart.title = 'Charts';
        chart.subtitle = 'For Today';

        expect(chart.isMultiSource()).toBe(true);

        expect(chart.genConfig()).toEqual({
            id: 'cid',
            type: 'column',
            chart: {
                type: 'column',
                zoomType: 'x',
            },
            title: {text: 'Charts'},
            subtitle: {text: 'For Today'},
            xAxis: {
                title: {text: 'anpa_category.qcode'},
                categories: ['c', 'b', 'a'],
            },
            yAxis: {
                title: {text: 'Published Stories'},
                stackLabels: {enabled: true},
                allowDecimals: false,
            },
            legend: {
                enabled: true,
                title: {text: 'urgency'},
            },
            tooltip: {
                headerFormat: '{series.name}/{point.x}: {point.y}',
                pointFormat: '',
            },
            plotOptions: {
                bar: {
                    stacking: 'normal',
                    colorByPoint: false,
                },
                column: {
                    stacking: 'normal',
                    colorByPoint: false,
                },
            },
            series: [{
                name: '1',
                data: [2, 1, 1],
            }, {
                name: '3',
                data: [1, 2, 1],
            }, {
                name: '5',
                data: [1, 0, 0],
            }],
            credits: {enabled: false},
            exporting: {
                fallbackToExportServer: false,
                error: jasmine.any(Function),
                buttons: {
                    contextButton: {
                        menuItems: [
                            'printChart',
                            'downloadPNG',
                            'downloadJPEG',
                            'downloadSVG',
                            'downloadPDF',
                            'downloadCSV',
                        ],
                    },
                },
            },
        });
    });

    it('can sort stacked series', () => {
        const chart = genStackedChart('cid', 'bar');
        let config;

        chart.sortOrder = 'asc';
        config = chart.genConfig();
        expect(config.xAxis).toEqual({
            title: {text: 'anpa_category.qcode'},
            categories: ['a', 'b', 'c'],
        });
        expect(config.series).toEqual([{
            name: '1',
            data: [1, 1, 2],
        }, {
            name: '3',
            data: [1, 2, 1],
        }, {
            name: '5',
            data: [0, 0, 1],
        }]);

        chart.sortOrder = 'desc';
        config = chart.genConfig();
        expect(config.xAxis).toEqual({
            title: {text: 'anpa_category.qcode'},
            categories: ['c', 'b', 'a'],
        });
        expect(config.series).toEqual([{
            name: '1',
            data: [2, 1, 1],
        }, {
            name: '3',
            data: [1, 2, 1],
        }, {
            name: '5',
            data: [1, 0, 0],
        }]);
    });

    it('can generate single column table', () => {
        const chart = genSingleChart('tid', 'table');

        chart.title = 'Tables';
        chart.subtitle = 'For Today';

        expect(chart.isMultiSource()).toBe(false);
        expect(chart.genConfig()).toEqual({
            id: 'tid',
            type: 'table',
            chart: {type: 'column'},
            title: 'Tables',
            subtitle: 'For Today',
            xAxis: {
                title: {text: 'anpa_category.qcode'},
                categories: ['b', 'a', 'c'],
            },
            series: [{
                name: 'Published Stories',
                data: [4, 3, 1],
            }],
            headers: ['anpa_category.qcode', 'Published Stories'],
            rows: [
                ['b', 4],
                ['a', 3],
                ['c', 1],
            ],
        });
    });

    it('can sort single column table', () => {
        const chart = genSingleChart('tid', 'table');
        let config;

        chart.sortOrder = 'asc';
        config = chart.genConfig();
        expect(config.xAxis).toEqual({
            title: {text: 'anpa_category.qcode'},
            categories: ['c', 'a', 'b'],
        });
        expect(config.series).toEqual([{
            name: 'Published Stories',
            data: [1, 3, 4],
        }]);
        expect(config.rows).toEqual([
            ['c', 1],
            ['a', 3],
            ['b', 4],
        ]);

        chart.sortOrder = 'desc';
        config = chart.genConfig();
        expect(config.xAxis).toEqual({
            title: {text: 'anpa_category.qcode'},
            categories: ['b', 'a', 'c'],
        });
        expect(config.series).toEqual([{
            name: 'Published Stories',
            data: [4, 3, 1],
        }]);
        expect(config.rows).toEqual([
            ['b', 4],
            ['a', 3],
            ['c', 1],
        ]);
    });

    it('can generate multi column table', () => {
        const chart = genStackedChart('tid', 'table');

        chart.title = 'Tables';
        chart.subtitle = 'For Today';

        expect(chart.isMultiSource()).toBe(true);

        expect(chart.genConfig()).toEqual({
            id: 'tid',
            type: 'table',
            chart: {type: 'column'},
            title: 'Tables',
            subtitle: 'For Today',
            xAxis: {
                title: {text: 'anpa_category.qcode'},
                categories: ['c', 'b', 'a'],
            },
            series: [{
                name: '1',
                data: [2, 1, 1],
            }, {
                name: '3',
                data: [1, 2, 1],
            }, {
                name: '5',
                data: [1, 0, 0],
            }],
            headers: ['anpa_category.qcode', '1', '3', '5', 'Total Stories'],
            rows: [
                ['c', 2, 1, 1, 4],
                ['b', 1, 2, 0, 3],
                ['a', 1, 1, 0, 2],
            ],
        });
    });

    it('test sort multi column table', () => {
        const chart = genStackedChart('tid', 'table');
        let config;

        chart.sortOrder = 'asc';
        config = chart.genConfig();
        expect(config.xAxis).toEqual({
            title: {text: 'anpa_category.qcode'},
            categories: ['a', 'b', 'c'],
        });
        expect(config.series).toEqual([{
            name: '1',
            data: [1, 1, 2],
        }, {
            name: '3',
            data: [1, 2, 1],
        }, {
            name: '5',
            data: [0, 0, 1],
        }]);
        expect(config.rows).toEqual([
            ['a', 1, 1, 0, 2],
            ['b', 1, 2, 0, 3],
            ['c', 2, 1, 1, 4],
        ]);

        chart.sortOrder = 'desc';
        config = chart.genConfig();
        expect(config.xAxis).toEqual({
            title: {text: 'anpa_category.qcode'},
            categories: ['c', 'b', 'a'],
        });
        expect(config.series).toEqual([{
            name: '1',
            data: [2, 1, 1],
        }, {
            name: '3',
            data: [1, 2, 1],
        }, {
            name: '5',
            data: [1, 0, 0],
        }]);
        expect(config.rows).toEqual([
            ['c', 2, 1, 1, 4],
            ['b', 1, 2, 0, 3],
            ['a', 1, 1, 0, 2],
        ]);
    });

    it('can change chart functionality', () => {
        const chart = genSingleChart('cid', 'bar');

        chart.title = 'Charts';
        chart.subtitle = 'For Today';

        expect(chart.isMultiSource()).toBe(false);

        chart.getTitle = () => `${chart.title} - Testing`;
        chart.getSubtitle = () => `${chart.subtitle} - Test 2`;

        chart.getSourceName = (group) => {
            switch (group) {
            case 'anpa_category.qcode':
                return 'Category';
            case 'genre.qcode':
                return 'Genre';
            case 'source':
                return 'Source';
            case 'urgency':
                return 'Urgency';
            default:
                return group;
            }
        };

        chart.getSourceTitles = (sourceType, dataKeys) => (
            dataKeys.map((qcode) => {
                switch (qcode) {
                case 'a':
                    return 'Advisories';
                case 'b':
                    return 'Basketball';
                case 'c':
                    return 'Cricket';
                default:
                    return qcode;
                }
            })
        );

        const config = chart.genConfig();

        expect(config.title).toEqual({text: 'Charts - Testing'});
        expect(config.subtitle).toEqual({text: 'For Today - Test 2'});
        expect(config.xAxis).toEqual({
            title: {text: 'Category'},
            categories: ['Basketball', 'Advisories', 'Cricket'],
        });
    });
});
