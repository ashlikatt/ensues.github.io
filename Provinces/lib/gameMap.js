const mapSize = 500;
var xFOV = 11;
var yFOV = 7;
var scrollAmnt = 1;
var gameMap = [];
var currentX = 250, currentY = 250;
var gameCanvas;
var board;

let dragging = false;
let dragLastX;
let dragLastY;

function gameMapPreload() {
	gameCanvas = document.getElementById("gameCanvas");
	board = gameCanvas.getContext('2d');
	fitCanvas();
	
	gameCanvas.addEventListener('wheel', e => {
		const zoomValue = Math.sign(e.deltaY) * 0.1;
		changeZoom(zoomValue);
	});
	
	gameCanvas.addEventListener('click', clickMap)

	gameCanvas.addEventListener('mousedown', e => {
		if (e.button!=0) {
			dragging = true;
			dragLastX = e.offsetX;
			dragLastY = e.offsetY;
		}
	});
	gameCanvas.addEventListener('mousemove', e => {
		if (dragging) {
			currentX += (dragLastX-e.offsetX)*scrollAmnt/50;
			currentY += (dragLastY-e.offsetY)*scrollAmnt/50;
			dragLastX = e.offsetX;
			dragLastY = e.offsetY;
			validatePosition();
			redraw();
		}
	});
	gameCanvas.addEventListener('contextmenu', e => e.preventDefault());
}

document.addEventListener('mouseup', e => {
	if (e.button!=0) {
		dragging = false;
	}
});


function newMap() {
	gameMap = []
	
	// A loop that runs while i is less than 500.
	for (let x = 0; x < mapSize; x++) {
		gameMap[x] = [];
		for (let y = 0; y < mapSize; y++)
			gameMap[x][y] = new Tile(tileTypes.GRASS);
	}
	// Braces aren't required for loops/ifs with only one action. They can also be one line.

	let startX = randInt(230,270);
	let startY = randInt(230,270);
	currentX = startX + 0.5;
	currentY = startY + 0.5;
	createSpawn(startX,startY,teams.PLAYER);
	createSpawn(randInt(30,mapSize-30),randInt(mapSize-30,mapSize-10),teams.PIRATES,3);
	createSpawn(randInt(mapSize-30,mapSize-10),randInt(30,mapSize-30),teams.NOMADS);
	createSpawn(randInt(10,30),randInt(30,mapSize-30),teams.ESKIMOS,5);
	createSpawn(randInt(30,mapSize-30),randInt(10,30),teams.PYGMIES,8);

	redraw();
}

function createSpawn(startX,startY,team,initialClaimSize=2) {

	getLoc(startX,startY).setBuilding(new Building(buildingTypes.CAMPSITE, team));
	for (let x = startX-initialClaimSize; x<=startX+initialClaimSize; x++) {
		for (let y = startY-initialClaimSize; y<=startY+initialClaimSize; y++) {
			getLoc(x,y).setTeam(team);
		}
	}
}

function changeZoom(amnt) {
	const defaultFovX = 11, defaultFovY = 7;
	const minZoom = 5, maxZoom = 0.5;
	scrollAmnt+=amnt;
	if (scrollAmnt < maxZoom) scrollAmnt = maxZoom;
	if (scrollAmnt > minZoom) scrollAmnt = minZoom;
	xFOV = scrollAmnt*defaultFovX;
	yFOV = scrollAmnt*defaultFovY;

	validatePosition();
	redraw();
}

function validatePosition() {
	if (xFOV>mapSize/2) xFOV = mapSize/2;
	if (yFOV>mapSize/2) yFOV = mapSize/2;
	if (currentX+xFOV+1>=mapSize) currentX=mapSize-xFOV-1;
	if (currentY+yFOV+1>=mapSize) currentY=mapSize-yFOV-1;
	if (currentX-xFOV-1<0) currentX=xFOV+1;
	if (currentY-yFOV-1<0) currentY=yFOV+1;
}

function inBounds(x,y) {
	if (x < 0) return false	
	if (x >= mapSize) return false
	if (y < 0) return false
	if (y >= mapSize) return false
	return true
}
// Returns end functions.

function getLoc(x,y) {
	if (!inBounds(x,y)) // Runs code if it's false
		return undefined
		
	return gameMap[x][y];
}
function setLoc(a,x,y) {
	if (!inBounds(x,y)) // Runs code if it's false
		return undefined
		
	gameMap[x][y] = a
}

/* 
Assignment =
Equals to but bad ==
Equals to but good ===
*/

function fitCanvas() {
	const container = document.getElementById("gameMap");
	gameCanvas.width = container.scrollWidth;
	gameCanvas.height = container.scrollHeight;
}

// Draws images to all of the divSquares as needed.
let tileSizeX;
let tileSizeY;
function redraw() {
	tileSizeX = gameCanvas.width / (xFOV * 2 + 1);
	tileSizeY = gameCanvas.height / (yFOV * 2 + 1);

	const centerX = gameCanvas.width/2;
	const centerY = gameCanvas.height/2;

	const rawPosX = Math.floor(currentX);
	const rawPosY = Math.floor(currentY);
	const xMin = rawPosX-Math.floor(xFOV)-2;
	const yMin = rawPosY-Math.floor(yFOV)-2;
	const xMax = rawPosX+Math.ceil(xFOV)+2;
	const yMax = rawPosY+Math.ceil(yFOV)+2;

	board.clearRect(0,0,gameCanvas.width,gameCanvas.height);
	
	let selTileInfo = null;
	for (let x = xMin; x < xMax; x++) {
		for (let y = yMin; y < yMax; y++) {
			let tile = getLoc(x, y);
			if (tile!=null) {
				let posX = (x-currentX)*tileSizeX+centerX;
				let posY = (y-currentY)*tileSizeY+centerY;
				tile.render(posX,posY,tileSizeX,tileSizeY);
				if (selectedTile != null && (x == selectedTile.x && y == selectedTile.y)) {
					selTileInfo = {x:posX,y:posY,tileX:x,tileY:y};
				}
			}
		}
	}
	if (selTileInfo != null) {
		board.lineWidth = (tileSizeX+tileSizeY)/30;
		board.strokeStyle = getLoc(selTileInfo.tileX,selTileInfo.tileY).owner.highlightColor;
		board.strokeRect(selTileInfo.x,selTileInfo.y,tileSizeX,tileSizeY);
	}
	
}

// Returns the tile you're hovering over
function hoveredTile() {
	const box = gameCanvas.getBoundingClientRect();

	const relX = mouseX - box.left;
	const relY = mouseY - box.top;

	if (relX<0 || relY<0 || relX>gameCanvas.scrollWidth || relY>gameCanvas.scrollHeight) return null;

	const centerX = gameCanvas.width/2;
	const centerY = gameCanvas.height/2;

	return {x: Math.floor(((relX-centerX)/tileSizeX)+currentX), y: Math.floor(((relY-centerY)/tileSizeY)+currentY)}
}

let selectedTile = null;
function clickMap() {
	if (!dragging) {
		const clickedTile = hoveredTile();
		if (selectedTile != null && (clickedTile.x == selectedTile.x && clickedTile.y == selectedTile.y))
			selectedTile = null;
		else
			selectedTile = clickedTile;
		redraw();
	}
}