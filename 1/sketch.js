let chosenSound;
let isPlaying = false;
let isLoaded = false;
let loadProgress = 0; // 0 → 1

let numSamples = 3;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);

  // Choose random file
  let index = floor(random(numSamples)) + 1;
  let filename = index + ".mp3";

  // Load with progress callback
  chosenSound = loadSound(
    filename,
    () => {
      isLoaded = true;
    },
    (progress) => {
      loadProgress = progress; // value between 0 and 1
      loadProgress = lerp(loadProgress, progress, 0.2);
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
  text("Étude 1: Loudness", width / 2, height / 2 - 30);

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