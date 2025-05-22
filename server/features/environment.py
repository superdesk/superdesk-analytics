# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import asyncio
from superdesk.tests.environment import (
    setup_before_all,
    before_feature as setup_before_feature,
    before_scenario_async as setup_before_scenario,
    before_step,
    after_scenario,
)  # noqa
from app import get_app
from settings import INSTALLED_APPS


def before_all(context):
    config = {
        "INSTALLED_APPS": INSTALLED_APPS,
        "ELASTICSEARCH_FORCE_REFRESH": True,
    }
    setup_before_all(context, config, app_factory=get_app)


def run_async_task(task):
    """
    Runs async task until completes and logs any exceptions.
    """
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(task)
    except Exception as e:
        print(e)
        raise e


def before_feature(context, feature):
    # TODO-ASYNC: remove once `FeaturemediaUpdates` is migrated to async
    if "skip" in feature.tags:
        feature.skip("Feature has been skipped")
        return

    setup_before_feature(context, feature)


def before_scenario(context, scenario):
    # TODO-ASYNC: remove once `FeaturemediaUpdates` is migrated to async
    if "skip" in scenario.tags:
        scenario.skip("Scenario has been skipped")
        return

    run_async_task(setup_before_scenario(context, scenario))
