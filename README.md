# Polarity MongoDB Integration

Polarity's MongoDB integration can search your MongoDB instance using a user provided search and return results via the Polarity Overlay Window or HUD. The integration supports updating `string` fields in the document.  In addition, the integration has the ability to add new fields to a document.

> Note that by default the MongoDB integration will receive ALL entity types. It is important that you select the "Manage Integration Data" option and turn off entity types you do not want sent to your MongoDB integration.

> This integration is currently under development. Please contact support@polarity.io if you are interested in using it.

## MongoDB Integration Options

### MongoDB Connection String

Your MongoDB connection string. If you are connecting using SCRAM authentication via a username and password, please provide those values through the `MongoDB Username` and `MongoDB Password` options. 

> The integration must be restarted if you modify this option.

Example value:
```
mongodb+srv://cluster0.lsralasd2.mongodb.net
```

### MongoDB Username

The MongoDB username that you wish to authenticate as.

> The integration must be restarted if you modify this option.

### MongoDB Password

Password for the provided MongoDB Username. The value provided for this password should not be URL encoded.  

> The integration must be restarted if you modify this option.

### MongoDB Database to Search

The MongoDB database to search. 

> The integration must be restarted if you modify this option.

### MongoDB Collection to Search

The MongoDB collection to search.

> The integration must be restarted if you modify this option.

### Search Query

The search query to execute as JSON.  To specify the entity looked up by Polarity use the string `{{entity}}`.  The string `{{entity}}` will be replaced by the entity value to be searched.

As an example, the following search will return the document where the `name` field matches the entity to be looked up:

```
{ "name": "{{entity}}"} 
```

In this example, the integration will search either the `name` or `email` fields:

```
{ "$or": [{ "name": "{{entity}}" }, {"email":"{{entity}}"} ]}
```

### Document Title Field

The name of the document field that you would like to use as your title in the details block of the integration's template.  The specified field should exist in your returned document.

> Option must be set to "User can view only" or "User can view and edit"

### Document Title Icon

The name of the font awesome icon you would like to set. You can choose from here https://fontawesome.com/icons?d=gallery&s=solid. 

As an example, if your document is returned information on a person you could set this field to `user-cirlce`.  If you are returning information on a vulnerability you could set the icon to `bug`. 

> Option must be set to "User can view only" or "User can view and edit"

### Summary Fields

A comma delimited list of fields to include as part of the summary (no spaces between commas). These fields must be returned by your search query and are case sensitive. You can specify nested fields using JSON dot notation.

For example, if your return document looked like this:

```
{
  "name": "Fnu Lnu",
  "accounts": [12313, 532412, 109230]
}
```

You could show the name, and the first account in the list by setting this option to `name,account[0]` where `account[0]` refers to the first element in the account list.

If your return document is nested like this:

```
{
  "name": {
    "first": "Fnu",
    "last": "Lnu"
  }
} 
```

You could display the first name and last name in the summary block by setting this option to `name.first,name.last`.

> Option must be set to "User can view only" or "User can view and edit"

### Include Field Name in Summary

If checked, field names will be included as part of the summary fields.  

For example, if you are displaying the `name` field and this option is checked, the summary will display `name: Fnu Lnu`.  If this option is unchecked, the summary will just display `Fnu Lnu`.


### Enable Document Updating

If checked, the document fields that are strings can be updated from the Overlay Window.  The integration currently only supports updating fields that are type `string`.

> Option must be set to "User can view only" or "User can view and edit 

### Addable String Fields

Comma delimited list of fields that can be added to a returned document through the Overlay Window. All fields will be added as string values. The field is case sensitive.

For each field specified here, a button will be added to the details block of the integration which will let the user add a new field to the document.  If left blank, the user will not be able to modify the document by adding new fields.

> Option must be set to "User can view only" or "User can view and edit

## Installation Instructions

Installation instructions for integrations are provided on the [PolarityIO GitHub Page](https://polarityio.github.io/).

## Polarity

Polarity is a memory-augmentation platform that improves and accelerates analyst decision making. For more information about the Polarity platform please see:

https://polarity.io/
