const { convert, transcribeAudio, conTranscript, translateText, synthesize, voiceOver } = require("./service.js");
const fs = require('fs'); // Import the Node.js filesystem module.
const express = require('express');
const cors = require('cors');
const http = require('http');
const multer = require('multer')
path = require('path')
var video;
var readStream;
var date;
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.listen(8000, () => {
    console.log(`Server is running on port 8000.`);
});

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        return cb(null, "./files")
    },
    filename: function(req, file, cb) {
        date = Date.now().toString()
        video = `${date}_${file.originalname}`
        return cb(null, video)
    }
})
const upload = multer({ storage })
app.post('/translate', upload.single('file'), (req, res) => {
    //need to take parameters
    let lang = req.body.language;
    video = 'files/' + video;
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
    var output = `files/${date}_output.mp3`
    convert(video, output, async function(err) {
        if (!err) {
            console.log('conversion completed');
            let a = await transcribeAudio(output);
            let r = a[0].results;
            let t = conTranscript(r)
            translateText(t, lang).then(async(r) => {
                    console.log(r);
                    var result = `files/${date}_result.mp3`
                    var final = `files/${date}_final.mp4`
                    await synthesize(r, langCode, voiceName, result).then(() => {
                        voiceOver(video, result, final).then(async() => {
                            var filePath = path.join(__dirname, final);
                            sendRespone(filePath, res)
                        });
                    })
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    });
});

function sendRespone(filePath, res) {
    var stat = fs.statSync(filePath);
    res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size
    });
    readStream = fs.createReadStream(filePath);
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
