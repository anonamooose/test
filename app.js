
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




var app = express();

app.use(bodyParser.urlencoded({extended: true}))



app.get('/asdf', function (req, res) {
    console.log("entered into dynadb route");
    dynamodb.listTables(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {

            res.send(data);

        }

    });
});
//var result;


app.get('/addCaliber', (req, res) => {
	  //console.log(req.body)
	  
	 console.log("Adding a new caliber...");
	 

	 res.render('addCaliber', { title: 'Add Caliber'});
	 //res.send(200,req.body);
	})	
	
	
app.post('/addCaliber', (req, res) => {
	  //console.log(req.body)
	
	var docClient = new AWS.DynamoDB.DocumentClient(); 
	var params = {
    TableName:"Calibers",
    	Item:{
    		"calName":req.body.calName,
    		"calClass":req.body.calClass,
    		"caseType":req.body.caseType,
    		"primerType":req.body.primerType
    	}
    };
	  
	 console.log(params); 
	  
	 console.log("Adding a new item...");
	 
	 docClient.put(params, function(err, data) {
		    if (err) {
		        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
		    } else {
		        console.log("Added item:", JSON.stringify(data, null, 2));
		    }
		});
	 res.redirect('/listCalibers')
	 //res.send(200,req.body);
	})

app.get('/listCalibers', function (req, res) {
	console.log("entered into list route");
	var params = {
		    TableName: "Calibers",
		    Select: 'ALL_ATTRIBUTES',
		    Limit: 100
		};

    dynamodb.scan(params, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            //return next(err);
        } else {
            console.log(data);           // successful response
            //result = data;
            //res.send(200 , data);
            //return next();
        
    
        res.render('calibers', { title: 'Calibers', data: data['Items'] });
        }
    });

});


	
	
	
	
	
	
	
	app.get('/addPowder', (req, res) => {
	  //console.log(req.body)
	  
	 console.log("Adding a new Powder...");
	 

	 res.render('addPowder', { title: 'Add Powder', powder: ['IMR 800x', 'Bullseye', 'Clays', 'SR4756']});
	 //res.send(200,req.body);
	})	

	app.post('/addPowder', (req, res) => {
	  //console.log(req.body)
	
	var docClient = new AWS.DynamoDB.DocumentClient(); 
	var params = {
    TableName:"Powders",
    	Item:{
    		"powderName":req.body.powderName,
    		"powderBrand":req.body.powderBrand,
    		"powderClass":req.body.powderClass,
    		"powderNotes":req.body.powderNotes
    	}
    };
	  
	 console.log(params); 
	  
	 console.log("Adding a new item...");
	 
	 docClient.put(params, function(err, data) {
		    if (err) {
		        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
		    } else {
		        console.log("Added item:", JSON.stringify(data, null, 2));
		    }
		});
	 res.redirect('/listPowders')
	 //res.send(200,req.body);
})

app.get('/listPowders', function (req, res) {
	console.log("entered into list powder route");
	
	var params = {
		    TableName: "Powders",
		    Select: 'ALL_ATTRIBUTES',
		    Limit: 100
		};

    dynamodb.scan(params, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            //return next(err);
        } else {
            console.log(data);           // successful response
            //result = data;
            //res.send(200 , data);
            //return next();
        
    
        res.render('listPowders', { title: 'Powders', data: data['Items'] });
        }
    });

});

	
	

app.get('/addLoads', (req, res) => {
	  //console.log(req.body)
	
	
	 console.log('in addloads'); 
	 var calibers = 'waiting'; 
	 var powders = null;
	 
	 // getting Calibers for dropdown
	 var calibers = {
			    TableName: "Calibers",
			    Select: 'ALL_ATTRIBUTES',
			    Limit: 100
			};

	    dynamodb.scan(calibers, function(err, caldata) {
	        if (err) {
	            console.log(err, err.stack); // an error occurred
	            //return next(err);
	        } else {
	            console.log("setting calibers");
	            console.log('Caliber ' + JSON.stringify(caldata))
	            
	            // can I nest a scan here to handle async?
	       	 	var powders = {
	 			    TableName: "Powders",
	 			    Select: 'ALL_ATTRIBUTES',
	 			    Limit: 100
	 			};

	       	    dynamodb.scan(powders, function(err, powdata) {
	       	        if (err) {
	       	            console.log(err, err.stack); // an error occurred
	       	            //return next(err);
	       	        } else {
	       	            console.log('Powderdat ' + JSON.stringify(powdata));           // successful response
	       	            //result = data;
	       	            //res.send(200 , data);
	       	            //return next();
	       	         res.render('addLoads', { title: 'Add Loads', caliber: caldata['Items'], powder: powdata['Items'] } );
	       	    
	       	        //res.render('listPowders', { title: 'Powders', data: data['Items'] });
	       	        }
	       	    });
	       	 	
	       	 	
	            
	            
	            
	       	 
	        }
	       // console.log(data);    
	    });
       // console.log(data);  
        console.log('asdfasf' + calibers)
       // successful response	          

	 //res.send(200,req.body);
});

app.post('/addLoads', (req, res) => {
	  //console.log(req.body)
	
	var docClient = new AWS.DynamoDB.DocumentClient(); 
	var params = {
  TableName:"Loads",
  	Item:{
  		"loadUUID":uuidv1(),
  		"loadName":req.body.loadName,
  		"loadDescription":req.body.loadDescription,
  		"loadCaliber":req.body.loadCaliber,
  		"loadPowder":req.body.loadPowder
  	}
  };
	  
	 console.log(params); 
	  
	 console.log("Adding a new load...");
	 
	 docClient.put(params, function(err, data) {
		    if (err) {
		        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
		    } else {
		        console.log("Added item:", JSON.stringify(data, null, 2));
		    }
		});
	 res.redirect('/listLoads')
	 //res.send(200,req.body);
})


app.get('/listLoads', function (req, res) {
	console.log("entered into list loads route");
	
	var params = {
		    TableName: "Loads",
		    Select: 'ALL_ATTRIBUTES',
		    Limit: 100
		};

    dynamodb.scan(params, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            //return next(err);
        } else {
            console.log(data);           // successful response
            //result = data;
            //res.send(200 , data);
            //return next();
        
    
        res.render('listLoads', { title: 'Loads', data: data['Items'] });
        }
    });

});

app.get('/detailLoad', function (req, res) {
	console.log("entered into list loads route" + req.query.loadUUID);
	
	var attrVal= {"S":req.query.loadUUID}
	
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

    dynamodb.query(params, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            //return next(err);
        } else {
            console.log(data);           // successful response
            //result = data;
            //res.send(200 , data);
            //return next();
        
    
        res.render('DetailLoad', { title: 'Load Detail', data: data['Items'] });
        }
    });

});


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
