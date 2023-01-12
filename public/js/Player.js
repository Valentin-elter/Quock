Player = function (game, canvas) {
    var _this = this;
    this.game = game;
    this.axisMovement = [false, false, false, false];

    //SENSI SOURIS
    this.angularSensibility = 200;
    //MOVE SPEED PERSO
    this.speed = 0.7;
    // TIR DU PLAYER
    this.weaponShoot = false;

    //INITIALISATION DES JOUEURS EN LIGNE
    this.ghostPlayers = [];

    //INITIALISATION DE L'INVENTAIRE DES ARMES
    this.previousWheeling = 0;

    this.textHealth = document.getElementById('textHealth');
    this.textArmor = document.getElementById('textArmor');

    window.addEventListener("mousewheel", function (evt) {
        console.log("wherll")
        // Si la différence entre les deux tours de souris sont minimes
        if (Math.round(evt.timeStamp - _this.previousWheeling) > 10) {
            if (evt.deltaY < 0) {
                _this.camera.weapons.nextWeapon(1);
            } else {
                _this.camera.weapons.nextWeapon(-1);
            }
            _this.previousWheeling = evt.timeStamp;
        }
    }, false);
    window.addEventListener("keyup", function (evt) {
        switch (evt.key) {
            case "z":
                _this.camera.axisMovement[0] = false;
                break;
            case "s":
                _this.camera.axisMovement[1] = false;
                break;
            case "q":
                _this.camera.axisMovement[2] = false;
                break;
            case "d":
                _this.camera.axisMovement[3] = false;
                break;
        }
        var data = {
            axisMovement: _this.camera.axisMovement
        };
        _this.sendNewData(data)
    }, false);


    window.addEventListener("keydown", function (evt) {
        switch (evt.key) {
            case "z":
                _this.camera.axisMovement[0] = true;
                break;
            case "s":
                _this.camera.axisMovement[1] = true;
                break;
            case "q":
                _this.camera.axisMovement[2] = true;
                break;
            case "d":
                _this.camera.axisMovement[3] = true;
                break;
        }
        var data = {
            axisMovement: _this.camera.axisMovement
        };
        _this.sendNewData(data)
    }, false);

    window.addEventListener("keypress", function(evt) {
        // Le keyCode 32 correspond à la bare espace
        if(evt.keyCode === 32){
            console.log('Jumped!')
        }
    }, false);

    


    // On récupère le canvas de la scène
    var canvas = this.game.scene.getEngine().getRenderingCanvas();

    // On affecte le clic et on vérifie qu'il est bien utilisé dans la scène (_this.controlEnabled)
    canvas.addEventListener("mousedown", function (evt) {
        if (_this.controlEnabled && !_this.weaponShoot) {
            _this.weaponShoot = true;
            _this.handleUserMouseDown();
        }
    }, false);

    // On fait pareil quand l'utilisateur relache le clic de la souris
    canvas.addEventListener("mouseup", function (evt) {
        if (_this.controlEnabled && _this.weaponShoot) {
            _this.weaponShoot = false;
            _this.handleUserMouseUp();
        }
    }, false);
    window.addEventListener("mousemove", function (evt) {
        if (_this.rotEngaged === true) {
            _this.camera.playerBox.rotation.y += evt.movementX * 0.001 * (_this.angularSensibility / 250);
            var nextRotationX = _this.camera.playerBox.rotation.x + (evt.movementY * 0.001 * (_this.angularSensibility / 250));
            if (nextRotationX < degToRad(90) && nextRotationX > degToRad(-90)) {
                _this.camera.playerBox.rotation.x += evt.movementY * 0.001 * (_this.angularSensibility / 250);
            }
            var data = {
                rotation: _this.camera.playerBox.rotation
            };
            _this.sendNewData(data)
        }
    }, false);

    this.controlEnabled = false;
    this._initPointerLock();

    this._initCamera(this.game.scene, canvas);
};

Player.prototype = {
    playerDead: function (whoKilled) {
        sendPostMortem(whoKilled);
        this.deadCamera = new BABYLON.ArcRotateCamera("ArcRotateCamera",
            1, 0.8, 10,
            new BABYLON.Vector3(this.camera.playerBox.position.x, this.camera.playerBox.position.y, this.camera.playerBox.position.z),
            this.game.scene);
        this.camera.playerBox.dispose();
        this.camera.dispose();
        this.camera.weapons.inventory[this.camera.weapons.actualWeapon].dispose();
        this.isAlive = false;
        this.game.scene.activeCamera = this.deadCamera;
        this.deadCamera.attachControl(this.game.scene.getEngine().getRenderingCanvas());
        var newPlayer = this;
        var canvas = this.game.scene.getEngine().getRenderingCanvas();
        setTimeout(() => {
            this.camera.setTarget(BABYLON.Vector3.Zero());
            newPlayer._initCamera(newPlayer.game.scene, canvas, newPlayer.spawnPoint);
            newPlayer.launchRessurection();
            this.game.scene.activeCamera = newPlayer.camera;
        }, 4000);
    },


    launchRessurection: function () {
        ressurectMe();
    },

    sendActualData: function () {
        return {
            actualTypeWeapon: this.camera.weapons.actualWeapon,
            armor: this.camera.armor,
            life: this.camera.health,
            position: this.camera.playerBox.position,
            rotation: this.camera.playerBox.rotation,
            axisMovement: this.camera.axisMovement
        }
    },

    updateLocalGhost: function (data) {
        ghostPlayers = this.ghostPlayers;

        for (var i = 0; i < ghostPlayers.length; i++) {
            if (ghostPlayers[i].idRoom === data.id) {
                var boxModified = ghostPlayers[i].playerBox;
                // On applique un correctif sur Y, qui semble être au mauvais endroit
                if (data.position) {
                    boxModified.position = new BABYLON.Vector3(data.position.x, data.position.y, data.position.z);
                }
                if (data.axisMovement) {
                    ghostPlayers[i].axisMovement = data.axisMovement;
                }
                if (data.rotation) {
                    ghostPlayers[i].head.rotation.y = data.rotation.y;
                }
                if (data.axisMovement) {
                    ghostPlayers[i].axisMovement = data.axisMovement;
                }
            }

        }
    },

    sendNewData: function (data) {
        updateGhost(data);
    },
    getDamage: function (damage, whoDamage) {
        var damageTaken = damage;
        //Tampon des degats par l'armure
        if (this.camera.health > damageTaken) {
            this.camera.health -= damageTaken;
            if (this.camera.isMain) {
                this.textHealth.innerText = this.camera.health;
                this.textArmor.innerText = this.camera.armor;
            }
        } else {
            if (this.camera.isMain) {
                this.textHealth.innerText = 0;
                this.textArmor.innerText = 0;
            }
            this.playerDead(whoDamage);
        }
    },

    handleUserMouseDown: function () {
        if (this.isAlive === true) {
            this.camera.weapons.fire();
        }
    },
    handleUserMouseUp: function () {
        if (this.isAlive === true) {
            this.camera.weapons.stopFire();
        }
    },
    _checkMove: function (ratioFps) {
        // On bouge le player en lui attribuant la caméra
        this._checkUniqueMove(ratioFps, this.camera);
        for (var i = 0; i < this.ghostPlayers.length; i++) {
            // On bouge chaque ghost présent dans ghostPlayers
            this._checkUniqueMove(ratioFps, this.ghostPlayers[i]);
        }
    },

    _checkUniqueMove: function (ratioFps, player) {
        let relativeSpeed = this.speed / ratioFps;
        var playerSelected = player
        // On regarde si c'est un ghost ou non (seul les ghost on un élément head)
        if (playerSelected.head) {
            var rotationPoint = playerSelected.head.rotation;
        } else {
            var rotationPoint = playerSelected.playerBox.rotation;
        }
        if (playerSelected.axisMovement[0]) {
            forward = new BABYLON.Vector3(
                parseFloat(Math.sin(parseFloat(rotationPoint.y))) * relativeSpeed,
                0,
                parseFloat(Math.cos(parseFloat(rotationPoint.y))) * relativeSpeed
            );
            playerSelected.playerBox.moveWithCollisions(forward);
        }
        if (playerSelected.axisMovement[1]) {
            backward = new BABYLON.Vector3(
                parseFloat(-Math.sin(parseFloat(rotationPoint.y))) * relativeSpeed,
                0,
                parseFloat(-Math.cos(parseFloat(rotationPoint.y))) * relativeSpeed
            );
            playerSelected.playerBox.moveWithCollisions(backward);
        }
        if (playerSelected.axisMovement[2]) {
            left = new BABYLON.Vector3(
                parseFloat(Math.sin(parseFloat(rotationPoint.y) + degToRad(-90))) * relativeSpeed,
                0,
                parseFloat(Math.cos(parseFloat(rotationPoint.y) + degToRad(-90))) * relativeSpeed
            );
            playerSelected.playerBox.moveWithCollisions(left);
        }
        if (playerSelected.axisMovement[3]) {
            right = new BABYLON.Vector3(
                parseFloat(-Math.sin(parseFloat(rotationPoint.y) + degToRad(-90))) * relativeSpeed,
                0,
                parseFloat(-Math.cos(parseFloat(rotationPoint.y) + degToRad(-90))) * relativeSpeed
            );
            playerSelected.playerBox.moveWithCollisions(right);
        }
      
        // GRAVITE
        this.camera.playerBox.moveWithCollisions(new BABYLON.Vector3(0, (-1.5) * relativeSpeed, 0));
    },

    _initPointerLock: function () {
        // controle souris
        var _this = this;

        var canvas = this.game.scene.getEngine().getRenderingCanvas();
        canvas.addEventListener("click", function (evt) {
            canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
            if (canvas.requestPointerLock) {
                canvas.requestPointerLock();
            }
        }, false);

        var pointerlockchange = function (event) {
            _this.controlEnabled = (document.mozPointerLockElement === canvas || document.webkitPointerLockElement === canvas || document.msPointerLockElement === canvas || document.pointerLockElement === canvas);
            if (!_this.controlEnabled) {
                _this.rotEngaged = false;
            } else {
                _this.rotEngaged = true;
            }
        };
        document.addEventListener("pointerlockchange", pointerlockchange, false);
        document.addEventListener("mspointerlockchange", pointerlockchange, false);
        document.addEventListener("mozpointerlockchange", pointerlockchange, false);
        document.addEventListener("webkitpointerlockchange", pointerlockchange, false);
    },

    _initCamera: function (scene, canvas) {
        let randomPoint = Math.random();



        // randomPoint fait un arrondi de ce chiffre et du nombre de spawnPoints
        randomPoint = Math.round(randomPoint * (this.game.allSpawnPoints.length - 1));

        // On dit que le spawnPoint est celui choisi selon le random plus haut
        this.spawnPoint = this.game.allSpawnPoints[randomPoint];

        var playerBox = BABYLON.Mesh.CreateBox("headMainPlayer", 3, scene);
        // On donne le spawnPoint avec clone() pour que celui-ci ne soit pas affecté par le déplacement du joueur
        playerBox.position = this.spawnPoint.clone();
        playerBox.ellipsoid = new BABYLON.Vector3(1.5, 3, 1.5);
        this.camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, 0), scene);
        this.camera.playerBox = playerBox
        this.camera.parent = this.camera.playerBox;
        this.camera.health = 100;
        this.camera.armor = 0;
        this.camera.playerBox.checkCollisions = true;
        this.camera.playerBox.applyGravity = true;
        this.isAlive = true;
        this.camera.isMain = true;
        this.camera.weapons = new Weapons(this);
        this.camera.axisMovement = [false, false, false, false];

        // La santé du joueur
        this.camera.health = 100;
        // Pour savoir que c'est le joueur principal
        this.camera.isMain = true;
        // L'armure du joueur
        this.camera.armor = 0;

        // Axe de mouvement X et Z
        this.camera.axisMovement = [false, false, false, false];

        // Affichage de la vie et de l'armure
        this.textHealth.innerText = this.camera.health;
        this.textArmor.innerText = this.camera.armor;

        var hitBoxPlayer = BABYLON.Mesh.CreateBox("hitBoxPlayer", 3, scene);
        hitBoxPlayer.parent = this.camera.playerBox;
        hitBoxPlayer.scaling.y = 2;
        hitBoxPlayer.isPickable = true;
        hitBoxPlayer.isMain = true;

    },



};