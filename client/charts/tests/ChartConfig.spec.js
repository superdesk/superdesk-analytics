describe('chartConfig', () => {
    let chartConfig;
    let $rootScope;
    let metadata;
    let $q;
    let config;
    let desks;
    let userList;

    beforeEach(window.module('angularMoment'));
    beforeEach(window.module('superdesk.apps.users'));
    beforeEach(window.module('superdesk.apps.authoring.metadata'));
    beforeEach(window.module('superdesk.apps.desks'));
    beforeEach(window.module('superdesk.core.notify'));
    beforeEach(window.module('superdesk.analytics.charts'));

    beforeEach(inject((_$rootScope_, _chartConfig_, _metadata_, _$q_, _desks_, _userList_) => {
        $rootScope = _$rootScope_;
        chartConfig = _chartConfig_;
        metadata = _metadata_;
        $q = _$q_;
        desks = _desks_;
        userList = _userList_;

        metadata.values = {
            categories: [
                {qcode: 'a', name: 'Advisories'},
                {qcode: 'b', name: 'Basketball'},
                {qcode: 'c', name: 'Cricket'},
            ],
            urgency: [
                {qcode: 1, name: 1},
                {qcode: 2, name: 2},
                {qcode: 3, name: 3},
                {qcode: 4, name: 4},
                {qcode: 5, name: 5},
            ],
            genre: [
                {qcode: 'Article', name: 'Article (news)'},
                {qcode: 'Sidebar', name: 'Sidebar'},
                {qcode: 'Factbox', name: 'Factbox'},
            ]
        };
        spyOn(metadata, 'initialize').and.returnValue($q.when(metadata));

        spyOn(desks, 'fetchDesks').and.returnValue($q.when({
            _items: [
                {_id: 'desk1', name: 'Politic Desk'},
                {_id: 'desk2', name: 'Sports Desk'},
                {_id: 'desk3', name: 'System Desk'},
            ],
        }));

        spyOn(userList, 'getAll').and.returnValue($q.when([
            {_id: 'user1', display_name: 'first user'},
            {_id: 'user2', display_name: 'second user'},
            {_id: 'user3', display_name: 'last user'},
        ]));

        config = {};
    }));

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

    it('can generate single series', () => {
        const chart = genSingleChart('cid', 'bar');

        chart.title = 'Charts';
        chart.subtitle = 'For Today';

        expect(chart.isMultiSource()).toBe(false);

        expect(genConfig(chart)).toEqual({
            id: 'cid',
            type: 'bar',
            chart: {
                type: 'bar',
                zoomType: 'y',
            },
            title: {text: 'Charts'},
            subtitle: {text: 'For Today'},
            xAxis: {
                title: {text: 'Category'},
                categories: ['Basketball', 'Advisories', 'Cricket'],
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

        chart.sortOrder = 'asc';
        genConfig(chart);
        expect(config.xAxis).toEqual({
            title: {text: 'Category'},
            categories: ['Cricket', 'Advisories', 'Basketball'],
        });
        expect(config.series).toEqual([{
            name: 'Published Stories',
            data: [1, 3, 4],
        }]);

        chart.sortOrder = 'desc';
        genConfig(chart);
        expect(config.xAxis).toEqual({
            title: {text: 'Category'},
            categories: ['Basketball', 'Advisories', 'Cricket'],
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
        expect(genConfig(chart)).toEqual({
            id: 'cid',
            type: 'column',
            chart: {
                type: 'column',
                zoomType: 'x',
            },
            title: {text: 'Charts'},
            subtitle: {text: 'For Today'},
            xAxis: {
                title: {text: 'Category'},
                categories: ['Cricket', 'Basketball', 'Advisories'],
            },
            yAxis: {
                title: {text: 'Published Stories'},
                stackLabels: {enabled: true},
                allowDecimals: false,
            },
            legend: {
                enabled: true,
                title: {text: 'Urgency'},
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

        chart.sortOrder = 'asc';
        genConfig(chart);
        expect(config.xAxis).toEqual({
            title: {text: 'Category'},
            categories: ['Advisories', 'Basketball', 'Cricket'],
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
        genConfig(chart);
        expect(config.xAxis).toEqual({
            title: {text: 'Category'},
            categories: ['Cricket', 'Basketball', 'Advisories'],
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
        expect(genConfig(chart)).toEqual({
            id: 'tid',
            type: 'table',
            chart: {type: 'column'},
            title: 'Tables',
            subtitle: 'For Today',
            xAxis: {
                title: {text: 'Category'},
                categories: ['Basketball', 'Advisories', 'Cricket'],
            },
            series: [{
                name: 'Published Stories',
                data: [4, 3, 1],
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
        expect(config.xAxis).toEqual({
            title: {text: 'Category'},
            categories: ['Cricket', 'Advisories', 'Basketball'],
        });
        expect(config.series).toEqual([{
            name: 'Published Stories',
            data: [1, 3, 4],
        }]);
        expect(config.rows).toEqual([
            ['Cricket', 1],
            ['Advisories', 3],
            ['Basketball', 4],
        ]);

        chart.sortOrder = 'desc';
        genConfig(chart);
        expect(config.xAxis).toEqual({
            title: {text: 'Category'},
            categories: ['Basketball', 'Advisories', 'Cricket'],
        });
        expect(config.series).toEqual([{
            name: 'Published Stories',
            data: [4, 3, 1],
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
            xAxis: {
                title: {text: 'Category'},
                categories: ['Cricket', 'Basketball', 'Advisories'],
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
        expect(config.xAxis).toEqual({
            title: {text: 'Category'},
            categories: ['Advisories', 'Basketball', 'Cricket'],
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
            ['Advisories', 1, 1, 0, 2],
            ['Basketball', 1, 2, 0, 3],
            ['Cricket', 2, 1, 1, 4],
        ]);

        chart.sortOrder = 'desc';
        genConfig(chart);
        expect(config.xAxis).toEqual({
            title: {text: 'Category'},
            categories: ['Cricket', 'Basketball', 'Advisories'],
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
            ['Cricket', 2, 1, 1, 4],
            ['Basketball', 1, 2, 0, 3],
            ['Advisories', 1, 1, 0, 2],
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

        genConfig(chart);
        expect(config.title).toEqual({text: 'Charts - Testing'});
        expect(config.subtitle).toEqual({text: 'For Today - Test 2'});
        expect(config.xAxis).toEqual({
            title: {text: 'Category'},
            categories: ['Basketball', 'Advisories', 'Cricket'],
        });
    });

    describe('chart text translations', () => {
        it('translates anpa_category.qcode', () => {
            const chart = chartConfig.newConfig('category', 'bar');

            chart.addSource('anpa_category.qcode', {a: 3, b: 4, c: 1});

            expect(chartConfig.translations).toEqual({});

            chart.loadTranslations();
            $rootScope.$digest();
            expect(chartConfig.translations).toEqual({
                'anpa_category.qcode': {
                    title: 'Category',
                    names: {
                        a: 'Advisories',
                        b: 'Basketball',
                        c: 'Cricket',
                    },
                },
            });

            expect(chart.getXAxisConfig()).toEqual({
                title: {text: 'Category'},
                categories: ['Basketball', 'Advisories', 'Cricket'],
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

            expect(chart.getXAxisConfig()).toEqual({
                title: {text: 'Urgency'},
                categories: [1, 3, 5],
            });
        });

        it('translates genre.qcode', () => {
            const chart = chartConfig.newConfig('genre', 'bar');

            chart.addSource('genre.qcode', {Article: 4, Sidebar: 4, Factbox: 1});

            expect(chartConfig.translations).toEqual({});

            chart.loadTranslations();
            $rootScope.$digest();
            expect(chartConfig.translations).toEqual({
                'genre.qcode': {
                    title: 'Genre',
                    names: {
                        Article: 'Article (news)',
                        Sidebar: 'Sidebar',
                        Factbox: 'Factbox',
                    },
                },
            });

            expect(chart.getXAxisConfig()).toEqual({
                title: {text: 'Genre'},
                categories: ['Article (news)', 'Sidebar', 'Factbox'],
            });
        });

        it('translates task.desk', () => {
            const chart = chartConfig.newConfig('desk', 'bar');

            chart.addSource('task.desk', {desk1: 4, desk2: 5, desk3: 1});

            expect(chartConfig.translations).toEqual({});

            chart.loadTranslations();
            $rootScope.$digest();
            expect(chartConfig.translations).toEqual({
                'task.desk': {
                    title: 'Desk',
                    names: {
                        desk1: 'Politic Desk',
                        desk2: 'Sports Desk',
                        desk3: 'System Desk',
                    },
                },
            });

            expect(chart.getXAxisConfig()).toEqual({
                title: {text: 'Desk'},
                categories: ['Sports Desk', 'Politic Desk', 'System Desk'],
            });
        });

        it('translates task.user', () => {
            const chart = chartConfig.newConfig('user', 'bar');

            chart.addSource('task.user', {user1: 3, user2: 4, user3: 5});

            expect(chartConfig.translations).toEqual({});

            chart.loadTranslations();
            $rootScope.$digest();
            expect(chartConfig.translations).toEqual({
                'task.user': {
                    title: 'User',
                    names: {
                        user1: 'first user',
                        user2: 'second user',
                        user3: 'last user',
                    },
                },
            });

            expect(chart.getXAxisConfig()).toEqual({
                title: {text: 'User'},
                categories: ['last user', 'second user', 'first user'],
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
                    },
                },
            });

            expect(chart.getXAxisConfig()).toEqual({
                title: {text: 'State'},
                categories: ['Updated', 'Published', 'Killed'],
            });
        });

        it('translates source', () => {
            const chart = chartConfig.newConfig('state', 'bar');

            chart.addSource('source', {aap: 3, ftp: 1, ap: 5});

            expect(chartConfig.translations).toEqual({});

            chart.loadTranslations();
            $rootScope.$digest();
            expect(chartConfig.translations).toEqual({
                source: {title: 'Source'},
            });

            expect(chart.getXAxisConfig()).toEqual({
                title: {text: 'Source'},
                categories: ['ap', 'aap', 'ftp'],
            });
        });
    });
});
