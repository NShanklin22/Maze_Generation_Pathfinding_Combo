// Add a function to restart solving without generating a new maze
function restartSolving() {
    if (config.mazeGenerationComplete && !config.solvingMaze) {
      // Reset pathfinding variables but keep the maze
      config.solvingMaze = false;
      config.pauseSolving = false;
      config.finished = false;
      openSet = [];
      closedSet = [];
      path = [];
      finalPath = [];
      stepsTaken = 0;
      animatingFinalPath = false;
      animationStep = 0;
      
      // Enable and disable appropriate buttons
      solveButton.removeAttribute('disabled');
      reSolveButton.attribute('disabled', '');
      pauseButton.attribute('disabled', '');
    }
  }function animateFinalPath() {
    // Only draw up to the current animation step
    if (animationStep <= finalPath.length) {
      // Draw the animated path up to current step
      if (animationStep > 0) {
        beginShape();
        noFill();
        strokeWeight(5);
        stroke(config.pathColor);
        
        for (let i = 0; i < animationStep; i++) {
          vertex(
            config.sideMargin + (finalPath[i].i * config.cellWidth) + config.cellWidth / 2,
            config.uiHeight + config.uiTopMargin + (finalPath[i].j * config.cellHeight) + config.cellHeight / 2
          );
        }
        endShape();
      }
      
      // Every few frames, increment the animation step
      if (frameCount % 5 === 0) {
        animationStep++;
        
        // Play sound for each step
        if (animationStep % 3 === 0 && animationStep < finalPath.length) {
          playPathfindingNote(animationStep * 2);
        }
      }
    } 
    // When animation is complete, do blinking effect
    else if (animationStep > finalPath.length && animationStep <= finalPath.length + config.finalPathBlinkCount * 2) {
      // Every few frames, toggle visibility
      if (frameCount % 10 === 0) {
        animationStep++;
      }
      
      // Only draw on even animation steps (creates blinking effect)
      if (animationStep % 2 === 0) {
        beginShape();
        noFill();
        strokeWeight(5);
        stroke(config.pathColor);
        
        for (let i = 0; i < finalPath.length; i++) {
          vertex(
            config.sideMargin + (finalPath[i].i * config.cellWidth) + config.cellWidth / 2,
            config.uiHeight + config.uiTopMargin + (finalPath[i].j * config.cellHeight) + config.cellHeight / 2
          );
        }
        endShape();
      }
    } 
    // Animation complete
    else {
      // End animation mode and show final path
      animatingFinalPath = false;
      
      // Draw the final complete path
      beginShape();
      noFill();
      strokeWeight(5);
      stroke(config.pathColor);
      
      for (let i = 0; i < finalPath.length; i++) {
        vertex(
          config.sideMargin + (finalPath[i].i * config.cellWidth) + config.cellWidth / 2,
          config.uiHeight + config.uiTopMargin + (finalPath[i].j * config.cellHeight) + config.cellHeight / 2
        );
      }
      endShape();
    }
  }// Configuration
  const config = {
    // Canvas dimensions
    totalWidth: 1000,                    // 800 + 100px on each side
    totalHeight: 1150,                   // 850 + 100px on top + 100px on bottom + 100px for UI
    uiHeight: 100,                       // Height of UI area at top
    uiTopMargin: 100,                    // Extra margin at top for TikTok
    uiBottomMargin: 100,                 // Extra margin at bottom for TikTok
    sideMargin: 100,                     // Side margins for TikTok
    
    // Cell size for maze
    cellWidth: 30,
    cellHeight: 30,
    
    // UI Controls
    baseSpeed: 20,                        // Base speed in ms
    speedPercentage: 50,                  // Default speed percentage
  
    // State control
    mazeGenerationComplete: false,
    solvingMaze: false,
    pauseSolving: false,
    finished: false,
    
    // Final path animation
    finalPathAnimationSpeed: 100,         // Speed of final path animation
    finalPathBlinkCount: 5,               // Number of times the final path blinks
    
    // Colors (using original maze generator colors)
    backgroundColor: [0, 0, 0],           // Black background
    visitedColor: [0, 47, 0],             // Dark green for visited cells
    wallColor: [0, 238, 0],               // Bright green for walls
    currentColor: [0, 238, 0],            // Bright green for current cell
    startColor: [0, 238, 0],              // Bright green for start
    endColor: [0, 238, 0],                // Bright green for end
    pathColor: [0, 238, 0],               // Bright green for path
    openSetColor: [0, 100, 0, 80],        // Semi-transparent green for open set
    closedSetColor: [0, 50, 0, 50],       // Darker semi-transparent green for closed set
    currentNodeColor: [0, 238, 0],        // Color for current node in solving
    
    // Audio settings
    audioEnabled: true,
    audioVolume: 0.05
  };
  
  // ===== MAZE VARIABLES (from Main1.js) =====
  let cols, rows;
  let grid = [];
  let stack = [];
  let current;
  let start;
  let end;
  let fps = 30;
  
  // ===== PATHFINDING VARIABLES (from Main2.js) =====
  let openSet = [];
  let closedSet = [];
  let path = [];
  let finalPath = [];
  let stepsTaken = 0;
  let showDebug = false;
  let animatingFinalPath = false;
  let animationStep = 0;
  
  // ===== UI CONTROLS =====
  let generateButton;
  let solveButton;
  let reSolveButton;
  let pauseButton;
  let resetButton;
  let speedSlider;
  let speedLabel;
  let audioCheckbox;
  
  // ===== AUDIO =====
  let audioContext;
  let osc;
  
  // ===== UTILS =====
  function sleep(ms) {
    // Calculate delay based on speed percentage
    const speedFactor = config.speedPercentage / 100;
    const delayFactor = 10 * Math.pow(0.1, speedFactor * 2);
    const actualDelay = ms * delayFactor;
    return new Promise(resolve => setTimeout(resolve, Math.max(1, actualDelay)));
  }
  
  // ===== CELL CLASS (Combined from both files) =====
  class Cell {
    constructor(i, j) {
      this.i = i;
      this.j = j;
      
      // Maze generation properties
      this.walls = [true, true, true, true]; // top, right, bottom, left
      this.visited = false;
  
      // Pathfinding properties
      this.f = 0;
      this.g = 0;
      this.h = 0;
      this.previous = null;
      this.neighbors = [];
      
      // Visualization properties
      this.highlighted = false;
      this.highlightColor = config.currentColor;
    }
    
    // Show cell with walls for maze generation (using original Main1 style)
    showMaze() {
      // Adjust for margins
      const x = config.sideMargin + (this.i * config.cellWidth);
      const y = config.uiHeight + config.uiTopMargin + (this.j * config.cellHeight);
      
      // Show visited cells
      if (this.visited) {
        noStroke();  
        fill(config.visitedColor);
        rect(x, y, config.cellWidth, config.cellHeight);
      }
      
      // Draw walls
      if (this.walls[0]) {
        stroke(config.wallColor);
        strokeWeight(1);
        line(x, y, x + config.cellWidth, y); // top
      }
      if (this.walls[1]) {
        stroke(config.wallColor);
        strokeWeight(1);
        line(x + config.cellWidth, y, x + config.cellWidth, y + config.cellHeight); // right
      }
      if (this.walls[2]) {
        stroke(config.wallColor);
        strokeWeight(1);
        line(x + config.cellWidth, y + config.cellHeight, x, y + config.cellHeight); // bottom
      }
      if (this.walls[3]) {
        stroke(config.wallColor);
        strokeWeight(1);
        line(x, y + config.cellHeight, x, y); // left
      }
    }
    
    // Draw highlight for current cell
    highlight(isCircle = false) {
      const x = config.sideMargin + (this.i * config.cellWidth);
      const y = config.uiHeight + config.uiTopMargin + (this.j * config.cellHeight);
      
      noStroke();
      fill(this.highlightColor);
      
      if (isCircle) {
        // Draw circle for current node during pathfinding
        ellipse(
          x + config.cellWidth/2, 
          y + config.cellHeight/2, 
          config.cellWidth/2, 
          config.cellHeight/2
        );
      } else {
        // Draw rectangle for current during maze generation
        rect(x, y, config.cellWidth, config.cellHeight);
      }
    }
    
    // Check neighbors for maze generation (unvisited cells)
    checkNeighborsForMaze() {
      let neighbors = [];
  
      // Get all neighboring cells in grid
      let top = grid[index(this.i, this.j - 1)];
      let right = grid[index(this.i + 1, this.j)];
      let bottom = grid[index(this.i, this.j + 1)];
      let left = grid[index(this.i - 1, this.j)];
  
      // Add unvisited neighbors
      if (top && !top.visited) {
        neighbors.push(top);
      }
      if (right && !right.visited) {
        neighbors.push(right);
      }
      if (bottom && !bottom.visited) {
        neighbors.push(bottom);
      }
      if (left && !left.visited) {
        neighbors.push(left);
      }
  
      // Return random neighbor or undefined
      if (neighbors.length > 0) {
        let r = floor(random(0, neighbors.length));
        return neighbors[r];
      } else {
        return undefined;
      }
    }
    
    // Add neighbors for pathfinding (cells without walls between them)
    addNeighborsForPathfinding() {
      this.neighbors = [];
      const i = this.i;
      const j = this.j;
  
      // Check each direction and add neighbor if there's no wall
      // Top neighbor
      if (!this.walls[0] && j > 0) {
        this.neighbors.push(grid[index(i, j - 1)]);
      }
      
      // Right neighbor
      if (!this.walls[1] && i < cols - 1) {
        this.neighbors.push(grid[index(i + 1, j)]);
      }
      
      // Bottom neighbor
      if (!this.walls[2] && j < rows - 1) {
        this.neighbors.push(grid[index(i, j + 1)]);
      }
      
      // Left neighbor
      if (!this.walls[3] && i > 0) {
        this.neighbors.push(grid[index(i - 1, j)]);
      }
    }
  }
  
  // ===== SETUP & DRAW =====
  function setup() {
    createCanvas(config.totalWidth, config.totalHeight);
  
    setupAudio();
    
    // Initialize maze dimensions - accounting for margins
    const mazeWidth = config.totalWidth - (2 * config.sideMargin);
    const mazeHeight = config.totalHeight - config.uiHeight - config.uiTopMargin - config.uiBottomMargin;
    
    cols = floor(mazeHeight / config.cellHeight);
    rows = floor(mazeWidth / config.cellWidth);
    
    // Create UI controls
    createUIControls();
    
    // Initialize the maze
    initializeGrid();
    
    // Set frame rate
    frameRate(fps);
  }
  
  function draw() {
    background(config.backgroundColor);
    
    // Draw maze grid
    for (let i = 0; i < grid.length; i++) {
      grid[i].showMaze();
    }
    
    // If we're still generating the maze
    if (!config.mazeGenerationComplete) {
      generateMazeStep();
    }
    
    // If we're solving the maze
    if (config.solvingMaze && !config.pauseSolving) {
      // Draw open and closed sets for visualization
      drawPathfindingState();
    }
    
    // Draw current path or animate final path
    if (animatingFinalPath) {
      animateFinalPath();
    } else {
      drawPath();
    }
    
    // Highlight current cell during maze generation
    if (current && !config.mazeGenerationComplete) {
      current.highlight();
    }
    
    // Mark start and end
    markStartAndEnd();
    
    // Draw UI
    drawUI();
    
    // Draw debug info if enabled
    if (showDebug) {
      drawDebugInfo();
    }
    
    // Draw TikTok-ready borders to make it clear where the content area is
    if (showDebug) {
      noFill();
      stroke(255, 0, 0, 100);
      strokeWeight(1);
      
      // Content area outline
      rect(config.sideMargin, config.uiHeight + config.uiTopMargin, 
           width - (2 * config.sideMargin), 
           height - config.uiHeight - config.uiTopMargin - config.uiBottomMargin);
    }
  }
  
  // ===== MAZE GENERATION =====
  function generateMazeStep() {
    current.visited = true;
    
    // Step 1: Check for unvisited neighboring cells
    let next = current.checkNeighborsForMaze();
    
    if (next) {
      // Step 2: Mark as visited
      next.visited = true;
      
      // Step 3: Push current to stack
      stack.push(current);
      
      // Step 4: Remove walls between current and next
      removeWalls(current, next);
      
      // Play a sound
      playNewCellSound(next);
      
      // Step 5: Move to next cell
      current = next;
    } 
    else if (stack.length > 0) {
      // If no unvisited neighbors, backtrack
      current = stack.pop();
      playBacktrackSound();
    } 
    else {
      // If stack is empty, we're done generating
      config.mazeGenerationComplete = true;
      solveButton.removeAttribute('disabled');
      
      // Set up pathfinding - prepare each cell's neighbors list
      for (let i = 0; i < grid.length; i++) {
        grid[i].addNeighborsForPathfinding();
      }
      
      // Sound indicating generation is complete
      playCompletionSound();
    }
  }
  
  function removeWalls(a, b) {
    // Calculate cell positions relative to each other
    let x = a.i - b.i;
    if (x === 1) {
      a.walls[3] = false; // Remove left wall of a
      b.walls[1] = false; // Remove right wall of b
    } 
    else if (x === -1) {
      a.walls[1] = false; // Remove right wall of a
      b.walls[3] = false; // Remove left wall of b
    }
    
    let y = a.j - b.j;
    if (y === 1) {
      a.walls[0] = false; // Remove top wall of a
      b.walls[2] = false; // Remove bottom wall of b
    } 
    else if (y === -1) {
      a.walls[2] = false; // Remove bottom wall of a
      b.walls[0] = false; // Remove top wall of b
    }
  }
  
  // ===== PATHFINDING =====
  async function solveMaze() {
    config.solvingMaze = true;
    solveButton.attribute('disabled', '');
    generateButton.attribute('disabled', '');
    pauseButton.removeAttribute('disabled');
    
    // Reset pathfinding variables
    openSet = [start];
    closedSet = [];
    path = [];
    finalPath = [];
    stepsTaken = 0;
    animatingFinalPath = false;
    animationStep = 0;
    config.finished = false;
    
    // Track transitions for smoother animation
    let lastCurrentNode = start;
    
    while (openSet.length > 0 && !config.finished) {
      // Check if paused
      if (config.pauseSolving) {
        await sleep(100);
        continue;
      }
      
      // Increment steps
      stepsTaken++;
      
      // Find the node with lowest f score
      let winner = 0;
      for (let i = 0; i < openSet.length; i++) {
        if (openSet[i].f < openSet[winner].f) {
          winner = i;
        }
      }
      
      let currentNode = openSet[winner];
      
      // Check if we reached the end
      if (currentNode === end) {
        console.log("SOLVED! Maze solved in " + stepsTaken + " steps.");
        config.finished = true;
        
        // Store the final path
        finalPath = [];
        let temp = currentNode;
        while (temp) {
          finalPath.push(temp);
          temp = temp.previous;
        }
        finalPath.reverse();
        
        // Play victory sound
        playVictorySound();
        
        // Start the final path animation
        animatingFinalPath = true;
        animationStep = 0;
        
        break;
      }
      
      // Remove current from open set and add to closed set
      openSet.splice(winner, 1);
      closedSet.push(currentNode);
      
      // Process neighbors
      for (let i = 0; i < currentNode.neighbors.length; i++) {
        const neighbor = currentNode.neighbors[i];
        
        if (!closedSet.includes(neighbor)) {
          // Calculate tentative g score
          const tempG = currentNode.g + 1;
          
          let newPath = false;
          
          // Check if we need to update this neighbor
          if (openSet.includes(neighbor)) {
            if (tempG < neighbor.g) {
              neighbor.g = tempG;
              newPath = true;
            }
          } else {
            neighbor.g = tempG;
            newPath = true;
            openSet.push(neighbor);
          }
          
          // Update neighbor's scores
          if (newPath) {
            neighbor.h = heuristic(neighbor, end);
            neighbor.f = neighbor.g + neighbor.h;
            neighbor.previous = currentNode;
          }
        }
      }
      
      // Reconstruct path
      path = [];
      let temp = currentNode;
      while (temp) {
        path.push(temp);
        temp = temp.previous;
      }
      
      // Play sound based on path length
      if (path.length % 5 === 0) {
        playPathfindingNote(path.length);
      }
      
      // Add a delay based on the speed slider
      await sleep(config.baseSpeed);
    }
    
    if (!config.finished && openSet.length === 0) {
      console.log("No solution found!");
    }
    
    pauseButton.attribute('disabled', '');
    reSolveButton.removeAttribute('disabled');
  }
  
  function heuristic(a, b) {
    // Manhattan distance
    return abs(a.i - b.i) + abs(a.j - b.j);
  }
  
  // ===== DRAWING FUNCTIONS =====
  function drawPathfindingState() {
    // Draw closed set with transparency
    noStroke();
    fill(...config.closedSetColor);
    for (let i = 0; i < closedSet.length; i++) {
      const cell = closedSet[i];
      if (cell !== start && cell !== end) {
        rect(
          config.sideMargin + (cell.i * config.cellWidth), 
          config.uiHeight + config.uiTopMargin + (cell.j * config.cellHeight), 
          config.cellWidth, 
          config.cellHeight
        );
      }
    }
    
    // Draw open set with transparency
    fill(...config.openSetColor);
    for (let i = 0; i < openSet.length; i++) {
      const cell = openSet[i];
      if (cell !== start && cell !== end) {
        rect(
          config.sideMargin + (cell.i * config.cellWidth), 
          config.uiHeight + config.uiTopMargin + (cell.j * config.cellHeight), 
          config.cellWidth, 
          config.cellHeight
        );
      }
    }
    
    // Highlight current node as a circle if we're solving and not finished
    if (config.solvingMaze && !config.finished && !config.pauseSolving) {
      if (openSet.length > 0) {
        let winner = 0;
        for (let i = 0; i < openSet.length; i++) {
          if (openSet[i].f < openSet[winner].f) {
            winner = i;
          }
        }
        
        const currentNode = openSet[winner];
        currentNode.highlightColor = config.currentNodeColor;
        currentNode.highlight(true); // Draw as circle
      }
    }
  }
  
  function drawPath() {
    if (path.length <= 1) return;
    
    // Draw the current path
    beginShape();
    noFill();
    strokeWeight(3);
    stroke(config.pathColor);
    
    for (let i = 0; i < path.length; i++) {
      vertex(
        config.sideMargin + (path[i].i * config.cellWidth) + config.cellWidth / 2,
        config.uiHeight + config.uiTopMargin + (path[i].j * config.cellHeight) + config.cellHeight / 2
      );
    }
    endShape();
  }
  
  function markStartAndEnd() {
    // Mark start point
    push();
    noStroke();
    fill(config.startColor);
    const startX = config.sideMargin + (start.i * config.cellWidth);
    const startY = config.uiHeight + config.uiTopMargin + (start.j * config.cellHeight);
    rect(startX, startY, config.cellWidth, config.cellHeight);
    fill(0, 47, 0);
    textSize(12);
    textAlign(CENTER);
    text("Start", startX + config.cellWidth/2, startY + config.cellHeight/2 + 5);
    pop();
    
    // Mark end point
    push();
    noStroke();
    fill(config.endColor);
    const endX = config.sideMargin + (end.i * config.cellWidth);
    const endY = config.uiHeight + config.uiTopMargin + (end.j * config.cellHeight);
    rect(endX, endY, config.cellWidth, config.cellHeight);
    fill(0, 47, 0);
    textSize(12);
    textAlign(CENTER);
    text("End", endX + config.cellWidth/2, endY + config.cellHeight/2 + 5);
    pop();
  }
  
  function drawUI() {
    // Draw UI background areas with subtle background
    push();
    noStroke();
    
    // Top UI area
    fill(0, 47, 0);
    rect(0, 0, width, config.uiHeight);
    
    // Bottom speed control area
    fill(0, 47, 0);
    rect(0, height - config.uiBottomMargin, width, config.uiBottomMargin);
    
    // Display status info above the maze (in the black area)
    fill(0, 238, 0);
    textSize(16);
    textAlign(CENTER);
    
    let statusText = "";
    if (!config.mazeGenerationComplete) {
      statusText = "Generating Maze...";
    } else if (config.finished) {
      statusText = "Maze Solved! Path Length: " + finalPath.length;
    } else if (config.solvingMaze) {
      if (config.pauseSolving) {
        statusText = "Solving Paused";
      } else {
        statusText = "Solving Maze";
      }
    } else {
      statusText = "Maze Generated - Ready to Solve";
    }
    
    // Display status text above the maze
    text(statusText, width/2, config.uiHeight + config.uiTopMargin/2);
    
    // Display debug instructions
    textSize(14);
    textAlign(RIGHT);
    text("Press 'D' to toggle debug info | Press 'Space' to Pause/Resume", width - 20, config.uiHeight + 25);
    
    // Display speed info at bottom
    fill(0, 238, 0);
    textSize(16);
    textAlign(CENTER);
    text("Speed: " + config.speedPercentage + "%", width/2, height - 20);
    pop();
  }
  
  function drawDebugInfo() {
    // Create debug display
    const padding = 10;
    const statsX = config.sideMargin;
    const statsY = config.uiHeight + config.uiTopMargin;
    const statsWidth = 180;
    const lineHeight = 20;
    
    const stats = [
      `Grid: ${cols}x${rows}`,
      `Steps: ${stepsTaken}`,
      `Open set: ${openSet.length}`,
      `Closed set: ${closedSet.length}`,
      `Path length: ${path.length}`,
      `Speed: ${config.speedPercentage}%`,
      `State: ${getState()}`,
      `Canvas: ${width}x${height}`,
      `Maze: ${cols*config.cellWidth}x${rows*config.cellHeight}`
    ];
    
    const statsHeight = (stats.length * lineHeight) + (padding * 2);
    
    // Draw background
    fill(0, 0, 0, 180);
    rect(statsX, statsY, statsWidth, statsHeight);
    
    // Draw text
    textAlign(LEFT);
    textSize(14);
    fill(0, 238, 0);
    
    for (let i = 0; i < stats.length; i++) {
      text(stats[i], statsX + padding, statsY + padding + (i * lineHeight) + 15);
    }
  }
  
  function getState() {
    if (!config.mazeGenerationComplete) {
      return "Generating";
    } else if (config.finished) {
      return "Solved";
    } else if (config.solvingMaze) {
      return config.pauseSolving ? "Paused" : "Solving";
    } else {
      return "Ready";
    }
  }
  
  // ===== UI CONTROLS =====
  function createUIControls() {
    // Create UI in top section - minimalist style like Main1
    const buttonWidth = 120;
    const buttonHeight = 30;
    
    // Speed slider (at bottom)
    speedSlider = createSlider(1, 100, config.speedPercentage);
    speedSlider.position(width/2 - 100, height - config.uiBottomMargin/2);
    speedSlider.style('width', '200px');
    speedSlider.input(updateSpeedFromSlider);
    
    // Position buttons in top UI area
    const buttonY = 15; // Move buttons higher
    let buttonX = 20; // Start from the left
    
    // Generate button
    generateButton = createButton('Generate Maze');
    generateButton.position(buttonX, buttonY);
    generateButton.size(buttonWidth, buttonHeight);
    generateButton.mousePressed(generateNewMaze);
    buttonX += buttonWidth + 10;
    
    // Solve button
    solveButton = createButton('Solve Maze');
    solveButton.position(buttonX, buttonY);
    solveButton.size(buttonWidth, buttonHeight);
    solveButton.mousePressed(startSolving);
    solveButton.attribute('disabled', '');
    buttonX += buttonWidth + 10;
    
    // Re-solve button (new)
    reSolveButton = createButton('Re-Solve Maze');
    reSolveButton.position(buttonX, buttonY);
    reSolveButton.size(buttonWidth, buttonHeight);
    reSolveButton.mousePressed(restartSolving);
    reSolveButton.attribute('disabled', '');
    buttonX += buttonWidth + 10;
    
    // Pause button
    pauseButton = createButton('Pause');
    pauseButton.position(buttonX, buttonY);
    pauseButton.size(buttonWidth, buttonHeight);
    pauseButton.mousePressed(togglePause);
    pauseButton.attribute('disabled', '');
    buttonX += buttonWidth + 10;
    
    // Reset button
    resetButton = createButton('Reset');
    resetButton.position(buttonX, buttonY);
    resetButton.size(buttonWidth, buttonHeight);
    resetButton.mousePressed(resetMaze);
    buttonX += buttonWidth + 10;
    
    // Audio checkbox - keep it subtle
    audioCheckbox = createCheckbox('Sound', config.audioEnabled);
    audioCheckbox.position(buttonX, buttonY + 5);
    audioCheckbox.changed(() => {
      config.audioEnabled = audioCheckbox.checked();
    });
    
    // Apply subtle styling
    applySubtleStyle();
  }
  
  function updateSpeedFromSlider() {
    config.speedPercentage = speedSlider.value();
    fps = config.speedPercentage;
    frameRate(fps);
  }
  
  function generateNewMaze() {
    // Reset and generate a new maze
    resetMaze();
    setupAudio();
  }
  
  function startSolving() {
    if (!config.solvingMaze && config.mazeGenerationComplete) {
      solveMaze();
    }
  }
  
  function togglePause() {
    config.pauseSolving = !config.pauseSolving;
    pauseButton.html(config.pauseSolving ? 'Resume' : 'Pause');
  }
  
  function resetMaze() {
    // Reset everything and generate a new maze
    initializeGrid();
    
    // Reset animation state
    animatingFinalPath = false;
    animationStep = 0;
  }
  
  function applySubtleStyle() {
    // Apply a subtle styling to UI elements (like Main1)
    const allElements = selectAll('*');
    
    for (let element of allElements) {
      if (element.elt) {
        // Skip canvas
        if (element.elt.tagName === 'CANVAS') continue;
        
        // Style based on element type
        if (element.elt.tagName === 'BUTTON') {
          element.style('background-color', '#001500');
          element.style('color', '#00ee00');
          element.style('border', '1px solid #00ee00');
          element.style('font-family', 'monospace');
          element.style('cursor', 'pointer');
          element.style('border-radius', '0px');  // Square buttons
        }
        else if (element.elt.tagName === 'INPUT') {
          if (element.elt.type === 'checkbox') {
            const label = element.elt.parentNode;
            if (label) {
              label.style.color = '#00ee00';
              label.style.fontFamily = 'monospace';
            }
          }
          else if (element.elt.type === 'range') {
            element.style('accent-color', '#00ee00');
          }
        }
      }
    }
  }
  
  // ===== INITIALIZATION =====
  function initializeGrid() {
    // Reset state
    config.mazeGenerationComplete = false;
    config.solvingMaze = false;
    config.pauseSolving = false;
    config.finished = false;
    stepsTaken = 0;
    
    // Create grid cells
    grid = [];
    stack = [];
    
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        let cell = new Cell(i, j);
        grid.push(cell);
      }
    }
    
    // Set starting cell for maze generation
    current = grid[0];
    
    // Set start and end points for pathfinding
    start = grid[0];
    end = grid[grid.length - 1];
    
    // Set the start and end to have no walls (easier to see)
    start.walls = [false, false, false, false];
    end.walls = [false, false, false, false];
    
    // Reset UI
    solveButton.attribute('disabled', '');
    pauseButton.attribute('disabled', '');
    reSolveButton.attribute('disabled', '');
    generateButton.removeAttribute('disabled');
    pauseButton.html('Pause');
    
    // Clear pathfinding data
    openSet = [];
    closedSet = [];
    path = [];
    finalPath = [];
    animatingFinalPath = false;
    animationStep = 0;
  }
  
  // ===== UTILITY FUNCTIONS =====
  function index(i, j) {
    if (i < 0 || j < 0 || i > cols - 1 || j > rows - 1) {
      return -1;
    }
    return i + j * cols;
  }
  
  function keyPressed() {
    if (key === ' ') {
      if (config.solvingMaze) {
        togglePause();
      } else if (config.mazeGenerationComplete) {
        startSolving();
      }
    } else if (key === 'r' || key === 'R') {
      resetMaze();
    } else if (key === 'd' || key === 'D') {
      showDebug = !showDebug;
    }
  }
  
  // ===== AUDIO FUNCTIONS =====
  function setupAudio() {
    // Create audio context
    if (!audioContext && typeof AudioContext !== 'undefined') {
      audioContext = new AudioContext();
    }
    
    // Set up oscillator
    if (!osc && p5.SoundFile) {
      osc = new p5.Oscillator('sine');
      osc.amp(0.2);
    }
  }
  
  function playNote(frequency, duration = 100, volume = 0.2, waveType = 'sine') {
    if (!config.audioEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = waveType;
    oscillator.frequency.value = frequency;
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration/1000);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
    }, duration);
  }
  
  function playNewCellSound(cell) {
    if (!config.audioEnabled) return;
    
    // Calculate frequency based on cell position (similar to Main1)
    const xPos = map(cell.i, 0, cols, 0, 1);
    const yPos = map(cell.j, 0, rows, 0, 1);
    
    // Create a pentatonic scale
    const notes = [0, 2, 4, 7, 9, 12, 14];
    const octave = floor(xPos * 3);
    const noteIndex = floor(yPos * notes.length);
    const semitones = notes[noteIndex] + (octave * 12);
    
    // Base frequency A3 (220Hz)
    const freq = 220 * Math.pow(2, semitones/12);
    
    playNote(freq, 100, 0.15);
  }
  
  function playBacktrackSound() {
    if (!config.audioEnabled) return;
    
    // Lower frequency for backtracking (similar to Main1)
    playNote(220 * 0.75, 50, 0.1);
  }
  
  function playCompletionSound() {
    if (!config.audioEnabled) return;
    
    // Play a sequence of ascending notes
    setTimeout(() => playNote(220, 200, 0.2), 0);
    setTimeout(() => playNote(277.18, 200, 0.2), 200);
    setTimeout(() => playNote(329.63, 200, 0.2), 400);
    setTimeout(() => playNote(415.30, 300, 0.2), 600);
    setTimeout(() => playNote(440, 500, 0.3), 900);
  }
  
  function playPathfindingNote(pathLength) {
    if (!config.audioEnabled) return;
    
    // Create a scale that changes based on path length
    const baseFreq = 329.63; // E4
    const pentatonic = [0, 2, 4, 7, 9]; // Pentatonic scale
    const noteIndex = pathLength % pentatonic.length;
    const semitones = pentatonic[noteIndex];
    
    const freq = baseFreq * Math.pow(2, semitones / 12);
    playNote(freq, 60, 0.1, 'sine');
  }
  
  function playVictorySound() {
    if (!config.audioEnabled) return;
    
    // Play a victorious sequence
    setTimeout(() => playNote(392.00, 200, 0.2), 0);    // G4
    setTimeout(() => playNote(440.00, 200, 0.2), 200);  // A4
    setTimeout(() => playNote(493.88, 200, 0.2), 400);  // B4
    setTimeout(() => playNote(523.25, 400, 0.3), 600);  // C5
    setTimeout(() => playNote(783.99, 600, 0.3), 1000); // G5
  }