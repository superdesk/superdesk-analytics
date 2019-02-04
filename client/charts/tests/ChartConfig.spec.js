import {mockAll} from '../../tests/mocks';

describe('chartConfig', () => {
    let chartConfig;
    let $rootScope;
    let config;

    beforeEach(window.module('angularMoment'));
    beforeEach(window.module('superdesk.apps.users'));
    beforeEach(window.module('superdesk.apps.authoring.metadata'));
    beforeEach(window.module('superdesk.apps.desks'));
    beforeEach(window.module('superdesk.core.notify'));
    beforeEach(window.module('superdesk.analytics.search'));
    beforeEach(window.module('superdesk.analytics.charts'));

    beforeEach(inject((_$rootScope_, _chartConfig_) => {
        $rootScope = _$rootScope_;
        chartConfig = _chartConfig_;

        config = {};
    }));

    mockAll();

    const genSingleChart = (chartId, chartType) => {
        const chart = chartConfig.newConfig(chartId, chartType);

        chart.addSource('anpa_category.qcode', {a: 3, b: 4, c: 1});
        return chart;
    };

    const genStackedChart = (chartId, chartType) => {
        const chart = chartConfig.newConfig(chartId, chartType);

        chart.addSource('anpa_category.qcode', {
            a: {1: 1, 3: 1},
            b: {1: 1, 3: 2},
            c: {1: 2, 3: 1, 5: 1},
        });
        chart.addSource('urgency', {1: 4, 3: 4, 5: 1});
        return chart;
    };

    const genConfig = (chart) => {
        chart.genConfig()
            .then((generatedConfig) => {
                config = generatedConfig;
            });
        $rootScope.$digest();

        return config;
    };

    const defaultConfig = {
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
        fullHeight: true,
        time: {useUTC: true},
    };

    it('can generate single series', () => {
        const chart = genSingleChart('cid', 'bar');

        chart.title = 'Charts';
        chart.subtitle = 'For Today';

        expect(chart.isMultiSource()).toBe(false);

        expect(genConfig(chart)).toEqual({
            id: 'cid',
            type: 'highcharts',
            chart: {
                zoomType: 'y',
            },
            title: {text: 'Charts'},
            subtitle: {text: 'For Today'},
            xAxis: [{
                title: {text: 'Category'},
                categories: ['Basketball', 'Advisories', 'Cricket'],
                type: 'category',
                allowDecimals: false,
            }],
            yAxis: [{
                title: {text: 'Published Stories'},
                stackLabels: {enabled: false},
                allowDecimals: false,
                labels: {
                    enabled: true,
                    format: '{value}',
                },
            }],
            legend: {enabled: false},
            tooltip: {
                headerFormat: '{point.x}: {point.y}',
                pointFormat: '',
            },
            plotOptions: {
                series: {dataLabels: {enabled: true}},
                bar: {colorByPoint: true},
                column: {colorByPoint: true},
            },
            series: [{
                name: 'Category',
                data: [4, 3, 1],
                type: 'bar',
                xAxis: 0,
            }],
            ...defaultConfig,
        });
    });

    it('can sort single series', () => {
        const chart = genSingleChart('cid', 'bar');

        chart.sortOrder = 'asc';
        genConfig(chart);
        expect(config.xAxis).toEqual([{
            title: {text: 'Category'},
            categories: ['Cricket', 'Advisories', 'Basketball'],
            type: 'category',
            allowDecimals: false,
        }]);
        expect(config.series).toEqual([{
            name: 'Category',
            data: [1, 3, 4],
            type: 'bar',
            xAxis: 0,
        }]);

        chart.sortOrder = 'desc';
        genConfig(chart);
        expect(config.xAxis).toEqual([{
            title: {text: 'Category'},
            categories: ['Basketball', 'Advisories', 'Cricket'],
            type: 'category',
            allowDecimals: false,
        }]);
        expect(config.series).toEqual([{
            name: 'Category',
            data: [4, 3, 1],
            type: 'bar',
            xAxis: 0,
        }]);
    });

    it('can generate stacked series', () => {
        const chart = genStackedChart('cid', 'column');

        chart.title = 'Charts';
        chart.subtitle = 'For Today';

        expect(chart.isMultiSource()).toBe(true);
        expect(genConfig(chart)).toEqual({
            id: 'cid',
            type: 'highcharts',
            chart: {zoomType: 'x'},
            title: {text: 'Charts'},
            subtitle: {text: 'For Today'},
            xAxis: [{
                title: {text: 'Category'},
                categories: ['Cricket', 'Basketball', 'Advisories'],
                type: 'category',
                allowDecimals: false,
            }],
            yAxis: [{
                title: {text: 'Published Stories'},
                stackLabels: {enabled: true},
                allowDecimals: false,
                labels: {
                    enabled: true,
                    format: '{value}',
                },
            }],
            legend: {
                enabled: true,
                title: {text: 'Urgency'},
            },
            tooltip: {
                headerFormat: '{series.name}/{point.x}: {point.y}',
                pointFormat: '',
            },
            plotOptions: {
                series: {dataLabels: {enabled: false}},
                bar: {colorByPoint: false},
                column: {colorByPoint: false},
            },
            series: [{
                name: '1',
                data: [2, 1, 1],
                xAxis: 0,
                type: 'column',
                stacking: 'normal',
                stack: 0,
            }, {
                name: '3',
                data: [1, 2, 1],
                xAxis: 0,
                type: 'column',
                stacking: 'normal',
                stack: 0,
            }, {
                name: '5',
                data: [1, 0, 0],
                xAxis: 0,
                type: 'column',
                stacking: 'normal',
                stack: 0,
            }],
            ...defaultConfig,
        });
    });

    it('can sort stacked series', () => {
        const chart = genStackedChart('cid', 'bar');

        chart.sortOrder = 'asc';
        genConfig(chart);
        expect(config.xAxis).toEqual([{
            title: {text: 'Category'},
            categories: ['Advisories', 'Basketball', 'Cricket'],
            type: 'category',
            allowDecimals: false,
        }]);
        expect(config.series).toEqual([{
            name: '1',
            data: [1, 1, 2],
            type: 'bar',
            xAxis: 0,
            stacking: 'normal',
            stack: 0,
        }, {
            name: '3',
            data: [1, 2, 1],
            type: 'bar',
            xAxis: 0,
            stacking: 'normal',
            stack: 0,
        }, {
            name: '5',
            data: [0, 0, 1],
            type: 'bar',
            xAxis: 0,
            stacking: 'normal',
            stack: 0,
        }]);

        chart.sortOrder = 'desc';
        genConfig(chart);
        expect(config.xAxis).toEqual([{
            title: {text: 'Category'},
            categories: ['Cricket', 'Basketball', 'Advisories'],
            type: 'category',
            allowDecimals: false,
        }]);
        expect(config.series).toEqual([{
            name: '1',
            data: [2, 1, 1],
            type: 'bar',
            xAxis: 0,
            stacking: 'normal',
            stack: 0,
        }, {
            name: '3',
            data: [1, 2, 1],
            type: 'bar',
            xAxis: 0,
            stacking: 'normal',
            stack: 0,
        }, {
            name: '5',
            data: [1, 0, 0],
            type: 'bar',
            xAxis: 0,
            stacking: 'normal',
            stack: 0,
        }]);
    });

    it('can generate single column table', () => {
        const chart = genSingleChart('tid', 'table');

        chart.title = 'Tables';
        chart.subtitle = 'For Today';
        expect(genConfig(chart)).toEqual({
            id: 'tid',
            type: 'table',
            chart: {type: 'column'},
            title: 'Tables',
            subtitle: 'For Today',
            xAxis: [{
                title: {text: 'Category'},
                categories: ['Basketball', 'Advisories', 'Cricket'],
                type: 'category',
                allowDecimals: false,
            }],
            series: [{
                name: 'Category',
                data: [4, 3, 1],
                xAxis: 0,
                type: 'column',
            }],
            headers: ['Category', 'Published Stories'],
            rows: [
                ['Basketball', 4],
                ['Advisories', 3],
                ['Cricket', 1],
            ],
        });
    });

    it('can sort single column table', () => {
        const chart = genSingleChart('tid', 'table');

        chart.sortOrder = 'asc';
        genConfig(chart);
        expect(config.xAxis).toEqual([{
            title: {text: 'Category'},
            categories: ['Cricket', 'Advisories', 'Basketball'],
            type: 'category',
            allowDecimals: false,
        }]);
        expect(config.series).toEqual([{
            name: 'Category',
            data: [1, 3, 4],
            xAxis: 0,
            type: 'column',
        }]);
        expect(config.rows).toEqual([
            ['Cricket', 1],
            ['Advisories', 3],
            ['Basketball', 4],
        ]);

        chart.sortOrder = 'desc';
        genConfig(chart);
        expect(config.xAxis).toEqual([{
            title: {text: 'Category'},
            categories: ['Basketball', 'Advisories', 'Cricket'],
            type: 'category',
            allowDecimals: false,
        }]);
        expect(config.series).toEqual([{
            name: 'Category',
            data: [4, 3, 1],
            xAxis: 0,
            type: 'column',
        }]);
        expect(config.rows).toEqual([
            ['Basketball', 4],
            ['Advisories', 3],
            ['Cricket', 1],
        ]);
    });

    it('can generate multi column table', () => {
        const chart = genStackedChart('tid', 'table');

        chart.title = 'Tables';
        chart.subtitle = 'For Today';

        expect(chart.isMultiSource()).toBe(true);
        expect(genConfig(chart)).toEqual({
            id: 'tid',
            type: 'table',
            chart: {type: 'column'},
            title: 'Tables',
            subtitle: 'For Today',
            xAxis: [{
                title: {text: 'Category'},
                categories: ['Cricket', 'Basketball', 'Advisories'],
                type: 'category',
                allowDecimals: false,
            }],
            series: [{
                name: '1',
                data: [2, 1, 1],
                xAxis: 0,
                type: 'column',
                stacking: 'normal',
                stack: 0,
            }, {
                name: '3',
                data: [1, 2, 1],
                xAxis: 0,
                type: 'column',
                stacking: 'normal',
                stack: 0,
            }, {
                name: '5',
                data: [1, 0, 0],
                xAxis: 0,
                type: 'column',
                stacking: 'normal',
                stack: 0,
            }],
            headers: ['Category', '1', '3', '5', 'Total Stories'],
            rows: [
                ['Cricket', 2, 1, 1, 4],
                ['Basketball', 1, 2, 0, 3],
                ['Advisories', 1, 1, 0, 2],
            ],
        });
    });

    it('test sort multi column table', () => {
        const chart = genStackedChart('tid', 'table');

        chart.sortOrder = 'asc';
        genConfig(chart);
        expect(config.xAxis).toEqual([{
            title: {text: 'Category'},
            categories: ['Advisories', 'Basketball', 'Cricket'],
            type: 'category',
            allowDecimals: false,
        }]);
        expect(config.series).toEqual([{
            name: '1',
            data: [1, 1, 2],
            xAxis: 0,
            type: 'column',
            stacking: 'normal',
            stack: 0,
        }, {
            name: '3',
            data: [1, 2, 1],
            xAxis: 0,
            type: 'column',
            stacking: 'normal',
            stack: 0,
        }, {
            name: '5',
            data: [0, 0, 1],
            xAxis: 0,
            type: 'column',
            stacking: 'normal',
            stack: 0,
        }]);
        expect(config.rows).toEqual([
            ['Advisories', 1, 1, 0, 2],
            ['Basketball', 1, 2, 0, 3],
            ['Cricket', 2, 1, 1, 4],
        ]);

        chart.sortOrder = 'desc';
        genConfig(chart);
        expect(config.xAxis).toEqual([{
            title: {text: 'Category'},
            categories: ['Cricket', 'Basketball', 'Advisories'],
            type: 'category',
            allowDecimals: false,
        }]);
        expect(config.series).toEqual([{
            name: '1',
            data: [2, 1, 1],
            xAxis: 0,
            type: 'column',
            stacking: 'normal',
            stack: 0,
        }, {
            name: '3',
            data: [1, 2, 1],
            xAxis: 0,
            type: 'column',
            stacking: 'normal',
            stack: 0,
        }, {
            name: '5',
            data: [1, 0, 0],
            xAxis: 0,
            type: 'column',
            stacking: 'normal',
            stack: 0,
        }]);
        expect(config.rows).toEqual([
            ['Cricket', 2, 1, 1, 4],
            ['Basketball', 1, 2, 0, 3],
            ['Advisories', 1, 1, 0, 2],
        ]);
    });

    describe('chart text translations', () => {
        it('translates anpa_category.qcode', () => {
            const chart = chartConfig.newConfig('category', 'bar');

            chart.addSource('anpa_category.qcode', {a: 3, b: 4, c: 1});

            expect(chartConfig.translations).toEqual({});

            chart.loadTranslations();
            $rootScope.$digest();
            expect(chartConfig.translations).toEqual({
                anpa_category_qcode: {
                    title: 'Category',
                    names: {
                        a: 'Advisories',
                        b: 'Basketball',
                        c: 'Cricket',
                    },
                },
            });
        });

        it('translates urgency', () => {
            const chart = chartConfig.newConfig('urgency', 'bar');

            chart.addSource('urgency', {1: 4, 3: 4, 5: 1});

            expect(chartConfig.translations).toEqual({});

            chart.loadTranslations();
            $rootScope.$digest();
            expect(chartConfig.translations).toEqual({
                urgency: {
                    title: 'Urgency',
                    names: {
                        1: 1,
                        2: 2,
                        3: 3,
                        4: 4,
                        5: 5,
                    },
                },
            });
        });

        it('translates genre.qcode', () => {
            const chart = chartConfig.newConfig('genre', 'bar');

            chart.addSource('genre.qcode', {Article: 4, Sidebar: 4, Factbox: 1});

            expect(chartConfig.translations).toEqual({});

            chart.loadTranslations();
            $rootScope.$digest();
            expect(chartConfig.translations).toEqual({
                genre_qcode: {
                    title: 'Genre',
                    names: {
                        Article: 'Article (news)',
                        Sidebar: 'Sidebar',
                        Factbox: 'Factbox',
                    },
                },
            });
        });

        it('translates task.desk', () => {
            const chart = chartConfig.newConfig('desk', 'bar');

            chart.addSource('task.desk', {desk1: 4, desk2: 5, desk3: 1});

            expect(chartConfig.translations).toEqual({});

            chart.loadTranslations();
            $rootScope.$digest();
            expect(chartConfig.translations).toEqual({
                task_desk: {
                    title: 'Desk',
                    names: {
                        desk1: 'Politic Desk',
                        desk2: 'Sports Desk',
                        desk3: 'System Desk',
                    },
                },
            });
        });

        it('translates task.user', () => {
            const chart = chartConfig.newConfig('user', 'bar');

            chart.addSource('task.user', {user1: 3, user2: 4, user3: 5});

            expect(chartConfig.translations).toEqual({});

            chart.loadTranslations();
            $rootScope.$digest();
            expect(chartConfig.translations).toEqual({
                task_user: {
                    title: 'User',
                    names: {
                        user1: 'first user',
                        user2: 'second user',
                        user3: 'last user',
                    },
                },
            });
        });

        it('translates state', () => {
            const chart = chartConfig.newConfig('state', 'bar');

            chart.addSource('state', {published: 3, killed: 1, updated: 5});

            expect(chartConfig.translations).toEqual({});

            chart.loadTranslations();
            $rootScope.$digest();
            expect(chartConfig.translations).toEqual({
                state: {
                    title: 'State',
                    names: {
                        published: 'Published',
                        killed: 'Killed',
                        corrected: 'Corrected',
                        updated: 'Updated',
                        recalled: 'Recalled',
                    },
                },
            });
        });

        it('translates source', () => {
            const chart = chartConfig.newConfig('state', 'bar');

            chart.addSource('source', {aap: 3, ftp: 1, ap: 5});

            expect(chartConfig.translations).toEqual({});

            chart.loadTranslations();
            $rootScope.$digest();
            expect(chartConfig.translations).toEqual({
                source: {
                    title: 'Source',
                    names: {},
                },
            });
        });
    });
});
