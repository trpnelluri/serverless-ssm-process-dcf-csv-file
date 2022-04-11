'use strict';

const csv = require('csvtojson');
const DcfMetaDataJsonValidator = require('./dcf-metadata-json-validator');

let instance = null;
const clsName = 'ConvertCSVToJSONService'
const FAILURE = 'Failure'
const SUCCESS = 'Success'

class ConvertCSVToJSONService {

    static getInstance() {
        if (!instance) {
            instance = new ConvertCSVToJSONService();
        }
        return instance;
    }

    async getJSONDataForDCFFromS3File(guid, s3Stream) {

        try {
            console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,initiated`);
            const json = await csv({delimiter:[',', '|', '\t'], includeColumns:/(Status|Document Code|Document Description|Action Date)/}).fromStream(s3Stream)
            console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,json.length: ${json.length}`);
            if(json.length === 0){
                console.log('empty DTC info file, no data available');
                return 'empty DTC info file, no data available';
            } else {
                for await (const eachRec of json) {
                    console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,eachRec: ${eachRec['Action Date']}`)
                    console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,eachRec: ${JSON.stringify(eachRec)}`);
                }
            }
          
            // await csv({delimiter:[',', '|', '\t'], includeColumns:/(Status|Document Code|Document Description|Action Date)/}).fromStream(s3Stream)
            //     .on('data', function (row) {
            //         let jsonContent = JSON.parse(row);
            //         console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,jsonContent: ${JSON.stringify(jsonContent)}`);
            //         //TBD need to validate each row from CSV file
            //         let validationResult = handleMetaDataValidation(guid, jsonContent);
            //         if (validationResult.errorResponse){
            //             console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,validationResult.errorResponse: ${JSON.stringify(validationResult.errorResponse)}`);
            //             return FAILURE
            //         }
            //     })
            //     .on('end', function (){
            //         console.log('***************DCF data**************')
            //     })
            //     .on('error', function(error){
            //         console.log('DCF data error>>>' + error)
            //     })
    
            return SUCCESS

        } catch(err) {
            console.error(`${clsName},${guid},getJSONDataForDCFFromS3File,Error: ${err}`)
            return FAILURE
        }
       
    }

}

async function handleMetaDataValidation(guid, json ) {
    const result = await DcfMetaDataJsonValidator.getInstance().validate(guid, json);
    if ( result.errors.length > 0 ) {
        let stringifyArray = result.errors.toString();
        console.log(`${clsName},${guid},handlemetaDataValidation,stringifyArray: ${stringifyArray}`)
        let resp = {
            err: stringifyArray
        }
        return {body: null, errorResponse: resp};
    }
    return {body: result.body, errorResponse: null};
}

module.exports = ConvertCSVToJSONService;