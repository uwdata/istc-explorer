// for changes in checkboxes
function changeMeasures(evt) {
  var clicked = $('.map .points circle.sampledata.emphasize')[0];
  if(clicked) {
    console.log('change');
    $(clicked).trigger('click');
  }
  return false;
};

function addHoverEventsForStations(stationSelector) {
  $(stationSelector).off('mouseenter',stationSelector)
    .off('mouseleeave',stationSelector)
    .on('mouseenter',function(e) {
      this.eventDone = false;
      var stationId = this.datum.bodc_station;
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
      // TODO: fill in the data for genetic diversity score
      $(o).tooltip({content:
        "station: "+stationId+", "
        +"total genome sequences: "+gc+", "
        //+"genetic diversity score: xx, "
        +"total samples: "+sc+""});
      $(o).tooltip("open");
      o.hasTooltip = true;
    });
  });
};


function addClickEventsForStations(stationSelector,linev,linevSelector) {
  $(stationSelector).off('click',stationSelector).on('click',function() {
    var clicked = $(this).hasClass('emphasize');

    $('.map .points circle.sampledata').removeClass('emphasize');
    $('.map .points circle.sampledata').addClass("deemphasize");
    $(this).addClass('emphasize');

    stationId = this.datum.bodc_station;
    var fields = [];
    $("input[type='checkbox']:checked").map(function() {fields.push($(this).val());});
    console.log("fields",fields);
    getSpecificSampleDataForStation(stationId, fields, function(res){
      // update header
      $("#stid").text(stationId);
      // console.table(res);
      // draw the line chart
      res.sort(dl.comparator('depth_m'));
      linev.fields(fields);
      linev.points(vega.changeset().remove(function(){return true;}).insert(res));
      // display the line chart, if currently hidden
      $(linevSelector).removeClass('hide');

      // color code inputs
      $('#fieldInputs label').css({
        background: '#fff',
        color: '#000',
        fontWeight: 'normal'
      });

      fields.forEach(function(f) {
        $('#' + f).css({
          background: linev.colorScale()(f),
          color: '#fff',
          fontWeight: 'bold'
        });
      });
    });
  });
};
