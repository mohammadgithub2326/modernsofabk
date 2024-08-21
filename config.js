 
// const google =require("@/utils/")
const { google } = require('googleapis');

exports.drive = google.drive({
    version: 'v3',
    auth: new google.auth.GoogleAuth({
        keyFile:process.env.GOOGLE_CLOUD_CREDENTIALES, // Path to your service account key file
        scopes: ['https://www.googleapis.com/auth/drive.file']
    })
});
// console.log('Drive API  initialized:', exports.drive);CDs