import expect from "expect.js";
import { getS3Client, putFileToS3, getFileFromS3, resetS3Client, getListObjectsFromS3 } from "../src/S3Management.ts";
import { S3Client } from "@aws-sdk/client-s3";
import { createS3Client } from "mock-aws-s3-v3";
import fs from "fs";

describe("getS3Client(config?)", () => {
    it("Should fail because config is undefined and the client is not set", () => {
        expect(getS3Client).to.throwError()
    });
    it("Should return an instance of an S3Client", () => {
        const config = {
            endpoint: "http://0.0.0.0:9000",
            credentials: {
                accessKeyId: "dev",
                secretAccessKey: "devpasswd"
            }
        }
        expect(getS3Client(config) instanceof S3Client).to.be(true)
    });
    it("Should return an instance of the S3Client even with undefined config", () => {
        expect(getS3Client() instanceof S3Client).to.be(true)
    });
});

describe("putFileToS3(bucket, key, file, s3Client?)", () => {
    before(resetS3Client);
    after(() => {
        // Remove test files
        fs.rm("test/s3_mock/dev/put_test", {recursive: true}, (err) => {
            if (err) console.error(err);
        });
    });
    it("Should fail because s3Client is not set", async () => {
        const file = fs.readFileSync("test/test.xml");

        let thrown = false;
        try {
            await putFileToS3("dev", "put_test/test.xml", file);
        } catch (err) {
            thrown = true;
        }
        expect(thrown).to.be(true);
    });
    const mockClient = createS3Client({localDirectory: "./test/s3_mock", bucket: "dev"});
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
        const mockClient = createS3Client({localDirectory: "./test/s3_mock", bucket: "dev"});
        const s3File = await getFileFromS3("dev", "get_test/test.xml", mockClient);
        expect(await s3File.Body.transformToString()).to.be(fs.readFileSync("test/s3_mock/dev/get_test/test.xml").toString())
    })
})

describe("getListObjectsFromS3(bucket, prefix, s3Client?)", () => {
	before(resetS3Client);
	it("Should get the list of files from S3 (50 subfolders with 1 XML file and 1 PDF file each))", async () => {
		const mockClient = createS3Client({localDirectory: "./test/s3_mock", bucket: "dev"});
		const response = await getListObjectsFromS3("dev", "get_list_object_test", mockClient);
		expect(response.length).to.be(100);
		expect(response.filter(f => f.Key.endsWith(".pdf")).length).to.be(50)
		expect(response.filter(f => f.Key.endsWith(".xml")).length).to.be(50);
		expect(response.filter(f => f.Key.includes("ISTEX200900100194")).length).to.be(2)
	});
})
