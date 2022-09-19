import { CreateBucketCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./libs/s3Client.js";

// Set the parameters
const params = {
  Bucket: process.env.AWS_BUCKET_NAME, // The name of the bucket. For example, 'sample_bucket_101'.
  Key: `sample_upload.txt`, // The name of the object. For example, 'sample_upload.txt'.
  Body: "Testing", // The content of the object. For example, 'Hello world!".
};

const run = async () => {
  // Create an Amazon S3 bucket.
  try {
    const data = await s3Client.send(
      new CreateBucketCommand({ Bucket: params.Bucket })
    );
    console.log(data);
    console.log("Successfully created a bucket called ", data.Location);
    return data; // For unit tests.
  } catch (err) {
    console.log("Error", err);
  }
  // Create an object and upload it to the Amazon S3 bucket.
  try {
    const results = await s3Client.send(new PutObjectCommand(params));
    console.log(
      "Successfully created " +
        params.Key +
        " and uploaded it to " +
        params.Bucket +
        "/" +
        params.Key
    );
    return results; // For unit tests.
  } catch (err) {
    console.log("Error", err);
  }
};
run();
