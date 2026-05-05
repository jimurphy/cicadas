let permissionGranted = false;
let permissionMessage = "Tap to enable motion sensors";

let sound;
let isLoaded = false;
let loadProgress = 0;

let userEnabledPlayback = false;
let hasStarted = false;

let insideStartTime = null;
let requiredInsideTime = 750; // 0.75 seconds

let dotX, dotY;
let homeX, homeY;

let circleRadius = 50;
let sensitivity = 1000;

let circleRadiusSlider;
let sensitivitySlider;

let debug = true;

let numSamples = 2;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  textSize(18);

  homeX = width / 2;
  homeY = height / 2;
  dotX = homeX;
  dotY = homeY;

  if (debug) {
    circleRadiusSlider = createSlider(25, 150, 50, 1);
    circleRadiusSlider.position(20, 20);
    circleRadiusSlider.style("width", "160px");

    sensitivitySlider = createSlider(250, 1500, 1000, 1);
    sensitivitySlider.position(20, 60);
    sensitivitySlider.style("width", "160px");
  }

  chooseAndLoadSample();
}

function chooseAndLoadSample() {
  let index = floor(random(numSamples)) + 1;
  let filename = index + ".mp3";

  console.log("Chosen file:", filename);

  sound = loadSound(
    filename,
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

  if (debug) {
    circleRadius = circleRadiusSlider.value();
    sensitivity = sensitivitySlider.value();
    drawDebugLabels();
  }

  if (!isLoaded) {
    drawLoadingBar();
    return;
  }

  if (!permissionGranted) {
    fill(0);
    textAlign(CENTER, CENTER);
    text(permissionMessage, width / 2, height / 2);
    return;
  }

  homeX = width / 2;
  homeY = height / 2;

  dotX = homeX + rotationY * sensitivity;
  dotY = homeY + rotationX * sensitivity;

  let d = dist(dotX, dotY, homeX, homeY);
  let inside = d <= circleRadius;

  updateAudioState(inside);

  noFill();
  stroke(0);
  strokeWeight(2);
  circle(homeX, homeY, circleRadius * 2);

  stroke(0);
  strokeWeight(2);

  let playing = sound.isPlaying();

  let dotFill = 255; // default: white

  if (playing) {
    dotFill = 0; // black while playing
  } else if (userEnabledPlayback && inside && insideStartTime !== null) {
    let waitProgress = (millis() - insideStartTime) / requiredInsideTime;
    waitProgress = constrain(waitProgress, 0, 1);

    // fade from white to black during the 0.5 second wait
    dotFill = map(waitProgress, 0, 1, 255, 0);
  }

  stroke(0);
  strokeWeight(2);
  fill(dotFill);
  circle(dotX, dotY, 24);

  fill(0);
  noStroke();
  textSize(18);
  textAlign(CENTER, CENTER);

  if (userEnabledPlayback) {
    text("Tap to Pause", width / 2, height - 60);
  } else {
    text("Tap to Start", width / 2, height - 60);
  }
}

function updateAudioState(inside) {
  if (!userEnabledPlayback) {
    if (sound.isPlaying()) {
      sound.pause();
    }
    insideStartTime = null;
    return;
  }

  if (inside) {
    if (insideStartTime === null) {
      insideStartTime = millis();
    }

    let insideForLongEnough = millis() - insideStartTime >= requiredInsideTime;

    if (insideForLongEnough && !sound.isPlaying()) {
      if (!hasStarted) {
        sound.loop();
        hasStarted = true;
      } else {
        sound.play(); // resume from paused position
      }
    }
  } else {
    insideStartTime = null;

    if (sound.isPlaying()) {
      sound.pause();
    }
  }
}

async function touchEnded() {
  if (!isLoaded) return false;

  await requestSensorPermissions();

  if (permissionGranted) {
    await userStartAudio();

  userEnabledPlayback = !userEnabledPlayback;

  if (userEnabledPlayback) {
    let d = dist(dotX, dotY, homeX, homeY);
    let inside = d <= circleRadius;

    if (inside && !sound.isPlaying()) {
      if (!hasStarted) {
        sound.loop();
        hasStarted = true;
      } else {
        sound.play();
      }
    }
  } else {
    if (sound.isPlaying()) {
      sound.pause();
    }
  }

  insideStartTime = null;  }

  return false;
}

async function requestSensorPermissions() {
  try {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      let response = await DeviceOrientationEvent.requestPermission();

      if (response === "granted") {
        permissionGranted = true;
        permissionMessage = "Sensors enabled";
      } else {
        permissionGranted = false;
        permissionMessage = "Sensor permission denied";
      }
    } else {
      permissionGranted = true;
      permissionMessage = "Sensors enabled";
    }
  } catch (error) {
    permissionGranted = false;
    permissionMessage = "Sensor permission error: " + error.name;
    console.log(error.name, error.message);
  }
}

function drawLoadingBar() {
  let barWidth = width * 0.6;
  let barHeight = 30;
  let x = width / 2 - barWidth / 2;
  let y = height / 2 - barHeight / 2;

  noStroke();
  fill(200);
  rect(x, y, barWidth, barHeight);

  fill(0);
  rect(x, y, barWidth * loadProgress, barHeight);

  fill(0);
  textSize(16);
  textAlign(CENTER, CENTER);
  text("Loading...", width / 2, y - 20);
}

function drawDebugLabels() {
  fill(0);
  noStroke();
  textSize(14);
  textAlign(LEFT, CENTER);

  text("circleRadius: " + circleRadius, 200, 28);
  text("sensitivity: " + sensitivity, 200, 68);

  textAlign(CENTER, CENTER);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  homeX = width / 2;
  homeY = height / 2;
}