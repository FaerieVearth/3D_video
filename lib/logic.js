

// globalne premenljivke
var container, scene, camera, renderer, controls;
var keyboard = new THREEx.KeyboardState();

// video spremenljivke
var video, videoImage, videoImageContext, videoTexture;
var videoURL, autoPlayURL;

// spremenljivke za video interakcijo
var projector, mouse = {x:0, y:0};
var cubePlay, cubeStop, cubeReset;

// klici funkcij
// preberemo URL parametre, inicializacija, animacija
getURLParams();
console.log("source/autoplay: "+ videoURL + "/" + autoPlayURL);
init();
animate();

//INICIALIZACIJA//		
function init() 
{
	// inicializiramo sceno, kamero, renderer, kontrole za premikanje po prostoru, vir svetlobe, skybox, meglo

	// scena
	scene = new THREE.Scene();

	// kamera
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(camera);
	camera.position.set(0,0,300);
	camera.lookAt(scene.position);	


	// renderer
	renderer = new THREE.WebGLRenderer( {antialias:true} );
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

	// prikazujemo na container div elementu
	container = document.getElementById( 'container' );
	container.appendChild( renderer.domElement );


	// kontrole za premikanje po prostoru z miško
	controls = new THREE.OrbitControls( camera, renderer.domElement );

	// luč
	var light = new THREE.PointLight(0xffffff);
	light.position.set(0,100,150);
	scene.add(light);

	// skybox
	var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
	var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x66afff, side: THREE.BackSide } );
	var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
	scene.add(skyBox);

	// megla
	scene.fog = new THREE.FogExp2( 0x66afff, 0.00025 );
	



	// kocke za video interakcijo


	// stop
	// dodamo texturo tipk
	var stopTexture = new THREE.ImageUtils.loadTexture("player_buttons/stop.png");
	var cubeStopGeometry = new THREE.CubeGeometry(20, 20, 4);
	var cubeStopMaterial = new THREE.MeshBasicMaterial({ 
        map:stopTexture
    }); 

	cubeStop = new THREE.Mesh(cubeStopGeometry, cubeStopMaterial);
	cubeStop.position.x = -30;
	//cubeStop.position.y = -100;
	cubeStop.position.z = 3;
	cubeStop.name = 'cube_stop';
	scene.add(cubeStop);

	// igraj
	var playTexture = new THREE.ImageUtils.loadTexture("player_buttons/play.png");
	var cubePalyGeometry = new THREE.CubeGeometry(20, 20, 4);
	var cubePalyMaterial = new THREE.MeshBasicMaterial({ 
        map:playTexture
    }); 

	cubePlay = new THREE.Mesh(cubePalyGeometry, cubePalyMaterial);
	cubePlay.position.x = 0;
	//cubePlay.position.y = -100;
	cubePlay.position.z = 3;
	cubePlay.name = 'cube_play';
	scene.add(cubePlay);


	var resetTexture = new THREE.ImageUtils.loadTexture("player_buttons/reset.png");
	var cubeResetGeometry = new THREE.CubeGeometry(20, 20, 4);
	var cubeResetMaterial = new THREE.MeshBasicMaterial({ 
        map:resetTexture
    }); 
    
    // resetiraj
	cubeReset = new THREE.Mesh(cubeResetGeometry, cubeResetMaterial);
	cubeReset.position.x = 30;
	//cubeReset.position.y = -100;
	cubeReset.position.z = 3;
	cubeReset.name = 'cube_reset';
	scene.add(cubeReset);

	//PREDVAJANJE VIDEA//
	
	// ustvarimo in naložimo video
	video = document.createElement( 'video' );
	video.src = "videos/" + videoURL + ".ogv";
	video.load(); 

	if(autoPlayURL){
		video.play();
	}
	
	// definiramo platno, katero bo hranilo video texture
	videoImage = document.createElement( 'canvas' );

	// počakamo, da se vsi podatki videa naložijo
	// nastavimo velikost platna v odvisnosti od velikosti videa 
	video.addEventListener('loadedmetadata', function(e){
    	console.log("resolution video: " + video.videoWidth + "x" + video.videoHeight);
    	videoImage.width = video.videoWidth;
		videoImage.height = video.videoHeight;

		videoImageContext = videoImage.getContext( '2d' );
		// privzeti videz, če video ni naložen
		videoImageContext.fillStyle = '#000000';
		videoImageContext.fillRect( 0, 0, videoImage.width, videoImage.height );

		// textura videa 
		videoTexture = new THREE.Texture( videoImage );
		videoTexture.minFilter = THREE.LinearFilter;
		videoTexture.magFilter = THREE.LinearFilter;
		
		// ustvarimo material z teksturo videa
		var movieMaterial = new THREE.MeshBasicMaterial( { map: videoTexture, overdraw: true, side:THREE.DoubleSide } );

		// na tej geometriji se predvaja posnetek
		// geometriji nastavimo material z video teksturo
		// razpolovimo velikost panoja za lepšo prezentacijo :)
		var movieGeometry = new THREE.PlaneGeometry( videoImage.width/2, videoImage.height/2, 4, 4 );
		var movieScreen = new THREE.Mesh( movieGeometry, movieMaterial );
		movieScreen.position.set(0,0,0);
		movieScreen.height = videoImage.height;
		movieScreen.width = videoImage.width;

		// prilagodimo pozicijo tipk glede na velikost videa
		cubeReset.position.y = -videoImage.height/3.5;
		cubePlay.position.y = -videoImage.height/3.5;
		cubeStop.position.y = -videoImage.height/3.5;

		scene.add(movieScreen);
	});


	// inicializiramo projektor
	projector = new THREE.Projector();
	
	// pokličemo funkcijo, če se spremeni stanje miške
	document.addEventListener( 'mousedown', onDocumentMouseDown, false );

}

// funkcija posluša, če pritisnemo miško
function onDocumentMouseDown( event ) 
{
	
	// posodobimo pozicijo miške na zaslonu
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	

	// objekt ray je žarek ki izhaja iz kamere v smeri kamor kliknemo
	var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
	projector.unprojectVector( vector, camera );
	var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize());

	// objekti, ki preverjajo, če obstaja interakcija med žarkom in podanimi objekti
	var intersects1 = ray.intersectObjects( [cubeStop] );
	var intersects2 = ray.intersectObjects( [cubePlay] );
	var intersects3 = ray.intersectObjects( [cubeReset] );
	
	// izvedemo operacijo, če se žarek in določeni objekt sekata
	if ( intersects1.length > 0 ){	
		console.log("Stop button");
		video.pause();
	} else if ( intersects2.length > 0 ){	
		console.log("Play button");
		video.play();
	} else if ( intersects3.length > 0 ){	
		console.log("Reset button");
		video.pause();
		video.currentTime = 0;
	}

}


//ANIMACIJA//
function animate() 
{
    requestAnimationFrame( animate );
	render();		
	update();
}

// zastavica preverja, če je tipka za presledek pridžana
var pressed = false;


//POSODABLJANJE//
function update()
{
	// ustavi in ponovno zaženi posnetek -> q
	if ( keyboard.pressed("q") ){

		if (video.paused && pressed == false){
			video.play();
			pressed = true;
		}else if (!video.paused && pressed == false){
			video.pause();
			pressed = true;
		}
	}else{
		pressed = false;
	}

	// resetiraj posnetek -> r
	if ( keyboard.pressed("r") ) 
	{
		video.pause();
		video.currentTime = 0;
	}
	
	// zavrti posnetek naprej -> f
	if ( keyboard.pressed("f") ) 
		video.currentTime = video.currentTime + 0.2;

	// zavrti posnetek nazaj -> b
	if ( keyboard.pressed("b") ) 
		video.currentTime = video.currentTime - 0.2;

	// kamera desno -> d
	if (keyboard.pressed("d")){ 
		if(camera.position.z > 0){
			camera.position.x += 10;
		}else{
			camera.position.x -= 10;
		}
		
	}

	// kamera levo -> a
	if (keyboard.pressed("a")){ 
		if(camera.position.z > 0){
			camera.position.x -= 10;
		}else{
			camera.position.x += 10;
		}
	}

	// kamera naprej -> w
	if (keyboard.pressed("w")){ 
		camera.position.z -= 10;
	}

	// kamera nazaj -> s
	if (keyboard.pressed("s")){ 
		camera.position.z += 10;
	}

	controls.update();
}

//RENDERING//
function render() 
{	
	if ( video.readyState === video.HAVE_ENOUGH_DATA ) 
	{
		videoImageContext.drawImage( video, 0, 0 );
		if ( videoTexture ) 
			videoTexture.needsUpdate = true;
	}

	renderer.render( scene, camera );
}


//POGLEJMO URL PARAMETRE//
function getURLParams(){
    tmp = [];
    var items = location.search.substr(1).split("&");
    for (var index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        if (tmp[0] === "video"){
        	videoURL = decodeURIComponent(tmp[1]);
        }else if (tmp[0] === "autoplay"){
        	if (decodeURIComponent(tmp[1]) == "off"){
        		autoPlayURL = false;
        	}
        }
    }

    //privzeti video, če ni definiran = video2
    if(videoURL == null){
    	videoURL = "video1";
    }

    //privzeti autoplay = off
    if(autoPlayURL == null){
    	autoPlayURL = true;
    }

}