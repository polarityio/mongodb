module.exports = {
  name: 'MongoDB',
  acronym: 'MONGO',
  logging: { level: 'info' },
  entityTypes: ['IPv4', 'IPv4CIDR', 'IPv6', 'domain', 'url', 'MD5', 'SHA1', 'SHA256', 'email', 'cve', 'MAC', 'string'],
  defaultColor: 'light-gray',
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
    proxy: ''
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
      description: 'The MongoDB database to search.  Integration must be restarted if you modify this option.',
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
      key: 'filter',
      name: 'Search Filter',
      description:
        'The search filter to execute.  Accepts the same filters as Mongo Compass.  You can substitute the entity value using `{{entity}}`.',
      default: '{}',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'documentTitleField',
      name: 'Document Title Field',
      description:
        'The name of the document field that you would like to use as your title in the details block in the integration\'s template. Option must be set to "User can view only" or "User can view and edit".',
      default: '_id',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'documentTitleIcon',
      name: 'Document Title Icon',
      description:
        'The name of the font awesome icon you would like to set.  You can choose from here https://fontawesome.com/icons?d=gallery&s=solid.  Option must be set to "User can view only" or "User can view and edit".',
      default: 'file',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'summaryFields',
      name: 'Summary Fields',
      description:
        'Comma delimited list of fields to include as part of the summary (no spaces between commas).  These fields must be returned by your search query and are case sensitive.  You can specify nested fields using JSON dot notation.',
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
    },
    {
      key: 'enabledDocumentUpdating',
      name: 'Enable Document Updating',
      description:
        'If checked, the document fields that are strings can be updated from the Overlay Window. This options must be set to "User can view only" or "User can view and edit"',
      default: true,
      type: 'boolean',
      userCanEdit: true,
      adminOnly: false
    },
    {
      key: 'addableFields',
      name: 'Addable String Fields',
      description:
        'Comma delimited list of fields that can be added to a returned document through the Overlay Window.  ' +
        'This option must be set to "User can view only" or "User can view and edit".  All fields will be added as string values.  ' +
        'The field is case sensitive.',
      default: '',
      type: 'text',
      userCanEdit: true,
      adminOnly: false
    }
  ]
};
