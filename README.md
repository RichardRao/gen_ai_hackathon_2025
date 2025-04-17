# Gen AI Hackathon 2025 - Server Setup

This project includes a Flask server with Socket.IO for handling real-time communication and additional functionalities like image processing and audio transcription.

## Prerequisites

Ensure you have the following installed on your system:
- System: Linux Ubuntu 22.04
- Python 3.9 or higher
- pip (Python package manager)
- ffmpeg (for audio processing)
- [ComfyUI](https://github.com/comfyanonymous/ComfyUI)
  - `comfy-cli`
- Whisper ASR model dependencies:
  - `torch`
  - `torchaudio`
  - `whisper`

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd gen_ai_hackathon_2025
   ```

2. Create a virtual environment (optional but recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install the required Python packages:
   ```bash
   pip install -r ./product/requirements.txt
   ```

   If `requirements.txt` is not available, manually install the dependencies:
   ```bash
   pip install comfy-cli
   pip install flask flask-socketio pillow torch torchaudio whisper
   ```

4. Ensure `ffmpeg` is installed:
   - On Ubuntu/Debian:
     ```bash
     sudo apt update
     sudo apt install ffmpeg
     ```
   - On macOS (using Homebrew):
     ```bash
     brew install ffmpeg
     ```
   - On Windows, download and install from [FFmpeg official site](https://ffmpeg.org/).

## Running the Server

1. Navigate to the `product` directory:
   ```bash
   cd product
   ```

2. Start the signaling server:
   ```bash
   python server.py
   ```   

4. Start an http server in another termnial session:
   ```bash
   python -m http.server 8080
   ```   

5. Start ComfyUI by calling 
   ```bash
   comfy launch
   ```   

6. The server will run on `http://0.0.0.0:8080`. You can access the child client page locally at `http://127.0.0.1:8080/drawing-panel.html`.

## Notes

- The server saves processed images and audio files in the `saved_images` and `saved_audio` directories, respectively.
- Ensure the `ComfyUI` tool is properly configured if using the image generation workflow. Update paths in `server.py` as needed.

## Troubleshooting

- If you encounter issues with missing dependencies, ensure all required Python packages are installed.
- For audio transcription, ensure the Whisper model is downloaded and compatible with your system.

## License

This project is licensed under the MIT License.