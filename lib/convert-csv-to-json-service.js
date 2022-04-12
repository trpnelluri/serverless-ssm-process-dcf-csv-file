'use strict';

const csv = require('csvtojson');
const DcfMetaDataJsonValidator = require('./dcf-metadata-json-validator');
const DateTimeUtilsService = require('../sharedLib/common/date-time-utils')

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
            let isErrorFile = false;
            if(json.length === 0){
                console.log('empty DTC info file, no data available');
                return 'empty DTC info file, no data available';
            } else {

                let i = 0;
                for await (const eachRec of json) {
                    const dateToBeFormatted = eachRec['Action Date']
                    if ( dateToBeFormatted !== '' && dateToBeFormatted !== null && dateToBeFormatted !== undefined ) {
                        console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,eachRec: ${dateToBeFormatted}`)
                        const formattedDate = await DateTimeUtilsService.getInstance().formattedDate(guid, dateToBeFormatted);
                        console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,eachRec: ${formattedDate}`)
                        eachRec['Action Date'] = formattedDate
                        console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,eachRec: ${JSON.stringify(eachRec)}`);
                        let validationResult = await handleMetaDataValidation(guid, eachRec);
                        if (validationResult.errorResponse){
                            isErrorFile = true
                            console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,validationResult.errorResponse: ${JSON.stringify(validationResult.errorResponse)} isErrorFile: ${isErrorFile}`);
                            if ( i === 10 ) {
                                return FAILURE
                            }
                        } 
                        i = i + 1
                    }
                }
            }    
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