console.log("Initial test print")

// Boilerplate code
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// An array of all the balls
const BALLARRAY = [];
const WALLARRY = [];

let PAUSED = false;

// A few global variables
let LEFT, UP, RIGHT, DOWN;
let friction = 0.0;
let elasticity = 0.01;

class Vector{
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
    
    // Adding vectors
    add(v){
        return new Vector(this.x + v.x, this.y + v.y);
    }

    // Subtracting vectors
    subtract(v){
        return new Vector(this.x - v.x, this.y - v.y);
    }

    // Getting the magnitude of a vector
    magnitude(){
        return Math.sqrt(this.x**2 + this.y**2)
    }

    // Multiplying vectors
    multiply(n){
        return new Vector(this.x * n, this.y * n)
    }

    normal(){
        return new Vector(-this.y, this.x).unit();
    }

    // Changing vectors based on indended magnitude
    // This function is inaccurate because we don't used squares,
    // but that is because it would break if we did.
    unit(){
        if(this.magnitude() === 0){
            return new Vector(0, 0);
        } 
        else {
            return new Vector((this.x / this.magnitude()), this.y / this.magnitude());
        }
    }

    static dot(vec1, vec2){
        return vec1.x * vec2.x + vec1.y * vec2.y;
    }

    // Drawing vectors
    drawVector(start_x, start_y, n, color){
        ctx.beginPath();
        ctx.moveTo(start_x, start_y);
        ctx.lineTo(start_x + this.x * n, start_y + this.y * n);
        ctx.strokeStyle = color;
        ctx.stroke();
    }

}

class Matrix{
    constructor(rows, cols){
        this.rows = rows;
        this.cols = cols;
        this.data = [];

        for(let i = 0; i < this.rows; i++){
            this.data[i] = [];
            for(let j = 0; j < this.cols; j++){
                this.data[i][j] = 0;
            }
        }
    }

    // Code for multiplying a matrix by a vector
    multiplyVec(vec){
        let result = new Vector(0, 0);
        result.x = this.data[0][0] * vec.x + this.data[0][1] * vec.y;
        result.y = this.data[1][0] * vec.x + this.data[1][1] * vec.y;
        return result;
    }
}

// This is the class that defines what a ball is and its properties
class Ball{
    // x and y are the balls coordinates, r is the radius, m is the mass
    constructor(x, y, r, m){ 
        this.pos = new Vector(x, y);
        this.r = r;
        this.m = m;
        if(this.m === 0){
            this.inv_m = 0;
        } else {
            this.inv_m = 1 / this.m
        }
        this.elasticity = elasticity;
        this.vel = new Vector(0, 0);
        this.acc = new Vector(0, 0);
        this.acceleration = 0.1;
        this.player = false;
        BALLARRAY.push(this);
    }

    // Method that handles the drawing of the balls
    drawBall(){
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.r, 0, 2*Math.PI);
        ctx.strokeStyle = "black"
        ctx.stroke();
        ctx.fillStyle = "red"
        ctx.fill();
    }
    
    // Code for displaying misc stuff like movement vectors
    display(){
        this.vel.drawVector(this.pos.x, this.pos.y, 10, "red");

        ctx.fillStyle = "#000000";
        ctx.fillText("M "+this.m, this.pos.x-10, this.pos.y-5);
        ctx.fillText("E "+this.elasticity, this.pos.x-10, this.pos.y+5);
    }

    // keyControl(){
    //     // Adds to the balls acceleration based off of key inputs
    //     if(LEFT){
    //         this.acc.x = -this.acceleration;
    //     }
    //     if(RIGHT){
    //         this.acc.x = this.acceleration;
    //     }
    //     if(UP){
    //         this.acc.y = -this.acceleration;
    //     }
    //     if(DOWN){
    //         this.acc.y = this.acceleration;
    //     }
    
    //     // Checks if keys are being pressed
    //     if(!LEFT && !RIGHT) {
    //         this.acc.x = 0;
    //     }
    //     if(!UP && !DOWN){
    //         this.acc.y = 0;
    //     }
    // }

    keyControl(){
        // Adds to the balls acceleration based off of key inputs
        if(LEFT){
            this.vel.x = -1;
        }
        if(RIGHT){
            this.vel.x = 1;
        }
        if(UP){
            this.vel.y = -1;
        }
        if(DOWN){
            this.vel.y = 1;
        }
    
        // Checks if keys are being pressed
        if(!LEFT && !RIGHT) {
            this.acc.x = 0;
        }
        if(!UP && !DOWN){
            this.acc.y = 0;
        }
    }

    reposition(){
        // Makes sure the acceleration is always constant on diagonals
        this.acc = this.acc.unit().multiply(this.acceleration);

        // Add acceleration to velocity
        this.vel = this.vel.add(this.acc);

        // Adjusts the ball's veloctiy based on friction
        this.vel = this.vel.multiply(1 - friction);

        // Changes the ball's possition based off of the velocity 
        this.pos = this.pos.add(this.vel);
    }
}

class Wall{
    constructor(x1, y1, x2, y2){
        this.start = new Vector(x1, y1);
        this.end = new Vector(x2, y2);
        this.center = this.start.add(this.end).multiply(0.5);
        this.length = this.end.subtract(this.start).magnitude();
        this.refStart = new Vector(x1, y1);
        this.refEnd = new Vector(x2, y2);
        this.refUnit = this.end.subtract(this.start).unit();
        this.angleVel = 0;
        this.angle = 0;
        this.player = false;

        WALLARRY.push(this);
    }

    drawWall(){ 
        let rotMat = rotMx(this.angle);
        let newDir = rotMat.multiplyVec(this.refUnit);
        this.start = this.center.add(newDir.multiply(-this.length / 2));
        this.end = this.center.add(newDir.multiply(this.length / 2));
        ctx.beginPath();
        ctx.moveTo(this.start.x, this.start.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.strokeStyle = "black";
        ctx.stroke();
    }

    keyControl(){
        if(LEFT){
            this.angleVel = -0.1;
        }

        if(RIGHT){
            this.angleVel = 0.1;
        }
    }

    reposition(){
        this.angle += this.angleVel;
        this.angleVel *= 0.95;
    }

    wallUnit(){
        return this.end.subtract(this.start).unit();
    }
}

function userInput(){
    // Code for loading presets
    // canvas.addEventListener("keyup", function(e){
    //     // messing around
    //     if(e.key === "0"){
    //         Ball1.pos = new Vector(100, 440);
    //         Ball1.vel = new Vector(0, 0);
    //         Ball1.r = 40;
    //         Ball1.m = 10;
    //         Ball1.elasticity = 1;
    //         Ball2.pos = new Vector(300, 440);
    //         Ball2.vel = new Vector(0, 0);
    //         Ball2.r = 40;
    //         Ball2.m = 10;
    //         Ball2.elasticity = 1;
    //     }
    //     if(e.key === "1"){
    //         Ball1.pos = new Vector(200, 450);
    //         Ball1.vel = new Vector(5, 0);
    //         Ball1.r = 40;
    //         Ball1.m = 10;
    //         Ball1.elasticity = 1;
    //         Ball2.pos = new Vector(600, 450);
    //         Ball2.vel = new Vector(0, 0);
    //         Ball2.r = 40;
    //         Ball2.m = 10;
    //         Ball2.elasticity = 1;
    //     }
    // });

    // Detecting that a key was pressed
    // To get keyCode: console.log(e.keyCode)
    canvas.addEventListener("keydown", function(e){
        if(e.key === "ArrowLeft"){
            LEFT = true;
        }
        if(e.key === "ArrowRight"){
            RIGHT = true;
        }
        if(e.key === "ArrowUp"){
            UP = true;
        }
        if(e.key === "ArrowDown"){
            DOWN = true;
        }
    });

    // Same thing as the function above just detecting when a key gets released
    canvas.addEventListener("keyup", function(e){
        if(e.key === "ArrowLeft"){
            LEFT = false;
        }
        if(e.key === "ArrowRight"){
            RIGHT = false;
        }
        if(e.key === "ArrowUp"){
            UP = false;
        }
        if(e.key === "ArrowDown"){
            DOWN = false;
        }
    });
}

// A bad way of displaying different debug values to the canvas
function debugDisplay(b, start){
    ctx.font = "16px Arial";
    let pos = "Pos: (" + round(b.pos.x, 1) + ", " + round(b.pos.y, 1) + ")";
    let vel = "Vel: (" + round(b.vel.x, 1) + ", " + round(b.vel.y, 1) + ")";
    ctx.fillText((pos), 10, start); 
    ctx.fillText((vel), 10, start + 25); 
}

// Function to round number to a certain number of significant figures
function round(number, sigFigs){
    return Math.round(number * 10**sigFigs) / 10**sigFigs;
}

// Generating sudo random integers
function randInt(min, max){
    return Math.floor(Math.random() * (max-min+1)) + min;
}

function rotMx(angle){
    let mx = new Matrix(2, 2);
    mx.data[0][0] = Math.cos(angle);
    mx.data[0][1] = -Math.sin(angle);
    mx.data[1][0] = Math.sin(angle);
    mx.data[1][1] = Math.cos(angle);
    return mx;
}

function gravity(b1, b2){

    let dist = b1.pos.subtract(b2.pos).magnitude();
    let dir1 = b1.pos.subtract(b2.pos).unit();
    let dir2 = b2.pos.subtract(b1.pos).unit();

    let bigG = 6.67 * 10**-2;

    let gravityAcceleraitonB1 = bigG * (b2.m/dist**2);
    let gravityAcceleraitonB2 = bigG * (b1.m/dist**2);

    let gab1v = dir2.multiply(gravityAcceleraitonB1);
    let gab2v = dir1.multiply(gravityAcceleraitonB2);

    b1.vel = b1.vel.add(gab1v);
    b2.vel = b2.vel.add(gab2v);

    // console.log(b1.pos);

}

// Draws a line from the balls center to the closest point on a wall
function closestPointBW(ball1, wall1){
    let ballToWallStart = wall1.start.subtract(ball1.pos);
    if(Vector.dot(wall1.wallUnit(), ballToWallStart) > 0){
        return wall1.start;
    }

    let wallEndToBall = ball1.pos.subtract(wall1.end);
    if(Vector.dot(wall1.wallUnit(), wallEndToBall) > 0){
        return wall1.end;
    }

    let closestDist = Vector.dot(wall1.wallUnit(), ballToWallStart);
    let closestVect = wall1.wallUnit().multiply(closestDist);
    return wall1.start.subtract(closestVect);
}

// Collision detection for balls
function coll_det_bb(ball1, ball2){
    if(ball1.r + ball2.r >= (ball2.pos.subtract(ball1.pos)).magnitude()){
        return true;
    }
    else {
        return false;
    }
}

// Collision detection for walls
function coll_det_bw(ball1, wall1){
    let ballToClosest = closestPointBW(ball1, wall1).subtract(ball1.pos);
    if (ballToClosest.magnitude() <= ball1.r){
        return true;
    }
}

// This code triggers the balls to push away from each other when they hit
function pen_res_bb(ball1, ball2){
    let distance = ball1.pos.subtract(ball2.pos);
    let pen_depth = ball1.r + ball2.r - distance.magnitude();
    let pen_res = distance.unit().multiply(pen_depth / (ball1.inv_m + ball2.inv_m));

    ball1.pos = ball1.pos.add(pen_res.multiply(ball1.inv_m));
    ball2.pos = ball2.pos.add(pen_res.multiply(-ball2.inv_m));
}

// Prevents balls from moving through walls
function pen_res_bw(ball1, wall1){
    let penVec = ball1.pos.subtract(closestPointBW(ball1, wall1));
    ball1.pos = ball1.pos.add(penVec.unit().multiply(ball1.r - penVec.magnitude()));
}

// This code makes it so after the balls collide they have a bit of velocity going outward from the collision based on elasticity and mass
function coll_res_bb(ball1, ball2){
    let normal = ball1.pos.subtract(ball2.pos).unit();
    let relVel = ball1.vel.subtract(ball2.vel);
    let sepVel = Vector.dot(relVel, normal);
    let new_sepVel = -sepVel * Math.min(ball1.elasticity, ball2.elasticity);

    let vsep_diff = new_sepVel - sepVel;
    let impulse = vsep_diff / (ball1.inv_m + ball2.inv_m);
    let impulseVec = normal.multiply(impulse);

    ball1.vel = ball1.vel.add(impulseVec.multiply(ball1.inv_m));
    ball2.vel = ball2.vel.add(impulseVec.multiply(-ball2.inv_m));
}

// Calculates the velocity the ball will bounce off the wall with similar to coll_res_bb above but for walls
function coll_res_bw(ball1, wall1){
    let normal = ball1.pos.subtract(closestPointBW(ball1, wall1)).unit();
    let sepVel = Vector.dot(ball1.vel, normal);
    let new_sepVel = -sepVel * ball1.elasticity;
    let vsep_diff = sepVel - new_sepVel;
    ball1.vel = ball1.vel.add(normal.multiply(-vsep_diff));
}

// Code that gets repeatedly run to update the screen
function mainLoop() {

    // Clears the screen to prevent artifacting
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    // Takes keyboard input from the user
    userInput();
    // debugDisplay(Ball1, 25);
    // debugDisplay(Ball2, 100);
    
    // Loop that goes through and runs code for all of the balls
    BALLARRAY.forEach((b, index) => {
        b.drawBall();
        
        if(b.player){
            b.keyControl(b);
        }
        // Code for ball and wall collision (this is first because otherwise balls could collide through walls)
        WALLARRY.forEach((w) => {
            if (coll_det_bw(BALLARRAY[index], w)){
                pen_res_bw(BALLARRAY[index], w);
                coll_res_bw(BALLARRAY[index], w);
            }
        })
        
        // Code for ball and ball collision
        for(let i = index+1; i<BALLARRAY.length; i++){
            // console.log(BALLARRAY[0].pos);
            gravity(BALLARRAY[index], BALLARRAY[i]);
            if(coll_det_bb(BALLARRAY[index], BALLARRAY[i])){
                pen_res_bb(BALLARRAY[index], BALLARRAY[i]);
                coll_res_bb(BALLARRAY[index], BALLARRAY[i]);
            }
        }
        
        // b.display();
        b.reposition();
    })

    WALLARRY.forEach((w) =>{
        w.drawWall();
        if(w.player){
            w.keyControl();
        }
        w.reposition();

    })

    requestAnimationFrame(mainLoop);
}


// Defining the ball objects with a loop
// for (let i = 0; i < 5; i++){
//     let newBall = new Ball(randInt(200, 500), randInt(200, 280), randInt(20, 60), randInt(1, 20));
//     newBall.elasticity = randInt(1, 10) / 10;
// }

// for (let i = 0; i < 5; i++){
//     let newBall = new Ball(randInt(100, 1100), randInt(100, 500), randInt(5, 35), randInt(1000, 10000));
//     newBall.elasticity = 0;
// }

// BALLARRAY.forEach((b) =>{
//     b.m = b.r^2*Math.PI*1000;
//     console.log(b.m);
// })

let Ball1 = new Ball(600, 200, 30, 10000);
let Ball2 = new Ball(600, 400, 30, 10000);

Ball1.vel = Ball1.vel.add(new Vector(1.5, 0.5));
Ball2.vel = Ball2.vel.add(new Vector(-1.5, -0.5));

BALLARRAY[0].player = true;

// let Ball1 = new Ball(100, 440, 40, 10);
// let Ball2 = new Ball(300, 440, 40, 10);

// Ball1.player = true;

// Makes walls at the edge of the canvas
let edge1 = new Wall(0, 0, canvas.clientWidth, 0);
let edge2 = new Wall(canvas.clientWidth, 0, canvas.clientWidth, canvas.clientHeight);
let edge3 = new Wall(canvas.clientWidth, canvas.clientHeight, 0, canvas.clientHeight);
let edge4 = new Wall(0, canvas.clientHeight, 0, 0);

// Defining objects specifically
// let Ball1 = new Ball(100, 100, 30, 3);
// let Wall1 = new Wall(200, 300, 400, 400);
// Ball1.player = true;

requestAnimationFrame(mainLoop);
