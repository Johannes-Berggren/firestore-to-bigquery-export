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
  return new Promise((resolve, reject) => {
    let counter = 0
    const existingTables = [],
          promises       = []

    verifyOrCreateDataset(datasetID)
      .then(() => {
        bigQuery.dataset(datasetID).getTables()
          .then(tables => {
            tables[0].forEach(table => {
              existingTables.push(table.id)
            })

            console.log('Existing tables:')
            console.log(existingTables)

            collectionNames.forEach(collectionName => {
              if (!existingTables.includes(collectionName)) {
                promises.push(
                  createTableWithSchema(datasetID, collectionName)
                    .then(() => counter++)
                )
              }
            })

            Promise.all(promises)
              .then(() => {
                console.log('Created ' + counter + ' tables in BigQuery.')
                resolve(counter)
              })
              .catch(e => reject(e))
          })
          .catch(e => reject(e))
      })
      .catch(e => reject(e))
  })
}

/**
 * Checking if a dataset with the given ID exists. Creating it if it doesn't.
 *
 * @param {string} datasetID
 * @returns {Promise<boolean||BigQuery.Dataset>}
 * @private
 */
function verifyOrCreateDataset (datasetID) {
  return new Promise((resolve, reject) => {
    bigQuery.dataset(datasetID).exists()
      .then(res => {
        if (res[0]) resolve(res)
        else {
          console.log('Dataset ' + datasetID + ' not found. Creating it.')
          bigQuery.createDataset(datasetID)
            .then(res => resolve(res))
            .catch(e => reject(e))
        }
      })
      .catch(e => reject(e))
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
  return new Promise((resolve, reject) => {
    firestore.collection(collectionName).get()
      .then(documents => {
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

        console.log('Creating schema for table ' + collectionName)

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

        bigQuery.dataset(datasetID).createTable(collectionName, options)
          .then(res => resolve(res))
          .catch(e => reject(e))

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
            field.type = 'STRING'
            field.mode = 'NULLABLE'
            return field
          }
          else if (typeof val === 'object' && Object.keys(val).length) {
            Object.keys(val).forEach(subPropName => {
              const schemaField = getSchemaField(val[subPropName], subPropName, propName)
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
      })
      .catch(e => reject(e))
  })
}

/**
 * Iterate through the listed collections. Convert each document to a format suitable for BigQuery,
 * and insert them into a table corresponding to the collection name.
 *
 * @param {string} datasetID
 * @param {Array} collectionNames
 * @returns {Promise<Number>}
 * @public
 */
exports.copyCollectionsToBigQuery = (datasetID, collectionNames) => {
  let counter = 0
  const promises = []

  return new Promise((resolve, reject) => {
    verifyOrCreateDataset(datasetID)
      .then(() => {
        collectionNames.forEach(n => {
          promises.push(
            firestore.collection(n).get()
              .then(s => {
                console.log('Starting ' + n + ' (' + s.size + ' docs)')

                promises.push(
                  copyToBigQuery(datasetID, n, s)
                    .then(() => {
                      console.log('Completed ' + n)
                      counter++
                    })
                    .catch(error => {
                      console.error('Error copying ' + n + ': ' + error)
                      console.error(error)
                    })
                )
              })
              .catch(e => reject(e)))
        })
        setTimeout(() => {
          Promise.all(promises)
            .then(() => {
              console.log('Copied ' + counter + ' collections to BigQuery.')
              resolve(counter)
            })
            .catch(e => reject(e))
        }, 30000)
      })
      .catch(e => reject(e))
  })
}

/**
 * @param {string} datasetID
 * @param {string} collectionName
 * @param {firebase.firestore.QuerySnapshot} snapshot
 * @returns {Promise<Object>}
 * @private
 */
function copyToBigQuery (datasetID, collectionName, snapshot) {
  return new Promise((resolve, reject) => {
    snapshot.forEach(doc => {
      const doc_ID = doc.id,
            data   = doc.data()

      currentRow = {}

      Object.keys(data).forEach(propName => {
        currentRow['doc_ID'] = doc_ID
        const formattedProp = formatProp(data[propName], propName)
        if (formattedProp !== undefined) currentRow[formatName(propName)] = formattedProp
      })

      bigQuery.dataset(datasetID).table(collectionName).insert(currentRow)
        .then(res => resolve(res))
        .catch(e => reject(e))
    })
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
  let counter = 0
  const promises = []

  return new Promise((resolve, reject) => {
    tableNames.forEach(n => {
      promises.push(
        bigQuery.dataset(datasetID).table(n).delete()
          .then(s => {
            console.log('Deleted table ' + n)
            counter++
          })
          .catch(e => reject(e))
      )
    })

    Promise.all(promises)
      .then(() => {
        console.log('Deleted ' + counter + ' tables.')
        resolve(counter)
      })
      .catch(e => reject(e))
  })
}
