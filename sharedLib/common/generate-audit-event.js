'use strict'
const { date } = require('joi');
const SQSServiceShared = require('../aws/sqs-service');

let instance = null;
const clsName = 'AuditEventService'
const audit_Queue_url = process.env.AUDIT_QUEUE_URL
const SUCCESS = 'Success'
const FAILURE = 'Failure'

class AuditEventService {

    static getInstance() {
        if (!instance) {
            instance = new AuditEventService();
        }
        return instance;
    }

    async generateAuditEvent (guid, auditMsgData ){
        try {
            let auditEventArray = [];
            let auditEventObj = new Object;
            auditEventObj.transaction_id = guid
            auditEventObj.request_type = 'SharedSystems'
            auditEventObj.worker_name = 'dcf-csv-file-process-lambda'
            auditEventObj.date_timestamp = new Date();
            auditEventObj.hostname = ''
            auditEventObj.activity_name = ''
            auditEventObj.data = ''
            if ( auditMsgData !== '' && auditMsgData !== null ) {
                let auditMsgdetails = auditMsgData.split('^')
                const auditMsgId = auditMsgdetails[0].toUpperCase()
                auditEventObj.audit_message_id = auditMsgId
                let auditMsgText = auditMsgdetails[1]
                if (auditMsgText.indexOf('{0}') > -1) {
                    auditMsgText = auditMsgText.replace('{0}', SUCCESS)
                }
                auditEventObj.audit_message = auditMsgText.toUpperCase()
                auditEventArray.push(auditEventObj)
                console.log(`${clsName},${guid},generateAuditEvent,auditEventArray: ${JSON.stringify(auditEventArray)}`)
                const sendMsgRes = await SQSServiceShared.getInstance().sendMessage(guid, auditEventArray, audit_Queue_url);
                console.log(`${clsName},${guid},generateAuditEvent,sendMsgRes: ${JSON.stringify(sendMsgRes)}`)
                if ( sendMsgRes ) {
                    console.log(`${clsName},${guid},generateAuditEvent,sendMsgRes: ${SUCCESS}`)
                    return SUCCESS
                } else {
                    console.log(`${clsName},${guid},generateAuditEvent,sendMsgRes: ${JSON.stringify(sendMsgRes)}`)
                    return FAILURE
                }
            }

        } catch (err) {
            console.error(`${clsName},${guid},generateAuditEvent,ERROR catch: ${err.stack}`)
        }
    }

}

module.exports = AuditEventService;