'use strict';

const csv = require('csvtojson');
const DcfMetaDataJsonValidator = require('./dcf-metadata-json-validator');
const DateTimeUtilsService = require('../sharedLib/common/date-time-utils')
const BuildInsertQueryService = require('./build-insert-query')

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

    async getJSONDataForDCFFromS3File(guid, s3Stream, db) {

        try {
            console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,initiated`);
            const json = await csv({delimiter:[',', '|', '\t'], includeColumns:/(Status|Document Code|Document Description|Action Date)/}).fromStream(s3Stream)
            console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,json.length: ${json.length}`);
            let isErrorFile = false;
            if(json.length === 0){
                console.log('empty DTC info file, no data available');
                return 'empty DTC info file, no data available';
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

                console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,isErrorFile: ${isErrorFile} dcfBodyData: ${JSON.stringify(dcfBodyData)}`);

                if ( isErrorFile ) {
                    console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,errArray: ${JSON.stringify(errArray)}`);

                    let additionalCols = `submsn_trans_actn_audt_log_id^nextval('esmd_data.submsn_trans_err_msg_id')~formula,msg_svrty_ind^Error,submsn_msg_type_name^ESMD_TO_RC_SUBMISSION_ERROR,sys_rec_creat_by^ESMD_APP_SP,sys_rec_creat_ts^now()~formula`
                    let columns = 'glbl_uniq_id^glbl_uniq_id,err_msg_desc^err_msg_desc'
                    let tableName = 'esmd_data.submsn_trans_err_msg'

                    const formattedDate = await BuildInsertQueryService.getInstance().buildErrMsgInsertQuery(guid, tableName, columns, additionalCols, errArray, db);
                    //TBD insert the records in table SUBMSN_TRANS_ERR_MSG and send email alert with error records data.

                    // INSERT INTO SUBMSN_TRANS_ERR_MSG (column_list)
                    //     VALUES
                    //     (value_list_1),
                    //     (value_list_2),

                    //     ...
                    //     ...
                    //     ...
                    // (value_list_n);

                    //column_list = SUBMSN_TRANS_ERR_MSG_ID,GLBL_UNIQ_ID,ERR_MSG_DESC,MSG_SVRTY_IND,SUBMSN_MSG_TYPE_NAME
                } else {
                    //TBD generate flat file record for each record and insert all the data into Postgres

                    console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,dcfBodyData: ${JSON.stringify(dcfBodyData)}`)
                }
            }    
            return SUCCESS

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