'use strict';

let instance = null;
const clsName = 'BuildInsertQueryService'

class BuildInsertQueryService {
    static getInstance() {
        if (!instance) {
            instance = new BuildInsertQueryService();
        }
        return instance;
    }

    async buildErrMsgInsertQuery(guid, tableName, columns, additionalCols, errMsgData) {
        try {
            additionalCols = `submsn_trans_actn_audt_log_id^nextval('esmd_data.submsn_trans_err_msg_id')~formula,msg_svrty_ind^Error,submsn_msg_type_name^ESMD_TO_RC_SUBMISSION_ERROR,sys_rec_creat_by^ESMD_APP_SP,sys_rec_creat_ts^now()~formula`
            columns = 'glbl_uniq_id^glbl_uniq_id,err_msg_desc^err_msg_desc'
            tableName = 'esmd_data.submsn_trans_err_msg'
            console.log(`${clsName},${guid},buildInsertQuery,requiredData additionalCols: ${additionalCols} columns: ${columns} tableName: ${tableName}`);
            let values = '';
            let dbAttrArray;
            let dbColumnNames = '';
            if ( additionalCols !== undefined && additionalCols !== null) {
                const additionalColObj = additionalCols.split(',');
                console.log(`buildInsertQuery,additionalColObj: ${additionalColObj.length}`);
                additionalColObj.forEach((element) => {
                    console.log(`buildInsertQuery,additionalColObj element: ${element}`);
                    const refDbAttribute = element.trim();
                    const refDbAttrArray = refDbAttribute.split('^');
    
                    if (dbColumnNames !== '') {
                        dbColumnNames += ', ';
                    }
                    dbColumnNames += refDbAttrArray[0];
                    if (values !== '') {
                        values += ', ';
                    }
                    // This Condition is for Formula columns and populate values
                    // nextval('esmd_data.seq_actn_audt_log_id')~formula
                    if (refDbAttrArray[1].indexOf('~') > -1) {
                        const valuesArry = refDbAttrArray[1].split('~');
                        values += `${valuesArry[0]}`;
                    } else {
                        values += `'${refDbAttrArray[1]}'`;
                    }
                });
            }

            const errMsgDescriptions = await _formatErrMsgDsc (guid, errMsgData);

        } catch(err){
            console.error(`${clsName},${guid},buildInsertQuery,Error: ${err}`)
        }
        
    }

}

async function _formatErrMsgDsc (guid, errMsgData) {
    //Sample format of the return value of errMsgData
    // ["ESMD_707-EITHER THE DOCUMENT CODE IS MISSING OR THE FORMAT IS INVALID FOR RECORD: 3",
    //  "ESMD_709-EITHER THE ACTION STATUS IS MISSING OR INVALID - VALID VALUES ARE(A,U,M,E) FOR RECORD: 8^ESMD_707-EITHER THE DOCUMENT CODE IS MISSING OR THE FORMAT IS INVALID FOR RECORD: 8"
    // ]
    try {
        console.log(`${clsName},${guid},formatErrMsgDsc, errMsgData.length: ${errMsgData.length}`);
        let errMsgDes = [];
        let errMsgDesobj = new Object;
        if (errMsgData.length > 0 ) {
            for await (const eachRec of errMsgData) {
                console.log(`${clsName},${guid},formatErrMsgDsc,eachRec: ${eachRec}`);
                let errMsgsArray = eachRec.split('^');
                if ( errMsgsArray.length > 0 ) {
                    for await (const eachErrMsg of errMsgsArray) {
                        console.log(`${clsName},${guid},formatErrMsgDsc,eachErrMsg: ${eachErrMsg}`);
                        errMsgDesobj = {
                            glbl_uniq_id: guid,
                            err_msg_desc: eachErrMsg
                        }
                        errMsgDes.push(errMsgDesobj)
                    }
                } else {
                    errMsgDesobj = {
                        glbl_uniq_id: guid,
                        err_msg_desc: eachRec
                    }
                    errMsgDes.push(errMsgDesobj)
                }
            }
            console.log(`${clsName},${guid},formatErrMsgDsc,errMsgDes: ${JSON.stringify(errMsgDes)}`);
            return errMsgDes
        } 
   
    } catch(err){
        console.error(`${clsName},${guid},formatErrMsgDsc,Error: ${err}`)
    }

}

module.exports = BuildInsertQueryService;
