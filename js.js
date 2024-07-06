const pi = Math.PI;
const degToRad = pi / 180;

class Circle {
    constructor(x, y, r, backgroundColor, velocity) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.v = velocity; // [direction, speed]
        this.col = backgroundColor;
        this.targetSpeed = this.v[1];
    }

    update_state(canvW, canvH) {
        let dir = this.v[0];
        let vel = this.v[1];
        this.x += vel * Math.cos(dir * degToRad);
        this.y += vel * Math.sin(dir * degToRad);

        if (this.x > canvW + this.r) {
            this.x = 0 - this.r;
        } else if (this.x < 0 - this.r) {
            this.x = canvW + this.r;
        }

        if (this.y < 0 - this.r) {
            this.y = canvH + this.r;
        } else if (this.y > canvH + this.r) {
            this.y = 0 - this.r;
        }

        this.v[1] += (this.targetSpeed - this.v[1]) * 0.1;
    }

    pointTowards(x, y) {
        let angle = Math.atan2(y - this.y, x - this.x) * (180 / pi);
        this.v[0] = angle;
    }

    adjustDirectionTowards(x, y, pen) {
        let delx = Math.abs(this.x - x);
        let dely = Math.abs(this.y - y);
        let dist = Math.sqrt(delx * delx + dely * dely);
        if (dist > Math.min(canvWidth, canvHeight) * 15 / 100) return;

        pen.beginPath();
        pen.strokeStyle = "cyan";
        pen.lineWidth = this.r;
        // pen.moveTo(this.x, this.y);
        // pen.lineTo(x, y);
        if (dist <= Math.min(canvHeight, canvWidth) * 5 / 100) pen.arc(x, y, dist, 0, pi * 2);
        pen.stroke();

        let targetAngle = Math.atan2(y - this.y, x - this.x) * (180 / pi);
        let currentAngle = this.v[0];
        let angleDifference = targetAngle - currentAngle;

        // Normalize the angle difference to the range [-180, 180]
        if (angleDifference > 180) angleDifference -= 360;
        if (angleDifference < -180) angleDifference += 360;

        // Adjust the current angle slightly towards the target angle
        this.v[0] += angleDifference * 0.1; // Adjust the factor to control the turning speed
        this.targetSpeed = Math.max(Math.min(minSpeed - 1, dist / 2), maxSpeed + 1);
    }

    avoidOtherBalls(balls, threshold, pen) {
        pen.beginPath();
        pen.lineWidth = this.r;
        context.strokeStyle = "cyan";
        let thisx = this.x;
        let thisy = this.y;
        for (let i = 0; i < balls.length; i++) {
            if (balls[i] !== this) {
                let dx = balls[i].x - thisx;
                let dy = balls[i].y - thisy;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < threshold) {
                    pen.moveTo(thisx, thisy);
                    pen.lineTo(balls[i].x, balls[i].y);
                    // Calculate the angle to move away from the other ball
                    let angle = Math.atan2(dy, dx) * (180 / pi) + 180;
                    this.v[0] = angle;
                }
            }
        }
        pen.stroke();
    }
}

function clearCanvas(canvas, context) {
    context.beginPath();
    context.rect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "black";
    context.fill();
}

const canvScrWidthRatio = 100 / 100;
const canvScrHeightRatio = 100 / 100;

let canvas = document.getElementById("can");
let context = canvas.getContext('2d');
canvas.style.width = (window.innerWidth * canvScrWidthRatio) + "px";
canvas.style.height = (window.innerHeight * canvScrHeightRatio) + "px";
let canvWidth = parseInt(canvas.style.width) * 4;
let canvHeight = parseInt(canvas.style.height) * 4;
canvas.width = canvWidth;
canvas.height = canvHeight;

let minSpeed = 5;
let maxSpeed = 8;

let balls = [];
for (let i = 0; i < 1000; i++) {
    balls.push(new Circle(Math.random() * (canvWidth - 50), Math.random() * (canvHeight - 50), 5, [0, 0, 0], [Math.random() * 360, Math.random() * (maxSpeed - minSpeed) + minSpeed]));
}

// let fps = 480;
// let interval = 1000 / fps;
let mouseX = null;
let mouseY = null;

function updateScreen() {
    clearCanvas(canvas, context);
    for (let i = 0; i < balls.length; i++) {
        if (mouseX !== null && mouseY !== null) {
            balls[i].adjustDirectionTowards(mouseX, mouseY, context);
        }
        balls[i].avoidOtherBalls(balls, 40, context);
        balls[i].update_state(canvWidth, canvHeight);
        //uncomment / comment to see / unsee the balls
        // context.beginPath();
        // context.fillStyle = "cyan";
        // context.arc(balls[i].x, balls[i].y, balls[i].r, 0, 2 * pi);
        // context.fill();
    }
    requestAnimationFrame(updateScreen);
}

// Start the first update
requestAnimationFrame(updateScreen);

canvas.addEventListener('mousemove', (evt) => {
    mouseX = evt.clientX * canvWidth / parseInt(canvas.style.width);
    mouseY = evt.clientY * canvHeight / parseInt(canvas.style.height);
});

canvas.addEventListener('mouseout', () => {
    mouseX = null;
    mouseY = null;
    for (let i = 0; i < balls.length; i++) balls[i].targetSpeed = Math.random() * (maxSpeed - minSpeed) + minSpeed;
});

let updateCanvasSize = function () {
    let newWidth = (window.innerWidth * canvScrWidthRatio) + "px";
    let newHeight = (window.innerHeight * canvScrHeightRatio) + "px";
    if (canvas.style.width !== newWidth || canvas.style.height !== newHeight) {
        canvas.style.width = newWidth;
        canvas.style.height = newHeight;
        canvWidth = parseInt(canvas.style.width) * 4;
        canvHeight = parseInt(canvas.style.height) * 4;
        canvas.width = canvWidth;
        canvas.height = canvHeight;
    }
}

window.onresize = updateCanvasSize;

window.onclick = function (evt) {
    let mouseX = evt.clientX * canvWidth / parseInt(canvas.style.width);
    let mouseY = evt.clientY * canvHeight / parseInt(canvas.style.height);
    let range = Math.min(canvWidth, canvHeight) * 15 / 100; // Define the range within which balls will be affected
    let targetDistance = 500; // Define the target distance to fly out

    for (let i = 0; i < balls.length; i++) {
        let delx = balls[i].x - mouseX;
        let dely = balls[i].y - mouseY;

        if (Math.sqrt(delx * delx + dely * dely) < range) {
            let angle = Math.atan2(dely, delx);
            balls[i].x = mouseX + targetDistance * Math.cos(angle);
            balls[i].y = mouseY + targetDistance * Math.sin(angle);
        }
    }
}
