let chosenSound;
let isPlaying = false;
let isLoaded = false;
let loadProgress = 0;
let filename = "";

let numSamples = 26;

let playButton;

let loadError = false;
let errorMessage = "";

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);

  // Create start/stop button
  playButton = createButton("Loading...");
  playButton.position(width / 2 - 60, height / 2 + 50);
  playButton.size(120, 44);
  playButton.mousePressed(togglePlayback);
  playButton.attribute("disabled", "");

  // Choose random file
  let index = floor(random(numSamples)) + 1;

  // Robust path for GitHub Pages subfolders
  filename = new URL(`assets/${index}.mp3`, window.location.href).href;

  // Load with progress callback
  chosenSound = loadSound(
    filename,

    // Success callback
    () => {
      isLoaded = true;
      loadProgress = 1;
      playButton.html("Play");
      playButton.removeAttribute("disabled");
    },

    // Error callback
    (err) => {
      loadError = true;
      errorMessage = "Audio could not be loaded. Please refresh and try again.";
      playButton.html("Error");
      playButton.attribute("disabled", "");
      console.error("Could not load:", filename, err);
    },

    // Progress callback
    (progress) => {
      loadProgress = progress;
    }
  );
}

function draw() {
  background(255);

  if (loadError) {
    fill(0);
    textSize(18);
    text("Kihikihi", width / 2, height / 2 - 40);

    textSize(15);
    text(errorMessage, width / 2, height / 2);

    return;
  }

  if (!isLoaded) {
    fill(0);
    textSize(18);
    text("Loading...", width / 2, height / 2 - 30);

    // Loading bar
    let barWidth = width * 0.6;
    let barHeight = 16;
    let barX = width / 2 - barWidth / 2;
    let barY = height / 2;

    noFill();
    stroke(0);
    rect(barX, barY, barWidth, barHeight);

    noStroke();
    fill(0);
    rect(barX, barY, barWidth * loadProgress, barHeight);

    return;
  }

  fill(0);
  textSize(24);
  text("Kihikihi", width / 2, height / 2 - 40);

  textSize(16);
  if (isPlaying) {
    text("Audio playing", width / 2, height / 2);
  } else {
    text("Tap Play to begin", width / 2, height / 2);
  }
}

function togglePlayback() {
  if (!isLoaded || loadError) {
    return;
  }

  // Wait for the browser's audio context to unlock/resume before playback.
  userStartAudio()
    .then(() => {
      if (!isPlaying) {
        if (chosenSound.isPaused()) {
          chosenSound.play();
        } else if (!chosenSound.isPlaying()) {
          chosenSound.loop();
        }

        isPlaying = true;
        playButton.html("Pause");
      } else {
        chosenSound.pause();
        isPlaying = false;
        playButton.html("Play");
      }
    })
    .catch((err) => {
      loadError = true;
      errorMessage = "Audio could not be started. Please refresh and try again.";
      playButton.html("Error");
      playButton.attribute("disabled", "");
      console.error("Audio context could not start:", err);
    });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  if (playButton) {
    playButton.position(width / 2 - 60, height / 2 + 50);
  }
}
