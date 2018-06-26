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
from superdesk.metadata.utils import aggregations_manager

ITEMS_OVER_DAYS = 'items_over_days'
ITEMS_OVER_HOURS = 'items_over_hours'
SOURCE_CATEGORY = 'source_category'

items_over_days_aggregation = (ITEMS_OVER_DAYS, {'date_histogram': {'field': '_updated', 'interval': 'day'}})
items_over_hours_aggregation = (ITEMS_OVER_HOURS, {'date_histogram': {'field': '_updated', 'interval': 'hour'}})
source_category_aggregation = (SOURCE_CATEGORY, {
    'terms': {
        'field': 'source',
        'size': 0
    },
    'aggs': {
        'category': {
            'terms': {
                'field': 'anpa_category.name',
                'size': 0
            }
        }
    }
})


def get_aggregations(aggregations, request):
    """Utility to retrieve aggregation buckets for the supplied request

    Using the supplied request, query the search endpoint,
    using the supplied aggregations and the aggregations manager.

    :param aggregations: List of tuples to query for
    :param request: The request used to query for stories
    :return items, buckets: Dict containing the aggregation buckets for each aggregation supplied.
    """
    with aggregations_manager(aggregations):
        items = get_resource_service('search').get(req=request, lookup=None)
        buckets = {}
        for aggregation_id, _ in aggregations:
            buckets[aggregation_id] = (items.hits.get('aggregations') or {}).get(aggregation_id) or {}
        return buckets
