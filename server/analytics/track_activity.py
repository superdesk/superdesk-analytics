# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2016 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.resource import Resource

from eve.utils import config
import superdesk
from superdesk.services import BaseService
from superdesk.metadata.item import GUID_FIELD
from datetime import timedelta, datetime
from superdesk import get_resource_service


ENTERED_STAGE = 'entered_stage_at'
LEFT_STAGE = 'left_stage_at'
UPDATED = '_updated'
SENT_BACK = 'sent_back'


class TrackActivityResource(Resource):
    """Track user's items schema
    """

    schema = {
        'desk': Resource.rel('desks', required=True),
        'stage': Resource.rel('stages', required=True),
        'user': Resource.rel('users', nullable=True),
        'days_ago': {
            'type': 'integer'
        }
    }

    item_methods = ['GET', 'DELETE']
    resource_methods = ['POST']

    privileges = {'POST': 'track_activity_report', 'DELETE': 'track_activity_report',
                  'GET': 'track_activity_report'}


class TrackActivityService(BaseService):
    daysAgoDefault = 2

    def get_items(self, query):
        """Returns the result of the item search by the given query.

        :param dict query: query on user, desk and stage
        :return Cursor: cursor on items list
        """
        return superdesk.get_resource_service('archive_versions').get(req=None, lookup=query)

    def get_stage_items(self, doc):
        """Returns the list of current stage items and the list of items that are not in the current stage.

        :param dict doc: document used for generating the report
        :return dict: report
        """
        days_ago = timedelta(int(doc['days_ago']) if doc.get('days_ago') else self.daysAgoDefault)
        start_time = (datetime.utcnow() - days_ago).replace(hour=0, minute=0, second=0, microsecond=0)

        query_for_current_stage = {'$and': [
            {'task.desk': str(doc['desk'])},
            {'task.stage': str(doc['stage'])},
            {'_current_version': {'$ne': 0}},
            {'state': {'$ne': 'spiked'}}]
        }
        query_for_other_stages = {'$and': [
            {'task.desk': str(doc['desk'])},
            {'task.stage': {'$ne': str(doc['stage'])}},
            {'_current_version': {'$ne': 0}},
            {'state': {'$ne': 'spiked'}}]
        }
        if (doc.get('user')):
            query_for_current_stage['$and'].append({'task.user': str(doc['user'])})
            query_for_other_stages['$and'].append({'task.user': str(doc['user'])})

        archive_service = superdesk.get_resource_service('archive')
        archive_stage_items = archive_service.get_from_mongo(req=None, lookup=query_for_current_stage)
        archive_stage_items_ids = [item[config.ID_FIELD] for item in archive_stage_items]

        query_extra = {'$or': [
            {UPDATED: {'$gte': start_time}},
            {'_id_document': {'$in': archive_stage_items_ids}}]
        }
        query_for_current_stage['$and'].append(query_extra)
        query_for_other_stages['$and'].append(query_extra)

        return self.get_items(query_for_current_stage), self.get_items(query_for_other_stages)

    def get_stages_map(self):
        """Returns a map of stages grouped by desk

        :return dict
        """
        stages = {}
        for stage in get_resource_service('stages').get(req=None, lookup=None):
            if not stage['desk'] in stages:
                stages[stage['desk']] = {}
            stages[stage['desk']][stage[config.ID_FIELD]] = stage
        return stages

    def generate_report(self, doc):
        """Returns a report on elapsed time between started and resolved item.

        The report will contain the date since a user started the work on an item until he resolved that item.
        :param dict doc: document used for generating the report
        :return dict: report
        """
        stages = self.get_stages_map()
        current_stage_items, other_stage_items = self.get_stage_items(doc)

        results = {}
        for item in current_stage_items:
            if item[GUID_FIELD] not in results or \
                    item[config.VERSION] > results[item[GUID_FIELD]]['item'][config.VERSION]:
                results[item[GUID_FIELD]] = {ENTERED_STAGE: item[UPDATED], 'item': item}

        for new_version in other_stage_items:
            if new_version[GUID_FIELD] not in results:
                continue
            orig_version = results[new_version[GUID_FIELD]]
            if orig_version[ENTERED_STAGE] <= new_version[UPDATED] and \
                    (LEFT_STAGE not in orig_version or
                     orig_version[LEFT_STAGE] > new_version[UPDATED]):
                orig_version[LEFT_STAGE] = new_version[UPDATED]
                if new_version['task']['desk'] == orig_version['item']['task']['desk']:
                    desk = new_version['task']['desk']
                    orig_version_stage = orig_version['item']['task']['stage']
                    new_version_stage = new_version['task']['stage']
                    if stages[desk][new_version_stage]['desk_order'] < \
                            stages[desk][orig_version_stage]['desk_order']:
                        orig_version[SENT_BACK] = True
                    elif SENT_BACK in orig_version:
                        del orig_version[SENT_BACK]

        return [item for item in results.values()]

    def create(self, docs):
        for doc in docs:
            doc['report'] = self.generate_report(doc)
        return super().create(docs)
