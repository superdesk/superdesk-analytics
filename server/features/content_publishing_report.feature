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
                "type": "highcharts",
                "chart": {"zoomType": "y"},
                "title": {"text": "Published Stories per Category"},
                "xAxis": [{
                    "allowDecimals": false,
                    "type": "category",
                    "title": {"text": "Category"},
                    "categories": ["Domestic Sports", "National", "Advisories"]
                }],
                "yAxis": [{
                    "title": {"text": "Published Stories"},
                    "stackLabels": {"enabled": false},
                    "allowDecimals": false
                }],
                "series": [{
                    "name": "Category",
                    "data": [4, 3, 2],
                    "type": "bar",
                    "xAxis": 0
                }],
                "credits": {"enabled": false},
                "fullHeight": false,
                "time": {"useUTC": true}
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
                "type": "highcharts",
                "chart": {"zoomType": "y"},
                "title": {"text": "Published Stories per Category with Urgency breakdown"},
                "xAxis": [{
                    "allowDecimals": false,
                    "type": "category",
                    "title": {"text": "Category"},
                    "categories": ["Domestic Sports", "National", "Advisories"]
                }],
                "yAxis": [{
                    "title": {"text": "Published Stories"},
                    "stackLabels": {"enabled": true},
                    "allowDecimals": false
                }],
                "series": [{
                    "name": "1",
                    "data": [2, 1, 1],
                    "type": "bar",
                    "stack": 0,
                    "stacking": "normal",
                    "xAxis": 0
                }, {
                    "name": "3",
                    "data": [1, 2, 1],
                    "type": "bar",
                    "stack": 0,
                    "stacking": "normal",
                    "xAxis": 0
                }, {
                    "name": "5",
                    "data": [1, 0, 0],
                    "type": "bar",
                    "stack": 0,
                    "stacking": "normal",
                    "xAxis": 0
                }],
                "credits": {"enabled": false},
                "fullHeight": false,
                "time": {"useUTC": true}
            }]
        }]}
        """

    @auth
    @wip
    Scenario: Generate sorted stacked source highcharts config for Content Published
        When we get "/content_publishing_report?params={"chart": {"sort_order": "asc"}}&aggs={"group": {"field": "anpa_category.qcode"}, "subgroup": {"field": "urgency"}}&return_type=highcharts_config"
        Then we get list with 1 items
        """
        {"_items": [{
            "highcharts": [{
                "xAxis": [{
                    "allowDecimals": false,
                    "type": "category",
                    "title": {"text": "Category"},
                    "categories": ["National", "Advisories", "Domestic Sports"]
                }],
                "series": [{
                    "name": "1",
                    "data": [1, 1, 2],
                    "type": "bar",
                    "stack": 0,
                    "stacking": "normal",
                    "xAxis": 0
                }, {
                    "name": "3",
                    "data": [1, 2, 1],
                    "type": "bar",
                    "stack": 0,
                    "stacking": "normal",
                    "xAxis": 0
                }, {
                    "name": "5",
                    "data": [0, 0, 1],
                    "type": "bar",
                    "stack": 0,
                    "stacking": "normal",
                    "xAxis": 0
                }]
            }]
        }]}
        """
        When we get "/content_publishing_report?params={"chart": {"sort_order": "desc"}}&aggs={"group": {"field": "anpa_category.qcode"}, "subgroup": {"field": "urgency"}}&return_type=highcharts_config"
        Then we get list with 1 items
        """
        {"_items": [{
            "highcharts": [{
                "xAxis": [{
                    "allowDecimals": false,
                    "type": "category",
                    "title": {"text": "Category"},
                    "categories": ["Advisories", "Domestic Sports", "National"]
                }],
                "series": [{
                    "name": "1",
                    "data": [2, 1, 1],
                    "type": "bar",
                    "stack": 0,
                    "stacking": "normal",
                    "xAxis": 0
                }, {
                    "name": "3",
                    "data": [1, 2, 1],
                    "type": "bar",
                    "stack": 0,
                    "stacking": "normal",
                    "xAxis": 0
                }, {
                    "name": "5",
                    "data": [1, 0, 0],
                    "type": "bar",
                    "stack": 0,
                    "stacking": "normal",
                    "xAxis": 0
                }]
            }]
        }]}
        """

    @auth
    Scenario: Displays results with more than 10 entries
        Given the vocab fixture "categories"
        Given "archived"
        """
        [{
            "_id": "a1-1",
            "_type": "archived",
            "anpa_category": [
                {"qcode": "a"}, {"qcode": "b"}, {"qcode": "c"}, {"qcode": "d"},
                {"qcode": "e"}, {"qcode": "f"}, {"qcode": "g"}, {"qcode": "h"},
                {"qcode": "i"}, {"qcode": "j"}, {"qcode": "k"}, {"qcode": "l"},
                {"qcode": "m"}, {"qcode": "n"}, {"qcode": "o"}, {"qcode": "p"},
                {"qcode": "q"}, {"qcode": "r"}, {"qcode": "s"}, {"qcode": "t"},
                {"qcode": "u"}, {"qcode": "v"}, {"qcode": "w"}, {"qcode": "x"},
                {"qcode": "y"}, {"qcode": "z"}
            ]
        }]
        """
        When we get "/content_publishing_report?params={"min": 1}&aggs={"group": {"field": "anpa_category.qcode"}}"
        Then we get list with 1 items
        """
        {"_items": [{
            "groups": {
                "a": 1, "b": 1, "c": 1, "d": 1, "e": 1, "f": 1, "g": 1, "h": 1, "i": 1,
                "j": 1, "k": 1, "l": 1, "m": 1, "n": 1, "o": 1, "p": 1, "q": 1, "r": 1,
                "s": 1, "t": 1, "u": 1, "v": 1, "w": 1, "x": 1, "y": 1, "z": 1
            }
        }]}
        """
