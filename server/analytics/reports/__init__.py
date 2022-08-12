# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Dict, Any, Optional
import logging
import csv
from io import StringIO
import subprocess
import tempfile
from os import path
from base64 import b64encode

from flask import json
from superdesk.errors import SuperdeskApiError
from superdesk.timer import timer
from analytics.common import MIME_TYPES, get_highcharts_cli_path

logger = logging.getLogger(__name__)


def generate_report(
    options: Dict[str, Any],
    mimetype: str = MIME_TYPES.PNG,
    base64: bool = True,
    width: Optional[int] = None,
):
    if not isinstance(options, dict):
        raise SuperdeskApiError.badRequestError("Provided options must be a dictionary")

    if "series" not in options and "rows" not in options:
        raise SuperdeskApiError.badRequestError("Series data not provided")

    if mimetype in [
        MIME_TYPES.PNG,
        MIME_TYPES.JPEG,
        MIME_TYPES.GIF,
        MIME_TYPES.PDF,
        MIME_TYPES.SVG,
    ]:
        return generate_from_highcharts(options, mimetype, base64, width)
    elif mimetype == MIME_TYPES.CSV:
        return generate_csv(options)
    elif mimetype == MIME_TYPES.HTML:
        return generate_html(options)

    raise SuperdeskApiError.badRequestError("Unsupported mimetype '{}'".format(mimetype))


def generate_from_highcharts(
    options: Dict[str, Any],
    mimetype: str = MIME_TYPES.PNG,
    base64: bool = True,
    width: Optional[int] = None,
):
    try:
        with timer("generate_highcharts_report_file"), tempfile.TemporaryDirectory() as tmpdir:
            in_file = f"{tmpdir}/infile"
            out_file = f"{tmpdir}/outfile"

            _write_options_to_file(options, in_file)
            _run_highcharts_cli(in_file, out_file, mimetype, width)
            output = _load_report_from_file(out_file)

            return b64encode(output) if base64 else output
    except Exception as e:
        logger.error(e)
        raise SuperdeskApiError.internalError(f"Failed to generate report. {e}")


def generate_csv(options):
    csv_rows = options.get("csv") or []
    csv_file = StringIO()
    csv_writer = csv.writer(csv_file)

    csv_writer.writerows(csv_rows)

    return csv_file.getvalue().encode("UTF-8")


def generate_html(options):
    rows = options.get("rows") or []
    headers = options.get("headers") or []
    title = options.get("title") or ""

    if len(rows) < 1:
        return """<div><h3>{}</h3></div>""".format(title)

    thead = "<tr><th>{}</th></tr>".format("</th><th>".join(headers))
    tbody = ""
    for row in rows:
        tbody += "<tr><td>{}</td></tr>".format("</td><td>".join([str(td) for td in row]))

    return """
<div>
    <h3>{}</h3>
    <table border=1 style="width: 100%;">
        <thead>
            {}
        </thead>
        <tbody>
            {}
        </tbody>
    </table>
<div>""".format(
        title, thead, tbody
    )


def _write_options_to_file(options: Dict[str, Any], in_file: str):
    try:
        with open(in_file, "w") as f:
            f.write(json.dumps(options))
    except IOError as e:
        logger.exception(e)
        raise SuperdeskApiError.internalError("Failed to write highcharts options to file")


def _get_mimetype_short(mimetype: str):
    if mimetype == MIME_TYPES.PNG:
        return "png"
    elif mimetype == MIME_TYPES.PDF:
        return "pdf"
    elif mimetype == MIME_TYPES.SVG:
        return "svg"
    elif mimetype == MIME_TYPES.GIF:
        return "gif"
    elif mimetype == MIME_TYPES.JPEG:
        return "jpg"


def _run_highcharts_cli(in_file: str, out_file: str, mimetype: str, width: int = None):
    try:
        highcharts_cli = get_highcharts_cli_path()

        if not highcharts_cli:
            raise SuperdeskApiError.internalError("'highcharts-export-server' is not installed")

        args = [
            "node",
            highcharts_cli,
            "--infile",
            in_file,
            "--outfile",
            out_file,
            "--logLevel",
            "4",
            "--nologo",
            "1",
            "--type",
            _get_mimetype_short(mimetype),
        ]

        if width:
            args.extend(["--width", str(width)])

        response = subprocess.run(
            args,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            timeout=5,  # Don't allow process to run for more than 5 seconds,
        )

        if not path.exists(out_file):
            logger.error("Failed to run highcharts cli")
            logger.error(response.stdout)
            raise SuperdeskApiError.internalError("Failed to run highcharts cli")

        return response
    except FileNotFoundError as e:
        logger.exception(e)
        raise SuperdeskApiError.internalError("'highcharts-export-server' is not installed")
    except subprocess.SubprocessError as e:
        logger.exception(e)
        raise SuperdeskApiError.internalError("Failed to run highcharts cli")


def _load_report_from_file(out_file: str):
    try:
        with open(out_file, "rb") as f:
            return f.read()
    except IOError as e:
        logger.exception(e)
        raise SuperdeskApiError.internalError("Failed to read highcharts report from file")
