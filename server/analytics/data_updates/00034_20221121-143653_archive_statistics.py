# -*- coding: utf-8; -*-
# This file is part of Superdesk.
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
#
# Author  : MarkLark86
# Creation: 2022-11-21 14:36

import sys
import logging

from eve.utils import config
from flask import current_app as app

from superdesk import get_resource_service
from superdesk.commands.data_updates import BaseDataUpdate
from analytics.stats.archive_statistics import LAST_RUN_DOC_ID

logger = logging.getLogger(__name__)


class DataUpdate(BaseDataUpdate):
    """Upgrades the Archive Stats ``last_run`` doc to use ``_id=last_run``"""

    resource = "archive_statistics"

    def forwards(self, mongodb_collection, mongodb_database):
        if not app.config.get("ANALYTICS_ENABLE_ARCHIVE_STATS", False):
            # No need to run this upgrate script if stats is not enabled
            return

        service = get_resource_service(self.resource)

        if service.find_one(req=None, _id=LAST_RUN_DOC_ID):
            # ``last_run`` doc already exists with proper ``_id``, no need to continue
            return

        cursor = service.search({"query": {"match": {"stats_type": "last_run"}}})
        if not cursor.count():
            logger.warning("`last_run` doc not found in elastic, falling back to mongo")
            cursor = service.get_from_mongo(req=None, lookup={"stats_type": "last_run"})
            if not cursor.count():
                logger.warning(
                    "`last_run` doc not found, gen_archive_statistics may not have been run before"
                )
                return

        last_run_doc = list(cursor)[0]
        last_entry_id = last_run_doc.get("guid")
        if not last_entry_id:
            logger.warning("`last_run` doc does not include last run guid")
        else:
            try:
                service.post(
                    [
                        {
                            config.ID_FIELD: LAST_RUN_DOC_ID,
                            "guid": last_entry_id,
                            "stats_type": "last_run",
                        }
                    ]
                )
            except Exception:
                logger.exception("Failed to create new `last_run` doc")
                # Exit here so we keep the original ``last_run`` doc
                return

        try:
            service.delete(lookup={config.ID_FIELD: last_run_doc[config.ID_FIELD]})
        except Exception:
            logger.exception("Failed to delete original `last_run` doc")

    def backwards(self, mongodb_collection, mongodb_database):
        pass
