// Etude 5: (Re)Pairings
// Randomly assigns user to either "transient" or "stable"
// Then lazy-loads one sample from that pool

let sound;

let isLoaded = false;
let isPlaying = false;
let loadProgress = 0;

let chosenPool;
let chosenFilename;

// Set these to match how many files you have
let numTransientSamples = 1;
let numStableSamples = 1;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);

  chooseAndLoadSample();
}

function chooseAndLoadSample() {
  // Randomly choose pool
  let isStable = random() < 0.5;

  if (isStable) {
    chosenPool = "Stable";

    let index = floor(random(numStableSamples)) + 1;
    chosenFilename = "stable" + index + ".wav";
  } else {
    chosenPool = "Transient";

    let index = floor(random(numTransientSamples)) + 1;
    chosenFilename = "transient" + index + ".wav";
  }

  console.log("Chosen pool:", chosenPool);
  console.log("Chosen file:", chosenFilename);

  // Lazy-load only the chosen file
  sound = loadSound(
    chosenFilename,
    () => {
      isLoaded = true;
    },
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
  text("(Re)Pairings: " + chosenPool, width / 2, height / 2 - 30);

  if (isPlaying) {
    text("Tap to Stop", width / 2, height / 2 + 30);
  } else {
    text("Tap to Restart", width / 2, height / 2 + 30);
  }
}

function drawLoadingBar() {
  let barWidth = width * 0.6;
  let barHeight = 30;
  let x = width / 2 - barWidth / 2;
  let y = height / 2 - barHeight / 2;

  noStroke();

  // Grey background
  fill(200);
  rect(x, y, barWidth, barHeight);

  // Black progress fill
  fill(0);
  rect(x, y, barWidth * loadProgress, barHeight);

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
    sound.loop();
    isPlaying = true;
  } else {
    sound.stop(); // stop resets playback to beginning
    isPlaying = false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}