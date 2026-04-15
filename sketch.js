let sample;
let debugMode = false;

const PI_VAL = Math.PI;
const TWO_PI_VAL = Math.PI * 2;

let rawAngularVelocity = 0;
let smoothedAngularVelocity = 0;

let pointHistory = [];

let hasDetectedCircularMotion = false;

// actual playback rate currently applied to the sample
let currentPlaybackRate = 0.0;

// desired playback rate
let targetPlaybackRate = 0.0;

// --- tunable parameters ---
let minRadius = 60;                  // ignore touches inside this radius
let historyLength = 100;             // number of recent samples to analyse
let circularTolerance = 0.9;         // lower = stricter, based on radius std/mean
let minAngleSweep = 3.14159 * 0.25;  // require at least this much recent turning
let smoothingAmount = 0.2;           // 0..1 for angular velocity smoothing
let minPlaybackRate = 0.5;           // gesture-controlled minimum
let maxPlaybackRate = 1.5;           // gesture-controlled maximum
let playbackRampAmount = 0.08;       // 0..1, higher = faster playback-rate response
let stopThreshold = 0.02;            // when below this, stop playback completely
// --------------------------

function preload() {
  sample = loadSound("https://raw.githubusercontent.com/jimurphy/cicadas/main/1.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textSize(22);
  textAlign(LEFT, TOP);
}

function draw() {
  background(240);

  let cx = width / 2;
  let cy = height / 2;

  fill(0);
  noStroke();
  circle(cx, cy, 10);

  noFill();
  stroke(180);
  circle(cx, cy, minRadius * 2);

  let x, y;
  let active = false;

  if (touches.length > 0) {
    x = touches[0].x;
    y = touches[0].y;
    active = true;
  } else if (mouseIsPressed) {
    x = mouseX;
    y = mouseY;
    active = true;
  }

  let circularNow = false;

  if (active) {
    let radius = dist(x, y, cx, cy);

    noStroke();
    fill(255, 0, 0);
    circle(x, y, 20);

    if (radius >= minRadius) {
      let angle = Math.atan2(y - cy, x - cx);
      let now = millis() / 1000.0;

      pointHistory.push({
        x: x,
        y: y,
        r: radius,
        a: angle,
        t: now
      });

      if (pointHistory.length > historyLength) {
        pointHistory.shift();
      }

      circularNow = isRoughlyCircular(pointHistory);

      if (circularNow) {
        rawAngularVelocity = getAverageAngularVelocity(pointHistory);

        smoothedAngularVelocity = lerp(
          smoothedAngularVelocity,
          rawAngularVelocity,
          smoothingAmount
        );

        let revPerSec = Math.abs(smoothedAngularVelocity) / TWO_PI_VAL;

        // 1 rev/s = 1x playback rate
        targetPlaybackRate = constrain(revPerSec, minPlaybackRate, maxPlaybackRate);

        hasDetectedCircularMotion = true;
      } else {
        rawAngularVelocity = 0;
        smoothedAngularVelocity = lerp(smoothedAngularVelocity, 0, smoothingAmount);
      }
    } else {
      pointHistory = [];
      rawAngularVelocity = 0;
      smoothedAngularVelocity = lerp(smoothedAngularVelocity, 0, smoothingAmount);
    }
  } else {
    // no touch: begin ramp-down toward zero
    pointHistory = [];
    rawAngularVelocity = 0;
    smoothedAngularVelocity = lerp(smoothedAngularVelocity, 0, smoothingAmount);
    targetPlaybackRate = 0;
  }

  updatePlayback();

  drawTrail();

  let displayedSpeed = Math.abs(smoothedAngularVelocity);
  let displayedRevPerSec = displayedSpeed / TWO_PI_VAL;

  noStroke();
  fill(0);

  if(debugMode == true){
    text("Angular speed: " + nf(displayedSpeed, 1, 2) + " rad/s", 20, 20);
    text("Angular speed: " + nf(displayedRevPerSec, 1, 2) + " rev/s", 20, 50);
    text("Circular motion: " + (circularNow ? "YES" : "NO"), 20, 80);
    text("Detected ever: " + (hasDetectedCircularMotion ? "YES" : "NO"), 20, 110);
    text("Target rate: " + nf(targetPlaybackRate, 1, 2) + " x", 20, 140);
    text("Current rate: " + nf(currentPlaybackRate, 1, 2) + " x", 20, 170);
  }
  if (!hasDetectedCircularMotion) {
    text("Make a circular gesture to start audio", 20, 210);
  }
}

function updatePlayback() {
  if (!hasDetectedCircularMotion) return;

  currentPlaybackRate = lerp(currentPlaybackRate, targetPlaybackRate, playbackRampAmount);

  if (targetPlaybackRate > stopThreshold && !sample.isPlaying()) {
    sample.loop();
  }

  if (sample.isPlaying()) {
    if (currentPlaybackRate > stopThreshold) {
      sample.rate(currentPlaybackRate);
    } else {
      sample.stop();
      currentPlaybackRate = 0;
    }
  }
}

function drawTrail() {
  if (pointHistory.length < 2) return;

  noFill();
  stroke(50, 100, 200);
  strokeWeight(3);
  beginShape();
  for (let p of pointHistory) {
    vertex(p.x, p.y);
  }
  endShape();
}

function isRoughlyCircular(history) {
  if (history.length < 8) return false;

  let radii = history.map(p => p.r);
  let meanR = mean(radii);
  let stdR = stddev(radii);

  if (meanR <= 0) return false;

  let coeffVar = stdR / meanR;
  let radiusConsistent = coeffVar < circularTolerance;

  let totalSweep = 0;
  for (let i = 1; i < history.length; i++) {
    let da = history[i].a - history[i - 1].a;
    if (da > PI_VAL) da -= TWO_PI_VAL;
    if (da < -PI_VAL) da += TWO_PI_VAL;
    totalSweep += Math.abs(da);
  }

  let enoughTurning = totalSweep >= minAngleSweep;

  return radiusConsistent && enoughTurning;
}

function getAverageAngularVelocity(history) {
  if (history.length < 2) return 0;

  let totalAngle = 0;

  for (let i = 1; i < history.length; i++) {
    let da = history[i].a - history[i - 1].a;

    if (da > PI_VAL) da -= TWO_PI_VAL;
    if (da < -PI_VAL) da += TWO_PI_VAL;

    totalAngle += da;
  }

  let totalTime = history[history.length - 1].t - history[0].t;

  if (totalTime <= 0) return 0;

  return totalAngle / totalTime;
}

function mean(arr) {
  let sum = 0;
  for (let v of arr) sum += v;
  return sum / arr.length;
}

function stddev(arr) {
  let m = mean(arr);
  let sumSq = 0;
  for (let v of arr) {
    let d = v - m;
    sumSq += d * d;
  }
  return Math.sqrt(sumSq / arr.length);
}

function touchStarted() {
  userStartAudio();
  return false;
}

function mousePressed() {
  userStartAudio();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
