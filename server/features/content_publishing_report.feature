Feature: Content Publishing Report
    Background: Initial Setup
        Given the "vocabularies"
        """
        [{
            "_id": "categories",
            "items": [
                {"name": "Advisories", "qcode": "a", "is_active": true},
                {"name": "National", "qcode": "b", "is_active": true},
                {"name": "Domestic Sports", "qcode": "c", "is_active": true}
            ]
        }, {
            "_id": "genre",
            "items": []
        }, {
            "_id": "urgency",
            "items": [
                {"name": 1, "qcode": 1, "is_active": true},
                {"name": 2, "qcode": 2, "is_active": true},
                {"name": 3, "qcode": 3, "is_active": true},
                {"name": 4, "qcode": 4, "is_active": true},
                {"name": 5, "qcode": 5, "is_active": true}
            ]
        }]
        """
        Given "archived"
        """
        [
            {
                "_id": "a1-1", "_type": "archived",
                "anpa_category": [{"qcode": "a"}], "urgency": 1
            },
            {
                "_id": "a3-1", "_type": "archived",
                "anpa_category": [{"qcode": "a"}], "urgency": 3
            },
            {
                "_id": "b1-1", "_type": "archived",
                "anpa_category": [{"qcode": "b"}], "urgency": 1
            },
            {
                "_id": "b3-1", "_type": "archived",
                "anpa_category": [{"qcode": "b"}], "urgency": 3
            },
            {
                "_id": "b3-2", "_type": "archived",
                "anpa_category": [{"qcode": "b"}], "urgency": 3
            },
            {
                "_id": "c1-1", "_type": "archived",
                "anpa_category": [{"qcode": "c"}], "urgency": 1
            },
            {
                "_id": "c1-2", "_type": "archived",
                "anpa_category": [{"qcode": "c"}], "urgency": 1
            },
            {
                "_id": "c3-1", "_type": "archived",
                "anpa_category": [{"qcode": "c"}], "urgency": 3
            },
            {
                "_id": "c5-1", "_type": "archived",
                "anpa_category": [{"qcode": "c"}], "urgency": 5
            }
        ]
        """

    @auth
    Scenario: Generate single source aggregations for Content Published
        When we get "/content_publishing_report?params={"min": 1}&aggs={"group": {"field": "anpa_category.qcode"}}"
        Then we get list with 1 items
        """
        {"_items": [{
            "groups": {"a": 2, "b": 3, "c": 4}
        }]}
        """

    @auth
    Scenario: Generate stacked source aggregations for Content Published
        When we get "/content_publishing_report?params={"min": 1}&aggs={"group": {"field": "anpa_category.qcode"}, "subgroup": {"field": "urgency"}}"
        Then we get list with 1 items
        """
        {"_items": [{
            "groups": {
                "a": {"1": 1, "3": 1},
                "b": {"1": 1, "3": 2},
                "c": {"1": 2, "3": 1, "5": 1}
            },
            "subgroups": {"1": 4, "3": 4, "5": 1}
        }]}
        """

    @auth
    Scenario: Generate single source highcharts config for Content Published
        When we get "/content_publishing_report?params={"min": 1}&aggs={"group": {"field": "anpa_category.qcode"}}&return_type=highcharts_config"
        Then we get list with 1 items
        """
        {"_items": [{
            "groups": {"a": 2, "b": 3, "c": 4},
            "highcharts": [{
                "id": "content_publishing",
                "type": "bar",
                "chart": {
                    "type": "bar",
                    "zoomType": "y"
                },
                "title": {"text": "Published Stories per Category"},
                "subtitle": {"text": null},
                "xAxis": {
                    "title": {"text": "Category"},
                    "categories": ["Domestic Sports", "National", "Advisories"]
                },
                "yAxis": {
                    "title": {"text": "Published Stories"},
                    "stackLabels": {"enabled": false},
                    "allowDecimals": false
                },
                "series": [{
                    "name": "Published Stories",
                    "data": [4, 3, 2]
                }]
            }]
        }]}
        """

    @auth
    Scenario: Generate stacked source highcharts config for Content Published
        When we get "/content_publishing_report?params={"min": 1}&aggs={"group": {"field": "anpa_category.qcode"}, "subgroup": {"field": "urgency"}}&return_type=highcharts_config"
        Then we get list with 1 items
        """
        {"_items": [{
            "groups": {
                "a": {"1": 1, "3": 1},
                "b": {"1": 1, "3": 2},
                "c": {"1": 2, "3": 1, "5": 1}
            },
            "subgroups": {"1": 4, "3": 4, "5": 1},
            "highcharts": [{
                "id": "content_publishing",
                "type": "bar",
                "chart": {
                    "type": "bar",
                    "zoomType": "y"
                },
                "title": {"text": "Published Stories per Category with Urgency breakdown"},
                "subtitle": {"text": null},
                "xAxis": {
                    "title": {"text": "Category"},
                    "categories": ["Domestic Sports", "National", "Advisories"]
                },
                "yAxis": {
                    "title": {"text": "Published Stories"},
                    "stackLabels": {"enabled": true},
                    "allowDecimals": false
                },
                "series": [
                    {"name": "1", "data": [2, 1, 1]},
                    {"name": "3", "data": [1, 2, 1]},
                    {"name": "5", "data": [1, 0, 0]}
                ]
            }]
        }]}
        """

    @auth
    Scenario: Generate sorted stacked source highcharts config for Content Published
        When we get "/content_publishing_report?params={"chart": {"sort_order": "asc"}}&aggs={"group": {"field": "anpa_category.qcode"}, "subgroup": {"field": "urgency"}}&return_type=highcharts_config"
        Then we get list with 1 items
        """
        {"_items": [{
            "highcharts": [{
                "xAxis": {
                    "title": {"text": "Category"},
                    "categories": ["National", "Advisories", "Domestic Sports"]
                },
                "series": [
                    {"name": "1", "data": [1, 1, 2]},
                    {"name": "3", "data": [1, 2, 1]},
                    {"name": "5", "data": [0, 0, 1]}
                ]
            }]
        }]}
        """
        When we get "/content_publishing_report?params={"chart": {"sort_order": "desc"}}&aggs={"group": {"field": "anpa_category.qcode"}, "subgroup": {"field": "urgency"}}&return_type=highcharts_config"
        Then we get list with 1 items
        """
        {"_items": [{
            "highcharts": [{
                "xAxis": {
                    "title": {"text": "Category"},
                    "categories": ["Advisories", "Domestic Sports", "National"]
                },
                "series": [
                    {"name": "1", "data": [2, 1, 1]},
                    {"name": "3", "data": [1, 2, 1]},
                    {"name": "5", "data": [1, 0, 0]}
                ]
            }]
        }]}
        """
