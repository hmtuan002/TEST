// DOM elements
const authSection = document.getElementById('auth-section');
const userSection = document.getElementById('user-section');
const usernameDisplay = document.getElementById('username-display');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const authModal = document.getElementById('auth-modal');
const modalTitle = document.getElementById('modal-title');
const authForm = document.getElementById('auth-form');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authSwitchText = document.getElementById('auth-switch-text');
const authSwitchLink = document.getElementById('auth-switch-link');
const closeBtn = document.querySelector('.close-btn');

// Auth state
let isLoginMode = true;

// Event listeners
if (loginBtn) loginBtn.addEventListener('click', openLoginModal);
if (registerBtn) registerBtn.addEventListener('click', openRegisterModal);
if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (authSwitchLink) authSwitchLink.addEventListener('click', toggleAuthMode);
if (authForm) authForm.addEventListener('submit', handleAuthSubmit);

// Check auth state
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        authSection.classList.add('hidden');
        userSection.classList.remove('hidden');
        usernameDisplay.textContent = user.email;
    } else {
        // User is signed out
        authSection.classList.remove('hidden');
        userSection.classList.add('hidden');
    }
});

// Functions
function openLoginModal() {
    isLoginMode = true;
    modalTitle.textContent = 'Đăng nhập';
    authSubmitBtn.textContent = 'Đăng nhập';
    authSwitchText.innerHTML = 'Chưa có tài khoản? <a href="#" id="auth-switch-link">Đăng ký ngay</a>';
    authModal.classList.remove('hidden');
}

function openRegisterModal() {
    isLoginMode = false;
    modalTitle.textContent = 'Đăng ký';
    authSubmitBtn.textContent = 'Đăng ký';
    authSwitchText.innerHTML = 'Đã có tài khoản? <a href="#" id="auth-switch-link">Đăng nhập</a>';
    authModal.classList.remove('hidden');
}

function closeModal() {
    authModal.classList.add('hidden');
    authForm.reset();
}

function toggleAuthMode(e) {
    e.preventDefault();
    if (isLoginMode) {
        openRegisterModal();
    } else {
        openLoginModal();
    }
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        if (isLoginMode) {
            await auth.signInWithEmailAndPassword(email, password);
        } else {
            await auth.createUserWithEmailAndPassword(email, password);
            // Create user document in Firestore
            await db.collection('users').doc(auth.currentUser.uid).set({
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        closeModal();
    } catch (error) {
        alert(error.message);
    }
}

function handleLogout() {
    auth.signOut();
}