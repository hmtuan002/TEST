import { auth } from './firebase.js';

// DOM Elements
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const userName = document.getElementById('user-name');

// Xử lý đăng nhập
loginBtn.addEventListener('click', () => {
    // Sử dụng Firebase UI để đăng nhập
    const ui = new firebaseui.auth.AuthUI(auth);
    
    ui.start('#auth-section', {
        signInOptions: [
            firebase.auth.EmailAuthProvider.PROVIDER_ID,
            firebase.auth.GoogleAuthProvider.PROVIDER_ID
        ],
        signInSuccessUrl: window.location.href,
        callbacks: {
            signInSuccessWithAuthResult: function(authResult, redirectUrl) {
                // Xử lý sau khi đăng nhập thành công
                return true;
            }
        }
    });
});

// Xử lý đăng xuất
logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
        window.location.reload();
    }).catch((error) => {
        console.error('Đăng xuất thất bại:', error);
    });
});

// Kiểm tra trạng thái đăng nhập
auth.onAuthStateChanged((user) => {
    if (user) {
        // Đã đăng nhập
        userInfo.classList.remove('hidden');
        loginBtn.classList.add('hidden');
        userName.textContent = user.displayName || user.email;
        
        // Lưu thông tin người dùng vào localStorage
        localStorage.setItem('user', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
        }));
    } else {
        // Chưa đăng nhập
        userInfo.classList.add('hidden');
        loginBtn.classList.remove('hidden');
        localStorage.removeItem('user');
    }
});

// Kiểm tra nếu có thông tin người dùng trong localStorage
const savedUser = localStorage.getItem('user');
if (savedUser) {
    const user = JSON.parse(savedUser);
    userInfo.classList.remove('hidden');
    loginBtn.classList.add('hidden');
    userName.textContent = user.displayName || user.email;
}