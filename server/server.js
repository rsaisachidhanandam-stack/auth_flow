const express = require("express");
const cors = require("cors")
const app = express();
app.use(express.json());
const cookieParser = require("cookie-parser")
app.use(cookieParser())


app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

app.use("/user", require("./routes/userRoute"))
app.use("/product", require("./routes/productRoute"))

const PORT = process.env.port || 8080;

const errorHandler = require("./middelware/errorHandler");
app.use(errorHandler);

app.listen(PORT, () => {
    const connectDB = require("./db");
    connectDB();
    console.log(`Server is running on port ${PORT}`);
});
