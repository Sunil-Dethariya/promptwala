const inquiryForms = document.querySelectorAll(".inquiry-form");

inquiryForms.forEach((form) => {
  const emailInput = form.querySelector('input[name="email"]');
  const otpInput = form.querySelector('input[name="otp"]');
  const sendOtpButton = form.querySelector(".send-otp");
  const verifyOtpButton = form.querySelector(".verify-otp");
  const statusMessage = form.querySelector(".form-status");
  let generatedOtp = "";
  let isOtpVerified = false;

  function setStatus(message, type = "") {
    statusMessage.textContent = message;
    statusMessage.classList.remove("is-success", "is-error");

    if (type) {
      statusMessage.classList.add(type);
    }
  }

  function createOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  sendOtpButton.addEventListener("click", () => {
    if (!emailInput.checkValidity()) {
      emailInput.reportValidity();
      return;
    }

    generatedOtp = createOtp();
    isOtpVerified = false;
    otpInput.value = "";

    // Prototype-only: replace this with a real email/SMS OTP API in the backend phase.
    setStatus(`OTP sent successfully. Demo OTP: ${generatedOtp}`, "is-success");
  });

  verifyOtpButton.addEventListener("click", () => {
    if (!generatedOtp) {
      setStatus("Please send OTP first.", "is-error");
      return;
    }

    if (otpInput.value.trim() === generatedOtp) {
      isOtpVerified = true;
      setStatus("OTP verified successfully.", "is-success");
      return;
    }

    isOtpVerified = false;
    setStatus("Invalid OTP. Please check and try again.", "is-error");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!isOtpVerified) {
      setStatus("Please verify OTP before submitting your inquiry.", "is-error");
      return;
    }

    setStatus(
      "Your inquiry has been submitted successfully. The Promptwala team will respond to you shortly.",
      "is-success"
    );

    form.reset();
    isOtpVerified = false;
    generatedOtp = "";

    setTimeout(() => {
      window.location.href = "/projects/";
    }, 2500);
  });
});
