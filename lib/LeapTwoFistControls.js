/**
*
*  Grab space with your hands
*
*/

THREE.LeapTwoFistControls = (function () {
  
  var MIN_ROT_MAG_SQ = 0.4;
  var X_AXIS = new THREE.Vector3(1, 0, 0);
  var Y_AXIS = new THREE.Vector3(0, 1, 0);
  var Z_AXIS = new THREE.Vector3(0, 0, 1);
  
  var LeapTwoFistControls = function (object, controller, invert) {
    this.object = object;
    this.controller = controller;
    this.anchorHands = [];
    this.vector = new THREE.Vector3();
    this.vector2 = new THREE.Vector3();
    this.matrix = new THREE.Matrix4();
    this.quaternion = new THREE.Quaternion();
    this.rotationMomentum = new THREE.Quaternion();
    this.translationMomentum = new THREE.Vector3();
    this.scaleMomentum = new THREE.Vector3(1, 1, 1);
    this.rotationMomentum = this.object.quaternion.clone();
    this.invert = invert || false;
  }
  
  LeapTwoFistControls.prototype.update = function() {
    var self = this;
    var frame = this.controller.frame();

    // do we have a frame
    if (!frame || !frame.valid) {
      return;
    }
    
    // match hands to anchors
    // remove hands that have disappeared
    // add hands that have appeared
    var anchorHands = this.anchorHands;
    var filteredHands = frame.hands.filter(function (h) {
      return h.valid && self.isFist(h);
    });
    
    var aHands = [];
    var persistentHands = [];
    
    filteredHands.forEach(function (hand, hIdx) {
      var matched = false;
      anchorHands.some(function (anchorHand, ahIdx) {
        if (anchorHand.id == hand.id) {
          persistentHands.push(hand);
          aHands.push(anchorHand);
          matched = true
        }
        return matched;
      });
    });
    
    if (persistentHands.length) {
    
      var translation = this.getTranslation(aHands, persistentHands);
      var scale = this.getScale(aHands, persistentHands);
      var rotation = this.getRotation(aHands, persistentHands);
      
      // console.log("trans:", translation);
      // console.log("scale:", scale);
      // console.log("rotation:", rotation);

      // scale
      this.scaleMomentum.multiplyScalar(scale[3]);
      
      // rotation
      this.vector.fromArray(rotation);
      if (this.invert) {
        this.vector.negate();
      }
      
      // this.vector2.copy(X_AXIS);
      // this.quaternion.copy(this.rotationMomentum).inverse();
      // this.vector2.applyQuaternion(this.quaternion);
      // this.quaternion.setFromAxisAngle(this.vector2, this.vector.x);
      // this.rotationMomentum.multiply(this.quaternion);

      this.vector2.copy(Y_AXIS);
      this.quaternion.copy(this.rotationMomentum).inverse();
      this.vector2.applyQuaternion(this.quaternion);
      this.quaternion.setFromAxisAngle(this.vector2, this.vector.y);
      this.rotationMomentum.multiply(this.quaternion);

      this.vector2.copy(Z_AXIS);
      this.quaternion.copy(this.rotationMomentum).inverse();
      this.vector2.applyQuaternion(this.quaternion);
      this.quaternion.setFromAxisAngle(this.vector2, this.vector.z);
      this.rotationMomentum.multiply(this.quaternion);
      
      this.rotationMomentum.normalize();

      // translation
      
      this.vector.fromArray(translation);
      if (this.invert) {
        this.vector.negate();
      }
      this.translationMomentum.add(this.vector);
    }
    
    // set reference for next frame
    this.anchorHands = filteredHands;
    
    // translation
    this.object.position.add(this.translationMomentum);
    this.translationMomentum.multiplyScalar(0.9);
    
    // rotation
    this.object.quaternion.slerp(this.rotationMomentum, 0.2);
    this.object.quaternion.normalize();
    
    // scale
    this.object.scale.lerp(this.scaleMomentum, 0.5);
  }
  
  LeapTwoFistControls.prototype.isFist = function (hands) {
    return hands.fingers.length == 0;
  }
  
  LeapTwoFistControls.prototype.getCenter = function(hands) {
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
  
  LeapTwoFistControls.prototype.getTranslation = function(anchorHands, hands) {
    if (anchorHands.length != hands.length) {
      return [0, 0, 0];
    }
    var centerAnchor = this.getCenter(anchorHands);
    var centerCurrent = this.getCenter(hands);
    return [
      centerCurrent[0] - centerAnchor[0],
      centerCurrent[1] - centerAnchor[1],
      centerCurrent[2] - centerAnchor[2]
    ];
  }
  
  LeapTwoFistControls.prototype.getScale = function(anchorHands, hands) {
    if (hands.length < 2 || anchorHands.length < 2) {
      return [1, 1, 1, 1];
    }
    
    var centerAnchor = this.getCenter(anchorHands);
    var centerCurrent = this.getCenter(hands);
    var aveRadiusAnchor = aveDistance(centerAnchor, anchorHands);
    var aveRadiusCurrent = aveDistance(centerCurrent, hands);
    
    // console.log(aveRadiusAnchor)
    // console.log(aveRadiusCurrent)
    // scale of current over previous
    return [
      aveRadiusCurrent[0] / aveRadiusAnchor[0],
      aveRadiusCurrent[1] / aveRadiusAnchor[1],
      aveRadiusCurrent[2] / aveRadiusAnchor[2],
      length(aveRadiusCurrent) / length(aveRadiusAnchor)
    ];
  }
  
  LeapTwoFistControls.prototype.getRotation = function(anchorHands, hands) {
    if (hands.length < 2 || anchorHands.length < 2) {
      return [0, 0, 0];
    }
    
    var anchorAngles = getAngles(anchorHands);
    var angles = getAngles(hands);
    
    return [
      angles[0] - anchorAngles[0],
      angles[1] - anchorAngles[1],
      angles[2] - anchorAngles[2]
    ];
  }
  
  function getAngles(hands) {
    var pos1 = hands[0].palmPosition;
    var pos2 = hands[1].palmPosition;
    
    var dx = pos2[0] - pos1[0];
    var dy = pos2[1] - pos1[1];
    var dz = pos2[2] - pos1[2];
    var mag = dx * dx + dy * dy + dz * dz;
    
    var ax = (dz * dz + dy * dy) / mag > MIN_ROT_MAG_SQ ? Math.atan2(dz, dy) : 0;
    var ay = (dx * dx + dz * dz) / mag > MIN_ROT_MAG_SQ ? Math.atan2(dx, dz) : 0;
    var az = (dy * dy + dx * dx) / mag > MIN_ROT_MAG_SQ ? Math.atan2(dy, dx) : 0;
    
    return [ax, ay, az];
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
  
  function dist(arr1, arr2) {
    var sum = 0;
    arr1.forEach(function (v, i) {
      var d = v - arr2[i];
      sum += d * d;
    });
    return Math.sqrt(sum);
  }
  
  return LeapTwoFistControls;
}());
