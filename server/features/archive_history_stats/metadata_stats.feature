Feature: Metadata Stats
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
    Scenario: Stores metadata from initial create
        When we post to "/archive" with success
        """
        {
            "type": "text",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID#"},
            "version": 0,
            "source": "AAP",
            "original_source": "Reuters",
            "anpa_category": [{"qcode": "sport"}],
            "subject": [{"qcode": "04000000"}],
            "genre": [{"qcode": "Article", "name": "Article (news)"}],
            "company_codes": [{"qcode": "1PG", "security_exchange": "ASX", "name": "1-PAGE LIMITED"}],
            "headline": "show my content",
            "abstract": "abba",
            "slugline": "slugger",
            "anpa_take_key": "update",
            "keywords": ["UK"],
            "word_count": 5,
            "priority": 1,
            "urgency": 4,
            "flags": {"marked_for_legal": true},
            "auto_publish": false,
            "assignment_id": "assign123",
            "rewrite_of": "item123",
            "rewritten_by": "item789",
            "original_id": "item123",
            "body_html": "<p>this is some</p><p>body text</p>"
        }
        """
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get existing resource
        """
        {
            "type": "text",
            "state": "draft",
            "original_creator": "#CONTEXT_USER_ID#",
            "version": 0,
            "version_creator": "#CONTEXT_USER_ID#",
            "versioncreated": "__any_value__",
            "firstpublished": "__no_value__",
            "firstcreated": "__any_value__",
            "source": "AAP",
            "original_source": "Reuters",
            "anpa_category": [{"qcode": "sport"}],
            "subject": [{"qcode": "04000000"}],
            "genre": [{"qcode": "Article", "name": "Article (news)"}],
            "company_codes": [{"qcode": "1PG", "security_exchange": "ASX", "name": "1-PAGE LIMITED"}],
            "headline": "show my content",
            "abstract": "abba",
            "slugline": "slugger",
            "anpa_take_key": "update",
            "keywords": ["UK"],
            "word_count": 5,
            "priority": 1,
            "urgency": 4,
            "pubstatus": "usable",
            "flags": {
                "marked_for_not_publication": false,
                "marked_for_legal": true,
                "marked_archived_only": false,
                "marked_for_sms": false
            },
            "format": "HTML",
            "assignment_id": "assign123",
            "rewrite_of": "item123",
            "rewritten_by": "item789",
            "original_id": "item123",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID#"},
            "original_par_count": 2,
            "par_count": 2,
            "time_to_first_publish": "__no_value__",
            "num_desk_transitions": 0,
            "num_featuremedia_updates": 0
        }
        """
        When we patch "/archive/#archive._id#"
        """
        {"body_html": "<p>long</p><p>than</p><p></p><p>usual</p><p>body</p><p>html</p>"}
        """
        Then we get OK response
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get existing resource
        """
        {"original_par_count": 2, "par_count": 5}
        """
        When we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we generate stats from archive history
        When we get "/archive_statistics/#archive._id#"
        Then we get existing resource
        """
        {"num_desk_transitions": 1, "state": "published"}
        """
