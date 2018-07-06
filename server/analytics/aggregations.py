# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license


ITEMS_OVER_DAYS = 'items_over_days'
ITEMS_OVER_HOURS = 'items_over_hours'

items_over_days_aggregation = (ITEMS_OVER_DAYS, {'date_histogram': {'field': '_updated', 'interval': 'day'}})
items_over_hours_aggregation = (ITEMS_OVER_HOURS, {'date_histogram': {'field': '_updated', 'interval': 'hour'}})
