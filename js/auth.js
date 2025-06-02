// Xử lý đăng nhập/đăng xuất
document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.reload();
            });
        });
    }
    
    // Kiểm tra trạng thái đăng nhập
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Đã đăng nhập
            if (userInfo) userInfo.classList.remove('hidden');
            if (loginBtn) loginBtn.classList.add('hidden');
            if (userName) userName.textContent = user.displayName || user.email;
        } else {
            // Chưa đăng nhập
            if (userInfo) userInfo.classList.add('hidden');
            if (loginBtn) loginBtn.classList.remove('hidden');
        }
    });
});