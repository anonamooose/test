var AWS = require("aws-sdk");
var fs = require('fs');

AWS.config.update({
    region: "us-west-2",
    endpoint: "http://localhost:8000"
});

var docClient = new AWS.DynamoDB.DocumentClient();

console.log("Importing known calibers into DynamoDB. Please wait.");

var allCalibers = JSON.parse(fs.readFileSync('caliberdata.json', 'utf8'));
allCalibers.forEach(function(caliber) {
    var params = {
        TableName: "Calibers",
        Item: {
            "calName":  caliber.calName,
            "title": caliber.title,
            "info":  caliber.info
        }
    };

    docClient.put(params, function(err, data) {
       if (err) {
           console.error("Unable to add movie", caliber.calName, ". Error JSON:", JSON.stringify(err, null, 2));
       } else {
           console.log("PutItem succeeded:", caliber.calName);
       }
    });
});

