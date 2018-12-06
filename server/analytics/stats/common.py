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
    OPERATION.MOVE,
    OPERATION.DESCHEDULE,
    OPERATION.UNSPIKE
]

EXIT_DESK_OPERATIONS = [
    OPERATION.PUBLISH,
    OPERATION.SPIKE,
    OPERATION.MOVE,
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
