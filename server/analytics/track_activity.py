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
    def get_items(self, query):
        """Returns the result of the item search by the given query.

        :param dict query: query on user, desk and stage
        :return Cursor: cursor on items list
        """
        archive_version_items = superdesk.get_resource_service('archive_versions').get(req=None, lookup=query)
        return archive_version_items

    def establish_time(self, query, state):
        """Returns the item-versioncreated pair from archive_versions

        :param dict query: query on user, desk and stage
        :param string state: state in_progress, submitted, created
        :return List of tuples
        """
        all_items = self.get_items(query)
        items = [(i['guid'], i['versioncreated']) for i in all_items if (i['state'] in state)]
        time_item_pair = []
        for element in [(key,) + tuple(elem for _, elem in group) for key,
                        group in groupby(items, lambda pair: pair[0])]:
            time_item_pair.append((element[0], element[-1]))

        return time_item_pair

    def get_each_item_time(self, query, items):
        """Returns the item-versioncreated pair for started and resolved items

        :param dict query: query on user, desk and stage
        :param cursor items
        :return List of tuples: pair item-time_started and item-time_resolved
        """
        individual_items = set([it['guid'] for it in items])
        items_in_progress = self.establish_time(query, ('in_progress', 'submitted', 'created'))
        items_resolved = self.establish_time(query, ('published', 'corrected'))

        items_times = {}
        for item in items_in_progress:
            if item[0] in individual_items:
                items_times[item[0]] = {'start_time': item[-1]}
        for item in items_resolved:
            if item[0] in individual_items and item[0] in items_times:
                items_times[item[0]]['end_time'] = item[-1]

        return items_times

    def generate_report(self, doc):
        """Returns a report on elapsed time between started and resolved item.

        The report will contain the amount of time elapsed since a user started the work on an item
        until he resolved that item.
        :param dict doc: document used for generating the report
        :return dict: report
        """
        query = {'$and': [
            {'task.user': str(doc['user'])},
            {'task.desk': str(doc['desk'])},
            {'task.stage': str(doc['stage'])}]
        }
        items = self.get_items(query)
        result_list = []

        for item_id, item_times in self.get_each_item_time(query, items).items():
            result_list.append({'item_id': item_id, 'entered_stage_at': item_times['start_time'],
                                'left_stage': item_times['end_time'],
                                'time_elapsed': str(item_times['end_time'] - item_times['start_time'])})
        return result_list

    def create(self, docs):
        for doc in docs:
            doc['report'] = self.generate_report(doc)
        docs = super().create(docs)
        return docs
