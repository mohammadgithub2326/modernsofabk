const stream = require('stream');

const {drive} = require("../config")


exports.uploadImagesToDrive = async (files) => {
    const folderId = process.env.GOOGLEDRIVEFILEID; // Replace with your Google Drive folder ID
    const urls = [];

    if (!files || files.length === 0) {
        console.log('No files to upload');
        return [];
      }
      console.log( "this is a uploadimagestodrive method files :"+files)
      console.log("this is a uploadimagestocrive method and drive console  "+ drive)

    console.log('Starting image upload to Google Drive...');
    for (let file of files) {
        console.log("this is a file.originalname: " + file.originalname)
        console.log(`Uploading file: ${file.originalname}`);

        const bufferStream = new stream.PassThrough();
        bufferStream.end(file.buffer);  // Create a stream from the buffer


        const fileMetadata = {
            name: file.originalname,
            parents: [folderId],
        };
        const media = {
            mimeType: file.mimetype,
            body: bufferStream,
        };
        try {
            const jwtPayload = {
                // ... your JWT claims here
            };
            console.log("JWT Payload (before signing):", jwtPayload);
            const res = await drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id',
            });
            console.log(`File uploaded with ID: ${res.data.id}`);
            const fileId = res.data.id;
            await drive.permissions.create({
                fileId: fileId,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                },
            });
            const url = `https://drive.google.com/uc?id=${fileId}`;
            urls.push(url);
            console.log(`File accessible at URL: ${url}`);
        } catch (error) {
            console.log('Error uploading file:', error.message);
            error.response?console.log(error.response):
            console.log('Error uploading file:', error.message);
            
        }
    }
    return urls;
}