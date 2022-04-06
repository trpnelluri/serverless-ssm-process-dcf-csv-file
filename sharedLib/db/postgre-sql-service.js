'use strict'

const EventName = 'PostgresSQLService'
let instance = null;
const SUCCESS = 'Success'
const FAILURE = 'Failure'

/*
The following function is used to establish the connection to the postgreSQL database from Audit worker and the connection details will
from AWS Secrect Manager serveice.
*/

class PostgresSQLService {

    static getInstance() {
        if (!instance) {
            instance = new PostgresSQLService();
        }
        return instance;
    }

    async getNewGUID (queryToGenGUID, pool) {
        try {
            let client = await pool.connect();
            console.log(`${EventName},-,getNewGUID,pool connected successfully queryToGenGUID: ${queryToGenGUID}`);
            let response = await client.query(queryToGenGUID);
            client.release();
            let TransID = 'null'
            if ( response.rowCount > 0 ) {
                TransID = response.rows[0].generate_global_unique_id
            }
            return TransID;
        } catch (err) {
            console.log(`${EventName},-,getNewGUID,ERROR in catch ${err.stack}`)
        }
    }

    async getGUID (text, valuesToReplace, pool) {
        try {
            let client = await pool.connect();
            console.log(`${EventName},-,getGUID,query to execute: ${text} valuesToReplace: ${valuesToReplace} pool connected Successfully`);
            let response = await client.query(text, valuesToReplace);
            client.release();
            let TransID = 'null'
            if ( response.rowCount > 0 ) {
                TransID = response.rows[0].glbl_uniq_id
            }
            return TransID;
        } catch (err) {
            console.log(`${EventName},-,getGUID,ERROR in catch ${err.stack}`)
        }
    }
   
    async fileAlreadyExist (transID, text, valuesToReplace, pool) {
        try {
            let fileAvailableFlag = false
            let client = await pool.connect();
            console.log(`${EventName},${transID},fileAlreadyExist,query to execute: ${text} valuesToReplace: ${valuesToReplace} pool connected Successfully`);
            let response = await client.query(text, valuesToReplace);
            console.log(`${EventName},${transID},fileAlreadyExist, response: ${JSON.stringify(response.rows[0])}`);
            client.release();
            if ( response.rows[0].trans_count > 0 ) {
                fileAvailableFlag = true
                console.log(`${EventName},${transID},fileAlreadyExist,fileAvailableFlag: ${fileAvailableFlag}`);
            }
            return fileAvailableFlag
        } catch (err) {
            console.log(`${EventName},${transID},fileAlreadyExist,ERROR in catch ${err.stack}`)
        }
    }

    async insertData (transID, text, pool) {
        console.log(`${EventName},${transID},insertData,insert Data query to execute: ${text} `);
        try {
            const client = await pool.connect();
            let response = await client.query(text);
            client.release();
            console.log(`${EventName},${transID},insertData,insert Data inserted rows count: ${response.rowCount}`);
            if (response.rowCount > 0) {
                return SUCCESS
            } else {
                return FAILURE
            }
        } catch(err) {
            console.error(`${EventName},${transID},insertData,catch block error: ${err.stack}`);
        }
    }
}

module.exports = PostgresSQLService;
