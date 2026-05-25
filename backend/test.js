import mongoose from "mongoose";

const uri =
  "mongodb+srv://project:project123@mrjd-server.hzjb0px.mongodb.net/jwello_jewellery?retryWrites=true&w=majority&appName=MRJD-server";

mongoose
  .connect(uri)
  .then(() => console.log("✅ Connected"))
  .catch(err => console.error(err));