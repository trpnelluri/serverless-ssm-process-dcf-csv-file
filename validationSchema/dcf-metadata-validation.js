'use strict';
const Joi = require('joi');

const actStatusValidation = /^[A | U | M | E]$/
const docCodeValidation = /^([0-9]{6})$/
const docDesValidation = /^[\s\S]{1,1000}$/
const actDateValidation = /^(0[1-9]|1[0-2])(0[1-9]|1\d|2\d|3[01])(19|20|21)\d{2}$/

const DcfValidationSchema = Joi.object({
    'Status/Indicator': Joi.string().label('Status/Indicator').required().pattern(actStatusValidation),  // (/^[A | U | M | E]$/)
    'Document Code': Joi.string().label('Document Code').required().pattern(docCodeValidation),  //(/^([0-9]{6})$/)
    'Document Description': Joi.string().label('Document Description').required().pattern(docDesValidation),   // (/^[\s\S]{1,1000}$/) Length is greater than 1000 then fail 
    'Action Date': Joi.string().label('Action Date').required().pattern(actDateValidation) //mmddyyyy  (/^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20|21)\d{2}$/)
})

module.exports = DcfValidationSchema;