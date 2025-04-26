# Kidoscope - Gen AI Hackathon 2025

This project includes a Flask server with Socket.IO for handling real-time communication and additional functionalities like image processing and audio transcription.

## Prerequisites
Ensure you have the following installed on your system:
- System: Linux Ubuntu 22.04
- Python 3.9 or higher
- pip (Python package manager)
- ffmpeg (for audio processing)
- [ComfyUI](https://github.com/comfyanonymous/ComfyUI) (Hash ID: b4dc03ad7669b155d3c7714e9e5a474365d50c8c)
  - `comfy-cli`
- Whisper ASR model dependencies:
  - `torch`
  - `torchaudio`
  - `whisper`

## Installation
1. Clone the repository and navigate to the product folder:
   ```bash
   git clone https://github.com/RichardRao/gen_ai_hackathon_2025.git
   git clone https://github.com/RichardRao/ComfyUI
   cd gen_ai_hackathon_2025/product
   ```

2. Make sure Python 3.9 is installed
   ```bash
   python3.9 --version
   ```
   If not, install it (Linux):
   ```
   # Ubuntu/Debian
   sudo apt install python3.9 python3.9-venv
   ```
3. Create a virtual environment: 
   ```   
   python3.9 -m venv myenv
   source venv/bin/activate
   ```

3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
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

## Running the Server locally
1. Navigate to the `product` directory:
   ```bash
   cd product
   ```

2. Start the signaling server:
   ```bash
   python server.py
   ```   

3. In another terminal window. Navigate to comfyUI folder 
   ```
   cd ../../ComfyUI
   ```
4. Start service by calling 
   ```bash
   pip install comfy-cli
   comfy install
   comfy --workspace ./ launch
   ```   

5. The server will run on `http://0.0.0.0:5000`. You can access the child client page locally at `http://127.0.0.1:5000`.

6. Access through ngrok domain page. Starting from 04/24/2025, the service will be available on [`https://kidoscope.ngrok.io`](https://kidoscope.ngrok.io) for a month. 

## System Architecture

![AI Hackathon 2025](https://github.com/user-attachments/assets/58fb99f3-262e-427c-8566-6d7e02d12bfb)

Fig. 1. Demo App System architecture. Note: Red dot line stands for “to-be-implemented”. 

## Notes

- The server saves processed images and audio files in the `saved_images` and `saved_audio` directories, respectively.
- Ensure the `ComfyUI` tool is properly configured if using the image generation workflow. Update paths in `server.py` as needed.

## Troubleshooting

- If you encounter issues with missing dependencies, ensure all required Python packages are installed.
- For audio transcription, ensure the Whisper model is downloaded and compatible with your system.

## License

This project is licensed under the MIT License.
