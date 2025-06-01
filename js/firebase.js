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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Kiểm tra trạng thái đăng nhập
auth.onAuthStateChanged((user) => {
    if (user) {
        // Người dùng đã đăng nhập
        console.log("Người dùng đã đăng nhập:", user.email);
        
        // Cập nhật giao diện nếu có phần tử user-info
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.classList.remove('hidden');
            document.getElementById('user-email').textContent = user.email;
        }
        
        // Ẩn nút đăng nhập nếu có
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) loginBtn.classList.add('hidden');
    } else {
        // Người dùng chưa đăng nhập
        console.log("Người dùng chưa đăng nhập");
        
        // Ẩn phần user-info nếu có
        const userInfo = document.getElementById('user-info');
        if (userInfo) userInfo.classList.add('hidden');
        
        // Hiển thị nút đăng nhập nếu có
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) loginBtn.classList.remove('hidden');
    }
});

// Xử lý đăng nhập
function handleLogin(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
}

// Xử lý đăng xuất
function handleLogout() {
    return auth.signOut();
}

// Xử lý đăng ký
function handleSignUp(email, password) {
    return auth.createUserWithEmailAndPassword(email, password);
}