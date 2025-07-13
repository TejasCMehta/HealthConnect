const https = require("http");
const querystring = require("querystring");

// Test script to verify the working hours endpoint
async function testWorkingHoursEndpoint() {
  console.log("Testing working hours endpoint...");

  // First, login to get a token
  const loginData = JSON.stringify({
    username: "admin",
    password: "password123",
  });

  const loginOptions = {
    hostname: "localhost",
    port: 8000,
    path: "/auth/login",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(loginData),
    },
  };

  return new Promise((resolve, reject) => {
    const loginReq = https.request(loginOptions, (loginRes) => {
      let loginBody = "";

      loginRes.on("data", (chunk) => {
        loginBody += chunk;
      });

      loginRes.on("end", () => {
        try {
          const loginResponse = JSON.parse(loginBody);

          if (loginResponse.token) {
            console.log("✅ Login successful");

            // Now test the working hours endpoint
            const workingHoursOptions = {
              hostname: "localhost",
              port: 8000,
              path: "/api/settings/working-hours",
              method: "GET",
              headers: {
                Authorization: `Bearer ${loginResponse.token}`,
              },
            };

            const workingHoursReq = https.request(
              workingHoursOptions,
              (workingHoursRes) => {
                let workingHoursBody = "";

                workingHoursRes.on("data", (chunk) => {
                  workingHoursBody += chunk;
                });

                workingHoursRes.on("end", () => {
                  console.log(
                    "Working Hours Response Status:",
                    workingHoursRes.statusCode
                  );
                  console.log("Working Hours Response Body:", workingHoursBody);

                  if (workingHoursRes.statusCode === 200) {
                    console.log(
                      "✅ Working hours endpoint is working correctly!"
                    );
                    resolve(true);
                  } else {
                    console.log("❌ Working hours endpoint failed");
                    resolve(false);
                  }
                });
              }
            );

            workingHoursReq.on("error", (err) => {
              console.error("Error calling working hours endpoint:", err);
              resolve(false);
            });

            workingHoursReq.end();
          } else {
            console.log("❌ Login failed:", loginBody);
            resolve(false);
          }
        } catch (err) {
          console.error("Error parsing login response:", err);
          resolve(false);
        }
      });
    });

    loginReq.on("error", (err) => {
      console.error("Error during login:", err);
      resolve(false);
    });

    loginReq.write(loginData);
    loginReq.end();
  });
}

// Run the test
testWorkingHoursEndpoint().then((success) => {
  console.log(success ? "Test completed successfully" : "Test failed");
  process.exit(success ? 0 : 1);
});
