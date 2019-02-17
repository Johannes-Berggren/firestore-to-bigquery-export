# Firestore to BigQuery export
An automatic tool for copying and converting [Cloud Firestore](https://firebase.google.com/docs/firestore/) data to [BigQuery](https://cloud.google.com/bigquery/docs/).

- Create a BigQuery dataset with tables corresponding to your Firestore collections.
- Table schemas are automatically generated based on your document property data types.
- Convert and copy your Firestore collections to BigQuery.


## Installation

In your project root:
- Run `npm i firestore-to-bigquery-export`


Then simply:
- `import bigExport from 'firestore-to-bigquery-export'` OR `const bigExport = require('firestore-to-bigquery-export`

## Usage
First, you need to set up a BigQuery dataset with the appropriate tables and table schemas:
```
  bigExport.initializeBigQuery('firestore', [
    'payments',
    'profiles',
    'ratings',
    'users'
  ])
    .then(res => {
      console.log(res)
      response.status(200).send(res)
    })
    .catch(error => {
      console.error(error)
      response.status(500).send(error)
    })
```

Then, you can transport your data:
```
  bigExport.transportDataToBigQuery('firestore', [
    'payments',
    'profiles',
    'ratings',
    'users'
  ])
    .then(res => {
      console.log(res)
      response.status(200).send(res)
    })
    .catch(error => {
      console.error(error)
      response.status(500).send(error)
    })
```

## Limitations
- Your Firestore data model should be consistent. If a property of documents in the same collection have different data types, you'll get errors.
- Patching existing BigQuery sets isn't supported (yet). To refresh your datasets, you should empty or delete the tables before running `transportDataToBigQiery()`.
- Changed your Firestore data model? Delete the corresponding BigQuery table and run `initializeBigQuery()` to create a table with a new schema. 

## Issues
Please use the [issue tracker](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/issues).
