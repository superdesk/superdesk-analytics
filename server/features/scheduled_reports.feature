Feature: Scheduled Reports
    @auth
    @notification
    Scenario: Can create, update and delete scheduled reports with websocket notifications
        Given we have sessions "/sessions"
        When we post to "/saved_reports" with success
        """
        {
            "name": "last week",
            "report": "source_category_report",
            "params": {"title": "testing last week"},
            "is_global": true
        }
        """
        When we reset notifications
        And we post to "/scheduled_reports" with success
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
        Then we get existing resource
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
        And we get notifications
        """
        [{
            "event": "scheduled_reports:update",
            "extra": {
                "operation": "create",
                "schedule_id": "#scheduled_reports._id#"
            }
        }]
        """
        When we reset notifications
        And we patch "/scheduled_reports/#scheduled_reports._id#"
        """
        {"description": "Updated description"}
        """
        Then we get OK response
        And we get existing resource
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
            "mimetype": "image/jpeg",
            "description": "Updated description"
        }
        """
        And we get notifications
        """
        [{
            "event": "scheduled_reports:update",
            "extra": {
                "operation": "update",
                "schedule_id": "#scheduled_reports._id#"
            }
        }]
        """
        When we reset notifications
        And we delete "/scheduled_reports/#scheduled_reports._id#"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "scheduled_reports:update",
            "extra": {
                "operation": "delete",
                "schedule_id": "#scheduled_reports._id#"
            }
        }]
        """

    @auth
    Scenario: Schedules must be attached to a global saved report
        When we post to "/saved_reports" with success
        """
        [{
            "_id": "5b7f566a5f627dc2b6ff9bd6",
            "name": "non global report",
            "report": "source_category_report",
            "params": {"title": "testing last week"},
            "is_global": false
        }, {
            "_id": "5b7f566a5f627dc2b6ff9bd7",
            "name": "global report",
            "report": "source_category_report",
            "params": {"title": "testing last week"},
            "is_global": true
        }]
        """
        When we post to "/scheduled_reports"
        """
        {
            "saved_report": "5b7f566a5f627dc2b6ff9bd6",
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
        Then we get error 400
        """
        {"_message": "A schedule must be attached to a global saved report"}
        """
        When we post to "/scheduled_reports"
        """
        {
            "saved_report": "5b7f566a5f627dc2b6ff9bd7",
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
        Then we get OK response
        When we patch "/scheduled_reports/#scheduled_reports._id#"
        """
        {"saved_report": "5b7f566a5f627dc2b6ff9bd6"}
        """
        Then we get error 400
        """
        {"_issues": {
            "validator exception": "400: A schedule must be attached to a global saved report"
        }}
        """
