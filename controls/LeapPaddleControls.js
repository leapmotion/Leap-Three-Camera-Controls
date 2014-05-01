/*
 * Leap Paddle Controls
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

THREE.LeapPaddleControls = function ( object , controller , params , domElement ) {

  this.object     = object;
  this.controller = controller;
  this.domElement = ( domElement !== undefined ) ? domElement : document;

  this.velocity = new THREE.Vector3();

  this.weakDampening        = .99;
  this.strongDampening      = .9;

  this.fingerMatchCutoff    = .5;
  this.velocityMatchCutoff  =.5;

  this.fingerMatchPower     = 5;
  this.velocityMatchPower   = 5;

  this.movementSpeed        = 1;
  this.maxSpeed             = 10;

  // API
  
  this.velocity = new THREE.Vector3();
  this.handVel = new THREE.Vector3();
  this.handNorm = new THREE.Vector3();

  this.dampening = this.strongDampening;

  this.getForce = function( frame ){

    var totalForce = new THREE.Vector3();

    if( frame.hands[0] ){

      var hand = frame.hands[0];

      var hDirection  = new THREE.Vector3().fromArray( hand.direction );
      var hNormal     = new THREE.Vector3().fromArray( hand.palmNormal );

      for( var i = 0; i < hand.fingers.length; i++ ){

        var finger = hand.fingers[i];
        
        if( finger.extended ){

          var fD = finger.direction;
          var fV = finger.tipVelocity;
            
          // First off see if the fingers pointed
          // the same direction as the hand
          var fDirection = new THREE.Vector3().fromArray( fD );
          var fingerMatch = Math.abs(fDirection.dot( hDirection ));

          // See if the finger velocity is in the same direction
          // as the hand normal
          var fVelocity = new THREE.Vector3().fromArray( fV );
          var tmp = fVelocity.clone();
          var velocityMatch = Math.abs( tmp.normalize().dot( hNormal ) );
         
   

          if( fingerMatch < this.fingerMatchCutoff ){
            fingerMatch = 0;
          }

          if( velocityMatch < this.velocityMatchCutoff ){
            velocityMatch = 0;
          }

          // Scaling by the neccesary Dampening factor
          var velocityMatchFactor = Math.pow( 
            velocityMatch, 
            this.velocityMatchPower
          );

          var fingerMatchFactor = Math.pow( 
            fingerMatch, 
            this.fingerMatchPower
          );

          var matchFactor = fingerMatchFactor * velocityMatchFactor;
          var speedFactor = this.movementSpeed / 10000;
          var multiplier  = matchFactor * speedFactor;
          
          fVelocity.multiplyScalar( multiplier );

          totalForce.add( fVelocity );

        }

      }


    }

    return totalForce;

  }

  this.getDampening = function( frame ){
    var dampening = this.strongDampening;

    if( frame.hands[0] ){
      dampening = this.weakDampening;
    }

    return dampening;

  }
  this.update = function(){


    // Just incase this is overwritten somewhere else in the code
    this.object.matrixAutoUpdate = true;

    var frame = this.controller.frame();

    if( frame.valid == false ){

      this.controller.connect();
      frame = this.controller.frame();

    }

    var force = this.getForce( frame );
    var dampening = this.getDampening( frame );

    this.velocity.add( force );

    var speed = this.velocity.length();

    if( speed > this.maxSpeed ){

      this.velocity.normalize().multiplyScalar( this.maxSpeed );
     
    }

    
    
    // Convert from straight X , Y , Z,
    // to the X , Y , and Z of the camera
    var vTemp = this.velocity.clone();
    vTemp.applyQuaternion( this.object.quaternion );
    this.object.position.add( vTemp );

    this.velocity.multiplyScalar( dampening );


    

  }

}





