const socket = io('ws://localhost:3000');

let playerId = 0;

const dropActions = {
    IN_OPERAND: "inOperand",
    IN_GRID_NUMBERS: "inGridNumbers"
};

const operations = {
    ADD: "add",
    MUL: "mul"
};

function showScores(scores) {
    $("#yourScore").html(`${scores[playerId]}`);
    $("#adversaryScore").html(`${scores[playerId === 1 ? 2 : 1]}`);
}

socket.on('connect', () => {
    console.log("Player connected...")
});

socket.on('getPlayerId', (data) => {
    playerId = data;
    console.log(`I am player ${playerId}...`);
});

socket.on("adversaryDisconnected", () => {
    window.location.href += "adversary-disconnected.html";
});

socket.on("gameFinished", data => {
    sessionStorage.setItem("winner", data.winner);
    sessionStorage.setItem("scores", JSON.stringify(data.scores));
    sessionStorage.setItem("playerId", playerId);
    window.location.href += "finish.html";
});

socket.on("validatedComputation", data => {
    console.log("Computation has been validated...")

    /* Disabling drag and drop for the two operands */
    const leftOperand = $(`#${data.leftOperandId}`);
    const rightOperand = $(`#${data.rightOperandId}`);

    leftOperand.css("backgroundColor", "lightgreen");
    leftOperand.prop("draggable", false);
    leftOperand.off("dragover");
    leftOperand.off("drop");

    rightOperand.css("backgroundColor", "lightgreen");
    rightOperand.prop("draggable", false);
    rightOperand.off("dragover");
    rightOperand.off("drop");

    showScores(data.scores);
});

socket.on("droppedNumber", data => {
    console.log("Number(s) has been dropped...")
    data.forEach((value) => {
        const dragCell = $(`#${value.dragCellId}`);
        const dropCell = $(`#${value.dropCellId}`);
        dragAndDrop(dragCell, dropCell);
    });
});

function dragAndDrop(dragCell, dropCell) {
    /* Swap number */
    dropCell.text(dragCell.text());
    dragCell.text("");

    /* Swap behavior, you can now retrieve the number to the original place. */
    dropCell.prop("draggable", true);
    dropCell.off("dragover");
    dropCell.off("drop");
    dropCell.on("dragstart", dragNumberEvent);

    dragCell.on("dragover", e => e.preventDefault());
    dragCell.on("drop", dropNumberEvent);
    dragCell.prop("draggable", false);
}

function dragNumberEvent(e) {
    e.originalEvent.dataTransfer.setData("text", e.target.id);
}

function dropNumberEvent(e) {
    e.preventDefault();
    const dragCellId = e.originalEvent.dataTransfer.getData("text");
    const dragCell = $(`#${dragCellId}`);
    const dropCell = $(`#${e.target.id}`);

    dragAndDrop(dragCell, dropCell)

    const action = dragCellId.indexOf("gridNumbers") === -1 ? dropActions.IN_OPERAND : dropActions.IN_GRID_NUMBERS;

    /* Send to the server that a number has moved */
    socket.emit("droppedNumber", {
        "action": action,
        "dragCellId": dragCellId,
        "dropCellId": e.target.id
    });

    /* If the two operands are filled, we send a message to the server to verify the computation */
    if (action === dropActions.IN_OPERAND) {
        const numberId = e.target.id.replace(/Left|Right/, "");
        const number = parseInt($(`#${numberId}`).text());
        const leftOperand = parseInt($(`#${numberId}Left`).text());
        const rightOperand = parseInt($(`#${numberId}Right`).text());
        /*
         * 1. Get the parent of the operand
         * 2. From the parent, get the children with ".operations" class
         * 3. Get the operation data to determine if it's an addition or a multiplication
         * */
        const operation = $(`#${numberId}Left`).closest(".pbCalc").children(".operations").first().data("operation");
        if (!isNaN(leftOperand) && !isNaN(rightOperand)) {
            socket.emit("verifyComputation", {
                "operation": operation,
                "number": number,
                "indexNumber": parseInt(numberId.match(/(\d+)/)[1]),
                "leftOperand": leftOperand,
                "rightOperand": rightOperand,
                "leftOperandId": `${numberId}Left`,
                "rightOperandId": `${numberId}Right`,
                "playerId": playerId
            });
        }
    }
}

function initDragAndDrop() {
    $(".operands").on("dragover", e => {
        e.preventDefault();
    });
    $(".operands").on("drop", dropNumberEvent);
    $(".gridNumbers").on("dragstart", dragNumberEvent);
}

socket.on('startGame', data => {
    console.log("Starting game...");
    data.grid.results.additions.forEach(((value, index) => {
        $(`#additionsNumber${index}`).text(`${value}`);
    }));
    data.grid.results.multiplications.forEach(((value, index) => {
        $(`#multiplicationsNumber${index}`).text(`${value}`);

    }));
    let numbers = data.grid.numbers;
    numbers.forEach((value, index) => {
        $(`#gridNumber${index}`).text(value);
    });
    $("#waitingPage").hide();
    $("#gamePage").show();
    showScores(data.scores);
    initDragAndDrop();
});
