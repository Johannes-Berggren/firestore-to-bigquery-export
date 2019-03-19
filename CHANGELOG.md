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
