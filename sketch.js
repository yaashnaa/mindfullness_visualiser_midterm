let faceMesh;
let video;
let faces = [];
let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };
let angle;
let gen = 80; // Starting value for the flower animation
let visualiser;
let visualiserContainer;
let visualiserVisible = false;
let expanding = true;
let countdown = 5;
let timer = 0;
let breathingState = "Breathe in"; // Start with "Breathe in"
let opacity = 255;
// Threshold for detecting blink (adjust if needed)
let blinkThreshold = 3;

function preload() {
  // Load the faceMesh model
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Satisfy");

  visualiserContainer = document.getElementById("visualiser");

  // Ensure element exists
  if (visualiserContainer) {
    console.log("Visualizer element found"); // Log for debugging
  } else {
    console.error("Visualizer element not found");
  }

  // Choose RGB color mode to match your original code
  colorMode(RGB);

  // Create the webcam video and hide it
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // Start detecting faces from the webcam video
  faceMesh.detectStart(video, gotFaces);

  let canvas = createCanvas(windowWidth, windowHeight); // Create a p5.js canvas
  canvas.parent(visualiserContainer); // Attach the canvas to the visualizer div

  // Set the initial visualizer
  visualiser = new Visualiser(204, 232, 204);

  // Hide the canvas initially until the "Ready?" text fades in
  visualiserContainer.style.display = "none";
  //   setTimeout(() => {
  //     visualiserContainer.style.display = "block";
  //     console.log('displayed');
  //   }, 12000);
}

function draw() {
  clear();
  if (visualiserContainer.style.display === "block") {
    visualiser.display(); // Draw the visualizer
  }
  timer += deltaTime;

  // Every 1000 milliseconds (1 second), update the countdown
  if (timer >= 900) {
    timer = 0; // Reset the timer
    countdown--; // Decrement the countdown

    if (countdown < 0) {
      // Switch between expanding and contracting
      expanding = !expanding;
      countdown = 5; // Reset countdown to 5 seconds

      // Update breathing state text
      breathingState = expanding ? "Breathe in" : "Breathe out";
      opacity = 255; // Reset opacity for the new phase
    }
  }

  // Decrease opacity for fade effect
  opacity -= 5;
  showVisualiser();
  // Draw breathing state and countdown text
  drawTextWithEffects(breathingState, width / 2, height / 6, opacity, 64);
  drawTextWithEffects(countdown, width / 2, height / 4.5, opacity, 48);

  checkFacialPoints();
}
function showVisualiser() {
  const visualiserEl = document.getElementById("visualiser");
  setTimeout(() => {
    if (visualiserEl) {
      visualiserEl.style.display = "block"; // Make the div visible
      setTimeout(() => {
        visualiserEl.style.opacity = 1; // Fade it in after it's visible
      }, 2); // Small delay to allow the opacity change to kick in afte
    } else {
      console.log("not found");
    }
  }, 12000);
}

function checkFacialPoints() {
  if (faces.length > 0) {
    let face = faces[0];
    let leftEyebrow = face.keypoints[105];
    let leftEye = face.keypoints[159];
    let lowerLeftEyelid = face.keypoints[145];
    let upperLip = face.keypoints[13]; // Top of the upper lip
    let lowerLip = face.keypoints[14]; // Bottom of the lower lip
    // Retrieve keypoints for the nose and mouth
    let noseBridge = face.keypoints[6]; // Top of the nose bridge
    let leftNostril = face.keypoints[98]; // Left nostril
    let rightNostril = face.keypoints[327]; // Right nostril
    let eyeToEyebrowDist = dist(
      leftEyebrow.x,
      leftEyebrow.y,
      leftEye.x,
      leftEye.y
    );
    let eyeOpenDist = dist(
      leftEye.x,
      leftEye.y,
      lowerLeftEyelid.x,
      lowerLeftEyelid.y
    ); // Eye open distance
    let leftMouthCorner = face.keypoints[61]; // Left corner of the mouth
    let rightMouthCorner = face.keypoints[291]; // Right corner of the mouth
    let mouthOpenDist = dist(upperLip.x, upperLip.y, lowerLip.x, lowerLip.y);

    // Calculate distances for nose scrunch detection
    let noseScrunchDist = dist(
      noseBridge.x,
      noseBridge.y,
      (leftNostril.x + rightNostril.x) / 2,
      (leftNostril.y + rightNostril.y) / 2
    );

    // Calculate horizontal distance between mouth corners (mouth movement sideways)
    let mouthHorizontalDist = dist(
      leftMouthCorner.x,
      leftMouthCorner.y,
      rightMouthCorner.x,
      rightMouthCorner.y
    );

    // Calculate vertical distance between upper and lower lips (mouth movement up or down)
    let mouthVerticalDist = dist(
      upperLip.x,
      upperLip.y,
      lowerLip.x,
      lowerLip.y
    );
    if (eyeOpenDist < blinkThreshold) {
      console.log("blink detected - ignoring");
      visualiser.setColor(204, 232, 204);
      // return; // Skip frame when a blink is detected
    }

    // Facial expression handling
    if (eyeToEyebrowDist < 20 && eyeToEyebrowDist > 10) {
      console.log("frowning");
      visualiser.setColor(204, 102, 102); // Set jagged colors
    } else if (noseScrunchDist < 20) {
      //   console.log("Nose scrunched");
      visualiser.setColor(255, 150, 150); // Set specific colors for nose scrunch
    } else if (mouthHorizontalDist < 40) {
      //   console.log("Mouth moved sideways");
      visualiser.setColor(204, 102, 102); // Set specific colors for sideways mouth movement
    } else if (eyeToEyebrowDist > 40) {
      console.log("raised eyebrows - stressed/surprised");
      visualiser.setColor(204, 102, 102); // Set jagged colors
    } else if (mouthOpenDist < 10) {
      console.log("smooth - relaxed");
      visualiser.setColor(204, 232, 204); // Set smooth colors
    } else if (mouthOpenDist > 15) {
      console.log("mouth open - jagged");
      visualiser.setColor(204, 102, 102); // Set jagged colors
    } else if (mouthVerticalDist > 15) {
      //   console.log("Mouth moved up or down");
      visualiser.setColor(204, 102, 102); // Set specific colors for vertical mouth movement
    } else {
      console.log("neutral");
      visualiser.setColor(204, 232, 204); // Set neutral/smooth colors
    }
  }
}
function drawTextWithEffects(textContent, x, y, opacity, size) {
  fill(255, 255, 255, opacity); // White text with fading opacity
  textAlign(CENTER, CENTER);
  textSize(size);
  text(textContent, x, y);
}

class Visualiser {
  constructor(r, g, b) {
    this.gen = 80;
    this.r = r;
    this.g = g;
    this.b = b;
    this.x = width / 2;
    this.y = height / 2;
  }

  // Method to adjust `gen` based on `mouseX` value
  // setGen(mouseX) {
  //   // Map the `mouseX` value to a reasonable range for `gen`
  //   this.gen = map(mouseX, 0, width, 10, 100);
  // }

  setColor(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  display() {
    // let scaleFactor = map(mouseX, 0, width, 0.5, 1.5);
    this.drawBackground();
    this.applyGlowEffect();

    stroke(this.r, this.g, this.b);
    strokeWeight(1);
    fill(this.r, this.g, this.b, 50); // Soft fill for the curves

    angle = sin(this.gen * 44) * 44;

    push();
    translate(this.x, this.y);
    rotate(this.gen * 4);
    // scale(scaleFactor);
    for (var i = 0; i < 144; i++) {
      rotate((6 / this.gen) * 54);
      curve(i, i, 0, angle + i, 133, angle - i, i + 133, i);
    }
    pop();

    this.gen += 0.000365; // Increment for noticeable animation
  }
  applyGlowEffect() {
    // Rotate and draw glowing circles
    push();
    translate(this.x, this.y);
    rotate(this.gen * 2); // Apply the same rotation as the flower

    for (let glow = 0; glow < 10; glow++) {
      stroke(this.r, this.g, this.b, 255 - glow * 25);
      strokeWeight(2);
      noFill();
      ellipse(0, 0, glow * this.gen * 0.5); // Draw ellipses around the center
    }

    pop();
  }

  drawBackground() {
    // Create a gradient background
    for (let y = 0; y < height; y++) {
      let inter = map(y, 0, height, 0, 1);
      let c = lerpColor(color(30, 30, 60), color(10, 10, 30), inter);
      stroke(c);
      line(0, y, width, y);
    }
  }
}

// Callback function when faceMesh outputs data
function gotFaces(results) {
  faces = results;
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  visualiser.x = width / 2;
  visualiser.y = height / 2;
}
