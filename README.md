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

controls/LeapPointerControls.js

Called using 

```
var controls =  THREE.LeapPointerControls( camera , controller );

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

Spring Controls
-----

Two Hand Controls
-----

Pointer Controls
-----

Trackball Controls
-----

Paddle Controls
-----

Pinch Rotate Controls
-----

Eye Look Controls
-----


First Person Controls
-----
