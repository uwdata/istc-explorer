var defaultHoverTimeout = 400;

function addHoverEventsForStations(stationSelector) {
  $(stationSelector).off('mouseenter',stationSelector)
    .off('mouseleeave',stationSelector)
    .on('mouseenter',function() {
      //console.log('data:',this.datum);
      var stationId = this.datum.bodc_station;
      checkTimer(this,function(){getAggregateData(stationId);},defaultHoverTimeout);
    })
    .on('mouseleave',function() {
      clearTimer(this);
    });
};

function getAggregateData(stationId){
  getAggregateGenomicsDataForStation(stationId,function(aggregateGenomicsData) {
    var gc = aggregateGenomicsData[0]['count'];
    console.log('total genome sequences:',gc);
    getAggregateSampleDataForStation(stationId,function(aggregateSampleData) {
      var sc = aggregateSampleData[0]['count'];
      console.log('total samples:',gc);
    });
  });
};

// on mouse leave or reset, clear timer
function clearTimer(o) {
  if(o.istcExHoverTimer) {
    clearTimeout(o.istcExHoverTimer);
    delete o.istcExHoverTimer;
  }
};

function checkTimer(o,toDoFunc,timeout) {
  clearTimer(o); // reset
  o.istcExHoverTimer = setTimeout(toDoFunc,timeout);
};

function addClickEventsForStations(stationSelector) {
  $(stationSelector).off('click',stationSelector).on('click',function() {
    console.log('data:',this.datum);
    stationId = this.datum.bodc_station;
    // TODO: trigger a line chart to be drawn
  });
};
