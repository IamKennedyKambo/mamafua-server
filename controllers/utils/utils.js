const router = express.Router();
const express = require("express");

const prettyjson = require("prettyjson");

const options = {
  noColor: false,
};

const getDate = () => {
  return new Date().toISOString().slice(-24).replace(/\D/g, "").slice(0, 14);
};

const getPassword = () => {
  var shortCode = "174379",
    key = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
    timestamp = getDate();
  return Buffer.from(shortCode + key + timestamp).toString("base64");
};

router.post("/confirm", (req, res) => {
  console.log("-----------Received M-Pesa webhook-----------");

  // format and dump the request payload recieved from safaricom in the terminal
  //   console.log(prettyjson.render(req.body, options));
  //   console.log("-----------------------");

  //   let message = {
  //     ResponseCode: "00000000",
  //     ResponseDesc: "success",
  //   };

  //   // respond to safaricom servers with a success message
  //   res.json(message);
  //   console.log(res);
  console.log(req.body.Body);
});

router.post("/pay", (req, res, next) => {
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
            CallBackURL: "https://45888974bbc3.ngrok.io/orders/confirm",
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

router.get("/date", (req, res, next) => {
  var shortCode = "174379",
    key = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
    timestamp = getDate();
  var encoded = Buffer.from(shortCode + key + timestamp).toString("base64");
  res.status(200).send({ encoded: encoded, date: timestamp });
});
