'use strict';
const Joi = require('joi');

const DcfValidationSchema = Joi.object({

    Status: Joi.string().label('Status').required().pattern(/^[A | U | M | E]$/),
    DocumentCode: Joi.string().label('DocumentCode').required().pattern(/^([0-9]{6})$/),  //^([0-9]{6})$
    //DocumentDescription: Joi.string().label('DocumentDescription').required().pattern(/^.*{1,1000}$/),   //Length is greater than 1000 then fail 
    ActionDate: Joi.string().label('ActionDate').required().pattern(/^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20|21)\d{2}$/) //mm/dd/yyyy  ((0[1-9]|1[0-2])/(0[1-9]|[12]\d|3[01])/\d{4})

})

module.exports = DcfValidationSchema;