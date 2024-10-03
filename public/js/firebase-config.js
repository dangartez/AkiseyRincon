// firebase-config.js

var firebaseConfig = {
    apiKey: "AIzaSyDS5Trwlfi4cCDfOj2G9kAsCPKkyobwdZs",
    authDomain: "akiseyrincon.firebaseapp.com",
    projectId: "akiseyrincon",
    storageBucket: "akiseyrincon.appspot.com",
    messagingSenderId: "798215909577",
    appId: "1:798215909577:web:2fdf0dafd1a6bcc7d79d18"
  };
  
  firebase.initializeApp(firebaseConfig);
  
  const auth = firebase.auth();
  const db = firebase.firestore();
  