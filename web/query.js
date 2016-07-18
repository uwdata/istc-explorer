/*
//example of how to use the bdRelationalQuery function
var query = "select longitude from sampledata.station_info limit 10";
bdRelationalQuery(query,function(rows) {
  $("#data").text(JSON.stringify(rows));
});
*/

// sqlString: a sql query (with no bigdawg outer syntax
// callback: function to call with result rows as the input
// result format: [{"field1":"val","field2":"val",...},{"field1":"val",...},...]
function bdRelationalQuery(sqlString,callback) {
  var queryString = "bdrel("+sqlString+");";
  bdRaw(queryString,callback);
};

// bigDawgQuery: a fully-functional big dawg query (with all necessary syntax)
// callback: function to call with result rows as the input
// result format: [{"field1":"val","field2":"val",...},{"field1":"val",...},...]
function bdRaw(bigDawgQuery,callback) {
  //console.log(queryString);
  $.post("http://localhost:8080/bigdawg/query",JSON.stringify(bigDawgQuery),function(result){
    var lines = result.split("\n");
    //console.log(lines);
    var rows = [];
    var fields = lines[0].split("\t");
    for(var i = 1; i < lines.length; i++) {
      var line = lines[i];
      if(line.length > 0) {
        var row = {};
        var vals = line.split("\t")
        for(var j = 0; j < vals.length; j++) {
          row[fields[j]] = vals[j];
        }
        rows.push(row);
      }
    }
    callback(rows);
  });
};
