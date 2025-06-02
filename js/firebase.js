// Khởi tạo Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAu4xlTa51eZrb9b2xhWKkbOv-L8gpPDPg",
    authDomain: "xta-tl.firebaseapp.com",
    projectId: "xta-tl",
    storageBucket: "xta-tl.appspot.com",
    messagingSenderId: "1049275322449",
    appId: "1:1049275322449:web:9ad1ed1986bb1712942870",
    measurementId: "G-MC2V2CK2XF"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);

// Khởi tạo các dịch vụ Firebase
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable offline persistence
db.enablePersistence()
  .catch((err) => {
      console.log('Firebase persistence error', err);
  });

// Xuất các dịch vụ để sử dụng trong các file khác
export { auth, db, storage };