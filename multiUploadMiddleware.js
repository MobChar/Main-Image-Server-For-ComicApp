

const util = require("util");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

var fileId = 0;
var serverId='A';
let debug = console.log.bind(console);
var rabbitChannel;

async function setUpRabbit() {
    const setUpRabbit = require('./rabbitMQService');
    await setUpRabbit.then(
        result => {
            rabbitChannel = result;

            // rabbitChannel.consume('image-server-new-image', function (payload) {
            //     let data = JSON.parse(payload.content);
            //     fs.writeFile('./uploadImage/' + data.fileName, Buffer.from(data.fileBuffer), (err) => {
            //         if (console.error()) console.log(err);
            //     });
            // }, {
            //     noAck: true
            // });
        }
        , error => {
            console.log(error);
            throw error;
        });
}

setUpRabbit();

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, __dirname + "/uploadImage");
    },

    filename: (req, file, cb) => {
        let math = ["image/png", "image/jpeg"];
        if (math.indexOf(file.mimetype) === -1) {
            let errorMess = 'The file <strong>${file.originalname}</strong> is invalid. Only allowed to upload image jpeg or png.';
            return cb(errorMess, null);
        }

        const readStream = file.stream;
        const chunks = [];
        readStream.on("data", function (chunk) {
            chunks.push(chunk);
        });
        // Send the buffer or you can put it into a var
        const fileEx = '.' + file.originalname.split('.')[1];
        let fileName = ++fileId + fileEx;

        readStream.on("end", function () {
            //Send image to other image server through rabbitmq
            var imageServerData = {
                fileName: fileName,
                chapterId: req.params.chapterId,
                fileBuffer: chunks[0]
            }
            rabbitChannel.sendToQueue('image-server-new-image', Buffer.from(JSON.stringify(imageServerData)));

            var sqlServerData = {
                fileName: fileName,
                chapterId: req.params.chapterId,
                serverId: serverId
            }
            rabbitChannel.sendToQueue('sql-server-new-image', Buffer.from(JSON.stringify(sqlServerData)));

        });

        cb(null, fileName);
    }
});

let uploadManyFiles = multer({ storage: storage }).array("files", 30);

let multipleUploadMiddleware = util.promisify(uploadManyFiles);

let multipleUpload = async (req, res) => {
    try {

        await multipleUploadMiddleware(req, res);
        if (req.files.length <= 0) {
            return res.send(`You must select at least 1 file or more.`);
        }
        else {
            return res.send(`Your files has been uploaded.`);
        }
    } catch (error) {
        debug(error);
        if (error.code === "LIMIT_UNEXPECTED_FILE") {
            return res.send(`Exceeds the number of files allowed to upload.`);
        }
        return res.send('Error when trying upload many files: ${error}}');
    }
};
module.exports = {
    multipleUpload: multipleUpload
};