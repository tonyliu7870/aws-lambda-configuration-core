[![CircleCI](https://circleci.com/gh/tonyliu7870/aws-lambda-configuration-core.svg?style=svg)](https://circleci.com/gh/tonyliu7870/aws-lambda-configuration-core)
  
[aws-lambda-configuration front page](https://github.com/tonyliu7870/aws-lambda-configuration)  
  
Assumed you had already setup your AWS access key, secret key and **region** (either in environment variable, aws profile, or any serverless framework supported way). ref: [serverless - Credentials](https://serverless.com/framework/docs/providers/aws/guide/credentials/)  
## Installation Guide (lazy version)   
`curl https://raw.githubusercontent.com/tonyliu7870/aws-lambda-configuration-core/master/lazy_setup.sh | bash`  
  
## Installation Guide (step-by-step)  
1. Download the source code  
Click "Download ZIP" from github **or** `git clone git@github.com:tonyliu7870/aws-lambda-configuration-core.git` **or** fork your own version (if you would like to save with your own settings).  
2. Go to directory  
`cd aws-lambda-configuration/`  
  
3. Install dependency  
`yarn install` **or** `npm install`  
  
4. Transpile typescript code  
`yarn build` **or** `npm run build`  
  
5. **READ Configuration Storage part below**  
  
6. Deploy to AWS  
`yarn deploy -- --stage dev --region us-east-1`  **or** `npm run deploy -- --stage dev --region us-east-1`  
  
## Configuration Storage  
aws-lambda-configuration use a DynamoDB table to store the configuration. By default, it sets up a new table named *lambda-configurations* for you via CloudFormation. However, it also **DELETE the table BY DEFAULT** when you remove aws-lambda-configuration via CloudFormation.  
If you DO NOT want to include the DynamoDB resources into CloudFormation (recommended):  
1. Disable the default table first: Open ./serverless.yml, comment out the whole **resources** part at the end by prepending a **#**.  
2. Go to your [AWS DynamoDB Console](https://console.aws.amazon.com/dynamodb/home). Create a new table with any *Table Name* and *Table settings*. The table MUST has a *Primary key* named with **configName** and in *String* type.  
  
## API  
This is a generic lambda function to handle all CRUD of the configuration. If you use the libraries, you may skip this part.  

| Parameter | Required? | Description |  
| --- | --- | --- |  
| tableName | required | The dynamoDB table name used to store all the configurations. (default to be "lambda-configurations" but strongly recommended to be set) |  
| documentName | required | The document name in the table to access the config. (default to be "settings" but strongly recommended to be set) |  
| type | required | What to do with the config. Accept: "GET", "PUT", "DELETE", "CHECK" |  
| key | optional | The path to sub-object of the config. undefined would refer to the whole document |  
| data | required | The config object to set. Only available on "PUT" |  
| noCache | optional | Will the core return a cached version if available. Only available on "GET" and "CHECK" |  
  
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
  
## API Example  
### Set (new document/replace whole document)  
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
  
### Set (partial update existing document)
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
- Get the whole config -> use [lodash.set](https://lodash.com/docs/#set) to update the config -> replace the whole config.  
- Find the deepest existing path -> update by `"key": "something.sub.some", "data": {"path":{"that":{"do":{"not":{"exist": "hi"}}}}}`  
- Consider how to restructure your configuration, e.g. flatten the config.  
  
### Get (whole config) 
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
  
### Get (one config) 
```
{
  "tableName": "myConfigTable",
  "documentName": "myConfig",
  "type": "GET",
  "key": "something.sub"
  "noCache": false    // default is false, i.e. use cache if available
}
// typeof result === 'string'
// result === "data v2"
```
  
### Has  
```
{
  "tableName": "myConfigTable",
  "documentName": "user.id.012345",
  "type": "CHECK",
  // "key": "abcdef"
}
// typeof result === 'boolean'
// result === false
// If you adopt aws-lambda-configuration as your account management framework, this can be a mean to check whether a user exist.
```
  
### Delete
```
{
  "tableName": "myConfigTable",
  "documentName": "myConfig",
  "type": "DELETE",
  // "key": "another[2]"
}
```
  
## Uninstallation Guide  
`node_modules/.bin/serverless remove`  
