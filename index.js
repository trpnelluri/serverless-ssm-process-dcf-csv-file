'use strict';

const PostgresPoolService = require('./sharedLib/db/postgre-pool-service');
const ProcessEventService = require('./lib/process-event-service');

module.exports.handler = async function (event, context, callback) {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log(`handler,Event received: ${JSON.stringify(event)} event.Records.length: ${event.Records.length}`);

  let processEventService = ProcessEventService.getInstance();
  try {
    let response = await processEventService.processEvent(event);
    console.log(`handler,response: ${JSON.stringify(response)}`);
    return callback(null, response);

  } catch(err) {
    console.log(`-,handler,Error in catch: ${err}`);
    return callback(err, null);
  }
}
