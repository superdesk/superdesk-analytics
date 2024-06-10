# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from analytics.base_report import BaseReportService, BaseReportResource
from analytics.chart_config import ChartConfig
from analytics.common import MAX_TERMS_SIZE
import json


class ContentPublishingReportResource(BaseReportResource):
    """Content Publishing Report schema"""

    item_methods = ["GET"]
    resource_methods = ["GET"]
    privileges = {"GET": "content_publishing_report"}


class ContentPublishingReportService(BaseReportService):
    repos = ["published", "archived"]

    aggregations = {
        "source": {
            "terms": {
                "field": "source",
                "size": MAX_TERMS_SIZE,
            }
        }
    }

    @staticmethod
    def _get_aggregation_query(agg):
        include = agg.get("filter") or "all"

        query = {
            "terms": {
                "field": agg.get("field"),
                "size": agg.get("size") or MAX_TERMS_SIZE,
            }
        }

        if include != "all":
            query["terms"]["include"] = include
            query["terms"]["min_doc_count"] = 0

        return query

    def get_aggregations(self, params, args):
        aggs = params.get("aggs") or {}

        if not aggs or not (aggs.get("group") or {}).get("field"):
            return ContentPublishingReportService.aggregations

        aggregations = {"parent": self._get_aggregation_query(aggs["group"])}

        if aggs.get("subgroup"):
            aggregations["parent"]["aggs"] = {"child": self._get_aggregation_query(aggs["subgroup"])}

        return aggregations

    def generate_report(self, docs, args):
        """Returns the publishing statistics

        :param docs: document used for generating the statistics
        :return dict: report
        """
        agg_buckets = self.get_aggregation_buckets(getattr(docs, "hits"), ["parent"])

        report = {"groups": {}}

        has_children = "field" in ((args.get("aggs") or {}).get("subgroup") or {})

        if has_children:
            report["subgroups"] = {}

        for parent in agg_buckets.get("parent") or []:
            parent_key = parent.get("key")

            if not parent_key:
                continue

            if not has_children:
                report["groups"][parent_key] = parent.get("doc_count") or 0
                continue

            report["groups"][parent_key] = {}

            for child in (
                (parent.get("child") or {}).get("buckets")
                or (parent.get("child_aggs", {}).get("child", {}).get("buckets"))
                or []
            ):
                child_key = child.get("key")

                if not child_key:
                    continue

                if child_key not in report["subgroups"]:
                    report["subgroups"][child_key] = 0

                doc_count = child.get("doc_count") or 0
                report["groups"][parent_key][child_key] = doc_count
                report["subgroups"][child_key] += doc_count

        return report

    def generate_highcharts_config(self, docs, args):
        params = args.get("params") or {}
        aggs = args.get("aggs") or {}
        group = aggs.get("group") or {}
        subgroup = aggs.get("subgroup") or {}
        translations = args.get("translations") or {}

        chart = params.get("chart") or {}
        chart_type = chart.get("type") or "bar"

        report = self.generate_report(docs, args)

        chart_config = ChartConfig("content_publishing", chart_type)

        chart_config.add_source(group.get("field"), report.get("groups"))

        if report.get("subgroups"):
            chart_config.add_source(subgroup.get("field"), report["subgroups"])

        def gen_title():
            if chart.get("title"):
                return chart["title"]

            group_type = group.get("field")
            group_title = chart_config.get_source_name(group_type)

            if subgroup.get("field"):
                subgroup_type = subgroup.get("field")
                subgroup_title = chart_config.get_source_name(subgroup_type)

                return "Published Stories per {} with {} breakdown".format(group_title, subgroup_title)

            return "Published Stories per {}".format(group_title)

        def gen_subtitle():
            return ChartConfig.gen_subtitle_for_dates(params)

        chart_config.get_title = gen_title
        chart_config.get_subtitle = gen_subtitle
        chart_config.sort_order = chart.get("sort_order") or "desc"

        chart_config.translations = translations

        report["highcharts"] = [chart_config.gen_config()]

        return report

    def get_aggregation_buckets(self, docs, aggregation_ids=None):
        buckets = {}
        filtered_subjects = docs.get("aggregations", {}).get("parent", {}).get("qcode_filter")
        if filtered_subjects:
            buckets[aggregation_ids[0]] = filtered_subjects.get("qcode_terms", {}).get("buckets") or []
            return buckets

        return super().get_aggregation_buckets(docs, aggregation_ids)

    def get_custom_aggs_query(self, query, aggs):
        field = self.parse_field_param(aggs.get("parent", {}).get("terms", {}).get("field"))
        if field:
            # Construct the nested aggregation query
            qcode_terms_agg = {"terms": {"field": "subject.qcode", "size": 1000}}

            # Retrieve child aggregations if any
            child = self.get_child_aggs(query)
            if child:
                qcode_terms_agg["aggs"] = {"child_aggs": {"reverse_nested": {}, "aggs": child}}

            query["aggs"]["parent"] = {
                "nested": {"path": "subject"},
                "aggs": {
                    "qcode_filter": {
                        "filter": {"term": {"subject.scheme": field}},
                        "aggs": {"qcode_terms": qcode_terms_agg},
                    }
                },
            }

    def get_child_aggs(self, query):
        parent_aggs = query.get("aggs", {}).get("parent", {})
        if "aggs" in parent_aggs:
            return parent_aggs["aggs"]
        return {}

    def parse_field_param(self, field_param):
        try:
            # Check if the field_param is a JSON string and parse it
            field_dict = json.loads(field_param)
            if isinstance(field_dict, dict) and "scheme" in field_dict:
                return field_dict["scheme"]
        except json.JSONDecodeError:
            pass

        return None
