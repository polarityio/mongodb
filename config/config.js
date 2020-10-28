module.exports = {
  name: 'MongoDB',
  acronym: 'MONGO',
  logging: { level: 'info' },
  entityTypes: ['*'],
  styles: ['./styles/mongo.less'],
  block: {
    component: {
      file: './component/mongo.js'
    },
    template: {
      file: './template/mongo.hbs'
    }
  },
  request: {
    // Provide the path to your certFile. Leave an empty string to ignore this option.
    // Relative paths are relative to the integration's root directory
    cert: '',
    // Provide the path to your private key. Leave an empty string to ignore this option.
    // Relative paths are relative to the integration's root directory
    key: '',
    // Provide the key passphrase if required.  Leave an empty string to ignore this option.
    // Relative paths are relative to the integration's root directory
    passphrase: '',
    // Provide the Certificate Authority. Leave an empty string to ignore this option.
    // Relative paths are relative to the integration's root directory
    ca: '',
    // An HTTP proxy to be used. Supports proxy Auth with Basic Auth, identical to support for
    // the url parameter (by embedding the auth info in the uri)
    proxy: '',
    /**
     * If set to false, the integration will ignore SSL errors.  This will allow the integration to connect
     * to servers without valid SSL certificates.  Please note that we do NOT recommending setting this
     * to false in a production environment.
     */
    rejectUnauthorized: true
  },
  options: [
    {
      key: 'connectionString',
      name: 'MongoDB Connection String',
      description:
        'Your MongoDB connection string.  If you are connecting using SCRAM authentication via a username and password, please provide those values through the `MongoDB Username` and `MongoDB Password` options.  NOTE: The integration must be restarted if you modify this option.',
      default: '',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'username',
      name: 'MongoDB Username',
      description: 'Your MongoDB username.  Integration must be restarted if you modify this option.',
      default: '',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'password',
      name: 'MongoDB Password',
      description:
        'Password for the provided MongoDB Username.  Integration must be restarted if you modify this option.',
      default: '',
      type: 'password',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'database',
      name: 'MongoDB Database to Search',
      description:
        'The MongoDB database to search.  Integration must be restarted if you modify this option.',
      default: '',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'collection',
      name: 'MongoDB Collection to Search',
      description: 'The MongoDB collection to search. Integration must be restarted if you modify this option',
      default: '',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'query',
      name: 'Search Query',
      description:
        'The search query to execute as JSON.',
      default:
        '{}',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'summaryFields',
      name: 'Summary Fields',
      description:
        'Comma delimited list of fields to include as part of the summary (no spaces between commas).  These fields must be returned by your search query.  You can specify nested fields using JSON dot notation.',
      default: '_id',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'includeFieldNameInSummary',
      name: 'Include Field Name in Summary',
      description: 'If checked, field names will be included as part of the summary fields.',
      default: true,
      type: 'boolean',
      userCanEdit: true,
      adminOnly: false
    }
  ]
};
