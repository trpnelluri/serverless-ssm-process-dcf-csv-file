'use strict';

/**
 *  This is an esMD service to convert the request JSON obj into flatfile record.
 *
 * @author Siva Nelluri
 * @date 04/20/2022
 * @version 1.0.0
 *
*/

const fixy = require('fixy')
const { populateKeyName } = require('../sharedLib/common/populate-keyname');
const S3ServiceShared = require('../sharedLib/aws/s3-service');

let instance = null;
const clsName = 'GenerateFlatFileRecordService'
const bucket = process.env.CONFIG_BUCKET_NAME;
const configFolder = process.env.DCF_CONFIG_FOLDER
const configObjName = process.env.DCF_BODY_OBJNAME
const SUCCESS = 'Success'
const FAILURE = 'Failure'

class GenerateFlatFileRecordService {

    static getInstance() {
        if (!instance) {
            instance = new GenerateFlatFileRecordService();
        }
        return instance;
    }

    async generateFlatFileRecord (guid, fileName, dcfMetaData) {

        let esMDInsertData = [];
        try {
            const objKeyName = await populateKeyName(guid, configFolder, configObjName)
            console.log(`${clsName},${guid},generateFlatFileRecord,objKeyName: ${objKeyName}`);
            const mapObj = await S3ServiceShared.getInstance().getObj(guid, bucket, objKeyName);
            console.log(`${clsName},${guid},generateFlatFileRecord,mapObj: ${JSON.stringify(mapObj)}`);
            let dcfMetaDataArray = [];
            for await (let eachRecord of dcfMetaData) {
                console.log(`${clsName},${guid},generateFlatFileRecord,paReqFFRecData: ${JSON.stringify(eachRecord)}`);
                dcfMetaDataArray.push(eachRecord)
                const flatFileRecData = fixy.unparse(mapObj, dcfMetaDataArray)
                eachRecord.glbl_uniq_id = guid
                eachRecord.fil_name = fileName
                eachRecord.flat_fil_rec_obj = flatFileRecData
                console.log(`${clsName},${guid},generateFlatFileRecord,paReqFFRecData: ${JSON.stringify(flatFileRecData)} eachRecord: ${JSON.stringify(fileName)}`);
                esMDInsertData.push(eachRecord)
                dcfMetaDataArray.length = 0
            }
            const resData = {
                status: SUCCESS,
                insertdata: esMDInsertData
            }
            return resData
        } catch (err) {
            console.error(`${clsName},${guid},generateFlatFileRecord,ERROR: : ${err.stack}` )
            throw new Error('generateFlatFileRecord,Completed with errors.');
        }

    }

}

module.exports = GenerateFlatFileRecordService
