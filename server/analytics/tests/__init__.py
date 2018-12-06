# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.tests import TestCase as _TestCase, update_config, setup
from superdesk.factory.app import get_app


class TestCase(_TestCase):

    def setUp(self):
        config = {
            'INSTALLED_APPS': ['analytics'],
            'STATISTICS_MONGO_DBNAME': 'sptests_statistics'
        }
        update_config(config)
        self.app = get_app(config)
        setup.app = self.app
        super().setUp()
