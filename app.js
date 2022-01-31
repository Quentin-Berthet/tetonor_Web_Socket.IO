#!/usr/bin/env node

const express = require('express');
const path = require('path');
const http = require('http');
const socket = require('socket.io');

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP and Socket server.
 */
const server = http.createServer(app);
const io = socket(server);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string' ?
        'Pipe ' + port :
        'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string' ?
        'pipe ' + addr :
        'port ' + addr.port;
}

// https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Math/random
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// https://stackoverflow.com/a/12646864
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array
}

let game = {};
let numberOfPlayers = 0;
const MAX_PLAYERS = 2;
const NB_NUMBERS_TO_GUESS_FOR_EACH_OPERATION = 6;

function findAllAdditionsFor(number, numbers) {
    let possibilities = [];
    for (let i = 0; i < numbers.length; i++) {
        for (let j = 0; j < numbers.length; j++) {
            if (i !== j && numbers[i] + numbers[j] === number) {
                possibilities.push([numbers[i], numbers[j]]);
            }
        }
    }
    console.log(`Possibilities (add) for ${number}, with numbers ${numbers} = ${possibilities}`);
    return possibilities;
}

function findAllMultiplicationsFor(number, numbers) {
    let possibilities = [];
    for (let i = 0; i < numbers.length; i++) {
        for (let j = 0; j < numbers.length; j++) {
            if (i !== j && numbers[i] * numbers[j] === number) {
                possibilities.push([numbers[i], numbers[j]]);
            }
        }
    }
    console.log(`Possibilities (mul) for ${number}, with numbers ${numbers} = ${possibilities}`);
    return possibilities;
}

function gameCanContinue() {
    if (game.grid.numbers.length === 0) {
        return false;
    }
    for (const number of game.grid.results.additions) {
        if (number !== undefined && findAllAdditionsFor(number, game.grid.numbers).length > 0) {
            return true;
        }
    }
    for (const number of game.grid.results.multiplications) {
        if (number !== undefined && findAllMultiplicationsFor(number, game.grid.numbers).length > 0) {
            return true;
        }
    }
    return false;
}

/**
 * Event listener for Socket server "connection" event.
 */
function generateGame() {
    let additionNumber = [];
    let additions = [];
    for (let i = 0; i < NB_NUMBERS_TO_GUESS_FOR_EACH_OPERATION; i++) {
        const left = getRandomIntInclusive(1, 10);
        const right = getRandomIntInclusive(1, 10);
        additions.push(left);
        additions.push(right);
        additionNumber.push(left + right);
    }
    let multiplicationNumbers = [];
    let multiplications = [];
    for (let i = 0; i < NB_NUMBERS_TO_GUESS_FOR_EACH_OPERATION; i++) {
        const left = getRandomIntInclusive(1, 10);
        const right = getRandomIntInclusive(1, 10);
        multiplications.push(left);
        multiplications.push(right);
        multiplicationNumbers.push(left * right);
    }
    return {
        "scores": {
            "1": 0,
            "2": 0
        },
        "grid": {
            "results": {
                "additions": additionNumber,
                "multiplications": multiplicationNumbers
            },
            "numbers": shuffleArray(additions.concat(multiplications))
        }
    };
}

let dragAndDropCells = {};
const dropActions = {
    IN_OPERAND: "inOperand",
    IN_GRID_NUMBERS: "inGridNumbers"
};
const operations = {
    ADD: "add",
    MUL: "mul"
};

function removeFirstOccurrenceInNumbersArray(number) {
    const idx = game.grid.numbers.findIndex(value => value === number);
    game.grid.numbers.splice(idx, 1);
}

function verifyComputation(data) {
    let result = undefined;
    let resultsNumbers = undefined;
    switch (data.operation) {
        case operations.ADD:
            if (game.grid.results.additions[data.indexNumber] === data.number) {
                result = data.leftOperand + data.rightOperand;
                resultsNumbers = game.grid.results.additions;
            }
            break;
        case operations.MUL:
            if (game.grid.results.multiplications[data.indexNumber] === data.number) {
                result = data.leftOperand * data.rightOperand;
                resultsNumbers = game.grid.results.multiplications;
            }
            break;
        default:
            break;
    }
    if (data.number === result) {
        resultsNumbers[data.indexNumber] = undefined;
        removeFirstOccurrenceInNumbersArray(data.leftOperand);
        removeFirstOccurrenceInNumbersArray(data.rightOperand);
        game.scores[data.playerId] += 1;
        io.emit("validatedComputation", {
            "leftOperandId": data.leftOperandId,
            "rightOperandId": data.rightOperandId,
            "scores": game.scores
        });
        if (!gameCanContinue()) {
            let winner = undefined;
            winner = game.scores["1"] > game.scores["2"] ? 1 : 2
            io.emit("gameFinished", {
                "winner": winner,
                "scores": game.scores
            });
        }
    } else {
        io.emit("droppedNumber", [{
            "action": dropActions.IN_GRID_NUMBERS,
            "dragCellId": data.leftOperandId,
            "dropCellId": dragAndDropCells[data.leftOperandId]
        }, {
            "action": dropActions.IN_GRID_NUMBERS,
            "dragCellId": data.rightOperandId,
            "dropCellId": dragAndDropCells[data.rightOperandId]
        }]);
    }
}

io.on('connect', socket => {
    numberOfPlayers += 1;
    socket.emit("getPlayerId", numberOfPlayers);
    if (numberOfPlayers === MAX_PLAYERS) {
        game = generateGame();
        io.emit("startGame", game);
    }
    socket.on("droppedNumber", data => {
        dragAndDropCells[data.dropCellId] = data.dragCellId;
        socket.broadcast.emit("droppedNumber", [data]);
    });
    socket.on("verifyComputation", verifyComputation);
    socket.on('disconnect', function () {
        numberOfPlayers = 0;
        game = {};
        io.emit("adversaryDisconnected");
    });
});
