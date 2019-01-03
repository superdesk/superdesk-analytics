Feature: Archive Timeline Stats
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
        And "vocabularies"
        """
        [{
            "_id": "crop_sizes",
            "unique_field": "name",
            "items": [
                {"is_active": true, "name": "4-3", "width": 800, "height": 600},
                {"is_active": true, "name": "16-9", "width": 1280, "height": 720}
            ]
        }]
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
    Scenario: Create, Update then Publish history stats
        When we post to "/archive" with success
        """
        {
            "type": "text",
            "headline": "show my content",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID"},
            "version": 0
        }
        """
        When we post to "/archive/#archive._id#/lock" with success
        """
        {"lock_action": "edit"}
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
        When we post to "/archive/#archive._id#/unlock" with success
        """
        {}
        """
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get stats
        """
        {
            "timeline": [
                {"operation": "create"},
                {"operation": "item_lock"},
                {"operation": "update"},
                {"operation": "publish"},
                {"operation": "item_unlock"}
            ]
        }
        """

    @auth
    Scenario: Fetch, Update then Publish history stats
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
        When we post to "/archive/#archive._id#/lock" with success
        """
        {"lock_action": "edit"}
        """
        When we patch "/archive/#archive._id#"
        """
        {
            "body_html": "<p>This is</p><p>Our Body</p><p>Html</p>",
            "version": 2,
            "state": "in_progress"
        }
        """
        Then we get OK response
        When we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we post to "/archive/#archive._id#/unlock" with success
        """
        {}
        """
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get stats
        """
        {
            "timeline": [
                {"operation": "fetch"},
                {"operation": "item_lock"},
                {"operation": "update"},
                {"operation": "publish"},
                {"operation": "item_unlock"}
            ]
        }
        """

    @auth
    Scenario: Doesnt include history from duplicated item
        Given "archive"
        """
        [{
            "type": "text",
            "headline": "show my content",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID"},
            "version": 3,
            "state": "in_progress"
        }]
        """
        And "archive_history"
        """
        [{
            "operation": "create",
            "user_id": "#CONTEXT_USER_ID#",
            "item_id": "#archive._id#",
            "update": {
                "type": "text",
                "headline": "my first headline",
                "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": null}
            },
            "version": 1
        }, {
            "operation": "item_lock",
            "user_id": "#CONTEXT_USER_ID#",
            "item_id": "#archive._id#",
            "update": {
                "lock_action": "edit",
                "lock_user": "#CONTEXT_USER_ID#",
                "lock_session": "session1"
            },
            "version": 1
        }, {
            "operation": "update",
            "user_id": "#CONTEXT_USER_ID#",
            "item_id": "#archive._id#",
            "update": {"headline": "my second headline"},
            "version": 2
        }, {
            "operation": "publish",
            "user_id": "#CONTEXT_USER_ID#",
            "item_id": "#archive._id#",
            "update": {"state": "published"},
            "version": 3
        }, {
            "operation": "item_unlock",
            "user_id": "#CONTEXT_USER_ID#",
            "item_id": "#archive._id#",
            "update": {
                "lock_action": null,
                "lock_user": null,
                "lock_session": null
            },
            "version": 3
        }]
        """
        When we post to "/archive/#archive._id#/duplicate"
        """
        {"desk": "#desks._id#", "type": "text"}
        """
        Then we get OK response
        When we post to "/archive/#duplicate._id#/lock" with success
        """
        {"lock_action": "edit"}
        """
        When we patch "/archive/#duplicate._id#"
        """
        {
            "body_html": "<p>This is</p><p>Our Body</p><p>Html</p>",
            "version": 2,
            "state": "in_progress"
        }
        """
        Then we get OK response
        When we post to "/archive/#duplicate._id#/unlock" with success
        """
        {}
        """
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get stats
        """
        {
            "timeline": [
                {"operation": "create"},
                {"operation": "item_lock"},
                {"operation": "update"},
                {"operation": "publish"},
                {"operation": "item_unlock"},
                {"operation": "duplicate"}
            ]
        }
        """
        When we get "/archive_statistics/#duplicate._id#"
        Then we get stats
        """
        {
            "timeline": [
                {"operation": "duplicated_from"},
                {"operation": "item_lock"},
                {"operation": "update"},
                {"operation": "item_unlock"}
            ]
        }
        """

    @auth
    Scenario: Unlock version 0 deletes stats
        When we post to "/archive" with success
        """
        {
            "type": "text",
            "headline": "show my content",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID"},
            "version": 0
        }
        """
        When we post to "/archive/#archive._id#/lock" with success
        """
        {"lock_action": "edit"}
        """
        When we post to "/archive/#archive._id#/unlock" with success
        """
        {}
        """
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get error 404

    @auth
    Scenario: Spike then unspike stats
        When we post to "/archive" with success
        """
        {
            "type": "text",
            "headline": "show my content",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID"},
            "version": 0
        }
        """
        When we post to "/archive/#archive._id#/lock" with success
        """
        {"lock_action": "edit"}
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
        When we post to "/archive/#archive._id#/unlock" with success
        """
        {}
        """
        When we spike "#archive._id#"
        Then we get OK response
        When we unspike "#archive._id#"
        Then we get OK response
        When we post to "/archive/#archive._id#/lock" with success
        """
        {"lock_action": "edit"}
        """
        When we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we post to "/archive/#archive._id#/unlock" with success
        """
        {}
        """
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get stats
        """
        {
            "timeline": [
                {"operation": "create"},
                {"operation": "item_lock"},
                {"operation": "update"},
                {"operation": "item_unlock"},
                {"operation": "spike"},
                {"operation": "unspike"},
                {"operation": "item_lock"},
                {"operation": "publish"},
                {"operation": "item_unlock"}
            ]
        }
        """

    @auth
    Scenario: Scheduled publish history stats
        When we post to "/archive" with success
        """
        {
            "type": "text",
            "headline": "show my content",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID"},
            "version": 0
        }
        """
        When we post to "/archive/#archive._id#/lock" with success
        """
        {"lock_action": "edit"}
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
        """
        {"publish_schedule": "2029-01-01T02:00:00+0000"}
        """
        Then we get OK response
        When we post to "/archive/#archive._id#/unlock" with success
        """
        {}
        """
        When we patch "/archive/#archive._id#"
        """
        {"publish_schedule": null}
        """
        Then we get OK response
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get stats
        """
        {
            "timeline": [
                {"operation": "create"},
                {"operation": "item_lock"},
                {"operation": "update"},
                {"operation": "publish_scheduled"},
                {"operation": "item_unlock"},
                {"operation": "deschedule"}
            ]
        }
        """

    @auth
    Scenario: Embargo publish history stats
        When we post to "/archive" with success
        """
        {
            "type": "text",
            "headline": "show my content",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID"},
            "version": 0
        }
        """
        When we post to "/archive/#archive._id#/lock" with success
        """
        {"lock_action": "edit"}
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
        """
        {"embargo": "2029-01-01T02:00:00+0000"}
        """
        Then we get OK response
        When we post to "/archive/#archive._id#/unlock" with success
        """
        {}
        """
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get stats
        """
        {
            "timeline": [
                {"operation": "create"},
                {"operation": "item_lock"},
                {"operation": "update"},
                {"operation": "publish_embargo"},
                {"operation": "item_unlock"}
            ]
        }
        """

    @auth
    Scenario: Publish then update history stats
        When we post to "/archive" with success
        """
        {
            "type": "text",
            "headline": "show my content",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID"},
            "version": 0
        }
        """
        When we post to "/archive/#archive._id#/lock" with success
        """
        {"lock_action": "edit"}
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
        When we post to "/archive/#archive._id#/unlock" with success
        """
        {}
        """
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we post to "/archive/#REWRITE_ID#/lock" with success
        """
        {"lock_action": "edit"}
        """
        When we patch "/archive/#REWRITE_ID#"
        """
        {"headline": "Update 1"}
        """
        When we post to "/archive/#REWRITE_ID#/unlock" with success
        """
        {}
        """
        When we delete link "archive/#REWRITE_ID#/rewrite"
        Then we get OK response
        When we rewrite "#archive._id#"
        """
        {"update": {"_id": "#REWRITE_ID#", "type": "text", "headline": "test"}}
        """
        Then we get OK response
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get stats
        """
        {"timeline": [
            {"operation": "create"},
            {"operation": "item_lock"},
            {"operation": "update"},
            {"operation": "publish"},
            {"operation": "item_unlock"},
            {"operation": "rewrite"},
            {"operation": "unlink"},
            {"operation": "rewrite"}
        ]}
        """
        When we get "/archive_statistics/#REWRITE_ID#"
        Then we get stats
        """
        {"timeline": [
            {"operation": "create"},
            {"operation": "link"},
            {"operation": "item_lock"},
            {"operation": "update"},
            {"operation": "item_unlock"},
            {"operation": "unlink"},
            {"operation": "link"}
        ]}
        """

    @auth
    Scenario: Publish then correct history stats
        When we post to "/archive" with success
        """
        {
            "type": "text",
            "headline": "show my content",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID"},
            "version": 0
        }
        """
        When we post to "/archive/#archive._id#/lock" with success
        """
        {"lock_action": "edit"}
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
        When we post to "/archive/#archive._id#/unlock" with success
        """
        {}
        """
        When we publish "#archive._id#" with "correct" type and "corrected" state
        """
        {"headline": "corrected"}
        """
        Then we get OK response
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get stats
        """
        {"timeline": [
            {"operation": "create"},
            {"operation": "item_lock"},
            {"operation": "update"},
            {"operation": "publish"},
            {"operation": "item_unlock"},
            {"operation": "correct"}
        ]}
        """

    @auth
    Scenario: Publish then kill history stats
        When we post to "/archive" with success
        """
        {
            "type": "text",
            "headline": "show my content",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID"},
            "version": 0
        }
        """
        When we post to "/archive/#archive._id#/lock" with success
        """
        {"lock_action": "edit"}
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
        When we post to "/archive/#archive._id#/unlock" with success
        """
        {}
        """
        When we publish "#archive._id#" with "kill" type and "killed" state
        Then we get OK response
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get stats
        """
        {"timeline": [
            {"operation": "create"},
            {"operation": "item_lock"},
            {"operation": "update"},
            {"operation": "publish"},
            {"operation": "item_unlock"},
            {"operation": "kill"}
        ]}
        """

    @auth
    Scenario: Publish then takedown history stats
        When we post to "/archive" with success
        """
        {
            "type": "text",
            "headline": "show my content",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID"},
            "version": 0
        }
        """
        When we post to "/archive/#archive._id#/lock" with success
        """
        {"lock_action": "edit"}
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
        When we post to "/archive/#archive._id#/unlock" with success
        """
        {}
        """
        When we publish "#archive._id#" with "takedown" type and "recalled" state
        Then we get OK response
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get stats
        """
        {"timeline": [
            {"operation": "create"},
            {"operation": "item_lock"},
            {"operation": "update"},
            {"operation": "publish"},
            {"operation": "item_unlock"},
            {"operation": "takedown"}
        ]}
        """

    @auth
    Scenario: Content move history stats
        When we post to "/archive" with success
        """
        {
            "type": "text", "headline": "show my content", "version": 0,
            "task": {"user": "#CONTEXT_USER_ID"}
        }
        """
        When we post to "/archive/#archive._id#/move"
        """
        [{"task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#"}}]
        """
        Then we get OK response
        When we post to "/desks" with success
        """
        [{"name": "Finance", "desk_type": "production" }]
        """
        When we post to "/archive/#archive._id#/move"
        """
        [{"task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#"}}]
        """
        Then we get OK response
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get stats
        """
        {"timeline": [
            {"operation": "create"},
            {"operation": "move_from"},
            {"operation": "move_to"},
            {"operation": "move_from"},
            {"operation": "move_to"}
        ]}
        """

    @auth
    Scenario: Marked for desk history stats
        When we post to "/archive" with success
        """
        {
            "type": "text", "headline": "show my content", "version": 0,
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID"}
        }
        """
        When we post to "/desks" with success
        """
        [{"name": "Finance", "desk_type": "production" }]
        """
        When we post to "/marked_for_desks" with success
        """
        [{"marked_desk": "#desks._id#", "marked_item": "#archive._id#"}]
        """
        When we post to "/marked_for_desks" with success
        """
        [{"marked_desk": "#desks._id#", "marked_item": "#archive._id#"}]
        """
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get stats
        """
        {"timeline": [
            {"operation": "create"},
            {"operation": "mark"},
            {"operation": "unmark"}
        ]}
        """

    @auth
    Scenario: Highlight history stats
        When we post to "highlights" with success
        """
        {"name": "highlight1", "desks": ["#desks._id#"]}
        """
        When we post to "archive" with success
        """
        [
            {"_id": "item1", "guid": "item1", "type": "text", "headline": "item1", "task": {"desk": "#desks._id#"}, "state": "published"},
            {"_id": "item2", "guid": "item2", "type": "text", "headline": "item2", "body_html": "<p>item2 first</p><p>item2 second</p>", "task": {"desk": "#desks._id#"}, "state": "published"}
        ]
        """
        When we post to "marked_for_highlights"
		"""
		[
		    {"highlights": "#highlights._id#", "marked_item": "item1"},
		    {"highlights": "#highlights._id#", "marked_item": "item2"},
        ]
		"""
        When we post to "archive" with success
        """
        {
            "type": "composite",
            "headline": "highlights",
            "highlight": "#highlights._id#",
            "groups": [{
                "id": "root",
                "refs": [{"idRef": "main"}]
            }, {
                "id": "main",
                "refs": [
                    {"residRef": "item1"},
                    {"residRef": "item2"}
                ]
            }],
            "task": {"desk": "#desks._id#"}
        }
        """
        When we post to "generate_highlights" with success
        """
        {"package": "#archive._id#", "export": true}
        """
        When we generate stats from archive history
        When we get "/archive_statistics/#generate_highlights._id#"
        Then we get stats
        """
        {"timeline": [
            {"operation": "create"},
            {"operation": "create_highlight"}
        ]}
        """
        When we get "/archive_statistics/item1"
        Then we get stats
        """
        {"timeline": [
            {"operation": "create"},
            {"operation": "export_highlight"}
        ]}
        """
        When we get "/archive_statistics/item2"
        Then we get stats
        """
        {"timeline": [
            {"operation": "create"},
            {"operation": "export_highlight"}
        ]}
        """

    @auth
    Scenario: Featuremedia history stats
        When we post to "/archive" with success
        """
        {
            "_id": "item1", "guid": "item1",
            "type": "text", "headline": "show my content", "version": 0,
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID"}
        }
        """
        When upload a file "bike.jpg" to "archive" with "bike"
        When we post to "/archive/bike/move" with success
        """
        [{"task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#"}}]
        """
        When we patch "/archive/bike"
        """
        {"poi": {"x": 0.5, "y": 0.6}}
        """
        Then we get OK response
        When we patch "/archive/item1"
        """
        {
            "associations": {
                "featuremedia": {
                    "_id": "bike",
                    "poi": {"x": 0.2, "y": 0.3}
                }
            }
        }
        """
        Then we get OK response
        When we patch "/archive/item1"
        """
        {
            "associations": {
                "featuremedia": {
                    "_id": "bike",
                    "poi": {"x": 0.75, "y": 0.15}
                }
            }
        }
        """
        Then we get OK response
        When upload a file "bike.jpg" to "archive" with "bike2"
        When we post to "/archive/bike2/move" with success
        """
        [{"task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#"}}]
        """
        When we patch "/archive/item1"
        """
        {
            "associations": {
                "featuremedia": {
                    "_id": "bike2",
                    "poi": {"x": 0.2, "y": 0.3}
                }
            }
        }
        """
        Then we get OK response
        When we patch "/archive/item1"
        """
        {
            "associations": {
                "featuremedia": null
            }
        }
        """
        Then we get OK response
        When we generate stats from archive history
        When we get "/archive_statistics/item1"
        Then we get stats
        """
        {"timeline": [
            {"operation": "create"},
            {"operation": "update"},
            {"operation": "add_featuremedia"},
            {"operation": "update"},
            {"operation": "update_featuremedia_poi"},
            {"operation": "update"},
            {"operation": "update_featuremedia_image"},
            {"operation": "update"},
            {"operation": "remove_featuremedia"}
        ]}
        """
        When we get "/archive_statistics/bike"
        Then we get stats
        """
        {"timeline": [
            {"operation": "create"},
            {"operation": "move_from"},
            {"operation": "move_to"},
            {"operation": "update"},
            {"operation": "change_image_poi"}
        ]}
        """
