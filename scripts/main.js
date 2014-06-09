(function(){

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
        Vector = Matter.Vector

//-- Engine Setup

    var container = document.getElementById('canvas-container');
    var screen_width = window.innerWidth;
    var screen_height = window.innerHeight;

    var world = World.create({
        bounds: {
            min: { x: 0, y: 0 },
            max: { x: screen_width, y: screen_height }
        },
        gravity: {
            x: 0,
            y: 1
        }
    });

    var engine = Engine.create(container, {
        positionIterations: 1,
        velocityIterations: 4,
        enableSleeping: true,
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
        Bodies.rectangle(screen_width/2, screen_height-30, screen_width, 100, { isStatic: true, groupId: groupId }),
        Bodies.rectangle(screen_width+offset, 50, 50.5, 100, { isStatic: true, groupId: groupId }),
        Bodies.rectangle(-offset, screen_height-50, 50.5, 100, { isStatic: true, groupId: groupId })
    ]);

    // Skin Layer
    var skinLayer = Composites.stack(-12, screen_height-100, parseInt(screen_width/10.9), 1, 2.9, 2.6, function(x, y, column, row) {
        return Bodies.rectangle (x, y, 12, 10, {density: 1, friction: 10, isStatic: false});
    });
    skinLayer.id = 100;
    skinLayer.bodies[0].isStatic = true;
    skinLayer.bodies[skinLayer.bodies.length-1].isStatic = true;
    Composites.chain(skinLayer, 0.5, 0, -0.5, 0, { stiffness: 1, length: 2 });

    // Puss/Boil Layer
    var pussComposite = Composite.create({
        label: 'Puss',
        id: 101
    });

    var pussOptions = {
        density: 0.1,
        friction: 0.1
    }

    // Hand Layer
    var handComposite = Composite.create({
        label: 'Fingers',
        id: 102
    });
    var mouseJoint = { x: screen_width/2, y: screen_height/2};
    var finger = Bodies.circle(screen_width/2, screen_height/2, 20, { id: 300, isStatic: false, friction: 1, density: 100 });
    var thumb = Bodies.circle(screen_width/2, screen_height/2, 20, { id: 301, isStatic: false, friction: 1, density: 100 });
    var fingerJoint1 = Constraint.create({
        label: "Mouse to Finger",
        id: 200,
        pointA: mouseJoint,
        bodyB: finger,
        length: 70,
        stiffness: 0.1
    });
    var fingerJoint2 = Constraint.create({
        label: "Mouse to Thumb",
        id: 201,
        pointA: mouseJoint,
        bodyB: thumb,
        length: 70,
        stiffness: 0.1
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
        length: screen_width/3,
        stiffness: 0.01
    });
    var fingerJoint5 = Constraint.create({
        label: "Thumb to Top Right Corner",
        id: 204,
        pointA: {x: screen_width, y: 0},
        bodyB: thumb,
        length: screen_width/3,
        stiffness: 0.01
    });

//-- World Init

    World.add(world, skinLayer);
    World.add(world, pussComposite);
    Composite.add(handComposite, [mouseJoint, finger, thumb, fingerJoint1, fingerJoint2, fingerJoint3, fingerJoint4, fingerJoint5]);
    World.add(world, handComposite);
    Engine.run(engine);

//-- Events

    var pinchOffset = 170;
    var maxY = screen_height-60;
    var retina = window.devicePixelRatio > 1;

    Events.on(engine, 'mousemove', function(event) {

        var posX = retina && !debug ? event.mouse.position.x/2 : event.mouse.position.x;
        var posY = retina && !debug ? event.mouse.position.y/2 : event.mouse.position.y;

        fingerJoint1.pointA = fingerJoint2.pointA = {
            x: posX,
            y: Math.min(posY, maxY)
        };

    });

    var mod = 0;

    Events.on(engine, 'tick', function() {

        finger.angle = thumb.angle = 0;

        // Pinching action
        if (engine.input.mouse.button === 0 && pinchOffset > 50) {
            pinchOffset = pinchOffset-5;
            fingerJoint3.length = pinchOffset;
            fingerJoint1.length = fingerJoint2.length = pinchOffset/2;
        } else if (engine.input.mouse.button === -1 && pinchOffset <= 140) {
            pinchOffset++;
            fingerJoint3.length = pinchOffset;
            fingerJoint1.length = fingerJoint2.length = pinchOffset/2;
        }

        // Puss/Boil action
        mod++;
        if (mod % 25 == 0) {

            if (pussComposite.bodies.length > 70) {
                var randomIndex = parseInt(Math.random()*pussComposite.bodies.length);
                Body.translate(pussComposite.bodies[randomIndex],
                    Vector.sub({x: (Math.random()*screen_width), y: screen_height-78}, pussComposite.bodies[randomIndex].position));
            } else {
                Composite.addBody(pussComposite, Bodies.circle((Math.random()*screen_width), screen_height-78, 4+(Math.random()*20), pussOptions));
            }
        }

//        for (var i = 0; i < pussComposite.bodies.length; i++) {
//            if (pussComposite.bodies[i].position.x < 0 ||
//                pussComposite.bodies[i].position.x > screen_width ||
//                pussComposite.bodies[i].position.y < 0 ||
//                pussComposite.bodies[i].position.y > screen_height) {
//                Body.translate(pussComposite.bodies[randomIndex],
//                    Vector.sub({x: (Math.random()*screen_width), y: screen_height-78}, pussComposite.bodies[randomIndex].position));
//            }
//        }
    });
})();