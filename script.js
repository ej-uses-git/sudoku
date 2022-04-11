//creating a class for tiles on a sudoku board
class Tile {
    constructor(stringId){
        //the tile's id as a number
        this._id = Number(stringId.slice(stringId.indexOf('_') + 1));

        //the tile's row, column, and box numbers
        this._rowNumber = Math.floor(this._id/9);
        this._colNumber = this._id % 9;
        this._boxNumber = (Math.floor(this._id/3) % 3) + (Math.floor(this._rowNumber/3) * 3);

        //the tile's stored number
        this._storedValue = 0; //0 is an empty tile

        //the html element this tile represents
        this._asElement = document.getElementById(stringId).firstElementChild;
    }

    //getters for the properties
    get id() { return this._id; }
    get rowNumber() { return this._rowNumber; }
    get colNumber() { return this._colNumber; }
    get boxNumber() { return this._boxNumber; }
    get storedValue() { return this._storedValue; }
    get asElement() { return this._asElement; }

    //methods:
    //method for setting the stored value
    writeToTile(input){
        this._storedValue = input;
    }

    //method for revealing the stored value in the element
    revealTile(){
        this._asElement.value = this._storedValue;
        this._asElement.setAttribute('disabled', '');
    }

    //method for clearing user input from a tile
    clearTile(){
        //if this is a tile with user input (i.e. not disabled)
        if(!this._asElement.hasAttribute('disabled')){ 
            this._asElement.value = ''; //reset the input
            this._asElement.className = ''; //reset the color of the text
        }
    }
}

//function that rewrites an array of tiles' stored values to an array of saved values
const rewriteTiles = (arr, save) => {
    for(let i = 0; i < save.length; i++){
        arr[i].writeToTile(save[i]);
    }
}

//function that returns an array of saved values from an array of tiles
const saveTiles = arr => arr.map(tile => tile.storedValue);

//function that empties the board
const emptyBoard = arr => {
    arr.forEach(tile => {
        tile.writeToTile(0);
        tile.asElement.value = '';
        tile.asElement.className = '';
        tile.asElement.removeAttribute('disabled');
    });
}

//function that generates a solved sudoku board
const generateBoard = (tiles, rows, columns, boxes) => {
    //variables for retrying upon difficult state
    let numOfAttempts = 0;
    let saveState = saveTiles(tiles);
    let savedNumber = 1;

    //looping until all tiles are empty
    attempt: while(tiles.filter(tile => tile.storedValue === 0).length){
        numOfAttempts++;

        //checking if too many attempts were done
        if(numOfAttempts > 50){
            numOfAttempts = 0;
            savedNumber = 1;
            emptyBoard(tiles);
            saveState = saveTiles(tiles);
            continue attempt;
        }

        //reset to the last savestate
        rewriteTiles(tiles, saveState);

        //iterate through each number from 1-9
        for(let i = savedNumber; i <= 9; i++){
            //iterate through each row on the board
            for(let j = 0; j < 9; j++){
                let currRow = rows[j];

                let availableTiles = currRow.filter(tile => tile.storedValue === 0); //an array of the empty tiles in the current row
                let filled = false;
                while(availableTiles.length){
                    //selecting a tile
                    let index = Math.floor(Math.random() * availableTiles.length);
                    let currTile = availableTiles[index];
                    availableTiles.splice(index, 1); //making the tile unavailable

                    //checking if it's legal to put this number (i) in this tile (currTile)
                    const isInBox = saveTiles(boxes[currTile.boxNumber]).includes(i);
                    const isInCol = saveTiles(columns[currTile.colNumber]).includes(i);
                    if(!isInBox && !isInCol){
                        //if it is - filling the tile
                        currTile.writeToTile(i);
                        filled = true;
                        break;
                    }

                    //if there are no options in this row, try again
                    if(!availableTiles.length && !filled) continue attempt;
                }
            } //after we filled in a certain number, we save
            saveState = saveTiles(tiles);
            savedNumber = i + 1;
        }
    }
}

//function that takes a filled board and turns it into a sudoku puzzle
const createPuzzle = (tiles, numOfFilledTiles) => {
    /* 
    NOTE: this needs a different, more complex algorithm, that will not allow impossible puzzles
    for this, a solving algorithm is required, that checks if the given puzzle allows only one solution
    (preferably, this is done by ERASING instead of REVEALING - erase a number, check if possible, continue, etc...)
    */

    //variable to keep track of filled tiles
    const tileIndexes = [];
    for(let i = 0; i < 81; i++) tileIndexes.push(i);
    for(let i = 0; i < numOfFilledTiles; i++){
        const index = Math.floor(Math.random() * tileIndexes.length);
        let revealedTile = tiles[tileIndexes[index]];
        tileIndexes.splice(index, 1);

        revealedTile.revealTile();
    }
}

//function to trigger the win screen
const winScreen = (numOfMistakes, timeElapsed) => {
    let screen = document.getElementById('win_screen');
    let mistakeStat = document.getElementById('mistake_stat');
    let timeStat = document.getElementById('time_stat');
    mistakeStat.textContent = numOfMistakes;
    timeStat.textContent = timeElapsed;
    screen.className = ''; //making the screen visible
}

//setting the actual sudoku board in html
{
    let table = document.querySelector('table'); //selecting the table element
    let tileIdCounter = 0;
    const tileHolder = [];
    /*
    NOTE: this can be done without temporary storage. To be fixed.
    */
    for(let i = 0; i < 81; i++){
        //creating every tile and temporarily storing it
        let tile = document.createElement('td');
        let input = document.createElement('input');
        tile.setAttribute('id', `tile_${i}`);
        tile.setAttribute('class', 'tile');
        input.setAttribute('maxlength', '1');
        input.setAttribute('oninput', 'this.value=this.value.replace(/[^1-9]/g,\'\');');
        tile.appendChild(input);
        tileHolder.push(tile);
    }

    for(let i = 0; i < 3; i++){
        //creating rows of boxes
        let boxrow = document.createElement('tr');
        boxrow.setAttribute('class', 'box-row');
        for(let j = 0; j < 3; j++){
            //creating boxes
            let box = document.createElement('td');
            box.setAttribute('class', 'box');
            for(let k = 0; k < 3; k++){
                //creating rows of tiles (within the boxes)
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
        //placing the tiles from the temporary storage into the in-box-rows
        inboxrows.forEach(ibr => {
            if(ibr.getAttribute('name').includes(i)){
                for(let j = 0; j < 3; j++){
                    ibr.appendChild(tileHolder[tileIdCounter]);
                    tileIdCounter++;
                }
            }
        });
    }
}

let tiles = []; //an array of tiles as objects
for(let i = 0; i < 81; i++){
    tiles.push(new Tile(`tile_${i}`));
}

//filtering the tiles into rows, columns, and boxes
let rows = [];
let columns = [];
let boxes = [];
for(let i = 0; i < 9; i++){
    rows.push(tiles.filter(tile => tile.rowNumber === i));
    columns.push(tiles.filter(tile => tile.colNumber === i));
    boxes.push(tiles.filter(tile => tile.boxNumber === i));
}

//starting a game when the website is loaded
let startTime = Date.now();
let newgameButton = document.getElementById('new_game');
let mistakeCounter = 0;
generateBoard(tiles, rows, columns, boxes);
createPuzzle(tiles, 50);

//player inputs:
tiles.forEach(tile => tile.asElement.addEventListener('focus', tile.clearTile()));
document.addEventListener('keyup', e => {
    if(e.code.includes('Enter')){
        //check every filled tile

        //if puzzle is solved - trigger winscreen
    } else if(e.code.includes('Backspace' || 'Delete')){
        //clear the colors of the currently-selected tile
    }
});

//light and dark mode:
//checking if we already have a set mode
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

//making the mode button work
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
