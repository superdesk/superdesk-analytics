# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.metadata.item import ASSOCIATIONS, CONTENT_TYPE

from analytics.stats.common import STAT_TYPE, OPERATION, FEATUREMEDIA_OPERATIONS

from copy import deepcopy
from flask import current_app as app


def init(stats):
    # Clear the featuremedia stats as we'll recalculate them here
    stats[STAT_TYPE.FEATUREMEDIA_UPDATES] = []


def store_update_fields(entry, new_update):
    # Store the featuremedia updates for use during future iterations
    if entry.get('operation') in FEATUREMEDIA_OPERATIONS:
        new_update.update({
            ASSOCIATIONS: (entry.get('update') or {}).get(ASSOCIATIONS) or None
        })


def process(entry, new_timeline, updates, update, stats):
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
        add_media_operation(
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

        if updates['_featuremedia'] is not None and \
            operation in [OPERATION.UPDATE, OPERATION.CORRECT] and \
                (associations is None or media is None or not media.get('_id')):
            # If featuremedia is removed
            updates['_featuremedia'] = None
            add_media_operation(
                entry,
                operation,
                new_timeline,
                updates,
                stats,
                OPERATION.REMOVE_FEATUREMEDIA,
                media
            )

            return

        # If there are no associations in this update, then media has not changed
        if associations is None:
            return

        # If there is no featuremedia, then don't calculate any timeline entries
        if media is None and updates['_featuremedia'] is None:
            return

        if updates['_featuremedia'] is None:
            updates['_featuremedia'] = media

            add_media_operation(
                entry,
                operation,
                new_timeline,
                updates,
                stats,
                OPERATION.ADD_FEATUREMEDIA,
                media
            )
        elif media.get('_id') != updates['_featuremedia'].get('_id'):
            updates['_featuremedia'] = media

            add_media_operation(
                entry,
                operation,
                new_timeline,
                updates,
                stats,
                OPERATION.UPDATE_FEATUREMEDIA_IMAGE,
                media
            )

        elif renditions_changed(updates['_featuremedia'], media):
            updates['_featuremedia'] = media

            add_media_operation(
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
        elif renditions_changed(updates['_featuremedia'], update):
            updates['_featuremedia'] = update

            add_media_operation(
                entry,
                operation,
                new_timeline,
                updates,
                stats,
                OPERATION.CHANGE_IMAGE_POI,
                update
            )


def add_media_operation(entry, operation, new_timeline, updates, stats, name, media=None):
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


def renditions_changed(original, updates):
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


def complete(stats, updates):
    num_featuremedia_updates = len(stats.get(STAT_TYPE.FEATUREMEDIA_UPDATES) or [])
    if num_featuremedia_updates < 1:
        stats[STAT_TYPE.FEATUREMEDIA_UPDATES] = None
        updates['num_featuremedia_updates'] = 0
    else:
        updates['num_featuremedia_updates'] = num_featuremedia_updates
