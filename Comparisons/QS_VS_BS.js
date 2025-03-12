let rectanglesLeft = [];
let rectanglesRight = [];
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
let leftOperation = 0;
let rightOperation = 0;
let checkPositionLeft = 0;
let checkPositionRight = 0;
let bubbleSortRunning = true;

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
  debugButton.position(300, height/2);
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

  totalRect = round(height / rectWidth);
  maxHeight = width / 4;
  heightStep = maxHeight / totalRect;

  // Generate rectanglesLeft
  for (let i = 0; i < totalRect; i++) {
    let rectHeight = (i + 1) * heightStep;
    rectanglesLeft.push({ y: i*rectWidth, height: rectHeight });
  }
  rectanglesLeft = shuffleArray(rectanglesLeft);
  rectanglesRight = rectanglesLeft.map(rect => ({ ...rect }));

  // Start recursive QuickSort
  quickSort(0, rectanglesLeft.length - 1);
  bubbleSort(rectanglesRight, rectanglesRight.length);
  console.log("Nate!")
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

  // Draw rectanglesLeft

  drawUI();

  for(let i = 0; i < rectanglesLeft.length - 1; i++){
    if(rectanglesLeft[i].height > rectanglesLeft[i+1].height){
      sorted = false;
      break;
    }else{
      sorted = true;
    }
  }

  if(sorted == false){
    for (let i = 0; i < rectanglesLeft.length; i++) {
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
      rect(0, rectanglesLeft[i].y, rectanglesLeft[i].height, rectWidth - 2);
    }
  }else if (frameCount % round(100 / 10) === 0) {
    if(sorted == true){
      if (checkPositionLeft >= rectanglesLeft.length - 1) {
        checkPositionLeft = 0;
      }
      let a = rectanglesLeft[checkPositionLeft];
      playBeep(a.height, maxHeight);
      checkPositionLeft++
      for (let i = 0; i < rectanglesLeft.length; i++) {
        let rectColor = (i === checkPositionLeft) ? 'red' : 'white';
        fill(rectColor);
        stroke(0);
        rect(0, rectanglesLeft[i].y, rectanglesLeft[i].height, rectWidth - 2);
      }
    }
  }else{
    for (let i = 0; i < rectanglesLeft.length; i++) {
      let rectColor = (i === checkPositionLeft) ? 'red' : 'white';
      fill(rectColor);
      stroke(0);
      rect(0, rectanglesLeft[i].y, rectanglesLeft[i].height, rectWidth - 2);
    }
  }
  if (frameCount % round(100 / 10) === 0) {
    if(bubbleSortRunning == false){
      if (checkPositionRight >= rectangles.length - 1) {
        checkPositionRight = 0;
      }
      let a = rectanglesRight[checkPositionRight];
      playBeep(a.height, maxHeight);
      checkPositionRight++
    }
  }

  if(bubbleSortRunning) {
    for (let i = 0; i < rectanglesRight.length; i++) {
      let rectColor = (i === checkPositionRight || i === checkPositionRight + 1) ? 'red' : 'white';
      fill(rectColor);
      stroke(0);
      rect(width - rectanglesRight[i].height, rectanglesRight[i].y, rectanglesRight[i].height, rectWidth - 2);
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

async function bubbleSort(arr,n) {
    // Base case 
    if (n == 0) {
      return; 
    }

    for (let i=0; i<n-1; i++){
      checkPositionRight = i;
      let a = rectanglesRight[i];
      let b = rectanglesRight[i+1];
      if (a.height > b.height){ 
          await swapBubble(i,i+1); 
        } else{

      }
      await sleep()
    }
    await bubbleSort(arr, n-1); 
} 

// Partition function
async function partition(low, high) {
  pivot = high;
  let pivotHeight = rectanglesLeft[pivot].height;
  checkLeft = low;
  checkRight = high - 1;
  while (checkLeft <= checkRight) {
    while (checkLeft <= checkRight && rectanglesLeft[checkLeft].height < pivotHeight) {
      checkLeft++;
      if (checkLeft <= checkRight && rectanglesLeft[checkLeft]) {
        await sleep(rectanglesLeft[checkLeft].height);
      }
    }

    while (checkLeft <= checkRight && rectanglesLeft[checkRight].height > pivotHeight) {
      checkRight--;
      if (checkLeft <= checkRight && rectanglesLeft[checkRight]) {
        await sleep(rectanglesLeft[checkRight].height);
      }
    }

    if (checkLeft < checkRight) {
      await swap(checkLeft, checkRight);
      if (rectanglesLeft[checkLeft]) {
        await sleep(rectanglesLeft[checkLeft].height);
      }
    }
  }

  await swap(checkLeft, high);
  return checkLeft;
}

// Swap function
async function swap(i, j) {
  let temp = rectanglesLeft[i];
  rectanglesLeft[i] = rectanglesLeft[j];
  rectanglesLeft[j] = temp;

  // Swap positions
  let tempY = rectanglesLeft[i].y;
  rectanglesLeft[i].y = rectanglesLeft[j].y;
  rectanglesLeft[j].y = tempY;
}

async function swapBubble(i, j) {
  let temp = rectanglesRight[i];
  rectanglesRight[i] = rectanglesRight[j];
  rectanglesRight[j] = temp;

  // Swap positions
  let tempY = rectanglesRight[i].y;
  rectanglesRight[i].y = rectanglesRight[j].y;
  rectanglesRight[j].y = tempY;
  await sleep()

}



// Delay function to visualize each step
function sleep(height) {
  if(bubbleSortRunning){
    rightOperation++;
  }
  if(!sorted){
    leftOperation++;
  }
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
  for (let i = 0; i < rectanglesLeft.length; i++) {
    rectanglesLeft[i].y = i * rectWidth;
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

  fill(255);
  textAlign(CENTER);
  textSize(textSize1);
  let buffer = textSize1 * 2
  text("Quick Sort", width/2, height / 8);
  text("vs", width/2, height / 8 + buffer/2);
  text("Bubble Sort", width/2, height / 8 + buffer);
  textSize(textSize2);
  text("Operations: " + leftOperation, width/2, height/8 + buffer + textSize1/2 + 100);
  text("Operations: " + rightOperation, width/2, height/8 + buffer + textSize1/2);
  textSize(textSize3);
  text("Speed: " + speed/10 + "%", width/2, height/8 + buffer + textSize1/2 + textSize2/2);
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

function mousePressed() {
  userStartAudio();
}

// Reload the page when the window is resized
function windowResized() {
  location.reload();
}