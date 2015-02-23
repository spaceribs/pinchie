/**
 * See [Demo.js](https://github.com/liabru/matter-js/blob/master/demo/js/Demo.js)
 * and [DemoMobile.js](https://github.com/liabru/matter-js/blob/master/demo/js/DemoMobile.js) for usage examples.
 *
 * @class RenderPaper
 */

var RenderPaper = {},
    Common = Matter.Common,
    Composite = Matter.Composite,
    Vector = Matter.Vector;

window.renderpaper = {};

(function paperRenderer() {

    /**
     * Description
     * @method create
     * @param {object} options
     * @return {render} A new renderer
     */
    RenderPaper.create = function(options) {
        var defaults = {
            controller: RenderPaper,
            element: null,
            canvas: null,
            paperScope: null,
            options: {
                width: 800,
                height: 600,
                background: '#fafafa',
                wireframeBackground: '#222',
                hasBounds: false,
                enabled: true
            }
        };

        var render = Common.extend(defaults, options);
        render.canvas = render.canvas || _createCanvas(render.options.width, render.options.height);
        render.context = render.canvas.getContext('2d');
        render.paperScope = new paper.PaperScope();

        render.bounds = render.bounds || {
            min: {
                x: 0,
                y: 0
            },
            max: {
                x: render.options.width,
                y: render.options.height
            }
        };

        render.paperScope.setup(render.canvas);

        var background = new paper.Path.Rectangle( paper.view.bounds.topLeft, paper.view.bounds.bottomRight );

        background.fillColor = {
            gradient: {
                stops: ['#EDEFFF', '#9DF']
            },
            origin: paper.view.bounds.bottomCenter,
            destination: paper.view.bounds.topCenter
        };

        render.fingersLayer = new paper.Group();
        render.pussLayer = new paper.Group();
        render.skinLayer = new paper.Path();
        render.boilLayer = new paper.Group();
        render.boilLayer.blendMode = 'overlay';

        render.skinLayer.add(new paper.Point(paper.view.bounds.bottomRight.x+50, paper.view.bounds.bottomRight.y+50));
        render.skinLayer.add(new paper.Point(paper.view.bounds.bottomLeft.x-50, paper.view.bounds.bottomLeft.y+50));
        render.skinLayer.closed = true;
        render.skinLayer.fillColor = {
            gradient: {
                stops: [['#fff',0], ['#fe9090',0.25], ['#ff5c5c',0.5]]
            },
            origin: paper.view.bounds.bottomCenter,
            destination: paper.view.bounds.center
        };
        render.skinLayer.smooth();
        render.skinLayer.strokeColor = "#FFF";
        render.skinLayer.strokeWidth = 5;
        render.skinLayer.strokeJoin = 'bevel';
        render.handLayer = new paper.Group();
        render.handLayer.importJSON(hand);
        render.handLayer.children["Finger"].pivot = new paper.Point(195, 526);
        render.handLayer.children["Thumb"].pivot = new paper.Point(275, 530);
        render.handLayer.children["Arm"].pivot = new paper.Point(280, 510);

        paper.view.update();

//        $.get('scripts/paper.js', function(data){
//            paper.PaperScript.execute(data, render.paperScope);
//        }, 'text');


        if (Common.isElement(render.element)) {
            render.element.appendChild(render.canvas);
        } else {
            Common.log('No "render.element" passed, "render.canvas" was not inserted into document.', 'warn');
        }

        return render;
    };

    /**
     * Clears the renderer. In this implementation, this is a noop.
     * @method clear
     * @param {RenderPaper} render
     */
    RenderPaper.clear = function(render) {
    };

    /**
     * Sets the background CSS property of the canvas
     * @method setBackground
     * @param {render} render
     * @param {string} background
     */
    RenderPaper.setBackground = function(render, background) {
    };

    /**
     * Description
     * @method world
     * @param {engine} engine
     */
    RenderPaper.world = function(engine) {
        //console.log(Composite.get(engine.world, 100, "composite"));
        _renderSkin(engine);
        _renderBoils(engine);
        _renderFingers(engine);
        _renderPuss(engine);
        paper.view.update();
    };

    var _renderFingers = function(engine) {
        var composite = Composite.get(engine.world, 102, "composite");
        var render = engine.render.handLayer;

        if (composite) {
            var fingerBody = Composite.get(composite, 300, "body");
            var thumbBody = Composite.get(composite, 301, "body");
            var fingerPoint = new paper.Point(fingerBody.position);
            var thumbPoint = new paper.Point(thumbBody.position);

            var angle = Vector.angle(fingerBody.position, thumbBody.position) * 180 / Math.PI;
            var dist = Vector.sub(fingerBody.position, thumbBody.position);

            render.children["Thumb"].set({
                position: thumbPoint,
                rotation: angle + (dist.x/8)
            });

            render.children["Finger"].set({
                position: fingerPoint,
                rotation: angle - (dist.x/12)
            });

            render.children["Arm"].set({
                position: thumbPoint,
                rotation: angle + (dist.x/8)
            });
        }
    };

    var _renderSkin = function(engine) {
        var composite = Composite.get(engine.world, 100, "composite");
        var render = engine.render.skinLayer;

        if (composite) {
            var bodies = Composite.allBodies(composite);
            if (render.segments.length-2 !== bodies.length) {
                render.removeSegments(2);
                for (var e = 0; e < bodies.length; e++) {
                    var body = bodies[e];

                    var point = new paper.Point(body.position.x, body.position.y);
                    render.add(point);
                }
            }

            var segments = render.segments.slice(2);

            for (var i = 0; i < bodies.length; i++) {
                segments[i].point.x = bodies[i].position.x;
                segments[i].point.y = bodies[i].position.y;
            }

            //skinRender.smooth();
        }
    };

    var _renderBoils = function(engine) {
        var composite = Composite.get(engine.world, 101, "composite");
        var render = engine.render.boilLayer;

        if (composite) {
            var bodies = Composite.allBodies(composite);
            if (bodies.length !== render.children.length) {
                for (var e = 0; e < bodies.length - render.children.length; e++) {
                    var body = bodies[render.children.length+e];
                    var center = new paper.Point(body.position.x, body.position.y);
                    var boil = new paper.Path.Circle(center, 1);
                    boil.fillColor = {
                        gradient: {
                            stops: [[new paper.Color(1,0,0,0), 1], [new paper.Color(1,0,0,0.4), 0]],
                            radial: true
                        },
                        origin: boil.bounds.topCenter,
                        destination: boil.bounds.rightCenter
                    };
                    boil.opacity = 0;
                    render.addChild( boil );
                }
            }

            for (var i = 0; i < bodies.length; i++) {
                if (bodies[i].position.x > engine.render.options.width || bodies[i].position.x < 0) {
                    render.children[i].visible = false;
                } else {
                    render.children[i].opacity = (bodies[i].lifetime / 100);
                    render.children[i].visible = true;
                    render.children[i].position = new paper.Point(bodies[i].position.x, bodies[i].position.y);
                    var newRadius = bodies[i].circleRadius / render.children[i].bounds.width;
                    if (Math.round(newRadius) !== 1) {
                        render.children[i].scale(newRadius*2);
                    }
                }
            }
        }
    };

    var _renderPuss = function(engine) {

        var composite = Composite.get(engine.world, 103, "composite");
        var render = engine.render.pussLayer;

        if (composite) {
            var bodies = Composite.allBodies(composite);

            if (bodies.length > render.children.length) {
                for (var e = 0; e < bodies.length - render.children.length; e++) {
                    var body = bodies[render.children.length+e];
                    var center = new paper.Point(body.position.x, body.position.y);
                    var puss = new paper.Path.Circle(center, body.circleRadius+1);
                    var grossGreen = 1-(Math.random()/15);
                    var grossBlue = grossGreen - Math.random()/5;
                    var color = new paper.Color(1,grossGreen,grossBlue);
                    //puss.strokeColor = "#FFF";
                    //puss.strokeWidth = 1;
                    puss.fillColor = color;
                    render.addChild( puss );
                }
            }

            for (var i = 0; i < render.children.length; i++) {
                var body = bodies[i];
                var bodyX = Math.round(body.position.x);
                var bodyY = Math.round(body.position.y);
                if (bodyY > engine.render.options.height || bodyX > engine.render.options.width || bodyX < 0 || bodyY < 0 || body.speed <= 0) {
                    render.children[i].visible = false;
                } else {
                    render.children[i].visible = true;
                    render.children[i].position = new paper.Point(bodyX, bodyY+5);
                    render.children[i].opacity = bodies[i].speed;

                }
            }
        }
    };

    /**
     * Description
     * @method _createCanvas
     * @private
     * @param {int} width
     * @param {int} height
     * @return {HTMLElement} HTMLElement
     */
    var _createCanvas = function (width, height) {
        var canvas = document.createElement('canvas');
//        canvas.setAttribute('hidpi',"off");
        canvas.width = width;
        canvas.height = height;
        canvas.onselectstart = function () {
            return false;
        };
        return canvas;
    };

})();
