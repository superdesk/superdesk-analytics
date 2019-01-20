Feature: Base Analytics Report Service

    @auth
    Scenario: Runs query and returns the aggregation results
        Given "archived"
        """
        [
            {
                "_id": "archive1", "_type": "archived", "source": "AAP",
                "task": {"stage": "5b501a511d41c84c0bfced4b", "desk": "5b501a501d41c84c0bfced4a"},
                "anpa_category": [{"qcode": "A"}, {"qcode": "T"}]
            },
            {
                "_id": "archive2", "_type": "archived", "source": "AAP",
                "task": {"stage": "5b501a6f1d41c84c0bfced4c", "desk": "5b501a501d41c84c0bfced4a"},
                "anpa_category": [{"qcode": "A"}]
            }
        ]
        """
        When we get "/analytics_test_report?source={"query": {"filtered": {}}}"
        Then we get list with 1 items
        """
        {
            "_items": [{
                "category": [
                    {"key": "A", "doc_count": 2},
                    {"key": "T", "doc_count": 1}
                ],
                "source": [
                    {"key": "AAP", "doc_count": 2}
                ]
            }]
        }
        """

    @auth
    Scenario: Include stories in response
        Given "archived"
        """
        [
            {
                "_id": "archive1", "_type": "archived", "source": "AAP",
                "task": {"stage": "5b501a511d41c84c0bfced4b", "desk": "5b501a501d41c84c0bfced4a"},
                "anpa_category": [{"qcode": "A"}, {"qcode": "T"}]
            },
            {
                "_id": "archive2", "_type": "archived", "source": "AAP",
                "task": {"stage": "5b501a6f1d41c84c0bfced4c", "desk": "5b501a501d41c84c0bfced4a"},
                "anpa_category": [{"qcode": "A"}]
            }
        ]
        """
        When we get "/analytics_test_report?source={"query": {"filtered": {}}}"
        Then we get list with 1 items
        """
        {
            "_items": [{
                "category": [
                    {"key": "A", "doc_count": 2},
                    {"key": "T", "doc_count": 1}
                ],
                "source": [
                    {"key": "AAP", "doc_count": 2}
                ],
                "_items": "__no_value__"
            }]
        }
        """
        When we get "/analytics_test_report?include_items=0&source={"query": {"filtered": {}}}"
        Then we get list with 1 items
        """
        {
            "_items": [{
                "category": [
                    {"key": "A", "doc_count": 2},
                    {"key": "T", "doc_count": 1}
                ],
                "source": [
                    {"key": "AAP", "doc_count": 2}
                ],
                "_items": "__no_value__"
            }]
        }
        """
        When we get "/analytics_test_report?include_items=1&source={"query": {"filtered": {}}}"
        Then we get list with 1 items
        """
        {
            "_items": [{
                "category": [
                    {"key": "A", "doc_count": 2},
                    {"key": "T", "doc_count": 1}
                ],
                "source": [
                    {"key": "AAP", "doc_count": 2}
                ],
                "_items": [
                    {
                        "_id": "archive1", "_type": "archived", "source": "AAP",
                        "task": {"stage": "5b501a511d41c84c0bfced4b", "desk": "5b501a501d41c84c0bfced4a"},
                        "anpa_category": [{"qcode": "A"}, {"qcode": "T"}]
                    },
                    {
                        "_id": "archive2", "_type": "archived", "source": "AAP",
                        "task": {"stage": "5b501a6f1d41c84c0bfced4c", "desk": "5b501a501d41c84c0bfced4a"},
                        "anpa_category": [{"qcode": "A"}]
                    }
                ]
            }]
        }
        """
        When we get "/analytics_test_report?include_items=1&source={"query": {"filtered": {}}, "size": 0}"
        Then we get list with 1 items
        """
        {
            "_items": [{
                "category": [
                    {"key": "A", "doc_count": 2},
                    {"key": "T", "doc_count": 1}
                ],
                "source": [
                    {"key": "AAP", "doc_count": 2}
                ],
                "_items": []
            }]
        }
        """

    @auth
    Scenario: Excludes stages with global read off
        Given the "vocabularies"
        """
        [{"_id": "categories", "items": [
            {"name": "National", "qcode": "A", "is_active": true},
            {"name": "Domestic Sports", "qcode": "T", "is_active": false},
            {"name": "Advisories", "qcode": "V", "is_active": true}
        ]}]
        """
        And "desks"
        """
        [
            {"_id": "5b501a501d41c84c0bfced4a", "name": "Sports Desk", "members": [{"user": "#CONTEXT_USER_ID#"}]}
        ]
        """
        And "stages"
        """
        [
            {
                "_id": "5b501a511d41c84c0bfced4b", "desk": "5b501a501d41c84c0bfced4a",
                "name": "stage1", "is_visible": true
            },
            {
                "_id": "5b501a6f1d41c84c0bfced4c", "desk": "5b501a501d41c84c0bfced4a",
                "name": "stage2", "is_visible": false
            }
        ]
        """
        Given "archived"
        """
        [
            {
                "_id": "archive1", "_type": "archived", "source": "AAP",
                "task": {"stage": "5b501a511d41c84c0bfced4b", "desk": "5b501a501d41c84c0bfced4a"},
                "anpa_category": [{"qcode": "A"}]
            },
            {
                "_id": "archive2", "_type": "archived", "source": "AAP",
                "task": {"stage": "5b501a6f1d41c84c0bfced4c", "desk": "5b501a501d41c84c0bfced4a"},
                "anpa_category": [{"qcode": "A"}]
            }
        ]
        """
        When we get "/analytics_test_report?source={"query": {"filtered": {}}}"
        Then we get list with 1 items
        """
        {
            "_items": [{
                "category": [{"key": "A", "doc_count": 1}],
                "source": [{"key": "AAP", "doc_count": 1}]
            }]
        }
        """

    @auth
    Scenario: Restrict repos in query
        Given "desks"
        """
        [
            {"_id": "5b501a501d41c84c0bfced4a", "name": "Sports Desk", "members": [{"user": "#CONTEXT_USER_ID#"}]}
        ]
        """
        And "stages"
        """
        [
            {
                "_id": "5b501a511d41c84c0bfced4b", "desk": "5b501a501d41c84c0bfced4a",
                "name": "stage1", "is_visible": true
            },
            {
                "_id": "5b501a6f1d41c84c0bfced4c", "desk": "5b501a501d41c84c0bfced4a",
                "name": "stage2", "is_visible": false
            }
        ]
        """
        And "archive"
        """
        [
            {
                "_id": "archive1", "source": "AAP", "state": "draft",
                "task": {
                    "stage": "5b501a511d41c84c0bfced4b",
                    "desk": "5b501a501d41c84c0bfced4a",
                    "user": "#CONTEXT_USER_ID#"
                },
                "anpa_category": [{"qcode": "A"}, {"qcode": "T"}]
            },
            {
                "_id": "archive2", "source": "AAP", "state": "draft",
                "task": {
                    "stage": "5b501a6f1d41c84c0bfced4c",
                    "desk": "5b501a501d41c84c0bfced4a",
                    "user": "#CONTEXT_USER_ID#"
                },
                "anpa_category": [{"qcode": "A"}]
            }
        ]
        """
        When we get "/analytics_test_report?repo=archived,published&source={"query": {"filtered": {}}}"
        Then we get list with 1 items
        """
        {"_items": [{"category": [], "source": []}]}
        """
        When we get "/analytics_test_report?repo=archive&source={"query": {"filtered": {}}}"
        Then we get list with 1 items
        """
        {
            "_items": [{
                "category": [
                    {"key": "A", "doc_count": 1},
                    {"key": "T", "doc_count": 1}
                ],
                "source": [
                    {"key": "AAP", "doc_count": 1}
                ]
            }]
        }
        """

    @auth
    Scenario: Can provide params instead of elasticsearch query
        Given "archived"
        """
        [
            {
                "_id": "archive1", "_type": "archived", "source": "AAP",
                "task": {"stage": "5b501a511d41c84c0bfced4b", "desk": "5b501a501d41c84c0bfced4a"},
                "anpa_category": [{"qcode": "A", "name": "Advisories"}, {"qcode": "T", "name": "Transport"}]
            },
            {
                "_id": "archive2", "_type": "archived", "source": "AAP",
                "task": {"stage": "5b501a6f1d41c84c0bfced4c", "desk": "5b501a501d41c84c0bfced4a"},
                "anpa_category": [{"qcode": "A", "name": "Advisories"}]
            }
        ]
        """
        When we get "/analytics_test_report?params={"must": {"categories": {"T": true}}}"
        Then we get list with 1 items
        """
        {
            "_items": [{
                "category": [
                    {"key": "A", "doc_count": 1},
                    {"key": "T", "doc_count": 1}
                ],
                "source": [
                    {"key": "AAP", "doc_count": 1}
                ]
            }]
        }
        """

    @auth @wip
    Scenario: Paginate response
        Given "archived"
        """
        [
            {
                "_id": "archive1", "_type": "archived", "source": "AAP", "slugline": "1",
                "task": {"stage": "5b501a511d41c84c0bfced4b", "desk": "5b501a501d41c84c0bfced4a"},
                "anpa_category": [{"qcode": "A", "name": "Advisories"}, {"qcode": "T", "name": "Transport"}]
            },
            {
                "_id": "archive2", "_type": "archived", "source": "AAP", "slugline": "2",
                "task": {"stage": "5b501a6f1d41c84c0bfced4c", "desk": "5b501a501d41c84c0bfced4a"},
                "anpa_category": [{"qcode": "A", "name": "Advisories"}]
            },
            {
                "_id": "archive3", "_type": "archived", "source": "AAP", "slugline": "3",
                "task": {"stage": "5b501a511d41c84c0bfced4b", "desk": "5b501a501d41c84c0bfced4a"},
                "anpa_category": [{"qcode": "A", "name": "Advisories"}, {"qcode": "T", "name": "Transport"}]
            },
            {
                "_id": "archive4", "_type": "archived", "source": "AAP", "slugline": "4",
                "task": {"stage": "5b501a6f1d41c84c0bfced4c", "desk": "5b501a501d41c84c0bfced4a"},
                "anpa_category": [{"qcode": "A", "name": "Advisories"}]
            },
            {
                "_id": "archive5", "_type": "archived", "source": "AAP", "slugline": "5",
                "task": {"stage": "5b501a511d41c84c0bfced4b", "desk": "5b501a501d41c84c0bfced4a"},
                "anpa_category": [{"qcode": "A", "name": "Advisories"}, {"qcode": "T", "name": "Transport"}]
            },
            {
                "_id": "archive6", "_type": "archived", "source": "AAP", "slugline": "6",
                "task": {"stage": "5b501a6f1d41c84c0bfced4c", "desk": "5b501a501d41c84c0bfced4a"},
                "anpa_category": [{"qcode": "A", "name": "Advisories"}]
            }
        ]
        """
        When we get "/analytics_test_report?params={"must": {}, "size": 2, "page": 1, "sort": [{"slugline": "asc"}]}&aggs=0&max_results=2"
        Then we get list with 6 items
        """
        {
            "_items": [{"_id": "archive1"}, {"_id": "archive2"}],
            "_meta": {"total": 6, "page": 1, "max_results": 2}
        }
        """
        When we get "/analytics_test_report?params={"must": {}, "size": 2, "page": 2, "sort": [{"slugline": "asc"}]}&aggs=0&max_results=2&page=2"
        Then we get list with 6 items
        """
        {
            "_items": [{"_id": "archive3"}, {"_id": "archive4"}],
            "_meta": {"total": 6, "page": 2, "max_results": 2}
        }
        """
        When we get "/analytics_test_report?params={"must": {}, "size": 2, "page": 3, "sort": [{"slugline": "asc"}]}&aggs=0&max_results=2&page=3"
        Then we get list with 6 items
        """
        {
            "_items": [{"_id": "archive5"}, {"_id": "archive6"}],
            "_meta": {"total": 6, "page": 3, "max_results": 2}
        }
        """
