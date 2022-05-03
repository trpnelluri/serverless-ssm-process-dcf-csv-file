'use strict';
const PostgresSQLService = require('../sharedLib/db/postgre-sql-service')

let instance = null;
const clsName = 'BuildInsertQueryService'
const SUCCESS = 'Success'
const FAILURE = 'Failure'
//const maxNoOfRecsToInsert = process.env.MAX_NO_OF_RECS_TO_INSERT
const maxNoOfRecsToInsert = 4

class BuildInsertQueryService {
    static getInstance() {
        if (!instance) {
            instance = new BuildInsertQueryService();
        }
        return instance;
    }

    async buildInsertQuery(guid, tableName, columns, additionalCols, insertData, noOfRecords, isErrorMsgData, pool) {
        try {
            console.log(`${clsName},${guid},buildInsertQuery,requiredData additionalCols: ${additionalCols} columns: ${columns} tableName: ${tableName}`);
            let dbColumnNames = '';
            let values = '';
            if ( additionalCols !== undefined && additionalCols !== null) {
                const additionalColObj = additionalCols.split(',');
                console.log(`buildInsertQuery,additionalColObj: ${additionalColObj.length}`);
                additionalColObj.forEach((element) => {
                    console.log(`buildInsertQuery,additionalColObj element: ${element}`);
                    const refDbAttribute = element.trim();
                    const refDbAttrArray = refDbAttribute.split('^');
                    let dbColName = refDbAttrArray[0]
                    let dbColValue = refDbAttrArray[1]
                    if ( dbColName !== '' ){
                        if (dbColumnNames !== '') {
                            dbColumnNames += ', ';
                        }
                        dbColumnNames += dbColName;
                        if (values !== '') {
                            values += ', ';
                        }
                        // This Condition is for Formula columns and populate values
                        // nextval('esmd_data.seq_actn_audt_log_id')~formula
                        if (refDbAttrArray[1].indexOf('~') > -1) {
                            const valuesArry = refDbAttrArray[1].split('~');
                            values += `${valuesArry[0]}`;
                        } else {
                            values += `'${dbColValue}'`;
                        }

                    }
                });
            }

            if ( isErrorMsgData ) {
                const dbErrInsertData = await _formatErrMsgDsc (guid, tableName, dbColumnNames, values, insertData, noOfRecords, pool);
                return dbErrInsertData
            } else {
                const dbDCFInsertData = await _populateInsertData (guid, tableName, columns, dbColumnNames, values, insertData, noOfRecords, pool);
                return dbDCFInsertData
            }
     
        } catch(err){
            console.error(`${clsName},${guid},buildInsertQuery,Error: ${err}`)
            return FAILURE
        }
        
    }

}

async function _populateInsertData (guid, tableName, columns, dbColumnNames, values, insertData, noOfRecords, pool) {
    try {
        console.log(`${clsName},${guid},_populateInsertData, noOfRecords: ${noOfRecords} tableName: ${tableName} columns: ${columns} dbColumnNames: ${dbColumnNames}`);
        let insertDataValsArray = [];
        let i = 0
        for await (const eachRec of insertData) {
            console.log(`${clsName},${guid},_populateInsertData,eachRec: ${JSON.stringify(eachRec)} i: ${i}`);
            const columnsObj = columns.split(',');
            console.log(`${clsName},${guid},_populateInsertData,columnsObj: ${columnsObj.length}`);
            let valuesUpdated = '';
            valuesUpdated = values
            columnsObj.forEach((element) => {
                const dbAttribute = element.toLowerCase().trim();
                let dbAttrArray = dbAttribute.split('^');
                const attributeName = dbAttrArray[0];
                const dbColName = dbAttrArray[1];
                if (attributeName !== '') { // Column Names from properties files
                    if ( i === 0 ) {
                        if (dbColumnNames !== '') {
                            dbColumnNames += ', ';
                        }
                        dbColumnNames += dbColName;
                    }
                   
                    if (valuesUpdated !== '') {
                        valuesUpdated += ', ';
                    }
                    if ( eachRec[attributeName] ) {
                        valuesUpdated += `'${eachRec[attributeName]}'`;
                    } else {
                        console.error(`${clsName},${guid},_populateInsertData,Error: ${attributeName} not availble in data.`)
                    } 
                }
            });

            insertDataValsArray.push(`(${valuesUpdated})`)
            i += 1
            // Inserting the records into esMD if the count of the records is equal to maxNoOfRecsToInsert mentioned in the env properties OR at the of the total records
            if ((i % maxNoOfRecsToInsert === 0) || i === noOfRecords ) {
                let bulkInsertResponse = await _executeBulkInsert (guid, tableName, dbColumnNames, insertDataValsArray, i, noOfRecords, pool) 
                console.log(`${clsName},${guid},_populateInsertData,columnsObj: ${bulkInsertResponse}`);
                if ( bulkInsertResponse === SUCCESS) {
                    insertDataValsArray.length = 0
                    if ( i === noOfRecords ) {
                        return bulkInsertResponse
                    }
                }
            }
        }        
    } catch(err) {
        console.error(`${clsName},${guid},_populateInsertData,Error: ${err}`)
    }
}

async function _formatErrMsgDsc (guid, tableName, dbColumnNames, values, errMsgData, noOfRecords, pool) {
    //Sample format of the return value of errMsgData
    // ["ESMD_707-EITHER THE DOCUMENT CODE IS MISSING OR THE FORMAT IS INVALID FOR RECORD: 3",
    //  "ESMD_709-EITHER THE ACTION STATUS IS MISSING OR INVALID - VALID VALUES ARE(A,U,M,E) FOR RECORD: 8^ESMD_707-EITHER THE DOCUMENT CODE IS MISSING OR THE FORMAT IS INVALID FOR RECORD: 8"
    // ]
    try {
        console.log(`${clsName},${guid},_formatErrMsgDsc, noOfRecords: ${noOfRecords} tableName: ${tableName}`);
        let errMsgValsArray = [];
        let notificationData = [];
        let isColumnsAdded = false;
        let i = 0;
        if (errMsgData.length > 0 ) {
            for await (const eachRec of errMsgData) {
                let valuesUpdated = ''
                console.log(`${clsName},${guid},_formatErrMsgDsc,eachRec: ${eachRec}`);
                let errMsgsArray = eachRec.split(',ESMD_');
                console.log(`${clsName},${guid},_formatErrMsgDsc,eachRec: ${eachRec} errMsgsArray.length : ${errMsgsArray.length}`);
                if ( errMsgsArray.length > 1 ) {
                    let k = 0
                    for await (let eachErrMsg of errMsgsArray) {
                        console.log(`${clsName},${guid},_formatErrMsgDsc,eachErrMsg: ${eachErrMsg} isColumnsAdded: ${isColumnsAdded}`);
                        if ( k > 0 ) {
                            eachErrMsg = 'ESMD_' + eachErrMsg
                        }
                        let valuesUpdated = ''
                        if (values !== '') {
                            valuesUpdated = values + `, '${guid}', '${eachErrMsg}'`
                        }
                        if ( !isColumnsAdded ) {
                            if (dbColumnNames !== '') {
                                dbColumnNames += ', glbl_uniq_id, err_msg_desc';
                            }
                            isColumnsAdded = true
                        }
                        let notificationObj = new Object;
                        notificationObj.key = 'errorMessages'
                        notificationObj.value = eachErrMsg
                        notificationData.push(notificationObj)
                        errMsgValsArray.push(`(${valuesUpdated})`)
                        console.log(`${clsName},${guid},_formatErrMsgDsc,i: ${i} k: ${k} noOfRecords: ${noOfRecords} valuesUpdated: ${valuesUpdated} `)
                        // Inserting the records into esMD if the count of the records is equal to maxNoOfRecsToInsert mentioned in the env properties OR at the of the total records
                        if ((i % maxNoOfRecsToInsert === 0) || i === noOfRecords ) {
                            let bulkInsertResponse = await _executeBulkInsert (guid, tableName, dbColumnNames, errMsgValsArray, i, noOfRecords, pool) 
                            console.log(`${clsName},${guid},_formatErrMsgDsc,bulkInsertResponse: ${bulkInsertResponse}`);
                            if ( bulkInsertResponse === SUCCESS) {
                                errMsgValsArray.length = 0
                                if ( i === noOfRecords ) {
                                    const returnData = {
                                        notifcationdata: notificationData
                                    }
                                    return returnData
                                }
                            }
                        }
                        if ( k !== 0 ) {
                            console.log(`${clsName},${guid},_formatErrMsgDsc,k is not Zero`);
                            noOfRecords = noOfRecords + 1  // This value is the No of actual records to be inserted
                        }
                        k += 1
                        i += 1
                    }
                } else {
                  
                    if ( !isColumnsAdded ) {
                        if (dbColumnNames !== '') {
                            dbColumnNames += ', glbl_uniq_id, err_msg_desc';
                        }
                        if (values !== '') {
                            valuesUpdated = values + `, '${guid}', '${eachRec}'`
                        }
                        isColumnsAdded = true
                    }
                    console.log(`${clsName},${guid},_formatErrMsgDsc, i: ${i} valuesUpdated: ${valuesUpdated} isColumnsAdded: ${isColumnsAdded}`)
                    
                    let notificationObj = new Object;
                    notificationObj.key = 'errorMessages'
                    notificationObj.value = eachRec
                    notificationData.push(notificationObj)
                    errMsgValsArray.push(`(${valuesUpdated})`)
                    i += 1
                    // Inserting the records into esMD if the count of the records is equal to maxNoOfRecsToInsert mentioned in the env properties OR at the of the total records
                    if ((i % maxNoOfRecsToInsert === 0) || i === noOfRecords ) {
                        let bulkInsertResponse = await _executeBulkInsert (guid, tableName, dbColumnNames, errMsgValsArray, i, noOfRecords, pool) 
                        console.log(`${clsName},${guid},_formatErrMsgDsc,bulkInsertResponse: ${bulkInsertResponse}`);
                        if ( bulkInsertResponse === SUCCESS) {
                            errMsgValsArray.length = 0
                            if ( i === noOfRecords ) {
                                const returnData = {
                                    notifcationdata: notificationData
                                }
                                return returnData
                            }
                        }
                    }
                }
            }
        } 
   
    } catch(err){
        console.error(`${clsName},${guid},_formatErrMsgDsc,Error: ${err}`)
    }
}

async function _executeBulkInsert (guid, tableName, dbColumnNames, insertDataValsArray, currentRecord, noOfRecords, pool) {
    try {
        let isLastRecord = false;
        if ( currentRecord === noOfRecords ) {
            isLastRecord = true
        }
        const insertQuery = `INSERT INTO ${tableName} (${dbColumnNames}) VALUES${insertDataValsArray}`
        console.log(`${clsName},${guid},_executeInsertData,insertQuery: ${insertQuery}`);
        const postgresSQLService = await PostgresSQLService.getInstance()
        const dbResponse = await postgresSQLService.insertData (guid, insertQuery, pool)
        if (isLastRecord ) {
            console.log(`${clsName},${guid},_executeBulkInsert,Total noOfRecords: ${noOfRecords} inserted into esMD Successfully`);
        }
        return dbResponse

    } catch(err) {
        console.error(`${clsName},${guid},_executeInsertData,Error: ${err}`)
    }
}

module.exports = BuildInsertQueryService;
