const http = require("http");

async function testEndpoints() {
  console.log("Testing authentication and working days endpoints...");

  // Login first
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

  return new Promise((resolve) => {
    const loginReq = http.request(loginOptions, (loginRes) => {
      let loginBody = "";

      loginRes.on("data", (chunk) => {
        loginBody += chunk;
      });

      loginRes.on("end", () => {
        try {
          const loginResponse = JSON.parse(loginBody);

          if (loginResponse.token) {
            console.log("✅ Login successful");
            console.log("Token:", loginResponse.token.substring(0, 20) + "...");

            // Test working days endpoint
            const workingDaysOptions = {
              hostname: "localhost",
              port: 8000,
              path: "/api/settings/working-days",
              method: "GET",
              headers: {
                Authorization: `Bearer ${loginResponse.token}`,
              },
            };

            const workingDaysReq = http.request(
              workingDaysOptions,
              (workingDaysRes) => {
                let workingDaysBody = "";

                workingDaysRes.on("data", (chunk) => {
                  workingDaysBody += chunk;
                });

                workingDaysRes.on("end", () => {
                  console.log(
                    "Working Days Response Status:",
                    workingDaysRes.statusCode
                  );
                  console.log("Working Days Response Body:", workingDaysBody);

                  if (workingDaysRes.statusCode === 200) {
                    console.log(
                      "✅ Working days endpoint is working correctly!"
                    );
                  } else {
                    console.log("❌ Working days endpoint failed");
                  }
                  resolve(true);
                });
              }
            );

            workingDaysReq.on("error", (err) => {
              console.error("Error calling working days endpoint:", err);
              resolve(false);
            });

            workingDaysReq.end();
          } else {
            console.log("❌ Login failed:", loginBody);
            resolve(false);
          }
        } catch (err) {
          console.error("Error parsing login response:", err);
          console.log("Raw response:", loginBody);
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

testEndpoints().then(() => {
  console.log("Test completed");
  process.exit(0);
});
