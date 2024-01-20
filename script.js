// Setup- canvas with id - canvas1
const canvas = document.getElementById('canvas1');
//Setup canvas rendering context object (ctx) - contains
// 2d drawing methods and properties that a web browser can understand.
const ctx = canvas.getContext('2d');
// full screen effect. If position absolute we can remove scroller.
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
// observe built in default canvas settings and drawing methods in console log. 
console.log(ctx);
ctx.fillStyle = 'white';
ctx.strokeStyle = 'white';
ctx.lineWidth = 0.2;
// Use the arc method to make a full circle 
// cicle with center point from the left edge of the canvas Horizonral coordinates, and verticle coordinates from top
// radius in angles and start angle in rad
// for full cirlce end angle = Math.PI*2 (6.28 rad)(or 360deg)

// ctx.arc(100,100, 50, 0, Math.PI*2);

// arc method works with a part and doesnt render directly onto the canvas.
// particle blueprint to create new particle objects
// each particle has x,y coordinates
class Particle {
    constructor(effect){
        this.effect = effect;
        this.x = Math.floor(Math.random() * this.effect.width);
        this.y = Math.floor(Math.random() * this.effect.height);
        this.speedX;
        this.speedY;
        // to make each line move at a different speed we introduce a speed modifer property -
        // for each particle
        this.speedModifier = Math.floor(Math.random() * 2 + 1); // speed of particles
        this.history = [{x: this.x, y: this.y}];
        this.maxLength = Math.floor(Math.random()* 200 + 10); // Max length of the line (tail)
        this.angle = 0;
        this.timer = this.maxLength * 2; // Timer property max length x 2
        this.colors = ['#0070ad','#12abdb','#2b0a3d', ]; // primary colors of the flowfield.
        this.color = this.colors[Math.floor(Math.random() * this.colors.length)]; // generate primary colors randomly in the FF
    }
    draw(context){
        // context.fillRect(this.x, this.y, 10, 10); (Removing rectangle element)
        context.beginPath(); 
        context.moveTo(this.history[0].x, this.history[0].y);
        for(let i = 0; i < this.history.length; i++){
            context.lineTo(this.history[i].x, this.history[i].y)
        }
        context.strokeStyle = this.color;
        context.stroke();
    }

    // We sliced the canvas into an invisble grid. Each cell is 20 x 20 px 
    // and it has a specific angle value
    update(){
        this.timer-- ; // for every tick of animation, we decrease the timer by 1.
        // timer starts as a value equal to max length times 2 and decreases by 1 for every animation frame.
        // as lonmg as timer is more or equal to 1, we will animate the line and make it crawl around and when the
        // the timer reaches 1, the lines will freeze in place
        if (this.timer >= 1) {
             // we calculate on which row and column of the grid, the particle is currently moving
             //over
            let x = Math.floor(this.x / this.effect.cellSize);
            let y = Math.floor(this.y / this.effect.cellSize);
            // we map that row and column to index in the flow field array and extract the 
            // angle value that belongs to the cell we need
            let index = y * this.effect.cols + x;
            this.angle =  this.effect.flowField[index];  
            //We increase speedX by cosine of that angle and speedY by sine which gives a 
            // direction of movement depending on that angle.
            // then we increase particles X and Y position by these speeds.
            this.speedX = Math.cos(this.angle);
            this.speedY = Math.sin(this.angle);
            // we multiply speed x and y with the speed modifier
            this.x += this.speedX * this.speedModifier;
            this.y += this.speedY * this.speedModifier;
    
            // we push the new particle inside the history array so that we can animate its tail
            // i.e the line each particle drags along
            this.history.push({x: this.x, y: this.y});
            // if length of the line is more than max-length, we remove the segment.
            if (this.history.length > this.maxLength){
                this.history.shift();
            } 
            // if history array contains more than one element, remove old segments from the line.
            // when the timer reaches 0, start removing all sengemts until there are no more segments left
        } else if (this.history.length > 1) {
            this.history.shift();
        }  else {
            this.reset(); // At this point we want the animation cycle to reset and repeat
        } 
     
    }
    // To increase speed modifier range and make the flow a continous loop , and to show how curve and zoom 
    // affect the pattern , we need lines to reset when they finsih their animation sequence 
    reset(){
        // we set x, y coordiantes position on a random place on the canvas
        this.x = Math.floor(Math.random() * this.effect.width);
        this.y = Math.floor(Math.random() * this.effect.height);
        // we set history array to the new values as the initial position with an index of 0
        this.history = [{x: this.x, y: this.y}];
        // we need to reset timer back to its original value
        this.timer = this.maxLength * 2;
    } 
}
// simple object as we have only one instance of this class.. manges the effect of all the particles at once
// using OOP to keep the code clean and legible.

class Effect {
    constructor(canvas){
        this.canvas = canvas;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.particles = [];
        this.numberOfParticles = 5000;
        this.cellSize = 20;
        this.row;
        this.cols;
        this.flowField = [];
        this.curve = 1; // inner spiral of our sin and cosine flowfield
        this.zoom = 0.1; // lesser value more zoom
        this.debug = false; // grid lines initial state false
        this.init();

        window.addEventListener('keydown',e => {
            if (e.key === 'd') this.debug = !this.debug; // allows us to toggle between grid and gridless view easily
        });
        // perlin noise creates a natural looking gradient noise pattern
        // we calcu;ate angle values for our flow fields using trigonometry as in line 132

        window.addEventListener('resize', e => {
           this.resize(e.target.innerWidth, e.target.innerHeight);
        });


    }
    init(){
        // create Flow field
        // The base idea is that passing an increase in angle value 
        // to sine and cosine make the values cycle periodically between -1 and +1.
        // We use X and Y positions of each particle as these increasing angle values
        // so that the pattern is tied to the coordinates in that way
        this.rows = Math.floor(this.height/ this.cellSize);
        this.cols = Math.floor(this.width/ this.cellSize);
        this.flowField = [];
        for(let y = 0; y < this.rows; y++){
            for(let x = 0; x <this.cols; x++){
                // the shape of the flow field is a "sine and cosine spiral curve pattern"
                // its a pattern we get when we use increasing positions in a 2-D grid as angle values passed to sine and cosine.
                // The below line of code represents the shape of the pattern ** we can vary to get different patterns and results
                let angle = (Math.cos(x * this.zoom) + Math.sin(y * this.zoom)) * this.curve; // multiplying it with 2 to increase 
                // the radius of the curve
                // multiplying x and y by a value ex. 0.1 if they are same . we get a 
                // symmertrical zoom like effect into the pattern
                this.flowField.push(angle);
            }
        }


        // create particles
        this.particles = []; 

       for(let i = 0; i< this.numberOfParticles; i++){
        this.particles.push(new Particle(this));
        }
    }

    // FLow-field is a grid of angles, we can visualize the the grid to make clear
    //how it works . create a debug mode with context as an argument

    drawGrid(context){
        context.save();
        context.strokeStyle = 'white';
        context.lineWidth = 0.3;
        for(let c = 0; c < this.cols; c++){
            context.beginPath();
            context.moveTo(this.cellSize * c, 0);
            context.lineTo(this.cellSize * c, this.height ); 
            context.stroke(); // draws verticle lines or cols
        }
        for (let r = 0; r < this.rows; r++){
            context.beginPath();
            context.moveTo(0, this.cellSize * r);
            context.lineTo(this.width, this.cellSize * r);
            context.stroke(); // draws horizontal lines or rows
        }
        context.restore();

    }

    resize(width,height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.init();
    }


    render(context){
       if(this.debug) this.drawGrid(context); // to represent verticle/horizontal lines (cols/rows) in our flowfield
        this.particles.forEach(particle => {
            particle.draw(context);
            particle.update();
        } );
    }

}

const effect = new Effect(canvas);
effect.render(ctx);

function animate(){
    ctx.clearRect(0,0, canvas.width, canvas.height);
    effect.render(ctx);
    requestAnimationFrame(animate);
}
animate();