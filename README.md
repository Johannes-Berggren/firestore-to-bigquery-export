# Firestore to BigQuery export
An automatic tool for copying and converting [Cloud Firestore](https://firebase.google.com/docs/firestore/) data to [BigQuery](https://cloud.google.com/bigquery/docs/).

- Import/Export CSV, Excel, or JSON files to/from Firestore.
- Encode/Decode Firestore data types such as GeoPoint, Reference, Timestamp, etc.


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

Then, you can transport your data.
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

## Issues
Please use the [issue tracker](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/issues).
