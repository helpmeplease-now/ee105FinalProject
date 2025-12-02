// ..\frontend\game2048.js

window.addEventListener("DOMContentLoaded", () => {
    const size = 4;
    let board = [];
    let score = 0;
    let bestScore = 0;
    let gameOver = false;
    let lastGesture = "nothing";
    let isAnimating = false;

    const scoreEl = document.getElementById("score");
    const bestScoreEl = document.getElementById("best-score");
    const statusTextEl = document.getElementById("status-text");
    const overlayEl = document.getElementById("overlay");
    const overlayTextEl = document.getElementById("overlay-text");
    const restartBtn = document.getElementById("restart-btn");

    function initBoard() {
        board = [];
        for (let r = 0; r < size; r++) {
            const row = [];
            for (let c = 0; c < size; c++) {
                row.push(0);
            }
            board.push(row);
        }
    }

    function getEmptyCells() {
        const empty = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (board[r][c] === 0) {
                    empty.push({ r, c });
                }
            }
        }
        return empty;
    }

    function addRandomTile() {
        const empty = getEmptyCells();
        if (empty.length === 0) return;
        const { r, c } = empty[Math.floor(Math.random() * empty.length)];
        board[r][c] = Math.random() < 0.9 ? 2 : 4;
    }

    function updateScore() {
        scoreEl.textContent = score;
        if (score > bestScore) {
            bestScore = score;
            bestScoreEl.textContent = bestScore;
        }
    }

    function updateStatus(text) {
        statusTextEl.textContent = text;
    }

    function showOverlay(text) {
        overlayTextEl.textContent = text;
        overlayEl.classList.remove("hidden");
    }

    function hideOverlay() {
        overlayEl.classList.add("hidden");
    }

    function renderBoard() {
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const tile = document.getElementById(`tile-${r}-${c}`);
                if (!tile) continue;
                const val = board[r][c];
                tile.textContent = val === 0 ? "" : val;
                tile.className = "tile";
                if (val > 0) {
                    tile.classList.add(`tile-${val}`);
                } else {
                    tile.classList.add("tile-empty");
                }
                tile.style.transform = "";
            }
        }
    }

    function compressAndMerge(line) {
        const nums = line.filter(v => v !== 0);
        const result = [];
        let gained = 0;
        let i = 0;
        while (i < nums.length) {
            if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
                const merged = nums[i] * 2;
                result.push(merged);
                gained += merged;
                i += 2;
            } else {
                result.push(nums[i]);
                i += 1;
            }
        }
        while (result.length < size) {
            result.push(0);
        }
        return { line: result, gained };
    }

    function moveLeftBoard(b) {
        let moved = false;
        let totalGained = 0;
        const newBoard = [];

        for (let r = 0; r < size; r++) {
            const row = b[r];
            const { line, gained } = compressAndMerge(row);
            newBoard.push(line);
            totalGained += gained;
            for (let c = 0; c < size; c++) {
                if (line[c] !== row[c]) moved = true;
            }
        }
        return { board: newBoard, moved, gained: totalGained };
    }

    function reverseRow(row) {
        return [...row].reverse();
    }

    function transpose(b) {
        const t = [];
        for (let c = 0; c < size; c++) {
            const col = [];
            for (let r = 0; r < size; r++) {
                col.push(b[r][c]);
            }
            t.push(col);
        }
        return t;
    }

    function moveRightBoard(b) {
        const reversed = b.map(row => reverseRow(row));
        const { board: movedBoard, moved, gained } = moveLeftBoard(reversed);
        return {
            board: movedBoard.map(row => reverseRow(row)),
            moved,
            gained
        };
    }

    function moveUpBoard(b) {
        const t = transpose(b);
        const { board: movedT, moved, gained } = moveLeftBoard(t);
        return {
            board: transpose(movedT),
            moved,
            gained
        };
    }

    function moveDownBoard(b) {
        const t = transpose(b);
        const { board: movedT, moved, gained } = moveRightBoard(t);
        return {
            board: transpose(movedT),
            moved,
            gained
        };
    }

    function anyMovesAvailable() {
        if (getEmptyCells().length > 0) return true;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const val = board[r][c];
                if (r + 1 < size && board[r + 1][c] === val) return true;
                if (c + 1 < size && board[r][c + 1] === val) return true;
            }
        }
        return false;
    }

    function checkWin() {
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (board[r][c] >= 2048) return true;
            }
        }
        return false;
    }

    function cloneBoard(b) {
        return b.map(row => [...row]);
    }

    function computeLinearMoves(oldArr, newArr) {
        const fromIdx = [];
        const toIdx = [];
        for (let i = 0; i < size; i++) {
            if (oldArr[i] !== 0) fromIdx.push(i);
            if (newArr[i] !== 0) toIdx.push(i);
        }
        const moves = [];
        let p = 0;
        for (let j = 0; j < toIdx.length; j++) {
            const dest = toIdx[j];
            const destVal = newArr[dest];
            if (p >= fromIdx.length) break;

            const firstIndex = fromIdx[p];
            const firstVal = oldArr[firstIndex];

            if (destVal === firstVal) {
                moves.push({ fromIndex: firstIndex, toIndex: dest });
                p += 1;
            } else if (p + 1 < fromIdx.length) {
                const secondIndex = fromIdx[p + 1];
                const secondVal = oldArr[secondIndex];
                if (firstVal === secondVal && destVal === firstVal + secondVal) {
                    moves.push({ fromIndex: firstIndex, toIndex: dest });
                    moves.push({ fromIndex: secondIndex, toIndex: dest });
                    p += 2;
                } else {
                    moves.push({ fromIndex: firstIndex, toIndex: dest });
                    p += 1;
                }
            } else {
                moves.push({ fromIndex: firstIndex, toIndex: dest });
                p += 1;
            }
        }
        return moves;
    }

    function computeMoves(oldBoard, newBoard, direction) {
        const moves = [];
        if (direction === "left") {
            for (let r = 0; r < size; r++) {
                const rowMoves = computeLinearMoves(oldBoard[r], newBoard[r]);
                rowMoves.forEach(m => {
                    moves.push({
                        fromR: r,
                        fromC: m.fromIndex,
                        toR: r,
                        toC: m.toIndex
                    });
                });
            }
        } else if (direction === "right") {
            for (let r = 0; r < size; r++) {
                const oldRev = [...oldBoard[r]].reverse();
                const newRev = [...newBoard[r]].reverse();
                const rowMoves = computeLinearMoves(oldRev, newRev);
                rowMoves.forEach(m => {
                    const fromC = size - 1 - m.fromIndex;
                    const toC = size - 1 - m.toIndex;
                    moves.push({
                        fromR: r,
                        fromC: fromC,
                        toR: r,
                        toC: toC
                    });
                });
            }
        } else if (direction === "up") {
            for (let c = 0; c < size; c++) {
                const oldCol = [];
                const newCol = [];
                for (let r = 0; r < size; r++) {
                    oldCol.push(oldBoard[r][c]);
                    newCol.push(newBoard[r][c]);
                }
                const colMoves = computeLinearMoves(oldCol, newCol);
                colMoves.forEach(m => {
                    moves.push({
                        fromR: m.fromIndex,
                        fromC: c,
                        toR: m.toIndex,
                        toC: c
                    });
                });
            }
        } else if (direction === "down") {
            for (let c = 0; c < size; c++) {
                const oldCol = [];
                const newCol = [];
                for (let r = 0; r < size; r++) {
                    oldCol.push(oldBoard[r][c]);
                    newCol.push(newBoard[r][c]);
                }
                const oldRev = [...oldCol].reverse();
                const newRev = [...newCol].reverse();
                const colMoves = computeLinearMoves(oldRev, newRev);
                colMoves.forEach(m => {
                    const fromR = size - 1 - m.fromIndex;
                    const toR = size - 1 - m.toIndex;
                    moves.push({
                        fromR: fromR,
                        fromC: c,
                        toR: toR,
                        toC: c
                    });
                });
            }
        }
        return moves;
    }

    function animateMove(oldBoard, newBoard, direction, gained) {
        const moves = computeMoves(oldBoard, newBoard, direction);
        const step = 92; // 80px tile + 2*6px margin

        moves.forEach(m => {
            const tile = document.getElementById(`tile-${m.fromR}-${m.fromC}`);
            if (!tile) return;
            const dx = (m.toC - m.fromC) * step;
            const dy = (m.toR - m.fromR) * step;
            tile.style.transform = `translate(${dx}px, ${dy}px)`;
        });

        setTimeout(() => {
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const tile = document.getElementById(`tile-${r}-${c}`);
                    if (tile) tile.style.transform = "";
                }
            }

            board = newBoard;
            score += gained;
            updateScore();
            addRandomTile();
            renderBoard();

            if (checkWin()) {
                updateStatus("You made 2048! Keep going or restart.");
                showOverlay("You win!");
                gameOver = true;
                isAnimating = false;
                return;
            }

            if (!anyMovesAvailable()) {
                gameOver = true;
                updateStatus("No more moves.");
                showOverlay("Game over!");
            }

            isAnimating = false;
        }, 140);
    }

    function applyMove(direction) {
        if (gameOver || isAnimating) return;
        const oldBoard = cloneBoard(board);

        let result;
        if (direction === "left") {
            result = moveLeftBoard(board);
        } else if (direction === "right") {
            result = moveRightBoard(board);
        } else if (direction === "up") {
            result = moveUpBoard(board);
        } else if (direction === "down") {
            result = moveDownBoard(board);
        } else {
            return;
        }

        if (!result.moved) return;

        isAnimating = true;
        animateMove(oldBoard, result.board, direction, result.gained);
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
            applyMove("left");
        } else if (e.key === "ArrowRight") {
            applyMove("right");
        } else if (e.key === "ArrowUp") {
            applyMove("up");
        } else if (e.key === "ArrowDown") {
            applyMove("down");
        }
    });

    restartBtn.addEventListener("click", () => {
        resetGame();
    });

    async function pollGesture() {
        try {
            const res = await fetch("http://127.0.0.1:5000/gesture");
            const data = await res.json();
            const g = data.gesture;

            if (g && g !== lastGesture) {
                if (g === "up") applyMove("up");
                if (g === "down") applyMove("down");
                if (g === "left") applyMove("left");
                if (g === "right") applyMove("right");
            }
            lastGesture = g || "nothing";
        } catch (e) {
        }
    }

    function resetGame() {
        gameOver = false;
        score = 0;
        initBoard();
        addRandomTile();
        addRandomTile();
        hideOverlay();
        updateStatus("Use gestures or arrow keys to play.");
        renderBoard();
        updateScore();
    }

    resetGame();
    setInterval(pollGesture, 120);
});
