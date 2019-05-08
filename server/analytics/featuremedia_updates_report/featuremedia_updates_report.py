# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013-2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.resource import Resource
from superdesk.utc import utc_to_local

from analytics.stats.stats_report_service import StatsReportService
from analytics.chart_config import ChartConfig
from analytics.common import REPORT_CONFIG, CHART_TYPES

from flask import current_app as app
from eve_elastic.elastic import parse_date


class FeaturemdiaUpdatesReportResource(Resource):
    """Featuremedia Updates Report schema"""

    item_methods = ['GET']
    resource_methods = ['GET']
    privileges = {'GET': 'featuremedia_updates_report'}


class FeaturemediaUpdatesTimeReportService(StatsReportService):
    aggregations = None
    date_filter_field = 'versioncreated'

    defaultConfig = {
        REPORT_CONFIG.CHART_TYPES: {
            # Table is the only supported chart type for this report
            # The 'report_configs' endpoint will omit all others
            CHART_TYPES.TABLE: {'enabled': True}
        },
        REPORT_CONFIG.DEFAULT_PARAMS: {
            'chart': {'type': CHART_TYPES.TABLE}
        }
    }

    def get_request_aggregations(self, params, args):
        """Disable generating aggregations"""
        return None

    def get_es_stats_type(self, query, params):
        # Check the rewrites filter is include|exclude|only
        # then modify this query to reflect the filter
        if (params.get('rewrites') or 'include') == 'include':
            query['should'] += [{
                'bool': {
                    'must': {'term': {'stats_type': 'archive'}},
                    'must_not': [
                        {'exists': {'field': 'rewritten_by'}},
                        {'exists': {'field': 'rewrite_of'}}
                    ]
                }
            }, {
                'bool': {
                    'must': [
                        {'term': {'stats_type': 'archive_family'}},
                        {'exists': {'field': 'rewritten_by'}}
                    ],
                }
            }]

            query['minimum_should_match'] = 1
        else:
            query['must'].append({'term': {'stats_type': 'archive'}})

    def _es_set_size(self, query, params):
        """Disable setting the size"""
        query['size'] = 200

    def generate_elastic_query(self, args):
        query = super().generate_elastic_query(args)

        query['source']['query']['filtered']['filter']['bool']['must'].extend([{
            'range': {'num_featuremedia_updates': {'gt': 1}}
        }, {
            'term': {'type': 'text'}
        }])

        return query

    def generate_report(self, docs, args):
        chart_params = (args.get('params') or {}).get('chart') or {}
        report = {'items': []}

        def get_featuremedia(update):
            return (update.get('associations') or {}).get('featuremedia') or {}

        for doc in sorted(
                docs,
                key=lambda d: d.get('versioncreated'),
                reverse=(chart_params.get('sort_order') or 'desc') == 'desc'
        ):
            stats = doc.get('stats') or {}
            featuremedia_updates = stats.get('featuremedia_updates') or []

            try:
                featuremedia = get_featuremedia(
                    featuremedia_updates[0].get('update') or {}
                )
                original_image = {
                    '_id': featuremedia.get('_id'),
                    'guid': featuremedia.get('guid'),
                    'headline': featuremedia.get('headline'),
                    'alt_text': featuremedia.get('alt_text'),
                    'description_text': featuremedia.get('description_text')
                }
            except IndexError:
                # Our elastic query should have filtered out empty featuremedia updates
                # Therefor this should never happen, so we can skip this item
                continue

            item_report = {
                'firstcreated': doc.get('firstcreated'),
                'firstpublished': doc.get('firstpublished'),
                'versioncreated': doc.get('versioncreated'),
                'original_creator': doc.get('original_creator'),
                'slugline': doc.get('slugline'),
                'headline': doc.get('headline'),
                'item_type': doc.get('stats_type'),
                'source': doc.get('source'),
                'state': doc.get('state'),
                'updates': [],
                'original_image': original_image,
                '_id': doc.get('_id')
            }

            for update in featuremedia_updates:
                item_report['updates'].append({
                    'operation': update.get('operation'),
                    'operation_created': update.get('operation_created'),
                    'user': (update.get('task') or {}).get('user'),
                    'update': get_featuremedia(update.get('update') or {})
                })

            report['items'].append(item_report)

        return report

    def generate_highcharts_config(self, docs, args):
        report = self.generate_report(docs, args)

        params = args.get('params') or {}
        chart_params = params.get('chart') or {}
        items = report.get('items') or []

        title = chart_params.get('title') or 'Changes to Featuremedia'
        subtitle = chart_params.get('subtitle') or ChartConfig.gen_subtitle_for_dates(params)

        translations = ChartConfig.get_translations(['task.user', 'operation'])
        user_translations = (translations.get('task_user') or {}).get('names') or {}
        operation_translations = (translations.get('operation') or {}).get('names') or {}
        rows = []

        def gen_date_str(date):
            return utc_to_local(
                app.config['DEFAULT_TIMEZONE'],
                date
            ).strftime('%d/%m/%Y %H:%M')

        for item in items:
            original_image = item.get('original_image') or {}
            updates = []

            for update in item.get('updates') or []:
                updates.append('{} - {} by {}'.format(
                    gen_date_str(parse_date(update.get('operation_created'))),
                    operation_translations.get(update.get('operation')) or update.get('operation'),
                    user_translations.get(update.get('user')) or ''
                ))

            rows.append([
                gen_date_str(item.get('versioncreated')),
                user_translations.get(item.get('original_creator')) or '',
                item.get('slugline') or '',
                original_image.get('headline') or original_image.get('alt_text') or '',
                '<ul><li>{}</li></ul>'.format('</li><li>'.join(updates))
            ])

        return {
            'highcharts': [{
                'id': 'featuremedia_updates',
                'type': 'table',
                'title': title,
                'subtitle': subtitle,
                'headers': ['Date', 'Creator', 'Slugline', 'Original Image', 'Featuremedia History'],
                'rows': rows
            }]
        }
