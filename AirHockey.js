/*AirHockey.js
 * @author: Carlos Aguilera
 **/

/*Global Variables for setup*/
var WIDTH = 700, HEIGHT = 600, pi = Math.PI;
var NS="http://www.w3.org/2000/svg";
var ai, player, puck, svg, score;
var pPt = 0, aPt = 0;
var goal1, goal2;
var requestID;

/* ai:
 * Basic ai for reacting according to the puck. Has its own draw function.*/
ai = {
	x:null,
	y:null,
	obj:null,
	radius:50,

	update:function(){
		var idealx = puck.x - (this.radius - puck.radius)*0.5;
		this.x += (idealx - this.x)*0.5;
		this.x = Math.max(Math.min(this.x, WIDTH-this.radius), 2*this.radius + WIDTH/2);

		var idealy = puck.y - (this.radius - puck.radius)*0.01;
		this.y += (idealy - this.y)*0.5;
		this.y = Math.max(Math.min(this.y, HEIGHT-this.radius), this.radius);
	},
	draw:function(){
		var ai = document.getElementById("ai");
		ai.cx.baseVal.value = this.x;
		ai.cy.baseVal.value = this.y;
	}
};

/* Player:
 * The player object for the user.
 * x: the x coordinate of the center of the svg.
 * y: the y coordinate of the center of the svg.
 * radius: the radius of the striker.
 * draw: the function for drawing the svg.
 */
player = {
	x:null,
	y:null,
	obj:null,
	radius:50,

	draw:function(){
		var player = document.getElementById("player");
		player.cx.baseVal.value = this.x;
		player.cy.baseVal.value = this.y;
	}
};

/* puck:
 * The puck to be played with by both strikers.
 * x: the x coordinate of the center of the svg.
 * y: the y coordinate of the center of the svg.
 * velocity: the velocity of the puck.
 * radius: the radius of the puck.
 * speed: the speed of the puck.
 * start: the function of where the puck is initialized at the start of each point.
 * update: the function that updates the puck after every movement or hit.
 * draw: the function that draws the svg with the updated information.
 */

puck = {
	x:null,
	y:null,
	obj:null,
	velocity:null,
	radius:10,
	speed:6, //ideally 5

	start:function(side) {
		var rand = Math.random();
		this.x = side===1 ? player.x + player.radius: ai.x - this.radius;
		this.y = (HEIGHT - this.radius) * rand;
		var phi = 0.1*pi*(1-2*rand);
		this.velocity = {
			x:this.radius*this.speed*Math.cos(phi),
			y:this.speed*Math.sin(phi)
		}
	},
	update:function() {
		this.x += this.velocity.x;
		this.y += this.velocity.y;

		if (this.radius > this.y || this.y + this.radius > HEIGHT) {
			this.velocity.y *= -1;
		}

		var Intersect = function(x, y, r, px, py, pr) {
			return x < px + pr && y < py + r && px < x + r && py < y + r;
		};

		var pddle = this.velocity.x < 0 || this.x < WIDTH/2 ? player: ai;

		if (Intersect(pddle.x, pddle.y, pddle.radius, this.x, this.y, this.radius)) {

			this.x = (pddle === player) ? player.x + player.radius : ai.x - this.radius;

			var num = (this.y + this.radius - pddle.y) / (pddle.radius + this.radius);

			var phi = pi/4 * (2*num - 1);

			var pwr = Math.abs(phi) > 0.2 * pi ? 1.5 : 2;
			this.velocity.x = pwr*(pddle===player ? 1 : -1)*this.speed*Math.cos(phi);
			this.velocity.y = pwr*this.speed*Math.sin(phi);

		}
		if (inG1() || inG2()) {
			if (requestID)
				window.cancelAnimationFrame(requestID);
			this.start(pddle===player? 1 : -1);
		}
		else if ((0 > this.x - this.radius && (this.y - this.radius < goal1.y1 || this.y + this.radius > goal1.y2)) || 
			(this.x + this.radius > WIDTH && (this.y - this.radius < goal2.y1 || this.y + this.radius > goal2.y2))) {
			this.velocity.x *=-1;
		}
	},
	draw:function() {
		var puck = document.getElementById("puck");
		puck.cx.baseVal.value = this.x;
		puck.cy.baseVal.value = this.y;
	}
};

/* goal1 & goal 2
 * locations of where each respective goal is contained.
 * Each goal has an x and y component of the two endpoints of the goaline.
 */

goal1 = {
	x1: 0,
	y1: HEIGHT/2 - 50,
	x2: 0,
	y2: HEIGHT/2 + 110,
	strokeWidth:6
};
goal2 = {
	x1: WIDTH,
	y1: HEIGHT/2 - 50,
	x2: WIDTH,
	y2: HEIGHT/2 + 110,
	strokeWidth:6
};


function line(x1, y1, x2, y2, stroke, strokeWidth) {
	var line = document.createElementNS(NS, "line");
	line.x1.baseVal.value = x1;
	line.y1.baseVal.value = y1;
	line.x2.baseVal.value = x2;
	line.y2.baseVal.value = y2;
	line.style.stroke = stroke;
	line.style.strokeWidth = strokeWidth; 
	return line;
}

function Circle(x, y, r, fill, info, stroke){
	var circle = document.createElementNS(NS, "circle");
	circle.cx.baseVal.value = x;
	circle.cy.baseVal.value = y;
	circle.r.baseVal.value = r;
	circle.id = info;
	circle.style.stroke = stroke;
	circle.style.fill = fill;
	return circle;
}

var addSVGObject = function(svg, obj) {
	svg.appendChild(obj);
	return svg;
};

function modifyScore(player) {
	if (player) {
		aPt += 1;
		var text = document.getElementById("score");
		var newScore = document.createTextNode(pPt + "             " + aPt);
		text.replaceChild(newScore, text.childNodes[0]);
	}

	else {
		pPt += 1;
		var text = document.getElementById("score");
		var newScore = document.createTextNode(pPt + "             " + aPt);
		text.replaceChild(newScore, text.childNodes[0]);
	}
}
function inG1(){
	var p1 = 6 > puck.x - puck.radius && 0 > puck.x - puck.radius;
	var inG1 = ((puck.y - puck.radius) > goal1.y1) && ((puck.y + puck.radius) <= goal1.y2);
	var condition = p1 && inG1;
	if (condition)
		modifyScore(1);
	return condition;
}

function inG2() {
	var p2 = puck.x + puck.radius > WIDTH;
	var inG2 = puck.y - puck.radius > goal2.y1 && puck.y + puck.radius <= goal2.y2;
	var condition = p2 && inG2;
	if (condition)
		modifyScore(0);
	return condition;
}

function createText(x, y, color, T_id, TN_id) {
	var text = document.createElementNS(NS, "text");
	text.setAttributeNS(null, "id", TN_id);
	text.setAttributeNS(null, "x", x);
	text.setAttributeNS(null, "y", y);
	text.style.color = color;

	var textNode = document.createTextNode("Player  vs   Computer");
	text.appendChild(textNode);

	var text2 = document.createElementNS(NS, "text");
	text2.setAttributeNS(null, "id", T_id);
	text2.setAttributeNS(null, "x", x);
	text2.setAttributeNS(null, "y", y + 50);
	text2.setAttributeNS(null, "textLength", score.getAttribute("width"));
	text2.style.color = color;
	var textNode2 = document.createTextNode(pPt + "            " + aPt);
	text2.appendChild(textNode2);
	score = addSVGObject(score, text);
	score = addSVGObject(score, text2);
}

var SVG = function(w,h, id) {
	var svg = document.createElementNS(NS,"svg");
	svg.setAttribute("id", id);
	svg.setAttribute("height", h);
	svg.setAttribute("width", w);
	return svg;
};

function update() {
	ai.update();
	puck.update();
}

function draw() {
	player.draw();
	ai.draw();
	puck.draw();
}

function init() {
	var text = createText(30, 50, "black", "score", "msg");

	var centerLine = line(WIDTH/2, 0, WIDTH/2, HEIGHT, "red", 2);
	var centerCircle = Circle(WIDTH/2, HEIGHT/2, 100, "none","centerCircle","red");

	var g1 = line(goal1.x1, goal1.y1, goal1.x2, goal1.y2, "black", goal1.strokeWidth);
	var g2 = line(goal2.x1, goal2.y1, goal2.x2, goal2.y2, "black", goal2.strokeWidth);

	player.x = player.radius + ai.radius;
	player.y = (HEIGHT - player.radius)/2;

	var circle = Circle(player.x, player.y, player.radius, "blue", "player", "none");

	svg.addEventListener("mousemove", function(evt) {
		player.x = evt.clientX - 500 + player.radius;
		player.y = evt.clientY - 267 + player.radius;
		player.x = Math.max(Math.min(player.x, WIDTH/2 - player.radius), player.radius);
		player.y = Math.max(Math.min(player.y, HEIGHT - player.radius), 0);
	});

	ai.x = WIDTH - (player.radius + ai.radius);
	ai.y = (HEIGHT- ai.radius);

	var circle2 = Circle(ai.x, ai.y, ai.radius, "#0099ff", "ai", "none");

	puck.x = (WIDTH - puck.radius) / 2;
	puck.y = (HEIGHT - puck.radius) / 2;

	var pCircle = Circle(puck.x, puck.y, puck.radius, "lime", "puck", "none");
	
	svg = addSVGObject(svg, circle);
	svg = addSVGObject(svg, circle2);
	svg = addSVGObject(svg, pCircle);
	svg = addSVGObject(svg, g1);
	svg = addSVGObject(svg, g2);
	svg = addSVGObject(svg, centerLine);
	svg = addSVGObject(svg, centerCircle);

	puck.start();
}

function main() {
	score = SVG(200, 200, "scoreBoard");
	svg = SVG(WIDTH, HEIGHT, "mySvg");

	document.body.appendChild(score);
	document.body.appendChild(svg);

	init();
	console.log(document.body); //remove this when complete

	var game = function() {
		update();
		draw();
		if (!(Math.abs(aPt - pPt) >= 5) || aPt < 5 && pPt < 5)
			requestID = window.requestAnimationFrame(game, svg);
		else{
			window.cancelAnimationFrame(requestID);
			var value = confirm("Play Again?");
			if (value) {
				aPt = 0;
				pPt = 0;
				var text = document.getElementById("score");
				var newScore = document.createTextNode(pPt + "             " + aPt);
				text.replaceChild(newScore, text.childNodes[0]);
				requestID = window.requestAnimationFrame(game, svg);
			}
			else {
				window.close();
			}
		}
	};
	requestID = window.requestAnimationFrame(game, svg);
}

main();