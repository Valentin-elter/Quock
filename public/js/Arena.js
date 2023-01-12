Arena = function (game) {
    // Appel des variables nécéssaires
    this.game = game;
    var scene = game.scene;

    // Création de notre lumière principale
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 10, 0), scene);
    light.intensity = 0.7;
    light.setEnabled(true);
    var light2 = new BABYLON.HemisphericLight("light2", new BABYLON.Vector3(-1, 0, 0), scene);
    light2.diffuse = new BABYLON.Color3(1, 1, 1);
    light2.specular = new BABYLON.Color3(1, 1, 1);
    light2.groundColor = new BABYLON.Color3(0, 0, 0);
    light2.intensity = 0.5;
    light2.setEnabled(true);

    


    //Skybox
    var skybox = BABYLON.Mesh.CreateBox("skyBox", 5000.0, scene);
    var skyMaterial = new BABYLON.SkyMaterial("skyMaterial", scene);
    skyMaterial.backFaceCulling = false;

   
    skybox.material = skyMaterial;
    skyMaterial.turbidity = 1;
    skyMaterial.luminance = 0.5;
    skyMaterial.useSunPosition = true;
    skyMaterial.sunPosition = new BABYLON.Vector3(0, 10, 0);
    skyMaterial.rayleigh = 0.5; 
    skyMaterial.cameraOffset.y = scene.activeCamera.globalPosition.y;
    skyMaterial.cameraOffset.z = scene.activeCamera.globalPosition.z;
    skyMaterial.intensity = 0;
    skyMaterial.inclination = 0;

    // Material pour l'eau
 

    var waterMesh = BABYLON.Mesh.CreateGround("waterMesh", 2048, 2048, 16, scene, false);
	var water = new BABYLON.WaterMaterial("water", scene, new BABYLON.Vector2(512, 512));
	water.backFaceCulling = true;
	water.bumpTexture = new BABYLON.Texture("/images/waterbump.jpg", scene);
	water.windForce = 0;
	water.waveHeight = 0.5;
	water.bumpHeight = 0.1;
	water.windDirection = new BABYLON.Vector2(1, 1);
	water.waterColor = new BABYLON.Color3(0, 0, 221 / 255);
	water.colorBlendFactor = 0.0;
	water.addToRenderList(skybox);
	waterMesh.material = water;
  
    
 

    //Import de la map
    var map = BABYLON.SceneLoader.ImportMesh("", "/images/", "mapV7.babylon", scene, function (newMeshes) {
        newMeshes.forEach(m => {
            m.checkCollisions = true;
            m.isPickable = true;
        });
    });
    map.checkCollisions = true;
};

 
    
