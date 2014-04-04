/**
 * @author cabbibo / http://cabbibo.com
 *
 *  Move your hand like a paddle
 *
 */

THREE.LeapPaddleControls = function ( object , controller , params , domElement ) {

  this.object     = object;
  this.controller = controller;
  this.domElement = ( domElement !== undefined ) ? domElement : document;

  // API
  
  this.enable = true;

  this.velocity = new THREE.Vector3();

  this.weakDampening = .99;
  this.strongDampening = .9;

  this.dampening = this.strongDampening;
  
  // Tells you how much the matching of direction matters
  this.directionStrength = 4;

  // Tells you how much the power should be augmented
  // keep in mind that a higher power means a higher turn on
  this.power = 1;
  this.divisionFactor = 500;

  this.maxVelocity = 10;

  this.handVel = new THREE.Vector3();
  this.handNorm = new THREE.Vector3();

  this.update = function(){


    // Just incase this is overwritten somewhere else in the code
    this.object.matrixAutoUpdate = true;

    var frame = this.controller.frame();

    if( frame.valid == false ){

      this.controller.connect();
      frame = this.controller.frame();

    }

    if( frame ){

      if( frame.hands[0] && frame.pointables.length == 0 ){

        this.dampening = this.strongDampening;

      }else if( frame.hands[0] && frame.pointables.length == 1 ){
        
        this.dampening = this.weakDampening;

      }else if( frame.hands[0] && frame.pointables.length > 1 ){

        this.dampening = this.weakDampening;

        // First off check to see if the hand is moving in 
        // the same direction or opposite direction 
        // as the palm normal.
        var hpv = frame.hands[0].palmVelocity;
        this.handVel.set( hpv[0] , hpv[1] , hpv[2] );
         
        var hpn = frame.hands[0].palmNormal;
        this.handNorm.set( hpn[0] , hpn[1] , hpn[2] );

        // Copying over the hand velocity before we alter it
        preVel = this.handVel.clone();
        
        this.handVel.normalize();
        // No need to normalize handNorm, b/c is direction already

        // Getting the angle between the handVel and handNorm
        this.angle = this.handVel.dot( this.handNorm );
       
        // Scaling by the neccesary Dampening factor
        this.directionFactor = Math.pow( 
          Math.abs(this.angle), 
          this.directionStrength
        );

        preVel.multiplyScalar( this.directionFactor );

        var signX = preVel.x < 0 ? -1 : 1;
        var signY = preVel.y < 0 ? -1 : 1;
        var signZ = preVel.z < 0 ? -1 : 1;

        var x = Math.abs( preVel.x );
        var y = Math.abs( preVel.y );
        var z = Math.abs( preVel.z );


        this.velocity.x -= signX * Math.pow( x , this.power ) / this.divisionFactor;
        this.velocity.y -= signY * Math.pow( y , this.power ) / this.divisionFactor;
        this.velocity.z -= signZ * Math.pow( z , this.power ) / this.divisionFactor;

        var l = this.velocity.length();

        // Making sure we don't Freak out!
        if( l >= this.maxVelocity ){

           this.velocity.normalize().multiplyScalar( this.maxVelocity );

        }

      }

      // Convert from straight X , Y , Z,
      // to the X , Y , and Z of the camera
      var vTemp = this.velocity.clone();
      vTemp.applyQuaternion( this.object.quaternion );
      this.object.position.add( vTemp );

      this.velocity.multiplyScalar( this.dampening );

    }

    

  }

}





