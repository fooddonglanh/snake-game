/* =========================================
   HISTORY MODULE — Game play records
   ========================================= */

const History = (() => {
    const STORAGE_KEY = 'snake_history';

    function _getAll() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    function _saveAll(records) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }

    /**
     * Record a game session
     */
    function addRecord(username, score, durationSeconds) {
        const records = _getAll();
        records.push({
            username,
            score,
            duration: durationSeconds,
            loginTime: Auth.getSession()?.loginTime || null,
            playedAt: new Date().toISOString()
        });
        _saveAll(records);
    }

    /**
     * Get records for a specific user, newest first
     */
    function getByUser(username) {
        return _getAll()
            .filter(r => r.username === username)
            .sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt));
    }

    /**
     * Get top scores across all users
     */
    function getTopScores(limit = 10) {
        return _getAll()
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    /**
     * Format seconds as m:ss
     */
    function formatDuration(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    /**
     * Format ISO date to local readable
     */
    function formatDate(iso) {
        if (!iso) return '—';
        const d = new Date(iso);
        return d.toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        }) + ' ' + d.toLocaleTimeString('vi-VN', {
            hour: '2-digit', minute: '2-digit'
        });
    }

    return { addRecord, getByUser, getTopScores, formatDuration, formatDate };
})();
