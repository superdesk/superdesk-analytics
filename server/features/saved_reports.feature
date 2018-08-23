Feature: Saved Reports

    @auth
    @notification
    Scenario: Can create, update and delete reports with websocket notifications
        Given we have sessions "/sessions"
        When we post to "/saved_reports" with success
        """
        {
            "name": "test report",
            "report": "source_category_report",
            "params": {"title": "testing saved reports"}
        }
        """
        Then we get existing resource
        """
        {
            "name": "test report",
            "report": "source_category_report",
            "params": {"title": "testing saved reports"},
            "is_global": false,
            "user": "#CONTEXT_USER_ID#"
        }
        """
        And we get notifications
        """
        [{
            "event": "savedreports:update",
            "extra": {
                "report_type": "source_category_report",
                "operation": "create",
                "report_id": "#saved_reports._id#",
                "user_id": "#CONTEXT_USER_ID#",
                "session_id": "#SESSION_ID#"
            }
        }]
        """
        When we reset notifications
        And we patch "/saved_reports/#saved_reports._id#"
        """
        {
            "params": {
                "title": "Testing update",
                "description": "Of the reports"
            }
        }
        """
        Then we get OK response
        And we get existing resource
        """
        {
            "name": "test report",
            "report": "source_category_report",
            "params": {
                "title": "Testing update",
                "description": "Of the reports"
            },
            "is_global": false,
            "user": "#CONTEXT_USER_ID#"
        }
        """
        And we get notifications
        """
        [{
            "event": "savedreports:update",
            "extra": {
                "report_type": "source_category_report",
                "operation": "update",
                "report_id": "#saved_reports._id#",
                "user_id": "#CONTEXT_USER_ID#",
                "session_id": "#SESSION_ID#"
            }
        }]
        """
        When we reset notifications
        And we delete "/saved_reports/#saved_reports._id#"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "savedreports:update",
            "extra": {
                "report_type": "source_category_report",
                "operation": "delete",
                "report_id": "#saved_reports._id#",
                "user_id": "#CONTEXT_USER_ID#",
                "session_id": "#SESSION_ID#"
            }
        }]
        """

    @auth
    Scenario: Only allows reports for known types
        When we post to "/saved_reports"
        """
        {"name": "test", "report": "activity_report", "params": {"title": "test"}}
        """
        Then we get OK response
        When we post to "/saved_reports"
        """
        {"name": "test", "report": "content_quota_report", "params": {"title": "test"}}
        """
        Then we get OK response
        When we post to "/saved_reports"
        """
        {"name": "test", "report": "processed_items_report", "params": {"title": "test"}}
        """
        Then we get OK response
        When we post to "/saved_reports"
        """
        {"name": "test", "report": "source_category_report", "params": {"title": "test"}}
        """
        Then we get OK response
        When we post to "/saved_reports"
        """
        {"name": "test", "report": "track_activity_report", "params": {"title": "test"}}
        """
        Then we get OK response
        When we post to "/saved_reports"
        """
        {"name": "test", "report": "test_report", "params": {"title": "test"}}
        """
        Then we get error 400
        """
        {"_issues": {"report": "unallowed value test_report"}, "_status": "ERR"}
        """
        When we get "/saved_reports?where={"report":"source_category_report"}"
        Then we get OK response
        When we get "/saved_reports?where={"report":"test_report"}"
        Then we get error 400
        """
        {"_status": "ERR", "_message": "Unknown report type: test_report"}
        """

    @auth
    Scenario: Permission required to create global report
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {
            "user_type": "user",
            "privileges": {
                "saved_reports": 1,
                "global_saved_reports": 0,
                "users": 1
            }
        }
        """
        Then we get OK response
        When we post to "/saved_reports"
        """
        {
            "name": "test report",
            "report": "source_category_report",
            "params": {"title": "testing saved reports"},
            "is_global": true
        }
        """
        Then we get error 403
        """
        {"_status": "ERR", "_message": "Unauthorized to create global report."}
        """
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"global_saved_reports": 1}}
        """
        Then we get OK response
        When we post to "/saved_reports"
        """
        {
            "name": "test report",
            "report": "source_category_report",
            "params": {"title": "testing saved reports"},
            "is_global": true
        }
        """
        Then we get OK response

    @auth
    Scenario: User cannot modify other users report
        When we post to "/saved_reports" with success
        """
        {
            "name": "test report",
            "report": "source_category_report",
            "params": {"title": "testing saved reports"},
            "is_global": false
        }
        """
        Then we store "REPORT1" with value "#saved_reports._id#" to context
        When we post to "/saved_reports" with success
        """
        {
            "name": "global report",
            "report": "source_category_report",
            "params": {"title": "global saved report"},
            "is_global": true
        }
        """
        Then we store "REPORT2" with value "#saved_reports._id#" to context
        When we patch "/saved_reports/#REPORT1#"
        """
        {"description": "updated test report"}
        """
        Then we get OK response
        When we patch "/saved_reports/#REPORT2#"
        """
        {"description": "updated global report"}
        """
        Then we get OK response
        When we login as user "foo" with password "bar" and user type "user"
        """
        {
            "user_type": "user",
            "email": "foo.bar@foobar.org",
            "privileges": {
                "saved_reports": 1,
                "global_saved_reports": 0,
                "users": 1
            }
        }
        """
        When we patch "/saved_reports/#REPORT1#"
        """
        {"description": "updated 2 test report"}
        """
        Then we get error 400
        """
        {
            "_issues": {
               "validator exception": "403: Unauthorized to modify other user's local report."
            },
            "_status": "ERR"
        }
        """
        When we patch "/saved_reports/#REPORT2#"
        """
        {"description": "updated 2 test report"}
        """
        Then we get error 400
        """
        {
            "_issues": {
               "validator exception": "403: Unauthorized to modify global report."
            },
            "_status": "ERR"
        }
        """
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"global_saved_reports": 1}}
        """
        Then we get OK response
        When we patch "/saved_reports/#REPORT1#"
        """
        {"description": "updated 2 test report"}
        """
        Then we get error 400
        """
        {
            "_issues": {
               "validator exception": "403: Unauthorized to modify other user's local report."
            },
            "_status": "ERR"
        }
        """
        When we patch "/saved_reports/#REPORT2#"
        """
        {"description": "updated 2 test report"}
        """
        Then we get OK response

    @auth
    Scenario: Only fetches saved reports for the current user
        Given "users"
        """
        [{
            "username": "user1",
            "password": "password",
            "email": "user1@domain.com",
            "user_type": "administrator"
        }, {
            "username": "user2",
            "password": "password",
            "email": "user2@domain.com",
            "user_type": "administrator"
        }]
        """
        When we login as user "user1" with password "password" and user type "admin"
        When we post to "saved_reports" with success
        """
        [{
            "name": "user1 local source_category",
            "report": "source_category_report",
            "params": {"title": "testing saved reports"},
            "is_global": false
        }, {
            "name": "user1 global source_category",
            "report": "source_category_report",
            "params": {"title": "testing saved reports"},
            "is_global": true
        }, {
            "name": "user1 local activity",
            "report": "activity_report",
            "params": {"title": "testing saved reports"},
            "is_global": false
        }, {
            "name": "user1 global activity",
            "report": "activity_report",
            "params": {"title": "testing saved reports"},
            "is_global": true
        }]
        """
        When we login as user "user2" with password "password" and user type "admin"
        When we post to "saved_reports" with success
        """
        [{
            "name": "user2 local source_category",
            "report": "source_category_report",
            "params": {"title": "testing saved reports"},
            "is_global": false
        }, {
            "name": "user2 global source_category",
            "report": "source_category_report",
            "params": {"title": "testing saved reports"},
            "is_global": true
        }, {
            "name": "user2 local activity",
            "report": "activity_report",
            "params": {"title": "testing saved reports"},
            "is_global": false
        }, {
            "name": "user2 global activity",
            "report": "activity_report",
            "params": {"title": "testing saved reports"},
            "is_global": true
        }]
        """
        When we login as user "user1" with password "password" and user type "admin"
        When we get "/saved_reports"
        Then we get list with 6 items
        """
        {"_items": [
            {"name": "user1 local source_category", "is_global": false},
            {"name": "user1 global source_category", "is_global": true},
            {"name": "user1 local activity", "is_global": false},
            {"name": "user1 global activity", "is_global": true},
            {"name": "user2 global source_category", "is_global": true},
            {"name": "user2 global activity", "is_global": true}
         ]}
        """
        When we login as user "user2" with password "password" and user type "admin"
        When we get "/saved_reports"
        Then we get list with 6 items
        """
        {"_items": [
            {"name": "user2 local source_category", "is_global": false},
            {"name": "user2 global source_category", "is_global": true},
            {"name": "user2 local activity", "is_global": false},
            {"name": "user2 global activity", "is_global": true},
            {"name": "user1 global source_category", "is_global": true},
            {"name": "user1 global activity", "is_global": true}
         ]}
        """
        When we login as user "user1" with password "password" and user type "admin"
        When we get "/saved_reports?where={"report":"source_category_report"}"
        Then we get list with 3 items
        """
        {"_items": [
            {"name": "user1 local source_category", "is_global": false},
            {"name": "user1 global source_category", "is_global": true},
            {"name": "user2 global source_category", "is_global": true}
         ]}
        """
        When we login as user "user2" with password "password" and user type "admin"
        When we get "/saved_reports?where={"report":"activity_report"}"
        Then we get list with 3 items
        """
        {"_items": [
            {"name": "user2 local activity", "is_global": false},
            {"name": "user2 global activity", "is_global": true},
            {"name": "user1 global activity", "is_global": true}
         ]}
        """

    @auth
    Scenario: Cannot delete a saved report that has schedules attached
        When we post to "/saved_reports"
        """
        {
            "name": "last week",
            "report": "source_category_report",
            "params": {"title": "testing last week"},
            "is_global": true
        }
        """
        Then we get OK response
        When we delete "/saved_reports/#saved_reports._id#"
        Then we get OK response
        When we post to "/saved_reports"
        """
        {
            "name": "last week",
            "report": "source_category_report",
            "params": {"title": "testing last week"},
            "is_global": true
        }
        """
        Then we get OK response
        When we post to "/scheduled_reports" with success
        """
        {
            "saved_report": "#saved_reports._id#",
            "report_type": "source_category_report",
            "schedule": {"frequency": "hourly"},
            "transmitter": "email",
            "recipients": ["superdesk@localhost.com"],
            "name": "schedule for last week",
            "active": true,
            "extra": {"body": "testing the body"},
            "mimetype": "image/jpeg"
        }
        """
        When we delete "/saved_reports/#saved_reports._id#"
        Then we get error 400
        """
        {"_status": "ERR", "_message": "Cannot delete saved report as schedule(s) are attached"}
        """
        When we delete "/scheduled_reports/#scheduled_reports._id#"
        Then we get OK response
        When we delete "/saved_reports/#saved_reports._id#"
        Then we get OK response

    @auth
    Scenario: Cannot remove global flag if schedules are attached
        When we post to "/saved_reports"
        """
        {
            "name": "last week",
            "report": "source_category_report",
            "params": {"title": "testing last week"},
            "is_global": true
        }
        """
        Then we get OK response
        When we post to "/scheduled_reports" with success
        """
        {
            "saved_report": "#saved_reports._id#",
            "report_type": "source_category_report",
            "schedule": {"frequency": "hourly"},
            "transmitter": "email",
            "recipients": ["superdesk@localhost.com"],
            "name": "schedule for last week",
            "active": true,
            "extra": {"body": "testing the body"},
            "mimetype": "image/jpeg"
        }
        """
        When we patch "/saved_reports/#saved_reports._id#"
        """
        {"is_global": false}
        """
        Then we get error 400
        """
        {"_issues": {
            "validator exception": "400: Cannot remove global flag as schedule(s) are attached"
        }}
        """
