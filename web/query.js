/*
//example of how to use the bdRelationalQuery function
var query = "select longitude from sampledata.station_info limit 10";
bdRelationalQuery(query,function(rows) {
  $("#data").text(JSON.stringify(rows));
});
*/

// TODO: write queries to get the log data for the cruises?

// gets the conversion info for all genome sequences associated with this station
function getAggregateGenomicsDataForStation(stationId,callback) {
   var queryString = "select count(*) from sampledata.genomics_conversion where bodc_station="+stationId;
  bdRelationalQuery(queryString,callback);
};

// gets the conversion info for all genome sequences associated with this station
function getGenomicsDataForStation(stationId,callback) {
   var queryString = "select * from sampledata.genomics_conversion where bodc_station="+stationId;
  bdRelationalQuery(queryString,callback);
};

// gets aggregate sample info associated with this station
function getAggregateSampleDataForStation(stationId,callback) {
  var queryString = "select count(*) from sampledata.main where bodc_station="+stationId+" and depth_m is not null";
  bdRelationalQuery(queryString,callback);
};

// gets all sample info associated with this station, but only for the columns specified
function getSpecificSampleDataForStation(stationId,fieldNames,callback) {
  var queryString = ["select",
    "depth_m,"+fieldNames.join(","),
    "from sampledata.main where bodc_station="+stationId].join(" ");

  queryString += " and depth_m is not null";
  for(var i = 0; i < fieldNames.length; i++){
    queryString += " and "+fieldNames[i]+" is not null";
  }

  //console.log("queryString:",queryString);
  bdRelationalQuery(queryString,callback);
};

// gets all sample info associated with this station
function getAllSampleDataForStation(stationId,callback) {
  var queryString = "select * from sampledata.main where bodc_station="+stationId+" and depth_m is not null";
  bdRelationalQuery(queryString,callback);
};

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
      var noNulls = true;
      if(line.length > 0) {
        var row = {};
        var vals = line.split("\t")
        for(var j = 0; j < vals.length; j++) {
          row[fields[j]] = !isNaN(+vals[j]) ? +vals[j] : vals[j];
        }
        rows.push(row);
      }
    }
    callback(rows);
  });
};
