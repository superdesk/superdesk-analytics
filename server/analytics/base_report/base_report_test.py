# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk import get_resource_service, json
from superdesk.metadata.item import ITEM_STATE, CONTENT_STATE
from superdesk.tests import TestCase

from analytics import init_app

from eve.utils import ParsedRequest
from werkzeug.datastructures import ImmutableMultiDict

aggregation_response = {
    'aggregations': {
        'source_category': {
            'buckets': [{
                'key': 'AAP',
                'doc_count': 2,
                'category': {
                    'buckets': [{
                        'key': 'Advisories',
                        'doc_count': 2
                    }]
                }
            }]
        }
    }
}


class BaseReportServiceTestCase(TestCase):
    def setUp(self):
        with self.app.app_context():
            init_app(self.app)
            self.app.config['DEFAULT_TIMEZONE'] = 'Australia/Sydney'
            self.service = get_resource_service('source_category_report')

            self.app.data.insert('vocabularies', [{
                '_id': 'categories',
                'items': [
                    {'is_active': True, 'name': 'Domestic Sport', 'qcode': 's'},
                    {'is_active': True, 'name': 'Finance', 'qcode': 'f'},
                    {'is_active': True, 'name': 'Advisories', 'qcode': 'v'}
                ]
            }])

            self.app.data.insert('published', [
                {
                    '_id': 'item1', 'task': {'desk': 'de1', 'stage': 'st1'}, ITEM_STATE: CONTENT_STATE.PUBLISHED,
                    'anpa_category': [{'qcode': 'v', 'name': 'Advisories'}], 'source': 'AAP'
                }
            ])

    def test_get_aggregation_buckets(self):
        with self.app.app_context():
            # Test source_category aggregation
            self.assertEqual(
                self.service.get_aggregation_buckets(aggregation_response),
                {
                    'source_category': [{
                        'key': 'AAP',
                        'doc_count': 2,
                        'category': {
                            'buckets': [{
                                'key': 'Advisories',
                                'doc_count': 2
                            }]
                        }
                    }]
                }
            )

            # Test unknown aggregation returns an empty array
            self.assertEqual(
                self.service.get_aggregation_buckets(aggregation_response, ['test']),
                {'test': []}
            )

    def test_generate_elastic_query_default(self):
        with self.app.app_context():
            query = self.service.generate_elastic_query({})
            self.assertEqual(query, {
                'source': {
                    'query': {'filtered': {'filter': {'bool': {
                        'must': [],
                        'must_not': []
                    }}}},
                    'sort': [{'versioncreated': 'desc'}],
                    'size': 0
                }
            })

    def test_generate_elastic_query_date_filters(self):
        with self.app.app_context():
            # DateFilters - Range
            query = self.service.generate_elastic_query({
                'params': {
                    'date_filter': 'range',
                    'start_date': '2018-06-30',
                    'end_date': '2018-06-30'
                }
            })
            self.assertEqual(query, {
                'source': {
                    'query': {'filtered': {'filter': {'bool': {
                        'must': [{
                            'range': {
                                'versioncreated': {
                                    'lt': '2018-06-30T23:59:59+1000',
                                    'gte': '2018-06-30T00:00:00+1000',
                                    'time_zone': '+1000'
                                }
                            }
                        }],
                        'must_not': []
                    }}}},
                    'sort': [{'versioncreated': 'desc'}],
                    'size': 0
                }
            })

            # DateFilters - Yesterday
            query = self.service.generate_elastic_query({'params': {'date_filter': 'yesterday'}})
            self.assertEqual(query, {
                'source': {
                    'query': {'filtered': {'filter': {'bool': {
                        'must': [{
                            'range': {
                                'versioncreated': {
                                    'lt': 'now/d',
                                    'gte': 'now-1d/d',
                                    'time_zone': '+1000'
                                }
                            }
                        }],
                        'must_not': []
                    }}}},
                    'sort': [{'versioncreated': 'desc'}],
                    'size': 0
                }
            })

            # DateFilters - Last Week
            query = self.service.generate_elastic_query({'params': {'date_filter': 'last_week'}})
            self.assertEqual(query, {
                'source': {
                    'query': {'filtered': {'filter': {'bool': {
                        'must': [{
                            'range': {
                                'versioncreated': {
                                    'lt': 'now/w',
                                    'gte': 'now-1w/w',
                                    'time_zone': '+1000'
                                }
                            }
                        }],
                        'must_not': []
                    }}}},
                    'sort': [{'versioncreated': 'desc'}],
                    'size': 0
                }
            })

            # DateFilters - Last Month
            query = self.service.generate_elastic_query({'params': {'date_filter': 'last_month'}})
            self.assertEqual(query, {
                'source': {
                    'query': {'filtered': {'filter': {'bool': {
                        'must': [{
                            'range': {
                                'versioncreated': {
                                    'lt': 'now/M',
                                    'gte': 'now-1M/M',
                                    'time_zone': '+1000'
                                }
                            }
                        }],
                        'must_not': []
                    }}}},
                    'sort': [{'versioncreated': 'desc'}],
                    'size': 0
                }
            })

    def test_generate_elastic_query_exclude_states(self):
        with self.app.app_context():
            query = self.service.generate_elastic_query({
                'params': {
                    'must_not': {
                        'states': {
                            'draft': False,
                            'ingested': False,
                            'in_progress': False,
                            'published': True,
                            'killed': True,
                            'corrected': True,
                            'recalled': False
                        }
                    }
                }
            })
            self.assertEqual(query, {
                'source': {
                    'query': {'filtered': {'filter': {'bool': {
                        'must': [],
                        'must_not': [{
                            'terms': {'state': ['corrected', 'killed', 'published']}
                        }]
                    }}}},
                    'sort': [{'versioncreated': 'desc'}],
                    'size': 0
                }
            })

    def test_generate_elastic_query_repos(self):
        with self.app.app_context():
            query = self.service.generate_elastic_query({
                'params': {
                    'repos': {
                        'ingest': False,
                        'archive': False,
                        'published': True,
                        'archived': True
                    }
                }
            })
            self.assertEqual(query, {
                'source': {
                    'query': {'filtered': {'filter': {'bool': {
                        'must': [],
                        'must_not': []
                    }}}},
                    'sort': [{'versioncreated': 'desc'}],
                    'size': 0
                },
                'repo': 'archived,published'
            })

    def test_generate_elastic_query_categories(self):
        with self.app.app_context():
            query = self.service.generate_elastic_query({
                'params': {
                    'must': {
                        'categories': {
                            'Domestic Sport': True,
                            'Finance': False,
                            'International Sport': True
                        }
                    },
                    'category_field': 'name'
                }
            })
            self.assertEqual(query, {
                'source': {
                    'query': {'filtered': {'filter': {'bool': {
                        'must': [{
                            'terms': {'anpa_category.name': [
                                'Domestic Sport',
                                'International Sport'
                            ]}
                        }],
                        'must_not': []
                    }}}},
                    'sort': [{'versioncreated': 'desc'}],
                    'size': 0
                }
            })

    def test_generate_elastic_query_sources(self):
        with self.app.app_context():
            query = self.service.generate_elastic_query({
                'params': {
                    'must': {
                        'sources': {
                            'AAP': True,
                            'Reuters': True,
                            'AP': False
                        }
                    }
                }
            })
            self.assertEqual(query, {
                'source': {
                    'query': {'filtered': {'filter': {'bool': {
                        'must': [{
                            'terms': {'source': ['AAP', 'Reuters']}
                        }],
                        'must_not': []
                    }}}},
                    'sort': [{'versioncreated': 'desc'}],
                    'size': 0
                }
            })

    def test_generate_elastic_query_exclude_rewrites(self):
        with self.app.app_context():
            query = self.service.generate_elastic_query({
                'params': {
                    'must_not': {'rewrites': True}
                }
            })

            self.assertEqual(query, {
                'source': {
                    'query': {'filtered': {'filter': {'bool': {
                        'must': [],
                        'must_not': [{
                            'exists': {'field': 'rewrite_of'}
                        }]
                    }}}},
                    'sort': [{'versioncreated': 'desc'}],
                    'size': 0
                }
            })

            query = self.service.generate_elastic_query({
                'params': {
                    'must_not': {'rewrites': False}
                }
            })
            self.assertEqual(query, {
                'source': {
                    'query': {'filtered': {'filter': {'bool': {
                        'must': [],
                        'must_not': []
                    }}}},
                    'sort': [{'versioncreated': 'desc'}],
                    'size': 0
                }
            })

    def test_generate_elastic_query_size(self):
        with self.app.app_context():
            query = self.service.generate_elastic_query({
                'params': {'size': 200}
            })
            self.assertEqual(query, {
                'source': {
                    'query': {'filtered': {'filter': {'bool': {
                        'must': [],
                        'must_not': []
                    }}}},
                    'sort': [{'versioncreated': 'desc'}],
                    'size': 200
                }
            })

    def test_get_with_request(self):
        params = {
            'source': {
                'query': {
                    'filtered': {
                        'filter': {
                            'bool': {
                                'must': [],
                                'must_not': []
                            }
                        }
                    }
                }
            },
            'params': {
                'date_filter': 'yesterday'
            },
            'repo': 'published',
            'return_type': 'text/csv'
        }
        expected_args = {
            'source': params['source'],
            'repo': params['repo'],
            'return_type': params['return_type']
        }
        request = ParsedRequest()

        # Request object with source as a json in string format
        request.args = {
            'source': json.dumps(params['source']),
            'repo': params['repo'],
            'return_type': params['return_type'],
        }
        args = self.service._get_request_or_lookup(req=request, lookup=None)
        self.assertEqual(args, expected_args)

        # Request object with args an ImmutableMultiDict
        request.args = ImmutableMultiDict({
            'source': json.dumps(params['source']),
            'repo': params['repo'],
            'return_type': params['return_type'],
        })
        args = self.service._get_request_or_lookup(req=request, lookup=None)
        self.assertEqual(args, expected_args)

        # Request object with source as a normal dict
        request.args = {
            'source': params['source'],
            'repo': params['repo'],
            'return_type': params['return_type'],
        }
        args = self.service._get_request_or_lookup(req=request, lookup=None)
        self.assertEqual(args, expected_args)

        # return_type default
        request.args = {
            'source': params['source'],
            'repo': params['repo'],
        }
        args = self.service._get_request_or_lookup(req=request, lookup=None)
        self.assertEqual(args.get('return_type'), 'aggregations')

        # Request object with params as json in string format
        expected_args = {
            'params': params['params'],
            'repo': params['repo'],
            'return_type': params['return_type']
        }
        request.args = {
            'params': json.dumps(params['params']),
            'repo': params['repo'],
            'return_type': params['return_type'],
        }
        args = self.service._get_request_or_lookup(req=request, lookup=None)
        self.assertEqual(args, expected_args)

        # Request object with params as a normal dict
        request.args = {
            'params': params['params'],
            'repo': params['repo'],
            'return_type': params['return_type'],
        }
        args = self.service._get_request_or_lookup(req=request, lookup=None)
        self.assertEqual(args, expected_args)

    def test_get_with_lookup(self):
        lookup = {
            'source': {
                'query': {
                    'filtered': {
                        'filter': {
                            'bool': {
                                'must': [],
                                'must_not': []
                            }
                        }
                    }
                }
            },
            'params': {
                'date_filter': 'yesterday'
            },
            'repo': 'published',
            'return_type': 'text/csv'
        }
        expected_args = {
            'source': lookup['source'],
            'repo': lookup['repo'],
            'return_type': lookup['return_type']
        }

        # Lookup with source as a json in string format
        args = self.service._get_request_or_lookup(
            req=None,
            source=json.dumps(lookup['source']),
            repo=lookup['repo'],
            return_type=lookup['return_type']
        )
        self.assertEqual(args, expected_args)

        # Lookup with source as a normal dict
        args = self.service._get_request_or_lookup(
            req=None,
            source=lookup['source'],
            repo=lookup['repo'],
            return_type=lookup['return_type']
        )
        self.assertEqual(args, expected_args)

        # return_type default
        args = self.service._get_request_or_lookup(
            req=None,
            source=lookup['source'],
            repo=lookup['repo']
        )
        self.assertEqual(args.get('return_type'), 'aggregations')

        # Lookup with params as json in string format
        expected_args = {
            'params': lookup['params'],
            'repo': lookup['repo'],
            'return_type': lookup['return_type']
        }
        args = self.service._get_request_or_lookup(
            req=None,
            params=json.dumps(lookup['params']),
            repo=lookup['repo'],
            return_type=lookup['return_type']
        )
        self.assertEqual(args, expected_args)

        # Lookup with params as normal dict
        args = self.service._get_request_or_lookup(
            req=None,
            params=lookup['params'],
            repo=lookup['repo'],
            return_type=lookup['return_type']
        )
        self.assertEqual(args, expected_args)
