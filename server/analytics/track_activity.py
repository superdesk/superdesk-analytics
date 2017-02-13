# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2016 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.services import BaseService

from superdesk.metadata.item import metadata_schema
from superdesk.resource import Resource
import superdesk
from itertools import groupby


class TrackActivityResource(Resource):
    """Track user's items schema
    """

    schema = {
        'user': metadata_schema['original_creator'],
        'desk': Resource.rel('desks', True),
        'stage': Resource.rel('stages', True)
    }

    item_methods = ['GET', 'DELETE']
    resource_methods = ['POST']

    privileges = {'POST': 'track_users_report', 'DELETE': 'track_users_report', 'GET': 'track_users_report'}


class TrackActivityService(BaseService):
    def create_query(self, doc):

        archive_version_query = {
            '$and': [
                {'task.user': str(doc['user'])},
                {'task.desk': str(doc['desk'])},
                {'task.stage': str(doc['stage'])}
            ]
        }

        return archive_version_query

    def get_items(self, query):
        archive_version_items = superdesk.get_resource_service('archive_versions').get(req=None, lookup=query)
        return archive_version_items

    # returns the item-versioncreated pair from archive_versions
    def establish_time(self, query, state):
        all_items = self.get_items(query)
        items = [(i['guid'], i['versioncreated']) for i in all_items if (i['state'] in state)]
        time_item_pair = []
        pairs = [(key,) + tuple(elem for _, elem in group) for key, group in groupby(items, lambda pair: pair[0])]
        for element in pairs:
            time_item_pair.append((element[0], element[-1]))

        return time_item_pair

    def get_each_item_time(self, query, items):
        item_start_time = []
        item_end_time = []
        list_of_items = []
        for it in items:
            list_of_items.append(it['guid'])
            individual_items = set(list_of_items)
        # returns the item-versioncreated pair of all started items
        in_progress = self.establish_time(query, ('in_progress', 'submitted', 'created'))
        # returns the item-versioncreated pair of all resolved items
        resolved = self.establish_time(query, ('published', 'corrected'))
        for i in individual_items:
            for p in in_progress:
                if i == p[0]:
                    item_start_time.append((i, p[-1]))
        for i in individual_items:
            for r in resolved:
                if i == r[0]:
                    item_end_time.append((i, r[-1]))

        return item_start_time, item_end_time

    def search_without_grouping(self, doc):
        query = self.create_query(doc)
        items = self.get_items(query)
        result_list = []
        details = []

        item_start_time, item_end_time = self.get_each_item_time(query, items)
        for i in item_start_time:
            for j in item_end_time:
                if i[0] == j[0]:
                    details.append((i[0], i[-1], j[-1]))
        for element in details:
            elements = {'item_id': element[0], 'entered_stage_at': element[1], 'left_stage': element[2],
                        'time_elapsed': str(element[2] - element[1])}
            result_list.append(elements)

        return {'info': result_list}

    def create(self, docs):
        for doc in docs:
            doc['report'] = self.search_without_grouping(doc)
        docs = super().create(docs)
        return docs
