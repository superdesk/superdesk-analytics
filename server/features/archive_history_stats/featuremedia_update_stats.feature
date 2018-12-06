Feature: Featuremedia Stats
    Background: Initial Setup
        Given config update
        """
        {"PUBLISH_ASSOCIATED_ITEMS": false}
        """
        And the "validators"
        """
        [{"_id": "publish_composite", "act": "publish", "type": "composite", "schema":{}},
        {"_id": "publish_picture", "act": "publish", "type": "picture", "schema":{}},
        {"_id": "publish_text", "act": "publish", "type": "text", "schema":{}},
        {"_id": "correct_composite", "act": "correct", "type": "composite", "schema":{}},
        {"_id": "correct_picture", "act": "correct", "type": "picture", "schema":{}},
        {"_id": "correct_text", "act": "correct", "type": "text", "schema":{}}]
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
        When upload a file "bike.jpg" to "archive" with "bike"
        When we post to "/archive/bike/move" with success
        """
        [{"task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#"}}]
        """
        When we patch "/archive/bike"
        """
        {
            "headline": "bike vroom",
            "alt_text": "bike",
            "description_text": "a nice motor-bike"
        }
        """
        Then we get OK response
        When upload a file "bike.jpg" to "archive" with "bike2"
        When we post to "/archive/bike2/move" with success
        """
        [{"task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#"}}]
        """
        When we patch "/archive/bike2"
        """
        {
            "headline": "bike2 vroom",
            "alt_text": "bike2",
            "description_text": "a nice motor-bike 2"
        }
        """

    @auth
    Scenario: Featuremedia stats are stored after parent item is published
        When we post to "/archive" with success
        """
        {
            "_id": "item1", "guid": "item1",
            "type": "text", "headline": "show my content", "version": 0,
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID"}
        }
        """
        When we patch "/archive/item1"
        """
        {
            "associations": {
                "featuremedia": {
                    "_id": "bike",
                    "poi": {"x": 0.75, "y": 0.4}
                }
            },
            "state": "in_progress"
        }
        """
        Then we get OK response
        When we patch "/archive/item1"
        """
        {
            "associations": {
                "featuremedia": {
                    "_id": "bike",
                    "poi": {"x": 0.751, "y": 0.45},
                    "headline": "bike vroom",
                    "alt_text": "bike",
                    "description_text": "a nice motor-bike"
                }
            }
        }
        """
        Then we get OK response
        When we generate stats from archive history
        When we get "/archive_statistics/item1"
        Then we get stats
        """
        {
            "featuremedia_updates": null,
            "timeline": [
                {"operation": "create"},
                {"operation": "update"},
                {"operation": "add_featuremedia"},
                {"operation": "update"},
                {"operation": "update_featuremedia_poi"}
            ]
        }
        """
        When we publish "item1" with "publish" type and "published" state
        Then we get OK response
        When we publish "item1" with "correct" type and "corrected" state
        """
        {
            "associations": {
                "featuremedia": {
                    "_id": "bike2",
                    "poi": {"x": 0.75, "y": 0.4},
                    "headline": "bike2 vroom",
                    "alt_text": "bike2",
                    "description_text": "a nice motor-bike 2"
                }
            }
        }
        """
        Then we get OK response
        When we publish "item1" with "correct" type and "corrected" state
        """
        {
            "associations": {
                "featuremedia": {
                    "_id": "bike2",
                    "poi": {"x": 0.705, "y": 0.405},
                    "headline": "bike2 vroom",
                    "alt_text": "bike2",
                    "description_text": "a nice motor-bike 2"
                }
            }
        }
        """
        Then we get OK response
        When we publish "item1" with "correct" type and "corrected" state
        """
        {"associations": {"featuremedia": null}}
        """
        Then we get OK response
        When we generate stats from archive history
        When we get "/archive_statistics/item1"
        Then we get stats
        """
        {
            "timeline": [
                {"operation": "create"},
                {"operation": "update"},
                {"operation": "add_featuremedia"},
                {"operation": "update"},
                {"operation": "update_featuremedia_poi"},
                {"operation": "publish"},
                {"operation": "correct"},
                {"operation": "update_featuremedia_image"},
                {"operation": "correct"},
                {"operation": "update_featuremedia_poi"},
                {"operation": "correct"},
                {"operation": "remove_featuremedia"}
            ],
            "featuremedia_updates": [
                {"operation": "update_featuremedia_image"},
                {"operation": "update_featuremedia_poi"},
                {"operation": "remove_featuremedia"}
            ]
        }
        """
