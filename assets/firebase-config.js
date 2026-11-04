/* הגדרות Firebase — מלא את הערכים שתקבל מ-Firebase Console */
window.FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDYtV8ZbOXkdqdB9RQwD0GH7fuK_Mtk0LY",
  authDomain:        "yosef-conf-2026.firebaseapp.com",
  projectId:         "yosef-conf-2026",
  storageBucket:     "yosef-conf-2026.firebasestorage.app",
  messagingSenderId: "987698263399",
  appId:             "1:987698263399:web:26732d5a0cae062826ebc2"
};

/* אתחול Firebase — פועל רק אחרי שמולאו ערכים אמיתיים */
if (window.firebase && window.FIREBASE_CONFIG.apiKey !== 'REPLACE') {
  try {
    if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
    window.db = firebase.firestore();
  } catch (e) {
    console.warn('Firebase init failed:', e);
  }
}
