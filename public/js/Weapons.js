Weapons = function (Player) {
    this.Player = Player;
    this.Armory = Player.game.armory;
    this.bottomPosition = new BABYLON.Vector3(0.5, -2.5, 1);
    this.topPositionY = -0.5;
    this.inventory = [];

    var Armageddon = this.newWeapon('Armageddon')
    var Timmy = this.newWeapon('Timmy')
    var Ezekiel = this.newWeapon('Ezekiel')
    var Crook = this.newWeapon('Crook')
    this.inventory[3] = Ezekiel;
    this.inventory[1] = Crook;
    this.inventory[2] = Timmy;
    this.inventory[0] = Armageddon;
    this.actualWeapon = this.inventory.length - 1;
    this.inventory[this.actualWeapon].isActive = true;
    this.fireRate = this.Armory.weapons[this.inventory[this.actualWeapon].typeWeapon].setup.cadency;
    this._deltaFireRate = this.fireRate;
    this.canFire = true;
    this.launchBullets = false;
    var _this = this;
    var engine = Player.game.scene.getEngine();

    Player.game.scene.registerBeforeRender(function () {
        if (!_this.canFire) {
            _this._deltaFireRate -= engine.getDeltaTime();
            if (_this._deltaFireRate <= 0 && _this.Player.isAlive) {
                _this.canFire = true;
                _this._deltaFireRate = _this.fireRate;
            }
        }
    });

};

Weapons.prototype = {
    launchFire: function () {
        var idWeapon = this.inventory[this.actualWeapon].typeWeapon;
        var renderWidth = this.Player.game.engine.getRenderWidth(true);
        var renderHeight = this.Player.game.engine.getRenderHeight(true);
        var direction = this.Player.game.scene.pick(renderWidth / 2, renderHeight / 2, function (item) {
            if (item.name == "playerBox" || item.name == "weapon" || item.id == "headMainPlayer")
                return false;
            else
                return true;
        });

        if (this.Armory.weapons[idWeapon].type === 'ranged') {
            if (this.Armory.weapons[idWeapon].setup.ammos.type === 'rocket') {
                direction = direction.pickedPoint.subtractInPlace(this.Player.camera.playerBox.position);
                direction = direction.normalize();
                this.createRocket(this.Player.camera.playerBox, direction)
            } else if (this.Armory.weapons[idWeapon].setup.ammos.type === 'bullet') {
                this.shootBullet(direction)
            } else {
                this.createLaser(direction)
            }
        } else {
            this.hitHand(direction)
        }
        this.canFire = false;
    },
    hitHand: function (meshFound) {
        var idWeapon = this.inventory[this.actualWeapon].typeWeapon;
        var setupWeapon = this.Armory.weapons[idWeapon].setup;

        if (meshFound.hit && meshFound.distance < setupWeapon.range * 5 && meshFound.pickedMesh.isPlayer) {
            var damages = this.Armory.weapons[idWeapon].setup.damage;
            sendDamages(damages, meshFound.pickedMesh.name)
            console.log("La patate de forain !")
        } else {
            console.log('Not Hit CaC')
        }
    },
    createLaser: function (meshFound) {
        var idWeapon = this.inventory[this.actualWeapon].typeWeapon;
        var setupLaser = this.Armory.weapons[idWeapon].setup.ammos;
        var positionValue = this.inventory[this.actualWeapon].absolutePosition.clone();

        if (meshFound.hit) {
            var laserPosition = positionValue;
            let line = BABYLON.Mesh.CreateLines("lines", [
                laserPosition,
                meshFound.pickedPoint
            ], this.Player.game.scene);
            var colorLine = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
            line.color = colorLine;
            line.enableEdgesRendering();
            line.isPickable = false;
            line.edgesWidth = 40.0;
            line.edgesColor = new BABYLON.Color4(colorLine.r, colorLine.g, colorLine.b, 1);
            if (meshFound.pickedMesh.isPlayer) {
                var damages = this.Armory.weapons[idWeapon].setup.damage;
                sendDamages(damages, meshFound.pickedMesh.name)
                sendGhostLaser(laserPosition,directionPoint.pickedPoint);
                this.Player.game._lasers.push(line);
            }
           
        }
    },
    shootBullet: function (meshFound) {
        var idWeapon = this.inventory[this.actualWeapon].typeWeapon;
        var setupWeapon = this.Armory.weapons[idWeapon].setup;

        if (meshFound.hit && meshFound.pickedMesh.isPlayer) {
            sendDamages(damages, meshFound.pickedMesh.name)
            console.log("Boom")
        } else {
            console.log('Not Hit Bullet')
        }
    },
    createRocket: function (playerPosition, direction) {
        var idWeapon = this.inventory[this.actualWeapon].typeWeapon;
        var setupRocket = this.Armory.weapons[idWeapon].setup.ammos;
        var positionValue = this.inventory[this.actualWeapon].absolutePosition.clone();
        var rotationValue = playerPosition.rotation;
        var Player = this.Player;
        var newRocket = BABYLON.Mesh.CreateBox("rocket", 1, Player.game.scene);
        newRocket.direction = direction;
        newRocket.position = new BABYLON.Vector3(
            positionValue.x + (newRocket.direction.x * 1),
            positionValue.y + (newRocket.direction.y * 1),
            positionValue.z + (newRocket.direction.z * 1));
        newRocket.rotation = new BABYLON.Vector3(rotationValue.x, rotationValue.y, rotationValue.z);
        newRocket.scaling = new BABYLON.Vector3(0.5, 0.5, 1);
        newRocket.isPickable = false;
        newRocket.material = new BABYLON.StandardMaterial("textureWeapon", this.Player.game.scene);
        newRocket.material.diffuseColor = this.Armory.weapons[idWeapon].setup.colorMesh;
        newRocket.paramsRocket = this.Armory.weapons[idWeapon].setup;
        var Player = this.Player;
        // On a besoin de la position, la rotation et la direction
        sendGhostRocket(newRocket.position, newRocket.rotation, newRocket.direction);
        this.Player.game._rockets.push(newRocket);
    },

    fire: function (pickInfo) {
        this.launchBullets = true;
    },
    stopFire: function (pickInfo) {
        this.launchBullets = false;
    },
    newWeapon: function (typeWeapon) {
        var newWeapon;
        for (var i = 0; i < this.Armory.weapons.length; i++) {
            if (this.Armory.weapons[i].name === typeWeapon) {
                newWeapon = BABYLON.Mesh.CreateBox('rocketLauncher', 0.5, this.Player.game.scene);
                newWeapon.scaling = new BABYLON.Vector3(1, 0.7, 2);
                newWeapon.parent = this.Player.camera;
                newWeapon.position = this.bottomPosition.clone();
                newWeapon.isPickable = false;
                var materialWeapon = new BABYLON.StandardMaterial('rocketLauncherMat', this.Player.game.scene);
                materialWeapon.diffuseColor = this.Armory.weapons[i].setup.colorMesh;
                newWeapon.material = materialWeapon;
                newWeapon.typeWeapon = i;
                newWeapon.isActive = false;
                break;
            } else if (i === this.Armory.weapons.length - 1) {
                console.log('UNKNOWN WEAPON');
            }
        };

        return newWeapon
    },
    nextWeapon: function (way) {
        var armoryWeapons = this.Armory.weapons;
        var nextWeapon = this.inventory[this.actualWeapon].typeWeapon + way;
        var nextPossibleWeapon = null;

        if (way > 0) {
            // La boucle commence depuis nextWeapon
            for (var i = nextWeapon; i < nextWeapon + this.Armory.weapons.length; i++) {
                // L'arme qu'on va tester sera un modulo de i et de la longueur de Weapon
                var numberWeapon = i % this.Armory.weapons.length;
                // On compare ce nombre aux armes qu'on a dans l'inventaire
                for (var y = 0; y < this.inventory.length; y++) {
                    if (this.inventory[y].typeWeapon === numberWeapon) {
                        // Si on trouve quelque chose, c'est donc une arme qui vient arès la nôtre
                        nextPossibleWeapon = y;
                        break;
                    }
                }
                // Si on a trouvé une arme correspondante, on n'a plus besoin de la boucle for
                if (nextPossibleWeapon != null) {
                    break;
                }
            }
        } else {
            for (var i = nextWeapon;; i--) {
                if (i < 0) {
                    i = this.Armory.weapons.length;
                }
                var numberWeapon = i;
                for (var y = 0; y < this.inventory.length; y++) {
                    if (this.inventory[y].typeWeapon === numberWeapon) {
                        nextPossibleWeapon = y;
                        break;
                    }
                }
                if (nextPossibleWeapon != null) {
                    break;
                }
            }
        }
        if (this.actualWeapon != nextPossibleWeapon) {
            // On dit à notre arme actuelle qu'elle n'est plus active
            this.inventory[this.actualWeapon].isActive = false;
            // On change l'arme actuelle avec celle qu'on a trouvé
            this.actualWeapon = nextPossibleWeapon;
            // On dit à notre arme choisie qu'elle est l'arme active
            this.inventory[this.actualWeapon].isActive = true;
            // On actualise la cadence de l'arme
            this.fireRate = this.Armory.weapons[this.inventory[this.actualWeapon].typeWeapon].setup.cadency;
            this._deltaFireRate = this.fireRate;
            console.log("this.Armory.weapons[this.inventory[this.actualWeapon].typeWeapon].setup.cadency", this.Armory.weapons[this.inventory[this.actualWeapon].typeWeapon].setup.cadency)

        }
    }
};