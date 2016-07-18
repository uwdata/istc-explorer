function map(el, width, height, worldmap) {
  var xmlns = 'http://www.w3.org/2000/svg';

  // initialize DOM
  el.innerHTML = null;

  var svg = document.createElementNS(xmlns, 'svg');
  svg.setAttribute('class', 'map');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  el.appendChild(svg);

  var graticule = document.createElementNS(xmlns, 'g');
  graticule.setAttribute('class', 'graticule');
  svg.appendChild(graticule);

  var gpaths = document.createElementNS(xmlns, 'g');
  gpaths.setAttribute('class', 'paths');
  svg.appendChild(gpaths);

  var gpoints = document.createElementNS(xmlns, 'g');
  gpoints.setAttribute('class', 'points');
  svg.appendChild(gpoints);

  // helper functions
  function xy(e) {
    var bb = svg.getBoundingClientRect();
    return [
      e.clientX - bb.left - svg.clientLeft,
      e.clientY - bb.top - svg.clientTop
    ];
  }

  function copyProjection(p) {
    return vega.projections.mercator()
      .scale(p.scale())
      .translate(p.translate())
      .center(p.center())
      .rotate(p.rotate());
  }

  function translateX(_) { return _.width / 2; };
  function translateY(_) { return _.height / 2; };

  // encoding functions for geo points
  var points = {
    enter: function(item, _) {
      var d = item.datum;
      if (d && d.tooltip) {
        var tt = document.createElementNS(xmlns, 'title');
        tt.textContent = d.tooltip;
        item.appendChild(tt);
      }
      item.setAttribute('r', d && d.radius || 8);
      item.style.stroke = d && d.color || null;
      item.style.fill = d && d.color || null;
    },
    update: function(item, _) {
      var d = item.datum;
      item.setAttribute('cx', d.x);
      item.setAttribute('cy', d.y);
      return true;
    },
    exit: function(item, _) {
      item.remove();
    }
  };

  // encoding function for geo paths (regions, graticule)
  var paths = {
    update: function(item, _) {
      var path = item.datum.path || 'M0,0';
      item.setAttribute('d', path);
      return true;
    },
    exit: function(item, _) {
      item.remove();
    }
  };

  // dataflow definition
  var lon = vega.field('lon'),
      lat = vega.field('lat'),
      df = new vega.Dataflow(),
      w = df.add(width),
      h = df.add(height),
      l = df.add(0),
      md = df.add([0,0]), // mouse down point
      ad = df.add([0,0]), // anchor for drag rotation
      dd = df.add([0,0]), // drag delta

      pt = df.add('mercator'),
      sc = df.add(150),       // scale
      rl = df.add(0),         // rotate lambda
      rp = df.add(0),         // rotate phi
      rg = df.add(0),         // rotate gamma
      tx = df.add(translateX, {width:w}),  // translate x (default: width/2)
      ty = df.add(translateY, {height:h}), // translate y (default: height/2)
      cl = df.add(0),         // center x
      cp = df.add(0),         // center y
      pj = df.add(vega.Projection, {
        type: pt,
        scale: sc,
        translate: [tx, ty],
        center: [cl, cp],
        rotate: [rl, rp, rg]
      }),
      pa = df.add(null),

      gg = df.add(vega.Graticule, {step: [15,15]}),
      pg = df.add(vega.GeoPath, {projection:pj, pulse:gg}),
      jg = df.add(vega.DataJoin, {item:items(graticule, 'path'), pulse:pg}),
      cg = df.add(vega.Collect, {pulse:jg}),
      eg = df.add(vega.Encode, {encoders:paths, pulse:cg}),

      d0 = df.add(vega.Collect),
      p0 = df.add(vega.GeoPath, {projection:pj, pulse:d0}),
      j0 = df.add(vega.DataJoin, {item:items(gpaths, 'path'), pulse:p0}),
      c0 = df.add(vega.Collect, {pulse:j0}),
      e0 = df.add(vega.Encode, {encoders:paths, pulse:c0});

      d1 = df.add(vega.Collect),
      p1 = df.add(vega.GeoPoint, {projection:pj, fields:[lon, lat], pulse:d1}),
      j1 = df.add(vega.DataJoin, {item:items(gpoints, 'circle'), pulse:p1}),
      c1 = df.add(vega.Collect, {pulse:j1}),
      e1 = df.add(vega.Encode, {encoders:points, pulse:c1});

  // event streams
  var wheel = df.events(svg, 'wheel').consume(true),
      mousedown = df.events(svg, 'mousedown'),
      mousemove = df.events(window, 'mousemove'),
      mouseup = df.events(window, 'mouseup'),
      drag = mousemove.between(mousedown, mouseup).consume(true);

  // inject world map data
  df.pulse(d0, vega.changeset().insert(worldmap))

    // adjust scale on mouse wheel zoom
    .on(wheel, sc, function(_, e) {
      return sc.value * Math.pow(1.0005, -e.deltaY * Math.pow(16, e.deltaMode));
    })

    // snapshot rotation and current projection
    .on(mousedown, ad, function(_, e) { return [_.rl, _.cp]; }, {rl:rl, cp:cp})
    .on(mousedown, pa, function(_, e) { return copyProjection(_.proj); }, {proj: pj})

    // capture lon/lat coordinate of mousedown point
    .on(mousedown, md, function(_, e) { return _.proj.invert(xy(e)); }, {proj: pa})

    // calculate delta between lon/lat angles
    .on(drag, dd, function(_, e) {
      var ll = _.proj.invert(xy(e)); return [ll[0] - _.md[0], _.md[1] - ll[1]];
    }, {md: md, proj: pa})

    // adjust lambda rotation and center phi by angle deltas
    .on(dd, rl, function(_, e) { return _.ad[0] + _.dd[0]; }, {dd:dd, ad:ad})
    .on(dd, cp, function(_, e) { return _.ad[1] + _.dd[1]; }, {dd:dd, ad:ad})

    .on(w, l, function(_) { return svg.setAttribute('width', _.w), _.w; }, {w:w})
    .on(h, l, function(_) { return svg.setAttribute('height', _.h), _.h; }, {h:h})

    // let's get it started...
    .run();

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
    points: prop(d1),
    scale: prop(sc),
    rotateLambda: prop(rl),
    rotatePhi: prop(rp),
    rotateGamma: prop(rg),
    translateX: prop(tx),
    translateY: prop(ty),
    centerLambda: prop(cl),
    centerPhi: prop(cp),
    projection: prop(pj),
    width: prop(w),
    height: prop(h)
  };
}