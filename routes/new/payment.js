require("dotenv").config();
const express = require("express");
const router = express.Router();

const Receipt = require("../../models/new/receipt");
const Order = require("../../models/new/order");
const Profile = require("../../models/new/profile");
const User = require("../../models/new/user");
const io = require("../../socket");

const getDate = () => {
  return new Date().toISOString().slice(-24).replace(/\D/g, "").slice(0, 14);
};

const getPassword = () => {
  var shortCode = "174379",
    key = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
    timestamp = getDate();
  return Buffer.from(shortCode + key + timestamp).toString("base64");
};

router.post("/confirmation", (req, res) => {
  var code = req.body.Body.stkCallback.ResultCode;
  var callback = req.body.Body.stkCallback;
  var body = req.body.Body.stkCallback.CallbackMetadata;

  // console.log("--- confirmation body");
  // console.log(body);

  if (code == 0) {
    //Create receipt here
    var stringedBody = JSON.stringify(body);
    var stringedCallback = JSON.stringify(callback);

    var jsonBody = JSON.parse(stringedBody);
    var jsonCallback = JSON.parse(stringedCallback);

    const receipt = new Receipt({
      number: jsonBody.Item[3].Value,
      transactionId: jsonBody.Item[1].Value,
      amount: jsonBody.Item[0].Value,
      date: jsonBody.Item[2].Value,
      merchantRequestId: jsonCallback.MerchantRequestID,
      checkoutRequestId: jsonCallback.CheckoutRequestID,
    });

    // console.log("--- receipt");
    // console.log(receipt);

    //Upload receipt here
    receipt
      .save()
      .then((result) => {
        io.getIO().emit("receipt", { action: "create", receipt: receipt });
        // console.log("--- result");
        // console.log(result);

        Order.findOne({
          merchantRequestId: jsonCallback.MerchantRequestID,
          checkoutRequestId: jsonCallback.CheckoutRequestID,
        })
          .then((order) => {
            // console.log("--- order 1");
            // console.log(order);
            Order.updateOne(
              { _id: order._id },
              {
                receiptId: receipt._id,
                merchantRequestId: receipt.merchantRequestId,
                checkoutRequestId: receipt.checkoutRequestId,
                transactionId: receipt.transactionId,
                paid: receipt.date,
                status: "Paid",
              }
            )
              .then((order) => {
                // console.log("--- order 2");
                // console.log(order);
              })
              .catch((err) => {});
          })
          .catch((err) => {
            if (!err.statusCode) {
              err.statusCode = 500;
            }
          });
      })
      .catch((err) => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
      });

    let message = {
      ResponseCode: "00000000",
      ResponseDesc: "success",
    };
    // respond to safaricom servers with a success message
    res.json(message);
  } else if (code == 1032) {
  } else if (code == 17) {
  }
});

router.post("/", (req, res) => {
  var request = require("request"),
    consumer_key = "Q6A16D5ZHAgWWJOBtg2SU5LBNajMIUGk",
    consumer_secret = "9pPo40CvdLqDULyp",
    url =
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
  auth =
    "Basic " +
    new Buffer.from(consumer_key + ":" + consumer_secret).toString("base64");

  request(
    {
      url: url,
      headers: {
        Authorization: auth,
      },
    },
    function (error, response, body) {
      var payload = JSON.parse(body);
      var token = payload.access_token;
      var request = require("request"),
        oauth_token = token,
        url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        auth = `Bearer ${oauth_token}`,
        shortCode = "174379",
        number = req.body.phone;

      request(
        {
          method: "POST",
          url: url,
          headers: {
            Authorization: auth,
          },
          json: {
            BusinessShortCode: shortCode,
            Password: getPassword(),
            Timestamp: getDate(),
            TransactionType: "CustomerPayBillOnline",
            Amount: "1",
            PartyA: number,
            PartyB: shortCode,
            PhoneNumber: number,
            // CallBackURL: "https://mamafua-api.xyz/pay/confirmation",
            CallBackURL: "https://00713c9a66b5.ngrok.io/pay/confirmation",
            AccountReference: "Mama Fua",
            TransactionDesc: "Services",
          },
        },
        function (error, response, body) {
          if (error) {
            // console.log(error);
            res.status(400).send({ message: "Failed", payload: error });
          } else {
            var order = new Order({
              placedBy: req.body.placedBy,
              phone: req.body.phone,
              latitude: req.body.latitude,
              longitude: req.body.longitude,
              amount: req.body.amount,
              paidVia: req.body.paidVia,
              status: req.body.status,
              transactionId: req.body.transactionId,
              merchantRequestId: body.MerchantRequestID,
              checkoutRequestId: body.CheckoutRequestID,
              profileId: req.body.profileId,
              profileName: req.body.profileName,
              center: req.body.center,
              executionDate: req.body.executionDate,
              services: req.body.services,
            });

            // console.log("--- order");
            // console.log(order);

            order
              .save()
              .then((result) => {
                io.getIO().emit("orders", { action: "create", order: order });
                console.log("--- order saving");
                console.log(result);
                res
                  .status(200)
                  .send({ message: "Success", payload: body, order: result });
              })
              .catch((err) => {
                console.log(err);
              })
              .then(() => {
                return Profile.findById(req.body.profileId);
              })
              .catch((err) => {})
              .then((profile) => {
                profile.jobs.push(order);
                return profile.save();
              })
              .catch((err) => {})
              .then(() => {
                return User.findById(req.body.placedBy);
              })
              .catch((err) => {})
              .then((user) => {
                user.orders.push(order);
                return user.save();
              })
              .catch((err) => {
                if (!err.statusCode) {
                  err.statusCode = 500;
                }
              });
          }
        }
      );
    }
  );
});

module.exports = router;
