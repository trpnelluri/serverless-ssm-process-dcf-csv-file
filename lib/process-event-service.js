'use strict';
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const ConvertCSVToJSONService = require('./convert-csv-to-json-service')
const BuildInsertQueryService = require('./build-insert-query')
const AuditEventService = require('../sharedLib/common/generate-audit-event')
const NotificationEventService = require('../sharedLib/common/generate-notification-event')
const GenerateFlatFileRecordService = require('./generate-flat-file-record')
const PostgresSQLService = require('../sharedLib/db/postgre-sql-service')

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
                
                    //MetaData Validation Success Audit Event
                    const auditEventService = await AuditEventService.getInstance()
                    const sendAuditEventRes = await auditEventService.generateAuditEvent(guid, metaDataValidationSuccess)
                    console.log(`${clsName},${guid},processEvent,sendAuditEventRes: ${sendAuditEventRes}`)
                  
                    //generate flat file record for each record and insert all the data into Postgres
                    const dcfMetaData = response.data
                    console.log(`${clsName},${guid},processEvent,dcfBodyData: ${JSON.stringify(dcfMetaData)}`)
                    const generateFlatFileRecordService = await GenerateFlatFileRecordService.getInstance()
                    const flatFileRecordServiceRes = await generateFlatFileRecordService.generateFlatFileRecord(guid, dcfMetaData)

                    return SUCCESS
                } else {
                    //Process the metadata Validation failure
                    let additionalCols = `submsn_trans_err_msg_id^nextval('esmd_data.seq_submsn_trans_err_msg_id')~formula,sys_rec_creat_ts^now()~formula,sys_rec_creat_by^ESMD_APP_SP,msg_svrty_ind^Error,submsn_msg_type_name^ESMD_TO_RC_SUBMISSION_ERROR`
                    let columns = 'glbl_uniq_id^glbl_uniq_id,err_msg_desc^err_msg_desc'
                    let tableName = 'esmd_data.submsn_trans_err_msg'

                    if ( responseCode === VALIDATIONFAILURE ) {

                        const validationFailureData = response.data
                        const insertQueryRes = await BuildInsertQueryService.getInstance().buildErrMsgInsertQuery(guid, tableName, columns, additionalCols, validationFailureData, pool);
                        if ( insertQueryRes ) {
                            console.log(`${clsName},${guid},processEvent,insertQueryRes: ${JSON.stringify(insertQueryRes)}`);
                            const errMesInsertCols = insertQueryRes.dbcolnames
                            const errMesInsertVals = insertQueryRes.insertvals
                            const notifcationData = insertQueryRes.notifcationdata

                            //MetaData Validation Failure Notification
                            const notificationEventService = await NotificationEventService.getInstance()
                            const sendNotificationRes = await notificationEventService.sendNotificationEvent (guid, fileName, metaDataValiFailNotifyEvent, notifcationData)
                            console.log(`${clsName},${guid},processEvent,sendEventRes: ${JSON.stringify(sendNotificationRes)}`)
        
                            //MetaData Validation Failure Audit Event
                            const auditEventService = await AuditEventService.getInstance()
                            const sendAuditEventRes = await auditEventService.generateAuditEvent(guid, metaDataValidationFailure)
                            console.log(`${clsName},${guid},processEvent,sendAuditEventRes: ${JSON.stringify(sendAuditEventRes)}`)

                            //MetaData Validation Failure Data insertion
                            const insertQuery = `INSERT INTO ${tableName} (${errMesInsertCols}) VALUES${errMesInsertVals}`
                            console.log(`${clsName},${guid},processEvent,insertQuery: ${insertQuery}`);
                            const postgresSQLService = await PostgresSQLService.getInstance()
                            const resStatus = await postgresSQLService.insertData (guid, insertQuery, pool)

                            console.log(`${clsName},${guid},processDCFFile,resStatus: ${resStatus}`);
                            if ( resStatus === SUCCESS ) {
                               return resStatus
                            } else {
                               throw new Error(`${clsName},${guid},processDCFFile, insertData Failed`);
                           }
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