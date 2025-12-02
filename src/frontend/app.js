// ..\frontend\app.js

const connScreen = document.getElementById("connection-screen");
const mainScreen = document.getElementById("main-screen");
const connStatus = document.getElementById("conn-status");
const retryBtn = document.getElementById("retry-btn");
const gestureLabel = document.getElementById("gesture-label");
const confFill = document.getElementById("conf-fill");
const confText = document.getElementById("conf-text");
const logBox = document.getElementById("log");

const gestureToArrow = {
    up: "↑",
    down: "↓",
    left: "←",
    right: "→",
    nothing: "."
};

let lastNonNothingGesture = "nothing";
let lastGestureTime = 0;
const HANG_MS = 635;

function showConn() {
    connScreen.classList.add("visible");
    mainScreen.classList.remove("visible");
}

function showMain() {
    connScreen.classList.remove("visible");
    mainScreen.classList.add("visible");
}

async function poll() {
    try {
        const res = await fetch("http://127.0.0.1:5000/gesture");
        const data = await res.json();

        showMain();

        const g = data.gesture;
        if (g && g !== "nothing") {
            lastNonNothingGesture = g;
            lastGestureTime = Date.now();
        }

        let displayGesture = "nothing";
        if (g && g !== "nothing") {
            displayGesture = g;
        } else {
            const now = Date.now();
            if (now - lastGestureTime < HANG_MS) {
                displayGesture = lastNonNothingGesture;
            } else {
                displayGesture = "nothing";
            }
        }

        gestureLabel.textContent = gestureToArrow[displayGesture] || ".";

        const prox = Number(data.proximity) || 0;
        confText.textContent = "Proximity: " + prox.toFixed(1);

        const pct = Math.min(100, (prox / 10) * 100);
        confFill.style.width = pct + "%";

    } catch {
        showConn();
        connStatus.textContent = "Reconnecting...";
    }
}

setInterval(poll, 80);
retryBtn.onclick = poll;