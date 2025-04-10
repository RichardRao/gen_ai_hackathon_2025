from google.cloud import speech
import io

def transcribe_speech(audio_path):
    client = speech.SpeechClient()

    with io.open(audio_path, "rb") as audio_file:
        content = audio_file.read()

    audio = speech.RecognitionAudio(content=content)

    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,  # Adjust if your file is not LINEAR16
        sample_rate_hertz=16000,  # Adjust to match your audio file
        language_code="en-US",
    )

    response = client.recognize(config=config, audio=audio)

    for result in response.results:
        print("Transcript:", result.alternatives[0].transcript)

if __name__ == "__main__":
    transcribe_speech("sample.wav")  # Replace with your audio file
