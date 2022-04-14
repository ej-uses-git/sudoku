class Tile {
    constructor(stringId){
        this._id = Number(stringId.slice(stringId.indexOf('_') + 1));

        this._rowNumber = Math.floor(this._id/9);
        this._colNumber = this._id % 9;
        this._boxNumber = (Math.floor(this._id/3) % 3) + (Math.floor(this._rowNumber/3) * 3);

        this._storedValue = 0;
        this._displayValue = 0;
        this._solverValue = 0;
        this._deletable = true;

        this._asElement = document.getElementById(stringId).firstElementChild;
    }

    //getters
    get id() { return this._id; }
    get rowNumber() { return this._rowNumber; }
    get colNumber() { return this._colNumber; }
    get boxNumber() { return this._boxNumber; }
    get storedValue() { return this._storedValue; }
    get displayValue() { return this._displayValue; }
    get asElement() { return this._asElement; }
    get solverValue() { return this._solverValue; }
    get deletable() { return this._deletable; }
    //setters
    set solverValue(input) { this._solverValue = input; }
    set deletable(input) { this._deletable = input; }

    //methods:
    writeToTile(input){
        this._storedValue = input;
        this._displayValue = input;
        this._solverValue = input;
    }

    hide(){
        this._displayValue = 0;
        this._solverValue = 0;
    }

    reveal(){
        this._displayValue = this._storedValue;
        this._solverValue = this._storedValue;
    }

    clearInput(){
        if(!this._asElement.hasAttribute('disabled')){ 
            this._asElement.value = ''; 
            this._asElement.className = '';
        }
    }

    checkInput(){
        if(this._asElement.value){
            if(Number(this._asElement.value) === this._storedValue){
                this._asElement.setAttribute('disabled', '');
                this._asElement.className = 'green';
                return 0;
            } else {
                this._asElement.value = this._asElement.value;
                this._asElement.className = 'red';
                return 1;
            }
        }
    }
}

const rewriteTiles = (arr, save) => {
    for(let i = 0; i < save.length; i++){
        arr[i].writeToTile(save[i]);
    }
}

const saveTiles = arr => arr.map(tile => tile.storedValue);

const emptyBoard = arr => {
    arr.forEach(tile => {
        tile.writeToTile(0);
        tile.asElement.value = '';
        tile.asElement.className = '';
        tile.asElement.removeAttribute('disabled');
    });
}

const generateBoard = (tiles, rows, columns, boxes) => {
    let numOfAttempts = 0;
    let saveState = saveTiles(tiles);
    let savedNumber = 1;

    attempt: while(tiles.filter(tile => tile.storedValue === 0).length){
        numOfAttempts++;

        if(numOfAttempts > 25){
            numOfAttempts = 0;
            savedNumber = 1;
            emptyBoard(tiles);
            saveState = saveTiles(tiles);
            continue attempt;
        }

        rewriteTiles(tiles, saveState);

        for(let i = savedNumber; i <= 9; i++){
            for(let j = 0; j < 9; j++){
                let currRow = rows[j];

                let availableTiles = currRow.filter(tile => tile.storedValue === 0);
                let filled = false;
                while(availableTiles.length){
                    let index = Math.floor(Math.random() * availableTiles.length);
                    let currTile = availableTiles[index];
                    availableTiles.splice(index, 1);

                    const isInBox = saveTiles(boxes[currTile.boxNumber]).includes(i);
                    const isInCol = saveTiles(columns[currTile.colNumber]).includes(i);
                    if(!isInBox && !isInCol){
                        currTile.writeToTile(i);
                        filled = true;
                        break;
                    }

                    if(!availableTiles.length && !filled) continue attempt;
                }
            }
            saveState = saveTiles(tiles);
            savedNumber = i + 1;
        }
    }
}

const seeSolverVal = (arr) => arr.map(tile => tile.solverValue);
const isInRow = (rows, tile, num) => seeSolverVal(rows[tile.rowNumber]).includes(num);
const isInCol = (columns, tile, num) => seeSolverVal(columns[tile.colNumber]).includes(num);
const isInBox = (boxes, tile, num) => seeSolverVal(boxes[tile.boxNumber]).includes(num);
const legal = (rows, columns, boxes, tile, num) => !isInRow(rows, tile, num) && !isInCol(columns, tile, num) && !isInBox(boxes, tile, num);

const resetSolver = (arr, save) => {
    for(let i = 0; i < arr.length; i++){
        arr[i].solverValue = save[i];
    }
}

const getMoves = (rows, columns , boxes, tile) => {
    let moves = [];
    for (let i = 1; i <= 9; i++) {
        if (legal(rows, columns, boxes, tile, i)) {
            moves.push(i);
        }
    }
    return moves;
}

const bestBet = (emptyTiles, rows, columns, boxes) => {
    let tileIndex;
    let bestLength = 10;
    for(let i = 0; i < emptyTiles.length; i++){
        let moves = getMoves(rows, columns, boxes, emptyTiles[i]);
        if(moves.length < bestLength){
            bestLength = moves.length;
            tileIndex = i;
        }
    }
    return tileIndex;
}

const check = (tiles, rows, columns, boxes) => {
    let emptyTiles = tiles.filter(tile => tile.solverValue === 0);
    if(emptyTiles.length === 0){
        return true;
    }
    
    let bestTile = emptyTiles[bestBet(emptyTiles, rows, columns, boxes)];
    let moves = getMoves(rows, columns, boxes, bestTile);
    for(let move of moves){
        bestTile.solverValue = move;
        if(check(tiles, rows, columns, boxes)){
            return true;
        }
    };
    bestTile.solverValue = 0;
    return false;
}

const valid = (tiles, rows, columns, boxes) => {
    let saveState = seeSolverVal(tiles);
    let count = 0;
    while(true){
        let emptyTiles = tiles.filter(tile => tile.solverValue === 0);
        if(emptyTiles.length === 0){
            count = 1;
            break;
        }
        
        let bestTile = emptyTiles[bestBet(emptyTiles, rows, columns, boxes)];
        let moves = getMoves(rows, columns, boxes, bestTile);
        if(moves.length === 1){
            bestTile.solverValue = moves[0];
        } else {
            for(let move of moves){
                bestTile.solverValue = move;
                if(check(tiles, rows, columns, boxes)){
                    count++;
                    if(count > 1){
                        break;
                    }
                }
            };
            break;
        }
    }
    resetSolver(tiles, saveState);
    return count === 1;
}

const createPuzzle = (tiles, numOfFilledTiles) => {
    if(numOfFilledTiles < 17) throw new Error('a sudoku board with less than 17 filled tiles cannot have only one solution');

    const full = [];
    let indexes = [];
    for(let i = 0; i < 81; i++){
        full.push(i);
        indexes.push(i);
    }

    for(let i = 0; i < 81 - numOfFilledTiles; i++){
        if(indexes.length === 0){
            indexes = full.slice();
            i = 0;
            for(let tile of tiles){
                tile.reveal();
                tile.deletable = true;
            }
        }
        let rand = Math.floor(Math.random() * indexes.length);
        let selectedTile = tiles[indexes[rand]];
        if(!selectedTile.deletable){
            i--;
        } else {
            selectedTile.hide();
            if(!valid(tiles, rows, columns, boxes)){
                selectedTile.reveal();
                selectedTile.deletable = false;
                i--;
            }
        }
        indexes.splice(rand, 1);
    }

    tiles.filter(tile => tile.displayValue !== 0).forEach(tile => {
        tile.asElement.value = tile.displayValue;
        tile.asElement.setAttribute('disabled', '');
    });
}

let table = document.querySelector('table');
let tileIdCounter = 0;
for(let i = 0; i < 3; i++){
    let boxrow = document.createElement('tr');
    boxrow.setAttribute('class', 'box-row');
    for(let j = 0; j < 3; j++){
        let box = document.createElement('td');
        box.setAttribute('class', 'box');
        for(let k = 0; k < 3; k++){
            let inboxrow = document.createElement('tr');
            inboxrow.setAttribute('class', 'in-box-row');
            inboxrow.setAttribute('name', `row_${(i * 3) + k}`);
            box.appendChild(inboxrow);
        }
        boxrow.appendChild(box);
    }
    table.appendChild(boxrow);
}

let inboxrows = document.querySelectorAll('.in-box-row');
for(let i = 0; i < 9; i++){
    inboxrows.forEach(ibr => {
        if(ibr.getAttribute('name').includes(i)){
            for(let j = 0; j < 3; j++){
                let tile = document.createElement('td');
                let input = document.createElement('input');
                tile.setAttribute('id', `tile_${tileIdCounter}`);
                tile.setAttribute('class', 'tile');
                input.setAttribute('maxlength', '1');
                input.setAttribute('oninput', 'this.value=this.value.replace(/[^1-9]/g,\'\');');
                tile.appendChild(input);
                ibr.appendChild(tile);
                tileIdCounter++;
            }
        }
    });
}

let tiles = [];
for(let i = 0; i < 81; i++){
    tiles.push(new Tile(`tile_${i}`));
}
let tilesAsElements = tiles.map(tile => tile.asElement);

let rows = [];
let columns = [];
let boxes = [];
for(let i = 0; i < 9; i++){
    rows.push(tiles.filter(tile => tile.rowNumber === i));
    columns.push(tiles.filter(tile => tile.colNumber === i));
    boxes.push(tiles.filter(tile => tile.boxNumber === i));
}

const winScreen = (numOfMistakes, timeElapsed) => {
    let screen = document.getElementById('win_screen');
    let mistakeStat = document.getElementById('mistake_stat');
    let timeStat = document.getElementById('time_stat');
    mistakeStat.textContent = numOfMistakes;
    timeStat.textContent = timeElapsed;
    screen.className = '';
}

let startTime = Date.now();
let newgameButton = document.getElementById('new_game');
let mistakeCounter = 0;
generateBoard(tiles, rows, columns, boxes);
createPuzzle(tiles, 30);

tiles.forEach(tile => tile.asElement.addEventListener('focus', tile.clearInput()));
document.addEventListener('keyup', e => {
    if(e.code.includes('Enter')){
        tiles.filter(tile => !tile.asElement.hasAttribute('disabled') && tile.asElement.value !== '').forEach(tile => {
            let mistake = tile.checkInput();
            mistakeCounter += mistake;
        });

        if(tiles.filter(tile => tile.asElement.hasAttribute('disabled')).length === 81){
            let endTime = Date.now();
            let miliseconds = endTime - startTime;
            let minutes = Math.floor(miliseconds/1000/60);
            let minutesFirstDigit = Math.floor(minutes/10);
            let minutesSecondDigit = minutes - minutesFirstDigit*10;
            let seconds = Math.floor((miliseconds - minutes*1000*60)/1000);
            let secondsFirstDigit = Math.floor(seconds/10);
            let secondsSecondDigit = seconds - secondsFirstDigit*10;
            winScreen(mistakeCounter, `${minutesFirstDigit}${minutesSecondDigit}:${secondsFirstDigit}${secondsSecondDigit}`);
            newgameButton.addEventListener('click', () => {
                let screen = document.getElementById('win_screen');
                screen.className = 'hidden';
                emptyBoard(tiles);
                generateBoard(tiles, rows, columns, boxes);
                createPuzzle(tiles, 50);
                mistakeCounter = 0;
                startTime = Date.now();
            });
        }
    } else if(e.code.includes('Backspace' || 'Delete')){
        if(tilesAsElements.includes(document.activeElement)){
            document.activeElement.className = '';
        }
    }
});

//light and dark mode:
let root = document.querySelector(':root');
let modeButton = document.querySelector('.mode-selector');
let favicon = document.querySelector('link[rel="icon"]');
if(localStorage.getItem('colormode') === 'light'){
    //we are in light mode
    root.style.setProperty('--main', 'white');
    root.style.setProperty('--second', 'black');
    root.style.setProperty('--alt', '#333');
    favicon.setAttribute('href', './light_favicon.ico');
    modeButton.textContent = 'Dark Mode';
} else if(localStorage.getItem('colormode') === 'dark'){
    //we are in dark mode
    root.style.setProperty('--main', 'black');
    root.style.setProperty('--second', 'white');
    root.style.setProperty('--alt', '#dfdfdf');
    favicon.setAttribute('href', './dark_favicon.ico');
    modeButton.textContent = 'Light Mode';
} else {
    //default: light mode
    localStorage.setItem('colormode', 'light');
    root.style.setProperty('--main', 'white');
    root.style.setProperty('--second', 'black');
    root.style.setProperty('--alt', '#333');
    favicon.setAttribute('href', './light_favicon.ico');
    modeButton.textContent = 'Dark Mode';
}

modeButton.addEventListener('click', () => {
    if(localStorage.getItem('colormode') === 'light'){
        //set to dark mode
        localStorage.setItem('colormode', 'dark');
        root.style.setProperty('--main', 'black');
        root.style.setProperty('--second', 'white');
        root.style.setProperty('--alt', '#dfdfdf');
        favicon.setAttribute('href', './dark_favicon.ico');
        modeButton.textContent = 'Light Mode'
    } else if(localStorage.getItem('colormode') === 'dark'){
        //set to light mode
        localStorage.setItem('colormode', 'light');
        root.style.setProperty('--main', 'white');
        root.style.setProperty('--second', 'black');
        root.style.setProperty('--alt', '#333');
        favicon.setAttribute('href', './light_favicon.ico');
        modeButton.textContent = 'Dark Mode';
    }
});
