Feature: Desk Transition Stats
    Background: Initial Setup
        Given the "validators"
        """
        [{"_id": "publish_composite", "act": "publish", "type": "composite", "schema":{}},
        {"_id": "publish_picture", "act": "publish", "type": "picture", "schema":{}},
        {"_id": "publish_text", "act": "publish", "type": "text", "schema":{}}]
        """
        And "desks"
        """
        [
            {"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]},
            {"name": "News", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}
        ]
        """
        When we post to "/products" with success
        """
        {"name":"prod-1","codes":"abc,xyz", "product_type": "both"}
        """
        And we post to "/subscribers" with success
        """
        {
        "name":"Channel 3","media_type":"media", "subscriber_type": "digital", "sequence_num_settings":{"min" : 1, "max" : 10}, "email": "test@test.com",
        "products": ["#products._id#"],
        "destinations":[{"name":"Test","format": "ninjs", "delivery_type":"PublicArchive","config":{"recipients":"test@test.com"}}]
        }
        """

    @auth
    Scenario: Create then Publish transition stats
        When we post to "/archive" with success
        """
        {
            "type": "text",
            "headline": "show my content",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID"},
            "version": 1, "state": "in_progress"
        }
        """
        When we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get stats
        """
        {"desk_transitions": [{
            "entered_operation": "create",
            "exited_operation": "publish",
            "user": "#CONTEXT_USER_ID#",
            "desk": "#desks._id#",
            "stage": "#desks.incoming_stage#"
        }]}
        """

    @auth
    Scenario: Fetch then Publish transition stats
       Given "archive"
        """
        [{
            "type": "text",
            "headline": "show my content",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID"},
            "version": 1,
            "state": "fetched"
        }]
        """
        And "archive_history"
        """
        [{
            "operation": "fetch",
            "user_id": "#CONTEXT_USER_ID#",
            "item_id": "#archive._id#",
            "update": {
                "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": null}
            },
            "version": 1
        }]
        """
        When we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get stats
        """
        {"desk_transitions": [{
            "entered_operation": "fetch",
            "exited_operation": "publish",
            "user": "#CONTEXT_USER_ID#",
            "desk": "#desks._id#",
            "stage": "#desks.incoming_stage#"
        }]}
        """

    @auth
    Scenario: Create, spike, unspike then Publish transition stats
        When we post to "/archive" with success
        """
        {
            "type": "text",
            "headline": "show my content",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID"},
            "version": 1, "state": "in_progress"
        }
        """
        When we spike "#archive._id#"
        Then we get OK response
        When we unspike "#archive._id#"
        Then we get OK response
        When we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get stats
        """
        {"desk_transitions": [{
            "entered_operation": "create",
            "exited_operation": "spike",
            "user": "#CONTEXT_USER_ID#",
            "desk": "#desks._id#",
            "stage": "#desks.incoming_stage#"
        }, {
            "entered_operation": "unspike",
            "exited_operation": "publish",
            "user": "#CONTEXT_USER_ID#",
            "desk": "#desks._id#",
            "stage": "#desks.incoming_stage#"
        }]}
        """

    @auth
    Scenario: Create then move transition stats
        When we post to "/archive" with success
        """
        {
            "type": "text", "headline": "show my content", "version": 0,
            "task": {"user": "#CONTEXT_USER_ID", "desk": "#desks._id#", "stage": "#desks.incoming_stage#"}
        }
        """
        When we post to "/desks" with success
        """
        [{"name": "Finance", "desk_type": "production" }]
        """
        When we post to "/archive/#archive._id#/move"
        """
        [{"task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#"}}]
        """
        Then we get OK response
        When we spike "#archive._id#"
        Then we get OK response
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get stats
        """
        {"desk_transitions": [
            {"entered_operation": "create", "exited_operation": "move_from"},
            {"entered_operation": "move_to", "exited_operation": "spike"}
        ]}
        """

    @auth
    Scenario: Rewrite move transition stats
        When we post to "/archive" with success
        """
        {
            "type": "text",
            "headline": "show my content",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID"},
            "version": 0
        }
        """
        When we patch "/archive/#archive._id#"
        """
        {
            "body_html": "<p>This is</p><p>Our Body</p><p>Html</p>",
            "version": 1,
            "state": "in_progress"
        }
        """
        Then we get OK response
        When we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we patch "/archive/#REWRITE_ID#"
        """
        {"headline": "Update 1"}
        """
        When we publish "#REWRITE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get stats
        """
        {"desk_transitions": [
            {"entered_operation": "create", "exited_operation": "publish"}
        ]}
        """
        When we get "/archive_statistics/#REWRITE_ID#"
        Then we get stats
        """
        {"desk_transitions": [
            {"entered_operation": "rewrite", "exited_operation": "publish"}
        ]}
        """

    @auth
    Scenario: Duplicate item transition stats
        When we post to "/archive" with success
        """
        {
            "type": "text",
            "headline": "show my content",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID"},
            "version": 0
        }
        """
        When we post to "/archive/#archive._id#/duplicate"
        """
        {"desk": "#desks._id#", "type": "text"}
        """
        Then we get OK response
        When we spike "#duplicate._id#"
        Then we get OK response
        When we generate stats from archive history
        When we get "/archive_statistics/#duplicate._id#"
        Then we get stats
        """
        {"desk_transitions": [
            {"entered_operation": "duplicated_from", "exited_operation": "spike"}
        ]}
        """

    @auth
    Scenario: Deschedule transition stats
        When we post to "/archive" with success
        """
        {
            "type": "text",
            "headline": "show my content",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID"},
            "version": 1, "state": "in_progress"
        }
        """
        When we publish "#archive._id#" with "publish" type and "published" state
        """
        {"publish_schedule": "2029-01-01T02:00:00+0000"}
        """
        Then we get OK response
        When we patch "/archive/#archive._id#"
        """
        {"publish_schedule": null}
        """
        Then we get OK response
        When we spike "#archive._id#"
        Then we get OK response
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get stats
        """
        {"desk_transitions": [
            {"entered_operation": "create", "exited_operation": "publish_scheduled"},
            {"entered_operation": "deschedule", "exited_operation": "spike"}
        ]}
        """
