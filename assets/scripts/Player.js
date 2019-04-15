
//var Enemy = require("Enemy"); 初始化Enemy 脚本

////////////////////////////// 属性设定模块//////////////////////////////
cc.Class({
    extends: cc.Component,

    properties: {
        speed: cc.v2(0, 0),             //  移动速度
        maxSpeed: cc.v2(2000, 2000),    //  最大速度移动速度
        gravity: -3000,                 //  重力
        drag: 1000,                     //  上向拉力
        direction: 0,                   //  移动方向判断
        jumpSpeed: 700,                 //  跳跃高度
        jumpCount: 0,                   //  跳跃次数 落地之后才可以再跳
        hunker: false,                  //  是否蹲下
                                        //  isCollisionable: true,
        isWallCollisionCount: 0,        //  
                                        //  OverNode: cc.Node,//游戏结束框 挂载 的 节点
        getScore: 0,                    //  得分
        isDied: false,                  //  死亡状态
        CoinJump: cc.Prefab,            //  会跳跃的金币预设体
                                        //  ScoreBar:         //分数栏 挂载 的 节点
        fallDown: false,                //  是否为下落状
        life: 1,                        //  生命数量
        buttonIsPressed: false,         //  左右键盘是否被摁下
        
        rabbit: {
            default: null,
            type: cc.AnimationClip,     //  无操作时的动画
        },
        dieAudio: {
            default: null,
            type: cc.AudioClip          //  死亡时的音效
        },
        jumpAudio: {
            default: null,
            type: cc.AudioClip          //  跳跃时的音效
        },
        hit_block_Audio: {
            default: null,
            type: cc.AudioClip          //  撞击方块时的音效
        },
        player_decrease_Audio: {        //  人物变小音效
            default: null,
            type: cc.AudioClip
        },
        world1_music: {                 //  背景音乐
            default: null,
            type: cc.AudioClip
        },
    },

////////////////////////////// 初始化模块///////////////////////////////
    onLoad: function () {
        Global.playIsAlive = true;                                                      //  全局 角色是否存活 ==>是的
        cc.audioEngine.stopAll();                                                       //  暂停全部音乐
        cc.audioEngine.playEffect(this.world1_music, true, Global.volume);              //  播放 world,music 音乐 参数格式=> cc.audioEngine.playEffect(audio, loop, volume);
        var collisionManager = cc.director.getCollisionManager();                       //  获取碰撞检测系统
        collisionManager.enabled = true;                                                //  默认碰撞检测系统开关 ==>开
        // collisionManager.enabledDebugDraw = true;                                    //  碰撞组件 的 碰撞检测 的 包围盒范围开关 ==>开
        // collisionmanager.enabledDrawBoundingBox = true;                              //  碰撞组件 的 碰撞检测范围开关 ==>开
        var colliders = this.getComponents(cc.PolygonCollider);                         //  返回节点上 PolygonCollider(碰撞组件) 组件数据到 colliders
        colliders[0].enabled = true;                                                    //  colliders 第 0 顶点开关 ==>开
        colliders[1].enabled = false;                                                   //  colliders 第 1 顶点开关 ==>关
        // this.OverNode.active = false;                                                //  游戏结束框 的 激活开关 ==>关
        cc.find('over').active = false;                                                 //  (find)寻找当前场景节点 over(游戏结束框) 的 激活开关 ==>关
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);     //  键盘监视器 ==>开 (按键按下 执行函数 目标) cc.systemEvent.on(type, callback, target)
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);         //  键盘监视器 ==>开 (按键松开 执行函数 目标) cc.systemEvent.on(type, callback, target)
        this.collisionX = 0;                                                            //  X轴是否碰撞，0：没有碰撞，-1：左方有碰撞，1：右方有碰撞
        this.collisionY = 0;                                                            //  Y轴是否碰撞，0：没有碰撞，-1：左方有碰撞，1：右方有碰撞

        this.prePosition = cc.v2();                                                     //  碰撞之前 的 位置
        this.preStep = cc.v2();                                                         //  碰撞之前 的 步数 
        this.touchingNumber = 0;                                                        //  同时碰撞物体的个数
        this.anim = this.getComponent(cc.Animation);                                    //  返回节点上 Animation(动画组件) 组件数据到 anim
        this.node.zIndex = 999;                                                         //  设置显示层级为第999层,(最顶层,覆盖999以下图层的显示)
        this.Score = cc.find('ScoreBar').getComponent('Score');                         //  (find)寻找当前场景节点 ScoreBar(金币栏) 的 Score(分数脚本组件) 组件数据到 Score
        //this.ScoreBar = this.Score.getComponent('Score');                             //  返回节点 的 Score 子节点 上 Score(分数脚本组件) 组件数据到 ScoreBar
        
    },
    reStart() {
        Global.playIsAlive = true;
    },
    onDestroy() {
        //cc.director.getCollisionManager().enabled = false;
        //cc.director.getCollisionManager().enabledDebugDraw = false;
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    },

    onKeyDown(event) {
        switch (event.keyCode) {
            case cc.macro.KEY.a:
            case cc.macro.KEY.left:
                this.playerLeft();
                break;
            case cc.macro.KEY.d:
            case cc.macro.KEY.right:
                this.playerRight();
                break;
            case cc.macro.KEY.w:
            case cc.macro.KEY.up:
                this.playerUp();
                break;
            case cc.macro.KEY.down:
            case cc.macro.KEY.s:
                this.playerDown();
                break;
        }
    },

    onKeyUp(event) {
        switch (event.keyCode) {

            case cc.macro.KEY.a:
            case cc.macro.KEY.left:
            case cc.macro.KEY.d:
            case cc.macro.KEY.right:
                this.noLRControlPlayer();
                break;
            case cc.macro.KEY.up:
            case cc.macro.KEY.w:
                this.noUpControlPlayer();
                break;
            case cc.macro.KEY.s:
            case cc.macro.KEY.down:
                this.noDownControlPlayer();
                break;
        }
    },
    noDownControlPlayer() {
        if (this.touchingNumber === 0) {
            return;
        }
        if (!this.isDied) {
            if (this.direction !== 0) {
                this.player_walk();
            } else {
                this.player_idle();
            }
            this.hunker = false;
        }
    },
    noLRControlPlayer() {
        this.direction = 0;
        if (!this.isDied && this.jumpCount == 0)//jumpCount 跳跃次数 落地为0 落地之后才可以再跳
        {
            this.player_idle();
        }
        this.buttonIsPressed = false;
    },
    noUpControlPlayer() {
        if (this.touchingNumber !== 0) {
            // this.jumping = false; //是否在跳状态
        }
    },
    playerLeft() {
        if (this.direction !== -1 && this.jumpCount == 0 && !this.isDied) {
            this.player_walk();
        }
        this.buttonIsPressed = true;
        this.turnLeft();
        this.direction = -1;
    },
    playerRight() {
        if (this.direction !== 1 && this.jumpCount == 0 && !this.isDied) {
            this.player_walk();
        }
        this.buttonIsPressed = true;
        this.turnRight();
        this.direction = 1;
    },
    playerUp() {
        console.log('this.jumping: ' + this.jumping);
        console.log('this.jumpCount: ' + this.jumpCount);
        if (!this.jumping && this.jumpCount == 0 && !this.isDied)// 如果活着的没在跳跃状态，并且玩家着地
        {

            this.player_jump();
            this.speed.y = this.jumpSpeed;
            this.jumping = true;
        }
    },
    playerDown() {
        if (this.touchingNumber === 0) {
            return;
        }
        if (!this.hunker && !this.isDied) {
            this.player_hunker();
            this.hunker = true;
        }
    },
    player_idle() {
        this.anim.play("player_idle");
    },
    player_walk() {
        this.anim.play("player_walk");
    },
    player_jump() {
        cc.audioEngine.playEffect(this.jumpAudio, false, Global.volume);
        this.anim.play("player_jump");
    },
    player_hunker() {
        this.anim.play("player_hunker");
    },
    rabbitJump() {//玩家踩到敌人的跳跃
        this.anim.play("player_jump");
        this.speed.y = this.jumpSpeed * 0.5;
    },
    rabbitDieJump() {
        cc.audioEngine.playEffect(this.dieAudio, false, Global.volume);
        this.anim.play("player_die");
        this.speed.y = this.jumpSpeed;
        cc.director.getCollisionManager().enabled = false;
        this.touchingNumber = 0;
        this.isDied = true;
        this.life = 0;
        this.node.parent.getComponent('Cameras').isRun = false;
        Global.playIsAlive = false;
        setTimeout(() => { this.node.destroy() }, 2100)
    },
    OverNodeLoad() {
        if (this.life == 0) {
            this.scheduleOnce(function () {
                // 这里的 this 指向 component
                cc.find('over').active = true;
            }, 2);
        }
    },
    onCollisionEnter: function (other, self) {
        if (this.touchingNumber == 0) {
            if (this.buttonIsPressed) // 左右按键
                this.player_walk();// 有按键时，快要落地之前为walk状态
            else
                this.player_idle();// 没有按键时，快要落地之前为idle状态
        }
        switch (other.tag) {
            case 1://coin.tag = 1
                this.collisionCoinEnter(other, self);
                break;
            case 2://bonusblock6.tag = 2
            case 3://breakableWall = 3
            case 7: //bonusblock6withMushroom.tag = 7
                this.collisionBonusWallEnter(other, self);
                break;
            case 4://enemy.tag = 4
                this.collisionEnemyEnter(other, self);
                break;
            case 5://platform.tag = 5
                this.collisionPlatformEnter(other, self);
                break;
            case 6://water.tag = 6
                this.collisionWaterEnter(other, self);
                break;
            case 8://mushroom.tag = 8
                this.collisionMushroomEnter(other, self);
                break;
        }
    },
    collisionMushroomEnter: function (other, self) {
        var colliders = this.getComponents(cc.PolygonCollider);
        colliders[0].enabled = true;
        colliders[1].enabled = false;
        var actionBy = cc.scaleBy(1, 5 / 3);
        this.node.runAction(actionBy);
        this.life = 2;
    },
    collisionEnemyEnter: function (other, self) {
        // 1st step
        // get pre aabb, go back before collision
        var otherAabb = other.world.aabb;
        var otherPreAabb = other.world.preAabb.clone();

        var selfAabb = self.world.aabb;
        var selfPreAabb = self.world.preAabb.clone();

        // 2nd step
        // forward x-axis, check whether collision on x-axis
        selfPreAabb.x = selfAabb.x;
        otherPreAabb.x = otherAabb.x;
        if (cc.Intersection.rectRect(selfPreAabb, otherPreAabb)) {
            if (this.life == 2) {
                cc.audioEngine.playEffect(this.player_decrease_Audio, false, Global.volume);
                var actionBy = cc.scaleBy(1, 3 / 5);
                this.node.runAction(actionBy);
                this.life--;
            } else if (this.life == 1) {
                this.anim.play("player_die");
                this.rabbitDieJump();
                // this.life = 0
                this.OverNodeLoad();
                return;
            }


            if (this.speed.x < 0 && (selfPreAabb.xMax > otherPreAabb.xMax)) {

                // this.node.x = otherPreAabb.xMax - this.node.parent.x;
                this.node.x += Math.floor(Math.abs(otherAabb.xMax - selfAabb.xMin));
                this.collisionX = -1;
                // this.node.y= this.node.y;

            }
            else if (this.speed.x > 0 && (selfPreAabb.xMin < otherPreAabb.xMin)) {
                // this.node.y= this.node.y;
                // this.anim.play("player_die");
                // this.node.x = otherPreAabb.xMin - selfPreAabb.width - this.node.parent.x;
                this.node.x -= Math.floor(Math.abs(otherAabb.xMin - selfAabb.xMax));
                // console.log("this.node.x:     " + Math.abs(otherAabb.xMin - selfAabb.xMax));
                this.collisionX = 1;
                // console.log("this.anim.play player_die");

            }

            this.speed.x = 0;
            other.touchingX = true;
            return;
        }

        // 3rd step
        // forward y-axis, check whether collision on y-axis
        selfPreAabb.y = selfAabb.y;
        otherPreAabb.y = otherAabb.y;

        if (cc.Intersection.rectRect(selfPreAabb, otherPreAabb)) {
            if (this.speed.y < 0 && (selfPreAabb.yMax > otherPreAabb.yMax)) {
                this.rabbitJump(); //玩家踩到敌人的跳跃
                return;
            }
            if (this.speed.y > 0 && (selfPreAabb.yMax < otherPreAabb.yMax)) {
                // this.node.removeFromParent();
                if (this.life == 2) {
                    var actionBy = cc.scaleBy(1, 3 / 5);
                    this.node.runAction(actionBy);
                    this.life--;
                } else if (this.life == 1) {
                    this.anim.play("player_die");
                    this.rabbitDieJump();
                    // this.life = 0
                    this.OverNodeLoad();
                    return;
                }
            }
            this.speed.y = 0;
            other.touchingY = true;
        }
        this.isWallCollisionCount++;
    },
    collisionCoinEnter: function (other, self) {
        other.node.removeFromParent();
        this.Score.addCoin();
        // this.uiLayerComonent.addGold();
    },
    collisionWaterEnter: function (other, self) {
        var otherAabb = other.world.aabb;
        var otherPreAabb = other.world.preAabb.clone();

        var selfAabb = self.world.aabb;
        var selfPreAabb = self.world.preAabb.clone();
        selfPreAabb.y = selfAabb.y;
        otherPreAabb.y = otherAabb.y;

        if (cc.Intersection.rectRect(selfPreAabb, otherPreAabb)) {
            console.log('other: ' + other.tag);
        }
        cc.audioEngine.playEffect(this.dieAudio, false, Global.volume);
        this.anim.play("player_die");
        this.life = 0;
        Global.playIsAlive = false;
        this.node.runAction(cc.fadeOut(.5));
        this.OverNodeLoad();
        // cc.find('over').active = true;
        // cc.director.pause();
        this.scheduleOnce(function () {
            this.node.removeFromParent();
        }, 2);
        this.node.parent.getComponent('Cameras').isRun = false;
        return;
    },
    collisionBonusWallEnter: function (other, self) {
        this.touchingNumber++;
        this.jumpCount = 0;
        var otherAabb = other.world.aabb;
        var otherPreAabb = other.world.preAabb.clone();

        var selfAabb = self.world.aabb;
        var selfPreAabb = self.world.preAabb.clone();
        selfPreAabb.x = selfAabb.x;
        otherPreAabb.x = otherAabb.x;

        if (cc.Intersection.rectRect(selfPreAabb, otherPreAabb)) {
            if (this.speed.x < 0 && (selfPreAabb.xMax > otherPreAabb.xMax)) {
                if (Math.abs(selfPreAabb.yMin - otherPreAabb.yMax) < 0.3) {
                    this.collisionX = 0;
                }
                else
                    this.collisionX = -1;
            }
            else if (this.speed.x > 0 && (selfPreAabb.xMin < otherPreAabb.xMin)) {
                if (Math.abs(selfPreAabb.yMin - otherPreAabb.yMax) < 0.3) {
                    this.collisionX = 0;
                }
                else
                    this.collisionX = 1;
            }

            this.speed.x = 0;
            other.touchingX = true;

            return;
        }
        selfPreAabb.y = selfAabb.y;
        otherPreAabb.y = otherAabb.y;

        if (cc.Intersection.rectRect(selfPreAabb, otherPreAabb)) {
            if (Global.isGotCoin) {
                this.Score.addCoin();
                Global.isGotCoin = false;
            }
            if (this.speed.y < 0 && (selfPreAabb.yMax > otherPreAabb.yMax)) {
                this.node.y = otherPreAabb.yMax - this.node.parent.y;
                this.jumping = false;// 碰到砖块不用跳
                this.collisionY = -1;
            }
            else if (this.speed.y > 0 && (selfPreAabb.yMin < otherPreAabb.yMin)) {
                this.node.y = otherPreAabb.yMin - selfPreAabb.height - this.node.parent.y;
                this.collisionY = 1;
            }
            else if ((selfPreAabb.xMax == otherPreAabb.xMin)) {
                this.fallDown = true;
            }

            this.speed.y = 0;
            other.touchingY = true;
        }

        this.isWallCollisionCount++;
    },
    collisionPlatformEnter: function (other, self) {
        // this.node.color = cc.Color.RED;
        this.touchingNumber++;
        this.jumpCount = 0;
        // 碰撞系统会计算出碰撞组件在世界坐标系下的相关的值，并放到 world 这个属性里面
        var otherAabb = other.world.aabb;
        // 上一次计算的碰撞组件的 aabb 碰撞框
        var otherPreAabb = other.world.preAabb.clone();
        var selfAabb = self.world.aabb;
        var selfPreAabb = self.world.preAabb.clone();
        selfPreAabb.x = selfAabb.x;
        otherPreAabb.x = otherAabb.x;

        if (cc.Intersection.rectRect(selfPreAabb, otherPreAabb)) {

            if (this.speed.x < 0 && (selfPreAabb.xMax > otherPreAabb.xMax)) {
                this.node.x += Math.floor(Math.abs(otherAabb.xMax - selfAabb.xMin));
                this.collisionX = -1;
            }
            else if (this.speed.x > 0 && (selfPreAabb.xMin < otherPreAabb.xMin)) {
                this.node.x -= Math.floor(Math.abs(otherAabb.xMin - selfAabb.xMax));
                this.collisionX = 1;
            } else if (this.speed.x == 0 && (selfPreAabb.xMax == otherPreAabb.xMin)) {
                this.fallDown = true;
            }

            this.speed.x = 0;
            other.touchingX = true;
            return;
        }
        selfPreAabb.y = selfAabb.y;
        otherPreAabb.y = otherAabb.y;

        if (cc.Intersection.rectRect(selfPreAabb, otherPreAabb)) {
            if (this.speed.y < 0 && (selfPreAabb.yMax > otherPreAabb.yMax)) {
                this.node.y = otherPreAabb.yMax - this.node.parent.y;
                this.jumping = false;//下落碰到地面或砖块木桩等
                this.collisionY = -1;
            }
            else if (this.speed.y > 0 && (selfPreAabb.yMin < otherPreAabb.yMin)) {
                cc.audioEngine.playEffect(this.hit_block_Audio, false, Global.volume);
                this.node.y = otherPreAabb.yMin - selfPreAabb.height - this.node.parent.y;
                this.collisionY = 1;
            }

            this.speed.y = 0;
            other.touchingY = true;
        }
        this.isWallCollisionCount++;

    },

    onCollisionStay: function (other, self) {
        if (!Global.playIsAlive) {
            if (other.tag !== 6) {
                this.rabbitDieJump();
                this.OverNodeLoad();
            } else
                cc.audioEngine.playEffect(this.dieAudio, false, Global.volume);
        }
        this.jumpCount = 0;
        if (this.collisionY === -1) {
            if (other.node.group === 'Platform') {
                var motion = other.node.getComponent('PlatformMotion');
                if (motion) {
                    this.node.x += motion._movedDiff;
                }
            }
        }
    },

    onCollisionExit: function (other) {
        this.fallDown = false;
        if (other.node.group == 'platform') {
            console.log("this.touchingNumber: " + this.touchingNumber);
            this.touchingNumber--;
        }
        this.jumpCount = 1;
        if (this.jumpCount !== 0 && this.touchingNumber === 0) // 非着陆状态
        {
            this.anim.play("player_jump");
        }
        if (this.touchingNumber === 0) {
            // this.node.color = cc.Color.WHITE;
            this.jumping = true;// 在空中设为跳跃状态
        }

        if (other.touchingX) {
            this.collisionX = 0;
            other.touchingX = false;
        }
        else if (other.touchingY) {
            this.collisionY = 0;
            other.touchingY = false;
        }
        this.isWallCollisionCount--;
    },

    update: function (dt) {
        if (this.touchingNumber === 0 || this.fallDown || this.touchingNumber === -1) {
            this.speed.y += this.gravity * dt;
            if (Math.abs(this.speed.y) > this.maxSpeed.y) {
                this.speed.y = this.speed.y > 0 ? this.maxSpeed.y : -this.maxSpeed.y;
            }
        }
        if (this.node.y > 600) {
            this.touchingNumber = 0
        }
        if (this.direction === 0) {
            if (this.speed.x > 0) {
                this.speed.x -= this.drag * dt;
                if (this.speed.x <= 0) this.speed.x = 0;
            }
            else if (this.speed.x < 0) {
                this.speed.x += this.drag * dt;
                if (this.speed.x >= 0) this.speed.x = 0;
            }
        }
        else {
            this.speed.x += (this.direction > 0 ? 1 : -1) * this.drag * dt;
            if (Math.abs(this.speed.x) > this.maxSpeed.x) {
                this.speed.x = this.speed.x > 0 ? this.maxSpeed.x : -this.maxSpeed.x;
            }
        }

        if (this.speed.x * this.collisionX > 0) {
            this.speed.x = 0;
        }

        this.prePosition.x = this.node.x;
        this.prePosition.y = this.node.y;

        this.preStep.x = this.speed.x * dt;
        this.preStep.y = this.speed.y * dt;

        this.node.x += this.speed.x * dt * Global.addSpeed;
        this.node.y += this.speed.y * dt;
    },

    turnLeft() {
        this.node.scaleX = -Math.abs(this.node.scaleX);
    },

    turnRight() {
        this.node.scaleX = Math.abs(this.node.scaleX);
    },
});
