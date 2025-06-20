import app from "./app.js";
import dotenv from "dotenv";

const PORT = process.env.PORT || "5000";
const ENV = process.env.NODE_ENV || "development";
dotenv.config();

app.listen(PORT, ()=>{
    console.log(`Server is Running ${ENV} on port ${PORT}`)
})