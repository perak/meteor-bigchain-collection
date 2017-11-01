"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var driver = null;
var conn = null;
var settings = null;

var BigchainCollection = exports.BigchainCollection = function (_Mongo$Collection) {
	_inherits(BigchainCollection, _Mongo$Collection);

	function BigchainCollection(name, options) {
		_classCallCheck(this, BigchainCollection);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(BigchainCollection).call(this, name, options));
	}

	_createClass(BigchainCollection, [{
		key: "insert",
		value: function insert(doc, callback) {
			var self = this;

			if (Meteor.isServer) {
				settings = settings || Meteor.settings.bigchain || { url: "", publicKey: "", privateKey: "" };
				driver = driver || require('bigchaindb-driver');
                if(settings.app_id && settings.app_key)
                {
                    conn = conn || new driver.Connection(settings.url, {
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
				_get(Object.getPrototypeOf(BigchainCollection.prototype), "insert", this).call(this, doc, function (e, r) {
					if (e) {
						throw e;
					}
					if (callback) {
						callback(e, r);
					}

					// Construct a transaction payload
					payload._id = r;
					var tx = driver.Transaction.makeCreateTransaction(payload, null, [driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(settings.publicKey))], settings.publicKey);

					var txSigned = driver.Transaction.signTransaction(tx, settings.privateKey);

					conn.postTransaction(txSigned).then(function () {
						conn.pollStatusAndFetchTransaction(txSigned.id).then(function (retrievedTx) {
							self.update({ _id: r }, { $set: { _transactionId: retrievedTx.id, _transactionStatus: "ok" } });
						});
					});
				});
			} else {
				_get(Object.getPrototypeOf(BigchainCollection.prototype), "insert", this).apply(this, arguments);
			}
		}
	}]);

	return BigchainCollection;
}(Mongo.Collection);