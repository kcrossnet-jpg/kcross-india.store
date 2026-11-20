import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const auth = getAuth();

// Initialize the reCAPTCHA verifier (ensure an element with id 'recaptcha-container' exists in your HTML)
const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
  'size': 'normal', // or 'invisible'
  'callback': (response: any) => {
    // reCAPTCHA solved, proceed with phone sign-in
  }
});
