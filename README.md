# RightClick
Its a contest hosting web App where user should have to logged in to create contest and any other user can either participate by uploading their pictures or they can vote on other participants picture.

Top 3 result of that contest will be automatically declared on the date provided by user. Result will be available on result section.

### Install
Some configuration for the project need to be set up like 

Create .env file add following configuration
    FbCLIENT_ID = ''
    FbCLIENT_SEC = ''

    GoogleCLIENT_ID = ''
    GoogleCLIENT_SEC = ''

    AWS_REGION=''
    S3_BUCKET=
    AWS_ACCESS_KEY_ID=''
    AWS_SECRET_ACCESS_KEY=''

Create a App in <https://developers.facebook.com/> and add fb app FbCLIENT_ID and FbCLIENT_SEC in env file same for google GoogleCLIENT_ID and GoogleCLIENT_SEC

SetUp local MongoDb

Add AWS_REGION and S3_BUCKET name

Create AWS IAM user and give permission to access S3 read and write  And add IAM user key and id in place of AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

Add https to localhost create a ssl folder name your https certificates as server.crt and server.key keep that folder in root of Dir

Run npm install
Start mongodb server, configure url in app.js 
Run node app.js, Go to <https://localhost:8000>


