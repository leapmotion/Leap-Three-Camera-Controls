Three.js Camera Controls using Leap Motion
=====

Hey Friends!

I hope you are here to use the Leap.js / Three.js Camera controls. If you aren't, the following might be pretty boring, but since you are here, you should try using them anyway.

In this readme, you will find 3 sections

- Basic Implementation
- A full example 
- Further explanations of each individual camera control



Basic Implementation
=====

Like Any other javascript program, the first thing we need to 
do is include the proper files. In our case we use three.js
leap.js and which ever camera control we decide to use 
( For our demo use case, we will use 'LeapSpringControls.js", so we
start of our program like so:

Include Scripts
------

```
<script src="path/to/three.js"></script>
<script src="path/to/leap.js"></script>
<script src="path/to/LeapSpringControls.js"></script>

```

The next thing we will do is set up our controls. We are going to 
skip over all of the three.js initialization, but if you want, you can
just grab that from the next section.

Whichever camera controls we use, we initialize them the same way we would
a three.js camera control. The only difference is that instead of just
passing through which camera we want the controls to apply to, in this case
we also need to tell the camera controls which leap controller we want to use.

If this seems convoluted, I promise its only because I suck at the English 
language. Lets talk in javascript instead:


Initializing Controls
-----

```

// our leap controller
var controller;

// our leap camera controls
var controls;

// our three.js variables
var scene , camera;


// Whatever function you use to initialize 
// your three.js scene, add your code here
function init(){
  

  // Three.js initialization
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera( 
    50 ,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );

  // Our Leap Controller
  var controller = new Leap.controller();
  controller.connect();
 
  // The long awaited camera controls!
  var controls = new THREE.LeapSpringControls( camera , controller , scene );

}

```

It is important to note that the LeapSpringControls take in a camera , a controller ,
AND a scene as input. This is because this specific control places a marker on the page
as a helper.

The last thing we need to do is to make sure the controls are constantly being updated,
so we include a few more lines in whatever function we are using to render the three.js
scene.

Updating Controls
-----

```
function animate(){

  //THREE.js rendering goes here
  

  // This is the only thing we need!
  controls.update();


  // Make sure animate gets called again
  requestAnimationFrame( animate );


}
```

If any of this doesn't make sense, check out the full example below. Also email
icohen@leapmotion.com || @cabbibo with any questions / comments!


Full Code Example
=====

```
<html>
  <head>
    <style>

      #container{

        background:#000;
        position:absolute;
        top:0px;
        left:0px;

      }

    </style>
  </head>
  <body>    

    <div id="container"></div>

    <script src="../lib/leap.min.js"></script>
    <script src="../lib/three.js"></script>

    <script src="../controls/LeapSpringControls.js"></script>
    
    <script>

      var container , camera , scener, renderer , stats;

      var controller , controls;

      init();
      animate();

      function init(){

        controller = new Leap.Controller();
     
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(
          50 ,
          window.innerWidth / window.innerHeight,
          1 ,
          5000
        );

        camera.position.z = 100;
        controls = new THREE.LeapSpringControls( camera , controller , scene );

        var material = new THREE.MeshNormalMaterial();
        var geometry = new THREE.CubeGeometry( 20 , 20 , 20 );
        for( var i = 0; i < 100; i ++ ){

          var mesh = new THREE.Mesh( geometry , material );
          mesh.position.x = ( Math.random() - .5 ) * 500;
          mesh.position.y = ( Math.random() - .5 ) * 500;
          mesh.position.z = ( Math.random() - .5 ) * 500;

          mesh.rotation.x = Math.random() * Math.PI;
          mesh.rotation.y = Math.random() * Math.PI;
          mesh.rotation.z = Math.random() * Math.PI;

          scene.add( mesh );

        }
        
        container = document.getElementById( 'container' );
        renderer = new THREE.WebGLRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );
        container.appendChild( renderer.domElement );      

        controller.connect();


      }


      function animate(){

        controls.update();
        renderer.render( scene , camera );

        requestAnimationFrame( animate );

      }

    </script>
  </body>
</html>
```

More Information About Controls
=====

This section is about what each of the controls are the most useful
for. It will also try to include descriptions of what works, what
doesn't work, and what will hopefully one day work.

Pointer Controls
-----

The pointer controls basically has the camera always pointing at a 
'target', when you pinch, you begin moving the camera around the object,
and when you release, the camera will stop moving.

Pros:

  - Always looking at the same place, so its hard to get out of control
  - movements feel smoothish
  - Absolute positioning means that when comparing to the leap, 
    the position will always make sense

Cons:

  - Moving camera near poles results in some weirdness
  - Because there is only a single target, hard to move around scene
    unless the target is dynamically updated
  - Uses pinch, which removes the ability to use it for other gestures


Pairings:
  
  - Pointer controls work well with a single examined object
  - 3D Modeling camera controls
  - A Game with a single scene that we are always looking at
  - A quick addition to visual experiments

Called using: 

```
<!-- Include Script -->
<script src="path/to/controls/LeapPointerControls.js"></script>

// Inside Init Function
var controls = THREE.LeapPointerControls( camera , controller );

controls.size       = 100;
controls.speed      = .01;
controls.dampening  = .99;
controls.target     = new THREE.Vector3( 0 , 100 , 0 );

// Inside Animate Function
controls.update();
```

Using the following parameters:

  - size:       Tells us how big the motions will be, basically the spherical
                distance from the target

  - dampening:  Tells us how fast the camera will slow down once we release
                it. also how 'smoothed' the movement will be

  - speed:      Tells us how fast the camera will follow our hand movements.
                This number should be between 0 and 1

  - target:     Tells us where the camera is looking. A THREE.Vector3(), 
                target basically defines the center of the scene


Eye Look Controls
-----

Eye Look Controls are very similar to the Pointer controls. Infact when 
you use your right hand, they are exactly the same. The biggest difference
is that when you use your left hand, you dynamically move the target.
This leads to the ability to easily move around a scene, but always have a 
specific point you are focused on. Also, all movements are relative,
rather than absolute.


Pros:

  - Always looking at the same place, so its hard to get out of control
  - movements feel smoothish
  - Relative movements allow for the exploration of the entire scene 

Cons:

  - Moving camera near poles results in some weirdness
  - Uses pinch, which removes the ability to use it for other gestures
  - Relative movement means that you can get very far away from yourr
    target, leading to depth being difficult to judge
  - Difficult to move through an entire scene quickly


Pairings:
  
  - Slowly examining a full scene
  - 3D Modeling camera controls
  - A quick addition to visual experiments


Called using: 

```
<!-- Include Script -->
<script src="path/to/controls/LeapEyeLookControls.js"></script>

// Inside Init Function
var controls = THREE.LeapEyeLookControls( camera , controller , scene );

controls.lookSize       = 10;
controls.lookMass       = 10;
controls.lookSpeed      = 10;
controls.lookDampening  = .9;

controls.eyeSize        = 10;
controls.eyeMass        = 10;
controls.eyeSpeed       = 10;
controls.eyeDampening   = .9;

// If you want to have a marker for your eye
// Which you probably do...

var geo   = new THREE.CubeGeometry( 1 , 1 , 1 );
var mat   = new THREE.MeshNormalMaterial();
var mesh  = new THREE.Mesh( geo , mat );

controls.addLookMarker( mesh );

// Inside Animate Function
controls.update();
```

Using the following parameters:

  - lookSize:       Tells us how big the movements will be for the look object
                    by adding bigger or smaller numbers to the force

  - lookMass:       Tells us more about how the look object will move by giving
                    it different mass. A smaller mass with fling around the field
                    while a larger mass will be slower / harder to move

  - lookSpeed:      Tells us how much the speed will be multiplied by when we 
                    determine the final speed to be added to the position

  - lookDampening:  Tells us how quickly the look object will slow down

  - eyeSize:        Tells us how big the movements will be for the eye object
                    by adding bigger or smaller numbers to the force

  - eyeMass:        Tells us more about how the eye object will move by giving
                    it different mass. A smaller mass with fling around the field
                    while a larger mass will be slower / harder to move

  - eyeSpeed:       Tells us how much the speed will be multiplied by when we 
                    determine the final speed to be added to the position

  - eyeDampening:   Tells us how quickly the eye object will slow down


Spring Controls
-----

Spring controls Attatch a spring from your camera to a target, which it
is always looking at. When you pinch, it places a new anchor that the 
target will tween to, always giving you a smooth movement. To see exactly
what this means, try adding markers to the anchor , hand , and target
as described in the below code snippet

Pros:

  - Smooth like butter
  - Lets you fly to anywhere you want in the scene with relative ease
  - Once you let go, gives slowly brings you to a final resting point
  

Cons:

  - Moving camera near poles results in some weirdness...
  - Uses pinch, which removes the ability to use it for other gestures
  - Easy to get lost in space if you have no reference points

Pairings:
  
  - Space Flying Games 
  - Plane Flying Games
  - A quick addition to visual experiments


Called using: 

```
<!-- Include Script -->
<script src="path/to/controls/LeapEyeLookControls.js"></script>

// Inside Init Function
controls = new THREE.LeapSpringControls( camera , controller , scene );

controls.dampening      = .75;
controls.size           = 120;
controls.springConstant =   1;
controls.mass           = 100;
controls.anchorSpeed    =  .1;
controls.staticLength   = 100;


// Adding meshes to the Anchor , Target and Hand
var geo = new THREE.IcosahedronGeometry( 5, 2 ); 
var mat = new THREE.MeshNormalMaterial(); 

var targetMesh  = new THREE.Mesh( geo , mat );
var anchorMesh  = new THREE.Mesh( geo , mat );
var handMesh    = new THREE.Mesh( geo , mat );

controls.addTargetMarker( targetMesh );
controls.addAnchorMarker( anchorMesh );
controls.addHandMarker(     handMesh );

// Inside Animate Function
controls.update();
```

Using the following parameters:

  - dampening:      Tells us how quickly movement slows down 
  - size:           Tells us size of hand movements
  - springConstant: Tells us value for Hooke's Law constant k
  - mass:           Tells us mass of camera
  - anchorSpeed:    Tells us how fast Anchor tweens to target 
                    ( .5 and higher gets weird. but it shouldn't,
                      I just forgot how to do physics. Pull request maybe ?!!???!? )
  - staticLength:   Tells us how far away camera comes to rest from target


Two Hand Controls
-----

Two Hand controls let you translate around a scene by pinching with a single
hand, and rotate scene when you pinch with two hands

Pros:

  - You feel a bit like iron man
  - You don't accidentally rotate the scene when you don't want to 
  - Once you let go, gives slowly brings you to a final resting point
  

Cons:

  - Sometimes difficult for tracking to pick up with two hands in the field
  - Uses pinch, which removes the ability to use it for other gestures
  - Using two hands might be more tiring


Pairings:
  
  - Quickly exploring large swatches of land
  - Manipulating large scenes
  - A quick addition to visual experiments


Called using: 

```
<!-- Include Script -->
<script src="path/to/controls/LeapEyeLookControls.js"></script>

// Inside Init Function
controls = new THREE.LeapTwoHandControls( camera , controller , scene );

controls.translationSpeed   = 20;
controls.translationDecay   = 0.3;
controls.scaleDecay         = 0.5;
controls.rotationSlerp      = 0.8;
controls.rotationSpeed      = 4;
controls.pinchThreshold     = 0.5;
controls.transSmoothing     = 0.5;
controls.rotationSmoothing  = 0.2;

// Inside Animate Function
controls.update();
```

TODO: Description of Parameters


Trackball Controls
-----

Trackball Controls let you swipe the camera around a target, as if you
were pushing a giant bowling ball around ( your hand is always behind the ball )
Also , if you turn your hand straight up, and zoom is enabled, you will
stop spinning and start zooming, based on moving your hand forward and backwards


Pros:

  - Supersmooth. 
  - No Gimbal Lock!
  - No use of Pinch! 

Cons:

  - Only moves around single point
  - Controls take some getting used to for some people
  - No clear up vector, which leads to possible deorientation

Pairings:
  
  - 3D Modeling camera controls
  - A quick addition to visual experiments


Called using: 

```
<!-- Include Script -->
<script src="path/to/controls/LeapTrackballControls.js"></script>

// Inside Init Function
var controls = THREE.LeapTrackballControls( camera , controller );

controls.rotationSpeed            = 10;
controls.rotationDampening        = .98;
controls.zoom                     = 40;
controls.zoomDampening            = .6;
controls.zoomCutoff               = .9;

controls.minZoom                  = 20;
controls.maxZoom                  = 80;

// Inside Animate Function
controls.update();
```

Using the following parameters:

  - rotationSpeed:      Tells us the speed of the rotation
  - rotationDampening:  Tells us how quickly the rotation will slow down
  - zoomEnabled:        Tells us if zooming is enabled
  - zoom:               Tells us how close we are to the center
  - zoomDampening:      Tells us how quickly the zoom will slow down
  - zoomCutoff:         Tells us how forward facing our palm needs to be to zoom
  - minZoom:            Tells us the closest we can be
  - maxZoom:            Tells us the farthest we can be
  

Pinch Rotate Controls
-----


Paddle Controls
-----


First Person Controls
-----

TODO
