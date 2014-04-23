 
  THREE.LeapPinchRotateControls = function ( object , controller , params, domElement ) {

    this.object     = object;
    this.controller = controller;
    this.domElement = ( domElement !== undefined ) ? domElement : document;

    this.clock      = new THREE.Clock(); // for smoother transitions

    this.speed = 10;

    // Place the camera wherever you want it
    // but use a rotating object to place
    this.rotatingObject = new THREE.Object3D();

    this.rotatingCamera = new THREE.Object3D();
    this.rotatingCamera.position = this.object.position.clone();

    this.rotatingObject.add( this.rotatingCamera );

    //console.log( rotatingObject );

    this.rotationSpeed            = 10;
    this.rotationDampening        = .98;
    this.zoom                     = 40;
    this.zoomSpeed                = 0;
    this.zoomSpeedRatio           = 0.1;
    this.zoomDampening            = .6;
    this.zoomCutoff               = .9;

    this.minZoom                  = 20;
    this.maxZoom                  = 80;

    this.rotation = new THREE.Quaternion();
    this.angularVelocity = new THREE.Vector3();

    this.getTorque = function( frame ){

      var torqueTotal = new THREE.Vector3();
      
      
      if( frame.hands[0] ){

        if( frame.hands[0].pinchStrength > .5 ){

          var v = new THREE.Vector3( frame.hands[0].palmVelocity[0] / 1000. , frame.hands[0].palmVelocity[1]/1000. , 0 );
          var d = new THREE.Vector3( 0 , 0 , -1 );

          var torque = new THREE.Vector3().crossVectors( v , d );
          torqueTotal.add( torque );




        }

        //console.log( this.angularVelocity );
        /*hand = frame.hands[0];
        var hDirection  = new THREE.Vector3().fromArray( hand.direction );
        var hNormal     = new THREE.Vector3().fromArray( hand.palmNormal );
       // hDirection.applyMatrix4( this.rotatingObject.matrix );


        for( var i = 0; i < hand.fingers.length; i++ ){

          var finger = hand.fingers[i];

          if( finger.extended ){

            var fD = finger.direction;
            var fV = finger.tipVelocity;
            
            // First off see if the fingers pointed
            // the same direction as the hand
            var fDirection = new THREE.Vector3().fromArray( fD );
            var fMatch = fDirection.dot( hDirection );

            // See if the finger velocity is in the same direction
            // as the hand normal
            var fVelocity = new THREE.Vector3().fromArray( fV );
            var tmp = fVelocity.clone();
            var vMatch = Math.abs( tmp.normalize().dot( hNormal ) );


            fVelocity.multiplyScalar( (this.rotationSpeed  / 100000) * fMatch * vMatch );

            var torque = new THREE.Vector3().crossVectors( fVelocity , hDirection );
            torqueTotal.add( torque );

          }*/


      }

      return torqueTotal;

    }


    /*this.getTorque = function( frame ){

      var torqueTotal = new THREE.Vector3();
      
      
      if( frame.hands[0] ){

        //console.log( this.angularVelocity );
        hand = frame.hands[0];
        var hDirection  = new THREE.Vector3().fromArray( hand.direction );
        var hNormal     = new THREE.Vector3().fromArray( hand.palmNormal );
       // hDirection.applyMatrix4( this.rotatingObject.matrix );


        for( var i = 0; i < hand.fingers.length; i++ ){

          var finger = hand.fingers[i];

          if( finger.extended ){

            var fD = finger.direction;
            var fV = finger.tipVelocity;
            
            // First off see if the fingers pointed
            // the same direction as the hand
            var fDirection = new THREE.Vector3().fromArray( fD );
            var fMatch = fDirection.dot( hDirection );

            // See if the finger velocity is in the same direction
            // as the hand normal
            var fVelocity = new THREE.Vector3().fromArray( fV );
            var tmp = fVelocity.clone();
            var vMatch = Math.abs( tmp.normalize().dot( hNormal ) );


            fVelocity.multiplyScalar( (this.rotationSpeed  / 100000) * fMatch * vMatch );

            var torque = new THREE.Vector3().crossVectors( fVelocity , hDirection );
            torqueTotal.add( torque );

          }

        }

      }

      return torqueTotal;

    }*/

    this.getZoomForce = function( frame ){

      var zoomForce = 0;

      if( frame.hands[0] ){

        if( frame.hands[0].pinchStrength > .5 ){


          var velocity = frame.hands[0].palmVelocity;
          zoomForce = -velocity[2]*this.zoomSpeedRatio;

          this.rotationDampening = .8;
        

        }else{
          this.rotationDampening = .98;
        }
      }else{
        this.rotationDampening = .98;
      }

      return zoomForce;

    }

    this.getDampening = function( frame ){

      var frame = this.controller.frame();
      
      var dampening = this.rotationDampening;

      if( frame.hands[0] ){
        var hand = frame.hands[0];
        
        for( var i = 0; i < hand.fingers.length; i++ ){

          var finger = hand.fingers[i];

          if( finger.extended ){

            // If any of our fingers are touching, slow it WAY down
            if( finger.touchZone == 'touching' ) dampening = .1;
        

          }

        }
      }

      return dampening;

    }

    this.update = function(){

      // making sure our matrix transforms don't get overwritten
      this.object.matrixAutoUpdate = false; 

      var frame     = this.controller.frame();

      var torque    = this.getTorque(     frame );
      var zoomForce = this.getZoomForce(  frame );
      var dampening = this.getDampening(  frame );
      var dTime     = this.clock.getDelta();
      
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

      this.angularVelocity.add( torque );
      this.angularVelocity.multiplyScalar( this.rotationDampening );
           
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

      var rotatedMatrix = new THREE.Matrix4().multiplyMatrices( inverse , translationMatrix );
      var position = new THREE.Vector3();

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
  // to a position in scene space, using the sceneSize
  // we defined in the global variables section
  function leapToScene( position ){

    var x = position[0] - frame.interactionBox.center[0];
    var y = position[1] - frame.interactionBox.center[1];
    var z = position[2] - frame.interactionBox.center[2];
      
    x /= frame.interactionBox.size[0];
    y /= frame.interactionBox.size[1];
    z /= frame.interactionBox.size[2];

    x *= sceneSize;
    y *= sceneSize;
    z *= sceneSize;

    z -= sceneSize;

    return new THREE.Vector3( x , y , z );

  }
