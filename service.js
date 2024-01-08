process.env.GOOGLE_APPLICATION_CREDENTIALS = 'letstok-410014-1903c8cadc8b.json'; // Set the path to your Google Cloud service account key.
const CREDENTIALS = require('./letstok-410014-1903c8cadc8b.json');
const fs = require('fs'); // Import the Node.js filesystem module.
var ffmpeg = require('fluent-ffmpeg');
const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();

function doTranslate(video, date, req, res) {
    path = require('path')
    let lang = req.body.language;
    let langCode
    let voiceName
    switch (lang) {
        case 'es':
            langCode = 'es-ES'
            voiceName = 'es-ES-Standard-C'
            break;
        case 'it':
            langCode = 'it-IT'
            voiceName = 'it-IT-Standard-B'
            break;
        case 'fr':
            langCode = 'fr-FR'
            voiceName = 'fr-FR-Standard-A'
            break;
        default:
            langCode = 'en-US'
            voiceName = 'en-US-Standard-E'
    }
    var output = `files/${date}_output.wav`
    convert(video, output, async function(err) {
        if (!err) {
            let a = await transcribeAudio(output);
            let r = a[0].results;
            let t = r[0].alternatives[0].transcript
            console.log(t);
            translateText(t, lang).then(async(r) => {
                    console.log(r);
                    var result = `files/${date}_result.wav`
                    var final = `files/${date}_final.mp4`
                    await synthesize(r, langCode, voiceName, result).then(() => {
                        voiceOver(video, result, final).then(async() => {
                            sendRespone(res, date)
                        });
                    })
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    });
}

function convert(input, output, callback) {
    ffmpeg(input)
        .audioChannels(1)
        .audioBitrate('1411k')
        .output(output)
        .on('end', function() {
            console.log('conversion completed');
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
            languageCode: 'en-US', // Language code for the audio (change if needed).
            alternativeLanguageCodes: ['es-ES', 'fr-FR', 'it-IT'],
            enable_automatic_punctuation: true,
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
const translateText = async(text, lang) => {
    const { Translate } = require('@google-cloud/translate').v2;
    // Configuration for the client
    const translate = new Translate({
        credentials: CREDENTIALS,
        projectId: CREDENTIALS.project_id
    });

    try {
        let [response] = await translate.translate(text, lang);
        return response;
    } catch (error) {
        console.log(`Error at translateText --> ${error}`);
        return 0;
    }
};
async function synthesize(text, langCode, voiceName, result) {
    const util = require('util');
    const request = {
        input: { text: text },
        voice: { languageCode: langCode, name: voiceName, ssmlGender: 'FEMALE' },
        audioConfig: { audioEncoding: 'LINEAR16' },
    };

    const [response] = await client.synthesizeSpeech(request);
    // Write the binary audio content to a local file
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(result, response.audioContent, 'binary');
    console.log('Audio content written to file: ' + result);
}
async function voiceOver(video, audio, final) {
    const command = ffmpeg()
        .addInput(video)
        .addInput(audio)
        .addOutputOption(['-map 0:v', '-map 1:a', '-c:v copy'])
        .save(final);

    try {
        await saveToFilePromise(command);
        console.log('Good job! Check ' + final);
    } catch (error) {
        console.error('Error:', error);
    }
}
async function saveToFilePromise(command) {
    return new Promise((resolve, reject) => {
        command.on('end', () => resolve());
        command.on('error', (err) => reject(err));
    });
}

function sendRespone(res, date) {
    var final = `files/${date}_final.mp4`
    var filePath = path.join(__dirname, final);
    var stat = fs.statSync(filePath);
    res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size
    });
    var readStream = fs.createReadStream(filePath);
    // We replaced all the event handlers with a simple call to readStream.pipe()
    readStream.pipe(res);
    path2 = require('path')
    var dirPath = path2.join(__dirname, 'files');
    readStream.on('end', () => {
        deleteAllFilesInDir(dirPath, date)
    });
}

async function deleteAllFilesInDir(dirPath, prefix) {
    fs.readdir(dirPath, (err, files) => {
        if (err) throw err;
        for (const file of files) {
            if (file.startsWith(prefix))
                fs.unlink(path.join(dirPath, file), (err) => {
                    if (err) throw err;
                });
        }
    });
}
module.exports = { doTranslate, translateText };
