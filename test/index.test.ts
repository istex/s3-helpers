import {
  getS3Client,
  putObjectToS3,
  getObjectFromS3,
  getListObjectsFromS3,
  s3ObjectExists,
  getHeadObjectFromS3,
  getEnvConfig,
  getSHA1OfObject,
  getBucketAndKeyFromS3Path,
  putObjectToS3Path,
  getObjectFromS3Path,
  getListObjectsFromS3Path,
  s3ObjectExistsAtPath,
  getHeadObjectFromS3Path,
  getSAH1OfObjectAtPath,
  deleteObjectFromS3,
  deleteObjectFromS3Path,
} from "../src/index.js";
import { S3Client, type _Object, type S3ClientConfig } from "@aws-sdk/client-s3";
import { createS3Client } from "mock-aws-s3-v3";
import fs from "fs";
import { finished } from "stream/promises";
import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { createHash } from "crypto";

const config = {
  endpoint: "http://0.0.0.0:9000",
  credentials: {
    accessKeyId: "dev",
    secretAccessKey: "devpasswd",
  },
};

describe("getS3Client(config)", () => {
  it("Should return an instance of an S3Client", () => {
    expect(getS3Client(config) instanceof S3Client).toBe(true);
  });
});

describe("putObject(bucket, key, file, s3Client)", () => {
  afterAll(() => {
    try {
      fs.rmSync("test/s3_mock/dev/put_test", { recursive: true });
    } catch {

    }
  });

  const mockClient = createS3Client({
    localDirectory: "./test/s3_mock",
    bucket: "dev",
  });

  it("Should write the file in S3 (test/s3_mock) successfully", async () => {
    const file = fs.readFileSync("test/test.xml");

    await putObjectToS3("dev", "put_test/test.xml", file, mockClient);

    fs.readFileSync("test/s3_mock/dev/put_test/test.xml");
  });
});

describe("putObjectToS3Path(s3Path, file, s3Client)", () => {
  afterAll(() => {
    fs.rmSync(
      "test/s3_mock/dev/put_path_test",
      { recursive: true },
    );
  });

  it("Should write object using path", async () => {
    const mockClient = createS3Client({
      localDirectory: "./test/s3_mock",
      bucket: "dev",
    });

    const file = fs.readFileSync("test/test.xml");

    await putObjectToS3Path(
      "dev/put_path_test/test.xml",
      file,
      mockClient,
    );

    fs.readFileSync(
      "test/s3_mock/dev/put_path_test/test.xml",
    );
  });
});

describe("getObjectFromS3(bucket, key, s3Client)", () => {

  it("Should get the file from S3 (test/mock) successfully", async () => {
    const mockClient = createS3Client({
      localDirectory: "./test/s3_mock",
      bucket: "dev",
    });

    const s3Object = await getObjectFromS3("dev", "get_test/test.xml", mockClient);
    expect(s3Object).not.toBeUndefined();

    expect(await s3Object.Body?.transformToString()).toBe(
      fs.readFileSync("test/s3_mock/dev/get_test/test.xml").toString(),
    );
  });
});

describe("getObjectFromS3Path(s3Path, s3Client)", () => {
  it("Should fetch object using path", async () => {
    const mockClient = createS3Client({
      localDirectory: "./test/s3_mock",
      bucket: "dev",
    });

    const obj = await getObjectFromS3Path(
      "dev/get_test/test.xml",
      mockClient,
    );

    expect(
      await obj.Body?.transformToString(),
    ).toBe(
      fs.readFileSync(
        "test/s3_mock/dev/get_test/test.xml",
      ).toString(),
    );
  });
});

describe("getListObjectsFromS3(bucket, prefix, s3Client)", () => {

  it("Should get the list of files from S3 (50 subfolders with 1 XML file and 1 PDF file each))", async () => {
    const mockClient = createS3Client({
      localDirectory: "./test/s3_mock",
      bucket: "dev",
    });

    const streamNoMaxKeys = getListObjectsFromS3(
      "dev",
      "get_list_object_test", mockClient,
      { delimiter: "arbitrary delimiter" },
    );

    const objectsNoMaxKeys: _Object[] = [];
    streamNoMaxKeys.on("data", (data: _Object) => {
      objectsNoMaxKeys.push(data);
    });

    await finished(streamNoMaxKeys);

    const streamMaxKeys = getListObjectsFromS3(
      "dev",
      "get_list_object_test",
      mockClient,
      {
        delimiter: "arbitrary delimiter",
        maxKeys: 2,
      },
    );

    const objectsMaxKeys: _Object[] = [];
    streamMaxKeys.on("data", (data: _Object) => {
      objectsMaxKeys.push(data);
    });

    await finished(streamMaxKeys);

    expect(objectsMaxKeys).toEqual(objectsNoMaxKeys);
    expect(objectsNoMaxKeys.length).toBe(100);

    expect(
      objectsNoMaxKeys.filter((o) => o.Key?.toString().endsWith(".pdf") === true).length,
    ).toBe(50);

    expect(
      objectsNoMaxKeys.filter((o) => o.Key?.toString().endsWith(".xml") === true).length,
    ).toBe(50);

    expect(
      objectsNoMaxKeys.filter((o) =>
        o.Key?.toString().includes("33/file33.pdf") === true,
      ).length,
    ).toBe(1);
  });
});

describe("getListObjectsFromS3Path(s3Path, s3Client)", () => {
  it("Should list objects using path", async () => {
    const mockClient = createS3Client({
      localDirectory: "./test/s3_mock",
      bucket: "dev",
    });

    const stream = getListObjectsFromS3Path(
      "dev/get_list_object_test",
      mockClient,
      {
        delimiter: "delimiter",
        maxKeys: 2,
      },
    );

    const objects: _Object[] = [];

    stream.on("data", (obj: _Object) => {
      objects.push(obj);
    });

    await finished(stream);

    expect(objects.length).toBe(100);
  });
});

describe("s3ObjectExists(bucket, key, s3Client)", () => {
  const mockClient = createS3Client({
    localDirectory: "./test/s3_mock",
    bucket: "dev",
  });

  it("Should return true for an existing file", async () => {
    expect(await s3ObjectExists("dev", "get_test/test.xml", mockClient)).toBe(
      true,
    );
  });

  it("Should return false for a non existing file", async () => {
    expect(await s3ObjectExists("dev", "get_test/bana.na", mockClient)).toBe(
      false,
    );

    const mockClient2 = createS3Client({
      localDirectory: "s3_mock",
      bucket: "banana",
    });

    expect(
      await s3ObjectExists("banana", "banana/bana.na", mockClient2),
    ).toBe(false);
  });
});

describe("s3ObjectExistsAtPath(s3Path, s3Client)", () => {
  const mockClient = createS3Client({
    localDirectory: "./test/s3_mock",
    bucket: "dev",
  });

  it("Should return true for existing object", async () => {
    expect(
      await s3ObjectExistsAtPath(
        "dev/get_test/test.xml",
        mockClient,
      ),
    ).toBe(true);
  });

  it("Should return false for missing object", async () => {
    expect(
      await s3ObjectExistsAtPath(
        "dev/get_test/missing.xml",
        mockClient,
      ),
    ).toBe(false);
  });
});

describe("getHeadObjectFromS3(bucket, key, s3Client)", () => {
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

    expect(res).not.toBeUndefined();
    expect(res.ContentLength).toBe(4542);
  });

  it("Should throw an error trying to fetch the head of a non-existing object", async () => {
    await expect(
      getHeadObjectFromS3("dev", "put_test/test.xml", mockClient),
    ).rejects.toThrow();
  });
});

describe("getHeadObjectFromS3Path(s3Path, s3Client)", () => {
  it("Should return head object", async () => {
    const mockClient = createS3Client({
      localDirectory: "./test/s3_mock",
      bucket: "dev",
    });

    const res = await getHeadObjectFromS3Path(
      "dev/get_test/test.xml",
      mockClient,
    );

    expect(res.ContentLength).toBe(4542);
  });

  it("Should throw for missing object", async () => {
    const mockClient = createS3Client({
      localDirectory: "./test/s3_mock",
      bucket: "dev",
    });

    await expect(
      getHeadObjectFromS3Path(
        "dev/missing.xml",
        mockClient,
      ),
    ).rejects.toThrow();
  });
});

describe("getEnvConfig()", () => {
  it("Should create the config successfully", () => {
    process.env.S3_ENDPOINT = "http://example:9000";
    process.env.S3_KEY_ID = "4zot3";
    process.env.S3_ACCESS_KEY = "4n0th34un1ver53";
    const config: S3ClientConfig = getEnvConfig();
    expect(config.endpoint).to.be.equal("http://example:9000");
    expect((config.credentials)).to.deep.equal({ accessKeyId: "4zot3", secretAccessKey: "4n0th34un1ver53" });
  });
  it("Should throw an exception because the S3_ENDPOINT varible is missing", () => {
    delete process.env.S3_ENDPOINT;
    process.env.S3_KEY_ID = "4zot3";
    process.env.S3_ACCESS_KEY = "4n0th34un1ver53";
    expect(getEnvConfig).toThrow("Missing environment variable S3_ENDPOINT");
  })
  it("Should throw an exception because the S3_KEY_ID varible is missing", () => {
    process.env.S3_ENDPOINT = "http://example:9000";
    delete process.env.S3_KEY_ID;
    process.env.S3_ACCESS_KEY = "4n0th34un1ver53";
    expect(getEnvConfig).toThrow("Missing environment variable S3_KEY_ID");
  })
  it("Should throw an exception because the S3_ACCESS_KEY varible is missing", () => {
    process.env.S3_ENDPOINT = "http://example:9000";
    delete process.env.S3_ACCESS_KEY;
    process.env.S3_KEY_ID = "4zot3";
    expect(getEnvConfig).toThrow("Missing environment variable S3_ACCESS_KEY");
  })
})

describe("getSHA1OfObject(bucket, key, s3Client)", () => {

  it("Should return the SHA1 of an existing object", async () => {
    const mockClient = createS3Client({
      localDirectory: "./test/s3_mock",
      bucket: "dev",
    });

    const expected = createHash("sha1")
      .update(fs.readFileSync("test/s3_mock/dev/get_test/test.xml"))
      .digest("hex");

    const sha1 = await getSHA1OfObject(
      "dev",
      "get_test/test.xml",
      mockClient,
    );

    expect(sha1).toBe(expected);
  });

  it("Should throw an error for a non-existing object", async () => {
    const mockClient = createS3Client({
      localDirectory: "./test/s3_mock",
      bucket: "dev",
    });

    await expect(
      getSHA1OfObject("dev", "get_test/does_not_exist.xml", mockClient),
    ).rejects.toThrow();
  });
});

describe("getSAH1OfObjectAtPath(s3Path, s3Client)", () => {
  it("Should return SHA1 using path", async () => {
    const mockClient = createS3Client({
      localDirectory: "./test/s3_mock",
      bucket: "dev",
    });

    const expected = createHash("sha1")
      .update(
        fs.readFileSync(
          "test/s3_mock/dev/get_test/test.xml",
        ),
      )
      .digest("hex");

    expect(
      await getSAH1OfObjectAtPath(
        "dev/get_test/test.xml",
        mockClient,
      ),
    ).toBe(expected);
  });

  it("Should throw for missing object", async () => {
    const mockClient = createS3Client({
      localDirectory: "./test/s3_mock",
      bucket: "dev",
    });

    await expect(
      getSAH1OfObjectAtPath(
        "dev/get_test/does_not_exist.xml",
        mockClient,
      ),
    ).rejects.toThrow();
  });
});

describe("getBucketAndKeyFromS3Path(s3Path)", () => {
  it("Should split bucket and key correctly", () => {
    expect(
      getBucketAndKeyFromS3Path("dev/folder/test.xml"),
    ).toEqual({
      bucket: "dev",
      key: "folder/test.xml",
    });
  });

  it("Should throw if bucket cannot be determined", () => {
    expect(() =>
      getBucketAndKeyFromS3Path(""),
    ).toThrow();
  });

  it("Should throw if key is missing", () => {
    expect(() =>
      getBucketAndKeyFromS3Path("dev"),
    ).toThrow(
      "Could not determine key from the s3Path: dev",
    );
  });
});

describe("deteleObjectFromS3(bucket, key, s3Client)", () => {
  beforeAll(() => {
    fs.mkdirSync("test/s3_mock/dev/delete_object_test/", { recursive: true })
    fs.writeFileSync("test/s3_mock/dev/delete_object_test/test.txt", "never gonna give you uuup never gonna let you dooown");
  });
  it("Should delete the object from S3", async () => {
    const mockClient = createS3Client({
      localDirectory: "./test/s3_mock",
      bucket: "dev",
    });
    await deleteObjectFromS3("dev", "delete_object_test/test.txt", mockClient);
    expect(fs.existsSync("test/s3_mock/dev/delete_object/test/test.txt")).toEqual(false);
  })
})

describe("deteleObjectFromS3Path(s3Path, s3Client)", () => {
  beforeAll(() => {
    fs.mkdirSync("test/s3_mock/dev/delete_object_test/", { recursive: true })
    fs.writeFileSync("test/s3_mock/dev/delete_object_test/test.txt", "never gonna give you uuup never gonna let you dooown");
  });
  it("Should delete the object from S3", async () => {
    const mockClient = createS3Client({
      localDirectory: "./test/s3_mock",
      bucket: "dev",
    });
    await deleteObjectFromS3Path("dev/delete_object_test/test.txt", mockClient);
    expect(fs.existsSync("test/s3_mock/dev/delete_object/test/test.txt")).toEqual(false);
  })
})
