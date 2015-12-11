// TODO: completely localize
var $container, $canvas, canvas, cxt;

var tileSize = 30;
if((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i))) {
  // if user is playing from an iphone. The phone tends to zoom out. This is one dirty fix. Maybe there is another way?
	tileSize = 60;
	lineWidth = 5;
}

var tileTableWidth, tileTableHeight;


function Renderer () {
  $container = $('<div id="container"></div>');
  $container.css('position', 'fixed');
  $container.css('top', '0px');
  $container.css('left', '0px');
  $container.css('right', '0px');
  $container.css('bottom', '0px');

  $canvas = $('<canvas></canvas>')
  $canvas.css('position', 'absolute');
  $canvas.css('width', '100%');
  $canvas.css('height', '100%');
  $canvas.css('border', 'none');


  $('body').append($container);
  $('#container').append($canvas);


  canvas = $canvas.get()[0];
  canvas.width = $canvas.width();
  canvas.height = $canvas.height();
  cxt = canvas.getContext("2d");


  tileTableWidth = Math.floor(canvas.width / tileSize);
  tileTableHeight = Math.floor(canvas.height / tileSize);


  this.canvas = canvas;
  this.ctx = cxt;   // WARNING: I'm changing the name of the context (cxt to ctx)
  this.tileTableWidth = tileTableWidth;
  this.tileTableHeight = tileTableHeight;
}


/**
 * Put renderer state back to background only, no robots
 * Save background as an image the first time to avoid redrawing it every time, saving a lot of CPU
 */
Renderer.prototype.backToBackground = function (tileTable) {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height );

  if (!this.$backgroundImage) {
    for (var i = 0; i < this.tileTableWidth; i++) {
      for (var j = 0; j < this.tileTableHeight; j++) {
        tileTable[i][j].draw();
      }
    }

    this.$backgroundImage = $('<img src="' + canvas.toDataURL("image/png") + '">');
    this.$backgroundImage.css('position', 'fixed');
    this.$backgroundImage.css('top', '0px');
    this.$backgroundImage.css('left', '0px');
    this.$backgroundImage.css('width', canvas.width + 'px');
    this.$backgroundImage.css('height', canvas.height + 'px');

    $('body').prepend(this.$backgroundImage);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height );
  }
};


/**
 * Draw a robot, can be the current player, opponents or ennemies
 * Removed mention of cameraX and cameraY, unused for now
 */
Renderer.prototype.drawRobot = function (robot) {
  this.ctx.beginPath();
  this.ctx.arc(robot.x, robot.y, robot.radius, 0, 2 * Math.PI);
  this.ctx.fillStyle = robot.color;
  this.ctx.closePath();
  this.ctx.fill();

};




var renderer = new Renderer();
