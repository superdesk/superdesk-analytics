# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from analytics.stats.common import STAT_TYPE, OPERATION, ENTER_DESK_OPERATIONS, EXIT_DESK_OPERATIONS

from copy import deepcopy


def init(stats):
    # Clear the desk stats as we'll recalculate them here
    stats[STAT_TYPE.DESK_TRANSITIONS] = []


def store_update_fields(entry, new_update):
    pass


def process(entry, new_timeline, updates, update, stats):
    updates.setdefault('_current_task', None)

    task = entry.get('task') or {}
    operation = entry.get('operation')
    operation_created = entry.get('operation_created')

    if operation in ENTER_DESK_OPERATIONS:
        updates['_current_task'] = deepcopy(task)

        if operation == OPERATION.CREATE and updates.get('rewrite_of'):
            updates['_current_task']['entered_operation'] = OPERATION.REWRITE
        else:
            updates['_current_task']['entered_operation'] = operation

        updates['_current_task']['entered'] = operation_created
    elif operation in EXIT_DESK_OPERATIONS and updates['_current_task'] is not None:
        if not updates['_current_task'].get('user') and task.get('user'):
            updates['_current_task']['user'] = task['user']

        updates['_current_task']['exited'] = operation_created
        updates['_current_task']['exited_operation'] = operation
        updates['_current_task']['duration'] = (
            updates['_current_task']['exited'] - updates['_current_task']['entered']
        ).total_seconds()

        if updates['_current_task'].get('entered_operation') == OPERATION.MOVE and \
                updates['_current_task'].get('exited_operation') == OPERATION.PUBLISH and \
                updates['_current_task']['duration'] < 3:
            pass
        else:
            stats[STAT_TYPE.DESK_TRANSITIONS].append(updates['_current_task'])

        updates['_current_task'] = None


def complete(stats, updates):
    num_desk_transitions = len(stats.get(STAT_TYPE.DESK_TRANSITIONS) or [])
    if num_desk_transitions < 1:
        stats[STAT_TYPE.DESK_TRANSITIONS] = None
        updates['num_desk_transitions'] = 0
    else:
        updates['num_desk_transitions'] = num_desk_transitions
