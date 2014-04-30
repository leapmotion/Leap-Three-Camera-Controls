var LeapCameraControls, Activations, Interpreters, Mappings, Control;

(function () {
  var CONTROLS = {
    // 'eyelook': THREE.LeapEyeLookControls,
    // 'paddle': THREE.LeapPaddleControls,
    // 'pinchrotate': THREE.LeapPinchRotateControls,
    // 'pointer': THREE.LeapPointerControls,
    // 'spring': THREE.LeapSpringControls,
    // 'trackball': THREE.LeapTrackballControls,
    // 'twohand': THREE.LeapTwoHandControls,
    // 'weight': THREE.LeapWeightControls
    // translate: 
    // rotate: 
    // orbit: 
    // eyeDistance: 
    // lookDistance: 
  };
    
  LeapCameraControls = function (camera, controller, scene) {
    this.camera = camera;
    this.controller = controller;
    this.scene = scene;
    this.cameraModel = new CameraModel(camera);
    
    this.controls = {};
    
    // var args = Array.prototype.slice.call(arguments, 3, arguments.length);
    // for (var i = 0; i < args.length; i++) {
    //   this.enable(args[i]);
    // }
  }
  
  LeapCameraControls.prototype = {
    controlNames: function () {
      return Object.keys(CONTROLS);
    },
    
    // enable: function (control) {
    //   if (!(control in CONTROLS)) {
    //     console.warn('invalid control name', control);
    //     return;
    //   }
    //   if (control in this.controls) {
    //     console.warn('control already enabled', control);
    //     return;
    //   }
    //   
    //   this.controls[control] = new CONTROLS[control](this.cameraModel, this.camera, this.controller, this.scene);
    // },
    // 
    // disable: function (control) {
    //   if (!(control in CONTROLS)) {
    //     console.warn('invalid control name', control);
    //     return;
    //   }
    //   if (!(control in this.controls)) {
    //     console.warn('control not enabled', control);
    //     return;
    //   }
    //   
    //   delete this.controls[control];
    // },
    
    add: function (name, control) {
      this.controls[name] = control;
    },
    
    update: function () {
      for (var k in this.controls) {
        var c = this.controls[k];
        var vec = c.update(this.controller);
        this.cameraModel[c.mapping](vec, true);
      }
      
      this.cameraModel.step();
    }
  }
  
  var STEP_SIZE = 0.1;
  
  var tmpVec = new THREE.Vector3();
  var tmpEuler = new THREE.Euler();
  var tmpQuat = new THREE.Quaternion();
  
  CameraModel = function CameraModel(threeCam) {
    this.threeCam = threeCam;
    
    this.position = threeCam.position.clone();
    this.lookAt = new THREE.Vector3(0, 0, -1);
    this.up = threeCam.up.clone();
    
    this.vecTranslate = new THREE.Vector3();
    this.vecRotate = new THREE.Vector3();
    this.vecOrbit = new THREE.Vector3();
    this.eyeDist = 0;
    this.lookDist = 0;
    
    this.decayTranslate = 0.9;
    this.decayRotate = 0.9;
    this.decayOrbit = 0.9;
    this.decayEyeDist = 0.9;
    this.decayLookDist = 0.9;
  };

  CameraModel.prototype = {    
    translate: function (vector, isDelta) {
      tmpVec.copy(vector).applyQuaternion(this.threeCam.quaternion);
      this.updateVec(this.vecTranslate, tmpVec, isDelta);
    },
    
    rotate: function (vector, isDelta) {
      tmpVec.copy(vector).applyQuaternion(this.threeCam.quaternion);
      this.updateVec(this.vecRotate, tmpVec, isDelta);
    },
    
    orbit: function (vector, isDelta) {
      tmpVec.copy(vector).applyQuaternion(this.threeCam.quaternion);
      this.updateVec(this.vecOrbit, tmpVec, isDelta);
    },
    
    eyeDistance: function (distance, isDelta) {
      if (isDelta) {
        this.eyeDist += distance;
      } else {
        this.eyeDist = distance;
      }
    },
    
    lookDistance: function (distance, isDelta) {
      if (isDelta) {
        this.lookDist += distance;
      } else {
        this.lookDist = distance;
      }
    },
    
    updateVec: function (vec, values, isDelta) {
      if (isDelta) {
        vec.add(values);
      } else {
        vec.copy(values);
      }
    },
    
    step: function () {
      this.stepTranslation();
      this.stepRotation();
      this.stepOrbit();
      this.stepEyeDistance();
      this.stepLookDistance();

      this.threeCam.position.copy(this.position);
      this.threeCam.up.copy(this.up);
      this.threeCam.lookAt(this.lookAt);
    },
    
    stepTranslation: function () {
      this.vecTranslate.multiplyScalar(this.decayTranslate);
      tmpVec.copy(this.vecTranslate).multiplyScalar(STEP_SIZE);
      this.position.add(tmpVec);
      this.lookAt.add(tmpVec);
    },
    
    stepRotation: function () {
      this.vecRotate.multiplyScalar(this.decayRotate);
      
      tmpEuler.set(this.vecRotate.x, this.vecRotate.y, this.vecRotate.z, 'XYZ');
      tmpQuat.setFromEuler(tmpEuler);
      
      tmpVec.subVectors(this.lookAt, this.position).applyQuaternion(tmpQuat);
      this.lookAt.addVectors(this.position, tmpVec);
      this.up.applyQuaternion(tmpQuat);
    },
    
    stepOrbit: function () {
      this.vecOrbit.multiplyScalar(this.decayOrbit);
      
      tmpEuler.set(this.vecOrbit.x, this.vecOrbit.y, this.vecOrbit.z, 'XYZ');
      tmpQuat.setFromEuler(tmpEuler);
      
      tmpVec.subVectors(this.position, this.lookAt).applyQuaternion(tmpQuat);
      this.position.addVectors(this.lookAt, tmpVec);
      this.up.applyQuaternion(tmpQuat);
    },
    
    stepEyeDistance: function () {
      this.eyeDist *= this.decayEyeDist;
      tmpVec.subVectors(this.position, this.lookAt).multiplyScalar(1 + this.eyeDist);
      this.position.addVectors(this.lookAt, tmpVec);
    },
    
    stepLookDistance: function () {
      this.lookDist *= this.decayLookDist;
      tmpVec.subVectors(this.lookAt, this.position).multiplyScalar(1 + this.lookDist);
      this.lookAt.addVectors(this.position, tmpVec);
    }
  }
  
  Control = function (activation, interpreter, mapping) {
    this.activation = activation;
    this.interpreter = interpreter;
    this.mapping = mapping;
    this.vec = new THREE.Vector3();
  }
  
  Control.prototype = {
    update: function (controller) {
      prepareFrame.call(this, controller);
      var magnitude = this.activation(this.hands, this.anchorHands);
      var vector = this.interpreter(this.hands, this.anchorHands);
      this.vec.fromArray(vector).multiplyScalar(magnitude).negate();
      return this.vec;
    }
  }
  
  // map vec to vec
  // map vec component to scalar
  // map vec component to vec component
  // map scalar to scalar
  // map scalar to vec component
  // 
  // map translate
  // map x lookAtDist
  // map y rotate.z
  // map yxz rotate.zyx
  // map orbit.yzx
  // map eyeDist
  // map rotate.y
  // 
  // function map(value, target) {
  //   var dSwiz = ['x', 'y', 'z'];
  //   var isScalar = typeof(value) == 'number';
  //   var parts = target.split(' ');
  //   var inject, eSwiz, iParts, iName;
  //   
  //   if (parts.length > 1) {
  //     eSwiz = parts[0].split('');
  //     inject = parts[1];
  //   } else {
  //     inject = parts[0];
  //   }
  //   
  //   iParts = inject.split('.');
  //   iName = iParts[0];
  //   
  //   if (iParts.length > 1) {
  //     iSwiz = iParts[1].split('');
  //   }
  //   
  //   if (isScalar) {
  //     if (iSwiz) {
  //       tmpVec.set(0,0,0);
  //       iSwiz.forEach(v, i) {
  //         tmpVec[v] = value;
  //       }
  //       return [iName, tmpVec];
  //     }
  //     return [iName, value];
  //   }
  //   
  //   if (eSwiz) {
  //     if (eSwiz.length > 1) {
  //       tmpVec.set(0,0,0);
  //       eSwiz.forEach(v, i) {
  //         tmpVec[iSwiz[i]||dSwiz[i]] = value[v];
  //       }
  //       return [iName, tmpVec];
  //     }
  //     if (iSwiz) {
  //       tmpVec.set(0,0,0);
  //       iSwiz.forEach(v, i) {
  //         tmpVec[v] = value[eSwiz[0]];
  //       }
  //       return [iName, tmpVec];
  //     }
  //     
  //   }
    
    
    
  }
  
  Mappings = {
    translate: function (order) {
      var ord = order.split('');
      return function (value) {
        if (typeof(value) == 'number') {
          
        }
      }
    }
    rotate:
    orbit:
    eye:
    look:
  };
  
  Activations = {
    pinch: function (multiplier) {
      return function (hands, anchorHands) {
        return hands.length ? hands[0].pinchStrength * multiplier : 0;
      }
    },
    
    inversePinch: function (multiplier) {
      return function (hands, anchorHands) {
        return hands.length ? (1 - hands[0].pinchStrength) * multiplier : 0;
      }
    }
  }
  
  Interpreters = {
    palmPosition: function () {
      return function (hands, anchorHands) {
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
    },
    
    palmOrbit: function () {
      return function (hands, anchorHands) {
        if (hands.length < 1 || anchorHands.length < 1
            || hands.length != anchorHands.length) {
          return [0, 0, 0];
        }

        var am = getAxisMag(hands);
        // if (am[3] < 6000) {
        //   return [0, 0, 0];
        // }
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
    },
    
    palmScale: function () {
      return function(hands, anchorHands) {
        if (hands.length < 1 || anchorHands.length != hands.length) {
          return [1, 1, 1, 1];
        }
    
        var centerAnchor = getCenter(anchorHands, true);
        var centerCurrent = getCenter(hands, true);
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
    }
  }
  
  function prepareFrame(controller) {
    var frame = controller.frame();
    var anchorFrame = controller.frame(1);
  
    var hands = [];
    var anchorHands = [];
    this.hands = hands;
    this.anchorHands = anchorHands;
    
    // do we have a frame
    if (!frame || !frame.valid || !anchorFrame || !anchorFrame.valid) {
      return;
    }
  
    // match hands to anchors
    var rawHands = frame.hands;
    var rawAnchorHands = anchorFrame.hands;
  
  
    rawHands.forEach(function (hand, hIdx) {
      var anchorHand = anchorFrame.hand(hand.id);
      if (anchorHand.valid) {
        hands.push(hand);
        anchorHands.push(anchorHand);
      }
    });
  }

  var PI_2 = Math.PI * 2;
  
  function getCenter(hands, useIb) {
    var l = hands.length;
    if (l == 0) {
      return [0, 0, 0];
    } else if (l == 1) {
      return useIb ? hand.frame.interactionBox.center : hands[0].palmPosition;
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
}());