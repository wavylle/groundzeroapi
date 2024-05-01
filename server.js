require("dotenv").config();
const mongoose = require("mongoose");
var mongourl = process.env.MONGODB_URL;
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const app = express();
const {randomBytes} = require("crypto")
const User = require("./models/userModel");

const generateToken = () => {
  return randomBytes(20).toString("hex");
};

app.use(bodyParser.urlencoded({ extended: false }));
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Server running...")
});

app.post("/create_user", async (req, res) => {
  const userData = await req.body

  const customer_id = generateToken()
  const name = userData["name"]
  const email = userData["email"]
  const phone = userData["phone"]
  const broker = userData["broker"]
  const broker_user_id = userData["broker_user_id"]
  
  const getUser = await User.findOne({broker_user_id: broker_user_id})
  if(!getUser) {
    var customer = await new User({
      customer_id: customer_id,
      name: name,
      email: email,
      phone: phone,
      broker: broker,
      broker_user_id: broker_user_id
    });
    customer.save()
    res.send({"status": true, "message": "Account successfully created."})
  }
  else {
    res.send({"status": false, "message": "Broker user ID already exists, please try again."})
  }
  
})

function authenticateZerodha(broker_user_id, encToken) {
  const headers = {
    Authorization: `enctoken ${encToken}`,
  };

  const rootUrl = "https://api.kite.trade";

  console.log(headers)

  return new Promise((resolve, reject) => {
    axios
      .get(rootUrl + "/user/profile", { headers })
      .then(async (response) => {
        // Handle response data
        if(response.data["status"] == "success") {
          if("user_id" in response.data["data"]) {
            if(broker_user_id == response.data["data"]["user_id"]) {
              const getCustomer = await User.findOne({broker_user_id: response.data["data"]["user_id"]})
              if(getCustomer) {
                console.log("Returning True...")
                resolve(true);
              }
            }
          }
        }
        resolve(false);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

app.post("/extensionAuthenticate", async (req, res) => {
  const userBody = await req.body

  
  const broker = "zerodha"
  const broker_user_id = userBody["broker_user_id"]
  const enc_token = userBody["enc_token"]

  console.log(broker_user_id, enc_token)

  const getUser = await User.findOne({broker: broker, broker_user_id: broker_user_id})
  if(getUser) {
    if(broker == "zerodha") {
      var customerAuth = await authenticateZerodha(broker_user_id, enc_token)
      console.log(customerAuth)
      if(customerAuth) {
        getUser.enc_token = enc_token
        getUser.is_authenticated = true
        getUser.save()
        return res.send({"status": true, "message": "Authentication successful."})
      } else {
        return res.send({"status": false, "message": "Authentication failed. Please contact administrator."})
      }
    }
  } else {
    return res.send({"status": false, "message": "Invalid user. Please contact administrator."})
  }

})

app.post("/authenticate_user", async (req, res) => {

  const authBody = await req.body;

  const broker = authBody["broker"]
  const broker_user_id = authBody["broker_user_id"]

  console.log(broker)

  const encToken = authBody["encToken"];

  const getUser = await User.findOne({broker: broker, broker_user_id: broker_user_id})
  if(getUser) {
    if(broker == "zerodha") {
      var customerAuth = authenticateZerodha(broker_user_id, encToken)
      if(customerAuth) {
        return res.send({"status": true, "message": "Authentication successful."})
      } else {
        return res.send({"status": false, "message": "Authentication failed. Please contact administrator."})
      }
    }
  } else {
    return res.send({"status": false, "message": "Invalid user. Please contact administrator."})
  }
});

app.post("/getenctoken", async(req, res) => {
  const userBody = await req.body

  const broker_user_id = userBody["broker_user_id"]
  const broker = userBody["broker"]

  const getUser = await User.findOne({broker: broker, broker_user_id: broker_user_id})

  if(broker == "zerodha") {
    if(getUser) {
      if(getUser.is_authenticated == true) {
        const enc_token = getUser.enc_token
        return res.send({"status": true, "message": enc_token})
      } else {
        return res.send({"status": false, "message": "User not authenticated. Kindly authenticate to begin."})
      }
    } else {
      return res.send({"status": false, "message": "Invalid user. Please contact administrator."})
    }
  }
})

app.get("/getallusers", async (request, response) => {
  const users = await User.find();
  response.json(users);
});

app.get("/deleteallusers", async (request, response) => {
  const users = await User.deleteMany({});
  response.json(users);
});

mongoose
  .connect(mongourl)
  .then(async () => {
    // Start your Express app after ensuring the collection is created
    const server = app.listen(PORT, () => {
      console.log("App is listening on port:", PORT);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
