const { onRequest } = require('firebase-functions/v2/https');
const { defineInt, defineString } = require('firebase-functions/params');

// Define some parameters
const minInstancesConfig = defineInt('HELLO_WORLD_MININSTANCES');
const welcomeMessage = defineString('WELCOME_MESSAGE');

// To use configured parameters inside the config for a function, provide them
// directly. To use them at runtime, call .value() on them.
export const helloWorld = onRequest(
  { minInstances: minInstancesConfig },
(req, res) => {
    res.send(`${welcomeMessage.value()}! I am a function.`);
  }
);