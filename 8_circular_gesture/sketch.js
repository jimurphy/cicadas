let clickSample;
let raspSample;

const TWO_PI_VAL = Math.PI * 2;

let rawAngularVelocity = 0;
let smoothedAngularVelocity = 0;

let pointHistory = [];

let isDragging = false;
let hasStartedAudio = false;

let raspPlaybackActive = false;

// actual playback rate currently applied to the sample
let currentPlaybackRate = 1.0;

// desired playback rate
let targetPlaybackRate = 1.0;

// --- tunable parameters ---
let minRadius = 60;
let historyLength = 100;
let circularTolerance = 0.9;
let minAngleSweep = Math.PI / 4;

// Higher = more responsive / jittery
let smoothingAmount = 0.25;

let minPlaybackRate = 0.4;
let maxPlaybackRate = 1.6;

// Higher = faster playback-rate changes
let playbackRampAmount = 0.25;

// circular speed threshold
let minRPM = 1.0;

// fade time when user releases
let fadeOutTime = 0.5;

// tap-to-arm behaviour
let tapArmTime = 1000;
let lastTapTime = -99999;
let tapArmed = false;

// tap detection
let inputStartX = 0;
let inputStartY = 0;
let inputStartTime = 0;
let hasMovedTooMuchForTap = false;

let maxTapDuration = 250;
let maxTapMovement = 15;

// canvas centre
let cx;
let cy;

function preload() {
  clickSample = loadSound("click1.wav");

  let raspFilename =
    Math.random() < 0.5 ? "rasp1.wav" : "rasp2.wav";

  raspSample = loadSound(raspFilename);
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  cx = width / 2;
  cy = height / 2;

  if (raspSample) {
    raspSample.setLoop(false);
    raspSample.setVolume(0);
  }

  if (clickSample) {
    clickSample.setLoop(false);
    clickSample.setVolume(1);
  }
}

function draw() {
  background(255);

  updateTapArmedState();

  if (tapArmed || raspPlaybackActive) {
    drawTail();
  }

  drawGuide();

  if (shouldShowInstructions()) {
    drawInstructions();
  }

  if (isDragging) {
    updateCircularGesture();
  } else {
    smoothedAngularVelocity *= 0.9;
  }

  updatePlayback();
}

function drawGuide() {
  stroke(0);
  strokeWeight(2);

  if (tapArmed) {
    fill(0);
  } else {
    fill(255);
  }

  circle(cx, cy, minRadius * 2);

  fill(0);
  noStroke();
  circle(cx, cy, 6);
}

function drawTail() {
  if (pointHistory.length < 2) {
    return;
  }

  noFill();
  strokeWeight(4);

  for (let i = 1; i < pointHistory.length; i++) {
    let p1 = pointHistory[i - 1];
    let p2 = pointHistory[i];

    let alpha = map(i, 1, pointHistory.length - 1, 20, 220);

    stroke(0, alpha);
    line(p1.x, p1.y, p2.x, p2.y);
  }

  let latest = pointHistory[pointHistory.length - 1];

  noStroke();
  fill(0);
  circle(latest.x, latest.y, 12);
}

function updateCircularGesture() {
  let x = getInputX();
  let y = getInputY();

  let dx = x - cx;
  let dy = y - cy;
  let radius = sqrt(dx * dx + dy * dy);

  if (radius < minRadius) {
    return;
  }

  let angle = atan2(dy, dx);
  let now = millis();

  pointHistory.push({
    x: x,
    y: y,
    angle: angle,
    time: now,
    radius: radius
  });

  while (pointHistory.length > historyLength) {
    pointHistory.shift();
  }

  if (pointHistory.length < 3) {
    return;
  }

  let latest = pointHistory[pointHistory.length - 1];
  let previous = pointHistory[pointHistory.length - 2];

  let deltaAngle = angleDifference(latest.angle, previous.angle);
  let deltaTime = (latest.time - previous.time) / 1000.0;

  if (deltaTime <= 0) {
    return;
  }

  rawAngularVelocity = deltaAngle / deltaTime;

  smoothedAngularVelocity = lerp(
    smoothedAngularVelocity,
    rawAngularVelocity,
    smoothingAmount
  );
}

function updatePlayback() {
  if (!raspSample || !raspSample.isLoaded()) {
    return;
  }

  let now = millis();

  let rpm = abs(angularVelocityToRPM(smoothedAngularVelocity));
  let circularity = getCircularity();
  let angleSweep = getAngleSweep();

  let gestureIsValid =
    isDragging &&
    rpm >= minRPM &&
    circularity >= circularTolerance &&
    angleSweep >= minAngleSweep;

  // A valid gesture is allowed to START rasp playback only if tapArmed is true
  if (gestureIsValid && tapArmed && !raspSample.isPlaying()) {
    let revsPerSecond = rpm / 60.0;

    targetPlaybackRate = constrain(
      revsPerSecond,
      minPlaybackRate,
      maxPlaybackRate
    );

    currentPlaybackRate = targetPlaybackRate;
    raspSample.rate(currentPlaybackRate);

    raspSample.stop();
    raspSample.setLoop(false);
    raspSample.play();
    raspSample.setVolume(1.0, 0.05);

    raspPlaybackActive = true;
    tapArmed = false;
  }

  // Once rasp playback has started, continue updating the rate
  // while the user is still dragging in a valid circular motion.
  if (raspPlaybackActive && raspSample.isPlaying() && gestureIsValid) {
    let revsPerSecond = rpm / 60.0;

    targetPlaybackRate = constrain(
      revsPerSecond,
      minPlaybackRate,
      maxPlaybackRate
    );

    currentPlaybackRate = lerp(
      currentPlaybackRate,
      targetPlaybackRate,
      playbackRampAmount
    );

    raspSample.rate(currentPlaybackRate);
  }

  // If the sample naturally finishes, reset this flag
  if (raspPlaybackActive && !raspSample.isPlaying()) {
    raspPlaybackActive = false;
  }
}

function startInteraction() {
  userStartAudio();

  hasStartedAudio = true;
  isDragging = true;

  pointHistory = [];
  rawAngularVelocity = 0;
  smoothedAngularVelocity = 0;

  inputStartX = getInputX();
  inputStartY = getInputY();
  inputStartTime = millis();
  hasMovedTooMuchForTap = false;
}

function continueInteraction() {
  let x = getInputX();
  let y = getInputY();

  let d = dist(x, y, inputStartX, inputStartY);

  if (d > maxTapMovement) {
    hasMovedTooMuchForTap = true;
  }
}

function endInteraction() {
  let now = millis();
  let inputDuration = now - inputStartTime;

  let x = getInputX();
  let y = getInputY();
  let inputMovement = dist(x, y, inputStartX, inputStartY);

  let isTap =
    inputDuration <= maxTapDuration &&
    inputMovement <= maxTapMovement &&
    !hasMovedTooMuchForTap;

  if (isTap) {
    console.log("tap detected");

    // Play click1.wav once on every detected tap,
    // with a subtly randomised pitch
    if (clickSample && clickSample.isLoaded()) {
      let clickPlaybackRate = random(0.94, 1.06);
    
      clickSample.stop();
      clickSample.setLoop(false);
      clickSample.rate(clickPlaybackRate);
      clickSample.play();
    }

    lastTapTime = now;
    tapArmed = true;
  } else {
    if (raspSample && raspSample.isLoaded()) {
      // Fade volume down, rather than ramping playback speed down
      raspSample.setVolume(0, fadeOutTime);
    }

    raspPlaybackActive = false;
  }

  isDragging = false;
  pointHistory = [];
}

// --- Input handling: touch and mouse ---

function touchStarted() {
  startInteraction();
  return false;
}

function touchMoved() {
  continueInteraction();
  return false;
}

function touchEnded() {
  endInteraction();
  return false;
}

function mousePressed() {
  startInteraction();
}

function mouseDragged() {
  continueInteraction();
}

function mouseReleased() {
  endInteraction();
}

// --- Helpers ---

function getInputX() {
  if (touches.length > 0) {
    return touches[0].x;
  }

  return mouseX;
}

function getInputY() {
  if (touches.length > 0) {
    return touches[0].y;
  }

  return mouseY;
}

function angleDifference(a, b) {
  let diff = a - b;

  while (diff > Math.PI) {
    diff -= TWO_PI_VAL;
  }

  while (diff < -Math.PI) {
    diff += TWO_PI_VAL;
  }

  return diff;
}

function angularVelocityToRPM(angularVelocity) {
  let revsPerSecond = angularVelocity / TWO_PI_VAL;
  return revsPerSecond * 60.0;
}

function getCircularity() {
  if (pointHistory.length < 5) {
    return 0;
  }

  let meanRadius = 0;

  for (let p of pointHistory) {
    meanRadius += p.radius;
  }

  meanRadius /= pointHistory.length;

  let deviation = 0;

  for (let p of pointHistory) {
    deviation += abs(p.radius - meanRadius);
  }

  deviation /= pointHistory.length;

  let circularity = 1.0 - deviation / meanRadius;

  return constrain(circularity, 0, 1);
}

function getAngleSweep() {
  if (pointHistory.length < 2) {
    return 0;
  }

  let totalSweep = 0;

  for (let i = 1; i < pointHistory.length; i++) {
    totalSweep += abs(
      angleDifference(pointHistory[i].angle, pointHistory[i - 1].angle)
    );
  }

  return totalSweep;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  cx = width / 2;
  cy = height / 2;
}

function updateTapArmedState() {
  let now = millis();

  if (tapArmed && now - lastTapTime > tapArmTime) {
    tapArmed = false;
  }
}

function shouldShowInstructions() {
  return !tapArmed && !raspPlaybackActive && !isDragging;
}

function drawInstructions() {
  fill(0);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(32);

  text(
    "Tap screen to trigger a click.\nThen drag in a circle to create a rasp.",
    width / 2,
    height / 3
  );
}
