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
        When we get "/analytics_test_report"
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
        When we get "/analytics_test_report"
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
        When we get "/analytics_test_report?include_items=0"
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
        When we get "/analytics_test_report?include_items=1"
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
        When we get "/analytics_test_report?include_items=1&source={"size": 0}"
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
        When we get "/analytics_test_report"
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
        When we get "/analytics_test_report?repo=archived,published"
        Then we get list with 1 items
        """
        {"_items": [{"category": [], "source": []}]}
        """
        When we get "/analytics_test_report?repo=archive"
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
