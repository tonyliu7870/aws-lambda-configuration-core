# Installation Guide
1. Download the source code  
Click "Download ZIP" from github **or** `git clone git@github.com:tonyliu7870/aws-lambda-configuration-core.git` **or** fork your own version.  
2. Go to directory  
`cd aws-lambda-configuration/`  
  
3. Install dependency  
`yarn install`  
  
4. Transpile typescript code  
`yarn build`  
  
5. **READ Configuration Storage part below**   
  
6. Deploy to AWS  
`yarn deploy -- --stage dev`  
  
# API  
This is a generic function to handle all CRUD of the configuration.
| Parameter | Required? | Description |
| --- | --- | --- |
| tableName | required | The dynamoDB table name used to store all the configurations. (default to be "lambda-configurations" but strongly recommended to be set) |  
| documentName | required | The document name in the table to access the config. (default to be "settings" but strongly recommended to be set) |  
| type | required | What to do with the config. Accept: "GET", "PUT", "DELETE", "CHECK" |  
| key | optional | The path to sub-object of the config. undefined would refer to the whole document |  
| data | depends on type | The config object to set. Only available on "PUT" |  
| noCache | optional | Will the core return a cached version if available. Only available on "GET" |  
  
```
{
  tableName: string;
  documentName: string;
  type: string;
  key?: string;
  data?: any;
  noCache?: boolean;
}
```
  
# Configuration Storage  
aws-lambda-configuration use a DynamoDB table to store the configuration. By default, it sets up a new table named *lambda-configurations* for you via CloudFormation. However, it also **DELETE the table BY DEFAULT** when you remove aws-lambda-configuration via CloudFormation.  
If you do not want to include the DynamoDB resources into CloudFormation (recommended):  
1. Disable the default table first. Open ./serverless.yml, comment out the whole **resources** part at the end by prepending a **#**.  
2. Go to your [AWS DynamoDB Console](https://console.aws.amazon.com/dynamodb/home). Create a new table with any *Table Name* and *Table settings*. The table MUST has a *Primary key* named with **configName** and in *String* type.  
  
# Example  
## Set (new document/replace whole document) 
```
{
  "tableName": "myConfigTable",
  "documentName": "myConfig",
  "type": "PUT",
  "data": {
    "hello": "world",
    "something": {
      "sub": "data"
    },
    "another": [1,2,3,4,5]
  }
}
```
  
## Set (partial update existing document)
```
{
  "tableName": "myConfigTable",
  "documentName": "myConfig",
  "type": "PUT",
  "key": "something.sub",
  "data": "data v2"
}
```
Note: You can not directly set a config via a virtual path, e.g. `"key": "something.sub.some.path.that.do.not.exist"`. Instead, your possible options are:  
1. Get the whole config -> use [lodash.set](https://lodash.com/docs/#set) to update to config -> replace the whole config.  
2. Find the deepest existing path -> update by `"key": "something.sub.some", "data": {"path":{"that":{"do":{"not":{"exist": "hi"}}}}}`  
3. Consider how to restructure your configuration, e.g. flatten the config.  
  
## Get (whole config) 
```
{
  "tableName": "myConfigTable",
  "documentName": "myConfig",
  "type": "GET",
  "noCache": true
}
// typeof result === 'object'
// result === {"hello":"world","something":{"sub": "data v2"},"another":[1,2,3,4,5]}
```
  
## Get (one config) 
```
{
  "tableName": "myConfigTable",
  "documentName": "myConfig",
  "type": "GET",
  "key": "something.sub"
  "noCache": false    // default is false
}
// typeof result === 'string'
// result === "data v2"
```
  
## Has  
```
{
  "tableName": "myConfigTable",
  "documentName": "user:id:012345",
  "type": "CHECK"
  // "key": "abcdef"
}
// typeof result === 'boolean'
// result === false
// If you use aws-lambda-configuration as your account management framework, this can be a mean to check whether a user exist.
```
  
## Delete
```
{
  "tableName": "myConfigTable",
  "documentName": "myConfig",
  "type": "DELETE",
  // "key": "another[2]"
}
```
  
# Uninstallation Guide  
run `node_modules/.bin/serverless remove`  