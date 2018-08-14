Feature: Source Category Report
    Background: Initial Setup
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
                "anpa_category": [{"qcode": "A"}, {"qcode": "T"}]
            },
            {
                "_id": "archive2", "_type": "archived", "source": "AAP",
                "task": {"stage": "5b501a6f1d41c84c0bfced4c", "desk": "5b501a501d41c84c0bfced4a"},
                "anpa_category": [{"qcode": "A"}, {"qcode": "T"}]
            }
        ]
        """

    @auth
    Scenario: Generate list of Source and Categories
        When we get "/source_category_report?source={"query": {"filtered": {}}}"
        Then we get list with 1 items
        """
        {
            "_items": [{
                "categories": {"National": 1, "Advisories": 0},
                "sources": {"AAP": {"National": 1}}
            }]
        }
        """

    @auth
    Scenario: Generate csv data of Source and Categories
        When we get "/source_category_report?params={"min": 1}&return_type=text/csv"
        Then we get list with 1 items
        """
        {
            "_items": [{
                "categories": {"Advisories": 0, "National": 1},
                "sources": {"AAP": {"National": 1}},
                "csv": [
                    ["Source", "National"],
                    ["AAP", 1]
                ]
            }]
        }
        """

    @auth
    Scenario: Use params to control data
        When we get "/source_category_report?params={"min": 1}&return_type=text/csv"
        Then we get list with 1 items
        """
        {
            "_items": [{
                "categories": {"National": 1, "Advisories": 0},
                "sources": {"AAP": {"National": 1}},
                "csv": [
                    ["Source", "National"],
                    ["AAP", 1]
                ]
            }]
        }
        """
        When we get "/source_category_report?params={"min": 0}&return_type=text/csv"
        Then we get list with 1 items
        """
        {
            "_items": [{
                "categories": {"National": 1, "Advisories": 0},
                "sources": {"AAP": {"National": 1}},
                "csv": [
                    ["Source", "National", "Advisories"],
                    ["AAP", 1, 0]
                ]
            }]
        }
        """
        When we get "/source_category_report?params={"min": 0, "max": 0}&return_type=text/csv"
        Then we get list with 1 items
        """
        {
            "_items": [{
                "categories": {"National": 1, "Advisories": 0},
                "sources": {"AAP": {"National": 1}},
                "csv": [["Source"]]
            }]
        }
        """
        When we get "/source_category_report?params={"min": 0, "sort_order": "asc"}&return_type=text/csv"
        Then we get list with 1 items
        """
        {
            "_items": [{
                "categories": {"National": 1, "Advisories": 0},
                "sources": {"AAP": {"National": 1}},
                "csv": [
                    ["Source", "Advisories", "National"],
                    ["AAP", 0, 1]
                ]
            }]
        }
        """
        When we get "/source_category_report?params={"min": 0, "sort_order": "desc"}&return_type=text/csv"
        Then we get list with 1 items
        """
        {
            "_items": [{
                "categories": {"National": 1, "Advisories": 0},
                "sources": {"AAP": {"National": 1}},
                "csv": [
                    ["Source", "National", "Advisories"],
                    ["AAP", 1, 0]
                ]
            }]
        }
        """
