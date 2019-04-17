Feature: Report Configs
    @auth
    Scenario: Returns all registered defaults when collection is empty
        Given empty "report_configs"
        When we get "/report_configs"
        Then we get list with 6 items
        """
        {"_items": [{
            "_id": "content_publishing_report",
            "chart_types": {
                "bar": {"enabled": true},
                "column": {"enabled": true},
                "table": {"enabled": true},
                "area": {"enabled": false},
                "line": {"enabled": false},
                "pie": {"enabled": false},
                "scatter": {"enabled": false},
                "spline": {"enabled": false}
            },
            "default_params": {},
            "date_filters": {
                "range": {"enabled": true},
                "day": {"enabled": true},
                "relative_hours": {
                    "enabled": true,
                    "max": 72
                },
                "relative_days": {
                    "enabled": true,
                    "max": 31
                },
                "yesterday": {"enabled": true},
                "today": {"enabled": true},
                "relative_weeks": {
                    "enabled": true,
                    "max": 52
                },
                "last_week": {"enabled": true},
                "this_week": {"enabled": true},
                "relative_months": {
                    "enabled": true,
                    "max": 12
                },
                "this_month": {"enabled": true},
                "last_month": {"enabled": true},
                "last_year": {"enabled": true},
                "this_year": {"enabled": true}
            }
        }, {
            "_id": "desk_activity_report"
        }, {
            "_id": "planning_usage_report"
        }, {
            "_id": "production_time_report"
        }, {
            "_id": "publishing_performance_report"
        }, {
            "_id": "user_activity_report"
        }]}
        """

    @auth
    Scenario: Returns merged config
        Given "report_configs"
        """
        [{
            "_id": "content_publishing_report",
            "chart_types": {
                "bar": {"enabled": false},
                "column": {"enabled": false}
            },
            "default_params": {
                "chart": {"type": "table"}
            },
            "date_filters": {
                "range": {"enabled": false}
            }
        }]
        """
        When we get "/report_configs"
        Then we get "content_publishing_report" config
        """
        {
            "_id": "content_publishing_report",
            "chart_types": {
                "bar": {"enabled": false},
                "column": {"enabled": false},
                "table": {"enabled": true},
                "area": {"enabled": false},
                "line": {"enabled": false},
                "pie": {"enabled": false},
                "scatter": {"enabled": false},
                "spline": {"enabled": false}
            },
            "default_params": {
                "chart": {"type": "table"}
            },
            "date_filters": {
                "range": {"enabled": false},
                "day": {"enabled": true},
                "relative_hours": {
                    "enabled": true,
                    "max": 72
                },
                "relative_days": {
                    "enabled": true,
                    "max": 31
                },
                "yesterday": {"enabled": true},
                "today": {"enabled": true},
                "relative_weeks": {
                    "enabled": true,
                    "max": 52
                },
                "last_week": {"enabled": true},
                "this_week": {"enabled": true},
                "relative_months": {
                    "enabled": true,
                    "max": 12
                },
                "this_month": {"enabled": true},
                "last_month": {"enabled": true},
                "last_year": {"enabled": true},
                "this_year": {"enabled": true}
            }
        }
        """

    @auth
    Scenario: Omits unsupported config attributes
        Given "report_configs"
        """
        [{
            "_id": "user_activity_report",
            "chart_types": {
                "bar": {"enabled": true},
                "column": {"enabled": false}
            },
            "date_filters": {
                "range": {"enabled": false},
                "relative_hours": {"enabled": true}
            }
        }]
        """
        When we get "/report_configs"
        Then we get "user_activity_report" config
        """
        {
            "_id": "user_activity_report",
            "chart_types": {
                "table": {"enabled": true}
            },
            "default_params": {
                "chart": {"type": "table"}
            },
            "date_filters": {
                "day": {"enabled": true}
            }
        }
        """
