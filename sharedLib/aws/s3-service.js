'use strict';

const AWS = require('aws-sdk');

const s3Client = new AWS.S3();
const clsName = 'S3Service'
let instance = null;

class S3Service{

    static getInstance()
    {
        if(!instance){
            instance = new S3Service();
        }
        return instance;
    }

    async getObj(guid, bucket, key) {
        const params = {
            Bucket: bucket,
            Key: key,
        };
        console.log(`${clsName},${guid},getObj,params: ${JSON.stringify(params)}`)
        try {
            let data = await s3Client.getObject(params).promise();
            let strData = data.Body.toString('utf-8');
            let objData = JSON.parse(strData); // passing the buffer directly will have it converted to string
            console.log(`${clsName},${guid},getObj,objData: ${JSON.stringify(objData)}`)
            return objData
        } catch (err) {
            console.error(`${clsName},${guid},getObj,ERROR in getObj catch ${JSON.stringify(err.stack)}`)
            throw Error(`S3Service.getObj,Failed to get file ${key}, from ${bucket}, Error: ${JSON.stringify(err)}`);
        }
    }

    async getText(guid, bucket, key) {
        const params = {
            Bucket: bucket,
            Key: key,
        };
        console.log(`${clsName},${guid},getText,params: ${JSON.stringify(params)}`)
        try {
            let data = await s3Client.getObject(params).promise();
            console.log(`${clsName},${guid},getText,data: ${data.Body.toString()}`)
            return data.Body.toString();
        } catch (err) {
            console.error(`${clsName},${guid},getText,ERROR in getObj catch ${JSON.stringify(err.stack)}`)
            throw Error(`S3Service.getText, Failed to get file ${key}, from ${bucket}, Error: ${JSON.stringify(err)}`);
        }
    }

    async exists(guid, bucket, key) {
        const params = {
            Bucket: bucket,
            Key: key,
        };
        console.log(`${clsName},${guid},exists,params: ${JSON.stringify(params)}`)
        try {
            const info = await s3Client.headObject(params).promise();
            console.log(`${clsName},${guid},exists,File Exists: ${JSON.stringify(info)}`);
            return true;
        } catch (err) {
            if (err.statusCode === 404) {
                return false
            }
            throw Error(`S3Service.exists> There was an error getting information on the file ${key}, for ${bucket}, Error: ${JSON.stringify(err)}`);
        }
    }
    /*
    //TBD to use in future
    async write(obj, bucket, key) {
        return this.writeText(JSON.stringify(obj), bucket, key);
    }

    async writeText(txt, bucket, key) {
        const params = {
            Bucket: bucket,
            Body: txt,
            Key: key,
        };

        try {
            return await s3Client.putObject(params).promise();
        } catch (err) {
            throw Error(`S3Service.get> There was an error writing the file ${key}, for ${bucket}, Error: ${JSON.stringify(err)}`);
        }
    }
    */
}

module.exports = S3Service;