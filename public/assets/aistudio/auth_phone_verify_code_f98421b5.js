const phoneNumber = "+919876543210"; 

signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
  .then((confirmationResult) => {
    // SMS sent! Prompt the user to enter the 6-digit code they received.
    const code = window.prompt("Enter the 6-digit SMS verification code:");
    
    if (code) {
      return confirmationResult.confirm(code);
    }
    throw new Error("No code entered");
  })
  .then((result) => {
    // User signed in successfully!
    const user = result.user;
    console.log("Welcome!", user);
  })
  .catch((error) => {
    console.error("Authentication failed:", error);
  });
