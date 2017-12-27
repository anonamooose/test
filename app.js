
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , asdf = require('./routes/asdf')
  , http = require('http')
  , path = require('path')
  , bodyParser = require('body-parser');
const uuidv1 = require('uuid/v1');




var AWS = require("aws-sdk");
AWS.config.update({
    region: "us-west-2",
	accessKeyId: "AWS_ACCESS_KEY_ID",
	  secretAccessKey: "AWS_SECRET_ACCESS_KEY",
    endpoint: "http://localhost:8000"});

var dynamodb = new AWS.DynamoDB();

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://10.6.6.22:27017/handloads";


var app = express();

app.use(bodyParser.urlencoded({extended: true}))


app.get('/', (req, res) => {
	// redirect root to listLoads
	
	res.redirect('/listLoads')

})



// ########################################################################## //
// *************************** Caliber Section ******************************* //
// ########################################################################## //



app.get('/addCaliber', (req, res) => {
	  //console.log(req.body)
	  
	 console.log("Adding a new caliber...");
	 

	 res.render('addCaliber', { title: 'Add Caliber'});
	 //res.send(200,req.body);
})	
	
	
app.post('/addCaliber', (req, res) => {
	  //console.log(req.body)



	MongoClient.connect(url, function(err, db) {
		  if (err) throw err;
		  var item = { 
			  "calName":req.body.calName,  
		          "calClass":req.body.calClass,
			  "caseType":req.body.caseType,
			  "primerType":req.body.primerType
		  };
		  db.collection("calibers").insertOne(item, function(err, res) {
			      if (err) throw err;
			      console.log("1 document inserted");
			      db.close();
			    });
	}); 



	  
	  
	 console.log("Adding a new item...");
	 
	 res.redirect('/listCalibers')
	 //res.send(200,req.body);
	})

app.get('/listCalibers', function (req, res) {
	console.log("entered into list route");
       
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		var query = { address: "Park Lane 38" };
		db.collection("calibers").find().toArray(function(err, result) {

	                if (err) throw err;
	                console.log(result);
	                db.close();
		res.render('listCalibers', { title: 'Calibers', data: result });
	        });
        });


});





// /\/\/\/\/\/\/


app.get('/editCaliber', (req, res) => {
  //console.log(req.body)
  
  var queryurl = require('url'); 
  var queryData = queryurl.parse(req.url, true).query;
 
  var ObjectId = require('mongodb').ObjectId; 
  var id = queryData.caliberId;       
  var o_id = new ObjectId(id);



 console.log("Editing Caliber..." + queryData.caliberId);
 



 	MongoClient.connect(url, function(err, db) {
			  if (err) throw err;
			  var query = { "_id": o_id };
			  console.log("Looking up " + query._id );
			  console.log("query var " + JSON.stringify(query) );
			  db.collection("calibers").find(query).toArray(function(err, result) {
				  
				      if (err) throw err;
				      console.log(result);
				      db.close();

			
				
        res.render('editCaliber', { title: 'Edit Caliber', data: result, foo: "bar" });
				    });
		}); 


//res.send(200, req.body);
 // res.render('addPowder', { title: 'Add Powder', powder: ['IMR 800x', 'Bullseye', 'Clays', 'SR4756']});
 //res.send(200,req.body);
})	


app.post('/editCaliber', (req, res) => {
	  //console.log(req.body)
	
	  
	 console.log("updating an item...");
	 
	var ObjectId = require('mongodb').ObjectId; 
  	
  	var id = req.body.caliberId;       
    
  	//var id = "5a3eb34ba0894762a6c258ea";
    var o_id = new ObjectId(id);

    console.log("incoming id is " + id);

    //var o_id = "5a3eb34ba0894762a6c258ea";

	var myQuery = { _id: o_id };
	var newVals = { 
	  	"calName":req.body.calName,  
		"calClass":req.body.calClass,
		"caseType":req.body.caseType,
		"primerType":req.body.primerType
  	};






	MongoClient.connect(url, function(err, db) {
		  if (err) throw err;
			  
		  db.collection("calibers").updateOne(myQuery, newVals, 
		  		function(err, res) {
			    	if (err) throw err;
			      	console.log("1 document inserted");
			     	db.close();

			    });

	}); 

	res.redirect('/listCalibers')
});
		


app.get('/deleteCaliber', (req, res) => {
  //console.log(req.body)
  
  var queryurl = require('url'); 
  var queryData = queryurl.parse(req.url, true).query;
 
  var ObjectId = require('mongodb').ObjectId; 
  var id = queryData.caliberId;       
  var o_id = new ObjectId(id);



 console.log("Deleting Caliber..." + id);
 



 	MongoClient.connect(url, function(err, db) {
			  if (err) throw err;
			  var query = { "_id": o_id };
			  console.log("deleting " + query._id );
			  console.log("query var " + JSON.stringify(query) );
			  db.collection("calibers").remove(query,function(err, result) {
				  
				      if (err) throw err;
				      console.log(result);
				      db.close();
				    });
			  
		}); 

 	res.redirect('listCalibers');

})	





// /\/\/\/\/\/\/\














	
	
	
// ########################################################################## //
// *************************** Powder Section ******************************* //
// ########################################################################## //
	


	
	app.get('/addPowder', (req, res) => {
	  //console.log(req.body)
	  
	 console.log("Adding a new Powder...");
	 

	 res.render('addPowder', { title: 'Add Powder', powder: ['IMR 800x', 'Bullseye', 'Clays', 'SR4756']});
	 //res.send(200,req.body);
	})	

	app.post('/addPowder', (req, res) => {
	  //console.log(req.body)
	
	  
	 console.log("Adding a new item...");
	 

		
	MongoClient.connect(url, function(err, db) {
		  if (err) throw err;
		  var item = { 
			  "powderName":req.body.powderName,  
		          "powderBrand":req.body.powderBrand,
			  "powderClass":req.body.powderClass,
			  "powderNotes":req.body.powderNotes
		  };
		  db.collection("powders").insertOne(item, function(err, res) {
			      if (err) throw err;
			      console.log("1 document inserted");
			      db.close();
			    });
	}); 
		
		
		
		
		
		
		res.redirect('/listPowders')
	 //res.send(200,req.body);
})

app.get('/listPowders', function (req, res) {
	console.log("entered into list powder route");
	

        
		MongoClient.connect(url, function(err, db) {
			  if (err) throw err;
			  var query = { address: "Park Lane 38" };
			  db.collection("powders").find().toArray(function(err, result) {
				  
				      if (err) throw err;
				      console.log(result);
				      db.close();
        res.render('listPowders', { title: 'Powders', data: result });
				    });
		}); 


        
    

});

	
	
app.get('/editPowder', (req, res) => {
  //console.log(req.body)
  
  var queryurl = require('url'); 
  var queryData = queryurl.parse(req.url, true).query;
 
  var ObjectId = require('mongodb').ObjectId; 
  var id = queryData.powderId;       
  var o_id = new ObjectId(id);



 console.log("Editing Powder..." + queryData.powderId);
 



 	MongoClient.connect(url, function(err, db) {
			  if (err) throw err;
			  var query = { "_id": o_id };
			  console.log("Looking up " + query._id );
			  console.log("query var " + JSON.stringify(query) );
			  db.collection("powders").find(query).toArray(function(err, result) {
				  
				      if (err) throw err;
				      console.log(result);
				      db.close();

			
				
        res.render('editPowder', { title: 'Edit Powder', data: result, foo: "bar" });
				    });
		}); 


//res.send(200, req.body);
 // res.render('addPowder', { title: 'Add Powder', powder: ['IMR 800x', 'Bullseye', 'Clays', 'SR4756']});
 //res.send(200,req.body);
})	


app.post('/editPowder', (req, res) => {
	  //console.log(req.body)
	
	  
	 console.log("updating an item...");
	 
	var ObjectId = require('mongodb').ObjectId; 
  	
  	var id = req.body.powderId;       
    
  	//var id = "5a3eb34ba0894762a6c258ea";
    var o_id = new ObjectId(id);

    console.log("incoming id is " + id);

    //var o_id = "5a3eb34ba0894762a6c258ea";

	var myQuery = { _id: o_id };
	var newVals = { 
		"powderName":req.body.powderName,  
		"powderBrand":req.body.powderBrand,
		"powderClass":req.body.powderClass,
		"powderNotes":req.body.powderNotes
		  };

	MongoClient.connect(url, function(err, db) {
		  if (err) throw err;
			  
		  db.collection("powders").updateOne(myQuery, newVals, 
		  		function(err, res) {
			    	if (err) throw err;
			      	console.log("1 document inserted");
			     	db.close();

			    });

	}); 

	res.redirect('/listPowders')
});
		


app.get('/deletePowder', (req, res) => {
  //console.log(req.body)
  
  var queryurl = require('url'); 
  var queryData = queryurl.parse(req.url, true).query;
 
  var ObjectId = require('mongodb').ObjectId; 
  var id = queryData.powderId;       
  var o_id = new ObjectId(id);



 console.log("Deleting Powder..." + queryData.powderId);
 



 	MongoClient.connect(url, function(err, db) {
			  if (err) throw err;
			  var query = { "_id": o_id };
			  console.log("deleting " + query._id );
			  console.log("query var " + JSON.stringify(query) );
			  db.collection("powders").remove(query,function(err, result) {
				  
				      if (err) throw err;
				      console.log(result);
				      db.close();
				    });
			  
		}); 

 	res.redirect('listPowders');

//res.send(200, req.body);
 // res.render('addPowder', { title: 'Add Powder', powder: ['IMR 800x', 'Bullseye', 'Clays', 'SR4756']});
 //res.send(200,req.body);
})	



// ########################################################################## //
// **************************** Load Section ******************************** //
// ########################################################################## //



app.get('/addLoads', (req, res) => {
	  //console.log(req.body)
	
	
	 console.log('in addloads'); 
	 var calibers = 'waiting'; 
	 var powders = null;
	
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
	        // var query = { address: "Park Lane 38" };
	        db.collection("calibers").find().toArray(function(err, resultCals) {

			if (err) throw err;
		        console.log(resultCals);
		        console.log("got calibers for dropdown");
		        db.close();


		        //  #### start nest of powder dropdown here ####
		
			MongoClient.connect(url, function(err, db) {
				if (err) throw err;	
				// var query = { address: "Park Lane 38" };	
				db.collection("powders").find().toArray(function(err, resultPows) {	
					if (err) throw err;
					console.log(resultPows);
					console.log("got powders for dropdown");
					db.close();

					res.render('addLoads', { title: 'Add Loads', caliber: resultCals, powder: resultPows } );

		            	});


			});

		});
	
	});

});

app.post('/addLoads', (req, res) => {
	  //console.log(req.body)
	
	 console.log("Adding a new load...");
	 
	
	MongoClient.connect(url, function(err, db) {
		  if (err) throw err;
		  var item = { 
		        "loadDescription":req.body.loadDescription,
		        "loadCaliber":req.body.loadCaliber,
		        "loadPowder":req.body.loadPowder,
		        "loadPowderWeight":req.body.loadPowderWeight,
		        "loadBullet":req.body.loadBullet,
		        "loadBulletDiameter":req.body.loadBulletDiameter,
		        "loadBulletComposition":req.body.loadBulletComposition
		  };
		  
		db.collection("loads").insertOne(item, function(err, res) {
			      if (err) throw err;
			      console.log("1 document inserted");
			      db.close();
			    });
	}); 
	
	res.redirect('/listLoads')
	 //res.send(200,req.body);
})


app.get('/listLoads', function (req, res) {
	console.log("entered into list loads route");
	
        MongoClient.connect(url, function(err, db) {
		if (err) throw err;
                var query = { address: "Park Lane 38" };
                db.collection("loads").find().toArray(function(err, result) {

	                if (err) throw err;
	                console.log(result);
	                console.log("got load summaries");
			db.close();
    
        		res.render('listLoads', { title: 'Loads', data: result });
        	});
    	});

});

app.get('/detailLoad', function (req, res) {
	console.log("entered into load details route " + req.query.loadId);
	
	
	var ObjectId = require('mongodb').ObjectId; 
  	
  	var id = req.query.loadId;       
    
  	//var id = "5a3eb34ba0894762a6c258ea";
    var o_id = new ObjectId(id);


	var attrVal= {"_id":o_id}

	/*
	var params = {
		    TableName: "Loads",
	        KeyConditionExpression: "#uuid = :uuid",

	        ExpressionAttributeNames:{

	            "#uuid": "loadUUID"

	            },

	        ExpressionAttributeValues: {

	            ":uuid":attrVal

	            }

	        };
	*/


	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
        db.collection("loads").find(attrVal).toArray(function(err, result) {

			if (err) throw err;
	        console.log(result);
	        console.log("got load summaries");
	        db.close();

	        // Looking up comments for load

	        var commentQuery = {
	        	'loadId': id
	        }


	        MongoClient.connect(url, function(err, db) {
				if (err) throw err;
        		//var query = { address: "Park Lane 38" };
        		db.collection("comments").find(commentQuery).toArray(function(err, resultComments) {

					if (err) throw err;
	        		console.log(result);
	        		console.log("got comments");
	        		db.close();

	        		res.render('detailLoad', { title: 'Load Detail', data: result, comments: resultComments });
	        	});

	        });





		});
	});


});


app.post('/addLoadComments', (req, res) => {
	  //console.log(req.body)
	
	 console.log("Adding a load comment...");
	 
	
	MongoClient.connect(url, function(err, db) {
		  if (err) throw err;
		  var item = { 
		        "loadId":req.body.loadId,
		        "loadComment":req.body.loadComment,
		        //"loadCommentTimestamp": Date.now()
		  };
		
		console.log("inserting " + JSON.stringify(item));
		db.collection("comments").insertOne(item, function(err, res) {
			      if (err) throw err;
			      console.log("1 comment inserted");
			      db.close();
			    });
	}); 
	
	res.redirect('detailLoad?loadId=' + req.body.loadId)
	 //res.send(200,req.body);
})


// /\/\/\/\/\/\/\/\/\/\/\/\/


app.get('/editLoad', (req, res) => {
  //console.log(req.body)
  
  var queryurl = require('url'); 
  var queryData = queryurl.parse(req.url, true).query;
 
  var ObjectId = require('mongodb').ObjectId; 
  var id = queryData.loadId;       
  var o_id = new ObjectId(id);



 console.log("Editing Load..." + queryData.loadId);
 



 	MongoClient.connect(url, function(err, db) {
			  if (err) throw err;
			  var query = { "_id": o_id };
			  console.log("Looking up " + query._id );
			  console.log("query var " + JSON.stringify(query) );
			  db.collection("loads").find(query).toArray(function(err, result) {
				  
				      if (err) throw err;
				      console.log(result);
				      db.close();

			
				
        	  res.render('editLoad', { title: 'Edit Load', data: result, foo: "bar" });
			  });
	}); 


// /\/\/\/\/\/


MongoClient.connect(url, function(err, db) {
		if (err) throw err;
	        // var query = { address: "Park Lane 38" };
	        db.collection("calibers").find().toArray(function(err, resultCals) {

			if (err) throw err;
		        console.log(resultCals);
		        console.log("got calibers for dropdown");
		        db.close();


		        //  #### start nest of powder dropdown here ####
		
			MongoClient.connect(url, function(err, db) {
				if (err) throw err;	
				// var query = { address: "Park Lane 38" };	
				db.collection("powders").find().toArray(function(err, resultPows) {	
					if (err) throw err;
					console.log(resultPows);
					console.log("got powders for dropdown");
					db.close();

					//res.render('addLoads', { title: 'Add Loads', caliber: resultCals, powder: resultPows } );

					MongoClient.connect(url, function(err, db) {
			  			if (err) throw err;
			  			var query = { "_id": o_id };
			  			console.log("Looking up " + query._id );
			  			console.log("query var " + JSON.stringify(query) );
			  			db.collection("loads").find(query).toArray(function(err, result) {
				  
				      		if (err) throw err;
				      		console.log(result);
				      		db.close();

			
				
        	  			res.render('editLoad', { title: 'Edit Load', data: result, caliber: resultCals, powder: resultPows });
			  			
			  			});
					}); 

		        });


				// #### in addition to finding calibers and powders ###
				// now we have to lookup the current load attributes



			});

		});
	
	});


// /\/\/\/\/\/\/


//res.send(200, req.body);
 // res.render('addPowder', { title: 'Add Powder', powder: ['IMR 800x', 'Bullseye', 'Clays', 'SR4756']});
 //res.send(200,req.body);
})	


app.post('/editLoad', (req, res) => {
	  //console.log(req.body)
	
	  
	 console.log("updating an item...");
	 
	var ObjectId = require('mongodb').ObjectId; 
  	
  	var id = req.body.loadId;       
    
    var o_id = new ObjectId(id);

    console.log("incoming id is " + id);

	var myQuery = { _id: o_id };
	var newVals = { 
		        "loadDescription":req.body.loadDescription,
		        "loadCaliber":req.body.loadCaliber,
		        "loadPowder":req.body.loadPowder,
		        "loadPowderWeight":req.body.loadPowderWeight,
		        "loadBullet":req.body.loadBullet,
		        "loadBulletDiameter":req.body.loadBulletDiameter,
		        "loadBulletComposition":req.body.loadBulletComposition
		  };

	MongoClient.connect(url, function(err, db) {
		  if (err) throw err;
			  
		  db.collection("loads").updateOne(myQuery, newVals, 
		  		function(err, res) {
			    	if (err) throw err;
			      	console.log("1 document inserted");
			     	db.close();

			    });

	}); 

	res.redirect('/listLoads')
});
		


app.get('/deleteLoad', (req, res) => {
  //console.log(req.body)
  
  var queryurl = require('url'); 
  var queryData = queryurl.parse(req.url, true).query;
 
  var ObjectId = require('mongodb').ObjectId; 
  var id = queryData.loadId;       
  var o_id = new ObjectId(id);



 console.log("Deleting Load..." + queryData.loadId);
 



 	MongoClient.connect(url, function(err, db) {
			  if (err) throw err;
			  var query = { "_id": o_id };
			  console.log("deleting " + query._id );
			  console.log("query var " + JSON.stringify(query) );
			  db.collection("loads").remove(query,function(err, result) {
				  
				      if (err) throw err;
				      console.log(result);
				      db.close();
				    });
			  
		}); 

 	res.redirect('listLoads');

//res.send(200, req.body);
 // res.render('addPowder', { title: 'Add Powder', powder: ['IMR 800x', 'Bullseye', 'Clays', 'SR4756']});
 //res.send(200,req.body);
})	

// /\/\/\/\/\/\/\/\/\/\/\//\







// all environments
app.set('port', process.env.PORT || 3002);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

//console.log(path.join(__dirname, 'public'));
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/qwerty', asdf.ffff);


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
