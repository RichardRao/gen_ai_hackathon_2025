from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit

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
    peers[username] = request.sid
    emit('joined', {'message': f'{username} joined the server.'}, broadcast=True)

# Handle client disconnection
@socketio.on('disconnect')
def on_disconnect():
    disconnected_peer = None
    for username, sid in peers.items():
        if sid == request.sid:
            disconnected_peer = username
            break
    if disconnected_peer:
        del peers[disconnected_peer]
        emit('left', {'message': f'{disconnected_peer} left the server.'}, broadcast=True)

# Handle drawing data
@socketio.on('drawing')
def handle_drawing(data):
    target = data.get('target')
    if target in peers:
        emit('drawing', data, room=peers[target])

# Handle audio data
@socketio.on('audio')
def handle_audio(data):
    target = data.get('target')
    if target in peers:
        emit('audio', data, room=peers[target])

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)