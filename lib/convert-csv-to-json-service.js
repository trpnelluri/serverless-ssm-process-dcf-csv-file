'use strict';

const csv = require('csvtojson');
const DcfMetaDataJsonValidator = require('./dcf-metadata-json-validator');
const DateTimeUtilsService = require('../sharedLib/common/date-time-utils')

let instance = null;
const clsName = 'ConvertCSVToJSONService'
const FAILURE = 'Failure'
const SUCCESS = 'Success'
const VALIDATIONSUCCESS = '1000'
const VALIDATIONFAILURE = '1001'
const EMPTYFILE = '1002'

class ConvertCSVToJSONService {

    static getInstance() {
        if (!instance) {
            instance = new ConvertCSVToJSONService();
        }
        return instance;
    }

    async getJSONDataForDCFFromS3File(guid, fileName, s3Stream) {

        try {
            console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,initiated`);
            const json = await csv({delimiter:[',', '|', '\t'], includeColumns:/(Status|Document Code|Document Description|Action Date)/}).fromStream(s3Stream)
            console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,json.length: ${json.length}`);
            let isErrorFile = false;
            if(json.length === 0){
                console.log('empty DCF file from PCG, no data available');
                let returndata = {
                    status: FAILURE,
                    code: EMPTYFILE,
                    data: null
                }
                return returndata
            } else {
                let noOfRecs = json.length
                const noOfRecsinCSVFile = await padLeadingZeros(noOfRecs, 7)
                let recordNum = 1;
                let errArray = [];
                let dcfBodyData = [];
                for await (const eachRec of json) {
                    const dateToBeFormatted = eachRec['Action Date']
                    if ( dateToBeFormatted !== '' && dateToBeFormatted !== null && dateToBeFormatted !== undefined ) {
                        console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,dateToBeFormatted: ${dateToBeFormatted}`)
                        const formattedDate = await DateTimeUtilsService.getInstance().formattedDate(guid, dateToBeFormatted);
                        console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,formattedDate: ${formattedDate}`)
                        eachRec['Action Date'] = formattedDate
                        console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,eachRec: ${JSON.stringify(eachRec)}`);
                        let validationResult = await _handleMetaDataValidation(guid, eachRec, recordNum);
                        if (validationResult.errorResponse){
                            isErrorFile = true
                            console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,isErrorFile: ${isErrorFile} validationResult.errorResponse: ${JSON.stringify(validationResult.errorResponse)}`);
                            errArray.push(validationResult.errorResponse.err)
                        } else {
                            let bodyObj = new Object;
                            bodyObj.recordtypeindicator = process.env.REC_TYPE_INDI_DCF_BODY
                            bodyObj.recordnumber = noOfRecsinCSVFile
                            bodyObj.actionstatus = eachRec['Status/Indicator']
                            bodyObj.documentcode = eachRec['Document Code']
                            bodyObj.documentdescription = eachRec['Document Description']
                            bodyObj.actiondate = eachRec['Action Date']
                            bodyObj.filler = null
                            dcfBodyData.push(bodyObj)
                        }
                        recordNum = recordNum + 1
                    }
                }

                console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,isErrorFile: ${isErrorFile} errArray: ${JSON.stringify(errArray)} dcfBodyData: ${JSON.stringify(dcfBodyData)} `);
                let returnData = new Object;
                if ( isErrorFile ) {
                    returnData = {
                        status: FAILURE,
                        code: VALIDATIONFAILURE,
                        data: errArray
                    } 
                } else {
                    returnData = {
                        status: SUCCESS,
                        code: VALIDATIONSUCCESS,
                        data: dcfBodyData
                    } 
                }
                return returnData
            }    

        } catch(err) {
            console.error(`${clsName},${guid},getJSONDataForDCFFromS3File,Error: ${err}`)
            return FAILURE
        }
       
    }

}

async function _handleMetaDataValidation(guid, json, recordNum, db ) {
    try {
        const result = await DcfMetaDataJsonValidator.getInstance().validate(guid, json, recordNum);
        if ( result.errors.length > 0 ) {
            let stringifyArray = result.errors.toString();
            console.log(`${clsName},${guid},_handlemetaDataValidation,stringifyArray: ${stringifyArray}`)
            let resp = {
                err: stringifyArray
            }
            return {body: null, errorResponse: resp};
        }
        return {body: result.body, errorResponse: null};
    } catch(err) {
        console.error(`${clsName},${guid},_handleMetaDataValidation,Error: ${err}`)
        //TBD error process
    }

}

async function padLeadingZeros(num, size) {
    return new Promise((resolve, reject) => {
        let retrunData = num + '';
        while (retrunData.length < size) { retrunData = '0' + retrunData; }
        resolve (retrunData)
    }).catch((error) => {
        console.error(`padLeadingZeros, ERROR: ${error}` )
    });
}

module.exports = ConvertCSVToJSONService;