## <small>1.7.2 (2020-07-16)</small>

* Updated dependencies. ([8cbf2d9](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/8cbf2d9))
* Updated README. ([79eaf58](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/79eaf58))



## <small>1.7.1 (2020-07-16)</small>

* Bump websocket-extensions from 0.1.3 to 0.1.4 ([05e5de7](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/05e5de7))
* Fixed bug that filtered out certain Firestore objects that shouldn't be filtered out. ([9c490be](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/9c490be))



## 1.7.0 (2020-03-29)

* No longer catching errors. Letting them flow through to the users code. ([fec2891](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/fec2891))
* Updated dependencies. ([6c426d8](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/6c426d8))



## 1.6.0 (2020-03-19)

* Now possible to exclude specific fields from table creation and data export. ([783af43](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/783af43))
* Updated dependencies. ([7c32464](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/7c32464))



## <small>1.5.1 (2020-01-22)</small>

* Corrected README examples and updated description. ([698896e](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/698896e))



## 1.5.0 (2020-01-22)

* Removed possibility of handling several collections / tables simultaneously, in order to reduce comp ([a7ebc4b](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/a7ebc4b))
* Updated dependencies. ([9a391b6](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/9a391b6))
* Updated README. ([7c992dc](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/7c992dc))



## <small>1.4.2 (2019-09-21)</small>

* Fixed eslint errors. ([feca721](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/feca721))



## <small>1.4.1 (2019-09-03)</small>

* Added param insertSize to let users control the size of BigQuery inserts. Default is 5000 rows. ([be3d476](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/be3d476))



## 1.4.0 (2019-06-03)

* Updated dependencies to resolve Axios security issue. ([e4873fd](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/e4873fd))



## <small>1.3.8 (2019-05-28)</small>

* Gitignore .idea directory. ([f134e8a](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/f134e8a))



## <small>1.3.7 (2019-05-28)</small>

* Support for boolean type. ([89b8346](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/3d79a09))



## <small>1.3.6 (2019-03-27)</small>

* Added flag for verbose console output to make debugging easier. ([bdad033](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/bdad033))
* Setting column to float if any float is detected. Fixes #1 ([5a062e8](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/5a062e8)), closes [#1](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/issues/1)
* Updated documentation. ([89b8346](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/89b8346))



## <small>1.3.4 (2019-03-19)</small>

* Improved error messages when multiple documents fail. ([f61c12d](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/f61c12d))
* Returning BigQuery errors instead of making own. ([3e9bf97](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/3e9bf97))
* Support for deep objects and arrays. ([418e42b](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/418e42b))
* Support for objects inside arrays. ([fcb392d](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/fcb392d))
* Updated README.md. ([9a5e53b](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/9a5e53b))



## <small>1.3.3 (2019-03-18)</small>

* Improved performance for copyToBigQuery function. Inserting entire collection instead of single rows ([1348c42](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/1348c42))
* Updated README.md. ([97b1c27](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/97b1c27))



## <small>1.3.2 (2019-03-17)</small>

* Updated dev-dependencies and corrected package-lock version stamp. ([ca767e4](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/ca767e4))



## <small>1.3.1 (2019-03-17)</small>

* Improved documentation. ([ad4dbd9](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/ad4dbd9))



## 1.3.0 (2019-03-12)

* Takes QuerySnapshot as parameter instead of getting entire collection, so users can chose what data  ([7b4f893](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/7b4f893))



## 1.2.0 (2019-03-09)

* Added strict Eslint policy. ([20ee970](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/20ee970))
* Improved performance and reduced footprint. ([f0bcf00](https://github.com/Johannes-Berggren/firestore-to-bigquery-export/commit/f0bcf00))



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
