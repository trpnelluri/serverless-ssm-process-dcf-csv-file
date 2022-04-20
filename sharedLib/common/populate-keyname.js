'use strict';
/**
 *  This is an esMD service to populate actual config object name to retrevie from AWS s3 bucket .
 * 
 *  @author Siva Nelluri
 *	@date 04/20/2022
 *	@version 1.0.0
 * 
*/


const clsName = 'PopulateKeyName'

/*
The follwoing method is used to build the object name to retrive from aws s3 bucket.
    params: glblUniqId: esMD global unique id Ex: AWSC00007091000
    configFolder: config folder Name in aws S3 bucket Ex: 'config/pa-req-esmd-to-dc/'
    objName: actual object name which we need to retrieve from s3 Ex: 'body.json'
*/
async function populateKeyName(guid, configFolder, objName) {
    return new Promise((resolve, reject) => {
        const finalKeyNameInS3 = `${configFolder}${objName}`
        console.log(`${clsName},${guid},populateKeyName,configFolder: ${configFolder} objName: ${objName} finalKeyNameInS3: ${finalKeyNameInS3}` )
        resolve(finalKeyNameInS3)
    }).catch((error) => {
        console.error(`populateKeyName,ERROR: ${error}` )
    });
}

module.exports = {
    populateKeyName,
};