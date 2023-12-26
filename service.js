process.env.GOOGLE_APPLICATION_CREDENTIALS = 'letstok-409012-54af63d42f5f.json'; // Set the path to your Google Cloud service account key.
const CREDENTIALS = require('./letstok-409012-54af63d42f5f.json');
const fs = require('fs'); // Import the Node.js filesystem module.
var ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();

const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();

function convert(input, output, callback) {
    ffmpeg(input)
        .output(output)
        .on('end', function() {
            callback(null);
        }).on('error', function(err) {
            console.log('error: ', err.code, err.msg);
            callback(err);
        }).run();
}
async function transcribeAudio(audioName) {
    const speech = require('@google-cloud/speech'); // Import the Google Cloud Speech library.
    try {
        // Initialize a SpeechClient from the Google Cloud Speech library.
        const speechClient = new speech.SpeechClient();

        // Read the binary audio data from the specified file.
        const file = fs.readFileSync(audioName);
        const audioBytes = file.toString('base64');

        // Create an 'audio' object with the audio content in base64 format.
        const audio = {
            content: audioBytes
        };

        // Define the configuration for audio encoding, sample rate, and language code.
        const config = {
            encoding: 'MP3', // Audio encoding (change if needed).
            sampleRateHertz: 8000, // Audio sample rate in Hertz (change if needed).
            languageCode: 'en-US', // Language code for the audio (change if needed).
            alternativeLanguageCodes: ['es-ES', 'en-US', 'fr-FR', 'it-IT'],
            enableWordTimeOffsets: true
        };

        // Return a Promise for the transcription result.
        return new Promise((resolve, reject) => {
            // Use the SpeechClient to recognize the audio with the specified config.
            speechClient.recognize({ audio, config })
                .then(data => {
                    console.log("trascripting done")
                    resolve(data); // Resolve the Promise with the transcription result.
                })
                .catch(err => {
                    reject(err); // Reject the Promise if an error occurs.
                });
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

function conTranscript(input) {
    let s = ''
    input.forEach(alt => {
        s += alt.alternatives[0].transcript;
    });
    return s
}
const translateText = async(text, langCode) => {
    const { Translate } = require('@google-cloud/translate').v2;
    // Configuration for the client
    const translate = new Translate({
        credentials: CREDENTIALS,
        projectId: CREDENTIALS.project_id
    });

    try {
        let [response] = await translate.translate(text, langCode);
        return response;
    } catch (error) {
        console.log(`Error at translateText --> ${error}`);
        return 0;
    }
};
async function synthesize(text, langCode) {
    const util = require('util');
    const request = {
        input: { text: text },
        voice: { languageCode: langCode, ssmlGender: 'FEMALE' },
        audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await client.synthesizeSpeech(request);
    // Write the binary audio content to a local file
    const writeFile = util.promisify(fs.writeFile);
    await writeFile('files/result.mp3', response.audioContent, 'binary');
    console.log('Audio content written to file: result.mp3');
}

async function voiceOver(video) {
    ffmpeg().addInput(video).addInput('files/result.mp3').addOutputOption(['-map 0:v', '-map 1:a', '-c:v copy']).saveToFile('files/final.mp4')
    console.log('good job! check final.mp4')
}

module.exports = { convert, transcribeAudio, conTranscript, translateText, synthesize, voiceOver };