let rectangles = [];
let rectWidth = 20;
let sorting = false;
let checkLeft, checkRight, pivot;
let swapped = false;
let shuffled = false;
let speedSlider;
let osc, envelope;
let minFreq = 200; // Low pitch
let maxFreq = 1200; // High pitch
let heightStep;
let maxHeight;
let totalRect;
let debugButton;
let sorted = false;
let pause = true;
let debug = false;
let pivotMoved = false;
let operation = 0;
let checkPositionLeft = 0;

// Sound Envelope Sliders
let attackTimeSlider, decayTimeSlider, sustainRatioSlider, releaseTimeSlider;

function setup() {
  createCanvas(windowWidth * 0.95, windowHeight);
  
  // Sorting Speed Slider
  speedSlider = createSlider(1, 1000, 100, 1);
  speedSlider.position(width/2 - 100, 10);
  speedSlider.style('width', '200px'); // Set the width of the slider


  attackTimeSlider = createSlider(0, 1, 0, .01);
  attackTimeSlider.position(25,75);

  decayTimeSlider = createSlider(0, 1, .05, .01);
  decayTimeSlider.position(25, 125);

  sustainRatioSlider = createSlider(0, 1, .03, .01);
  sustainRatioSlider.position(25, 175);

  releaseTimeSlider = createSlider(0, 1, .05, .01);
  releaseTimeSlider.position(25, 225);

  // Debug Button
  textAlign(CENTER);
  textSize(12);
  debugButton = createButton('DEBUG');
  debugButton.position(300, 100);
  debugButton.class('circle-button'); 
  debugButton.mousePressed(debugFunction);
  speedSlider.show();

  if (debug) {
    attackTimeSlider.show();
    decayTimeSlider.show();
    sustainRatioSlider.show();
    releaseTimeSlider.show();
  } else {
    attackTimeSlider.hide();
    decayTimeSlider.hide();
    sustainRatioSlider.hide();
    releaseTimeSlider.hide();
  }

  // Sound setup
  osc = new p5.Oscillator('sine');
  osc.start();
  osc.amp(0);
  
  envelope = new p5.Envelope();

  totalRect = round(width / rectWidth);
  maxHeight = height / 1.5;
  heightStep = maxHeight / totalRect;

  // Generate rectangles
  for (let i = 0; i < totalRect; i++) {
    let rectHeight = (i + 1) * heightStep;
    rectangles.push({ x: i * rectWidth, height: rectHeight });
  }
  rectangles = shuffleArray(rectangles);

  // Start recursive QuickSort
  quickSort(0, rectangles.length - 1);
  userStartAudio();
}

function draw() {
  background(0);
  let speed = speedSlider.value();
  let attackTime = attackTimeSlider.value();
  let decayTime = decayTimeSlider.value();
  let sustainRatio = sustainRatioSlider.value();
  let releaseTime = releaseTimeSlider.value();
  envelope.setADSR(attackTime, decayTime, sustainRatio, releaseTime);
  envelope.setRange(0.05, 0);

  // Draw rectangles

  drawUI();

  for(let i = 0; i < rectangles.length - 1; i++){
    if(rectangles[i].height > rectangles[i+1].height){
      sorted = false;
      break;
    }else{
      sorted = true;
    }
  }

  if(sorted == false){
    for (let i = 0; i < rectangles.length; i++) {
      let rectColor = 'white';
      if(debug && sorted == false){
        if (i === checkRight) rectColor = 'red';
        if (i === checkLeft) rectColor = 'green';
        if (i === pivot) rectColor = 'blue';
      }if(!debug && sorted == false){
        if (i === checkRight) rectColor = 'red';
        if (i === checkLeft) rectColor = 'red';
        if (i === pivot) rectColor = 'red';
      }
      fill(rectColor);
      stroke(0);
      rect(rectangles[i].x, height - rectangles[i].height - 200, rectWidth - 2, rectangles[i].height);
    }
  }else if (frameCount % round(100 / 10) === 0) {
    if(sorted == true){
      if (checkPosition >= rectangles.length - 1) {
        checkPosition = 0;
      }
      let a = rectangles[checkPosition];
      playBeep(a.height, maxHeight);
      checkPosition++
      for (let i = 0; i < rectangles.length; i++) {
        let rectColor = (i === checkPosition) ? 'red' : 'white';
        fill(rectColor);
        stroke(0);
        rect(rectangles[i].x, height - rectangles[i].height - 200, rectWidth - 2, rectangles[i].height);
      }
    }
  }else{
    for (let i = 0; i < rectangles.length; i++) {
      let rectColor = (i === checkPosition) ? 'red' : 'white';
      fill(rectColor);
      stroke(0);
      rect(rectangles[i].x, height - rectangles[i].height - 200, rectWidth - 2, rectangles[i].height);
    }
  }

}

// Recursive QuickSort
async function quickSort(low, high) {
  if (low < high) {
    pivot = await partition(low, high);
    await quickSort(low, pivot - 1);
    await quickSort(pivot + 1, high);
  }
}

// Partition function
async function partition(low, high) {
  pivot = high;
  let pivotHeight = rectangles[pivot].height;
  checkLeft = low;
  checkRight = high - 1;
  while (checkLeft <= checkRight) {
    while (checkLeft <= checkRight && rectangles[checkLeft].height < pivotHeight) {
      checkLeft++;
      if (checkLeft <= checkRight && rectangles[checkLeft]) {
        await sleep(rectangles[checkLeft].height);
      }
    }

    while (checkLeft <= checkRight && rectangles[checkRight].height > pivotHeight) {
      checkRight--;
      if (checkLeft <= checkRight && rectangles[checkRight]) {
        await sleep(rectangles[checkRight].height);
      }
    }

    if (checkLeft < checkRight) {
      await swap(checkLeft, checkRight);
      if (rectangles[checkLeft]) {
        await sleep(rectangles[checkLeft].height);
      }
    }
  }

  await swap(checkLeft, high);
  return checkLeft;
}

// Swap function
async function swap(i, j) {
  let temp = rectangles[i];
  rectangles[i] = rectangles[j];
  rectangles[j] = temp;

  // Swap positions
  let tempX = rectangles[i].x;
  rectangles[i].x = rectangles[j].x;
  rectangles[j].x = tempX;
}


// Delay function to visualize each step
function sleep(height) {
  operation++;
  playBeep(height);
  return new Promise(resolve => setTimeout(resolve, 10000 / speedSlider.value()));
}

function playBeep(height) {
  let frequency = map(height, 0, maxHeight, minFreq, maxFreq);
  osc.freq(frequency);
  envelope.play(osc);
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  for (let i = 0; i < rectangles.length; i++) {
    rectangles[i].x = i * rectWidth;
  }
  return arr;
}

// UI Functions
function drawUI() {
  fill(255);
  let speed = floor(speedSlider.value());

  if (debug) {
    fill(255);
    let attackTime = attackTimeSlider.value();
    let decayTime = decayTimeSlider.value();
    let sustainRatio = sustainRatioSlider.value();
    let releaseTime = releaseTimeSlider.value();
    
    textSize(24);
    textAlign(LEFT);
    text("Attack Time: " + attackTime, 25, 75);
    text("Decay Time: " + decayTime, 25, 125);
    text("Sustain Time: " + sustainRatio, 25, 175);
    text("Release Time: " + releaseTime, 25, 225);
  }
  // (width, min, max, minSize, maxSize)
  let textSize1 = map(width, 0, 2800, 64, 128);
  let textSize2 = map(width, 0, 2800, 32, 64);
  let textSize3 = map(width, 0, 2800, 16, 32);

  console.log(textSize1);
  fill(255);
  textAlign(CENTER);
  textSize(textSize1);
  text("Quick Sort", width/2, height / 8);
  textSize(textSize2);
  text("Operation: " + operation, width/2, height/8 + textSize1/2);
  textSize(textSize3);
  text("Speed: " + speed/10 + "%", width/2, height/8 + textSize1/2 + textSize2/2);
}

function debugFunction() {
  debug = !debug;
  if (debug) {
    speedSlider.show();
    attackTimeSlider.show();
    decayTimeSlider.show();
    sustainRatioSlider.show();
    releaseTimeSlider.show();
  } else {
    speedSlider.hide();
    attackTimeSlider.hide();
    decayTimeSlider.hide();
    sustainRatioSlider.hide();
    releaseTimeSlider.hide();
  }
}

function pausePlay() {
  pause = !pause;
}

// Shuffle function
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  for (let i = 0; i < rectangles.length; i++) {
    rectangles[i].x = i * rectWidth;
  }
  return arr;
}


function mousePressed() {
  userStartAudio();
}

// Reload the page when the window is resized
function windowResized() {
  location.reload();
}