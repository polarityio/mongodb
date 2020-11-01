'use strict';

const { MongoClient, Decimal128, ObjectID, Double, Int32, Long, Binary } = require('mongodb');
const _ = require('lodash');

let Logger;
let _client = null;
let _database = null;
let _collection = null;

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

async function getClient(options) {
  try {
    if (!_isConnected(_client)) {
      const connectionOptions = {
        useUnifiedTopology: true,
        appname: 'Polarity'
      };

      if (options.username) {
        connectionOptions.auth = {
          username: options.username,
          password: options.password
        };
      }

      _client = new MongoClient(options.connectionString, connectionOptions);
      await _client.connect();
      _database = _client.db(options.database.trim());
      await _database.command({ ping: 1 });
      Logger.info('Successfully connected to MongoDB server');
      _collection = _database.collection(options.collection.trim());
    }
    return { client: _client, database: _database, collection: _collection };
  } catch (connectionError) {
    Logger.error(connectionError, 'Error connecting to MongoDB');
    if (_client) {
      await _client.close();
    }
    _client = null;
    _database = null;
    _collection = null;

    throw connectionError;
  }
}

async function doLookup(entities, options, cb) {
  let lookupResults = [];
  Logger.trace(entities, 'doLookup');
  let client,
    database,
    collection = null;
  try {
    ({ client, database, collection } = await getClient(options));
  } catch (connectionError) {
    Logger.error(connectionError, 'Error connecting to MongoDB');
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
    Logger.debug({ results }, 'Query Results');
    results.forEach((result) => {
      if (result.data === null) {
        lookupResults.push({
          entity: result.entity,
          data: null
        });
      } else {
        lookupResults.push({
          entity: result.entity,
          data: {
            summary: _getSummaryTags(result.data, options),
            // note that the template gets built when we call `onDetails`
            details: _buildDetailsResultWithoutTemplate(result.data, options)
          }
        });
      }
    });

    Logger.debug({ lookupResults }, 'lookupResults');
    cb(null, lookupResults);
  } catch (error) {
    Logger.error(_errorToObject('Error running query', error));
    cb(_errorToObject('Error running query', error));
  }
}

/**
 * Given a document, returns the details payload that needs to be returned to the integration
 * but does not include the template fields.  This method is used in `doLookup` and we don't
 * build the template until `onDetails` is called.  This prevents us from having to build
 * the template twice and improve efficiency.
 *
 * @param document
 * @param options
 * @returns {{keys: {}, id: *, title: *, fields: []}}
 * @private
 */
function _buildDetailsResultWithoutTemplate(document, options) {
  return {
    id: document._id,
    keys: [],
    title: document[options.documentTitleField],
    fields: []
  };
}

/**
 * Given a document, returns the details payload that needs to be returned to the integration
 *
 * @param document
 * @param options
 * @returns {{keys: {}, id: *, title: *, fields: (undefined|*[])}}
 * @private
 */
function _buildDetailsResult(document, options) {
  return {
    id: document._id,
    keys: Object.keys(document).reduce((accum, key, index) => {
      accum[key] = index;
      return accum;
    }, {}),
    title: document[options.documentTitleField],
    fields: _buildTemplateData(undefined, document)
  };
}

/**
 * Converts a javascript Error into a POJO that we can log or return to the server
 * @param detail
 * @param error
 * @returns {{detail: *, error: {error: *}}}
 */
function _errorToObject(detail, error) {
  const errorObject = {
    detail,
    error: {
      error
    }
  };

  if (error.message) {
    errorObject.message = error.message;
  }

  if (error.stack) {
    errorObject.stack = error.stack;
  }

  return errorObject;
}

function _isPrimitiveArray(array) {
  if (Array.isArray(array)) {
    for (let i = 0; i < array.length; i++) {
      const value = array[i];
      if (typeof value === 'object' && value !== null) {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
}

function _isMongoType(value) {
  if (
    value instanceof Decimal128 ||
    value instanceof ObjectID ||
    value instanceof Double ||
    value instanceof Int32 ||
    value instanceof Long ||
    value instanceof Binary
  ) {
    return true;
  }

  return false;
}

function _isIgnoredMongoType(value) {
  if (value instanceof Binary) {
    return true;
  }

  return false;
}

/**
 * When initially called, key should be undefined and value should be a POJO
 *
 * @param key
 * @param value
 * @param templateData
 * @param depth
 * @private
 */
function _buildTemplateData(key, value, templateData = [], blockCounter = 0, depth = -1) {
  if (key === '_id') {
    // Ignore the built-in Mongo ObjectId type
    return;
  }

  if (_isIgnoredMongoType(value)) {
    // ignored types show the key but don't show any value
    templateData.push({
      displayName: key,
      key,
      type: 'string',
      depth,
      value: '<Not Displayed>',
      blockId: blockCounter
    });
  } else if (_isMongoType(value)) {
    templateData.push({
      displayName: key,
      key,
      type: 'string',
      depth,
      value: value.toString(),
      blockId: blockCounter
    });
  } else if (_isPrimitiveArray(value)) {
    // process Array value
    // for arrays of primitives we just turn it into a comma delimited string
    if (typeof key !== 'undefined') {
      templateData.push({
        displayName: key,
        key,
        type: 'string',
        depth,
        value: value.join(', '),
        blockId: blockCounter
      });
    }
  } else if (Array.isArray(value)) {
    // non primitive array
    if (key !== 'undefined' && key !== null) {
      templateData.push({
        displayName: key,
        key,
        type: 'title',
        expanded: false,
        depth,
        blockId: blockCounter++
      });
    }

    for (let i = 0; i < value.length; i++) {
      const subObject = value[i];
      _buildTemplateData(undefined, subObject, templateData, blockCounter, depth);
    }
  } else if (value instanceof Date) {
    templateData.push({
      displayName: key,
      key,
      type: 'date',
      depth,
      value: value.toISOString(),
      blockId: blockCounter++
    });
  } else if (typeof value === 'object' && value !== null) {
    // process Object value
    const subKeys = Object.keys(value);

    // key can be undefined if this is a top level object being passed in
    // otherwise, if key is not undefined we use the key for this object
    // as a title assuming it's not an empty object
    if (typeof key !== 'undefined' && subKeys.length > 0) {
      templateData.push({
        displayName: key,
        key,
        type: 'title',
        expanded: false,
        depth,
        blockId: blockCounter++
      });
    }

    for (let i = 0; i < subKeys.length; i++) {
      const subKey = subKeys[i];
      const subValue = value[subKey];

      _buildTemplateData(subKey, subValue, templateData, blockCounter, depth + 1);
    }
  } else {
    //process primitive value
    templateData.push({
      displayName: key,
      key,
      type: 'string',
      depth,
      value,
      mongoType: typeof value,
      blockId: blockCounter++
    });
  }

  return templateData;
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

async function getDocument(collection, id) {
  return await collection.findOne({ _id: ObjectID(id) });
}

/**
 *
 * @param collection {Object}, MongoDB collection object that we can use to manipulate documents
 * @param id {string}, ObjectID of the document as a string
 * @param key {string}, key to update
 * @param value {string}, value to set for the key (currently only supports string type)
 * @param cb
 * @returns {Promise<void>}
 */
async function updateField(collection, id, key, value) {
  const updateOperation = { $set: {} };
  updateOperation.$set[key] = value;

  const updateResponse = await collection.updateOne({ _id: ObjectID(id) }, updateOperation);
  if (updateResponse && updateResponse.result && updateResponse.result.ok === 1) {
    Logger.debug({ updateResponse }, 'Successfully Updated Document');

    return {
      isModified: updateResponse.result.nModified === 1
    };
  }
}

async function onDetails(lookupObject, options, cb) {
  let client,
    database,
    collection = null;
  try {
    ({ client, database, collection } = await getClient(options));
  } catch (connectionError) {
    Logger.error(_errorToObject('Error connecting to MongoDB', connectionError), 'Error connecting to MongoDB');
    return cb(_errorToObject('Error connecting to MongoDB', connectionError));
  }

  const id = lookupObject.data.details.id;

  try {
    const document = await getDocument(collection, id);
    Logger.debug({ document }, 'onDetails Document');
    lookupObject.data.details = _buildDetailsResult(document, options);
    return cb(null, lookupObject.data);
  } catch (getDocErr) {
    Logger.error(_errorToObject('Error getting document', getDocErr), 'Error getting document');
    return cb(_errorToObject('Error getting document', getDocErr));
  }
}

async function onMessage(payload, options, cb) {
  let client,
    database,
    collection = null;
  try {
    ({ client, database, collection } = await getClient(options));
  } catch (connectionError) {
    Logger.error(_errorToObject('Error connecting to MongoDB', connectionError), 'Error connecting to MongoDB');
    return cb(_errorToObject('Error connecting to MongoDB', connectionError));
  }

  const { id, key, value, action } = payload;

  switch (action) {
    case 'UPDATE_FIELD':
    case 'ADD_FIELD':
      const detailErrMessage = action === 'UPDATE_FIELD' ? 'Error updating document' : 'Error adding field';
      try {
        await updateField(collection, id, key, value);
      } catch (updateErr) {
        Logger.error(_errorToObject('Error getting document', updateErr), detailErrMessage);
        return cb(_errorToObject(detailErrMessage, updateErr));
      }

      try {
        const document = await getDocument(collection, id);
        return cb(null, _buildDetailsResult(document, options));
      } catch (getDocErr) {
        Logger.error(_errorToObject('Error getting document', getDocErr), 'Error getting document');
        return cb(_errorToObject(detailErrMessage, getDocErr));
      }
      break;
    case 'REFRESH_DOCUMENT':
      try {
        const document = await getDocument(collection, id);
        return cb(null, _buildDetailsResult(document, options));
      } catch (getDocErr) {
        Logger.error(_errorToObject('Error getting document', getDocErr), 'Error getting document');
        return cb(_errorToObject('Error refreshing document', getDocErr));
      }
      break;
  }
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
  validateOptions: validateOptions,
  onMessage: onMessage,
  onDetails
};
