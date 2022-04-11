'use strict';
const Joi = require('joi');

const DcfValidationSchema = Joi.object({
    'Status/Indicator': Joi.string().label('Status/Indicator').required().pattern(/^[A | U | M | E]$/),
    'Document Code': Joi.string().label('Document Code').required().pattern(/^([0-9]{6})$/),  //^([0-9]{6})$
    //'Document Description': Joi.string().label('Document Description').required().pattern(/^.*{1,1000}$/),   //Length is greater than 1000 then fail 
    //'Action Date': Joi.string().label('Action Date').required().pattern(/^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20|21)\d{2}$/) //mm/dd/yyyy  ((0[1-9]|1[0-2])/(0[1-9]|[12]\d|3[01])/\d{4})

})

module.exports = DcfValidationSchema;