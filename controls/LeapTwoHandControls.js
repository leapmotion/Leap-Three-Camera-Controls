/**
*
*  Do it all
*
*/

(function () {
  var PI_2 = Math.PI * 2;
  
  THREE.LeapTwoHandControls = function (cameraModel, object, controller) {
    
    this.object = object;
    this.controller = controller;
    this.cameraModel = cameraModel;
    this.anchorDelta = 1;
    
    this.translationSpeed = 2;
    this.rotationSpeed = 1;
    this.pinchThreshold = 0.5;
    this.transSmoothing = 0.8;
    this.rotationSmoothing = 0.2;
    
    this.vector = new THREE.Vector3();
    this.transLP = new LowPassFilter(this.transSmoothing, 3);
    this.rotLP = new LowPassFilter(this.rotationSmoothing, 3);
  }
  
  var Proto = THREE.LeapTwoHandControls.prototype;
  
  Proto.update = function() {
    
    // Just incase this is overwritten somewhere else in the code
    this.object.matrixAutoUpdate = true;
    
    var self = this;
    var frame = this.controller.frame();
    var anchorFrame = this.controller.frame(this.anchorDelta);

    // do we have a frame
    if (!frame || !frame.valid || !anchorFrame || !anchorFrame.valid) {
      return;
    }
    
    // match hands to anchors
    var rawHands = frame.hands;
    var rawAnchorHands = anchorFrame.hands;
    
    var hands = [];
    var anchorHands = [];
    
    rawHands.forEach(function (hand, hIdx) {
      var anchorHand = anchorFrame.hand(hand.id);
      if (anchorHand.valid) {
        hands.push(hand);
        anchorHands.push(anchorHand);
      }
    });
    
    if (hands.length) {
      // translation
      if (this.shouldTranslate(anchorHands, hands)) {
        this.applyTranslation(anchorHands, hands);
      }
      
      // rotation
      if (this.shouldRotate(anchorHands, hands)) {
        this.applyRotation(anchorHands, hands);
      }
      
      // scale
      if (this.shouldScale(anchorHands, hands)) {
        this.applyScale(anchorHands, hands);
      }
    }
  }
  
  Proto.shouldTranslate = function (anchorHands, hands) {
    var isEngaged = this.isEngaged.bind(this);
    return hands.length < 2 && hands.some(isEngaged);
  }
  
  Proto.shouldRotate = function (anchorHands, hands) {
    var isEngaged = this.isEngaged.bind(this);
    return hands.length >= 2 && hands.every(isEngaged) && anchorHands.every(isEngaged);
  }
  
  Proto.shouldScale = function (anchorHands, hands) {
    var isEngaged = this.isEngaged.bind(this);
    return hands.length >= 2 && hands.every(isEngaged) && anchorHands.every(isEngaged);
  }
  
  Proto.applyTranslation = function (anchorHands, hands) {
    var isEngaged = this.isEngaged.bind(this);
    var translation = this.getTranslation(
                                anchorHands.filter(isEngaged),
                                hands.filter(isEngaged));
    
    translation = this.transLP.sample(translation);
    
    this.vector.fromArray(translation);
    this.vector.multiplyScalar(this.translationSpeed);
    this.vector.negate();
    this.cameraModel.translate(this.vector, true);
  }
  
  Proto.applyRotation = function (anchorHands, hands) {
    var rotation = this.getRotation(anchorHands, hands);
    rotation = this.rotLP.sample(rotation);
    this.vector.fromArray(rotation);
    this.vector.multiplyScalar(this.rotationSpeed);
    this.vector.negate();
    // this.cameraModel.rotate(this.vector, true);
    this.cameraModel.orbit(this.vector, true);
  }
  
  Proto.applyScale = function (anchorHands, hands) {
    var scale = this.getScale(anchorHands, hands);
    this.cameraModel.eyeDistance((1 - scale[3]), false);
  }
  
  Proto.getTranslation = function(anchorHands, hands) {
    if (anchorHands.length != hands.length) {
      return [0, 0, 0];
    }
    var centerAnchor = getCenter(anchorHands);
    var centerCurrent = getCenter(hands);
    return [
      centerCurrent[0] - centerAnchor[0],
      centerCurrent[1] - centerAnchor[1],
      centerCurrent[2] - centerAnchor[2]
    ];
  }
  
  Proto.getRotation = function(anchorHands, hands) {
    if (hands.length < 1 || anchorHands.length < 1
        || hands.length != anchorHands.length) {
      return [0, 0, 0];
    }

    var am = getAxisMag(hands);
    if (am[3] < 6000) {
      return [0, 0, 0];
    }
    var mi = 1 / am[3];
    am[0]*=mi;
    am[1]*=mi;
    am[2]*=mi;
  
    var anchorAngles = getAngles(anchorHands);
    var angles = getAngles(hands);
  
    var dx = angles[0] - anchorAngles[0];
    var dy = angles[1] - anchorAngles[1];
    var dz = angles[2] - anchorAngles[2];
  
    if (dx > Math.PI) dx = dx - PI_2;
    else if (dx < -Math.PI) dx = dx + PI_2;
    if (dy > Math.PI) dy = dy - PI_2;
    else if (dy < -Math.PI) dy = dy + PI_2;
    if (dz > Math.PI) dz = dz - PI_2;
    else if (dz < -Math.PI) dz = dz + PI_2;

    return [dx * am[0], dy * am[1], dz * am[2]];
  }
  
  Proto.getScale = function(anchorHands, hands) {
    if (hands.length < 2 || anchorHands.length < 2) {
      return [1, 1, 1, 1];
    }
    
    var centerAnchor = getCenter(anchorHands);
    var centerCurrent = getCenter(hands);
    var aveRadiusAnchor = aveDistance(centerAnchor, anchorHands);
    var aveRadiusCurrent = aveDistance(centerCurrent, hands);
    
    // scale of current over previous
    return [
      aveRadiusCurrent[0] / aveRadiusAnchor[0],
      aveRadiusCurrent[1] / aveRadiusAnchor[1],
      aveRadiusCurrent[2] / aveRadiusAnchor[2],
      length(aveRadiusCurrent) / length(aveRadiusAnchor)
    ];
  }
  
  Proto.isEngaged = function(h) {
    return h && (h.pinchStrength > this.pinchThreshold);
  }
  
  function getCenter(hands) {
    var l = hands.length;
    if (l == 0) {
      return [0, 0, 0];
    } else if (l == 1) {
      return hands[0].palmPosition;
    }
    
    var x = y = z = 0;
    hands.forEach(function (hand, i) {
      x += hand.palmPosition[0];
      y += hand.palmPosition[1];
      z += hand.palmPosition[2];
    });
    return [x/l, y/l, z/l];
  }
  
  function aveDistance(center, hands) {
    var aveDistance = [0, 0, 0];
    hands.forEach(function (hand) {
      var p = hand.palmPosition;
      aveDistance[0] += Math.abs(p[0] - center[0]);
      aveDistance[1] += Math.abs(p[1] - center[1]);
      aveDistance[2] += Math.abs(p[2] - center[2]);
    });
    aveDistance[0] /= hands.length;
    aveDistance[1] /= hands.length;
    aveDistance[2] /= hands.length;
    return aveDistance;
  }
  
  function length(arr) {
    var sum = 0;
    arr.forEach(function (v) {
      sum += v * v;
    });
    return Math.sqrt(sum);
  }

  function getAngles(hands) {
    if (hands.length == 0) {
      return [0, 0, 0];
    }
  
    var pos1;
    var hand = hands[0];
    if (hands.length > 1) {
      pos1 = hands[1].palmPosition;
    } else {
      pos1 = hand.frame.interactionBox.center;
    }
  
    var pos2 = hand.palmPosition;
  
    var dx = pos2[0] - pos1[0];
    var dy = pos2[1] - pos1[1];
    var dz = pos2[2] - pos1[2];

    var ax = Math.atan2(dz, dy);
    var ay = Math.atan2(dx, dz);
    var az = Math.atan2(dy, dx);
    return [ax, ay, az];
  }

  function getAxisMag(hands) {
    if (hands.length == 0) {
      return [0, 0, 0, 0];
    }
  
    var pos1;
    var hand = hands[0];
    if (hands.length > 1) {
      pos1 = hands[1].palmPosition;
    } else {
      pos1 = hand.frame.interactionBox.center;
    }
  
    var pos2 = hand.palmPosition;
  
    var dx = pos2[0] - pos1[0];
    var dy = pos2[1] - pos1[1];
    var dz = pos2[2] - pos1[2];
    var mag = dx * dx + dy * dy + dz * dz;
  
    var ax = dy * dy + dz * dz;
    var ay = dx * dx + dz * dz;
    var az = dy * dy + dx * dx;
  
    return [ax, ay, az, mag];
  }

  function LowPassFilter(cutoff, size) {
    var isArray = size > 1;
    var accumulator = isArray ? fill(new Array(size), 0) : 0;
    this.sample = isArray ? sampleArr : sampleSca;
    
    
    this.setCutoff = function (value) {
      cutoff = value;
    };
    
    function fill(arr, val) {
      for (var i = 0; i < arr.length; i++) {
        arr[i] = val;
      }
      return arr;
    }
    
    function sampleSca(sample) {
      accumulator += (sample - accumulator) * cutoff;
      return accumulator;
    }
  
    function sampleArr(sample) {
      accumulator.forEach(function (v, i) {
        accumulator[i] += (sample[i] - v) * cutoff;
      });
      return accumulator;
    }
  }

}());
