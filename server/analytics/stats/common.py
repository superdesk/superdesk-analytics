# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013-2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from collections import namedtuple


stat_type = ['timeline', 'desk_transitions', 'featuremedia_updates']

STAT_TYPE = namedtuple('STAT_TYPE', [
    'TIMELINE',
    'DESK_TRANSITIONS',
    'FEATUREMEDIA_UPDATES'
])(*stat_type)


operation = [
    # Create based operations
    'create',
    'fetch',
    'duplicated_from',

    'update',
    'publish',
    'publish_scheduled',
    'deschedule',
    'publish_embargo',
    'rewrite',
    'correct',
    'link',
    'unlink',
    'kill',
    'takedown',

    # Item Movements (between desks etc)
    'spike',
    'unspike',
    'move',
    'move_from',
    'move_to',

    'duplicate',
    'item_lock',
    'item_unlock',

    'mark',
    'unmark',
    'export_highlight',
    'create_highlight',

    'add_featuremedia',
    'change_image_poi',
    'update_featuremedia_poi',
    'remove_featuremedia',
    'update_featuremedia_image'
]

OPERATION = namedtuple('OPERATION', [
    'CREATE',
    'FETCH',
    'DUPLICATED_FROM',

    'UPDATE',
    'PUBLISH',
    'PUBLISH_SCHEDULED',
    'DESCHEDULE',
    'PUBLISH_EMBARGO',
    'REWRITE',
    'CORRECT',
    'LINK',
    'UNLINK',
    'KILL',
    'TAKEDOWN',

    'SPIKE',
    'UNSPIKE',
    'MOVE',
    'MOVE_FROM',
    'MOVE_TO',

    'DUPLICATE',
    'ITEM_LOCK',
    'ITEM_UNLOCK',

    'MARK',
    'UNMARK',
    'EXPORT_HIGHLIGHT',
    'CREATE_HIGHLIGHT',

    'ADD_FEATUREMEDIA',
    'CHANGE_IMAGE_POI',
    'UPDATE_FEATUREMEDIA_POI',
    'REMOVE_FEATUREMEDIA',
    'UPDATE_FEATUREMEDIA_IMAGE'
])(*operation)


ENTER_DESK_OPERATIONS = [
    OPERATION.CREATE,
    OPERATION.FETCH,
    OPERATION.DUPLICATED_FROM,
    OPERATION.MOVE_TO,
    OPERATION.DESCHEDULE,
    OPERATION.UNSPIKE
]

EXIT_DESK_OPERATIONS = [
    OPERATION.PUBLISH,
    OPERATION.SPIKE,
    OPERATION.MOVE_FROM,
    OPERATION.PUBLISH_SCHEDULED,
    OPERATION.PUBLISH_EMBARGO
]


FEATUREMEDIA_OPERATIONS = [
    OPERATION.ADD_FEATUREMEDIA,
    OPERATION.CHANGE_IMAGE_POI,
    OPERATION.UPDATE_FEATUREMEDIA_POI,
    OPERATION.UPDATE_FEATUREMEDIA_IMAGE,
    OPERATION.REMOVE_FEATUREMEDIA
]

OPERATION_NAMES = {
    OPERATION.CREATE: 'Create',
    OPERATION.FETCH: 'Fetch',
    OPERATION.DUPLICATED_FROM: 'Duplicated From',
    OPERATION.UPDATE: 'Save',
    OPERATION.PUBLISH: 'Publish',
    OPERATION.PUBLISH_SCHEDULED: 'Publish Scheduled',
    OPERATION.DESCHEDULE: 'Deschedule',
    OPERATION.PUBLISH_EMBARGO: 'Publish Embargo',
    OPERATION.REWRITE: 'Rewrite',
    OPERATION.CORRECT: 'Correct',
    OPERATION.LINK: 'Link',
    OPERATION.UNLINK: 'Unlink',
    OPERATION.KILL: 'Kill',
    OPERATION.TAKEDOWN: 'Takedown',
    OPERATION.SPIKE: 'Spike',
    OPERATION.UNSPIKE: 'Unspike',
    OPERATION.MOVE: 'Move',
    OPERATION.MOVE_FROM: 'Move From',
    OPERATION.MOVE_TO: 'Move To',
    OPERATION.DUPLICATE: 'Duplicate',
    OPERATION.ITEM_LOCK: 'Lock',
    OPERATION.ITEM_UNLOCK: 'Unlock',
    OPERATION.MARK: 'Mark',
    OPERATION.UNMARK: 'Unmark',
    OPERATION.EXPORT_HIGHLIGHT: 'Export Highlight',
    OPERATION.CREATE_HIGHLIGHT: 'Create Highlight',
    OPERATION.ADD_FEATUREMEDIA: 'Add Featuremedia',
    OPERATION.CHANGE_IMAGE_POI: 'Change POI',
    OPERATION.UPDATE_FEATUREMEDIA_POI: 'Change POI',
    OPERATION.REMOVE_FEATUREMEDIA: 'Remove Featuremedia',
    OPERATION.UPDATE_FEATUREMEDIA_IMAGE: 'Change Image'
}

PUBLISH_OPERATIONS = [
    OPERATION.PUBLISH,
    OPERATION.CORRECT,
    OPERATION.KILL,
    OPERATION.TAKEDOWN,
]
