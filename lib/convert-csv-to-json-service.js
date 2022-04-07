'use strict';

const csv = require('csvtojson');
//const DcfMetaDataJsonValidator = require('./dcf-metadata-json-validator');

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
            await csv({delimiter:[',', '|', '\t'], includeColumns:/(Status|DocumentCode|DocumentDescription|ActionDate)/}).fromStream(s3Stream)
                .on('data', function (row) {
                    let jsonContent = JSON.parse(row);
                    console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,jsonContent: ${JSON.stringify(jsonContent)}`);
                    //TBD need to validate each row from CSV file
                    //let validationResult = handleMetaDataValidation( jsonContent );
                })
                .on('end', function (){
                    console.log('***************DCF data**************')
                })
                .on('error', function(error){
                    console.log('DCF data error>>>' + error)
                })
    
            return 'SUCCESS'

        } catch(err) {
            console.error(`${clsName},${guid},getJSONDataForDCFFromS3File,Error: ${err}`)
            return FAILURE
        }
       
    }

}
/*
async function handleMetaDataValidation(json) {

    const result = await DcfMetaDataJsonValidator.getInstance().validate(json);

    if ( result.errors.length > 0 ) {
        let stringifyArray = result.errors.toString();
        console.log(`${clsName},-,handlemetaDataValidation,stringifyArray: ${stringifyArray}`)
        let resp = {
            err: stringifyArray
        }
        return {body: null, errorResponse: resp};
    }
    return {body: result.body, errorResponse: null};
}
*/

module.exports = ConvertCSVToJSONService;