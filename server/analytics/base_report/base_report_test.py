# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk import get_resource_service
from superdesk.metadata.item import ITEM_STATE, CONTENT_STATE
from superdesk.tests import TestCase

from analytics import init_app

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
            self.app.data.insert('published', [
                {
                    '_id': 'item1', 'task': {'desk': 'de1', 'stage': 'st1'}, ITEM_STATE: CONTENT_STATE.PUBLISHED,
                    'anpa_category': [{'qcode': 'v', 'name': 'Advisories'}]
                }
            ])
            init_app(self.app)

    def test_get_aggregation_buckets(self):
        with self.app.app_context():
            service = get_resource_service('source_category_report')

            # Test source_category aggregation
            self.assertEqual(
                service.get_aggregation_buckets(aggregation_response),
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
                service.get_aggregation_buckets(aggregation_response, ['test']),
                {'test': []}
            )
