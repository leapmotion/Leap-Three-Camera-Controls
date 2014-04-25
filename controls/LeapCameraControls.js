var LeapCameraControls;

(function () {
  var CONTROLS = {
    'eyelook': THREE.LeapEyeLookControls,
    'paddle': THREE.LeapPaddleControls,
    'pinchrotate': THREE.LeapPinchRotateControls,
    'pointer': THREE.LeapPointerControls,
    'spring': THREE.LeapSpringControls,
    'trackball': THREE.LeapTrackballControls,
    'twohand': THREE.LeapTwoHandControls,
    'weight': THREE.LeapWeightControls
  };
    
  LeapCameraControls = function (camera, controller, scene) {
    this.camera = camera;
    this.controller = controller;
    this.scene = scene;
    this.cameraModel = new CameraModel(camera);
    
    this.controls = {};
    
    var args = Array.prototype.slice.call(arguments, 3, arguments.length);
    for (var i = 0; i < args.length; i++) {
      this.enable(args[i]);
    }
  }
  
  LeapCameraControls.prototype = {
    controlNames: function () {
      return Object.keys(CONTROLS);
    },
    
    enable: function (control) {
      if (!(control in CONTROLS)) {
        console.warn('invalid control name', control);
        return;
      }
      if (control in this.controls) {
        console.warn('control already enabled', control);
        return;
      }
      
      this.controls[control] = new CONTROLS[control](this.cameraModel, this.camera, this.controller, this.scene);
    },
    
    disable: function (control) {
      if (!(control in CONTROLS)) {
        console.warn('invalid control name', control);
        return;
      }
      if (!(control in this.controls)) {
        console.warn('control not enabled', control);
        return;
      }
      
      delete this.controls[control];
    },
    
    update: function () {
      
      for (var k in this.controls) {
        var c = this.controls[k];
        c.update();
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
}());