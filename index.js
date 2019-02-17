exports.initializeBigQuery = (datasetName, collectionNames) => {
  /**
   * Creating a datasetName-dataset if it doesn't already exist.
   * Running through each collection and checking if a table with the same name exists in the dataset.
   * Creating the tables with the correct schema if the table doesn't already exist.
   */

  return new Promise((resolve, reject) => {
    let counter = 0
    const { BigQuery }    = require('@google-cloud/bigquery'),
          bigQuery        = new BigQuery(),
          dataset         = bigQuery.dataset(datasetName),
          existingTables  = [],
          promises        = []

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
                  promises.push(createTable(collectionName))
                }
              })
            })
            .catch(error => {
              console.error(error)
              reject(error)
            })
        }
        else {
          bigQuery.createDataset(datasetName)
            .then(() => {
              collectionNames.forEach(collectionName => {
                promises.push(createTable(collectionName))
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
              resolve({ tablesCreated: counter })
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

  function createTable (collectionName) {
    return new Promise((resolve, reject) => {
      firestore.collection(collectionName).get()
        .then(documents => {
          const index   = [],
                options = {
                  schema: {
                    fields: []
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
              counter++
              resolve(res)
            })
            .catch(error => {
              console.error(error)
              reject(error)
            })

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
}

exports.transportDataToBigQuery = (datasetName, collectionNames) => {
  /**
   * Iterate through the listed collections. Convert each document to a format suitable for BigQuery,
   * and insert them into a table corresponding to the collection name.
   */

  /**
   * This has to be run locally on your computer (firebase serve --only functions).
   */

  return new Promise((resolve, reject) => {
    let counter = 0
    const { BigQuery }    = require('@google-cloud/bigquery'),
          bigQuery        = new BigQuery(),
          dataset         = bigQuery.dataset(datasetName),
          promises        = []

    collectionNames.forEach(n => {
      promises.push(
        firestore.collection(n).get()
          .then(s => {
            console.log('Starting ' + n + ' (' + s.size + ' docs)')
            promises.push(
              transportToBigQuery(n, s)
                .then(() => {
                  console.log('Completed ' + n)
                })
                .catch(error => {
                  console.error('Error copying ' + n + ': ' + error)
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
          console.log('Copied ' + counter + ' documents to BigQuery.')
          resolve({ documentsCopied: counter })
        })
        .catch(error => {
          console.error(error)
          reject(error)
        })
    }, 30000)

    function transportToBigQuery (collectionName, snapshot) {
      return new Promise((resolve, reject) => {
        snapshot.forEach(doc => {
          doc = doc.data()
          const row = {}

          Object.keys(doc).forEach(propName => {
            const formattedProp = formatProp(doc[propName], propName)
            if (formattedProp !== undefined) row[formatName(propName)] = formattedProp
          })

          dataset.table(collectionName).insert(row, { writeDisposition: 'WRITE_TRUNCATE' })
            .then(res => {
              counter++
              resolve(res)
            })
            .catch(error => {
              console.error(error)
              console.error(error.errors)
              console.error(error.errors[0])
              reject(error)
            })

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
                if (formattedProp !== undefined) row[formatName(subPropName, propName)] = formattedProp
              })
              return undefined
            }
            return val
          }

          function formatName (propName, parent) {
            return parent ? parent + '__' + propName : propName
          }
        })
      })
    }
  })
}
