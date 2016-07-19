var LineGenerator = (function() {
  function LineGenerator(params) {
    vega.Transform.call(this, null, params);
  }

  var prototype = vega.inherits(LineGenerator, vega.Transform);

  prototype.transform = function(_, pulse) {
    var out = pulse.fork();
    out.add.push(pulse.source);
    return out;
  };

  return LineGenerator;
})();

function line(el, width, height) {
  var MARGIN = 20,
      xmlns = 'http://www.w3.org/2000/svg';

  // initialize DOM
  el.innerHTML = null;

  var svg = document.createElementNS(xmlns, 'svg');
  svg.setAttribute('class', 'line');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  el.appendChild(svg);

  var gx = document.createElementNS(xmlns, 'g');
  gx.setAttribute('class', 'xaxis');
  svg.appendChild(gx);

  var gy = document.createElementNS(xmlns, 'g');
  gy.setAttribute('class', 'yaxis');
  svg.appendChild(gy);

  var gpaths = document.createElementNS(xmlns, 'g');
  gpaths.setAttribute('class', 'lines');
  svg.appendChild(gpaths);

  // encoding functions for line paths
  var paths = {
    enter: function(item, _) {
      var d = item.datum,
          line = d3.line().curve(d3.curveBasis)
            .x(function(d) { return _.xs(_.$x(d)); })
            .y(function(d) { return _.ys(_.$y(d)); });

      item.setAttribute('d', line(d));
      return true;
    },
    update: function(item, _) {
      var d = item.datum;
      return true;
    },
    exit: function(item, _) {
      item.remove();
    }
  };

  function flipOrient(_) {
    return _.orient === 'x' ? 'y' : 'x';
  }

  var ticks = {
    enter: function(item, _) {
      var o = flipOrient(_);
      item.setAttribute('stroke-opacity', 0);
      item.setAttribute('stroke', 'black');
      item.setAttribute(o+'1', 0);
      item.setAttribute(o+'2', 5);
    },
    update: function(item, _) {
      var o = _.orient;
      var x = Math.round(_.s(item.datum.value)) + 0.5;
      item.setAttribute(o+'1', x);
      item.setAttribute(o+'2', x);
      item.setAttribute('stroke-opacity', 1);
      return true;
    },
    exit: function(item, _) {
      item.remove();
    }
  };
  var labels = {
    enter: function(item, _) {
      var o = flipOrient(_);
      item.setAttribute('text-anchor', 'middle');
      item.setAttribute('fill-opacity', 0);
      item.setAttribute('fill', 'black');
      item.setAttribute(o, 18);
      item.textContent = item.datum.label;
    },
    update: function(item, _) {
      item.setAttribute('fill-opacity', 1);
      item.setAttribute(_.orient, Math.round(_.s(item.datum.value)));
      return true;
    },
    exit: function(item, _) {
      item.remove();
    }
  };

  // dataflow definition
  var $x = vega.field('nitrat_umol_per_kg'),
      $y = vega.field('depth_m'),

      df = new vega.Dataflow(),
      xr = df.add([MARGIN, width-MARGIN]),  // x-range
      yr = df.add([MARGIN, height-MARGIN]), // y-range

      d0 = df.add(vega.Collect),

      // x scale and axis
      xe = df.add(vega.Extent, {field: $x, pulse: d0}),
      xs = df.add(vega.Scale, {type: 'linear', domain: xe, zero: false, range: xr}),
      xt = df.add(vega.AxisTicks, {scale: xs}),

      // y scale and axis
      ye = df.add(vega.Extent, {field: $y, pulse: d0}),
      ys = df.add(vega.Scale, {type: 'linear', domain: ye, zero: false, range: yr}),
      yt = df.add(vega.AxisTicks, {scale:ys}),

      lg = df.add(LineGenerator, {pulse: d0}),
      c0 = df.add(vega.Collect, {pulse: lg}),
      j0 = df.add(vega.DataJoin, {item: items(gpaths, 'path'), pulse: c0}),
      c1 = df.add(vega.Collect, {pulse: j0}),
      e0 = df.add(vega.Encode, {
        encoders: paths,
        $x: $x, $y: $y,
        xs: xs, ys: ys,
        pulse: c1
      }),

      // x-axis
      j1 = df.add(vega.DataJoin, {item: items(gx, 'line'), pulse: xt}),
      c2 = df.add(vega.Collect, {pulse: j1}),
      e1 = df.add(vega.Encode, {encoders: ticks, s: xs, orient: 'x', pulse: c2}),

      j2 = df.add(vega.DataJoin, {item:items(gx, 'text'), pulse: xt}),
      c3 = df.add(vega.Collect, {pulse:j2}),
      e2 = df.add(vega.Encode, {encoders: labels, s: xs, orient: 'x', pulse:c3}),

      // y-axis
      j2 = df.add(vega.DataJoin, {item: items(gy, 'line'), pulse: yt}),
      c4 = df.add(vega.Collect, {pulse: j2}),
      e3 = df.add(vega.Encode, {encoders: ticks, s: ys, orient: 'y', pulse: c4}),

      j3 = df.add(vega.DataJoin, {item:items(gy, 'text'), pulse: yt}),
      c4 = df.add(vega.Collect, {pulse: j3}),
      e4 = df.add(vega.Encode, {encoders: labels, s: ys, orient: 'y', pulse: c4});

  function prop(op) {
    return function(value) {
      return arguments.length
        ? ((value.constructor === vega.changeset
            ? df.pulse(op, value)
            : df.update(op, value)).run(), this)
        : op.value;
    };
  }

  return {
    dataflow: df,
    points: prop(d0),
    xscale: prop(xs),
    yscale: prop(ys)
  };
}