
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

var session = require('express-session')

const sessionConfig = {
  resave: false,
  saveUninitialized: false,
  //secret: config.get('SECRET'),
  secret: 'SECRET',
  signed: true
};

app.use(session(sessionConfig));


app.use(bodyParser.urlencoded({extended: true}))




const passport = require('passport');


const GoogleStrategy = require('passport-google-oauth20').Strategy;

function extractProfile (profile) {
  let imageUrl = '';
  if (profile.photos && profile.photos.length) {
    imageUrl = profile.photos[0].value;
  }
  return {
    id: profile.id,
    displayName: profile.displayName,
    image: imageUrl
  };
}

// Configure the Google strategy for use by Passport.js.
//
// OAuth 2-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Google API on the user's behalf,
// along with the user's profile. The function must invoke `cb` with a user
// object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(new GoogleStrategy({
//  clientID: config.get('OAUTH2_CLIENT_ID'),
//  clientSecret: config.get('OAUTH2_CLIENT_SECRET'),
// callbackURL: config.get('OAUTH2_CALLBACK'),
clientID: '727273173081-9llriue33krrtn0cb9bqrgj9r13aibci.apps.googleusercontent.com',
clientSecret: 'Seh3oFkCpJvi2IbbQmO-pXFY',
callbackURL: 'http://www.xcryptolab.com/auth/google/callback',

  accessType: 'offline'
}, (accessToken, refreshToken, profile, cb) => {
  // Extract the minimal profile information we need from the profile object
  // provided by Google
  cb(null, extractProfile(profile));
}));

passport.serializeUser((user, cb) => {
  cb(null, user);
});
passport.deserializeUser((obj, cb) => {
  cb(null, obj);
});


// Middleware that requires the user to be logged in. If the user is not logged
// in, it will redirect the user to authorize the application and then return
// them to the original URL they requested.
function authRequired (req, res, next) {
  if (!req.user) {
    req.session.oauth2return = req.originalUrl;
    console.log("req variable dump: " + JSON.stringify(req.originalUrl));
    console.log("lastindex" + (req.originalUrl.lastIndexOf("/auth", 0) === 0))
    if (req.originalUrl.lastIndexOf("/auth", 0) === 0) {
    	console.log("found auth request, skipping login");
    	//next();
    } else {
    	console.log("found page that needs auth, redirecting");
		return res.redirect('/auth/login');
  	}
  }

  next();
}

// Middleware that exposes the user's profile as well as login/logout URLs to
// any templates. These are available as `profile`, `login`, and `logout`.
function addTemplateVariables (req, res, next) {
  res.locals.profile = req.user;
  res.locals.login = `/auth/login?return=${encodeURIComponent(req.originalUrl)}`;
  res.locals.logout = `/auth/logout?return=${encodeURIComponent(req.originalUrl)}`;
  console.log("Session vars " + JSON.stringify(req.session) + " user: " + res.user );
  next();
}





app.use(passport.initialize());
app.use(passport.session());



//app.use(authRequired);


app.get(
  // Login url
  '/auth/login',

  // Save the url of the user's current page so the app can redirect back to
  // it after authorization
  (req, res, next) => {
    if (req.query.return) {
      req.session.oauth2return = req.query.return;
    }
    next();
  },

  // Start OAuth 2 flow using Passport.js
  passport.authenticate('google', { scope: ['email', 'profile'] })
);





app.get('/', (req, res) => {
	// redirect root to listLoads
	
	res.redirect('/listLoads')

})


app.get(
  // OAuth 2 callback url. Use this url to configure your OAuth client in the
  // Google Developers console
  '/auth/google/callback',

  // Finish OAuth 2 flow using Passport.js
  passport.authenticate('google'),

  // Redirect back to the original page, if any
  (req, res) => {
    const redirect = req.session.oauth2return || '/';
    delete req.session.oauth2return;
    res.redirect(redirect);
  }
);


app.get('/logout', function(req, res) {
    console.log("logged out!");
    req.logout();
    res.redirect('https://www.google.com');
});







// ########################################################################## //
// *************************** Caliber Section ******************************* //
// ########################################################################## //



app.get('/addCaliber', authRequired, (req, res) => {
	  //console.log(req.body)
	  
	 console.log("Adding a new caliber...");
	 

	 res.render('addCaliber', { title: 'Add Caliber'});
	 //res.send(200,req.body);
})	
	
	
app.post('/addCaliber', authRequired, (req, res) => {
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

app.get('/listCalibers', authRequired, function (req, res) {
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


app.get('/editCaliber', authRequired, (req, res) => {
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


app.post('/editCaliber', authRequired, (req, res) => {
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
		


app.get('/deleteCaliber', authRequired, (req, res) => {
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
	


	
	app.get('/addPowder', authRequired, (req, res) => {
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

app.get('/listPowders', authRequired, function (req, res) {
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

	
	
app.get('/editPowder', authRequired, (req, res) => {
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


app.post('/editPowder', authRequired, (req, res) => {
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
		


app.get('/deletePowder', authRequired, (req, res) => {
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



app.get('/addLoads', authRequired, (req, res) => {
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

app.post('/addLoads', authRequired, (req, res) => {
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

app.get('/detailLoad', authRequired, addTemplateVariables, function (req, res) {
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


app.post('/addLoadComments', authRequired, (req, res) => {
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


app.get('/editLoad', authRequired, (req, res) => {
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


app.post('/editLoad', authRequired, (req, res) => {
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
app.set('port', process.env.PORT || 80);
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

