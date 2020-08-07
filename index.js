express = require('express');
const fs = require('fs');
const multipleUpload = require('./multiUploadMiddleware').multipleUpload;//Already setup

//Set up app server
const app = express();
app.use(function (err, req, res, next) {
    console.error(err)
    res.status(500).send('Something broke!')
});
// app.use(express.urlencoded({extended: true}));

app.get('/image/:fileName', function (req, res) {
    var fileName = req.params.fileName;
    var readStream = fs.createReadStream(__dirname + '/uploadImage/' + fileName);
    readStream.on('open', function () {
        readStream.pipe(res);
    });
    readStream.on('error', function (err) {
        res.status(400);
        res.end('Cannot find the image');
    });
});
app.post('/image/:comicId', function (req, res) {
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        return res.status(401).end('You dont have permissison to POST');
    }

    // verify auth credentials
    const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    if(username!='root'||password!='root') res.status(401).end('You dont have permissison to POST');

    multipleUpload(req, res);
});
app.get('*', function (req, res) {
    res.status(404);
    res.end("404 not found!");
})



//Start server
app.listen(3000);




