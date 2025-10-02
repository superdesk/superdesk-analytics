# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Any

from settings import INSTALLED_APPS
from superdesk.default_settings import MODULES

from superdesk.tests import TestCase


class BaseTestCase(TestCase):
    app_config: dict[str, Any] = {
        "INSTALLED_APPS": INSTALLED_APPS + ["analytics"],
        "MODULES": MODULES + ["planning.module"],
        "STATISTICS_MONGO_DBNAME": "sptests_statistics",
    }
