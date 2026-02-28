/* =========================================
   AUTH MODULE — Login / Register (localStorage)
   ========================================= */

const Auth = (() => {
  const STORAGE_KEY = 'snake_users';
  const SESSION_KEY = 'snake_session';

  function _getUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function _saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  /**
   * Register a new user
   * @returns {{ success: boolean, message: string }}
   */
  function register(username, password) {
    username = (username || '').trim();
    if (!username) return { success: false, message: 'Vui lòng nhập tên đăng nhập.' };
    if (username.length < 3) return { success: false, message: 'Tên đăng nhập phải có ít nhất 3 ký tự.' };
    if (!password || password.length < 4) return { success: false, message: 'Mật khẩu phải có ít nhất 4 ký tự.' };

    const users = _getUsers();
    if (users[username.toLowerCase()]) {
      return { success: false, message: 'Tên đăng nhập đã tồn tại.' };
    }

    users[username.toLowerCase()] = {
      username,
      password, // In a real app, hash this!
      createdAt: new Date().toISOString()
    };
    _saveUsers(users);
    return { success: true, message: 'Đăng ký thành công!' };
  }

  /**
   * Login
   * @returns {{ success: boolean, message: string }}
   */
  function login(username, password) {
    username = (username || '').trim();
    if (!username || !password) return { success: false, message: 'Vui lòng nhập đầy đủ thông tin.' };

    const users = _getUsers();
    const user = users[username.toLowerCase()];

    if (!user || user.password !== password) {
      return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng.' };
    }

    const session = {
      username: user.username,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true, message: 'Đăng nhập thành công!' };
  }

  /**
   * Logout
   */
  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  /**
   * Get current session (or null)
   */
  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  }

  /**
   * Check if logged in
   */
  function isLoggedIn() {
    return getSession() !== null;
  }

  return { register, login, logout, getSession, isLoggedIn };
})();
