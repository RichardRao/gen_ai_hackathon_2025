from flask import Flask, request
from flask_socketio import SocketIO, emit
from PIL import Image
import base64
import shutil
import os
import numpy as np

import whisper
import torch
import torchaudio

# Load ASR server
model = whisper.load_model("turbo")
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Store peer connections
peers = {}

@app.route('/')
def index():
    return "WebRTC Server is running."

# Handle signaling messages for WebRTC
@socketio.on('signal')
def handle_signal(data):
    target = data.get('target')
    if target in peers:
        emit('signal', data, room=peers[target])

# Handle client connection
@socketio.on('join')
def on_join(data):
    username = data.get('username')
    peers[username] = data
    # print(peers)
    emit('joined', {'message': f'{username} joined the server.'}, broadcast=True)

# Handle client disconnection
@socketio.on('disconnect')
def on_disconnect():
    disconnected_peer = ''
    for username, data in peers.items():
        # print(username, data, request.sid)
        if data['sid'] == request.sid:
            disconnected_peer = username
            break
    if disconnected_peer:
        del peers[disconnected_peer]
        emit('left', {'message': f'{disconnected_peer} left the server.'}, broadcast=True)

# Handle drawing data
@socketio.on('drawing')
def handle_drawing(data):
    print(['drawing', data])
    target = data.get('target')
    if target in peers:
        emit('drawing', data, room=peers[target])

# Handle canvas image data
@socketio.on('canvas_image')
def handle_canvas_image(data):
    # Decode the base64 image data
    image_data = data.get('image')
    # Replace with the actual path to your ComfyUI input directory
    comfyui_input_dir = '../../ComfyUI/input'
    comfyui_output_dir = '../../ComfyUI/output'
    workflow_json = '../../ComfyUI/user/default/workflows/gen_ai_hackathon_2025_04_17.json'
    input_temp_image = 'AIGC_00001_.png'
    generated_image = 'AIGC_00000_.png'
    if image_data:
        try:
            # Create a directory to store images if it doesn't exist
            image_dir = 'saved_images'
            os.makedirs(image_dir, exist_ok=True)

            # Save the image to a file with a default white background
            decoded_image = base64.b64decode(image_data.split(',')[1])
            with open('temp_image.png', 'wb') as temp_file:
                temp_file.write(decoded_image)
            with Image.open('temp_image.png') as img:
                if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else None)
                    background.save('temp_image.png', 'PNG')
            os.rename('temp_image.png', os.path.join(image_dir, 'canvas_image.png'))
            shutil.copyfile(os.path.join(image_dir, 'canvas_image.png'), 
                            os.path.join(comfyui_input_dir, generated_image))
            # remove all png file in comfyui_output_dir
            for file in os.listdir(comfyui_output_dir):
                if file.endswith('.png'):
                    os.remove(os.path.join(comfyui_output_dir, file))
            os.system('comfy run --workflow ' + workflow_json)
            # Wait for the ComfyUI process to finish
            shutil.move(os.path.join(comfyui_output_dir, input_temp_image),
                            os.path.join(image_dir, generated_image))
            with open(os.path.join(image_dir, generated_image), "rb") as result_image:
                encoded_image = base64.b64encode(result_image.read()).decode('utf-8')
            # print(encoded_image)
            # Send the image back to the client
            emit('canvasImageResult', {'image': f'data:image/png;base64,{encoded_image}'})
        except Exception as e:
            emit('canvasImageError', {'message': f'Error saving image: {str(e)}'})

# Handle audio data
@socketio.on('audio')
def handle_audio(data):
    audio_data = data.get('audio')
    # sample_rate = data.get('sampleRate', 44100)  # Default to 44100 Hz if not provided
    # channels = data.get('channels', 1)  # Default to mono if not provided

    if audio_data:
        try:
            # Decode the base64 audio data
            decoded_audio = base64.b64decode(audio_data)

            # Create a directory to store audio files if it doesn't exist
            audio_dir = 'saved_audio'
            os.makedirs(audio_dir, exist_ok=True)

            # Save the audio data to an .aac file
            aac_path = os.path.join(audio_dir, 'audio_recording.aac')
            with open(aac_path, 'wb') as aac_file:
                aac_file.write(decoded_audio)
            result = model.transcribe(aac_path, language='en', task='transcribe')
            print(result['text'])
            # Send a success message back to the client        
            emit('asrResult', {'text': result['text']})
        except Exception as e:
            emit('audioError', {'message': f'Error saving audio: {str(e)}'})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)