# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.tests import TestCase
from analytics.reports import generate_report
from analytics.common import MIME_TYPES

from PIL import Image
from io import BytesIO


options = {
    "title": {"text": "Steep Chart"},
    "xAxis": {
        "categories": ["Jan", "Feb", "Mar"]
    },
    "series": [
        {"data": [29.9, 71.5, 106.4]}
    ]
}


class GenerateReportTestCase(TestCase):
    def test_generate_svg(self):
        with self.app.app_context():
            report = generate_report(options, mimetype=MIME_TYPES.SVG, base64=False)

            # Report is a buffer of bytes with size > 0
            self.assertTrue(type(report) == bytes)
            self.assertTrue(len(report) > 0)

            # The bytes buffer represents an xml/svg file
            self.assertTrue(report.startswith(b'<?xml'))
            self.assertTrue(report.find(b'<svg') > -1)

            # The title and categories are found in the svg data
            self.assertTrue(report.find(b'Steep Chart') > -1)
            self.assertTrue(report.find(b'Jan') > -1)
            self.assertTrue(report.find(b'Feb') > -1)
            self.assertTrue(report.find(b'Mar') > -1)

    def test_generate_png(self):
        with self.app.app_context():
            report = generate_report(options, mimetype=MIME_TYPES.PNG, base64=False, width='800')

            # Report is a buffer of bytes with size > 0
            self.assertTrue(type(report) == bytes)
            self.assertTrue(len(report) > 0)

            image = Image.open(BytesIO(report))

            # Valid image file
            try:
                image.verify()
            except Exception as e:
                self.failureException('Exception raised: {}'.format(e))

            # Image is PNG with a width of 800
            self.assertEqual(image.format, 'PNG')
            self.assertEqual(image.width, 800)

    def test_generate_jpg(self):
        with self.app.app_context():
            report = generate_report(options, mimetype=MIME_TYPES.JPEG, base64=False, width='1200')

            # Report is a buffer of bytes with size > 0
            self.assertTrue(type(report) == bytes)
            self.assertTrue(len(report) > 0)

            image = Image.open(BytesIO(report))

            # Valid image file
            try:
                image.verify()
            except Exception as e:
                self.failureException('Exception raised: {}'.format(e))

            # Image is JPEG with a width of 1200
            self.assertEqual(image.format, 'JPEG')
            self.assertEqual(image.width, 1200)

    def test_generate_pdf(self):
        with self.app.app_context():
            report = generate_report(options, mimetype=MIME_TYPES.PDF, base64=False, width='1200')

            # Report is a buffer of bytes with size > 0
            self.assertTrue(type(report) == bytes)
            self.assertTrue(len(report) > 0)

            # PDF header/footer signature
            self.assertTrue(report.startswith(b'%PDF-'))
            self.assertTrue(report.endswith(b'%%EOF\n'))
