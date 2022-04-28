'use strict';

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

            const dbErrInsertData = await _formatErrMsgDsc (guid, dbColumnNames, values, errMsgData);

            return dbErrInsertData

            // if ( dbErrInsertData ) {
            //     //return SUCCESS
            //     const  postgresPromiseServie = await PostgresPromiseService.getInstance()
            //     const dbInsertRes = await postgresPromiseServie.insertData(guid, tableName, dbErrInsertData.dbcolnames, dbErrInsertData.insertvals, db)
            //     if (dbInsertRes) {
            //         return SUCCESS
            //     } else {
            //         return FAILURE
            //     }
            // } else {
            //     return FAILURE
            // }

        } catch(err){
            console.error(`${clsName},${guid},buildInsertQuery,Error: ${err}`)
            return FAILURE
        }
        
    }

}

async function _formatErrMsgDsc (guid, dbColumnNames, values, errMsgData) {
    //Sample format of the return value of errMsgData
    // ["ESMD_707-EITHER THE DOCUMENT CODE IS MISSING OR THE FORMAT IS INVALID FOR RECORD: 3",
    //  "ESMD_709-EITHER THE ACTION STATUS IS MISSING OR INVALID - VALID VALUES ARE(A,U,M,E) FOR RECORD: 8^ESMD_707-EITHER THE DOCUMENT CODE IS MISSING OR THE FORMAT IS INVALID FOR RECORD: 8"
    // ]
    try {
        console.log(`${clsName},${guid},_formatErrMsgDsc, errMsgData.length: ${errMsgData.length}`);
        let errMsgValsArray = [];
        let notificationData = [];
        let isColumnsAdded = false 
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
                        console.log(`${clsName},${guid},_formatErrMsgDsc,i: ${i} k: ${k} insertDataObjUpt: ${valuesUpdated}`)
                        let notificationObj = new Object;
                        notificationObj.key = 'errorMessages'
                        notificationObj.value = eachErrMsg
                        notificationData.push(notificationObj)
                        errMsgValsArray.push(`(${valuesUpdated})`)
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
                    console.log(`${clsName},${guid},_formatErrMsgDsc, i: ${i} insertDataObj: ${valuesUpdated} isColumnsAdded: ${isColumnsAdded}`)
                    
                    let notificationObj = new Object;
                    notificationObj.key = 'errorMessages'
                    notificationObj.value = eachRec
                    notificationData.push(notificationObj)
                    errMsgValsArray.push(`(${valuesUpdated})`)
                    i += 1
                }
            }
            console.log(`${clsName},${guid},_formatErrMsgDsc,errMsgValsArray.length: ${errMsgValsArray.length} errMsgValsArray: ${JSON.stringify(errMsgValsArray)} dbColumnNames: ${dbColumnNames}`);
            const dbInsertData = {
                dbcolnames: dbColumnNames,
                insertvals: errMsgValsArray,
                notifcationdata: notificationData
            }
            return dbInsertData
        } 
   
    } catch(err){
        console.error(`${clsName},${guid},_formatErrMsgDsc,Error: ${err}`)
    }
}

module.exports = BuildInsertQueryService;
