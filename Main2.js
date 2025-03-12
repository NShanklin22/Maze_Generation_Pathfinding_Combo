let cols, rows;
let w = 30;
let grid = [];
let stack = [];
let fps = 30;
let start;
let end;
let current;
let speedSlider;

// Sound variables
let osc;
let baseFreq = 220; // A3 as base frequency
let isGenerating = true;

function setup() {
  createCanvas(800, 850); // Make canvas taller to accommodate slider
  
  // Create speed slider
  speedSlider = createSlider(1, 100, 25);
  speedSlider.position(width/2 - 100, height - 30);
  speedSlider.style('width', '200px');
  
  // Initialize the oscillator for sound
  osc = new p5.Oscillator('sine');
  osc.amp(0.2); // Set the volume (0-1)
  
  cols = floor((height-50)/w); // Adjust for slider space
  rows = floor(width/w);
  for(let j = 0; j < rows; j++){
    for(let i = 0; i < cols; i++){
      let cell = new Cell(i,j);
      grid.push(cell);
    }
  }

  current = grid[0];
  start = grid[0];
  end = grid[grid.length-1];
  end.walls = [false,false,false,false];
  start.walls = [false,false,false,false];
  
  frameRate(fps);
  //start sound
  userStartAudio();
}

function draw() {
  background(0);
  
  // Update frame rate from slider
  let newFps = speedSlider.value();
  if (newFps !== fps) {
    fps = newFps;
    frameRate(fps);
  }
  
  // Draw the maze grid
  for(let i = 0; i < grid.length; i++){
    grid[i].show();
  }

  if (isGenerating) {
    current.visited = true;
    let next = current.checkNeighbors();
    
    if(next){
      next.visited = true;
      stack.push(current);
      removeWalls(current, next);
      
      // Play a sound when moving to a new cell
      playNewCellSound(next);
      
      current = next;
    } else if(stack.length > 0){
      current = stack.pop();
      
      // Play a different sound when backtracking
      playBacktrackSound();
    } else {
      // Maze generation completed
      isGenerating = false;
      osc.stop();
    }
  }

  current.highlight();
  end.highlight();
  start.highlight();

  push();
  noStroke();
  fill(0,47,0);
  textSize(12);
  textAlign(CENTER);
  text("Start", start.i*w + w/2, start.j*w + w/2 + 5);
  text("End", end.i*w + w/2, end.j*w + w/2 + 5);
  pop();
  
  // Draw slider label
  push();
  noStroke();
  fill(0, 238, 0);
  textSize(16);
  textAlign(CENTER);
  text("Generation Speed: " + fps  + " %", width/2, height - 40);
  pop();
}

function playNewCellSound(cell) {
  // Calculate frequency based on cell position
  // This creates a musical pattern as the maze is generated
  let xPos = map(cell.i, 0, cols, 0, 1);
  let yPos = map(cell.j, 0, rows, 0, 1);
  
  // Create a pentatonic scale for pleasing sounds
  let notes = [0, 2, 4, 7, 9, 12, 14]; // Pentatonic scale intervals
  let octave = floor(xPos * 3); // 0-2 octaves
  let noteIndex = floor(yPos * notes.length);
  let semitones = notes[noteIndex] + (octave * 12);
  
  // Calculate frequency (A440 formula: 440 * 2^(n/12))
  let freq = baseFreq * Math.pow(2, semitones/12);
  
  osc.freq(freq);
  
  // Start the oscillator if it's not already playing
  if (!osc.started) {
    osc.start();
    osc.started = true;
  }
  
  // Quick fade in/out for a pleasant "pluck" sound
  osc.amp(0.2, 0.01);
  setTimeout(() => osc.amp(0, 0.1), 100);
}

function playBacktrackSound() {
  // Use a slightly lower frequency for backtracking
  let freq = baseFreq * 0.75;
  osc.freq(freq);
  osc.amp(0.1, 0.01);
  setTimeout(() => osc.amp(0, 0.1), 50);
}

function index(i,j){
  if(i < 0 || j < 0 || i > cols-1 || j > rows-1){
    return -1;
  }
  return i + j * cols;
}

function removeWalls(a,b){
  let x = a.i - b.i;
  if(x === 1){
    a.walls[3] = false;
    b.walls[1] = false;
  } else if(x === -1){
    a.walls[1] = false;
    b.walls[3] = false;
  }

  let y = a.j - b.j;
  if(y === 1){
    a.walls[0] = false;
    b.walls[2] = false;
  } else if(y === -1){
    a.walls[2] = false;
    b.walls[0] = false;
  }
}

function mousePressed() {
  // Restart maze generation when user clicks
  if (!isGenerating) {
    resetMaze();
  }
}

function resetMaze() {
  // Reset the grid
  grid = [];
  stack = [];
  for(let j = 0; j < rows; j++){
    for(let i = 0; i < cols; i++){
      let cell = new Cell(i,j);
      grid.push(cell);
    }
  }
  
  current = grid[0];
  start = grid[0];
  end = grid[grid.length-1];
  end.walls = [false,false,false,false];
  start.walls = [false,false,false,false];
  
  // Apply current slider value for frame rate
  fps = speedSlider.value();
  frameRate(fps);
  
  isGenerating = true;
}

class Cell{
  constructor(i,j){
    this.i = i;
    this.j = j;
    this.walls = [true,true,true,true];
    this.visited = false;
  }

  highlight(){
    let x = this.i * w;
    let y = this.j * w;
    noStroke();
    fill(0,238,0);
    rect(x,y,w,w);
  }

  checkNeighbors(){
    let neighbors = [];

    let top = grid[index(this.i,this.j-1)];
    let right = grid[index(this.i+1,this.j)];
    let bottom = grid[index(this.i,this.j+1)];
    let left = grid[index(this.i-1,this.j)];

    if(top && !top.visited){
      neighbors.push(top);
    }
    if(right && !right.visited){
      neighbors.push(right);
    }
    if(bottom && !bottom.visited){
      neighbors.push(bottom);
    }
    if(left && !left.visited){
      neighbors.push(left);
    }

    if(neighbors.length > 0){
      let r = floor(random(0,neighbors.length));
      return neighbors[r];
    } else {
      return undefined;
    }
  }

  show(){
    let x = this.i * w;
    let y = this.j * w;

    if(this.visited){
      noStroke();  
      fill(0,47,0);
      rect(x,y,w,w);
      stroke(0,238,0);
      strokeWeight(1);
    } else {
      stroke(0,95,0);
      strokeWeight(1);
    }

    if(this.walls[0]){
      line(x    ,y    ,x+w  ,y);
    }
    if(this.walls[1]){
      line(x+w  ,y    ,x+w  ,y+w);
    }
    if(this.walls[2]){
      line(x+w  ,y+w  ,x    ,y+w);
    }
    if(this.walls[3]){
      line(x    ,y+w  ,x    ,y);
    }
  }
}