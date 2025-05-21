# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2024 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from asyncio import sleep
from superdesk import get_resource_service
from superdesk.metadata.item import ITEM_STATE, CONTENT_STATE
from analytics.tests import BaseTestCase


class ContentPublishingReportTestCase(BaseTestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.service = get_resource_service("content_publishing_report")
        self.app.data.insert(
            "published",
            [
                {
                    "_id": "item1",
                    "task": {"desk": "de1", "stage": "st1"},
                    ITEM_STATE: CONTENT_STATE.PUBLISHED,
                    "anpa_category": [{"qcode": "advisory", "name": "Advisories"}],
                    "source": "AAP",
                },
                {
                    "_id": "item2",
                    "task": {"desk": "de1", "stage": "st1"},
                    ITEM_STATE: CONTENT_STATE.PUBLISHED,
                    "anpa_category": [{"qcode": "domestic_sport", "name": "Domestic Sport"}],
                    "subject": [
                        {"name": "BTL/ECO", "qcode": "btl", "scheme": "packages"},
                        {"name": "Canadian", "qcode": "candian", "scheme": "keywords"},
                    ],
                    "source": "AAP",
                },
                {
                    "_id": "item3",
                    "task": {"desk": "de1", "stage": "st1"},
                    ITEM_STATE: CONTENT_STATE.PUBLISHED,
                    "anpa_category": [{"qcode": "finance", "name": "Finance"}],
                    "subject": [{"name": "Aap", "qcode": "aap", "scheme": "keywords"}],
                    "source": "AAP",
                },
                {
                    "_id": "item4",
                    "task": {"desk": "de1", "stage": "st1"},
                    ITEM_STATE: CONTENT_STATE.PUBLISHED,
                    "subject": [
                        {"name": "Aap", "qcode": "aap", "scheme": "keywords"},
                        {"name": "BIN/ALG", "qcode": "bin", "scheme": "packages"},
                    ],
                    "source": "AAP",
                },
            ],
        )

    async def test_get_aggregation_buckets(self):
        # TODO-ASYNC: figure out why there is a race condition. pytest rerun won't work either
        await sleep(1)

        params = {
            "source": {
                "query": {
                    "filtered": {
                        "filter": {
                            "bool": {
                                "must": [],
                                "must_not": [],
                            }
                        }
                    }
                },
                "size": 0,
                "from": 0,
                "sort": [{"versioncreated": "desc"}],
            },
            "page": 1,
            "max_results": 0,
            "aggs": {
                "group": {"field": "anpa_category.qcode", "size": 0},
                "subgroup": {"field": '{"scheme":"keywords"}', "size": 0},
            },
        }
        args = {
            "aggs": {
                "group": {"field": "anpa_category.qcode", "size": 0},
                "subgroup": {"field": '{"scheme":"keywords"}', "size": 0},
            },
            "params": {
                "dates": {},
                "must": {},
                "must_not": {},
                "min": 1,
                "chart": {"type": "column", "sort_order": "desc"},
            },
            "return_type": "aggregations",
        }

        docs = await self.service.run_query(params, args)
        report = await self.service.generate_report(docs, args)

        assert {
            "groups": {"advisory": {}, "domestic_sport": {"candian": 1}, "finance": {"aap": 1}},
            "subgroups": {"candian": 1, "aap": 1},
        } == report

        params["aggs"] = {
            "group": {"field": '{"scheme":"packages"}', "size": 0},
            "subgroup": {"field": '{"scheme":"keywords"}', "size": 0},
        }
        args["aggs"] = {
            "group": {"field": '{"scheme":"packages"}', "size": 0},
            "subgroup": {"field": '{"scheme":"keywords"}', "size": 0},
        }

        docs = await self.service.run_query(params, args)
        report = await self.service.generate_report(docs, args)
        assert {
            "groups": {"bin": {"aap": 1}, "btl": {"candian": 1}},
            "subgroups": {"aap": 1, "candian": 1},
        } == report

        params["aggs"] = {
            "group": {"field": '{"scheme":"keywords"}', "size": 0},
            "subgroup": {"field": "anpa_category.qcode", "size": 0},
        }
        args["aggs"] = {
            "group": {"field": '{"scheme":"packages"}', "size": 0},
            "subgroup": {"field": "anpa_category.qcode", "size": 0},
        }

        docs = await self.service.run_query(params, args)
        report = await self.service.generate_report(docs, args)
        assert {
            "groups": {"aap": {"finance": 1}, "candian": {"domestic_sport": 1}},
            "subgroups": {"finance": 1, "domestic_sport": 1},
        } == report
