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

        //the tile's displayed number
        this._displayValue = 0; //0 is no displayed number

        //the value the solver sees and edits
        this._solverValue = 0;
        this._deletable = true;

        //the html element this tile represents
        this._asElement = document.getElementById(stringId).firstElementChild;
    }

    //getters for the properties
    get id() { return this._id; }
    get rowNumber() { return this._rowNumber; }
    get colNumber() { return this._colNumber; }
    get boxNumber() { return this._boxNumber; }
    get storedValue() { return this._storedValue; }
    get displayValue() { return this._displayValue; }
    get asElement() { return this._asElement; }
    get solverValue() { return this._solverValue; }
    get deletable() { return this._deletable; }
    //setters for the properties
    set solverValue(input) { this._solverValue = input; }
    set deletable(input) { this._deletable = input; }

    //methods:
    //method for setting the stored value
    writeToTile(input){
        this._storedValue = input;
        this._displayValue = input;
        this._solverValue = input;
    }

    //method for hiding the value of the tile
    hide(){
        this._displayValue = 0;
        this._solverValue = 0;
        this._asElement.value = '';
        this._asElement.className = '';
    }

    reveal(){
        this._displayValue = this._storedValue;
        this._solverValue = this._storedValue;
    }

    //method for clearing user input from a tile
    clearTile(){
        //if this is a tile with user input (i.e. not disabled)
        if(!this._asElement.hasAttribute('disabled')){ 
            this._asElement.value = ''; //reset the input
            this._asElement.className = ''; //reset the color of the text
        }
    }

    //check user input against the stored value
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
    let overallAttempts = 0;
    //variables for retrying upon difficult state
    let numOfAttempts = 0;
    let saveState = saveTiles(tiles);
    let savedNumber = 1;

    //looping until all tiles are empty
    attempt: while(tiles.filter(tile => tile.storedValue === 0).length){
        overallAttempts++;
        numOfAttempts++;

        //checking if too many attempts were done
        if(numOfAttempts > 25){
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

    const indexes = [];
    for(let i = 0; i < 81; i++){
        indexes.push(i);
    }
    for(let i = 0; i < 81 - numOfFilledTiles; i++){
        //selecting a random, unselected tile
        let rand = Math.floor(Math.random() * indexes.length);
        let currTile = tiles[indexes[rand]];
        indexes.splice(rand, 1);

        //hiding the tile
        currTile.hide();
    }

    //showing every non-hidden tile to the user
    tiles.filter(tile => tile.displayValue !== 0).forEach(tile => {
        tile.asElement.value = tile.displayValue;
        tile.asElement.setAttribute('disabled', '');
    });
}

const seeSolverVal = (arr) => arr.map(tile => tile.solverValue);
const isInRow = (rows, tile, num) => seeSolverVal(rows[tile.rowNumber]).includes(num);
const isInCol = (columns, tile, num) => seeSolverVal(columns[tile.colNumber]).includes(num);
const isInBox = (boxes, tile, num) => seeSolverVal(boxes[tile.boxNumber]).includes(num);
//function that returns true if it is legal to place a certain number in a certain tile
const legal = (rows, columns, boxes, tile, num) => !isInRow(rows, tile, num) && !isInCol(columns, tile, num) && !isInBox(boxes, tile, num);


//function that returns an array with all the possible candidates for a certain tile
function getChoices(rows, columns , boxes, tile) {
    let choices = [];
    for (let i = 1; i <= 9; i++) {
        if (legal(rows, columns, boxes, tile, i)) {
            choices.push(i);
        }
    }
    return choices;
}

function solver(tiles, rows, columns, boxes){
    function check(tiles, rows, columns, boxes){
        let emptyTiles = tiles.filter(tile => tile.solverValue === 0);
        if(emptyTiles.length === 0){
            return true;
            //add a count to the solutions
        }

        let moves = getChoices(rows, columns, boxes, emptyTiles[0]);
        for(let m = 0; m < moves.length; m++){
            emptyTiles[0].solverValue = moves[m];
            if(check(tiles, rows, columns, boxes)){
                return true;
            }
        };
        emptyTiles[0].solverValue = 0;
        return false;
    }

    check(tiles, rows, columns, boxes);
}

//setting the actual sudoku board in html
{
    let table = document.querySelector('table'); //selecting the table element
    let tileIdCounter = 0;
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
}

let tiles = []; //an array of tiles as objects
for(let i = 0; i < 81; i++){
    tiles.push(new Tile(`tile_${i}`));
}
let tilesAsElements = tiles.map(tile => tile.asElement); //an array of the HTML elements of the tiles

//filtering the tiles into rows, columns, and boxes
let rows = [];
let columns = [];
let boxes = [];
for(let i = 0; i < 9; i++){
    rows.push(tiles.filter(tile => tile.rowNumber === i));
    columns.push(tiles.filter(tile => tile.colNumber === i));
    boxes.push(tiles.filter(tile => tile.boxNumber === i));
}



generateBoard(tiles, rows, columns, boxes);
createPuzzle(tiles, 45);

let solverButton = document.getElementById('solver');
solverButton.addEventListener('click', () => {
    solver(tiles, rows, columns, boxes);
    let emptyTiles = tiles.filter(tile => tile.displayValue === 0);
    emptyTiles.forEach(tile => {
        tile.asElement.value = tile.solverValue;
        tile.asElement.setAttribute('disabled', '');
        tile.asElement.className = 'solved';
    });
});

let generator = document.getElementById('generator');
generator.addEventListener('click', () => {
    emptyBoard(tiles);
    generateBoard(tiles, rows, columns, boxes);
    createPuzzle(tiles, 45);
});

let clear = document.getElementById('clear');
clear.addEventListener('click', () => {
    emptyBoard(tiles);
});