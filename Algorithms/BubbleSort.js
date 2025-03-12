let rectangles = [];
let rectWidth = 20;
let sorting = true;
let checkPosition = 0;
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
let debug = false;
let fontSize = width/100

function setup() {
  createCanvas(windowWidth * 0.95, windowHeight);
  
  // Create a slider for adjusting sorting speed
  speedSlider = createSlider(1, 100, 20, 1);
  speedSlider.position(200, 400);

  attackTimeSlider = createSlider(0, 1, 0, .01);
  attackTimeSlider.position(200, 450);

  decayTimeSlider = createSlider(0, 1, .05, .01);
  decayTimeSlider.position(200, 500);

  sustainRatioSlider = createSlider(0, 1, .03, .01);
  sustainRatioSlider.position(200, 550);

  releaseTimeSlider = createSlider(0, 1, .05, .01);
  releaseTimeSlider.position(200, 600);

  // Create a debug button
  debugButton = createButton('Debug');
  debugButton.position(200, 650);
  debugButton.class('circle-button'); // Add CSS class
  debugButton.mousePressed(debugFunction);
  
  speedSlider.hide();
  attackTimeSlider.hide();
  decayTimeSlider.hide();
  sustainRatioSlider.hide();
  releaseTimeSlider.hide();
  // Sound setup
  osc = new p5.Oscillator('sine');
  osc.start();
  
  envelope = new p5.Envelope();
  // set attackTime, decayTime, sustainRatio, releaseTime
  totalRect = round(width / rectWidth);
  maxHeight = height/2
  heightStep = maxHeight/totalRect

  // Generate rectangles
  for (let i = 0; i < totalRect; i++) {
    let rectHeight = (i + 1) * heightStep;
    rectangles.push({ x: i * rectWidth, height: rectHeight });
    maxHeight = rectHeight;
  }
  rectangles = shuffleArray(rectangles)
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

  // Sorting logic
  if (sorting) {
    if (checkPosition >= rectangles.length - 1) {
      if (!swapped) {
        sorting = false;
      }
      checkPosition = 0;
      swapped = false;
    }

    if (frameCount % round(100 / speed) === 0) {
      let a = rectangles[checkPosition];
      let b = rectangles[checkPosition + 1];

      if (a && b && a.height > b.height) {
        // Swap heights
        [rectangles[checkPosition], rectangles[checkPosition + 1]] = [b, a];
        [rectangles[checkPosition].x, rectangles[checkPosition + 1].x] = [rectangles[checkPosition + 1].x, rectangles[checkPosition].x];
        swapped = true;
        playBeep(a.height, maxHeight);

      }

      checkPosition++;
    } 



        // Draw rectangles

  }
      

  if (frameCount % round(100 / 10) === 0) {
    if(sorting == false){
      if (checkPosition >= rectangles.length - 1) {
        checkPosition = 0;
      }
      let a = rectangles[checkPosition];
      playBeep(a.height, maxHeight);
      checkPosition++
    }
  }
  for (let i = 0; i < rectangles.length; i++) {
    let rectColor = (i === checkPosition || i === checkPosition + 1) ? 'red' : 'white';
    fill(rectColor);
    stroke(0);
    rect(rectangles[i].x, height - rectangles[i].height, rectWidth - 2, rectangles[i].height);
  }

  drawUI();
}

function playBeep(height, maxHeight) {
  // Map (height, 0, maxHeight, minFreq, maxFreq)
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

function drawUI(){
  if(debug){
    fill(255);
    let speed = speedSlider.value();
    let attackTime = attackTimeSlider.value();
    let decayTime = decayTimeSlider.value();
    let sustainRatio = sustainRatioSlider.value();
    let releaseTime = releaseTimeSlider.value();
    textSize(24);
    text("Speed: " + speed, 25, 25);
    text("Attack Time: " + attackTime, 25, 75);
    text("Decay Time: " + decayTime, 25, 125);
    text("Sustain Time: " + sustainRatio, 25, 175);
    text("Release Time: " + releaseTime, 25, 225);
  }else{
    
  }


  // Display info
  fill(255);
  textSize(width/20);
  text("Bubble Sort", 200, height/2 - 200);

}

function debugFunction(){
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

