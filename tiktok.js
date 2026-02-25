// ============================================================
// TIKTOK CLIENT – communicates with the TikTok worker
// ============================================================
class TikTokEngine {
    static ALL_KEYS = [
        'profile', 'comments', 'blocked', 'following', 'friends', 'posts', 'deletedPosts',
        'messages', 'favoriteCollections', 'favoriteComments', 'favoriteEffects', 'favoriteHashtags',
        'favoriteSounds', 'favoriteVideos', 'favoriteLikes', 'reposts', 'searches', 'liveHistory',
        'liveModerator', 'liveWatchHistory', 'loginHistory', 'incomeWallet', 'incomeTransaction'
    ];

    constructor() {
        this.worker = new Worker('tiktok.worker.js');
        this.setupListeners();
        // Render the path table early (but wait for DOM to be ready)

if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', () => {
this.renderPathTable();
this.updateButtonStates();
document.getElementById('sectionSelect')?.addEventListener('change', () => this.onSectionChange());
});
}

else {
this.renderPathTable();
this.updateButtonStates();
document.getElementById('sectionSelect')?.addEventListener('change', () => this.onSectionChange());
}
        this._waitingForFullCopy = false;
        this._waitingForFullDownload = false;
        this.existingPaths = []; // will be populated after file load
        this.lastSqlData = null;
        this.videoHash = null;
        
        this.fileLoaded = false;
        this.sqlDataLoaded = false;
        this.schemaGenerated = false;
        this.insertsGenerated = false;
    }
    
    updateButtonStates() {
    // Buttons that require a loaded file
    const fileRequiredButtons = ['btn-tiktok-sqlData']; // Add any other buttons that need file loaded
    fileRequiredButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = !this.fileLoaded;
    });
    
    // Buttons that require sqlData
    const sqlDataRequiredButtons = ['btn-generate-schema', 'btn-generate-inserts', 'btn-analyze-messages'];
    sqlDataRequiredButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = !this.sqlDataLoaded;
    });
    
    // Buttons that require schema generation
    const schemaRequiredButtons = ['btn-download-schema'];
    schemaRequiredButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = !this.schemaGenerated;
    });
    
    // Buttons that require inserts generation
    const insertsRequiredButtons = ['btn-download-inserts'];
    insertsRequiredButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = !this.insertsGenerated;
    });
}

    setupListeners() {
        this.worker.onmessage = (e) => {
            const data = e.data;
if (data.error) return this.showToast(data.error, 'error');
if (data.loaded) {
this.fileLoaded = true;
this.updateButtonStates();

this.updateBadge(data.fileInfo);
this.requestStats();
this.requestExistingPaths();

// <-- new: check which paths exist
this.showToast('TikTok data loaded', 'success');
}
if (data.type === 'stats') this.updateUI(data.stats);
if (data.type === 'pathResult') this.displayResult(data.result);
if (data.type === 'existingPaths') {
this.existingPaths = data.paths;
// Always update Required column (table cells already exist)
TikTokEngine.ALL_KEYS.forEach(key => {
this.markRequired(key, data.paths.includes(key));
});
}

if (data.type === 'sqlData') {
this.lastSqlData = data.data; // { userName, data: { ... } }
this.sqlDataLoaded = true;
if (data.isFull){
this.schemaGenerated = false;
this.insertsGenerated = false;
}
this.updateButtonStates();
this.refreshFieldDropdowns();

this.videoHash = data.videoHash;
// Update extracted column in table
if (document.getElementById('output-tab').classList.contains('active')) {
this.updateTableColors();
this.renderDataTypeTable();
}
if (this._waitingForFullCopy) {
this._copyToClipboard(JSON.stringify(data.data, null, 2));
this._waitingForFullCopy = false;
this.showToast('Full SQL data copied', 'success');
}
else if (this._waitingForFullDownload) {
this._downloadData(data.data, `tiktok_${data.data.userName || 'data'}_full.json`);
this._waitingForFullDownload = false;
this.showToast('Full SQL data downloaded', 'success');
} else {
this.displayResult(data.data);
}
this.showToast('SQL data retrieved', 'success');
//this.refreshFieldDropdowns();

}
};
this.worker.onerror = (err) => {
console.error('Worker failed to load:', err);
this.showToast('Worker failed to load – check console', 'error');
};
}

    // ========== File loading ==========
    loadFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => this.worker.postMessage({
            type: 'load',
            payload: { name: file.name, size: file.size, data: e.target.result }
        });
        reader.readAsText(file);
    }

    loadSample() {
        // Full sample with all fields (as provided earlier)
        const sample = `{
      "Profile And Settings": {
        "Profile Info": {
          "ProfileMap": {
            "displayName": "Jane Doe",
            "userName": "@janedoe",
            "likesReceived": 15234,
            "followingCount": 892,
            "followerCount": 1234,
            "emailAddress": "jane@example.com",
            "birthDate": "1990-01-15",
            "bio": "Travel enthusiast",
            "avatar": "avatar.jpg",
            "age": 33
          }
        },
        "Following": { "Following": [{"UserName":"user1","Date":"2023-01-01"},{"UserName":"user2","Date":"2023-01-02"}] },
        "Follower": { "FansList": [{"UserName":"user3","Date":"2023-01-01"},{"UserName":"user1","Date":"2023-01-03"}] },
        "Block List": { "BlockList": [] }
      },
      "Comment": { "Comments": { "CommentsList": [] } },
      "Post": { "Posts": { "VideoList": [] } },
      "Post.Recently Deleted Posts": { "PostList": [] },
      "Likes and Favorites": {
        "Favorite Collection": { "FavoriteCollectionList": [] },
        "Favorite Comment": { "FavoriteCommentList": [] },
        "Favorite Effects": { "FavoriteEffectsList": [] },
        "Favorite Hashtags": { "FavoriteHashtagList": [] },
        "Favorite Sounds": { "FavoriteSoundList": [] },
        "Favorite Videos": { "FavoriteVideoList": [] },
        "Like List": { "ItemFavoriteList": [] }
      },
      "Direct Message": {
        "Direct Messages": { "ChatHistory": {} },
        "Group Chat": { "GroupChat": {} }
      },
      "Your Activity": {
        "Hashtag": { "HashtagList": [] },
        "Login History": { "LoginHistoryList": [] },
        "Searches": { "SearchList": [] },
        "Reposts": { "RepostList": [] },
        "Share History": { "ShareHistoryList": [] },
        "Status": { "Status List": [] },
        "Stickers": { "StickerList": [] }
      },
      "TikTok Live": {
        "Go Live History": { "GoLiveList": [] },
        "Go Live Settings": { "SettingsMap": { "People you assigned to moderate your LIVE": [] } },
        "Watch Live History": { "WatchLiveMap": {} }
      },
      "Income+ Wallet": {
        "Coin Purchase History": { "CoinPurchaseHistoryList": [] },
        "Transaction History": { "TransactionsHistoryList": [] }
      }
    }`;
        this.worker.postMessage({
            type: 'load',
            payload: { name: 'sample-tiktok.json', size: sample.length, data: sample }
        });
    }

    requestStats() { this.worker.postMessage({ type: 'getStats' }); }
    requestExistingPaths() { this.worker.postMessage({ type: 'getExistingPaths' }); }

    getPath(pathKey) {
        let path = JSONPathsConfig.myApp[pathKey] || JSONPathsConfig.myApp.user[pathKey];
        if (path) {
            this.worker.postMessage({ type: 'getPath', payload: path });
            this.showButtonLoading(pathKey);
        }
    }

    getSqlData() {
        this.worker.postMessage({ type: 'getSqlData', payload: { full: false } });
        this.showButtonLoading('sqlData');
    }

    // ========== Copy / Download ==========
    copyTruncated() {
        const outputEl = document.getElementById('resultOutput');
        if (!outputEl || !outputEl.textContent || outputEl.textContent === 'Ready. Load TikTok JSON.') {
            this.showToast('No data to copy', 'warning');
            return;
        }
        this._copyToClipboard(outputEl.textContent);
    }

    copyFull() {
        if (!this.lastSqlData) {
            this.showToast('Load SQL data first (click Get SQL Data)', 'warning');
            return;
        }
        this._waitingForFullCopy = true;
        this.worker.postMessage({ type: 'getSqlData', payload: { full: true } });
        this.showToast('Fetching full data...', 'info');
    }

    downloadTruncated() {
        const outputEl = document.getElementById('resultOutput');
        if (!outputEl || !outputEl.textContent || outputEl.textContent === 'Ready. Load TikTok JSON.') {
            this.showToast('No data to download', 'warning');
            return;
        }
        let data;
        try {
            data = JSON.parse(outputEl.textContent);
        } catch (e) {
            this.showToast('Invalid JSON in output', 'error');
            return;
        }
        const userName = data.userName || 'data';
        this._downloadData(data, `tiktok_${userName}_truncated.json`);
    }

    downloadFull() {
        if (!this.lastSqlData) {
            this.showToast('Load SQL data first (click Get SQL Data)', 'warning');
            return;
        }
        this._waitingForFullDownload = true;
        this.worker.postMessage({ type: 'getSqlData', payload: { full: true } });
        this.showToast('Fetching full data...', 'info');
    }

    copySchema() {
        const schemaEl = document.getElementById('schemaOutput');
        if (!schemaEl) {
            this.showToast('Schema element not found', 'error');
            return;
        }
        const text = schemaEl.value;
        if (!text || text.trim() === '' || text === 'Click "Generate Schema" after loading data.') {
            this.showToast('No schema to copy', 'warning');
            return;
        }
        this._copyToClipboard(text);
    }

    downloadSchema() {
        const schemaEl = document.getElementById('schemaOutput');
        if (!schemaEl) {
            this.showToast('Schema element not found', 'error');
            return;
        }
        const text = schemaEl.value;
        if (!text || text.trim() === '' || text === 'Click "Generate Schema" after loading data.') {
            this.showToast('No schema to download', 'warning');
            return;
        }
        const username = (this.lastSqlData && this.lastSqlData.userName) ? this.lastSqlData.userName.replace('@', '') : 'tiktok';
        this._downloadData(text, `${username}_schema.sql`);
    }

// ========== INSERT generation and download ==========
generateInserts() {
    if (!this.lastSqlData) {
        this.showToast('Load SQL data first (click Get SQL Data)', 'warning');
        return;
    }
    try {
        //const insertScript = generateInsertSQL(this.lastSqlData);
        const insertScript = generateInsertSQL(this.lastSqlData, false);
        this.lastInsertScript = insertScript;
        
        // Count tables and rows
        const data = this.lastSqlData.data;
        let tableCount = 0;
        let rowCount = 0;
        for (const [name, rows] of Object.entries(data)) {
            if (Array.isArray(rows)) {
                tableCount++;
                rowCount += rows.length;
            }
        }
        
        this.insertsGenerated = true;
        this.updateButtonStates();
        
        // Show persistent toast
        this.showPersistentToast(
            `✅ INSERT statements generated\nTables: ${tableCount}, Rows: ${rowCount}`,
            'success'
        );
        
   
        
    } catch (err) {
        console.error('Insert generation error:', err);
        this.showToast('Insert generation failed', 'error');
    }
}

downloadInserts() {
    if (!this.lastInsertScript) {
        this.showToast('Generate inserts first', 'warning');
        return;
    }
    const username = (this.lastSqlData && this.lastSqlData.userName) ? this.lastSqlData.userName.replace('@', '') : 'tiktok';
    this._downloadData(this.lastInsertScript, `tiktok_insert_${username}.sql`);
}

// ========== Persistent toast (with close button) ==========
showPersistentToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    if (!toast || !toastMsg || !toastIcon) return;
    
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    toastIcon.textContent = icons[type] || 'ℹ️';
    toastMsg.textContent = message;
    
    // Add a close button if not present
    let closeBtn = toast.querySelector('.toast-close');
    if (!closeBtn) {
        closeBtn = document.createElement('span');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.style.marginLeft = '12px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontWeight = 'bold';
        closeBtn.onclick = () => toast.classList.remove('show');
        toast.appendChild(closeBtn);
    }
    
    toast.className = `toast show ${type}`;
    // Do not auto-hide
}

// ========== Data type summary table ==========
renderDataTypeTable() {
    const container = document.getElementById('dataTypeTableContainer');
    if (!container) return;
    
    if (!this.lastSqlData || !this.lastSqlData.data || !this.lastSqlData.data.messages) {
        container.innerHTML = '<p class="stat-badge">No message data available</p>';
        return;
    }
    
    const counts = analyzeMessageContent(this.lastSqlData.data.messages);
    if (Object.keys(counts).length === 0) {
        container.innerHTML = '<p class="stat-badge">No messages to analyze</p>';
        return;
    }
    
    let html = `
        <table style="width:100%; border-collapse: collapse; font-size:0.6rem; background:#e0e5ec; border-radius:12px; overflow:hidden; box-shadow: inset 2px 2px 5px #babecc, inset -2px -2px 5px #ffffff;">
            <thead>
                <tr>
                    <th style="padding:6px; border-bottom:1px solid #babecc;">Type</th>
                    <th style="padding:6px; border-bottom:1px solid #babecc;">Count</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    for (const [type, count] of Object.entries(counts)) {
        html += `
            <tr>
                <td style="padding:4px 6px; border-top:1px solid #babecc;">${type}</td>
                <td style="padding:4px 6px; border-top:1px solid #babecc;">${count}</td>
            </tr>
        `;
    }
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}
    
    
    // ========== Table rendering and coloring ==========
    renderPathTable() {
    const container = document.getElementById('pathTableContainer');
    if (!container) return;
    
    const pathInfo = [
        { required: 'Profile', extracted: 'profile', schema: 'users', note: '✓' },
        { required: 'Comments', extracted: 'comments', schema: 'comments', note: '✓' },
        { required: 'Blocked', extracted: 'blocked', schema: 'blocked', note: '✓' },
        { required: 'Following', extracted: 'following', schema: 'following', note: '✓' },
        { required: 'Friends', extracted: 'friends', schema: 'friends', note: '✓' },
        { required: 'Posts', extracted: 'posts', schema: 'posts', note: '✓' },
        { required: 'Deleted Posts', extracted: 'deletedPosts', schema: 'deletedPosts', note: '✓' },
        { required: 'Messages', extracted: 'messages', schema: 'messages', note: '✓' },
        { required: 'Favorite Collections', extracted: 'favoriteCollections', schema: 'favoriteCollections', note: '✓' },
        { required: 'Favorite Comments', extracted: 'favoriteComments', schema: 'favoriteComments', note: '✓' },
        { required: 'Favorite Effects', extracted: 'favoriteEffects', schema: 'favoriteEffects', note: '✓' },
        { required: 'Favorite Hashtags', extracted: 'favoriteHashtags', schema: 'favoriteHashtags', note: '✓' },
        { required: 'Favorite Sounds', extracted: 'favoriteSounds', schema: 'favoriteSounds', note: '✓' },
        { required: 'Favorite Videos', extracted: 'favoriteVideos', schema: 'favoriteVideos', note: '✓' },
        { required: 'Favorite Likes', extracted: 'favoriteLikes', schema: 'favoriteLikes', note: '✓' },
        { required: 'Reposts', extracted: 'reposts', schema: 'reposts', note: '✓' },
        { required: 'Searches', extracted: 'searches', schema: 'searches', note: '✓' },
        { required: 'Live History', extracted: 'liveHistory', schema: 'liveHistory', note: '✓' },
        { required: 'Live Moderator', extracted: 'liveModerator', schema: 'liveModerator', note: '✓' },
        { required: 'Live Watch History', extracted: 'liveWatchHistory', schema: 'liveWatchHistory', note: '✓' },
        { required: 'Login History', extracted: 'loginHistory', schema: 'loginHistory', note: '✓' },
        { required: 'Income Wallet', extracted: 'incomeWallet', schema: 'incomeWallet', note: '✓' },
        { required: 'Income Transaction', extracted: 'incomeTransaction', schema: 'incomeTransaction', note: '✓' }
    ];
    
    let html = `
        <table class="path-table">
            <thead>
                <tr>
                    <th rowspan="2">No</th>
                    <th colspan="3">Paths</th>
                    <th rowspan="2">Note</th>
                </tr>
                <tr>
                    <th>Required</th>
                    <th>Extracted</th>
                    <th>Schema</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    pathInfo.forEach((item, index) => {
        const key = item.extracted;
        html += `
            <tr>
                <td>${index + 1}</td>
                <td id="required-${key}">${item.required}</td>
                <td id="extracted-${key}">${item.extracted}</td>
                <td id="schema-${key}">${item.schema}</td>
                <td id="note-${key}">${item.note}</td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}

    markRequired(key, found) {
        const cell = document.getElementById(`required-${key}`);
        if (cell) {
            cell.classList.remove('status-found', 'status-missing');
cell.classList.add(found ? 'status-found' : 'status-missing');
        }
    }

    markExtracted(key, done) {
        const cell = document.getElementById(`extracted-${key}`);
        if (cell) {
            //cell.style.color = done ? '#2e7d32' : '#9e9e9e';
            //cell.style.fontWeight = done ? '600' : '400';
            cell.classList.remove('status-found', 'status-missing');
cell.classList.add(done ? 'status-found' : 'status-missing');
        }
    }

    markSchema(key, done) {
        const cell = document.getElementById(`schema-${key}`);
        if (cell) {
            cell.classList.remove('status-found', 'status-missing');
cell.classList.add(done ? 'status-found' : 'status-missing');
        }
    }

    updateTableColors() {
        // Required column
        TikTokEngine.ALL_KEYS.forEach(key => {
            this.markRequired(key, this.existingPaths && this.existingPaths.includes(key));
        });
        // Extracted column
        if (this.lastSqlData) {
            const dataObj = this.lastSqlData.data || {};
            TikTokEngine.ALL_KEYS.forEach(key => {
                this.markExtracted(key, dataObj.hasOwnProperty(key));
            });
        }
        // Schema column is handled separately after generation; we leave as is for now.
    }

    // ========== UI update methods ==========
    updateBadge(info) {
        const badge = document.getElementById('dataBadge');
        if (badge) badge.innerHTML = `📊 ${info.name} <span>${info.size} | ${info.items} items</span>`;
    }

    updateUI(stats) {
        this.lastStats = stats;
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = (value !== undefined && value !== null) ? value : '-';
        };
        const setHTML = (id, html) => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = html;
        };

        setText('tiktokDisplayName', stats.profile.displayName);
        setText('tiktokUserName', stats.profile.userName);
        setText('tiktokLikes', this.formatNumber(stats.profile.likesReceived));
        setText('tiktokFollowing', this.formatNumber(stats.following));
        setText('tiktokFollowers', this.formatNumber(stats.followers));

        setHTML('commentsCount', `💬 Comments: ${stats.comments}`);
        setHTML('blockedCount', `🚫 Blocked: ${stats.blocked}`);
        setHTML('videosCount', `🎥 Videos: ${stats.videos}`);

        setHTML('favoritesStats', `
            <div class="stat-badge">📁 Collections: ${stats.favorites.collections}</div>
            <div class="stat-badge">💬 Fav Comments: ${stats.favorites.comments}</div>
            <div class="stat-badge">✨ Effects: ${stats.favorites.effects}</div>
            <div class="stat-badge">#️⃣ Hashtags: ${stats.favorites.hashtags}</div>
            <div class="stat-badge">🔊 Sounds: ${stats.favorites.sounds}</div>
            <div class="stat-badge">🎬 Fav Videos: ${stats.favorites.videos}</div>
            <div class="stat-badge">❤️ Liked Items: ${stats.favorites.likedItems}</div>
        `);
        setHTML('messagesStats', `
            <div class="stat-badge">💬 DMs: ${stats.messages.direct}</div>
            <div class="stat-badge">👥 Groups: ${stats.messages.group}</div>
        `);
        setHTML('activityStats', `
            <div class="stat-badge">#️⃣ Hashtags: ${stats.activity.hashtags}</div>
            <div class="stat-badge">🔐 Logins: ${stats.activity.logins}</div>
            <div class="stat-badge">🔍 Searches: ${stats.activity.searches}</div>
            <div class="stat-badge">🔄 Reposts: ${stats.activity.reposts}</div>
            <div class="stat-badge">📤 Shares: ${stats.activity.shares}</div>
            <div class="stat-badge">📌 Status: ${stats.activity.statuses}</div>
            <div class="stat-badge">🎨 Stickers: ${stats.activity.stickers}</div>
        `);

        this.updateFullProfile(stats.profile);
    }

    updateFullProfile(profile) {
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = (value !== undefined && value !== null) ? value : '-';
        };
        setText('profileDisplayName', profile.displayName);
        setText('profileUserName', profile.userName);
        setText('profileEmail', profile.emailAddress);
        setText('profileBirth', profile.birthDate);
        setText('profileFollowingCount', this.formatNumber(profile.followingCount));
        setText('profileFollowerCount', this.formatNumber(profile.followerCount));
        setText('profileLikesReceived', this.formatNumber(profile.likesReceived));
        setText('profileFriendsCount', this.formatNumber(profile.friendsCount));
    }

    displayResult(result) {
        const out = document.getElementById('resultOutput');
        if (out) out.textContent = JSON.stringify(result, null, 2);
        const stats = document.getElementById('resultStats');
        if (stats) {
            const totalArrays = Object.keys(result.data || {}).length;
            stats.textContent = `Data sections: ${totalArrays}`;
        }
    }

    generateSchema() {
        if (!this.lastSqlData) {
            this.showToast('Load SQL data first (click Get SQL Data)', 'warning');
            return;
        }
        try {
            const schema = generateTikTokSchema(this.lastSqlData);
            const schemaEl = document.getElementById('schemaOutput');
            if (schemaEl) schemaEl.value = schema;
            this.showToast('Schema generated', 'success');

            // Mark schema column for sections that exist in lastSqlData
            const dataObj = this.lastSqlData.data || {};
            TikTokEngine.ALL_KEYS.forEach(key => {
                this.markSchema(key, dataObj.hasOwnProperty(key));
            });
            this.schemaGenerated = true;
            this.updateButtonStates();
            
        } catch (err) {
    console.error('Schema generation error details:', {
        message: err.message,
        stack: err.stack,
        error: err,
        lastSqlData: this.lastSqlData // careful, this could be huge
    });
    this.showToast('Schema generation failed: ' + (err.message || 'unknown error'), 'error');
}
    }
    
    

    formatNumber(num) {
        if (num === null || num === undefined) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    showButtonLoading(key) {
        const btn = document.getElementById(`btn-tiktok-${key}`);
        if (btn) {
            btn.classList.add('loading');
            setTimeout(() => btn.classList.remove('loading'), 1000);
        }
    }

    showToast(msg, type) {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toastMessage');
        const toastIcon = document.getElementById('toastIcon');
        if (!toast || !toastMsg || !toastIcon) return;
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        toastIcon.textContent = icons[type] || 'ℹ️';
        toastMsg.textContent = msg;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.classList.remove('show'), 2000);
    }

    _copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => this.showToast('Copied!', 'success'))
                .catch(err => {
                    console.error('Clipboard API failed, using fallback:', err);
                    this._fallbackCopy(text);
                });
        } else {
            this._fallbackCopy(text);
        }
    }

    _fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.top = '-100px';
        textarea.style.left = '-100px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            const success = document.execCommand('copy');
            if (success) {
                this.showToast('Copied! (fallback)', 'success');
            } else {
                this.showToast('Copy failed', 'error');
            }
        } catch (err) {
            console.error('Fallback copy error:', err);
            this.showToast('Copy error', 'error');
        } finally {
            document.body.removeChild(textarea);
        }
    }

    _downloadData(data, filename) {
        let content;
        if (typeof data === 'string') {
            content = data;
        } else {
            content = JSON.stringify(data, null, 2);
        }
        const blob = new Blob([content], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // Refresh the section dropdown with all array sections from loaded data
refreshFieldDropdowns() {
    if (!this.lastSqlData?.data) return;
    populateSectionDropdown('sectionSelect', this.lastSqlData.data);
    // Reset field dropdown
    const fieldSelect = document.getElementById('fieldSelect');
    if (fieldSelect) {
        fieldSelect.innerHTML = '<option value="">-- Choose Field --</option>';
        fieldSelect.disabled = true;
    }
    document.getElementById('analyzeFieldBtn').disabled = true;
}

// Called when the user changes the section dropdown
onSectionChange() {
    const sectionSelect = document.getElementById('sectionSelect');
    const fieldSelect = document.getElementById('fieldSelect');
    const analyzeBtn = document.getElementById('analyzeFieldBtn');
    const selectedSection = sectionSelect.value;
    
    // Clear previous analysis results
    const container = document.getElementById('fieldAnalysisContainer');
    if (container) container.innerHTML = '';
    
    if (!selectedSection || !this.lastSqlData?.data?.[selectedSection]) {
        fieldSelect.disabled = true;
        analyzeBtn.disabled = true;
        fieldSelect.innerHTML = '<option value="">-- Choose Field --</option>';
        return;
    }
    
    const sectionArray = this.lastSqlData.data[selectedSection];
    if (!Array.isArray(sectionArray) || sectionArray.length === 0) {
        fieldSelect.disabled = true;
        analyzeBtn.disabled = true;
        fieldSelect.innerHTML = '<option value="">-- No items --</option>';
        return;
    }
    
    populateFieldDropdown('fieldSelect', sectionArray);
    fieldSelect.disabled = false;
    analyzeBtn.disabled = false; // button enabled because a field is now selected
}

// Analyze the selected field and display results
analyzeSelectedField() {
    const sectionSelect = document.getElementById('sectionSelect');
    const fieldSelect = document.getElementById('fieldSelect');
    const selectedSection = sectionSelect.value;
    const selectedField = fieldSelect.value;
    
    if (!selectedSection || !selectedField || !this.lastSqlData?.data?.[selectedSection]) {
        this.showToast('Please select a section and field', 'warning');
        return;
    }
    
    const dataArray = this.lastSqlData.data[selectedSection];
    const counts = analyzeField(dataArray, selectedField);
    renderFieldTable('fieldAnalysisContainer', counts, `${selectedSection}.${selectedField}`);
}
}

// Create global instance
const tiktokEngine = new TikTokEngine();
window.tiktokEngine = tiktokEngine;

// Override switchTab for three tabs
window.switchTab = function(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    const pane = document.getElementById(tabId);
    if (pane) pane.classList.add('active');
    document.querySelectorAll('.tab').forEach(tab => {
        if (tab.textContent.trim().toLowerCase().includes(tabId.replace('-tab', ''))) {
            tab.classList.add('active');
        }
    });

    if (tabId === 'tiktok-tab' && window.tiktokEngine) {
        window.tiktokEngine.requestStats();
    }

if (tabId === 'summary-tab' && window.tiktokEngine) {
//window.tiktokEngine.renderPathTable();
//window.tiktokEngine.updateTableColors();
}
};

// Override getTikTokPath to use tiktokEngine
window.getTikTokPath = function(pathKey) {
    if (window.tiktokEngine) {
        window.tiktokEngine.getPath(pathKey);
    }
};

// Legacy updateTikTokStats (for compatibility)
window.updateTikTokStats = function() {
    if (window.tiktokEngine) tiktokEngine.requestStats();
};