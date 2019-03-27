/*!
 * firestore-to-bigquery-export
 *
 * Copyright © 2019 Johannes Berggren <johannes@berggren.co>
 * MIT Licensed
 *
 */

'use strict'

/**
 * Module dependencies.
 *
 * @private
 */
let { BigQuery } = require('@google-cloud/bigquery'),
    bigQuery     = {},
    currentRow   = {},
    firebase     = require('firebase-admin'),
    firestore    = {}

/**
 * Connecting to the given Firebase project.
 *
 * @param {JSON} serviceAccountFile
 * @public
 */
exports.setFirebaseConfig = serviceAccountFile => {
  firestore = firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccountFile)
  }, 'firestore-to-bigquery-export-instance').firestore()
}

/**
 * Connecting to the given BigQuery project.
 *
 * @param {JSON} serviceAccountFile
 * @public
 */
exports.setBigQueryConfig = serviceAccountFile => {
  bigQuery = new BigQuery({
    projectId: serviceAccountFile.project_id,
    credentials: serviceAccountFile
  })
}

/**
 * Creating a BigQuery dataset with the given name if it doesn't already exist.
 * Running through each collection and checking if a table with the same name exists
 * in the bigQuery.dataset(datasetID).
 *
 * Creating the tables with the correct schema if the table doesn't already exist.
 *
 * @param {string} datasetID
 * @param {Array} collectionNames
 * @param {boolean} [verbose = false]
 * @returns {Promise<Number>}
 * @public
 */
exports.createBigQueryTables = (datasetID, collectionNames, verbose = false) => {
  return bigQuery.dataset(datasetID).exists()
    .then(res => {
      return res[0] || bigQuery.createDataset(datasetID)
    })
    .then(() => {
      return Promise.all(collectionNames.map(n => {
        return createTableWithSchema(datasetID, n, verbose)
      }))
    })
}

/**
 * Runs through all documents in the given collection
 * to ensure all properties are added to the schema.
 *
 * Generating schema. Creating a table with the created schema in the given dataset.
 *
 * @param {string} datasetID
 * @param {string} collectionName
 * @param {boolean} [verbose = false]
 * @returns {Promise<BigQuery.Table>}
 * @private
 */
function createTableWithSchema (datasetID, collectionName, verbose = false) {
  const index   = {},
        options = {
          schema: {
            fields: [
              {
                name: 'doc_ID',
                type: 'STRING',
                mode: 'REQUIRED'
              }
            ]
          }
        }

  return firestore.collection(collectionName).get()
    .then(documents => {
      if (verbose) console.log('Creating schema and table ' + collectionName + '.')

      documents.forEach(d => {
        d = d.data()

        Object.keys(d).forEach(propName => {
          const schemaField = getSchemaField(d[propName], propName)

          if (schemaField !== undefined) {
            if (!index.hasOwnProperty(schemaField.name)) {
              options.schema.fields.push(schemaField)
              schemaField.index = options.schema.fields.length - 1
              index[schemaField.name] = schemaField
            }
            else {
              const currentValue = index[schemaField.name]

              if (schemaField.type === 'FLOAT' && currentValue.type === 'INTEGER') {
                options.schema.fields[currentValue.index] = schemaField
                index[schemaField.name].type = 'FLOAT'
              }
            }
          }
        })
      })

      if (verbose) {
        console.log('Completed schema generation for table ' + collectionName + ':')
        options.schema.fields.forEach(o => {
          console.log(o)
        })
      }

      return bigQuery.dataset(datasetID).createTable(collectionName, options)
    })
    .catch(e => {
      if (verbose) console.error(e)
      throw new Error(e)
    })

  /**
   * Determines schema field properties based on the given document property.
   *
   * @param {string||number||Array||Object} val
   * @param {string} propName
   * @param {string} parent
   * @returns {Object||undefined}
   * @private
   */
  function getSchemaField (val, propName, parent) {
    const field = {
      name: parent ? parent + '__' + propName : propName,
      mode: '',
      type: ''
    }

    if (val === null) {
      field.type = 'STRING'
      field.mode = 'NULLABLE'
      return field
    }
    else if (typeof val === 'undefined') {
      field.type = 'STRING'
      field.mode = 'NULLABLE'
      return field
    }
    else if (typeof val === 'string') {
      field.type = 'STRING'
      field.mode = 'NULLABLE'
      return field
    }
    else if (typeof val === 'number' && !isNaN(val)) {
      Number.isInteger(val) ? field.type = 'INTEGER' : field.type = 'FLOAT'
      field.mode = 'NULLABLE'
      return field
    }
    else if (typeof val === 'boolean') {
      field.type = 'BOOL'
      field.mode = 'NULLABLE'
      return field
    }
    else if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        const schemaField = getSchemaField(val[i], i, field.name)
        if (schemaField !== undefined && !index.hasOwnProperty(schemaField.name)) {
          options.schema.fields.push(schemaField)
          index[schemaField.name] = schemaField
        }
      }
      return undefined
    }
    else if (typeof val === 'object' && Object.keys(val).length) {
      Object.keys(val).forEach(subPropName => {
        const schemaField = getSchemaField(val[subPropName], subPropName, field.name)
        if (schemaField !== undefined && !index.hasOwnProperty(schemaField.name)) {
          options.schema.fields.push(schemaField)
          index[schemaField.name] = schemaField
        }
      })
      return undefined
    }
  }
}

/**
 * Runs through the given QuerySnapshot and converts and copies it to an array.
 * Inserts the array into a BigQuery table with the given collectionName.
 *
 * @param {string} datasetID
 * @param {string} collectionName
 * @param {firebase.firestore.QuerySnapshot} snapshot
 * @param {boolean} [verbose = false]
 * @returns {Promise<Number>}
 * @public
 */
exports.copyToBigQuery = (datasetID, collectionName, snapshot, verbose = false) => {
  if (verbose) console.log('Copying ' + snapshot.docs.length + ' documents from collection ' + collectionName + ' to dataset ' + datasetID + '.')

  let counter = 0
  const rows = []

  for (let i = 0; i < snapshot.docs.length; i++) {
    const docID = snapshot.docs[i].id,
          data  = snapshot.docs[i].data()

    currentRow = {}

    Object.keys(data).forEach(propName => {
      currentRow['doc_ID'] = docID
      const formattedProp = formatProp(data[propName], propName)
      if (formattedProp) currentRow[formatName(propName)] = formattedProp
    })

    rows.push(currentRow)
    counter++
  }

  if (verbose) console.log('Completed conversion of collection ' + collectionName + '.')

  return bigQuery.dataset(datasetID).table(collectionName).insert(rows)
    .then(() => {
      if (verbose) console.log('Successfully copied collection ' + collectionName + ' to BigQuery.')
      return counter
    })
    .catch(e => {
      let errorMessage = ''

      if (e.errors.length) {
        errorMessage = e.errors.length + ' errors.'

        console.error(e.errors.length + ' errors. Here are the first three:')
        console.error(e.errors[0])
        console.error(e.errors[1])
        console.error(e.errors[2])

        if (e.errors[0].errors[0].message === 'no such field.') {
          console.error('Looks like there is a data type mismatch. Here are the data types found in this row. Please compare them with your BigQuery table schema.')

          const row     = {},
                rowKeys = Object.keys(e.errors[0].row)

          rowKeys.forEach(propName => {
            const formattedProp = formatProp(e.errors[0].row[propName], propName)
            if (formattedProp !== undefined) row[formatName(propName)] = typeof formattedProp
          })
          console.error(row)
        }
      }
      else {
        errorMessage = e
        console.error(e)
      }

      throw new Error(errorMessage)
    })
}

/**
 * Converting a given Firestore property to a format suitable for BigQuery.
 *
 * @param {string||number||Array||Object} val
 * @param {string} propName
 * @param {string} parent
 * @returns {string||number||Array||Object}
 * @private
 */
function formatProp (val, propName, parent) {
  if (val === null || typeof val === 'number' || typeof val === 'string') return val

  const name = formatName(propName, parent)

  if (Array.isArray(val)) {
    for (let i = 0; i < val.length; i++) {
      const formattedProp = formatProp(val[i], i, name)
      if (formattedProp !== undefined) currentRow[formatName(i, name)] = formattedProp
    }
  }
  else if (typeof val === 'object' && Object.keys(val).length) {
    Object.keys(val).forEach(subPropName => {
      const formattedProp = formatProp(val[subPropName], subPropName, name)
      if (formattedProp !== undefined) currentRow[formatName(subPropName, name)] = formattedProp
    })
    return undefined
  }
}

/**
 * Formatting the property name to work with BigQuery.
 * Objects with child props are prefixed with the parent name.
 *
 * @param {string} propName
 * @param {string} [parent = undefined]
 * @returns {string}
 * @private
 */
function formatName (propName, parent = undefined) {
  return parent ? parent + '__' + propName : propName
}

/**
 * Deletes all the given tables.
 *
 * @param {string} datasetID
 * @param {Array} tableNames
 * @param {boolean} [verbose = false]
 * @returns {Promise<number>}
 * @public
 */
exports.deleteBigQueryTables = (datasetID, tableNames, verbose = false) => {
  return Promise.all(tableNames.map(n => {
    if (verbose) console.log('Deleting table ' + n + ' from dataset ' + datasetID + '.')
    return bigQuery.dataset(datasetID).table(n).delete()
  }))
}
