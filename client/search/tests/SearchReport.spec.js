describe('searchReport', () => {
    let searchReport;
    let api;
    let $q;

    beforeEach(window.module(($provide) => {
        // Use the superdesk.config.js/webpack.config.js application config
        $provide.constant('config', {
            // eslint-disable-next-line no-undef
            ...__SUPERDESK_CONFIG__,
            server: {url: ''},
            defaultTimezone: 'UTC',
        });
    }));

    beforeEach(window.module('superdesk.core.activity'));
    beforeEach(window.module('angularMoment'));
    beforeEach(window.module('superdesk.analytics.search'));

    beforeEach(inject((_searchReport_, _api_, _$q_) => {
        searchReport = _searchReport_;
        api = _api_;
        $q = _$q_;

        spyOn(api, 'query').and.returnValue($q.when({_items: []}));
    }));

    const expectBoolQuery = (endpoint, result) => {
        expect(api.query).toHaveBeenCalledWith(endpoint, {
            source: {
                query: {
                    filtered: {
                        filter: {
                            bool: result,
                        },
                    },
                },
                sort: [{versioncreated: 'desc'}],
                size: 0,
            },
            repo: '',
        });
    };

    it('can call api save for source_category_report endpoint', () => {
        searchReport.query('source_category_report', {});

        expectBoolQuery('source_category_report', {
            must: [],
            must_not: [],
        });
    });

    it('can generate list of excluded states', () => {
        searchReport.query('source_category_report', {
            must_not: {
                states: {
                    published: false,
                    killed: true,
                    corrected: true,
                    recalled: true,
                },
            },
        });

        expectBoolQuery('source_category_report', {
            must: [],
            must_not: [{terms: {state: ['killed', 'corrected', 'recalled']}}],
        });
    });

    it('can generate the list of repos to search', () => {
        searchReport.query('source_category_report', {
            repos: {
                ingest: false,
                archive: false,
                published: true,
                archived: true,
            },
        });

        expect(api.query).toHaveBeenCalledWith('source_category_report', {
            source: {
                query: {
                    filtered: {
                        filter: {
                            bool: {
                                must: [],
                                must_not: [],
                            },
                        },
                    },
                },
                sort: [{versioncreated: 'desc'}],
                size: 0,
            },
            repo: 'published,archived',
        });
    });

    it('can generate the date filters', () => {
        // Range
        searchReport.query('source_category_report', {
            dates: {
                filter: 'range',
                start: '01/06/2018',
                end: '30/06/2018',
            },
        });

        expectBoolQuery('source_category_report', {
            must: [{
                range: {
                    versioncreated: {
                        lt: '2018-06-30T23:59:59+0000',
                        gte: '2018-06-01T00:00:00+0000',
                        time_zone: '+00:00',
                    },
                },
            }],
            must_not: [],
        });

        // Yesterday
        searchReport.query('source_category_report', {dates: {filter: 'yesterday'}});

        expectBoolQuery('source_category_report', {
            must: [{
                range: {
                    versioncreated: {
                        lt: 'now/d',
                        gte: 'now-1d/d',
                        time_zone: '+00:00',
                    },
                },
            }],
            must_not: [],
        });

        // Last Week
        searchReport.query('source_category_report', {dates: {filter: 'last_week'}});

        expectBoolQuery('source_category_report', {
            must: [{
                range: {
                    versioncreated: {
                        lt: 'now/w',
                        gte: 'now-1w/w',
                        time_zone: '+00:00',
                    },
                },
            }],
            must_not: [],
        });

        // Last Month
        searchReport.query('source_category_report', {dates: {filter: 'last_month'}});

        expectBoolQuery('source_category_report', {
            must: [{
                range: {
                    versioncreated: {
                        lt: 'now/M',
                        gte: 'now-1M/M',
                        time_zone: '+00:00',
                    },
                },
            }],
            must_not: [],
        });
    });

    it('can generate the date filters using date.filter/start/end', () => {
        // Range
        searchReport.query('source_category_report', {
            dates: {
                filter: 'range',
                start: '01/06/2018',
                end: '30/06/2018',
            },
        });

        expectBoolQuery('source_category_report', {
            must: [{
                range: {
                    versioncreated: {
                        lt: '2018-06-30T23:59:59+0000',
                        gte: '2018-06-01T00:00:00+0000',
                        time_zone: '+00:00',
                    },
                },
            }],
            must_not: [],
        });

        // Yesterday
        searchReport.query('source_category_report', {dates: {filter: 'yesterday'}});

        expectBoolQuery('source_category_report', {
            must: [{
                range: {
                    versioncreated: {
                        lt: 'now/d',
                        gte: 'now-1d/d',
                        time_zone: '+00:00',
                    },
                },
            }],
            must_not: [],
        });

        // Last Week
        searchReport.query('source_category_report', {dates: {filter: 'last_week'}});

        expectBoolQuery('source_category_report', {
            must: [{
                range: {
                    versioncreated: {
                        lt: 'now/w',
                        gte: 'now-1w/w',
                        time_zone: '+00:00',
                    },
                },
            }],
            must_not: [],
        });

        // Last Month
        searchReport.query('source_category_report', {dates: {filter: 'last_month'}});

        expectBoolQuery('source_category_report', {
            must: [{
                range: {
                    versioncreated: {
                        lt: 'now/M',
                        gte: 'now-1M/M',
                        time_zone: '+00:00',
                    },
                },
            }],
            must_not: [],
        });
    });

    it('can generate category filters', () => {
        searchReport.query('source_category_report', {
            must: {
                categories: {
                    Finance: true,
                    Sport: false,
                    Advisories: true,
                },
            },
            category_field: 'name',
        });

        expectBoolQuery('source_category_report', {
            must: [{terms: {'anpa_category.name': ['Finance', 'Advisories']}}],
            must_not: [],
        });

        searchReport.query('source_category_report', {
            must: {
                categories: {
                    f: true,
                    a: false,
                    s: true,
                },
            },
        });

        expectBoolQuery('source_category_report', {
            must: [{terms: {'anpa_category.qcode': ['f', 's']}}],
            must_not: [],
        });
    });

    it('can generate source filters', () => {
        searchReport.query('source_category_report', {
            must: {
                sources: {
                    AAP: true,
                    Reuters: false,
                    AP: true,
                },
            },
        });

        expectBoolQuery('source_category_report', {
            must: [{terms: {source: ['AAP', 'AP']}}],
            must_not: [],
        });
    });

    it('can generate exclude rewrite filters', () => {
        searchReport.query('source_category_report', {
            must_not: {
                rewrites: true,
            },
        });

        expectBoolQuery('source_category_report', {
            must: [],
            must_not: [{exists: {field: 'rewrite_of'}}],
        });

        searchReport.query('source_category_report', {
            must_not: {
                rewrites: false,
            },
        });

        expectBoolQuery('source_category_report', {
            must: [],
            must_not: [],
        });
    });

    it('can generate desk filters', () => {
        searchReport.query(
            'source_category_report',
            {must: {desks: ['desk1', 'desk2']}}
        );

        expectBoolQuery('source_category_report', {
            must: [{terms: {'task.desk': ['desk1', 'desk2']}}],
            must_not: [],
        });

        searchReport.query(
            'source_category_report',
            {must_not: {desks: ['desk1', 'desk2']}}
        );

        expectBoolQuery('source_category_report', {
            must: [],
            must_not: [{terms: {'task.desk': ['desk1', 'desk2']}}],
        });
    });

    it('can generate user filters', () => {
        searchReport.query(
            'source_category_report',
            {must: {users: ['user1', 'user2']}}
        );

        expectBoolQuery('source_category_report', {
            must: [{terms: {'task.user': ['user1', 'user2']}}],
            must_not: [],
        });

        searchReport.query(
            'source_category_report',
            {must_not: {users: ['user1', 'user2']}}
        );

        expectBoolQuery('source_category_report', {
            must: [],
            must_not: [{terms: {'task.user': ['user1', 'user2']}}],
        });
    });

    it('can generate urgency filters', () => {
        searchReport.query(
            'source_category_report',
            {must: {urgency: [1, 3]}}
        );

        expectBoolQuery('source_category_report', {
            must: [{terms: {urgency: [1, 3]}}],
            must_not: [],
        });

        searchReport.query(
            'source_category_report',
            {must_not: {urgency: [1, 3]}}
        );

        expectBoolQuery('source_category_report', {
            must: [],
            must_not: [{terms: {urgency: [1, 3]}}],
        });
    });

    describe('can send query as param object', () => {
        it('param object for dates', () => {
            searchReport.query(
                'source_category_report',
                {
                    dates: {
                        filter: 'range',
                        start: '01/06/2018',
                        end: '30/06/2018',
                    },
                },
                true
            );

            expect(api.query).toHaveBeenCalledWith('source_category_report', {
                params: {
                    dates: {
                        filter: 'range',
                        start: '2018-06-01',
                        end: '2018-06-30',
                    },
                    must: {},
                    must_not: {},
                    chart: {},
                },
            });

            searchReport.query(
                'source_category_report',
                {
                    dates: {
                        filter: 'yesterday',
                        start: '01/06/2018',
                        end: '30/06/2018',
                    },
                },
                true
            );

            expect(api.query).toHaveBeenCalledWith('source_category_report', {
                params: {
                    dates: {filter: 'yesterday'},
                    must: {},
                    must_not: {},
                    chart: {},
                },
            });

            searchReport.query(
                'source_category_report',
                {
                    dates: {
                        filter: 'range',
                        start: '01/06/2018',
                        end: '30/06/2018',
                    },
                },
                true
            );

            expect(api.query).toHaveBeenCalledWith('source_category_report', {
                params: {
                    dates: {
                        filter: 'range',
                        start: '2018-06-01',
                        end: '2018-06-30',
                    },
                    must: {},
                    must_not: {},
                    chart: {},
                },
            });

            searchReport.query(
                'source_category_report',
                {
                    dates: {
                        filter: 'yesterday',
                        start: '01/06/2018',
                        end: '30/06/2018',
                    },
                },
                true
            );

            expect(api.query).toHaveBeenCalledWith('source_category_report', {
                params: {
                    dates: {filter: 'yesterday'},
                    must: {},
                    must_not: {},
                    chart: {},
                },
            });
        });

        it('param object for filtered must/must_not', () => {
            searchReport.query(
                'source_category_report',
                {
                    dates: {filter: 'yesterday'},
                    must: {
                        desks: [],
                        users: ['user1', 'user2'],
                        states: {
                            published: true,
                            killed: false,
                        },
                    },
                    must_not: {
                        urgency: [],
                        categories: ['a', 'b'],
                        rewrites: false,
                    },
                },
                true
            );

            expect(api.query).toHaveBeenCalledWith('source_category_report', {
                params: {
                    dates: {filter: 'yesterday'},
                    must: {
                        users: ['user1', 'user2'],
                        states: {published: true},
                    },
                    must_not: {
                        categories: ['a', 'b'],
                    },
                    chart: {},
                },
            });
        });

        it('includes aggregations', () => {
            searchReport.query(
                'source_category_report',
                {
                    dates: {filter: 'yesterday'},
                    aggs: {
                        group: {field: 'anpa_category.qcode'},
                        subgroup: {field: 'urgency'},
                    },
                },
                true
            );

            expect(api.query).toHaveBeenCalledWith('source_category_report', {
                params: {
                    dates: {filter: 'yesterday'},
                    must: {},
                    must_not: {},
                    chart: {},
                },
                aggs: {
                    group: {field: 'anpa_category.qcode'},
                    subgroup: {field: 'urgency'},
                },
            });
        });

        it('includes repos', () => {
            searchReport.query(
                'source_category_report',
                {
                    dates: {filter: 'yesterday'},
                    repos: {
                        ingest: false,
                        archive: false,
                        published: true,
                        archived: true,
                    },
                },
                true
            );

            expect(api.query).toHaveBeenCalledWith('source_category_report', {
                params: {
                    dates: {filter: 'yesterday'},
                    must: {},
                    must_not: {},
                    chart: {},
                },
                repo: {
                    published: true,
                    archived: true,
                },
            });
        });

        it('includes return_type', () => {
            searchReport.query(
                'source_category_report',
                {
                    dates: {filter: 'yesterday'},
                    return_type: 'highcharts_config',
                },
                true
            );

            expect(api.query).toHaveBeenCalledWith('source_category_report', {
                params: {
                    dates: {filter: 'yesterday'},
                    must: {},
                    must_not: {},
                    chart: {},
                },
                return_type: 'highcharts_config',
            });
        });
    });
});