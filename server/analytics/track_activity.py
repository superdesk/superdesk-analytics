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

    privileges = {'POST': 'track_activity_report', 'DELETE': 'track_activity_report',
                  'GET': 'track_activity_report'}


class TrackActivityService(BaseService):
    def get_items(self, query):
        """Returns the result of the item search by the given query.

        :param dict query: query on user, desk and stage
        :return Cursor: cursor on items list
        """
        return superdesk.get_resource_service('archive_versions').get(req=None, lookup=query)

    def generate_report(self, doc):
        """Returns a report on elapsed time between started and resolved item.

        The report will contain the date since a user started the work on an item until he resolved that item.
        :param dict doc: document used for generating the report
        :return dict: report
        """
        query_for_current_stage = {'$and': [
            {'task.user': str(doc['user'])},
            {'task.desk': str(doc['desk'])},
            {'task.stage': str(doc['stage'])}]
        }

        query_for_other_stages = {'$and': [
            {'task.user': str(doc['user'])},
            {'task.desk': str(doc['desk'])},
            {'task.stage': {'$ne': str(doc['stage'])}}]
        }

        current_stage_items = self.get_items(query_for_current_stage)
        other_stage_items = self.get_items(query_for_other_stages)

        results = {}
        for item in current_stage_items:
            results[item['guid']] = {'entered_stage_at': item['_updated'], 'item': item}

        for item in other_stage_items:
            if item['guid'] in results and results[item['guid']]['entered_stage_at'] <= item['_updated']:
                if 'left_stage_at' not in results[item['guid']] or \
                        results[item['guid']]['left_stage_at'] > item['_updated']:
                    results[item['guid']]['left_stage_at'] = item['_updated']

        return [item for item in results.values()]

    def create(self, docs):
        for doc in docs:
            doc['report'] = self.generate_report(doc)
        return super().create(docs)
