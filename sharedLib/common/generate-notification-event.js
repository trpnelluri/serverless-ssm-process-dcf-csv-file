'use strict'
const SQSServiceShared = require('../aws/sqs-service');

let instance = null;
const clsName = 'NotificationEventService'
const notification_SQS_url = process.env.NOTIFICATION_QUEUE_URL
const FAILURE = 'Failure'
const SUCCESS = 'Success'

class NotificationEventService {
    
    static getInstance() {
        if (!instance) {
            instance = new NotificationEventService();
        }
        return instance;
    }

    async sendNotificationEvent (transID, fileName, notificationType, notifcationData){

        try {
            let notificationObj = new Object;
            notificationObj.guid = transID
            notificationObj.request_type = 'INBOUND'
            notificationObj.email_alert_notification_type = notificationType.toUpperCase()
            notificationObj.file_name = fileName
            notificationObj.environment_type = process.env.ENVIRONMENT_NAME
            notificationObj.submission_timestamp = new Date();
            notificationObj.email_place_holder_list = notifcationData
            console.log(`${clsName},${transID},sendNotificationEvent,notificationObj : ${JSON.stringify(notificationObj)}`)
            const sendMsgRes = await SQSServiceShared.getInstance().sendMessage(transID, notificationObj, notification_SQS_url);
            console.log(`${clsName},${transID},sendNotificationEvent,sendMsgRes: ${JSON.stringify(sendMsgRes)}`)

            if ( sendMsgRes ) {
                return SUCCESS
            } else {
                return FAILURE
            }

        } catch (err) {
            console.error(`${clsName},${transID},sendDupEmailNotification,ERROR catch: ${err.stack}`)
        }
    }

}

module.exports = NotificationEventService;