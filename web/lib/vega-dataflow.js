(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.vega = global.vega || {})));
}(this, function (exports) { 'use strict';

  var version = "2.0.0";

  function bin(_) {
    // determine range
    var maxb = _.maxbins || 20,
        base = _.base || 10,
        logb = Math.log(base),
        div  = _.divide || [5, 2],
        min  = _.extent[0],
        max  = _.extent[1],
        span = max - min,
        step, level, minstep, precision, v, i, n, eps;

    if (_.step) {
      // if step size is explicitly given, use that
      step = _.step;
    } else if (_.steps) {
      // if provided, limit choice to acceptable step sizes
      v = span / maxb;
      for (i=0, n=_.steps.length; i < n && _.steps[i] < v; ++i);
      step = _.steps[Math.max(0, i-1)];
    } else {
      // else use span to determine step size
      level = Math.ceil(Math.log(maxb) / logb);
      minstep = _.minstep || 0;
      step = Math.max(
        minstep,
        Math.pow(base, Math.round(Math.log(span) / logb) - level)
      );

      // increase step size if too many bins
      while (Math.ceil(span/step) > maxb) { step *= base; }

      // decrease step size if allowed
      for (i=0, n=div.length; i<n; ++i) {
        v = step / div[i];
        if (v >= minstep && span / v <= maxb) step = v;
      }
    }

    // update precision, min and max
    v = Math.log(step);
    precision = v >= 0 ? 0 : ~~(-v / logb) + 1;
    eps = Math.pow(base, -precision - 1);
    if (_.nice || _.nice === undefined) {
      min = Math.min(min, Math.floor(min / step + eps) * step);
      max = Math.ceil(max / step) * step;
    }

    return {
      start: min,
      stop:  max,
      step:  step
    };
  }

  function numbers(array, f) {
    var numbers = [],
        n = array.length,
        i = -1, a;

    if (f == null) {
      while (++i < n) if (!isNaN(a = number(array[i]))) numbers.push(a);
    } else {
      while (++i < n) if (!isNaN(a = number(f(array[i], i, array)))) numbers.push(a);
    }
    return numbers;
  }

  function number(x) {
    return x === null ? NaN : +x;
  }

  function ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function bisector(compare) {
    if (compare.length === 1) compare = ascendingComparator(compare);
    return {
      left: function(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) < 0) lo = mid + 1;
          else hi = mid;
        }
        return lo;
      },
      right: function(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) > 0) hi = mid;
          else lo = mid + 1;
        }
        return lo;
      }
    };
  }

  function ascendingComparator(f) {
    return function(d, x) {
      return ascending(f(d), x);
    };
  }

  var ascendingBisect = bisector(ascending);
  var bisectRight = ascendingBisect.right;
  var bisectLeft = ascendingBisect.left;

  function number$1(x) {
    return x === null ? NaN : +x;
  }

  function range(start, stop, step) {
    start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

    var i = -1,
        n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
        range = new Array(n);

    while (++i < n) {
      range[i] = start + i * step;
    }

    return range;
  }

  var e10 = Math.sqrt(50);
  var e5 = Math.sqrt(10);
  var e2 = Math.sqrt(2);
  function ticks(start, stop, count) {
    var step = tickStep(start, stop, count);
    return range(
      Math.ceil(start / step) * step,
      Math.floor(stop / step) * step + step / 2, // inclusive
      step
    );
  }

  function tickStep(start, stop, count) {
    var step0 = Math.abs(stop - start) / Math.max(0, count),
        step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
        error = step0 / step1;
    if (error >= e10) step1 *= 10;
    else if (error >= e5) step1 *= 5;
    else if (error >= e2) step1 *= 2;
    return stop < start ? -step1 : step1;
  }

  function threshold(array, p, f) {
    if (f == null) f = number$1;
    if (!(n = array.length)) return;
    if ((p = +p) <= 0 || n < 2) return +f(array[0], 0, array);
    if (p >= 1) return +f(array[n - 1], n - 1, array);
    var n,
        h = (n - 1) * p,
        i = Math.floor(h),
        a = +f(array[i], i, array),
        b = +f(array[i + 1], i + 1, array);
    return a + (b - a) * (h - i);
  }

  function max(array, f) {
    var i = -1,
        n = array.length,
        a,
        b;

    if (f == null) {
      while (++i < n) if ((b = array[i]) != null && b >= b) { a = b; break; }
      while (++i < n) if ((b = array[i]) != null && b > a) a = b;
    }

    else {
      while (++i < n) if ((b = f(array[i], i, array)) != null && b >= b) { a = b; break; }
      while (++i < n) if ((b = f(array[i], i, array)) != null && b > a) a = b;
    }

    return a;
  }

  function mean(array, f) {
    var s = 0,
        n = array.length,
        a,
        i = -1,
        j = n;

    if (f == null) {
      while (++i < n) if (!isNaN(a = number$1(array[i]))) s += a; else --j;
    }

    else {
      while (++i < n) if (!isNaN(a = number$1(f(array[i], i, array)))) s += a; else --j;
    }

    if (j) return s / j;
  }

  function median(array, f) {
    var numbers = [],
        n = array.length,
        a,
        i = -1;

    if (f == null) {
      while (++i < n) if (!isNaN(a = number$1(array[i]))) numbers.push(a);
    }

    else {
      while (++i < n) if (!isNaN(a = number$1(f(array[i], i, array)))) numbers.push(a);
    }

    return threshold(numbers.sort(ascending), 0.5);
  }

  function merge(arrays) {
    var n = arrays.length,
        m,
        i = -1,
        j = 0,
        merged,
        array;

    while (++i < n) j += arrays[i].length;
    merged = new Array(j);

    while (--n >= 0) {
      array = arrays[n];
      m = array.length;
      while (--m >= 0) {
        merged[--j] = array[m];
      }
    }

    return merged;
  }

  function min(array, f) {
    var i = -1,
        n = array.length,
        a,
        b;

    if (f == null) {
      while (++i < n) if ((b = array[i]) != null && b >= b) { a = b; break; }
      while (++i < n) if ((b = array[i]) != null && a > b) a = b;
    }

    else {
      while (++i < n) if ((b = f(array[i], i, array)) != null && b >= b) { a = b; break; }
      while (++i < n) if ((b = f(array[i], i, array)) != null && a > b) a = b;
    }

    return a;
  }

  function permute(array, indexes) {
    var i = indexes.length, permutes = new Array(i);
    while (i--) permutes[i] = array[indexes[i]];
    return permutes;
  }

  function sum(array, f) {
    var s = 0,
        n = array.length,
        a,
        i = -1;

    if (f == null) {
      while (++i < n) if (a = +array[i]) s += a; // Note: zero and null are equivalent.
    }

    else {
      while (++i < n) if (a = +f(array[i], i, array)) s += a;
    }

    return s;
  }

  function bootstrapCI(array, samples, alpha, f) {
    var values = numbers(array, f),
        n = values.length,
        m = samples,
        a, i, j, mu;

    for (j=0, mu=Array(m); j<m; ++j) {
      for (a=0, i=0; i<n; ++i) {
        a += values[~~(Math.random() * n)];
      }
      mu[i] = a / n;
    }

    return [
      threshold(mu.sort(ascending), alpha/2),
      threshold(mu, 1-(alpha/2))
    ];
  }

  function integer(min, max) {
    var a = max == null ? 0 : min,
        b = max == null ? min : max,
        d = b - a,
        dist = {};

    dist.sample = function() {
      return a + Math.floor(d * Math.random());
    };

    dist.pdf = function(x) {
      return (x === Math.floor(x) && x >= a && x < b) ? 1 / d : 0;
    };

    dist.cdf = function(x) {
      var v = Math.floor(x);
      return v < a ? 0 : v >= b ? 1 : (v - a + 1) / d;
    };

    dist.icdf = function(p) {
      return (p >= 0 && p <= 1) ? a - 1 + Math.floor(p * d) : NaN;
    };

    return dist;
  }

  function normal(mean, stdev) {
    var mu = mean || 0,
        sigma = stdev || 1,
        next = NaN,
        dist = {};

    dist.sample = function() {
      var x = 0, y = 0, rds, c;
      if (next === next) {
        return x = next, next = NaN, x;
      }
      do {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        rds = x * x + y * y;
      } while (rds === 0 || rds > 1);
      c = Math.sqrt(-2 * Math.log(rds) / rds); // Box-Muller transform
      next = mu + y * c * sigma;
      return mu + x * c * sigma;
    };

    dist.pdf = function(x) {
      var exp = Math.exp(Math.pow(x-mu, 2) / (-2 * Math.pow(sigma, 2)));
      return (1 / (sigma * Math.sqrt(2*Math.PI))) * exp;
    };

    // Approximation from West (2009)
    // Better Approximations to Cumulative Normal Functions
    dist.cdf = function(x) {
      var cd,
          z = (x - mu) / sigma,
          Z = Math.abs(z);
      if (Z > 37) {
        cd = 0;
      } else {
        var sum, exp = Math.exp(-Z*Z/2);
        if (Z < 7.07106781186547) {
          sum = 3.52624965998911e-02 * Z + 0.700383064443688;
          sum = sum * Z + 6.37396220353165;
          sum = sum * Z + 33.912866078383;
          sum = sum * Z + 112.079291497871;
          sum = sum * Z + 221.213596169931;
          sum = sum * Z + 220.206867912376;
          cd = exp * sum;
          sum = 8.83883476483184e-02 * Z + 1.75566716318264;
          sum = sum * Z + 16.064177579207;
          sum = sum * Z + 86.7807322029461;
          sum = sum * Z + 296.564248779674;
          sum = sum * Z + 637.333633378831;
          sum = sum * Z + 793.826512519948;
          sum = sum * Z + 440.413735824752;
          cd = cd / sum;
        } else {
          sum = Z + 0.65;
          sum = Z + 4 / sum;
          sum = Z + 3 / sum;
          sum = Z + 2 / sum;
          sum = Z + 1 / sum;
          cd = exp / sum / 2.506628274631;
        }
      }
      return z > 0 ? 1 - cd : cd;
    };

    // Approximation of Probit function using inverse error function.
    dist.icdf = function(p) {
      if (p <= 0 || p >= 1) return NaN;
      var x = 2*p - 1,
          v = (8 * (Math.PI - 3)) / (3 * Math.PI * (4-Math.PI)),
          a = (2 / (Math.PI*v)) + (Math.log(1 - Math.pow(x,2)) / 2),
          b = Math.log(1 - (x*x)) / v,
          s = (x > 0 ? 1 : -1) * Math.sqrt(Math.sqrt((a*a) - b) - a);
      return mu + sigma * Math.SQRT2 * s;
    };

    return dist;
  }

  function uniform(min, max) {
    var a = max == null ? 0 : min,
        b = max == null ? (min == null ? 1 : min) : max,
        d = b - a,
        dist = {};

    dist.sample = function() {
      return a + d * Math.random();
    };

    dist.pdf = function(x) {
      return (x >= a && x <= b) ? 1 / d : 0;
    };

    dist.cdf = function(x) {
      return x < a ? 0 : x > b ? 1 : (x - a) / d;
    };

    dist.icdf = function(p) {
      return (p >= 0 && p <= 1) ? a + p * d : NaN;
    };

    return dist;
  }

  function quartiles(array, f) {
    var values = numbers(array, f);

    return [
      threshold(values.sort(ascending), 0.25),
      threshold(values, 0.50),
      threshold(values, 0.75)
    ];
  }

  function accessor(fn, fields, name) {
    return (
      fn.fields = fields || [],
      fn.fname = name,
      fn
    );
  }

  function accessorName(fn) {
    return fn == null ? null : fn.fname;
  }

  function accessorFields(fn) {
    return fn == null ? null : fn.fields;
  }

  function splitAccessPath(p) {
    return String(p)
      .match(/\[(.*?)\]|[^.\[]+/g)
      .map(path_trim);
  }

  function path_trim(d) {
    return d[0] !== '[' ? d
      : d[1] !== "'" && d[1] !== '"' ? d.slice(1, -1)
      : d.slice(2, -2).replace(/\\(["'])/g, '$1');
  }

  var isArray = Array.isArray;

  function isObject(_) {
    return _ === Object(_);
  }

  function isString(_) {
    return typeof _ === 'string';
  }

  function $(x) {
    return isArray(x) ? '[' + x.map($) + ']'
      : isObject(x) || isString(x) ?
        // Output valid JSON and JS source strings.
        // See http://timelessrepo.com/json-isnt-a-javascript-subset
        JSON.stringify(x).replace('\u2028','\\u2028').replace('\u2029', '\\u2029')
      : x;
  }

  function field(field, name) {
    var path = splitAccessPath(field).map($),
        fn = Function('_', 'return _[' + path.join('][') + '];');
    return accessor(fn, [field], name || field);
  }

  var empty = [];

  var id = field('id');

  var identity$1 = accessor(function(_) { return _; }, empty, 'identity');

  var zero = accessor(function() { return 0; }, empty, 'zero');

  var one = accessor(function() { return 1; }, empty, 'one');

  var truthy = accessor(function() { return true; }, empty, 'true');

  var falsy = accessor(function() { return false; }, empty, 'false');

  function log(level, msg) {
    var args = [level].concat([].slice.call(msg));
    console.log.apply(console, args); // eslint-disable-line no-console
  }

  var None  = 0;
  var Warn  = 1;
  var Info  = 2;
  var Debug = 3;

  function logger(_) {
    var level = _ || None;
    return {
      level: function(_) { if (arguments.length) level = +_; return level; },
      warn: function()   { if (level >= Warn)  log('WARN', arguments);  },
      info: function()   { if (level >= Info)  log('INFO', arguments);  },
      debug: function()  { if (level >= Debug) log('DEBUG', arguments); }
    }
  }

  function array$1(_) {
    return _ != null ? (isArray(_) ? _ : [_]) : [];
  }

  function compare(fields, orders) {
    if (fields == null) return null;
    fields = array$1(fields);

    var cmp = fields.map(function(f) {
          return splitAccessPath(f).map($).join('][');
        }),
        ord = array$1(orders),
        n = cmp.length - 1,
        code = 'var u,v;return ', i, f, u, v, d, lt, gt;

    for (i=0; i<=n; ++i) {
      f = cmp[i];
      u = '(u=a['+f+'])';
      v = '(v=b['+f+'])';
      d = '((v=v instanceof Date?+v:v),(u=u instanceof Date?+u:u))';
      lt = ord[i] !== 'descending' ? (gt=1, -1) : (gt=-1, 1);
      code += '(' + u+'<'+v+'||u==null)&&v!=null?' + lt
        + ':(u>v||v==null)&&u!=null?' + gt
        + ':'+d+'!==u&&v===v?' + lt
        + ':v!==v&&u===u?' + gt
        + (i < n ? ':' : ':0');
    }
    return accessor(Function('a', 'b', code + ';'), fields);
  }

  function isFunction(_) {
    return typeof _ === 'function';
  }

  function constant$1(_) {
    return isFunction(_) ? _ : function() { return _; };
  }

  function error(message) {
    throw Error(message);
  }

  function extend(_) {
    for (var x, k, i=1, len=arguments.length; i<len; ++i) {
      x = arguments[i];
      for (k in x) { _[k] = x[k]; }
    }
    return _;
  }

  function extentIndex(array, f) {
    var i = -1,
        n = array.length,
        a, b, c, u, v;

    if (f == null) {
      while (++i < n) if ((b = array[i]) != null && b >= b) { a = c = b; break; }
      u = v = i;
      while (++i < n) if ((b = array[i]) != null) {
        if (a > b) a = b, u = i;
        if (c < b) c = b, v = i;
      }
    } else {
      while (++i < n) if ((b = f(array[i], i, array)) != null && b >= b) { a = c = b; break; }
      u = v = i;
      while (++i < n) if ((b = f(array[i], i, array)) != null) {
        if (a > b) a = b, u = i;
        if (c < b) c = b, v = i;
      }
    }

    return [u, v];
  }

  function inherits(child, parent) {
    var proto = (child.prototype = Object.create(parent.prototype));
    proto.constructor = child;
    return proto;
  }

  function isNumber(_) {
    return typeof _ === 'number';
  }

  function merge$1(compare, array0, array1, output) {
    var n0 = array0.length,
        n1 = array1.length;

    if (!n1) return array0;
    if (!n0) return array1;

    var merged = output || new array0.constructor(n0 + n1),
        i0 = 0, i1 = 0, i = 0;

    for (; i0<n0 && i1<n1; ++i) {
      merged[i] = compare(array0[i0], array1[i1]) > 0
         ? array1[i1++]
         : array0[i0++];
    }

    for (; i0<n0; ++i0, ++i) {
      merged[i] = array0[i0];
    }

    for (; i1<n1; ++i1, ++i) {
      merged[i] = array1[i1];
    }

    return merged;
  }

  function toSet(_) {
    for (var s={}, i=0, n=_.length; i<n; ++i) s[_[i]] = 1;
    return s;
  }

  function visitArray(array, filter, visitor) {
    var i = 0, n = array.length, t;
    if (filter) {
      for (; i<n; ++i) {
        if (t = filter(array[i])) visitor(t, i, array);
      }
    } else {
      array.forEach(visitor);
    }
  }

  function UniqueList(idFunc) {
    var $ = idFunc || identity$1,
        list = [],
        ids = {};

    list.add = function(_) {
      var id = $(_);
      if (!ids[id]) {
        ids[id] = 1;
        list.push(_);
      }
      return list;
    };

    list.remove = function(_) {
      var id = $(_), idx;
      if (ids[id]) {
        ids[id] = 0;
        if ((idx = list.indexOf(_)) >= 0) {
          list.splice(idx, 1);
        }
      }
      return list;
    };

    return list;
  }

  var TUPLE_ID = 1;

  /**
   * Resets the internal tuple id counter to zero.
   */
  function reset() {
    TUPLE_ID = 1;
  }

  /**
   * Returns the id of a tuple.
   * @param {Tuple} t - The input tuple.
   * @return the tuple id.
   */
  function id$1(t) {
    return t._id;
  }

  /**
   * Copy the values of one tuple to another (ignoring id and prev fields).
   * @param {Tuple} t - The tuple to copy from.
   * @param {Tuple} c - The tuple to write to.
   * @return The re-written tuple, same as the argument 'c'.
   */
  function copy(t, c) {
    for (var k in t) {
      if (k !== '_id') c[k] = t[k];
    }
    return c;
  }

  /**
   * Ingest an object or value as a data tuple.
   * If the input value is an object, an id field will be added to it. For
   * efficiency, the input object is modified directly. A copy is not made.
   * If the input value is a literal, it will be wrapped in a new object
   * instance, with the value accessible as the 'data' property.
   * @param datum - The value to ingest.
   * @return {Tuple} The ingested data tuple.
   */
  function ingest(datum) {
    var tuple = (datum === Object(datum)) ? datum : {data: datum};
    if (!tuple._id) tuple._id = ++TUPLE_ID;
    return tuple;
  }

  /**
   * Given a source tuple, return a derived copy.
   * @param {object} t - The source tuple.
   * @return {object} The derived tuple.
   */
  function derive(t) {
    return ingest(copy(t, {}));
  }

  /**
   * Rederive a derived tuple by copying values from the source tuple.
   * @param {object} t - The source tuple.
   * @param {object} d - The derived tuple.
   * @return {object} The derived tuple.
   */
  function rederive(t, d) {
    return copy(t, d);
  }

  /**
   * Replace an existing tuple with a new tuple.
   * The existing tuple will become the previous value of the new.
   * @param {object} t - The existing data tuple.
   * @param {object} d - The new tuple that replaces the old.
   * @return {object} The new tuple.
   */
  function replace(t, d) {
    return d._id = t._id, d;
  }



  var Tuple = Object.freeze({
    reset: reset,
    id: id$1,
    ingest: ingest,
    replace: replace,
    derive: derive,
    rederive: rederive
  });

  function isChangeSet(v) {
    return v && v.constructor === changeset;
  }

  function changeset() {
    var add = [],  // insert tuples
        rem = [],  // remove tuples
        mod = [],  // modify tuples
        remp = [], // remove by predicate
        modp = []; // modify by predicate

    return {
      constructor: changeset,
      insert: function(t) {
        var d = array$1(t), i = 0, n = d.length;
        for (; i<n; ++i) add.push(d[i]);
        return this;
      },
      remove: function(t) {
        var a = isFunction(t) ? remp : rem,
            d = array$1(t), i = 0, n = d.length;
        for (; i<n; ++i) a.push(d[i]);
        return this;
      },
      modify: function(t, field, value) {
        var m = {field: field, value: constant$1(value)};
        if (isFunction(t)) m.filter = t, modp.push(m);
        else m.tuple = t, mod.push(m);
        return this;
      },
      encode: function(t, set) {
        mod.push({tuple: t, field: set});
        return this;
      },
      pulse: function(pulse, tuples) {
        var out, i, n, m, f, t, id;

        // add
        for (i=0, n=add.length; i<n; ++i) {
          pulse.add.push(ingest(add[i]));
        }

        // remove
        for (out={}, i=0, n=rem.length; i<n; ++i) {
          t = rem[i];
          out[t._id] = t;
        }
        for (i=0, n=remp.length; i<n; ++i) {
          f = remp[i];
          tuples.forEach(function(t) {
            if (f(t)) out[t._id] = t;
          });
        }
        for (id in out) pulse.rem.push(out[id]);

        // modify
        function modify(t, f, v) {
          if (v) t[f] = v(t); else pulse.encode = f;
          out[t._id] = t;
        }
        for (out={}, i=0, n=mod.length; i<n; ++i) {
          m = mod[i];
          modify(m.tuple, m.field, m.value);
          pulse.modifies(m.field);
        }
        for (i=0, n=modp.length; i<n; ++i) {
          m = modp[i];
          f = m.filter;
          tuples.forEach(function(t) {
            if (f(t)) modify(t, m.field, m.value);
          });
          pulse.modifies(m.field);
        }
        for (id in out) pulse.mod.push(out[id]);

        return pulse;
      }
    };
  }

  /**
   * Sentinel value indicating pulse propagation should stop.
   */
  var StopPropagation = {};

  // Pulse visit type flags
  var ADD       = (1 << 0);
  var REM       = (1 << 1);
  var MOD       = (1 << 2);
  var ADD_REM   = ADD | REM;
  var ADD_MOD   = ADD | MOD;
  var ALL       = ADD | REM | MOD;
  var REFLOW    = (1 << 3);
  var SOURCE    = (1 << 4);
  var NO_SOURCE = (1 << 5);
  /**
   * A Pulse enables inter-operator communication during a run of the
   * dataflow graph. In addition to the current timestamp, a pulse may also
   * contain a change-set of added, removed or modified data tuples, as well as
   * a pointer to a full backing data source. Tuple change sets may not
   * be fully materialized; for example, to prevent needless array creation
   * a change set may include larger arrays and corresponding filter functions.
   * The pulse provides a {@link visit} method to enable proper and efficient
   * iteration over requested data tuples.
   *
   * In addition, each pulse can track modification flags for data tuple fields.
   * Responsible transform operators should call the {@link modifies} method to
   * indicate changes to data fields. The {@link modified} method enables
   * querying of this modification state.
   *
   * @constructor
   * @param {Dataflow} dataflow - The backing dataflow instance.
   */
  function Pulse(dataflow, stamp) {
    this.dataflow = dataflow;
    this.stamp = stamp == null ? -1 : stamp;
    this.add = [];
    this.rem = [];
    this.mod = [];
    this.fields = null;
    this.encode = null;
  }

  var prototype$1 = Pulse.prototype;

  /**
   * Sentinel value indicating pulse propagation should stop.
   */
  prototype$1.StopPropagation = StopPropagation;

  /**
   * Boolean flag indicating ADD (added) tuples.
   */
  prototype$1.ADD = ADD;

  /**
   * Boolean flag indicating REM (removed) tuples.
   */
  prototype$1.REM = REM;

  /**
   * Boolean flag indicating MOD (modified) tuples.
   */
  prototype$1.MOD = MOD;

  /**
   * Boolean flag indicating ADD (added) and REM (removed) tuples.
   */
  prototype$1.ADD_REM = ADD_REM;

  /**
   * Boolean flag indicating ADD (added) and MOD (modified) tuples.
   */
  prototype$1.ADD_MOD = ADD_MOD;

  /**
   * Boolean flag indicating ADD, REM and MOD tuples.
   */
  prototype$1.ALL = ALL;

  /**
   * Boolean flag indicating all tuples in a data source
   * except for the ADD, REM and MOD tuples.
   */
  prototype$1.REFLOW = REFLOW;

  /**
   * Boolean flag indicating a 'pass-through' to a
   * backing data source, ignoring ADD, REM and MOD tuples.
   */
  prototype$1.SOURCE = SOURCE;

  /**
   * Boolean flag indicating that source data should be
   * suppressed when creating a forked pulse.
   */
  prototype$1.NO_SOURCE = NO_SOURCE;

  /**
   * Creates a new pulse based on the values of this pulse.
   * The dataflow, time stamp and field modification values are copied over.
   * By default, new empty ADD, REM and MOD arrays are created.
   * @param {number} flags - Integer of boolean flags indicating which (if any)
   *   tuple arrays should be copied to the new pulse. The supported flag values
   *   are ADD, REM and MOD. Array references are copied directly: new array
   *   instances are not created.
   * @return {Pulse}
   * @see init
   */
  prototype$1.fork = function(flags) {
    return new Pulse(this.dataflow).init(this, flags);
  };

  /**
   * Initialize this pulse based on the values of another pulse. This method
   * is used internally by {@link fork} to initialize a new forked tuple.
   * The dataflow, time stamp and field modification values are copied over.
   * By default, new empty ADD, REM and MOD arrays are created.
   * @param {Pulse} src - The source pulse to copy from.
   * @param {number} flags - Integer of boolean flags indicating which (if any)
   *   tuple arrays should be copied to the new pulse. The supported flag values
   *   are ADD, REM and MOD. Array references are copied directly: new array
   *   instances are not created. By default, source data arrays are copied
   *   to the new pulse. Use the NO_SOURCE flag to enforce a null source.
   * @return {Pulse}
   */
  prototype$1.init = function(src, flags) {
    var p = this;
    p.stamp = src.stamp;
    p.source = (flags & NO_SOURCE) ? null : src.source;
    p.encode = src.encode;
    if (src.fields) p.fields = src.fields;
    p.add = (flags & ADD) ? (p.addF = src.addF, src.add) : (p.addF = null, []);
    p.rem = (flags & REM) ? (p.remF = src.remF, src.rem) : (p.remF = null, []);
    p.mod = (flags & MOD) ? (p.modF = src.modF, src.mod) : (p.modF = null, []);
    return p;
  };

  /**
   * Schedules a function to run after this pulse propagation completes.
   * @param {function} func - The function to run.
   */
  prototype$1.runAfter = function(func) {
    this.dataflow.runAfter(this, func);
  };

  prototype$1.changed = function(flags) {
    var f = flags || ALL;
    return ((f & ADD) && this.add.length)
        || ((f & REM) && this.rem.length)
        || ((f & MOD) && this.mod.length);
  };

  prototype$1.reflow = function() {
    var len = this.add.length,
        src = this.source && this.source.length;
    if (src && src !== len) {
      len += this.mod.length;
      this.mod = this.source;
      if (src > len) this.filter(MOD, filter(this, ADD));
    }
    return this;
  };

  prototype$1.modifies = function(_) {
    var fields = array$1(_),
        hash = this.fields || (this.fields = {});
    fields.forEach(function(f) { hash[f] = true; });
    return this;
  };

  prototype$1.modified = function(_) {
    var fields = this.fields;
    return !(this.mod.length && fields) ? false
      : isArray(_) ? _.some(function(f) { return fields[f]; })
      : fields[_];
  };

  prototype$1.filter = function(flags, filter) {
    var p = this;
    if (flags & ADD) p.addF = addFilter(p.addF, filter);
    if (flags & REM) p.remF = addFilter(p.remF, filter);
    if (flags & MOD) p.modF = addFilter(p.modF, filter);
    return p;
  };

  function addFilter(a, b) {
    return a ? function(t,i) { return a(t,i) && b(t,i); } : b;
  }

  prototype$1.materialize = function(flags) {
    flags = flags || ALL;
    var p = this;
    if ((flags & ADD) && p.addF) { p.add = p.add.filter(p.addF); p.addF = null; }
    if ((flags & REM) && p.remF) { p.rem = p.rem.filter(p.remF); p.remF = null; }
    if ((flags & MOD) && p.modF) { p.mod = p.mod.filter(p.modF); p.modF = null; }
    return p;
  };

  function filter(pulse, flags) {
    var map = {};
    pulse.visit(flags, function(t) { map[t._id] = 1; });
    return function(t) { return map[t._id] ? null : t; };
  }

  prototype$1.visit = function(flags, visitor) {
    if (flags & SOURCE) {
      this.source.forEach(visitor);
      return this;
    }

    var v = visitor, src, sum;
    if (flags & ADD) visitArray(this.add, this.addF, v);
    if (flags & REM) visitArray(this.rem, this.remF, v);
    if (flags & MOD) visitArray(this.mod, this.modF, v);

    if ((flags & REFLOW) && (src = this.source)) {
      sum = this.add.length + this.mod.length;
      if (sum === src) {
        // do nothing
      } else if (sum) {
        visitArray(src, filter(this, ADD_MOD), v);
      } else {
        // if no add/rem/mod tuples, iterate directly
        src.forEach(visitor);
      }
    }

    return this;
  };

  /**
   * Represents a set of multiple pulses. Used as input for operators
   * that accept multiple pulses at a time. Contained pulses are
   * accessible via the public "pulses" array property. This pulse doe
   * not carry added, removed or modified tuples directly. However,
   * the visit method can be used to traverse all such tuples contained
   * in sub-pulses with a timestamp matching this parent multi-pulse.
   * @constructor
   * @param {Dataflow} dataflow - The backing dataflow instance.
   * @param {number} stamp - The timestamp.
   * @param {Array<Pulse>} pulses - The sub-pulses for this multi-pulse.
   */
  function MultiPulse(dataflow, stamp, pulses) {
    var p = this,
        c = 0,
        pulse, hash, i, n, f;

    this.dataflow = dataflow;
    this.stamp = stamp;
    this.fields = null;
    this.encode = null;
    this.pulses = pulses;

    for (i=0, n=pulses.length; i<n; ++i) {
      pulse = pulses[i];
      if (pulse.stamp !== stamp) continue;

      if (pulse.fields) {
        hash = p.fields || (p.fields = {});
        for (f in pulse.fields) { hash[f] = 1; }
      }

      if (pulse.changed(p.ADD)) c |= p.ADD;
      if (pulse.changed(p.REM)) c |= p.REM;
      if (pulse.changed(p.MOD)) c |= p.MOD;
    }

    this.changes = c;
  }

  var prototype$2 = inherits(MultiPulse, Pulse);

  /**
   * Creates a new pulse based on the values of this pulse.
   * The dataflow, time stamp and field modification values are copied over.
   * @return {Pulse}
   */
  prototype$2.fork = function() {
    if (arguments.length && arguments[0] !== 0) {
      error('MultiPulse fork does not support tuple change sets.');
    }
    return new Pulse(this.dataflow).init(this, 0);
  };

  prototype$2.changed = function(flags) {
    return this.changes & flags;
  };

  prototype$2.modified = function(_) {
    var p = this, fields = p.fields;
    return !(fields && (p.changes & p.MOD)) ? 0
      : isArray(_) ? _.some(function(f) { return fields[f]; })
      : fields[_];
  };

  prototype$2.filter = function() {
    error('MultiPulse does not support filtering.');
  };

  prototype$2.materialize = function() {
    error('MultiPulse does not support materialization.');
  };

  prototype$2.visit = function(flags, visitor) {
    var pulses = this.pulses, i, n;

    for (i=0, n=pulses.length; i<n; ++i) {
      if (pulses[i].stamp === this.stamp) {
        pulses[i].visit(flags, visitor);
      }
    }

    return this;
  };

  var CACHE = '_:mod:_';

  /**
   * Hash that tracks modifications to assigned values.
   * Callers *must* use the set method to update values.
   */
  function Parameters() {
    Object.defineProperty(this, CACHE, {writable:true, value: {}});
  }

  var prototype$4 = Parameters.prototype;

  function key(name, index) {
    return (index != null && index >= 0 ? index + ':' : '') + name;
  }

  /**
   * Set a parameter value. If the parameter value changes, the parameter
   * will be recorded as modified.
   * @param {string} name - The parameter name.
   * @param {number} index - The index into an array-value parameter. Ignored if
   *   the argument is undefined, null or less than zero.
   * @param {*} value - The parameter value to set.
   * @param {boolean} [force=false] - If true, records the parameter as modified
   *   even if the value is unchanged.
   * @return {Parameters} - This parameter object.
   */
  prototype$4.set = function(name, index, value, force) {
    var o = this,
        v = o[name],
        mod = o[CACHE];

    if (index != null && index >= 0) {
      if (v[index] !== value || force) {
        v[index] = value;
        mod[key(name, index)] = 1;
        mod[name] = 1;
      }
    } else if (v !== value || force) {
      o[name] = value;
      mod[name] = 1;
      if (isArray(value)) value.forEach(function(v, i) {
        mod[key(name, i)] = 1;
      });
    }

    return o;
  };

  /**
   * Tests if one or more parameters has been modified. If invoked with no
   * arguments, returns true if any parameter value has changed. If the first
   * argument is array, returns trues if any parameter name in the array has
   * changed. Otherwise, tests if the given name and optional array index has
   * changed.
   * @param {string} name - The parameter name to test.
   * @param {number} [index=undefined] - The parameter array index to test.
   * @return {boolean} - Returns true if a queried parameter was modified.
   */
  prototype$4.modified = function(name, index) {
    var mod = this[CACHE], k;
    if (!arguments.length) {
      for (k in mod) { if (mod[k]) return true; }
      return false;
    } else if (isArray(name)) {
      for (k=0; k<name.length; ++k) {
        if (mod[name[k]]) return true;
      }
      return false;
    }
    return !!mod[key(name, index)];
  };

  /**
   * Clears the modification records. After calling this method,
   * all parameters are considered unmodified.
   */
  prototype$4.clear = function() {
    return this[CACHE] = {}, this;
  };

  var OP_ID = 0;
  var PULSE = 'pulse';
  var NO_PARAMS = new Parameters();

  // Boolean Flags
var   SKIP$1     = 1;
  var MODIFIED = 2;
  /**
   * An Operator is a processing node in a dataflow graph.
   * Each operator stores a value and an optional value update function.
   * Operators can accept a hash of named parameters. Parameter values can
   * either be direct (JavaScript literals, arrays, objects) or indirect
   * (other operators whose values will be pulled dynamically). Operators
   * included as parameters will have this operator added as a dependency.
   * @constructor
   * @param {*} [init] - The initial value for this operator.
   * @param {function(object, Pulse)} [update] - An update function. Upon
   *   evaluation of this operator, the update function will be invoked and the
   *   return value will be used as the new value of this operator.
   * @param {object} [params] - The parameters for this operator.
   * @param {boolean} [react=true] - Flag indicating if this operator should
   *   listen for changes to upstream operators included as parameters.
   * @see parameters
   */
  function Operator(init, update, params, react) {
    this.id = ++OP_ID;
    this.value = init;
    this.stamp = -1;
    this.rank = -1;
    this.flags = 0;

    if (update) {
      this._update = update;
    }
    if (params) this.parameters(params, react);
  }

  var prototype$3 = Operator.prototype;

  /**
   * Returns a list of target operators dependent on this operator.
   * If this list does not exist, it is created and then returned.
   * @return {UniqueList}
   */
  prototype$3.targets = function() {
    return this._targets || (this._targets = UniqueList(id));
  };

  /**
   * Sets the value of this operator.
   * @param {*} value - the value to set.
   * @return {Number} Returns 1 if the operator value has changed
   *   according to strict equality, returns 0 otherwise.
   */
  prototype$3.set = function(value) {
    return this.value !== value ? (this.value = value, 1) : 0;
  };

  function flag(bit) {
    return function(state) {
      var f = this.flags;
      if (arguments.length === 0) return !!(f & bit);
      this.flags = state ? (f | bit) : (f & ~bit);
      return this;
    };
  }

  /**
   * Indicates that operator evaluation should be skipped on the next pulse.
   * This operator will still propagate incoming pulses, but its update function
   * will not be invoked. The skip flag is reset after every pulse, so calling
   * this method will affect processing of the next pulse only.
   */
  prototype$3.skip = flag(SKIP$1);

  /**
   * Indicates that this operator's value has been modified on its most recent
   * pulse. Normally modification is checked via strict equality; however, in
   * some cases it is more efficient to update the internal state of an object.
   * In those cases, the modified flag can be used to trigger propagation. Once
   * set, the modification flag persists across pulses until unset. The flag can
   * be used with the last timestamp to test if a modification is recent.
   */
  prototype$3.modified = flag(MODIFIED);

  /**
   * Sets the parameters for this operator. The parameter values are analyzed for
   * operator instances. If found, this operator will be added as a dependency
   * of the parameterizing operator. Operator values are dynamically marshalled
   * from each operator parameter prior to evaluation. If a parameter value is
   * an array, the array will also be searched for Operator instances. However,
   * the search does not recurse into sub-arrays or object properties.
   * @param {object} params - A hash of operator parameters.
   * @param {boolean} [react=true] - A flag indicating if this operator should
   *   automatically update (react) when parameter values change. In other words,
   *   this flag determines if the operator registers itself as a listener on
   *   any upstream operators included in the parameters.
   * @return {Operator} this operator instance.
   */
  prototype$3.parameters = function(params, react) {
    react = react !== false;
    var self = this,
        argval = (self._argval = self._argval || new Parameters()),
        argops = (self._argops = self._argops || []),
        name, value, n, i;

    function add(name, index, value) {
      if (value instanceof Operator) {
        if (value !== self && react) value.targets().add(self);
        argops.push({op:value, name:name, index:index});
      } else {
        argval.set(name, index, value);
      }
    }

    for (name in params) {
      value = params[name];

      if (name === PULSE) {
        array$1(value).forEach(function(op) {
          if (!(op instanceof Operator)) {
            error('Pulse parameters must be operator instances.');
          } else if (op !== self) {
            op.targets().add(self);
          }
        });
        self.source = value;
      } else if (isArray(value)) {
        argval.set(name, -1, Array(n = value.length));
        for (i=0; i<n; ++i) add(name, i, value[i]);
      } else {
        add(name, -1, value);
      }
    }

    this.marshall().clear(); // initialize values
    return self;
  };

  /**
   * Internal method for marshalling parameter values.
   * Visits each operator dependency to pull the latest value.
   * @return {Parameters} A Parameters object to pass to the update function.
   */
  prototype$3.marshall = function(stamp) {
    var argval = this._argval || NO_PARAMS,
        argops = this._argops, item, i, n, op, mod;

    if (argops && (n = argops.length)) {
      for (i=0; i<n; ++i) {
        item = argops[i];
        op = item.op;
        mod = op.modified() && op.stamp === stamp;
        argval.set(item.name, item.index, op.value, mod);
      }
    }
    return argval;
  };

  /**
   * Delegate method to perform operator processing.
   * Subclasses can override this method to perform custom processing.
   * By default, it marshalls parameters and calls the update function
   * if that function is defined. If the update function does not
   * change the operator value then StopPropagation is returned.
   * If no update function is defined, this method does nothing.
   * @param {Pulse} pulse - the current dataflow pulse.
   * @return The output pulse or StopPropagation. A falsy return value
   *   (including undefined) will let the input pulse pass through.
   */
  prototype$3.evaluate = function(pulse) {
    if (this._update) {
      var params = this.marshall(pulse.stamp),
          v = this._update(params, pulse);

      params.clear();
      if (v !== this.value) {
        this.value = v;
      } else if (!this.modified()) {
        return pulse.StopPropagation;
      }
    }
  };

  /**
   * Run this operator for the current pulse. If this operator has already
   * been run at (or after) the pulse timestamp, returns StopPropagation.
   * Internally, this method calls {@link evaluate} to perform processing.
   * If {@link evaluate} returns a falsy value, the input pulse is returned.
   * This method should NOT be overridden, instead overrride {@link evaluate}.
   * @param {Pulse} pulse - the current dataflow pulse.
   * @return the output pulse for this operator (or StopPropagation)
   */
  prototype$3.run = function(pulse) {
    if (pulse.stamp <= this.stamp) return pulse.StopPropagation;
    var rv = this.skip() ? (this.skip(false), 0) : this.evaluate(pulse);
    return this.stamp = pulse.stamp, this.pulse = rv || pulse;
  };

  var STREAM_ID = 0;

  /**
   * Models an event stream.
   * @constructor
   * @param {function(Object, number): boolean} [filter] - Filter predicate.
   *   Events pass through when truthy, events are suppressed when falsy.
   * @param {function(Object): *} [apply] - Applied to input events to produce
   *   new event values.
   * @param {function(Object)} [receive] - Event callback function to invoke
   *   upon receipt of a new event. Use to override standard event processing.
   */
  function EventStream(filter, apply, receive) {
    this.id = ++STREAM_ID;
    this.value = null;
    if (receive) this.receive = receive;
    if (filter) this._filter = filter;
    if (apply) this._apply = apply;
  }

  /**
   * Creates a new event stream instance with the provided
   * (optional) filter, apply and receive functions.
   * @param {function(Object, number): boolean} [filter] - Filter predicate.
   *   Events pass through when truthy, events are suppressed when falsy.
   * @param {function(Object): *} [apply] - Applied to input events to produce
   *   new event values.
   * @see EventStream
   */
  function stream(filter, apply, receive) {
    return new EventStream(filter, apply, receive);
  }

  var prototype$5 = EventStream.prototype;

  prototype$5._filter = truthy;

  prototype$5._apply = identity$1;

  prototype$5.targets = function() {
    return this._targets || (this._targets = UniqueList(id));
  };

  prototype$5.consume = function(_) {
    if (!arguments.length) return !!this._consume;
    return (this._consume = !!_, this);
  };

  prototype$5.receive = function(evt) {
    if (this._filter(evt)) {
      var val = (this.value = this._apply(evt)),
          trg = this._targets,
          n = trg ? trg.length : 0,
          i = 0;

      for (; i<n; ++i) trg[i].receive(val);

      if (this._consume) {
        evt.preventDefault();
        evt.stopPropagation();
      }
    }
  };

  prototype$5.filter = function(filter) {
    var s = stream(filter);
    return (this.targets().add(s), s);
  };

  prototype$5.apply = function(apply) {
    var s = stream(null, apply);
    return (this.targets().add(s), s);
  };

  prototype$5.merge = function() {
    var s = stream();

    this.targets().add(s);
    for (var i=0, n=arguments.length; i<n; ++i) {
      arguments[i].targets().add(s);
    }

    return s;
  };

  prototype$5.throttle = function(pause) {
    var t = -1;
    return this.filter(function() {
      var now = Date.now();
      return (now - t) > pause ? (t = now, 1) : 0;
    });
  };

  prototype$5.debounce = function(delay) {
    var s = stream(), evt = null, tid = null;

    function callback() {
      var df = evt.dataflow;
      s.receive(evt);
      evt = null; tid = null;
      if (df && df.run) df.run();
    }

    this.targets().add(stream(null, null, function(e) {
      evt = e;
      if (tid) clearTimeout(tid);
      tid = setTimeout(callback, delay);
    }));

    return s;
  };

  prototype$5.between = function(a, b) {
    var active = false;
    a.targets().add(stream(null, null, function() { active = true; }));
    b.targets().add(stream(null, null, function() { active = false; }));
    return this.filter(function() { return active; });
  };

  function Heap(comparator) {
    this.cmp = comparator;
    this.nodes = [];
  }

  var prototype$6 = Heap.prototype;

  prototype$6.size = function() {
    return this.nodes.length;
  };

  prototype$6.clear = function() {
    return (this.nodes = [], this);
  };

  prototype$6.peek = function() {
    return this.nodes[0];
  };

  prototype$6.push = function(x) {
    var array = this.nodes;
    array.push(x);
    return siftdown(array, 0, array.length-1, this.cmp);
  };

  prototype$6.pop = function() {
    var array = this.nodes,
        last = array.pop(),
        item;

    if (array.length) {
      item = array[0];
      array[0] = last;
      siftup(array, 0, this.cmp);
    } else {
      item = last;
    }
    return item;
  };

  prototype$6.replace = function(item) {
    var array = this.nodes,
        retval = array[0];
    array[0] = item;
    siftup(array, 0, this.cmp);
    return retval;
  };

  prototype$6.pushpop = function(item) {
    var array = this.nodes, ref = array[0];
    if (array.length && this.cmp(ref, item) < 0) {
      array[0] = item;
      item = ref;
      siftup(array, 0, this.cmp);
    }
    return item;
  };

  function siftdown(array, start, idx, cmp) {
    var item, parent, pidx;

    item = array[idx];
    while (idx > start) {
      pidx = (idx - 1) >> 1;
      parent = array[pidx];
      if (cmp(item, parent) < 0) {
        array[idx] = parent;
        idx = pidx;
        continue;
      }
      break;
    }
    return (array[idx] = item);
  }

  function siftup(array, idx, cmp) {
    var start = idx,
        end = array.length,
        item = array[idx],
        cidx = 2 * idx + 1, ridx;

    while (cidx < end) {
      ridx = cidx + 1;
      if (ridx < end && cmp(array[cidx], array[ridx]) >= 0) {
        cidx = ridx;
      }
      array[idx] = array[cidx];
      idx = cidx;
      cidx = 2 * idx + 1;
    }
    array[idx] = item;
    return siftdown(array, start, idx, cmp);
  }

  var RANK = 1;
  var NO_OPT = {skip: false, force: false};
  var SKIP = {skip: true};

  /**
   * A dataflow graph for reactive processing of data streams.
   * @constructor
   */
  function Dataflow() {
    this._clock = 0;
    this._pulses = {};
    this._touched = UniqueList(id);
    this._postrun = [];
    this._running = false;
    this._log = logger();
  }

  var prototype = Dataflow.prototype;

  /**
   * The current timestamp of this dataflow. This value reflects the
   * timestamp of the previous dataflow run. The dataflow is initialized
   * with a stamp value of 0. The initial run of the dataflow will have
   * a timestap of 1, and so on. This value will match the
   * {@link Pulse.stamp} property.
   * @return {number} - The current timestamp value.
   */
  prototype.stamp = function() {
    return this._clock;
  };

  /**
   * Touches an operator, ensuring that it will be processed by the
   * scheduler next time the dataflow is run.
   * @param {Operator} op - The operator to touch.
   * @param {object} [options] - Additional options hash.
   * @param {boolean} [options.skip] - If true, the operator will
   *   be skipped: it will not be evaluated, but its dependents will be.
   * @return {Dataflow}
   */
  prototype.touch = function(op, options) {
    var opt = options || NO_OPT;
    this._touched.add(op);
    if (opt.skip) op.skip(true);
    return this;
  };

  /**
   * Add an operator to the dataflow graph. This function accepts a
   * variety of input argument types. The basic signature support an
   * initial value, update function and parameters. If the first parameter
   * is an Operator instance, it will be added directly. If it is a
   * constructor for an Operator subclass, a new instance will be instantiated.
   * Otherwise, if the first parameter is a function instance, it will be used
   * as the update function and a null initial value is assumed.
   * @param {*} init - One of: the operator to add, the initial value of
   *   the operator, an operator class to instantiate, or an update function.
   * @param {function} [update] - The operator update function.
   * @param {object} [params] - The operator parameters.
   * @param {boolean} [react=true] - Flag indicating if this operator should
   *   listen for changes to upstream operators included as parameters.
   * @return {Operator} - The added operator.
   */
  prototype.add = function(init, update, params, react) {
    var op = (init instanceof Operator) ? init
      : isFunction(init)
        ? ((init.prototype instanceof Operator) ? new init(update, params)
        : new Operator(null, init, update, params))
      : new Operator(init, update, params, react);

    op.rank = ++RANK;
    this.touch(op);
    return op;
  };

  /**
   * Updates the value of the given operator.
   * @param {Operator} op - The operator to update.
   * @param {*} value - The value to set.
   * @param {object} [options] - Additional options hash.
   * @param {boolean} [options.force] - If true, the operator will
   *   be re-evaluated even if its value has not changed.
   * @param {boolean} [options.skip] - If true, the operator will
   *   be skipped: it will not be evaluated, but its dependents will be.
   * @return {Dataflow}
   */
  prototype.update = function(op, value, options) {
    var opt = options || NO_OPT;
    if (op.set(value) || opt.force) {
      this.touch(op, opt);
    }
    return this;
  };

  /**
   * Pulses an operator with a changeset of tuples. The pulse will be
   * applied the next time the dataflow is run.
   * @param {Operator} op - The operator to pulse.
   * @param {ChangeSet} value - The tuple changeset to apply.
   * @param {object} [options] - Additional options hash.
   * @param {boolean} [options.skip] - If true, the operator will
   *   be skipped: it will not be evaluated, but its dependents will be.
   * @return {Dataflow}
   */
  prototype.pulse = function(op, changeset, options) {
    var p = new Pulse(this, this._clock + 1);
    p.target = op;
    this._pulses[op.id] = changeset.pulse(p, op.value);
    return this.touch(op, options || NO_OPT);
  };

  // EVENT HANDLING

  /**
   * Create a new event stream from an event source.
   * @param {object} source - The event source to monitor. The input must
   *  support the addEventListener method.
   * @param {string} type - The event type.
   * @param {function(object): boolean} [filter] - Event filter function.
   * @param {function(object): *} [apply] - Event application function.
   *   If provided, this function will be invoked and the result will be
   *   used as the downstream event value.
   * @return {EventStream}
   */
  prototype.events = function(source, type, filter, apply) {
    var df = this,
        s = stream(filter, apply),
        send = function(e) {
          e.dataflow = df;
          s.receive(e);
          df.run();
        },
        sources;

    if (typeof source === 'string' && typeof document !== 'undefined') {
      sources = document.querySelectorAll(source);
    } else {
      sources = array$1(source);
    }

    for (var i=0, n=sources.length; i<n; ++i) {
      sources[i].addEventListener(type, send);
    }

    return s;
  }

  /**
   * Perform operator updates in response to events. Applies an
   * update function to compute a new operator value. If the update function
   * returns a {@link ChangeSet}, the operator will be pulsed with those tuple
   * changes. Otherwise, the operator value will be updated to the return value.
   * @param {EventStream|Operator} source - The event source to react to.
   *   This argument can be either an EventStream or an Operator.
   * @param {Operator|function(object):Operator} target - The operator to update.
   *   This argument can either be an Operator instance or (if the source
   *   argument is an EventStream), a function that accepts an event object as
   *   input and returns an Operator to target.
   * @param {function(Parameters,Event): *} [update] - Optional update function
   *   to compute the new operator value, or a literal value to set. Update
   *   functions expect to receive a parameter object and event as arguments.
   *   This function can either return a new operator value or (if the source
   *   argument is an EventStream) a {@link ChangeSet} instance to pulse
   *   the target operator with tuple changes.
   * @param {object} [params] - The update function parameters.
   * @param {object} [options] - Additional options hash. If not overridden,
   *   updated operators will be skipped by default.
   * @param {boolean} [options.skip] - If true, the operator will
   *  be skipped: it will not be evaluated, but its dependents will be.
   * @param {boolean} [options.force] - If true, the operator will
   *   be re-evaluated even if its value has not changed.
   * @return {Dataflow}
   */
  prototype.on = function(source, target, update, params, options) {
    var fn = source instanceof Operator ? onOperator : onStream;
    return fn(this, source, target, update, params, options), this;
  };

  function onStream(df, stream, target, update, params, options) {
    var opt = extend({}, options, SKIP), func, op;

    if (!isFunction(target)) target = constant$1(target);

    if (update === undefined) {
      func = function(e) {
        df.touch(target(e));
      };
    } else if (isFunction(update)) {
      op = new Operator(null, update, params, false);
      func = function(e) {
        var t = target(e),
            v = (op.evaluate(e), op.value);
        isChangeSet(v) ? df.pulse(t, v, options) : df.update(t, v, opt);
      };
    } else {
      func = function(e) {
        df.update(target(e), update, opt);
      };
    }

    stream.apply(func);
  }

  function onOperator(df, source, target, update, params, options) {
    var func, op;

    if (update === undefined) {
      op = target;
    } else {
      func = isFunction(update) ? update : constant$1(update);
      op = new Operator(null, function(_, pulse) {
        if (!target.skip()) return target.skip(true).value = func(_, pulse);
      }, params, false);
      op.modified(options && options.force);
      op.skip(true); // skip first invocation
      op.value = target.value;
      op.rank = 0;
      op.targets().add(target);
    }

    source.targets().add(op);
  }

  // RUN PROPAGATION CYCLE

  /**
   * Runs the dataflow. This method will increment the current timestamp
   * and process all updated, pulsed and touched operators. When run for
   * the first time, all registered operators will be processed.
   */
  prototype.run = function() {
    if (!this._touched.length) return 0;

    var df = this,
        pq = new Heap(function(a, b) { return a.rank - b.rank; }),
        pulses = df._pulses,
        pulse = new Pulse(df, ++df._clock),
        level = df.logLevel(),
        count = 0,
        op, next, dt;

    df._running = true;

    if (level >= Info) {
      dt = Date.now();
      df.debug('-- START PROPAGATION (' + pulse.stamp + ') -----');
    }

    // initialize queue
    df._touched.forEach(function(op) {
      if (!pulses[op.id]) pulses[op.id] = pulse;
      pq.push(op);
    });

    // reset dataflow state
    df._touched = UniqueList(id);
    df._pulses = {};

    try {
      while (pq.size() > 0) {
        op = pq.pop(); // process next operator in queue
        next = op.run(getPulse(df, df._clock, op, pulses));

        if (level >= Debug) {
          df.debug(
            'Op: ' + op.id + ', rank:' + op.rank + ' ' + op.constructor.name,
            next === StopPropagation ? 'STOP' : {pulse: next},
            {value: op.value}
          );
        }

        // propagate the pulse
        if (next !== StopPropagation) {
          pulse = next;
          if (op._targets) op._targets.forEach(function(op) {
            if (!pulses[op.id]) pq.push(op), pulses[op.id] = pulse;
          });
        }

        // increment visit counter
        ++count;
      }
    } catch (err) {
      df.error(err);
    }

    // invoke callbacks queued via runAfter
    df._running = false;
    if (df._postrun.length) {
      df._postrun.forEach(function(f) {
        try { f(); } catch (err) { df.error(err); }
      });
      df._postrun = [];
    }

    if (level >= Info) {
      dt = Date.now() - dt;
      df.info('> Pulse ' + pulse.stamp + ': ' + count + ' operators; ' + dt + 'ms');
    }

    return count;
  };

  /**
   * Schedules a callback function to be invoked after the given pulse
   * completes. If the pulse has completed, the function is invoked
   * immediately. If the input pulse does not have a stamp value matching
   * the current timestamp, an error will be raised.
   * @param {Pulse} pulse - The pulse to run after.
   * @param {function()} callback - The callback function to run.
   */
  prototype.runAfter = function(pulse, callback) {
    if (pulse.stamp !== this._clock) {
      this.error('Can only schedule runAfter on the current timestamp.');
    }
    if (this._running) {
      // pulse propagation is currently running, queue to run after
      this._postrun.push(callback);
    } else {
      // pulse propagation already complete, invoke immediately
      try { callback(); } catch (err) { this.error(err); }
    }
  };

  function getPulse(df, stamp, op, pulses) {
    // if the operator has an explicit source, try to pull the pulse from it
    var s = op.source, p, q;
    if (s && isArray(s)) {
      // if source array, consolidate pulses into a multi-pulse
      return new MultiPulse(df, stamp, s.map(function(_) { return _.pulse; }));
    } else {
      // return current pulse with correct source data; copy source as needed
      // priority: 1. pulse with explicit target, 2. current pulse from source
      q = pulses[op.id];
      p = (s && (s=s.pulse) && s.stamp === stamp && q.target !== op) ? s : q;
      if (s) p.source = s.source;
      return p;
    }
  }

  // LOGGING AND ERROR HANDLING

  /**
   * Handle an error. By default, this method re-throws the input error.
   * This method can be overridden for custom error handling.
   */
  prototype.error = function(err) {
    throw err;
  };

  function logMethod(method) {
    return function() {
      return this._log[method].apply(this._log, arguments);
    };
  }

  /**
   * Logs a warning message. By default, logged messages are written to console
   * output. The message will only be logged if the current log level is high
   * enough to permit warning messages.
   */
  prototype.warn = logMethod('warn');

  /**
   * Logs a information message. By default, logged messages are written to
   * console output. The message will only be logged if the current log level is
   * high enough to permit information messages.
   */
  prototype.info = logMethod('info');

  /**
   * Logs a debug message. By default, logged messages are written to console
   * output. The message will only be logged if the current log level is high
   * enough to permit debug messages.
   */
  prototype.debug = logMethod('debug');

  /**
   * Get or set the current log level. If an argument is provided, it
   * will be used as the new log level.
   * @param {number} [level] - Should be one of None, Warn, Info
   * @return {number} - The current log level.
   */
  prototype.logLevel = logMethod('level');

  /**
   * Abstract class for operators that process data tuples.
   * Subclasses must provide a {@link transform} method for operator processing.
   * @constructor
   * @param {*} [init] - The initial value for this operator.
   * @param {object} [params] - The parameters for this operator.
   * @param {Operator} [source] - The operator from which to receive pulses.
   */
  function Transform(init, params) {
    Operator.call(this, init, null, params);
  }

  var prototype$7 = inherits(Transform, Operator);

  /**
   * Overrides {@link Operator.evaluate} for transform operators.
   * Marshalls parameter values and then invokes {@link transform}.
   * @param {Pulse} pulse - the current dataflow pulse.
   * @return {Pulse} The output pulse (or StopPropagation). A falsy return
       value (including undefined) will let the input pulse pass through.
   */
  prototype$7.evaluate = function(pulse) {
    var params = this.marshall(pulse.stamp),
        out = this.transform(params, pulse);
    params.clear();
    return out;
  };

  /**
   * Process incoming pulses.
   * Subclasses should override this method to implement transforms.
   * @param {Parameters} _ - The operator parameter values.
   * @param {Pulse} pulse - The current dataflow pulse.
   * @return {Pulse} The output pulse (or StopPropagation). A falsy return
   *   value (including undefined) will let the input pulse pass through.
   */
  prototype$7.transform = function() {};

  /**
   * Applies a function to a data tuple and stores the result.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.apply - The function to apply to each tuple.
   * @param {string} params.as - The field name under which to store the result.
   */
  function Apply(params) {
    Transform.call(this, null, params);
  }

  var prototype$8 = inherits(Apply, Transform);

  prototype$8.transform = function(_, pulse) {
    var func = _.apply,
        field = _.as,
        mod;

    function set(t) {
      t[field] = func(t, _);
    }

    if (_.modified()) {
      // parameters updated, need to reflow
      pulse.materialize().reflow().visit(pulse.SOURCE, set);
    } else {
      mod = pulse.modified(func.fields);
      pulse.visit(mod ? pulse.ADD_MOD : pulse.ADD, set);
    }

    return pulse.modifies(field);
  };

  /**
   * Generates a binning function for discretizing data.
   * @constructor
   * @param {object} params - The parameters for this operator. The
   *   provided values should be valid options for the {@link bin} function.
   * @param {function(object): *} params.field - The data field to bin.
   */
  function Bin(params) {
    Operator.call(this, null, update, params);
  }

  inherits(Bin, Operator);

  function update(_) {
    if (this.value && !_.modified()) return this.value;

    var field = _.field,
        bins  = bin(_),
        start = bins.start,
        step  = bins.step;

    var f = function(t) {
      var v = field(t);
      return v == null ? null
        : start + step * Math.floor((+v - start) / step);
    };
    return accessor(
      f,
      accessorFields(field.fields),
      _.name || 'bin_' + accessorName(field)
    );
  }

  /**
   * Collects all data tuples that pass through this operator.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(*,*): number} [params.sort] - An optional
   *   comparator function for additionally sorting the collected tuples.
   */
  function Collect(params) {
    Transform.call(this, [], params);
  }

  var prototype$9 = inherits(Collect, Transform);

  prototype$9.transform = function(_, pulse) {
    var out = pulse.fork(pulse.ALL),
        add = pulse.changed(pulse.ADD),
        mod = pulse.changed(),
        sort = _.sort,
        data = this.value,
        push = function(t) { data.push(t); },
        n = 0, map, adds;

    if (out.rem.length) { // build id map and filter data array
      map = {};
      out.visit(out.REM, function(t) { map[t._id] = 1; ++n; });
      data = data.filter(function(t) { return !map[t._id]; });
    }

    if (sort) {
      if (_.modified('sort') || pulse.modified(sort.fields)) {
        // need to re-sort the full data array
        out.visit(out.ADD, push);
        data.sort(sort);
        mod = true;
      } else if (add) {
        // sort adds only, then merge
        adds = [];
        out.visit(out.ADD, function(t) { adds.push(t); });
        data = merge$1(sort, data, adds.sort(sort));
      }
    } else if (add) {
      // no sort, so simply add new tuples
      out.visit(out.ADD, push);
    }

    this.modified(mod);
    this.value = out.source = data;
    return out;
  };

  /**
   * Generates a comparator function.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {Array<function(object): *>} params.fields - The fields to compare.
   * @param {Array<string>} [params.orders] - The sort orders.
   *   Each entry should be one of "ascending" (default) or "descending".
   */
  function Compare(params) {
    Operator.call(this, null, update$1, params);
  }

  inherits(Compare, Operator);

  function update$1(_) {
    return (this.value && !_.modified())
      ? this.value
      : compare(_.fields, _.orders);
  }

  var prefix = "$";

  function Map() {}

  Map.prototype = map$1.prototype = {
    constructor: Map,
    has: function(key) {
      return (prefix + key) in this;
    },
    get: function(key) {
      return this[prefix + key];
    },
    set: function(key, value) {
      this[prefix + key] = value;
      return this;
    },
    remove: function(key) {
      var property = prefix + key;
      return property in this && delete this[property];
    },
    clear: function() {
      for (var property in this) if (property[0] === prefix) delete this[property];
    },
    keys: function() {
      var keys = [];
      for (var property in this) if (property[0] === prefix) keys.push(property.slice(1));
      return keys;
    },
    values: function() {
      var values = [];
      for (var property in this) if (property[0] === prefix) values.push(this[property]);
      return values;
    },
    entries: function() {
      var entries = [];
      for (var property in this) if (property[0] === prefix) entries.push({key: property.slice(1), value: this[property]});
      return entries;
    },
    size: function() {
      var size = 0;
      for (var property in this) if (property[0] === prefix) ++size;
      return size;
    },
    empty: function() {
      for (var property in this) if (property[0] === prefix) return false;
      return true;
    },
    each: function(f) {
      for (var property in this) if (property[0] === prefix) f(this[property], property.slice(1), this);
    }
  };

  function map$1(object, f) {
    var map = new Map;

    // Copy constructor.
    if (object instanceof Map) object.each(function(value, key) { map.set(key, value); });

    // Index array by numeric index or specified key function.
    else if (Array.isArray(object)) {
      var i = -1,
          n = object.length,
          o;

      if (f == null) while (++i < n) map.set(i, object[i]);
      else while (++i < n) map.set(f(o = object[i], i, object), o);
    }

    // Convert object to map.
    else if (object) for (var key in object) map.set(key, object[key]);

    return map;
  }

  function nest() {
    var keys = [],
        sortKeys = [],
        sortValues,
        rollup,
        nest;

    function apply(array, depth, createResult, setResult) {
      if (depth >= keys.length) return rollup != null
          ? rollup(array) : (sortValues != null
          ? array.sort(sortValues)
          : array);

      var i = -1,
          n = array.length,
          key = keys[depth++],
          keyValue,
          value,
          valuesByKey = map$1(),
          values,
          result = createResult();

      while (++i < n) {
        if (values = valuesByKey.get(keyValue = key(value = array[i]) + "")) {
          values.push(value);
        } else {
          valuesByKey.set(keyValue, [value]);
        }
      }

      valuesByKey.each(function(values, key) {
        setResult(result, key, apply(values, depth, createResult, setResult));
      });

      return result;
    }

    function entries(map, depth) {
      if (++depth > keys.length) return map;
      var array, sortKey = sortKeys[depth - 1];
      if (rollup != null && depth >= keys.length) array = map.entries();
      else array = [], map.each(function(v, k) { array.push({key: k, values: entries(v, depth)}); });
      return sortKey != null ? array.sort(function(a, b) { return sortKey(a.key, b.key); }) : array;
    }

    return nest = {
      object: function(array) { return apply(array, 0, createObject, setObject); },
      map: function(array) { return apply(array, 0, createMap, setMap); },
      entries: function(array) { return entries(apply(array, 0, createMap, setMap), 0); },
      key: function(d) { keys.push(d); return nest; },
      sortKeys: function(order) { sortKeys[keys.length - 1] = order; return nest; },
      sortValues: function(order) { sortValues = order; return nest; },
      rollup: function(f) { rollup = f; return nest; }
    };
  }

  function createObject() {
    return {};
  }

  function setObject(object, key, value) {
    object[key] = value;
  }

  function createMap() {
    return map$1();
  }

  function setMap(map, key, value) {
    map.set(key, value);
  }

  var proto = map$1.prototype;

  function values(map) {
    var values = [];
    for (var key in map) values.push(map[key]);
    return values;
  }

  /**
   * An index that counts occurrences of field values. The resulting operator
   * value is a map from string-coerced field values to integer counts.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.field - The field accessor to index.
   */
  function CountIndex(params) {
    Transform.call(this, map$1(), params);
  }

  var prototype$10 = inherits(CountIndex, Transform);

  prototype$10.transform = function(_, pulse) {
    var field = _.field,
        index = this.value,
        mod = true;

    function add(t) {
      var v = field(t);
      index.set(v, 1 + (+index.get(v) || 0));
    }

    function rem(t) {
      var v = field(t), c = index.get(v) - 1;
      if (c > 0) {
        index.set(v, c);
      } else {
        index.remove(v);
      }
    }

    if (_.modified('field') || pulse.modified(field.fields)) {
      this.value = index = map$1();
      pulse.visit(pulse.SOURCE, add);
    } else if (pulse.changed(pulse.ADD_REM)) {
      pulse.visit(pulse.ADD, add);
      pulse.visit(pulse.REM, rem);
    } else {
      mod = false;
    }

    this.modified(mod);
    return pulse;
  };

  /**
   * Count regexp-defined pattern occurrences in a text field.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.field - An accessor for the text field.
   * @param {string} [params.pattern] - RegExp string defining the text pattern.
   * @param {string} [params.case] - One of 'lower', 'upper' or null (mixed) case.
   * @param {string} [params.stopwords] - RegExp string of words to ignore.
   */
  function CountPattern(params) {
    Transform.call(this, null, params);
  }

  function tokenize(text, tcase, match) {
    switch (tcase) {
      case 'upper': text = text.toUpperCase(); break;
      case 'lower': text = text.toLowerCase(); break;
    }
    return text.match(match);
  }

  var prototype$11 = inherits(CountPattern, Transform);

  prototype$11.transform = function(_, pulse) {
    function process(update) {
      return function(tuple) {
        var tokens = tokenize(get(tuple), _.case, match) || [], t;
        for (var i=0, n=tokens.length; i<n; ++i) {
          if (!stop.test(t = tokens[i])) update(t);
        }
      };
    }

    var init = this._parameterCheck(_, pulse),
        counts = this._counts,
        match = this._match,
        stop = this._stop,
        get = _.field,
        add = process(function(t) { counts[t] = 1 + (counts[t] || 0); }),
        rem = process(function(t) { counts[t] -= 1; });

    if (init) {
      pulse.visit(pulse.SOURCE, add);
    } else {
      pulse.visit(pulse.ADD, add);
      pulse.visit(pulse.REM, rem);
    }

    return this._finish(pulse); // generate output tuples
  };

  prototype$11._parameterCheck = function(_, pulse) {
    var init = false;

    if (_.modified('stopwords') || !this._stop) {
      this._stop = new RegExp('^' + (_.stopwords || '') + '$', 'i');
      init = true;
    }

    if (_.modified('pattern') || !this._match) {
      this._match = new RegExp((_.pattern || '[\\w\']+'), 'g');
      init = true;
    }

    if (_.modified('field') || pulse.modified(_.field.fields)) {
      init = true;
    }

    if (init) this._counts = {};
    return init;
  }

  prototype$11._finish = function(pulse) {
    var counts = this._counts,
        tuples = this._tuples || (this._tuples = {}),
        out = pulse.fork(),
        w, t, c;

    for (w in counts) {
      t = tuples[w];
      c = counts[w] || 0;
      if (!t && c) {
        tuples[w] = (t = ingest({text: w, count: c}));
        out.add.push(t);
      } else if (c === 0) {
        if (t) out.rem.push(t);
        counts[w] = null;
        tuples[w] = null;
      } else if (t.count !== c) {
        t.count = c;
        out.mod.push(t);
      }
    }

    return out.modifies(['text', 'count']);
  };

  /**
   * Computes extents (min/max) for a data field.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.field - The field over which to compute extends.
   */
  function Extent(params) {
    Transform.call(this, [+Infinity, -Infinity], params);
  }

  var prototype$12 = inherits(Extent, Transform);

  prototype$12.transform = function(_, pulse) {
    var extent = this.value,
        field = _.field,
        min = extent[0],
        max = extent[1],
        flag = pulse.ADD,
        mod;

    mod = pulse.changed()
       || pulse.modified(field.fields)
       || _.modified('field');

    if (mod) {
      flag = pulse.SOURCE;
      min = +Infinity;
      max = -Infinity;
    }

    pulse.visit(flag, function(t) {
      var v = field(t);
      if (v < min) min = v;
      if (v > max) max = v;
    });

    this.value = [min, max];
  };

  /**
   * Provides a bridge between a parent transform and a target subflow that
   * consumes only a subset of the tuples that pass through the parent.
   * @constructor
   * @param {Pulse} pulse - A pulse to use as the value of this operator.
   * @param {Transform} parent - The parent transform (typically a Facet instance).
   * @param {Transform} target - A transform that receives the subflow of tuples.
   */
  function Subflow(pulse, parent) {
    Operator.call(this, pulse);
    this.parent = parent;
  }

  var prototype$14 = inherits(Subflow, Operator);

  prototype$14.connect = function(target) {
    this.targets().add(target);
    return (target.source = this);
  };

  /**
   * Add an 'add' tuple to the subflow pulse.
   * @param {Tuple} t - The tuple being added.
   */
  prototype$14.add = function(t) {
    this.value.add.push(t);
  };

  /**
   * Add a 'rem' tuple to the subflow pulse.
   * @param {Tuple} t - The tuple being removed.
   */
  prototype$14.rem = function(t) {
    this.value.rem.push(t);
  };

  /**
   * Add a 'mod' tuple to the subflow pulse.
   * @param {Tuple} t - The tuple being modified.
   */
  prototype$14.mod = function(t) {
    this.value.mod.push(t);
  };

  /**
   * Re-initialize this operator's pulse value.
   * @param {Pulse} pulse - The pulse to copy from.
   * @see Pulse.init
   */
  prototype$14.init = function(pulse) {
    this.value.init(pulse);
  };

  /**
   * Evaluate this operator. This method overrides the
   * default behavior to simply return the contained pulse value.
   * @return {Pulse}
   */
  prototype$14.evaluate = function() {
    // assert: this.value.stamp === pulse.stamp
    return this.value;
  };

  /**
   * Facets a dataflow into a set of subflows based on a key.
   * @constructor
   * @param {function(Dataflow, string): Operator} subflow - A function that
   *   generates a subflow of operators and returns its root operator.
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.key - The key field to facet by.
   */
  function Facet(params) {
    Transform.call(this, map$1(), params);
    this._keys = {}; // cache previously calculated key values

    // keep track of active subflows, use as targets array for listeners
    // this allows us to limit propagation to only updated subflows
    var a = this._targets = [];
    a.active = 0;
    a.forEach = function(f) {
      for (var i=0, n=a.active; i<n; ++i) f(a[i], i, a);
    };
  }

  var prototype$13 = inherits(Facet, Transform);

  prototype$13.activate = function(flow) {
    this._targets[this._targets.active++] = flow;
  };

  prototype$13.transform = function(_, pulse) {
    var self = this,
        lut = this.value,
        key = _.key,
        cache = this._keys,
        rekey = _.modified('key');

    // subflow generator
    function subflow(key) {
      var sf = lut.get(key), df;
      if (!sf) {
        df = pulse.dataflow;
        sf = df.add(new Subflow(pulse.fork(), self)).connect(_.subflow(df, key));
        lut.set(key, sf);
        self.activate(sf);
      } else if (sf.value.stamp < pulse.stamp) {
        sf.init(pulse);
        self.activate(sf);
      }
      return sf;
    }

    this._targets.active = 0; // reset list of active subflows

    pulse.visit(pulse.ADD, function(t) {
      subflow(cache[t._id] = key(t)).add(t);
    });

    pulse.visit(pulse.REM, function(t) {
      var k = cache[t._id];
      delete cache[t._id];
      subflow(k).rem(t);
    });

    if (rekey || pulse.modified(key.fields)) {
      pulse.visit(pulse.MOD, function(t) {
        var k0 = cache[t._id],
            k1 = key(t);
        if (k0 === k1) {
          subflow(k1).mod(t);
        } else {
          cache[t._id] = k1;
          subflow(k0).rem(t);
          subflow(k1).add(t);
        }
      });
    } else if (pulse.changed(pulse.MOD)) {
      pulse.visit(pulse.MOD, function(t) {
        subflow(cache[t._id]).mod(t);
      });
    }

    if (rekey) {
      pulse.visit(pulse.REFLOW, function(t) {
        var k0 = cache[t._id],
            k1 = key(t);
        if (k0 !== k1) {
          cache[t._id] = k1;
          subflow(k0).rem(t);
          subflow(k1).add(t);
        }
      });
    }

    return pulse;
  };

  /**
   * Generates one or more field accessor functions.
   * If the 'name' parameter is an array, an array of field accessors
   * will be created and the 'as' parameter will be ignored.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {string} params.name - The field name(s) to access.
   * @param {string} params.as - The accessor function name.
   */
  function Field(params) {
    Operator.call(this, null, update$2, params);
  }

  inherits(Field, Operator);

  function update$2(_) {
    return (this.value && !_.modified()) ? this.value
      : isArray(_.name) ? array$1(_.name).map(function(f) { return field(f); })
      : field(_.name, _.as);
  }

  /**
   * Filters data tuples according to a predicate function.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.test - The predicate function that
   *   determines a tuple's filter status. Truthy values pass the filter.
   */
  function Filter(params) {
    Transform.call(this, {}, params);
  }

  var prototype$15 = inherits(Filter, Transform);

  prototype$15.transform = function(_, pulse) {
    var test = _.test,
        cache = this.value, // cache ids of filtered tuples
        output = pulse.fork(),
        add = output.add,
        rem = output.rem,
        mod = output.mod, isMod = true;

    pulse.visit(pulse.REM, function(x) {
      if (!cache[x._id]) rem.push(x);
      else cache[x._id] = 0;
    });

    pulse.visit(pulse.ADD, function(x) {
      if (test(x, _)) add.push(x);
      else cache[x._id] = 1;
    });

    function revisit(x) {
      var b = test(x, _),
          s = cache[x._id];
      if (b && s) {
        cache[x._id] = 0;
        add.push(x);
      } else if (!b && !s) {
        cache[x._id] = 1;
        rem.push(x);
      } else if (isMod && b && !s) {
        mod.push(x);
      }
    }

    pulse.visit(pulse.MOD, revisit);

    if (_.modified()) {
      isMod = false;
      pulse.visit(pulse.REFLOW, revisit);
    }

    return output;
  };

  /**
   * Folds one more tuple fields into multiple tuples in which the field
   * name and values are available under new 'key' and 'value' fields.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.fields - An array of field accessors
   *   for the tuple fields that should be folded.
   */
  function Fold(params) {
    Transform.call(this, {}, params);
  }

  var prototype$16 = inherits(Fold, Transform);

  function key$1(f) {
    return f.fields.join('|');
  }

  prototype$16.transform = function(_, pulse) {
    var cache = this.value,
        reset = _.modified('fields'),
        fields = _.fields,
        keys = fields.map(key$1),
        n = fields.length,
        stamp = pulse.stamp,
        out = pulse.fork(),
        i = 0, mask = 0, id;

    function add(t) {
      var f = (cache[t._id] = Array(n)); // create cache of folded tuples
      for (var i=0, ft; i<n; ++i) { // for each key, derive folds
        ft = (f[i] = derive(t));
        ft.key = keys[i];
        ft.value = fields[i](t);
        out.add.push(ft);
      }
    }

    function mod(t) {
      var f = cache[t._id]; // get cache of folded tuples
      for (var i=0, ft; i<n; ++i) { // for each key, rederive folds
        if (!(mask & (1 << i))) continue; // field is unchanged
        ft = rederive(t, f[i], stamp);
        ft.key = keys[i];
        ft.value = fields[i](t);
        out.mod.push(ft);
      }
    }

    if (reset) {
      // on reset, remove all folded tuples and clear cache
      for (id in cache) out.rem.push.apply(out.rem, cache[id]);
      cache = this.value = {};
      pulse.visit(pulse.SOURCE, add);
    } else {
      pulse.visit(pulse.ADD, add);

      for (; i<n; ++i) {
        if (pulse.modified(fields[i].fields)) mask |= (1 << i);
      }
      if (mask) pulse.visit(pulse.MOD, mod);

      pulse.visit(pulse.REM, function(t) {
        out.rem.push.apply(out.rem, cache[t._id]);
        cache[t._id] = null;
      });
    }

    return out.modifies(['key', 'value']);
  };

  /**
   * Generates data tuples using a provided generator function.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(Parameters): object} params.generator - A tuple generator
   *   function. This function is given the operator parameters as input.
   *   Changes to any additional parameters will not trigger re-calculation
   *   of previously generated tuples. Only future tuples are affected.
   * @param {number} params.size - The number of tuples to produce.
   */
  function Generate(params) {
    Transform.call(this, [], params);
  }

  var prototype$17 = inherits(Generate, Transform);

  prototype$17.transform = function(_, pulse) {
    var data = this.value,
        out = pulse.fork(pulse.ALL),
        num = _.size - data.length,
        gen = _.generator,
        add, rem, t;

    if (num > 0) {
      // need more tuples, generate and add
      for (add=[]; --num >= 0;) {
        add.push(t = ingest(gen(_)));
        data.push(t);
      }
      out.add = out.add.length
        ? out.materialize(out.ADD).add.concat(add)
        : add;
    } else {
      // need fewer tuples, remove
      rem = data.slice(0, -num);
      out.rem = out.rem.length
        ? out.materialize(out.REM).rem.concat(rem)
        : rem;
      data = data.slice(-num);
    }

    out.source = this.value = data;
    return out;
  };

  var Methods = {
    value: 'value',
    median: median,
    mean: mean,
    min: min,
    max: max
  };

  var Empty = [];

  /**
   * Impute missing values.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.field - The value field to impute.
   * @param {Array<function(object): *>} [params.groupby] - An array of
   *   accessors to determine series within which to perform imputation.
   * @param {Array<function(object): *>} [params.orderby] - An array of
   *   accessors to determine the ordering within a series.
   * @param {string} [method='value'] - The imputation method to use. One of
   *   'value', 'mean', 'median', 'max', 'min'.
   * @param {*} [value=0] - The constant value to use for imputation
   *   when using method 'value'.
   */
  function Impute(params) {
    Transform.call(this, [], params);
  }

  var prototype$18 = inherits(Impute, Transform);

  function getValue(_) {
    var m = _.method || Methods.value, v;

    if (Methods[m] == null) {
      error('Unrecognized imputation method: ' + m);
    } else if (m === Methods.value) {
      v = _.value !== undefined ? _.value : 0;
      return function() { return v; };
    } else {
      return Methods[m];
    }
  }

  function getField(_) {
    var f = _.field;
    return function(t) { return t ? f(t) : NaN; };
  }

  prototype$18.transform = function(_, pulse) {
    var out = pulse.fork(pulse.ALL),
        impute = getValue(_),
        field = getField(_),
        fName = accessorName(_.field),
        gNames = _.groupby.map(accessorName),
        oNames = _.orderby.map(accessorName),
        groups = partition(pulse.source, _.groupby, _.orderby),
        curr = [],
        prev = this.value,
        m = groups.domain.length,
        group, value, gVals, oVals, g, i, j, l, n, t;

    for (g=0, l=groups.length; g<l; ++g) {
      group = groups[g];
      gVals = group.values;
      value = NaN;

      // add tuples for missing values
      for (j=0; j<m; ++j) {
        if (group[j] != null) continue;
        oVals = groups.domain[j];

        t = {_impute: true};
        for (i=0, n=gVals.length; i<n; ++i) t[gNames[i]] = gVals[i];
        for (i=0, n=oVals.length; i<n; ++i) t[oNames[i]] = oVals[i];
        t[fName] = isNaN(value) ? (value = impute(group, field)) : value;

        curr.push(ingest(t));
      }
    }

    // update pulse with imputed tuples
    if (curr.length) out.add = out.materialize(out.ADD).add.concat(curr);
    if (prev.length) out.rem = out.materialize(out.REM).rem.concat(prev);
    this.value = curr;

    return out;
  };

  function partition(data, groupby, orderby) {
    var get = function(f) { return f(t); },
        groups = [],
        domain = [],
        oMap = {}, oVals, oKey,
        gMap = {}, gVals, gKey,
        group, i, j, n, t;

    for (i=0, n=data.length; i<n; ++i) {
      t = data[i];

      oKey = (oVals = orderby.map(get)) + '';
      j = oMap[oKey] || (oMap[oKey] = domain.push(oVals));

      gKey = (gVals = groupby ? groupby.map(get) : Empty) + '';
      if (!(group = gMap[gKey])) {
        group = (gMap[gKey] = []);
        groups.push(group);
        group.values = gVals;
      }
      group[j-1] = t;
    }

    return (groups.domain = domain, groups);
  }

  /**
   * Extend tuples by joining them with values from a lookup table.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {Map} params.index - The lookup table map.
   * @param {Array<function(object): *} params.fields - The fields to lookup.
   * @param {Array<string>} params.as - Output field names for each lookup value.
   * @param {*} [params.default] - A default value to use if lookup fails.
   */
  function Lookup(params) {
    Transform.call(this, {}, params);
  }

  var prototype$19 = inherits(Lookup, Transform);

  prototype$19.transform = function(_, pulse) {
    var out = pulse,
        as = _.as,
        keys = _.fields,
        index = _.index,
        defaultValue = _.default==null ? null : _.default,
        reset = _.modified(),
        flag = pulse.ADD,
        set, key, field, mods;

    if (keys.length === 1) {
      key = keys[0];
      field = as[0];
      set = function(t) {
        var v = index.get(key(t));
        t[field] = v==null ? defaultValue : v;
      };
    } else {
      set = function(t) {
        for (var i=0, n=keys.length, v; i<n; ++i) {
          v = index.get(keys[i](t));
          t[as[i]] = v==null ? defaultValue : v;
        }
      };
    }

    if (reset) {
      flag = pulse.SOURCE;
      out = pulse.fork(pulse.ALL).reflow();
    } else {
      mods = keys.some(function(k) { return pulse.modified(k.fields); });
      flag |= (mods ? pulse.MOD : 0);
    }
    pulse.visit(flag, set);

    return out.modifies(as);
  };

  /**
   * Computes global min/max extents over a collection of extents.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {Array<Array<number>>} params.extents - The input extents.
   */
  function MultiExtent(params) {
    Operator.call(this, null, update$3, params);
  }

  inherits(MultiExtent, Operator);

  function update$3(_) {
    if (this.value && !_.modified()) {
      return this.value;
    }

    var min = +Infinity,
        max = -Infinity,
        ext = _.extents,
        i, n, e;

    for (i=0, n=ext.length; i<n; ++i) {
      e = ext[i];
      if (e[0] < min) min = e[0];
      if (e[1] > max) max = e[1];
    }
    return [min, max];
  }

  /**
   * Propagates a pulse with no modifications.
   * @constructor
   */
  function NoOp(params) {
    Transform.call(this, {}, params);
  }

  var prototype$20 = inherits(NoOp, Transform);

  prototype$20.transform = function(_, pulse) {
    return pulse;
  };

  /**
   * Operator whose value is simply its parameter hash. This operator is
   * useful for enabling reactive updates to values of nested objects.
   * @constructor
   * @param {object} params - The parameters for this operator.
   */
  function Params(params) {
    Transform.call(this, null, params);
  }

  inherits(Params, Transform);

  Params.prototype.transform = function(_, pulse) {
    this.modified(_.modified());
    this.value = _;
    return pulse.fork(); // do not pass tuples
  };

  /**
   * Generates data tuples for a specified range of numbers.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {number} params.start - The first number in the range.
   * @param {number} params.stop - The last number (exclusive) in the range.
   * @param {number} [params.step=1] - The step size between numbers in the range.
   */
  function Range(params) {
    Transform.call(this, [], params);
  }

  var prototype$21 = inherits(Range, Transform);

  prototype$21.transform = function(_, pulse) {
    if (!_.modified()) return;

    var out = pulse.materialize().fork(pulse.MOD);

    out.rem = pulse.rem.concat(this.value);
    out.source = this.value = range(_.start, _.stop, _.step).map(ingest);
    out.add = pulse.add.concat(this.value);

    return out;
  };

  /**
   * Compute rank order scores for tuples. The tuples are assumed to have been
   * sorted in the desired rank order by an upstream data source.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.field - An accessor for the field to rank.
   * @param {boolean} params.normalize - Boolean flag for normalizing rank values.
   *   If true, the integer rank scores are normalized to range [0, 1].
   */
  function Rank(params) {
    Transform.call(this, null, params);
  }

  var prototype$22 = inherits(Rank, Transform);

  prototype$22.transform = function(_, pulse) {
    if (!pulse.source) {
      error('Rank transform requires an upstream data source.');
    }

    var norm  = _.normalize,
        field = _.field,
        ranks = {},
        n = -1, rank;

    if (field) {
      // If we have a field accessor, first compile distinct keys.
      pulse.visit(pulse.SOURCE, function(t) {
        var v = field(t);
        if (ranks[v] == null) ranks[v] = ++n;
      });
      pulse.visit(pulse.SOURCE, norm && --n
        ? function(t) { t.rank = ranks[field(t)] / n; }
        : function(t) { t.rank = ranks[field(t)]; }
      );
    } else {
      n += pulse.source.length;
      rank = -1;
      // Otherwise rank all the tuples together.
      pulse.visit(pulse.SOURCE, norm && n
        ? function(t) { t.rank = ++rank / n; }
        : function(t) { t.rank = ++rank; }
      );
    }

    return pulse.reflow().modifies('rank');
  };

  /**
   * Reflows all tuples if any parameter changes.
   * @constructor
   * @param {object} params - The parameters for this operator.
   */
  function Reflow(params) {
    Transform.call(this, null, params);
  }

  inherits(Reflow, Transform);

  Reflow.prototype.transform = function(_, pulse) {
    return _.modified() ? pulse.reflow() : pulse;
  };

  /**
   * Relays a data stream by creating derived copies of observed tuples.
   * This operator is useful for creating derived data streams in which
   * modifications to the tuples do not pollute an upstream data source.
   * @constructor
   */
  function Relay(params) {
    Transform.call(this, {}, params);
  }

  var prototype$23 = inherits(Relay, Transform);

  prototype$23.transform = function(_, pulse) {
    var stamp = pulse.stamp,
        out = pulse.fork(),
        lut = this.value;

    pulse.visit(pulse.ADD, function(t) {
      var dt = derive(t);
      lut[t._id] = dt;
      out.add.push(dt);
    });

    pulse.visit(pulse.MOD, function(t) {
      out.mod.push(rederive(t, lut[t._id], stamp));
    });

    pulse.visit(pulse.REM, function(t) {
      out.rem.push(lut[t._id]);
      delete lut[t._id];
    });

    return out;
  };

  /**
   * Samples tuples passing through this operator.
   * Uses reservoir sampling to maintain a representative sample.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {number} [params.size=1000] - The maximum number of samples.
   */
  function Sample(params) {
    Transform.call(this, [], params);
    this.count = 0;
  }

  var prototype$24 = inherits(Sample, Transform);

  prototype$24.transform = function(_, pulse) {
    var out = pulse.fork(),
        mod = _.modified('size'),
        num = _.size,
        res = this.value,
        cnt = this.count,
        cap = 0,
        map = res.reduce(function(m, t) { return (m[t._id] = 1, m); }, {});

    // sample reservoir update function
    function update(t) {
      var p, idx;

      if (res.length < num) {
        res.push(t);
      } else {
        idx = ~~(cnt * Math.random());
        if (idx < res.length && idx >= cap) {
          p = res[idx];
          if (map[p._id]) out.rem.push(p); // eviction
          res[idx] = t;
        }
      }
      ++cnt;
    }

    if (pulse.rem.length) {
      // find all tuples that should be removed, add to output
      pulse.visit(pulse.REM, function(t) {
        if (map[t._id]) {
          map[t._id] = -1;
          out.rem.push(t);
        }
        --cnt;
      });

      // filter removed tuples out of the sample reservoir
      res = res.filter(function(t) { return map[t._id] !== -1; });
    }

    if ((pulse.rem.length || mod) && res.length < num && pulse.source) {
      // replenish sample if backing data source is available
      cap = cnt = res.length;
      pulse.visit(pulse.SOURCE, function(t) {
        // update, but skip previously sampled tuples
        if (!map[t._id]) update(t);
      });
      cap = -1;
    }

    if (mod && res.length > num) {
      for (var i=0, n=res.length-num; i<n; ++i) {
        map[res[i]._id] = -1;
        out.rem.push(res[i]);
      }
      res = res.slice(n);
    }

    if (pulse.mod.length) {
      // propagate modified tuples in the sample reservoir
      pulse.visit(pulse.MOD, function(t) {
        if (map[t._id]) out.mod.push(t);
      });
    }

    if (pulse.add.length) {
      // update sample reservoir
      pulse.visit(pulse.ADD, update);
    }

    if (pulse.add.length || cap < 0) {
      // output newly added tuples
      out.add = res.filter(function(t) { return !map[t._id]; });
    }

    this.count = cnt;
    this.value = out.source = res;
    return out;
  };

  /**
   * Propagates a new pulse without any tuples so long as the input
   * pulse contains some added, removed or modified tuples.
   * @constructor
   */
  function Sieve(params) {
    Transform.call(this, null, params);
    this.modified(true); // always treat as modified
  }

  var prototype$25 = inherits(Sieve, Transform);

  prototype$25.transform = function(_, pulse) {
    this.value = pulse.source;
    return pulse.changed()
      ? pulse.fork()
      : pulse.StopPropagation;
  };

  /**
   * An index that maps from unique, string-coerced, field values to tuples.
   * Assumes that the field serves as a unique key with no duplicate values.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.field - The field accessor to index.
   */
  function TupleIndex(params) {
    Transform.call(this, map$1(), params);
  }

  var prototype$26 = inherits(TupleIndex, Transform);

  prototype$26.transform = function(_, pulse) {
    var field = _.field,
        index = this.value,
        mod = true;

    function set(t) { index.set(field(t), t); }

    if (_.modified('field') || pulse.modified(field.fields)) {
      this.value = index = map$1();
      pulse.visit(pulse.SOURCE, set);
    } else if (pulse.changed()) {
      pulse.visit(pulse.ADD, set);
      pulse.visit(pulse.REM, function(t) { index.remove(field(t)); });
    } else {
      mod = false;
    }

    this.modified(mod);
    return pulse;
  };

  /**
   * Extracts an array of values. Assumes the source data has already been
   * reduced as needed (e.g., by an upstream Aggregate transform).
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.field - The domain field to extract.
   * @param {function(*,*): number} [params.sort] - An optional
   *   comparator function for sorting the values. The comparator will be
   *   applied to backing tuples prior to value extraction.
   */
  function Values(params) {
    Transform.call(this, null, params);
  }

  var prototype$27 = inherits(Values, Transform);

  prototype$27.transform = function(_, pulse) {
    var run = !this.value
      || _.modified('field')
      || _.modified('sort')
      || pulse.changed()
      || (_.sort && pulse.modified(_.sort.fields));

    if (run) {
      this.value = (_.sort
        ? pulse.source.slice().sort(_.sort)
        : pulse.source).map(_.field);
    }
  };

  function TupleStore(key) {
    this._key = key || '_id';
    this._add = [];
    this._rem = [];
    this._ext = null;
    this._get = null;
    this._q = null;
  }

  var prototype$29 = TupleStore.prototype;

  prototype$29.add = function(v) {
    this._add.push(v);
  };

  prototype$29.rem = function(v) {
    this._rem.push(v);
  };

  prototype$29.values = function() {
    this._get = null;
    if (this._rem.length === 0) return this._add;

    var a = this._add,
        r = this._rem,
        k = this._key,
        n = a.length,
        m = r.length,
        x = Array(n - m),
        map = {}, i, j, v;

    // use unique key field to clear removed values
    for (i=0; i<m; ++i) {
      map[r[i][k]] = 1;
    }
    for (i=0, j=0; i<n; ++i) {
      if (map[(v = a[i])[k]]) {
        map[v[k]] = 0;
      } else {
        x[j++] = v;
      }
    }

    this._rem = [];
    return (this._add = x);
  };

  // memoized statistics methods

  prototype$29.extent = function(get) {
    if (this._get !== get || !this._ext) {
      var v = this.values(),
          i = extentIndex(v, get);
      this._ext = [v[i[0]], v[i[1]]];
      this._get = get;
    }
    return this._ext;
  };

  prototype$29.argmin = function(get) {
    return this.extent(get)[0];
  };

  prototype$29.argmax = function(get) {
    return this.extent(get)[1];
  };

  prototype$29.min = function(get) {
    var m = this.extent(get)[0];
    return m != null ? get(m) : +Infinity;
  };

  prototype$29.max = function(get) {
    var m = this.extent(get)[1];
    return m != null ? get(m) : -Infinity;
  };

  prototype$29.quartile = function(get) {
    if (this._get !== get || !this._q) {
      this._q = quartiles(this.values(), get);
      this._get = get;
    }
    return this._q;
  };

  prototype$29.q1 = function(get) {
    return this.quartile(get)[0];
  };

  prototype$29.q2 = function(get) {
    return this.quartile(get)[1];
  };

  prototype$29.q3 = function(get) {
    return this.quartile(get)[2];
  };

  prototype$29.ci = function(get) {
    if (this._get !== get || !this._ci) {
      this._ci = bootstrapCI(this.values(), 1000, 0.05, get);
      this._get = get;
    }
    return this._ci;
  };

  prototype$29.ci0 = function(get) {
    return this.ci(get)[0];
  };

  prototype$29.ci1 = function(get) {
    return this.ci(get)[1];
  };

  var Aggregates = {
    'values': measure({
      name: 'values',
      init: 'cell.store = true;',
      set:  'cell.data.values()', idx: -1
    }),
    'count': measure({
      name: 'count',
      set:  'cell.num'
    }),
    'missing': measure({
      name: 'missing',
      set:  'this.missing'
    }),
    'valid': measure({
      name: 'valid',
      set:  'this.valid'
    }),
    'distinct': measure({
      name: 'distinct',
      init: 'this.dmap = {}; this.distinct = 0;',
      add:  'this.dmap[v] = 1 + (this.dmap[v] || (++this.distinct, 0));',
      rem:  'if (!(--this.dmap[v])) --this.distinct;',
      set:  'this.distinct'
    }),
    'sum': measure({
      name: 'sum',
      init: 'this.sum = 0;',
      add:  'this.sum += v;',
      rem:  'this.sum -= v;',
      set:  'this.sum'
    }),
    'mean': measure({
      name: 'mean',
      init: 'this.mean = 0;',
      add:  'var d = v - this.mean; this.mean += d / this.valid;',
      rem:  'var d = v - this.mean; this.mean -= this.valid ? d / this.valid : this.mean;',
      set:  'this.mean'
    }),
    'average': measure({
      name: 'average',
      set:  'this.mean',
      req:  ['mean'], idx: 1
    }),
    'variance': measure({
      name: 'variance',
      init: 'this.dev = 0;',
      add:  'this.dev += d * (v - this.mean);',
      rem:  'this.dev -= d * (v - this.mean);',
      set:  'this.valid > 1 ? this.dev / (this.valid-1) : 0',
      req:  ['mean'], idx: 1
    }),
    'variancep': measure({
      name: 'variancep',
      set:  'this.valid > 1 ? this.dev / this.valid : 0',
      req:  ['variance'], idx: 2
    }),
    'stdev': measure({
      name: 'stdev',
      set:  'this.valid > 1 ? Math.sqrt(this.dev / (this.valid-1)) : 0',
      req:  ['variance'], idx: 2
    }),
    'stdevp': measure({
      name: 'stdevp',
      set:  'this.valid > 1 ? Math.sqrt(this.dev / this.valid) : 0',
      req:  ['variance'], idx: 2
    }),
    'stderr': measure({
      name: 'stderr',
      set:  'this.valid > 1 ? Math.sqrt(this.dev / (this.valid * (this.valid-1))) : 0',
      req:  ['variance'], idx: 2
    }),
    'ci0': measure({
      name: 'ci0',
      set:  'cell.data.ci0(this.get)',
      req:  ['values'], idx: 3
    }),
    'ci1': measure({
      name: 'ci1',
      set:  'cell.data.ci1(this.get)',
      req:  ['values'], idx: 3
    }),
    'median': measure({
      name: 'median',
      set:  'cell.data.q2(this.get)',
      req:  ['values'], idx: 3
    }),
    'q1': measure({
      name: 'q1',
      set:  'cell.data.q1(this.get)',
      req:  ['values'], idx: 3
    }),
    'q3': measure({
      name: 'q3',
      set:  'cell.data.q3(this.get)',
      req:  ['values'], idx: 3
    }),
    'argmin': measure({
      name: 'argmin',
      add:  'if (v < this.min) this.argmin = t;',
      rem:  'if (v <= this.min) this.argmin = null;',
      set:  'this.argmin = this.argmin || cell.data.argmin(this.get)',
      req:  ['min'], str: ['values'], idx: 3
    }),
    'argmax': measure({
      name: 'argmax',
      add:  'if (v > this.max) this.argmax = t;',
      rem:  'if (v >= this.max) this.argmax = null;',
      set:  'this.argmax = this.argmax || cell.data.argmax(this.get)',
      req:  ['max'], str: ['values'], idx: 3
    }),
    'min': measure({
      name: 'min',
      init: 'this.min = +Infinity;',
      add:  'if (v < this.min) this.min = v;',
      rem:  'if (v <= this.min) this.min = NaN;',
      set:  'this.min = (isNaN(this.min) ? cell.data.min(this.get) : this.min)',
      str:  ['values'], idx: 4
    }),
    'max': measure({
      name: 'max',
      init: 'this.max = -Infinity;',
      add:  'if (v > this.max) this.max = v;',
      rem:  'if (v >= this.max) this.max = NaN;',
      set:  'this.max = (isNaN(this.max) ? cell.data.max(this.get) : this.max)',
      str:  ['values'], idx: 4
    })
  };

  function createMeasure(op, name) {
    return Aggregates[op](name);
  }

  function measure(base) {
    return function(out) {
      var m = extend({init:'', add:'', rem:'', idx:0}, base);
      m.out = out || base.name;
      return m;
    };
  }

  function compareIndex(a, b) {
    return a.idx - b.idx;
  }

  function resolve(agg, stream) {
    function collect(m, a) {
      function helper(r) { if (!m[r]) collect(m, m[r] = Aggregates[r]()); }
      if (a.req) a.req.forEach(helper);
      if (stream && a.str) a.str.forEach(helper);
      return m;
    }
    var map = agg.reduce(
      collect,
      agg.reduce(function(m, a) { return (m[a.name] = a, m); }, {})
    );
    return values(map).sort(compareIndex);
  }

  function compileMeasures(agg, field) {
    var get = field || identity$1,
        all = resolve(agg, true), // assume streaming removes may occur
        ctr = 'this.cell = cell; this.tuple = t; this.valid = 0; this.missing = 0;',
        add = 'if(v==null){this.missing++; return;} if(v!==v) return; ++this.valid;',
        rem = 'if(v==null){this.missing--; return;} if(v!==v) return; --this.valid;',
        set = 'var t = this.tuple; var cell = this.cell;';

    all.forEach(function(a) {
      if (a.idx < 0) {
        ctr = a.init + ctr;
        add = a.add + add;
        rem = a.rem + rem;
      } else {
        ctr += a.init;
        add += a.add;
        rem += a.rem;
      }
    });
    agg.slice().sort(compareIndex).forEach(function(a) {
      set += 't[\'' + a.out + '\']=' + a.set + ';';
    });
    set += 'return t;';

    ctr = Function('cell', 't', ctr);
    ctr.prototype.add = Function('v', add);
    ctr.prototype.rem = Function('v', rem);
    ctr.prototype.set = Function(set);
    ctr.prototype.get = get;
    ctr.fields = agg.map(function(_) { return _.out; });
    return ctr;
  }

  /**
   * Group-by aggregation operator.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {Array<function(object): *>} params.groupby - An array of accessors to groupby.
   * @param {Array<function(object): *>} params.fields - An array of accessors to aggregate.
   * @param {Array<string>} params.ops - An array of strings indicating aggregation operations.
   * @param {Array<string>} [params.as] - An array of output field names for aggregated values.
   * @param {boolean} [params.drop=true] - A flag indicating if empty cells should be removed.
   */
  function Aggregate(params) {
    Transform.call(this, null, params);

    this._adds = []; // array of added output tuples
    this._mods = []; // array of modified output tuples
    this._alen = 0;  // number of active added tuples
    this._mlen = 0;  // number of active modified tuples

    this._dims = [];   // group-by dimension accessors
    this._dnames = []; // group-by dimension names

    this._measures = []; // collection of aggregation monoids
    this._count = false; // flag indicating only count aggregation
    this._prev = null;   // previous aggregation cells

    this._inputs = null;  // array of dependent input tuple field names
    this._outputs = null; // array of output tuple field names
  }

  var prototype$28 = inherits(Aggregate, Transform);

  prototype$28.transform = function(_, pulse) {
    var aggr = this,
        out = pulse.fork(),
        mod;

    this.stamp = out.stamp;

    if (this.value && ((mod = _.modified()) || pulse.modified(this._inputs))) {
      this._prev = this.value;
      this.value = mod ? this.init(_) : {};
      pulse.visit(pulse.SOURCE, function(t) { aggr.add(t); });
    } else {
      this.value = this.value || this.init(_);
      pulse.visit(pulse.REM, function(t) { aggr.rem(t); });
      pulse.visit(pulse.ADD, function(t) { aggr.add(t); });
    }

    // Indicate output fields and return aggregate tuples.
    out.modifies(this._outputs);
    return aggr.changes(out, _.drop !== false);
  };

  prototype$28.init = function(_) {
    // initialize input and output fields
    var inputs = (this._inputs = []),
        outputs = (this._outputs = []),
        inputMap = {};

    function inputVisit(get) {
      var fields = get.fields, i = 0, n = fields.length, f;
      for (; i<n; ++i) {
        if (!inputMap[f=fields[i]]) {
          inputMap[f] = 1;
          inputs.push(f);
        }
      }
    }

    // initialize group-by dimensions
    this._dims = array$1(_.groupby);
    this._dnames = this._dims.map(function(d) {
      var dname = accessorName(d)
      return (inputVisit(d), outputs.push(dname), dname);
    });
    this.cellkey = _.key ? _.key
      : this._dims.length === 0 ? function() { return ''; }
      : this._dims.length === 1 ? this._dims[0]
      : cellkey;

    // initialize aggregate measures
    this._count = true;
    this._measures = [];

    var fields = _.fields || [null],
        ops = _.ops || ['count'],
        as = _.as || [],
        n = fields.length,
        map = {},
        field, op, m, mname, outname, i;

    if (n !== ops.length) {
      error('Unmatched number of fields and aggregate ops.');
    }

    for (i=0; i<n; ++i) {
      field = fields[i];
      op = ops[i];

      mname = accessorName(field);
      outname = measureName(op, mname, as[i]);
      outputs.push(outname);
      if (!field) continue;

      m = map[mname];
      if (!m) {
        inputVisit(field);
        m = (map[mname] = []);
        m.field = field;
        this._measures.push(m);
      }

      if (op !== 'count') this._count = false;
      m.push(createMeasure(op, outname));
    }

    this._measures = this._measures.map(function(m) {
      return compileMeasures(m, m.field);
    });

    return {}; // aggregation cells (this.value)
  };

  function measureName(op, mname, as) {
    return as || (op + (!mname ? '' : '_' + mname));
  }

  // -- Cell Management -----

  function cellkey(x) {
    var d = this._dims,
        n = d.length, i,
        k = String(d[0](x));

    for (i=1; i<n; ++i) {
      k += '|' + d[i](x);
    }

    return k;
  }

  prototype$28.cellkey = cellkey;

  prototype$28.cell = function(key, t) {
    var cell = this.value[key];
    if (!cell) {
      cell = this.value[key] = this.newcell(key, t);
      this._adds[this._alen++] = cell;
    } else if (cell.stamp < this.stamp) {
      cell.stamp = this.stamp;
      this._mods[this._mlen++] = cell;
    }
    return cell;
  };

  prototype$28.newcell = function(key, t) {
    var cell = {
      key:   key,
      num:   0,
      agg:   null,
      tuple: this.newtuple(t, this._prev && this._prev[key]),
      stamp: this.stamp,
      store: false
    };

    if (!this._count) {
      var measures = this._measures,
          n = measures.length, i;

      cell.agg = Array(n);
      for (i=0; i<n; ++i) {
        cell.agg[i] = new measures[i](cell, cell.tuple);
      }
    }

    if (cell.store) {
      cell.data = new TupleStore();
    }

    return cell;
  };

  prototype$28.newtuple = function(t, p) {
    var names = this._dnames,
        dims = this._dims,
        x = {}, i, n;

    for (i=0, n=dims.length; i<n; ++i) {
      x[names[i]] = dims[i](t);
    }

    return p ? replace(p.tuple, x) : ingest(x);
  };

  // -- Process Tuples -----

  prototype$28.add = function(t) {
    var key = this.cellkey(t),
        cell = this.cell(key, t),
        agg, i, n;

    cell.num += 1;
    if (this._count) return;

    if (cell.store) cell.data.add(t);

    agg = cell.agg;
    for (i=0, n=agg.length; i<n; ++i) {
      agg[i].add(agg[i].get(t));
    }
  };

  prototype$28.rem = function(t) {
    var key = this.cellkey(t),
        cell = this.cell(key, t),
        agg, i, n;

    cell.num -= 1;
    if (this._count) return;

    if (cell.store) cell.data.rem(t);

    agg = cell.agg;
    for (i=0, n=agg.length; i<n; ++i) {
      agg[i].rem(agg[i].get(t));
    }
  };

  prototype$28.celltuple = function(cell) {
    var tuple = cell.tuple, agg, i, n;

    // consolidate stored values
    if (cell.store) {
      cell.data.values();
    }

    // update tuple properties
    if (this._count) {
      tuple.count = cell.num;
    } else {
      agg = cell.agg;
      for (i=0, n=agg.length; i<n; ++i) {
        agg[i].set();
      }
    }

    return tuple;
  };

  prototype$28.changes = function(out, drop) {
    var adds = this._adds,
        mods = this._mods,
        prev = this._prev,
        add = out.add,
        rem = out.rem,
        mod = out.mod,
        cell, key, i, n;

    if (prev) for (key in prev) {
      rem.push(prev[key].tuple);
    }

    for (i=0, n=this._alen; i<n; ++i) {
      add.push(this.celltuple(adds[i]));
      adds[i] = null; // for garbage collection
    }

    for (i=0, n=this._mlen; i<n; ++i) {
      cell = mods[i];
      (cell.num === 0 && drop ? rem : mod).push(this.celltuple(cell));
      mods[i] = null; // for garbage collection
    }

    this._alen = this._mlen = 0; // reset list of active cells
    this._prev = null;
    return out;
  };

  function array8(n) { return new Uint8Array(n); }

  function array16(n) { return new Uint16Array(n); }

  function array32(n) { return new Uint32Array(n); }

  /**
   * Maintains a list of values, sorted by key.
   */
  function SortedIndex() {
    var index = array32(0),
        value = [],
        size = 0;

    function insert(key, data, base) {
      if (!data.length) return [];

      var n0 = size,
          n1 = data.length,
          addv = Array(n1),
          addi = array32(n1),
          oldv, oldi, i;

      for (i=0; i<n1; ++i) {
        addv[i] = key(data[i]);
        addi[i] = i;
      }
      addv = sort(addv, addi);

      if (n0) {
        oldv = value;
        oldi = index;
        value = Array(n0 + n1);
        index = array32(n0 + n1);
        merge$2(base, oldv, oldi, n0, addv, addi, n1, value, index);
      } else {
        if (base > 0) for (i=0; i<n1; ++i) {
          addi[i] += base;
        }
        value = addv;
        index = addi;
      }
      size = n0 + n1;

      return {index: addi, value: addv};
    }

    function remove(num, map) {
      // map: index -> remove
      var n = size,
          idx, i, j;

      // seek forward to first removal
      for (i=0; !map[index[i]] && i<n; ++i);

      // condense index and value arrays
      for (j=i; i<n; ++i) {
        if (!map[idx=index[i]]) {
          index[j] = idx;
          value[j] = value[i];
          ++j;
        }
      }

      size = n - num;
    }

    function reindex(map) {
      for (var i=0, n=size; i<n; ++i) {
        index[i] = map[index[i]];
      }
    }

    function bisect(range, array) {
      var n = array ? array.length : (array = value, size);
      return [
        bisectLeft(array, range[0], 0, n),
        bisectRight(array, range[1], 0, n)
      ];
    }

    return {
      insert:  insert,
      remove:  remove,
      bisect:  bisect,
      reindex: reindex,
      index:   function() { return index; },
      size:    function() { return size; }
    };
  }

  function sort(values, index) {
    values.sort.call(index, function(a, b) {
      var x = values[a],
          y = values[b];
      return x < y ? -1 : x > y ? 1 : 0;
    });
    return permute(values, index);
  }

  function merge$2(base, value0, index0, n0, value1, index1, n1, value, index) {
    var i0 = 0, i1 = 0, i;

    for (i=0; i0 < n0 && i1 < n1; ++i) {
      if (value0[i0] < value1[i1]) {
        value[i] = value0[i0];
        index[i] = index0[i0++];
      } else {
        value[i] = value1[i1];
        index[i] = index1[i1++] + base;
      }
    }

    for (; i0 < n0; ++i0, ++i) {
      value[i] = value0[i0];
      index[i] = index0[i0];
    }

    for (; i1 < n1; ++i1, ++i) {
      value[i] = value1[i1];
      index[i] = index1[i1] + base;
    }
  }

  /**
   * Maintains CrossFilter state.
   */
  function Bitmaps() {

    var width = 8,
        data = [],
        seen = array32(0),
        curr = array$2(0, width),
        prev = array$2(0, width);

    return {

      data: function() { return data; },

      seen: function() {
        return (seen = lengthen(seen, data.length));
      },

      add: function(array) {
        for (var i=0, j=data.length, n=array.length, t; i<n; ++i) {
          t = array[i];
          t._index = j++;
          data.push(t);
        }
      },

      remove: function(num, map) { // map: index -> boolean (true => remove)
        var n = data.length,
            copy = Array(n - num),
            reindex = data, // reuse old data array for index map
            t, i, j;

        // seek forward to first removal
        for (i=0; !map[i] && i<n; ++i) {
          copy[i] = data[i];
          reindex[i] = i;
        }

        // condense arrays
        for (j=i; i<n; ++i) {
          t = data[i];
          if (!map[i]) {
            reindex[i] = j;
            curr[j] = curr[i];
            prev[j] = prev[i];
            copy[j] = t;
            t._index = j++;
          } else {
            reindex[i] = -1;
          }
          curr[i] = 0; // clear unused bits
        }

        return (data = copy, reindex);
      },

      size: function() { return data.length; },

      curr: function() { return curr; },

      prev: function() { return prev; },

      reset: function(k) { prev[k] = curr[k]; },

      all: function() {
        return width < 0x101 ? 0xff : width < 0x10001 ? 0xffff : 0xffffffff;
      },

      set: function(k, one) { curr[k] |= one; },

      clear: function(k, one) { curr[k] &= ~one; },

      resize: function(n, m) {
        var k = curr.length;
        if (n > k || m > width) {
          width = Math.max(m, width);
          curr = array$2(n, width, curr);
          prev = array$2(n, width);
        }
      }
    };
  }

  function lengthen(array, length, copy) {
    if (array.length >= length) return array;
    copy = copy || new array.constructor(length);
    copy.set(array);
    return copy;
  }

  function array$2(n, m, array) {
    var copy = (m < 0x101 ? array8 : m < 0x10001 ? array16 : array32)(n);
    if (array) copy.set(array);
    return copy;
  }

  /**
   * An indexed multi-dimensional filter.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {Array<function(object): *>} params.fields - An array of dimension accessors to filter.
   * @param {Array} params.query - An array of per-dimension range queries.
   */
  function CrossFilter(params) {
    Transform.call(this, Bitmaps(), params);
    this.data = [];
    this.index = null;
  }

  function Dimension(index, field, query) {
    var dim = SortedIndex();
    dim.one = (1 << index);
    dim.zero = ~dim.one;
    dim.field = field;
    dim.range = query.slice();
    dim.add = function(data, curr, k) {
      var dim = this,
          one = dim.one,
          added = dim.insert(dim.field, data, k),
          range = dim.bisect(dim.range, added.value),
          index = added.index,
          lo = range[0],
          hi = range[1],
          n1 = index.length, i;

      for (i=0;  i<lo; ++i) curr[index[i]] |= one;
      for (i=hi; i<n1; ++i) curr[index[i]] |= one;
    };
    return dim;
  }

  var prototype$30 = inherits(CrossFilter, Transform);

  prototype$30.transform = function(_, pulse) {
    if (!this.index) {
      return this.init(_, pulse);
    } else {
      var init = _.modified('fields')
            || _.fields.some(function(f) { return pulse.modified(f.fields); });

      return init
        ? this.reinit(_, pulse)
        : this.eval(_, pulse);
    }
  };

  prototype$30.init = function(_, pulse) {
    var fields = _.fields,
        query = _.query,
        m = query.length,
        dims = (this.index = Array(m)), q;

    // instantiate dimensions
    for (q=0; q<m; ++q) {
      dims[q] = Dimension(q, fields[q], query[q]);
    }

    return this.eval(_, pulse);
  };

  prototype$30.reinit = function(_, pulse) {
    var output = pulse.materialize().fork(),
        fields = _.fields,
        query = _.query,
        m = query.length,
        dims = this.index,
        bits = this.value,
        curr = bits.curr(),
        prev = bits.prev(),
        all = bits.all(),
        out = (output.rem = output.add),
        mod = output.mod,
        mods, remMap, modMap, i, n, f, q;

    // set prev to current state
    prev.set(curr);

    // if pulse has remove tuples, process them first
    if (pulse.rem.length) {
      remMap = this.remove(_, pulse, output);
    }

    // if pulse has added tuples, add them to state
    if (pulse.add.length) {
      bits.add(pulse.add);
    }

    // if pulse has modified tuples, create an index map
    if (pulse.mod.length) {
      modMap = {};
      for (mods=pulse.mod, i=0, n=mods.length; i<n; ++i) {
        modMap[mods[i]._index] = 1;
      }
    }

    // re-initialize indices as needed, update curr bitmap
    for (q=0; q<m; ++q) {
      f = fields[q];
      if (!dims[q] || _.modified('fields', q) || pulse.modified(f.fields)) {
        dims[q] = Dimension(q, fields[q], query[q]);
        dims[q].add(pulse.source, curr, 0);
      }
    }

    // visit each tuple
    // if filter state changed, push index to add/rem
    // else if in mod and passes a filter, push index to mod
    for (i=0, n=bits.data().length; i<n; ++i) {
      if (remMap[i]) { // skip if removed tuple
        continue;
      } else if (prev[i] !== curr[i]) { // add if state changed
        out.push(i);
      } else if (modMap[i] && curr[i] !== all) { // otherwise, pass mods through
        mod.push(i);
      }
    }

    bits.mask = (1 << m) - 1;
    return output;
  };

  prototype$30.eval = function(_, pulse) {
    var output = pulse.materialize().fork(),
        m = this.index.length,
        mask = 0;

    if (pulse.rem.length) {
      this.remove(_, pulse, output);
      mask |= (1 << m) - 1;
    }

    if (_.modified('query') && !_.modified('fields')) {
      mask |= this.update(_, pulse, output);
    }

    if (pulse.add.length) {
      this.insert(_, pulse, output);
      mask |= (1 << m) - 1;
    }

    if (pulse.mod.length) {
      this.modify(pulse, output);
      mask |= (1 << m) - 1;
    }

    this.value.mask = mask;
    return output;
  };

  prototype$30.insert = function(_, pulse, output) {
    var tuples = pulse.add,
        bits = this.value,
        dims = this.index,
        out = output.add,
        k = bits.size(),
        n = k + tuples.length,
        m = dims.length, j;

    // resize bitmaps and add tuples as needed
    bits.resize(n, m);
    bits.add(tuples);

    var curr = bits.curr(),
        prev = bits.prev(),
        all  = bits.all();

    // add to dimensional indices
    for (j=0; j<m; ++j) {
      dims[j].add(tuples, curr, k);
    }

    // set previous filters, output if passes at least one filter
    for (; k<n; ++k) {
      prev[k] = all;
      if (curr[k] !== all) out.push(k);
    }
  };

  prototype$30.modify = function(pulse, output) {
    var out = output.mod,
        bits = this.value,
        curr = bits.curr(),
        all  = bits.all(),
        tuples = pulse.mod,
        i, n, k;

    for (i=0, n=tuples.length; i<n; ++i) {
      k = tuples[i]._index;
      if (curr[k] !== all) out.push(k);
    }
  };

  prototype$30.remove = function(_, pulse, output) {
    var dims = this.index,
        bits = this.value,
        curr = bits.curr(),
        prev = bits.prev(),
        all  = bits.all(),
        map = {},
        out = output.rem,
        tuples = pulse.rem,
        i, j, n, m, k, f;

    // process tuples, output if passes at least one filter
    for (i=0, n=tuples.length; i<n; ++i) {
      k = tuples[i]._index;
      map[k] = 1; // build index map
      prev[k] = (f = curr[k]);
      curr[k] = all;
      if (f !== all) out.push(k);
    }

    // remove from dimensional indices
    for (j=0, m=dims.length; j<m; ++j) {
      dims[j].remove(n, map);
    }

    return (this.reindex(pulse, n, map), map);
  };

  // reindex filters and indices after propagation completes
  prototype$30.reindex = function(pulse, num, map) {
    var bits = this.value,
        dims = this.index;

    pulse.runAfter(function() {
      var indexMap = bits.remove(num, map);
      dims.forEach(function(dim) {
        dim.reindex(indexMap);
      });
    });
  };

  prototype$30.update = function(_, pulse, output) {
    var dims = this.index,
        query = _.query,
        stamp = pulse.stamp,
        m = dims.length,
        mask = 0, i, q;

    // survey how many queries have changed
    output.filters = 0;
    for (q=0; q<m; ++q) {
      if (_.modified('query', q)) { i = q; ++mask; }
    }

    if (mask === 1) {
      // only one query changed, use more efficient update
      mask = dims[i].one;
      this.incrementOne(dims[i], query[i], output.add, output.rem);
    } else {
      // multiple queries changed, perform full record keeping
      for (q=0, mask=0; q<m; ++q) {
        if (!_.modified('query', q)) continue;
        mask |= dims[q].one;
        this.incrementAll(dims[q], query[q], stamp, output.add);
        output.rem = output.add; // duplicate add/rem for downstream resolve
      }
    }

    return mask;
  };

  prototype$30.incrementAll = function(dim, query, stamp, out) {
    var bits = this.value,
        seen = bits.seen(),
        curr = bits.curr(),
        prev = bits.prev(),
        index = dim.index(),
        old = dim.bisect(dim.range),
        range = dim.bisect(query),
        lo1 = range[0],
        hi1 = range[1],
        lo0 = old[0],
        hi0 = old[1],
        one = dim.one,
        i, j, k;

    // Fast incremental update based on previous lo index.
    if (lo1 < lo0) {
      for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
        k = index[i];
        if (seen[k] !== stamp) {
          prev[k] = curr[k];
          seen[k] = stamp;
          out.push(k);
        }
        curr[k] ^= one;
      }
    } else if (lo1 > lo0) {
      for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
        k = index[i];
        if (seen[k] !== stamp) {
          prev[k] = curr[k];
          seen[k] = stamp;
          out.push(k);
        }
        curr[k] ^= one;
      }
    }

    // Fast incremental update based on previous hi index.
    if (hi1 > hi0) {
      for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
        k = index[i];
        if (seen[k] !== stamp) {
          prev[k] = curr[k];
          seen[k] = stamp;
          out.push(k);
        }
        curr[k] ^= one;
      }
    } else if (hi1 < hi0) {
      for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
        k = index[i];
        if (seen[k] !== stamp) {
          prev[k] = curr[k];
          seen[k] = stamp;
          out.push(k);
        }
        curr[k] ^= one;
      }
    }

    dim.range = query.slice();
  };

  prototype$30.incrementOne = function(dim, query, add, rem) {
    var bits = this.value,
        curr = bits.curr(),
        index = dim.index(),
        old = dim.bisect(dim.range),
        range = dim.bisect(query),
        lo1 = range[0],
        hi1 = range[1],
        lo0 = old[0],
        hi0 = old[1],
        one = dim.one,
        i, j, k;

    // Fast incremental update based on previous lo index.
    if (lo1 < lo0) {
      for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
        k = index[i];
        curr[k] ^= one;
        add.push(k);
      }
    } else if (lo1 > lo0) {
      for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
        k = index[i];
        curr[k] ^= one;
        rem.push(k);
      }
    }

    // Fast incremental update based on previous hi index.
    if (hi1 > hi0) {
      for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
        k = index[i];
        curr[k] ^= one;
        add.push(k);
      }
    } else if (hi1 < hi0) {
      for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
        k = index[i];
        curr[k] ^= one;
        rem.push(k);
      }
    }

    dim.range = query.slice();
  };

  /**
   * Selectively filters tuples by resolving against a filter bitmap.
   * Useful for processing the output of a cross-filter transform.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {object} params.ignore - A bit mask indicating which filters to ignore.
   * @param {object} params.filter - The per-tuple filter bitmaps. Typically this
   *   parameter value is a reference to a {@link CrossFilter} transform.
   */
  function ResolveFilter(params) {
    Transform.call(this, null, params);
  }

  var prototype$31 = inherits(ResolveFilter, Transform);

  prototype$31.transform = function(_, pulse) {
    var ignore = ~(_.ignore || 0), // bit mask where zeros -> dims to ignore
        bitmap = _.filter,
        mask = bitmap.mask;

    // exit early if no relevant filter changes
    if ((mask & ignore) === 0) return pulse.StopPropagation;

    var output = pulse.fork(pulse.ALL),
        data = bitmap.data(),
        curr = bitmap.curr(),
        prev = bitmap.prev(),
        pass = function(k) {
          return !(curr[k] & ignore) ? data[k] : null;
        };

    // propagate all mod tuples that pass the filter
    output.filter(output.MOD, pass);

    // determine add & rem tuples via filter functions
    // for efficiency, we do *not* populate new arrays,
    // instead we add filter functions applied downstream

    if (!(mask & (mask-1))) { // only one filter changed
      output.filter(output.ADD, pass);
      output.filter(output.REM, function(k) {
        return (curr[k] & ignore) === mask ? data[k] : null;
      });

    } else { // multiple filters changed
      output.filter(output.ADD, function(k) {
        var c = curr[k] & ignore,
            f = !c && (c ^ (prev[k] & ignore));
        return f ? data[k] : null;
      });
      output.filter(output.REM, function(k) {
        var c = curr[k] & ignore,
            f = c && !(c ^ (c ^ (prev[k] & ignore)));
        return f ? data[k] : null;
      });
    }

    return output;
  };

  // Computes the decimal coefficient and exponent of the specified number x with
  // significant digits p, where x is positive and p is in [1, 21] or undefined.
  // For example, formatDecimal(1.23) returns ["123", 0].
  function formatDecimal(x, p) {
    if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
    var i, coefficient = x.slice(0, i);

    // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
    // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
    return [
      coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
      +x.slice(i + 1)
    ];
  }

  function exponent(x) {
    return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
  }

  function formatGroup(grouping, thousands) {
    return function(value, width) {
      var i = value.length,
          t = [],
          j = 0,
          g = grouping[0],
          length = 0;

      while (i > 0 && g > 0) {
        if (length + g + 1 > width) g = Math.max(1, width - length);
        t.push(value.substring(i -= g, i + g));
        if ((length += g + 1) > width) break;
        g = grouping[j = (j + 1) % grouping.length];
      }

      return t.reverse().join(thousands);
    };
  }

  function formatDefault(x, p) {
    x = x.toPrecision(p);

    out: for (var n = x.length, i = 1, i0 = -1, i1; i < n; ++i) {
      switch (x[i]) {
        case ".": i0 = i1 = i; break;
        case "0": if (i0 === 0) i0 = i; i1 = i; break;
        case "e": break out;
        default: if (i0 > 0) i0 = 0; break;
      }
    }

    return i0 > 0 ? x.slice(0, i0) + x.slice(i1 + 1) : x;
  }

  var prefixExponent;

  function formatPrefixAuto(x, p) {
    var d = formatDecimal(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1],
        i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
        n = coefficient.length;
    return i === n ? coefficient
        : i > n ? coefficient + new Array(i - n + 1).join("0")
        : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
        : "0." + new Array(1 - i).join("0") + formatDecimal(x, Math.max(0, p + i - 1))[0]; // less than 1y!
  }

  function formatRounded(x, p) {
    var d = formatDecimal(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1];
    return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
        : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
        : coefficient + new Array(exponent - coefficient.length + 2).join("0");
  }

  var formatTypes = {
    "": formatDefault,
    "%": function(x, p) { return (x * 100).toFixed(p); },
    "b": function(x) { return Math.round(x).toString(2); },
    "c": function(x) { return x + ""; },
    "d": function(x) { return Math.round(x).toString(10); },
    "e": function(x, p) { return x.toExponential(p); },
    "f": function(x, p) { return x.toFixed(p); },
    "g": function(x, p) { return x.toPrecision(p); },
    "o": function(x) { return Math.round(x).toString(8); },
    "p": function(x, p) { return formatRounded(x * 100, p); },
    "r": formatRounded,
    "s": formatPrefixAuto,
    "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
    "x": function(x) { return Math.round(x).toString(16); }
  };

  // [[fill]align][sign][symbol][0][width][,][.precision][type]
  var re = /^(?:(.)?([<>=^]))?([+\-\( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?([a-z%])?$/i;

  function formatSpecifier(specifier) {
    return new FormatSpecifier(specifier);
  }

  function FormatSpecifier(specifier) {
    if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);

    var match,
        fill = match[1] || " ",
        align = match[2] || ">",
        sign = match[3] || "-",
        symbol = match[4] || "",
        zero = !!match[5],
        width = match[6] && +match[6],
        comma = !!match[7],
        precision = match[8] && +match[8].slice(1),
        type = match[9] || "";

    // The "n" type is an alias for ",g".
    if (type === "n") comma = true, type = "g";

    // Map invalid types to the default format.
    else if (!formatTypes[type]) type = "";

    // If zero fill is specified, padding goes after sign and before digits.
    if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

    this.fill = fill;
    this.align = align;
    this.sign = sign;
    this.symbol = symbol;
    this.zero = zero;
    this.width = width;
    this.comma = comma;
    this.precision = precision;
    this.type = type;
  }

  FormatSpecifier.prototype.toString = function() {
    return this.fill
        + this.align
        + this.sign
        + this.symbol
        + (this.zero ? "0" : "")
        + (this.width == null ? "" : Math.max(1, this.width | 0))
        + (this.comma ? "," : "")
        + (this.precision == null ? "" : "." + Math.max(0, this.precision | 0))
        + this.type;
  };

  var prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

  function identity$2(x) {
    return x;
  }

  function formatLocale(locale) {
    var group = locale.grouping && locale.thousands ? formatGroup(locale.grouping, locale.thousands) : identity$2,
        currency = locale.currency,
        decimal = locale.decimal;

    function newFormat(specifier) {
      specifier = formatSpecifier(specifier);

      var fill = specifier.fill,
          align = specifier.align,
          sign = specifier.sign,
          symbol = specifier.symbol,
          zero = specifier.zero,
          width = specifier.width,
          comma = specifier.comma,
          precision = specifier.precision,
          type = specifier.type;

      // Compute the prefix and suffix.
      // For SI-prefix, the suffix is lazily computed.
      var prefix = symbol === "$" ? currency[0] : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
          suffix = symbol === "$" ? currency[1] : /[%p]/.test(type) ? "%" : "";

      // What format function should we use?
      // Is this an integer type?
      // Can this type generate exponential notation?
      var formatType = formatTypes[type],
          maybeSuffix = !type || /[defgprs%]/.test(type);

      // Set the default precision if not specified,
      // or clamp the specified precision to the supported range.
      // For significant precision, it must be in [1, 21].
      // For fixed precision, it must be in [0, 20].
      precision = precision == null ? (type ? 6 : 12)
          : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
          : Math.max(0, Math.min(20, precision));

      function format(value) {
        var valuePrefix = prefix,
            valueSuffix = suffix,
            i, n, c;

        if (type === "c") {
          valueSuffix = formatType(value) + valueSuffix;
          value = "";
        } else {
          value = +value;

          // Convert negative to positive, and compute the prefix.
          // Note that -0 is not less than 0, but 1 / -0 is!
          var valueNegative = (value < 0 || 1 / value < 0) && (value *= -1, true);

          // Perform the initial formatting.
          value = formatType(value, precision);

          // If the original value was negative, it may be rounded to zero during
          // formatting; treat this as (positive) zero.
          if (valueNegative) {
            i = -1, n = value.length;
            valueNegative = false;
            while (++i < n) {
              if (c = value.charCodeAt(i), (48 < c && c < 58)
                  || (type === "x" && 96 < c && c < 103)
                  || (type === "X" && 64 < c && c < 71)) {
                valueNegative = true;
                break;
              }
            }
          }

          // Compute the prefix and suffix.
          valuePrefix = (valueNegative ? (sign === "(" ? sign : "-") : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
          valueSuffix = valueSuffix + (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + (valueNegative && sign === "(" ? ")" : "");

          // Break the formatted value into the integer “value” part that can be
          // grouped, and fractional or exponential “suffix” part that is not.
          if (maybeSuffix) {
            i = -1, n = value.length;
            while (++i < n) {
              if (c = value.charCodeAt(i), 48 > c || c > 57) {
                valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
                value = value.slice(0, i);
                break;
              }
            }
          }
        }

        // If the fill character is not "0", grouping is applied before padding.
        if (comma && !zero) value = group(value, Infinity);

        // Compute the padding.
        var length = valuePrefix.length + value.length + valueSuffix.length,
            padding = length < width ? new Array(width - length + 1).join(fill) : "";

        // If the fill character is "0", grouping is applied after padding.
        if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

        // Reconstruct the final output based on the desired alignment.
        switch (align) {
          case "<": return valuePrefix + value + valueSuffix + padding;
          case "=": return valuePrefix + padding + value + valueSuffix;
          case "^": return padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
        }
        return padding + valuePrefix + value + valueSuffix;
      }

      format.toString = function() {
        return specifier + "";
      };

      return format;
    }

    function formatPrefix(specifier, value) {
      var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
          e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
          k = Math.pow(10, -e),
          prefix = prefixes[8 + e / 3];
      return function(value) {
        return f(k * value) + prefix;
      };
    }

    return {
      format: newFormat,
      formatPrefix: formatPrefix
    };
  }

  var locale;
  var format;
  var formatPrefix;

  defaultLocale({
    decimal: ".",
    thousands: ",",
    grouping: [3],
    currency: ["$", ""]
  });

  function defaultLocale(definition) {
    locale = formatLocale(definition);
    format = locale.format;
    formatPrefix = locale.formatPrefix;
    return locale;
  }

  function precisionFixed(step) {
    return Math.max(0, -exponent(Math.abs(step)));
  }

  function precisionPrefix(step, value) {
    return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
  }

  function precisionRound(step, max) {
    step = Math.abs(step), max = Math.abs(max) - step;
    return Math.max(0, exponent(max) - exponent(step)) + 1;
  }

  /**
   * Generate tick values for the given scale and approximate tick count or
   * interval value. If the scale has a 'ticks' method, it will be used to
   * generate the ticks, with the count argument passed as a parameter. If the
   * scale lacks a 'ticks' method, the full scale domain will be returned.
   * @param {Scale} scale - The scale for which to generate tick values.
   * @param {*} [count] - The approximate number of desired ticks.
   * @return {Array<*>} - The generated tick values.
   */
  function tickValues(scale, count) {
    return scale.ticks ? scale.ticks(count) : scale.domain();
  }

  /**
   * Generate a label format function for a scale. If the scale has a
   * 'tickFormat' method, it will be used to generate the formatter, with the
   * count and specifier arguments passed as parameters. If the scale lacks a
   * 'tickFormat' method, the returned formatter performs simple string coercion.
   * If the input scale is a logarithmic scale and the format specifier does not
   * indicate a desired decimal precision, a special variable precision formatter
   * that automatically trims trailing zeroes will be generated.
   * @param {Scale} scale - The scale for which to generate the label formatter.
   * @param {*} [count] - The approximate number of desired ticks.
   * @param {string} [specifier] - The format specifier. Must be a legal d3 4.0
   *   specifier string (see https://github.com/d3/d3-format#formatSpecifier).
   * @return {function(*):string} - The generated label formatter.
   */
  function tickFormat(scale, count, specifier) {
    var format = scale.tickFormat
      ? scale.tickFormat(count, specifier)
      : String;

    return (scale.type === 'log')
      ? filter$1(format, variablePrecision(specifier))
      : format;
  }

  function filter$1(sourceFormat, targetFormat) {
    return function(_) {
      return sourceFormat(_) ? targetFormat(_) : '';
    };
  }

  function variablePrecision(specifier) {
    var s = formatSpecifier(specifier || ',');

    if (s.precision == null) {
      s.precision = 12;
      switch (s.type) {
        case '%': s.precision -= 2; break;
        case 'e': s.precision -= 1; break;
      }
      return trimZeroes(
        format(s),          // number format
        format('.1f')(1)[1] // decimal point character
      );
    } else {
      return format(s);
    }
  }

  function trimZeroes(format, decimalChar) {
    return function(x) {
      var str = format(x),
          dec = str.indexOf(decimalChar),
          idx, end;

      if (dec < 0) return str;

      idx = rightmostDigit(str, dec);
      end = idx < str.length ? str.slice(idx) : '';
      while (--idx > dec) if (str[idx] !== '0') { ++idx; break; }

      return str.slice(0, idx) + end;
    };
  }

  function rightmostDigit(str, dec) {
    var i = str.lastIndexOf('e'), c;
    if (i > 0) return i;
    for (i=str.length; --i > dec;) {
      c = str.charCodeAt(i);
      if (c >= 48 && c <= 57) return i + 1; // is digit
    }
  }

  /**
   * Generates axis ticks for visualizing a spatial scale.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {Scale} params.scale - The scale to generate ticks for.
   * @param {*} [params.count=10] - The approximate number of ticks, or
   *   desired tick interval, to use.
   * @param {Array<*>} [params.values] - The exact tick values to use.
   *   These must be legal domain values for the provided scale.
   *   If provided, the count argument is ignored.
   * @param {function(*):string} [params.formatSpecifier] - A format specifier
   *   to use in conjunction with scale.tickFormat. Legal values are
   *   any valid d3 4.0 format specifier.
   * @param {function(*):string} [params.format] - The format function to use.
   *   If provided, the formatSpecifier argument is ignored.
   */
  function AxisTicks(params) {
    Transform.call(this, [], params);
  }

  var prototype$32 = inherits(AxisTicks, Transform);

  prototype$32.transform = function(_, pulse) {
    if (this.value != null && !_.modified()) {
      return pulse.StopPropagation;
    }

    var out = pulse.fork(),
        ticks = this.value,
        scale = _.scale,
        count = _.count == null ? 10 : _.count,
        format = _.format || tickFormat(scale, count, _.formatSpecifier),
        values = _.values || tickValues(scale, count);

    if (ticks) out.rem = ticks;

    ticks = values.map(function(v) {
      return ingest({value: v, label: format(v)})
    });

    return (out.source = out.add = this.value = ticks), out;
  };

  /**
   * Joins a set of data elements against a set of visual items.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): object} [params.item] - An item generator function.
   * @param {function(object): *} [params.key] - The key field associating data and visual items.
   */
  function DataJoin(params) {
    Transform.call(this, map$1(), params);
  }

  var prototype$33 = inherits(DataJoin, Transform);

  function defaultItemCreate() {
    return ingest({});
  }

  prototype$33.transform = function(_, pulse) {
    var out = pulse.fork(pulse.NO_SOURCE),
        item = _.item || defaultItemCreate,
        key = _.key || id$1,
        lut = this.value;

    if (_.modified('key') || pulse.modified(key)) {
      // TODO: support re-keying?
      error('DataJoin does not support modified key function or fields.');
    }

    pulse.visit(pulse.REM, function(t) {
      var k = key(t),
          x = lut.get(k);

      if (x) {
        lut.remove(k);
        out.rem.push(x);
      }
    });

    pulse.visit(pulse.ADD, function(t) {
      var k = key(t),
          x = lut.get(k);

      if (x) {
        out.mod.push(x);
      } else {
        lut.set(k, x = item(t));
        out.add.push(x);
      }
      x.datum = t;
    });

    pulse.visit(pulse.MOD, function(t) {
      var k = key(t),
          x = lut.get(k);

      if (x) {
        out.mod.push(x);
      }
    });

    return out;
  };

  /**
   * Invokes encoding functions for visual items.
   * @constructor
   * @param {object} params - The parameters to the encoding functions. This
   *   parameter object will be passed through to all invoked encoding functions.
   * @param {object} param.encoders - The encoding functions
   * @param {function(object, object): boolean} [param.encoders.update] - Update encoding set
   * @param {function(object, object): boolean} [param.encoders.enter] - Enter encoding set
   * @param {function(object, object): boolean} [param.encoders.exit] - Exit encoding set
   */
  function Encode(params) {
    Transform.call(this, null, params);
  }

  var prototype$34 = inherits(Encode, Transform);

  prototype$34.transform = function(_, pulse) {
    var out = pulse.fork(pulse.ADD_REM),
        update = _.encoders.update || falsy,
        enter = _.encoders.enter || falsy,
        exit = _.encoders.exit || falsy,
        set = (pulse.encode ? _.encoders[pulse.encode] : update) || falsy;

    if (enter !== falsy || update !== falsy) {
      pulse.visit(pulse.ADD, function(t) {
        enter(t, _);
        update(t, _);
        if (set !== falsy && set !== update) set(t, _);
      });
    }

    if (exit !== falsy) {
      pulse.visit(pulse.REM, function(t) {
        exit(t, _);
      });
    }

    if (set !== falsy) {
      var flag = pulse.MOD | (_.modified() ? pulse.REFLOW : 0);
      pulse.visit(flag, function(t) {
        if (set(t, _)) { out.mod.push(t); }
      });
    }

    return out;
  };

  var array$3 = Array.prototype;

  var map$2 = array$3.map;
  var slice$1 = array$3.slice;

  var implicit = {name: "implicit"};

  function ordinal(range) {
    var index = map$1(),
        domain = [],
        unknown = implicit;

    range = range == null ? [] : slice$1.call(range);

    function scale(d) {
      var key = d + "", i = index.get(key);
      if (!i) {
        if (unknown !== implicit) return unknown;
        index.set(key, i = domain.push(d));
      }
      return range[(i - 1) % range.length];
    }

    scale.domain = function(_) {
      if (!arguments.length) return domain.slice();
      domain = [], index = map$1();
      var i = -1, n = _.length, d, key;
      while (++i < n) if (!index.has(key = (d = _[i]) + "")) index.set(key, domain.push(d));
      return scale;
    };

    scale.range = function(_) {
      return arguments.length ? (range = slice$1.call(_), scale) : range.slice();
    };

    scale.unknown = function(_) {
      return arguments.length ? (unknown = _, scale) : unknown;
    };

    scale.copy = function() {
      return ordinal()
          .domain(domain)
          .range(range)
          .unknown(unknown);
    };

    return scale;
  }

  function band() {
    var scale = ordinal().unknown(undefined),
        domain = scale.domain,
        ordinalRange = scale.range,
        range$$ = [0, 1],
        step,
        bandwidth,
        round = false,
        paddingInner = 0,
        paddingOuter = 0,
        align = 0.5;

    delete scale.unknown;

    function rescale() {
      var n = domain().length,
          reverse = range$$[1] < range$$[0],
          start = range$$[reverse - 0],
          stop = range$$[1 - reverse];
      step = (stop - start) / Math.max(1, n - paddingInner + paddingOuter * 2);
      if (round) step = Math.floor(step);
      start += (stop - start - step * (n - paddingInner)) * align;
      bandwidth = step * (1 - paddingInner);
      if (round) start = Math.round(start), bandwidth = Math.round(bandwidth);
      var values = range(n).map(function(i) { return start + step * i; });
      return ordinalRange(reverse ? values.reverse() : values);
    }

    scale.domain = function(_) {
      return arguments.length ? (domain(_), rescale()) : domain();
    };

    scale.range = function(_) {
      return arguments.length ? (range$$ = [+_[0], +_[1]], rescale()) : range$$.slice();
    };

    scale.rangeRound = function(_) {
      return range$$ = [+_[0], +_[1]], round = true, rescale();
    };

    scale.bandwidth = function() {
      return bandwidth;
    };

    scale.step = function() {
      return step;
    };

    scale.round = function(_) {
      return arguments.length ? (round = !!_, rescale()) : round;
    };

    scale.padding = function(_) {
      return arguments.length ? (paddingInner = paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
    };

    scale.paddingInner = function(_) {
      return arguments.length ? (paddingInner = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
    };

    scale.paddingOuter = function(_) {
      return arguments.length ? (paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingOuter;
    };

    scale.align = function(_) {
      return arguments.length ? (align = Math.max(0, Math.min(1, _)), rescale()) : align;
    };

    scale.invertExtent = function(r0, r1) {
      var lo = +r0,
          hi = arguments.length > 1 ? +r1 : lo,
          reverse = range$$[1] < range$$[0],
          values = reverse ? ordinalRange().reverse() : ordinalRange(),
          n = values.length - 1, a, b, t;

      // order range inputs, bail if outside of scale range
      if (hi < lo) t = lo, lo = hi, hi = t;
      if (hi < values[0] || lo > range$$[1-reverse]) return undefined;

      // binary search to index into scale range
      a = Math.max(0, bisectRight(values, lo) - 1);
      b = lo===hi ? a : bisectRight(values, hi) - 1;

      // increment index a if lo is within padding gap
      if (lo - values[a] > bandwidth + 1e-10) ++a;

      if (reverse) t = a, a = n - b, b = n - t; // map + swap
      return (a > b) ? undefined : domain().slice(a, b+1);
    };

    scale.copy = function() {
      return band()
          .domain(domain())
          .range(range$$)
          .round(round)
          .paddingInner(paddingInner)
          .paddingOuter(paddingOuter)
          .align(align);
    };

    return rescale();
  }

  function pointish(scale) {
    var copy = scale.copy;

    scale.padding = scale.paddingOuter;
    delete scale.paddingInner;
    delete scale.paddingOuter;

    scale.copy = function() {
      return pointish(copy());
    };

    return scale;
  }

  function point() {
    return pointish(band().paddingInner(1));
  }

  function define(constructor, factory, prototype) {
    constructor.prototype = factory.prototype = prototype;
    prototype.constructor = constructor;
  }

  function extend$1(parent, definition) {
    var prototype = Object.create(parent.prototype);
    for (var key in definition) prototype[key] = definition[key];
    return prototype;
  }

  function Color() {}

  var darker = 0.7;
  var brighter = 1 / darker;

  var reHex3 = /^#([0-9a-f]{3})$/;
  var reHex6 = /^#([0-9a-f]{6})$/;
  var reRgbInteger = /^rgb\(\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*\)$/;
  var reRgbPercent = /^rgb\(\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*\)$/;
  var reRgbaInteger = /^rgba\(\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)$/;
  var reRgbaPercent = /^rgba\(\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)$/;
  var reHslPercent = /^hsl\(\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*\)$/;
  var reHslaPercent = /^hsla\(\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)$/;
  var named = {
    aliceblue: 0xf0f8ff,
    antiquewhite: 0xfaebd7,
    aqua: 0x00ffff,
    aquamarine: 0x7fffd4,
    azure: 0xf0ffff,
    beige: 0xf5f5dc,
    bisque: 0xffe4c4,
    black: 0x000000,
    blanchedalmond: 0xffebcd,
    blue: 0x0000ff,
    blueviolet: 0x8a2be2,
    brown: 0xa52a2a,
    burlywood: 0xdeb887,
    cadetblue: 0x5f9ea0,
    chartreuse: 0x7fff00,
    chocolate: 0xd2691e,
    coral: 0xff7f50,
    cornflowerblue: 0x6495ed,
    cornsilk: 0xfff8dc,
    crimson: 0xdc143c,
    cyan: 0x00ffff,
    darkblue: 0x00008b,
    darkcyan: 0x008b8b,
    darkgoldenrod: 0xb8860b,
    darkgray: 0xa9a9a9,
    darkgreen: 0x006400,
    darkgrey: 0xa9a9a9,
    darkkhaki: 0xbdb76b,
    darkmagenta: 0x8b008b,
    darkolivegreen: 0x556b2f,
    darkorange: 0xff8c00,
    darkorchid: 0x9932cc,
    darkred: 0x8b0000,
    darksalmon: 0xe9967a,
    darkseagreen: 0x8fbc8f,
    darkslateblue: 0x483d8b,
    darkslategray: 0x2f4f4f,
    darkslategrey: 0x2f4f4f,
    darkturquoise: 0x00ced1,
    darkviolet: 0x9400d3,
    deeppink: 0xff1493,
    deepskyblue: 0x00bfff,
    dimgray: 0x696969,
    dimgrey: 0x696969,
    dodgerblue: 0x1e90ff,
    firebrick: 0xb22222,
    floralwhite: 0xfffaf0,
    forestgreen: 0x228b22,
    fuchsia: 0xff00ff,
    gainsboro: 0xdcdcdc,
    ghostwhite: 0xf8f8ff,
    gold: 0xffd700,
    goldenrod: 0xdaa520,
    gray: 0x808080,
    green: 0x008000,
    greenyellow: 0xadff2f,
    grey: 0x808080,
    honeydew: 0xf0fff0,
    hotpink: 0xff69b4,
    indianred: 0xcd5c5c,
    indigo: 0x4b0082,
    ivory: 0xfffff0,
    khaki: 0xf0e68c,
    lavender: 0xe6e6fa,
    lavenderblush: 0xfff0f5,
    lawngreen: 0x7cfc00,
    lemonchiffon: 0xfffacd,
    lightblue: 0xadd8e6,
    lightcoral: 0xf08080,
    lightcyan: 0xe0ffff,
    lightgoldenrodyellow: 0xfafad2,
    lightgray: 0xd3d3d3,
    lightgreen: 0x90ee90,
    lightgrey: 0xd3d3d3,
    lightpink: 0xffb6c1,
    lightsalmon: 0xffa07a,
    lightseagreen: 0x20b2aa,
    lightskyblue: 0x87cefa,
    lightslategray: 0x778899,
    lightslategrey: 0x778899,
    lightsteelblue: 0xb0c4de,
    lightyellow: 0xffffe0,
    lime: 0x00ff00,
    limegreen: 0x32cd32,
    linen: 0xfaf0e6,
    magenta: 0xff00ff,
    maroon: 0x800000,
    mediumaquamarine: 0x66cdaa,
    mediumblue: 0x0000cd,
    mediumorchid: 0xba55d3,
    mediumpurple: 0x9370db,
    mediumseagreen: 0x3cb371,
    mediumslateblue: 0x7b68ee,
    mediumspringgreen: 0x00fa9a,
    mediumturquoise: 0x48d1cc,
    mediumvioletred: 0xc71585,
    midnightblue: 0x191970,
    mintcream: 0xf5fffa,
    mistyrose: 0xffe4e1,
    moccasin: 0xffe4b5,
    navajowhite: 0xffdead,
    navy: 0x000080,
    oldlace: 0xfdf5e6,
    olive: 0x808000,
    olivedrab: 0x6b8e23,
    orange: 0xffa500,
    orangered: 0xff4500,
    orchid: 0xda70d6,
    palegoldenrod: 0xeee8aa,
    palegreen: 0x98fb98,
    paleturquoise: 0xafeeee,
    palevioletred: 0xdb7093,
    papayawhip: 0xffefd5,
    peachpuff: 0xffdab9,
    peru: 0xcd853f,
    pink: 0xffc0cb,
    plum: 0xdda0dd,
    powderblue: 0xb0e0e6,
    purple: 0x800080,
    rebeccapurple: 0x663399,
    red: 0xff0000,
    rosybrown: 0xbc8f8f,
    royalblue: 0x4169e1,
    saddlebrown: 0x8b4513,
    salmon: 0xfa8072,
    sandybrown: 0xf4a460,
    seagreen: 0x2e8b57,
    seashell: 0xfff5ee,
    sienna: 0xa0522d,
    silver: 0xc0c0c0,
    skyblue: 0x87ceeb,
    slateblue: 0x6a5acd,
    slategray: 0x708090,
    slategrey: 0x708090,
    snow: 0xfffafa,
    springgreen: 0x00ff7f,
    steelblue: 0x4682b4,
    tan: 0xd2b48c,
    teal: 0x008080,
    thistle: 0xd8bfd8,
    tomato: 0xff6347,
    turquoise: 0x40e0d0,
    violet: 0xee82ee,
    wheat: 0xf5deb3,
    white: 0xffffff,
    whitesmoke: 0xf5f5f5,
    yellow: 0xffff00,
    yellowgreen: 0x9acd32
  };

  define(Color, color, {
    displayable: function() {
      return this.rgb().displayable();
    },
    toString: function() {
      return this.rgb() + "";
    }
  });

  function color(format) {
    var m;
    format = (format + "").trim().toLowerCase();
    return (m = reHex3.exec(format)) ? (m = parseInt(m[1], 16), new Rgb((m >> 8 & 0xf) | (m >> 4 & 0x0f0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1)) // #f00
        : (m = reHex6.exec(format)) ? rgbn(parseInt(m[1], 16)) // #ff0000
        : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
        : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
        : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
        : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
        : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
        : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
        : named.hasOwnProperty(format) ? rgbn(named[format])
        : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
        : null;
  }

  function rgbn(n) {
    return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
  }

  function rgba(r, g, b, a) {
    if (a <= 0) r = g = b = NaN;
    return new Rgb(r, g, b, a);
  }

  function rgbConvert(o) {
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Rgb;
    o = o.rgb();
    return new Rgb(o.r, o.g, o.b, o.opacity);
  }

  function colorRgb(r, g, b, opacity) {
    return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
  }

  function Rgb(r, g, b, opacity) {
    this.r = +r;
    this.g = +g;
    this.b = +b;
    this.opacity = +opacity;
  }

  define(Rgb, colorRgb, extend$1(Color, {
    brighter: function(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    darker: function(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    rgb: function() {
      return this;
    },
    displayable: function() {
      return (0 <= this.r && this.r <= 255)
          && (0 <= this.g && this.g <= 255)
          && (0 <= this.b && this.b <= 255)
          && (0 <= this.opacity && this.opacity <= 1);
    },
    toString: function() {
      var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
      return (a === 1 ? "rgb(" : "rgba(")
          + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
          + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
          + Math.max(0, Math.min(255, Math.round(this.b) || 0))
          + (a === 1 ? ")" : ", " + a + ")");
    }
  }));

  function hsla(h, s, l, a) {
    if (a <= 0) h = s = l = NaN;
    else if (l <= 0 || l >= 1) h = s = NaN;
    else if (s <= 0) h = NaN;
    return new Hsl(h, s, l, a);
  }

  function hslConvert(o) {
    if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Hsl;
    if (o instanceof Hsl) return o;
    o = o.rgb();
    var r = o.r / 255,
        g = o.g / 255,
        b = o.b / 255,
        min = Math.min(r, g, b),
        max = Math.max(r, g, b),
        h = NaN,
        s = max - min,
        l = (max + min) / 2;
    if (s) {
      if (r === max) h = (g - b) / s + (g < b) * 6;
      else if (g === max) h = (b - r) / s + 2;
      else h = (r - g) / s + 4;
      s /= l < 0.5 ? max + min : 2 - max - min;
      h *= 60;
    } else {
      s = l > 0 && l < 1 ? 0 : h;
    }
    return new Hsl(h, s, l, o.opacity);
  }

  function colorHsl(h, s, l, opacity) {
    return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
  }

  function Hsl(h, s, l, opacity) {
    this.h = +h;
    this.s = +s;
    this.l = +l;
    this.opacity = +opacity;
  }

  define(Hsl, colorHsl, extend$1(Color, {
    brighter: function(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    darker: function(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    rgb: function() {
      var h = this.h % 360 + (this.h < 0) * 360,
          s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
          l = this.l,
          m2 = l + (l < 0.5 ? l : 1 - l) * s,
          m1 = 2 * l - m2;
      return new Rgb(
        hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
        hsl2rgb(h, m1, m2),
        hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
        this.opacity
      );
    },
    displayable: function() {
      return (0 <= this.s && this.s <= 1 || isNaN(this.s))
          && (0 <= this.l && this.l <= 1)
          && (0 <= this.opacity && this.opacity <= 1);
    }
  }));

  /* From FvD 13.37, CSS Color Module Level 3 */
  function hsl2rgb(h, m1, m2) {
    return (h < 60 ? m1 + (m2 - m1) * h / 60
        : h < 180 ? m2
        : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
        : m1) * 255;
  }

  var deg2rad = Math.PI / 180;
  var rad2deg = 180 / Math.PI;

  var Kn = 18;
  var Xn = 0.950470;
  var Yn = 1;
  var Zn = 1.088830;
  var t0 = 4 / 29;
  var t1 = 6 / 29;
  var t2 = 3 * t1 * t1;
  var t3 = t1 * t1 * t1;
  function labConvert(o) {
    if (o instanceof Lab) return new Lab(o.l, o.a, o.b, o.opacity);
    if (o instanceof Hcl) {
      var h = o.h * deg2rad;
      return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
    }
    if (!(o instanceof Rgb)) o = rgbConvert(o);
    var b = rgb2xyz(o.r),
        a = rgb2xyz(o.g),
        l = rgb2xyz(o.b),
        x = xyz2lab((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn),
        y = xyz2lab((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn),
        z = xyz2lab((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn);
    return new Lab(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
  }

  function lab(l, a, b, opacity) {
    return arguments.length === 1 ? labConvert(l) : new Lab(l, a, b, opacity == null ? 1 : opacity);
  }

  function Lab(l, a, b, opacity) {
    this.l = +l;
    this.a = +a;
    this.b = +b;
    this.opacity = +opacity;
  }

  define(Lab, lab, extend$1(Color, {
    brighter: function(k) {
      return new Lab(this.l + Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
    },
    darker: function(k) {
      return new Lab(this.l - Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
    },
    rgb: function() {
      var y = (this.l + 16) / 116,
          x = isNaN(this.a) ? y : y + this.a / 500,
          z = isNaN(this.b) ? y : y - this.b / 200;
      y = Yn * lab2xyz(y);
      x = Xn * lab2xyz(x);
      z = Zn * lab2xyz(z);
      return new Rgb(
        xyz2rgb( 3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
        xyz2rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
        xyz2rgb( 0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
        this.opacity
      );
    }
  }));

  function xyz2lab(t) {
    return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
  }

  function lab2xyz(t) {
    return t > t1 ? t * t * t : t2 * (t - t0);
  }

  function xyz2rgb(x) {
    return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
  }

  function rgb2xyz(x) {
    return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  }

  function hclConvert(o) {
    if (o instanceof Hcl) return new Hcl(o.h, o.c, o.l, o.opacity);
    if (!(o instanceof Lab)) o = labConvert(o);
    var h = Math.atan2(o.b, o.a) * rad2deg;
    return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
  }

  function colorHcl(h, c, l, opacity) {
    return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
  }

  function Hcl(h, c, l, opacity) {
    this.h = +h;
    this.c = +c;
    this.l = +l;
    this.opacity = +opacity;
  }

  define(Hcl, colorHcl, extend$1(Color, {
    brighter: function(k) {
      return new Hcl(this.h, this.c, this.l + Kn * (k == null ? 1 : k), this.opacity);
    },
    darker: function(k) {
      return new Hcl(this.h, this.c, this.l - Kn * (k == null ? 1 : k), this.opacity);
    },
    rgb: function() {
      return labConvert(this).rgb();
    }
  }));

  var A = -0.14861;
  var B = +1.78277;
  var C = -0.29227;
  var D = -0.90649;
  var E = +1.97294;
  var ED = E * D;
  var EB = E * B;
  var BC_DA = B * C - D * A;
  function cubehelixConvert(o) {
    if (o instanceof Cubehelix) return new Cubehelix(o.h, o.s, o.l, o.opacity);
    if (!(o instanceof Rgb)) o = rgbConvert(o);
    var r = o.r / 255,
        g = o.g / 255,
        b = o.b / 255,
        l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB),
        bl = b - l,
        k = (E * (g - l) - C * bl) / D,
        s = Math.sqrt(k * k + bl * bl) / (E * l * (1 - l)), // NaN if l=0 or l=1
        h = s ? Math.atan2(k, bl) * rad2deg - 120 : NaN;
    return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.opacity);
  }

  function cubehelix(h, s, l, opacity) {
    return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s, l, opacity == null ? 1 : opacity);
  }

  function Cubehelix(h, s, l, opacity) {
    this.h = +h;
    this.s = +s;
    this.l = +l;
    this.opacity = +opacity;
  }

  define(Cubehelix, cubehelix, extend$1(Color, {
    brighter: function(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
    },
    darker: function(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
    },
    rgb: function() {
      var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad,
          l = +this.l,
          a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
          cosh = Math.cos(h),
          sinh = Math.sin(h);
      return new Rgb(
        255 * (l + a * (A * cosh + B * sinh)),
        255 * (l + a * (C * cosh + D * sinh)),
        255 * (l + a * (E * cosh)),
        this.opacity
      );
    }
  }));

  function basis(t1, v0, v1, v2, v3) {
    var t2 = t1 * t1, t3 = t2 * t1;
    return ((1 - 3 * t1 + 3 * t2 - t3) * v0
        + (4 - 6 * t2 + 3 * t3) * v1
        + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2
        + t3 * v3) / 6;
  }

  function basis$1(values) {
    var n = values.length - 1;
    return function(t) {
      var i = t <= 0 ? (t = 0) : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n),
          v1 = values[i],
          v2 = values[i + 1],
          v0 = i > 0 ? values[i - 1] : 2 * v1 - v2,
          v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
      return basis((t - i / n) * n, v0, v1, v2, v3);
    };
  }

  function constant$2(x) {
    return function() {
      return x;
    };
  }

  function linear$1(a, d) {
    return function(t) {
      return a + t * d;
    };
  }

  function exponential(a, b, y) {
    return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
      return Math.pow(a + t * b, y);
    };
  }

  function hue(a, b) {
    var d = b - a;
    return d ? linear$1(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant$2(isNaN(a) ? b : a);
  }

  function gamma(y) {
    return (y = +y) === 1 ? nogamma : function(a, b) {
      return b - a ? exponential(a, b, y) : constant$2(isNaN(a) ? b : a);
    };
  }

  function nogamma(a, b) {
    var d = b - a;
    return d ? linear$1(a, d) : constant$2(isNaN(a) ? b : a);
  }

  var rgb = (function rgbGamma(y) {
    var color = gamma(y);

    function rgb(start, end) {
      var r = color((start = colorRgb(start)).r, (end = colorRgb(end)).r),
          g = color(start.g, end.g),
          b = color(start.b, end.b),
          opacity = color(start.opacity, end.opacity);
      return function(t) {
        start.r = r(t);
        start.g = g(t);
        start.b = b(t);
        start.opacity = opacity(t);
        return start + "";
      };
    }

    rgb.gamma = rgbGamma;

    return rgb;
  })(1);

  function rgbSpline(spline) {
    return function(colors) {
      var n = colors.length,
          r = new Array(n),
          g = new Array(n),
          b = new Array(n),
          i, color;
      for (i = 0; i < n; ++i) {
        color = colorRgb(colors[i]);
        r[i] = color.r || 0;
        g[i] = color.g || 0;
        b[i] = color.b || 0;
      }
      r = spline(r);
      g = spline(g);
      b = spline(b);
      color.opacity = 1;
      return function(t) {
        color.r = r(t);
        color.g = g(t);
        color.b = b(t);
        return color + "";
      };
    };
  }

  var interpolateRgbBasis = rgbSpline(basis$1);

  function array$4(a, b) {
    var nb = b ? b.length : 0,
        na = a ? Math.min(nb, a.length) : 0,
        x = new Array(nb),
        c = new Array(nb),
        i;

    for (i = 0; i < na; ++i) x[i] = interpolateValue(a[i], b[i]);
    for (; i < nb; ++i) c[i] = b[i];

    return function(t) {
      for (i = 0; i < na; ++i) c[i] = x[i](t);
      return c;
    };
  }

  function date(a, b) {
    var d = new Date;
    return a = +a, b -= a, function(t) {
      return d.setTime(a + b * t), d;
    };
  }

  function reinterpolate(a, b) {
    return a = +a, b -= a, function(t) {
      return a + b * t;
    };
  }

  function object(a, b) {
    var i = {},
        c = {},
        k;

    if (a === null || typeof a !== "object") a = {};
    if (b === null || typeof b !== "object") b = {};

    for (k in b) {
      if (k in a) {
        i[k] = interpolateValue(a[k], b[k]);
      } else {
        c[k] = b[k];
      }
    }

    return function(t) {
      for (k in i) c[k] = i[k](t);
      return c;
    };
  }

  var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
  var reB = new RegExp(reA.source, "g");
  function zero$1(b) {
    return function() {
      return b;
    };
  }

  function one$1(b) {
    return function(t) {
      return b(t) + "";
    };
  }

  function string(a, b) {
    var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
        am, // current match in a
        bm, // current match in b
        bs, // string preceding current number in b, if any
        i = -1, // index in s
        s = [], // string constants and placeholders
        q = []; // number interpolators

    // Coerce inputs to strings.
    a = a + "", b = b + "";

    // Interpolate pairs of numbers in a & b.
    while ((am = reA.exec(a))
        && (bm = reB.exec(b))) {
      if ((bs = bm.index) > bi) { // a string precedes the next number in b
        bs = b.slice(bi, bs);
        if (s[i]) s[i] += bs; // coalesce with previous string
        else s[++i] = bs;
      }
      if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
        if (s[i]) s[i] += bm; // coalesce with previous string
        else s[++i] = bm;
      } else { // interpolate non-matching numbers
        s[++i] = null;
        q.push({i: i, x: reinterpolate(am, bm)});
      }
      bi = reB.lastIndex;
    }

    // Add remains of b.
    if (bi < b.length) {
      bs = b.slice(bi);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }

    // Special optimization for only a single match.
    // Otherwise, interpolate each of the numbers and rejoin the string.
    return s.length < 2 ? (q[0]
        ? one$1(q[0].x)
        : zero$1(b))
        : (b = q.length, function(t) {
            for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
            return s.join("");
          });
  }

  function interpolateValue(a, b) {
    var t = typeof b, c;
    return b == null || t === "boolean" ? constant$2(b)
        : (t === "number" ? reinterpolate
        : t === "string" ? ((c = color(b)) ? (b = c, rgb) : string)
        : b instanceof color ? rgb
        : b instanceof Date ? date
        : Array.isArray(b) ? array$4
        : isNaN(b) ? object
        : reinterpolate)(a, b);
  }

  function interpolateRound(a, b) {
    return a = +a, b -= a, function(t) {
      return Math.round(a + b * t);
    };
  }

  function cubehelix$1(hue) {
    return (function cubehelixGamma(y) {
      y = +y;

      function cubehelix$$(start, end) {
        var h = hue((start = cubehelix(start)).h, (end = cubehelix(end)).h),
            s = nogamma(start.s, end.s),
            l = nogamma(start.l, end.l),
            opacity = nogamma(start.opacity, end.opacity);
        return function(t) {
          start.h = h(t);
          start.s = s(t);
          start.l = l(Math.pow(t, y));
          start.opacity = opacity(t);
          return start + "";
        };
      }

      cubehelix$$.gamma = cubehelixGamma;

      return cubehelix$$;
    })(1);
  }

  cubehelix$1(hue);
  var interpolateCubehelixLong = cubehelix$1(nogamma);

  function constant$3(x) {
    return function() {
      return x;
    };
  }

  function number$2(x) {
    return +x;
  }

  var unit = [0, 1];

  function deinterpolate(a, b) {
    return (b -= (a = +a))
        ? function(x) { return (x - a) / b; }
        : constant$3(b);
  }

  function deinterpolateClamp(deinterpolate) {
    return function(a, b) {
      var d = deinterpolate(a = +a, b = +b);
      return function(x) { return x <= a ? 0 : x >= b ? 1 : d(x); };
    };
  }

  function reinterpolateClamp(reinterpolate) {
    return function(a, b) {
      var r = reinterpolate(a = +a, b = +b);
      return function(t) { return t <= 0 ? a : t >= 1 ? b : r(t); };
    };
  }

  function bimap(domain, range, deinterpolate, reinterpolate) {
    var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
    if (d1 < d0) d0 = deinterpolate(d1, d0), r0 = reinterpolate(r1, r0);
    else d0 = deinterpolate(d0, d1), r0 = reinterpolate(r0, r1);
    return function(x) { return r0(d0(x)); };
  }

  function polymap(domain, range, deinterpolate, reinterpolate) {
    var j = Math.min(domain.length, range.length) - 1,
        d = new Array(j),
        r = new Array(j),
        i = -1;

    // Reverse descending domains.
    if (domain[j] < domain[0]) {
      domain = domain.slice().reverse();
      range = range.slice().reverse();
    }

    while (++i < j) {
      d[i] = deinterpolate(domain[i], domain[i + 1]);
      r[i] = reinterpolate(range[i], range[i + 1]);
    }

    return function(x) {
      var i = bisectRight(domain, x, 1, j) - 1;
      return r[i](d[i](x));
    };
  }

  function copy$1(source, target) {
    return target
        .domain(source.domain())
        .range(source.range())
        .interpolate(source.interpolate())
        .clamp(source.clamp());
  }

  // deinterpolate(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
  // reinterpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding domain value x in [a,b].
  function continuous(deinterpolate$$, reinterpolate) {
    var domain = unit,
        range = unit,
        interpolate = interpolateValue,
        clamp = false,
        piecewise,
        output,
        input;

    function rescale() {
      piecewise = Math.min(domain.length, range.length) > 2 ? polymap : bimap;
      output = input = null;
      return scale;
    }

    function scale(x) {
      return (output || (output = piecewise(domain, range, clamp ? deinterpolateClamp(deinterpolate$$) : deinterpolate$$, interpolate)))(+x);
    }

    scale.invert = function(y) {
      return (input || (input = piecewise(range, domain, deinterpolate, clamp ? reinterpolateClamp(reinterpolate) : reinterpolate)))(+y);
    };

    scale.domain = function(_) {
      return arguments.length ? (domain = map$2.call(_, number$2), rescale()) : domain.slice();
    };

    scale.range = function(_) {
      return arguments.length ? (range = slice$1.call(_), rescale()) : range.slice();
    };

    scale.rangeRound = function(_) {
      return range = slice$1.call(_), interpolate = interpolateRound, rescale();
    };

    scale.clamp = function(_) {
      return arguments.length ? (clamp = !!_, rescale()) : clamp;
    };

    scale.interpolate = function(_) {
      return arguments.length ? (interpolate = _, rescale()) : interpolate;
    };

    return rescale();
  }

  function tickFormat$1(domain, count, specifier) {
    var start = domain[0],
        stop = domain[domain.length - 1],
        step = tickStep(start, stop, count == null ? 10 : count),
        precision;
    specifier = formatSpecifier(specifier == null ? ",f" : specifier);
    switch (specifier.type) {
      case "s": {
        var value = Math.max(Math.abs(start), Math.abs(stop));
        if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
        return formatPrefix(specifier, value);
      }
      case "":
      case "e":
      case "g":
      case "p":
      case "r": {
        if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
        break;
      }
      case "f":
      case "%": {
        if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
        break;
      }
    }
    return format(specifier);
  }

  function linearish(scale) {
    var domain = scale.domain;

    scale.ticks = function(count) {
      var d = domain();
      return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
    };

    scale.tickFormat = function(count, specifier) {
      return tickFormat$1(domain(), count, specifier);
    };

    scale.nice = function(count) {
      var d = domain(),
          i = d.length - 1,
          n = count == null ? 10 : count,
          start = d[0],
          stop = d[i],
          step = tickStep(start, stop, n);

      if (step) {
        step = tickStep(Math.floor(start / step) * step, Math.ceil(stop / step) * step, n);
        d[0] = Math.floor(start / step) * step;
        d[i] = Math.ceil(stop / step) * step;
        domain(d);
      }

      return scale;
    };

    return scale;
  }

  function linear() {
    var scale = continuous(deinterpolate, reinterpolate);

    scale.copy = function() {
      return copy$1(scale, linear());
    };

    return linearish(scale);
  }

  function identity$3() {
    var domain = [0, 1];

    function scale(x) {
      return +x;
    }

    scale.invert = scale;

    scale.domain = scale.range = function(_) {
      return arguments.length ? (domain = map$2.call(_, number$2), scale) : domain.slice();
    };

    scale.copy = function() {
      return identity$3().domain(domain);
    };

    return linearish(scale);
  }

  function nice(domain, interval) {
    domain = domain.slice();

    var i0 = 0,
        i1 = domain.length - 1,
        x0 = domain[i0],
        x1 = domain[i1],
        t;

    if (x1 < x0) {
      t = i0, i0 = i1, i1 = t;
      t = x0, x0 = x1, x1 = t;
    }

    domain[i0] = interval.floor(x0);
    domain[i1] = interval.ceil(x1);
    return domain;
  }

  function deinterpolate$1(a, b) {
    return (b = Math.log(b / a))
        ? function(x) { return Math.log(x / a) / b; }
        : constant$3(b);
  }

  function reinterpolate$1(a, b) {
    return a < 0
        ? function(t) { return -Math.pow(-b, t) * Math.pow(-a, 1 - t); }
        : function(t) { return Math.pow(b, t) * Math.pow(a, 1 - t); };
  }

  function pow10(x) {
    return isFinite(x) ? +("1e" + x) : x < 0 ? 0 : x;
  }

  function powp(base) {
    return base === 10 ? pow10
        : base === Math.E ? Math.exp
        : function(x) { return Math.pow(base, x); };
  }

  function logp(base) {
    return base === Math.E ? Math.log
        : base === 10 && Math.log10
        || base === 2 && Math.log2
        || (base = Math.log(base), function(x) { return Math.log(x) / base; });
  }

  function reflect(f) {
    return function(x) {
      return -f(-x);
    };
  }

  function log$1() {
    var scale = continuous(deinterpolate$1, reinterpolate$1).domain([1, 10]),
        domain = scale.domain,
        base = 10,
        logs = logp(10),
        pows = powp(10);

    function rescale() {
      logs = logp(base), pows = powp(base);
      if (domain()[0] < 0) logs = reflect(logs), pows = reflect(pows);
      return scale;
    }

    scale.base = function(_) {
      return arguments.length ? (base = +_, rescale()) : base;
    };

    scale.domain = function(_) {
      return arguments.length ? (domain(_), rescale()) : domain();
    };

    scale.ticks = function(count) {
      var d = domain(),
          u = d[0],
          v = d[d.length - 1],
          r;

      if (r = v < u) i = u, u = v, v = i;

      var i = logs(u),
          j = logs(v),
          p,
          k,
          t,
          n = count == null ? 10 : +count,
          z = [];

      if (!(base % 1) && j - i < n) {
        i = Math.round(i) - 1, j = Math.round(j) + 1;
        if (u > 0) for (; i < j; ++i) {
          for (k = 1, p = pows(i); k < base; ++k) {
            t = p * k;
            if (t < u) continue;
            if (t > v) break;
            z.push(t);
          }
        } else for (; i < j; ++i) {
          for (k = base - 1, p = pows(i); k >= 1; --k) {
            t = p * k;
            if (t < u) continue;
            if (t > v) break;
            z.push(t);
          }
        }
        if (r) z.reverse();
      } else {
        z = ticks(i, j, Math.min(j - i, n)).map(pows);
      }

      return z;
    };

    scale.tickFormat = function(count, specifier) {
      if (specifier == null) specifier = base === 10 ? ".0e" : ",";
      if (typeof specifier !== "function") specifier = format(specifier);
      if (count === Infinity) return specifier;
      if (count == null) count = 10;
      var k = Math.max(1, base * count / scale.ticks().length); // TODO fast estimate?
      return function(d) {
        var i = d / pows(Math.round(logs(d)));
        if (i * base < base - 0.5) i *= base;
        return i <= k ? specifier(d) : "";
      };
    };

    scale.nice = function() {
      return domain(nice(domain(), {
        floor: function(x) { return pows(Math.floor(logs(x))); },
        ceil: function(x) { return pows(Math.ceil(logs(x))); }
      }));
    };

    scale.copy = function() {
      return copy$1(scale, log$1().base(base));
    };

    return scale;
  }

  function raise(x, exponent) {
    return x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent);
  }

  function pow() {
    var exponent = 1,
        scale = continuous(deinterpolate, reinterpolate),
        domain = scale.domain;

    function deinterpolate(a, b) {
      return (b = raise(b, exponent) - (a = raise(a, exponent)))
          ? function(x) { return (raise(x, exponent) - a) / b; }
          : constant$3(b);
    }

    function reinterpolate(a, b) {
      b = raise(b, exponent) - (a = raise(a, exponent));
      return function(t) { return raise(a + b * t, 1 / exponent); };
    }

    scale.exponent = function(_) {
      return arguments.length ? (exponent = +_, domain(domain())) : exponent;
    };

    scale.copy = function() {
      return copy$1(scale, pow().exponent(exponent));
    };

    return linearish(scale);
  }

  function sqrt() {
    return pow().exponent(0.5);
  }

  function quantile() {
    var domain = [],
        range = [],
        thresholds = [];

    function rescale() {
      var i = 0, n = Math.max(1, range.length);
      thresholds = new Array(n - 1);
      while (++i < n) thresholds[i - 1] = threshold(domain, i / n);
      return scale;
    }

    function scale(x) {
      if (!isNaN(x = +x)) return range[bisectRight(thresholds, x)];
    }

    scale.invertExtent = function(y) {
      var i = range.indexOf(y);
      return i < 0 ? [NaN, NaN] : [
        i > 0 ? thresholds[i - 1] : domain[0],
        i < thresholds.length ? thresholds[i] : domain[domain.length - 1]
      ];
    };

    scale.domain = function(_) {
      if (!arguments.length) return domain.slice();
      domain = [];
      for (var i = 0, n = _.length, d; i < n; ++i) if (d = _[i], d != null && !isNaN(d = +d)) domain.push(d);
      domain.sort(ascending);
      return rescale();
    };

    scale.range = function(_) {
      return arguments.length ? (range = slice$1.call(_), rescale()) : range.slice();
    };

    scale.quantiles = function() {
      return thresholds.slice();
    };

    scale.copy = function() {
      return quantile()
          .domain(domain)
          .range(range);
    };

    return scale;
  }

  function quantize$1() {
    var x0 = 0,
        x1 = 1,
        n = 1,
        domain = [0.5],
        range = [0, 1];

    function scale(x) {
      if (x <= x) return range[bisectRight(domain, x, 0, n)];
    }

    function rescale() {
      var i = -1;
      domain = new Array(n);
      while (++i < n) domain[i] = ((i + 1) * x1 - (i - n) * x0) / (n + 1);
      return scale;
    }

    scale.domain = function(_) {
      return arguments.length ? (x0 = +_[0], x1 = +_[1], rescale()) : [x0, x1];
    };

    scale.range = function(_) {
      return arguments.length ? (n = (range = slice$1.call(_)).length - 1, rescale()) : range.slice();
    };

    scale.invertExtent = function(y) {
      var i = range.indexOf(y);
      return i < 0 ? [NaN, NaN]
          : i < 1 ? [x0, domain[0]]
          : i >= n ? [domain[n - 1], x1]
          : [domain[i - 1], domain[i]];
    };

    scale.copy = function() {
      return quantize$1()
          .domain([x0, x1])
          .range(range);
    };

    return linearish(scale);
  }

  function threshold$1() {
    var domain = [0.5],
        range = [0, 1],
        n = 1;

    function scale(x) {
      if (x <= x) return range[bisectRight(domain, x, 0, n)];
    }

    scale.domain = function(_) {
      return arguments.length ? (domain = slice$1.call(_), n = Math.min(domain.length, range.length - 1), scale) : domain.slice();
    };

    scale.range = function(_) {
      return arguments.length ? (range = slice$1.call(_), n = Math.min(domain.length, range.length - 1), scale) : range.slice();
    };

    scale.invertExtent = function(y) {
      var i = range.indexOf(y);
      return [domain[i - 1], domain[i]];
    };

    scale.copy = function() {
      return threshold$1()
          .domain(domain)
          .range(range);
    };

    return scale;
  }

var   t0$1 = new Date;
var   t1$1 = new Date;
  function newInterval(floori, offseti, count, field) {

    function interval(date) {
      return floori(date = new Date(+date)), date;
    }

    interval.floor = interval;

    interval.ceil = function(date) {
      return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
    };

    interval.round = function(date) {
      var d0 = interval(date),
          d1 = interval.ceil(date);
      return date - d0 < d1 - date ? d0 : d1;
    };

    interval.offset = function(date, step) {
      return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
    };

    interval.range = function(start, stop, step) {
      var range = [];
      start = interval.ceil(start);
      step = step == null ? 1 : Math.floor(step);
      if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
      do range.push(new Date(+start)); while (offseti(start, step), floori(start), start < stop)
      return range;
    };

    interval.filter = function(test) {
      return newInterval(function(date) {
        while (floori(date), !test(date)) date.setTime(date - 1);
      }, function(date, step) {
        while (--step >= 0) while (offseti(date, 1), !test(date));
      });
    };

    if (count) {
      interval.count = function(start, end) {
        t0$1.setTime(+start), t1$1.setTime(+end);
        floori(t0$1), floori(t1$1);
        return Math.floor(count(t0$1, t1$1));
      };

      interval.every = function(step) {
        step = Math.floor(step);
        return !isFinite(step) || !(step > 0) ? null
            : !(step > 1) ? interval
            : interval.filter(field
                ? function(d) { return field(d) % step === 0; }
                : function(d) { return interval.count(0, d) % step === 0; });
      };
    }

    return interval;
  }

  var millisecond = newInterval(function() {
    // noop
  }, function(date, step) {
    date.setTime(+date + step);
  }, function(start, end) {
    return end - start;
  });

  // An optimized implementation for this simple case.
  millisecond.every = function(k) {
    k = Math.floor(k);
    if (!isFinite(k) || !(k > 0)) return null;
    if (!(k > 1)) return millisecond;
    return newInterval(function(date) {
      date.setTime(Math.floor(date / k) * k);
    }, function(date, step) {
      date.setTime(+date + step * k);
    }, function(start, end) {
      return (end - start) / k;
    });
  };

  var durationSecond$1 = 1e3;
  var durationMinute$1 = 6e4;
  var durationHour$1 = 36e5;
  var durationDay$1 = 864e5;
  var durationWeek$1 = 6048e5;

  var second = newInterval(function(date) {
    date.setTime(Math.floor(date / durationSecond$1) * durationSecond$1);
  }, function(date, step) {
    date.setTime(+date + step * durationSecond$1);
  }, function(start, end) {
    return (end - start) / durationSecond$1;
  }, function(date) {
    return date.getUTCSeconds();
  });

  var minute = newInterval(function(date) {
    date.setTime(Math.floor(date / durationMinute$1) * durationMinute$1);
  }, function(date, step) {
    date.setTime(+date + step * durationMinute$1);
  }, function(start, end) {
    return (end - start) / durationMinute$1;
  }, function(date) {
    return date.getMinutes();
  });

  var hour = newInterval(function(date) {
    var offset = date.getTimezoneOffset() * durationMinute$1 % durationHour$1;
    if (offset < 0) offset += durationHour$1;
    date.setTime(Math.floor((+date - offset) / durationHour$1) * durationHour$1 + offset);
  }, function(date, step) {
    date.setTime(+date + step * durationHour$1);
  }, function(start, end) {
    return (end - start) / durationHour$1;
  }, function(date) {
    return date.getHours();
  });

  var day = newInterval(function(date) {
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setDate(date.getDate() + step);
  }, function(start, end) {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute$1) / durationDay$1;
  }, function(date) {
    return date.getDate() - 1;
  });

  function weekday(i) {
    return newInterval(function(date) {
      date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
      date.setHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setDate(date.getDate() + step * 7);
    }, function(start, end) {
      return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute$1) / durationWeek$1;
    });
  }

  var timeSunday = weekday(0);
  var timeMonday = weekday(1);

  var month = newInterval(function(date) {
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setMonth(date.getMonth() + step);
  }, function(start, end) {
    return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
  }, function(date) {
    return date.getMonth();
  });

  var year = newInterval(function(date) {
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setFullYear(date.getFullYear() + step);
  }, function(start, end) {
    return end.getFullYear() - start.getFullYear();
  }, function(date) {
    return date.getFullYear();
  });

  // An optimized implementation for this simple case.
  year.every = function(k) {
    return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
      date.setFullYear(Math.floor(date.getFullYear() / k) * k);
      date.setMonth(0, 1);
      date.setHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setFullYear(date.getFullYear() + step * k);
    });
  };

  var utcMinute = newInterval(function(date) {
    date.setUTCSeconds(0, 0);
  }, function(date, step) {
    date.setTime(+date + step * durationMinute$1);
  }, function(start, end) {
    return (end - start) / durationMinute$1;
  }, function(date) {
    return date.getUTCMinutes();
  });

  var utcHour = newInterval(function(date) {
    date.setUTCMinutes(0, 0, 0);
  }, function(date, step) {
    date.setTime(+date + step * durationHour$1);
  }, function(start, end) {
    return (end - start) / durationHour$1;
  }, function(date) {
    return date.getUTCHours();
  });

  var utcDay = newInterval(function(date) {
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCDate(date.getUTCDate() + step);
  }, function(start, end) {
    return (end - start) / durationDay$1;
  }, function(date) {
    return date.getUTCDate() - 1;
  });

  function utcWeekday(i) {
    return newInterval(function(date) {
      date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
      date.setUTCHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setUTCDate(date.getUTCDate() + step * 7);
    }, function(start, end) {
      return (end - start) / durationWeek$1;
    });
  }

  var utcWeek = utcWeekday(0);
  var utcMonday = utcWeekday(1);

  var utcMonth = newInterval(function(date) {
    date.setUTCDate(1);
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCMonth(date.getUTCMonth() + step);
  }, function(start, end) {
    return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
  }, function(date) {
    return date.getUTCMonth();
  });

  var utcYear = newInterval(function(date) {
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCFullYear(date.getUTCFullYear() + step);
  }, function(start, end) {
    return end.getUTCFullYear() - start.getUTCFullYear();
  }, function(date) {
    return date.getUTCFullYear();
  });

  // An optimized implementation for this simple case.
  utcYear.every = function(k) {
    return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
      date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
      date.setUTCMonth(0, 1);
      date.setUTCHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setUTCFullYear(date.getUTCFullYear() + step * k);
    });
  };

  function localDate(d) {
    if (0 <= d.y && d.y < 100) {
      var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
      date.setFullYear(d.y);
      return date;
    }
    return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
  }

  function utcDate(d) {
    if (0 <= d.y && d.y < 100) {
      var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
      date.setUTCFullYear(d.y);
      return date;
    }
    return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
  }

  function newYear(y) {
    return {y: y, m: 0, d: 1, H: 0, M: 0, S: 0, L: 0};
  }

  function formatLocale$1(locale) {
    var locale_dateTime = locale.dateTime,
        locale_date = locale.date,
        locale_time = locale.time,
        locale_periods = locale.periods,
        locale_weekdays = locale.days,
        locale_shortWeekdays = locale.shortDays,
        locale_months = locale.months,
        locale_shortMonths = locale.shortMonths;

    var periodRe = formatRe(locale_periods),
        periodLookup = formatLookup(locale_periods),
        weekdayRe = formatRe(locale_weekdays),
        weekdayLookup = formatLookup(locale_weekdays),
        shortWeekdayRe = formatRe(locale_shortWeekdays),
        shortWeekdayLookup = formatLookup(locale_shortWeekdays),
        monthRe = formatRe(locale_months),
        monthLookup = formatLookup(locale_months),
        shortMonthRe = formatRe(locale_shortMonths),
        shortMonthLookup = formatLookup(locale_shortMonths);

    var formats = {
      "a": formatShortWeekday,
      "A": formatWeekday,
      "b": formatShortMonth,
      "B": formatMonth,
      "c": null,
      "d": formatDayOfMonth,
      "e": formatDayOfMonth,
      "H": formatHour24,
      "I": formatHour12,
      "j": formatDayOfYear,
      "L": formatMilliseconds,
      "m": formatMonthNumber,
      "M": formatMinutes,
      "p": formatPeriod,
      "S": formatSeconds,
      "U": formatWeekNumberSunday,
      "w": formatWeekdayNumber,
      "W": formatWeekNumberMonday,
      "x": null,
      "X": null,
      "y": formatYear,
      "Y": formatFullYear,
      "Z": formatZone,
      "%": formatLiteralPercent
    };

    var utcFormats = {
      "a": formatUTCShortWeekday,
      "A": formatUTCWeekday,
      "b": formatUTCShortMonth,
      "B": formatUTCMonth,
      "c": null,
      "d": formatUTCDayOfMonth,
      "e": formatUTCDayOfMonth,
      "H": formatUTCHour24,
      "I": formatUTCHour12,
      "j": formatUTCDayOfYear,
      "L": formatUTCMilliseconds,
      "m": formatUTCMonthNumber,
      "M": formatUTCMinutes,
      "p": formatUTCPeriod,
      "S": formatUTCSeconds,
      "U": formatUTCWeekNumberSunday,
      "w": formatUTCWeekdayNumber,
      "W": formatUTCWeekNumberMonday,
      "x": null,
      "X": null,
      "y": formatUTCYear,
      "Y": formatUTCFullYear,
      "Z": formatUTCZone,
      "%": formatLiteralPercent
    };

    var parses = {
      "a": parseShortWeekday,
      "A": parseWeekday,
      "b": parseShortMonth,
      "B": parseMonth,
      "c": parseLocaleDateTime,
      "d": parseDayOfMonth,
      "e": parseDayOfMonth,
      "H": parseHour24,
      "I": parseHour24,
      "j": parseDayOfYear,
      "L": parseMilliseconds,
      "m": parseMonthNumber,
      "M": parseMinutes,
      "p": parsePeriod,
      "S": parseSeconds,
      "U": parseWeekNumberSunday,
      "w": parseWeekdayNumber,
      "W": parseWeekNumberMonday,
      "x": parseLocaleDate,
      "X": parseLocaleTime,
      "y": parseYear,
      "Y": parseFullYear,
      "Z": parseZone,
      "%": parseLiteralPercent
    };

    // These recursive directive definitions must be deferred.
    formats.x = newFormat(locale_date, formats);
    formats.X = newFormat(locale_time, formats);
    formats.c = newFormat(locale_dateTime, formats);
    utcFormats.x = newFormat(locale_date, utcFormats);
    utcFormats.X = newFormat(locale_time, utcFormats);
    utcFormats.c = newFormat(locale_dateTime, utcFormats);

    function newFormat(specifier, formats) {
      return function(date) {
        var string = [],
            i = -1,
            j = 0,
            n = specifier.length,
            c,
            pad,
            format;

        if (!(date instanceof Date)) date = new Date(+date);

        while (++i < n) {
          if (specifier.charCodeAt(i) === 37) {
            string.push(specifier.slice(j, i));
            if ((pad = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);
            else pad = c === "e" ? " " : "0";
            if (format = formats[c]) c = format(date, pad);
            string.push(c);
            j = i + 1;
          }
        }

        string.push(specifier.slice(j, i));
        return string.join("");
      };
    }

    function newParse(specifier, newDate) {
      return function(string) {
        var d = newYear(1900),
            i = parseSpecifier(d, specifier, string += "", 0);
        if (i != string.length) return null;

        // The am-pm flag is 0 for AM, and 1 for PM.
        if ("p" in d) d.H = d.H % 12 + d.p * 12;

        // Convert day-of-week and week-of-year to day-of-year.
        if ("W" in d || "U" in d) {
          if (!("w" in d)) d.w = "W" in d ? 1 : 0;
          var day = "Z" in d ? utcDate(newYear(d.y)).getUTCDay() : newDate(newYear(d.y)).getDay();
          d.m = 0;
          d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day + 5) % 7 : d.w + d.U * 7 - (day + 6) % 7;
        }

        // If a time zone is specified, all fields are interpreted as UTC and then
        // offset according to the specified time zone.
        if ("Z" in d) {
          d.H += d.Z / 100 | 0;
          d.M += d.Z % 100;
          return utcDate(d);
        }

        // Otherwise, all fields are in local time.
        return newDate(d);
      };
    }

    function parseSpecifier(d, specifier, string, j) {
      var i = 0,
          n = specifier.length,
          m = string.length,
          c,
          parse;

      while (i < n) {
        if (j >= m) return -1;
        c = specifier.charCodeAt(i++);
        if (c === 37) {
          c = specifier.charAt(i++);
          parse = parses[c in pads ? specifier.charAt(i++) : c];
          if (!parse || ((j = parse(d, string, j)) < 0)) return -1;
        } else if (c != string.charCodeAt(j++)) {
          return -1;
        }
      }

      return j;
    }

    function parsePeriod(d, string, i) {
      var n = periodRe.exec(string.slice(i));
      return n ? (d.p = periodLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseShortWeekday(d, string, i) {
      var n = shortWeekdayRe.exec(string.slice(i));
      return n ? (d.w = shortWeekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseWeekday(d, string, i) {
      var n = weekdayRe.exec(string.slice(i));
      return n ? (d.w = weekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseShortMonth(d, string, i) {
      var n = shortMonthRe.exec(string.slice(i));
      return n ? (d.m = shortMonthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseMonth(d, string, i) {
      var n = monthRe.exec(string.slice(i));
      return n ? (d.m = monthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
    }

    function parseLocaleDateTime(d, string, i) {
      return parseSpecifier(d, locale_dateTime, string, i);
    }

    function parseLocaleDate(d, string, i) {
      return parseSpecifier(d, locale_date, string, i);
    }

    function parseLocaleTime(d, string, i) {
      return parseSpecifier(d, locale_time, string, i);
    }

    function formatShortWeekday(d) {
      return locale_shortWeekdays[d.getDay()];
    }

    function formatWeekday(d) {
      return locale_weekdays[d.getDay()];
    }

    function formatShortMonth(d) {
      return locale_shortMonths[d.getMonth()];
    }

    function formatMonth(d) {
      return locale_months[d.getMonth()];
    }

    function formatPeriod(d) {
      return locale_periods[+(d.getHours() >= 12)];
    }

    function formatUTCShortWeekday(d) {
      return locale_shortWeekdays[d.getUTCDay()];
    }

    function formatUTCWeekday(d) {
      return locale_weekdays[d.getUTCDay()];
    }

    function formatUTCShortMonth(d) {
      return locale_shortMonths[d.getUTCMonth()];
    }

    function formatUTCMonth(d) {
      return locale_months[d.getUTCMonth()];
    }

    function formatUTCPeriod(d) {
      return locale_periods[+(d.getUTCHours() >= 12)];
    }

    return {
      format: function(specifier) {
        var f = newFormat(specifier += "", formats);
        f.toString = function() { return specifier; };
        return f;
      },
      parse: function(specifier) {
        var p = newParse(specifier += "", localDate);
        p.toString = function() { return specifier; };
        return p;
      },
      utcFormat: function(specifier) {
        var f = newFormat(specifier += "", utcFormats);
        f.toString = function() { return specifier; };
        return f;
      },
      utcParse: function(specifier) {
        var p = newParse(specifier, utcDate);
        p.toString = function() { return specifier; };
        return p;
      }
    };
  }

  var pads = {"-": "", "_": " ", "0": "0"};
  var numberRe = /^\s*\d+/;
  var percentRe = /^%/;
  var requoteRe = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;
  function pad(value, fill, width) {
    var sign = value < 0 ? "-" : "",
        string = (sign ? -value : value) + "",
        length = string.length;
    return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
  }

  function requote(s) {
    return s.replace(requoteRe, "\\$&");
  }

  function formatRe(names) {
    return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
  }

  function formatLookup(names) {
    var map = {}, i = -1, n = names.length;
    while (++i < n) map[names[i].toLowerCase()] = i;
    return map;
  }

  function parseWeekdayNumber(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 1));
    return n ? (d.w = +n[0], i + n[0].length) : -1;
  }

  function parseWeekNumberSunday(d, string, i) {
    var n = numberRe.exec(string.slice(i));
    return n ? (d.U = +n[0], i + n[0].length) : -1;
  }

  function parseWeekNumberMonday(d, string, i) {
    var n = numberRe.exec(string.slice(i));
    return n ? (d.W = +n[0], i + n[0].length) : -1;
  }

  function parseFullYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 4));
    return n ? (d.y = +n[0], i + n[0].length) : -1;
  }

  function parseYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
  }

  function parseZone(d, string, i) {
    var n = /^(Z)|([+-]\d\d)(?:\:?(\d\d))?/.exec(string.slice(i, i + 6));
    return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
  }

  function parseMonthNumber(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
  }

  function parseDayOfMonth(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.d = +n[0], i + n[0].length) : -1;
  }

  function parseDayOfYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 3));
    return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
  }

  function parseHour24(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.H = +n[0], i + n[0].length) : -1;
  }

  function parseMinutes(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.M = +n[0], i + n[0].length) : -1;
  }

  function parseSeconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.S = +n[0], i + n[0].length) : -1;
  }

  function parseMilliseconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 3));
    return n ? (d.L = +n[0], i + n[0].length) : -1;
  }

  function parseLiteralPercent(d, string, i) {
    var n = percentRe.exec(string.slice(i, i + 1));
    return n ? i + n[0].length : -1;
  }

  function formatDayOfMonth(d, p) {
    return pad(d.getDate(), p, 2);
  }

  function formatHour24(d, p) {
    return pad(d.getHours(), p, 2);
  }

  function formatHour12(d, p) {
    return pad(d.getHours() % 12 || 12, p, 2);
  }

  function formatDayOfYear(d, p) {
    return pad(1 + day.count(year(d), d), p, 3);
  }

  function formatMilliseconds(d, p) {
    return pad(d.getMilliseconds(), p, 3);
  }

  function formatMonthNumber(d, p) {
    return pad(d.getMonth() + 1, p, 2);
  }

  function formatMinutes(d, p) {
    return pad(d.getMinutes(), p, 2);
  }

  function formatSeconds(d, p) {
    return pad(d.getSeconds(), p, 2);
  }

  function formatWeekNumberSunday(d, p) {
    return pad(timeSunday.count(year(d), d), p, 2);
  }

  function formatWeekdayNumber(d) {
    return d.getDay();
  }

  function formatWeekNumberMonday(d, p) {
    return pad(timeMonday.count(year(d), d), p, 2);
  }

  function formatYear(d, p) {
    return pad(d.getFullYear() % 100, p, 2);
  }

  function formatFullYear(d, p) {
    return pad(d.getFullYear() % 10000, p, 4);
  }

  function formatZone(d) {
    var z = d.getTimezoneOffset();
    return (z > 0 ? "-" : (z *= -1, "+"))
        + pad(z / 60 | 0, "0", 2)
        + pad(z % 60, "0", 2);
  }

  function formatUTCDayOfMonth(d, p) {
    return pad(d.getUTCDate(), p, 2);
  }

  function formatUTCHour24(d, p) {
    return pad(d.getUTCHours(), p, 2);
  }

  function formatUTCHour12(d, p) {
    return pad(d.getUTCHours() % 12 || 12, p, 2);
  }

  function formatUTCDayOfYear(d, p) {
    return pad(1 + utcDay.count(utcYear(d), d), p, 3);
  }

  function formatUTCMilliseconds(d, p) {
    return pad(d.getUTCMilliseconds(), p, 3);
  }

  function formatUTCMonthNumber(d, p) {
    return pad(d.getUTCMonth() + 1, p, 2);
  }

  function formatUTCMinutes(d, p) {
    return pad(d.getUTCMinutes(), p, 2);
  }

  function formatUTCSeconds(d, p) {
    return pad(d.getUTCSeconds(), p, 2);
  }

  function formatUTCWeekNumberSunday(d, p) {
    return pad(utcWeek.count(utcYear(d), d), p, 2);
  }

  function formatUTCWeekdayNumber(d) {
    return d.getUTCDay();
  }

  function formatUTCWeekNumberMonday(d, p) {
    return pad(utcMonday.count(utcYear(d), d), p, 2);
  }

  function formatUTCYear(d, p) {
    return pad(d.getUTCFullYear() % 100, p, 2);
  }

  function formatUTCFullYear(d, p) {
    return pad(d.getUTCFullYear() % 10000, p, 4);
  }

  function formatUTCZone() {
    return "+0000";
  }

  function formatLiteralPercent() {
    return "%";
  }

  var locale$1;
  var timeFormat;
  var timeParse;
  var utcFormat;
  var utcParse;

  defaultLocale$1({
    dateTime: "%a %b %e %X %Y",
    date: "%m/%d/%Y",
    time: "%H:%M:%S",
    periods: ["AM", "PM"],
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  });

  function defaultLocale$1(definition) {
    locale$1 = formatLocale$1(definition);
    timeFormat = locale$1.format;
    timeParse = locale$1.parse;
    utcFormat = locale$1.utcFormat;
    utcParse = locale$1.utcParse;
    return locale$1;
  }

  var isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";

  function formatIsoNative(date) {
    return date.toISOString();
  }

  var formatIso = Date.prototype.toISOString
      ? formatIsoNative
      : utcFormat(isoSpecifier);

  function parseIsoNative(string) {
    var date = new Date(string);
    return isNaN(date) ? null : date;
  }

  var parseIso = +new Date("2000-01-01T00:00:00.000Z")
      ? parseIsoNative
      : utcParse(isoSpecifier);

  var durationSecond = 1000;
  var durationMinute = durationSecond * 60;
  var durationHour = durationMinute * 60;
  var durationDay = durationHour * 24;
  var durationWeek = durationDay * 7;
  var durationMonth = durationDay * 30;
  var durationYear = durationDay * 365;
  function date$1(t) {
    return new Date(t);
  }

  function number$3(t) {
    return t instanceof Date ? +t : +new Date(+t);
  }

  function calendar(year, month, week, day, hour, minute, second, millisecond, format) {
    var scale = continuous(deinterpolate, reinterpolate),
        invert = scale.invert,
        domain = scale.domain;

    var formatMillisecond = format(".%L"),
        formatSecond = format(":%S"),
        formatMinute = format("%I:%M"),
        formatHour = format("%I %p"),
        formatDay = format("%a %d"),
        formatWeek = format("%b %d"),
        formatMonth = format("%B"),
        formatYear = format("%Y");

    var tickIntervals = [
      [second,  1,      durationSecond],
      [second,  5,  5 * durationSecond],
      [second, 15, 15 * durationSecond],
      [second, 30, 30 * durationSecond],
      [minute,  1,      durationMinute],
      [minute,  5,  5 * durationMinute],
      [minute, 15, 15 * durationMinute],
      [minute, 30, 30 * durationMinute],
      [  hour,  1,      durationHour  ],
      [  hour,  3,  3 * durationHour  ],
      [  hour,  6,  6 * durationHour  ],
      [  hour, 12, 12 * durationHour  ],
      [   day,  1,      durationDay   ],
      [   day,  2,  2 * durationDay   ],
      [  week,  1,      durationWeek  ],
      [ month,  1,      durationMonth ],
      [ month,  3,  3 * durationMonth ],
      [  year,  1,      durationYear  ]
    ];

    function tickFormat(date) {
      return (second(date) < date ? formatMillisecond
          : minute(date) < date ? formatSecond
          : hour(date) < date ? formatMinute
          : day(date) < date ? formatHour
          : month(date) < date ? (week(date) < date ? formatDay : formatWeek)
          : year(date) < date ? formatMonth
          : formatYear)(date);
    }

    function tickInterval(interval, start, stop, step) {
      if (interval == null) interval = 10;

      // If a desired tick count is specified, pick a reasonable tick interval
      // based on the extent of the domain and a rough estimate of tick size.
      // Otherwise, assume interval is already a time interval and use it.
      if (typeof interval === "number") {
        var target = Math.abs(stop - start) / interval,
            i = bisector(function(i) { return i[2]; }).right(tickIntervals, target);
        if (i === tickIntervals.length) {
          step = tickStep(start / durationYear, stop / durationYear, interval);
          interval = year;
        } else if (i) {
          i = tickIntervals[target / tickIntervals[i - 1][2] < tickIntervals[i][2] / target ? i - 1 : i];
          step = i[1];
          interval = i[0];
        } else {
          step = tickStep(start, stop, interval);
          interval = millisecond;
        }
      }

      return step == null ? interval : interval.every(step);
    }

    scale.invert = function(y) {
      return new Date(invert(y));
    };

    scale.domain = function(_) {
      return arguments.length ? domain(map$2.call(_, number$3)) : domain().map(date$1);
    };

    scale.ticks = function(interval, step) {
      var d = domain(),
          t0 = d[0],
          t1 = d[d.length - 1],
          r = t1 < t0,
          t;
      if (r) t = t0, t0 = t1, t1 = t;
      t = tickInterval(interval, t0, t1, step);
      t = t ? t.range(t0, t1 + 1) : []; // inclusive stop
      return r ? t.reverse() : t;
    };

    scale.tickFormat = function(count, specifier) {
      return specifier == null ? tickFormat : format(specifier);
    };

    scale.nice = function(interval, step) {
      var d = domain();
      return (interval = tickInterval(interval, d[0], d[d.length - 1], step))
          ? domain(nice(d, interval))
          : scale;
    };

    scale.copy = function() {
      return copy$1(scale, calendar(year, month, week, day, hour, minute, second, millisecond, format));
    };

    return scale;
  }

  function scaleTime() {
    return calendar(year, month, timeSunday, day, hour, minute, second, millisecond, timeFormat).domain([new Date(2000, 0, 1), new Date(2000, 0, 2)]);
  }

  function scaleUtc() {
    return calendar(utcYear, utcMonth, utcWeek, utcDay, utcHour, utcMinute, second, millisecond, utcFormat).domain([Date.UTC(2000, 0, 1), Date.UTC(2000, 0, 2)]);
  }

  function colors(s) {
    return s.match(/.{6}/g).map(function(x) {
      return "#" + x;
    });
  }

  var schemeCategory10 = colors("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");

  var schemeCategory20b = colors("393b795254a36b6ecf9c9ede6379398ca252b5cf6bcedb9c8c6d31bd9e39e7ba52e7cb94843c39ad494ad6616be7969c7b4173a55194ce6dbdde9ed6");

  var schemeCategory20c = colors("3182bd6baed69ecae1c6dbefe6550dfd8d3cfdae6bfdd0a231a35474c476a1d99bc7e9c0756bb19e9ac8bcbddcdadaeb636363969696bdbdbdd9d9d9");

  var schemeCategory20 = colors("1f77b4aec7e8ff7f0effbb782ca02c98df8ad62728ff98969467bdc5b0d58c564bc49c94e377c2f7b6d27f7f7fc7c7c7bcbd22dbdb8d17becf9edae5");

  var interpolateCubehelixDefault = interpolateCubehelixLong(cubehelix(300, 0.5, 0.0), cubehelix(-240, 0.5, 1.0));

  var warm = interpolateCubehelixLong(cubehelix(-100, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

  var cool = interpolateCubehelixLong(cubehelix(260, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

  var rainbow = cubehelix();

  function interpolateRainbow(t) {
    if (t < 0 || t > 1) t -= Math.floor(t);
    var ts = Math.abs(t - 0.5);
    rainbow.h = 360 * t - 100;
    rainbow.s = 1.5 - 1.5 * ts;
    rainbow.l = 0.8 - 0.9 * ts;
    return rainbow + "";
  }

  function ramp(range) {
    var n = range.length;
    return function(t) {
      return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
    };
  }

  var interpolateViridis = ramp(colors("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));

  var magma = ramp(colors("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));

  var inferno = ramp(colors("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));

  var plasma = ramp(colors("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));

  function sequential(interpolator) {
    var x0 = 0,
        x1 = 1,
        clamp = false;

    function scale(x) {
      var t = (x - x0) / (x1 - x0);
      return interpolator(clamp ? Math.max(0, Math.min(1, t)) : t);
    }

    scale.domain = function(_) {
      return arguments.length ? (x0 = +_[0], x1 = +_[1], scale) : [x0, x1];
    };

    scale.clamp = function(_) {
      return arguments.length ? (clamp = !!_, scale) : clamp;
    };

    scale.interpolator = function(_) {
      return arguments.length ? (interpolator = _, scale) : interpolator;
    };

    scale.copy = function() {
      return sequential(interpolator).domain([x0, x1]).clamp(clamp);
    };

    return linearish(scale);
  }

  function colors$1(colors) {
    return colors.match(/.{6}/g).map(function(x) {
      return "#" + x;
    });
  }

  var schemeAccent = colors$1("7fc97fbeaed4fdc086ffff99386cb0f0027fbf5b17666666");

  var schemeDark2 = colors$1("1b9e77d95f027570b3e7298a66a61ee6ab02a6761d666666");

  var schemePaired = colors$1("a6cee31f78b4b2df8a33a02cfb9a99e31a1cfdbf6fff7f00cab2d66a3d9affff99b15928");

  var schemePastel1 = colors$1("fbb4aeb3cde3ccebc5decbe4fed9a6ffffcce5d8bdfddaecf2f2f2");

  var schemePastel2 = colors$1("b3e2cdfdcdaccbd5e8f4cae4e6f5c9fff2aef1e2cccccccc");

  var schemeSet1 = colors$1("e41a1c377eb84daf4a984ea3ff7f00ffff33a65628f781bf999999");

  var schemeSet2 = colors$1("66c2a5fc8d628da0cbe78ac3a6d854ffd92fe5c494b3b3b3");

  var schemeSet3 = colors$1("8dd3c7ffffb3bebadafb807280b1d3fdb462b3de69fccde5d9d9d9bc80bdccebc5ffed6f");

  function ramp$1(range) {
    return interpolateRgbBasis(colors$1(range));
  }

  var interpolateBrBG = ramp$1("5430058c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e003c30");

  var interpolatePRGn = ramp$1("40004b762a839970abc2a5cfe7d4e8f7f7f7d9f0d3a6dba05aae611b783700441b");

  var interpolatePiYG = ramp$1("8e0152c51b7dde77aef1b6dafde0eff7f7f7e6f5d0b8e1867fbc414d9221276419");

  var interpolatePuOr = ramp$1("7f3b08b35806e08214fdb863fee0b6f7f7f7d8daebb2abd28073ac5427882d004b");

  var interpolateRdBu = ramp$1("67001fb2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac053061");

  var interpolateRdGy = ramp$1("67001fb2182bd6604df4a582fddbc7ffffffe0e0e0bababa8787874d4d4d1a1a1a");

  var interpolateRdYlBu = ramp$1("a50026d73027f46d43fdae61fee090ffffbfe0f3f8abd9e974add14575b4313695");

  var interpolateRdYlGn = ramp$1("a50026d73027f46d43fdae61fee08bffffbfd9ef8ba6d96a66bd631a9850006837");

  var interpolateSpectral = ramp$1("9e0142d53e4ff46d43fdae61fee08bffffbfe6f598abdda466c2a53288bd5e4fa2");

  var interpolateBuGn = ramp$1("f7fcfde5f5f9ccece699d8c966c2a441ae76238b45006d2c00441b");

  var interpolateBuPu = ramp$1("f7fcfde0ecf4bfd3e69ebcda8c96c68c6bb188419d810f7c4d004b");

  var interpolateGnBu = ramp$1("f7fcf0e0f3dbccebc5a8ddb57bccc44eb3d32b8cbe0868ac084081");

  var interpolateOrRd = ramp$1("fff7ecfee8c8fdd49efdbb84fc8d59ef6548d7301fb300007f0000");

  var interpolatePuBuGn = ramp$1("fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016c59014636");

  var interpolatePuBu = ramp$1("fff7fbece7f2d0d1e6a6bddb74a9cf3690c00570b0045a8d023858");

  var interpolatePuRd = ramp$1("f7f4f9e7e1efd4b9dac994c7df65b0e7298ace125698004367001f");

  var interpolateRdPu = ramp$1("fff7f3fde0ddfcc5c0fa9fb5f768a1dd3497ae017e7a017749006a");

  var interpolateYlGnBu = ramp$1("ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea8253494081d58");

  var interpolateYlGn = ramp$1("ffffe5f7fcb9d9f0a3addd8e78c67941ab5d238443006837004529");

  var interpolateYlOrBr = ramp$1("ffffe5fff7bcfee391fec44ffe9929ec7014cc4c02993404662506");

  var interpolateYlOrRd = ramp$1("ffffccffeda0fed976feb24cfd8d3cfc4e2ae31a1cbd0026800026");

  var interpolateBlues = ramp$1("f7fbffdeebf7c6dbef9ecae16baed64292c62171b508519c08306b");

  var interpolateGreens = ramp$1("f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45006d2c00441b");

  var interpolateGreys = ramp$1("fffffff0f0f0d9d9d9bdbdbd969696737373525252252525000000");

  var interpolatePurples = ramp$1("fcfbfdefedf5dadaebbcbddc9e9ac8807dba6a51a354278f3f007d");

  var interpolateReds = ramp$1("fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181da50f1567000d");

  var interpolateOranges = ramp$1("fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d94801a636037f2704");

  var scales = {
    // base scale types
    band:        band,
    point:       point,
    identity:    identity$3,
    linear:      linear,
    log:         log$1,
    ordinal:     ordinal,
    pow:         pow,
    sqrt:        sqrt,
    quantile:    quantile,
    quantize:    quantize$1,
    threshold:   threshold$1,
    time:        scaleTime,
    utc:         scaleUtc,
    sequential:  sequential
  };

  var schemes = {
    // d3 built-in categorical palettes
    category10:  schemeCategory10,
    category20:  schemeCategory20,
    category20b: schemeCategory20b,
    category20c: schemeCategory20c,

    // extended categorical palettes
    accent:      schemeAccent,
    dark2:       schemeDark2,
    paired:      schemePaired,
    pastel1:     schemePastel1,
    pastel2:     schemePastel2,
    set1:        schemeSet1,
    set2:        schemeSet2,
    set3:        schemeSet3,

    // d3 built-in interpolators
    cubehelix:   interpolateCubehelixDefault,
    rainbow:     interpolateRainbow,
    warm:        warm,
    cool:        cool,
    viridis:     interpolateViridis,
    magma:       magma,
    inferno:     inferno,
    plasma:      plasma,

    // diverging
    brbg:        interpolateBrBG,
    prgn:        interpolatePRGn,
    piyg:        interpolatePiYG,
    puor:        interpolatePuOr,
    rdbu:        interpolateRdBu,
    rdgy:        interpolateRdGy,
    rdylbu:      interpolateRdYlBu,
    rdylgn:      interpolateRdYlGn,
    spectral:    interpolateSpectral,

    // sequential multi-hue
    bugn:        interpolateBuGn,
    bupu:        interpolateBuPu,
    gnbu:        interpolateGnBu,
    orrd:        interpolateOrRd,
    pubugn:      interpolatePuBuGn,
    pubu:        interpolatePuBu,
    purd:        interpolatePuRd,
    rdpu:        interpolateRdPu,
    ylgnbu:      interpolateYlGnBu,
    ylgn:        interpolateYlGn,
    ylorbr:      interpolateYlOrBr,
    ylorrd:      interpolateYlOrRd,

    // sequential single-hue
    blues:       interpolateBlues,
    greens:      interpolateGreens,
    greys:       interpolateGreys,
    purples:     interpolatePurples,
    reds:        interpolateReds,
    oranges:     interpolateOranges
  };

  var SKIP$2 = {
        'type': 1,
        'nice': 1,
        'zero': 1,
        'domain': 1,
        'domainMin': 1,
        'domainMax': 1,
        'scheme': 1
      };

  /**
   * Maintains a scale function mapping data values to visual channels.
   * @constructor
   * @param {object} params - The parameters for this operator.
   */
  function Scale(params) {
    Transform.call(this, null, params);
    this.modified(true); // always treat as modified
  }

  var prototype$35 = inherits(Scale, Transform);

  prototype$35.transform = function(_, pulse) {
    var scale = this.value, prop;

    if (!scale || _.modified('type') || _.modified('scheme')) {
      this.value = (scale = createScale(_.type, _.scheme, pulse));
    }

    for (prop in _) {
      if (!SKIP$2[prop] && isFunction(scale[prop])) {
        scale[prop](_[prop]);
      }
    }
    configureDomain(scale, _);
  };

  function createScale(scaleType, scheme) {
    var type = (scaleType || 'linear').toLowerCase(),
        scale = scales[type];

    if (!type || !scales.hasOwnProperty(type)) {
      error('Unrecognized scale type: ' + scaleType);
    }

    if (scheme) {
      if (!schemes.hasOwnProperty(scheme)) {
        error('Unrecognized scale scheme: ' + scheme)
      }
      scheme = schemes[scheme];
    }

    return scale = scale(scheme), scale.type = type, scale;
  }

  function configureDomain(scale, _) {
    var domain = _.domain;
    if (!domain) return;

    if (_.zero || _.domainMin != null || _.domainMax != null) {
      var n = (domain = domain.slice()).length - 1;
      if (_.zero) {
        if (domain[0] > 0) domain[0] = 0;
        if (domain[n] < 0) domain[n] = 0;
      }
      if (_.domainMin != null) domain[0] = _.domainMin;
      if (_.domainMax != null) domain[n] = _.domainMax;
    }

    scale.domain(domain);
    if (_.nice && scale.nice) scale.nice((_.nice !== true && +_.nice) || null);
  }

  function forceCenter(x, y) {
    var nodes;

    if (x == null) x = 0;
    if (y == null) y = 0;

    function force() {
      var i,
          n = nodes.length,
          node,
          sx = 0,
          sy = 0;

      for (i = 0; i < n; ++i) {
        node = nodes[i], sx += node.x, sy += node.y;
      }

      for (sx = sx / n - x, sy = sy / n - y, i = 0; i < n; ++i) {
        node = nodes[i], node.x -= sx, node.y -= sy;
      }
    }

    force.initialize = function(_) {
      nodes = _;
    };

    force.x = function(_) {
      return arguments.length ? (x = +_, force) : x;
    };

    force.y = function(_) {
      return arguments.length ? (y = +_, force) : y;
    };

    return force;
  }

  function constant$4(x) {
    return function() {
      return x;
    };
  }

  function jiggle() {
    return (Math.random() - 0.5) * 1e-6;
  }

  function tree_add(d) {
    var x = +this._x.call(null, d),
        y = +this._y.call(null, d);
    return add(this.cover(x, y), x, y, d);
  }

  function add(tree, x, y, d) {
    if (isNaN(x) || isNaN(y)) return tree; // ignore invalid points

    var parent,
        node = tree._root,
        leaf = {data: d},
        x0 = tree._x0,
        y0 = tree._y0,
        x1 = tree._x1,
        y1 = tree._y1,
        xm,
        ym,
        xp,
        yp,
        right,
        bottom,
        i,
        j;

    // If the tree is empty, initialize the root as a leaf.
    if (!node) return tree._root = leaf, tree;

    // Find the existing leaf for the new point, or add it.
    while (node.length) {
      if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
      if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
      if (parent = node, !(node = node[i = bottom << 1 | right])) return parent[i] = leaf, tree;
    }

    // Is the new point is exactly coincident with the existing point?
    xp = +tree._x.call(null, node.data);
    yp = +tree._y.call(null, node.data);
    if (x === xp && y === yp) return leaf.next = node, parent ? parent[i] = leaf : tree._root = leaf, tree;

    // Otherwise, split the leaf node until the old and new point are separated.
    do {
      parent = parent ? parent[i] = new Array(4) : tree._root = new Array(4);
      if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
      if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
    } while ((i = bottom << 1 | right) === (j = (yp >= ym) << 1 | (xp >= xm)));
    return parent[j] = node, parent[i] = leaf, tree;
  }

  function addAll(data) {
    var d, i, n = data.length,
        x,
        y,
        xz = new Array(n),
        yz = new Array(n),
        x0 = Infinity,
        y0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity;

    // Compute the points and their extent.
    for (i = 0; i < n; ++i) {
      if (isNaN(x = +this._x.call(null, d = data[i])) || isNaN(y = +this._y.call(null, d))) continue;
      xz[i] = x;
      yz[i] = y;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }

    // If there were no (valid) points, inherit the existing extent.
    if (x1 < x0) x0 = this._x0, x1 = this._x1;
    if (y1 < y0) y0 = this._y0, y1 = this._y1;

    // Expand the tree to cover the new points.
    this.cover(x0, y0).cover(x1, y1);

    // Add the new points.
    for (i = 0; i < n; ++i) {
      add(this, xz[i], yz[i], data[i]);
    }

    return this;
  }

  function tree_cover(x, y) {
    if (isNaN(x = +x) || isNaN(y = +y)) return this; // ignore invalid points

    var x0 = this._x0,
        y0 = this._y0,
        x1 = this._x1,
        y1 = this._y1;

    // If the quadtree has no extent, initialize them.
    // Integer extent are necessary so that if we later double the extent,
    // the existing quadrant boundaries don’t change due to floating point error!
    if (isNaN(x0)) {
      x1 = (x0 = Math.floor(x)) + 1;
      y1 = (y0 = Math.floor(y)) + 1;
    }

    // Otherwise, double repeatedly to cover.
    else if (x0 > x || x > x1 || y0 > y || y > y1) {
      var z = x1 - x0,
          node = this._root,
          parent,
          i;

      switch (i = (y < (y0 + y1) / 2) << 1 | (x < (x0 + x1) / 2)) {
        case 0: {
          do parent = new Array(4), parent[i] = node, node = parent;
          while (z *= 2, x1 = x0 + z, y1 = y0 + z, x > x1 || y > y1);
          break;
        }
        case 1: {
          do parent = new Array(4), parent[i] = node, node = parent;
          while (z *= 2, x0 = x1 - z, y1 = y0 + z, x0 > x || y > y1);
          break;
        }
        case 2: {
          do parent = new Array(4), parent[i] = node, node = parent;
          while (z *= 2, x1 = x0 + z, y0 = y1 - z, x > x1 || y0 > y);
          break;
        }
        case 3: {
          do parent = new Array(4), parent[i] = node, node = parent;
          while (z *= 2, x0 = x1 - z, y0 = y1 - z, x0 > x || y0 > y);
          break;
        }
      }

      if (this._root && this._root.length) this._root = node;
    }

    // If the quadtree covers the point already, just return.
    else return this;

    this._x0 = x0;
    this._y0 = y0;
    this._x1 = x1;
    this._y1 = y1;
    return this;
  }

  function tree_data() {
    var data = [];
    this.visit(function(node) {
      if (!node.length) do data.push(node.data); while (node = node.next)
    });
    return data;
  }

  function tree_extent(_) {
    return arguments.length
        ? this.cover(+_[0][0], +_[0][1]).cover(+_[1][0], +_[1][1])
        : isNaN(this._x0) ? undefined : [[this._x0, this._y0], [this._x1, this._y1]];
  }

  function Quad(node, x0, y0, x1, y1) {
    this.node = node;
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
  }

  function tree_find(x, y, radius) {
    var data,
        x0 = this._x0,
        y0 = this._y0,
        x1,
        y1,
        x2,
        y2,
        x3 = this._x1,
        y3 = this._y1,
        quads = [],
        node = this._root,
        q,
        i;

    if (node) quads.push(new Quad(node, x0, y0, x3, y3));
    if (radius == null) radius = Infinity;
    else {
      x0 = x - radius, y0 = y - radius;
      x3 = x + radius, y3 = y + radius;
      radius *= radius;
    }

    while (q = quads.pop()) {

      // Stop searching if this quadrant can’t contain a closer node.
      if (!(node = q.node)
          || (x1 = q.x0) > x3
          || (y1 = q.y0) > y3
          || (x2 = q.x1) < x0
          || (y2 = q.y1) < y0) continue;

      // Bisect the current quadrant.
      if (node.length) {
        var xm = (x1 + x2) / 2,
            ym = (y1 + y2) / 2;

        quads.push(
          new Quad(node[3], xm, ym, x2, y2),
          new Quad(node[2], x1, ym, xm, y2),
          new Quad(node[1], xm, y1, x2, ym),
          new Quad(node[0], x1, y1, xm, ym)
        );

        // Visit the closest quadrant first.
        if (i = (y >= ym) << 1 | (x >= xm)) {
          q = quads[quads.length - 1];
          quads[quads.length - 1] = quads[quads.length - 1 - i];
          quads[quads.length - 1 - i] = q;
        }
      }

      // Visit this point. (Visiting coincident points isn’t necessary!)
      else {
        var dx = x - +this._x.call(null, node.data),
            dy = y - +this._y.call(null, node.data),
            d2 = dx * dx + dy * dy;
        if (d2 < radius) {
          var d = Math.sqrt(radius = d2);
          x0 = x - d, y0 = y - d;
          x3 = x + d, y3 = y + d;
          data = node.data;
        }
      }
    }

    return data;
  }

  function tree_remove(d) {
    if (isNaN(x = +this._x.call(null, d)) || isNaN(y = +this._y.call(null, d))) return this; // ignore invalid points

    var parent,
        node = this._root,
        retainer,
        previous,
        next,
        x0 = this._x0,
        y0 = this._y0,
        x1 = this._x1,
        y1 = this._y1,
        x,
        y,
        xm,
        ym,
        right,
        bottom,
        i,
        j;

    // If the tree is empty, initialize the root as a leaf.
    if (!node) return this;

    // Find the leaf node for the point.
    // While descending, also retain the deepest parent with a non-removed sibling.
    if (node.length) while (true) {
      if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
      if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
      if (!(parent = node, node = node[i = bottom << 1 | right])) return this;
      if (!node.length) break;
      if (parent[(i + 1) & 3] || parent[(i + 2) & 3] || parent[(i + 3) & 3]) retainer = parent, j = i;
    }

    // Find the point to remove.
    while (node.data !== d) if (!(previous = node, node = node.next)) return this;
    if (next = node.next) delete node.next;

    // If there are multiple coincident points, remove just the point.
    if (previous) return (next ? previous.next = next : delete previous.next), this;

    // If this is the root point, remove it.
    if (!parent) return this._root = next, this;

    // Remove this leaf.
    next ? parent[i] = next : delete parent[i];

    // If the parent now contains exactly one leaf, collapse superfluous parents.
    if ((node = parent[0] || parent[1] || parent[2] || parent[3])
        && node === (parent[3] || parent[2] || parent[1] || parent[0])
        && !node.length) {
      if (retainer) retainer[j] = node;
      else this._root = node;
    }

    return this;
  }

  function removeAll(data) {
    for (var i = 0, n = data.length; i < n; ++i) this.remove(data[i]);
    return this;
  }

  function tree_root() {
    return this._root;
  }

  function tree_size() {
    var size = 0;
    this.visit(function(node) {
      if (!node.length) do ++size; while (node = node.next)
    });
    return size;
  }

  function tree_visit(callback) {
    var quads = [], q, node = this._root, child, x0, y0, x1, y1;
    if (node) quads.push(new Quad(node, this._x0, this._y0, this._x1, this._y1));
    while (q = quads.pop()) {
      if (!callback(node = q.node, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1) && node.length) {
        var xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
        if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
        if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
        if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
        if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
      }
    }
    return this;
  }

  function tree_visitAfter(callback) {
    var quads = [], next = [], q;
    if (this._root) quads.push(new Quad(this._root, this._x0, this._y0, this._x1, this._y1));
    while (q = quads.pop()) {
      var node = q.node;
      if (node.length) {
        var child, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
        if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
        if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
        if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
        if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
      }
      next.push(q);
    }
    while (q = next.pop()) {
      callback(q.node, q.x0, q.y0, q.x1, q.y1);
    }
    return this;
  }

  function defaultX(d) {
    return d[0];
  }

  function tree_x(_) {
    return arguments.length ? (this._x = _, this) : this._x;
  }

  function defaultY(d) {
    return d[1];
  }

  function tree_y(_) {
    return arguments.length ? (this._y = _, this) : this._y;
  }

  function quadtree(nodes, x, y) {
    var tree = new Quadtree(x == null ? defaultX : x, y == null ? defaultY : y, NaN, NaN, NaN, NaN);
    return nodes == null ? tree : tree.addAll(nodes);
  }

  function Quadtree(x, y, x0, y0, x1, y1) {
    this._x = x;
    this._y = y;
    this._x0 = x0;
    this._y0 = y0;
    this._x1 = x1;
    this._y1 = y1;
    this._root = undefined;
  }

  function leaf_copy(leaf) {
    var copy = {data: leaf.data}, next = copy;
    while (leaf = leaf.next) next = next.next = {data: leaf.data};
    return copy;
  }

  var treeProto = quadtree.prototype = Quadtree.prototype;

  treeProto.copy = function() {
    var copy = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1),
        node = this._root,
        nodes,
        child;

    if (!node) return copy;

    if (!node.length) return copy._root = leaf_copy(node), copy;

    nodes = [{source: node, target: copy._root = new Array(4)}];
    while (node = nodes.pop()) {
      for (var i = 0; i < 4; ++i) {
        if (child = node.source[i]) {
          if (child.length) nodes.push({source: child, target: node.target[i] = new Array(4)});
          else node.target[i] = leaf_copy(child);
        }
      }
    }

    return copy;
  };

  treeProto.add = tree_add;
  treeProto.addAll = addAll;
  treeProto.cover = tree_cover;
  treeProto.data = tree_data;
  treeProto.extent = tree_extent;
  treeProto.find = tree_find;
  treeProto.remove = tree_remove;
  treeProto.removeAll = removeAll;
  treeProto.root = tree_root;
  treeProto.size = tree_size;
  treeProto.visit = tree_visit;
  treeProto.visitAfter = tree_visitAfter;
  treeProto.x = tree_x;
  treeProto.y = tree_y;

  function x(d) {
    return d.x + d.vx;
  }

  function y(d) {
    return d.y + d.vy;
  }

  function forceCollide(radius) {
    var nodes,
        radii,
        strength = 1,
        iterations = 1;

    if (typeof radius !== "function") radius = constant$4(radius == null ? 1 : +radius);

    function force() {
      var i, n = nodes.length,
          tree,
          node,
          xi,
          yi,
          ri,
          ri2;

      for (var k = 0; k < iterations; ++k) {
        tree = quadtree(nodes, x, y).visitAfter(prepare);
        for (i = 0; i < n; ++i) {
          node = nodes[i];
          ri = radii[i], ri2 = ri * ri;
          xi = node.x + node.vx;
          yi = node.y + node.vy;
          tree.visit(apply);
        }
      }

      function apply(quad, x0, y0, x1, y1) {
        var data = quad.data, rj = quad.r, r = ri + rj;
        if (data) {
          if (data.index > i) {
            var x = xi - data.x - data.vx,
                y = yi - data.y - data.vy,
                l = x * x + y * y;
            if (l < r * r) {
              if (x === 0) x = jiggle(), l += x * x;
              if (y === 0) y = jiggle(), l += y * y;
              l = (r - (l = Math.sqrt(l))) / l * strength;
              node.vx += (x *= l) * (r = (rj *= rj) / (ri2 + rj));
              node.vy += (y *= l) * r;
              data.vx -= x * (r = 1 - r);
              data.vy -= y * r;
            }
          }
          return;
        }
        return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r;
      }
    }

    function prepare(quad) {
      if (quad.data) return quad.r = radii[quad.data.index];
      for (var i = quad.r = 0; i < 4; ++i) {
        if (quad[i] && quad[i].r > quad.r) {
          quad.r = quad[i].r;
        }
      }
    }

    force.initialize = function(_) {
      var i, n = (nodes = _).length; radii = new Array(n);
      for (i = 0; i < n; ++i) radii[i] = +radius(nodes[i], i, nodes);
    };

    force.iterations = function(_) {
      return arguments.length ? (iterations = +_, force) : iterations;
    };

    force.strength = function(_) {
      return arguments.length ? (strength = +_, force) : strength;
    };

    force.radius = function(_) {
      return arguments.length ? (radius = typeof _ === "function" ? _ : constant$4(+_), force) : radius;
    };

    return force;
  }

  function index(d, i) {
    return i;
  }

  function forceLink(links) {
    var id = index,
        strength = defaultStrength,
        strengths,
        distance = constant$4(30),
        distances,
        nodes,
        count,
        bias,
        iterations = 1;

    if (links == null) links = [];

    function defaultStrength(link) {
      return 1 / Math.min(count[link.source.index], count[link.target.index]);
    }

    function force(alpha) {
      for (var k = 0, n = links.length; k < iterations; ++k) {
        for (var i = 0, link, source, target, x, y, l, b; i < n; ++i) {
          link = links[i], source = link.source, target = link.target;
          x = target.x + target.vx - source.x - source.vx || jiggle();
          y = target.y + target.vy - source.y - source.vy || jiggle();
          l = Math.sqrt(x * x + y * y);
          l = (l - distances[i]) / l * alpha * strengths[i];
          x *= l, y *= l;
          target.vx -= x * (b = bias[i]);
          target.vy -= y * b;
          source.vx += x * (b = 1 - b);
          source.vy += y * b;
        }
      }
    }

    function initialize() {
      if (!nodes) return;

      var i,
          n = nodes.length,
          m = links.length,
          nodeById = map$1(nodes, id),
          link;

      for (i = 0, count = new Array(n); i < n; ++i) {
        count[i] = 0;
      }

      for (i = 0; i < m; ++i) {
        link = links[i], link.index = i;
        if (typeof link.source !== "object") link.source = nodeById.get(link.source);
        if (typeof link.target !== "object") link.target = nodeById.get(link.target);
        ++count[link.source.index], ++count[link.target.index];
      }

      for (i = 0, bias = new Array(m); i < m; ++i) {
        link = links[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
      }

      strengths = new Array(m), initializeStrength();
      distances = new Array(m), initializeDistance();
    }

    function initializeStrength() {
      if (!nodes) return;

      for (var i = 0, n = links.length; i < n; ++i) {
        strengths[i] = +strength(links[i], i, links);
      }
    }

    function initializeDistance() {
      if (!nodes) return;

      for (var i = 0, n = links.length; i < n; ++i) {
        distances[i] = +distance(links[i], i, links);
      }
    }

    force.initialize = function(_) {
      nodes = _;
      initialize();
    };

    force.links = function(_) {
      return arguments.length ? (links = _, initialize(), force) : links;
    };

    force.id = function(_) {
      return arguments.length ? (id = _, force) : id;
    };

    force.iterations = function(_) {
      return arguments.length ? (iterations = +_, force) : iterations;
    };

    force.strength = function(_) {
      return arguments.length ? (strength = typeof _ === "function" ? _ : constant$4(+_), initializeStrength(), force) : strength;
    };

    force.distance = function(_) {
      return arguments.length ? (distance = typeof _ === "function" ? _ : constant$4(+_), initializeDistance(), force) : distance;
    };

    return force;
  }

  var noop = {value: function() {}};

  function dispatch() {
    for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
      if (!(t = arguments[i] + "") || (t in _)) throw new Error("illegal type: " + t);
      _[t] = [];
    }
    return new Dispatch(_);
  }

  function Dispatch(_) {
    this._ = _;
  }

  function parseTypenames(typenames, types) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
      return {type: t, name: name};
    });
  }

  Dispatch.prototype = dispatch.prototype = {
    constructor: Dispatch,
    on: function(typename, callback) {
      var _ = this._,
          T = parseTypenames(typename + "", _),
          t,
          i = -1,
          n = T.length;

      // If no callback was specified, return the callback of the given type and name.
      if (arguments.length < 2) {
        while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
        return;
      }

      // If a type was specified, set the callback for the given type and name.
      // Otherwise, if a null callback was specified, remove callbacks of the given name.
      if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
      while (++i < n) {
        if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
        else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
      }

      return this;
    },
    copy: function() {
      var copy = {}, _ = this._;
      for (var t in _) copy[t] = _[t].slice();
      return new Dispatch(copy);
    },
    call: function(type, that) {
      if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    },
    apply: function(type, that, args) {
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    }
  };

  function get(type, name) {
    for (var i = 0, n = type.length, c; i < n; ++i) {
      if ((c = type[i]).name === name) {
        return c.value;
      }
    }
  }

  function set$1(type, name, callback) {
    for (var i = 0, n = type.length; i < n; ++i) {
      if (type[i].name === name) {
        type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
        break;
      }
    }
    if (callback != null) type.push({name: name, value: callback});
    return type;
  }

  var frame = 0;
  var timeout = 0;
  var interval = 0;
  var pokeDelay = 1000;
  var taskHead;
  var taskTail;
  var clockLast = 0;
  var clockNow = 0;
  var clockSkew = 0;
  var clock = typeof performance === "object" && performance.now ? performance : Date;
  var setFrame = typeof requestAnimationFrame === "function"
          ? (clock === Date ? function(f) { requestAnimationFrame(function() { f(clock.now()); }); } : requestAnimationFrame)
          : function(f) { setTimeout(f, 17); };
  function now() {
    return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
  }

  function clearNow() {
    clockNow = 0;
  }

  function Timer() {
    this._call =
    this._time =
    this._next = null;
  }

  Timer.prototype = timer.prototype = {
    constructor: Timer,
    restart: function(callback, delay, time) {
      if (typeof callback !== "function") throw new TypeError("callback is not a function");
      time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
      if (!this._next && taskTail !== this) {
        if (taskTail) taskTail._next = this;
        else taskHead = this;
        taskTail = this;
      }
      this._call = callback;
      this._time = time;
      sleep();
    },
    stop: function() {
      if (this._call) {
        this._call = null;
        this._time = Infinity;
        sleep();
      }
    }
  };

  function timer(callback, delay, time) {
    var t = new Timer;
    t.restart(callback, delay, time);
    return t;
  }

  function timerFlush() {
    now(); // Get the current time, if not already set.
    ++frame; // Pretend we’ve set an alarm, if we haven’t already.
    var t = taskHead, e;
    while (t) {
      if ((e = clockNow - t._time) >= 0) t._call.call(null, e);
      t = t._next;
    }
    --frame;
  }

  function wake(time) {
    clockNow = (clockLast = time || clock.now()) + clockSkew;
    frame = timeout = 0;
    try {
      timerFlush();
    } finally {
      frame = 0;
      nap();
      clockNow = 0;
    }
  }

  function poke() {
    var now = clock.now(), delay = now - clockLast;
    if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
  }

  function nap() {
    var t0, t1 = taskHead, t2, time = Infinity;
    while (t1) {
      if (t1._call) {
        if (time > t1._time) time = t1._time;
        t0 = t1, t1 = t1._next;
      } else {
        t2 = t1._next, t1._next = null;
        t1 = t0 ? t0._next = t2 : taskHead = t2;
      }
    }
    taskTail = t0;
    sleep(time);
  }

  function sleep(time) {
    if (frame) return; // Soonest alarm already set, or will be.
    if (timeout) timeout = clearTimeout(timeout);
    var delay = time - clockNow;
    if (delay > 24) {
      if (time < Infinity) timeout = setTimeout(wake, delay);
      if (interval) interval = clearInterval(interval);
    } else {
      if (!interval) interval = setInterval(poke, pokeDelay);
      frame = 1, setFrame(wake);
    }
  }

  function x$1(d) {
    return d.x;
  }

  function y$1(d) {
    return d.y;
  }

  var initialRadius = 10;
  var initialAngle = Math.PI * (3 - Math.sqrt(5));
  function forceSimulation(nodes) {
    var simulation,
        alpha = 1,
        alphaMin = 0.001,
        alphaDecay = 1 - Math.pow(alphaMin, 1 / 300),
        alphaTarget = 0,
        velocityDecay = 0.6,
        forces = map$1(),
        stepper = timer(step),
        event = dispatch("tick", "end");

    if (nodes == null) nodes = [];

    function step() {
      tick();
      event.call("tick", simulation);
      if (alpha < alphaMin) {
        stepper.stop();
        event.call("end", simulation);
      }
    }

    function tick() {
      var i, n = nodes.length, node;

      alpha += (alphaTarget - alpha) * alphaDecay;

      forces.each(function(force) {
        force(alpha);
      });

      for (i = 0; i < n; ++i) {
        node = nodes[i];
        if (node.fx == null) node.x += node.vx *= velocityDecay;
        else node.x = node.fx, node.vx = 0;
        if (node.fy == null) node.y += node.vy *= velocityDecay;
        else node.y = node.fy, node.vy = 0;
      }
    }

    function initializeNodes() {
      for (var i = 0, n = nodes.length, node; i < n; ++i) {
        node = nodes[i], node.index = i;
        if (isNaN(node.x) || isNaN(node.y)) {
          var radius = initialRadius * Math.sqrt(i), angle = i * initialAngle;
          node.x = radius * Math.cos(angle);
          node.y = radius * Math.sin(angle);
        }
        if (isNaN(node.vx) || isNaN(node.vy)) {
          node.vx = node.vy = 0;
        }
      }
    }

    function initializeForce(force) {
      if (force.initialize) force.initialize(nodes);
      return force;
    }

    initializeNodes();

    return simulation = {
      tick: tick,

      restart: function() {
        return stepper.restart(step), simulation;
      },

      stop: function() {
        return stepper.stop(), simulation;
      },

      nodes: function(_) {
        return arguments.length ? (nodes = _, initializeNodes(), forces.each(initializeForce), simulation) : nodes;
      },

      alpha: function(_) {
        return arguments.length ? (alpha = +_, simulation) : alpha;
      },

      alphaMin: function(_) {
        return arguments.length ? (alphaMin = +_, simulation) : alphaMin;
      },

      alphaDecay: function(_) {
        return arguments.length ? (alphaDecay = +_, simulation) : +alphaDecay;
      },

      alphaTarget: function(_) {
        return arguments.length ? (alphaTarget = +_, simulation) : alphaTarget;
      },

      velocityDecay: function(_) {
        return arguments.length ? (velocityDecay = 1 - _, simulation) : 1 - velocityDecay;
      },

      force: function(name, _) {
        return arguments.length > 1 ? ((_ == null ? forces.remove(name) : forces.set(name, initializeForce(_))), simulation) : forces.get(name);
      },

      find: function(x, y, radius) {
        var i = 0,
            n = nodes.length,
            dx,
            dy,
            d2,
            node,
            closest;

        if (radius == null) radius = Infinity;
        else radius *= radius;

        for (i = 0; i < n; ++i) {
          node = nodes[i];
          dx = x - node.x;
          dy = y - node.y;
          d2 = dx * dx + dy * dy;
          if (d2 < radius) closest = node, radius = d2;
        }

        return closest;
      },

      on: function(name, _) {
        return arguments.length > 1 ? (event.on(name, _), simulation) : event.on(name);
      }
    };
  }

  function forceManyBody() {
    var nodes,
        node,
        alpha,
        strength = constant$4(-30),
        strengths,
        distanceMin2 = 1,
        distanceMax2 = Infinity,
        theta2 = 0.81;

    function force(_) {
      var i, n = nodes.length, tree = quadtree(nodes, x$1, y$1).visitAfter(accumulate);
      for (alpha = _, i = 0; i < n; ++i) node = nodes[i], tree.visit(apply);
    }

    function initialize() {
      if (!nodes) return;
      var i, n = nodes.length;
      strengths = new Array(n);
      for (i = 0; i < n; ++i) strengths[i] = +strength(nodes[i], i, nodes);
    }

    function accumulate(quad) {
      var strength = 0, q, c, x, y, i;

      // For internal nodes, accumulate forces from child quadrants.
      if (quad.length) {
        for (x = y = i = 0; i < 4; ++i) {
          if ((q = quad[i]) && (c = q.value)) {
            strength += c, x += c * q.x, y += c * q.y;
          }
        }
        quad.x = x / strength;
        quad.y = y / strength;
      }

      // For leaf nodes, accumulate forces from coincident quadrants.
      else {
        q = quad;
        q.x = q.data.x;
        q.y = q.data.y;
        do strength += strengths[q.data.index];
        while (q = q.next);
      }

      quad.value = strength;
    }

    function apply(quad, x1, _, x2) {
      if (!quad.value) return true;

      var x = quad.x - node.x,
          y = quad.y - node.y,
          w = x2 - x1,
          l = x * x + y * y;

      // Apply the Barnes-Hut approximation if possible.
      // Limit forces for very close nodes; randomize direction if coincident.
      if (w * w / theta2 < l) {
        if (l < distanceMax2) {
          if (x === 0) x = jiggle(), l += x * x;
          if (y === 0) y = jiggle(), l += y * y;
          if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
          node.vx += x * quad.value * alpha / l;
          node.vy += y * quad.value * alpha / l;
        }
        return true;
      }

      // Otherwise, process points directly.
      else if (quad.length || l >= distanceMax2) return;

      // Limit forces for very close nodes; randomize direction if coincident.
      if (quad.data !== node || quad.next) {
        if (x === 0) x = jiggle(), l += x * x;
        if (y === 0) y = jiggle(), l += y * y;
        if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
      }

      do if (quad.data !== node) {
        w = strengths[quad.data.index] * alpha / l;
        node.vx += x * w;
        node.vy += y * w;
      } while (quad = quad.next);
    }

    force.initialize = function(_) {
      nodes = _;
      initialize();
    };

    force.strength = function(_) {
      return arguments.length ? (strength = typeof _ === "function" ? _ : constant$4(+_), initialize(), force) : strength;
    };

    force.distanceMin = function(_) {
      return arguments.length ? (distanceMin2 = _ * _, force) : Math.sqrt(distanceMin2);
    };

    force.distanceMax = function(_) {
      return arguments.length ? (distanceMax2 = _ * _, force) : Math.sqrt(distanceMax2);
    };

    force.theta = function(_) {
      return arguments.length ? (theta2 = _ * _, force) : Math.sqrt(theta2);
    };

    return force;
  }

  function forceX(x) {
    var strength = constant$4(0.1),
        nodes,
        strengths,
        xz;

    if (typeof x !== "function") x = constant$4(x == null ? 0 : +x);

    function force(alpha) {
      for (var i = 0, n = nodes.length, node; i < n; ++i) {
        node = nodes[i], node.vx += (xz[i] - node.x) * strengths[i] * alpha;
      }
    }

    function initialize() {
      if (!nodes) return;
      var i, n = nodes.length;
      strengths = new Array(n);
      xz = new Array(n);
      for (i = 0; i < n; ++i) {
        strengths[i] = isNaN(xz[i] = +x(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
      }
    }

    force.initialize = function(_) {
      nodes = _;
      initialize();
    };

    force.strength = function(_) {
      return arguments.length ? (strength = typeof _ === "function" ? _ : constant$4(+_), initialize(), force) : strength;
    };

    force.x = function(_) {
      return arguments.length ? (x = typeof _ === "function" ? _ : constant$4(+_), initialize(), force) : x;
    };

    return force;
  }

  function forceY(y) {
    var strength = constant$4(0.1),
        nodes,
        strengths,
        yz;

    if (typeof y !== "function") y = constant$4(y == null ? 0 : +y);

    function force(alpha) {
      for (var i = 0, n = nodes.length, node; i < n; ++i) {
        node = nodes[i], node.vy += (yz[i] - node.y) * strengths[i] * alpha;
      }
    }

    function initialize() {
      if (!nodes) return;
      var i, n = nodes.length;
      strengths = new Array(n);
      yz = new Array(n);
      for (i = 0; i < n; ++i) {
        strengths[i] = isNaN(yz[i] = +y(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
      }
    }

    force.initialize = function(_) {
      nodes = _;
      initialize();
    };

    force.strength = function(_) {
      return arguments.length ? (strength = typeof _ === "function" ? _ : constant$4(+_), initialize(), force) : strength;
    };

    force.y = function(_) {
      return arguments.length ? (y = typeof _ === "function" ? _ : constant$4(+_), initialize(), force) : y;
    };

    return force;
  }

  var FORCE_MAP = map$1()
    .set('center', forceCenter)
    .set('collide', forceCollide)
    .set('nbody', forceManyBody)
    .set('link', forceLink)
    .set('x', forceX)
    .set('y', forceY);

  var FORCES = 'forces';
  var PARAMS = ['alpha', 'alphaMin', 'alphaTarget', 'velocityDecay', 'drag', 'forces'];
  var CONFIG = ['static', 'iterations'];
  var FIELDS = ['x', 'y', 'vx', 'vy', 'fx', 'fy'];
  /**
   * Force simulation layout.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {Array<object>} params.forces - The forces to apply.
   */
  function Force(params) {
    Transform.call(this, null, params);
  }

  var prototype$36 = inherits(Force, Transform);

  prototype$36.transform = function(_, pulse) {
    var sim = this.value,
        change = pulse.changed(pulse.ADD_REM),
        params = _.modified(PARAMS),
        iters = _.iterations || 300;

    // configure simulation
    if (!sim) {
      this.value = sim = simulation(pulse.source, _);
      sim.on('tick', rerun(pulse.dataflow, this));
      if (!_.static) change = true, sim.tick(); // ensure we run on init
      pulse.modifies('index');
    } else {
      if (change) pulse.modifies('index'), sim.nodes(pulse.source);
      if (params) setup(sim, _);
    }

    // fix / unfix nodes as needed
    if (_.modified('fixed')) {
      sim.nodes().forEach(function(t) { t.fx = null; t.fy = null; });
      array$1(_.fixed).forEach(function(t) { t.fx = t.x; t.fy = t.y; });
    }

    // run simulation
    if (params || change || pulse.changed() || _.modified(CONFIG)) {
      sim.alpha(Math.max(sim.alpha(), _.alpha || 1))
         .alphaDecay(1 - Math.pow(sim.alphaMin(), 1 / iters));

      if (_.static) {
        for (sim.stop(); --iters >= 0;) sim.tick();
      } else {
        if (sim.stopped()) sim.restart();
        if (!change) return pulse.StopPropagation; // defer to sim ticks
      }
    }

    return pulse.reflow().modifies(FIELDS);
  };

  function rerun(df, op) {
    return function() { df.touch(op).run(); }
  }

  function simulation(nodes, _) {
    var sim = forceSimulation(nodes),
        stopped = false,
        stop = sim.stop,
        restart = sim.restart;

    sim.stopped = function() { return stopped; };
    sim.restart = function() { return stopped = false, restart(); };
    sim.stop = function() { return stopped = true, stop(); };

    return setup(sim, _, true).on('end', function() { stopped = true; });
  }

  function setup(sim, _, init) {
    var f = array$1(_.forces), i, n, p;

    for (i=0, n=PARAMS.length; i<n; ++i) {
      p = PARAMS[i];
      if (p !== FORCES && _.modified(p)) sim[p](_[p]);
    }

    for (i=0, n=f.length; i<n; ++i) {
      if (init || _.modified(FORCES, i)) {
        sim.force(FORCES + i, getForce(f[i]));
      }
    }
    for (n=(sim.numForces || 0); i<n; ++i) {
      sim.force(FORCES + i, null); // remove
    }

    return sim.numForces = f.length, sim;
  }

  function getForce(_) {
    var f, p;
    if (!FORCE_MAP.has(_.force)) error('Unrecognized force: ' + _.force);
    f = FORCE_MAP.get(_.force)();
    for (p in _) if (isFunction(f[p])) f[p](_[p]);
    return f;
  }

  var PATHS = map$1()
    .set('line', line)
    .set('line-radial', lineR)
    .set('curve', curve)
    .set('curve-radial', curveR)
    .set('orthogonal-horizontal', orthoX)
    .set('orthogonal-vertical', orthoY)
    .set('orthogonal-radial', orthoR)
    .set('diagonal-horizontal', diagonalX)
    .set('diagonal-vertical', diagonalY)
    .set('diagonal-radial', diagonalR);

  function sourceX(t) { return t.source.x; }
  function sourceY(t) { return t.source.y; }
  function targetX(t) { return t.target.x; }
  function targetY(t) { return t.target.y; }

   /**
    * Layout paths linking source and target elements.
    * @constructor
    * @param {object} params - The parameters for this operator.
    */
  function LinkPath(params) {
    Transform.call(this, {}, params);
  }

  var prototype$37 = inherits(LinkPath, Transform);

  prototype$37.transform = function(_, pulse) {
    var sx = _.sourceX || sourceX,
        sy = _.sourceY || sourceY,
        tx = _.targetX || targetX,
        ty = _.targetY || targetY,
        orient = _.orient || 'vertical',
        shape = _.shape || 'line',
        path = PATHS.get(shape + '-' + orient) || PATHS.get(shape);

    if (!path) {
      error('LinkPath unsupported type: ' + _.shape + '-' + _.orient);
    }

    function set(t) {
      t.path = path(sx(t), sy(t), tx(t), ty(t));
    }

    if (_.modified()) {
      pulse.visit(pulse.SOURCE, set).reflow();
    } else {
      pulse.visit(pulse.ALL, set);
    }

    return pulse.modifies('path');
  };

  // -- Link Path Generation Methods -----

  function line(sx, sy, tx, ty) {
    return 'M' + sx + ',' + sy +
           'L' + tx + ',' + ty;
  }

  function lineR(sa, sr, ta, tr) {
    return line(
      sr * Math.cos(sa), sr * Math.sin(sa),
      tr * Math.cos(ta), tr * Math.sin(ta)
    );
  }

  function curve(sx, sy, tx, ty) {
    var dx = tx - sx,
        dy = ty - sy,
        ix = 0.2 * (dx + dy),
        iy = 0.2 * (dy - dx);
    return 'M' + sx + ',' + sy +
           'C' + (sx+ix) + ',' + (sy+iy) +
           ' ' + (tx+iy) + ',' + (ty-ix) +
           ' ' + tx + ',' + ty;
  }

  function curveR(sa, sr, ta, tr) {
    return curve(
      sr * Math.cos(sa), sr * Math.sin(sa),
      tr * Math.cos(ta), tr * Math.sin(ta)
    );
  }

  function orthoX(sx, sy, tx, ty) {
    return 'M' + sx + ',' + sy +
           'V' + ty + 'H' + tx;
  }

  function orthoY(sx, sy, tx, ty) {
    return 'M' + sx + ',' + sy +
           'H' + tx + 'V' + ty;
  }

  function orthoR(sa, sr, ta, tr) {
    var sc = Math.cos(sa),
        ss = Math.sin(sa),
        tc = Math.cos(ta),
        ts = Math.sin(ta),
        sf = Math.abs(ta - sa) > Math.PI ? ta <= sa : ta > sa;
    return 'M' + (sr*sc) + ',' + (sr*ss) +
           'A' + sr + ',' + sr + ' 0 0,' + (sf?1:0) +
           ' ' + (sr*tc) + ',' + (sr*ts) +
           'L' + (tr*tc) + ',' + (tr*ts);
  }

  function diagonalX(sx, sy, tx, ty) {
    var m = (sx + tx) / 2;
    return 'M' + sx + ',' + sy +
           'C' + m  + ',' + sy +
           ' ' + m  + ',' + ty +
           ' ' + tx + ',' + ty;
  }

  function diagonalY(sx, sy, tx, ty) {
    var m = (sy + ty) / 2;
    return 'M' + sx + ',' + sy +
           'C' + sx + ',' + m +
           ' ' + tx + ',' + m +
           ' ' + tx + ',' + ty;
  }

  function diagonalR(sa, sr, ta, tr) {
    var sc = Math.cos(sa),
        ss = Math.sin(sa),
        tc = Math.cos(ta),
        ts = Math.sin(ta),
        mr = (sr + tr) / 2;
    return 'M' + (sr*sc) + ',' + (sr*ss) +
           'C' + (mr*sc) + ',' + (mr*ss) +
           ' ' + (mr*tc) + ',' + (mr*ts) +
           ' ' + (tr*tc) + ',' + (tr*ts);
  }

  /**
   * Pie and donut chart layout.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.field - The value field to size pie segments.
   * @param {number} [params.startAngle=0] - The start angle (in radians) of the layout.
   * @param {number} [params.endAngle=2π] - The end angle (in radians) of the layout.
   * @param {boolean} [params.sort] - Boolean flag for sorting sectors by value.
   */
  function Pie(params) {
    Transform.call(this, null, params);
  }

  var prototype$38 = inherits(Pie, Transform);

  prototype$38.transform = function(_, pulse) {
    var field = _.field || one,
        start = _.startAngle || 0,
        stop = _.endAngle != null ? _.endAngle : 2*Math.PI,
        data = pulse.source,
        values = data.map(field),
        n = values.length,
        a = start,
        k = (stop - start) / sum(values),
        index = range(n),
        i, t, v;

    if (_.sort) {
      index.sort(function(a, b) {
        return values[a] - values[b];
      });
    }

    for (i=0; i<n; ++i) {
      v = values[index[i]];
      t = data[index[i]];
      t.startAngle = a;
      t.endAngle = (a += v * k);
    }

    this.value = values;
    return pulse.reflow().modifies(['startAngle', 'endAngle']);
  };

  var CENTER = 'center';
  var NORMALIZE = 'normalize';
  /**
   * Stack layout for visualization elements.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.field - The value field to stack.
   * @param {Array<function(object): *>} [params.groupby] - An array of accessors to groupby.
   * @param {function(object,object): number} [params.sort] - A comparator for stack sorting.
   * @param {string} [offset='zero'] - One of 'zero', 'center', 'normalize'.
   */
  function Stack(params) {
    Transform.call(this, null, params);
  }

  var prototype$39 = inherits(Stack, Transform);

  prototype$39.transform = function(_, pulse) {
    var field = _.field,
        offset = _.offset,
        groups, group, i, j, n, m,
        max, off, scale, t, a, b, v;

    // partition, sum, and sort the stack groups
    groups = partition$1(pulse.source, _.groupby, _.sort, field);

    // compute stack layouts per group
    for (i=0, n=groups.length, max=groups.max; i<n; ++i) {
      group = groups[i];
      off = offset===CENTER ? (max - group.sum)/2 : 0;
      scale = offset===NORMALIZE ? (1/group.sum) : 1;

      // set stack coordinates for each datum in group
      for (b=off, v=0, j=0, m=group.length; j<m; ++j) {
        t = group[j];
        a = b; // use previous value for start point
        v += field(t);
        b = scale * v + off; // compute end point
        t.y0 = a;
        t.y1 = b;
      }
    }

    return pulse.reflow().modifies(['y0', 'y1']);
  };

  function partition$1(data, groupby, sort, field) {
    var groups = [],
        get = function(f) { return f(t); },
        map, i, n, m, t, k, g, s, max;

    // partition data points into stack groups
    if (groupby == null) {
      groups.push(data.slice());
    } else {
      for (map={}, i=0, n=data.length; i<n; ++i) {
        t = data[i];
        k = groupby.map(get);
        g = map[k] || (groups.push(map[k] = []), map[k]);
        g.push(t);
      }
    }

    // compute sums of groups, sort groups as needed
    for (k=0, max=0, m=groups.length; k<m; ++k) {
      g = groups[k];
      for (i=0, s=0, n=g.length; i<n; ++i) {
        s += field(g[i]);
      }
      g.sum = s;
      if (s > max) max = s;
      if (sort) g.sort(sort);
    }
    groups.max = max;

    return groups;
  }

  function constant$5(x) {
    return function() {
      return x;
    };
  }

  function x$2(d) {
    return d[0];
  }

  function y$2(d) {
    return d[1];
  }

  function RedBlackTree() {
    this._ = null; // root node
  }

  function RedBlackNode(node) {
    node.U = // parent node
    node.C = // color - true for red, false for black
    node.L = // left node
    node.R = // right node
    node.P = // previous node
    node.N = null; // next node
  }

  RedBlackTree.prototype = {
    constructor: RedBlackTree,

    insert: function(after, node) {
      var parent, grandpa, uncle;

      if (after) {
        node.P = after;
        node.N = after.N;
        if (after.N) after.N.P = node;
        after.N = node;
        if (after.R) {
          after = after.R;
          while (after.L) after = after.L;
          after.L = node;
        } else {
          after.R = node;
        }
        parent = after;
      } else if (this._) {
        after = RedBlackFirst(this._);
        node.P = null;
        node.N = after;
        after.P = after.L = node;
        parent = after;
      } else {
        node.P = node.N = null;
        this._ = node;
        parent = null;
      }
      node.L = node.R = null;
      node.U = parent;
      node.C = true;

      after = node;
      while (parent && parent.C) {
        grandpa = parent.U;
        if (parent === grandpa.L) {
          uncle = grandpa.R;
          if (uncle && uncle.C) {
            parent.C = uncle.C = false;
            grandpa.C = true;
            after = grandpa;
          } else {
            if (after === parent.R) {
              RedBlackRotateLeft(this, parent);
              after = parent;
              parent = after.U;
            }
            parent.C = false;
            grandpa.C = true;
            RedBlackRotateRight(this, grandpa);
          }
        } else {
          uncle = grandpa.L;
          if (uncle && uncle.C) {
            parent.C = uncle.C = false;
            grandpa.C = true;
            after = grandpa;
          } else {
            if (after === parent.L) {
              RedBlackRotateRight(this, parent);
              after = parent;
              parent = after.U;
            }
            parent.C = false;
            grandpa.C = true;
            RedBlackRotateLeft(this, grandpa);
          }
        }
        parent = after.U;
      }
      this._.C = false;
    },

    remove: function(node) {
      if (node.N) node.N.P = node.P;
      if (node.P) node.P.N = node.N;
      node.N = node.P = null;

      var parent = node.U,
          sibling,
          left = node.L,
          right = node.R,
          next,
          red;

      if (!left) next = right;
      else if (!right) next = left;
      else next = RedBlackFirst(right);

      if (parent) {
        if (parent.L === node) parent.L = next;
        else parent.R = next;
      } else {
        this._ = next;
      }

      if (left && right) {
        red = next.C;
        next.C = node.C;
        next.L = left;
        left.U = next;
        if (next !== right) {
          parent = next.U;
          next.U = node.U;
          node = next.R;
          parent.L = node;
          next.R = right;
          right.U = next;
        } else {
          next.U = parent;
          parent = next;
          node = next.R;
        }
      } else {
        red = node.C;
        node = next;
      }

      if (node) node.U = parent;
      if (red) return;
      if (node && node.C) { node.C = false; return; }

      do {
        if (node === this._) break;
        if (node === parent.L) {
          sibling = parent.R;
          if (sibling.C) {
            sibling.C = false;
            parent.C = true;
            RedBlackRotateLeft(this, parent);
            sibling = parent.R;
          }
          if ((sibling.L && sibling.L.C)
              || (sibling.R && sibling.R.C)) {
            if (!sibling.R || !sibling.R.C) {
              sibling.L.C = false;
              sibling.C = true;
              RedBlackRotateRight(this, sibling);
              sibling = parent.R;
            }
            sibling.C = parent.C;
            parent.C = sibling.R.C = false;
            RedBlackRotateLeft(this, parent);
            node = this._;
            break;
          }
        } else {
          sibling = parent.L;
          if (sibling.C) {
            sibling.C = false;
            parent.C = true;
            RedBlackRotateRight(this, parent);
            sibling = parent.L;
          }
          if ((sibling.L && sibling.L.C)
            || (sibling.R && sibling.R.C)) {
            if (!sibling.L || !sibling.L.C) {
              sibling.R.C = false;
              sibling.C = true;
              RedBlackRotateLeft(this, sibling);
              sibling = parent.L;
            }
            sibling.C = parent.C;
            parent.C = sibling.L.C = false;
            RedBlackRotateRight(this, parent);
            node = this._;
            break;
          }
        }
        sibling.C = true;
        node = parent;
        parent = parent.U;
      } while (!node.C);

      if (node) node.C = false;
    }
  };

  function RedBlackRotateLeft(tree, node) {
    var p = node,
        q = node.R,
        parent = p.U;

    if (parent) {
      if (parent.L === p) parent.L = q;
      else parent.R = q;
    } else {
      tree._ = q;
    }

    q.U = parent;
    p.U = q;
    p.R = q.L;
    if (p.R) p.R.U = p;
    q.L = p;
  }

  function RedBlackRotateRight(tree, node) {
    var p = node,
        q = node.L,
        parent = p.U;

    if (parent) {
      if (parent.L === p) parent.L = q;
      else parent.R = q;
    } else {
      tree._ = q;
    }

    q.U = parent;
    p.U = q;
    p.L = q.R;
    if (p.L) p.L.U = p;
    q.R = p;
  }

  function RedBlackFirst(node) {
    while (node.L) node = node.L;
    return node;
  }

  function createEdge(left, right, v0, v1) {
    var edge = [null, null],
        index = edges.push(edge) - 1;
    edge.left = left;
    edge.right = right;
    if (v0) setEdgeEnd(edge, left, right, v0);
    if (v1) setEdgeEnd(edge, right, left, v1);
    cells[left.index].halfedges.push(index);
    cells[right.index].halfedges.push(index);
    return edge;
  }

  function createBorderEdge(left, v0, v1) {
    var edge = [v0, v1];
    edge.left = left;
    return edge;
  }

  function setEdgeEnd(edge, left, right, vertex) {
    if (!edge[0] && !edge[1]) {
      edge[0] = vertex;
      edge.left = left;
      edge.right = right;
    } else if (edge.left === right) {
      edge[1] = vertex;
    } else {
      edge[0] = vertex;
    }
  }

  // Liang–Barsky line clipping.
  function clipEdge(edge, x0, y0, x1, y1) {
    var a = edge[0],
        b = edge[1],
        ax = a[0],
        ay = a[1],
        bx = b[0],
        by = b[1],
        t0 = 0,
        t1 = 1,
        dx = bx - ax,
        dy = by - ay,
        r;

    r = x0 - ax;
    if (!dx && r > 0) return;
    r /= dx;
    if (dx < 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    } else if (dx > 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    }

    r = x1 - ax;
    if (!dx && r < 0) return;
    r /= dx;
    if (dx < 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    } else if (dx > 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    }

    r = y0 - ay;
    if (!dy && r > 0) return;
    r /= dy;
    if (dy < 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    } else if (dy > 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    }

    r = y1 - ay;
    if (!dy && r < 0) return;
    r /= dy;
    if (dy < 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    } else if (dy > 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    }

    if (!(t0 > 0) && !(t1 < 1)) return true; // TODO Better check?

    if (t0 > 0) edge[0] = [ax + t0 * dx, ay + t0 * dy];
    if (t1 < 1) edge[1] = [ax + t1 * dx, ay + t1 * dy];
    return true;
  }

  function connectEdge(edge, x0, y0, x1, y1) {
    var v1 = edge[1];
    if (v1) return true;

    var v0 = edge[0],
        left = edge.left,
        right = edge.right,
        lx = left[0],
        ly = left[1],
        rx = right[0],
        ry = right[1],
        fx = (lx + rx) / 2,
        fy = (ly + ry) / 2,
        fm,
        fb;

    if (ry === ly) {
      if (fx < x0 || fx >= x1) return;
      if (lx > rx) {
        if (!v0) v0 = [fx, y0];
        else if (v0[1] >= y1) return;
        v1 = [fx, y1];
      } else {
        if (!v0) v0 = [fx, y1];
        else if (v0[1] < y0) return;
        v1 = [fx, y0];
      }
    } else {
      fm = (lx - rx) / (ry - ly);
      fb = fy - fm * fx;
      if (fm < -1 || fm > 1) {
        if (lx > rx) {
          if (!v0) v0 = [(y0 - fb) / fm, y0];
          else if (v0[1] >= y1) return;
          v1 = [(y1 - fb) / fm, y1];
        } else {
          if (!v0) v0 = [(y1 - fb) / fm, y1];
          else if (v0[1] < y0) return;
          v1 = [(y0 - fb) / fm, y0];
        }
      } else {
        if (ly < ry) {
          if (!v0) v0 = [x0, fm * x0 + fb];
          else if (v0[0] >= x1) return;
          v1 = [x1, fm * x1 + fb];
        } else {
          if (!v0) v0 = [x1, fm * x1 + fb];
          else if (v0[0] < x0) return;
          v1 = [x0, fm * x0 + fb];
        }
      }
    }

    edge[0] = v0;
    edge[1] = v1;
    return true;
  }

  function clipEdges(x0, y0, x1, y1) {
    var i = edges.length,
        edge;

    while (i--) {
      if (!connectEdge(edge = edges[i], x0, y0, x1, y1)
          || !clipEdge(edge, x0, y0, x1, y1)
          || !(Math.abs(edge[0][0] - edge[1][0]) > epsilon
              || Math.abs(edge[0][1] - edge[1][1]) > epsilon)) {
        delete edges[i];
      }
    }
  }

  function createCell(site) {
    return cells[site.index] = {
      site: site,
      halfedges: []
    };
  }

  function cellHalfedgeAngle(cell, edge) {
    var site = cell.site,
        va = edge.left,
        vb = edge.right;
    if (site === vb) vb = va, va = site;
    if (vb) return Math.atan2(vb[1] - va[1], vb[0] - va[0]);
    if (site === va) va = edge[1], vb = edge[0];
    else va = edge[0], vb = edge[1];
    return Math.atan2(va[0] - vb[0], vb[1] - va[1]);
  }

  function cellHalfedgeStart(cell, edge) {
    return edge[+(edge.left !== cell.site)];
  }

  function cellHalfedgeEnd(cell, edge) {
    return edge[+(edge.left === cell.site)];
  }

  function sortCellHalfedges() {
    for (var i = 0, n = cells.length, cell, halfedges, j, m; i < n; ++i) {
      if ((cell = cells[i]) && (m = (halfedges = cell.halfedges).length)) {
        var index = new Array(m),
            array = new Array(m);
        for (j = 0; j < m; ++j) index[j] = j, array[j] = cellHalfedgeAngle(cell, edges[halfedges[j]]);
        index.sort(function(i, j) { return array[j] - array[i]; });
        for (j = 0; j < m; ++j) array[j] = halfedges[index[j]];
        for (j = 0; j < m; ++j) halfedges[j] = array[j];
      }
    }
  }

  function clipCells(x0, y0, x1, y1) {
    var nCells = cells.length,
        iCell,
        cell,
        site,
        iHalfedge,
        halfedges,
        nHalfedges,
        start,
        startX,
        startY,
        end,
        endX,
        endY,
        cover = true;

    for (iCell = 0; iCell < nCells; ++iCell) {
      if (cell = cells[iCell]) {
        site = cell.site;
        halfedges = cell.halfedges;
        iHalfedge = halfedges.length;

        // Remove any dangling clipped edges.
        while (iHalfedge--) {
          if (!edges[halfedges[iHalfedge]]) {
            halfedges.splice(iHalfedge, 1);
          }
        }

        // Insert any border edges as necessary.
        iHalfedge = 0, nHalfedges = halfedges.length;
        while (iHalfedge < nHalfedges) {
          end = cellHalfedgeEnd(cell, edges[halfedges[iHalfedge]]), endX = end[0], endY = end[1];
          start = cellHalfedgeStart(cell, edges[halfedges[++iHalfedge % nHalfedges]]), startX = start[0], startY = start[1];
          if (Math.abs(endX - startX) > epsilon || Math.abs(endY - startY) > epsilon) {
            halfedges.splice(iHalfedge, 0, edges.push(createBorderEdge(site, end,
                Math.abs(endX - x0) < epsilon && y1 - endY > epsilon ? [x0, Math.abs(startX - x0) < epsilon ? startY : y1]
                : Math.abs(endY - y1) < epsilon && x1 - endX > epsilon ? [Math.abs(startY - y1) < epsilon ? startX : x1, y1]
                : Math.abs(endX - x1) < epsilon && endY - y0 > epsilon ? [x1, Math.abs(startX - x1) < epsilon ? startY : y0]
                : Math.abs(endY - y0) < epsilon && endX - x0 > epsilon ? [Math.abs(startY - y0) < epsilon ? startX : x0, y0]
                : null)) - 1);
            ++nHalfedges;
          }
        }

        if (nHalfedges) cover = false;
      }
    }

    // If there weren’t any edges, have the closest site cover the extent.
    // It doesn’t matter which corner of the extent we measure!
    if (cover) {
      var dx, dy, d2, dc = Infinity;

      for (iCell = 0, cover = null; iCell < nCells; ++iCell) {
        if (cell = cells[iCell]) {
          site = cell.site;
          dx = site[0] - x0;
          dy = site[1] - y0;
          d2 = dx * dx + dy * dy;
          if (d2 < dc) dc = d2, cover = cell;
        }
      }

      if (cover) {
        var v00 = [x0, y0], v01 = [x0, y1], v11 = [x1, y1], v10 = [x1, y0];
        cover.halfedges.push(
          edges.push(createBorderEdge(site = cover.site, v00, v01)) - 1,
          edges.push(createBorderEdge(site, v01, v11)) - 1,
          edges.push(createBorderEdge(site, v11, v10)) - 1,
          edges.push(createBorderEdge(site, v10, v00)) - 1
        );
      }
    }

    // Lastly delete any cells with no edges; these were entirely clipped.
    for (iCell = 0; iCell < nCells; ++iCell) {
      if (cell = cells[iCell]) {
        if (!cell.halfedges.length) {
          delete cells[iCell];
        }
      }
    }
  }

  var circlePool = [];

  var firstCircle;

  function Circle() {
    RedBlackNode(this);
    this.x =
    this.y =
    this.arc =
    this.site =
    this.cy = null;
  }

  function attachCircle(arc) {
    var lArc = arc.P,
        rArc = arc.N;

    if (!lArc || !rArc) return;

    var lSite = lArc.site,
        cSite = arc.site,
        rSite = rArc.site;

    if (lSite === rSite) return;

    var bx = cSite[0],
        by = cSite[1],
        ax = lSite[0] - bx,
        ay = lSite[1] - by,
        cx = rSite[0] - bx,
        cy = rSite[1] - by;

    var d = 2 * (ax * cy - ay * cx);
    if (d >= -epsilon2$1) return;

    var ha = ax * ax + ay * ay,
        hc = cx * cx + cy * cy,
        x = (cy * ha - ay * hc) / d,
        y = (ax * hc - cx * ha) / d;

    var circle = circlePool.pop() || new Circle;
    circle.arc = arc;
    circle.site = cSite;
    circle.x = x + bx;
    circle.y = (circle.cy = y + by) + Math.sqrt(x * x + y * y); // y bottom

    arc.circle = circle;

    var before = null,
        node = circles._;

    while (node) {
      if (circle.y < node.y || (circle.y === node.y && circle.x <= node.x)) {
        if (node.L) node = node.L;
        else { before = node.P; break; }
      } else {
        if (node.R) node = node.R;
        else { before = node; break; }
      }
    }

    circles.insert(before, circle);
    if (!before) firstCircle = circle;
  }

  function detachCircle(arc) {
    var circle = arc.circle;
    if (circle) {
      if (!circle.P) firstCircle = circle.N;
      circles.remove(circle);
      circlePool.push(circle);
      RedBlackNode(circle);
      arc.circle = null;
    }
  }

  var beachPool = [];

  function Beach() {
    RedBlackNode(this);
    this.edge =
    this.site =
    this.circle = null;
  }

  function createBeach(site) {
    var beach = beachPool.pop() || new Beach;
    beach.site = site;
    return beach;
  }

  function detachBeach(beach) {
    detachCircle(beach);
    beaches.remove(beach);
    beachPool.push(beach);
    RedBlackNode(beach);
  }

  function removeBeach(beach) {
    var circle = beach.circle,
        x = circle.x,
        y = circle.cy,
        vertex = [x, y],
        previous = beach.P,
        next = beach.N,
        disappearing = [beach];

    detachBeach(beach);

    var lArc = previous;
    while (lArc.circle
        && Math.abs(x - lArc.circle.x) < epsilon
        && Math.abs(y - lArc.circle.cy) < epsilon) {
      previous = lArc.P;
      disappearing.unshift(lArc);
      detachBeach(lArc);
      lArc = previous;
    }

    disappearing.unshift(lArc);
    detachCircle(lArc);

    var rArc = next;
    while (rArc.circle
        && Math.abs(x - rArc.circle.x) < epsilon
        && Math.abs(y - rArc.circle.cy) < epsilon) {
      next = rArc.N;
      disappearing.push(rArc);
      detachBeach(rArc);
      rArc = next;
    }

    disappearing.push(rArc);
    detachCircle(rArc);

    var nArcs = disappearing.length,
        iArc;
    for (iArc = 1; iArc < nArcs; ++iArc) {
      rArc = disappearing[iArc];
      lArc = disappearing[iArc - 1];
      setEdgeEnd(rArc.edge, lArc.site, rArc.site, vertex);
    }

    lArc = disappearing[0];
    rArc = disappearing[nArcs - 1];
    rArc.edge = createEdge(lArc.site, rArc.site, null, vertex);

    attachCircle(lArc);
    attachCircle(rArc);
  }

  function addBeach(site) {
    var x = site[0],
        directrix = site[1],
        lArc,
        rArc,
        dxl,
        dxr,
        node = beaches._;

    while (node) {
      dxl = leftBreakPoint(node, directrix) - x;
      if (dxl > epsilon) node = node.L; else {
        dxr = x - rightBreakPoint(node, directrix);
        if (dxr > epsilon) {
          if (!node.R) {
            lArc = node;
            break;
          }
          node = node.R;
        } else {
          if (dxl > -epsilon) {
            lArc = node.P;
            rArc = node;
          } else if (dxr > -epsilon) {
            lArc = node;
            rArc = node.N;
          } else {
            lArc = rArc = node;
          }
          break;
        }
      }
    }

    createCell(site);
    var newArc = createBeach(site);
    beaches.insert(lArc, newArc);

    if (!lArc && !rArc) return;

    if (lArc === rArc) {
      detachCircle(lArc);
      rArc = createBeach(lArc.site);
      beaches.insert(newArc, rArc);
      newArc.edge = rArc.edge = createEdge(lArc.site, newArc.site);
      attachCircle(lArc);
      attachCircle(rArc);
      return;
    }

    if (!rArc) { // && lArc
      newArc.edge = createEdge(lArc.site, newArc.site);
      return;
    }

    // else lArc !== rArc
    detachCircle(lArc);
    detachCircle(rArc);

    var lSite = lArc.site,
        ax = lSite[0],
        ay = lSite[1],
        bx = site[0] - ax,
        by = site[1] - ay,
        rSite = rArc.site,
        cx = rSite[0] - ax,
        cy = rSite[1] - ay,
        d = 2 * (bx * cy - by * cx),
        hb = bx * bx + by * by,
        hc = cx * cx + cy * cy,
        vertex = [(cy * hb - by * hc) / d + ax, (bx * hc - cx * hb) / d + ay];

    setEdgeEnd(rArc.edge, lSite, rSite, vertex);
    newArc.edge = createEdge(lSite, site, null, vertex);
    rArc.edge = createEdge(site, rSite, null, vertex);
    attachCircle(lArc);
    attachCircle(rArc);
  }

  function leftBreakPoint(arc, directrix) {
    var site = arc.site,
        rfocx = site[0],
        rfocy = site[1],
        pby2 = rfocy - directrix;

    if (!pby2) return rfocx;

    var lArc = arc.P;
    if (!lArc) return -Infinity;

    site = lArc.site;
    var lfocx = site[0],
        lfocy = site[1],
        plby2 = lfocy - directrix;

    if (!plby2) return lfocx;

    var hl = lfocx - rfocx,
        aby2 = 1 / pby2 - 1 / plby2,
        b = hl / plby2;

    if (aby2) return (-b + Math.sqrt(b * b - 2 * aby2 * (hl * hl / (-2 * plby2) - lfocy + plby2 / 2 + rfocy - pby2 / 2))) / aby2 + rfocx;

    return (rfocx + lfocx) / 2;
  }

  function rightBreakPoint(arc, directrix) {
    var rArc = arc.N;
    if (rArc) return leftBreakPoint(rArc, directrix);
    var site = arc.site;
    return site[1] === directrix ? site[0] : Infinity;
  }

  var epsilon = 1e-6;
  var epsilon2$1 = 1e-12;
  var beaches;
  var cells;
  var circles;
  var edges;

  function triangleArea(a, b, c) {
    return (a[0] - c[0]) * (b[1] - a[1]) - (a[0] - b[0]) * (c[1] - a[1]);
  }

  function lexicographic(a, b) {
    return b[1] - a[1]
        || b[0] - a[0];
  }

  function Diagram(sites, extent) {
    var site = sites.sort(lexicographic).pop(),
        x,
        y,
        circle;

    edges = [];
    cells = new Array(sites.length);
    beaches = new RedBlackTree;
    circles = new RedBlackTree;

    while (true) {
      circle = firstCircle;
      if (site && (!circle || site[1] < circle.y || (site[1] === circle.y && site[0] < circle.x))) {
        if (site[0] !== x || site[1] !== y) {
          addBeach(site);
          x = site[0], y = site[1];
        }
        site = sites.pop();
      } else if (circle) {
        removeBeach(circle.arc);
      } else {
        break;
      }
    }

    sortCellHalfedges();

    if (extent) {
      var x0 = +extent[0][0],
          y0 = +extent[0][1],
          x1 = +extent[1][0],
          y1 = +extent[1][1];
      clipEdges(x0, y0, x1, y1);
      clipCells(x0, y0, x1, y1);
    }

    this.edges = edges;
    this.cells = cells;

    beaches =
    circles =
    edges =
    cells = null;
  }

  Diagram.prototype = {
    constructor: Diagram,

    polygons: function() {
      var edges = this.edges;

      return this.cells.map(function(cell) {
        var polygon = cell.halfedges.map(function(i) { return cellHalfedgeStart(cell, edges[i]); });
        polygon.data = cell.site.data;
        return polygon;
      });
    },

    triangles: function() {
      var triangles = [],
          edges = this.edges;

      this.cells.forEach(function(cell, i) {
        var site = cell.site,
            halfedges = cell.halfedges,
            j = -1,
            m = halfedges.length,
            s0,
            e1 = edges[halfedges[m - 1]],
            s1 = e1.left === site ? e1.right : e1.left;

        while (++j < m) {
          s0 = s1;
          e1 = edges[halfedges[j]];
          s1 = e1.left === site ? e1.right : e1.left;
          if (i < s0.index && i < s1.index && triangleArea(site, s0, s1) < 0) {
            triangles.push([site.data, s0.data, s1.data]);
          }
        }
      });

      return triangles;
    },

    links: function() {
      return this.edges.filter(function(edge) {
        return edge.right;
      }).map(function(edge) {
        return {
          source: edge.left.data,
          target: edge.right.data
        };
      });
    }
  }

  function voronoi() {
    var x = x$2,
        y = y$2,
        extent = null;

    function voronoi(data) {
      return new Diagram(data.map(function(d, i) {
        var s = [Math.round(x(d, i, data) / epsilon) * epsilon, Math.round(y(d, i, data) / epsilon) * epsilon];
        s.index = i;
        s.data = d;
        return s;
      }), extent);
    }

    voronoi.polygons = function(data) {
      return voronoi(data).polygons();
    };

    voronoi.links = function(data) {
      return voronoi(data).links();
    };

    voronoi.triangles = function(data) {
      return voronoi(data).triangles();
    };

    voronoi.x = function(_) {
      return arguments.length ? (x = typeof _ === "function" ? _ : constant$5(+_), voronoi) : x;
    };

    voronoi.y = function(_) {
      return arguments.length ? (y = typeof _ === "function" ? _ : constant$5(+_), voronoi) : y;
    };

    voronoi.extent = function(_) {
      return arguments.length ? (extent = _ == null ? null : [[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]], voronoi) : extent && [[extent[0][0], extent[0][1]], [extent[1][0], extent[1][1]]];
    };

    voronoi.size = function(_) {
      return arguments.length ? (extent = _ == null ? null : [[0, 0], [+_[0], +_[1]]], voronoi) : extent && [extent[1][0], extent[1][1]];
    };

    return voronoi;
  }

  function Voronoi(params) {
    Transform.call(this, null, params);
  }

  var prototype$40 = inherits(Voronoi, Transform);

  var PARAMS$1 = ['x', 'y', 'size', 'extent'];

  prototype$40.transform = function(_, pulse) {
    var data = pulse.source,
        diagram, polygons, key, i, n;

    // configure and construct voronoi diagram
    diagram = voronoi();
    for (i=0, n=PARAMS$1.length; i<n; ++i) {
      key = PARAMS$1[i];
      if (key in _) diagram[key](_[key]);
    }
    this.value = (diagram = diagram(data));

    // map polygons to paths
    polygons = diagram.polygons();
    for (i=0, n=data.length; i<n; ++i) {
      data[i].path = polygons[i]
        ? 'M' + polygons[i].join('L') + 'Z'
        : null;
    }

    return pulse.reflow().modifies('path');
  };

  // Adds floating point numbers with twice the normal precision.
  // Reference: J. R. Shewchuk, Adaptive Precision Floating-Point Arithmetic and
  // Fast Robust Geometric Predicates, Discrete & Computational Geometry 18(3)
  // 305–363 (1997).
  // Code adapted from GeographicLib by Charles F. F. Karney,
  // http://geographiclib.sourceforge.net/

  function adder() {
    return new Adder;
  }

  function Adder() {
    this.reset();
  }

  Adder.prototype = {
    constructor: Adder,
    reset: function() {
      this.s = // rounded value
      this.t = 0; // exact error
    },
    add: function(y) {
      add$1(temp, y, this.t);
      add$1(this, temp.s, this.s);
      if (this.s) this.t += temp.t;
      else this.s = temp.t;
    },
    valueOf: function() {
      return this.s;
    }
  };

  var temp = new Adder;

  function add$1(adder, a, b) {
    var x = adder.s = a + b,
        bv = x - a,
        av = x - bv;
    adder.t = (a - av) + (b - bv);
  }

  var epsilon$1 = 1e-6;
  var pi = Math.PI;
  var halfPi = pi / 2;
  var quarterPi = pi / 4;
  var tau = pi * 2;

  var degrees$1 = 180 / pi;
  var radians = pi / 180;

  var abs = Math.abs;
  var atan = Math.atan;
  var atan2 = Math.atan2;
  var cos = Math.cos;
  var ceil = Math.ceil;
  var exp = Math.exp;
  var log$2 = Math.log;
  var pow$1 = Math.pow;
  var sin = Math.sin;
  var sign = Math.sign || function(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; };
  var sqrt$1 = Math.sqrt;
  var tan = Math.tan;

  function acos(x) {
    return x > 1 ? 0 : x < -1 ? pi : Math.acos(x);
  }

  function asin(x) {
    return x > 1 ? halfPi : x < -1 ? -halfPi : Math.asin(x);
  }

  function noop$1() {}

  function streamGeometry(geometry, stream) {
    if (geometry && streamGeometryType.hasOwnProperty(geometry.type)) {
      streamGeometryType[geometry.type](geometry, stream);
    }
  }

  var streamObjectType = {
    Feature: function(feature, stream) {
      streamGeometry(feature.geometry, stream);
    },
    FeatureCollection: function(object, stream) {
      var features = object.features, i = -1, n = features.length;
      while (++i < n) streamGeometry(features[i].geometry, stream);
    }
  };

  var streamGeometryType = {
    Sphere: function(object, stream) {
      stream.sphere();
    },
    Point: function(object, stream) {
      object = object.coordinates;
      stream.point(object[0], object[1], object[2]);
    },
    MultiPoint: function(object, stream) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) object = coordinates[i], stream.point(object[0], object[1], object[2]);
    },
    LineString: function(object, stream) {
      streamLine(object.coordinates, stream, 0);
    },
    MultiLineString: function(object, stream) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) streamLine(coordinates[i], stream, 0);
    },
    Polygon: function(object, stream) {
      streamPolygon(object.coordinates, stream);
    },
    MultiPolygon: function(object, stream) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) streamPolygon(coordinates[i], stream);
    },
    GeometryCollection: function(object, stream) {
      var geometries = object.geometries, i = -1, n = geometries.length;
      while (++i < n) streamGeometry(geometries[i], stream);
    }
  };

  function streamLine(coordinates, stream, closed) {
    var i = -1, n = coordinates.length - closed, coordinate;
    stream.lineStart();
    while (++i < n) coordinate = coordinates[i], stream.point(coordinate[0], coordinate[1], coordinate[2]);
    stream.lineEnd();
  }

  function streamPolygon(coordinates, stream) {
    var i = -1, n = coordinates.length;
    stream.polygonStart();
    while (++i < n) streamLine(coordinates[i], stream, 1);
    stream.polygonEnd();
  }

  function stream$1(object, stream) {
    if (object && streamObjectType.hasOwnProperty(object.type)) {
      streamObjectType[object.type](object, stream);
    } else {
      streamGeometry(object, stream);
    }
  }

  var areaRingSum;

  var areaSum;
  var lambda00;
  var phi00;
  var lambda0;
  var cosPhi0;
  var sinPhi0;
  var areaStream = {
    point: noop$1,
    lineStart: noop$1,
    lineEnd: noop$1,
    polygonStart: function() {
      areaRingSum.reset();
      areaStream.lineStart = areaRingStart;
      areaStream.lineEnd = areaRingEnd;
    },
    polygonEnd: function() {
      var areaRing = +areaRingSum;
      areaSum.add(areaRing < 0 ? tau + areaRing : areaRing);
      this.lineStart = this.lineEnd = this.point = noop$1;
    },
    sphere: function() {
      areaSum.add(tau);
    }
  };

  function areaRingStart() {
    areaStream.point = areaPointFirst;
  }

  function areaRingEnd() {
    areaPoint(lambda00, phi00);
  }

  function areaPointFirst(lambda, phi) {
    areaStream.point = areaPoint;
    lambda00 = lambda, phi00 = phi;
    lambda *= radians, phi *= radians;
    lambda0 = lambda, cosPhi0 = cos(phi = phi / 2 + quarterPi), sinPhi0 = sin(phi);
  }

  function areaPoint(lambda, phi) {
    lambda *= radians, phi *= radians;
    phi = phi / 2 + quarterPi; // half the angular distance from south pole

    // Spherical excess E for a spherical triangle with vertices: south pole,
    // previous point, current point.  Uses a formula derived from Cagnoli’s
    // theorem.  See Todhunter, Spherical Trig. (1871), Sec. 103, Eq. (2).
    var dLambda = lambda - lambda0,
        sdLambda = dLambda >= 0 ? 1 : -1,
        adLambda = sdLambda * dLambda,
        cosPhi = cos(phi),
        sinPhi = sin(phi),
        k = sinPhi0 * sinPhi,
        u = cosPhi0 * cosPhi + k * cos(adLambda),
        v = k * sdLambda * sin(adLambda);
    areaRingSum.add(atan2(v, u));

    // Advance the previous points.
    lambda0 = lambda, cosPhi0 = cosPhi, sinPhi0 = sinPhi;
  }

  function spherical(cartesian) {
    return [atan2(cartesian[1], cartesian[0]), asin(cartesian[2])];
  }

  function cartesian(spherical) {
    var lambda = spherical[0], phi = spherical[1], cosPhi = cos(phi);
    return [cosPhi * cos(lambda), cosPhi * sin(lambda), sin(phi)];
  }

  function cartesianDot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  function cartesianCross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  // TODO return a
  function cartesianAddInPlace(a, b) {
    a[0] += b[0], a[1] += b[1], a[2] += b[2];
  }

  function cartesianScale(vector, k) {
    return [vector[0] * k, vector[1] * k, vector[2] * k];
  }

  // TODO return d
  function cartesianNormalizeInPlace(d) {
    var l = sqrt$1(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
    d[0] /= l, d[1] /= l, d[2] /= l;
  }

var   lambda0$1;
  var phi0;
  var lambda1;
  var phi1;
  var lambda2;
var   lambda00$1;
var   phi00$1;
  var p0;
  var deltaSum;
  var ranges;
var   range$1;
  var boundsStream = {
    point: boundsPoint,
    lineStart: boundsLineStart,
    lineEnd: boundsLineEnd,
    polygonStart: function() {
      boundsStream.point = boundsRingPoint;
      boundsStream.lineStart = boundsRingStart;
      boundsStream.lineEnd = boundsRingEnd;
      deltaSum.reset();
      areaStream.polygonStart();
    },
    polygonEnd: function() {
      areaStream.polygonEnd();
      boundsStream.point = boundsPoint;
      boundsStream.lineStart = boundsLineStart;
      boundsStream.lineEnd = boundsLineEnd;
      if (areaRingSum < 0) lambda0$1 = -(lambda1 = 180), phi0 = -(phi1 = 90);
      else if (deltaSum > epsilon$1) phi1 = 90;
      else if (deltaSum < -epsilon$1) phi0 = -90;
      range$1[0] = lambda0$1, range$1[1] = lambda1;
    }
  };

  function boundsPoint(lambda, phi) {
    ranges.push(range$1 = [lambda0$1 = lambda, lambda1 = lambda]);
    if (phi < phi0) phi0 = phi;
    if (phi > phi1) phi1 = phi;
  }

  function linePoint(lambda, phi) {
    var p = cartesian([lambda * radians, phi * radians]);
    if (p0) {
      var normal = cartesianCross(p0, p),
          equatorial = [normal[1], -normal[0], 0],
          inflection = cartesianCross(equatorial, normal);
      cartesianNormalizeInPlace(inflection);
      inflection = spherical(inflection);
      var delta = lambda - lambda2,
          sign = delta > 0 ? 1 : -1,
          lambdai = inflection[0] * degrees$1 * sign,
          phii,
          antimeridian = abs(delta) > 180;
      if (antimeridian ^ (sign * lambda2 < lambdai && lambdai < sign * lambda)) {
        phii = inflection[1] * degrees$1;
        if (phii > phi1) phi1 = phii;
      } else if (lambdai = (lambdai + 360) % 360 - 180, antimeridian ^ (sign * lambda2 < lambdai && lambdai < sign * lambda)) {
        phii = -inflection[1] * degrees$1;
        if (phii < phi0) phi0 = phii;
      } else {
        if (phi < phi0) phi0 = phi;
        if (phi > phi1) phi1 = phi;
      }
      if (antimeridian) {
        if (lambda < lambda2) {
          if (angle(lambda0$1, lambda) > angle(lambda0$1, lambda1)) lambda1 = lambda;
        } else {
          if (angle(lambda, lambda1) > angle(lambda0$1, lambda1)) lambda0$1 = lambda;
        }
      } else {
        if (lambda1 >= lambda0$1) {
          if (lambda < lambda0$1) lambda0$1 = lambda;
          if (lambda > lambda1) lambda1 = lambda;
        } else {
          if (lambda > lambda2) {
            if (angle(lambda0$1, lambda) > angle(lambda0$1, lambda1)) lambda1 = lambda;
          } else {
            if (angle(lambda, lambda1) > angle(lambda0$1, lambda1)) lambda0$1 = lambda;
          }
        }
      }
    } else {
      boundsPoint(lambda, phi);
    }
    p0 = p, lambda2 = lambda;
  }

  function boundsLineStart() {
    boundsStream.point = linePoint;
  }

  function boundsLineEnd() {
    range$1[0] = lambda0$1, range$1[1] = lambda1;
    boundsStream.point = boundsPoint;
    p0 = null;
  }

  function boundsRingPoint(lambda, phi) {
    if (p0) {
      var delta = lambda - lambda2;
      deltaSum.add(abs(delta) > 180 ? delta + (delta > 0 ? 360 : -360) : delta);
    } else {
      lambda00$1 = lambda, phi00$1 = phi;
    }
    areaStream.point(lambda, phi);
    linePoint(lambda, phi);
  }

  function boundsRingStart() {
    areaStream.lineStart();
  }

  function boundsRingEnd() {
    boundsRingPoint(lambda00$1, phi00$1);
    areaStream.lineEnd();
    if (abs(deltaSum) > epsilon$1) lambda0$1 = -(lambda1 = 180);
    range$1[0] = lambda0$1, range$1[1] = lambda1;
    p0 = null;
  }

  // Finds the left-right distance between two longitudes.
  // This is almost the same as (lambda1 - lambda0 + 360°) % 360°, except that we want
  // the distance between ±180° to be 360°.
  function angle(lambda0, lambda1) {
    return (lambda1 -= lambda0) < 0 ? lambda1 + 360 : lambda1;
  }

  var W0;
  var W1;
  var X0;
  var Y0;
  var Z0;
  var X1;
  var Y1;
  var Z1;
  var X2;
  var Y2;
  var Z2;
var   lambda00$2;
var   phi00$2;
  var x0;
  var y0;
  var z0;
  // previous point

  var centroidStream = {
    sphere: noop$1,
    point: centroidPoint,
    lineStart: centroidLineStart,
    lineEnd: centroidLineEnd,
    polygonStart: function() {
      centroidStream.lineStart = centroidRingStart;
      centroidStream.lineEnd = centroidRingEnd;
    },
    polygonEnd: function() {
      centroidStream.lineStart = centroidLineStart;
      centroidStream.lineEnd = centroidLineEnd;
    }
  };

  // Arithmetic mean of Cartesian vectors.
  function centroidPoint(lambda, phi) {
    lambda *= radians, phi *= radians;
    var cosPhi = cos(phi);
    centroidPointCartesian(cosPhi * cos(lambda), cosPhi * sin(lambda), sin(phi));
  }

  function centroidPointCartesian(x, y, z) {
    ++W0;
    X0 += (x - X0) / W0;
    Y0 += (y - Y0) / W0;
    Z0 += (z - Z0) / W0;
  }

  function centroidLineStart() {
    centroidStream.point = centroidLinePointFirst;
  }

  function centroidLinePointFirst(lambda, phi) {
    lambda *= radians, phi *= radians;
    var cosPhi = cos(phi);
    x0 = cosPhi * cos(lambda);
    y0 = cosPhi * sin(lambda);
    z0 = sin(phi);
    centroidStream.point = centroidLinePoint;
    centroidPointCartesian(x0, y0, z0);
  }

  function centroidLinePoint(lambda, phi) {
    lambda *= radians, phi *= radians;
    var cosPhi = cos(phi),
        x = cosPhi * cos(lambda),
        y = cosPhi * sin(lambda),
        z = sin(phi),
        w = atan2(sqrt$1((w = y0 * z - z0 * y) * w + (w = z0 * x - x0 * z) * w + (w = x0 * y - y0 * x) * w), x0 * x + y0 * y + z0 * z);
    W1 += w;
    X1 += w * (x0 + (x0 = x));
    Y1 += w * (y0 + (y0 = y));
    Z1 += w * (z0 + (z0 = z));
    centroidPointCartesian(x0, y0, z0);
  }

  function centroidLineEnd() {
    centroidStream.point = centroidPoint;
  }

  // See J. E. Brock, The Inertia Tensor for a Spherical Triangle,
  // J. Applied Mechanics 42, 239 (1975).
  function centroidRingStart() {
    centroidStream.point = centroidRingPointFirst;
  }

  function centroidRingEnd() {
    centroidRingPoint(lambda00$2, phi00$2);
    centroidStream.point = centroidPoint;
  }

  function centroidRingPointFirst(lambda, phi) {
    lambda00$2 = lambda, phi00$2 = phi;
    lambda *= radians, phi *= radians;
    centroidStream.point = centroidRingPoint;
    var cosPhi = cos(phi);
    x0 = cosPhi * cos(lambda);
    y0 = cosPhi * sin(lambda);
    z0 = sin(phi);
    centroidPointCartesian(x0, y0, z0);
  }

  function centroidRingPoint(lambda, phi) {
    lambda *= radians, phi *= radians;
    var cosPhi = cos(phi),
        x = cosPhi * cos(lambda),
        y = cosPhi * sin(lambda),
        z = sin(phi),
        cx = y0 * z - z0 * y,
        cy = z0 * x - x0 * z,
        cz = x0 * y - y0 * x,
        m = sqrt$1(cx * cx + cy * cy + cz * cz),
        u = x0 * x + y0 * y + z0 * z,
        v = m && -acos(u) / m, // area weight
        w = atan2(m, u); // line weight
    X2 += v * cx;
    Y2 += v * cy;
    Z2 += v * cz;
    W1 += w;
    X1 += w * (x0 + (x0 = x));
    Y1 += w * (y0 + (y0 = y));
    Z1 += w * (z0 + (z0 = z));
    centroidPointCartesian(x0, y0, z0);
  }

  function compose(a, b) {

    function compose(x, y) {
      return x = a(x, y), b(x[0], x[1]);
    }

    if (a.invert && b.invert) compose.invert = function(x, y) {
      return x = b.invert(x, y), x && a.invert(x[0], x[1]);
    };

    return compose;
  }

  function rotationIdentity(lambda, phi) {
    return [lambda > pi ? lambda - tau : lambda < -pi ? lambda + tau : lambda, phi];
  }

  rotationIdentity.invert = rotationIdentity;

  function rotateRadians(deltaLambda, deltaPhi, deltaGamma) {
    return (deltaLambda %= tau) ? (deltaPhi || deltaGamma ? compose(rotationLambda(deltaLambda), rotationPhiGamma(deltaPhi, deltaGamma))
      : rotationLambda(deltaLambda))
      : (deltaPhi || deltaGamma ? rotationPhiGamma(deltaPhi, deltaGamma)
      : rotationIdentity);
  }

  function forwardRotationLambda(deltaLambda) {
    return function(lambda, phi) {
      return lambda += deltaLambda, [lambda > pi ? lambda - tau : lambda < -pi ? lambda + tau : lambda, phi];
    };
  }

  function rotationLambda(deltaLambda) {
    var rotation = forwardRotationLambda(deltaLambda);
    rotation.invert = forwardRotationLambda(-deltaLambda);
    return rotation;
  }

  function rotationPhiGamma(deltaPhi, deltaGamma) {
    var cosDeltaPhi = cos(deltaPhi),
        sinDeltaPhi = sin(deltaPhi),
        cosDeltaGamma = cos(deltaGamma),
        sinDeltaGamma = sin(deltaGamma);

    function rotation(lambda, phi) {
      var cosPhi = cos(phi),
          x = cos(lambda) * cosPhi,
          y = sin(lambda) * cosPhi,
          z = sin(phi),
          k = z * cosDeltaPhi + x * sinDeltaPhi;
      return [
        atan2(y * cosDeltaGamma - k * sinDeltaGamma, x * cosDeltaPhi - z * sinDeltaPhi),
        asin(k * cosDeltaGamma + y * sinDeltaGamma)
      ];
    }

    rotation.invert = function(lambda, phi) {
      var cosPhi = cos(phi),
          x = cos(lambda) * cosPhi,
          y = sin(lambda) * cosPhi,
          z = sin(phi),
          k = z * cosDeltaGamma - y * sinDeltaGamma;
      return [
        atan2(y * cosDeltaGamma + z * sinDeltaGamma, x * cosDeltaPhi + k * sinDeltaPhi),
        asin(k * cosDeltaPhi - x * sinDeltaPhi)
      ];
    };

    return rotation;
  }

  // Generates a circle centered at [0°, 0°], with a given radius and precision.
  function circleStream(stream, radius, delta, direction, t0, t1) {
    if (!delta) return;
    var cosRadius = cos(radius),
        sinRadius = sin(radius),
        step = direction * delta;
    if (t0 == null) {
      t0 = radius + direction * tau;
      t1 = radius - step / 2;
    } else {
      t0 = circleRadius(cosRadius, t0);
      t1 = circleRadius(cosRadius, t1);
      if (direction > 0 ? t0 < t1 : t0 > t1) t0 += direction * tau;
    }
    for (var point, t = t0; direction > 0 ? t > t1 : t < t1; t -= step) {
      point = spherical([cosRadius, -sinRadius * cos(t), -sinRadius * sin(t)]);
      stream.point(point[0], point[1]);
    }
  }

  // Returns the signed angle of a cartesian point relative to [cosRadius, 0, 0].
  function circleRadius(cosRadius, point) {
    point = cartesian(point), point[0] -= cosRadius;
    cartesianNormalizeInPlace(point);
    var radius = acos(-point[1]);
    return ((-point[2] < 0 ? -radius : radius) + tau - epsilon$1) % tau;
  }

  function clipBuffer() {
    var lines = [],
        line;
    return {
      point: function(x, y) {
        line.push([x, y]);
      },
      lineStart: function() {
        lines.push(line = []);
      },
      lineEnd: noop$1,
      rejoin: function() {
        if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
      },
      result: function() {
        var result = lines;
        lines = [];
        line = null;
        return result;
      }
    };
  }

  function clipLine(a, b, x0, y0, x1, y1) {
    var ax = a[0],
        ay = a[1],
        bx = b[0],
        by = b[1],
        t0 = 0,
        t1 = 1,
        dx = bx - ax,
        dy = by - ay,
        r;

    r = x0 - ax;
    if (!dx && r > 0) return;
    r /= dx;
    if (dx < 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    } else if (dx > 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    }

    r = x1 - ax;
    if (!dx && r < 0) return;
    r /= dx;
    if (dx < 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    } else if (dx > 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    }

    r = y0 - ay;
    if (!dy && r > 0) return;
    r /= dy;
    if (dy < 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    } else if (dy > 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    }

    r = y1 - ay;
    if (!dy && r < 0) return;
    r /= dy;
    if (dy < 0) {
      if (r > t1) return;
      if (r > t0) t0 = r;
    } else if (dy > 0) {
      if (r < t0) return;
      if (r < t1) t1 = r;
    }

    if (t0 > 0) a[0] = ax + t0 * dx, a[1] = ay + t0 * dy;
    if (t1 < 1) b[0] = ax + t1 * dx, b[1] = ay + t1 * dy;
    return true;
  }

  function pointEqual(a, b) {
    return abs(a[0] - b[0]) < epsilon$1 && abs(a[1] - b[1]) < epsilon$1;
  }

  function Intersection(point, points, other, entry) {
    this.x = point;
    this.z = points;
    this.o = other; // another intersection
    this.e = entry; // is an entry?
    this.v = false; // visited
    this.n = this.p = null; // next & previous
  }

  // A generalized polygon clipping algorithm: given a polygon that has been cut
  // into its visible line segments, and rejoins the segments by interpolating
  // along the clip edge.
  function clipPolygon(segments, compareIntersection, startInside, interpolate, stream) {
    var subject = [],
        clip = [],
        i,
        n;

    segments.forEach(function(segment) {
      if ((n = segment.length - 1) <= 0) return;
      var n, p0 = segment[0], p1 = segment[n], x;

      // If the first and last points of a segment are coincident, then treat as a
      // closed ring. TODO if all rings are closed, then the winding order of the
      // exterior ring should be checked.
      if (pointEqual(p0, p1)) {
        stream.lineStart();
        for (i = 0; i < n; ++i) stream.point((p0 = segment[i])[0], p0[1]);
        stream.lineEnd();
        return;
      }

      subject.push(x = new Intersection(p0, segment, null, true));
      clip.push(x.o = new Intersection(p0, null, x, false));
      subject.push(x = new Intersection(p1, segment, null, false));
      clip.push(x.o = new Intersection(p1, null, x, true));
    });

    if (!subject.length) return;

    clip.sort(compareIntersection);
    link(subject);
    link(clip);

    for (i = 0, n = clip.length; i < n; ++i) {
      clip[i].e = startInside = !startInside;
    }

    var start = subject[0],
        points,
        point;

    while (1) {
      // Find first unvisited intersection.
      var current = start,
          isSubject = true;
      while (current.v) if ((current = current.n) === start) return;
      points = current.z;
      stream.lineStart();
      do {
        current.v = current.o.v = true;
        if (current.e) {
          if (isSubject) {
            for (i = 0, n = points.length; i < n; ++i) stream.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.x, current.n.x, 1, stream);
          }
          current = current.n;
        } else {
          if (isSubject) {
            points = current.p.z;
            for (i = points.length - 1; i >= 0; --i) stream.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.x, current.p.x, -1, stream);
          }
          current = current.p;
        }
        current = current.o;
        points = current.z;
        isSubject = !isSubject;
      } while (!current.v);
      stream.lineEnd();
    }
  }

  function link(array) {
    if (!(n = array.length)) return;
    var n,
        i = 0,
        a = array[0],
        b;
    while (++i < n) {
      a.n = b = array[i];
      b.p = a;
      a = b;
    }
    a.n = b = array[0];
    b.p = a;
  }

  var clipMax = 1e9;
  var clipMin = -clipMax;
  // TODO Use d3-polygon’s polygonContains here for the ring check?
  // TODO Eliminate duplicate buffering in clipBuffer and polygon.push?

  function clipExtent(x0, y0, x1, y1) {

    function visible(x, y) {
      return x0 <= x && x <= x1 && y0 <= y && y <= y1;
    }

    function interpolate(from, to, direction, stream) {
      var a = 0, a1 = 0;
      if (from == null
          || (a = corner(from, direction)) !== (a1 = corner(to, direction))
          || comparePoint(from, to) < 0 ^ direction > 0) {
        do stream.point(a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0);
        while ((a = (a + direction + 4) % 4) !== a1);
      } else {
        stream.point(to[0], to[1]);
      }
    }

    function corner(p, direction) {
      return abs(p[0] - x0) < epsilon$1 ? direction > 0 ? 0 : 3
          : abs(p[0] - x1) < epsilon$1 ? direction > 0 ? 2 : 1
          : abs(p[1] - y0) < epsilon$1 ? direction > 0 ? 1 : 0
          : direction > 0 ? 3 : 2; // abs(p[1] - y1) < epsilon
    }

    function compareIntersection(a, b) {
      return comparePoint(a.x, b.x);
    }

    function comparePoint(a, b) {
      var ca = corner(a, 1),
          cb = corner(b, 1);
      return ca !== cb ? ca - cb
          : ca === 0 ? b[1] - a[1]
          : ca === 1 ? a[0] - b[0]
          : ca === 2 ? a[1] - b[1]
          : b[0] - a[0];
    }

    return function(stream) {
      var activeStream = stream,
          bufferStream = clipBuffer(),
          segments,
          polygon,
          ring,
          x__, y__, v__, // first point
          x_, y_, v_, // previous point
          first,
          clean;

      var clipStream = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: polygonStart,
        polygonEnd: polygonEnd
      };

      function point(x, y) {
        if (visible(x, y)) activeStream.point(x, y);
      }

      function polygonInside() {
        var winding = 0;

        for (var i = 0, n = polygon.length; i < n; ++i) {
          for (var ring = polygon[i], j = 1, m = ring.length, point = ring[0], a0, a1, b0 = point[0], b1 = point[1]; j < m; ++j) {
            a0 = b0, a1 = b1, point = ring[j], b0 = point[0], b1 = point[1];
            if (a1 <= y1) { if (b1 > y1 && (b0 - a0) * (y1 - a1) > (b1 - a1) * (x0 - a0)) ++winding; }
            else { if (b1 <= y1 && (b0 - a0) * (y1 - a1) < (b1 - a1) * (x0 - a0)) --winding; }
          }
        }

        return winding;
      }

      // Buffer geometry within a polygon and then clip it en masse.
      function polygonStart() {
        activeStream = bufferStream, segments = [], polygon = [], clean = true;
      }

      function polygonEnd() {
        var startInside = polygonInside(),
            cleanInside = clean && startInside,
            visible = (segments = merge(segments)).length;
        if (cleanInside || visible) {
          stream.polygonStart();
          if (cleanInside) {
            stream.lineStart();
            interpolate(null, null, 1, stream);
            stream.lineEnd();
          }
          if (visible) {
            clipPolygon(segments, compareIntersection, startInside, interpolate, stream);
          }
          stream.polygonEnd();
        }
        activeStream = stream, segments = polygon = ring = null;
      }

      function lineStart() {
        clipStream.point = linePoint;
        if (polygon) polygon.push(ring = []);
        first = true;
        v_ = false;
        x_ = y_ = NaN;
      }

      // TODO rather than special-case polygons, simply handle them separately.
      // Ideally, coincident intersection points should be jittered to avoid
      // clipping issues.
      function lineEnd() {
        if (segments) {
          linePoint(x__, y__);
          if (v__ && v_) bufferStream.rejoin();
          segments.push(bufferStream.result());
        }
        clipStream.point = point;
        if (v_) activeStream.lineEnd();
      }

      function linePoint(x, y) {
        var v = visible(x, y);
        if (polygon) ring.push([x, y]);
        if (first) {
          x__ = x, y__ = y, v__ = v;
          first = false;
          if (v) {
            activeStream.lineStart();
            activeStream.point(x, y);
          }
        } else {
          if (v && v_) activeStream.point(x, y);
          else {
            var a = [x_ = Math.max(clipMin, Math.min(clipMax, x_)), y_ = Math.max(clipMin, Math.min(clipMax, y_))],
                b = [x = Math.max(clipMin, Math.min(clipMax, x)), y = Math.max(clipMin, Math.min(clipMax, y))];
            if (clipLine(a, b, x0, y0, x1, y1)) {
              if (!v_) {
                activeStream.lineStart();
                activeStream.point(a[0], a[1]);
              }
              activeStream.point(b[0], b[1]);
              if (!v) activeStream.lineEnd();
              clean = false;
            } else if (v) {
              activeStream.lineStart();
              activeStream.point(x, y);
              clean = false;
            }
          }
        }
        x_ = x, y_ = y, v_ = v;
      }

      return clipStream;
    };
  }

  var lengthSum;
var   lambda0$2;
var   sinPhi0$1;
var   cosPhi0$1;
  var lengthStream = {
    sphere: noop$1,
    point: noop$1,
    lineStart: lengthLineStart,
    lineEnd: noop$1,
    polygonStart: noop$1,
    polygonEnd: noop$1
  };

  function lengthLineStart() {
    lengthStream.point = lengthPointFirst;
    lengthStream.lineEnd = lengthLineEnd;
  }

  function lengthLineEnd() {
    lengthStream.point = lengthStream.lineEnd = noop$1;
  }

  function lengthPointFirst(lambda, phi) {
    lambda *= radians, phi *= radians;
    lambda0$2 = lambda, sinPhi0$1 = sin(phi), cosPhi0$1 = cos(phi);
    lengthStream.point = lengthPoint;
  }

  function lengthPoint(lambda, phi) {
    lambda *= radians, phi *= radians;
    var sinPhi = sin(phi),
        cosPhi = cos(phi),
        delta = abs(lambda - lambda0$2),
        cosDelta = cos(delta),
        sinDelta = sin(delta),
        x = cosPhi * sinDelta,
        y = cosPhi0$1 * sinPhi - sinPhi0$1 * cosPhi * cosDelta,
        z = sinPhi0$1 * sinPhi + cosPhi0$1 * cosPhi * cosDelta;
    lengthSum.add(atan2(sqrt$1(x * x + y * y), z));
    lambda0$2 = lambda, sinPhi0$1 = sinPhi, cosPhi0$1 = cosPhi;
  }

  function graticuleX(y0, y1, dy) {
    var y = range(y0, y1 - epsilon$1, dy).concat(y1);
    return function(x) { return y.map(function(y) { return [x, y]; }); };
  }

  function graticuleY(x0, x1, dx) {
    var x = range(x0, x1 - epsilon$1, dx).concat(x1);
    return function(y) { return x.map(function(x) { return [x, y]; }); };
  }

  function geoGraticule() {
    var x1, x0, X1, X0,
        y1, y0, Y1, Y0,
        dx = 10, dy = dx, DX = 90, DY = 360,
        x, y, X, Y,
        precision = 2.5;

    function graticule() {
      return {type: "MultiLineString", coordinates: lines()};
    }

    function lines() {
      return range(ceil(X0 / DX) * DX, X1, DX).map(X)
          .concat(range(ceil(Y0 / DY) * DY, Y1, DY).map(Y))
          .concat(range(ceil(x0 / dx) * dx, x1, dx).filter(function(x) { return abs(x % DX) > epsilon$1; }).map(x))
          .concat(range(ceil(y0 / dy) * dy, y1, dy).filter(function(y) { return abs(y % DY) > epsilon$1; }).map(y));
    }

    graticule.lines = function() {
      return lines().map(function(coordinates) { return {type: "LineString", coordinates: coordinates}; });
    };

    graticule.outline = function() {
      return {
        type: "Polygon",
        coordinates: [
          X(X0).concat(
          Y(Y1).slice(1),
          X(X1).reverse().slice(1),
          Y(Y0).reverse().slice(1))
        ]
      };
    };

    graticule.extent = function(_) {
      if (!arguments.length) return graticule.extentMinor();
      return graticule.extentMajor(_).extentMinor(_);
    };

    graticule.extentMajor = function(_) {
      if (!arguments.length) return [[X0, Y0], [X1, Y1]];
      X0 = +_[0][0], X1 = +_[1][0];
      Y0 = +_[0][1], Y1 = +_[1][1];
      if (X0 > X1) _ = X0, X0 = X1, X1 = _;
      if (Y0 > Y1) _ = Y0, Y0 = Y1, Y1 = _;
      return graticule.precision(precision);
    };

    graticule.extentMinor = function(_) {
      if (!arguments.length) return [[x0, y0], [x1, y1]];
      x0 = +_[0][0], x1 = +_[1][0];
      y0 = +_[0][1], y1 = +_[1][1];
      if (x0 > x1) _ = x0, x0 = x1, x1 = _;
      if (y0 > y1) _ = y0, y0 = y1, y1 = _;
      return graticule.precision(precision);
    };

    graticule.step = function(_) {
      if (!arguments.length) return graticule.stepMinor();
      return graticule.stepMajor(_).stepMinor(_);
    };

    graticule.stepMajor = function(_) {
      if (!arguments.length) return [DX, DY];
      DX = +_[0], DY = +_[1];
      return graticule;
    };

    graticule.stepMinor = function(_) {
      if (!arguments.length) return [dx, dy];
      dx = +_[0], dy = +_[1];
      return graticule;
    };

    graticule.precision = function(_) {
      if (!arguments.length) return precision;
      precision = +_;
      x = graticuleX(y0, y1, 90);
      y = graticuleY(x0, x1, precision);
      X = graticuleX(Y0, Y1, 90);
      Y = graticuleY(X0, X1, precision);
      return graticule;
    };

    return graticule
        .extentMajor([[-180, -90 + epsilon$1], [180, 90 - epsilon$1]])
        .extentMinor([[-180, -80 - epsilon$1], [180, 80 + epsilon$1]]);
  }

  function identity$5(x) {
    return x;
  }

var   areaSum$1 = adder();
var   areaRingSum$1 = adder();
  var x00;
  var y00;
var   x0$1;
var   y0$1;
  var areaStream$1 = {
    point: noop$1,
    lineStart: noop$1,
    lineEnd: noop$1,
    polygonStart: function() {
      areaStream$1.lineStart = areaRingStart$1;
      areaStream$1.lineEnd = areaRingEnd$1;
    },
    polygonEnd: function() {
      areaStream$1.lineStart = areaStream$1.lineEnd = areaStream$1.point = noop$1;
      areaSum$1.add(abs(areaRingSum$1));
      areaRingSum$1.reset();
    },
    result: function() {
      var area = areaSum$1 / 2;
      areaSum$1.reset();
      return area;
    }
  };

  function areaRingStart$1() {
    areaStream$1.point = areaPointFirst$1;
  }

  function areaPointFirst$1(x, y) {
    areaStream$1.point = areaPoint$1;
    x00 = x0$1 = x, y00 = y0$1 = y;
  }

  function areaPoint$1(x, y) {
    areaRingSum$1.add(y0$1 * x - x0$1 * y);
    x0$1 = x, y0$1 = y;
  }

  function areaRingEnd$1() {
    areaPoint$1(x00, y00);
  }

var   x0$2 = Infinity;
var   y0$2 = x0$2;
  var x1 = -x0$2;
  var y1 = x1;
  var boundsStream$1 = {
    point: boundsPoint$1,
    lineStart: noop$1,
    lineEnd: noop$1,
    polygonStart: noop$1,
    polygonEnd: noop$1,
    result: function() {
      var bounds = [[x0$2, y0$2], [x1, y1]];
      x1 = y1 = -(y0$2 = x0$2 = Infinity);
      return bounds;
    }
  };

  function boundsPoint$1(x, y) {
    if (x < x0$2) x0$2 = x;
    if (x > x1) x1 = x;
    if (y < y0$2) y0$2 = y;
    if (y > y1) y1 = y;
  }

var   X0$1 = 0;
var   Y0$1 = 0;
var   Z0$1 = 0;
var   X1$1 = 0;
var   Y1$1 = 0;
var   Z1$1 = 0;
var   X2$1 = 0;
var   Y2$1 = 0;
var   Z2$1 = 0;
var   x00$1;
var   y00$1;
var   x0$3;
var   y0$3;
  var centroidStream$1 = {
    point: centroidPoint$1,
    lineStart: centroidLineStart$1,
    lineEnd: centroidLineEnd$1,
    polygonStart: function() {
      centroidStream$1.lineStart = centroidRingStart$1;
      centroidStream$1.lineEnd = centroidRingEnd$1;
    },
    polygonEnd: function() {
      centroidStream$1.point = centroidPoint$1;
      centroidStream$1.lineStart = centroidLineStart$1;
      centroidStream$1.lineEnd = centroidLineEnd$1;
    },
    result: function() {
      var centroid = Z2$1 ? [X2$1 / Z2$1, Y2$1 / Z2$1]
          : Z1$1 ? [X1$1 / Z1$1, Y1$1 / Z1$1]
          : Z0$1 ? [X0$1 / Z0$1, Y0$1 / Z0$1]
          : [NaN, NaN];
      X0$1 = Y0$1 = Z0$1 =
      X1$1 = Y1$1 = Z1$1 =
      X2$1 = Y2$1 = Z2$1 = 0;
      return centroid;
    }
  };

  function centroidPoint$1(x, y) {
    X0$1 += x;
    Y0$1 += y;
    ++Z0$1;
  }

  function centroidLineStart$1() {
    centroidStream$1.point = centroidPointFirstLine;
  }

  function centroidPointFirstLine(x, y) {
    centroidStream$1.point = centroidPointLine;
    centroidPoint$1(x0$3 = x, y0$3 = y);
  }

  function centroidPointLine(x, y) {
    var dx = x - x0$3, dy = y - y0$3, z = sqrt$1(dx * dx + dy * dy);
    X1$1 += z * (x0$3 + x) / 2;
    Y1$1 += z * (y0$3 + y) / 2;
    Z1$1 += z;
    centroidPoint$1(x0$3 = x, y0$3 = y);
  }

  function centroidLineEnd$1() {
    centroidStream$1.point = centroidPoint$1;
  }

  function centroidRingStart$1() {
    centroidStream$1.point = centroidPointFirstRing;
  }

  function centroidRingEnd$1() {
    centroidPointRing(x00$1, y00$1);
  }

  function centroidPointFirstRing(x, y) {
    centroidStream$1.point = centroidPointRing;
    centroidPoint$1(x00$1 = x0$3 = x, y00$1 = y0$3 = y);
  }

  function centroidPointRing(x, y) {
    var dx = x - x0$3,
        dy = y - y0$3,
        z = sqrt$1(dx * dx + dy * dy);

    X1$1 += z * (x0$3 + x) / 2;
    Y1$1 += z * (y0$3 + y) / 2;
    Z1$1 += z;

    z = y0$3 * x - x0$3 * y;
    X2$1 += z * (x0$3 + x);
    Y2$1 += z * (y0$3 + y);
    Z2$1 += z * 3;
    centroidPoint$1(x0$3 = x, y0$3 = y);
  }

  function PathContext(context) {
    var pointRadius = 4.5;

    var stream = {
      point: point,

      // While inside a line, override point to moveTo then lineTo.
      lineStart: function() { stream.point = pointLineStart; },
      lineEnd: lineEnd,

      // While inside a polygon, override lineEnd to closePath.
      polygonStart: function() { stream.lineEnd = lineEndPolygon; },
      polygonEnd: function() { stream.lineEnd = lineEnd; stream.point = point; },

      pointRadius: function(_) {
        pointRadius = _;
        return stream;
      },

      result: noop$1
    };

    function point(x, y) {
      context.moveTo(x + pointRadius, y);
      context.arc(x, y, pointRadius, 0, tau);
    }

    function pointLineStart(x, y) {
      context.moveTo(x, y);
      stream.point = pointLine;
    }

    function pointLine(x, y) {
      context.lineTo(x, y);
    }

    function lineEnd() {
      stream.point = point;
    }

    function lineEndPolygon() {
      context.closePath();
    }

    return stream;
  }

  function PathString() {
    var pointCircle = circle$1(4.5),
        string = [];

    var stream = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: function() {
        stream.lineEnd = lineEndPolygon;
      },
      polygonEnd: function() {
        stream.lineEnd = lineEnd;
        stream.point = point;
      },
      pointRadius: function(_) {
        pointCircle = circle$1(_);
        return stream;
      },
      result: function() {
        if (string.length) {
          var result = string.join("");
          string = [];
          return result;
        }
      }
    };

    function point(x, y) {
      string.push("M", x, ",", y, pointCircle);
    }

    function pointLineStart(x, y) {
      string.push("M", x, ",", y);
      stream.point = pointLine;
    }

    function pointLine(x, y) {
      string.push("L", x, ",", y);
    }

    function lineStart() {
      stream.point = pointLineStart;
    }

    function lineEnd() {
      stream.point = point;
    }

    function lineEndPolygon() {
      string.push("Z");
    }

    return stream;
  }

  function circle$1(radius) {
    return "m0," + radius
        + "a" + radius + "," + radius + " 0 1,1 0," + -2 * radius
        + "a" + radius + "," + radius + " 0 1,1 0," + 2 * radius
        + "z";
  }

  function geoPath() {
    var pointRadius = 4.5,
        projection,
        projectionStream,
        context,
        contextStream;

    function path(object) {
      if (object) {
        if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
        stream$1(object, projectionStream(contextStream));
      }
      return contextStream.result();
    }

    path.area = function(object) {
      stream$1(object, projectionStream(areaStream$1));
      return areaStream$1.result();
    };

    path.bounds = function(object) {
      stream$1(object, projectionStream(boundsStream$1));
      return boundsStream$1.result();
    };

    path.centroid = function(object) {
      stream$1(object, projectionStream(centroidStream$1));
      return centroidStream$1.result();
    };

    path.projection = function(_) {
      return arguments.length ? (projectionStream = (projection = _) == null ? identity$5 : _.stream, path) : projection;
    };

    path.context = function(_) {
      if (!arguments.length) return context;
      contextStream = (context = _) == null ? new PathString : new PathContext(_);
      if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
      return path;
    };

    path.pointRadius = function(_) {
      if (!arguments.length) return pointRadius;
      pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
      return path;
    };

    return path.projection(null).context(null);
  }

  var sum$1 = adder();

  function polygonContains(polygon, point) {
    var lambda = point[0],
        phi = point[1],
        normal = [sin(lambda), -cos(lambda), 0],
        angle = 0,
        winding = 0;

    for (var i = 0, n = polygon.length; i < n; ++i) {
      if (!(m = (ring = polygon[i]).length)) continue;
      var ring,
          m,
          point0 = ring[m - 1],
          lambda0 = point0[0],
          phi0 = point0[1] / 2 + quarterPi,
          sinPhi0 = sin(phi0),
          cosPhi0 = cos(phi0);

      for (var j = 0; j < m; ++j, lambda0 = lambda1, sinPhi0 = sinPhi1, cosPhi0 = cosPhi1, point0 = point1) {
        var point1 = ring[j],
            lambda1 = point1[0],
            phi1 = point1[1] / 2 + quarterPi,
            sinPhi1 = sin(phi1),
            cosPhi1 = cos(phi1),
            delta = lambda1 - lambda0,
            sign = delta >= 0 ? 1 : -1,
            absDelta = sign * delta,
            antimeridian = absDelta > pi,
            k = sinPhi0 * sinPhi1;

        sum$1.add(atan2(k * sign * sin(absDelta), cosPhi0 * cosPhi1 + k * cos(absDelta)));
        angle += antimeridian ? delta + sign * tau : delta;

        // Are the longitudes either side of the point’s meridian (lambda),
        // and are the latitudes smaller than the parallel (phi)?
        if (antimeridian ^ lambda0 >= lambda ^ lambda1 >= lambda) {
          var arc = cartesianCross(cartesian(point0), cartesian(point1));
          cartesianNormalizeInPlace(arc);
          var intersection = cartesianCross(normal, arc);
          cartesianNormalizeInPlace(intersection);
          var phiArc = (antimeridian ^ delta >= 0 ? -1 : 1) * asin(intersection[2]);
          if (phi > phiArc || phi === phiArc && (arc[0] || arc[1])) {
            winding += antimeridian ^ delta >= 0 ? 1 : -1;
          }
        }
      }
    }

    // First, determine whether the South pole is inside or outside:
    //
    // It is inside if:
    // * the polygon winds around it in a clockwise direction.
    // * the polygon does not (cumulatively) wind around it, but has a negative
    //   (counter-clockwise) area.
    //
    // Second, count the (signed) number of times a segment crosses a lambda
    // from the point to the South pole.  If it is zero, then the point is the
    // same side as the South pole.

    var contains = (angle < -epsilon$1 || angle < epsilon$1 && sum$1 < -epsilon$1) ^ (winding & 1);
    sum$1.reset();
    return contains;
  }

  function clip(pointVisible, clipLine, interpolate, start) {
    return function(rotate, sink) {
      var line = clipLine(sink),
          rotatedStart = rotate.invert(start[0], start[1]),
          ringBuffer = clipBuffer(),
          ringSink = clipLine(ringBuffer),
          polygonStarted = false,
          polygon,
          segments,
          ring;

      var clip = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          clip.point = pointRing;
          clip.lineStart = ringStart;
          clip.lineEnd = ringEnd;
          segments = [];
          polygon = [];
        },
        polygonEnd: function() {
          clip.point = point;
          clip.lineStart = lineStart;
          clip.lineEnd = lineEnd;
          segments = merge(segments);
          var startInside = polygonContains(polygon, rotatedStart);
          if (segments.length) {
            if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
            clipPolygon(segments, compareIntersection, startInside, interpolate, sink);
          } else if (startInside) {
            if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
            sink.lineStart();
            interpolate(null, null, 1, sink);
            sink.lineEnd();
          }
          if (polygonStarted) sink.polygonEnd(), polygonStarted = false;
          segments = polygon = null;
        },
        sphere: function() {
          sink.polygonStart();
          sink.lineStart();
          interpolate(null, null, 1, sink);
          sink.lineEnd();
          sink.polygonEnd();
        }
      };

      function point(lambda, phi) {
        var point = rotate(lambda, phi);
        if (pointVisible(lambda = point[0], phi = point[1])) sink.point(lambda, phi);
      }

      function pointLine(lambda, phi) {
        var point = rotate(lambda, phi);
        line.point(point[0], point[1]);
      }

      function lineStart() {
        clip.point = pointLine;
        line.lineStart();
      }

      function lineEnd() {
        clip.point = point;
        line.lineEnd();
      }

      function pointRing(lambda, phi) {
        ring.push([lambda, phi]);
        var point = rotate(lambda, phi);
        ringSink.point(point[0], point[1]);
      }

      function ringStart() {
        ringSink.lineStart();
        ring = [];
      }

      function ringEnd() {
        pointRing(ring[0][0], ring[0][1]);
        ringSink.lineEnd();

        var clean = ringSink.clean(),
            ringSegments = ringBuffer.result(),
            i, n = ringSegments.length, m,
            segment,
            point;

        ring.pop();
        polygon.push(ring);
        ring = null;

        if (!n) return;

        // No intersections.
        if (clean & 1) {
          segment = ringSegments[0];
          if ((m = segment.length - 1) > 0) {
            if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
            sink.lineStart();
            for (i = 0; i < m; ++i) sink.point((point = segment[i])[0], point[1]);
            sink.lineEnd();
          }
          return;
        }

        // Rejoin connected segments.
        // TODO reuse ringBuffer.rejoin()?
        if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));

        segments.push(ringSegments.filter(validSegment));
      }

      return clip;
    };
  }

  function validSegment(segment) {
    return segment.length > 1;
  }

  // Intersections are sorted along the clip edge. For both antimeridian cutting
  // and circle clipping, the same comparison is used.
  function compareIntersection(a, b) {
    return ((a = a.x)[0] < 0 ? a[1] - halfPi - epsilon$1 : halfPi - a[1])
         - ((b = b.x)[0] < 0 ? b[1] - halfPi - epsilon$1 : halfPi - b[1]);
  }

  var clipAntimeridian = clip(
    function() { return true; },
    clipAntimeridianLine,
    clipAntimeridianInterpolate,
    [-pi, -halfPi]
  );

  // Takes a line and cuts into visible segments. Return values: 0 - there were
  // intersections or the line was empty; 1 - no intersections; 2 - there were
  // intersections, and the first and last segments should be rejoined.
  function clipAntimeridianLine(stream) {
    var lambda0 = NaN,
        phi0 = NaN,
        sign0 = NaN,
        clean; // no intersections

    return {
      lineStart: function() {
        stream.lineStart();
        clean = 1;
      },
      point: function(lambda1, phi1) {
        var sign1 = lambda1 > 0 ? pi : -pi,
            delta = abs(lambda1 - lambda0);
        if (abs(delta - pi) < epsilon$1) { // line crosses a pole
          stream.point(lambda0, phi0 = (phi0 + phi1) / 2 > 0 ? halfPi : -halfPi);
          stream.point(sign0, phi0);
          stream.lineEnd();
          stream.lineStart();
          stream.point(sign1, phi0);
          stream.point(lambda1, phi0);
          clean = 0;
        } else if (sign0 !== sign1 && delta >= pi) { // line crosses antimeridian
          if (abs(lambda0 - sign0) < epsilon$1) lambda0 -= sign0 * epsilon$1; // handle degeneracies
          if (abs(lambda1 - sign1) < epsilon$1) lambda1 -= sign1 * epsilon$1;
          phi0 = clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1);
          stream.point(sign0, phi0);
          stream.lineEnd();
          stream.lineStart();
          stream.point(sign1, phi0);
          clean = 0;
        }
        stream.point(lambda0 = lambda1, phi0 = phi1);
        sign0 = sign1;
      },
      lineEnd: function() {
        stream.lineEnd();
        lambda0 = phi0 = NaN;
      },
      clean: function() {
        return 2 - clean; // if intersections, rejoin first and last segments
      }
    };
  }

  function clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1) {
    var cosPhi0,
        cosPhi1,
        sinLambda0Lambda1 = sin(lambda0 - lambda1);
    return abs(sinLambda0Lambda1) > epsilon$1
        ? atan((sin(phi0) * (cosPhi1 = cos(phi1)) * sin(lambda1)
            - sin(phi1) * (cosPhi0 = cos(phi0)) * sin(lambda0))
            / (cosPhi0 * cosPhi1 * sinLambda0Lambda1))
        : (phi0 + phi1) / 2;
  }

  function clipAntimeridianInterpolate(from, to, direction, stream) {
    var phi;
    if (from == null) {
      phi = direction * halfPi;
      stream.point(-pi, phi);
      stream.point(0, phi);
      stream.point(pi, phi);
      stream.point(pi, 0);
      stream.point(pi, -phi);
      stream.point(0, -phi);
      stream.point(-pi, -phi);
      stream.point(-pi, 0);
      stream.point(-pi, phi);
    } else if (abs(from[0] - to[0]) > epsilon$1) {
      var lambda = from[0] < to[0] ? pi : -pi;
      phi = direction * lambda / 2;
      stream.point(-lambda, phi);
      stream.point(0, phi);
      stream.point(lambda, phi);
    } else {
      stream.point(to[0], to[1]);
    }
  }

  function clipCircle(radius, delta) {
    var cr = cos(radius),
        smallRadius = cr > 0,
        notHemisphere = abs(cr) > epsilon$1; // TODO optimise for this common case

    function interpolate(from, to, direction, stream) {
      circleStream(stream, radius, delta, direction, from, to);
    }

    function visible(lambda, phi) {
      return cos(lambda) * cos(phi) > cr;
    }

    // Takes a line and cuts into visible segments. Return values used for polygon
    // clipping: 0 - there were intersections or the line was empty; 1 - no
    // intersections 2 - there were intersections, and the first and last segments
    // should be rejoined.
    function clipLine(stream) {
      var point0, // previous point
          c0, // code for previous point
          v0, // visibility of previous point
          v00, // visibility of first point
          clean; // no intersections
      return {
        lineStart: function() {
          v00 = v0 = false;
          clean = 1;
        },
        point: function(lambda, phi) {
          var point1 = [lambda, phi],
              point2,
              v = visible(lambda, phi),
              c = smallRadius
                ? v ? 0 : code(lambda, phi)
                : v ? code(lambda + (lambda < 0 ? pi : -pi), phi) : 0;
          if (!point0 && (v00 = v0 = v)) stream.lineStart();
          // Handle degeneracies.
          // TODO ignore if not clipping polygons.
          if (v !== v0) {
            point2 = intersect(point0, point1);
            if (pointEqual(point0, point2) || pointEqual(point1, point2)) {
              point1[0] += epsilon$1;
              point1[1] += epsilon$1;
              v = visible(point1[0], point1[1]);
            }
          }
          if (v !== v0) {
            clean = 0;
            if (v) {
              // outside going in
              stream.lineStart();
              point2 = intersect(point1, point0);
              stream.point(point2[0], point2[1]);
            } else {
              // inside going out
              point2 = intersect(point0, point1);
              stream.point(point2[0], point2[1]);
              stream.lineEnd();
            }
            point0 = point2;
          } else if (notHemisphere && point0 && smallRadius ^ v) {
            var t;
            // If the codes for two points are different, or are both zero,
            // and there this segment intersects with the small circle.
            if (!(c & c0) && (t = intersect(point1, point0, true))) {
              clean = 0;
              if (smallRadius) {
                stream.lineStart();
                stream.point(t[0][0], t[0][1]);
                stream.point(t[1][0], t[1][1]);
                stream.lineEnd();
              } else {
                stream.point(t[1][0], t[1][1]);
                stream.lineEnd();
                stream.lineStart();
                stream.point(t[0][0], t[0][1]);
              }
            }
          }
          if (v && (!point0 || !pointEqual(point0, point1))) {
            stream.point(point1[0], point1[1]);
          }
          point0 = point1, v0 = v, c0 = c;
        },
        lineEnd: function() {
          if (v0) stream.lineEnd();
          point0 = null;
        },
        // Rejoin first and last segments if there were intersections and the first
        // and last points were visible.
        clean: function() {
          return clean | ((v00 && v0) << 1);
        }
      };
    }

    // Intersects the great circle between a and b with the clip circle.
    function intersect(a, b, two) {
      var pa = cartesian(a),
          pb = cartesian(b);

      // We have two planes, n1.p = d1 and n2.p = d2.
      // Find intersection line p(t) = c1 n1 + c2 n2 + t (n1 ⨯ n2).
      var n1 = [1, 0, 0], // normal
          n2 = cartesianCross(pa, pb),
          n2n2 = cartesianDot(n2, n2),
          n1n2 = n2[0], // cartesianDot(n1, n2),
          determinant = n2n2 - n1n2 * n1n2;

      // Two polar points.
      if (!determinant) return !two && a;

      var c1 =  cr * n2n2 / determinant,
          c2 = -cr * n1n2 / determinant,
          n1xn2 = cartesianCross(n1, n2),
          A = cartesianScale(n1, c1),
          B = cartesianScale(n2, c2);
      cartesianAddInPlace(A, B);

      // Solve |p(t)|^2 = 1.
      var u = n1xn2,
          w = cartesianDot(A, u),
          uu = cartesianDot(u, u),
          t2 = w * w - uu * (cartesianDot(A, A) - 1);

      if (t2 < 0) return;

      var t = sqrt$1(t2),
          q = cartesianScale(u, (-w - t) / uu);
      cartesianAddInPlace(q, A);
      q = spherical(q);

      if (!two) return q;

      // Two intersection points.
      var lambda0 = a[0],
          lambda1 = b[0],
          phi0 = a[1],
          phi1 = b[1],
          z;

      if (lambda1 < lambda0) z = lambda0, lambda0 = lambda1, lambda1 = z;

      var delta = lambda1 - lambda0,
          polar = abs(delta - pi) < epsilon$1,
          meridian = polar || delta < epsilon$1;

      if (!polar && phi1 < phi0) z = phi0, phi0 = phi1, phi1 = z;

      // Check that the first point is between a and b.
      if (meridian
          ? polar
            ? phi0 + phi1 > 0 ^ q[1] < (abs(q[0] - lambda0) < epsilon$1 ? phi0 : phi1)
            : phi0 <= q[1] && q[1] <= phi1
          : delta > pi ^ (lambda0 <= q[0] && q[0] <= lambda1)) {
        var q1 = cartesianScale(u, (-w + t) / uu);
        cartesianAddInPlace(q1, A);
        return [q, spherical(q1)];
      }
    }

    // Generates a 4-bit vector representing the location of a point relative to
    // the small circle's bounding box.
    function code(lambda, phi) {
      var r = smallRadius ? radius : pi - radius,
          code = 0;
      if (lambda < -r) code |= 1; // left
      else if (lambda > r) code |= 2; // right
      if (phi < -r) code |= 4; // below
      else if (phi > r) code |= 8; // above
      return code;
    }

    return clip(visible, clipLine, interpolate, smallRadius ? [0, -radius] : [-pi, radius - pi]);
  }

  function transform$1(prototype) {
    function T() {}
    var p = T.prototype = Object.create(Transform$1.prototype);
    for (var k in prototype) p[k] = prototype[k];
    return function(stream) {
      var t = new T;
      t.stream = stream;
      return t;
    };
  }

  function Transform$1() {}

  Transform$1.prototype = {
    point: function(x, y) { this.stream.point(x, y); },
    sphere: function() { this.stream.sphere(); },
    lineStart: function() { this.stream.lineStart(); },
    lineEnd: function() { this.stream.lineEnd(); },
    polygonStart: function() { this.stream.polygonStart(); },
    polygonEnd: function() { this.stream.polygonEnd(); }
  };

  var maxDepth = 16;
  var cosMinDistance = cos(30 * radians);
  // cos(minimum angular distance)

  function resample(project, delta2) {
    return +delta2 ? resample$1(project, delta2) : resampleNone(project);
  }

  function resampleNone(project) {
    return transform$1({
      point: function(x, y) {
        x = project(x, y);
        this.stream.point(x[0], x[1]);
      }
    });
  }

  function resample$1(project, delta2) {

    function resampleLineTo(x0, y0, lambda0, a0, b0, c0, x1, y1, lambda1, a1, b1, c1, depth, stream) {
      var dx = x1 - x0,
          dy = y1 - y0,
          d2 = dx * dx + dy * dy;
      if (d2 > 4 * delta2 && depth--) {
        var a = a0 + a1,
            b = b0 + b1,
            c = c0 + c1,
            m = sqrt$1(a * a + b * b + c * c),
            phi2 = asin(c /= m),
            lambda2 = abs(abs(c) - 1) < epsilon$1 || abs(lambda0 - lambda1) < epsilon$1 ? (lambda0 + lambda1) / 2 : atan2(b, a),
            p = project(lambda2, phi2),
            x2 = p[0],
            y2 = p[1],
            dx2 = x2 - x0,
            dy2 = y2 - y0,
            dz = dy * dx2 - dx * dy2;
        if (dz * dz / d2 > delta2 // perpendicular projected distance
            || abs((dx * dx2 + dy * dy2) / d2 - 0.5) > 0.3 // midpoint close to an end
            || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) { // angular distance
          resampleLineTo(x0, y0, lambda0, a0, b0, c0, x2, y2, lambda2, a /= m, b /= m, c, depth, stream);
          stream.point(x2, y2);
          resampleLineTo(x2, y2, lambda2, a, b, c, x1, y1, lambda1, a1, b1, c1, depth, stream);
        }
      }
    }
    return function(stream) {
      var lambda00, x00, y00, a00, b00, c00, // first point
          lambda0, x0, y0, a0, b0, c0; // previous point

      var resampleStream = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() { stream.polygonStart(); resampleStream.lineStart = ringStart; },
        polygonEnd: function() { stream.polygonEnd(); resampleStream.lineStart = lineStart; }
      };

      function point(x, y) {
        x = project(x, y);
        stream.point(x[0], x[1]);
      }

      function lineStart() {
        x0 = NaN;
        resampleStream.point = linePoint;
        stream.lineStart();
      }

      function linePoint(lambda, phi) {
        var c = cartesian([lambda, phi]), p = project(lambda, phi);
        resampleLineTo(x0, y0, lambda0, a0, b0, c0, x0 = p[0], y0 = p[1], lambda0 = lambda, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
        stream.point(x0, y0);
      }

      function lineEnd() {
        resampleStream.point = point;
        stream.lineEnd();
      }

      function ringStart() {
        lineStart();
        resampleStream.point = ringPoint;
        resampleStream.lineEnd = ringEnd;
      }

      function ringPoint(lambda, phi) {
        linePoint(lambda00 = lambda, phi), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;
        resampleStream.point = linePoint;
      }

      function ringEnd() {
        resampleLineTo(x0, y0, lambda0, a0, b0, c0, x00, y00, lambda00, a00, b00, c00, maxDepth, stream);
        resampleStream.lineEnd = lineEnd;
        lineEnd();
      }

      return resampleStream;
    };
  }

  var transformRadians = transform$1({
    point: function(x, y) {
      this.stream.point(x * radians, y * radians);
    }
  });

  function projection(project) {
    return projectionMutator(function() { return project; })();
  }

  function projectionMutator(projectAt) {
    var project,
        k = 150, // scale
        x = 480, y = 250, // translate
        dx, dy, lambda = 0, phi = 0, // center
        deltaLambda = 0, deltaPhi = 0, deltaGamma = 0, rotate, projectRotate, // rotate
        theta = null, preclip = clipAntimeridian, // clip angle
        x0 = null, y0, x1, y1, postclip = identity$5, // clip extent
        delta2 = 0.5, projectResample = resample(projectTransform, delta2), // precision
        cache,
        cacheStream;

    function projection(point) {
      point = projectRotate(point[0] * radians, point[1] * radians);
      return [point[0] * k + dx, dy - point[1] * k];
    }

    function invert(point) {
      point = projectRotate.invert((point[0] - dx) / k, (dy - point[1]) / k);
      return point && [point[0] * degrees$1, point[1] * degrees$1];
    }

    function projectTransform(x, y) {
      return x = project(x, y), [x[0] * k + dx, dy - x[1] * k];
    }

    projection.stream = function(stream) {
      return cache && cacheStream === stream ? cache : cache = transformRadians(preclip(rotate, projectResample(postclip(cacheStream = stream))));
    };

    projection.clipAngle = function(_) {
      return arguments.length ? (preclip = +_ ? clipCircle(theta = _ * radians, 6 * radians) : (theta = null, clipAntimeridian), reset()) : theta * degrees$1;
    };

    projection.clipExtent = function(_) {
      return arguments.length ? (postclip = _ == null ? (x0 = y0 = x1 = y1 = null, identity$5) : clipExtent(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]), reset()) : x0 == null ? null : [[x0, y0], [x1, y1]];
    };

    projection.scale = function(_) {
      return arguments.length ? (k = +_, recenter()) : k;
    };

    projection.translate = function(_) {
      return arguments.length ? (x = +_[0], y = +_[1], recenter()) : [x, y];
    };

    projection.center = function(_) {
      return arguments.length ? (lambda = _[0] % 360 * radians, phi = _[1] % 360 * radians, recenter()) : [lambda * degrees$1, phi * degrees$1];
    };

    projection.rotate = function(_) {
      return arguments.length ? (deltaLambda = _[0] % 360 * radians, deltaPhi = _[1] % 360 * radians, deltaGamma = _.length > 2 ? _[2] % 360 * radians : 0, recenter()) : [deltaLambda * degrees$1, deltaPhi * degrees$1, deltaGamma * degrees$1];
    };

    projection.precision = function(_) {
      return arguments.length ? (projectResample = resample(projectTransform, delta2 = _ * _), reset()) : sqrt$1(delta2);
    };

    function recenter() {
      projectRotate = compose(rotate = rotateRadians(deltaLambda, deltaPhi, deltaGamma), project);
      var center = project(lambda, phi);
      dx = x - center[0] * k;
      dy = y + center[1] * k;
      return reset();
    }

    function reset() {
      cache = cacheStream = null;
      return projection;
    }

    return function() {
      project = projectAt.apply(this, arguments);
      projection.invert = project.invert && invert;
      return recenter();
    };
  }

  function conicProjection(projectAt) {
    var phi0 = 0,
        phi1 = pi / 3,
        m = projectionMutator(projectAt),
        p = m(phi0, phi1);

    p.parallels = function(_) {
      return arguments.length ? m(phi0 = _[0] * radians, phi1 = _[1] * radians) : [phi0 * degrees$1, phi1 * degrees$1];
    };

    return p;
  }

  function conicEqualArea(y0, y1) {
    var sy0 = sin(y0),
        n = (sy0 + sin(y1)) / 2,
        c = 1 + sy0 * (2 * n - sy0),
        r0 = sqrt$1(c) / n;

    function project(x, y) {
      var r = sqrt$1(c - 2 * n * sin(y)) / n;
      return [r * sin(x *= n), r0 - r * cos(x)];
    }

    project.invert = function(x, y) {
      var r0y = r0 - y;
      return [atan2(x, r0y) / n, asin((c - (x * x + r0y * r0y) * n * n) / (2 * n))];
    };

    return project;
  }

  function geoConicEqualArea() {
    return conicProjection(conicEqualArea)
        .scale(151)
        .translate([480, 347]);
  }

  function geoAlbers() {
    return geoConicEqualArea()
        .parallels([29.5, 45.5])
        .scale(1070)
        .translate([480, 250])
        .rotate([96, 0])
        .center([-0.6, 38.7]);
  }

  // The projections must have mutually exclusive clip regions on the sphere,
  // as this will avoid emitting interleaving lines and polygons.
  function multiplex(streams) {
    var n = streams.length;
    return {
      point: function(x, y) { var i = -1; while (++i < n) streams[i].point(x, y); },
      sphere: function() { var i = -1; while (++i < n) streams[i].sphere(); },
      lineStart: function() { var i = -1; while (++i < n) streams[i].lineStart(); },
      lineEnd: function() { var i = -1; while (++i < n) streams[i].lineEnd(); },
      polygonStart: function() { var i = -1; while (++i < n) streams[i].polygonStart(); },
      polygonEnd: function() { var i = -1; while (++i < n) streams[i].polygonEnd(); }
    };
  }

  // A composite projection for the United States, configured by default for
  // 960×500. Also works quite well at 960×600 with scale 1285. The set of
  // standard parallels for each region comes from USGS, which is published here:
  // http://egsc.usgs.gov/isb/pubs/MapProjections/projections.html#albers
  function geoAlbersUsa() {
    var cache,
        cacheStream,
        lower48 = geoAlbers(), lower48Point,
        alaska = geoConicEqualArea().rotate([154, 0]).center([-2, 58.5]).parallels([55, 65]), alaskaPoint, // EPSG:3338
        hawaii = geoConicEqualArea().rotate([157, 0]).center([-3, 19.9]).parallels([8, 18]), hawaiiPoint, // ESRI:102007
        point, pointStream = {point: function(x, y) { point = [x, y]; }};

    function albersUsa(coordinates) {
      var x = coordinates[0], y = coordinates[1];
      return point = null,
          (lower48Point.point(x, y), point)
          || (alaskaPoint.point(x, y), point)
          || (hawaiiPoint.point(x, y), point);
    }

    albersUsa.invert = function(coordinates) {
      var k = lower48.scale(),
          t = lower48.translate(),
          x = (coordinates[0] - t[0]) / k,
          y = (coordinates[1] - t[1]) / k;
      return (y >= 0.120 && y < 0.234 && x >= -0.425 && x < -0.214 ? alaska
          : y >= 0.166 && y < 0.234 && x >= -0.214 && x < -0.115 ? hawaii
          : lower48).invert(coordinates);
    };

    albersUsa.stream = function(stream) {
      return cache && cacheStream === stream ? cache : cache = multiplex([lower48.stream(cacheStream = stream), alaska.stream(stream), hawaii.stream(stream)]);
    };

    albersUsa.precision = function(_) {
      if (!arguments.length) return lower48.precision();
      lower48.precision(_), alaska.precision(_), hawaii.precision(_);
      return albersUsa;
    };

    albersUsa.scale = function(_) {
      if (!arguments.length) return lower48.scale();
      lower48.scale(_), alaska.scale(_ * 0.35), hawaii.scale(_);
      return albersUsa.translate(lower48.translate());
    };

    albersUsa.translate = function(_) {
      if (!arguments.length) return lower48.translate();
      var k = lower48.scale(), x = +_[0], y = +_[1];

      lower48Point = lower48
          .translate(_)
          .clipExtent([[x - 0.455 * k, y - 0.238 * k], [x + 0.455 * k, y + 0.238 * k]])
          .stream(pointStream);

      alaskaPoint = alaska
          .translate([x - 0.307 * k, y + 0.201 * k])
          .clipExtent([[x - 0.425 * k + epsilon$1, y + 0.120 * k + epsilon$1], [x - 0.214 * k - epsilon$1, y + 0.234 * k - epsilon$1]])
          .stream(pointStream);

      hawaiiPoint = hawaii
          .translate([x - 0.205 * k, y + 0.212 * k])
          .clipExtent([[x - 0.214 * k + epsilon$1, y + 0.166 * k + epsilon$1], [x - 0.115 * k - epsilon$1, y + 0.234 * k - epsilon$1]])
          .stream(pointStream);

      return albersUsa;
    };

    return albersUsa.scale(1070);
  }

  function azimuthal(scale) {
    return function(x, y) {
      var cx = cos(x),
          cy = cos(y),
          k = scale(cx * cy);
      return [
        k * cy * sin(x),
        k * sin(y)
      ];
    }
  }

  function azimuthalInvert(angle) {
    return function(x, y) {
      var z = sqrt$1(x * x + y * y),
          c = angle(z),
          sc = sin(c),
          cc = cos(c);
      return [
        atan2(x * sc, z * cc),
        asin(z && y * sc / z)
      ];
    }
  }

  var azimuthalEqualArea = azimuthal(function(cxcy) {
    return sqrt$1(2 / (1 + cxcy));
  });

  azimuthalEqualArea.invert = azimuthalInvert(function(z) {
    return 2 * asin(z / 2);
  });

  function geoAzimuthalEqualArea() {
    return projection(azimuthalEqualArea)
        .scale(120)
        .clipAngle(180 - 1e-3);
  }

  var azimuthalEquidistant = azimuthal(function(c) {
    return (c = acos(c)) && c / sin(c);
  });

  azimuthalEquidistant.invert = azimuthalInvert(function(z) {
    return z;
  });

  function geoAzimuthalEquidistant() {
    return projection(azimuthalEquidistant)
        .scale(480 / tau)
        .clipAngle(180 - 1e-3);
  }

  function mercator(lambda, phi) {
    return [lambda, log$2(tan((halfPi + phi) / 2))];
  }

  mercator.invert = function(x, y) {
    return [x, 2 * atan(exp(y)) - halfPi];
  };

  function geoMercator() {
    return mercatorProjection(mercator);
  }

  function mercatorProjection(project) {
    var m = projection(project),
        scale = m.scale,
        translate = m.translate,
        clipExtent = m.clipExtent,
        clipAuto;

    m.scale = function(_) {
      return arguments.length ? (scale(_), clipAuto && m.clipExtent(null), m) : scale();
    };

    m.translate = function(_) {
      return arguments.length ? (translate(_), clipAuto && m.clipExtent(null), m) : translate();
    };

    m.clipExtent = function(_) {
      if (!arguments.length) return clipAuto ? null : clipExtent();
      if (clipAuto = _ == null) {
        var k = pi * scale(), t = translate();
        _ = [[t[0] - k, t[1] - k], [t[0] + k, t[1] + k]];
      }
      clipExtent(_);
      return m;
    };

    return m.clipExtent(null).scale(961 / tau);
  }

  function tany(y) {
    return tan((halfPi + y) / 2);
  }

  function conicConformal(y0, y1) {
    var cy0 = cos(y0),
        n = y0 === y1 ? sin(y0) : log$2(cy0 / cos(y1)) / log$2(tany(y1) / tany(y0)),
        f = cy0 * pow$1(tany(y0), n) / n;

    if (!n) return mercator;

    function project(x, y) {
      if (f > 0) { if (y < -halfPi + epsilon$1) y = -halfPi + epsilon$1; }
      else { if (y > halfPi - epsilon$1) y = halfPi - epsilon$1; }
      var r = f / pow$1(tany(y), n);
      return [r * sin(n * x), f - r * cos(n * x)];
    }

    project.invert = function(x, y) {
      var fy = f - y, r = sign(n) * sqrt$1(x * x + fy * fy);
      return [atan2(x, fy) / n, 2 * atan(pow$1(f / r, 1 / n)) - halfPi];
    };

    return project;
  }

  function geoConicConformal() {
    return conicProjection(conicConformal);
  }

  function equirectangular(lambda, phi) {
    return [lambda, phi];
  }

  equirectangular.invert = equirectangular;

  function geoEquirectangular() {
    return projection(equirectangular).scale(480 / pi);
  }

  function conicEquidistant(y0, y1) {
    var cy0 = cos(y0),
        n = y0 === y1 ? sin(y0) : (cy0 - cos(y1)) / (y1 - y0),
        g = cy0 / n + y0;

    if (abs(n) < epsilon$1) return equirectangular;

    function project(x, y) {
      var gy = g - y, nx = n * x;
      return [gy * sin(nx), g - gy * cos(nx)];
    }

    project.invert = function(x, y) {
      var gy = g - y;
      return [atan2(x, gy) / n, g - sign(n) * sqrt$1(x * x + gy * gy)];
    };

    return project;
  }

  function geoConicEquidistant() {
    return conicProjection(conicEquidistant)
        .scale(128)
        .translate([480, 280]);
  }

  function gnomonic(x, y) {
    var cy = cos(y), k = cos(x) * cy;
    return [cy * sin(x) / k, sin(y) / k];
  }

  gnomonic.invert = azimuthalInvert(atan);

  function geoGnomonic() {
    return projection(gnomonic)
        .scale(139)
        .clipAngle(60);
  }

  function orthographic(x, y) {
    return [cos(y) * sin(x), sin(y)];
  }

  orthographic.invert = azimuthalInvert(asin);

  function geoOrthographic() {
    return projection(orthographic)
        .scale(240)
        .clipAngle(90 + epsilon$1);
  }

  function stereographic(x, y) {
    var cy = cos(y), k = 1 + cos(x) * cy;
    return [cy * sin(x) / k, sin(y) / k];
  }

  stereographic.invert = azimuthalInvert(function(z) {
    return 2 + atan(z);
  });

  function geoStereographic() {
    return projection(stereographic)
        .scale(240)
        .clipAngle(142);
  }

  function transverseMercator(lambda, phi) {
    return [log$2(tan((halfPi + phi) / 2)), -lambda];
  }

  transverseMercator.invert = function(x, y) {
    return [-y, 2 * atan(exp(x)) - halfPi];
  };

  function geoTransverseMercator() {
    var m = mercatorProjection(transverseMercator),
        center = m.center,
        rotate = m.rotate;

    m.center = function(_) {
      return arguments.length ? center([-_[1], _[0]]) : (_ = center(), [_[1], -_[0]]);
    };

    m.rotate = function(_) {
      return arguments.length ? rotate([_[0], _[1], _.length > 2 ? _[2] + 90 : 90]) : (_ = rotate(), [_[0], _[1], _[2] - 90]);
    };

    return rotate([0, 0, 90]);
  }

  /**
   * Map GeoJSON data to an SVG path string.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(number, number): *} params.projection - The cartographic
   *   projection to apply.
   * @param {number} params.pointRadius - The point radius for path points.
   * @param {function(object): *} [params.field] - The field with GeoJSON data,
   *   or null if the tuple itself is a GeoJSON feature.
   * @param {string} [params.as='path'] - The output field in which to store
   *   the generated path data (default 'path').
   */
  function GeoPath(params) {
    Transform.call(this, null, params);
  }

  var prototype$41 = inherits(GeoPath, Transform);

  prototype$41.transform = function(_, pulse) {
    var path = this.value,
        field = _.field || identity$1,
        as = _.as || 'path',
        mod;

    function set(t) {
      t[as] = path(field(t));
    }

    if (!path || _.modified()) {
      // parameters updated, reset and reflow
      this.value = path = geoPath()
        .pointRadius(_.pointRadius)
        .projection(_.projection);

      pulse.materialize().reflow().visit(pulse.SOURCE, set);
    } else {
      mod = field === identity$1 || pulse.modified(field.fields);
      pulse.visit(mod ? pulse.ADD_MOD : pulse.ADD, set);
    }

    return pulse.modifies(as);
  };

  /**
   * Geo-code a longitude/latitude point to an x/y coordinate.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(number, number): *} params.projection - The cartographic
   *   projection to apply.
   * @param {Array<function(object): *>} params.fields - A two-element array of
   *   field accessors for the longitude and latitude values.
   * @param {Array<string>} [params.as] - A two-element array of field names
   *   under which to store the result. Defaults to ['x','y'].
   */
  function GeoPoint(params) {
    Transform.call(this, null, params);
  }

  var prototype$42 = inherits(GeoPoint, Transform);

  prototype$42.transform = function(_, pulse) {
    var proj = _.projection,
        lon = _.fields[0],
        lat = _.fields[1],
        as = _.as || ['x', 'y'],
        x = as[0],
        y = as[1],
        mod;

    function set(t) {
      var xy = proj([lon(t), lat(t)]);
      t[x] = xy[0];
      t[y] = xy[1];
    }

    if (_.modified()) {
      // parameters updated, reflow
      pulse.materialize().reflow().visit(pulse.SOURCE, set);
    } else {
      mod = pulse.modified(lon.fields) || pulse.modified(lat.fields);
      pulse.visit(mod ? pulse.ADD_MOD : pulse.ADD, set);
    }

    return pulse.modifies(as);
  };

  /**
   * GeoJSON feature generator for creating graticules.
   * @constructor
   */
  function Graticule(params) {
    Transform.call(this, [], params);
    this.generator = geoGraticule();
  }

  var prototype$43 = inherits(Graticule, Transform);

  prototype$43.transform = function(_, pulse) {
    var out = pulse.fork(),
        src = this.value,
        gen = this.generator, t;

    if (!src.length || _.modified()) {
      for (var prop in _) {
        if (isFunction(gen[prop])) {
          gen[prop](_[prop]);
        }
      }
    }

    t = gen();
    if (src.length) {
      t._id = src[0]._id;
      out.mod.push(t);
    } else {
      out.add.push(ingest(t));
    }
    src[0] = t;

    return out.source = src, out;
  };

  var projections = {
    // base d3-geo projection types
    albers:               geoAlbers,
    albersusa:            geoAlbersUsa,
    azimuthalequalarea:   geoAzimuthalEqualArea,
    azimuthalequidistant: geoAzimuthalEquidistant,
    conicconformal:       geoConicConformal,
    conicequalarea:       geoConicEqualArea,
    conicequidistant:     geoConicEquidistant,
    equirectangular:      geoEquirectangular,
    gnomonic:             geoGnomonic,
    mercator:             geoMercator,
    orthographic:         geoOrthographic,
    stereographic:        geoStereographic,
    transversemercator:   geoTransverseMercator
  };

  /**
   * Maintains a cartographic projection.
   * @constructor
   * @param {object} params - The parameters for this operator.
   */
  function Projection(params) {
    Transform.call(this, null, params);
    this.modified(true); // always treat as modified
  }

  var prototype$44 = inherits(Projection, Transform);

  prototype$44.transform = function(_) {
    var proj = this.value, prop;

    if (!proj || _.modified('type')) {
      this.value = (proj = createProjection(_.type));
    }

    for (prop in _) {
      if (isFunction(proj[prop])) {
        proj[prop](_[prop]);
      }
    }
  };

  function createProjection(projType) {
    var type = (projType || 'mercator').toLowerCase(),
        proj = projections[type];

    if (!type || !projections.hasOwnProperty(type)) {
      error('Unrecognized projection type: ' + projType);
    }

    return proj = proj(), proj.type = type, proj;
  }

  function defaultSeparation(a, b) {
    return a.parent === b.parent ? 1 : 2;
  }

  function meanX(children) {
    return children.reduce(meanXReduce, 0) / children.length;
  }

  function meanXReduce(x, c) {
    return x + c.x;
  }

  function maxY(children) {
    return 1 + children.reduce(maxYReduce, 0);
  }

  function maxYReduce(y, c) {
    return Math.max(y, c.y);
  }

  function leafLeft(node) {
    var children;
    while (children = node.children) node = children[0];
    return node;
  }

  function leafRight(node) {
    var children;
    while (children = node.children) node = children[children.length - 1];
    return node;
  }

  function cluster() {
    var separation = defaultSeparation,
        dx = 1,
        dy = 1,
        nodeSize = false;

    function cluster(root) {
      var previousNode,
          x = 0;

      // First walk, computing the initial x & y values.
      root.eachAfter(function(node) {
        var children = node.children;
        if (children) {
          node.x = meanX(children);
          node.y = maxY(children);
        } else {
          node.x = previousNode ? x += separation(node, previousNode) : 0;
          node.y = 0;
          previousNode = node;
        }
      });

      var left = leafLeft(root),
          right = leafRight(root),
          x0 = left.x - separation(left, right) / 2,
          x1 = right.x + separation(right, left) / 2;

      // Second walk, normalizing x & y to the desired size.
      return root.eachAfter(nodeSize ? function(node) {
        node.x = (node.x - root.x) * dx;
        node.y = (root.y - node.y) * dy;
      } : function(node) {
        node.x = (node.x - x0) / (x1 - x0) * dx;
        node.y = (1 - (root.y ? node.y / root.y : 1)) * dy;
      });
    }

    cluster.separation = function(x) {
      return arguments.length ? (separation = x, cluster) : separation;
    };

    cluster.size = function(x) {
      return arguments.length ? (nodeSize = false, dx = +x[0], dy = +x[1], cluster) : (nodeSize ? null : [dx, dy]);
    };

    cluster.nodeSize = function(x) {
      return arguments.length ? (nodeSize = true, dx = +x[0], dy = +x[1], cluster) : (nodeSize ? [dx, dy] : null);
    };

    return cluster;
  }

  function node_each(callback) {
    var node = this, current, next = [node], children, i, n;
    do {
      current = next.reverse(), next = [];
      while (node = current.pop()) {
        callback(node), children = node.children;
        if (children) for (i = 0, n = children.length; i < n; ++i) {
          next.push(children[i]);
        }
      }
    } while (next.length);
    return this;
  }

  function node_eachBefore(callback) {
    var node = this, nodes = [node], children, i;
    while (node = nodes.pop()) {
      callback(node), children = node.children;
      if (children) for (i = children.length - 1; i >= 0; --i) {
        nodes.push(children[i]);
      }
    }
    return this;
  }

  function node_eachAfter(callback) {
    var node = this, nodes = [node], next = [], children, i, n;
    while (node = nodes.pop()) {
      next.push(node), children = node.children;
      if (children) for (i = 0, n = children.length; i < n; ++i) {
        nodes.push(children[i]);
      }
    }
    while (node = next.pop()) {
      callback(node);
    }
    return this;
  }

  function node_sum(value) {
    return this.eachAfter(function(node) {
      var sum = +value(node.data) || 0,
          children = node.children,
          i = children && children.length;
      while (--i >= 0) sum += children[i].value;
      node.value = sum;
    });
  }

  function node_sort(compare) {
    return this.eachBefore(function(node) {
      if (node.children) {
        node.children.sort(compare);
      }
    });
  }

  function node_path(end) {
    var start = this,
        ancestor = leastCommonAncestor(start, end),
        nodes = [start];
    while (start !== ancestor) {
      start = start.parent;
      nodes.push(start);
    }
    var k = nodes.length;
    while (end !== ancestor) {
      nodes.splice(k, 0, end);
      end = end.parent;
    }
    return nodes;
  }

  function leastCommonAncestor(a, b) {
    if (a === b) return a;
    var aNodes = a.ancestors(),
        bNodes = b.ancestors(),
        c = null;
    a = aNodes.pop();
    b = bNodes.pop();
    while (a === b) {
      c = a;
      a = aNodes.pop();
      b = bNodes.pop();
    }
    return c;
  }

  function node_ancestors() {
    var node = this, nodes = [node];
    while (node = node.parent) {
      nodes.push(node);
    }
    return nodes;
  }

  function node_descendants() {
    var nodes = [];
    this.each(function(node) {
      nodes.push(node);
    });
    return nodes;
  }

  function node_leaves() {
    var leaves = [];
    this.eachBefore(function(node) {
      if (!node.children) {
        leaves.push(node);
      }
    });
    return leaves;
  }

  function node_links() {
    var root = this, links = [];
    root.each(function(node) {
      if (node !== root) { // Don’t include the root’s parent, if any.
        links.push({source: node.parent, target: node});
      }
    });
    return links;
  }

  function hierarchy(data, children) {
    var root = new Node(data),
        valued = +data.value && (root.value = data.value),
        node,
        nodes = [root],
        child,
        childs,
        i,
        n;

    if (children == null) children = defaultChildren;

    while (node = nodes.pop()) {
      if (valued) node.value = +node.data.value;
      if ((childs = children(node.data)) && (n = childs.length)) {
        node.children = new Array(n);
        for (i = n - 1; i >= 0; --i) {
          nodes.push(child = node.children[i] = new Node(childs[i]));
          child.parent = node;
          child.depth = node.depth + 1;
        }
      }
    }

    return root.eachBefore(computeHeight);
  }

  function node_copy() {
    return hierarchy(this).eachBefore(copyData);
  }

  function defaultChildren(d) {
    return d.children;
  }

  function copyData(node) {
    node.data = node.data.data;
  }

  function computeHeight(node) {
    var height = 0;
    do node.height = height;
    while ((node = node.parent) && (node.height < ++height));
  }

  function Node(data) {
    this.data = data;
    this.depth =
    this.height = 0;
    this.parent = null;
  }

  Node.prototype = hierarchy.prototype = {
    constructor: Node,
    each: node_each,
    eachAfter: node_eachAfter,
    eachBefore: node_eachBefore,
    sum: node_sum,
    sort: node_sort,
    path: node_path,
    ancestors: node_ancestors,
    descendants: node_descendants,
    leaves: node_leaves,
    links: node_links,
    copy: node_copy
  };

  function Node$2(value) {
    this._ = value;
    this.next = null;
  }

  function shuffle$1(array) {
    var i,
        n = (array = array.slice()).length,
        head = null,
        node = head;

    while (n) {
      var next = new Node$2(array[n - 1]);
      if (node) node = node.next = next;
      else node = head = next;
      array[i] = array[--n];
    }

    return {
      head: head,
      tail: node
    };
  }

  function enclose(circles) {
    return encloseN(shuffle$1(circles), []);
  }

  function encloses(a, b) {
    var dx = b.x - a.x,
        dy = b.y - a.y,
        dr = a.r - b.r;
    return dr * dr + 1e-6 > dx * dx + dy * dy;
  }

  // Returns the smallest circle that contains circles L and intersects circles B.
  function encloseN(L, B) {
    var circle,
        l0 = null,
        l1 = L.head,
        l2,
        p1;

    switch (B.length) {
      case 1: circle = enclose1(B[0]); break;
      case 2: circle = enclose2(B[0], B[1]); break;
      case 3: circle = enclose3(B[0], B[1], B[2]); break;
    }

    while (l1) {
      p1 = l1._, l2 = l1.next;
      if (!circle || !encloses(circle, p1)) {

        // Temporarily truncate L before l1.
        if (l0) L.tail = l0, l0.next = null;
        else L.head = L.tail = null;

        B.push(p1);
        circle = encloseN(L, B); // Note: reorders L!
        B.pop();

        // Move l1 to the front of L and reconnect the truncated list L.
        if (L.head) l1.next = L.head, L.head = l1;
        else l1.next = null, L.head = L.tail = l1;
        l0 = L.tail, l0.next = l2;

      } else {
        l0 = l1;
      }
      l1 = l2;
    }

    L.tail = l0;
    return circle;
  }

  function enclose1(a) {
    return {
      x: a.x,
      y: a.y,
      r: a.r
    };
  }

  function enclose2(a, b) {
    var x1 = a.x, y1 = a.y, r1 = a.r,
        x2 = b.x, y2 = b.y, r2 = b.r,
        x21 = x2 - x1, y21 = y2 - y1, r21 = r2 - r1,
        l = Math.sqrt(x21 * x21 + y21 * y21);
    return {
      x: (x1 + x2 + x21 / l * r21) / 2,
      y: (y1 + y2 + y21 / l * r21) / 2,
      r: (l + r1 + r2) / 2
    };
  }

  function enclose3(a, b, c) {
    var x1 = a.x, y1 = a.y, r1 = a.r,
        x2 = b.x, y2 = b.y, r2 = b.r,
        x3 = c.x, y3 = c.y, r3 = c.r,
        a2 = 2 * (x1 - x2),
        b2 = 2 * (y1 - y2),
        c2 = 2 * (r2 - r1),
        d2 = x1 * x1 + y1 * y1 - r1 * r1 - x2 * x2 - y2 * y2 + r2 * r2,
        a3 = 2 * (x1 - x3),
        b3 = 2 * (y1 - y3),
        c3 = 2 * (r3 - r1),
        d3 = x1 * x1 + y1 * y1 - r1 * r1 - x3 * x3 - y3 * y3 + r3 * r3,
        ab = a3 * b2 - a2 * b3,
        xa = (b2 * d3 - b3 * d2) / ab - x1,
        xb = (b3 * c2 - b2 * c3) / ab,
        ya = (a3 * d2 - a2 * d3) / ab - y1,
        yb = (a2 * c3 - a3 * c2) / ab,
        A = xb * xb + yb * yb - 1,
        B = 2 * (xa * xb + ya * yb + r1),
        C = xa * xa + ya * ya - r1 * r1,
        r = (-B - Math.sqrt(B * B - 4 * A * C)) / (2 * A);
    return {
      x: xa + xb * r + x1,
      y: ya + yb * r + y1,
      r: r
    };
  }

  function place(a, b, c) {
    var ax = a.x,
        ay = a.y,
        da = b.r + c.r,
        db = a.r + c.r,
        dx = b.x - ax,
        dy = b.y - ay,
        dc = dx * dx + dy * dy;
    if (dc) {
      var x = 0.5 + ((db *= db) - (da *= da)) / (2 * dc),
          y = Math.sqrt(Math.max(0, 2 * da * (db + dc) - (db -= dc) * db - da * da)) / (2 * dc);
      c.x = ax + x * dx + y * dy;
      c.y = ay + x * dy - y * dx;
    } else {
      c.x = ax + db;
      c.y = ay;
    }
  }

  function intersects(a, b) {
    var dx = b.x - a.x,
        dy = b.y - a.y,
        dr = a.r + b.r;
    return dr * dr > dx * dx + dy * dy;
  }

  function distance2(circle, x, y) {
    var dx = circle.x - x,
        dy = circle.y - y;
    return dx * dx + dy * dy;
  }

  function Node$1(circle) {
    this._ = circle;
    this.next = null;
    this.previous = null;
  }

  function packEnclose(circles) {
    if (!(n = circles.length)) return 0;

    var a, b, c, n;

    // Place the first circle.
    a = circles[0], a.x = 0, a.y = 0;
    if (!(n > 1)) return a.r;

    // Place the second circle.
    b = circles[1], a.x = -b.r, b.x = a.r, b.y = 0;
    if (!(n > 2)) return a.r + b.r;

    // Place the third circle.
    place(b, a, c = circles[2]);

    // Initialize the weighted centroid.
    var aa = a.r * a.r,
        ba = b.r * b.r,
        ca = c.r * c.r,
        oa = aa + ba + ca,
        ox = aa * a.x + ba * b.x + ca * c.x,
        oy = aa * a.y + ba * b.y + ca * c.y,
        cx, cy, i, j, k, sj, sk;

    // Initialize the front-chain using the first three circles a, b and c.
    a = new Node$1(a), b = new Node$1(b), c = new Node$1(c);
    a.next = c.previous = b;
    b.next = a.previous = c;
    c.next = b.previous = a;

    // Attempt to place each remaining circle…
    pack: for (i = 3; i < n; ++i) {
      place(a._, b._, c = circles[i]), c = new Node$1(c);

      // If there are only three elements in the front-chain…
      if ((k = a.previous) === (j = b.next)) {
        // If the new circle intersects the third circle,
        // rotate the front chain to try the next position.
        if (intersects(j._, c._)) {
          a = b, b = j, --i;
          continue pack;
        }
      }

      // Find the closest intersecting circle on the front-chain, if any.
      else {
        sj = j._.r, sk = k._.r;
        do {
          if (sj <= sk) {
            if (intersects(j._, c._)) {
              b = j, a.next = b, b.previous = a, --i;
              continue pack;
            }
            j = j.next, sj += j._.r;
          } else {
            if (intersects(k._, c._)) {
              a = k, a.next = b, b.previous = a, --i;
              continue pack;
            }
            k = k.previous, sk += k._.r;
          }
        } while (j !== k.next);
      }

      // Success! Insert the new circle c between a and b.
      c.previous = a, c.next = b, a.next = b.previous = b = c;

      // Update the weighted centroid.
      oa += ca = c._.r * c._.r;
      ox += ca * c._.x;
      oy += ca * c._.y;

      // Compute the new closest circle a to centroid.
      aa = distance2(a._, cx = ox / oa, cy = oy / oa);
      while ((c = c.next) !== b) {
        if ((ca = distance2(c._, cx, cy)) < aa) {
          a = c, aa = ca;
        }
      }
      b = a.next;
    }

    // Compute the enclosing circle of the front chain.
    a = [b._], c = b; while ((c = c.next) !== b) a.push(c._); c = enclose(a);

    // Translate the circles to put the enclosing circle around the origin.
    for (i = 0; i < n; ++i) a = circles[i], a.x -= c.x, a.y -= c.y;

    return c.r;
  }

  function optional(f) {
    return f == null ? null : required(f);
  }

  function required(f) {
    if (typeof f !== "function") throw new Error;
    return f;
  }

  function constantZero() {
    return 0;
  }

  function constant$7(x) {
    return function() {
      return x;
    };
  }

  function defaultRadius(d) {
    return Math.sqrt(d.value);
  }

  function pack$1() {
    var radius = null,
        dx = 1,
        dy = 1,
        padding = constantZero;

    function pack(root) {
      root.x = dx / 2, root.y = dy / 2;
      if (radius) {
        root.eachBefore(radiusLeaf(radius))
            .eachAfter(packChildren(padding, 0.5))
            .eachBefore(translateChild(1));
      } else {
        root.eachBefore(radiusLeaf(defaultRadius))
            .eachAfter(packChildren(constantZero, 1))
            .eachAfter(packChildren(padding, root.r / Math.min(dx, dy)))
            .eachBefore(translateChild(Math.min(dx, dy) / (2 * root.r)));
      }
      return root;
    }

    pack.radius = function(x) {
      return arguments.length ? (radius = optional(x), pack) : radius;
    };

    pack.size = function(x) {
      return arguments.length ? (dx = +x[0], dy = +x[1], pack) : [dx, dy];
    };

    pack.padding = function(x) {
      return arguments.length ? (padding = typeof x === "function" ? x : constant$7(+x), pack) : padding;
    };

    return pack;
  }

  function radiusLeaf(radius) {
    return function(node) {
      if (!node.children) {
        node.r = Math.max(0, +radius(node) || 0);
      }
    };
  }

  function packChildren(padding, k) {
    return function(node) {
      if (children = node.children) {
        var children,
            i,
            n = children.length,
            r = padding(node) * k || 0,
            e;

        if (r) for (i = 0; i < n; ++i) children[i].r += r;
        e = packEnclose(children);
        if (r) for (i = 0; i < n; ++i) children[i].r -= r;
        node.r = e + r;
      }
    };
  }

  function translateChild(k) {
    return function(node) {
      var parent = node.parent;
      node.r *= k;
      if (parent) {
        node.x = parent.x + k * node.x;
        node.y = parent.y + k * node.y;
      }
    };
  }

  function roundNode(node) {
    node.x0 = Math.round(node.x0);
    node.y0 = Math.round(node.y0);
    node.x1 = Math.round(node.x1);
    node.y1 = Math.round(node.y1);
  }

  function treemapDice(parent, x0, y0, x1, y1) {
    var nodes = parent.children,
        node,
        i = -1,
        n = nodes.length,
        k = parent.value && (x1 - x0) / parent.value;

    while (++i < n) {
      node = nodes[i], node.y0 = y0, node.y1 = y1;
      node.x0 = x0, node.x1 = x0 += node.value * k;
    }
  }

  function partition$2() {
    var dx = 1,
        dy = 1,
        padding = 0,
        round = false;

    function partition(root) {
      var n = root.height + 1;
      root.x0 =
      root.y0 = padding;
      root.x1 = dx;
      root.y1 = dy / n;
      root.eachBefore(positionNode(dy, n));
      if (round) root.eachBefore(roundNode);
      return root;
    }

    function positionNode(dy, n) {
      return function(node) {
        if (node.children) {
          treemapDice(node, node.x0, dy * (node.depth + 1) / n, node.x1, dy * (node.depth + 2) / n);
        }
        var x0 = node.x0,
            y0 = node.y0,
            x1 = node.x1 - padding,
            y1 = node.y1 - padding;
        if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
        if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
        node.x0 = x0;
        node.y0 = y0;
        node.x1 = x1;
        node.y1 = y1;
      };
    }

    partition.round = function(x) {
      return arguments.length ? (round = !!x, partition) : round;
    };

    partition.size = function(x) {
      return arguments.length ? (dx = +x[0], dy = +x[1], partition) : [dx, dy];
    };

    partition.padding = function(x) {
      return arguments.length ? (padding = +x, partition) : padding;
    };

    return partition;
  }

  var keyPrefix = "$";
  var preroot = {depth: -1};
  var ambiguous = {};
  function defaultId(d) {
    return d.id;
  }

  function defaultParentId(d) {
    return d.parentId;
  }

  function stratify() {
    var id = defaultId,
        parentId = defaultParentId;

    function stratify(data) {
      var d,
          i,
          n = data.length,
          root,
          parent,
          node,
          nodes = new Array(n),
          nodeId,
          nodeKey,
          nodeByKey = {};

      for (i = 0; i < n; ++i) {
        d = data[i], node = nodes[i] = new Node(d);
        if ((nodeId = id(d, i, data)) != null && (nodeId += "")) {
          nodeKey = keyPrefix + (node.id = nodeId);
          nodeByKey[nodeKey] = nodeKey in nodeByKey ? ambiguous : node;
        }
      }

      for (i = 0; i < n; ++i) {
        node = nodes[i], nodeId = parentId(data[i], i, data);
        if (nodeId == null || !(nodeId += "")) {
          if (root) throw new Error("multiple roots");
          root = node;
        } else {
          parent = nodeByKey[keyPrefix + nodeId];
          if (!parent) throw new Error("missing: " + nodeId);
          if (parent === ambiguous) throw new Error("ambiguous: " + nodeId);
          if (parent.children) parent.children.push(node);
          else parent.children = [node];
          node.parent = parent;
        }
      }

      if (!root) throw new Error("no root");
      root.parent = preroot;
      root.eachBefore(function(node) { node.depth = node.parent.depth + 1; --n; }).eachBefore(computeHeight);
      root.parent = null;
      if (n > 0) throw new Error("cycle");

      return root;
    }

    stratify.id = function(x) {
      return arguments.length ? (id = required(x), stratify) : id;
    };

    stratify.parentId = function(x) {
      return arguments.length ? (parentId = required(x), stratify) : parentId;
    };

    return stratify;
  }

  function defaultSeparation$1(a, b) {
    return a.parent === b.parent ? 1 : 2;
  }

  // function radialSeparation(a, b) {
  //   return (a.parent === b.parent ? 1 : 2) / a.depth;
  // }

  // This function is used to traverse the left contour of a subtree (or
  // subforest). It returns the successor of v on this contour. This successor is
  // either given by the leftmost child of v or by the thread of v. The function
  // returns null if and only if v is on the highest level of its subtree.
  function nextLeft(v) {
    var children = v.children;
    return children ? children[0] : v.t;
  }

  // This function works analogously to nextLeft.
  function nextRight(v) {
    var children = v.children;
    return children ? children[children.length - 1] : v.t;
  }

  // Shifts the current subtree rooted at w+. This is done by increasing
  // prelim(w+) and mod(w+) by shift.
  function moveSubtree(wm, wp, shift) {
    var change = shift / (wp.i - wm.i);
    wp.c -= change;
    wp.s += shift;
    wm.c += change;
    wp.z += shift;
    wp.m += shift;
  }

  // All other shifts, applied to the smaller subtrees between w- and w+, are
  // performed by this function. To prepare the shifts, we have to adjust
  // change(w+), shift(w+), and change(w-).
  function executeShifts(v) {
    var shift = 0,
        change = 0,
        children = v.children,
        i = children.length,
        w;
    while (--i >= 0) {
      w = children[i];
      w.z += shift;
      w.m += shift;
      shift += w.s + (change += w.c);
    }
  }

  // If vi-’s ancestor is a sibling of v, returns vi-’s ancestor. Otherwise,
  // returns the specified (default) ancestor.
  function nextAncestor(vim, v, ancestor) {
    return vim.a.parent === v.parent ? vim.a : ancestor;
  }

  function TreeNode(node, i) {
    this._ = node;
    this.parent = null;
    this.children = null;
    this.A = null; // default ancestor
    this.a = this; // ancestor
    this.z = 0; // prelim
    this.m = 0; // mod
    this.c = 0; // change
    this.s = 0; // shift
    this.t = null; // thread
    this.i = i; // number
  }

  TreeNode.prototype = Object.create(Node.prototype);

  function treeRoot(root) {
    var tree = new TreeNode(root, 0),
        node,
        nodes = [tree],
        child,
        children,
        i,
        n;

    while (node = nodes.pop()) {
      if (children = node._.children) {
        node.children = new Array(n = children.length);
        for (i = n - 1; i >= 0; --i) {
          nodes.push(child = node.children[i] = new TreeNode(children[i], i));
          child.parent = node;
        }
      }
    }

    (tree.parent = new TreeNode(null, 0)).children = [tree];
    return tree;
  }

  // Node-link tree diagram using the Reingold-Tilford "tidy" algorithm
  function tree() {
    var separation = defaultSeparation$1,
        dx = 1,
        dy = 1,
        nodeSize = null;

    function tree(root) {
      var t = treeRoot(root);

      // Compute the layout using Buchheim et al.’s algorithm.
      t.eachAfter(firstWalk), t.parent.m = -t.z;
      t.eachBefore(secondWalk);

      // If a fixed node size is specified, scale x and y.
      if (nodeSize) root.eachBefore(sizeNode);

      // If a fixed tree size is specified, scale x and y based on the extent.
      // Compute the left-most, right-most, and depth-most nodes for extents.
      else {
        var left = root,
            right = root,
            bottom = root;
        root.eachBefore(function(node) {
          if (node.x < left.x) left = node;
          if (node.x > right.x) right = node;
          if (node.depth > bottom.depth) bottom = node;
        });
        var s = left === right ? 1 : separation(left, right) / 2,
            tx = s - left.x,
            kx = dx / (right.x + s + tx),
            ky = dy / (bottom.depth || 1);
        root.eachBefore(function(node) {
          node.x = (node.x + tx) * kx;
          node.y = node.depth * ky;
        });
      }

      return root;
    }

    // Computes a preliminary x-coordinate for v. Before that, FIRST WALK is
    // applied recursively to the children of v, as well as the function
    // APPORTION. After spacing out the children by calling EXECUTE SHIFTS, the
    // node v is placed to the midpoint of its outermost children.
    function firstWalk(v) {
      var children = v.children,
          siblings = v.parent.children,
          w = v.i ? siblings[v.i - 1] : null;
      if (children) {
        executeShifts(v);
        var midpoint = (children[0].z + children[children.length - 1].z) / 2;
        if (w) {
          v.z = w.z + separation(v._, w._);
          v.m = v.z - midpoint;
        } else {
          v.z = midpoint;
        }
      } else if (w) {
        v.z = w.z + separation(v._, w._);
      }
      v.parent.A = apportion(v, w, v.parent.A || siblings[0]);
    }

    // Computes all real x-coordinates by summing up the modifiers recursively.
    function secondWalk(v) {
      v._.x = v.z + v.parent.m;
      v.m += v.parent.m;
    }

    // The core of the algorithm. Here, a new subtree is combined with the
    // previous subtrees. Threads are used to traverse the inside and outside
    // contours of the left and right subtree up to the highest common level. The
    // vertices used for the traversals are vi+, vi-, vo-, and vo+, where the
    // superscript o means outside and i means inside, the subscript - means left
    // subtree and + means right subtree. For summing up the modifiers along the
    // contour, we use respective variables si+, si-, so-, and so+. Whenever two
    // nodes of the inside contours conflict, we compute the left one of the
    // greatest uncommon ancestors using the function ANCESTOR and call MOVE
    // SUBTREE to shift the subtree and prepare the shifts of smaller subtrees.
    // Finally, we add a new thread (if necessary).
    function apportion(v, w, ancestor) {
      if (w) {
        var vip = v,
            vop = v,
            vim = w,
            vom = vip.parent.children[0],
            sip = vip.m,
            sop = vop.m,
            sim = vim.m,
            som = vom.m,
            shift;
        while (vim = nextRight(vim), vip = nextLeft(vip), vim && vip) {
          vom = nextLeft(vom);
          vop = nextRight(vop);
          vop.a = v;
          shift = vim.z + sim - vip.z - sip + separation(vim._, vip._);
          if (shift > 0) {
            moveSubtree(nextAncestor(vim, v, ancestor), v, shift);
            sip += shift;
            sop += shift;
          }
          sim += vim.m;
          sip += vip.m;
          som += vom.m;
          sop += vop.m;
        }
        if (vim && !nextRight(vop)) {
          vop.t = vim;
          vop.m += sim - sop;
        }
        if (vip && !nextLeft(vom)) {
          vom.t = vip;
          vom.m += sip - som;
          ancestor = v;
        }
      }
      return ancestor;
    }

    function sizeNode(node) {
      node.x *= dx;
      node.y = node.depth * dy;
    }

    tree.separation = function(x) {
      return arguments.length ? (separation = x, tree) : separation;
    };

    tree.size = function(x) {
      return arguments.length ? (nodeSize = false, dx = +x[0], dy = +x[1], tree) : (nodeSize ? null : [dx, dy]);
    };

    tree.nodeSize = function(x) {
      return arguments.length ? (nodeSize = true, dx = +x[0], dy = +x[1], tree) : (nodeSize ? [dx, dy] : null);
    };

    return tree;
  }

  function treemapSlice(parent, x0, y0, x1, y1) {
    var nodes = parent.children,
        node,
        i = -1,
        n = nodes.length,
        k = parent.value && (y1 - y0) / parent.value;

    while (++i < n) {
      node = nodes[i], node.x0 = x0, node.x1 = x1;
      node.y0 = y0, node.y1 = y0 += node.value * k;
    }
  }

  var phi = (1 + Math.sqrt(5)) / 2;

  function squarifyRatio(ratio, parent, x0, y0, x1, y1) {
    var rows = [],
        nodes = parent.children,
        row,
        nodeValue,
        i0 = 0,
        i1,
        n = nodes.length,
        dx, dy,
        value = parent.value,
        sumValue,
        minValue,
        maxValue,
        newRatio,
        minRatio,
        alpha,
        beta;

    while (i0 < n) {
      dx = x1 - x0, dy = y1 - y0;
      minValue = maxValue = sumValue = nodes[i0].value;
      alpha = Math.max(dy / dx, dx / dy) / (value * ratio);
      beta = sumValue * sumValue * alpha;
      minRatio = Math.max(maxValue / beta, beta / minValue);

      // Keep adding nodes while the aspect ratio maintains or improves.
      for (i1 = i0 + 1; i1 < n; ++i1) {
        sumValue += nodeValue = nodes[i1].value;
        if (nodeValue < minValue) minValue = nodeValue;
        if (nodeValue > maxValue) maxValue = nodeValue;
        beta = sumValue * sumValue * alpha;
        newRatio = Math.max(maxValue / beta, beta / minValue);
        if (newRatio > minRatio) { sumValue -= nodeValue; break; }
        minRatio = newRatio;
      }

      // Position and record the row orientation.
      rows.push(row = {value: sumValue, dice: dx < dy, children: nodes.slice(i0, i1)});
      if (row.dice) treemapDice(row, x0, y0, x1, value ? y0 += dy * sumValue / value : y1);
      else treemapSlice(row, x0, y0, value ? x0 += dx * sumValue / value : x1, y1);
      value -= sumValue, i0 = i1;
    }

    return rows;
  }

  var treemapSquarify = (function custom(ratio) {

    function squarify(parent, x0, y0, x1, y1) {
      squarifyRatio(ratio, parent, x0, y0, x1, y1);
    }

    squarify.ratio = function(x) {
      return custom((x = +x) > 1 ? x : 1);
    };

    return squarify;
  })(phi);

  function treemap() {
    var tile = treemapSquarify,
        round = false,
        dx = 1,
        dy = 1,
        paddingStack = [0],
        paddingInner = constantZero,
        paddingTop = constantZero,
        paddingRight = constantZero,
        paddingBottom = constantZero,
        paddingLeft = constantZero;

    function treemap(root) {
      root.x0 =
      root.y0 = 0;
      root.x1 = dx;
      root.y1 = dy;
      root.eachBefore(positionNode);
      paddingStack = [0];
      if (round) root.eachBefore(roundNode);
      return root;
    }

    function positionNode(node) {
      var p = paddingStack[node.depth],
          x0 = node.x0 + p,
          y0 = node.y0 + p,
          x1 = node.x1 - p,
          y1 = node.y1 - p;
      if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
      if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
      node.x0 = x0;
      node.y0 = y0;
      node.x1 = x1;
      node.y1 = y1;
      if (node.children) {
        p = paddingStack[node.depth + 1] = paddingInner(node) / 2;
        x0 += paddingLeft(node) - p;
        y0 += paddingTop(node) - p;
        x1 -= paddingRight(node) - p;
        y1 -= paddingBottom(node) - p;
        if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
        if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
        tile(node, x0, y0, x1, y1);
      }
    }

    treemap.round = function(x) {
      return arguments.length ? (round = !!x, treemap) : round;
    };

    treemap.size = function(x) {
      return arguments.length ? (dx = +x[0], dy = +x[1], treemap) : [dx, dy];
    };

    treemap.tile = function(x) {
      return arguments.length ? (tile = required(x), treemap) : tile;
    };

    treemap.padding = function(x) {
      return arguments.length ? treemap.paddingInner(x).paddingOuter(x) : treemap.paddingInner();
    };

    treemap.paddingInner = function(x) {
      return arguments.length ? (paddingInner = typeof x === "function" ? x : constant$7(+x), treemap) : paddingInner;
    };

    treemap.paddingOuter = function(x) {
      return arguments.length ? treemap.paddingTop(x).paddingRight(x).paddingBottom(x).paddingLeft(x) : treemap.paddingTop();
    };

    treemap.paddingTop = function(x) {
      return arguments.length ? (paddingTop = typeof x === "function" ? x : constant$7(+x), treemap) : paddingTop;
    };

    treemap.paddingRight = function(x) {
      return arguments.length ? (paddingRight = typeof x === "function" ? x : constant$7(+x), treemap) : paddingRight;
    };

    treemap.paddingBottom = function(x) {
      return arguments.length ? (paddingBottom = typeof x === "function" ? x : constant$7(+x), treemap) : paddingBottom;
    };

    treemap.paddingLeft = function(x) {
      return arguments.length ? (paddingLeft = typeof x === "function" ? x : constant$7(+x), treemap) : paddingLeft;
    };

    return treemap;
  }

  function treemapBinary(parent, x0, y0, x1, y1) {
    var nodes = parent.children,
        i, n = nodes.length,
        sum, sums = new Array(n + 1);

    for (sums[0] = sum = i = 0; i < n; ++i) {
      sums[i + 1] = sum += nodes[i].value;
    }

    partition(0, n, parent.value, x0, y0, x1, y1);

    function partition(i, j, value, x0, y0, x1, y1) {
      if (i >= j - 1) {
        var node = nodes[i];
        node.x0 = x0, node.y0 = y0;
        node.x1 = x1, node.y1 = y1;
        return;
      }

      var valueOffset = sums[i],
          valueTarget = (value / 2) + valueOffset,
          k = i + 1,
          hi = j - 1;

      while (k < hi) {
        var mid = k + hi >>> 1;
        if (sums[mid] < valueTarget) k = mid + 1;
        else hi = mid;
      }

      var valueLeft = sums[k] - valueOffset,
          valueRight = value - valueLeft;

      if ((y1 - y0) > (x1 - x0)) {
        var yk = (y0 * valueRight + y1 * valueLeft) / value;
        partition(i, k, valueLeft, x0, y0, x1, yk);
        partition(k, j, valueRight, x0, yk, x1, y1);
      } else {
        var xk = (x0 * valueRight + x1 * valueLeft) / value;
        partition(i, k, valueLeft, x0, y0, xk, y1);
        partition(k, j, valueRight, xk, y0, x1, y1);
      }
    }
  }

  function treemapSliceDice(parent, x0, y0, x1, y1) {
    (parent.depth & 1 ? treemapSlice : treemapDice)(parent, x0, y0, x1, y1);
  }

  var treemapResquarify = (function custom(ratio) {

    function resquarify(parent, x0, y0, x1, y1) {
      if ((rows = parent._squarify) && (rows.ratio === ratio)) {
        var rows,
            row,
            nodes,
            i,
            j = -1,
            n,
            m = rows.length,
            value = parent.value;

        while (++j < m) {
          row = rows[j], nodes = row.children;
          for (i = row.value = 0, n = nodes.length; i < n; ++i) row.value += nodes[i].value;
          if (row.dice) treemapDice(row, x0, y0, x1, y0 += (y1 - y0) * row.value / value);
          else treemapSlice(row, x0, y0, x0 += (x1 - x0) * row.value / value, y1);
          value -= row.value;
        }
      } else {
        parent._squarify = rows = squarifyRatio(ratio, parent, x0, y0, x1, y1);
        rows.ratio = ratio;
      }
    }

    resquarify.ratio = function(x) {
      return custom((x = +x) > 1 ? x : 1);
    };

    return resquarify;
  })(phi);

  /**
    * Nest tuples into a tree structure, grouped by key values.
    * @constructor
    * @param {object} params - The parameters for this operator.
    * @param {Array<function(object): *>} params.keys - The key fields to nest by, in order.
    */
  function Nest(params) {
    Transform.call(this, null, params);
  }

  var prototype$45 = inherits(Nest, Transform);

  function children(n) {
    return n.values;
  }

  prototype$45.transform = function(_, pulse) {
    if (!pulse.source) {
      error('Nest transform requires an upstream data source.');
    }

    if (!this.value || _.modified() || pulse.changed()) {
      var root = array$1(_.keys)
        .reduce(function(n, k) { return (n.key(k), n)}, nest())
        .entries(pulse.source);

      var tree = hierarchy({values: root}, children),
          map = tree.lookup = {};
      tree.each(function(node) { if ('_id' in node.data) map[node.data._id] = node; });
      this.value = tree;
    }

    pulse.source.root = this.value;
  };

  /**
    * Stratify a collection of tuples into a tree structure based on
    * id and parent id fields.
    * @constructor
    * @param {object} params - The parameters for this operator.
    * @param {function(object): *} params.key - Unique key field for each tuple.
    * @param {function(object): *} params.parentKey - Field with key for parent tuple.
    */
  function Stratify(params) {
    Transform.call(this, null, params);
  }

  var prototype$46 = inherits(Stratify, Transform);

  prototype$46.transform = function(_, pulse) {
    if (!pulse.source) {
      error('Stratify transform requires an upstream data source.');
    }

    var run = !this.value
           || _.modified()
           || pulse.changed(pulse.ADD_REM)
           || pulse.modified(_.key.fields)
           || pulse.modified(_.parentKey.fields);

    if (run) {
      var tree = stratify().id(_.key).parentId(_.parentKey)(pulse.source),
          map = tree.lookup = {};
      tree.each(function(node) { map[node.data._id] = node; });
      this.value = tree;
    }

    pulse.source.root = this.value;
  };

  /**
    * Generate tuples representing links between tree nodes.
    * The resulting tuples will contain 'source' and 'target' fields,
    * which point to parent and child node tuples, respectively.
    * @constructor
    * @param {object} params - The parameters for this operator.
    */
  function TreeLinks(params) {
    Transform.call(this, {}, params);
  }

  var prototype$47 = inherits(TreeLinks, Transform);

  function parentTuple(node) {
    var p;
    return node.parent
        && (p=node.parent.data)
        && '_id' in p && p;
  }

  prototype$47.transform = function(_, pulse) {
    if (!pulse.source || !pulse.source.root) {
      error('TreeLinks transform requires a backing tree data source.');
    }

    var root = pulse.source.root,
        nodes = root.lookup,
        links = this.value,
        mods = {},
        out = pulse.fork();

    function modify(id) {
      var link = links[id];
      if (link) mods[id] = 1, out.mod.push(link);
    }

    // process removed tuples
    // assumes that if a parent node is removed the child will be, too.
    pulse.visit(pulse.REM, function(t) {
      var link = links[t._id];
      if (link) delete links[t._id], out.rem.push(link);
    });

    // create new link instances for added nodes with valid parents
    pulse.visit(pulse.ADD, function(t) {
      var id = t._id, p;
      if (p = parentTuple(nodes[id])) {
        out.add.push(links[id] = ingest({source: p, target: t}));
        mods[id] = 1;
      }
    });

    // process modified nodes and their children
    pulse.visit(pulse.MOD, function(t) {
      var id = t._id,
          node = nodes[id],
          kids = node.children;

      modify(id);
      if (kids) for (var i=0, n=kids.length; i<n; ++i) {
        if (!mods[(id=kids[i].data._id)]) modify(id);
      }
    });

    return out;
  };

  var TILES = map$1()
    .set('binary', treemapBinary)
    .set('dice', treemapDice)
    .set('slice', treemapSlice)
    .set('slicedice', treemapSliceDice)
    .set('squarify', treemapSquarify)
    .set('resquarify', treemapResquarify);

  var LAYOUTS = map$1()
    .set('tidy', tree)
    .set('cluster', cluster);

  /**
   * Tree layout generator. Supports both 'tidy' and 'cluster' layouts.
   */
  function treeLayout(method) {
    var m = method || 'tidy';
    if (LAYOUTS.has(m)) return LAYOUTS.get(m)();
    else error('Unrecognized Tree layout method: ' + m);
  }

  /**
   * Treemap layout generator. Adds 'method' and 'ratio' parameters
   * to configure the underlying tile method.
   */
  function treemapLayout() {
    var x = treemap();
    x.ratio = function(_) {
      var t = x.tile();
      if (t.ratio) x.tile(t.ratio(_));
    };
    x.method = function(_) {
      if (TILES.has(_)) x.tile(TILES.get(_));
      else error('Unrecognized Treemap layout method: ' + _);
    };
    return x;
  }

   /**
    * Abstract class for tree layout.
    * @constructor
    * @param {object} params - The parameters for this operator.
    */
  function HierarchyLayout(params) {
    Transform.call(this, null, params);
  }

  var prototype$48 = inherits(HierarchyLayout, Transform);

  prototype$48.transform = function(_, pulse) {
    if (!pulse.source || !pulse.source.root) {
      error(this.constructor.name
        + ' transform requires a backing tree data source.');
    }
    var layout = this.layout(_.method),
        root = pulse.source.root;

    if (_.field) root.sum(_.field);
    if (_.sort) root.sort(_.sort);

    this.setParams(layout, _);
    try {
      this.value = layout(root);
    } catch (err) {
      error(err);
    }
    root.each(this.setFields);

    return pulse.reflow().modifies(this.setParams.fields); // fork?
  };

  /**
   * Compile a function that sets parameters on a layout instance.
   */
  function setParams(params) {
    var code = '', p;
    for (var i=0, n=params.length; i<n; ++i) {
      p = '"' + params[i] + '"';
      code += 'if(' + p + ' in _) layout[' + p + '](_[' + p + ']);'
    }
    return Function('layout', '_', code);
  }

  /**
   * Compile a function that writes layout results to output fields.
   */
  function setFields(fields) {
    var code = 'var t=node.data;'
    for (var i=0, n=fields.length; i<n; ++i) {
      code += 't["' + fields[i] + '"]=node["' + fields[i] + '"];';
    }
    return accessor(Function('node', code), fields);
  }

  /**
   * Tree layout. Depending on the method parameter, performs either
   * Reingold-Tilford 'tidy' layout or dendrogram 'cluster' layout.
   * @constructor
   * @param {object} params - The parameters for this operator.
   */
  function Tree(params) {
    HierarchyLayout.call(this, params);
  }
  inherits(Tree, HierarchyLayout);
  Tree.prototype.layout = treeLayout;
  Tree.prototype.setParams = setParams(['size', 'nodeSize', 'separation']);
  Tree.prototype.setFields = setFields(['x', 'y']);

  /**
   * Treemap layout.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.field - The value field to size nodes.
   */
  function Treemap(params) {
    HierarchyLayout.call(this, params);
  }
  inherits(Treemap, HierarchyLayout);
  Treemap.prototype.layout = treemapLayout;
  Treemap.prototype.setParams = setParams([
    'method', 'ratio', 'size', 'round',
    'padding', 'paddingInner', 'paddingOuter',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'
  ]);
  Treemap.prototype.setFields = setFields(['x0', 'y0', 'x1', 'y1']);

  /**
   * Partition tree layout.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.field - The value field to size nodes.
   */
  function Partition(params) {
    HierarchyLayout.call(this, params);
  }
  inherits(Partition, HierarchyLayout);
  Partition.prototype.layout = partition$2;
  Partition.prototype.setParams = setParams(['size', 'round', 'padding']);
  Partition.prototype.setFields = Treemap.prototype.setFields;

  /**
   * Packed circle tree layout.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.field - The value field to size nodes.
   */
  function Pack(params) {
    HierarchyLayout.call(this, params);
  }
  inherits(Pack, HierarchyLayout);
  Pack.prototype.layout = pack$1;
  Pack.prototype.setParams = setParams(['size', 'padding']);
  Pack.prototype.setFields = setFields(['x', 'y', 'r']);

  exports.Tuple = Tuple;
  exports.version = version;
  exports.UniqueList = UniqueList;
  exports.changeset = changeset;
  exports.Dataflow = Dataflow;
  exports.EventStream = EventStream;
  exports.Parameters = Parameters;
  exports.Pulse = Pulse;
  exports.MultiPulse = MultiPulse;
  exports.Operator = Operator;
  exports.Transform = Transform;
  exports.Apply = Apply;
  exports.Bin = Bin;
  exports.Collect = Collect;
  exports.Compare = Compare;
  exports.CountIndex = CountIndex;
  exports.CountPattern = CountPattern;
  exports.Extent = Extent;
  exports.Facet = Facet;
  exports.Field = Field;
  exports.Filter = Filter;
  exports.Fold = Fold;
  exports.Generate = Generate;
  exports.Impute = Impute;
  exports.Lookup = Lookup;
  exports.MultiExtent = MultiExtent;
  exports.NoOp = NoOp;
  exports.Params = Params;
  exports.Range = Range;
  exports.Rank = Rank;
  exports.Reflow = Reflow;
  exports.Relay = Relay;
  exports.Sample = Sample;
  exports.Sieve = Sieve;
  exports.Subflow = Subflow;
  exports.TupleIndex = TupleIndex;
  exports.Values = Values;
  exports.Aggregate = Aggregate;
  exports.CrossFilter = CrossFilter;
  exports.ResolveFilter = ResolveFilter;
  exports.AxisTicks = AxisTicks;
  exports.DataJoin = DataJoin;
  exports.Encode = Encode;
  exports.Scale = Scale;
  exports.scales = scales;
  exports.schemes = schemes;
  exports.Force = Force;
  exports.LinkPath = LinkPath;
  exports.Pie = Pie;
  exports.Stack = Stack;
  exports.Voronoi = Voronoi;
  exports.GeoPath = GeoPath;
  exports.GeoPoint = GeoPoint;
  exports.Graticule = Graticule;
  exports.Projection = Projection;
  exports.projections = projections;
  exports.Nest = Nest;
  exports.Stratify = Stratify;
  exports.TreeLinks = TreeLinks;
  exports.Pack = Pack;
  exports.Partition = Partition;
  exports.Tree = Tree;
  exports.Treemap = Treemap;
  exports.bin = bin;
  exports.bootstrapCI = bootstrapCI;
  exports.randomInteger = integer;
  exports.randomNormal = normal;
  exports.randomUniform = uniform;
  exports.quartiles = quartiles;
  exports.accessor = accessor;
  exports.accessorName = accessorName;
  exports.accessorFields = accessorFields;
  exports.id = id;
  exports.identity = identity$1;
  exports.zero = zero;
  exports.one = one;
  exports.truthy = truthy;
  exports.falsy = falsy;
  exports.logger = logger;
  exports.None = None;
  exports.Warn = Warn;
  exports.Info = Info;
  exports.Debug = Debug;
  exports.array = array$1;
  exports.compare = compare;
  exports.constant = constant$1;
  exports.error = error;
  exports.extend = extend;
  exports.extentIndex = extentIndex;
  exports.field = field;
  exports.inherits = inherits;
  exports.isArray = isArray;
  exports.isFunction = isFunction;
  exports.isNumber = isNumber;
  exports.isObject = isObject;
  exports.isString = isString;
  exports.merge = merge$1;
  exports.splitAccessPath = splitAccessPath;
  exports.stringValue = $;
  exports.toSet = toSet;
  exports.visitArray = visitArray;

  Object.defineProperty(exports, '__esModule', { value: true });

}));