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

    async generateFlatFileRecord (guid, dcfMetaData) {
        try {
            const objKeyName = await populateKeyName(guid, configFolder, configObjName)
            console.log(`${clsName},${guid},generateFlatFileRecord,objKeyName: ${objKeyName}`);
            const mapObj = await S3ServiceShared.getInstance().getObj(guid, bucket, objKeyName);
            console.log(`${clsName},${guid},generateFlatFileRecord,mapObj: ${JSON.stringify(mapObj)}`);
            //TBD need to loop the array data to build the insert statements
            let dcfMetaDataArray = [];
            for await (let eachRecord of dcfMetaData) {
                console.log(`${clsName},${guid},generateFlatFileRecord,paReqFFRecData: ${JSON.stringify(eachRecord)}`);
                dcfMetaDataArray.push(eachRecord)
                const flatFileRecData = fixy.unparse(mapObj, dcfMetaDataArray)
                console.log(`${clsName},${guid},generateFlatFileRecord,paReqFFRecData: ${JSON.stringify(flatFileRecData)}`);
                //TBD need to prepare the insert statement values and columns
                dcfMetaDataArray.length = 0
            }
            return SUCCESS
        } catch (err) {
            console.error(`${clsName},${guid},generateFlatFileRecord,ERROR: : ${err.stack}` )
            throw new Error('generateFlatFileRecord,Completed with errors.');
        }

    }

}

module.exports = GenerateFlatFileRecordService
