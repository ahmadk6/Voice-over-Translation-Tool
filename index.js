const { doTranslate } = require("./translationService.js");
// const { changeSubtitles } = require("./subtitlesService.js");
const express = require('express');
const cors = require('cors');
const multer = require('multer')
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.listen(8000, () => {
    console.log(`Server is running on port 8000.`);
});
var video;
var date;
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
    video = 'files/' + video;
    doTranslate(video, date, req, res);
});
// app.post('/changeSubtitles', upload.single('file'), (req, res) => {
//     //video = 'files/' + video;
//     video = 'test/test4.mp4'
//     changeSubtitles(video, date, req, res);
// });
