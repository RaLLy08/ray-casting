class Canvas {
    static WIDTH = 600;
    static HEIGHT = 500;

    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.canvas.width = Canvas.WIDTH;
        this.canvas.height = Canvas.HEIGHT;
    }
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    drawLine(vectorFrom, vectorTo) {
        const {x: x1, y: y1} = vectorFrom;
        const {x: x2, y: y2} = vectorTo;

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }
    drawPoint(vector, r=4) {
        const {x, y} = vector;
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    drawCircle(vector, r) {
        const {x, y} = vector;
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, 2 * Math.PI);
        this.ctx.stroke();
    }
    drawText(x, y, text) {
        this.ctx.font = '24px serif';
        this.ctx.fillText(text, x + 20, y + 20);
    }
    drawRect(x, y, width, height, r=0, g=0, b=0) {
        this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        this.ctx.fillRect(x, y, width, height);
    }
}

const canvasEl = document.getElementById("canvas");
const canvasEl2 = document.getElementById("canvas2");

const canvas = new Canvas(canvasEl);
const canvas2 = new Canvas(canvasEl2);

const mouse = {
    pos: new Vector(0, 0),
    pressed: false
}

const keyboardPressedKeys = {}

canvasEl.onmousemove = (e) => {
    mouse.pos.x = e.offsetX;
    mouse.pos.y = e.offsetY;
}

canvasEl.onmousedown = (e) => {
    mouse.pressed = true;
}

canvasEl.onmouseup = (e) => {
    mouse.pressed = false;
}

document.addEventListener("keydown", (e) => {
    keyboardPressedKeys[e.key] = true;
});
document.addEventListener("keyup", (e) => {
    keyboardPressedKeys[e.key] = false;
});



const getKeyboardMovementVector = () => {
    const movementVector = new Vector(0, 0);

    if (keyboardPressedKeys["w"] || keyboardPressedKeys["ArrowUp"]) {
        movementVector.y -= 1;
    }
    if (keyboardPressedKeys["s"] || keyboardPressedKeys["ArrowDown"]) {
        movementVector.y += 1;
    }
    if (keyboardPressedKeys["a"] || keyboardPressedKeys["ArrowLeft"]) {
        movementVector.x -= 1;
    }
    if (keyboardPressedKeys["d"] || keyboardPressedKeys["ArrowRight"]) {
        movementVector.x += 1;
    }

    if (movementVector.mag() > 1) {
        return movementVector.normalize();
    }

    return movementVector;
}


class Boundary {
    constructor(x1, y1, x2, y2) {
        this.pos1 = new Vector(x1, y1);
        this.pos2 = new Vector(x2, y2);
    }

    draw() {
        canvas.drawLine(this.pos1, this.pos2);
    }
}

class Ray {
    constructor(pos, angle) {
        this.pos = pos;
        this.dir = new Vector(Math.cos(angle), Math.sin(angle));
        this.angle = Vector.toDegrees(this.dir.fullAngle());
    }

    draw() {
        canvas.drawLine(
            this.pos, 
            this.pos.add(
                this.dir.
                scaleBy(30)
            )
        );
    }

    lookAt(vector) {
        this.dir = vector.sub(this.pos).normalize();
    }

    getIntersection(boundary) {
        const x1 = boundary.pos1.x;
        const y1 = boundary.pos1.y;
        const x2 = boundary.pos2.x;
        const y2 = boundary.pos2.y;

        const x3 = this.pos.x;
        const y3 = this.pos.y;
        const x4 = this.pos.x + this.dir.x;
        const y4 = this.pos.y + this.dir.y;

        const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (denominator === 0) {
            return;
        }

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denominator;

        if (t > 0 && t < 1 && u > 0) {
            const intersection = new Vector(
                x1 + t * (x2 - x1),
                y1 + t * (y2 - y1)
            );
            return intersection;
        }
    }
}

class Particle {
    constructor({
        viewAngle = Math.PI / 3,
        viewDirection = 0,
        x = Canvas.WIDTH / 2,
        y = Canvas.HEIGHT / 2,
        raysCount = Vector.toDegrees(viewAngle),
    }={}) {
        this.pos = new Vector(x, y);
        this.raysCount = raysCount;
        this.rays = [];
        this.intersections = [];
        this.viewAngle = viewAngle;
        this.viewDirection = viewDirection;

        this.setRays();
    }

    setViewDirection(vector) {
        const angle = vector.fullAngle();

        const shift = particle.viewAngle / 2;

        this.viewDirection = angle - shift;
    }

    setRays() {
        this.rays = [];

        const viewAngle = Vector.toDegrees(this.viewAngle);
        const viewDirection = Vector.toDegrees(this.viewDirection);

        const fromIndex = 360 - viewAngle - viewDirection;
        const toIndex = 360 - viewDirection;

        const totalSteps = toIndex - fromIndex;
        
        const step = totalSteps / (this.raysCount - 1);

        for (let i = fromIndex; i <= toIndex; i+=step) {
            this.rays.push(
                new Ray(this.pos, Vector.toRadians(i))
            );
        }
    }

    setIntersections(walls) {
        this.intersections = [];

        this.rays.forEach((ray) => {
            let closest = null;
            let record = Infinity;

            walls.forEach((wall) => {
                const intersection = ray.getIntersection(wall);
                if (intersection) {
                    const distance = this.pos.distance(intersection);
                    
                    if (distance < record) {
                        intersection.angle = ray.angle;

                        record = distance;
                        closest = intersection;
                    }
                }
            });

            if (closest) {
                this.intersections.push(closest);
            }
        });
            
    }

    draw() {
        this.intersections.forEach((intersection, i) => {
            if (intersection) {
                canvas.drawLine(this.pos, intersection);
            }
        });

        canvas.drawPoint(this.pos);
    }

    followTo(vector) {
        this.pos = vector;
    }
}

const frameWalls = [
    new Boundary(0, 0, Canvas.WIDTH, 0),
    new Boundary(0, 0, 0, Canvas.HEIGHT),
    new Boundary(Canvas.WIDTH, 0, Canvas.WIDTH, Canvas.HEIGHT),
    new Boundary(0, Canvas.HEIGHT, Canvas.WIDTH, Canvas.HEIGHT),
];

const walls = [
    ...frameWalls,
    new Boundary(50, 100, 50, 500),
    new Boundary(100, 100, 100, 500),
    new Boundary(100, 100, 500, 100),
    new Boundary(500, 100, 500, 400),
    new Boundary(200, 400, 500, 400),
    new Boundary(200, 400, 200, 200),
    new Boundary(200, 200, 400, 200),
    new Boundary(400, 200, 400, 300),
    new Boundary(400, 300, 300, 300),
]

const particle = new Particle({
    raysCount: 600,
    x: 25,
    y: Canvas.HEIGHT - 100,
});

const frame = () => {
    canvas.clear();
    canvas2.clear();

    requestAnimationFrame(frame);

    const keyboardMovementVector = getKeyboardMovementVector();

    const keyboardMovementSpeed = 1;

    const particleMouseVector = new Vector(
        mouse.pos.x - particle.pos.x,
        particle.pos.y - mouse.pos.y
    );

    particle.pos = particle.pos.add(keyboardMovementVector.scaleBy(keyboardMovementSpeed));
    
    particle.setViewDirection(particleMouseVector);

    particle.setRays();
    particle.setIntersections(walls);

    walls.forEach(wall => wall.draw());
    particle.draw();

    const steps = particle.intersections.length;
    const step = Canvas.WIDTH / steps;
    const midRay = particle.intersections[Math.floor(steps / 2)];


    particle.intersections.forEach((intersection, i) => {
        // angle between middle ray and current ray
        const angleBetta = intersection.angle - midRay.angle;

        const dist = particle.pos.distance(intersection) * Math.cos(Vector.toRadians(angleBetta));

        const maxShadow = 125;
        const opacity = maxShadow*(1 - (dist / 600) );

        const wallH = Canvas.HEIGHT/(dist * 0.02); // 0.011

        const halfY2 = wallH/2
        const topHalfY1 = Canvas.HEIGHT/2 - halfY2;

        const wallPositionX = i*step + step/2;

        canvas2.drawRect(
            wallPositionX, topHalfY1,
            step, halfY2,
            opacity,
            opacity,    
            opacity,
        );

        canvas2.drawRect(
            wallPositionX, Canvas.HEIGHT/2,
            step, halfY2,
            opacity,
            opacity,
            opacity
        );

        // top
        // canvas2.drawRect(
        //     i*step, 0,
        //     step, Canvas.HEIGHT/2 - halfY2,
        // );

        // flat
        // canvas2.drawRect(
        //     i*step, halfY2 + Canvas.HEIGHT/2,
        //     step, Canvas.HEIGHT,
        // );
    });
}

frame()