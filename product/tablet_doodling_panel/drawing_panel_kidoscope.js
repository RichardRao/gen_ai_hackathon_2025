// Canvas setup
// const canvas = document.getElementById('drawingCanvas');
// const ctx = canvas.getContext('2d');
// const outputImage = document.getElementById('outputImage');
/*
 * Filename: /home/richard/workspace/gen_ai_hackathon_2025/product/tablet_doodling_panel/drawing_panel_kidoscope.js
 * Path: /home/richard/workspace/gen_ai_hackathon_2025/product/tablet_doodling_panel
 * Created Date: Monday, April 21st 2025, 10:04:03 pm
 * Author: richard
 * 
 * Copyright (c) 2025 
 */
// No matter what load the doodling panel first
const startPage = document.getElementById('doodle-panel-template');
const startPageControl = document.getElementById('doodle-panel-control');
const contentArea = document.getElementById('doodling-area');
contentArea.innerHTML = startPage.innerHTML;
const controlPanel = document.getElementById('control-panel');
controlPanel.innerHTML = startPageControl.innerHTML;
const kidIcon = document.getElementById("ai-icon");
const aiTextOutput = document.getElementById('text-prompt');
const microphone = document.getElementById('recordButton');

// The rest of the code
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const aiCtx = document.getElementById('generatedCanvas').getContext('2d');
const nextBtn = document.getElementById('next-btn');
const publishBtn = document.getElementById('publish-btn');

// Variables
let isDrawing = false;
let role = null; // child or parent
let socketInitialized = false;
let socket = null;
let sendAvailable = false;
// Initialize currentQuestion to 0, there are 10 questions in total. https://docs.google.com/document/d/1aCR1DilTsSYZ4w5cMGu8W-pDhYbpNMkedNB_Emj6A58/edit?tab=t.uopv9rmfkh5k
let currentQuestion = 0; 
let currentPage = 0; // current page number
let startTime = null; // start time to track the beginning of a draw action
let stopTime = null; // stop time to track the end of a draw action
let savedUserName = null; // user name
let readPage = 1; // page number to read

// // Drawing state
let currentTool = 'pen-black';
let currentColor = '#1d1d1d';

// Tool selection
document.querySelectorAll('.tool').forEach(tool => {
    tool.addEventListener('click', () => {
        // Remove active class from all tools
        document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
        // Add active class to selected tool
        tool.classList.add('active');
        
        // Update current tool and color
        currentTool = tool.classList[1];
        if (currentTool === 'eraser') {
            currentColor = '#FFFFFF';
        } else {
            // Extract color from class name (e.g., 'pen-red' -> '#FF0000')
            const colorMap = {
                'red': '#FF0000',
                'orange': '#FFA500',
                'yellow': '#FFFF00',
                'green': '#00FF00',
                'blue': '#0000FF',
                'indigo': '#4B0082',
                'violet': '#9400D3',
                'black': '#1d1d1d',
            };
            const color = currentTool.split('-')[1];
            currentColor = colorMap[color];
        }
    });
});

// Next button functionality
nextBtn.addEventListener('click', () => {
    // Convert canvas to image
    currentPage++;
    const saveRequest = {
        timestamp: new Date().toISOString(),
        sid: socket.id,
        page: currentPage,
    };
    aiCtx.clearRect(0, 0, aiCtx.canvas.width, aiCtx.canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ctx.fillStyle = 'white';
    // ctx.fillRect(0, 0, canvas.width, canvas.height);
    socket.emit('save_drawing', saveRequest);
});

// Publish button functionality, SHOW THE STORY BOOK
publishBtn.addEventListener('click', () => {
    // load the story book template
    aiTextOutput.value = '';
    aiTextOutput.style.fontSize = '30px';
    aiTextOutput.placeholder = '';
    aiTextOutput.style.display = 'none';
    microphone.style.display = 'none';
    contentArea.innerHTML = document.getElementById('story-book-template').innerHTML;
    controlPanel.innerHTML = document.getElementById('story-book-control').innerHTML;
    // controlPanel.style.display = 'none';
    // send a request to the server to ask for the 4 images from the story book
    const requestPage = {
        'sid': socket.id,
        'page': readPage
    };
    socket.emit('story_book', requestPage); 

    // Add event listeners to the story book buttons
    const nextPageBtn = document.getElementById('nextPageBtn');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const checkBtn = document.getElementById('checkBtn');
    const craftBtn = document.getElementById('craftBtn');
    nextPageBtn.addEventListener('click', () => {
        console.log('next page button clicked');
        if (readPage < 3) {
            readPage+=2;
            const requestPage = {
                'sid': socket.id,
                'page': readPage
            };
            socket.emit('story_book', requestPage);
        }
    });
    prevPageBtn.addEventListener('click', () => {
        console.log('prev page button clicked');
        if (readPage > 2) {
            readPage-=2;
            const requestPage = {
                'sid': socket.id,
                'page': readPage
            };
            socket.emit('story_book', requestPage);
        }
    });
    checkBtn.addEventListener('click', () => {
        console.log('check button clicked');
        // send a request to the server to ask for the 4 images from the story book
        checkBtn.style.display = 'none';
        contentArea.innerHTML = document.getElementById('bookshelf-content-template').innerHTML;

    });
    craftBtn.addEventListener('click', () => {
        // Load doodle panel template
        location.reload();
    });
});

function initializeSocket() {
    console.log('Initializing socket connection...', socketInitialized);
    if (!socketInitialized || socket === null) {
        socketInitialized = true;

        // Establish connection with the server
        socket = io("http://localhost:5000");
        // socket = io("https://5164-108-201-185-119.ngrok-free.app");
        // Handle connection events
        socket.on('connect', () => {
            const userName = Math.random().toString(36).substring(2, 15); // Generate a random request ID
            const userData = {
                username: userName,
                role: 'child',
                timestamp: new Date().toISOString(),
                sid: socket.id,
            };
            // Emit the join event with user data
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
            };
        });

        socket.on('asrResult', (data) => {
            // console.log('Received ASR result:', data);
            kidIcon.style.display = 'none';
            aiTextOutput.placeholder = '';
            aiTextOutput.value = data.text;
            resizePlaceholderFont();
        });

        socket.on('question', (data) => {
            if (currentQuestion <= 10) {
                presentQuestion();
            }
        });

        socket.on('storyBookResult', (data) => {
            // console.log('Received story book result:', data);
            try{
                const pageLeftImage = document.getElementById('page-left-image');
                pageLeftImage.src = data.image1;
                const pageRightImage = document.getElementById('page-right-image');
                pageRightImage.src = data.image2;
            }
            catch (error) {
                console.error('Error loading story book images:', error);
            }
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
    // Handle microphone button click
    microphone.onclick = function() {
        if (!sendAvailable) {
            microphone.classList.toggle('recording');
            if (microphone.classList.contains('recording')) {
                // change the button image source to Icon_Record_Active.png
                document.getElementById('recButtonSrc').src = 'tablet_doodling_panel/icons/Icon_Record_Active.svg';
                microphone.style.backgroundColor = '#252525';
                microphone.style.border = '1px solid #303030';
                mediaRecorder.start();
            } 
            else {
                // change the button image source to Icon_Record.svg
                document.getElementById('recButtonSrc').src = 'tablet_doodling_panel/icons/Icon_Arrow-up.svg';
                microphone.style.backgroundColor = '#4c4afd';
                microphone.style.border = '1px solid #e2e8f0';
                mediaRecorder.stop();
                sendAvailable = true;
            }
        }
        else {
            // microphone.innerHTML = 'Click to Record';
            sendAvailable = false;
            document.getElementById('recButtonSrc').src = 'tablet_doodling_panel/icons/Icon_Record.svg';
            microphone.style.backgroundColor = '#D1FF02';
            microphone.style.border = '1px solid #9DBF02';
            socket.emit('text', { text: aiTextOutput.value });
            aiTextOutput.value = '';
            aiTextOutput.style.fontSize = '30px';
            aiTextOutput.placeholder = 'Kidoscope is generating...';
        }
    };
})
.catch(error => {
    console.error('Error accessing microphone:', error);
});

// Client side drawing logic & socket connection
enableDrawing();
initializeSocket();

// Drawing Logic
setInterval(() => {
    if (stopTime && (new Date().getTime() - stopTime > 1500)) {
        sendImageData();
        stopTime = null; // Reset stopTime after sending data
    }
    if (startTime && (new Date().getTime() - startTime > 2000)) {
        // Reset the drawing state after 2 seconds of inactivity
        initializeQuestionSequence();
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

function getPlaceholderTextWidth(inputElement) {
    const placeholder = inputElement.getAttribute('placeholder');
    const style = window.getComputedStyle(inputElement);
  
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
  
    const font = `${style.fontSize} ${style.fontFamily}`;
    context.font = font;
  
    const metrics = context.measureText(placeholder);

    const text = inputElement.value;
    const textMetrics = context.measureText(text);
    const textWidth = textMetrics.width;

    return Math.max(metrics.width,textWidth);
}

const resizePlaceholderFont = () => {
    var fontSize = Math.max(parseInt(window.getComputedStyle(aiTextOutput).fontSize, 10),30);
    while (getPlaceholderTextWidth(aiTextOutput) > aiTextOutput.clientWidth && fontSize > 8) {
        fontSize -= 2; // Decrease font size
        aiTextOutput.style.fontSize = `${fontSize}px`;
    }
    aiTextOutput.style.fontSize = `${fontSize}px`;
};

function initializeQuestionSequence() {
    if (currentQuestion != 1) {
        return;
    }
    presentQuestion();   
}

function presentQuestion() {
    const audio = new Audio('tablet_doodling_panel/res/audio_' + currentQuestion + '.wav');
    aiTextOutput.style.display = 'block';
    microphone.style.display = 'block';
    kidIcon.style.display = 'block';
    console.log('Playing audio for question:', currentQuestion);
    var line = currentQuestion - 1;
    // Set the placeholder text based on the current question
    fetch('tablet_doodling_panel/res/transcripts.txt')
        .then(response => response.text())
        .then(data => {
            const currentLine = data.split('\n')[line];
            const placeholderText = currentLine.split('|')[1]?.trim();
            if (placeholderText) {
                aiTextOutput.placeholder = placeholderText;
            }
            resizePlaceholderFont();
        })
    audio.play().catch(error => {
        console.error('Playback failed:', error);
    });
    currentQuestion++;
    console.log('Current question:', currentQuestion);
}

function startDrawing(e) {
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
    ctx.strokeStyle = currentColor;
    if (currentTool === 'eraser') {
        ctx.lineWidth = 50; // Set a much thicker line width for eraser
    } else {
        ctx.lineWidth = 3; // Default line width for other tools
    }
    if (currentQuestion === 0) {
        startTime = new Date().getTime();
        currentQuestion++;
    }
    stopTime = null;
}

function draw(e) {
    if (!isDrawing) return;
    stopTime = null;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
}

function stopDrawingSetTimer() {
    isDrawing = false;
    stopTime = new Date().getTime();
    console.log('Drawing stopped at:', stopTime);
    ctx.closePath();
}

function stopDrawing() {
    isDrawing = false;
    ctx.closePath();
}

