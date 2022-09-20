import {
  DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command,
  PutObjectCommand
} from "@aws-sdk/client-s3"
import pkg from "aws-sdk"
import dotenv from "dotenv"
import express from "express"
import multer from "multer"
import { v4 as uuid } from "uuid"
import { s3Client } from "./libs/s3Client.js"
const { S3 } = pkg;

dotenv.config();

const app = express();
const port = 8080;

const s3Uploadv2 = async (files) => {
  const s3 = new S3();

  const params = files.map((file) => {
    return {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `uploads/${uuid()}-${file.originalname}`,
      Body: file.buffer,
    };
  });

  return Promise.all(params.map((param) => s3.upload(param).promise()));
};

const s3Uploadv3 = async (files) => {
  const params = files.map((file) => {
    return {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `uploads/${uuid()}-${file.originalname}`,
      Body: file.buffer,
    };
  });

  return Promise.all(
    params.map((param) => s3Client.send(new PutObjectCommand(param)))
  );
};

// Local disk storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads')
//   },
//   filename: (req, file, cb) => {
//     const { originalname } = file
//     cb(null, `${uuid()}-${originalname}`)
//   },
// })

// memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10_000_000, files: 5 },
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.post("/upload", upload.array("file"), async (req, res) => {
  try {
    const results = await s3Uploadv3(req.files);
    console.log(results);
    return res.json({ status: "success" });
  } catch (err) {
    console.log(err);
  }
});

app.get("/list", async (req, res) => {
  let r = await s3Client.send(
    new ListObjectsV2Command({ Bucket: process.env.AWS_BUCKET_NAME })
  );
  let x = r.Contents.map((item) => item.Key);
  res.send(x);
});

app.get("/download/:filename", async (req, res) => {
  const fileName = req.params.filename;
  const file = await s3Client.send(
    new GetObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME, Key: fileName })
  );
  res.send(file.Body);
});

app.delete("/delete/:filename", async (req, res) => {
  const filename = req.params.filename;
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: filename,
    })
  );
  res.send("File Deleted Successfully");
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          message: "Too many files to upload",
        });
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          message: "File is too large",
        });
      default:
        break;
    }
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
