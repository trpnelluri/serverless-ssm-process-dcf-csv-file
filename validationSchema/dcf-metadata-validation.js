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

/*
const DcfValidationSchema = Joi.object({
    'Status/Indicator': Joi.string().label('Status/Indicator').required().pattern(/^[A | U | M | E]$/),  // (/^[A | U | M | E]$/)
    'Document Code': Joi.string().label('Document Code').required().pattern(/^([0-9]{6})$/),  //(/^([0-9]{6})$/)
    'Document Description': Joi.string().label('Document Description').required().pattern(/^[\s\S]{1,1000}$/),   // (/^[\s\S]{1,1000}$/) Length is greater than 1000 then fail 
    'Action Date': Joi.string().label('Action Date').required().pattern(/^(0[1-9]|1[0-2])(0[1-9]|1\d|2\d|3[01])(19|20|21)\d{2}$/) //mmddyyyy  (/^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20|21)\d{2}$/)
})
*/
// const actStatusValidation = process.env.ACT_STATUS_REGEX_VALUE
// const docCodeValidation = process.env.DOC_CODE_REGEX_VALUE
// const docDesValidation = process.env.DOC_DES_REGEX_VALUE
// const actDateValidation = process.env.ACT_DATE_REGEX_VALUE

// console.log(`actStatusValidation: ${actStatusValidation} docCodeValidation: ${docCodeValidation}`)

module.exports = DcfValidationSchema;