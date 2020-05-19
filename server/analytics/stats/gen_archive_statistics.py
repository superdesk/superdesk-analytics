# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013-2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk import Command, command, get_resource_service, Option
from superdesk.logging import logger
from superdesk.utc import utcnow
from superdesk.metadata.item import ITEM_STATE, ITEM_TYPE, FORMAT, SCHEDULE_SETTINGS, \
    CONTENT_STATE, PUBLISH_SCHEDULE, EMBARGO, BYLINE
from superdesk.text_utils import get_par_count
from superdesk.celery_task_utils import get_lock_id
from superdesk.lock import lock, unlock
from superdesk.signals import signals

from analytics.stats.common import STAT_TYPE, OPERATION
from analytics.stats import desk_transitions

from eve.utils import config
from copy import deepcopy
from datetime import timedelta

gen_stats_signals = {
    'start': signals.signal('gen_archive_statistics:start'),
    'generate': signals.signal('gen_archive_statistics:generate'),
    'init_timeline': signals.signal('gen_archive_statistics:init_timeline'),
    'process': signals.signal('gen_archive_statistics:process'),
    'complete': signals.signal('gen_archive_statistics:complete'),
    'finish': signals.signal('gen_archive_statistics:finish'),
}


def connect_stats_signals(
    on_start=None,
    on_generate=None,
    on_init_timeline=None,
    on_process=None,
    on_complete=None,
    on_finish=None
):
    """Connect functions to the gen_stats_signals

    :param on_start: Callback for start signal
    :param on_generate: Callback for generate signal
    :param on_init_timeline: Callback for init_timeline signal
    :param on_process: Callback for process signal
    :param on_complete: Callback for complete signal
    :param on_finish: Callback for finish signal
    """
    if on_start:
        gen_stats_signals['start'].connect(on_start)

    if on_generate:
        gen_stats_signals['generate'].connect(on_generate)

    if on_init_timeline:
        gen_stats_signals['init_timeline'].connect(on_init_timeline)

    if on_process:
        gen_stats_signals['process'].connect(on_process)

    if on_complete:
        gen_stats_signals['complete'].connect(on_complete)

    if on_finish:
        gen_stats_signals['finish'].connect(on_finish)


class GenArchiveStatistics(Command):
    """Generate statistics for archive documents based on archive_history documents

    Generates a linear timeline of operations based on documents from archive_history.
    This data is then used to search and aggregate for usage in generating charts.

    Options
    ::

        -d, --max-days (defaults to 3):
        Maximum number of days to process from archive_history
        -i, --item-id (defaults to None):
        Generate statistics for a single archive item only
        -c, --chunk-size (defaults to 1000):
        Number of archive history items to process per iteration

    If the config option ANALYTICS_ENABLE_ARCHIVE_STATS is true, this command will run in
    celery on a schedule every hour (minute=0).

    Example:
    ::

        $ python manage.py analytics:gen_archive_statistics
        $ python manage.py analytics:gen_archive_statistics -d 1
        $ python manage.py analytics:gen_archive_statistics -max-days 1
        $ python manage.py analytics:gen_archive_statistics -i 'id-of-item-to-gen-stats-for'
        $ python manage.py analytics:gen_archive_statistics -item-id 'id-of-item-to-gen-stats-for'
        $ python manage.py analytics:gen_archive_statistics -c 500
        $ python manage.py analytics:gen_archive_statistics -chunk-size 500

    There are 4 signals that are sent when generating statistics.
    This allows custom statistics to be generated and stored in the item.
    There is a dictionary in the schema for custom stats to be stored under the 'extra' attribute.

    Example:
    ::

        from analytics.stats.gen_archive_statistics import connect_stats_signals

        connect_stats_signals(on_generate, on_init_timeline, on_process, on_complete)
        # or by key values
        connect_stats_signals(on_process=on_process_stats)

    """

    option_list = [
        Option('--max-days', '-d', dest='max_days', default=3),
        Option('--item-id', '-i', dest='item_id', default=None),
        Option('--chunk-size', '-c', dest='chunk_size', default=1000)
    ]

    def run(self, max_days=3, item_id=None, chunk_size=1000):
        now_utc = utcnow()

        # If we're generating stats for a single item, then
        # don't set max_days, as we want to process all history records
        # for the provided item
        if item_id is not None:
            max_days = 0

        try:
            max_days = float(max_days)
        except (ValueError, TypeError):
            max_days = 3
        gte = None if max_days <= 0.0 else utcnow() - timedelta(days=max_days)

        try:
            chunk_size = int(chunk_size)
        except (ValueError, TypeError):
            chunk_size = 1000
        chunk_size = None if chunk_size <= 0 else chunk_size

        logger.info(
            'Starting to generate archive statistics: {}. gte={}. item_id={}. chunk_size={}'
            .format(
                now_utc,
                gte,
                item_id,
                chunk_size
            )
        )

        lock_name = get_lock_id('analytics', 'gen_archive_statistics')
        if not lock(lock_name, expire=610):
            logger.info('Generate archive statistics task is already running.')
            return

        items_processed = 0
        failed_ids = []
        num_history_items = 0

        try:
            items_processed, failed_ids, num_history_items = self.generate_stats(
                item_id,
                gte,
                chunk_size
            )
        except Exception:
            logger.exception('Failed to generate archive stats')
        finally:
            unlock(lock_name)

        if len(failed_ids) > 0:
            logger.warning('Failed to generate stats for items {}'.format(
                ', '.join(failed_ids)
            ))

        duration = (utcnow() - now_utc).total_seconds()
        logger.info(
            'Finished generating stats for {} items ({} history entries). Duration: {} seconds'
            .format(
                items_processed,
                num_history_items,
                int(duration)
            )
        )

    def generate_stats(self, item_id, gte, chunk_size):
        items_processed = 0
        failed_ids = []
        num_history_items = 0

        statistics_service = get_resource_service('archive_statistics')

        # Get the system record from the last run
        # This document stores the id of the last processed archive_history item
        last_history = statistics_service.get_last_run()
        last_entry_id = last_history.get('guid') or None

        if last_history.get('guid'):
            logger.info('Found previous run, continuing from history item {}'.format(
                last_history['guid']
            ))

        iterated_started = utcnow()
        for history_items in statistics_service.get_history_items(
                last_entry_id,
                gte,
                item_id,
                chunk_size
        ):
            if len(history_items) < 1:
                logger.info('No more history records to process')
                break

            gen_stats_signals['start'].send(self)

            num_history_items += len(history_items)
            last_entry_id = history_items[-1].get(config.ID_FIELD)

            items = self.gen_history_timelines(history_items)
            items_processed += len(items)
            self.process_timelines(items, failed_ids)

            time_diff = (utcnow() - iterated_started).total_seconds()
            logger.info('Processed {}/{} history/item records ({}/{} total) in {} seconds'.format(
                len(history_items),
                len(items),
                num_history_items,
                items_processed,
                int(time_diff)
            ))

            gen_stats_signals['finish'].send(self)
            iterated_started = utcnow()

        # Don't store the last processed id if we're generating stats for a single item
        if not item_id:
            # Create/Update the system record from this run
            # Storing the id of the last processed archive_history item
            statistics_service.set_last_run_id(last_entry_id, last_history)

        return items_processed, failed_ids, num_history_items

    def gen_history_timelines(self, history_items):
        items = {}

        statistics_service = get_resource_service('archive_statistics')

        def add_item(entry_id):
            if items.get(entry_id):
                return

            item = statistics_service.find_one(req=None, _id=str(entry_id)) or {}

            if not item.get('stats'):
                item['stats'] = {}

            items[entry_id] = {
                'item': item,
                '_id': entry_id,
                'updates': {'stats': {}}
            }

            items[entry_id]['updates'].update(item)

            def _set_timeline_processed(entry):
                entry['_processed'] = True
                return entry

            items[entry_id]['updates']['stats'].update({
                STAT_TYPE.TIMELINE: [
                    _set_timeline_processed(entry)
                    for entry in item['stats'].get(STAT_TYPE.TIMELINE) or []
                ]
            })

        for history_item in history_items:
            item_id = history_item.get('item_id')

            if not history_item.get('update'):
                history_item['update'] = {}

            try:
                add_item(item_id)
                self.gen_archive_stats_from_history(
                    items[item_id],
                    history_item
                )
            except Exception:
                logger.exception('Failed to process archive_history for item:{} history:{}'.format(
                    item_id,
                    history_item.get(config.ID_FIELD)
                ))

        return items

    def gen_archive_stats_from_history(self, item, history):
        self.set_operation(history)

        task = history['update'].get('task') or {}
        entry = {
            'history_id': history.get(config.ID_FIELD),
            'operation': history.get('operation'),
            'operation_created': history.get('_created'),
            'task': {
                'user': history.get('user_id'),
                'desk': task.get('desk'),
                'stage': task.get('stage'),
            },
            'update': history['update'],
            'version': history['version']
        }

        if history.get('original_item_id'):
            entry['original_item_id'] = history['original_item_id']

        if entry['operation'] != OPERATION.MOVE:
            item['updates']['stats'][STAT_TYPE.TIMELINE].append(entry)
        else:
            # Remove the new task details from the MOVE_FROM operation
            # Task will later be calculated from the previous history item
            task = entry.pop('task', {
                'user': history.get('user_id'),
                'desk': None,
                'stage': None
            })

            entry['task'] = {
                'user': history.get('user_id'),
                'desk': None,
                'stage': None
            }
            entry['operation'] = OPERATION.MOVE_FROM
            item['updates']['stats'][STAT_TYPE.TIMELINE].append(entry)

            # Copy the original history entry for the MOVE_TO entry
            # Assign the new task details to this entry
            entry = deepcopy(entry)
            entry['operation'] = OPERATION.MOVE_TO
            entry['task'] = task
            entry['_auto_generated'] = True
            item['updates']['stats'][STAT_TYPE.TIMELINE].append(entry)

    def set_operation(self, history):
        if history['operation'] == OPERATION.UPDATE and \
                history['update'].get('operation') == OPERATION.DESCHEDULE:
            history['operation'] = OPERATION.DESCHEDULE
        elif history['operation'] == OPERATION.PUBLISH:
            if history['update'].get(ITEM_STATE) != CONTENT_STATE.PUBLISHED and \
                    history['update'].get(PUBLISH_SCHEDULE):
                history['operation'] = OPERATION.PUBLISH_SCHEDULED
            elif history['update'].get(ITEM_STATE) == CONTENT_STATE.PUBLISHED and \
                    history['update'].get(EMBARGO):
                history['operation'] = OPERATION.PUBLISH_EMBARGO

    def set_metadata_updates(self, item, history):
        fields = [
            'original_creator', 'version_creator'
            'versioncreated', 'firstpublished', 'firstcreated',
            'source', 'original_source', 'ingest_provider',
            'anpa_category', 'subject', 'genre', 'company_codes',
            ITEM_TYPE, 'abstract', 'headline', 'slugline',
            'anpa_take_key', 'keywords', 'word_count', 'priority',
            'urgency', ITEM_STATE, 'pubstatus', 'flags', 'sms_message',
            FORMAT, 'auto_publish', 'assignment_id', 'rewrite_of', 'rewritten_by',
            'original_id', SCHEDULE_SETTINGS, 'task', PUBLISH_SCHEDULE, EMBARGO,
            'unique_id', 'unique_name', 'ingest_id', 'family_id', 'usageterms',
            'copyrightnotice', 'copyrightholder', 'profile', BYLINE, 'ednote',
            'dateline', 'expiry', 'place', 'template'
        ]

        # Calculate and store item attributes that the history service removes
        user_id = history['task']['user']
        created = history['operation_created']

        if 'version' in history:
            item['updates']['version'] = history['version']
            item['updates']['version_creator'] = user_id
            item['updates']['versioncreated'] = created

        if 'original_creator' not in item['updates']:
            item['updates']['original_creator'] = user_id
            item['updates']['firstcreated'] = created

        for field in fields:
            if field in history['update']:
                item['updates'][field] = history['update'][field]

    def process_timelines(self, items, failed_ids):
        statistics_service = get_resource_service('archive_statistics')
        items_to_create = []
        rewrites = []

        for item_id, item in items.items():
            try:
                self.gen_stats_from_timeline(item)
            except Exception:
                logger.exception('Failed to generate stats for item {}'.format(item_id))
                failed_ids.append(item_id)
                continue

            if item['updates'].get('rewrite_of') and \
                    (item['updates'].get('time_to_first_publish') or 0) > 0:
                rewrites.append(item_id)

            if not item['item'].get(config.ID_FIELD):
                item['updates'][config.ID_FIELD] = item_id
                item['updates']['stats_type'] = 'archive'
                items_to_create.append(item['updates'])
            else:
                try:
                    statistics_service.patch(
                        item_id,
                        item['updates']
                    )
                except Exception:
                    logger.exception('Failed to update stats for item {}. updates={}'.format(
                        item_id,
                        item.get('updates')
                    ))
                    failed_ids.append(item_id)

        if len(items_to_create) > 0:
            try:
                statistics_service.post(items_to_create)
            except Exception:
                item_ids = [item.get(config.ID_FIELD) for item in items_to_create]
                logger.exception('Failed to create stat entries for items {}'.format(
                    ', '.join(item_ids)
                ))
                failed_ids.extend(failed_ids)

        for item_id in rewrites:
            item = items[item_id]

            updated_at = item['updates'].get('firstpublished')
            if not updated_at:
                logger.warning('Failed {}, updated_at not defined'.format(item_id))
                continue

            original_id = item['updates'].get('rewrite_of')
            if not original_id:
                logger.warning('Failed {}, original_id not defined'.format(item_id))
                continue

            original = statistics_service.find_one(req=None, _id=original_id)
            if not original:
                logger.warning('Failed {}, original not found'.format(item_id))
                continue

            published_at = original.get('firstpublished')
            if not published_at:
                logger.warning('Failed {}, published_at not defined'.format(original_id))
                continue

            statistics_service.patch(
                original_id,
                {'time_to_next_update_publish': (updated_at - published_at).total_seconds()}
            )

    def _store_update_fields(self, entry):
        update = {}

        if entry.get('operation') in [OPERATION.ITEM_LOCK, OPERATION.ITEM_UNLOCK]:
            # If the entry belongs to a lock, store the lock information
            update = entry.get('update') or {}

        desk_transitions.store_update_fields(entry, update)
        gen_stats_signals['generate'].send(self, entry=entry, update=update)

        if update:
            entry['update'] = update
        else:
            entry.pop('update', None)

    def gen_stats_from_timeline(self, item):
        item.setdefault('updates', {})
        updates = item['updates']

        updates.setdefault('stats', {})
        stats = updates['stats']

        if len(stats.get(STAT_TYPE.TIMELINE) or []) < 1:
            return

        new_timeline = []
        desk_transitions.init(stats)
        gen_stats_signals['init_timeline'].send(self, stats=stats)

        try:
            entries = sorted(
                stats[STAT_TYPE.TIMELINE],
                key=lambda k: (k['operation_created'], k['history_id'])
            )
        except Exception as e:
            logger.exception('Failed to sort timeline {}'.format(stats[STAT_TYPE.TIMELINE]))
            raise e

        # If the first history item has original_item_id attribute,
        # then this item is a duplicate of another item
        updates['_duplicate'] = entries[0].get('original_item_id')

        # Default the paragraph count to 0
        # We'll update this count while processing the timeline
        updates['par_count'] = 0

        for entry in entries:
            entry.setdefault('update', {})
            self.set_metadata_updates(item, entry)
            self.set_timeline_entry_task_details(entry, updates)

            if self.skip_timeline_entry(entry, updates):
                continue

            # Remove the update attribute before adding to the timeline
            update = entry.get('update') or {}
            self._store_update_fields(entry)

            # Update the paragraph count from this history entry
            self.update_par_count_from_timeline_entry(entry, updates, update)

            new_timeline.append(entry)

            # Use a copy of entry after adding to the timeline
            # So that any changes from here do not modify the existing timeline entry
            entry = deepcopy(entry)

            operation = entry.get('operation')
            operation_created = entry.get('operation_created')

            if operation == OPERATION.PUBLISH:
                updates['_published'] = True
                if not updates.get('firstpublished'):
                    updates['firstpublished'] = operation_created
            elif operation in [OPERATION.CREATE, OPERATION.FETCH] and \
                    not updates.get('firstcreated'):
                updates['firstcreated'] = operation_created

            desk_transitions.process(entry, new_timeline, updates, update, stats)
            gen_stats_signals['process'].send(
                self,
                entry=entry,
                new_timeline=new_timeline,
                updates=updates,
                update=update,
                stats=stats
            )

        desk_transitions.complete(stats, updates)
        gen_stats_signals['complete'].send(self, stats=stats, orig=item, updates=updates)

        if updates.get('firstpublished') and updates.get('firstcreated'):
            updates['time_to_first_publish'] = (
                updates['firstpublished'] - updates['firstcreated']
            ).total_seconds()

        def _remove_tmp_fields(entry):
            entry.pop('_processed', None)
            return entry

        stats[STAT_TYPE.TIMELINE] = [_remove_tmp_fields(entry) for entry in new_timeline]

        for key in list(updates.keys()):
            if key.startswith('_'):
                updates.pop(key)

    def set_timeline_entry_task_details(self, entry, updates):
        """Calculate the desk, stage and user for this entry"""

        # Store temporary attribute for storing last known task
        updates.setdefault('_last_task', {
            'user': None,
            'desk': None,
            'stage': None
        })

        for field in ['desk', 'stage', 'user']:
            # If the current history record has the task details,
            # then update the last known task
            if entry['task'].get(field):
                updates['_last_task'][field] = entry['task'][field]

            # If the task is not set in the history record
            # then update it from the last known task
            elif not entry['task'].get(field) and updates['_last_task'][field]:
                entry['task'][field] = updates['_last_task'][field]

    def skip_timeline_entry(self, entry, updates):
        """Filter out history that belongs to the parent item (duplicated items)"""

        # Store temporary attribute for storing ids of history records
        # that have already been processed (no duplicate history records in stats)
        updates.setdefault('_processed_ids', [])

        # Skip history records that belong to the parent item
        # (history records are copied for duplicate items)
        original_item_id = entry.pop('original_item_id', None)
        if updates['_duplicate'] and original_item_id is not None:
            return True

        # If a history ID is set, then make sure we don't add duplicate history entries
        history_id = entry.get('history_id') or None
        if history_id is not None and not entry.get('_auto_generated'):
            # Filter out duplicate archive_history entries
            if entry['history_id'] in updates['_processed_ids']:
                return True

            updates['_processed_ids'].append(entry['history_id'])

        return False

    def update_par_count_from_timeline_entry(self, entry, updates, update):
        """Generate and store the paragraph count from body_html"""

        if len(update.get('body_html') or '') > 0:
            entry['par_count'] = get_par_count(update['body_html'])
            updates['par_count'] = entry['par_count']
        else:
            entry['par_count'] = updates['par_count']

        if 'original_par_count' not in updates and entry['par_count'] > 0:
            updates['original_par_count'] = entry['par_count']


command('analytics:gen_archive_statistics', GenArchiveStatistics())
