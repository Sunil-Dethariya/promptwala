let isVerified = false;

const sendBtn = document.querySelector('.send-otp');

// SEND OTP
sendBtn.addEventListener('click', async () => {
  const email = document.querySelector('input[name="email"]').value;

  if (!email) {
    alert("Enter email first");
    return;
  }

  // 🔥 LOADER START (NEW)
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<span class="loader"></span> Sending...';

  try {
    const res = await fetch('/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    alert(data.message);

    // ✅ SUCCESS UI (NEW)
    sendBtn.innerHTML = "✔ Sent";
    sendBtn.classList.add("btn-success");

    // 🔒 LOCK BUTTON
    sendBtn.disabled = true;
    sendBtn.style.pointerEvents = "none";
    sendBtn.style.cursor = "not-allowed";

  } catch (err) {
    alert("Error sending OTP");

    // ❌ ERROR UI (NEW)
    sendBtn.innerHTML = "Try Again";
    sendBtn.classList.add("btn-error");
  }

// 🔄 KEEP SUCCESS STATE (no reset)
sendBtn.disabled = false;

// ❗ अगर error हुआ हो तो ही reset करो
if (sendBtn.classList.contains("btn-error")) {
  setTimeout(() => {
    sendBtn.innerHTML = "Send OTP";
    sendBtn.classList.remove("btn-error");
  }, 2000);
}
});


// VERIFY OTP
document.querySelector('.verify-otp').addEventListener('click', async () => {
  const email = document.querySelector('input[name="email"]').value;
  const otp = document.querySelector('input[name="otp"]').value;

  const res = await fetch('/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });

  const data = await res.json();
  alert(data.message);

  const verifyBtn = document.querySelector('.verify-otp');

  if (data.message === "OTP verified") {
    isVerified = true;

    // ✅ UI update
    verifyBtn.innerHTML = "✔ Verified";
    verifyBtn.classList.add("btn-success");

    // 🔒 LOCK BUTTON
    verifyBtn.disabled = true;
    verifyBtn.style.pointerEvents = "none";
    verifyBtn.style.cursor = "not-allowed";
  }
});