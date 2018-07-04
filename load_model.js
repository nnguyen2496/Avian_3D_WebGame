/* 
 * Author: Nam Nguyen
 * Date: 06/23/2018
 * Description: This file contains the setup and logic control of the game. More details
 * can be found in the description of each individual function.
 */

// Key graphics variables
var scene, camera, renderer, mesh, clock;
var ambientLight, light;

// Controlled UI variables
var keyboard = {};
var release = {};
var game_clock = new THREE.Clock(false);
var score = 0;
var curr_time = 0;

// World Map dimensions
var WORLD_MAP_WIDTH = 200;
var WORLD_MAP_HEIGHT = 200;

// Array of preys and wall blocks
var collidableObjects = [];
var wall = [];

// Top layer of the world map
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var object_map = document.getElementById("canvas2");

// Background layer of the world map
var map = document.createElement("canvas");
map.width = 200;
map.height = 200;
var map_c = map.getContext("2d");
map_c.fillStyle = "white";
map_c.fillRect(0,0,200,200);

var loadingManager = null;
var RESOURCES_LOADED = false;
var camSpeed = 0.2;
var camTurnSpeed = Math.PI*0.2;
var MIN_BUILDING_HEIGHT = 2;
var meshes = {}; // Meshes index
var prey_locations = [];

function round(x){
	return Number((x).toFixed(2));
}

/* Generate n randoms number in the range [min,max] */
function randomNumbers(n,min,max){
	var result = [];
	while (result.length < n){
		var number = Math.floor(Math.random() * (max - min)) + min;
		if (result.indexOf(number) > -1) continue;
		result.push(number);
	}
	return result;
}

var loadingScreen = {
	scene: new THREE.Scene(),
	camera: new THREE.PerspectiveCamera(90, 1280/720, 0.1, 1000)
};

// Model collection
var models = {
	
	humbird: {
		obj: "humbird.obj",
		mtl: "humbird.mtl",
		mesh: null
	},
	
	eagle: {
		obj: "eagle.obj",
		mtl: "eagle.mtl",
		mesh: null
	},
	
	bat: {
		obj: "bat.obj",
		mtl: "bat.mtl",
		mesh: null
	},
	
	crane: {
		obj: "crane.obj",
		mtl: "crane.mtl",
		mesh: null
	},
	
};

/* Initialize the scene by setting up the camera and loading in necessary
 * graphical components.*/
function init(){
	
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(90, 1280/720, 0.1, 1000);
	clock = new THREE.Clock();
	
	loadingManager = new THREE.LoadingManager();
	loadingManager.onProgress = function(item, loaded, total){
		console.log(item, loaded, total);
	};
	
	loadingManager.onLoad = function(){
		console.log("loaded all resources");
		RESOURCES_LOADED = true;
		onResourcesLoaded();
		// Load terrain
		setupTerrain('city',scene,renderer);
		var indices = randomNumbers(10, 0, prey_locations.length);
		for (var i = 0; i < indices.length; i++){
			getFood(prey_locations[i].x, prey_locations[i].y, prey_locations[i].z);
			prey_locations.splice(i,1);
		}
		getFood(-1, MIN_BUILDING_HEIGHT, -3);
		getFood(1, MIN_BUILDING_HEIGHT, -3);
	};
	
	// Load models
	for (var _key in models){
		(function(key) {
			
			var mtlLoader = new THREE.MTLLoader(loadingManager);
			mtlLoader.setPath("assets/");
			
			mtlLoader.load(models[key].mtl, function(materials) {
				materials.preload();
				var objLoader = new THREE.OBJLoader(loadingManager);
				objLoader.setPath("assets/");
				objLoader.setMaterials(materials);
				objLoader.load(models[key].obj, function(mesh) {
						models[key].mesh = mesh;
				});
			});	
			
		})(_key);
	}
	
	camera.position.set(0, MIN_BUILDING_HEIGHT, -5);
	
	renderer = new THREE.WebGLRenderer({ antialias: false });
	renderer.setSize(1230,720);
	
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.BasicShadowMap;
	
	renderer.setClearColor(new THREE.Color("hsl(0, 100%, 100%)"));
	
	document.body.appendChild(renderer.domElement);
	
	/*Controls*/

	controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.dampingFactor = 0.25;
	controls.enableZoom = true;
	
	animate();
}

// Runs when all resources are loaded
function onResourcesLoaded(){
	// Clone models into meshes
	meshes["eagle"] = models.eagle.mesh.clone();
	meshes["eagle"].position.set(0,MIN_BUILDING_HEIGHT,-3);
	meshes["eagle"].scale.set(0.01,0.01,-0.01);
	scene.add(meshes["eagle"]);
}

function animate(){
	
	// Clear the map to redraw later
	ctx.clearRect(0,0,200,200);
	
	if ( RESOURCES_LOADED == false){
		requestAnimationFrame(animate);
		renderer.render(loadingScreen.scene, loadingScreen.camera);
		return;
	}
	
	var current_x = meshes["eagle"].position.x;
	var current_z = meshes["eagle"].position.z;
	
	requestAnimationFrame(animate);
	
	var time = Date.now() * 0.0005;
	var delta = clock.getDelta();
	
	if (keyboard[32]) { // "Space" key: move forward
		camera.position.x -= Math.sin(camera.rotation.y) * camSpeed;
		camera.position.z -= -Math.cos(camera.rotation.y) * camSpeed;	
	}
	
	if (keyboard[67]) { // C key: move backward
		camera.position.x += Math.sin(camera.rotation.y) * camSpeed;
		camera.position.z += -Math.cos(camera.rotation.y) * camSpeed;	
	}
	
	if (keyboard[65]) { // A key: move to the left
		meshes["eagle"].rotation.z = -1;
		camera.position.x += Math.sin(camera.rotation.y + Math.PI/2) * camSpeed;
		camera.position.z += -Math.cos(camera.rotation.y + Math.PI/2) * camSpeed;
	}

	if (keyboard[68]) { // D key: move to the right
		meshes["eagle"].rotation.z = 1;
		camera.position.x += Math.sin(camera.rotation.y - Math.PI/2) * camSpeed;
		camera.position.z += -Math.cos(camera.rotation.y - Math.PI/2) * camSpeed;
	}
	
	if (release[65] || release[68]){ // A is release, return the eagle to original rotation
		meshes["eagle"].rotation.z = 0;
		release[65] = false;
		release[68] = false;
	}
	
	
	if (keyboard[87]){ // "W" key for up
		camera.position.y += camSpeed;
		camera.position.z += camSpeed;
	}
	
	if (keyboard[83]){ // "S" key for down
		if (camera.position.y > MIN_BUILDING_HEIGHT) {
			camera.position.y -= camSpeed;
		}
		camera.position.z += camSpeed;
	}
	
	// position the eagle in front of the camera
	
	meshes["eagle"].position.set(
		camera.position.x,
		camera.position.y - 0.4 + Math.sin(time*4 + camera.position.x + camera.position.z)*0.01,
		camera.position.z + Math.cos(camera.rotation.y + Math.PI/6) * 0.75
	);
		
	var collisions = checkCollision();
	
	if (collisions.hit) {
		
		var object = collisions.object;
		scene.remove(object);
		
		ctx.clearRect(object.position.x, object.position.y,5,5);
		
		prey_locations.push({x: object.position.x, y: object.position.y, z: object.position.z});

		//Update score
		switch (object.name){
			case "bat":
				score += 10;
				break;
			case "humbird":
				score += 20;
				break;
			default:
				score += 30;
				break;
		}
		document.getElementById("score").innerHTML = score;
	}
	
	if (collidableObjects.length < 10){
		var indices = randomNumbers(10 - collidableObjects.length, 0, prey_locations.length);
		for (var i = 0; i < indices.length; i++){
			getFood(prey_locations[i].x, prey_locations[i].y, prey_locations[i].z);
		}
	}
	
	if (Math.abs(camera.position.x) > 500){
		var temp = camera.position.x;
		camera.position.x = Math.sign(temp) * (Math.abs(temp) % 500);
	}
	
	if (Math.abs(camera.position.z) > 500){
		var temp = camera.position.z;
		camera.position.z = Math.sign(temp) * (Math.abs(temp) % 500);
	}
	
	fillMap();
	
	if (game_clock.running) document.getElementById("time").innerHTML = curr_time + game_clock.getElapsedTime();
	
	renderer.render(scene, camera);
}

function keyDown(event){
	// if not up/down/left/right
	keyboard[event.keyCode] = true;
	release[event.keyCode] = false;
}

function keyUp(event){
	keyboard[event.keyCode] = false;
	release[event.keyCode] = true;
}

function setupTerrain(terrain, scene,renderer){
	if (terrain === "city"){	
		scene.fog = new THREE.FogExp2(0xd0e0f0, 0.0025);
		var city = loadCity(renderer);
		scene.add(city);
	}
}

function loadCity(renderer){
	
	// Add city light
	var light	= new THREE.HemisphereLight( 0xfffff0, 0x101020, 1.25 );
	light.position.set( 0.75, 1, 0.25 );
	scene.add( light );
	
	// Add city ground
	var material	= new THREE.MeshBasicMaterial({ color: 0x101018 })
	var geometry	= new THREE.PlaneGeometry( 1000, 1000 )
	var plane	= new THREE.Mesh( geometry, material );
	plane.rotation.x = - 90 * Math.PI / 180;
	scene.add( plane );

	var geometry = new THREE.CubeGeometry(1,1,1);
	
	//remove the bottom face of the building, which is not shown
	geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,0.5,0));
	geometry.faces.splice(6,2) 
	geometry.faceVertexUvs[0].splice(6,2);
	
	geometry.faceVertexUvs[0][4][0].set(0,0);
	geometry.faceVertexUvs[0][4][1].set(0,0);
	geometry.faceVertexUvs[0][4][2].set(0,0);
	geometry.faceVertexUvs[0][5][0].set(0,0);
	geometry.faceVertexUvs[0][5][1].set(0,0);
	geometry.faceVertexUvs[0][5][2].set(0,0);
	
	var light	= new THREE.Color( 0xffffff );
	var shadow	= new THREE.Color( 0x303050 );
	var cityGeometry = new THREE.Geometry();
	var buildingMesh = new THREE.Mesh(geometry);
	
	var worldMap = new Array(WORLD_MAP_WIDTH);
	for (var i = 0; i < WORLD_MAP_HEIGHT; i++){
		worldMap[i] = new Array(WORLD_MAP_HEIGHT);
	}
	
	/* Randomly divide worldMap into roads and building blocks */
	divideMap(worldMap, 200, 200, 0, 0);
	
	for (var i = 0; i < WORLD_MAP_WIDTH; i++){
		for (var j = 0; j < WORLD_MAP_HEIGHT; j++){
			map_c.fillStyle = "blue";
			if (worldMap[i][j]) {
				map_c.fillRect(i,j,4,4);
				wall.push({x:i,z:j});
				var building = getBuilding(cityGeometry, buildingMesh, light, shadow, i, j);
				var random = Math.random();
				if (random > 0.995) {
					prey_locations.push({x: building.x, z: building.z, y: building.y + 3});
				}
			}
			
			var random = Math.random();
			if (random > 0.999) {
					prey_locations.push({x: i*5 - 500, z: j*5 - 500, y: MIN_BUILDING_HEIGHT + 3});
			}
		}
	}
	
	canvas.style.background = 'url(' + map.toDataURL() + ')';
	
	// generate the texture
	var texture		= new THREE.Texture( generateTexture() );
	texture.anisotropy	= renderer.getMaxAnisotropy();
	texture.needsUpdate	= true;


	// Building the city mesh
	var material = new THREE.MeshPhongMaterial(
		{
			map : texture,
			vertexColors : THREE.VertexColors,
		}
	);
	var mesh = new THREE.Mesh(cityGeometry, material);
	return mesh;
}

/* Generate a building mesh and merge it to cityGeometry */
function getBuilding(cityGeometry, buildingMesh, light, shadow, i, j){
	
	/* Randomize building position and orientation */
	buildingMesh.position.x	= (i*5 + 1) - 500;
	buildingMesh.position.z	= (j*5 + 1) - 500;
	buildingMesh.rotation.y = 0;
	

	// Randomize building dimensions
	buildingMesh.scale.x = (1 - Math.random() * Math.random()) * 5;
	buildingMesh.scale.z = (1 - Math.random() * Math.random()) * 5;
	buildingMesh.scale.y = (Math.random() * Math.random() * Math.random() * buildingMesh.scale.x) * 8 + 8;

	// Add color and texture to the building
	var light = new THREE.Color( 0xffffff );
	var shadow  = new THREE.Color( 0x303050 );

	// Randomize building color
	var value = 1 - Math.random() * Math.random();
	//var value = 0;
	var baseColor = new THREE.Color().setRGB( value + Math.random() * 0.1, value, value + Math.random() * 0.1);
	
	// set topColor/bottom vertexColors as adjustment for baseColor
	var topColor = baseColor.clone().multiply(light);
	
	// set vertexColors for each face
	var geometry = buildingMesh.geometry;
	for ( var j = 0, jl = geometry.faces.length; j < jl; j++ ){
		if (j === 4 || j === 5){
			// set face.vertexColors on root face
			geometry.faces[j].color = baseColor;
		} else {
			// set face.vertexColors on sides faces
			geometry.faces[j].color = topColor;
		}
	}
	
	buildingMesh.updateMatrix();
	cityGeometry.merge(geometry, buildingMesh.matrix);
	
	return {x: buildingMesh.position.x, z: buildingMesh.position.z, y: buildingMesh.scale.y};
}

function generateTexture() {
	// build a small canvas 32*64 and pairing it in whiteSpace
	var texture = document.createElement('canvas');
	texture.width = 32;
	texture.height = 64;
	var context = texture.getContext('2d');
	
	// plain it in whiteSpace
	context.fillStyle = '#ffffff';
	context.fillRect(0,0,35,64);
	
	// draw the window rows - with a small noise to simulate
	// light variation in each room

	for ( var y = 1; y < 62; y+=3){
		for (var x = 1; x < 31; x += 3){
			var gradient = context.createLinearGradient(x,y,x+3,y+3);
			gradient.addColorStop(0, '#7094db');
			gradient.addColorStop(1, '#193366');
			context.fillStyle = gradient;
			context.fillRect(x,y,2.8,2.8);
		}
	}
	
	// build a bigger canvas and copy the small one into it to upscale the texture
	var canvas2 = document.createElement('canvas');
	canvas2.width = 512;
	canvas2.height = 1024;
	var context = canvas2.getContext('2d');
	
	// disable smoothing
	context.imageSmoothingEnabled = false;
	context.webkitImageSmoothingEnabled = false;
	context.mozImageSmoothingEnabled = false;
	
	// draw the image
	context.drawImage(texture,0,0,canvas2.width,canvas2.height);
	return canvas2;
}

function checkCollision(){
	
	var collisionResults = [];

	collidableObjects.forEach(function (object) {
		object.material.transparent = false;
		object.material.opacity = 1.0;
	});
	
	var originPoint = meshes["eagle"].position.clone();
	
	var mesh = meshes["eagle"].children[0];
	
	var geometry = new THREE.Geometry().fromBufferGeometry( mesh.geometry );
	
	for (var vertexIndex = 0; vertexIndex < geometry.vertices.length; vertexIndex++) {
		
		var localVertex = geometry.vertices[vertexIndex].clone();
		var globalVertex = localVertex.applyMatrix4(mesh.matrix);
		var directionVector = globalVertex.sub(mesh.position);
		
		// Cast a ray
		var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
		
		var collisionResults = ray.intersectObjects(collidableObjects);
		
		return collisionResults;
	}

}

/* Detect (if there is any) collision between the eagle and a prey */
function checkCollision(){
	
	var eagle_volume = new THREE.Box3().setFromObject(meshes["eagle"]);
	
	for (var i = 0; i < collidableObjects.length; i++){
		var object_volume = new THREE.Box3().setFromObject(collidableObjects[i]);
		if (eagle_volume.intersectsBox(object_volume)){
			var temp = collidableObjects[i];
			collidableObjects.splice(i,1);
			return { hit: true, object: temp};
		}
	}
	return { hit: false, object: null };
}

/* Place a prey in a given position */
function getFood(x,y,z){
	
	var random = Math.random();
	
	if (random > 0.7){
		var crane = models.crane.mesh.clone();
		crane.position.set(-x,y,z);
		crane.scale.set(0.01,0.01,0.01);
		crane.name = "crane";
		scene.add(crane);
		collidableObjects.push(crane);
		
	} else if (random > 0.4){
		var humbird = models.humbird.mesh.clone();
		humbird.position.set(-x,y,z);
		humbird.scale.set(10,10,10);
		humbird.name = "humbird";
		scene.add(humbird);
		collidableObjects.push(humbird);
		
	} else {
		var bat = models.bat.mesh.clone();
		bat.position.set(-x,y,z);
		bat.scale.set(10,10,10);
		bat.name = "bat";
		scene.add(bat);
		collidableObjects.push(bat);
	}
}

/* Update the nagivation map */
function fillMap(){
	
	//Fill the preys
	collidableObjects.forEach(function(prey){
		var x = prey.position.x;
		var z = prey.position.z;
		switch (prey.name){
			case "humbird": 
				ctx.fillStyle = "red";
				break;
			case "bat":
				ctx.fillStyle = "black";
				break;
			default:
				ctx.fillStyle = "green";
				break;
		}
		ctx.fillRect(-x/5 + 100, z/5 + 100,5,5);
		ctx.fillText(round(prey.position.y), -x/5 + 100, z/5 + 100);
	});
	
	//Fill the eagle
	ctx.fillStyle = "yellow";
	ctx.fillRect((-meshes["eagle"].position.x/5) + 100, (-meshes["eagle"].position.z/5) + 100, 5, 5);
	ctx.fillText(round(meshes["eagle"].position.y), (-meshes["eagle"].position.x/5) + 100, (-meshes["eagle"].position.z/5) + 100);
}

window.onload = init;

document.getElementById("start").onclick = function(){
	window.addEventListener('keydown', keyDown);
	window.addEventListener('keyup', keyUp);
	game_clock.start();
}

document.getElementById("pause").onclick = function(){
	game_clock.stop();
	curr_time = parseFloat(document.getElementById("time").innerHTML);
}






