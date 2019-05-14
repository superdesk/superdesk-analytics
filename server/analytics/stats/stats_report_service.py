# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013-2019 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from flask import current_app as app
from analytics.base_report import BaseReportService


class StatsReportService(BaseReportService):
    repos = ['archive_statistics']

    def get_elastic_index(self, types):
        return app.config.get('STATISTICS_ELASTIC_INDEX') or app.config.get('STATISTICS_MONGO_DBNAME') or 'statistics'

    def get_es_stats_type(self, query, params):
        query['must'].append({
            'term': {'stats_type': 'archive'}
        })

    def _es_base_query(self, query, params):
        super()._es_base_query(query, params)
        self.get_es_stats_type(query, params)

    def _get_filters(self, repos, invisible_stages):
        return None

    def _get_es_query_funcs(self):
        funcs = super()._get_es_query_funcs()

        funcs.update({
            'desk_transitions': {'query': self._es_filter_desk_transitions},
            'user_locks': {'query': self._es_filter_user_locks},
            'publish_pars': {'query': self._es_filter_publish_pars}
        })

        return funcs

    def _es_filter_desks(self, query, desks, must, params):
        query[must].append({
            'nested': {
                'path': 'stats.timeline',
                'query': {
                    'terms': {'stats.timeline.task.desk': desks}
                }
            }
        })

    def _es_filter_users(self, query, users, must, params):
        query[must].append({
            'nested': {
                'path': 'stats.timeline',
                'query': {
                    'terms': {'stats.timeline.task.user': users}
                }
            }
        })

    def _es_filter_stages(self, query, stages, must, params):
        query[must].append({
            'nested': {
                'path': 'stats.timeline',
                'query': {
                    'terms': {'stats.timeline.task.stage': stages}
                }
            }
        })

    def _es_filter_desk_transitions(self, query, value, must, params):
        if not isinstance(value, dict):
            return

        if value.get('min') or value.get('max'):
            ranges = {}

            if value.get('min'):
                ranges['gte'] = value['min']

            if value.get('max'):
                ranges['lte'] = value['ax']

            query[must].append({
                'range': {
                    'num_desk_transitions': ranges
                }
            })

        if value.get('enter'):
            query[must].append({
                'nested': {
                    'path': 'stats.desk_transitions',
                    'query': {
                        'terms': {'stats.desk_transitions.entered_operation': value['enter']}
                    }
                }
            })

        if value.get('exit'):
            query[must].append({
                'nested': {
                    'path': 'stats.desk_transitions',
                    'query': {
                        'terms': {'stats.desk_transitions.exited_operation': value['exit']}
                    }
                }
            })

    def _es_filter_user_locks(self, query, user, must, params):
        lt, gte, time_zone = self._es_get_date_filters(params)

        query[must].append({
            'nested': {
                'path': 'stats.timeline',
                'query': {
                    'bool': {
                        'must': [
                            {'term': {'stats.timeline.task.user': user}},
                            {'terms': {
                                'stats.timeline.operation': [
                                    'item_lock',
                                    'item_unlock'
                                ]
                            }},
                            {'range': {
                                'stats.timeline.operation_created': {
                                    'gte': gte,
                                    'lt': lt,
                                    'time_zone': time_zone
                                }
                            }}
                        ]
                    }
                }
            }
        })

    def _es_filter_publish_pars(self, query, value, must, params):
        if value:
            query[must].append({
                'nested': {
                    'path': 'stats.timeline',
                    'query': {
                        'filtered': {
                            'filter': {
                                'and': [{
                                    'term': {'stats.timeline.operation': 'publish'},
                                }, {
                                    'term': {'stats.timeline.par_count': value}
                                }]
                            }
                        }
                    }
                }
            })
