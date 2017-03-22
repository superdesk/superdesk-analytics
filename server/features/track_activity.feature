Feature: Track Activity

     @auth
     Scenario: Track activity items
        Given "desks"
        """
        [{"name": "Sports Desk"}]
        """
        When we post to "archive"
        """
        [{  "type":"text", "headline": "test1", "guid": "123", "state": "submitted",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID#"}}]
        """
        Then we get OK response
        When we post to "/track_activity_report"
        """
        {
        	"user": "#CONTEXT_USER_ID#",
        	"desk": "#desks._id#",
        	"stage": "#desks.incoming_stage#"
        }
        """
        Then we get existing resource
        """
        {
        "user": "#CONTEXT_USER_ID#",
        "report": [{"entered_stage_at": "#archive._updated#"}]
        }
        """
       	When we post to "/stages"
        """
        { "name": "New Stage", "task_status": "in_progress",
          "desk": "#desks._id#"}
        """
		And we post to "/archive/123/move"
        """
        [{
        	"task": {"desk": "#desks._id#", "stage": "#stages._id#"}
        }]
        """
		Then we get OK response
		When we post to "/track_activity_report"
        """
        {
        	"user": "#CONTEXT_USER_ID#",
        	"desk": "#desks._id#",
        	"stage": "#stages._id#"
        }
        """
        Then we get existing resource
        """
        {
        "user": "#CONTEXT_USER_ID#",
        "report": [{"entered_stage_at": "#archive._updated#"}]
        }
        """
     
        