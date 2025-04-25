'''
Filename: gen_ai_hackathon_2025/product/server.py
Path: gen_ai_hackathon_2025/product
Created Date: Tuesday, April 15th 2025, 9:35:58 am
Author: richard

Copyright (c) 2025
'''

from flask import Flask, request, send_from_directory, Blueprint, render_template
from flask_socketio import SocketIO, emit
from PIL import Image
from flask_cors import CORS
import base64
import shutil
import os
import json
import whisper
import time

# static parameters
STORY_DIR = 'saved_story'
IMAGEDIR = 'saved_images'
COMFYUI_INPUT_DIR = '../../ComfyUI/input'
COMFYUI_OUTPUT_DIR = '../../ComfyUI/output'
TMP_INPUT_IMAGE = 'AIGC_00001_.png'
TMP_GENERATED_IMAGE = 'AIGC_00001_.png'
WORKFLOW_JSON = '../../ComfyUI/user/default/workflows/gen_ai_hackathon_2025_04_25.json'
TMP_WORKFLOW_JSON = '../../ComfyUI/user/default/workflows/gen_ai_hackathon_2025_04_25_tmp.json'

os.makedirs(STORY_DIR, exist_ok=True)
# Create a directory to store images if it doesn't exist
os.makedirs(IMAGEDIR, exist_ok=True)
# Load ASR server TODO: put ASR server in a separate thread
model = whisper.load_model("turbo")
# Define the Flask app and SocketIO
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Store peer connections
peers = {}
descriptor = {}

# @app.route('/')
# def index():
#     return serve_kidoscope_client('drawing_panel_kidoscope.html')

kidoscope = Blueprint('kidoscope', __name__, static_folder='tablet_doodling_panel')
@kidoscope.route('/')
def index():
    # Serve the static files from the 'Tablet_Doodleing_Panel' directory
    return send_from_directory(kidoscope.static_folder, "drawing_panel_kidoscope.html")

parentscope = Blueprint('parentscope', __name__, static_folder='mobile_app_page')
@parentscope.route('/parent')
def serve_parent_client():
    # Serve the static files from the 'Tablet_Doodleing_Panel' directory
    return send_from_directory(parentscope.static_folder, 'index.html')

app.register_blueprint(kidoscope)
app.register_blueprint(parentscope)

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
    descriptor[request.sid] = ""
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
    del descriptor[request.sid]
    if disconnected_peer:
        del peers[disconnected_peer]
        emit('left', {'message': f'{disconnected_peer} left the server.'}, broadcast=True)

# Handle drawing data
@socketio.on('drawing')
def handle_drawing(data):
    # print(['drawing', data])
    target = data.get('target')
    if target in peers:
        emit('drawing', data, room=peers[target])

# Save the current drawing        
@socketio.on('save_drawing')
def save_drawing(data):
    sid = data.get('sid')
    pagenum = data.get('page')
    client_ip = request.remote_addr
    # print(sid, pagenum)
    generated_image = sid + '_' + str(pagenum) + '.png'
    shutil.move(os.path.join(IMAGEDIR, TMP_GENERATED_IMAGE),
                os.path.join(STORY_DIR, generated_image))
    with open(os.path.join(STORY_DIR, generated_image), "rb") as result_image:
        encoded_image = base64.b64encode(result_image.read()).decode('utf-8')
        # broadcast the saved image to all clients
        emit('drawingSaved', {'image': f'data:image/png;base64,{encoded_image}', 'description': descriptor[request.sid]}, broadcast=True)
    
# Handle story book page request
@socketio.on('story_book')
def get_book(data):
    pagenum = data.get('page')
    client_ip = request.remote_addr
    socket_id = data.get('sid')
    saved_image_1 = socket_id + '_' + str(pagenum) + '.png'
    saved_image_2 = socket_id + '_' + str(pagenum+1) + '.png'
    encoded_image_1 = 0
    encoded_image_2 = 0
    
    try:
        with open(os.path.join(STORY_DIR, saved_image_1), "rb") as result_image:
            encoded_image_1 = base64.b64encode(result_image.read()).decode('utf-8')
        with open(os.path.join(STORY_DIR, saved_image_2), "rb") as result_image:
            encoded_image_2 = base64.b64encode(result_image.read()).decode('utf-8')
    except Exception as e:
        print(f"Error reading image files: {e}")
        emit('storyBookError', {'message': f'Error reading image files: {e}'})
    emit('storyBookResult', \
        {'image1': f'data:image/png;base64,{encoded_image_1}',\
        'image2': f'data:image/png;base64,{encoded_image_2}'})
    

# Handle text prompt
@socketio.on('text')
def handle_text(data):
    text = data.get('text')
    descriptor[request.sid] += text
    ## TODO: send text to ComfyUI 
    # Send text result as prompt to ComfyUI
    with open(WORKFLOW_JSON, 'r') as f:
        workflow = json.load(f)
    
    workflow["39"]["inputs"]["text"] = descriptor[request.sid]
    with open(TMP_WORKFLOW_JSON, 'w') as f:
        json.dump(workflow, f)
    os.system('comfy run --workflow ' + TMP_WORKFLOW_JSON)
    
    shutil.move(os.path.join(COMFYUI_OUTPUT_DIR, TMP_GENERATED_IMAGE),
                    os.path.join(IMAGEDIR, TMP_GENERATED_IMAGE))
    with open(os.path.join(IMAGEDIR, TMP_GENERATED_IMAGE), "rb") as result_image:
        encoded_image = base64.b64encode(result_image.read()).decode('utf-8')
        # Send the image back to the client
        emit('canvasImageResult', {'image': f'data:image/png;base64,{encoded_image}'})
    ## After ComfyUI process, trigger the next question
    emit('question', {})

# Handle canvas image data
@socketio.on('canvas_image')
def handle_canvas_image(data):
    # Decode the base64 image data
    image_data = data.get('image')
    # Replace with the actual path to your ComfyUI input directory

    if image_data:
        try:
            # Save the image to a file with a default white background
            decoded_image = base64.b64decode(image_data.split(',')[1])
            with open('temp_image.png', 'wb') as temp_file:
                temp_file.write(decoded_image)
            with Image.open('temp_image.png') as img:
                if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    background.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else None)
                    background.save('temp_image.png', 'PNG')
            os.rename('temp_image.png', os.path.join(IMAGEDIR, 'canvas_image.png'))
            shutil.copyfile(os.path.join(IMAGEDIR, 'canvas_image.png'), 
                            os.path.join(COMFYUI_INPUT_DIR, TMP_INPUT_IMAGE))
            # remove all png file in COMFYUI_OUTPUT_DIR
            for file in os.listdir(COMFYUI_OUTPUT_DIR):
                if file.endswith('.png'):
                    os.remove(os.path.join(COMFYUI_OUTPUT_DIR, file))
            if len(descriptor[request.sid]) == 0:
                os.system('comfy run --workflow ' + WORKFLOW_JSON)
            else:
                os.system('comfy run --workflow ' + TMP_WORKFLOW_JSON)
            # Wait for the ComfyUI process to finish
            shutil.move(os.path.join(COMFYUI_OUTPUT_DIR, TMP_GENERATED_IMAGE),
                            os.path.join(IMAGEDIR, TMP_GENERATED_IMAGE))
            with open(os.path.join(IMAGEDIR, TMP_GENERATED_IMAGE), "rb") as result_image:
                encoded_image = base64.b64encode(result_image.read()).decode('utf-8')
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
            # Send a success message back to the client        
            emit('asrResult', {'text': result['text']})
        except Exception as e:
            emit('audioError', {'message': f'Error saving audio: {str(e)}'})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)