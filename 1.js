var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://10.6.6.22:27017/handloads";

MongoClient.connect(url, function(err, db) {
	  if (err) throw err;
	  var query = { address: "Park Lane 38" };
	  db.collection("powders").find(query).toArray(function(err, result) {
		      if (err) throw err;
		      console.log(result);
		      db.close();
		    });
}); 
