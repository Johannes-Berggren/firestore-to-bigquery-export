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
const { BigQuery } = require('@google-cloud/bigquery'),
      firebase     = require('firebase-admin')

let bigQuery   = {},
    currentRow = {},
    firestore  = {}

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
 * Runs through all documents in the given collection to ensure all properties are added to the schema.
 * Generating schema. Creating a table with the created schema in the given dataset.
 *
 * @param {string} datasetID
 * @param {string} collectionName
 * @param {boolean} [verbose = false]
 * @param {Array<string>} exclude
 * @returns {Promise<BigQuery.Table>}
 * @private
 */
exports.createBigQueryTable = async (datasetID, collectionName, verbose = false, exclude = []) => {
  const index = {}

  const options = {
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

  const snapshot = await firestore.collection(collectionName).get()

  if (verbose) console.log('Creating schema and table ' + collectionName + '.')

  snapshot.forEach(document => {
    document = document.data()

    Object.keys(document).forEach(propName => {
      if (!exclude.includes(propName)) {
        const schemaField = _getSchemaField(document[propName], propName)

        if (schemaField !== undefined) {
          if (!Object.prototype.hasOwnProperty.call(index, schemaField.name)) {
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

  /**
   * Determines schema field properties based on the given document property.
   *
   * @param {string||number||Array||Object} val
   * @param {string} propName
   * @param {string} parent
   * @returns {Object||undefined}
   * @private
   */
  function _getSchemaField (val, propName, parent) {
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
        const schemaField = _getSchemaField(val[i], i, field.name)
        if (schemaField !== undefined && !Object.prototype.hasOwnProperty.call(index, schemaField.name)) {
          options.schema.fields.push(schemaField)
          index[schemaField.name] = schemaField
        }
      }
      return undefined
    }
    else if (typeof val === 'object' && Object.keys(val).length) {
      Object.keys(val).forEach(subPropName => {
        const schemaField = _getSchemaField(val[subPropName], subPropName, field.name)
        if (schemaField !== undefined && !Object.prototype.hasOwnProperty.call(index, schemaField.name)) {
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
 * @param {Number} [insertSize = 5000]
 * @param {Array<string>} exclude
 * @returns {Promise<Number>}
 * @public
 */
exports.copyToBigQuery = (datasetID, collectionName, snapshot, verbose = false, insertSize = 5000, exclude = []) => {
  if (verbose) {
    console.log('Copying ' + snapshot.docs.length + ' documents from collection ' + collectionName + ' to dataset ' + datasetID + '.')
    console.log('Inserting ' + insertSize + ' documents at a time.')
  }

  let counter = 0
  let rows = []

  const promises = []

  for (let i = 0; i < snapshot.docs.length; i++) {
    const docID = snapshot.docs[i].id
    const data = snapshot.docs[i].data()

    currentRow = {}

    Object.keys(data).forEach(propName => {
      if (!exclude.includes(propName)) {
        currentRow.doc_ID = docID
        const formattedProp = _formatProp(data[propName], propName)
        if (formattedProp !== undefined) currentRow[_formatName(propName)] = formattedProp
      }
    })

    rows.push(currentRow)
    counter++

    if (rows.length === insertSize || i === snapshot.docs.length - 1) {
      if (verbose) console.log('Inserting ' + rows.length + ' docs. ' + (snapshot.docs.length - i - 1) + ' docs left.')
      promises.push(
        bigQuery.dataset(datasetID).table(collectionName).insert(rows)
      )
      rows = []
    }
  }

  return Promise.all(promises)
    .then(() => {
      if (verbose) console.log('Successfully copied collection ' + collectionName + ' to BigQuery.')
      return counter
    })
    .catch(e => {
      if (e.errors.length) {
        console.error(e.errors.length + ' errors. Here are the first three:')

        for (let z = 0; z < 3; z++) {
          console.error(e.errors[z])
        }

        if (e.errors[0].errors[0].message === 'no such field.') {
          console.error('Looks like there is a data type mismatch. Here are the data types found in this row. Please compare them with your BigQuery table schema.')

          const row     = {},
                rowKeys = Object.keys(e.errors[0].row)

          rowKeys.forEach(propName => {
            const formattedProp = _formatProp(e.errors[0].row[propName], propName)
            if (formattedProp !== undefined) row[_formatName(propName)] = typeof formattedProp
          })
          console.error(row)
        }
      }
      else console.error(e)
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
function _formatProp (val, propName, parent) {
  if (val === null || typeof val === 'number' || typeof val === 'string' || typeof val === 'boolean') return val

  const name = _formatName(propName, parent)

  if (Array.isArray(val)) {
    for (let i = 0; i < val.length; i++) {
      const formattedProp = _formatProp(val[i], i, name)
      if (formattedProp !== undefined) currentRow[_formatName(i, name)] = formattedProp
    }
  }
  else if (typeof val === 'object' && Object.keys(val).length) {
    Object.keys(val).forEach(subPropName => {
      const formattedProp = _formatProp(val[subPropName], subPropName, name)
      if (formattedProp !== undefined) currentRow[_formatName(subPropName, name)] = formattedProp
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
function _formatName (propName, parent = undefined) {
  return parent ? parent + '__' + propName : propName
}

/**
 * Deletes all the given tables.
 *
 * @param {string} datasetID
 * @param {String} tableName
 * @param {boolean} [verbose = false]
 * @returns {Promise<number>}
 * @public
 */
exports.deleteBigQueryTable = (datasetID, tableName, verbose = false) => {
  if (verbose) console.log('Deleting table ' + tableName + ' from dataset ' + datasetID + '.')

  return bigQuery.dataset(datasetID).table(tableName).delete()
}
