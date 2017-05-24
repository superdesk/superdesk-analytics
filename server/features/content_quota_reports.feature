Feature: Content Quota

    @auth
    Scenario: Content quota items
        Given "desks"
        """
        [{"name": "Sports Desk"}]
        """
        Given "archive"
		"""
		[{
			"guid": "item1",
			"type": "text",
			"headline": "item1",
			"_current_version": 1,
			"state": "fetched",
		    "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID#"},
		    "subject":[{"qcode": "05007000", "name": "university"}],
		    "keywords": ["UNIVERSITY"],
		    "slugline": "test",
		    "anpa_category": [{"name": "arts, culture and entertainment" , "qcode": "01000000"}],
		    "body_html": "Test Document body"
		}]
        """
	    When we publish "#archive._id#" with "publish" type and "published" state
	    Then we get OK response
        When we post to "/content_quota_reports" with success
        """
        {
        	"start_time": "2017-06-20T09:03:26+0000",
        	"subject":[{"qcode": "05007000", "name": "university"}],
        	"keywords": ["UNIVERSITY"],
        	"category": [{"name": "arts, culture and entertainment" , "qcode": "01000000"}],
        	"intervals_number": 2,
        	"interval_length": 15,
        	"target": 1
        }
        """
        Then we get existing resource
        """
        {
        	"start_time": "2017-06-20T09:03:26+0000",
        	"subject":[{"qcode": "05007000", "name": "university"}],
        	"keywords": ["UNIVERSITY"],
        	"category": [{"name": "arts, culture and entertainment" , "qcode": "01000000"}],
        	"intervals_number": 2,
        	"interval_length": 15,
        	"target": 1,
        	"report": [{"end_time": "2017-06-05T09:03:26+0000", "start_time": "2017-06-20T09:03:26+0000" },
        		{"end_time": "2017-05-21T09:03:26+0000", "start_time": "2017-06-05T09:03:26+0000", "items_total": 2}
        	]
        }
        """