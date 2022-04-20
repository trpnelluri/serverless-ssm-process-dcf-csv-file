'use strict';
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const ConvertCSVToJSONService = require('./convert-csv-to-json-service')
const BuildInsertQueryService = require('./build-insert-query')
const AuditEventService = require('../sharedLib/common/generate-audit-event')
const NotificationEventService = require('../sharedLib/common/generate-notification-event')
const GenerateFlatFileRecordService = require('./generate-flat-file-record')

let instance = null;
const bucketName = process.env.BUCKET_NAME
const clsName = 'ProcessEventService'
const FAILURE = 'Failure'
const SUCCESS = 'Success'
const VALIDATIONSUCCESS = '1000'
const VALIDATIONFAILURE = '1001'
const EMPTYFILE = '1002'
const metaDataValidationFailure = 'ESMD_MDATA_VALDTN_CMPLTE_FAIL^INBOUND METADATA VALIDATION STATUS FAILED'
const metaDataValidationSuccess = 'ESMD_MDATA_VALDTN_CMPLTE^INBOUND METADATA VALIDATION COMPLETED:{0}'
const metaDataValiFailNotifyEvent = 'DCF_CSV_FILE_VAL_ERRORS'

class ProcessEventService {

    static getInstance() {
        if (!instance) {
            instance = new ProcessEventService();
        }
        return instance;
    }

    async processEvent(event, db) {
        try {
            if (event !== null) {
                const msgBody = JSON.parse(event.Records[0].body)
                console.log(`${clsName},-,processEvent,msgBody: ${JSON.stringify(msgBody)}`);
                let guid = msgBody.guid
                let fileDirectory = msgBody.directory
                const fileName = msgBody.files[0].filename;
                let keyName = fileDirectory + fileName
                console.log(`${clsName},${guid},processEvent,fileDirectory: ${fileDirectory} fileName: ${fileName} keyName: ${keyName}`)
                const getObjectParams = {
                    Bucket:bucketName,
                    Key: keyName,
                };
                const s3Stream = s3.getObject(getObjectParams).createReadStream();
                const convertCSVToJSONService = ConvertCSVToJSONService.getInstance()
                let response = await convertCSVToJSONService.getJSONDataForDCFFromS3File(guid, fileName, s3Stream, db);

                console.log(`${clsName},${guid},processEvent,response: ${JSON.stringify(response)}`)

               
                if ( response.status === SUCCESS ) {
                    //generate flat file record for each record and insert all the data into Postgres
                    //TBD

                    //MetaData Validation Success Audit Event
                    const auditEventService = await AuditEventService.getInstance()
                    const sendAuditEventRes = await auditEventService.generateAuditEvent(guid, metaDataValidationSuccess)
                    console.log(`${clsName},${guid},processEvent,sendAuditEventRes: ${sendAuditEventRes}`)
                  
                    const dcfMetaData = response.data
                    console.log(`${clsName},${guid},processEvent,dcfBodyData: ${JSON.stringify(dcfMetaData)}`)
                    const generateFlatFileRecordService = await GenerateFlatFileRecordService.getInstance()
                    const flatFileRecordServiceRes = await generateFlatFileRecordService.generateFlatFileRecord(guid, dcfMetaData)

                    return SUCCESS
                } else {
                    //Process the metadata Validation failure
                    let additionalCols = `submsn_trans_actn_audt_log_id^nextval('esmd_data.submsn_trans_err_msg_id')~formula,msg_svrty_ind^Error,submsn_msg_type_name^ESMD_TO_RC_SUBMISSION_ERROR,sys_rec_creat_by^ESMD_APP_SP,sys_rec_creat_ts^now()~formula`
                    let columns = 'glbl_uniq_id^glbl_uniq_id,err_msg_desc^err_msg_desc'
                    let tableName = 'esmd_data.submsn_trans_err_msg'

                    let validationFailureData = response.data
                    const faliureCode = response.code

                    if ( faliureCode === EMPTYFILE ) {

                    } else {

                        const insertQueryRes = await BuildInsertQueryService.getInstance().buildErrMsgInsertQuery(guid, tableName, columns, additionalCols, validationFailureData, db);
                        if ( insertQueryRes ) {
                            console.log(`${clsName},${guid},processEvent,insertQueryRes: ${JSON.stringify(insertQueryRes)}`);
                            const errMesInsertCols = insertQueryRes.dbcolnames
                            const errMesInsertVals = insertQueryRes.insertvals
                            const notifcationData = insertQueryRes.notifcationdata
                            //MetaData Validation Failure Datainsertion
                            //TBD
    
                            //MetaData Validation Failure Notification
                            const notificationEventService = await NotificationEventService.getInstance()
                            const sendEventRes = await notificationEventService.sendNotificationEvent (guid, fileName, metaDataValiFailNotifyEvent, notifcationData)
                            console.log(`${clsName},${guid},processEvent,sendEventRes: ${sendEventRes}`)
    
                            //MetaData Validation Failure Audit Event
                            const auditEventService = await AuditEventService.getInstance()
                            const sendAuditEventRes = await auditEventService.generateAuditEvent(guid, metaDataValidationFailure)
                            console.log(`${clsName},${guid},processEvent,sendAuditEventRes: ${sendAuditEventRes}`)
                            return SUCCESS
                        } else {
                            return FAILURE
                        }

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

                    }

                }
            }

        } catch (err) {
            console.error(`${clsName},-,processEvent,Read Order File Error : ${err}`);
        }
    }
}

module.exports = ProcessEventService;