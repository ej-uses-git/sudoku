class Cell {
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
    set storedValue(input) { this._storedValue = input; }
    set displayValue(input) { this._displayValue = input; }
    set solverValue(input) { this._solverValue = input; }
    set deletable(input) { this._deletable = input; }

    //methods:
    writeToCell(input){
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
                this._displayValue = Number(this._asElement.value);
                return 0;
            } else {
                this._asElement.value = this._asElement.value;
                this._asElement.className = 'red';
                return 1;
            }
        }
    }
}

//misc functions
const officialSudokuString = (cells) => {
    let string = '';
    for(let cell of cells){
        if(cell.displayValue === 0){
            string += '.';
        } else {
            string += cell.displayValue;
        }
    }
    return string;
}

//general functions
const findObjectFromElement = (elem, arr) => arr[elem.parentElement.id.slice(elem.parentElement.id.indexOf('_') + 1)];
const saveCells = arr => arr.map(cell => cell.storedValue);
const rewriteCells = (arr, save) => {
    for(let i = 0; i < save.length; i++){
        arr[i].writeToCell(save[i]);
    }
}
const emptyBoard = arr => {
    arr.forEach(cell => {
        cell.writeToCell(0);
        cell.asElement.value = '';
        cell.asElement.className = '';
        cell.asElement.removeAttribute('disabled');
    });
}

//solver functions
const seeSolverVal = (arr) => arr.map(cell => cell.solverValue);
const isInRow = (rows, cell, num) => seeSolverVal(rows[cell.rowNumber]).includes(num);
const isInCol = (columns, cell, num) => seeSolverVal(columns[cell.colNumber]).includes(num);
const isInBox = (boxes, cell, num) => seeSolverVal(boxes[cell.boxNumber]).includes(num);
const legal = (rows, columns, boxes, cell, num) => !isInRow(rows, cell, num) && !isInCol(columns, cell, num) && !isInBox(boxes, cell, num);
const getMoves = (rows, columns , boxes, cell) => {
    let moves = [];
    for (let i = 1; i <= 9; i++) {
        if (legal(rows, columns, boxes, cell, i)) {
            moves.push(i);
        }
    }
    return moves;
}
const bestBet = (emptyCells, rows, columns, boxes) => {
    let cellIndex;
    let bestLength = 10;
    for(let i = 0; i < emptyCells.length; i++){
        let moves = getMoves(rows, columns, boxes, emptyCells[i]);
        if(moves.length < bestLength){
            bestLength = moves.length;
            cellIndex = i;
        }
    }
    return cellIndex;
}
const unique = (cells, rows, columns, boxes) => {
    let counter = 0;
    const solve = (cells, rows, columns, boxes) => {
        let emptyCells = cells.filter(cell => cell.solverValue === 0);
        if(emptyCells.length === 0){
            counter++;
            return false;
        }
        let bestCell = bestBet(emptyCells, rows, columns, boxes);
        let moves = getMoves(rows, columns, boxes, emptyCells[bestCell]);
        for(let m of moves){
            emptyCells[bestCell].solverValue = m;
            if(solve(cells, rows, columns, boxes) && counter < 2) return true;
        }
        emptyCells[bestCell].solverValue = 0;
        return false;
    }
    solve(cells, rows, columns, boxes);
    if(counter > 1) return false;
    return true;
}

//saving puzzle functions
const stringGenerate = cells => {
    let string = '';
    for(let cell of cells){
        if(cell.asElement.className === 'green'){
            string += '*';
        }
        string += cell.displayValue;
    }
    return string;
}
const fillFromString = (arr, string) => {
    emptyBoard(arr);

    let place = 0;
    for(let i = 0; i < string.length; i++){
        if(string.charAt(i) === '*'){
            arr[place].asElement.className = 'green';
        } else {
            arr[place].displayValue = Number(string.charAt(i));
            place++;
        }
    }

    for(let i = 0; i < arr.length; i++){
        if(arr[i].displayValue !== 0){
            arr[i].asElement.value = arr[i].displayValue;
            arr[i].asElement.setAttribute('disabled', '');
        }
    }
}
const solutionString = cells => {
    let string = '';
    for(let cell of cells){
        string += cell.storedValue;
    }
    return string;
}
const rememberSolution = (arr, string) => {
    for(let i = 0; i < arr.length; i++){
        arr[i].storedValue = Number(string.charAt(i));
    }
}

//UI functions
const winScreen = (numOfMistakes, timeElapsed) => {
    let screen = document.getElementById('win_screen');
    let mistakeStat = document.getElementById('mistake_stat');
    let timeStat = document.getElementById('time_stat');
    mistakeStat.textContent = numOfMistakes;
    timeStat.textContent = timeElapsed;
    screen.className = '';
}
const markerSetter = (markers, rows, checker) => {
    let rowsInputs = [];
    let unmarkedNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for(let row of rows){
        rowsInputs.push(row.map(cell => cell.displayValue));
    }
    for(let i = 1; i <= 9; i++){
        if(checker){
            markers[i - 1].className = 'marker';
        }
        if(rowsInputs.filter(row => row.includes(i)).length === 9 && !markers[i - 1].className.includes('hidden')){
            markers[i - 1].className += ' hidden';
            unmarkedNumbers.splice(unmarkedNumbers.indexOf(i), 1);
        }
    }
    let markedNumRegex = '[^';
    for(let num of unmarkedNumbers){
        markedNumRegex += num;
    }
    markedNumRegex += ']';
    for(let row of rows){
        for(let cell of row){
            cell.asElement.setAttribute('oninput', `this.value=this.value.replace(/${markedNumRegex}/g,\'\');`);
        }
    }
}

//initialization functions
const generateBoard = (cells, rows, columns, boxes) => {
    emptyBoard(cells);
    let numOfAttempts = 0;
    let saveState = saveCells(cells);
    let savedNumber = 1;

    attempt: while(cells.filter(cell => cell.storedValue === 0).length){
        numOfAttempts++;

        if(numOfAttempts > 25){
            numOfAttempts = 0;
            savedNumber = 1;
            emptyBoard(cells);
            saveState = saveCells(cells);
            continue attempt;
        }

        rewriteCells(cells, saveState);

        for(let i = savedNumber; i <= 9; i++){
            for(let j = 0; j < 9; j++){
                let currRow = rows[j];

                let availableCells = currRow.filter(cell => cell.storedValue === 0);
                let filled = false;
                while(availableCells.length){
                    let index = Math.floor(Math.random() * availableCells.length);
                    let currCell = availableCells[index];
                    availableCells.splice(index, 1);

                    const isInBox = saveCells(boxes[currCell.boxNumber]).includes(i);
                    const isInCol = saveCells(columns[currCell.colNumber]).includes(i);
                    if(!isInBox && !isInCol){
                        currCell.writeToCell(i);
                        filled = true;
                        break;
                    }

                    if(!availableCells.length && !filled) continue attempt;
                }
            }
            saveState = saveCells(cells);
            savedNumber = i + 1;
        }
    }
}
const createPuzzle = (cells, numOfFilledCells) => {
    if(numOfFilledCells < 17) throw new Error('a sudoku board with less than 17 filled cells cannot have only one solution');

    const full = [];
    let indexes = [];
    for(let i = 0; i < 81; i++){
        full.push(i);
        indexes.push(i);
    }

    for(let i = 0; i < 81 - numOfFilledCells; i++){
        if(indexes.length === 0){
            indexes = full.slice();
            i = 0;
            for(let cell of cells){
                cell.reveal();
                cell.deletable = true;
            }
        }
        let rand = Math.floor(Math.random() * indexes.length);
        let selectedCell = cells[indexes[rand]];
        if(!selectedCell.deletable){
            i--;
        } else {
            selectedCell.hide();
            if(!unique(cells, rows, columns, boxes)){
                selectedCell.reveal();
                selectedCell.deletable = false;
                i--;
            }
        }
        indexes.splice(rand, 1);
    }

    cells.filter(cell => cell.displayValue !== 0).forEach(cell => {
        cell.asElement.value = cell.displayValue;
        cell.asElement.setAttribute('disabled', '');
    });
}

//setting the board in html
let table = document.querySelector('table');
let cellIdCounter = 0;
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
                let cell = document.createElement('td');
                let input = document.createElement('input');
                cell.setAttribute('id', `cell_${cellIdCounter}`);
                cell.setAttribute('class', 'cell');
                input.setAttribute('maxlength', '1');
                input.setAttribute('oninput', 'this.value=this.value.replace(/[^1-9]/g,\'\');');
                cell.appendChild(input);
                ibr.appendChild(cell);
                cellIdCounter++;
            }
        }
    });
}

let cells = [];
for(let i = 0; i < 81; i++){
    cells.push(new Cell(`cell_${i}`));
}
let cellsAsElements = cells.map(cell => cell.asElement);

let rows = [];
let columns = [];
let boxes = [];
for(let i = 0; i < 9; i++){
    rows.push(cells.filter(cell => cell.rowNumber === i));
    columns.push(cells.filter(cell => cell.colNumber === i));
    boxes.push(cells.filter(cell => cell.boxNumber === i));
}

//letting user select difficulty
let diffScreen = document.getElementById('difficulty_settings');
let diffButtons = document.querySelectorAll('.diff');
let confirmButton = document.querySelector('.confirm');
let warning = document.querySelector('.warning');
let diff = 0;
let permadiff = 0;
diffButtons.forEach(button => {
    let ogClassName = button.className;
    //in safari and firefox, buttons do not automatically focus when clicked, thus:
    button.addEventListener('click', () => {
        button.focus();
    });
    button.addEventListener('focus', () => {
        button.className += ' clicked';
        switch(button.id){
            case 'easy':
                diff = 45;
                break;
            case 'medium':
                diff = 35;
                break;
            case 'hard':
                diff = 30;
                break;
            case 'very':
                diff = 24;
                warning.textContent = 'WARNING: This may take a while.';
                break;
        }
    });

    button.addEventListener('blur', () => {
        button.className = ogClassName;
        setTimeout(() => {
            diff = 0;
        }, 300);
        warning.textContent = '';
    });
});

//initializing
let winScreenActive = false;
let markerHolder = document.querySelector('.marker-holder');
let markers = document.querySelectorAll('.marker');
let resetter = document.querySelector('.reset');
if(localStorage.hasOwnProperty('currentPuzzle') && localStorage.hasOwnProperty('currentSolution')){
    //using storage-saved puzzle
    fillFromString(cells, localStorage.getItem('currentPuzzle'));
    rememberSolution(cells, localStorage.getItem('currentSolution'));
    diffScreen.className = 'hidden';
    table.className = '';
    resetter.className = 'reset btn';
    markerHolder.className = 'marker-holder';
    markerSetter(markers, rows, true);
} else if(localStorage.hasOwnProperty('puzzlesolved')){
    winScreenActive = true;
    diffScreen.className = 'hidden';
    winScreen(localStorage.getItem('mistakeCounter'), localStorage.getItem('puzzlesolved'));
    let newpuzzButton = document.getElementById('new_puzzle');
    newpuzzButton.addEventListener('click', () => {
        let screen = document.getElementById('win_screen');
        screen.className = 'hidden';
        winScreenActive = false;
        localStorage.removeItem('permadiff');
        localStorage.removeItem('currentPuzzle');
        localStorage.removeItem('currentSolution');
        localStorage.removeItem('startTime');
        localStorage.removeItem('mistakeCounter');
        localStorage.removeItem('milisecondsCounted');
        localStorage.removeItem('puzzlesolved');
        localStorage.removeItem('officialString');
        diffScreen.className = '';
        table.className = 'hidden';
        markerHolder.className += ' hidden';
        confirmButton.textContent = 'CONFIRM';
    });
}

confirmButton.addEventListener('click', () => {
    if(diff !== 0){
        permadiff = diff;
        localStorage.setItem('permadiff', String(permadiff));
        let startTime = Date.now();
        localStorage.setItem('startTime', String(startTime));
        let mistakeCounter = 0;
        localStorage.setItem('mistakeCounter', String(mistakeCounter));
        generateBoard(cells, rows, columns, boxes);
        confirmButton.textContent = 'LOADING...';
        setTimeout(() => {
            createPuzzle(cells, diff);
            localStorage.setItem('officialString', officialSudokuString(cells));
            localStorage.setItem('currentPuzzle', stringGenerate(cells));
            localStorage.setItem('currentSolution', solutionString(cells));
            diffScreen.className = 'hidden';
            table.className = '';
            resetter.className = 'reset btn';
            markerHolder.className = 'marker-holder';
            markerSetter(markers, rows, true);
            winScreenActive = false;
        }, 100);
    }
});

//letting user reset to a new puzzle
resetter.addEventListener('click', () => {
    localStorage.removeItem('permadiff');
    localStorage.removeItem('currentPuzzle');
    localStorage.removeItem('currentSolution');
    localStorage.removeItem('startTime');
    localStorage.removeItem('mistakeCounter');
    localStorage.removeItem('milisecondsCounted');
    localStorage.removeItem('puzzlesolved');
    localStorage.removeItem('officialString');
    diffScreen.className = '';
    table.className = 'hidden';
    resetter.className += ' hidden';
    markerHolder.className += ' hidden';
    confirmButton.textContent = 'CONFIRM';
});

//setting event listeners
let loadTime;
window.addEventListener('beforeunload', () => {
    let closeTime = Date.now();
    let milisecondsCounted;
    if(localStorage.hasOwnProperty('milisecondsCounted')){
        milisecondsCounted = Number(localStorage.getItem('milisecondsCounted'));
        milisecondsCounted += closeTime - loadTime;
        localStorage.setItem('milisecondsCounted', String(milisecondsCounted));
    } else if (localStorage.hasOwnProperty('startTime')){
        milisecondsCounted = closeTime - Number(localStorage.getItem('startTime'));
        localStorage.setItem('milisecondsCounted', String(milisecondsCounted));
    }
});
window.addEventListener('load', () => {
    loadTime = Date.now();
})
cells.forEach(cell => cell.asElement.addEventListener('focus', () => cell.clearInput()));
document.addEventListener('keyup', e => {
    if(!winScreenActive){
        let emptyCells = cells.filter(cell => cell.displayValue === 0);
        let emptyCellsAsElements = emptyCells.map(cell => cell.asElement);
        if(e.code.includes('Enter')){
            let nextCell = emptyCellsAsElements[emptyCellsAsElements.indexOf(document.activeElement) + 1];
            
            cells.filter(cell => !cell.asElement.hasAttribute('disabled') && cell.asElement.value !== '').forEach(cell => {
                let mistake = cell.checkInput();
                if(mistake === 0 && nextCell) nextCell.focus();
                let mistakeCounter = Number(localStorage.getItem('mistakeCounter')) + mistake;
                localStorage.setItem('mistakeCounter', String(mistakeCounter));
            });
            
            markerSetter(markers, rows);
            
            if(cells.filter(cell => cell.asElement.hasAttribute('disabled')).length === 81){
                let newpuzzButton = document.getElementById('new_puzzle');
                let endTime = Date.now();
                let miliseconds;
                let milisecondsCounted = Number(localStorage.getItem('milisecondsCounted')) || 0;
                if(milisecondsCounted) 
                miliseconds = milisecondsCounted + (endTime - loadTime);
                else
                miliseconds = endTime - Number(localStorage.getItem('startTime'));
                let minutes = Math.floor(miliseconds/1000/60);
                let minutesFirstDigit = Math.floor(minutes/10);
                let minutesSecondDigit = minutes - minutesFirstDigit*10;
                let seconds = Math.floor((miliseconds - minutes*1000*60)/1000);
                let secondsFirstDigit = Math.floor(seconds/10);
                let secondsSecondDigit = seconds - secondsFirstDigit*10;
                diffScreen.className += ' hidden';
                resetter.className += ' hidden';
                localStorage.removeItem('currentPuzzle');
                localStorage.removeItem('currentSolution');
                localStorage.removeItem('milisecondsCounted');
                winScreen(localStorage.getItem('mistakeCounter'), `${minutesFirstDigit}${minutesSecondDigit}:${secondsFirstDigit}${secondsSecondDigit}`);
                winScreenActive = true;
                localStorage.setItem('puzzlesolved', `${minutesFirstDigit}${minutesSecondDigit}:${secondsFirstDigit}${secondsSecondDigit}`);
                newpuzzButton.addEventListener('click', () => {
                    let screen = document.getElementById('win_screen');
                    screen.className = 'hidden';
                    localStorage.removeItem('permadiff');
                    localStorage.removeItem('currentPuzzle');
                    localStorage.removeItem('currentSolution');
                    localStorage.removeItem('startTime');
                    localStorage.removeItem('mistakeCounter');
                    localStorage.removeItem('milisecondsCounted');
                    localStorage.removeItem('puzzlesolved');
                    localStorage.removeItem('officialString');
                    diffScreen.className = '';
                    table.className = 'hidden';
                    markerHolder.className += ' hidden';
                    confirmButton.textContent = 'CONFIRM';
                });
            }
            localStorage.setItem('currentPuzzle', stringGenerate(cells));
            markerSetter(markers, rows, true);
        } else if(e.code.includes('Backspace' || 'Delete')){
            if(cellsAsElements.includes(document.activeElement)){
                document.activeElement.className = '';
            }
        } else if(e.code.includes('Arrow')){
            let proceed = true;
            if(!cellsAsElements.includes(document.activeElement)){
                emptyCellsAsElements[0].focus();
                proceed = false;
            }

            if(proceed){
                let currentCell = document.activeElement;
                let currentObject = findObjectFromElement(currentCell, cells);
                let currentColumn = emptyCells.filter(cell => cell.colNumber === currentObject.colNumber);
                let currentRow = emptyCells.filter(cell => cell.rowNumber === currentObject.rowNumber);
                let found = false;

                if(e.code.includes('Up')){
                    if(currentColumn[currentColumn.indexOf(currentObject) - 1]){
                        currentColumn[currentColumn.indexOf(currentObject) - 1].asElement.focus();
                    } else {
                        for(let i = currentObject.colNumber + 1; i < 9; i++){
                            let nextColumn = emptyCells.filter(cell => cell.colNumber === i).filter(cell => cell.rowNumber < currentObject.rowNumber);
                            if(nextColumn[0]){
                                nextColumn[0].asElement.focus();
                                found = true;
                                break;
                            }
                        }
                        if(!found){
                            for(let i = currentObject.colNumber - 1; i >= 0; i--){
                                let lastColumn = emptyCells.filter(cell => cell.colNumber === i).filter(cell => cell.rowNumber < currentObject.rowNumber);
                                if(lastColumn[0]){
                                    lastColumn[0].asElement.focus();
                                    break;
                                }
                            }
                        }
                    }
                } else if(e.code.includes('Right')){
                    if(currentRow[currentRow.indexOf(currentObject) + 1]){
                        currentRow[currentRow.indexOf(currentObject) + 1].asElement.focus();
                    } else {
                        for(let i = currentObject.rowNumber  + 1; i < 9; i++){
                            let nextRow = emptyCells.filter(cell => cell.rowNumber === i).filter(cell => cell.colNumber > currentObject.colNumber);
                            if(nextRow[0]){
                                nextRow[0].asElement.focus();
                                found = true;
                                break;
                            }
                        }
                        if(!found){
                            for(let i = currentObject.rowNumber - 1; i >= 0; i--){
                                let lastRow = emptyCells.filter(cell => cell.rowNumber === i).filter(cell => cell.colNumber > currentObject.colNumber);
                                if(lastRow[0]){
                                    lastRow[0].asElement.focus();
                                    break;
                                }
                            }
                        }
                    }
                } else if(e.code.includes('Down')){
                    if(currentColumn[currentColumn.indexOf(currentObject) + 1]){
                        currentColumn[currentColumn.indexOf(currentObject) + 1].asElement.focus();
                    } else {
                        for(let i = currentObject.colNumber  + 1; i < 9; i++){
                            let nextColumn = emptyCells.filter(cell => cell.colNumber === i).filter(cell => cell.rowNumber > currentObject.rowNumber);
                            if(nextColumn[0]){
                                nextColumn[0].asElement.focus();
                                found = true;
                                break;
                            }
                        }
                        if(!found){
                            for(let i = currentObject.colNumber - 1; i >= 0; i--){
                                let lastColumn = emptyCells.filter(cell => cell.colNumber === i).filter(cell => cell.rowNumber > currentObject.rowNumber);
                                if(lastColumn[0]){
                                    lastColumn[0].asElement.focus();
                                    break;
                                }
                            }
                        }
                    }
                } else if(e.code.includes('Left')){
                    if(currentRow[currentRow.indexOf(currentObject) - 1]){
                        currentRow[currentRow.indexOf(currentObject) - 1].asElement.focus();
                    } else {
                        for(let i = currentObject.rowNumber  + 1; i < 9; i++){
                            let nextRow = emptyCells.filter(cell => cell.rowNumber === i).filter(cell => cell.colNumber < currentObject.colNumber);
                            if(nextRow[0]){
                                nextRow[0].asElement.focus();
                                break;
                            }
                        }
                        if(!found){
                            for(let i = currentObject.rowNumber - 1; i >= 0; i--){
                                let lastRow = emptyCells.filter(cell => cell.rowNumber === i).filter(cell => cell.colNumber < currentObject.colNumber);
                                if(lastRow[0]){
                                    lastRow[0].asElement.focus();
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
});

let shareScreenActive = false;
let shareButton = document.getElementById('share');
let shareScreen = document.getElementById('share_screen');
let statsDisplay = document.getElementById('stats_display');
let stringDisplay = document.getElementById('string_display');
let copyStats = document.getElementById('copy_button_1');
let copyString = document.getElementById('copy_button_2');
let newFromShare = document.getElementById('new_from_share');
shareButton.addEventListener('click', () => {
    if(winScreenActive){
        statsDisplay.textContent = `Mistakes: ${localStorage.getItem('mistakeCounter')} // Time Elapsed: ${localStorage.getItem('puzzlesolved')}`;
        stringDisplay.textContent = `${localStorage.getItem('officialString')}`;
        let screen = document.getElementById('win_screen');
        screen.className = 'hidden';
        table.className = 'hidden';
        markerHolder.className += ' hidden';
        shareScreen.className = '';
        shareScreenActive = true;
        copyStats.addEventListener('click', () => {
            navigator.clipboard.writeText(`Mistakes: ${localStorage.getItem('mistakeCounter')} // Time Elapsed: ${localStorage.getItem('puzzlesolved')}`);
            setTimeout(() => {
                alert('Copied your stats to the clipboard!');
            }, 400);
        });
        copyString.addEventListener('click', () => {
            navigator.clipboard.writeText(`${localStorage.getItem('officialString')}`);
            setTimeout(() => {
                alert('Copied the empty puzzle to the clipboard (as an official sudoku string)!');
            }, 400);
        });
        newFromShare.addEventListener('click', () => {
            shareScreen.className = 'hidden';
            shareScreenActive = false;
            localStorage.removeItem('permadiff');
            localStorage.removeItem('currentPuzzle');
            localStorage.removeItem('currentSolution');
            localStorage.removeItem('startTime');
            localStorage.removeItem('mistakeCounter');
            localStorage.removeItem('milisecondsCounted');
            localStorage.removeItem('puzzlesolved');
            localStorage.removeItem('officialString');
            diffScreen.className = '';
            table.className = 'hidden';
            markerHolder.className += ' hidden';
            confirmButton.textContent = 'CONFIRM';
        });
    }
});

//setting colormode button
let modeButton = document.querySelector('.mode-selector');
if(localStorage.getItem('colormode') === 'dark'){
    modeButton.textContent = 'Light Mode';
} else {
    modeButton.textContent = 'Dark Mode';
}
modeButton.addEventListener('click', () => {
    if(localStorage.getItem('colormode') === 'light'){
        //set to dark mode
        localStorage.setItem('colormode', 'dark');
        root.style.setProperty('--main', 'black');
        root.style.setProperty('--second', 'white');
        root.style.setProperty('--alt', '#dfdfdf');
        root.style.setProperty('--greener', '#005000');
        favicon.setAttribute('href', './dark_favicon.ico');
        modeButton.textContent = 'Light Mode'
    } else if(localStorage.getItem('colormode') === 'dark'){
        //set to light mode
        localStorage.setItem('colormode', 'light');
        root.style.setProperty('--main', 'white');
        root.style.setProperty('--second', 'black');
        root.style.setProperty('--alt', '#333');
        root.style.setProperty('--greener', '#009a00');
        favicon.setAttribute('href', './light_favicon.ico');
        modeButton.textContent = 'Dark Mode';
    }
});