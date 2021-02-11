require("dotenv").config();
const express = require("express");
const router = express.Router();

const Receipt = require("../models/new/receipt");

const getDate = () => {
  return new Date().toISOString().slice(-24).replace(/\D/g, "").slice(0, 14);
};

const getPassword = () => {
  var shortCode = "174379",
    key = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
    timestamp = getDate();
  return Buffer.from(shortCode + key + timestamp).toString("base64");
};

module.exports = router.post("/confirm", (req, res, next) => {
  var code = req.body.Body.stkCallback.ResultCode;
  var body = req.body.Body.stkCallback.CallbackMetadata;
  if (code == 0) {
    let message = {
      ResponseCode: "00000000",
      ResponseDesc: "success",
    };
    // respond to safaricom servers with a success message
    res.json(message);

    //Create receipt here
    var stringedBody = JSON.stringify(body);

    var jsonBody = JSON.parse(stringedBody);

    var receipt = new Receipt({
      number: jsonBody.Item[3].Value,
      transactionId: jsonBody.Item[1].Value,
      amount: jsonBody.Item[0].Value,
      date: jsonBody.Item[2].Value,
    });

    //Upload receipt here
    receipt
      .save()
      .then((result) => {
        io.getIO().emit("receipt", { action: "create", receipt: receipt });
        next();
      })
      .catch((err) => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
      });
  } else if (code == 1032) {
    next(new Error("Payment cancelled!"));
    console.log(req.body.Body);
  } else if (code == 17) {
    next(new Error("Payment cancelled!"));
    console.log(req.body.Body);
  }
});

router.post("/pay", (req, res) => {
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
        number = req.body.number;

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
            CallBackURL: "https://089edff548bf.ngrok.io/pay/confirm/",
            AccountReference: "Mama Fua",
            TransactionDesc: "Services",
          },
        },
        function (error, response, body) {
          if (error)
            res.status(400).send({ message: "Failed", payload: error });
          else res.status(200).send({ message: "Success", payload: body });
        }
      );
    }
  );
});
