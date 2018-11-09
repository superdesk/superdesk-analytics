Feature: Planning Usage Report
    @auth
    Scenario: Reports Event creations
        When we post to "/events"
        """
        [{
            "name": "Test Event",
            "dates": {
                "start": "2019-11-21T12:00:00.000Z",
                "end": "2019-11-21T17:00:00.000Z"
            }
        }]
        """
        Then we get OK response
        When we get "/planning_usage_report?params={}"
        Then we get list with 1 items
        """
        {"_items": [{
            "group": {
                "#CONTEXT_USER_ID#": {
                    "events": 1,
                    "planning": 0,
                    "coverages": 0,
                    "assignments": 0
                }
            },
            "subgroup": {
                "events": 1,
                "planning": 0,
                "coverages": 0,
                "assignments": 0
            }
        }]}
        """

    @auth
    Scenario: Reports Planning, Coverage and Assignment creations
        When we post to "/planning"
        """
        [{
            "name": "Test Planning",
            "slugline": "Slugger",
            "planning_date": "2029-11-21T14:00:00.000Z"
        }]
        """
        Then we get OK response
        When we get "/planning_usage_report?params={}"
        Then we get list with 1 items
        """
        {"_items": [{
            "group": {
                "#CONTEXT_USER_ID#": {
                    "events": 0,
                    "planning": 1,
                    "coverages": 0,
                    "assignments": 0
                }
            },
            "subgroup": {
                "events": 0,
                "planning": 1,
                "coverages": 0,
                "assignments": 0
            }
        }]}
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "planning": {
                    "slugline": "Slugger",
                    "g2_content_type": "text"
                }
            }]
        }
        """
        Then we get OK response
        When we get "/planning_usage_report?params={}"
        Then we get list with 1 items
        """
        {"_items": [{
            "group": {
                "#CONTEXT_USER_ID#": {
                    "events": 0,
                    "planning": 1,
                    "coverages": 1,
                    "assignments": 0
                }
            },
            "subgroup": {
                "events": 0,
                "planning": 1,
                "coverages": 1,
                "assignments": 0
            }
        }]}
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "planning": {
                    "slugline": "Slugger",
                    "g2_content_type": "text"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "coverage_provider": {
                        "qcode": "stringer",
                        "name": "Stringer"}
                },
                "workflow_status": "draft"
            }]
        }
        """
        Then we get OK response
        When we get "/planning_usage_report?params={}"
        Then we get list with 1 items
        """
        {"_items": [{
            "group": {
                "#CONTEXT_USER_ID#": {
                    "events": 0,
                    "planning": 1,
                    "coverages": 1,
                    "assignments": 1
                }
            },
            "subgroup": {
                "events": 0,
                "planning": 1,
                "coverages": 1,
                "assignments": 1
            }
        }]}
        """

