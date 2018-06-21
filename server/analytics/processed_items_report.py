from datetime import timezone, datetime, timedelta

from superdesk import get_resource_service
from superdesk.services import BaseService

from superdesk.resource import Resource


class ProcessedItemsResource(Resource):
    """Processed items schema
    """

    schema = {
        'users': {
            'type': 'list',
            'schema': {
                'type': 'dict',
                'schema': {
                    '_id': Resource.rel('users', required=True),
                    'display_name': {'type': 'string'}
                }
            },
            'required': True
        },
        'time_interval': {
            'type': 'dict',
            'required': True,
            'schema': {
                'count': {'type': 'integer', 'required': True},
                'measure': {'type': 'string', 'required': True, 'allowed': ['days', 'hours']}
            }
        },
        'report': {'type': 'dict', 'readonly': 'true'}
    }

    item_methods = ['GET', 'DELETE']
    resource_methods = ['POST']

    privileges = {'POST': 'processed_items_report', 'DELETE': 'processed_items_report', 'GET': 'processed_items_report'}


class ProcessedItemsService(BaseService):
    def count_items(self, items_list, state, start, end):
        """Returns the number of items which were modified in a given time interval and having a certain state.

        If 'state' has the value None, the total number of items modified in a given time interval is returned.
        :param list items_list: list of items based on the query
        :param string state: item's state
        :param datetime start: starting time of the given interval
        :param datetime end: ending time of the given interval
        :return integer: number of items
        """
        start = start.replace(tzinfo=timezone.utc)
        end = end.replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
        if state:
            items = sum(1 for i in items_list
                        if i['state'] == state and i['_updated'] >= start and
                        i['_updated'] <= end)
        else:
            items = sum(1 for i in items_list
                        if (i['state'] in ['published', 'spiked', 'corrected', 'killed']) and
                        i['_updated'] >= start and i['_updated'] <= end)
        return items

    def search_items_single_user(self, doc, user):
        """Returns a report on processed items by a given user.

        The report will contain the total number of items processed by a given user and
        the number of published,spiked,corrected and killed items by a given user.
        :param dict doc: document used for generating the report
        :return dict: report per user
        """
        query = {
            "task.user": str(user)
        }
        items = list(get_resource_service('archive_versions').get(req=None, lookup=query))
        end_time = datetime.utcnow()
        if doc['time_interval']['measure'] == 'days':
            start_time = end_time - timedelta(days=int(doc['time_interval']['count']))
        else:
            start_time = end_time - timedelta(hours=int(doc['time_interval']['count']))

        total_items_no = self.count_items(items, None, start_time, end_time)
        published_items_no = self.count_items(items, 'published', start_time, end_time)
        spiked_items_no = self.count_items(items, 'spiked', start_time, end_time)
        killed_items_no = self.count_items(items, 'killed', start_time, end_time)
        corrected_items_no = self.count_items(items, 'corrected', start_time, end_time)

        single_user_report = {'total_items': total_items_no,
                              'published_items': published_items_no,
                              'spiked_items': spiked_items_no,
                              'killed_items': killed_items_no,
                              'corrected_items': corrected_items_no}
        return single_user_report

    def search_items(self, doc):
        """Resturns a report on processed items by all users.

        The report will contain all the given users and the number of:published, corrected, spiked
        and killed items processed by each user.
        :param dict doc: document used for generating the report
        :return dict report: report including all the given users
        """
        report = []

        for user in doc['users']:
                user_details = get_resource_service('users').find_one(req=None, _id=user['_id'])
                report.append({
                    'user': {
                        '_id': user_details['_id'],
                        'display_name': user_details['display_name']},
                    'processed_items': self.search_items_single_user(doc, user['_id'])})

        return report

    def create(self, docs):
        for doc in docs:
            doc['report'] = self.search_items(doc)
        docs = super().create(docs)
        return docs
