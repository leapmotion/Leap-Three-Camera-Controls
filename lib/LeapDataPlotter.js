var LeapDataPlotter;
var TimeSeries;
(function () {

  LeapDataPlotter = function (context2d) {
    this.series = [];
    this.context = context2d;
    this.init();
  }

  LeapDataPlotter.prototype.init = function() {
    // finally query the various pixel ratios
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
    
      context.scale(ratio, ratio);
    }
  }

  LeapDataPlotter.prototype.addSeries = function(opts, fun) {
    opts = opts || {};
    opts.frameHandler = fun;
    opts.y = this.series.length * 50;
    opts.width = windowWidth;
  
    var ts = new TimeSeries(opts);
    this.series.push(ts);
    return ts;
  }

  TimeSeries = function (opts) {
    opts = opts || {};
    this.x = opts.x || 0;
    this.y = opts.y || 0;
    this.width = opts.width || 1000;
    this.height = opts.height || 50;
    this.length = opts.length || 1000;
    this.color = opts.color || '#000';
    this.frameHandler = opts.frameHandler;
  
    this.max = -Infinity;
    this.min = Infinity;
    this.data = [];
  }

  TimeSeries.prototype.onFrame = function (frame) {
    this.frameHandler && this.frameHandler(frame);
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
