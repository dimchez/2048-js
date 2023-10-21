const EMPTY_TILE_VALUE = 0;
const MIN_TILE_VALUE = 2;

class Game {
    #board;
    #updated;
    #rows;
    #columns;
    #score;

    constructor(rows, columns) {
        this.#rows = rows;
        this.#columns = columns;

        this.#board = new Array(rows).fill(0)
            .map(() => new Array(columns).fill(0));
        this.#updated = {};

        this.#score = 0;
    }

    get score() {
        return this.#score;
    }

    getValueAt(row, column) {
        if (row >= this.#rows || column >= this.#columns) {
            return;
        }

        const key = getRowColumnKey(row, column);
        return { value: this.#board[row][column], updated: !!this.#updated[key] };
    }

    slideTiles(direction) {
        this.#updated = {};

        if (direction === 'ArrowLeft') { 
            return this.#slideLeft();
        } else if (direction === 'ArrowRight') {
            return this.#slideRight();
        } else if (direction === 'ArrowUp') {
            return this.#slideUp();
        } else if (direction === 'ArrowDown') {
            return this.#slideDown();
        }
    }

    addRandomTile() {
        if (!this.#hasEmptyTiles()) {
            return;
        }

        let row, column;
    
        while(row === undefined && column === undefined) {
            let r = Math.floor(Math.random() * this.#rows);
            let c = Math.floor(Math.random() * this.#columns);

            if (this.#board[r][c] === EMPTY_TILE_VALUE) {
                this.#board[r][c] = MIN_TILE_VALUE;

                row = r;
                column = c;
            }
        }

        return { row, column };
    }

    isGameOver() {
        for (let row = 0; row < this.#rows; row ++) {
            for (let column = 0; column < this.#columns; column++) {
                const hasNextRow = row < this.#rows - 1;
                const hasNextColumn = column < this.#columns - 1;

                const isTileEmpty = this.#board[row][column] === EMPTY_TILE_VALUE;

                const isRightTileEqual = hasNextColumn ? this.#board[row][column] === this.#board[row][column + 1] : false;
                const isLowerTileEqual = hasNextRow ? this.#board[row][column] === this.#board[row + 1][column] : false;

                if (isTileEmpty || isRightTileEqual || isLowerTileEqual) {
                    return false;
                }
            }
        }

        return true;
    }

    getMaxValue() {
        const maxValues = [];

        for (let row = 0; row < this.#rows; row++) {
            maxValues.push(Math.max(...this.#board[row]));
        }

        return Math.max(...maxValues);
    }

    #hasEmptyTiles() {
        for (let row = 0; row < this.#rows; row++) {
            const emptyTileIndex = this.#board[row].findIndex(value => value === EMPTY_TILE_VALUE);

            if (emptyTileIndex !== -1) {
                return true;
            }
        }
    
        return false;
    }

    #slideLeft() {
        let boardUpdated = false;

        for (let r = 0; r < this.#rows; r++) {
            let row = [...this.#board[r]];
    
            if (!canSlide(row)) {
                continue;
            }
            
            row = this.#slide(row);
            boardUpdated = true;

            this.#saveUpdatedRowValues(row, r);

            this.#board[r] = row.map(item => item.value);
        }

        return boardUpdated;
    }

    #slideRight() {
        let boardUpdated = false;

        for (let r = 0; r < this.#rows; r++) {
            let row = [...this.#board[r]];
    
            row.reverse();
            
            if (!canSlide(row)) {
                continue;
            }
    
            row = this.#slide(row);
            boardUpdated = true;
            
            row.reverse();

            this.#saveUpdatedRowValues(row, r);

            this.#board[r] = row.map(item => item.value);
        }

        return boardUpdated;
    }
    
    #slideUp() {
        let boardUpdated = false;

        for (let i = 0; i < this.#columns; i++) {
            let column = this.#getColumn(i);

            if (!canSlide(column)) {
                continue;
            }

            column = this.#slide(column);
            boardUpdated = true;

            this.#updateColumnValues(column, i);
        }

        return boardUpdated;
    }
    
    #slideDown() {
        let boardUpdated = false;

        for (let i = 0; i < this.#columns; i++) {
            let column = this.#getColumn(i);

            column.reverse();

            if (!canSlide(column)) {
                continue;
            }

            column = this.#slide(column);
            boardUpdated = true;
    
            column.reverse();

            this.#updateColumnValues(column, i);
        }

        return boardUpdated;
    }

    #slide(row) {
        let values = row.map(value => ({ value, updated: false }));
        
        values = filterEmptyTiles(values);
    
        for (let i = 0; i < values.length - 1; i++) {
            if (values[i].value === values[i+1].value) {
                values[i].value *= 2;
                values[i].updated = true;
                
                values[i+1].value = EMPTY_TILE_VALUE;
    
                this.#score += values[i].value;
            }
        }
    
        values = filterEmptyTiles(values);
    
        while(values.length < this.#columns) {
            values.push({ value: EMPTY_TILE_VALUE, updated: false });
        }
    
        return values;
    }
    
    #getColumn(index) {
        let column = [];
    
        for (let r = 0; r < this.#rows; r++) {
            column.push(this.#board[r][index]);
        }
    
        return column;
    }

    #updateColumnValues(column, index) {
        for (let r = 0; r < this.#rows; r++) {
            if (column[r].updated) {
                const key = getRowColumnKey(r, index);
                this.#updated[key] = true;
            }

            this.#board[r][index] = column[r].value;
        }
    }

    #saveUpdatedRowValues(row, index) {
        row.forEach((item, i) => {
            if (item.updated) {
                const key = getRowColumnKey(index, i);
                this.#updated[key] = true;
            }
        });
    }
}

function canSlide(row) {
    for (let i = 0; i < row.length - 1; i++) {
        const hasNextValue = row[i] === 0 && row[i + 1] !== 0;
        const isNextValueEqual = row[i] !== 0 && row[i] === row[i+1];

        if (hasNextValue || isNextValueEqual) {
            return true;
        }
    }

    return false;
}

function filterEmptyTiles(row) {
    return row.filter(({ value }) => value !== EMPTY_TILE_VALUE);
}

function getRowColumnKey(row, column) {
    return `${row}:${column}`;
}