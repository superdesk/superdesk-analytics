# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013-2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license


from superdesk import get_resource_service, json
from superdesk.services import BaseService
from superdesk.resource import Resource, not_indexed, not_analyzed, not_enabled
from superdesk.metadata.item import metadata_schema, FORMAT, ITEM_TYPE, ITEM_STATE, \
    SCHEDULE_SETTINGS, BYLINE
from superdesk.metadata.utils import item_url
from apps.archive.common import ARCHIVE_SCHEMA_FIELDS

from analytics.stats.common import STAT_TYPE

from eve.utils import config, ParsedRequest, date_to_str


class ArchiveStatisticsResource(Resource):
    endpoint_name = resource_title = url = 'archive_statistics'
    item_url = item_url
    item_methods = ['GET', 'PATCH', 'DELETE']
    resource_methods = ['GET', 'POST']
    datasource = {
        'source': 'archive_statistics',
        'search_backend': 'elastic',
    }

    mongo_prefix = 'STATISTICS_MONGO'
    elastic_prefix = 'STATISTICS_ELASTIC'

    query_objectid_as_string = True

    schema = {
        config.ID_FIELD: metadata_schema[config.ID_FIELD],
        'guid': metadata_schema['guid'],
        'stats_type': {'type': 'string'},
        'stats': {
            'type': 'dict',
            'schema': {
                STAT_TYPE.TIMELINE: {
                    'type': 'list',
                    'schema': {
                        'type': 'dict',
                        'schema': {
                            'history_id': {
                                'type': 'string',
                                'mapping': not_indexed
                            },
                            'related_history_id': {
                                'type': 'string',
                                'mapping': not_indexed
                            },
                            'operation': {'type': 'string'},
                            'operation_created': {'type': 'datetime'},
                            ITEM_STATE: metadata_schema[ITEM_STATE],
                            'pubstatus': {'type': 'string'},
                            'word_count': metadata_schema['word_count'],
                            'par_count': metadata_schema['word_count'],
                            'task': {
                                'type': 'dict',
                                'schema': {
                                    'user': Resource.rel('users'),
                                    'desk': Resource.rel('desks', nullable=True),
                                    'stage': Resource.rel('stages', nullable=True)
                                }
                            },
                            'update': {
                                'type': 'dict',
                                'mapping': not_enabled
                            }
                        }
                    },
                    'mapping': {
                        'type': 'nested',
                        'properties': {
                            'history_id': not_indexed,
                            'related_history_id': not_indexed,
                            'operation': {'type': 'string'},
                            'operation_created': {'type': 'date'},
                            ITEM_STATE: {'type': 'string'},
                            'pubstatus': {'type': 'string'},
                            'word_count': {'type': 'integer'},
                            'par_count': {'type': 'integer'},
                            'task': {
                                'type': 'object',
                                'properties': {
                                    'user': not_analyzed,
                                    'desk': not_analyzed,
                                    'stage': not_analyzed
                                }
                            },
                            'update': not_enabled
                        }
                    }
                },
                STAT_TYPE.DESK_TRANSITIONS: {
                    'type': 'list',
                    'schema': {
                        'type': 'dict',
                        'schema': {
                            'user': Resource.rel('users'),
                            'desk': Resource.rel('desks', nullable=True),
                            'stage': Resource.rel('stages', nullable=True),
                            'entered': {'type': 'datetime'},
                            'entered_operation': {'type': 'string'},
                            'exited': {'type': 'datetime'},
                            'exited_operation': {'type': 'string'},
                            'duration': {'type': 'integer'},
                        }
                    },
                    'mapping': {
                        'type': 'nested',
                        'properties': {
                            'user': not_analyzed,
                            'desk': not_analyzed,
                            'stage': not_analyzed,
                            'entered': {'type': 'date'},
                            'entered_operation': {'type': 'string'},
                            'exited': {'type': 'date'},
                            'exited_operation': {'type': 'string'},
                            'duration': {'type': 'integer'}
                        }
                    }
                },
                STAT_TYPE.FEATUREMEDIA_UPDATES: {
                    'type': 'list',
                    'schema': {
                        'type': 'dict',
                        'schema': {
                            'related_history_id': {
                                'type': 'string',
                                'mapping': not_analyzed
                            },
                            'operation': {'type': 'string'},
                            'operation_created': {'type': 'datetime'},
                            ITEM_STATE: metadata_schema[ITEM_STATE],
                            'pubstatus': {'type': 'string'},
                            'word_count': metadata_schema['word_count'],
                            'par_count': metadata_schema['word_count'],
                            'task': {
                                'type': 'dict',
                                'schema': {
                                    'user': Resource.rel('users'),
                                    'desk': Resource.rel('desks', nullable=True),
                                    'stage': Resource.rel('stages', nullable=True)
                                }
                            },
                            'renditions': {
                                'type': 'dict',
                                'mapping': not_indexed
                            },
                            'poi': {
                                'type': 'dict',
                                'mapping': not_enabled
                            }
                        }
                    },
                    'mapping': {
                        'type': 'nested',
                        'properties': {
                            'related_history_id': not_analyzed,
                            'operation': {'type': 'string'},
                            'operation_created': {'type': 'date'},
                            ITEM_STATE: {'type': 'string'},
                            'pubstatus': {'type': 'string'},
                            'word_count': {'type': 'integer'},
                            'par_count': {'type': 'integer'},
                            'task': {
                                'type': 'object',
                                'properties': {
                                    'user': not_analyzed,
                                    'desk': not_analyzed,
                                    'stage': not_analyzed
                                }
                            },
                            'renditions': not_enabled,
                            'poi': not_enabled
                        }
                    }
                },
            }
        },

        # Metadata
        'original_creator': metadata_schema['original_creator'],
        'version': metadata_schema['version'],
        'version_creator': metadata_schema['version_creator'],
        'versioncreated': metadata_schema['versioncreated'],
        'firstpublished': metadata_schema['firstpublished'],
        'firstcreated': metadata_schema['firstcreated'],
        'source': metadata_schema['source'],
        'original_source': metadata_schema['original_source'],
        'ingest_provider': metadata_schema['ingest_provider'],
        'anpa_category': metadata_schema['anpa_category'],
        'subject': metadata_schema['subject'],
        'genre': metadata_schema['genre'],
        'company_codes': metadata_schema['company_codes'],

        ITEM_TYPE: metadata_schema[ITEM_TYPE],
        'abstract': metadata_schema['abstract'],
        'headline': metadata_schema['headline'],
        'slugline': {'type': 'string'},
        'anpa_take_key': metadata_schema['anpa_take_key'],
        'keywords': metadata_schema['keywords'],
        'word_count': metadata_schema['word_count'],
        'paragraph_count': metadata_schema['word_count'],
        'priority': metadata_schema['priority'],
        'urgency': metadata_schema['urgency'],

        ITEM_STATE: metadata_schema[ITEM_STATE],
        'pubstatus': metadata_schema['pubstatus'],
        'flags': metadata_schema['flags'],
        'sms_message': metadata_schema['sms_message'],
        FORMAT: metadata_schema[FORMAT],
        'auto_publish': metadata_schema['auto_publish'],
        'assignment_id': metadata_schema['assignment_id'],
        'rewrite_of': ARCHIVE_SCHEMA_FIELDS['rewrite_of'],
        'rewritten_by': ARCHIVE_SCHEMA_FIELDS['rewritten_by'],
        'original_id': ARCHIVE_SCHEMA_FIELDS['original_id'],
        SCHEDULE_SETTINGS: ARCHIVE_SCHEMA_FIELDS[SCHEDULE_SETTINGS],
        'task': {
            'type': 'dict',
            'schema': {
                'user': Resource.rel('users'),
                'desk': Resource.rel('desks', nullable=True),
                'stage': Resource.rel('stages', nullable=True)
            }
        },
        'unique_id': metadata_schema['unique_id'],
        'unique_name': metadata_schema['unique_name'],
        'ingest_id': metadata_schema['ingest_id'],
        'family_id': metadata_schema['family_id'],
        'usageterms': metadata_schema['usageterms'],
        'copyrightnotice': metadata_schema['copyrightnotice'],
        'copyrightholder': metadata_schema['copyrightholder'],
        'profile': metadata_schema['profile'],
        BYLINE: metadata_schema[BYLINE],
        'ednote': metadata_schema['ednote'],
        'dateline': metadata_schema['dateline'],
        'expiry': metadata_schema['expiry'],
        'place': metadata_schema['place'],
        'template': metadata_schema['template'],

        'original_par_count': metadata_schema['word_count'],
        'par_count': metadata_schema['word_count'],
        'time_to_first_publish': {'type': 'integer'},
        'time_to_next_update_publish': {
            'type': 'integer',
            'default': 0
        },
        'num_desk_transitions': {
            'type': 'integer',
            'default': 0
        },
        'num_featuremedia_updates': {
            'type': 'integer',
            'default': 0
        },

        # Dictionary for statistics generated via plugins (i.e. from gen_stats_signals)
        'extra': {
            'type': 'dict',
            'mapping': not_enabled
        }
    }


class ArchiveStatisticsService(BaseService):
    def get_last_run(self):
        return self.find_one(req=None, stats_type='last_run') or {}

    def set_last_run_id(self, entry_id, last_run=None):
        if last_run is None:
            last_run = self.get_last_run()

        if last_run and last_run.get(config.ID_FIELD):
            self.patch(last_run[config.ID_FIELD], {'guid': entry_id})
        else:
            self.post([{'guid': entry_id, 'stats_type': 'last_run'}])

    def get_history_items(self, last_id, gte, item_id, chunk_size=0):
        history_service = get_resource_service('archive_history')

        last_processed_id = last_id

        while True:
            req = ParsedRequest()
            req.sort = '[("_id", 1), ("version", 1)]'

            query = {'$and': []}

            if gte:
                query['$and'].append({'_created': {'$gte': date_to_str(gte)}})

            if item_id:
                query['$and'].append({'item_id': str(item_id)})

            if last_processed_id:
                query['$and'].append({'_id': {'$gt': str(last_processed_id)}})

            req.where = json.dumps(query)

            if chunk_size > 0:
                req.max_results = int(chunk_size)

            items = list(history_service.get(req=req, lookup=None))

            if len(items) < 1:
                break

            last_processed_id = items[-1][config.ID_FIELD]
            yield items
