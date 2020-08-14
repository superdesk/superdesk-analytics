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
import mock

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


def mock_get_timezone_offset(local_tz_name, utc_datetime):
    return '+1000'


@mock.patch('analytics.base_report.get_timezone_offset', mock_get_timezone_offset)
class BaseReportServiceTestCase(TestCase):
    def setUp(self):
        self.maxDiff = None

        with self.app.app_context():
            init_app(self.app)
            self.app.config['DEFAULT_TIMEZONE'] = 'Australia/Sydney'
            self.service = get_resource_service('analytics_test_report')

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

    def assert_bool_query(self, query, result):
        self.assertEqual(query, {
            'source': {
                'query': {
                    'filtered': {
                        'filter': {
                            'bool': result
                        }
                    }
                },
                'sort': [{'versioncreated': 'desc'}],
                'size': 0,
                'from': 0
            },
            'max_results': 0,
            'page': 1
        })

    def test_get_aggregation_buckets(self):
        with self.app.app_context():
            # Test source_category aggregation
            self.assertEqual(
                self.service.get_aggregation_buckets(aggregation_response, ['source_category']),
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
            self.assert_bool_query(query, {
                'must': [],
                'must_not': []
            })

    def test_generate_elastic_query_from_date_object(self):
        with self.app.app_context():
            # DateFilters - Range
            query = self.service.generate_elastic_query({
                'params': {
                    'dates': {
                        'filter': 'range',
                        'start': '2018-06-01',
                        'end': '2018-06-30'
                    }
                }
            })
            self.assert_bool_query(query, {
                'must': [{
                    'range': {
                        'versioncreated': {
                            'lt': '2018-06-30T23:59:59+1000',
                            'gte': '2018-06-01T00:00:00+1000',
                            'time_zone': '+1000'
                        }
                    }
                }],
                'must_not': []
            })

            # DateFilters - Day
            query = self.service.generate_elastic_query({
                'params': {
                    'dates': {
                        'filter': 'day',
                        'date': '2018-06-30'
                    }
                }
            })
            self.assert_bool_query(query, {
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
            })

            # DateFilters - Yesterday
            query = self.service.generate_elastic_query(
                {'params': {'dates': {'filter': 'yesterday'}}}
            )
            self.assert_bool_query(query, {
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
            })

            # DateFilters - Last Week
            query = self.service.generate_elastic_query(
                {'params': {'dates': {'filter': 'last_week'}}}
            )
            self.assert_bool_query(query, {
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
            })

            # DateFilters - Last Month
            query = self.service.generate_elastic_query(
                {'params': {'dates': {'filter': 'last_month'}}}
            )
            self.assert_bool_query(query, {
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
            })

            # DateFilters - Relative
            query = self.service.generate_elastic_query({
                'params': {
                    'dates': {
                        'filter': 'relative_hours',
                        'relative': 12
                    }
                }
            })
            self.assert_bool_query(query, {
                'must': [{
                    'range': {
                        'versioncreated': {
                            'lt': 'now',
                            'gte': 'now-12h/h',
                            'time_zone': '+1000'
                        }
                    }
                }],
                'must_not': []
            })

            # DateFilters - Relative Days
            query = self.service.generate_elastic_query({
                'params': {
                    'dates': {
                        'filter': 'relative_days',
                        'relative': 7
                    }
                }
            })
            self.assert_bool_query(query, {
                'must': [{
                    'range': {
                        'versioncreated': {
                            'lt': 'now',
                            'gte': 'now-7d/d',
                            'time_zone': '+1000'
                        }
                    }
                }],
                'must_not': []
            })

            # DateFilters - Today
            query = self.service.generate_elastic_query(
                {'params': {'dates': {'filter': 'today'}}}
            )
            self.assert_bool_query(query, {
                'must': [{
                    'range': {
                        'versioncreated': {
                            'lt': 'now',
                            'gte': 'now/d',
                            'time_zone': '+1000'
                        }
                    }
                }],
                'must_not': []
            })

            # DateFilters - This Week
            query = self.service.generate_elastic_query(
                {'params': {'dates': {'filter': 'this_week'}}}
            )
            self.assert_bool_query(query, {
                'must': [{
                    'range': {
                        'versioncreated': {
                            'lt': 'now',
                            'gte': 'now/w',
                            'time_zone': '+1000'
                        }
                    }
                }],
                'must_not': []
            })

            # DateFilters - This Month
            query = self.service.generate_elastic_query(
                {'params': {'dates': {'filter': 'this_month'}}}
            )
            self.assert_bool_query(query, {
                'must': [{
                    'range': {
                        'versioncreated': {
                            'lt': 'now',
                            'gte': 'now/M',
                            'time_zone': '+1000'
                        }
                    }
                }],
                'must_not': []
            })

    def test_generate_elastic_query_to_exclude_states(self):
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
            self.assert_bool_query(query, {
                'must': [],
                'must_not': [{
                    'terms': {'state': ['corrected', 'killed', 'published']}
                }]
            })

    def test_generate_elastic_query_for_repos(self):
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
                    'size': 0,
                    'from': 0
                },
                'repo': 'archived,published',
                'max_results': 0,
                'page': 1
            })

    def test_generate_elastic_query_for_desks(self):
        with self.app.app_context():
            query = self.service.generate_elastic_query(
                {'params': {'must': {'desks': ['desk1', 'desk2']}}}
            )
            self.assert_bool_query(query, {
                'must': [
                    {'terms': {'task.desk': ['desk1', 'desk2']}}
                ],
                'must_not': []
            })

            query = self.service.generate_elastic_query(
                {'params': {'must_not': {'desks': ['desk1', 'desk2']}}}
            )
            self.assert_bool_query(query, {
                'must': [],
                'must_not': [
                    {'terms': {'task.desk': ['desk1', 'desk2']}}
                ]
            })

    def test_generate_elastic_query_for_users(self):
        with self.app.app_context():
            query = self.service.generate_elastic_query(
                {'params': {'must': {'users': ['user1', 'user2']}}}
            )
            self.assert_bool_query(query, {
                'must': [
                    {'terms': {'task.user': ['user1', 'user2']}}
                ],
                'must_not': []
            })

            query = self.service.generate_elastic_query(
                {'params': {'must_not': {'users': ['user1', 'user2']}}}
            )
            self.assert_bool_query(query, {
                'must': [],
                'must_not': [
                    {'terms': {'task.user': ['user1', 'user2']}}
                ]
            })

    def test_generate_elastic_query_for_genre(self):
        with self.app.app_context():
            query = self.service.generate_elastic_query(
                {'params': {'must': {'genre': ['a', 'f']}}}
            )
            self.assert_bool_query(query, {
                'must': [
                    {'terms': {'genre.qcode': ['a', 'f']}}
                ],
                'must_not': []
            })

            query = self.service.generate_elastic_query(
                {'params': {'must_not': {'genre': ['a', 'f']}}}
            )
            self.assert_bool_query(query, {
                'must': [],
                'must_not': [
                    {'terms': {'genre.qcode': ['a', 'f']}}
                ]
            })

    def test_generate_elastic_query_for_urgency(self):
        with self.app.app_context():
            query = self.service.generate_elastic_query(
                {'params': {'must': {'urgency': [1, 3]}}}
            )
            self.assert_bool_query(query, {
                'must': [
                    {'terms': {'urgency': [1, 3]}}
                ],
                'must_not': []
            })

            query = self.service.generate_elastic_query(
                {'params': {'must_not': {'urgency': [1, 3]}}}
            )
            self.assert_bool_query(query, {
                'must': [],
                'must_not': [
                    {'terms': {'urgency': [1, 3]}}
                ]
            })

    def test_generate_elastic_query_for_ingest_providers(self):
        with self.app.app_context():
            query = self.service.generate_elastic_query(
                {'params': {'must': {'ingest_providers': ['ing1', 'ing2']}}}
            )
            self.assert_bool_query(query, {
                'must': [
                    {'terms': {'ingest_provider': ['ing1', 'ing2']}}
                ],
                'must_not': []
            })

            query = self.service.generate_elastic_query(
                {'params': {'must_not': {'ingest_providers': ['ing1', 'ing2']}}}
            )
            self.assert_bool_query(query, {
                'must': [],
                'must_not': [
                    {'terms': {'ingest_provider': ['ing1', 'ing2']}}
                ]
            })

    def test_generate_elastic_query_for_desk_stages(self):
        with self.app.app_context():
            query = self.service.generate_elastic_query(
                {'params': {'must': {'stages': ['sta1', 'sta2']}}}
            )
            self.assert_bool_query(query, {
                'must': [
                    {'terms': {'task.stage': ['sta1', 'sta2']}}
                ],
                'must_not': []
            })

            query = self.service.generate_elastic_query(
                {'params': {'must_not': {'stages': ['sta1', 'sta2']}}}
            )
            self.assert_bool_query(query, {
                'must': [],
                'must_not': [
                    {'terms': {'task.stage': ['sta1', 'sta2']}}
                ]
            })

    def test_generate_elastic_query_for_content_types(self):
        with self.app.app_context():
            query = self.service.generate_elastic_query(
                {'params': {'must': {'content_types': ['text', 'picture']}}}
            )
            self.assert_bool_query(query, {
                'must': [
                    {'terms': {'type': ['picture', 'text']}}
                ],
                'must_not': []
            })

            query = self.service.generate_elastic_query(
                {'params': {'must_not': {'content_types': ['text', 'picture']}}}
            )
            self.assert_bool_query(query, {
                'must': [],
                'must_not': [
                    {'terms': {'type': ['picture', 'text']}}
                ]
            })

    def test_generate_elastic_query_for_states(self):
        with self.app.app_context():
            query = self.service.generate_elastic_query(
                {'params': {'must': {'states': ['draft', 'ingested']}}}
            )
            self.assert_bool_query(query, {
                'must': [
                    {'terms': {'state': ['draft', 'ingested']}}
                ],
                'must_not': []
            })

            query = self.service.generate_elastic_query(
                {'params': {'must_not': {'states': ['corrected', 'killed']}}}
            )
            self.assert_bool_query(query, {
                'must': [],
                'must_not': [
                    {'terms': {'state': ['corrected', 'killed']}}
                ]
            })

    def test_generate_elastic_query_for_categories(self):
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
            self.assert_bool_query(query, {
                'must': [{
                    'terms': {
                        'anpa_category.name': [
                            'Domestic Sport',
                            'International Sport'
                        ]
                    }
                }],
                'must_not': []
            })

            query = self.service.generate_elastic_query({
                'params': {
                    'must_not': {
                        'categories': {
                            'Domestic Sport': True,
                            'Finance': False,
                            'International Sport': True
                        }
                    },
                    'category_field': 'name'
                }
            })
            self.assert_bool_query(query, {
                'must': [],
                'must_not': [{
                    'terms': {
                        'anpa_category.name': [
                            'Domestic Sport',
                            'International Sport'
                        ]
                    }
                }]
            })

    def test_generate_elastic_query_for_sources(self):
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
            self.assert_bool_query(query, {
                'must': [{
                    'terms': {'source': ['AAP', 'Reuters']}
                }],
                'must_not': []
            })

            query = self.service.generate_elastic_query({
                'params': {
                    'must_not': {
                        'sources': {
                            'AAP': True,
                            'Reuters': True,
                            'AP': False
                        }
                    }
                }
            })
            self.assert_bool_query(query, {
                'must': [],
                'must_not': [{
                    'terms': {'source': ['AAP', 'Reuters']}
                }]
            })

    def test_generate_elastic_query_to_exclude_rewrites(self):
        with self.app.app_context():
            query = self.service.generate_elastic_query({
                'params': {
                    'must_not': {'rewrites': True}
                }
            })
            self.assert_bool_query(query, {
                'must': [],
                'must_not': [{
                    'exists': {'field': 'rewrite_of'}
                }]
            })

            query = self.service.generate_elastic_query({
                'params': {
                    'must_not': {'rewrites': False}
                }
            })
            self.assert_bool_query(query, {
                'must': [],
                'must_not': []
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
                    'size': 200,
                    'from': 0
                },
                'max_results': 200,
                'page': 1
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
                'dates': {'filter': 'yesterday'}
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
                'dates': {'filter': 'yesterday'}
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

    def test_aggs_with_request(self):
        params = {
            'params': {'dates': {'filter': 'yesterday'}},
            'aggs': {
                'group': {'field': 'anpa_category.qcode'},
                'subgroup': {'field': 'urgency'}
            },
            'repo': 'published',
            'return_type': 'text/csv'
        }
        expected_args = {
            'params': params['params'],
            'aggs': params['aggs'],
            'repo': params['repo'],
            'return_type': params['return_type']
        }

        request = ParsedRequest()

        # Request object with source as a json in string format
        request.args = {
            'params': json.dumps(params['params']),
            'repo': params['repo'],
            'return_type': params['return_type'],
            'aggs': json.dumps(params['aggs'])
        }
        args = self.service._get_request_or_lookup(req=request, lookup=None)
        self.assertEqual(args, expected_args)

        # Request object with args an ImmutableMultiDict
        request.args = ImmutableMultiDict({
            'params': params['params'],
            'repo': params['repo'],
            'return_type': params['return_type'],
            'aggs': params['aggs']
        })
        args = self.service._get_request_or_lookup(req=request, lookup=None)
        self.assertEqual(args, expected_args)

        # Request object with source as a normal dict
        request.args = {
            'params': params['params'],
            'repo': params['repo'],
            'return_type': params['return_type'],
            'aggs': params['aggs']
        }
        args = self.service._get_request_or_lookup(req=request, lookup=None)
        self.assertEqual(args, expected_args)

    def test_aggs_with_lookup(self):
        lookup = {
            'params': {'dates': {'filter': 'yesterday'}},
            'aggs': {
                'group': {'field': 'anpa_category.qcode'},
                'subgroup': {'field': 'urgency'}
            },
            'repo': 'published',
            'return_type': 'text/csv'
        }
        expected_args = {
            'params': lookup['params'],
            'aggs': lookup['aggs'],
            'repo': lookup['repo'],
            'return_type': lookup['return_type']
        }

        # Lookup with aggs as a json in string format
        args = self.service._get_request_or_lookup(
            req=None,
            params=json.dumps(lookup['params']),
            repo=lookup['repo'],
            return_type=lookup['return_type'],
            aggs=json.dumps(lookup['aggs'])
        )
        self.assertEqual(args, expected_args)

        # Lookup with aggs as a normal dict
        args = self.service._get_request_or_lookup(
            req=None,
            params=lookup['params'],
            repo=lookup['repo'],
            return_type=lookup['return_type'],
            aggs=lookup['aggs']
        )
        self.assertEqual(args, expected_args)
