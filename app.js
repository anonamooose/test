
 	
var deployment = process.env.DEPLOYMENT;
console.log("deployment is " + deployment);
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , asdf = require('./routes/asdf')
  , http = require('http')
  , path = require('path')
  , bodyParser = require('body-parser')
  , mongoose = require('mongoose');

const uuidv1 = require('uuid/v1');
const sanitize = require('sanitize');

var AWS = require("aws-sdk");
AWS.config.update({
    region: "us-west-2",
	accessKeyId: "AWS_ACCESS_KEY_ID",
	  secretAccessKey: "AWS_SECRET_ACCESS_KEY",
    endpoint: "http://localhost:8000"});

var dynamodb = new AWS.DynamoDB();

var MongoClient = require('mongodb').MongoClient;
//var url = "mongodb://10.6.6.22:27017/handloads";
var url = "mongodb://handloads666:mWCDPoa9MX8HdPtQHch8G3197mGMbSJC3FjfxtjJGxGXjCanL5IIYRgCi0xfoF2K8xrqS6wiH9ZI1cT1Ve3ZxA==@handloads666.documents.azure.com:10255/handloads?ssl=true&replicaSet=globaldb";

	
var db2 = mongoose.connect("mongodb://handloads666.documents.azure.com:10255/handloads?ssl=true&replicaSet=globaldb", {
	auth: {
	      user: 'handloads666',
	      password: 'mWCDPoa9MX8HdPtQHch8G3197mGMbSJC3FjfxtjJGxGXjCanL5IIYRgCi0xfoF2K8xrqS6wiH9ZI1cT1Ve3ZxA=='
	    }
	})
.then(() => console.log('connection successful'))
.catch((err) => console.error(err));


var loads = mongoose.model('Loads',
		new mongoose.Schema({loadDescription: String,loadCaliber: String,loadPowder: String}),
		'loads');

var app = express();

var session = require('express-session');
//mongoose.connect('mongodb://localhost/test');
const sessionConfig = {
  resave: false,
  saveUninitialized: false,
  //secret: config.get('SECRET'),
  secret: 'SECRET',
  signed: true
};

app.use(session(sessionConfig));
app.use(sanitize.middleware);
app.use(bodyParser.urlencoded({extended: true}))
app.use(addTemplateVariables);


const passport = require('passport');


const GoogleStrategy = require('passport-google-oauth20').Strategy;

function extractProfile (profile, req) {
  let imageUrl = '';
  if (profile.photos && profile.photos.length) {
    imageUrl = profile.photos[0].value;
  }
  console.log("i'm in the extractprofile function, ID= " + profile.id);
  console.log('i got back ' + JSON.stringify(profile));


  return {
    id: profile.id,
    displayName: profile.displayName,
    emails: profile.emails

  };

}



// Configure the Google strategy for use by Passport.js.
//
// OAuth 2-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Google API on the user's behalf,
// along with the user's profile. The function must invoke `cb` with a user
// object, which will be set at `req.user` in route handlers after
// authentication.

// set callback URL from deployment variable
if (deployment == 'local') {
	callbackURL='http://localhost:8666/auth/google/callback'
} else {
	callbackURL='https://myloads.azurewebsites.net/auth/google/callback'	
}

console.log("callbackurl is " + callbackURL);

passport.use(new GoogleStrategy({
//  clientID: config.get('OAUTH2_CLIENT_ID'),
//  clientSecret: config.get('OAUTH2_CLIENT_SECRET'),
// callbackURL: config.get('OAUTH2_CALLBACK'),
clientID: '727273173081-9llriue33krrtn0cb9bqrgj9r13aibci.apps.googleusercontent.com',
clientSecret: 'Seh3oFkCpJvi2IbbQmO-pXFY',
callbackURL: callbackURL,

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

function adminRequired (req,res,next) {
	if (!req.session.admin) {
		res.redirect('/adminRequired.html');
	} else {
		next();
	}
}

// Middleware that exposes the user's profile as well as login/logout URLs to
// any templates. These are available as `profile`, `login`, and `logout`.
function addTemplateVariables (req, res, next) {
  if (typeof(req.user) !== 'undefined') { // can only add variables if logged in
	  console.log('hit addtemplatevars req.user = ' + JSON.stringify(req.user));
	  res.locals.profile = req.user;
	  res.locals.login = `/auth/login?return=${encodeURIComponent(req.originalUrl)}`;
	  res.locals.logout = `/auth/logout?return=${encodeURIComponent(req.originalUrl)}`;
	  console.log("Session vars " + JSON.stringify(req.session) + " user: " + req.session.passport.user.displayName );
  } else {
	  console.log("in addtemplatevars no req.user");
  }
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

  	console.log("user authenticated and received IdP profile... in callback");
    console.log('req var= ' + JSON.stringify(req.user));
    console.log("looking up user " + req.user.id + " in authorization table");
    MongoClient.connect(url, function(err, db, preferredName) {
		if (err) throw err;
		var query = { userIdPId: req.user.id };
		db.collection("users").find(query).toArray(function(err, result, preferredName) {

	        if (err) throw err;
	        console.log(result);
	        db.close();
		    
		    console.log("found user" + JSON.stringify(result));
		    console.log("length " + result.length)
		    if (result.length != 0) {
		    	console.log("found user... adding preferredName and userClass to profile variable");

		    	//req.user.userClass = result[0].userClass;
		    	//req.user.preferredDisplayName = result[0].preferredDisplayName;

		    	if (result[0].userClass === 'admin') {
		    		console.log("logged in user is an admin"); 
		    		req.session.admin = true;
		    	} else {
		    		console.log("logged in user is NOT an admin");
		    		req.session.admin = false;
		    	}

		    	// redirect to originally requested page
		    	const redirect = req.session.oauth2return || '/';
    			delete req.session.oauth2return;
    			res.redirect(redirect);

		    } else {
		    	
		    	// grab data from assertion and store into session variable
		    	// to use for the registration data

		    	req.session.userIdPId = req.user.id;
		    	req.session.userIdPDisplayName = req.user.displayName;
		    	req.session.userIdPEmail = req.user.emails[0].value;
		    	console.log("req.user before logout = " + JSON.stringify(req.user));

			    req.logout();
		    	console.log("in callback... req.session = " + JSON.stringify(req.session));
		    	console.log("req.user after logout = " + JSON.stringify(req.user));
		    	res.redirect('/register');
		    }
	    });
    });





  }
);


app.get('/logout', function(req, res) {
    console.log("logged out!");
    req.logout();
    res.redirect('https://accounts.google.com/logout');
});

app.get('/register', function(req, res) {
    console.log("logged out!");
    res.render('register', { user: req.session, title: 'Add User'});
});

app.post('/register', function(req, res) {
    console.log("registration post");
    //req.logout();


	MongoClient.connect(url, function(err, db) {
		  if (err) throw err;
		  var item = { 
			  "userIdPId":req.body.userIdPId,  
		      "userIdPEmail":req.body.userIdPEmail,
			  "preferredDisplayName":req.body.preferredDisplayName,
			  "userIdPDisplayName":req.body.userIdPDisplayName,
			  "status": "pending"
		  };
		  db.collection("pendingusers").insertOne(item, function(err, res) {
			      if (err) {
			      	throw err;
			      }
			      db.close();
			      console.log("1 user inserted");
		  });

	}); 
	res.redirect('/registrationsuccess.html');
})	
	





/*
app.get('/auth/acs', function(req, res) {
    
// added to callback function
});
*/

// ########################################################################## //
// **************************** User Section ******************************** //
// ########################################################################## //


app.get('/processRegistration', adminRequired, function(req, res) {
    console.log("process registration");


	if (req.session.admin) {
		console.log("I'm an admin");
		console.log("action var= " + req.query.action + 'xxx');

			
		// update status accordingly

		var myQuery = { userIdPId: req.query.IdPId };
		var newVals = { $set:
						{
							"status": req.query.action 
						}
					};

							

  		console.log("update payload " + JSON.stringify(newVals));

		MongoClient.connect(url, function(err, db) {
			  if (err) throw err;
				  
			  db.collection("pendingusers").updateOne(myQuery, newVals, 
			  		function(err, res) {
				    	if (err) throw err;
				      	console.log("1 document inserted");
				     	db.close();

				    });

		}); 


		if (req.query.action === 'approve') {
			console.log("approving request");


			MongoClient.connect(url, function(err, db) {
				if (err) throw err;
				var query = { userIdPId: req.query.IdPId };
				db.collection("pendingusers").find(query).toArray(function(err, result) {

		            if (err) throw err;
		            console.log("found pending user data " + JSON.stringify(result));
		            db.close();
				

					// insert into users DB

					MongoClient.connect(url, function(err, db) {
						  if (err) throw err;
						  var item = { 
							  "userIdPId":result[0].userIdPId,  
						      "IdPDisplayName":result[0].userIdPDisplayName,
							  "preferredDisplayName":result[0].preferredDisplayName,
							  "userIdPEmail":result[0].userIdPEmail,
							  "userClass":"user"
						  };
						  db.collection("users").insertOne(item, function(err, res) {
							      if (err) throw err;
							      console.log("1 user inserted");
							      db.close();
							    });
					}); 
			    });
		    });


		} else {
			console.log("denying request");
		}
		


	} else {
		console.log("I'm not an admin"); // this code should never be hit
	}
	return res.redirect('/listUsers');
})	



app.get('/addUser', authRequired, (req, res) => {
	  //console.log(req.body)
	  
	 console.log("Adding a new user...");
	 

	 res.render('addUser', { title: 'Add User'});
	 //res.send(200,req.body);
})	
	
	
app.post('/addUser', authRequired, adminRequired, (req, res) => {
	  //console.log(req.body)



	MongoClient.connect(url, function(err, db) {
		  if (err) throw err;
		  var item = { 
			  "userIdPId":req.body.userIdPId,  
		      "IdPDisplayName":req.body.IdPDisplayName,
			  "preferredDisplayName":req.body.preferredDisplayName,
			  "userClass":req.body.userClass
		  };
		  db.collection("users").insertOne(item, function(err, res) {
			      if (err) throw err;
			      console.log("1 user inserted");
			      db.close();
			    });
	}); 



	  
	  
	 console.log("Adding a new user...");
	 
	 res.redirect('/listUsers')
	 //res.send(200,req.body);
})

app.get('/listUsers', authRequired, adminRequired, function (req, res) {
	console.log("entered into list user route");
       
	MongoClient.connect(url, function(err, db) {
		if (err) throw err;
		var query = { address: "Park Lane 38" };
		db.collection("users").find().toArray(function(err, result) {

            if (err) throw err;
            console.log(result);
            db.close();
		

			MongoClient.connect(url, function(err, db) {
				if (err) throw err;
				var query = { address: "Park Lane 38" };
				db.collection("pendingusers").find().toArray(function(err, pendingusersresult) {

            		if (err) throw err;
            		console.log(result);
            		db.close();
			

					res.render('listUsers', { title: 'Users', data: result, pending: pendingusersresult });
	    		});
    		});
	    });
    });


});





// /\/\/\/\/\/\/


app.get('/editUser', authRequired, (req, res) => {
  //console.log(req.body)
  
  var queryurl = require('url'); 
  var queryData = queryurl.parse(req.url, true).query;
 
  var ObjectId = require('mongodb').ObjectId; 
  var id = queryData.userId;       
  var o_id = new ObjectId(id);



 console.log("Editing User..." + queryData.userId);
 



 	MongoClient.connect(url, function(err, db) {
			  if (err) throw err;
			  var query = { "_id": o_id };
			  console.log("Looking up " + query._id );
			  console.log("query var " + JSON.stringify(query) );
			  db.collection("users").find(query).toArray(function(err, result) {
				  
				      if (err) throw err;
				      console.log(result);
				      db.close();

			
				
        res.render('editUser', { title: 'Edit User', data: result, foo: "bar" });
				    });
		}); 


//res.send(200, req.body);
 // res.render('addPowder', { title: 'Add Powder', powder: ['IMR 800x', 'Bullseye', 'Clays', 'SR4756']});
 //res.send(200,req.body);
})	


app.post('/editUser', authRequired, (req, res) => {
	  //console.log(req.body)
	
	  
	 console.log("updating a user...");
	 
	var ObjectId = require('mongodb').ObjectId; 
  	
  	var id = req.body.userId;       
    
  	//var id = "5a3eb34ba0894762a6c258ea";
    var o_id = new ObjectId(id);

    console.log("incoming id is " + id);

    //var o_id = "5a3eb34ba0894762a6c258ea";

	var myQuery = { _id: o_id };
	var newVals = { 
	  	"userIdPId":req.body.userIdPId,  
		"IdPDisplayName":req.body.IdPDisplayName,
		"preferredDisplayName":req.body.preferredDisplayName,
		"userIdPEmail":req.body.userIdPEmail,
		"userClass": req.body.userClass
  	};






	MongoClient.connect(url, function(err, db) {
		  if (err) throw err;
			  
		  db.collection("users").updateOne(myQuery, newVals, 
		  		function(err, res) {
			    	if (err) throw err;
			      	console.log("1 document inserted");
			     	db.close();

			    });

	}); 

	res.redirect('/listUsers')
});
		


app.get('/deleteUser', authRequired, (req, res) => {
  //console.log(req.body)
  
  var queryurl = require('url'); 
  var queryData = queryurl.parse(req.url, true).query;
 
  var ObjectId = require('mongodb').ObjectId; 
  var id = queryData.userId;       
  var o_id = new ObjectId(id);



 console.log("Deleting User..." + id);
 



 	MongoClient.connect(url, function(err, db) {
			  if (err) throw err;
			  var query = { "_id": o_id };
			  console.log("deleting " + query._id );
			  console.log("query var " + JSON.stringify(query) );
			  db.collection("users").remove(query,function(err, result) {
				  
				      if (err) throw err;
				      console.log(result);
				      db.close();
				    });
			  
		}); 

 	res.redirect('listUsers');

})	





// /\/\/\/\/\/\/\









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
   
    var loadCal = req.queryString('loadCal');
	console.log('loadCal from querystring = ' + loadCal);
        MongoClient.connect(url, function(err, db) {
		if (err) throw err;
				var query;
                if (loadCal != null) {
                	query = { loadCaliber: loadCal };
                } else {
                	query = null;
                }
				
                db.collection("loads").find(query).toArray(function(err, result) {

	                if (err) throw err;
	                console.log(result);
	                console.log("got load summaries");
			db.close();  
        		res.render('listLoads', { title: 'Loads', data: result });
        	});
    	});

});

app.get('/listLoadCals', addTemplateVariables, function (req, res) {
	console.log("entered into list load cals route");
	
        
	/*var db2 = mongoose.connection;
	db2.on('error', console.error.bind(console, 'connection error:'));
	db2.once('open', function() {
	  // we're connected!
		console.log("were connected");

		
	});
	*/	
	
	loads.find(function (err, loads) {
		  if (err) return console.error(err);
		  console.log("dumping loads from mongoose");
		  console.log(loads);
		  console.log("done with mongoose");
		  
			// Make distinct
			
		  var unique = Object.create(null); // empty object, no inheritance
		  for (var i = 0; i < loads.length; i++) {
		      var loadCal = loads[i]['loadCaliber'];
		      if (true) {
		          if (!(loadCal in unique)) { // not seen this `full name` before
		              unique[loadCal] = loads[i];
		        	 // unique[loadCal] = "burrito";
		          } 
		      }
		  }
			
			console.log("dumping unique loads");
			console.log("done with unique loads");
			res.render('listLoadCals', { title: 'Loads', data: unique });
		  
		})
		

		  
	

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
app.set('port', process.env.PORT || 8666);
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

