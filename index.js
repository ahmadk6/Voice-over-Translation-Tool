const { convert, transcribeAudio, conTranscript, translateText, synthesize, voiceOver } = require("./service.js");
const fs = require('fs'); // Import the Node.js filesystem module.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const multer = require('multer')
path = require('path')
let video = '';

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
        video = `${Date.now()}_${file.originalname}`
        return cb(null, video)
    }
})
const upload = multer({ storage })
app.post('/translate', upload.single('file'), (req, res) => {
    //need to take parameters
    let lang = req.body.language;
    video = 'files/' + video;
    let langCod
    switch (lang) {
        case 'es':
            langCode = 'es-ES'
            break;
        case 'it':
            langCode = 'it-IT'
            break;
        case 'fr':
            langCode = 'fr-FR'
            break;
        default:
            langCode = 'en-US'
    }
    convert(video, 'files/output.mp3', async function(err) {
        if (!err) {
            console.log('conversion complete');
            let a = await transcribeAudio('files/output.mp3');
            let r = a[0].results;
            let t = conTranscript(r)
            translateText(t, lang).then(async(r) => {
                    console.log(r);
                    await synthesize(r, langCode).then(async() => {
                        voiceOver(video).then(async() => {
                            var filePath = path.join(__dirname, 'files/final.mp4');
                            var stat = fs.statSync(filePath);
                            res.writeHead(200, {
                                'Content-Type': 'video/mp4',
                                'Content-Length': stat.size
                            });
                            var readStream = fs.createReadStream(filePath);
                            // We replaced all the event handlers with a simple call to readStream.pipe()
                            readStream.pipe(res);
                            // path2 = require('path')
                            // var dirPath = path2.join(__dirname, 'files');
                            // deleteAllFilesInDir(dirPath).then(() => {
                            //     console.log('Removed all irrelevant files from the server');
                            // });
                        });

                    })
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    });
});
// async function deleteAllFilesInDir(dirPath) {
//     fs.readdir(dirPath, (err, files) => {
//         if (err) throw err;

//         for (const file of files) {
//             fs.unlink(path.join(dirPath, file), (err) => {
//                 if (err) throw err;
//             });
//         }
//     });
// }