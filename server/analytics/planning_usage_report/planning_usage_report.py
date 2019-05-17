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
from superdesk.resource import Resource

from analytics.chart_config import ChartConfig
from analytics.base_report import BaseReportService


class PlanningUsageReportResource(Resource):
    """Planning Usage Report schema
    """

    item_methods = ['GET']
    resource_methods = ['GET']
    privileges = {'GET': 'planning_usage_report'}


class PlanningUsageReportService(BaseReportService):
    repos = ['events', 'planning', 'assignments']
    date_filter_field = '_created'
    aggregations = {
        'events': {
            'filter': {'term': {'type': 'event'}},
            'aggs': {
                'users': {
                    'terms': {
                        'field': 'original_creator',
                        'size': 0
                    }
                }
            }
        },
        'planning': {
            'filter': {'term': {'type': 'planning'}},
            'aggs': {
                'users': {
                    'terms': {
                        'field': 'original_creator',
                        'size': 0
                    }
                }
            }
        },
        'assignments': {
            'filter': {'term': {'type': 'assignment'}},
            'aggs': {
                'users': {
                    'terms': {
                        'field': 'original_creator',
                        'size': 0
                    }
                }
            }
        },
        'coverages': {
            'nested': {'path': 'coverages'},
            'aggs': {
                'users': {
                    'terms': {
                        'field': 'coverages.original_creator',
                        'size': 0
                    }
                }
            }
        }
    }

    def _get_filters(self, repos, invisible_stages):
        return None

    def generate_report(self, docs, args):
        """
        Report schema:
        {
            group: {
                [user._id]: {
                    events: [user_event_count],
                    planning: [user_planning_count],
                    coverages: [user_coverage_count],
                    assignments: [user_assignment_count]
                }
            },
            subgroup: {
                events: [event_create_count],
                planning: [planning_create_count],
                coverages: [coverage_create_count],
                assignments: [assignment_create_count],
            }
        }
        """
        aggs = (getattr(docs, 'hits') or {}).get('aggregations') or {}
        users_with_planning = self._get_users_with_planning()

        report = {
            'group': {
                user_id: {
                    'events': 0,
                    'planning': 0,
                    'coverages': 0,
                    'assignments': 0
                } for user_id in users_with_planning
            },
            'subgroup': {
                'events': 0,
                'planning': 0,
                'coverages': 0,
                'assignments': 0
            }
        }

        def add_creators(item_type):
            stats = (aggs.get(item_type) or {}).get('users') or {}

            for item in stats.get('buckets') or []:
                user_id = str(item.get('key') or '')
                if not user_id:
                    continue

                create_count = item.get('doc_count')
                if create_count < 1:
                    continue

                if user_id not in report['group']:
                    report['group'][user_id] = {
                        'events': 0,
                        'planning': 0,
                        'coverages': 0,
                        'assignments': 0
                    }

                report['group'][user_id][item_type] += create_count
                report['subgroup'][item_type] += create_count

        add_creators('coverages')
        add_creators('events')
        add_creators('planning')
        add_creators('assignments')

        return report

    def _get_users_with_planning(self):
        """Returns a list of users with the Planning privilege"""

        planning_role_ids = [
            str(role.get('_id'))
            for role in get_resource_service('roles').get(
                req=None,
                lookup={'privileges.planning': 1}
            )
        ]

        active_users = get_resource_service('users').get(
            req=None,
            lookup={'is_enabled': True}
        )

        users_with_planning = []
        for user in active_users:
            user_id = str(user.get('_id'))
            privileges = user.get('privileges') or {}

            if (privileges.get('planning') or 0) != 0:
                users_with_planning.append(user_id)
            elif str(user.get('role')) in planning_role_ids:
                users_with_planning.append(user_id)

        return users_with_planning

    def generate_highcharts_config(self, docs, args):
        params = args.get('params') or {}

        chart = params.get('chart') or {}
        chart_type = chart.get('type') or 'bar'

        report = self.generate_report(docs, args)

        chart_config = ChartConfig('planning_usage', chart_type)

        chart_config.add_source('task.user', report.get('group'))
        chart_config.add_source('planning_usage', report.get('subgroup'))

        def gen_title():
            if chart.get('title'):
                return chart['title']

            return 'Planning Module Usage'

        def gen_subtitle():
            return ChartConfig.gen_subtitle_for_dates(params)

        def get_y_axis_title():
            return 'Items Created'

        chart_config.get_title = gen_title
        chart_config.get_subtitle = gen_subtitle
        chart_config.get_y_axis_title = get_y_axis_title
        chart_config.sort_order = chart.get('sort_order') or 'desc'

        translations = args.get('translations') or {}
        chart_config.translations = translations

        report['highcharts'] = [chart_config.gen_config()]

        return report

    def generate_csv(self, docs, args):
        report = self.generate_report(docs, args)
        return report

    def generate_html(self, docs, args):
        report = self.generate_report(docs, args)
        return report
