require("dotenv").config();

const app = require("./app");

const {
  testConnection
} = require("./config/db");

const PORT =
  process.env.PORT || 3000;


async function startServer() {

  try {

    await testConnection();

    console.log(
      "PostgreSQL database connected successfully"
    );

    app.listen(
      PORT,
      () => {

        console.log(
          `House Expense API running on port ${PORT}`
        );

        console.log(
          `http://localhost:${PORT}/api/health`
        );

      }
    );

  } catch (error) {

    console.error(
      "Failed to start server:"
    );

    console.error(
      error
    );

    process.exit(1);

  }

}


startServer();