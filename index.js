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
    dataset      = undefined,
    firebase     = require('firebase-admin'),
    firestore    = {}

/**
 * Connecting to the given Firebase project.
 *
 * @param {JSON} serviceAccountFile
 * @public
 */
exports.setFirebaseConfig = serviceAccountFile => {
  firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccountFile)
  })
  firestore = firebase.firestore()
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
 * Choosing what BigQuery dataset to use.
 *
 * @param {String} datasetID
 * @public
 */
exports.setBigQueryDataset = datasetID => {
  dataset = bigQuery.dataset(datasetID)
}

/**
 * Creating a BigQuery dataset with the given name if it doesn't already exist.
 * Running through each collection and checking if a table with the same name exists in the dataset.
 * Creating the tables with the correct schema if the table doesn't already exist.
 *
 * @param {Array} collectionNames
 * @returns {Promise<Number>}
 * @public
 */
exports.createBigQueryTables = collectionNames => {
  let counter = 0
  const existingTables = [],
        promises       = []

  return new Promise((resolve, reject) => {
    dataset.exists()
      .then(res => {
        if (res[0]) {
          dataset.getTables()
            .then(tables => {
              tables[0].forEach(table => {
                existingTables.push(table.id)
              })

              console.log('Existing tables:')
              console.log(existingTables)

              collectionNames.forEach(collectionName => {
                if (!existingTables.includes(collectionName)) {
                  promises.push(
                    createTableWithSchema(collectionName)
                      .then(() => counter++)
                  )
                }
              })
            })
            .catch(error => {
              console.error(error)
              reject(error)
            })
        }
        else {
          bigQuery.createDataset(datasetID)
            .then(() => {
              collectionNames.forEach(collectionName => {
                promises.push(
                  createTableWithSchema(collectionName)
                    .then(() => counter++)
                )
              })
            })
            .catch(error => {
              console.error(error)
              reject(error)
            })
        }

        setTimeout(() => {
          Promise.all(promises)
            .then(() => {
              console.log('Created ' + counter + ' tables in BigQuery.')
              resolve(counter)
            })
            .catch(error => {
              reject(error)
            })
        }, 10000)
      })
      .catch(error => {
        console.error(error)
        reject(error)
      })
  })
}

/**
 * Runs through all documents in the given collection
 * to ensure all properties are added to the schema.
 *
 * @param collectionName
 * @returns {Promise<BigQuery.Table>}
 * @private
 */
function createTableWithSchema (collectionName) {
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

        dataset.createTable(collectionName, options)
          .then(res => {
            resolve(res)
          })
          .catch(error => {
            console.error(error)
            reject(error)
          })

        /**
         * Determines schema field properties based on the given document property.
         *
         * @param {String||Number||Array||Object} val
         * @param {String} propName
         * @param {String} parent
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
      .catch(error => {
        console.error(error)
        reject(error)
      })
  })
}

/**
 * Iterate through the listed collections. Convert each document to a format suitable for BigQuery,
 * and insert them into a table corresponding to the collection name.
 *
 * @param {Array} collectionNames
 * @returns {Promise<Number>}
 * @public
 */
exports.copyCollectionsToBigQuery = collectionNames => {
  let counter = 0
  const promises = []

  return new Promise((resolve, reject) => {
    collectionNames.forEach(n => {
      promises.push(
        firestore.collection(n).get()
          .then(s => {
            console.log('Starting ' + n + ' (' + s.size + ' docs)')
            promises.push(
              copyToBigQuery(n, s)
                .then(() => {
                  console.log('Completed ' + n)
                  counter++
                })
                .catch(error => {
                  console.error('Error copying ' + n + ': ' + error)
                  console.error(error)
                  console.error(error.errors)
                  console.error(error.errors[0])
                })
            )
          })
          .catch(error => {
            console.error(error)
            reject(error)
          })
      )
    })

    setTimeout(() => {
      Promise.all(promises)
        .then(() => {
          console.log('Copied ' + counter + ' collections to BigQuery.')
          resolve(counter)
        })
        .catch(error => {
          console.error(error)
          reject(error)
        })
    }, 30000)
  })
}

/**
 * @param {String} collectionName
 * @param {firebase.firestore.QuerySnapshot} snapshot
 * @returns {Promise<Object>}
 * @private
 */
function copyToBigQuery (collectionName, snapshot) {
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

      dataset.table(collectionName).insert(currentRow)
        .then(res => resolve(res))
        .catch(error => {
          reject(error)
        })
    })
  })
}

/**
 * @param {String||Number||Array||Object} val
 * @param {String} propName
 * @returns {String||Number||Array||Object}
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
 * @param {String} propName
 * @param {String} [parent = undefined]
 * @returns {string}
 * @private
 */
function formatName (propName, parent) {
  parent = parent || undefined
  return parent ? parent + '__' + propName : propName
}

/**
 *
 * @param tableNames
 * @returns {Promise<Number>}
 * @public
 */
exports.deleteBigQueryTables = tableNames => {
  let counter = 0
  const promises = []

  return new Promise((resolve, reject) => {
    tableNames.forEach(n => {
      promises.push(
        dataset.table(n).delete()
          .then(s => {
            console.log('Deleted table ' + n)
            counter++
          })
          .catch(error => {
            console.error(error)
            reject(error)
          })
      )
    })

    Promise.all(promises)
      .then(() => {
        console.log('Deleted ' + counter + ' tables.')
        resolve(counter)
      })
      .catch(error => {
        console.error(error)
        reject(error)
      })
  })
}
