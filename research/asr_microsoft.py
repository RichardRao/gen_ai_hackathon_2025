import azure.cognitiveservices.speech as speechsdk

def transcribe_from_file(audio_file_path, azure_key, azure_region):
    # Set up the speech configuration
    speech_config = speechsdk.SpeechConfig(subscription=azure_key, region=azure_region)

    # Set up the audio input from a WAV file (must be PCM, 16-bit, 16kHz, mono)
    audio_config = speechsdk.audio.AudioConfig(filename=audio_file_path)

    # Create the speech recognizer
    speech_recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

    print("Transcribing...")

    # Perform recognition (synchronous)
    result = speech_recognizer.recognize_once()

    # Handle the result
    if result.reason == speechsdk.ResultReason.RecognizedSpeech:
        print("Recognized: {}".format(result.text))
    elif result.reason == speechsdk.ResultReason.NoMatch:
        print("No speech could be recognized.")
    elif result.reason == speechsdk.ResultReason.Canceled:
        cancellation = result.cancellation_details
        print("Speech Recognition canceled: {}".format(cancellation.reason))
        if cancellation.reason == speechsdk.CancellationReason.Error:
            print("Error details: {}".format(cancellation.error_details))

if __name__ == "__main__":
    AZURE_SPEECH_KEY = "your-azure-key-here"
    AZURE_REGION = "your-region-here"  # e.g., "eastus"
    AUDIO_PATH = "sample.wav"

    transcribe_from_file(AUDIO_PATH, AZURE_SPEECH_KEY, AZURE_REGION)
