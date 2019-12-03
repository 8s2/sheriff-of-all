document.addEventListener('contextmenu', event => event.preventDefault());

var game = new Phaser.Game(1080, 648, Phaser.AUTO);
game.antialias = false;
game.resolution = 1/3;

var cursors;

var GameState = {
  preload: function(){
    game.time.advancedTiming = true;
    this.load.image('dirt_tiles', 'assets/dirt_tiles.png');
    this.load.spritesheet("sheriff", "assets/sheriff.png", 24, 24);
    this.load.spritesheet("spark", "assets/spark.png", 1, 1);
    this.load.spritesheet("gun", "assets/gun.png", 16, 16);
    this.load.spritesheet("grass", "assets/grass.png", 8, 6);
    this.load.spritesheet("slime", "assets/slime.png", 12, 12);
    this.load.spritesheet("slime_particles", "assets/slime_particles.png", 4, 5);
    this.load.spritesheet("lasso_projectile", "assets/lasso_projectile.png", 17, 11);
    this.load.spritesheet("lasso", "assets/lasso.png", 23, 22);
    this.load.spritesheet("health", "assets/health.png", 12, 12);
    this.load.image("crosshair", "assets/crosshair.png", 11, 12);
    this.load.image("bullet", "assets/bullet.png", 4, 4);
    this.load.audio("gun_shot", "assets/gun_shot.mp3");
    this.load.audio("ambience", "assets/ambience.mp3");
    this.load.audio("footstep", "assets/footstep.mp3");
    this.load.audio("grass_rustle", "assets/grass_rustle.mp3");
    this.load.audio("slime_squish", "assets/slime_squish.mp3");
  },
  create: function(){
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.world.scale.set(3,3);

    game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.input.onDown.add(function() {

        if (!game.scale.isFullScreen){
            game.scale.startFullScreen(false);
        }

    }, this);

    this.sound = game.add.audio('gun_shot', 0.5);
    this.sound.allowMultiple = true;
    this.ambience = game.add.audio('ambience', 0.5)
    this.ambience.loopFull();
    this.footstep_sound = game.add.audio('footstep', 0.5);
    this.footstep_sound.allowMultiple = true;
    this.grass_rustle = game.add.audio('grass_rustle', 0.2);
    this.grass_rustle.allowMultiple = true;
    this.slime_squish = game.add.audio('slime_squish', 1);
    this.slime_squish.allowMultiple = true;

    keys = { 
      up: game.input.keyboard.addKey(Phaser.Keyboard.W),
      down: game.input.keyboard.addKey(Phaser.Keyboard.S),
      left: game.input.keyboard.addKey(Phaser.Keyboard.A),
      right: game.input.keyboard.addKey(Phaser.Keyboard.D),
      space: game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)
    }

    var data = '1 ,1 ,6 ,0 ,0 ,0 ,0 ,13,14,1 ,1 ,1 ,1, 1 ,1 ,1'+'\n'+
               '1 ,1 ,9 ,0 ,0 ,0 ,11,1 ,1 ,1 ,15,1 ,1 ,1 ,1 ,1'+'\n'+
               '1 ,1 ,1 ,9 ,10,8 ,1 ,1 ,1 ,1 ,6 ,5 ,1 ,1 ,1 ,1'+'\n'+
               '1 ,1 ,1 ,1 ,1 ,17,1 ,1 ,1 ,1 ,6 ,0 ,4 ,4 ,4 ,1'+'\n'+
               '1 ,1 ,1 ,1 ,1 ,1 ,1 ,1 ,1 ,3 ,0 ,10,0 ,0 ,10,1'+'\n'+
               '1 ,1 ,1 ,7 ,1 ,1 ,12,4 ,4 ,0 ,8 ,1 ,9 ,11,1 ,1'+'\n'+
               '1 ,3 ,5 ,1 ,1 ,1 ,1 ,9 ,10,0 ,8 ,1 ,1 ,1 ,1 ,1'+'\n'+
               '1 ,9 ,0 ,5 ,1 ,1 ,1 ,1 ,1 ,9 ,10,5 ,1 ,1 ,1 ,1'+'\n'+
               '1 ,1 ,9 ,11,1 ,1 ,1 ,1 ,1 ,1 ,1 ,9 ,5 ,1 ,1 ,1'+'\n';
    game.cache.addTilemap('dynamicMap', null, data, Phaser.Tilemap.CSV);
    map = game.add.tilemap('dynamicMap', 24, 24);
    map.addTilesetImage('dirt_tiles', 'dirt_tiles', 24, 24);
    layer = map.createLayer(0);
    // layer.scale.setTo(3,3);

    this.world = game.add.group();


    this.crosshair = this.game.add.sprite(game.input.mousePointer.x, game.input.mousePointer.y, "crosshair");
    this.crosshair.anchor.setTo(0.5, 0.5);

    this.gun = this.world.create(this.game.world.centerX, this.game.world.centerY, "gun");
    this.gun.anchor.setTo(0.1, 0.6);
    this.gun.animations.add('fire', [0,1,2,3,0], 15, true, true);
    game.physics.enable(this.gun, Phaser.Physics.ARCADE);

    this.gun_location = this.world.create(this.game.world.centerX, this.game.world.centerY, null);
    this.gun_location.anchor.setTo(0.1, 0.6);
    game.physics.enable(this.gun_location, Phaser.Physics.ARCADE);

    this.weapon = game.add.weapon(10000, 'bullet');
    this.weapon.bulletKillType = Phaser.Weapon.KILL_WORLD_BOUNDS;
    this.weapon.bulletSpeed = 200;
    this.weapon.fireRate = 400;
    this.weapon.trackSprite(this.gun_location, 13, 4, true);
    this.weapon.bulletAngleVariance = 1;
    this.weapon.onFire.add(function(){
      GameState.sound.play();
      GameState.emitter.x = GameState.weapon.x;
      GameState.emitter.y = GameState.weapon.y;
      GameState.emitter.explode(100, 15);
    });

    this.lasso = this.world.create(this.game.world.centerX/3, this.game.world.centerY/3, "lasso");
    this.lasso.animations.add('spin', [0,1,2,3,4,5,6,7], 15, true, true);
    this.lasso.animations.play("spin", 16, true, false);
    this.lasso.visible = false;
    this.lasso.anchor.setTo(.25, 0.8);
    game.physics.enable(this.lasso, Phaser.Physics.ARCADE);

    this.emitter = game.add.emitter(game.input.mousePointer.x, game.input.mousePointer.y, 1000);
    this.emitter.gravity = 0;
    this.emitter.particleDrag.x = 20;
    this.emitter.particleDrag.y = 20;
    this.emitter.makeParticles('spark', [0, 1, 2, 3]);
    this.emitter.setRotation(0, 0);
    // this.emitter.start(false, 500, 10);


    this.grassGroup = game.add.group();
    this.world.add(this.grassGroup);
  
    for(var i = 0; i < 1000; i++){
      var grass = this.grassGroup.create(game.rnd.integerInRange(0, this.game.world.width/3), game.rnd.integerInRange(0, this.game.world.height/3), 'grass', game.rnd.integerInRange(0,7));
      grass.anchor.setTo(.5, .5);
      game.physics.enable(grass, Phaser.Physics.ARCADE);
      grass.body.immovable = true;
      grass.body.stopVelocityOnCollide = false;
      grass.body.checkCollision.up = false;
      grass.body.checkCollision.down = false;
      grass.body.checkCollision.left = false;
      grass.body.checkCollision.right = false;
      grass.body.checkCollision.any = false;
      grass.body.setSize(24,9,-9,3);
    }

    this.slimes = game.add.group();
    this.world.add(this.slimes);
    this.slime_explosion = game.add.emitter(0, 0, 1000);
    this.slime_explosion.gravity = 0;
    this.slime_explosion.particleDrag.x = 400;
    this.slime_explosion.particleDrag.y = 400;
    this.slime_explosion.makeParticles('slime_particles', [0, 1, 2, 3, 4, 5, 6, 7]);
    spawn_timer = game.time.create(false);
    spawn_timer.loop(2000, function(){
      var slime = GameState.slimes.create(
        game.rnd.integerInRange(0, this.game.world.width)/3, game.rnd.integerInRange(0, this.game.world.height)/3, 'slime');
      game.physics.enable(slime, Phaser.Physics.ARCADE);
      slime.anchor.setTo(.5, .5);
      slime.body.setSize(30, 15, -9, 6);
      slime.body.stopVelocityOnCollide = false;
      slime.body.immovable = true;
      slime.animations.add('down', [0,0,1,2,3], 15, true, true).onLoop.add(slime_bounce, this);
      slime.animations.add('left', [4,4,5,6,7], 15, true, true).onLoop.add(slime_bounce, this);
      slime.animations.add('right', [8,8,9,10,11], 15, true, true).onLoop.add(slime_bounce, this);
      slime.animations.add('up', [12,12,13,14,15], 15, true, true).onLoop.add(slime_bounce, this);
      slime.animations.play('down', true, true);

    }, this);
    spawn_timer.start();


    this.lasso_hoop = this.world.create(0, 0, "lasso_projectile");
    game.physics.enable(this.lasso_hoop, Phaser.Physics.ARCADE);
    this.lasso_hoop.anchor.setTo(0.5, 1);
    this.lasso_hoop.body.allowRotation = false;
    this.lasso_hoop.visible = false;

    this.lasso_rope = this.world.create(0, 0, "lasso_projectile", 1);
    game.physics.enable(this.lasso_rope, Phaser.Physics.ARCADE);
    this.lasso_rope.anchor.setTo(0, 0.5);
    this.lasso_rope.scale.setTo(0, 1);
    this.lasso_hoop.visible = false;


    this.player = this.world.create(this.game.world.centerX/3, this.game.world.centerY/3, "sheriff");
    this.player.anchor.setTo(0.5, 0.5);
    game.physics.enable(this.player, Phaser.Physics.ARCADE);
    this.player.body.maxVelocity.setTo(100, 100);
    this.player.body.drag.setTo(750, 750)
    this.player.body.collideWorldBounds = true;
    this.player.body.setSize(14*3, 6*3, -9, 30);
    this.player.body.immovable = true;
    this.player.animations.add('down', [0,1,0,2], 15, true, true);
    this.player.animations.add('right', [12,13,12,14], 15, true, true);
    this.player.animations.add('left', [24,25,24,26], 15, true, true);
    this.player.animations.add('up', [36,37,36,38], 15, true, true);
    this.player.maxHealth = 6;
    this.player.health = 6;

    this.health_display = game.add.group();


    this.player.addChild(this.gun);
    this.player.addChild(this.lasso_hoop);
    this.player.addChild(this.lasso_rope);
    this.player.addChild(this.health_display);


  },
  update: function(){
    game.world.children[0].scrollFactorX = 1/3;
    game.world.children[0].scrollFactorY = 1/3;


    this.world.sort('y');
    this.grassGroup.sort('y');
    this.slimes.sort('y');

    this.weapon.bullets.forEach(function(item){item.rotation = 0});

    game.physics.arcade.collide(this.slimes, this.player, function(player, slime){
      console.log("Ouch!");

    }, null, this);

    game.physics.arcade.collide(this.grassGroup, this.player, function(player, grass){
      if(
        !function(){
          var already_tweened = false;
          game.tweens._tweens.forEach(function(tween){
            if(tween.target == grass){
              already_tweened = true;
            }
          });
          return already_tweened;
        }() && (GameState.player.body.velocity.x != 0 || GameState.player.body.velocity.y != 0)
      ){
        GameState.grass_rustle.play();
        direction = game.rnd.integerInRange(0,1)*2-1;
        this.tween_1 = game.add.tween(grass).to({angle:20*direction}, 150, Phaser.Easing.Quadratic.In);
        this.tween_2 = game.add.tween(grass).to({angle:-10*direction}, 100, Phaser.Easing.Quadratic.In);
        this.tween_3 = game.add.tween(grass).to({angle:0}, 50, Phaser.Easing.Quadratic.In);
        this.tween_1.chain(this.tween_2);
        this.tween_2.chain(this.tween_3);
        this.tween_1.start();
      }
    }, null, this);
    game.physics.arcade.overlap(this.weapon.bullets, this.slimes, function(bullet, slime){
      bullet.kill();
      GameState.slime_squish.play();
      GameState.slime_explosion.x = slime.x;
      GameState.slime_explosion.y = slime.y;
      GameState.slime_explosion.setRotation(0, 0);
      GameState.slime_explosion.explode(500, 15);
      GameState.slime_explosion.forEach(function(item){
        this.tween = game.add.tween(item.scale).to({x:0,y:0}, 500, Phaser.Easing.Quartic.In);
        this.tween.start();
      });
      slime.kill();
    }, null, this);

    this.gun.angle = Phaser.Math.radToDeg(game.physics.arcade.angleToPointer({x: this.gun.position.x*3+this.player.x*3, y: this.gun.position.y*3+this.player.y*3}));
    var angle = Phaser.Math.radToDeg(Phaser.Math.angleBetweenPoints(
      {x: this.player.position.x, y: this.player.position.y},
      {x: this.crosshair.position.x, y: this.crosshair.position.y}
    ));
    this.gun_location.position.set(this.gun.position.x/3+this.player.position.x/3, this.gun.position.y/3+this.player.position.y/3);
    this.gun_location.angle = this.gun.angle;
    if(Math.abs(angle) > 90){
      this.gun.scale.set(1, -1);
      this.gun.x = -20/3;
      this.gun.y = 8/3;
      this.weapon.trackOffset.set(13, 4);
      this.lasso.x = this.player.x+20/3;
      this.lasso.y = this.player.y+8/3;
      this.lasso.scale.set(1, 1);
    }else{
      this.gun.scale.set(1,1);
      this.gun.x = 20/3;
      this.gun.y = 8/3;
      this.weapon.trackOffset.set(13,-4);
      this.lasso.x = this.player.x-20/3;
      this.lasso.y = this.player.y+8/3;
      this.lasso.scale.set(-1, 1);
    }
    
    if(game.input.mousePointer.isDown){
      this.gun.animations.play("fire", 16, false, false);
      this.weapon.fire();
    }



    // if(!this.player.data.lasso_deployed){
      if (keys.up.isDown){
        this.player.body.acceleration.y = -1000;
      }
      if (keys.down.isDown){
        this.player.body.acceleration.y = 1000;
      }
      if((!keys.up.isDown && !keys.down.isDown) || (keys.up.isDown && keys.down.isDown)){
        this.player.body.acceleration.y = 0;
      }
      if (keys.left.isDown){
          this.player.body.acceleration.x = -1000;
      }
      if (keys.right.isDown){
          this.player.body.acceleration.x = 1000;
      }
      if((!keys.left.isDown && !keys.right.isDown) || (keys.left.isDown && keys.right.isDown)){
        this.player.body.acceleration.x = 0;
      }

      if(this.player.body.velocity.x == 0 && this.player.body.velocity.y == 0){
        this.player.frame = this.player.frame - this.player.frame%12;
      }
      if(-135 < angle && angle < -45){
        this.player.animations.play("up", 8, true, true);
      }else if(45 < angle && angle < 135){
        this.player.animations.play("down", 8, true, true);
      }else if(Math.abs(angle) >= 135){
        this.player.animations.play("left", 8, true, true);
      }else if(Math.abs(angle) <= 45){
        this.player.animations.play("right", 8, true, true);
      }
    // }else{
    //   this.player.frame = this.player.frame - this.player.frame%12;
    // }

    if(keys.space.isDown && !this.player.data.lasso_deployed){
      this.lasso.visible = true;
    }
    else{
      this.lasso.visible = false;
    }


    this.crosshair.x = Math.floor(game.input.pointer1.x/3);
    this.crosshair.y = Math.floor(game.input.pointer1.y/3);

  },
  render: function(){
    game.debug.text('FPS: ' + game.time.fps || 'FPS: --', 40, 40, "#ffffff", "40px Courier");
  }
};

game.state.add('GameState', GameState);
game.state.start('GameState');

function slime_bounce(slime, animation){
  var angle = game.rnd.integerInRange(-45,45)+Phaser.Math.radToDeg(Phaser.Math.angleBetweenPoints(slime.position, GameState.player.position));
  slime.body.moveTo(300, 50, angle);
  if(-135 < angle && angle < -45){
    slime.animations.play("up", 15, true, true);
  }else if(45 < angle && angle < 135){
    slime.animations.play("down", 15, true, true);
  }else if(Math.abs(angle) >= 135){
    slime.animations.play("left", 15, true, true);
  }else if(Math.abs(angle) <= 45){
    slime.animations.play("right", 15, true, true);
  }
}