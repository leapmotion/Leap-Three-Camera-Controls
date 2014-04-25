/**
 * @author cabbibo / http://cabbibo.com
 *
 *
 */

THREE.LeapEyeLookControls = function ( object , controller , scene , params , domElement ) {

  this.object     = object;
  this.controller = controller;
  this.scene      = scene;
  this.domElement = ( domElement !== undefined ) ? domElement : document;

  // API
  
  this.size = 100;


  this.look         = new THREE.Object3D();
  
  this.lookMass     = 1;
  this.lookSpeed    = .001;
  this.lookPosition = new THREE.Vector3( 0 , 0 , this.size);
  this.lookVelocity = new THREE.Vector3();
  this.lookForce    = new THREE.Vector3();

  this.eyeMass      = 1;
  this.eyeSpeed     = .001;
  this.eyePosition  = new THREE.Vector3();
  this.eyeVelocity  = new THREE.Vector3();
  this.eyeForce     = new THREE.Vector3();
 
  this.object.position  = this.eyePosition;
  this.look.position    = this.lookPosition;

  this.dampening = .9;

  this.scene.add( this.look );


  
  this.update = function(){

    
    this.frame = this.controller.frame();

    if( this.frame.valid == false ){

      this.controller.connect();
      this.frame = this.controller.frame();

    }

    this.lookForce.set( 0 , 0 , 0 );
    this.eyeForce.set( 0 , 0 , 0 );
   
    if( this.frame ){

      if( this.frame.hands[0] ){

        if( this.frame.hands[0].type == 'right' ){
          this.updateEyeForce( this.frame.hands[0] );
        }else if( this.frame.hands[0].type == 'left' ){
          this.updateLookForce( this.frame.hands[0] );
        }

      }

      if( this.frame.hands[1] ){

        if( this.frame.hands[1].type == 'right' ){
          this.updateEyeForce( this.frame.hands[1] );
        }else if( this.frame.hands[1].type == 'left' ){
          this.updateLookForce( this.frame.hands[1] );
        }

      }

      this.lookForce.multiplyScalar( 1 / this.lookMass );
      this.eyeForce.multiplyScalar( 1 / this.eyeMass );
      
      this.lookForce.applyQuaternion( this.object.quaternion );
      this.eyeForce.applyQuaternion( this.object.quaternion );
      
      this.lookVelocity.add( this.lookForce );
      this.eyeVelocity.add( this.eyeForce );
           
      var lV = this.lookVelocity.clone().multiplyScalar( this.lookSpeed );
      var eV = this.eyeVelocity.clone().multiplyScalar( this.eyeSpeed );

      
      this.lookPosition.add( lV );
      this.eyePosition.add( eV );
      
      this.object.lookAt( this.lookPosition );
   
      this.lookVelocity.multiplyScalar( this.dampening );
      this.eyeVelocity.multiplyScalar( this.dampening );

    }

  }

  this.updateEyeForce = function( hand ){

    var force = new THREE.Vector3();
    
    if( hand.pinchStrength > .5 ){
      force = new THREE.Vector3().fromArray( hand.palmVelocity );
    }

    this.eyeForce.add( force );

  }

  this.updateLookForce = function( hand ){

    var force = new THREE.Vector3();

    if( hand.pinchStrength > .5 ){
      force = new THREE.Vector3().fromArray( hand.palmVelocity );
    }

    this.lookForce.add( force );

  }


  this.addLookMarker = function( mesh ){

    this.look.add( mesh );

  }

  this.removeLookMarker = function( mesh ){

    this.look.remove( mesh );

  }

  this.leapToScene = function( position , clamp ){

    var clamp = clamp || false;
    var box = this.frame.interactionBox;
    var nPos = box.normalizePoint( position , clamp );
    
    nPos[0] = (nPos[0]-.5) * this.size;
    nPos[1] = (nPos[1]-.5) * this.size;
    nPos[2] = (nPos[2]-.5) * this.size;

    return new THREE.Vector3().fromArray( nPos );

  }


}





