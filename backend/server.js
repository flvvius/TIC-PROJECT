const express = require("express");
const app = express();
const port = 8080;

// const httpLogger = require('morgan');
// const cors = require('cors');
// app.use(httpLogger('dev'));
// app.use(cors())

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});