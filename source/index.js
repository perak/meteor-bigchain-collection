var driver = null;
var conn = null;
var settings = null;

export class BigchainCollection extends Mongo.Collection {
	constructor(name, options) {
		super(name, options);
	}

	insert(doc, callback) {
		var self = this;


		if(Meteor.isServer) {
			settings = settings || Meteor.settings.bigchain || { url: "", publicKey: "", privateKey: "" };
			driver = driver || require('bigchaindb-driver');
			if(settings.app_id && settings.app_key)
			{
                conn = conn || new driver.Connection(settings.url, headers={
                    app_id: settings.app_id,
                    app_key: settings.app_key
                });
			}else
			{
                conn = conn || new driver.Connection(settings.url);
			}



			var payload = JSON.parse(JSON.stringify(doc));

			doc._transactionId = null;
			doc._transactionStatus = "pending";
			super.insert(doc, function(e, r) {
				if(e) {
					throw e;
				}
				if(callback) {
					callback(e, r);
				}

				// Construct a transaction payload
				payload._id = r;
				const tx = driver.Transaction.makeCreateTransaction(
					payload, 
					null,
					[ driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(settings.publicKey))],
					settings.publicKey
				);

				const txSigned = driver.Transaction.signTransaction(tx, settings.privateKey);

				conn.postTransaction(txSigned).then(function() { 
					conn.pollStatusAndFetchTransaction(txSigned.id).then(function(retrievedTx) {
						self.update({ _id: r }, { $set: { _transactionId: retrievedTx.id, _transactionStatus: "ok" } });
					});
				});
			});

		} else {
			super.insert.apply(this, arguments);
		}
	}
}
