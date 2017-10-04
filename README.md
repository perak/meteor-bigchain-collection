# Meteor BigchainDB Collection

Extends Mongo.Collection, writes data to BigchainDB


## How it works?

Data is imediatelly written into your normal Mongo database plus it is sent as an transaction to BigchainDB. After transaction is confirmed by bigchain, document is updated with transaction ID and status is changed from "pending" to "ok".


## Usage

**Add this package to your Meteor application:**

```
meteor npm install --save meteor-bigchain-collection
```


**Add following to your Meteor `settings.json`:**

```
{
	"bigchain": {
		"url": "http://localhost:9984/api/v1/",
		"publicKey": "HyBFv87h28JuVE1vT3f1EWBadnza7gg2pG298LWnhy2P",
		"privateKey": "6KWcJUaf3mAd3yEoxyAfECxeCKYrL4ZEq2e7GDEW4kEQ"
	}
}
```

**Define collection in your application:**

```
import {BigchainCollection} from "meteor-bigchain-collection";

const MyCollection = new BigchainCollection("my_collection");
```

**Don't forget to start your application with settings.json**

```
meteor --settings settings.json
```


**And use collection as you normally do:**

```
MyCollection.insert({ hello: "world" });

console.log(MyCollection.find({}).fetch());
```


**You'll notice two additional fields in your document:**

- `_transactionId` - BigchainDB transaction ID. Initially it is null until transaction is confirmed.

- `_transactionStatus` - Initially it is `"pending"` and changes to `"ok"` after transaction is confirmed.


**That all folks (for now).**

Cheers!
