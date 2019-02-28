## 1.1.0 (2019-02-28)

* Fixed bug that blocked the Firebase instance from intializing if another instance already was initialized in the users code. ([d7b5baa](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/d7b5baa))
* Reverted to defining datasetID in each function call, instead of globally.  ([d7b5baa](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/d7b5baa))



## 1.0.0 (2019-02-24)

* Improved API. ([5531576](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/5531576))
* Now possible to delete BigQuery Tables. ([5531576](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/5531576))
* Now you define the BigQuery dataset during initialization, instead of for each call. ([5531576](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/5531576))
* Improved JSDocs. ([5531576](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/5531576))



## <small>0.0.6 (2019-02-18)</small>

* Fixed bug that made the functions crash. ([0573b79](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/0573b79))



## <small>0.0.5 (2019-02-17)</small>

* Added support for specifying what GCP projects to use, for Firebase and BigQuery separately. ([3d62e98](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/3d62e98))



## <small>0.0.4 (2019-02-16)</small>

* Initial commit. ([7b85e23](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/7b85e23))
