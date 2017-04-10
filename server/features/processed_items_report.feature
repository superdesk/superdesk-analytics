Feature: Processed published items
     
     @auth
     Scenario: Processed published items
     	Given "roles"
     	"""
     	[{"name": "Admin", "privileges": {"ingest":  1, "archive": 1, "fetch": 1, "publish": 1}}]
     	"""
     	Given "desks"
        """
        [{"name": "Sports Desk"}]
        """
     	Given "users"
        """
        [{"username": "user1", "password": "password", "email": "user1@domain.com", "sign_off": "fb", "user_type": "administrator","role": "#roles._id#"}]
        """
        When we login as user "user1" with password "password" and user type "admin"
        Given "archive"
        """
        [{"_id": "item1", "headline": "test", "slugline": "test", "state": "fetched",
          "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#","user": "#users._id#"},"original_creator": "#CONTEXT_USER_ID#",
          "_current_version": 0, "guid": "item1"}]
        """
        When we publish "#archive._id#" with "publish" type and "published" state
		Then we get OK response
        When we switch user
        """
        {"user_type": "administrator","role": "#roles._id#"}
        """
        Then we get OK response
        Given "archive"
        """
        [{"_id": "item2", "headline": "test2", "slugline": "test2", "state": "fetched",
          "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#","user": "#CONTEXT_USER_ID#"},"original_creator": "#CONTEXT_USER_ID#",
          "_current_version": 1, "guid": "item2"}]
        """
		When we publish "#archive._id#" with "publish" type and "published" state
		Then we get OK response
		When we post to "/processed_items_report" with success
        """
        {
        	"users": ["#CONTEXT_USER_ID#", "#users._id#"],
        	"start_time": "2017-01-02T09:03:26+0000",
        	"end_time": "2018-02-22T09:03:26+0000"
        }
        """
        Then we get existing resource
        """
        {
        "users": ["#CONTEXT_USER_ID#", "#users._id#"],
        "start_time": "2017-01-02T09:03:26+0000",
        "end_time": "2018-02-22T09:03:26+0000",
        "report": [{
        	"user": 
	        	{
	        		"_id": "#CONTEXT_USER_ID#",
	        	 	"display_name": "__any_value__"
	       			},
        	 "processed_items": 
        	 	{
        	 		"corrected_items": 0,
        	 		"killed_items": 0,
        	 		"total_items": 2,
        	 		"published_items": 2, 
        	 		"spiked_items": 0
        	 	}},
        	{
        		"user": {
        			"_id": "#users._id#",
        			"display_name": "#users.username#"}, 
        		"processed_items":{
        			"corrected_items": 0,
        			"killed_items": 0,
        			"total_items": 2,
        			"published_items": 2, 
        			"spiked_items": 0
        		}}]
        }
        """
    @auth
    Scenario: Processed spiked items
 		Given "users"
        """
        [{"username": "user1", "password": "password", "email": "user1@domain.com", "sign_off": "fb", "user_type": "administrator"}]
        """
        When we login as user "user1" with password "password" and user type "admin"
        Given "archive"
        """
        [{"_id": "item1", "headline": "test", "slugline": "test", "state": "fetched",
          "task": {"user": "#users._id#"},"original_creator": "#CONTEXT_USER_ID#",
          "_current_version": 0, "guid": "item1"}]
        """
        When we spike "item1"
		Then we get OK response
        When we switch user
        """
        {"user_type": "administrator"}
        """
        Then we get OK response
        Given "archive"
        """
        [{"_id": "item2", "headline": "test2", "slugline": "test2", "state": "fetched",
          "task": {"user": "#CONTEXT_USER_ID#"},"original_creator": "#CONTEXT_USER_ID#",
          "_current_version": 1, "guid": "item2"}]
        """
		When we spike "item2"
		Then we get OK response
		When we post to "/processed_items_report" with success
        """
        {
        	"users": ["#CONTEXT_USER_ID#", "#users._id#"],
        	"start_time": "2017-01-02T09:03:26+0000",
        	"end_time": "2018-02-22T09:03:26+0000"
        }
        """
        Then we get existing resource
        """
        {
        "users": ["#CONTEXT_USER_ID#", "#users._id#"],
        "start_time": "2017-01-02T09:03:26+0000",
        "end_time": "2018-02-22T09:03:26+0000",
        "report": [{
        	"user": 
	        	{
	        		"_id": "#CONTEXT_USER_ID#",
	        	 	"display_name": "__any_value__"
	       			},
        	 "processed_items": 
        	 	{
        	 		"corrected_items": 0,
        	 		"killed_items": 0,
        	 		"total_items": 1,
        	 		"published_items": 0, 
        	 		"spiked_items": 1
        	 	}},
        	{
        		"user": {
        			"_id": "#users._id#",
        			"display_name": "#users.username#"}, 
        		"processed_items":{
        			"corrected_items": 0,
        			"killed_items": 0,
        			"total_items": 1,
        			"published_items": 0, 
        			"spiked_items": 1
        		}}]
        }
        """
   	@auth
   	Scenario: Processed corrected items
		Given "roles"
     	"""
     	[{"name": "Admin", "privileges": {"ingest":  1, "archive": 1, "fetch": 1, "publish": 1}}]
     	"""
     	Given "desks"
        """
        [{"name": "Sports Desk"}]
        """
     	Given "users"
        """
        [{"username": "user1", "password": "password", "email": "user1@domain.com", "sign_off": "fb", "user_type": "administrator","role": "#roles._id#"}]
        """
        When we login as user "user1" with password "password" and user type "admin"
        Given "archive"
        """
        [{"_id": "item1", "headline": "test", "slugline": "test", "state": "published",
          "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#","user": "#users._id#"},"original_creator": "#CONTEXT_USER_ID#",
          "_current_version": 0, "guid": "item1"}]
        """
        When we publish "#archive._id#" with "correct" type and "corrected" state
		Then we get OK response
        When we switch user
        """
        {"user_type": "administrator","role": "#roles._id#"}
        """
        Then we get OK response
        Given "archive"
        """
        [{"_id": "item2", "headline": "test2", "slugline": "test2", "state": "published",
          "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#","user": "#CONTEXT_USER_ID#"},"original_creator": "#CONTEXT_USER_ID#",
          "_current_version": 1, "guid": "item2"}]
        """
		When we publish "#archive._id#" with "correct" type and "corrected" state
		Then we get OK response
		When we post to "/processed_items_report" with success
        """
        {
        	"users": ["#CONTEXT_USER_ID#", "#users._id#"],
        	"start_time": "2017-01-02T09:03:26+0000",
        	"end_time": "2018-02-22T09:03:26+0000"
        }
        """
        Then we get existing resource
        """
        {
        "users": ["#CONTEXT_USER_ID#", "#users._id#"],
        "start_time": "2017-01-02T09:03:26+0000",
        "end_time": "2018-02-22T09:03:26+0000",
        "report": [{
        	"user": 
	        	{
	        		"_id":"#CONTEXT_USER_ID#",
	        	 	"display_name": "__any_value__"
	        	 	},
        	 "processed_items": 
        	 	{
        	 		"corrected_items": 2,
        	 		"killed_items": 0,
        	 		"total_items": 2,
        	 		"published_items": 0, 
        	 		"spiked_items": 0
        	 	}},
        	{
        		"user": {
        			"_id":"#users._id#",
        			"display_name": "#users.username#"}, 
        		"processed_items":{
        			"corrected_items": 2,
        			"killed_items": 0,
        			"total_items": 2,
        			"published_items": 0, 
        			"spiked_items": 0
        		}}]
        		
        	}
        """
  	@auth
  	Scenario: Processed killed items
		Given "roles"
     	"""
     	[{"name": "Admin", "privileges": {"ingest":  1, "archive": 1, "fetch": 1, "publish": 1}}]
     	"""
     	Given "desks"
        """
        [{"name": "Sports Desk"}]
        """
     	Given "users"
        """
        [{"username": "user1", "password": "password", "email": "user1@domain.com", "sign_off": "fb", "user_type": "administrator","role": "#roles._id#"}]
        """
        When we login as user "user1" with password "password" and user type "admin"
        Given "archive"
        """
        [{"_id": "item1", "headline": "test", "slugline": "test", "state": "corrected",
          "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#","user": "#users._id#"},"original_creator": "#CONTEXT_USER_ID#",
          "_current_version": 1, "guid": "item1"}]
        """
        When we publish "#archive._id#" with "kill" type and "killed" state
		Then we get OK response
        When we switch user
        """
        {"user_type": "administrator","role": "#roles._id#"}
        """
        Then we get OK response
        Given "archive"
        """
        [{"_id": "item2", "headline": "test2", "slugline": "test2", "state": "corrected",
          "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#","user": "#CONTEXT_USER_ID#"},"original_creator": "#CONTEXT_USER_ID#",
          "_current_version": 2, "guid": "item2"}]
        """
		When we publish "#archive._id#" with "kill" type and "killed" state
		Then we get OK response
		When we post to "/processed_items_report" with success
        """
        {
        	"users": ["#CONTEXT_USER_ID#", "#users._id#"],
        	"start_time": "2017-01-02T09:03:26+0000",
        	"end_time": "2018-02-22T09:03:26+0000"
        }
        """
        Then we get existing resource
        """
        {
        "users": ["#CONTEXT_USER_ID#", "#users._id#"],
        "start_time": "2017-01-02T09:03:26+0000",
        "end_time": "2018-02-22T09:03:26+0000",
        "report": [{
        	"user": 
	        	{
	        		"_id":"#CONTEXT_USER_ID#",
	        	 	"display_name": "__any_value__"
	        	 	},
        	 "processed_items": 
        	 	{
        	 		"corrected_items": 0,
        	 		"killed_items": 2,
        	 		"total_items": 2,
        	 		"published_items": 0, 
        	 		"spiked_items": 0
        	 	}},
        	{
        		"user": {
        			"_id":"#users._id#",
        			"display_name": "#users.username#"}, 
        		"processed_items":{
        			"corrected_items": 0,
        			"killed_items": 2,
        			"total_items": 2,
        			"published_items": 0, 
        			"spiked_items": 0
        		}}]
        		
        	}
        """