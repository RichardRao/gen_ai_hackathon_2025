/*
 * Filename: /home/richard/workspace/gen_ai_hackathon_2025/product/static/client.js
 * Path: /home/richard/workspace/gen_ai_hackathon_2025/product/static
 * Created Date: Friday, April 18th 2025, 10:49:53 am
 * Author: richard
 * 
 * Copyright (c) 2025 Richard Rao
 */

const canvasContainer = document.getElementById('canvasContainer');
const canvas = document.getElementById('drawingCanvas');
const microphone = document.getElementById('recordButton');
const ctx = canvas.getContext('2d');
const aiCtx = document.getElementById('generatedCanvas').getContext('2d');

// Variables
let isDrawing = false;
let role = null; // child or parent
let socketInitialized = false;
let socket = null;
// Initialize currentQuestion to 0, there are 10 questions in total. https://docs.google.com/document/d/1aCR1DilTsSYZ4w5cMGu8W-pDhYbpNMkedNB_Emj6A58/edit?tab=t.uopv9rmfkh5k
let currentQuestion = 0; 
let startTime = null; // start time to track the end of a draw action

function initializeSocket() {
    console.log('Initializing socket connection...', socketInitialized);
    if (!socketInitialized || socket === null) {
        socketInitialized = true;

        // Establish connection with the server
        // socket = io("http://localhost:5000");
        socket = io("https://5164-108-201-185-119.ngrok-free.app");
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

                if (currentQuestion>=4 && currentQuestion<10){
                    const audio = new Audio('res/audio_' + currentQuestion + '.wav');
                    currentQuestion++;
                    audio.play();
                }
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

            if (currentQuestion < 4){
                currentQuestion++;
                const audio = new Audio('res/audio_' + currentQuestion + '.wav');
                audio.play();
            }
        }
    };
})
.catch(error => {
    console.error('Error accessing microphone:', error);
});

// Client side drawing logic & socket connection
enableDrawing();
initializeSocket();
// Initialize question sequence
// initializeQuestionSequence();

// document.getElementById('sendButton').onclick = function() {
//     sendImageData();
// }

document.getElementById('clearButton').onclick = function() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Drawing Logic
setInterval(() => {
    if (startTime && (new Date().getTime() - startTime > 1500)) {
        sendImageData();
        startTime = null; // Reset startTime after sending data
    }
}, 2000);

function sendImageData() {
    const imageData = canvas.toDataURL('image/png');
    if (socket && socket.connected) {
        socket.emit('canvas_image', { image: imageData });
        console.log('Canvas image sent to server');
    }
}

function enableDrawing() {
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawingSetTimer);
    canvas.addEventListener('mouseout', stopDrawing);
}

function disableDrawing() {
    canvas.removeEventListener('mousedown', startDrawing);
    canvas.removeEventListener('mousemove', draw);
    canvas.removeEventListener('mouseup', stopDrawingSetTimer);
    canvas.removeEventListener('mouseout', stopDrawing);
}

function initializeQuestionSequence() {
    if (currentQuestion > 0) {
        return;
    }
    const audio1 = new Audio('res/audio_1.wav');
    audio1.play().catch(error => {
        console.error('Playback failed:', error);
      });
    currentQuestion = 1;
    console.log('Current question:', currentQuestion);
}

function startDrawing(e) {
    isDrawing = true;
    initializeQuestionSequence();
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
    startTime = null;
}

function draw(e) {
    if (!isDrawing) return;
    startTime = null;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
}

function stopDrawingSetTimer() {
    isDrawing = false;
    startTime = new Date().getTime();
    console.log('Drawing stopped at:', startTime);
    ctx.closePath();
}

function stopDrawing() {
    isDrawing = false;
    ctx.closePath();
}

// // Receive Drawing Data from Server
// socket.on('drawing', (point) => {
//     if (role === 'parent') {
//         ctx.lineTo(point.x, point.y);
//         ctx.stroke();
//     }
// });