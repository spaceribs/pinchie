console.table({
    "Creator": {
        "Name": "Aaron Brewer",
        "Email": "spaceribs@gmail.com",
        "Website": "http://aaronbrewer.net",
        "Reddit": "http://www.reddit.com/user/spaceribs",
        "Github": "https://github.com/spaceribs"
    }
});

var mainInit = function () {

//-- Matter aliases
    var Engine = Matter.Engine,
        World = Matter.World,
        Render = Matter.Render,
        Bodies = Matter.Bodies,
        Body = Matter.Body,
        Composite = Matter.Composite,
        Composites = Matter.Composites,
        Constraint = Matter.Constraint,
        Events = Matter.Events,
        Vector = Matter.Vector;

//-- Engine Setup

    var container = document.getElementById('canvas-container');
    var screen_width = window.innerWidth;
    var screen_height = window.innerHeight;

    var world = World.create({
        bounds: {
            min: {x: 0, y: 0},
            max: {x: screen_width, y: screen_height}
        },
        gravity: {
            x: 0,
            y: 1
        }
    });

    var engine = Engine.create(container, {
        positionIterations: 1,
        velocityIterations: 10,
        enableSleeping: false,
        render: {
            element: container,
            controller: RenderPinchie,
            options: {
                width: screen_width,
                height: screen_height
            }
        },
        world: world
    });

    var debug = engine.render.controller == Render;

//-- World Setup

    // World Boundaries
    var groupId = Body.nextGroupId();
    var offset = 25;
    World.add(world, [
        Bodies.rectangle(screen_width / 2, screen_height - 30, screen_width, 100, {isStatic: true, groupId: groupId, label: 'Flesh'}),
        Bodies.rectangle(screen_width + offset, 50, 50.5, 100, {isStatic: true, groupId: groupId, label: 'Flesh'}),
        Bodies.rectangle(-offset, screen_height - 50, 50.5, 100, {isStatic: true, groupId: groupId, label: 'Flesh'})
    ]);

    // Skin Layer
    var skinLayer = Composites.stack(-12, screen_height - 100, parseInt(screen_width / 10.9), 1, 2.9, 2.6, function (x, y, column, row) {
        return Bodies.rectangle(x, y, 12, 10, {
            density: 1000,
            friction: 10,
            isStatic: false,
            label: 'Skin',
            frictionAir: 1
        });
    });
    skinLayer.id = 100;
    skinLayer.bodies[0].isStatic = true;
    skinLayer.bodies[skinLayer.bodies.length - 1].isStatic = true;
    Composites.chain(skinLayer, 0.5, 0, -0.5, 0, {stiffness: 0.1, length: 0.1, label: 'Skin'});

    // Puss/Boil Layer
    var pussComposite = Composite.create({
        label: 'Puss',
        id: 101
    });

    var pussOptions = {
        density: 100,
        friction: 10,
        label: 'Puss'
    };

    // Particle Layer
    var particleComposite = Composite.create({
        label: 'Particles',
        id: 103
    });

    var particleOptions = {
        density: 1,
        friction: 1,
        timeScale: 0.5,
        slop: 0.1,
        label: 'Particle'
    };

    // Hand Layer
    var handComposite = Composite.create({
        label: 'Fingers',
        id: 102
    });
    var mouseJoint = {x: screen_width / 2, y: screen_height / 2};
    var finger = Bodies.circle(screen_width / 2, screen_height / 2, 20, {
        id: 300,
        isStatic: false,
        friction: 100,
        density: 1000,
        frictionAir: 1
    });
    var thumb = Bodies.circle(screen_width / 2, screen_height / 2, 20, {
        id: 301,
        isStatic: false,
        friction: 100,
        density: 1000,
        frictionAir: 1
    });
    var fingerJoint1 = Constraint.create({
        label: "Mouse to Finger",
        id: 200,
        pointA: mouseJoint,
        bodyB: finger,
        length: 70,
        stiffness: 0.2
    });
    var fingerJoint2 = Constraint.create({
        label: "Mouse to Thumb",
        id: 201,
        pointA: mouseJoint,
        bodyB: thumb,
        length: 70,
        stiffness: 0.2
    });
    var fingerJoint3 = Constraint.create({
        label: "Finger to Thumb",
        id: 202,
        bodyA: finger,
        bodyB: thumb,
        length: 140,
        stiffness: 0.1
    });
    var fingerJoint4 = Constraint.create({
        label: "Finger to Top Left Corner",
        id: 203,
        pointA: {x: 0, y: 0},
        bodyB: finger,
        length: screen_width / 3,
        stiffness: 0.01
    });
    var fingerJoint5 = Constraint.create({
        label: "Thumb to Top Right Corner",
        id: 204,
        pointA: {x: screen_width, y: 0},
        bodyB: thumb,
        length: screen_width / 3,
        stiffness: 0.01
    });

//-- World Init

    World.add(world, skinLayer);
    World.add(world, pussComposite);
    World.add(world, particleComposite);
    Composite.add(handComposite, [mouseJoint, finger, thumb, fingerJoint1, fingerJoint2, fingerJoint3, fingerJoint4, fingerJoint5]);
    World.add(world, handComposite);
    Engine.run(engine);

//-- Events

    var pinchOffset = 170;
    var maxY = screen_height - 40;
    var retina = window.devicePixelRatio > 1;


    if (Modernizr.touch) {

        var mc = new Hammer(container);

        var pinch = new Hammer.Pinch();
        var rotate = new Hammer.Rotate();
        var pan = new Hammer.Pan({
            direction: "DIRECTION_ALL"
        });
        pinch.recognizeWith(rotate);

        mc.add([pinch, rotate, pan]);

        Events.on(engine, 'mouseup', function (event) {
            var center = {x: screen_width / 2, y: screen_height / 2};
            fingerJoint1.pointA = center;
            fingerJoint2.pointA = center;
            fingerJoint3.length = 140;
        });

        var yoffset = 100;
        var xoffset = 50;

        mc.on("pinch rotate", function(ev) {

            if (ev.pointers[0].clientX < ev.pointers[1].clientX) {

                fingerJoint3.length = ev.pointers[1].clientX/2 - ev.pointers[0].clientX/2;

                fingerJoint1.pointA = {
                    x: ev.pointers[0].clientX,
                    y: ev.pointers[0].clientY
                };

                fingerJoint2.pointA = {
                    x: ev.pointers[1].clientX,
                    y: ev.pointers[1].clientY
                };

            } else {

                fingerJoint3.length = ev.pointers[0].clientX/2 - ev.pointers[1].clientX/2;

                fingerJoint1.pointA = {
                    x: ev.pointers[1].clientX,
                    y: ev.pointers[1].clientY
                };

                fingerJoint2.pointA = {
                    x: ev.pointers[0].clientX,
                    y: ev.pointers[0].clientY
                };

            }

        });

    } else {
        Events.on(engine, 'mousemove', function (event) {

            var posX = retina && !debug ? event.mouse.position.x / 2 : event.mouse.position.x;
            var posY = retina && !debug ? event.mouse.position.y / 2 : event.mouse.position.y;

            fingerJoint1.pointA = fingerJoint2.pointA = {
                x: posX,
                y: Math.min(posY, maxY)
            };

        });
    }

    var mod = 0;

    Events.on(engine, 'tick', function () {

        finger.angle = thumb.angle = 0;

        // Pinching action
        if (!Modernizr.touch) {
            if (engine.input.mouse.button === 0 && pinchOffset > 20) {
                pinchOffset = pinchOffset - 10;
                fingerJoint3.length = pinchOffset;
                fingerJoint1.length = fingerJoint2.length = pinchOffset / 2;
            } else if (engine.input.mouse.button === -1 && pinchOffset <= 140) {
                pinchOffset += 10;
                fingerJoint3.length = pinchOffset;
                fingerJoint1.length = fingerJoint2.length = pinchOffset / 2;
            }
        }

        // Puss/Boil action
        mod++;
        if (mod % Math.floor(Math.random() * 200) == 0) {
            if (pussComposite.bodies.length < Math.round(screen_width/100)) {
                var randomRadius = 10 + (Math.random() * 20);
                var newBody = Bodies.circle((Math.random() * screen_width), screen_height - 76, randomRadius, pussOptions, 5);
                newBody.label = 'Puss';
                newBody.lifetime = 0;
                Composite.addBody(pussComposite, newBody);
            }
        }

        for (var e = 0; e < pussComposite.bodies.length; e++ ){
            var puss = pussComposite.bodies[e];
            if ( puss.position.y < 0 || puss.position.y > screen_height || puss.position.x < 0 || puss.position.x > screen_width) {
                Body.translate(puss,
                    Vector.sub({
                        x: (Math.random() * screen_width),
                        y: screen_height - 76
                    }, puss.position));
                Body.resetForcesAll(puss);
                puss.lifetime = 0;
            }
            puss.lifetime++;
        }

        for (var e = 0; e < particleComposite.bodies.length; e++ ){
            var particle = particleComposite.bodies[e];
            if (particle.position.y < 0 || particle.position.y > screen_height || particle.position.x < 0 || particle.position.x > screen_width) {
                Body.translate(particle,
                    Vector.sub({
                        x: (Math.random() * screen_width),
                        y: screen_height - 76
                    }, particle.position));
                Body.resetForcesAll(particle);
            }
        }


        //if (mod % 10 == 0 && particleComposite.bodies.length) {
        //    Composite.removeBody(particleComposite, particleComposite.bodies[particleComposite.bodies.length - 1]);
        //}

    });

    Events.on(engine, 'collisionStart collisionEnd', function(event) {
        var pairs = event.pairs;
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i];
            if ( pair.bodyA.label === 'Puss' && pair.bodyB.label === 'Skin' ) {
                if (pair.bodyA.position.y + pair.bodyA.circleRadius < pair.bodyB.position.y) {
                    var particles = particleComposite.bodies;
                    var puss = pair.bodyA;

                    if (puss.lifetime > 100) {

                        if (particleComposite.bodies.length < Math.round(screen_width/50)) {
                            for (var e = 0; e < Math.round(screen_width/50); e++) {
                                var randomRadius = 0.5 + (Math.random() * 3);
                                var newBody = Bodies.circle((Math.random() * screen_width), screen_height - 90, randomRadius, particleOptions);
                                newBody.label = 'Particle';
                                Composite.addBody(particleComposite, newBody);
                            }
                        }

                        for (var e = 0; e < particles.length; e++) {
                            var particle = particles[e];
                            if (particle.speed < 1) {
                                Body.translate(particle,
                                    Vector.sub(puss.position, particle.position));
                                Body.resetForcesAll(particle);
                                particle.force = { x: (Math.random()/10)-0.1, y: -0.5 };
                            }
                        }
                    }

                    Body.translate(puss,
                        Vector.sub({
                            x: (Math.random() * screen_width),
                            y: screen_height - 76
                        }, puss.position));
                    Body.resetForcesAll(puss);
                    puss.lifetime = 0;
                }
            }
        }
    })
};

mainInit();

$(window).resize(_.debounce(function () {
    location.reload();
}, 1000));

$(window).resize(function () {
    $('#canvas-container').empty();
});
