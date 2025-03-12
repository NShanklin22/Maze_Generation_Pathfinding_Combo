// Configuration 
const config = {
  totalWidth: window.innerWidth,
  totalHeight: window.innerHeight,
  uiHeight: 150,                         // Height of UI at bottom
  gridWidth: window.innerWidth - 200,    // Centered grid
  gridHeight: window.innerHeight - 300,  // Leave space for UI at bottom
  gridOffsetX: 50,                       // X offset for grid 
  gridOffsetY: 100,                      // Y offset for grid
  cellWidth: 20,
  cellHeight: 20,
  allowDiagonals: true,
  wallDensity: 0.5,
  // Algorithm control
  baseSpeed: 20,        // Base speed in ms (will be adjusted by % from slider)
  // Final path animation configuration - adjustable but not in UI
  finalPathSteps: 20,  // How many steps to use when drawing final path
  finalPathSpeed: 50,    // Delay between chunks of the final path (ms)
  finalPathBlinkCount: 30, // How many times the path blinks at the end
  finalPathBlinkSpeed: 1, // Speed of the final path blinking (ms)
  // Colors - Fallout Pip-Boy green theme
  pathColor: [0,238,0],           // Bright green for path
  searchingPathColor: [0,200,0],   // Slightly darker green for searching
  openSetColor: [0,238,0],         // Medium green for open set
  closedSetColor: [0,238,0],        // Dark green for closed set
  startColor: [188, 255, 174],        // Light green for start
  endColor: [0,238,0],            // Amber/orange for the end node (contrasting color)
  backgroundColor: [0,0,0,2],        // Very dark green background
  uiBackgroundColor: [20, 40, 30],    // Dark green UI background
  // Audio settings
  audioEnabled: true,
  audioVolume: 0.05,
  // Speed percentage (1-100%)
  speedPercentage: 50
};

// Grid
const cols = Math.round(config.gridWidth / config.cellWidth);
const rows = Math.round(config.gridHeight / config.cellHeight);
let grid = new Array(cols);
let path = [];
let finalPath = []; // For storing the final path for replay
let finished = false;
let paused = false;
let running = false;
let stepsTaken = 0;
let timeStarted;
let showDebug = false; // Whether to show debug stats

// Open and closed set for A* algorithm
let openSet = [];
let closedSet = [];

// Start and end points
let start;
let end;

// Audio
let oscillator;
let audioContext;

// UI Controls
let startButton;
let pauseButton;
let resetButton;
let speedSlider;
let speedLabel;
let diagonalCheckbox;
let wallDensitySlider;
let wallDensityLabel;
let audioCheckbox;

function sleep(ms) {
  // Calculate delay factor: 
  // - At 0% speed: 10x slower (maximum delay)
  // - At 50% speed: normal speed (1x)
  // - At 100% speed: 10x faster (minimum delay)
  const speedFactor = config.speedPercentage / 100;
  const delayFactor = 10 * Math.pow(0.1, speedFactor * 2); // Exponential scaling for more dramatic effect
  
  const actualDelay = ms * delayFactor;
  return new Promise(resolve => setTimeout(resolve, Math.max(1, actualDelay)));
}
// Audio functions
function setupAudio() {
  // Create audio context
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

function playNote(frequency, duration = 100, waveType = 'sine') {
  if (!config.audioEnabled || !audioContext) return;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.type = waveType;
  oscillator.frequency.value = frequency;
  gainNode.gain.value = config.audioVolume;
  
  // Add a slight fade in/out to avoid clicks
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(config.audioVolume, audioContext.currentTime + 0.01);
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration/1000);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.start();
  
  setTimeout(() => {
    oscillator.stop();
  }, duration);
}

// Play a note based on the path length - consistent lower notes
function playPathNote() {
  if (!config.audioEnabled) return;
  
  // Lower base frequency - C3 = 130.81Hz
  const baseFreq = 261.63;
  
  // Use pentatonic scale for pleasant sounds
  const pentatonic = [0, 2, 4, 7, 9]; // C, D, E, G, A in the lower octave
  
  // Use path length to determine the note within the scale
  const noteIndex = path.length % pentatonic.length;
  const semitones = pentatonic[noteIndex];
  
  // Calculate frequency using equal temperament formula
  const frequency = baseFreq * Math.pow(2, semitones / 12);
  
  // Consistently use sine waves for smoother sound
  playNote(frequency, 80, 'sine');
}

// Play a sequence of notes for the final path
async function playFinalPathSequence() {
  if (!config.audioEnabled) return;
  
  // Create a variety of notes using multiple octaves
  const notes = [
    // C major scale in octave 3 (lower notes)
    246.94, // B3
    261.63, // C4
    293.66, // D4
    329.63, // E4
    349.23, // F4
    392.00, // G4
    440.00, // A4
    493.88  // B4
  ];
  
  // Play a simple ascending scale
  for (let i = 0; i < 8; i++) {
    playNote(notes[i], 80, 'sine');
    await sleep(70);
  }
  
// Final chord
playNote(261.63, 500, 'sine'); // C4
playNote(329.63, 500, 'sine'); // E4
playNote(392.00, 500, 'sine'); // G4
playNote(523.25, 500, 'sine'); // C5
}

// Convert Cell to ES6 class
class Cell {
  constructor(i, j) {
    this.i = i;
    this.j = j;
    this.f = 0;
    this.g = 0;
    this.h = 0;
    this.wall = random(1) < config.wallDensity;
    this.neighbors = [];
    this.previous = null;
    // For visualization
    this.highlighted = false;
    this.highlightColor = [0,238,0];
  }
  
  show(color) {
    // Calculate position with grid offset
    const x = config.gridOffsetX + (this.i * config.cellWidth) + config.cellWidth / 2;
    const y = config.gridOffsetY + (this.j * config.cellHeight) + config.cellHeight / 2;
    
    // Always draw a cell background
    noStroke();
    if (this.wall) {
      // Wall cells
      fill(0, 95, 0);
      ellipse(x, y, config.cellWidth / 2, config.cellHeight / 2);
    } else {
      // Regular empty cell
      fill(20, 20, 20);  // Dark background for empty cells
      ellipse(x, y, config.cellWidth / 4, config.cellHeight / 4);
      
      // If it's highlighted, draw the highlight over it
      if (this.highlighted) {
        fill(...this.highlightColor);
        ellipse(x, y, config.cellWidth / 4, config.cellHeight / 4);
      }
    }
  }
  
  
  addNeighbors(grid) {
    const i = this.i;
    const j = this.j;

    if (i < cols - 1) {
      this.neighbors.push(grid[i + 1][j]);
    }
    if (i > 0) {
      this.neighbors.push(grid[i - 1][j]);
    }
    if (j < rows - 1) {
      this.neighbors.push(grid[i][j + 1]);
    }
    if (j > 0) {
      this.neighbors.push(grid[i][j - 1]);
    }

    // Diagonals (only add if config allows)
    if (config.allowDiagonals) {
      if (i > 0 && j > 0) {
        this.neighbors.push(grid[i - 1][j - 1]);
      }
      if (i < cols - 1 && j > 0) {
        this.neighbors.push(grid[i + 1][j - 1]);
      }
      if (i > 0 && j < rows - 1) {
        this.neighbors.push(grid[i - 1][j + 1]);
      }
      if (i < cols - 1 && j < rows - 1) {
        this.neighbors.push(grid[i + 1][j + 1]);
      }
    }
  }
  
  // Highlight this cell (for visualization)
  highlight(color = [0,238,0]) {
    this.highlighted = true;
    this.highlightColor = color;
  }
  
  // Remove highlight
  unhighlight() {
    this.highlighted = false;
  }
}

// Setup function runs once at the start
function setup() {
  createCanvas(config.totalWidth, config.totalHeight);
  
  // Setup audio
  setupAudio();
  
  // Create UI elements
  createUIControls();
  
  // Initialize everything
  initializeGrid();
  
  timeStarted = millis();

  applyPipBoyStyle();
}

function createUIControls() {
  // Bottom UI panel layout
  const uiY = height - config.uiHeight;
  const padding = 20;
  let uiX = padding;
  const buttonWidth = 120;
  const controlSpacing = 150;
  
  // Start button
  startButton = createButton('Start');
  startButton.position(uiX, uiY + padding);
  startButton.size(buttonWidth);
  startButton.mousePressed(startAlgorithm);
  uiX += controlSpacing;
  
  // Pause/Resume button
  pauseButton = createButton('Pause');
  pauseButton.position(uiX, uiY + padding);
  pauseButton.size(buttonWidth);
  pauseButton.mousePressed(togglePause);
  pauseButton.attribute('disabled', '');  // Initially disabled
  uiX += controlSpacing;
  
  // Reset button
  resetButton = createButton('Reset');
  resetButton.position(uiX, uiY + padding);
  resetButton.size(buttonWidth);
  resetButton.mousePressed(resetAlgorithm);
  uiX += controlSpacing;
  
  // Diagonal movement checkbox
  diagonalCheckbox = createCheckbox('Allow Diagonals', config.allowDiagonals);
  diagonalCheckbox.position(uiX, uiY + padding);
  diagonalCheckbox.changed(updateDiagonalSetting);
  uiX += controlSpacing;
  
  // Audio checkbox
  audioCheckbox = createCheckbox('Enable Audio', config.audioEnabled);
  audioCheckbox.position(uiX, uiY + padding);
  audioCheckbox.changed(() => {
    config.audioEnabled = audioCheckbox.checked();
  });
  uiX = padding;
  
  // Speed control - second row
  createElement('label', 'Speed:').position(uiX, uiY + padding + 40);
  speedSlider = createSlider(1, 100, config.speedPercentage, 1);
  speedSlider.position(uiX + 60, uiY + padding + 40);
  speedSlider.size(buttonWidth);
  speedSlider.input(updateSpeedFromSlider);
  speedLabel = createElement('p', config.speedPercentage + '%');
  speedLabel.position(uiX + 180, uiY + padding + 40);
  uiX += controlSpacing * 2;
  
  // Wall density control - second row
  createElement('label', 'Wall Density:').position(uiX, uiY + padding + 40);
  wallDensitySlider = createSlider(0, 100, config.wallDensity * 100, 1);
  wallDensitySlider.position(uiX + 100, uiY + padding + 40);
  wallDensitySlider.size(buttonWidth);
  wallDensityLabel = createElement('p', Math.round(config.wallDensity * 100) + '%');
  wallDensityLabel.position(uiX + 230, uiY + padding + 40);
  
  // Initialize speed from slider
  updateSpeedFromSlider();
}

function updateSpeedFromSlider() {
  config.speedPercentage = speedSlider.value();
  speedLabel.html(config.speedPercentage + '%');
}

function updateDiagonalSetting() {
  config.allowDiagonals = diagonalCheckbox.checked();
  resetAlgorithm();
}

// Initialize/reset the grid and algorithm state
function initializeGrid() {
  // Update wall density from slider
  background(0);
  config.wallDensity = wallDensitySlider.value() / 100;
  wallDensityLabel.html(Math.round(config.wallDensity * 100) + '%');
  
  // Initialize grid
  for (let i = 0; i < cols; i++) {
    grid[i] = new Array(rows);
  }
  
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j] = new Cell(i, j);
    }
  }

  // Add neighbors for each cell
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j].addNeighbors(grid);
    }
  }

  // Set start and end points
  start = grid[0][0];
  end = grid[cols - 1][rows - 1];

  // Make sure start and end aren't walls
  start.wall = false;
  end.wall = false;
  
  // Clear area around end point
  for (let i = cols - 3; i < cols; i++) {
    for (let j = rows - 3; j < rows; j++) {
      if (i >= 0 && j >= 0 && i < cols && j < rows) {
        grid[i][j].wall = false;
      }
    }
  }
  
  // Reset algorithm state
  openSet = [];
  closedSet = [];
  path = [];
  finalPath = [];
  finished = false;
  running = false;
  paused = false;
  stepsTaken = 0;
  
  // Reset UI
  startButton.removeAttribute('disabled');
  pauseButton.attribute('disabled', '');
  pauseButton.html('Pause');
  diagonalCheckbox.removeAttribute('disabled');
  wallDensitySlider.removeAttribute('disabled');
  
  // Add start to open set
  openSet.push(start);
  
  timeStarted = millis();
}

// Main draw loop - only handles rendering
function draw() {
  background(config.backgroundColor);
  
  // Draw grid
  drawGrid();
  drawPath();
  
  // Draw UI background
  noStroke();
  fill(config.uiBackgroundColor);
  rect(0, height - config.uiHeight, width, config.uiHeight);
  

  
  // Draw debug info if enabled
  if (showDebug) {
    updateStats();
  }
  
  // Add debug toggle hint
  textSize(14);
  textAlign(RIGHT, BOTTOM);
  fill(...config.pathColor);
  text("Press 'D' to toggle debug info", width - 20, height - 20);

  fill(0,238,0);
  textSize(32);
  textAlign(LEFT);
  text("A* Pathfinding Algorithm", 50, 95);
  
}

// Update statistics display
function updateStats() {
  if (!showDebug) return;
  
  // Calculate elapsed time
  const elapsedTime = (millis() - timeStarted) / 1000;
  
  // Create display text
  const stats = [
    `Steps: ${stepsTaken}`,
    `Path Length: ${path.length}`,
    `Open Set: ${openSet.length}`,
    `Closed Set: ${closedSet.length}`,
    `Time: ${elapsedTime.toFixed(2)}s`,
    `Status: ${getStatusText()}`
  ];
  
  // Draw stats panel in the bottom right
  const padding = 10;
  const lineHeight = 20;
  const statsWidth = 200;
  const statsHeight = (stats.length * lineHeight) + (padding * 2);
  const statsX = width - statsWidth - padding;
  const statsY = height - config.uiHeight - statsHeight - padding;
  
  // Draw background rectangle for stats
  fill(0, 0, 0, 180); // Semi-transparent background
  noStroke();
  rect(statsX, statsY, statsWidth, statsHeight);
  
  // Draw stats text
  textAlign(LEFT, TOP);
  textSize(14);
  fill(...config.pathColor); // Use the bright green color from config
  
  for (let i = 0; i < stats.length; i++) {
    text(stats[i], statsX + padding, statsY + padding + (i * lineHeight));
  }
}

// Async function to run the A* algorithm
async function runAlgorithm() {
  running = true;
  startButton.attribute('disabled', '');
  pauseButton.removeAttribute('disabled');
  diagonalCheckbox.attribute('disabled', '');
  wallDensitySlider.attribute('disabled', '');
  
  while (openSet.length > 0 && !finished) {
    // Check if paused
    if (paused) {
      await sleep(100);  // Small delay while paused to prevent CPU usage
      continue;
    }
    
    // Perform one step
    stepsTaken++;
    
    // Find node with lowest f score - optimize for large open sets
    let winner = findNodeWithLowestFScore();
    let current = openSet[winner];
    
    // Highlight current node
    current.highlight([0,238,0]);
    await sleep(config.baseSpeed);
    
    // Check if we found the end
    if (current === end) {
      console.log("DONE! Path found in " + stepsTaken + " steps");
      finished = true;
      
      // Store the final path for visualization
      finalPath = [...path];
      finalPath.push(end);
      
      // Visualize the final path later
      break;
    }

    // Remove current from open set and add to closed set
    removeFromOpenSet(winner);
    closedSet.push(current);
    
    // Only add delay for smaller open sets to avoid slowdown
    if (openSet.length < 100) {
      await sleep(config.baseSpeed / 2);
    }

    // Process neighbors
    await processNeighbors(current);
    
    // Reconstruct path
    reconstructPath(current);
    
    // Play a note based on path length
    playPathNote();
    
    // Wait before the next step - adaptive delay based on open set size
    const delayFactor = Math.max(0.1, 1 - (openSet.length / 500));
    await sleep(config.baseSpeed * delayFactor);
    
    // Unhighlight the current node
    current.unhighlight();
  }
  
  running = false;
  
  // If we found a path, animate it
  if (finished) {
    await animateFinalPath();
  } else {
    console.log("No solution exists!");
  }
  
  pauseButton.attribute('disabled', '');
}

// Find the node in the open set with the lowest f score (optimized version)
function findNodeWithLowestFScore() {
  let winner = 0;
  
  // For large open sets, just find the winner without animation
  for (let i = 0; i < openSet.length; i++) {
    if (openSet[i].f < openSet[winner].f) {
      winner = i;
    }
  }
  
  return winner;
}

// Remove element from open set (optimized without delay)
function removeFromOpenSet(index) {
  openSet.splice(index, 1);
}

// Process all neighbors of the current node
async function processNeighbors(current) {
  const neighbors = current.neighbors;
  
  // Adaptive animation: if we have too many neighbors, skip individual highlights
  const shouldAnimateNeighbors = openSet.length < 100;
  
  for (let i = 0; i < neighbors.length; i++) {
    const neighbor = neighbors[i];
    
    // Highlight neighbor being examined (only if not too many nodes)
    if (shouldAnimateNeighbors && !neighbor.wall) {
      neighbor.highlight([0,142,0]);
      await sleep(config.baseSpeed / 4);
    }

    // Skip if in closed set or is a wall
    if (!closedSet.includes(neighbor) && !neighbor.wall) {
      const tempG = current.g + 1;
      let newPath = false;

      // Check if we need to update neighbor
      if (openSet.includes(neighbor)) {
        if (tempG < neighbor.g) {
          neighbor.g = tempG;
          newPath = true;
          
          // Play a note when improving a path (reduced frequency)
          if (Math.random() < 0.3) {
            playNote(134.81, 60, 'sine'); // C3
          }
        }
      } else {
        neighbor.g = tempG;
        newPath = true;
        openSet.push(neighbor);
        
        // Play a note when adding to open set (reduced frequency)
        if (Math.random() < 0.2 && openSet.length % 5 === 0) {
            playNote(110.00, 60, 'sine'); // A2
        }
      }

      // Update f score
      if (newPath) {
        neighbor.h = heuristic(neighbor, end);
        neighbor.f = neighbor.g + neighbor.h;
        neighbor.previous = current;
      }
      
      // Only add delay for smaller open sets
      if (shouldAnimateNeighbors) {
        await sleep(config.baseSpeed / 4);
      }
    }
    
    // Unhighlight the neighbor unless it's part of open or closed set
    if (shouldAnimateNeighbors && !neighbor.wall && !openSet.includes(neighbor) && !closedSet.includes(neighbor)) {
      neighbor.unhighlight();
    }
  }
}

// Reconstruct the current best path (optimized without delay)
function reconstructPath(current) {
  path = [];
  let temp = current;
  
  // Build the path
  while (temp) {
    path.push(temp);
    temp = temp.previous;
  }
  
  // Reverse the path (start to end)
  path.reverse();
}
async function animateFinalPath() {
  // Play victory sequence
  playFinalPathSequence();
  
  // Clear any highlights
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j].unhighlight();
    }
  }
  
  // Draw path step by step with configurable speed
  path = [];
  
  // Calculate how many nodes to add per step for smooth animation
  const pathLength = finalPath.length;
  const stepsToShow = Math.min(pathLength, config.finalPathSteps);
  const nodesPerStep = Math.ceil(pathLength / stepsToShow);
  
  // Green color for the path animation
  const pathColor = [0,238,0];
  
  // Animate the path in chunks
  for (let step = 0; step < stepsToShow; step++) {
    // Calculate which nodes to add in this step
    const startIdx = step * nodesPerStep;
    const endIdx = Math.min(pathLength, startIdx + nodesPerStep);
    
    // Add all nodes for this step
    for (let i = startIdx; i < endIdx; i++) {
      path.push(finalPath[i]);
      finalPath[i].highlight(pathColor);
      
      // Play notes less frequently for the final path
      if (i % 3 === 0 && config.audioEnabled) {
        const baseFreq = 130.81; // C3
        // Simple C major scale progression
        const noteIndex = i % 7;
        const scaleOffsets = [0, 2, 4, 5, 7, 9, 11]; // C major scale pattern
        const freq = baseFreq * Math.pow(2, scaleOffsets[noteIndex] / 12);
        
        playNote(freq, 60, 'sine');
      }
    }
    
    // Wait between chunks - using the configurable speed
    await sleep(config.finalPathSpeed);
  }
  
  // Blink the path a few times
  for (let blink = 0; blink < config.finalPathBlinkCount; blink++) {
    // Hide path
    for (let i = 0; i < finalPath.length; i++) {
      finalPath[i].unhighlight();
    }
    await sleep(config.finalPathBlinkSpeed);
    
    // Show path
    for (let i = 0; i < finalPath.length; i++) {
      finalPath[i].highlight(pathColor);
    }
    await sleep(config.finalPathBlinkSpeed);
  }
}

// Draw the grid, open set, and closed set
function drawGrid() {
  // Draw grid
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j].show(color(255));
    }
  }

  // Draw closed set (no need to draw cells that are highlighted)
  for (let i = 0; i < closedSet.length; i++) {
    if (!closedSet[i].highlighted) {
      closedSet[i].show(color(...config.closedSetColor));
    }
  } 

  // Draw open set (no need to draw cells that are highlighted)
  for (let i = 0; i < openSet.length; i++) {
    if (!openSet[i].highlighted) {
      openSet[i].show(color(...config.openSetColor));
    }
  }

  // Draw start and end
  start.show(color(...config.startColor));
  end.show(color(...config.endColor));
}

// Draw the current path
function drawPath() {
  // Only draw if there's a path
  if (path.length <= 1) return;
  
  beginShape();
  noFill();
  if (finished) {
    strokeWeight(6);
    stroke(...config.pathColor);
  } else {
    strokeWeight(3);
    stroke(...config.searchingPathColor);
  }
  
  for (let i = 0; i < path.length; i++) {
    vertex(
      config.gridOffsetX + (path[i].i * config.cellWidth) + config.cellWidth / 2, 
      config.gridOffsetY + (path[i].j * config.cellHeight) + config.cellHeight / 2
    );
  }
  endShape();
}

function applyPipBoyStyle() {
  // Define Pip-Boy text colors
  const pipBoyTextColor = "#00FF66"; // Bright green
  const pipBoyLightColor = "#BCFFAE"; // Light green
  
  // Get all created elements (p5.js creates DOM elements)
  const allElements = selectAll('*');
  
  // Apply styles to all elements
  for (let element of allElements) {
    if (element.elt) {
      // Skip canvas element
      if (element.elt.tagName === 'CANVAS') continue;
      
      // Apply styles based on tag type
      if (element.elt.tagName === 'H2' || element.elt.tagName === 'H3') {
        element.style('color', pipBoyLightColor);
        element.style('font-family', 'monospace');
        element.style('text-shadow', '0 0 5px #00FF66');
      } 
      else if (element.elt.tagName === 'BUTTON') {
        element.style('background-color', '#004422');
        element.style('color', pipBoyTextColor);
        element.style('border', '1px solid #00FF66');
        element.style('font-family', 'monospace');
        element.style('box-shadow', '0 0 5px #00FF66');
      }
      else if (element.elt.tagName === 'LABEL' || element.elt.tagName === 'P') {
        element.style('color', pipBoyTextColor);
        element.style('font-family', 'monospace');
      }
      else if (element.elt.tagName === 'INPUT') {
        if (element.elt.type === 'checkbox') {
          // Style checkbox labels
          const label = element.elt.parentNode;
          if (label) {
            label.style.color = pipBoyTextColor;
            label.style.fontFamily = 'monospace';
          }
        }
        else if (element.elt.type === 'range') {
          // Style sliders
          element.style('accent-color', pipBoyTextColor);
        }
      }
    }
  }
}


// Get status text based on algorithm state
function getStatusText() {
  if (finished) {
    return "FINISHED! Path found";
  } else if (openSet.length === 0 && running === false) {
    return "Not started";
  } else if (openSet.length === 0) {
    return "NO SOLUTION POSSIBLE";
  } else if (paused) {
    return "PAUSED";
  } else if (running) {
    return "SEARCHING...";
  } else {
    return "Ready";
  }
}

// Button click handlers
function startAlgorithm() {
  if (!running && !finished) {
    // Initialize audio context if needed (requires user interaction)
    if (!audioContext && config.audioEnabled) {
      setupAudio();
    }
    
    timeStarted = millis();
    runAlgorithm();
  }
}

function togglePause() {
  paused = !paused;
  pauseButton.html(paused ? 'Resume' : 'Pause');
}

function resetAlgorithm() {
  initializeGrid();
}

// Handle keyboard input
function keyPressed() {
  if (key === ' ') {
    if (running) {
      togglePause();
    } else if (!finished) {
      startAlgorithm();
    }
  } else if (key === 'r' || key === 'R') {
    resetAlgorithm();
  } else if (key === 'd' || key === 'D') {
    showDebug = !showDebug;
  }
}

// Remove element from array
function removeFromArray(arr, elt) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] === elt) {
      arr.splice(i, 1);
      return;
    }
  }
}

// Heuristic function
function heuristic(a, b) {
  if (config.allowDiagonals) {
    // Euclidean distance (better for 8-directional movement)
    return dist(a.i, a.j, b.i, b.j);
  } else {
    // Manhattan distance (better for 4-directional movement)
    return abs(a.i - b.i) + abs(a.j - b.j);
  }
}