const app = require("./app");

// url - http://localhost:3000
app.listen(process.env.PORT, () => {
  console.log(`Server has been started on Port ${process.env.PORT}`);
});
