# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013-2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import NamedTuple


class StatTypes(NamedTuple):
    TIMELINE: str
    DESK_TRANSITIONS: str
    FEATUREMEDIA_UPDATES: str


STAT_TYPE: StatTypes = StatTypes("timeline", "desk_transitions", "featuremedia_updates")


class Operations(NamedTuple):
    CREATE: str
    FETCH: str
    DUPLICATED_FROM: str
    UPDATE: str
    PUBLISH: str
    PUBLISH_SCHEDULED: str
    DESCHEDULE: str
    PUBLISH_EMBARGO: str
    REWRITE: str
    CORRECT: str
    LINK: str
    UNLINK: str
    KILL: str
    TAKEDOWN: str
    SPIKE: str
    UNSPIKE: str
    MOVE: str
    MOVE_FROM: str
    MOVE_TO: str
    DUPLICATE: str
    ITEM_LOCK: str
    ITEM_UNLOCK: str
    MARK: str
    UNMARK: str
    EXPORT_HIGHLIGHT: str
    CREATE_HIGHLIGHT: str
    ADD_FEATUREMEDIA: str
    CHANGE_IMAGE_POI: str
    UPDATE_FEATUREMEDIA_POI: str
    REMOVE_FEATUREMEDIA: str
    UPDATE_FEATUREMEDIA_IMAGE: str


OPERATION: Operations = Operations(
    # Create based operations
    "create",
    "fetch",
    "duplicated_from",
    "update",
    "publish",
    "publish_scheduled",
    "deschedule",
    "publish_embargo",
    "rewrite",
    "correct",
    "link",
    "unlink",
    "kill",
    "takedown",
    # Item Movements (between desks etc)
    "spike",
    "unspike",
    "move",
    "move_from",
    "move_to",
    "duplicate",
    "item_lock",
    "item_unlock",
    "mark",
    "unmark",
    "export_highlight",
    "create_highlight",
    "add_featuremedia",
    "change_image_poi",
    "update_featuremedia_poi",
    "remove_featuremedia",
    "update_featuremedia_image",
)


ENTER_DESK_OPERATIONS = [
    OPERATION.CREATE,
    OPERATION.FETCH,
    OPERATION.DUPLICATED_FROM,
    OPERATION.MOVE_TO,
    OPERATION.DESCHEDULE,
    OPERATION.UNSPIKE,
]

EXIT_DESK_OPERATIONS = [
    OPERATION.PUBLISH,
    OPERATION.SPIKE,
    OPERATION.MOVE_FROM,
    OPERATION.PUBLISH_SCHEDULED,
    OPERATION.PUBLISH_EMBARGO,
]


FEATUREMEDIA_OPERATIONS = [
    OPERATION.ADD_FEATUREMEDIA,
    OPERATION.CHANGE_IMAGE_POI,
    OPERATION.UPDATE_FEATUREMEDIA_POI,
    OPERATION.UPDATE_FEATUREMEDIA_IMAGE,
    OPERATION.REMOVE_FEATUREMEDIA,
]

OPERATION_NAMES = {
    OPERATION.CREATE: "Create",
    OPERATION.FETCH: "Fetch",
    OPERATION.DUPLICATED_FROM: "Duplicated From",
    OPERATION.UPDATE: "Save",
    OPERATION.PUBLISH: "Publish",
    OPERATION.PUBLISH_SCHEDULED: "Publish Scheduled",
    OPERATION.DESCHEDULE: "Deschedule",
    OPERATION.PUBLISH_EMBARGO: "Publish Embargo",
    OPERATION.REWRITE: "Rewrite",
    OPERATION.CORRECT: "Correct",
    OPERATION.LINK: "Link",
    OPERATION.UNLINK: "Unlink",
    OPERATION.KILL: "Kill",
    OPERATION.TAKEDOWN: "Takedown",
    OPERATION.SPIKE: "Spike",
    OPERATION.UNSPIKE: "Unspike",
    OPERATION.MOVE: "Move",
    OPERATION.MOVE_FROM: "Move From",
    OPERATION.MOVE_TO: "Move To",
    OPERATION.DUPLICATE: "Duplicate",
    OPERATION.ITEM_LOCK: "Lock",
    OPERATION.ITEM_UNLOCK: "Unlock",
    OPERATION.MARK: "Mark",
    OPERATION.UNMARK: "Unmark",
    OPERATION.EXPORT_HIGHLIGHT: "Export Highlight",
    OPERATION.CREATE_HIGHLIGHT: "Create Highlight",
    OPERATION.ADD_FEATUREMEDIA: "Add Featuremedia",
    OPERATION.CHANGE_IMAGE_POI: "Change POI",
    OPERATION.UPDATE_FEATUREMEDIA_POI: "Change POI",
    OPERATION.REMOVE_FEATUREMEDIA: "Remove Featuremedia",
    OPERATION.UPDATE_FEATUREMEDIA_IMAGE: "Change Image",
}

PUBLISH_OPERATIONS = [
    OPERATION.PUBLISH,
    OPERATION.CORRECT,
    OPERATION.KILL,
    OPERATION.TAKEDOWN,
]
