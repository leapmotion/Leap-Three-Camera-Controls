/**
 * Hard work done by:
 * @author James Baicoianu / http://www.baicoianu.com/
 *
 * Leap work done by:
 * @author Cabbibo         / http://www.cabbibo.com/
 *
 */

THREE.LeapFlyControls = function ( object, controller, domElement ) {

	this.object     = object;
    this.controller = controller;

	this.domElement = ( domElement !== undefined ) ? domElement : document;
	if ( domElement ) this.domElement.setAttribute( 'tabindex', -1 );

	// API
    this.rollSpeed        = .005;
    this.lookSpeed        = .008;
    this.movementSpeed    = .10;

    this.directionFactor  = .01;
    this.positionFactor   = .01;

    this.weakDampening    = .99;
    this.strongDampening  = .90;
    this.dampening        = this.weakDampening;

    this.speed            = 0;
    this.acceleration     = 0;

	this.tmpQuaternion = new THREE.Quaternion();

    this.rotationVelocity = new THREE.Vector3();
	this.rotationVector   = new THREE.Vector3();

    this.clock = new THREE.Clock();
	this.update = function( delta ) {

      var delta = this.clock.getDelta();

      var frame = this.controller.frame();
      
      if( frame.hands[0] ){

        var hand = frame.hands[0];

        // If there are fingers, Glide
        // if the hand is a fist, slow to a stop!
        if( hand.fingers[0] ){
          
          this.dampening    = this.weakDampening;
          this.acceleration = hand.palmPosition[2] * this.movementSpeed;
          this.speed       += this.acceleration;

        }else{
         
          this.dampening    = this.strongDampening;
        
        }
        
        this.speed         *= this.dampening;

        
        // First Off reduce the rotation every frame.
        // This is used to limit the rotation, as well as
        // make sure rotation always slows to a stop if we   
        // are in the neutral position

        this.rotationVelocity.multiplyScalar(   this.dampening );


        // Pitch
        var centerY = frame.interactionBox.center[1];

        var xP      = ( hand.palmPosition[1] - centerY ) * this.positionFactor  ;
        var xD      = hand.direction[1]                  * this.directionFactor ;

        this.rotationVelocity.x += this.lookSpeed * ( xP + xD );

        // Yaw
        var yP = hand.palmPosition[0]               * this.positionFactor  ;
        var yD = hand.direction[0]                  * this.directionFactor ;

        this.rotationVelocity.y -= this.lookSpeed * ( yP + yD );

        // Roll
        this.rotationVelocity.z += this.rollSpeed * hand.palmNormal[0];


        // Set them equal every frame, as long as a hand is present
        this.rotationVector.x = this.rotationVelocity.x;
        this.rotationVector.y = this.rotationVelocity.y;
        this.rotationVector.z = this.rotationVelocity.z;

      
      }else{

        // if there is no hand, slow down!
        this.dampening = this.strongDampening;

        this.rotationVector.multiplyScalar( this.dampening );
        this.speed *=                     ( this.dampening );

      }

      //this.object.translateX( this.moveVector.x * delta );
      //this.object.translateY( this.moveVector.y * delta );
      this.object.translateZ( this.speed * delta );

      
      this.tmpQuaternion.set( 
        this.rotationVector.x * delta, 
        this.rotationVector.y * delta,
        this.rotationVector.z * delta,
        1
      ).normalize();

      this.object.quaternion.multiply( this.tmpQuaternion );

      // expose the rotation vector for convenience
      this.object.rotation.setFromQuaternion( this.object.quaternion, this.object.rotation.order );


	};




};
