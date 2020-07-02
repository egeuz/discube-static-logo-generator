export default function DiscubeLogo(p) {
  let logo;
  var parent = document.querySelector("#mobile-logo div");
  let parentWidth;
  let parentHeight;
  let radius = 200;

  p.setup = () => {
    parentWidth = parent.offsetWidth;
    parentHeight = parent.offsetHeight;
    radius = parentWidth < 450 ? 150 : 200;
    p.createCanvas(parentWidth, parentHeight);
    logo = new Logo(p.createVector(parentWidth / 2, parentHeight / 2), radius, "noise");
  }

  p.windowResized = () => {
    parentWidth = parent.offsetWidth;
    parentHeight = parent.offsetHeight;
    radius = parentWidth < 450 ? 150 : 200;
    p.createCanvas(parentWidth, parentHeight);
    logo = new Logo(p.createVector(parentWidth / 2, parentHeight / 2), radius, "noise");
  }

  p.draw = () => {
    p.clear();
    p.noFill();
    p.stroke("#151515");
    p.strokeWeight(8);
    logo.run();
  }

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
      this.offset = p.createVector(p.random(1000), p.random(1000));
      this.range = this.hexagon.radius;
      this.noiseVelocity = p.createVector(p.random(0.001, 0.002), p.random(0.001, 0.002));

    }

    run() {
      /** SEEKING DRAG MODE TOGGLE **/
      if (this.mouseIsHovering() && p.mouseIsPressed) this.seekMode = true;
      if (this.mouseIsOutOfBounds(3) || !p.mouseIsPressed) {
        this.seekMode = false;
        this.animationMode = "noise";
      }
      /** LINE ANIMATION MODE TOGGLE **/
      if (this.mouseIsHovering()) {
        this.animationMode = "mouse";
      }
      if (this.mouseIsOutOfBounds(1.5) && !p.mouseIsPressed) this.animationMode = "noise";

      this.display();
    }

    display() {
      this.hexagon.display();

      this.lines.forEach((line, index) => {
        line.setAnchor(this.hexagon[`anchor${index + 1}`]);
        if (this.animationMode === "mouse") line.setMovingPoint(p.mouseX, p.mouseY);
        if (this.animationMode === "noise") {
          let x = (p.map(p.noise(this.offset.x), 0, 1, this.location.x - this.range, this.location.x + this.range));
          let y = (p.map(p.noise(this.offset.y), 0, 1, this.location.y - this.range, this.location.y + this.range));
          this.offset.add(this.noiseVelocity);
          line.setMovingPoint(x, y);
        }
        line.stretchLine();
      });
    }



    mouseIsHovering() {
      return p.mouseX > this.location.x - this.radius &&
        p.mouseX < this.location.x + this.radius &&
        p.mouseY > this.location.y - this.radius &&
        p.mouseY < this.location.y + this.radius;
    }

    mouseIsOutOfBounds(multiplier) {
      return p.mouseX < this.location.x - this.radius * multiplier ||
        p.mouseX > this.location.x + this.radius * multiplier ||
        p.mouseY < this.location.y - this.radius * multiplier ||
        p.mouseY > this.location.y + this.radius * multiplier;
    }
  }

  class Line {
    constructor(anchor) {
      this.segmentAmount = 100;
      this.segmentLength = 5;
      this.anchor = anchor;
      this.movingPoint = p.createVector();
      this.target = p.createVector();
      this.angles = new Array(this.segmentAmount).fill(0);
      this.locations = new Array(this.segmentAmount).fill(p.createVector(0, 0));
      this.locations[this.locations.length - 1] = anchor;
    }

    setMovingPoint(x, y) {
      this.movingPoint = p.createVector(x, y);
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
        this.angles[i] = p.atan2(dy, dx);
        this.target = p.createVector(
          x - p.cos(this.angles[i]) * this.segmentLength,
          y - p.sin(this.angles[i]) * this.segmentLength
        );
      }
    }

    positionSegments() {
      for (let i = this.locations.length - 1; i >= 1; i--) {
        this.locations[i - 1] = p.createVector(
          this.locations[i].x + p.cos(this.angles[i]) * this.segmentLength,
          this.locations[i].y + p.sin(this.angles[i]) * this.segmentLength
        );
      }
    }

    drawSegments() {
      for (let i = 0; i < this.locations.length; i++) {
        p.push();
        p.translate(this.locations[i].x, this.locations[i].y);
        p.rotate(this.angles[i]);
        p.line(0, 0, this.segmentLength, 0);
        p.pop();
      }
    }
  }

  class Hexagon {
    constructor(location, radius) {
      this.location = location;
      this.radius = radius;
      //computed properties
      this.edges = 6;
      this.angle = p.TWO_PI / 6;
      this.midpoint = p.createVector(this.radius * 2, this.radius);

      // anchor points
      this.anchor1 = p.createVector();
      this.anchor2 = p.createVector();
      this.anchor3 = p.createVector();
    }

    updateAnchors() {
      this.anchor1 = p.createVector(
        this.location.x + p.sin(0) * this.radius,
        this.location.y + p.cos(0) * this.radius
      );
      this.anchor2 = p.createVector(
        this.location.x + p.sin(this.angle * 2) * this.radius,
        this.location.y + p.cos(this.angle * 2) * this.radius
      );

      this.anchor3 = p.createVector(
        this.location.x + p.sin(this.angle * 4) * this.radius,
        this.location.y + p.cos(this.angle * 4) * this.radius
      );
    }

    display() {
      this.updateAnchors();

      p.beginShape();
      for (let i = 0; i < p.TWO_PI; i += this.angle) {
        let x = this.location.x + p.sin(i) * this.radius;
        let y = this.location.y + p.cos(i) * this.radius;
        p.vertex(x, y);
      }
      p.endShape();
    }
  }
}