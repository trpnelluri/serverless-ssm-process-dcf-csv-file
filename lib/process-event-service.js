'use strict';
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const ConvertCSVToJSONService = require('./convert-csv-to-json-service')

let instance = null;
const bucketName = process.env.BUCKET_NAME
const clsName = 'ProcessEventService'
const FAILURE = 'Failure'
const SUCCESS = 'Success'

class ProcessEventService {

    static getInstance() {
        if (!instance) {
            instance = new ProcessEventService();
        }
        return instance;
    }

    async processEvent(event) {
        try {
            if (event !== null) {
                const msgBody = JSON.parse(event.Records[0].body)
                console.log(`${clsName},-,processEvent,msgBody: ${JSON.stringify(msgBody)}`);
                let guid = msgBody.guid
                let fileDirectory = msgBody.directory
                let fileName = msgBody.files[0].filename;
                let keyName = fileDirectory + fileName
                console.log(`${clsName},${guid},processEvent,fileDirectory: ${fileDirectory} fileName: ${fileName} keyName: ${keyName}`)
                const getObjectParams = {
                    Bucket:bucketName,
                    Key: keyName,
                };
                const s3Stream = s3.getObject(getObjectParams).createReadStream();
                const convertCSVToJSONService = ConvertCSVToJSONService.getInstance()
                let response = await convertCSVToJSONService.getJSONDataForDCFFromS3File(guid, s3Stream);

                return SUCCESS
            }

        } catch (err) {
            console.error(`${clsName},-,processEvent,Read Order File Error : ${err}`);
        }
    }
}

module.exports = ProcessEventService;