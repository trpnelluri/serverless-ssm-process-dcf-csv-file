'use strict';

const lodash = require('lodash')

const DcfValidationSchema = require('../validationSchema/dcf-metadata-validation')

let instance = null;
const clsName = 'DcfMetaDataJsonValidator'

class DcfMetaDataJsonValidator {
    
    static getInstance() {
        if (!instance) {
            instance = new DcfMetaDataJsonValidator();
        }
        return instance;
    }

    async validate(guid, body, recordNum) {
        let result = {body: {}, errors: []};
        let message = ''
        try{
            result.body = await DcfValidationSchema.validateAsync(body, {abortEarly: false, convert: true});
        } catch (err) {
            console.log(`${clsName},${guid},validate,Error: ${JSON.stringify(err.details)}` );
            result.errors = err.details.map(detail => {
                console.log(`${clsName},${guid},validate,detail.type: ${detail.type} detail.context.label: ${detail.context.label}`)
                let errDetailsArray = ''
                if ( detail.type === 'string.pattern.base' || detail.type === 'number.base' || detail.type === 'string.base' ||
                        detail.type === 'any.required' || detail.type === 'string.length' || detail.type === 'string.empty') {
                    if ( detail.context.label === 'Document Code' ) {
                        const docCodeErrData = process.env.DOC_CODE_ERR_DATA;
                        errDetailsArray = docCodeErrData.split('^');
                    } else if ( detail.context.label === 'Document Description' ) {
                        const docDesErrData = process.env.DOC_DES_ERR_DATA;
                        errDetailsArray = docDesErrData.split('^');
                    } else if ( detail.context.label === 'Status/Indicator' ) {
                        const actStatusErrData = process.env.ACT_STATUS_ERR_DATA;
                        errDetailsArray = actStatusErrData.split('^');
                    } else if ( detail.context.label === 'Action Date' ) {
                        const actDateErrData = process.env.ACT_DATE_ERR_DATA;
                        errDetailsArray = actDateErrData.split('^');
                    }
                    let errID = errDetailsArray[0];
                    let errMsgInfo = errDetailsArray[2];
                    if (errMsgInfo.indexOf('{0}') > 0 ) {
                        errMsgInfo = errMsgInfo.replace(' {0}', ': ' + recordNum)
                    }
                    message = errID + '-' + errMsgInfo

                    if ( message.length >= 100 ) {
                        message = lodash.truncate(message, {
                            length: 99
                            // separator: '^'
                        });
                    }
                    return message;
                }
            });
            console.log(`${clsName},${guid},validate,ValidationError Error Details: ${JSON.stringify(result.errors)}` );
            return result;
        }
        return result;
    }
}

module.exports = DcfMetaDataJsonValidator;