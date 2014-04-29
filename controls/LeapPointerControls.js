/**
 * @author cabbibo / http://cabbibo.com
 *
 *
 */

THREE.LeapPointerControls = function ( object , controller , params , domElement ) {

  this.object     = object;
  this.controller = controller;
  this.domElement = ( domElement !== undefined ) ? domElement : document;

  this.velocity = new THREE.Vector3();

  // API
  
  this.enable = true;

  this.velocity = new THREE.Vector3();

  this.size       = 100;
  this.speed      = .1;
  this.dampening  = .9;

  this.target     = new THREE.Vector3();



  
  this.update = function(){

    
    this.frame = this.controller.frame();

    if( this.frame.valid == false ){

      this.controller.connect();
      this.frame = this.controller.frame();

    }

    if( this.frame ){

      if( this.frame.hands[0] ){


        if( this.frame.hands[0].pinchStrength > .5 ){

          var pos = this.leapToScene(this.frame.hands[0].palmPosition);
          var dir = new THREE.Vector3().fromArray( this.frame.hands[0].palmNormal );
          var p = this.object.position;
          this.velocity = pos.clone().sub( p ).multiplyScalar( this.speed );

        }

            
      }

      this.object.lookAt( new THREE.Vector3() );
   
      this.object.position.add( this.velocity );
      this.velocity.multiplyScalar( this.dampening );

    }

    

  }

  this.leapToScene = function( position , clamp ){

    var box = this.frame.interactionBox;
    var nPos = box.normalizePoint( position , false );
    
    nPos[0] = (nPos[0]-.5) * this.size;
    nPos[1] = (nPos[1]-.5) * this.size;
    nPos[2] = (nPos[2]-.5) * this.size;

    return new THREE.Vector3().fromArray( nPos );

  }


}





