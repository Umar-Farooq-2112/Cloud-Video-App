const { Storage } = require('@google-cloud/storage');

require('dotenv').config();


const projectId = process.env.PROJECT_ID;
const keyFilename = process.env.KEYFILENAME;
const bucketName = process.env.BUCKET_NAME;

const storage = new Storage({ projectId, keyFilename });

// console.log(projectId);
// console.log(keyFilename);
// console.log(process.env.BUCKET_NAME);

async function uploadFile(file, fileOutputName) {
    try {
        const bucket = storage.bucket(bucketName);

        const ret = await bucket.upload(file, {
            destination: fileOutputName
        });

        return 0;
    } catch (error) {
        console.error('Error:', error);
        return 1;
    }
}

// Function to upload file to Google Cloud Storage
async function uploadFileToBucket(fileBuffer, fileName) {
    try {
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(fileName);
      await file.save(fileBuffer);
      return {
        message: 'File uploaded successfully to cloud bucket!',
        fileName,
        bucketName
      };
    } catch (error) {
      console.error('Error uploading file to bucket:', error);
      throw new Error('Failed to upload file to cloud bucket.');
    }
  }

async function deleteFile(fileName) {
    try {
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(fileName);

        // Check if the file exists
        const [exists] = await file.exists();
        if (exists) {
            // Delete the file
            await file.delete();
            console.log(`File ${fileName} deleted successfully.`);
            return 0;
        } else {
            console.log(`File ${fileName} does not exist.`);
            return 0;
        }
    } catch (error) {
        console.error('Error while deleting file:', error);
        return 1;
    }
}


// (async () => {
//         const ret = await uploadFile('temp.txt', 'CodingWithAdo.txt');
//         console.log("Uplaoded Successfully");
//         // console.log(ret);
//     })();

    // deleteFile('1/Coding');

// module.exports = uploadFile,uploadFileToBucket,deleteFile;
module.exports = uploadFileToBucket;