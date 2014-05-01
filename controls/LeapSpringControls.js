/* 
 * Leap Spring Controls
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

THREE.LeapSpringControls = function ( object , controller , scene , domElement ) {

  this.object     = object;
  this.controller = controller;
  this.scene      = scene;
  this.domElement = ( domElement !== undefined ) ? domElement : document;

  this.velocity = new THREE.Vector3();
  this.acceleration = new THREE.Vector3();
  
  // API
  
  this.enable = true;

  this.dampening        = .9;
  this.size             = 120;
  this.springConstant   = 7;
  this.staticLength     = this.size;
  this.mass             = 100;

  this.anchorSpeed      = .1;

  this.handBasis        = new THREE.Matrix4();

  this.interactionBox   = {
    center: [ 0 , 0 , 0 ],
    size:   [ 0 , 0 , 0 ]
  }

  // Creates the Target Object ( object that will tween to anchor )
  this.target = new THREE.Object3D();
  this.scene.add( this.target );


  // Creates the Anchor Object ( object that will switch instantly )
  this.anchor = new THREE.Object3D();
  this.scene.add( this.anchor );

  // Creates the Hand Object ( Object that defines the Anchor placement )
  this.hand = new THREE.Object3D();
  this.scene.add( this.hand );


  /*
  
     Functions for adding and removing markers

  */
  this.addTargetMarker = function( mesh ){
    this.target.add( mesh );
  }
  
  this.removeTargetMarker = function( mesh ){
    this.target.remove( mesh );
  }

  this.addAnchorMarker = function( mesh ){
    this.anchor.add( mesh );
  }
  
  this.removeAnchorMarker = function( mesh ){
    this.anchor.remove( mesh );
  }
  
  this.addHandMarker = function( mesh ){
    this.hand.add( mesh );
  }
  
  this.removeHandMarker = function( mesh ){
    this.hand.remove( mesh );
  }
  
  this.getForce = function(){

    var difference = new THREE.Vector3();
    difference.subVectors( this.object.position , this.anchor.position );

    var l = difference.length();
    var x = l - this.staticLength;

    // Hooke's Law
    var f = difference.normalize().multiplyScalar(x).multiplyScalar( this.springConstant );

    return f;

  }

  this.applyForce = function( f ){

    this.acceleration = f.multiplyScalar( 1 / this.mass );

    this.velocity.add( this.acceleration );

    this.velocity.multiplyScalar( this.dampening );

    this.object.position.sub( this.velocity );

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


  this.checkForNewAnchor = function(){

    // getting our frame object
    this.frame = this.controller.frame();

    // If this is the first frame, assign an old frame,
    // and also the interaction box
    if( !this.oFrame ){
      this.oFrame = this.frame;
    }

    if( this.frame.valid ){
      this.interactionBox = this.frame.data.interactionBox;
    }

    if( this.frame ){

      if( this.frame.hands[0] && this.frame.pointables.length ){

        /*

           First off move the finger indicator to the correct position

        */
        var position    = this.leapToScene( this.frame.hands[0].palmPosition );
        position.z     -= this.size;
        position.applyMatrix4( this.object.matrix ); 

        this.hand.position = position;

        var pinchStrength = this.frame.hands[0].pinchStrength;
        
        if( pinchStrength > .5 ){
    
          this.target.position = position;

        }

      }

    }

    this.oFrame = this.frame;

  }
  
  this.update = function(){

    // Just incase this is overwritten somewhere else in the code
    this.object.matrixAutoUpdate = true;

    var f = this.controller.frame();
          
    this.target.rotation.setFromRotationMatrix(camera.matrix);
    
    /*
     
       Since we always want to look at the anchor,
       This means that we want to make sure that it doesn't jump
       from position to position whenever we select a new target

       Because of this, always move the anchor towards the target

    */

    var a = this.anchor.position;
    var t = this.target.position;
   
    // Moves the anchor towards the target
    var dif = a.clone().sub( t );

    a = a.sub( dif.multiplyScalar( this.anchorSpeed ) );

    // Get and apply the spring photos
    f = this.getForce();
    this.applyForce( f );

    // Makes sure that we are always looking at the 
    // anchor position
    this.object.lookAt( this.anchor.position );


    this.checkForNewAnchor();

  }

}
