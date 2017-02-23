from superdesk import get_resource_service
from superdesk.services import BaseService

from superdesk.metadata.item import metadata_schema
from superdesk.resource import Resource


class ProcessedItemsResource(Resource):
    """Processed items schema
    """

    schema = {
        'user': metadata_schema['original_creator'],
        'start_time': {'type': 'datetime'},
        'end_time': {'type': 'datetime'},
        'report': {'type': 'dict'}
    }

    item_methods = ['GET', 'DELETE']
    resource_methods = ['POST']

    privileges = {'POST': 'processed_items_report', 'DELETE': 'processed_items_report', 'GET': 'processed_items_report'}


class ProcessedItemsService(BaseService):

    def get_items(self, query):
        """Returns the result of the item search by the given query.

        :param dict query: query on users
        :return Cursor: cursor on items list
        """
        return get_resource_service('archive_versions').get(req=None, lookup=query)

    def count_items(self, items_list, state, start, end):
        """Returns the number of items which were modified in a given time interval and having a certain state.

        If 'state' has the value None, the total number of items modified in a given time interval is returned.

        :param list items_list: list of items based on the query
        :param string state: item's state
        :param datetime start: starting time of the given interval
        :param datetime end: ending time of the given interval
        :return integer: number of items
        """
        if state:
            items = sum(1 for i in items_list
                        if i['state'] == state and i['_updated'] >= start and
                        i['_updated'] <= end)
        else:
            items = sum(1 for i in items_list
                        if (i['state'] in ['published', 'spiked', 'corrected', 'killed']) and
                        i['_updated'] >= start and i['_updated'] <= end)
        return items

    def search_items(self, doc):
        """Returns a report on processed items by user.

        The report will contain the total number of items processed by a given user and
        the number of published,spiked,corrected and killed items by a given user.

        :param dict doc: document used for generating the report
        :return dict: report
        """
        query = {
            "task.user": str(doc['user'])
        }
        items = list(self.get_items(query))

        total_items_no = self.count_items(items, None,
                                          doc['start_time'], doc['end_time'])
        published_items_no = self.count_items(items, 'published',
                                              doc['start_time'], doc['end_time'])
        spiked_items_no = self.count_items(items, 'spiked',
                                           doc['start_time'], doc['end_time'])
        killed_items_no = self.count_items(items, 'killed',
                                           doc['start_time'], doc['end_time'])
        corrected_items_no = self.count_items(items, 'corrected',
                                              doc['start_time'], doc['end_time'])

        report = {'total_items': total_items_no,
                  'published_items': published_items_no,
                  'spiked_items': spiked_items_no,
                  'killed_items': killed_items_no,
                  'corrected_items': corrected_items_no}
        return report

    def create(self, docs):
        for doc in docs:
            doc['report'] = self.search_items(doc)
        docs = super().create(docs)
        return docs
