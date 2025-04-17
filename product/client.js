// /home/richard/workspace/gen_ai_hackathon_2025/product/client.js
// const io = require('socket.io-client');
// const socket = io(); // Assuming you're using Socket.IO for real-time communication
// DOM Elements
// const roleSelection = document.getElementById('role');
const canvasContainer = document.getElementById('canvasContainer');
const canvas = document.getElementById('drawingCanvas');
const microphone = document.getElementById('recordButton');
const ctx = canvas.getContext('2d');
const aiCtx = document.getElementById('generatedCanvas').getContext('2d');

// Variables
let isDrawing = false;
let role = null;
let socketInitialized = false;
let socket = null;

function initializeSocket() {
    console.log('Initializing socket connection...', socketInitialized);
    if (!socketInitialized || socket === null) {
        socketInitialized = true;

        // Establish connection with the server
        socket = io("http://localhost:5000");
        // Handle connection events
        socket.on('connect', () => {
            const userName = Math.random().toString(36).substring(2, 15); // Generate a random request ID
            const userData = {
                username: userName,
                role: 'child',
                timestamp: new Date().toISOString(),
                sid: socket.id
            };
            socket.emit('join', userData);
            console.log('Connected to server with request ID:', userName);
        });
        
        socket.on('canvasImageResult', (data) => {
            console.log('Received canvas image result:', data);
            const img = new Image();
            img.src = data.image;
            img.onload = () => {
                aiCtx.clearRect(0, 0, aiCtx.canvas.width, aiCtx.canvas.height);
                aiCtx.drawImage(img, 0, 0, aiCtx.canvas.width, aiCtx.canvas.height);
                // aiCtx.drawImage(img, 0, 0);
            };
        });

        socket.on('asrResult', (data) => {
            // console.log('Received ASR result:', data);
            document.getElementById('ai-text-bar').innerHTML = data.text;
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        // Handle window unload event to disconnect from server
        window.addEventListener('beforeunload', () => {
            socket.emit('disconnect');
            socket.disconnect();
        });

    }
}

navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks = [];

    mediaRecorder.ondataavailable = event => {
        console.log('Audio data available:', event.data);
        audioChunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/aac' });
        const reader = new FileReader();
        reader.onload = () => {
            const audioBase64 = reader.result.split(',')[1];

            // Save the audio as a .wav file locally 
            // const link = document.createElement('a');
            // link.href = URL.createObjectURL(audioBlob);
            // link.download = 'audio_recording.aac';
            // link.click();

            // Send the audio to the server
            if (socket && socket.connected) {
                socket.emit('audio', { 
                    audio: audioBase64, 
                    sampleRate: stream.getAudioTracks()[0].getSettings().sampleRate,
                    sampleWidth: stream.getAudioTracks()[0].getSettings().sampleSize || 16, // Default to 16 if undefined
                    channels: stream.getAudioTracks()[0].getSettings().channelCount || 1, // Default to 1 if undefined
                });
                console.log('Audio data sent to server');
            }
            audioChunks.length = 0; // Clear the audioChunks array
        };
        reader.readAsDataURL(audioBlob);
    };

    microphone.onclick = function() {
        microphone.classList.toggle('recording');
        if (microphone.classList.contains('recording')) {
            microphone.innerHTML = 'Recording... (click to stop)';
            mediaRecorder.start();
        } else {
            microphone.innerHTML = 'Click to Record';
            mediaRecorder.stop();
        }
    };
})
.catch(error => {
    console.error('Error accessing microphone:', error);
});

enableDrawing();
initializeSocket();
// Role Selection
// roleSelection.onchange = function() {
//     const role = roleSelection.value;
//     if (role === 'child') {
//         canvasContainer.style.display = 'block';
//         enableDrawing();
//     } else {
//         canvasContainer.style.display = 'none';
//         disableDrawing();
//     }
//     initializeSocket();
// }

document.getElementById('sendButton').onclick = function() {
    // const role = roleSelection.value;
    // if (role === 'child') {
    const imageData = canvas.toDataURL('image/png');
    if (socket && socket.connected) {
        socket.emit('canvas_image', { image: imageData });
        console.log('Canvas image sent to server');
    }
    // }
}

document.getElementById('clearButton').onclick = function() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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

// Send Drawing Data to Server
function sendDrawingData(point) {
    console.log('Sending drawing data:', point);
    if (socket && socket.connected) {
        socket.emit('drawing', point);
    }
}

// // Receive Drawing Data from Server
// socket.on('drawing', (point) => {
//     if (role === 'parent') {
//         ctx.lineTo(point.x, point.y);
//         ctx.stroke();
//     }
// });