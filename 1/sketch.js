let chosenSound;
let isPlaying = false;
let isLoaded = false;
let loadProgress = 0; // 0 → 1
let filename = "";

let numSamples = 26;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);

  // Choose random file
  let index = floor(random(numSamples)) + 1;

  filename = new URL(`assets/${index}.mp3`, window.location.href).href;
  console.log("Trying to load:", filename);

  chosenSound = loadSound(
    filename,
  
    // success
    () => {
      isLoaded = true;
      loadProgress = 1;
    },
  
    // error
    (err) => {
      console.error("Could not load:", filename, err);
    },
  
    // progress
    (progress) => {
      loadProgress = progress;
    }
  );
}

function draw() {
  background(255);

  if (!isLoaded) {
    drawLoadingBar();
    return;
  }

  textSize(20);
  text("Kihikihi", width / 2, height / 2 - 30);
  textSize(12);
  if (isPlaying) {
    text("Tap to Pause", width / 2, height / 2 + 30);
  } else {
    text("Tap to Play", width / 2, height / 2 + 30);
  }
}

function drawLoadingBar() {
  let barWidth = width * 0.6;
  let barHeight = 30;
  let x = width / 2 - barWidth / 2;
  let y = height / 2 - barHeight / 2;

  // Background (light grey)
  noStroke();
  fill(200);
  rect(x, y, barWidth, barHeight);

  // Progress (black fill)
  fill(0);
  rect(x, y, barWidth * loadProgress, barHeight);

  // Optional text
  fill(0);
  textSize(16);
  text("Loading...", width / 2, y - 20);
}

function mousePressed() {
  togglePlayback();
}

function touchStarted() {
  togglePlayback();
  return false;
}

function togglePlayback() {
  if (!isLoaded) return;

  userStartAudio();

  if (!isPlaying) {
    if (chosenSound.isPaused()) {
      chosenSound.play();
    } else if (!chosenSound.isPlaying()) {
      chosenSound.loop();
    }
    isPlaying = true;
  } else {
    chosenSound.pause();
    isPlaying = false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
