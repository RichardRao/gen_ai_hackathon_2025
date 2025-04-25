let role = null; // child or parent
let socketInitialized = false;
let socket = null;

document.addEventListener('DOMContentLoaded', () => {
    
    // socket = io("https://5164-108-201-185-119.ngrok-free.app");
    socket = io("http://localhost:5000");
    // Handle connection events
    socket.on('connect', () => {
        const userName = Math.random().toString(36).substring(2, 15); // Generate a random request ID
        const userData = {
            username: userName,
            role: 'parent',
            timestamp: new Date().toISOString(),
            sid: socket.id,
        };
        // Emit the join event with user data
        socket.emit('join', userData);
        console.log('Connected to server with request ID:', userName);

        // promptPages.forEach(page => page.classList.add('hidden'));
    });

    socket.on('drawingSaved', (data) => {
        console.log('Drawing saved:', data);
        // show the notification page
        const promptPages = document.querySelectorAll('.prompt-page');
        const notificationPages = document.querySelectorAll('.notification-page');

        promptPages.forEach(page => page.style.display = 'none');
        notificationPages.forEach(page => page.style.display = '');
        document.getElementById('inner-image').src = data.image;
        // document.querySelector('p#brief').innerText = text_data;
        document.getElementById('brief').innerText = data.description;
    });

    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // Additional behavior per tab can be handled here
        });
    });

    // Setup speech recognition
    const recordBtn = document.getElementById('record-btn');
    const recordIcon = recordBtn.querySelector('img');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.addEventListener('result', event => {
            const transcript = Array.from(event.results)
                .map(r => r[0].transcript)
                .join('');
            document.getElementById('message-input').value = transcript;
        });

        recognition.addEventListener('end', () => {
            if (recordBtn.classList.contains('active')) {
                recognition.start();
            }
        });
    } else {
        recordBtn.disabled = true;
    }

    // Record button toggle
    recordBtn.addEventListener('click', () => {
        recordBtn.classList.toggle('active');
        if (!SpeechRecognition) return;
        if (recordBtn.classList.contains('active')) {
            recordIcon.src = 'Icons/Icon_Record.svg';
            recognition.start();
        } else {
            recordIcon.src = 'Icons/Icon_Record_White.svg';
            recognition.stop();
        }
        updateSendBtnState();
    });

    // Send button action
    const sendBtn = document.getElementById('send-btn');
    const inputField = document.getElementById('message-input');

    // Function to update send button disabled state
    function updateSendBtnState() {
        // disable while recording or if no text, otherwise enable and mark active
        if (recordBtn.classList.contains('active') || !inputField.value.trim()) {
            sendBtn.disabled = true;
            sendBtn.classList.add('disabled');
            sendBtn.classList.remove('active');
        } else {
            sendBtn.disabled = false;
            sendBtn.classList.remove('disabled');
            sendBtn.classList.add('active');
        }
    }

    // Initialize state and listen for input changes
    inputField.addEventListener('input', updateSendBtnState);
    updateSendBtnState();

    // Send button click handler
    const promptScreen = document.querySelector('.prompt-screen');
    const successScreen = document.querySelector('.success-screen');

    sendBtn.addEventListener('click', () => {
        const text = inputField.value.trim();
        // show the notification page
        // const promptPages = document.querySelectorAll('.prompt-page');
        // const notificationPages = document.querySelectorAll('.notification-page');

        // promptPages.forEach(page => page.style.display = 'none');
        // notificationPages.forEach(page => page.style.display = '');
        
        if (!text) return;
        inputField.value = '';
        // swap prompt view for success view
        promptScreen.classList.add('hidden');
        successScreen.classList.add('active');
    });

    // Share More Ideas button handler
    const shareMoreBtn = document.getElementById('share-more-btn');
    shareMoreBtn.addEventListener('click', () => {
        // show prompt screen again
        promptScreen.classList.remove('hidden');
        successScreen.classList.remove('active');
        // reset input and send button state
        inputField.value = '';
        updateSendBtnState();
    });

    const coCreateBtn = document.getElementById('cta-btn');
    coCreateBtn.addEventListener('click', () => {
        // show the notification page
        const promptPages = document.querySelectorAll('.prompt-page');
        const notificationPages = document.querySelectorAll('.notification-page');

        promptPages.forEach(page => page.style.display = '');
        notificationPages.forEach(page => page.style.display = 'none');
    });
});