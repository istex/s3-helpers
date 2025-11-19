import expect from "expect.js";
import {
  getS3Client,
  putFileToS3,
  getFileFromS3,
  resetS3Client,
  getListObjectsFromS3,
  s3FileExists,
  getHeadObjectFromS3,
} from "../src/S3Management.ts";
import { S3Client } from "@aws-sdk/client-s3";
import { createS3Client } from "mock-aws-s3-v3";
import fs from "fs";
import { finished } from "stream/promises";

describe("getS3Client(config?)", () => {
  it("Should fail because config is undefined and the client is not set", () => {
    expect(getS3Client).to.throwError();
  });
  it("Should return an instance of an S3Client", () => {
    const config = {
      endpoint: "http://0.0.0.0:9000",
      credentials: {
        accessKeyId: "dev",
        secretAccessKey: "devpasswd",
      },
    };
    expect(getS3Client(config) instanceof S3Client).to.be(true);
  });
  it("Should return an instance of the S3Client even with undefined config", () => {
    expect(getS3Client() instanceof S3Client).to.be(true);
  });
});

describe("putFileToS3(bucket, key, file, s3Client?)", () => {
  before(resetS3Client);
  after(() => {
    // Remove test files
    fs.rm("test/s3_mock/dev/put_test", { recursive: true }, (err) => {
      if (err) console.error(err);
    });
  });
  it("Should fail because s3Client is not set", async () => {
    const file = fs.readFileSync("test/test.xml");

    let thrown = false;
    try {
      await putFileToS3("dev", "put_test/test.xml", file);
    } catch {
      thrown = true;
    }
    expect(thrown).to.be(true);
  });
  const mockClient = createS3Client({
    localDirectory: "./test/s3_mock",
    bucket: "dev",
  });
  it("Should write the file in S3 (test/s3_mock) successfully", async () => {
    const file = fs.readFileSync("test/test.xml");
    await putFileToS3("dev", "put_test/test.xml", file, mockClient);
    expect(!!fs.readFileSync("test/s3_mock/dev/put_test/test.xml")).to.be(true);
  });
});

describe("getFileFromS3(bucket, key, s3Client?)", () => {
  before(resetS3Client);
  it("Should fail because s3Client is not set", async () => {
    const file = fs.readFileSync("test/test.xml");

    let thrown = false;
    try {
      await getFileFromS3("dev", "get_test/test.xml", file);
    } catch (err) {
      thrown = true;
    }
    expect(thrown).to.be(true);
  });
  it("Should get the file from S3 (test/mock) successfully", async () => {
    const mockClient = createS3Client({
      localDirectory: "./test/s3_mock",
      bucket: "dev",
    });
    const s3File = await getFileFromS3("dev", "get_test/test.xml", mockClient);
    expect(await s3File.transformToString()).to.be(
      fs.readFileSync("test/s3_mock/dev/get_test/test.xml").toString(),
    );
  });
});

describe("getListObjectsFromS3(bucket, prefix, s3Client?)", () => {
  before(resetS3Client);
  it("Should get the list of files from S3 (50 subfolders with 1 XML file and 1 PDF file each))", async () => {
    const mockClient = createS3Client({
      localDirectory: "./test/s3_mock",
      bucket: "dev",
    });
    const streamNoMaxKeys = getListObjectsFromS3(
      "dev",
      "get_list_object_test",
      "arbitrary delimiter",
      null,
      mockClient,
    );

    const objectsNoMaxKeys = [];
    streamNoMaxKeys.on("data", (data) => {
      objectsNoMaxKeys.push(data);
    });
    await finished(streamNoMaxKeys);

    const streamMaxKeys = getListObjectsFromS3(
      "dev",
      "get_list_object_test",
      "arbitrary delimiter",
      2,
      mockClient,
    );

    const objectsMaxKeys = [];
    streamMaxKeys.on("data", (data) => {
      objectsMaxKeys.push(data);
    });
    await finished(streamMaxKeys);

    expect(objectsMaxKeys).eql(objectsNoMaxKeys);
    expect(objectsNoMaxKeys.length).to.be(100);
    expect(
      objectsNoMaxKeys.filter((o) => o.Key.toString().endsWith(".pdf")).length,
    ).to.be(50);
    expect(
      objectsNoMaxKeys.filter((o) => o.Key.toString().endsWith(".xml")).length,
    ).to.be(50);
    expect(
      objectsNoMaxKeys.filter((o) => o.Key.toString().includes("33/file33.pdf"))
        .length,
    ).to.be(1);
  });
});

describe("s3FileExists(bucket, key)", () => {
  const mockClient = createS3Client({
    localDirectory: "./test/s3_mock",
    bucket: "dev",
  });

  it("Should return true for an existing file", async () => {
    expect(await s3FileExists("dev", "get_test/test.xml", mockClient)).to.be(
      true,
    );
  });
  it("Should return false for a non existing file", async () => {
    expect(await s3FileExists("dev", "get_test/bana.na", mockClient)).to.be(
      false,
    );
    const mockClient2 = createS3Client({
      localDirectory: "s3_mock",
      bucket: "banana",
    });
    expect(await s3FileExists("banana", "banana/bana.na", mockClient2)).to.be(
      false,
    );
  });
});

describe("getHeadObjectFromS3(bucket, key, s3Client?)", () => {
  const mockClient = createS3Client({
    localDirectory: "./test/s3_mock",
    bucket: "dev",
  });
  it("Should return HeadObject of the existing file", async () => {
    const res = await getHeadObjectFromS3(
      "dev",
      "get_test/test.xml",
      mockClient,
    );
    expect(res).to.not.be(undefined);
    expect(res.Key).to.be("get_test/test.xml");
    expect(res.ContentLength).to.be(4542);
  });
  it("Should throw an error trying to fetch the head of a non-existing object", async () => {
    let thrown = false;
    try {
      await getHeadObjectFromS3("dev", "put_test/test.xml", mockClient);
    } catch {
      thrown = true;
    }
    expect(thrown).to.be(true);
  });
});
