'use strict';

const lodash = require('lodash')

const DcfValidationSchema = require('../validationSchema/dcf-metadata-validation')

let instance = null;
const clsName = 'DcfMetaDataJsonValidator'
const FAILURE = 'Failure'
const SUCCESS = 'Success'

class DcfMetaDataJsonValidator {
    
    static getInstance() {
        if (!instance) {
            instance = new DcfMetaDataJsonValidator();
        }
        return instance;
    }

    async validate(guid, body) {
        let result = {body: {}, errors: []};
        let message = ''
        try{
            result.body = await DcfValidationSchema.validateAsync(body, {abortEarly: false, convert: true});
        } catch (err) {
            console.log(`${clsName},${guid},validate,Error: ${JSON.stringify(err.details)}` );
            result.errors = err.details.map(detail => {
                console.log(`${clsName},${guid},validate,detail.type: ${detail.type} detail.context.label: ${detail.context.label}`)
                if ( detail.type === 'string.pattern.base' || detail.type === 'number.base' || detail.type === 'string.base' ||
                        detail.type === 'any.required' || detail.type === 'string.length' || detail.type === 'string.empty') {   
                    if ( detail.context.label === 'Document Code' ) {
                        message = `ESMD_707: ERR_CSV_DOC_CD_MIS_INVLD`;
                    } else if ( detail.context.label === 'Document Description' ) {
                        message = `ESMD_708: ERR_CSV_DOC_DESC_MIS`;
                    } else if ( detail.context.label === 'Status/Indicator' ) {
                        message = `ESMD_709: ERR_CSV_ACTN_STUS_MIS`;
                    } else if ( detail.context.label === 'Action Date' ) {
                        message = `ESMD_710: ERR_CSV_ACTN_DT_MIS`;
                    }
                    if ( message.length >= 100 ) {
                        message = lodash.truncate(message, {
                            length: 99
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