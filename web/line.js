var LineGenerator = (function() {
  function LineGenerator(params) {
    vega.Transform.call(this, null, params);
  }

  var prototype = vega.inherits(LineGenerator, vega.Transform);

  prototype.transform = function(_, pulse) {
    var out = pulse.fork(),
        series = _.agg.execute(pulse.source);

    series.forEach(function(s) {
      out.add.push(vega.Tuple.ingest(s.values));
    });

    // Hacky! Clear out previous line points.
    if (dl.isArray(this.value)) {
      out.rem.push.apply(out.rem, this.value);
    }

    this.value = out.add;
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

  var gpaths = document.createElementNS(xmlns, 'g');
  gpaths.setAttribute('class', 'lines');
  svg.appendChild(gpaths);

  var gx = document.createElementNS(xmlns, 'g');
  gx.setAttribute('class', 'xaxis');
  svg.appendChild(gx);

  var gy = document.createElementNS(xmlns, 'g');
  gy.setAttribute('class', 'yaxis');
  svg.appendChild(gy);

  // encoding functions for line paths
  var paths = {
    enter: function(item, _) {
      var d = item.datum,
          line = d3.line().curve(d3.curveBasis)
            .x(function(d) { return _.xs(_.$value(d)); })
            .y(function(d) { return _.ys(_.$depth(d)); })
            .curve(d3.curveCatmullRom.alpha(0.5))

      item.setAttribute('class', _.$key(d[0]));
      item.setAttribute('d', line(d));
      item.setAttribute('stroke', _.cs(_.$key(d[0])));
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

  // encoding functions for geo points
  var points = {
    enter: function(item, _) {
      var d = item.datum,
          k = _.$key(d),
          v = _.$value(d),
          tt = document.createElementNS(xmlns, 'title');

      tt.textContent = k + ': ' + v;
      item.appendChild(tt);

      item.setAttribute('class', k);
      item.setAttribute('r', 4);
      item.style.fill = _.cs(k);
    },
    update: function(item, _) {
      var d = item.datum;
      item.setAttribute('cx', _.xs(_.$value(d)));
      item.setAttribute('cy', _.ys(_.$depth(d)));
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
      var o = _.orient;
      item.setAttribute('fill-opacity', 1);
      item.setAttribute(o, Math.round(_.s(item.datum.value)));

      if (o === 'y') {
        item.setAttribute('dx', 5);
        item.setAttribute('dy', 5);
      }
      return true;
    },
    exit: function(item, _) {
      item.remove();
    }
  };

  // dataflow definition
  $depth = vega.field('depth_m'),
      $key = vega.field('key'),
      $value = vega.field('value'),
      agg = dl.groupby('key'),

      df = new vega.Dataflow(),

      fields = df.add(['nitrat_umol_per_kg']),
      $fields = df.add(function(_) {
        return _.fields.map(vega.field);
      }, {fields: fields}),

      xr = df.add([MARGIN, width-MARGIN]),  // x-range
      yr = df.add([MARGIN, height-MARGIN]), // y-range

      d0 = df.add(vega.Collect),

      f0 = df.add(vega.Fold, {fields: $fields, pulse: d0}),
      d1 = df.add(vega.Collect, {pulse: f0}),

      // x scale and axis
      xe = df.add(vega.Extent, {field: $value, pulse: d1}),
      xs = df.add(vega.Scale, {type: 'linear', domain: xe, zero: false, range: xr}),
      xt = df.add(vega.AxisTicks, {scale: xs}),

      // y scale and axis
      ye = df.add(vega.Extent, {field: $depth, pulse: d1}),
      ys = df.add(vega.Scale, {type: 'linear', domain: ye, zero: false, range: yr}),
      yt = df.add(vega.AxisTicks, {scale:ys}),

      // color scale
      cs = df.add(vega.Scale, {type: 'ordinal', domain: fields, scheme: 'category10'}),

      // lines
      lg = df.add(LineGenerator, {pulse: d1, agg: agg}),
      cg = df.add(vega.Collect, {pulse: lg}),
      j0 = df.add(vega.DataJoin, {item: items(gpaths, 'path'), pulse: cg}),
      c0 = df.add(vega.Collect, {pulse: j0}),
      e0 = df.add(vega.Encode, {
        encoders: paths,
        $key: $key, $value: $value, $depth: $depth,
        xs: xs, ys: ys, cs: cs,
        pulse: c0
      }),

      // points
      j1 = df.add(vega.DataJoin, {item: items(gpaths, 'circle'), pulse: d1}),
      c1 = df.add(vega.Collect, {pulse: j1}),
      e1 = df.add(vega.Encode, {
        encoders: points,
        $key: $key, $value: $value, $depth: $depth,
        xs: xs, ys: ys, cs: cs,
        pulse: c1
      }),

      // x-axis
      j2 = df.add(vega.DataJoin, {item: items(gx, 'line'), pulse: xt}),
      c2 = df.add(vega.Collect, {pulse: j2}),
      e2 = df.add(vega.Encode, {encoders: ticks, s: xs, orient: 'x', pulse: c2}),

      j3 = df.add(vega.DataJoin, {item:items(gx, 'text'), pulse: xt}),
      c3 = df.add(vega.Collect, {pulse:j3}),
      e3 = df.add(vega.Encode, {encoders: labels, s: xs, orient: 'x', pulse:c3}),

      // y-axis
      j4 = df.add(vega.DataJoin, {item: items(gy, 'line'), pulse: yt}),
      c4 = df.add(vega.Collect, {pulse: j4}),
      e4 = df.add(vega.Encode, {encoders: ticks, s: ys, orient: 'y', pulse: c4}),

      j5 = df.add(vega.DataJoin, {item:items(gy, 'text'), pulse: yt}),
      c5 = df.add(vega.Collect, {pulse: j5}),
      e5 = df.add(vega.Encode, {encoders: labels, s: ys, orient: 'y', pulse: c5});

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
    fields: prop(fields),
    f0: prop(f0),
    colorScale: prop(cs)
  };
}