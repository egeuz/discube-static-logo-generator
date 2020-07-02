/*** ELEMENTS ***/
const saveButton = document.querySelector("#save");
saveButton.addEventListener("click", saveSketch);


let logo;
let radius = 200;

let STROKE = "#151515";



/***** SKETCH RUNTIME *****/
function setup() {
  const canvas = createCanvas(500, 500);
  canvas.parent('canvas');
  logo = new Logo(createVector(250, 250), radius, "noise");
}

function windowResized() {
  const canvas = createCanvas(500, 500);
  canvas.parent('canvas');
  logo = new Logo(createVector(250, 250), radius, "noise");
}

function draw() {
  clear();
  noFill();
  stroke(STROKE);
  strokeWeight(8);
  logo.run();
}

function saveSketch() {
  let image = get();
  save(image, "discube-logo.png");
}

/***** CLASSES *****/

class Logo {
  constructor(location, radius, animationMode) {

    /*** GENERAL ***/
    this.location = location;
    this.radius = radius;
    this.animationMode = animationMode;

    /*** COMPONENTS ***/
    this.hexagon = new Hexagon(location, radius);
    this.lines = [
      new Line(this.hexagon.anchor1),
      new Line(this.hexagon.anchor2),
      new Line(this.hexagon.anchor3)
    ];

    //noise mode variables
    this.offset = createVector(random(1000), random(1000));
    this.range = this.hexagon.radius;
    this.noiseVelocity = createVector(random(0.001, 0.002), random(0.001, 0.002));

  }

  run() {
    /** SEEKING DRAG MODE TOGGLE **/
    if (this.mouseIsHovering() && mouseIsPressed) this.seekMode = true;
    if (this.mouseIsOutOfBounds(3) || !mouseIsPressed) {
      this.seekMode = false;
      this.animationMode = "noise";
    }
    /** LINE ANIMATION MODE TOGGLE **/
    if (this.mouseIsHovering()) {
      this.animationMode = "mouse";
    }
    if (this.mouseIsOutOfBounds(1.5) && !mouseIsPressed) this.animationMode = "noise";

    this.display();
  }

  display() {
    this.hexagon.display();

    this.lines.forEach((line, index) => {
      line.setAnchor(this.hexagon[`anchor${index + 1}`]);
      if (this.animationMode === "mouse") line.setMovingPoint(mouseX, mouseY);
      if (this.animationMode === "noise") {
        let x = (map(noise(this.offset.x), 0, 1, this.location.x - this.range, this.location.x + this.range));
        let y = (map(noise(this.offset.y), 0, 1, this.location.y - this.range, this.location.y + this.range));
        this.offset.add(this.noiseVelocity);
        line.setMovingPoint(x, y);
      }
      line.stretchLine();
    });
  }



  mouseIsHovering() {
    return mouseX > this.location.x - this.radius &&
      mouseX < this.location.x + this.radius &&
      mouseY > this.location.y - this.radius &&
      mouseY < this.location.y + this.radius;
  }

  mouseIsOutOfBounds(multiplier) {
    return mouseX < this.location.x - this.radius * multiplier ||
      mouseX > this.location.x + this.radius * multiplier ||
      mouseY < this.location.y - this.radius * multiplier ||
      mouseY > this.location.y + this.radius * multiplier;
  }
}

class Line {
  constructor(anchor) {
    this.segmentAmount = 100;
    this.segmentLength = 5;
    this.anchor = anchor;
    this.movingPoint = createVector();
    this.target = createVector();
    this.angles = new Array(this.segmentAmount).fill(0);
    this.locations = new Array(this.segmentAmount).fill(createVector(0, 0));
    this.locations[this.locations.length - 1] = anchor;
  }

  setMovingPoint(x, y) {
    this.movingPoint = createVector(x, y);
  }

  setAnchor(anchor) {
    this.anchor = anchor;
    this.locations[this.locations.length - 1] = anchor;
  }

  stretchLine() {
    this.stretch();

    this.reachSegments();
    this.positionSegments();
    this.drawSegments();
  }

  //HELPER METHODS
  stretch() {
    let dx = (this.anchor.x >= this.movingPoint.x) ? this.anchor.x - this.movingPoint.x : this.movingPoint.x - this.anchor.x;
    let dy = (this.anchor.y >= this.movingPoint.y) ? this.anchor.y - this.movingPoint.y : this.movingPoint.y - this.anchor.y;
    let hypotenuse = Math.sqrt((dx * dx) + (dy * dy));
    this.segmentLength = hypotenuse / this.segmentAmount + 0.05;
  }

  reachSegments() {
    for (let i = 0; i < this.locations.length; i++) {
      const x = (i === 0) ? this.movingPoint.x : this.target.x;
      const y = (i === 0) ? this.movingPoint.y : this.target.y;
      const dx = x - this.locations[i].x;
      const dy = y - this.locations[i].y;
      this.angles[i] = atan2(dy, dx);
      this.target = createVector(
        x - cos(this.angles[i]) * this.segmentLength,
        y - sin(this.angles[i]) * this.segmentLength
      );
    }
  }

  positionSegments() {
    for (let i = this.locations.length - 1; i >= 1; i--) {
      this.locations[i - 1] = createVector(
        this.locations[i].x + cos(this.angles[i]) * this.segmentLength,
        this.locations[i].y + sin(this.angles[i]) * this.segmentLength
      );
    }
  }

  drawSegments() {
    for (let i = 0; i < this.locations.length; i++) {
      push();
      translate(this.locations[i].x, this.locations[i].y);
      rotate(this.angles[i]);
      line(0, 0, this.segmentLength, 0);
      pop();
    }
  }
}

class Hexagon {
  constructor(location, radius) {
    this.location = location;
    this.radius = radius;
    //computed properties
    this.edges = 6;
    this.angle = TWO_PI / 6;
    this.midpoint = createVector(this.radius * 2, this.radius);

    // anchor points
    this.anchor1 = createVector();
    this.anchor2 = createVector();
    this.anchor3 = createVector();
  }

  updateAnchors() {
    this.anchor1 = createVector(
      this.location.x + sin(0) * this.radius,
      this.location.y + cos(0) * this.radius
    );
    this.anchor2 = createVector(
      this.location.x + sin(this.angle * 2) * this.radius,
      this.location.y + cos(this.angle * 2) * this.radius
    );

    this.anchor3 = createVector(
      this.location.x + sin(this.angle * 4) * this.radius,
      this.location.y + cos(this.angle * 4) * this.radius
    );
  }

  display() {
    this.updateAnchors();

    beginShape();
    for (let i = 0; i < TWO_PI; i += this.angle) {
      let x = this.location.x + sin(i) * this.radius;
      let y = this.location.y + cos(i) * this.radius;
      vertex(x, y);
    }
    endShape();
  }
}
