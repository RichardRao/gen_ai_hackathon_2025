// /home/richard/workspace/gen_ai_hackathon_2025/product/client.js
// const io = require('socket.io-client');
// const socket = io(); // Assuming you're using Socket.IO for real-time communication
// DOM Elements
const roleSelection = document.getElementById('role');
const canvasContainer = document.getElementById('canvasContainer');
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

// Variables
let isDrawing = false;
let role = null;

// Role Selection
roleSelection.onchange = function() {
    console.log('test');
    const role = roleSelection.value;
    // canvasContainer = document.getElementById('canvasContainer');
    if (role === 'child') {
        canvasContainer.style.display = 'block';
        enableDrawing();
    } else {
        canvasContainer.style.display = 'none';
        disableDrawing();
    }
}

document.getElementById('clearButton').onclick = function() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // sendClearCanvas();
}

// Drawing Logic
function enableDrawing() {
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
}

function disableDrawing() {
    canvas.removeEventListener('mousedown', startDrawing);
    canvas.removeEventListener('mousemove', draw);
    canvas.removeEventListener('mouseup', stopDrawing);
    canvas.removeEventListener('mouseout', stopDrawing);
}

function startDrawing(e) {
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
}

function draw(e) {
    if (!isDrawing) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    // sendDrawingData({ x: e.offsetX, y: e.offsetY });
}

function stopDrawing() {
    isDrawing = false;
    ctx.closePath();
}

// // Send Drawing Data to Server
// function sendDrawingData(point) {
//     if (role === 'child') {
//         socket.emit('drawing', point);
//     }
// }

// // Receive Drawing Data from Server
// socket.on('drawing', (point) => {
//     if (role === 'parent') {
//         ctx.lineTo(point.x, point.y);
//         ctx.stroke();
//     }
// });