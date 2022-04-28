'use strict';

//const PostgresPromiseService = require('./sharedLib/db/bkup-postgres-promise-service');
//const ProcessEventService = require('./lib/bkup-process-event-service');
const PostgresPoolService = require('./sharedLib/db/postgre-pool-service');
const ProcessEventService = require('./lib/process-event-service');

module.exports.handler = async function (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log(`handler,Event received: ${JSON.stringify(event)} event.Records.length: ${event.Records.length}`);

  let processEventService = ProcessEventService.getInstance();
  try {
    //const db = await PostgresPromiseService.getInstance().connectToPostgresPromiseDB ()
    //let response = await processEventService.processEvent(event, db);
    const pool = await PostgresPoolService.getInstance().connectToPostgresDB ()
    let response = await processEventService.processEvent(event, pool);
    console.log(`handler,response: ${JSON.stringify(response)}`);
    return callback(null, response);

  } catch(err) {
    console.log(`-,handler,Error in catch: ${err}`);
    return callback(err, null);
  }
}
