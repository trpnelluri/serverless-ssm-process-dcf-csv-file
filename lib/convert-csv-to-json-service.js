'use strict';

const csv = require('csvtojson');

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
            await csv({delimiter:[',', '|', '\t'], includeColumns:/(Status|Document Code|Document Description|Action Date)/}).fromStream(s3Stream)
                .on('data', function (row) {
                    let jsonContent = JSON.parse(row);
                    console.log(`${clsName},${guid},getJSONDataForDCFFromS3File,jsonContent: ${JSON.stringify(jsonContent)}`);
                    //TBD need to validate each row from CSV file
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

module.exports = ConvertCSVToJSONService;