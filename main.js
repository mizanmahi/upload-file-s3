import express from 'express';
import multer from 'multer';
import AWS from 'aws-sdk';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const port = 5000;

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Configure multer for file upload with custom storage directory
const upload = multer({ dest: 'uploads/' });


const uploadFileToS3 = async (file) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${Date.now()}_${file.originalname}`, // Unique file name
    Body: fs.createReadStream(file.path),
    ContentType: file.mimetype,
  };

  return s3.upload(params).promise();
};


app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  
  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    // Upload the file to S3
    const data = await uploadFileToS3(file);

    // Delete the file locally after uploading
    fs.unlinkSync(file.path);

    
    res.json({
      message: 'File uploaded successfully',
      url: data.Location,
    });
  } catch (error) {
    console.error('Error uploading file:', error);

    // Delete the file locally if an error occurs during upload
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    res.status(500).json({ message: 'Error uploading file' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
