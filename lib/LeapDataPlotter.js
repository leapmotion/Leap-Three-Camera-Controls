var LeapDataPlotter;
var TimeSeries;
(function () {

  var colors = ['#900', '#090', '#009', '#990', '#909', '#099'];
  var colorIndex = 0;
  
  LeapDataPlotter = function () {
    this.seriesHash = {};
    this.series = [];
    this.init();
  }

  LeapDataPlotter.prototype.init = function() {

    var canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    this.canvas = canvas;
    this.context = canvas.getContext('2d');


    var styles = getComputedStyle(document.body);
    var windowWidth = parseInt(styles.width);
    var windowHeight = parseInt(styles.height);
    this.width = windowWidth;
    this.height = windowHeight;

    canvas.setAttribute('width', windowWidth);
    canvas.setAttribute('height', windowHeight);
    console.log(canvas.attributes.width, canvas.attributes.height);
    
    
    var devicePixelRatio = window.devicePixelRatio || 1;
    var backingStoreRatio = this.context.webkitBackingStorePixelRatio ||
                            this.context.mozBackingStorePixelRatio ||
                            this.context.msBackingStorePixelRatio ||
                            this.context.oBackingStorePixelRatio ||
                            this.context.backingStorePixelRatio || 1;
    
    var ratio = devicePixelRatio / backingStoreRatio;
    if (devicePixelRatio !== backingStoreRatio) {
    
      var oldWidth = canvas.width;
      var oldHeight = canvas.height;
    
      canvas.width = oldWidth * ratio;
      canvas.height = oldHeight * ratio;
    
      canvas.style.width = oldWidth + 'px';
      canvas.style.height = oldHeight + 'px';
    
      this.context.scale(ratio, ratio);
    }
  }

  LeapDataPlotter.prototype.plot = function (id, data) {
    if (data.length) {
      for (var i = 0, c = 120; i < data.length; i++, c=++c>122?97:c) {
        this.getTimeSeries(id+'.'+String.fromCharCode(c)).push(data[i]);
      }
    } else {
      this.getTimeSeries(id).push(data);
    }
  }
  
  LeapDataPlotter.prototype.getTimeSeries = function (id) {
    var ts = this.seriesHash[id];
    if (!ts) {
      var opts = this.getOptions(id);
      ts = new TimeSeries(opts);
      this.series.push(ts);
      this.seriesHash[id] = ts;
    }
    return ts;
  }
  
  LeapDataPlotter.prototype.getOptions = function (name) {
    var c = colorIndex;
    colorIndex = (colorIndex + 1) % colors.length;
    return {
      y: this.series.length * 50,
      width: this.width,
      color: colors[c],
      name: name
    }
  }
  
  LeapDataPlotter.prototype.clear = function() {
    this.context.clearRect(0, 0, this.width, this.height);
  }

  LeapDataPlotter.prototype.draw = function(frame) {
    var context = this.context;
    this.series.forEach(function (s) {
      s.draw(context);
    });
  }
  
  TimeSeries = function (opts) {
    opts = opts || {};
    this.x = opts.x || 0;
    this.y = opts.y || 0;
    this.width = opts.width || 1000;
    this.height = opts.height || 50;
    this.length = opts.length || 1000;
    this.color = opts.color || '#000';
    this.name = opts.name || "";
    this.frameHandler = opts.frameHandler;
  
    this.max = -Infinity;
    this.min = Infinity;
    this.data = [];
  }

  TimeSeries.prototype.push = function (value) {
    this.data.push(value);
  
    if (this.data.length >= this.length) {
      this.data.shift();
    }
  }

  TimeSeries.prototype.draw = function (context) {
    var self = this;
    var xScale = (this.width - 10) / (this.length - 1);
    var yScale = -(this.height - 10) / (this.max - this.min);
  
    context.save();
    context.strokeRect(this.x, this.y, this.width, this.height);
    context.translate(this.x, this.y + this.height - 5);
    context.strokeStyle = this.color;
    context.fillText(this.name, 5, -(this.height - 10) * 0.5);
    context.fillText(this.min.toPrecision("5"), this.width - 50, 0);
    context.fillText(this.max.toPrecision("5"), this.width - 50, (this.max - this.min) * yScale + 10);
    context.beginPath();

    var max = -Infinity;
    var min = Infinity;
    this.data.forEach(function (d, i) {
      if (d > max) max = d;
      if (d < min) min = d;
    
      if (isNaN(d)) {
        context.stroke();
        context.beginPath();
      } else {
        context.lineTo(i * xScale, (d - self.min) * yScale);
      }
    });
    context.stroke();
    context.restore();
    this.min = min;
    this.max = max;
  }
}());
