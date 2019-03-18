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
 * @returns {Promise<Number>}
 * @public
 */
exports.createBigQueryTables = (datasetID, collectionNames) => {
  return bigQuery.dataset(datasetID).exists()
    .then(res => {
      return res[0] || bigQuery.createDataset(datasetID)
    })
    .then(() => bigQuery.dataset(datasetID).getTables())
    .then(tables => {
      const existingTables = tables[0].map(table => table.id)

      return Promise.all(collectionNames.map(n => {
        if (!existingTables.includes(n)) {
          return createTableWithSchema(datasetID, n)
        }
        throw new Error('Table ' + n + ' already exists.')
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
 * @returns {Promise<BigQuery.Table>}
 * @private
 */
function createTableWithSchema (datasetID, collectionName) {
  const index   = [],
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
      console.log('Creating schema and table ' + collectionName + '.')

      documents.forEach(document => {
        document = document.data()

        Object.keys(document).forEach(propName => {
          const schemaField = getSchemaField(document[propName], propName)
          if (schemaField !== undefined && !index.includes(schemaField.name)) {
            options.schema.fields.push(schemaField)
            index.push(schemaField.name)
          }
        })
      })

      return bigQuery.dataset(datasetID).createTable(collectionName, options)
    })
    .catch(e => e)

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
    else if (typeof val === 'number') {
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
        if (schemaField !== undefined && !index.includes(schemaField.name)) {
          options.schema.fields.push(schemaField)
          index.push(schemaField.name)
        }
      }
      return undefined
    }
    else if (typeof val === 'object' && Object.keys(val).length) {
      Object.keys(val).forEach(subPropName => {
        const schemaField = getSchemaField(val[subPropName], subPropName, field.name)
        if (schemaField !== undefined && !index.includes(schemaField.name)) {
          options.schema.fields.push(schemaField)
          index.push(schemaField.name)
        }
      })
      return undefined
    }
    else if (typeof val === 'object' && !Object.keys(val).length) {
      field.type = 'STRING'
      field.mode = 'NULLABLE'
      return field
    }
    else console.error(collectionName + '.' + propName + ' error! Type: ' + typeof val)
  }
}

/**
 * @param {string} datasetID
 * @param {string} collectionName
 * @param {firebase.firestore.QuerySnapshot} snapshot
 * @returns {Promise<Number>}
 * @public
 */
exports.copyToBigQuery = (datasetID, collectionName, snapshot) => {
  console.log('Copying ' + snapshot.docs.length + ' documents from collection ' + collectionName + ' to dataset ' + datasetID + '.')

  let counter = 0
  const rows = []

  for (let i = 0; i < snapshot.docs.length; i++) {
    const docID = snapshot.docs[i].id,
          data  = snapshot.docs[i].data()

    currentRow = {}

    Object.keys(data).forEach(propName => {
      currentRow['doc_ID'] = docID
      const formattedProp = formatProp(data[propName], propName)
      if (formattedProp !== undefined) currentRow[formatName(propName)] = formattedProp
    })

    rows.push(currentRow)
    counter++
  }

  return bigQuery.dataset(datasetID).table(collectionName).insert(rows)
    .then(() => counter)
    .catch(e => {
      let errorMessage = ''

      if (e.errors.length) {
        errorMessage = e.errors.length + ' errors.'
        console.error(e.errors.length + ' errors. Here is the first one:')
        console.error(e.errors[0])

        if (e.errors[0].errors[0].message === 'no such field.') {
          console.error('Looks like there is a data type mismatch. Here are the data types found in this row. Please compare them with your BigQuery table schema.')

          const row     = {},
                rowKeys = Object.keys(e.errors[0].row)

          rowKeys.forEach(propName => {
            const formattedProp = formatProp(e.errors[0].row[propName], propName)
            if (formattedProp) row[formatName(propName)] = typeof formattedProp
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
 * @returns {string||number||Array||Object}
 * @private
 */
function formatProp (val, propName) {
  if (val === null) {
    return val
  }
  if (Array.isArray(val)) {
    let s = ''
    for (let i = 0; i < val.length; i++) {
      s += val[i] + (i < val.length - 1 ? ',' : '')
    }
    return s
  }
  else if (typeof val === 'object' && Object.keys(val).length) {
    Object.keys(val).forEach(subPropName => {
      const formattedProp = formatProp(val[subPropName], subPropName)
      if (formattedProp !== undefined) currentRow[formatName(subPropName, propName)] = formattedProp
    })
    return undefined
  }
  return val
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
function formatName (propName, parent) {
  parent = parent || undefined
  return parent ? parent + '__' + propName : propName
}

/**
 * Deletes all the given tables.
 *
 * @param {string} datasetID
 * @param {Array} tableNames
 * @returns {Promise<number>}
 * @public
 */
exports.deleteBigQueryTables = (datasetID, tableNames) => {
  return Promise.all(tableNames.map(n => {
    console.log('Deleting table ' + n + ' from dataset ' + datasetID + '.')
    return bigQuery.dataset(datasetID).table(n).delete()
  }))
}
