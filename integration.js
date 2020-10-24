'use strict';

const { MongoClient } = require('mongodb');
const _ = require('lodash');

let Logger;
let client = null;
let database = null;
let collection = null;

const entityTemplateReplacementRegex = /{{entity}}/g;

function startup(logger) {
  Logger = logger;
}

function _isConnected(client) {
  if (client !== null && client.isConnected()) {
    return true;
  }
  return false;
}

async function doLookup(entities, options, cb) {
  let lookupResults = [];
  Logger.trace(entities, 'doLookup');

  try {
    if (!_isConnected(client)) {
      client = new MongoClient(options.connectionString, {
        useUnifiedTopology: true,
        appname: 'Polarity',
        auth: {
          username: options.username,
          password: options.password
        }
      });
      await client.connect();
      database = client.db(options.database);
      await database.command({ ping: 1 });
      Logger.info('Successfully connected to MongoDB server');
      collection = database.collection(options.collection);
    }
  } catch (connectionError) {
    Logger.error(connectionError, 'Error connecting to MongoDB');
    if (client) {
      await client.close();
    }
    client = null;
    return cb({
      detail: 'Error connecting to MongoDB',
      error: connectionError
    });
  }

  try {
    const tasks = entities.map((entity) => {
      const queryString = options.query.replace(entityTemplateReplacementRegex, entity.value);
      Logger.debug(queryString);
      const queryObject = JSON.parse(queryString);
      return new Promise(async (resolve, reject) => {
        const data = await collection.findOne(queryObject);
        resolve({
          entity,
          data
        });
      });
    });

    const results = await Promise.all(tasks);

    results.forEach((result) => {
      Logger.debug(result);
      lookupResults.push({
        entity: result.entity,
        data: {
          summary: _getSummaryTags(result.data, options),
          details: result.data
        }
      });
    });

    cb(null, lookupResults);
  } catch (error) {
    Logger.error(error, 'Error running query');
    cb({
      detail: 'Error running query',
      error
    });
  }
}

function _getSummaryTags(data, options) {
  const tags = [];
  const summaryFields = options.summaryFields;
  const fields = summaryFields.split(',');
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const value = _.get(data, field, 'N/A');
    if (options.includeFieldNameInSummary) {
      tags.push(`${field}: ${value}`);
    } else {
      tags.push(value);
    }
  }
  return tags;
}

function validateOptions(userOptions, cb) {
  let errors = [];
  if (
    typeof userOptions.connectionString.value !== 'string' ||
    (typeof userOptions.connectionString.value === 'string' && userOptions.connectionString.value.length === 0)
  ) {
    errors.push({
      key: 'connectionString',
      message: 'You must provide a valid MongoDB connection string.'
    });
  }

  if (
    typeof userOptions.database.value !== 'string' ||
    (typeof userOptions.database.value === 'string' && userOptions.database.value.length === 0)
  ) {
    errors.push({
      key: 'database',
      message: 'You must provide a valid MongoDB database to search.'
    });
  }

  if (
    typeof userOptions.collection.value !== 'string' ||
    (typeof userOptions.collection.value === 'string' && userOptions.collection.value.length === 0)
  ) {
    errors.push({
      key: 'collection',
      message: 'You must provide a valid MongoDB collection to search.'
    });
  }

  if (typeof userOptions.query.value === 'string' && userOptions.query.value.length > 0) {
    try {
      JSON.parse(userOptions.query.value);
    } catch (e) {
      errors.push({
        key: 'query',
        message: 'Query is not valid JSON.'
      });
    }
  }

  cb(null, errors);
}

module.exports = {
  startup: startup,
  doLookup: doLookup,
  validateOptions: validateOptions
};
