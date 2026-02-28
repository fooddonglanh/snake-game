/* =========================================
   APP.JS — Main controller, wiring everything
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM refs ---
    const $ = (sel) => document.querySelector(sel);
    const viewAuth = $('#view-auth');
    const viewGame = $('#view-game');
    const userBar = $('#user-bar');
    const displayName = $('#display-username');

    // Auth
    const formLogin = $('#form-login');
    const formRegister = $('#form-register');
    const loginUser = $('#login-username');
    const loginPass = $('#login-password');
    const loginErr = $('#login-error');
    const regUser = $('#reg-username');
    const regPass = $('#reg-password');
    const regPass2 = $('#reg-password2');
    const regErr = $('#reg-error');

    // Game
    const canvas = $('#game-canvas');
    const statScore = $('#stat-score');
    const statHigh = $('#stat-high');
    const statTime = $('#stat-time');
    const btnStart = $('#btn-start');
    const btnPause = $('#btn-pause');
    const btnRestart = $('#btn-restart');
    const overlay = $('#game-over-overlay');
    const overScore = $('#game-over-score');

    // Tabs
    const tabGame = $('#tab-game');
    const tabHistory = $('#tab-history');
    const panelGame = $('#panel-game');
    const panelHistory = $('#panel-history');
    const historyTbody = $('#history-tbody');
    const emptyHistory = $('#empty-history');
    const historyTable = $('#history-table');

    // ===================== VIEW SWITCHING =====================
    function showView(name) {
        viewAuth.classList.remove('active');
        viewGame.classList.remove('active');
        if (name === 'auth') {
            viewAuth.classList.add('active');
            userBar.classList.add('hidden');
        } else {
            viewGame.classList.add('active');
            userBar.classList.remove('hidden');
            const session = Auth.getSession();
            if (session) displayName.textContent = session.username;
        }
    }

    // ===================== AUTH =====================

    // Toggle Login / Register
    $('#switch-to-register').addEventListener('click', () => {
        formLogin.classList.add('hidden');
        formRegister.classList.remove('hidden');
        regErr.textContent = '';
    });

    $('#switch-to-login').addEventListener('click', () => {
        formRegister.classList.add('hidden');
        formLogin.classList.remove('hidden');
        loginErr.textContent = '';
    });

    // Login
    $('#btn-login').addEventListener('click', () => {
        const result = Auth.login(loginUser.value, loginPass.value);
        if (result.success) {
            loginErr.textContent = '';
            loginUser.value = '';
            loginPass.value = '';
            _enterGame();
        } else {
            loginErr.textContent = result.message;
        }
    });

    // Register
    $('#btn-register').addEventListener('click', () => {
        if (regPass.value !== regPass2.value) {
            regErr.textContent = 'Mật khẩu xác nhận không khớp.';
            return;
        }
        const result = Auth.register(regUser.value, regPass.value);
        if (result.success) {
            regErr.textContent = '';
            // Auto login
            Auth.login(regUser.value, regPass.value);
            regUser.value = '';
            regPass.value = '';
            regPass2.value = '';
            _enterGame();
        } else {
            regErr.textContent = result.message;
        }
    });

    // Logout
    $('#btn-logout').addEventListener('click', () => {
        Auth.logout();
        showView('auth');
        formRegister.classList.add('hidden');
        formLogin.classList.remove('hidden');
    });

    // Enter on inputs
    [loginUser, loginPass].forEach(el => {
        el.addEventListener('keydown', e => {
            if (e.key === 'Enter') $('#btn-login').click();
        });
    });
    [regUser, regPass, regPass2].forEach(el => {
        el.addEventListener('keydown', e => {
            if (e.key === 'Enter') $('#btn-register').click();
        });
    });

    function _enterGame() {
        showView('game');
        _initGame();
        _switchTab('game');
    }

    // ===================== TABS =====================
    function _switchTab(tab) {
        tabGame.classList.toggle('active', tab === 'game');
        tabHistory.classList.toggle('active', tab === 'history');
        panelGame.classList.toggle('hidden', tab !== 'game');
        panelHistory.classList.toggle('hidden', tab !== 'history');
        if (tab === 'history') _renderHistory();
    }

    tabGame.addEventListener('click', () => _switchTab('game'));
    tabHistory.addEventListener('click', () => _switchTab('history'));

    // ===================== GAME =====================
    let gameInitialized = false;

    function _initGame() {
        if (gameInitialized) return;
        gameInitialized = true;

        SnakeGame.init(canvas, {
            onScoreUpdate(score, high) {
                statScore.textContent = score;
                statHigh.textContent = high;
            },
            onTimeUpdate(seconds) {
                const m = Math.floor(seconds / 60);
                const s = seconds % 60;
                statTime.textContent = `${m}:${s.toString().padStart(2, '0')}`;
            },
            onGameOver(score, seconds) {
                overScore.textContent = `Điểm: ${score}`;
                overlay.classList.add('visible');
                btnStart.disabled = false;
                btnPause.disabled = true;

                // Save history
                const session = Auth.getSession();
                if (session) {
                    History.addRecord(session.username, score, seconds);
                }
            }
        });

        const state = SnakeGame.getState();
        statHigh.textContent = state.highScore;
    }

    // Start
    btnStart.addEventListener('click', () => {
        overlay.classList.remove('visible');
        SnakeGame.start();
        btnStart.disabled = true;
        btnPause.disabled = false;
        canvas.focus();
    });

    // Pause
    btnPause.addEventListener('click', () => {
        SnakeGame.pause();
        const state = SnakeGame.getState();
        btnPause.textContent = state.isPaused ? '▶ Tiếp tục' : '⏸ Tạm dừng';
    });

    // Restart from overlay
    btnRestart.addEventListener('click', () => {
        overlay.classList.remove('visible');
        SnakeGame.start();
        btnStart.disabled = true;
        btnPause.disabled = false;
        btnPause.textContent = '⏸ Tạm dừng';
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
        const map = {
            ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
            w: 'up', s: 'down', a: 'left', d: 'right',
            W: 'up', S: 'down', A: 'left', D: 'right',
        };
        const dir = map[e.key];
        if (dir) {
            e.preventDefault();
            SnakeGame.setDirection(dir);
        }
        // Space to start / pause
        if (e.key === ' ') {
            e.preventDefault();
            const state = SnakeGame.getState();
            if (!state.isRunning) {
                btnStart.click();
            } else {
                btnPause.click();
            }
        }
    });

    // Mobile D-Pad
    document.querySelectorAll('.dpad-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            SnakeGame.setDirection(btn.dataset.dir);
        });
        // Prevent touch delay
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            SnakeGame.setDirection(btn.dataset.dir);
        });
    });

    // ===================== HISTORY =====================
    function _renderHistory() {
        const session = Auth.getSession();
        if (!session) return;

        const records = History.getByUser(session.username);

        if (records.length === 0) {
            historyTable.classList.add('hidden');
            emptyHistory.classList.remove('hidden');
            return;
        }

        historyTable.classList.remove('hidden');
        emptyHistory.classList.add('hidden');

        historyTbody.innerHTML = records.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="score-cell">${r.score}</td>
        <td>${History.formatDuration(r.duration)}</td>
        <td>${History.formatDate(r.loginTime)}</td>
        <td>${History.formatDate(r.playedAt)}</td>
      </tr>
    `).join('');
    }

    // ===================== INIT =====================
    if (Auth.isLoggedIn()) {
        _enterGame();
    } else {
        showView('auth');
    }

});
