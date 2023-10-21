function Game2048() {
    const TILE_SIZE = 100;
    const MAX_STYLED_VALUE = 4096;
    const LAST_STYLED_CLASS = 'x8192';

    const SETTINGS = 'settings';
    const DEFAULT_SETTINGS = { best: 0, nextGoal: 0, rows: 4, columns: 4, soundOn: true };

    let game;
    let settings;
    let audio;

    window.onload = function() {
        initGame();

        getNewGameButtonElement().addEventListener('click', startNewGame);
        getSoundToggleElement().addEventListener('click', toggleSound);
    }

    function initKeyUpEventListener() {
        document.addEventListener('keyup', onKeyUp);
    }

    function removeKeyUpEventListener() {
        document.removeEventListener('keyup', onKeyUp);
    }

    function onKeyUp(event) {
        switch (event.code) {
            case 'ArrowLeft': 
            case 'ArrowRight':
            case 'ArrowUp':
            case 'ArrowDown':
                slideTiles(event.code);
                return;
            default:
                return;
        }
    }

    function initGame() {
        settings = loadSettings();
        getSoundToggleElement().checked = !!settings.soundOn;

        game = new Game(settings.rows, settings.columns);

        createMenu();
        createBoard();
        createTiles();

        getHighscoreElement().innerText = settings.best;

        showNextGoal();

        initKeyUpEventListener();
    }

    function initAudio() {
        audio = new GameAudio(settings.soundOn);
        audio.load();
    }

    function toggleSound() {
        const soundOn = !!getSoundToggleElement().checked;
        settings.soundOn = soundOn;
        
        if (audio) {
            audio.soundOn = soundOn;
        }

        saveSettings({ ...settings, soundOn });
    }

    function startNewGame() {
        hideMenu();
        
        initGame();
        initAudio();

        updateScore();

        addRandomTile();
        addRandomTile();
    }

    function gameOver() {
        updateSettingsScore();
        
        audio.playGameOver();

        showFinalScore();
        showGameOverMenu();

        removeKeyUpEventListener();
    }

    function showFinalScore() {
        const finalScore = document.getElementById('final-score');

        finalScore.innerText = `Score: ${game.score}`;
        finalScore.style.display = 'flex';
    }

    function showGameOverMenu() {
        getNewGameButtonElement().innerText = 'Try again';

        getGameOverElement().style.display = 'flex';
        getMenuElement().style.display = 'flex';
    }

    function hideMenu() {
        getMenuElement().style.display = 'none';
        getGameOverElement().style.display = 'none';
    }

    function loadSettings() {
        const config = localStorage.getItem(SETTINGS);
        return config ? JSON.parse(config) : { ...DEFAULT_SETTINGS };
    }

    function saveSettings(settings) {
        localStorage.setItem(SETTINGS, JSON.stringify(settings));
    }

    function updateSettingsScore() {
        const best = Math.max(game.score, settings.best);
        const nextGoal = Math.max(settings.nextGoal, game.getMaxValue() * 2);

        saveSettings({ ...settings, best, nextGoal });
    }

    function createMenu() {
        const menu = getMenuElement();

        menu.style.width = `${TILE_SIZE * settings.columns}px`;
        menu.style.height = `${TILE_SIZE * settings.rows}px`;
    }

    function createBoard() {
        const tilesBoard = getBoardElement();
        tilesBoard.innerHTML = '';

        tilesBoard.style.width = `${TILE_SIZE * settings.columns}px`;
        tilesBoard.style.height = `${TILE_SIZE * settings.rows}px`;
    }

    function createTiles() {
        const tilesBoard = getBoardElement();

        for (let row = 0; row < settings.rows; row++) {
            for (let column = 0; column < settings.columns; column++) {
                let tile = document.createElement('div');
                tile.id = `${row}-${column}`;

                const { value: num } = game.getValueAt(row, column);
                updateTileStyle(tile, num);

                tilesBoard.append(tile);
            }
        }
    }

    function showNextGoal() {
        if (!settings.nextGoal) {
            return;
        }

        const nextGoalElement = getNextGoalElement();
        nextGoalElement.innerText = settings.nextGoal;
        nextGoalElement.parentElement.style.display = 'flex';
    }

    function slideTiles(direction) {
        const boardUpdated = game.slideTiles(direction);

        if (boardUpdated) {
            updateScore();
            updateBoard();
        
            addRandomTile();
        }

        if (game.isGameOver()) {
            gameOver();
        }
    }

    function addRandomTile() {
        const tile = game.addRandomTile();

        if (tile === undefined) {
            return;
        }

        const { row, column } = tile;

        updateTile(row, column);
        animateTileScale(getTileElement(row, column));
    }

    function updateBoard() {
        for (let row = 0; row < settings.rows; row++) {
            for (let column = 0; column < settings.columns; column++) {
                updateTile(row, column);
            }
        }
    }

    function updateTile(row, column) {
        const tile = getTileElement(row, column);
        const { value: number, updated } = game.getValueAt(row, column);

        updateTileStyle(tile, number);

        if (updated) {
            animateTileScale(tile);
        }
    }

    function updateTileStyle(tile, number) {
        tile.innerText = '';
        tile.classList.value = '';
        tile.classList.add('tile');

        if (!number) {
            return;
        }

        tile.innerText = number;
        
        let tileClass = number <= MAX_STYLED_VALUE ? `x${number}` : LAST_STYLED_CLASS;
        tile.classList.add(tileClass);
    }

    function animateTileScale(tile) {
        tile.animate([
            { opacity: 0, transform: 'scale(0.8)' },
            { opacity: 0.7, transform: 'scale(1.1)' },
            { opacity: 1, transform: 'scale(1.0)' }
        ], 500);
    }

    function updateScore() {
        const score = document.getElementById('score');

        const prevScoreValue = score.innerText ? Number(score.innerText) : 0;

        if (prevScoreValue !== game.score) {
            audio.playScore();

            updateScoreValue(score, game.score);

            if (settings.best < game.score) {
                updateScoreValue(getHighscoreElement(), game.score);
            }

            const maxValue = game.getMaxValue();

            if (settings.nextGoal && settings.nextGoal === maxValue) {
                updateNextGoal(maxValue * 2)
            }
        } else {
            audio.playMove();
        }
    }

    function updateNextGoal(nextGoal) {
        const nextGoalElement = getNextGoalElement();
        nextGoalElement.innerText = nextGoal;

        nextGoalElement.animate([
            { transform: 'scale(0.8)' },
            { transform: 'scale(1.1)' },
            { transform: 'scale(1.0)' }
        ], 500);

        saveSettings({ ...settings, nextGoal });
        settings.nextGoal = nextGoal;
    }

    function updateScoreValue(element, value) {
        element.innerText = value;
        element.animate([
            { transform: 'scale(0.8)' },
            { transform: 'scale(1.1)' },
            { transform: 'scale(1.0)' }
        ], 500);
    }

    function getBoardElement() {
        return document.getElementById('board');
    }

    function getTileElement(row, column) {
        return document.getElementById(`${row}-${column}`);
    }

    function getNewGameButtonElement() {
        return document.getElementById('new-game');
    }

    function getMenuElement() {
        return document.getElementById('menu');
    }

    function getGameOverElement() {
        return document.getElementById('game-over');
    }

    function getHighscoreElement() {
        return document.getElementById('highscore');
    }

    function getNextGoalElement() {
        return document.getElementById('next-goal');
    }

    function getSoundToggleElement() {
        return document.getElementById('sound-toggle');
    }
}