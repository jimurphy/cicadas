let clickSamples = [];

function preload() {
  clickSamples[0] = loadSound("click1.wav");
  clickSamples[1] = loadSound("click2.wav");
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  textAlign(CENTER, CENTER);
  textSize(32);

  for (let sample of clickSamples) {
    sample.setLoop(false);
  }
}

function draw() {
  background(255);

  fill(0);
  noStroke();

  text("CLICK\n Tap to play", width / 2, height / 2);
}

function playClick() {
  userStartAudio();

  // Randomly choose click1.wav or click2.wav
  let selectedSample = random(clickSamples);

  if (selectedSample && selectedSample.isLoaded()) {
    // Subtle random pitch variation for each tap
    let clickPlaybackRate = random(0.94, 1.06);

    // Stop both samples so rapid taps do not overlap
    for (let sample of clickSamples) {
      sample.stop();
    }

    selectedSample.setLoop(false);
    selectedSample.rate(clickPlaybackRate);
    selectedSample.play();
  }
}

function touchStarted() {
  playClick();
  return false;
}

function mousePressed() {
  // Avoid triggering twice when a touch also generates a mouse event
  if (touches.length === 0) {
    playClick();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}