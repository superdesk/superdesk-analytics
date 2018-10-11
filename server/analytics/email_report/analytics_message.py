# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.emails import SuperdeskMessage

import re
import unicodedata

from email import policy
from email.encoders import encode_base64
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart

from flask import current_app
from flask_mail import sanitize_subject, sanitize_address, sanitize_addresses, force_text, \
    formatdate

string_types = str,
text_type = str
message_policy = policy.SMTP


class AnalyticsMessage(SuperdeskMessage):
    def _message(self):
        """Creates email as 'multipart/related' instead of 'multipart/mixed'"""
        ascii_attachments = current_app.extensions['mail'].ascii_attachments
        encoding = self.charset or 'utf-8'

        attachments = self.attachments or []

        if len(attachments) == 0 and not self.html:
            # No html content and zero attachments means plain text
            msg = self._mimetext(self.body)
        elif len(attachments) > 0 and not self.html:
            # No html and at least one attachment means multipart
            msg = MIMEMultipart()
            msg.attach(self._mimetext(self.body))
        else:
            # Anything else
            msg = MIMEMultipart('related')  # This fixes embedded images in the html body
            alternative = MIMEMultipart('alternative')
            alternative.attach(self._mimetext(self.body, 'plain'))
            alternative.attach(self._mimetext(self.html, 'html'))
            msg.attach(alternative)

        if self.subject:
            msg['Subject'] = sanitize_subject(force_text(self.subject), encoding)

        msg['From'] = sanitize_address(self.sender, encoding)
        msg['To'] = ', '.join(list(set(sanitize_addresses(self.recipients, encoding))))

        msg['Date'] = formatdate(self.date, localtime=True)
        # see RFC 5322 section 3.6.4.
        msg['Message-ID'] = self.msgId

        if self.cc:
            msg['Cc'] = ', '.join(list(set(sanitize_addresses(self.cc, encoding))))

        if self.reply_to:
            msg['Reply-To'] = sanitize_address(self.reply_to, encoding)

        if self.extra_headers:
            for k, v in self.extra_headers.items():
                msg[k] = v

        SPACES = re.compile(r'[\s]+', re.UNICODE)
        for attachment in attachments:
            f = MIMEBase(*attachment.content_type.split('/'))
            f.set_payload(attachment.data)
            encode_base64(f)

            filename = attachment.filename
            if filename and ascii_attachments:
                # force filename to ascii
                filename = unicodedata.normalize('NFKD', filename)
                filename = filename.encode('ascii', 'ignore').decode('ascii')
                filename = SPACES.sub(u' ', filename).strip()

            try:
                filename and filename.encode('ascii')
            except UnicodeEncodeError:
                filename = ('UTF8', '', filename)

            f.add_header('Content-Disposition',
                         attachment.disposition,
                         filename=filename)

            for key, value in attachment.headers:
                f.add_header(key, value)

            msg.attach(f)
        if message_policy:
            msg.policy = message_policy

        return msg
