'use strict';

const PostgresPromiseService = require('../sharedLib/db/postgres-promise-service');

let instance = null;
const clsName = 'BuildInsertQueryService'
const SUCCESS = 'Success'
const FAILURE = 'Failure'

class BuildInsertQueryService {
    static getInstance() {
        if (!instance) {
            instance = new BuildInsertQueryService();
        }
        return instance;
    }

    async buildErrMsgInsertQuery(guid, tableName, columns, additionalCols, errMsgData, db) {
        try {
            console.log(`${clsName},${guid},buildInsertQuery,requiredData additionalCols: ${additionalCols} columns: ${columns} tableName: ${tableName}`);
            let insertDataObj = new Object;
            //let dbColumnNames = '';
            let dbColNameArray = [];
            if ( additionalCols !== undefined && additionalCols !== null) {
                const additionalColObj = additionalCols.split(',');
                console.log(`buildInsertQuery,additionalColObj: ${additionalColObj.length}`);
                additionalColObj.forEach((element) => {
                    console.log(`buildInsertQuery,additionalColObj element: ${element}`);
                    const refDbAttribute = element.trim();
                    const refDbAttrArray = refDbAttribute.split('^');
                    let dbColName = refDbAttrArray[0]
                    let dbColValue = refDbAttrArray[1]
                    dbColNameArray.push(dbColName)
                    if (dbColValue.indexOf('~') > -1) {
                        const valuesArry = dbColValue.split('~');
                        insertDataObj[dbColName] = `${valuesArry[0]}`
                    } else {
                        insertDataObj[dbColName] = `${dbColValue}`
                    }
                });
            }

            const dbErrInsertData = await _formatErrMsgDsc (guid, dbColNameArray, insertDataObj, errMsgData);
            if ( dbErrInsertData ) {
                const  postgresPromiseServie = await PostgresPromiseService.getInstance()
                const dbInsertRes = await PostgresPromiseService.getInstance().insertData(guid, tableName, dbErrInsertData.dbcolnames, dbErrInsertData.insertvals, db)
                if (dbInsertRes) {
                    return SUCCESS
                } else {
                    return FAILURE
                }
            } else {
                return FAILURE
            }

        } catch(err){
            console.error(`${clsName},${guid},buildInsertQuery,Error: ${err}`)
            return FAILURE
        }
        
    }

}

async function _formatErrMsgDsc (guid, dbColNameArray, insertDataObj, errMsgData) {
    //Sample format of the return value of errMsgData
    // ["ESMD_707-EITHER THE DOCUMENT CODE IS MISSING OR THE FORMAT IS INVALID FOR RECORD: 3",
    //  "ESMD_709-EITHER THE ACTION STATUS IS MISSING OR INVALID - VALID VALUES ARE(A,U,M,E) FOR RECORD: 8^ESMD_707-EITHER THE DOCUMENT CODE IS MISSING OR THE FORMAT IS INVALID FOR RECORD: 8"
    // ]
    try {
        console.log(`${clsName},${guid},_formatErrMsgDsc, errMsgData.length: ${errMsgData.length}`);
        let errMsgValsArray = [];
        let isColumnsAdded = false 
        let i = 0;
        if (errMsgData.length > 0 ) {
            for await (const eachRec of errMsgData) {
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
                        insertDataObj['glbl_uniq_id'] = guid
                        insertDataObj['err_msg_desc'] = eachErrMsg
                        if ( !isColumnsAdded ) {
                            dbColNameArray.push('glbl_uniq_id')
                            dbColNameArray.push('err_msg_desc')
                            isColumnsAdded = true
                        }
                        console.log(`${clsName},${guid},_formatErrMsgDsc,i: ${i} k: ${k} insertDataObjUpt: ${JSON.stringify(insertDataObj)}`)
                        let insertvalObj = JSON.stringify(insertDataObj)
                        insertvalObj = JSON.parse(insertvalObj)
                        errMsgValsArray.push(insertvalObj)
                        k += 1
                        i += 1
                    }
                } else {
                    insertDataObj['glbl_uniq_id'] = guid
                    insertDataObj['err_msg_desc'] = eachRec
                    if ( !isColumnsAdded ) {
                        dbColNameArray.push('glbl_uniq_id')
                        dbColNameArray.push('err_msg_desc')
                        isColumnsAdded = true
                    }
                    console.log(`${clsName},${guid},_formatErrMsgDsc, i: ${i} insertDataObj: ${JSON.stringify(insertDataObj)} isColumnsAdded: ${isColumnsAdded}`)
                    let insertvalObj = JSON.stringify(insertDataObj)
                    insertvalObj = JSON.parse(insertvalObj)
                    errMsgValsArray.push(insertvalObj)
                    i += 1
                }
            }
            console.log(`${clsName},${guid},_formatErrMsgDsc,errMsgValsArray.length: ${errMsgValsArray.length} errMsgValsArray: ${JSON.stringify(errMsgValsArray)} dbColNameArray: ${JSON.stringify(dbColNameArray)}`);
            const dbInsertData = {
                dbcolnames: dbColNameArray,
                insertvals: errMsgValsArray
            }
            return dbInsertData
        } 
   
    } catch(err){
        console.error(`${clsName},${guid},_formatErrMsgDsc,Error: ${err}`)
    }
}

module.exports = BuildInsertQueryService;
