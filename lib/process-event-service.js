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

    async processEvent(event, pool) {
        try {
            if (event !== null) {
                const msgBody = JSON.parse(event.Records[0].body)
                console.log(`${clsName},-,processEvent,msgBody: ${JSON.stringify(msgBody)}`);
                let isErrorMsgData = false
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
                let response = await convertCSVToJSONService.getJSONDataForDCFFromS3File(guid, fileName, s3Stream);

                console.log(`${clsName},${guid},processEvent,response: ${JSON.stringify(response)}`)
                const responseCode = response.code
                
                if ( responseCode === VALIDATIONSUCCESS ) {

                    let additionalCols = `doc_cd_fil_dtls_id^nextval('esmd_data.seq_doc_cd_fil_dtls_id')~formula,sys_rec_creat_ts^now()~formula,sys_rec_creat_by^ESMD_APP_SP,doc_code_to_data_cntr_stus^501`
                    let columns = 'rec_num^rec_num,actn_stus_cd^actn_stus_cd,doc_cd^doc_cd,doc_cd_desc^doc_cd_desc,actn_dt^actn_dt,flat_fil_rec_obj^flat_fil_rec_obj,glbl_uniq_id^glbl_uniq_id,fil_name^fil_name'
                    let tableName = 'esmd_data.doc_cd_fil_dtls'
                
                    //MetaData Validation Success Audit Event
                    const auditEventService = await AuditEventService.getInstance()
                    const sendAuditEventRes = await auditEventService.generateAuditEvent(guid, metaDataValidationSuccess)
                    console.log(`${clsName},${guid},processEvent,sendAuditEventRes: ${sendAuditEventRes}`)
                  
                    //Generate flat file record for each record and Build the Array of Data to be Insert into esMD
                    const dcfMetaData = response.data
                    console.log(`${clsName},${guid},processEvent,dcfBodyData: ${JSON.stringify(dcfMetaData)}`)
                    const generateFlatFileRecordService = await GenerateFlatFileRecordService.getInstance()
                    const flatFileRecordServiceRes = await generateFlatFileRecordService.generateFlatFileRecord(guid, fileName, dcfMetaData)
                    console.log(`${clsName},${guid},processEvent,dcfBodyData: ${JSON.stringify(flatFileRecordServiceRes)}`)

                    if ( flatFileRecordServiceRes.status === SUCCESS ) {
                        const insertData = flatFileRecordServiceRes.insertdata
                        let noOfRecords = insertData.length
                        if ( insertData.length > 0 ) {
                            const insertQueryRes = await BuildInsertQueryService.getInstance().buildInsertQuery(guid, tableName, columns, additionalCols, insertData, noOfRecords, isErrorMsgData, pool);
                        }
                        
                    }
                    return SUCCESS
                } else {
                    //Process the metadata Validation failure
                    let additionalCols = `submsn_trans_err_msg_id^nextval('esmd_data.seq_submsn_trans_err_msg_id')~formula,sys_rec_creat_ts^now()~formula,sys_rec_creat_by^ESMD_APP_SP,msg_svrty_ind^Error,submsn_msg_type_name^ESMD_TO_RC_SUBMISSION_ERROR`
                    let columns = 'glbl_uniq_id^glbl_uniq_id,err_msg_desc^err_msg_desc'
                    let tableName = 'esmd_data.submsn_trans_err_msg'

                    isErrorMsgData = true;

                    if ( responseCode === VALIDATIONFAILURE ) {
                        const validationFailureData = response.data
                        let noOfRecords = validationFailureData.length 
                        const insertQueryRes = await BuildInsertQueryService.getInstance().buildInsertQuery(guid, tableName, columns, additionalCols, validationFailureData, noOfRecords, isErrorMsgData, pool);
                        console.log(`${clsName},${guid},processEvent,insertQueryRes: ${JSON.stringify(insertQueryRes)}`);
                        if ( insertQueryRes ) {
                            console.log(`${clsName},${guid},processEvent,insertQueryRes: ${JSON.stringify(insertQueryRes)}`);
                            const notifcationData = insertQueryRes.notifcationdata

                            //MetaData Validation Failure Notification
                            const notificationEventService = await NotificationEventService.getInstance()
                            const sendNotificationRes = await notificationEventService.sendNotificationEvent (guid, fileName, metaDataValiFailNotifyEvent, notifcationData)
                            console.log(`${clsName},${guid},processEvent,sendEventRes: ${JSON.stringify(sendNotificationRes)}`)
        
                            //MetaData Validation Failure Audit Event
                            const auditEventService = await AuditEventService.getInstance()
                            const sendAuditEventRes = await auditEventService.generateAuditEvent(guid, metaDataValidationFailure)
                            console.log(`${clsName},${guid},processEvent,sendAuditEventRes: ${JSON.stringify(sendAuditEventRes)}`)

                        } else {
                            return FAILURE
                        }
                        
                    } else {
                        //EMPTYFILE or ERROR
                        //TBD This is not valida case in AWS need to verify with Team.
                    }

                }
            }

        } catch (err) {
            console.error(`${clsName},-,processEvent,Read Order File Error : ${err}`);
        }
    }
}

module.exports = ProcessEventService;