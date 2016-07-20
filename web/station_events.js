function addHoverEventsForStations(stationSelector) {
  $(stationSelector).off('mouseenter',stationSelector)
    .off('mouseleeave',stationSelector)
    .on('mouseenter',function(e) {
      this.eventDone = false;
      var stationId = this.datum.bodc_station;
      console.log(this);
      $(this).attr('title',''); // has to have a title attribute
      if(!this.hasTooltip) {
        getAggregateData(this,stationId);
      }
    })
    .on('mouseleave',function(e) {
      this.eventDone = true;
    });
};

function getAggregateData(o,stationId){
  if(o.eventDone) return; // don't do anything
  getAggregateGenomicsDataForStation(stationId,function(aggregateGenomicsData) {
    if(o.eventDone) return; // don't do anything
    var gc = aggregateGenomicsData[0]['count'];
    //console.log('stationId',stationId);
    //console.log('total genome sequences:',gc);
    getAggregateSampleDataForStation(stationId,function(aggregateSampleData) {
      if(o.eventDone) return; // don't do anything
      var sc = aggregateSampleData[0]['count'];
      //console.log('total samples:',gc);
      $(o).tooltip({content:
        "station: "+stationId+", "
        +"total genome sequences: "+gc+", "
        +"total samples: "+sc+""});
      $(o).tooltip("open");
      o.hasTooltip = true;
    });
  });
};

function addClickEventsForStations(stationSelector) {
  $(stationSelector).off('click',stationSelector).on('click',function() {
    console.log('data:',this.datum);
    stationId = this.datum.bodc_station;
    // TODO: trigger a line chart to be drawn
  });
};
