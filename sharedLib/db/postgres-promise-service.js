'use strict'

const pgp = require('pg-promise')({
    /* initialization options */
    capSQL: true // capitalize all generated SQL
});
const SecretManagerService = require('../aws/secret-manager-service');

let instance = null;
const clsName = 'PostgresPromiseService'

class PostgresPromiseService {

    static getInstance() {
        if (!instance) {
            instance = new PostgresPromiseService();
        }
        return instance;
    }

    async connectToPostgresPromiseDB () {
        try{
            const params = {
                SecretId: process.env.SM_PGS_DB_AUTH,
            };
            let secretManagerService = SecretManagerService.getInstance();
            const resScrectManger = await secretManagerService.getSecretValue(params)
            const dbConnDetails = JSON.parse(resScrectManger)
            const db = pgp(dbConnDetails);
            return db;
        }catch(err){
            console.error(`connectToPostgresPromiseDB,ERROR: ${err.stack}`);
            throw new Error(`connectToPostgresPromiseDB,Error getting PosthresPromise ${err.stack}`);
        }
    }

    async insertData(guid, tableName, columns, values, db){
        try {
            console.log(`${clsName},${guid},insertData,inside try block`);
            // our set of columns, to be created only once (statically), and then reused,
            // to let it cache up its formatting templates for high performance:
            const cs = new pgp.helpers.ColumnSet(columns, {table: tableName});

            // generating a multi-row insert query:
            const query = pgp.helpers.insert(values, cs);
            // executing the query:
            let response = await db.none(query);
            console.log(`${clsName},${guid},insertData,response: ${JSON.stringify(response)}`);
            return response
        } catch(err){
            console.error(`insertData,ERROR: ${err.stack}`);
            throw new Error(`insertData,Error getting PosthresPromise ${err.stack}`);
        }
    }

}

module.exports = PostgresPromiseService;
