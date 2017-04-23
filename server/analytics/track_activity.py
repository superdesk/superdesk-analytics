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
from superdesk.metadata.item import GUID_FIELD, PUBLISH_STATES, ITEM_STATE,\
    CONTENT_STATE
from datetime import timedelta, datetime, timezone
from superdesk import get_resource_service


ENTERED_STAGE = 'entered_stage_at'
LEFT_STAGE = 'left_stage_at'
UPDATED = '_updated'
SENT_BACK = 'sent_back'
PUBLISHED_ON = 'published_on'
VERSIONS = 'versions'


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
            {'task.stage': str(doc['stage'])},
            {config.VERSION: {'$ne': 0}},
            {UPDATED: {'$gte': start_time}}]
        }
        archive_service = superdesk.get_resource_service('archive')
        archive_stage_items = archive_service.get_from_mongo(req=None, lookup=query_for_current_stage)
        archive_stage_items_ids = [item[config.ID_FIELD] for item in archive_stage_items]

        states = list(PUBLISH_STATES) + [CONTENT_STATE.SPIKED]
        query_for_current_stage = {'$and': [
            {'task.stage': str(doc['stage'])},
            {config.VERSION: {'$ne': 0}},
            {ITEM_STATE: {'$nin': states}}]
        }
        query_for_other_stages = {'$and': [
            {config.VERSION: {'$ne': 0}},
            {'task.stage': {'$ne': str(doc['stage'])}}]
        }
        query_for_published = {'$and': [
            {config.VERSION: {'$ne': 0}},
            {ITEM_STATE: {'$in': list(PUBLISH_STATES)}}]
        }
        if (doc.get('user')):
            query_for_current_stage['$and'].append({'task.user': str(doc['user'])})
            query_for_other_stages['$and'].append({'task.user': str(doc['user'])})

        query_extra = {'$or': [
            {UPDATED: {'$gte': start_time}},
            {'_id_document': {'$in': archive_stage_items_ids}}]
        }
        query_for_current_stage['$and'].append(query_extra)
        query_for_other_stages['$and'].append(query_extra)
        query_for_published['$and'].append(query_extra)

        return self.get_items(query_for_current_stage), self.get_items(query_for_other_stages), \
            self.get_items(query_for_published)

    def generate_report(self, doc):
        """Returns a report on elapsed time between started and resolved item.

        The report will contain the date since a user started the work on an item until he resolved that item.
        :param dict doc: document used for generating the report
        :return dict: report
        """
        days_ago = timedelta(int(doc['days_ago']) if doc.get('days_ago') else self.daysAgoDefault)
        start_time = (datetime.now(timezone.utc) - days_ago).replace(hour=0, minute=0, second=0, microsecond=0)
        stages = {str(stage[config.ID_FIELD]): stage for stage in
                  get_resource_service('stages').get(req=None, lookup=None)}
        current_stage_items, other_stage_items, published_items = self.get_stage_items(doc)

        results = {}
        for item in current_stage_items:
            if item[GUID_FIELD] not in results:
                results[item[GUID_FIELD]] = {VERSIONS: []}
            results[item[GUID_FIELD]][VERSIONS].append(item)

        for new_version in other_stage_items:
            if new_version[GUID_FIELD] in results:
                results[new_version[GUID_FIELD]][VERSIONS].append(new_version)

        for new_version in published_items:
            if new_version[GUID_FIELD] in results:
                results[new_version[GUID_FIELD]][VERSIONS].append(new_version)

        report_stage = str(doc['stage'])
        report_stage_order = stages[report_stage]['desk_order']
        for item in results.values():
            item[VERSIONS] = sorted(item[VERSIONS], key=lambda item: item[config.VERSION])
            first_version = last_version = left_version = publish_version = None
            current_stage = None
            for version in item[VERSIONS]:
                version_stage = str(version['task']['stage'])
                if not current_stage and version_stage != report_stage:
                    continue
                if not current_stage:
                    current_stage = version_stage
                    first_version = last_version = version
                if version[ITEM_STATE] in PUBLISH_STATES and version_stage == report_stage:
                    publish_version = version
                if current_stage == report_stage:
                    if current_stage == version_stage:
                        last_version = version
                    else:
                        left_version = version
                else:
                    if report_stage == version_stage:
                        first_version = last_version = version
                        left_version = publish_version = None
                current_stage = version_stage

            item[ENTERED_STAGE] = first_version[UPDATED]
            item['item'] = last_version
            if publish_version:
                item[PUBLISHED_ON] = publish_version[UPDATED]
            elif left_version:
                item[LEFT_STAGE] = left_version[UPDATED]
                new_stage_order = stages[str(left_version['task']['stage'])]['desk_order']
                if (new_stage_order < report_stage_order):
                    item[SENT_BACK] = True
            del item[VERSIONS]

        return [item for item in results.values()
                if PUBLISHED_ON not in item or item[ENTERED_STAGE] >= start_time]

    def create(self, docs):
        for doc in docs:
            doc['report'] = self.generate_report(doc)
        return super().create(docs)
