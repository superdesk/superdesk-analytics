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
from superdesk.metadata.item import ASSOCIATIONS, CONTENT_TYPE
from superdesk.logging import logger

from analytics.stats.common import STAT_TYPE, OPERATION, FEATUREMEDIA_OPERATIONS
from analytics.stats.gen_archive_statistics import connect_stats_signals

from copy import deepcopy
from flask import current_app as app
from eve.utils import config


class FeaturemediaUpdates:
    def __init__(self, sender=None):
        self.rewrite_ids = set()

    def store_update_fields(self, sender, entry, update):
        if entry.get('operation') not in FEATUREMEDIA_OPERATIONS:
            return

        # Store the featuremedia updates for use during future iterations
        update.update({
            ASSOCIATIONS: (entry.get('update') or {}).get(ASSOCIATIONS) or None
        })

    def init(self, sender, stats):
        # Clear the featuremedia stats as we'll recalculate them here
        stats[STAT_TYPE.FEATUREMEDIA_UPDATES] = []

    def process(self, sender, entry, new_timeline, updates, update, stats):
        # Generating stats with PUBLISH_ASSOCIATED_ITEMS=True is currently not supported
        if app.config.get('PUBLISH_ASSOCIATED_ITEMS', False):
            return

        operation = entry.get('operation')

        updates.setdefault('_featuremedia', None)
        updates.setdefault('_published', False)

        item_type = updates.get('type') or 'text'

        if entry.get('_auto_generated', False):
            entry['update'] = update

        # If this is the initial publish operation and featuremedia has been added already
        # Then add this operation as the first in the featuremedia changes
        if operation == OPERATION.PUBLISH and updates.get('_featuremedia'):
            self._add_media_operation(
                entry,
                operation,
                new_timeline,
                updates,
                stats,
                OPERATION.PUBLISH,
                updates.get('_featuremedia')
            )
            # return
        elif item_type == CONTENT_TYPE.TEXT:
            # Calculate featuremedia stats
            associations = update.get(ASSOCIATIONS) or None

            media = None if associations is None else associations.get('featuremedia') or None

            # If there are no associations in this update, then media has not changed
            if associations is None:
                return

            if updates['_featuremedia'] is not None and \
                operation in [OPERATION.UPDATE, OPERATION.CORRECT] and \
                    (associations is None or media is None or not media.get('_id')):
                # If featuremedia is removed
                updates['_featuremedia'] = None
                self._add_media_operation(
                    entry,
                    operation,
                    new_timeline,
                    updates,
                    stats,
                    OPERATION.REMOVE_FEATUREMEDIA,
                    media
                )

                return

            # If there is no featuremedia, then don't calculate any timeline entries
            if media is None and updates['_featuremedia'] is None:
                return

            if updates['_featuremedia'] is None:
                updates['_featuremedia'] = media

                self._add_media_operation(
                    entry,
                    operation,
                    new_timeline,
                    updates,
                    stats,
                    OPERATION.ADD_FEATUREMEDIA,
                    media
                )
            elif media is not None:
                if media.get('_id') != updates['_featuremedia'].get('_id'):
                    updates['_featuremedia'] = media

                    self._add_media_operation(
                        entry,
                        operation,
                        new_timeline,
                        updates,
                        stats,
                        OPERATION.UPDATE_FEATUREMEDIA_IMAGE,
                        media
                    )
                elif self._renditions_changed(updates['_featuremedia'], media):
                    updates['_featuremedia'] = media

                    self._add_media_operation(
                        entry,
                        operation,
                        new_timeline,
                        updates,
                        stats,
                        OPERATION.UPDATE_FEATUREMEDIA_POI,
                        media
                    )
        elif item_type == CONTENT_TYPE.PICTURE:
            if updates['_featuremedia'] is None:
                updates['_featuremedia'] = deepcopy(update)
            elif self._renditions_changed(updates['_featuremedia'], update):
                updates['_featuremedia'] = update

                self._add_media_operation(
                    entry,
                    operation,
                    new_timeline,
                    updates,
                    stats,
                    OPERATION.CHANGE_IMAGE_POI,
                    update
                )

    def _add_media_operation(self, entry, operation, new_timeline, updates, stats, name, media=None):
        media_operation = deepcopy(entry)
        media_operation['_auto_generated'] = True
        media_operation['operation'] = name

        if media is not None:
            media_operation['update'] = {
                ASSOCIATIONS: {
                    'featuremedia': media
                }
            }

        if operation != name and not entry.get('_processed', False):  # and name != OPERATION.PUBLISH:
            new_timeline.append(media_operation)

        if updates['_published']:  # and not operation == OPERATION.PUBLISH:
            stats[STAT_TYPE.FEATUREMEDIA_UPDATES].append(media_operation)

    def _renditions_changed(self, original, updates):
        def poi_changed(original_poi, updated_poi):
            if original_poi.get('x') != updated_poi.get('x') or \
                    original_poi.get('y') != updated_poi.get('y'):
                return True
            return False

        if poi_changed(original.get('poi') or {}, updates.get('poi') or {}):
            return True

        original_renditions = original.get('renditions') or {}
        updated_renditions = updates.get('renditions') or {}

        if original_renditions.keys() != updated_renditions.keys():
            return True

        attribs = ['width', 'height', 'media', 'CropLeft', 'CropRight', 'CropTop', 'CropBottom']

        for key, original_rendition in original_renditions.items():
            updated_rendition = updated_renditions[key]

            if poi_changed(
                original_rendition.get('poi') or {},
                updated_rendition.get('poi') or {}
            ):
                return True

            for attrib in attribs:
                if original_rendition.get(attrib) != updated_rendition.get(attrib):
                    return True

        return False

    def complete(self, sender, stats, orig, updates):
        num_featuremedia_updates = len(stats.get(STAT_TYPE.FEATUREMEDIA_UPDATES) or [])
        if num_featuremedia_updates < 1:
            stats[STAT_TYPE.FEATUREMEDIA_UPDATES] = None
            updates['num_featuremedia_updates'] = 0
        else:
            updates['num_featuremedia_updates'] = num_featuremedia_updates

        if updates.get('rewrite_of'):
            self.rewrite_ids.add(updates.get('rewrite_of'))
            self.rewrite_ids.add(orig['_id'])

    def _get_featuremedia(self, entry):
        return None if entry is None else ((entry.get('update') or {}).get('associations') or {}).get('featuremedia')

    def finish(self, sender):
        service = get_resource_service('archive_statistics')

        query = {'query': {'bool': {'must': {'terms': {'_id': list(self.rewrite_ids)}}}}}
        docs = {
            doc['_id']: doc
            for doc in service.search(query)
        }

        def get_parent_id(doc):
            if not doc.get('rewrite_of'):
                return doc[config.ID_FIELD]
            elif doc['rewrite_of'] not in docs:
                # If the parent item was not part of this stats iteration
                # then load it now
                parent = service.find_one(req=None, _id=doc['rewrite_of'])

                if not parent:
                    # Stats entry for the parent item was not found
                    logger.warn('Failed to get parent item {}'.format(doc['rewrite_of']))
                    return None
                else:
                    docs[doc['rewrite_of']] = parent

            return get_parent_id(docs[doc['rewrite_of']])

        parent_docs = {}
        for doc_id in list(docs.keys()):
            doc = docs[doc_id]
            parent_id = get_parent_id(doc)

            if parent_id is None:
                # If we failed to find the parent id
                # Then the stats do not exist for the parent
                # So we ignore this entry
                continue

            updates = (doc.get('stats') or {}).get('featuremedia_updates') or []

            if len(updates) < 1:
                # This would indicate that there are no featuremedia updates recorded for this single item
                # find the previous featuremedia operation before the publish operation
                # and use that as the basis for the featuremedia updates
                last_entry = next((
                    entry for entry in reversed((doc.get('stats') or {}).get('timeline') or [])
                    if entry.get('operation') in FEATUREMEDIA_OPERATIONS
                ), None)

                if last_entry is not None:
                    updates = [last_entry]

            if len(updates) > 0:
                if parent_id not in parent_docs:
                    parent_docs[parent_id] = updates
                else:
                    parent_docs[parent_id] += updates

        for doc_id, stats in parent_docs.items():
            # get the archive_family stats item (if it exists)
            merged_id = '{}_family'.format(doc_id)
            original = service.find_one(req=None, _id=merged_id)
            is_new = False

            if not original:
                # If the archive_family stats item doesn't exist
                # then get the stats for the archive item itself
                is_new = True
                original = service.find_one(req=None, _id=doc_id) or {}

            sorted_entries = sorted(stats, key=lambda k: (k['operation_created'], k['history_id']))

            last_stat = sorted_entries[0]
            merged_stats = [sorted_entries[0]] if self._get_featuremedia(last_stat) else []

            for entry in sorted_entries[1:]:
                current_media = self._get_featuremedia(last_stat)
                next_media = self._get_featuremedia(entry)

                if current_media and not next_media:
                    # previous entry has featuremedia
                    # current entry does not
                    entry['operation'] = OPERATION.REMOVE_FEATUREMEDIA
                    merged_stats.append(entry)
                elif next_media and not current_media:
                    # previous entry does not have featuremedia
                    # current entry does
                    entry['operation'] = OPERATION.ADD_FEATUREMEDIA
                    merged_stats.append(entry)
                elif current_media.get('_id') != next_media.get('_id'):
                    # previous entry has different featuremedia id to the current entry
                    entry['operation'] = OPERATION.UPDATE_FEATUREMEDIA_IMAGE
                    merged_stats.append(entry)
                elif self._renditions_changed(current_media, next_media):
                    # previous entry has different poi
                    entry['operation'] = OPERATION.UPDATE_FEATUREMEDIA_POI
                    merged_stats.append(entry)

                last_stat = entry

            updates = deepcopy(original)
            updates['stats_type'] = 'archive_family'

            num_featuremedia_updates = len(merged_stats)
            if num_featuremedia_updates < 1:
                merged_stats = None
                updates['num_featuremedia_updates'] = 0
            else:
                updates['num_featuremedia_updates'] = num_featuremedia_updates

            if 'stats' not in updates:
                updates['stats'] = {}

            updates['stats']['featuremedia_updates'] = merged_stats

            if is_new:
                updates['_id'] = merged_id
                service.post([updates])
            else:
                service.patch(
                    merged_id,
                    {
                        'stats': updates['stats'],
                        'num_featuremedia_updates': updates['num_featuremedia_updates']
                    }
                )


featuremedia_updates = FeaturemediaUpdates()

connect_stats_signals(
    on_start=featuremedia_updates.__init__,
    on_generate=featuremedia_updates.store_update_fields,
    on_init_timeline=featuremedia_updates.init,
    on_process=featuremedia_updates.process,
    on_complete=featuremedia_updates.complete,
    on_finish=featuremedia_updates.finish
)
