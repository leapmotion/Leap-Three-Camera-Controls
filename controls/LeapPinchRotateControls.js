
  /* 
   * Leap Pinch Rotate Controls
   * Author: @Cabbibo
   *
   * http://github.com/leapmotion/Leap-Three-Camera-Controls/    
   *    
   * Copyright 2014 LeapMotion, Inc    
   *    
   * Licensed under the Apache License, Version 2.0 (the "License");    
   * you may not use this file except in compliance with the License.    
   * You may obtain a copy of the License at    
   *    
   *     http://www.apache.org/licenses/LICENSE-2.0    
   *    
   * Unless required by applicable law or agreed to in writing, software    
   * distributed under the License is distributed on an "AS IS" BASIS,    
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.    
   * See the License for the specific language governing permissions and    
   * limitations under the License.    
   *    
   */    

  THREE.LeapPinchRotateControls = function ( object , controller , params, domElement ) {

    this.object     = object;
    this.controller = controller;
    this.domElement = ( domElement !== undefined ) ? domElement : document;

    this.clock      = new THREE.Clock(); // for smoother transitions

    // Place the camera wherever you want it
    // but use a rotating object to place
    this.rotatingObject = new THREE.Object3D();

    this.rotatingCamera = new THREE.Object3D();
    this.rotatingCamera.position = this.object.position.clone();

    this.rotatingObject.add( this.rotatingCamera );

    this.zoomSpeed = 0;
    this.rotation = new THREE.Quaternion();
    this.angularVelocity = new THREE.Vector3();

    //API

    this.rotationSpeed            = 10;
    this.rotationLowDampening     = .98;
    this.rotationHighDampening    = .7;

    this.pinchCutoff              = .5;
    this.zoomVsRotate             = 1;
    
    this.zoomEnabled              = true;
    this.zoom                     = 40;
    this.zoomDampening            = .6;
    this.zoomSpeedRatio           = 10;

    this.minZoom                  = 20;
    this.maxZoom                  = 80;

    this.getTorque = function( frame ){

      var torqueTotal = new THREE.Vector3();
      
      if( frame.hands[0] ){

        if( frame.hands[0].pinchStrength > this.pinchCutoff ){

          var palmVel = frame.hands[0].palmVelocity;
          var v = new THREE.Vector3( palmVel[0] , palmVel[1] , 0 );
          var d = new THREE.Vector3( 0 , 0 , -1 );

          // Dividing this.rotationSpeed by large number just to
          // keep parameters in a reasonable range
          var rotationSpeed = this.rotationSpeed;
          v.multiplyScalar( rotationSpeed );


          var torque = new THREE.Vector3().crossVectors( v , d );
          torqueTotal.add( torque );

        }

      }

      return torqueTotal;

    }


    this.getZoomForce = function( frame ){

      var zoomForce = 0;

      if( frame.hands[0] ){

        if( frame.hands[0].pinchStrength > this.pinchCutoff ){

          var handVel = frame.hands[0].palmVelocity;

          var zMovement = Math.abs(handVel[2]);
          var xyMovement = (Math.abs( handVel[0] ) + Math.abs( handVel[1] ))/2;

          if( zMovement > xyMovement * this.zoomVsRotate ){

            var zoomSpeedRatio = this.zoomSpeedRatio * 10;
            zoomForce = -handVel[2]*this.zoomSpeedRatio*10;

          }
        }        
      }

      return zoomForce;

    }

    // Will have high dampening, only if we are moving 
    // more in the z direction than the x and y,
    // and are pinching
    this.getRotationDampening = function( frame ){

      var dampening = this.rotationLowDampening;

      if( frame.hands[0] ){

        if( frame.hands[0].pinchStrength > this.pinchCutoff ){

          var handVel = frame.hands[0].palmVelocity;

          var zMovement = Math.abs(handVel[2]);
          var xyMovement = (Math.abs( handVel[0] ) + Math.abs( handVel[1] ))/2;

          if( zMovement > xyMovement * this.zoomVsRotate ){

            dampening = this.rotationHighDampening;

          }

        }

      }

      return dampening;

    }

    this.update = function(){

      // making sure our matrix transforms don't get overwritten
      this.object.matrixAutoUpdate = false; 

      var frame     = this.controller.frame();
      
      var dTime     = this.clock.getDelta();

      var torque    = this.getTorque(     frame );
      var dampening = this.getRotationDampening(  frame );
      var dTime     = this.clock.getDelta();
      
      if( this.zoomEnabled ){
        
        var zoomForce = this.getZoomForce(  frame );
      
        this.zoomSpeed  += zoomForce * dTime;
        this.zoom       += this.zoomSpeed;
        this.zoomSpeed  *= this.zoomDampening;

        // Maxes sure that we done go below or above the max zoom!
        if( this.zoom > this.maxZoom ){

          this.zoom       = this.maxZoom;
          this.zoomSpeed  = 0;

        }else if( this.zoom < this.minZoom ){

          this.zoom       = this.minZoom;
          this.zoomSpeed  = 0;

        }

      }

      this.angularVelocity.add( torque );
      this.angularVelocity.multiplyScalar( dampening );
           
      var angularDistance = this.angularVelocity.clone().multiplyScalar( dTime );

      var axis  = angularDistance.clone().normalize();
      var angle = angularDistance.length();

      var rotationChange = new THREE.Quaternion();
      rotationChange.setFromAxisAngle( axis , angle );

      var rotation = new THREE.Quaternion();
      rotation.multiplyQuaternions( rotationChange , this.rotation );

      this.rotation = rotation;

      this.rotatingObject.rotation.setFromQuaternion( rotation );

      this.rotatingObject.updateMatrix();
      
      this.updateCameraPosition();

    }


    this.updateCameraPosition = function(){

      var matrix = this.rotatingObject.matrix;

      var inverse = new THREE.Matrix4().getInverse( matrix );

      var translationMatrix = new THREE.Matrix4();

      var pos = new THREE.Vector3( 0 , 0 , this.zoom );
      translationMatrix.setPosition( pos );

      var rotatedMatrix = new THREE.Matrix4();
      rotatedMatrix.multiplyMatrices( inverse , translationMatrix );
      
      this.object.matrix.copy( rotatedMatrix );
      this.object.matrixWorldNeedsUpdate = true;


      // Makes sure that if the camera is moving we are updating it
      this.rotatingCamera.position = this.object.position.clone();

      // Need to convert to world position here.
      var worldPosition = this.object.position.clone();
      worldPosition.applyMatrix4( this.rotatingObject.matrix );

      this.object.position = worldPosition;

      // The camera is always looking at the center of the object
      // it is rotating around.
      this.object.lookAt( this.rotatingObject.position );

    }

  }


   // This function moves from a position from leap space, 
  // to a position in scene space
  this.leapToScene = function( position , clamp ){

    var clamp = clamp || false;
    var box = this.frame.interactionBox;
    var nPos = box.normalizePoint( position , clamp );
    
    nPos[0] = (nPos[0]-.5) * this.size;
    nPos[1] = (nPos[1]-.5) * this.size;
    nPos[2] = (nPos[2]-.5) * this.size;

    return new THREE.Vector3().fromArray( nPos );

  }
