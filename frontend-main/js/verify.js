document.getElementById("verifyForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const userCode = document.getElementById("verificationCode").value.trim();
  const storedCode = localStorage.getItem("verificationCode");

  if (!email || !userCode) {
    document.getElementById(
      "message"
    ).innerHTML = `<p style="color: red;">Please enter both email and verification code.</p>`;
    return;
  }

  try {
    const res = await fetch("http://localhost:80/api/auth/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, code: userCode }),
    });

    const data = await res.json();

    if (res.ok) {
      document.getElementById(
        "message"
      ).innerHTML = `<p style="color: green;">${data.message}</p>`;
      localStorage.setItem("Token", data.token);

      setTimeout(() => {
        window.location.href = "/welcome.html";
      }, 1500);
    } else {
      document.getElementById(
        "message"
      ).innerHTML = `<p style="color: red;">${data.message}</p>`;
    }
  } catch (err) {
    console.error("Verification Error:", err);
    document.getElementById(
      "message"
    ).innerHTML = `<p style="color: red;">Something went wrong during verification.</p>`;
  }
});


