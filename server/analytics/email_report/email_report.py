# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.services import BaseService
from superdesk.resource import Resource
from superdesk.errors import SuperdeskApiError
from superdesk.lock import lock, unlock
from superdesk.logging import logger
from superdesk.celery_app import celery

from analytics.common import get_report_service, mime_types, MIME_TYPES, get_mime_type_extension
from analytics.reports import generate_report
from .analytics_message import AnalyticsMessage

from flask import current_app as app, render_template
from email.charset import Charset, QP
from base64 import b64decode
from uuid import uuid4
from bson import ObjectId


class EmailReportResource(Resource):
    """Resource to email report charts"""

    endpoint_name = resource_title = url = 'email_report'
    resource_methods = ['POST']
    privileges = {'POST': 'scheduled_reports'}

    schema = {
        'report': {
            'type': 'dict',
            'required': True,
            'schema': {
                'type': {
                    'type': 'string',
                    'required': True
                },
                'params': {
                    'type': 'dict',
                    'required': True
                },
                'mimetype': {
                    'type': 'string',
                    'required': True,
                    'allowed': mime_types,
                    'default': MIME_TYPES.JPEG
                },
                'width': {
                    'type': 'integer',
                    'required': False,
                    'default': 800
                },
                'translations': {
                    'type': 'dict',
                    'required': False
                }
            }
        },
        'email': {
            'type': 'dict',
            'required': True,
            'schema': {
                'sender': {
                    'type': 'string',
                    'required': False
                },
                'recipients': {
                    'type': 'list',
                    'required': True,
                    'schema': {'type': 'string'}
                },
                'subject': {
                    'type': 'string',
                    'required': True
                },
                'txt': {
                    'type': 'dict',
                    'required': True,
                    'schema': {
                        'body': {
                            'type': 'string',
                            'required': False
                        },
                        'template': {
                            'type': 'string',
                            'required': False,
                            'default': 'analytics_scheduled_report.txt'
                        }
                    }
                },
                'html': {
                    'type': 'dict',
                    'required': True,
                    'schema': {
                        'body': {
                            'type': 'string',
                            'required': False
                        },
                        'template': {
                            'type': 'string',
                            'required': False,
                            'default': 'analytics_scheduled_report.html'
                        }
                    }
                }
            }
        },
    }


class EmailReportService(BaseService):
    def create(self, docs, **kwargs):
        for doc in docs:
            attachments = self._gen_attachments(doc.get('report') or {})
            self._email_report(doc.get('email') or {}, attachments)

        # We're not actually saving anything to the database
        # So return empty array here
        return [0]

    @staticmethod
    def _gen_attachments(report):
        report_service = get_report_service(report.get('type'))
        if report_service is None:
            raise SuperdeskApiError.badRequestError(
                'Unknown report type "{}"'.format(report.get('type'))
            )

        if report.get('mimetype') in [
            MIME_TYPES.PNG,
            MIME_TYPES.JPEG,
            MIME_TYPES.GIF,
            MIME_TYPES.PDF,
            MIME_TYPES.SVG
        ]:
            # This mimetype is handled by highcharts, so generate the highcharts config
            return_type = 'highcharts_config'
        elif report.get('mimetype') == MIME_TYPES.CSV:
            return_type = MIME_TYPES.CSV
        else:
            return_type = 'aggregations'

        generated_report = list(report_service.get(
            req=None,
            params=report.get('params') or {},
            translations=report.get('translations') or {},
            return_type=return_type
        ))[0]

        if return_type == 'highcharts_config':
            options = generated_report.get('highcharts')
        elif return_type == MIME_TYPES.CSV:
            options = [generated_report.get('csv')]
        else:
            options = []

        attachments = []

        i = 1
        for option in options:
            mime_type = report.get('mimetype')
            report_width = report.get('width') or 800

            if isinstance(option, dict) and option.get('type') == 'table':
                mime_type = MIME_TYPES.HTML

            try:
                attachments.append({
                    'file': generate_report(
                        option,
                        mimetype=mime_type,
                        base64=True,
                        width=report_width
                    ),
                    'mimetype': mime_type,
                    'filename': 'chart_{}.{}'.format(i, get_mime_type_extension(mime_type)),
                    'width': report_width
                })
                i += 1
            except Exception as e:
                logger.error('Failed to generate chart.')
                logger.exception(e)

        return attachments

    @staticmethod
    def _email_report(email, attachments):
        txt = email.get('txt') or {}
        html = email.get('html') or {}

        send_email_report.apply_async(
            kwargs={
                '_id': str(ObjectId()),
                'subject': email.get('subject'),
                'sender': email.get('sender') or app.config['ADMINS'][0],
                'recipients': email.get('recipients'),
                'text_body': txt.get('body') or '',
                'html_body': html.get('body') or '',
                'attachments': attachments,
                'txt_template': txt.get('template'),
                'html_template': html.get('template')
            }
        )


@celery.task(bind=True, max_retries=3, soft_time_limit=120)
def send_email_report(
    self,
    _id,
    subject,
    sender,
    recipients,
    text_body='',
    html_body='',
    cc=None,
    bcc=None,
    attachments=None,
    txt_template='analytics_scheduled_report.txt',
    html_template='analytics_scheduled_report.html'
):
    lock_id = 'analytics_email:{}'.format(str(_id))
    if not lock(lock_id, expire=120):
        return

    try:
        charset = Charset('utf-8')
        charset.header_encoding = QP
        charset.body_encoding = QP

        msg = AnalyticsMessage(
            subject,
            sender=sender,
            recipients=recipients,
            cc=cc,
            bcc=bcc,
            body=text_body,
            charset=charset
        )

        reports = []

        if attachments is not None:
            for attachment in attachments:
                try:
                    uuid = str(uuid4())
                    if attachment.get('mimetype') == MIME_TYPES.HTML:
                        reports.append({
                            'id': uuid,
                            'type': 'html',
                            'html': attachment.get('file')
                        })
                    else:
                        msg.attach(
                            filename=attachment.get('filename'),
                            content_type='{}; name="{}"'.format(attachment.get('mimetype'),
                                                                attachment.get('filename')),
                            data=b64decode(attachment.get('file')),
                            disposition='attachment',
                            headers={
                                'Content-ID': '<{}>'.format(uuid),
                                'X-Attachment-Id': uuid
                            }.items()
                        )

                        reports.append({
                            'id': uuid,
                            'type': 'image',
                            'filename': attachment.get('filename'),
                            'width': attachment.get('width')
                        })

                        msg.body += '\n[image: {}]'.format(attachment.get('filename'))
                except Exception as e:
                    logger.error('Failed to generate attachment.')
                    logger.exception(e)

        msg.body = render_template(
            txt_template,
            text_body=text_body,
            reports=reports
        )

        msg.html = render_template(
            html_template,
            html_body=html_body.replace('\r', '').replace('\n', '<br>'),
            reports=reports
        )

        return app.mail.send(msg)
    except Exception as e:
        logger.error('Failed to send report email. Error: {}'.format(str(e)))
        logger.exception(e)
    finally:
        unlock(lock_id, remove=True)
