// ============================================================
// TIKTOK WORKER – with embedded JSONPathsConfig (worker-safe)
// ============================================================

// ---------- Embedded JSONPathsConfig (worker-compatible) ----------
const JSONPathsConfig = {
    myApp: {
        comments: "Comment.Comments.CommentsList",
        blocked: "Profile And Settings.Block List.BlockList",
        following: "Profile And Settings.Following.Following",
        followers: "Profile And Settings.Follower.FansList",
        videos: "Post.Posts.VideoList",
        profileMap: "Profile And Settings.Profile Info.ProfileMap",
        settingsMap: "Profile And Settings.Settings.SettingsMap",
        user: {
            base: "Profile And Settings.Profile Info.ProfileMap",
            displayName: "Profile And Settings.Profile Info.ProfileMap.displayName",
            userName: "Profile And Settings.Profile Info.ProfileMap.userName",
            likesReceived: "Profile And Settings.Profile Info.ProfileMap.likesReceived",
            followingCount: "Profile And Settings.Profile Info.ProfileMap.followingCount",
            followerCount: "Profile And Settings.Profile Info.ProfileMap.followerCount",
            emailAddress: "Profile And Settings.Profile Info.ProfileMap.emailAddress",
            birthDate: "Profile And Settings.Profile Info.ProfileMap.birthDate",
            fullProfile: "Profile And Settings.Profile Info.ProfileMap",
            profileAge: "Profile And Settings.Profile Info.ProfileMap.age",
            profileBio: "Profile And Settings.Profile Info.ProfileMap.bio",
            profileAvatar: "Profile And Settings.Profile Info.ProfileMap.avatar"
        },
        favoriteCollections: "Likes and Favorites.Favorite Collection.FavoriteCollectionList",
        favoriteComments: "Likes and Favorites.Favorite Comment.FavoriteCommentList",
        favoriteEffects: "Likes and Favorites.Favorite Effects.FavoriteEffectsList",
        favoriteHashtags: "Likes and Favorites.Favorite Hashtags.FavoriteHashtagList",
        favoriteSounds: "Likes and Favorites.Favorite Sounds.FavoriteSoundList",
        favoriteVideos: "Likes and Favorites.Favorite Videos.FavoriteVideoList",
        likedItems: "Likes and Favorites.Like List.ItemFavoriteList",
        directMessages: "Direct Message.Direct Messages.ChatHistory",
        groupChats: "Direct Message.Group Chat.GroupChat",
        hashtagActivity: "Your Activity.Hashtag.HashtagList",
        loginHistory: "Your Activity.Login History.LoginHistoryList",
        searchHistory: "Your Activity.Searches.SearchList",
        reposts: "Your Activity.Reposts.RepostList",
        shareHistory: "Your Activity.Share History.ShareHistoryList",
        statusList: "Your Activity.Status.Status List",
        stickerList: "Your Activity.Stickers.StickerList",
        // Live related paths
        liveHistory: "TikTok Live.Go Live History.GoLiveList",
        liveModerator: "TikTok Live.Go Live Settings.SettingsMap.People you assigned to moderate your LIVE",
        liveWatchHistory: "TikTok Live.Watch Live History.WatchLiveMap",
        // Income related paths
        incomeWallet: "Income+ Wallet.Coin Purchase History.CoinPurchaseHistoryList",
        incomeTransaction: "Income+ Wallet.Transaction History.TransactionsHistoryList"
    },
    utils: {
        get: (data, path) => {
            const parts = path.split('.');
            let current = data;
            for (const part of parts) {
                if (current === null || current === undefined) return undefined;
                current = current[part];
            }
            return current;
        },
        exists: (data, path) => {
            try {
                const parts = path.split('.');
                let current = data;
                for (const part of parts) {
                    if (current === null || current === undefined) return false;
                    current = current[part];
                }
                return true;
            } catch {
                return false;
            }
        },
        length: (data, path) => {
            const value = JSONPathsConfig.utils.get(data, path);
            return Array.isArray(value) ? value.length : 0;
        }
    }
};

// ---------- Helpers ----------
function normalizeContentS(str) {
    if (typeof str !== 'string') return str;
    try {
        const url = new URL(str);
        const pathParts = url.pathname.split('/').filter(p => p.length > 0);
        if (pathParts.length > 0) {
            return pathParts[pathParts.length - 1];
        }
    } catch (e) {
        // Not a valid URL
    }
    return str;
}

function normalizeContentA(str) {
    if (typeof str !== 'string') return str;
    
    // Try to parse as URL first (for web links)
    try {
        const url = new URL(str);
        const pathParts = url.pathname.split('/').filter(p => p.length > 0);
        if (pathParts.length > 0) {
            return pathParts[pathParts.length - 1]; // last segment
        }
    } catch (e) {
        // Not a valid URL – continue to file path detection
    }
    
    // Check if it's a file path (contains slashes or backslashes)
    if (str.includes('/') || str.includes('\\')) {
        // Split by either forward or backslash, get last non‑empty part
        const parts = str.split(/[/\\]/).filter(p => p.length > 0);
        if (parts.length > 0) {
            return parts[parts.length - 1]; // file name
        }
    }
    
    // If neither URL nor file path, return original
    return str;
}

function normalizeContent(str) {
    if (typeof str !== 'string') return str;
    
    // If it's an HTTP/HTTPS URL
    if (/^https?:\/\//i.test(str)) {
        // Remove protocol and domain, keep path
        try {
            const url = new URL(str); // still useful to get pathname correctly
            const pathParts = url.pathname.split('/').filter(p => p.length > 0);
            if (pathParts.length > 0) return pathParts[pathParts.length - 1];
        } catch {
            // Fallback: just split by '/'
            const parts = str.split('/').filter(p => p.length > 0);
            if (parts.length > 0) return parts[parts.length - 1];
        }
    }
    
    // Check if it's a file path (contains / or \)
    if (str.includes('/') || str.includes('\\')) {
        const parts = str.split(/[/\\]/).filter(p => p.length > 0);
        if (parts.length > 0) return parts[parts.length - 1];
    }
    
    // Otherwise return original
    return str;
}

function normalizeContentMerged(str) {
    if (typeof str !== 'string') return str;
    
    // 1. Try to parse as an absolute URL (any scheme)
    try {
        const url = new URL(str);
        const pathParts = url.pathname.split('/').filter(p => p.length > 0);
        if (pathParts.length > 0) {
            return pathParts[pathParts.length - 1];
        }
        // If path is empty (e.g., root URL), fall through to file‑path handling
        // (or you could return url.hostname if that behavior is desired)
    } catch {
        // Not a valid absolute URL – continue
    }
    
    // 2. If the string looks like an http/https URL but failed parsing,
    //    attempt a manual extraction (like normalizeContent's fallback)
    if (/^https?:\/\//i.test(str)) {
        const parts = str.split('/').filter(p => p.length > 0);
        if (parts.length > 0) {
            return parts[parts.length - 1];
        }
    }
    
    // 3. Check for file path delimiters
    if (str.includes('/') || str.includes('\\')) {
        const parts = str.split(/[/\\]/).filter(p => p.length > 0);
        if (parts.length > 0) {
            return parts[parts.length - 1];
        }
    }
    
    // 4. Otherwise, return original
    return str;
}

function truncateString(str, maxLength = 200, ellipsis = '...') {
    if (typeof str !== 'string') return str;
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - ellipsis.length) + ellipsis;
}

function shortHash(str) {
    let hash = 2166136261; // FNV-1a offset basis
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(36).padStart(8, '0').slice(0, 8);
}

// ---------- Main: getSqlData ----------
function getSqlData(full = false) {
    if (!currentData) return self.postMessage({ error: 'No data' });
    const utils = JSONPathsConfig.utils;
    const app = JSONPathsConfig.myApp;

    const PREVIEW_LIMIT = 5;
    const MESSAGE_PREVIEW = 20;

    // ----- Following & followers (full arrays) -----
    const fullFollowing = utils.get(currentData, app.following) || [];
    const fullFollowers = utils.get(currentData, app.followers) || [];

    // ----- Friends (mutual follows) -----
    const followerMap = new Map();
    fullFollowers.forEach(f => {
        if (f?.UserName) followerMap.set(f.UserName, f.Date);
    });

    const friends = [];
    fullFollowing.forEach(f => {
        if (f?.UserName && followerMap.has(f.UserName)) {
            friends.push({
                UserName: f.UserName,
                dateFollowing: f.Date,
                dateFollower: followerMap.get(f.UserName)
            });
        }
    });

    // ----- Profile (filtered) -----
    const rawProfile = utils.get(currentData, app.user.base) || {};
    const allowedProfileKeys = [
        'displayName', 'userName', 'likesReceived', 'followingCount',
        'followerCount', 'birthDate', 'emailAddress', 'bio', 'avatar', 'age'
    ];
    const profile = {};
    allowedProfileKeys.forEach(k => {
        if (rawProfile[k] !== undefined) profile[k] = rawProfile[k];
    });
    profile.friendsCount = friends.length;

    const userName = profile.userName || null;

    // ----- Comments – only date and comment -----
    const rawComments = utils.get(currentData, app.comments) || [];
    const filteredComments = rawComments.map(item => {
        const filtered = {};
        if (item.date !== undefined) filtered.date = item.date;
        if (item.comment !== undefined) filtered.comment = truncateString(item.comment, 200);
        return filtered;
    });

    // ----- Blocked -----
    const blocked = utils.get(currentData, app.blocked) || [];

    // ----- Regular Posts & videoHash -----
    const rawPosts = utils.get(currentData, app.videos) || [];
    const videoHash = [];

    const filteredPosts = rawPosts.map(item => {
        const post = {};
        if (item.Date !== undefined) post.Date = item.Date;
        if (item.Likes !== undefined) post.Likes = item.Likes;
        if (item.WhoCanView !== undefined) post.WhoCanView = item.WhoCanView;

        let hash;
        if (item.Link) {
            hash = shortHash(item.Link);
            videoHash.push({ hashId: hash, link: item.Link, deleted: false });
        } else {
            const fallback = item.id || item.videoId || JSON.stringify(item);
            hash = shortHash(fallback);
        }
        post.shortId = hash;
        return post;
    });

    // ----- Deleted Posts -----
    const rawDeleted = utils.get(currentData, "Post.Recently Deleted Posts.PostList") || [];
    const filteredDeleted = rawDeleted.map(item => {
        const del = {};
        if (item.Date !== undefined) del.Date = item.Date;
        if (item.DateDeleted !== undefined) del.DateDeleted = item.DateDeleted;
        if (item.Likes !== undefined) del.Likes = item.Likes;
        let hash;
        if (item.Link) {
            hash = shortHash(item.Link);
            videoHash.push({ hashId: hash, link: item.Link, deleted: true });
        } else {
            const fallback = item.id || JSON.stringify(item);
            hash = shortHash(fallback);
        }
        del.shortId = hash;
        return del;
    });

    // ----- Messages -----
    const allMessages = [];

    // Direct messages
    const directObj = utils.get(currentData, app.directMessages) || {};
    Object.entries(directObj).forEach(([key, messagesArray]) => {
        const match = key.match(/^Chat History with (.*)$/);
        if (match && Array.isArray(messagesArray)) {
            let withUser = match[1];
            if (withUser.endsWith(':')) withUser = withUser.slice(0, -1);
            messagesArray.forEach(msg => {
                const normalizedContent = normalizeContentMerged(msg.Content);
                allMessages.push({
                    type: 'direct',
                    with: withUser,
                    Date: msg.Date,
                    From: msg.From,
                    Content: truncateString(normalizedContent, 100)
                });
                
            });
        }
    });

    // Group chats
    const groupObj = utils.get(currentData, app.groupChats) || {};
    Object.entries(groupObj).forEach(([key, messagesArray]) => {
        const match = key.match(/^Group Chat with Group_Chat_(.*)$/);
        if (match && Array.isArray(messagesArray)) {
            let withGroup = match[1];
            if (withGroup.endsWith(':')) withGroup = withGroup.slice(0, -1);
            messagesArray.forEach(msg => {
                const normalizedContent = normalizeContentMerged(msg.Content);
                allMessages.push({
                    type: 'group',
                    with: withGroup,
                    Date: msg.Date,
                    From: msg.From,
                    Content: truncateString(normalizedContent, 100)
                });
            });
        }
    });

    profile.totalMessages = allMessages.length;

    // ----- New sections from Likes & Favorites and Your Activity -----
    const rawFavCollections = utils.get(currentData, app.favoriteCollections) || [];
    const favoriteCollections = rawFavCollections.map(item => ({
        Date: item.Date,
        FavoriteCollection: item.FavoriteCollection
    }));

    const rawFavComments = utils.get(currentData, app.favoriteComments) || [];
    const favoriteComments = rawFavComments.map(item => ({
        FavoriteComment: truncateString(item.FavoriteComment, 200)
    }));

    const rawFavEffects = utils.get(currentData, app.favoriteEffects) || [];
    const favoriteEffects = rawFavEffects.map(item => ({
        Date: item.Date,
        EffectLink: item.EffectLink
    }));

    const rawFavHashtags = utils.get(currentData, app.favoriteHashtags) || [];
    const favoriteHashtags = rawFavHashtags.map(item => ({
        Date: item.Date,
        Link: item.Link
    }));

    const rawFavSounds = utils.get(currentData, app.favoriteSounds) || [];
    const favoriteSounds = rawFavSounds.map(item => ({
        Date: item.Date,
        Link: normalizeContentMerged(item.Link)
    }));

    const rawFavVideos = utils.get(currentData, app.favoriteVideos) || [];
    const favoriteVideos = rawFavVideos.map(item => ({
        Date: item.Date,
        Link: normalizeContentMerged(item.Link)
    }));

    const rawFavLikes = utils.get(currentData, app.likedItems) || [];
    const favoriteLikes = rawFavLikes.map(item => ({
        date: item.date,
        link: normalizeContentMerged(item.link)
    }));

    const rawReposts = utils.get(currentData, app.reposts) || [];
    const reposts = rawReposts.map(item => ({
        Date: item.Date,
        Link: normalizeContentMerged(item.Link)
    }));

    const rawSearches = utils.get(currentData, app.searchHistory) || [];
    const searches = rawSearches.map(item => ({
        Date: item.Date,
        SearchTerm: item.SearchTerm
    }));

    // ----- Live History -----
    const rawLiveHistory = utils.get(currentData, app.liveHistory) || [];
    const liveHistory = rawLiveHistory.map(item => ({
        roomId: item.RoomId,
        title: item.RoomTitle,
        started: item.LiveStartTime,
        ended: item.LiveEndTime,
        duration: item.LiveDuration,
        earning: item.TotalEarning,
        like: item.TotalLike,
        view: item.TotalView,
        gifter: item.TotalGifter,
        muted: Array.isArray(item.MutedList) ? item.MutedList.length : 0
    }));

    // ----- Live Moderator -----
    const rawModerator = utils.get(currentData, app.liveModerator) || [];
    let liveModerator = [];
    if (Array.isArray(rawModerator)) {
        liveModerator = rawModerator.map(item => {
            if (typeof item === 'string') return { name: item };
            if (item && item.Name) return { name: item.Name };
            return { name: null };
        }).filter(m => m.name !== null);
    }

    // ----- Live Watch History (flatten comments) -----
    const rawWatchMap = utils.get(currentData, app.liveWatchHistory) || {};
    const liveWatchHistory = [];
    Object.entries(rawWatchMap).forEach(([roomId, entry]) => {
        if (!entry || typeof entry !== 'object') return;
        const watchTime = entry.WatchTime;
        const comments = entry.Comments;
        if (Array.isArray(comments)) {
            comments.forEach(cmt => {
                liveWatchHistory.push({
                    roomId,
                    comment: cmt.CommentContent,
                    commentTime: cmt.CommentTime,
                    rawTime: cmt.RawTime,
                    time: watchTime
                });
            });
        }
    });

    // ----- Login History -----
    const rawLoginHistory = utils.get(currentData, app.loginHistory) || [];
    const loginHistory = rawLoginHistory.map(item => ({
        Date: item.Date,
        IP: item.IP,
        DeviceModel: item.DeviceModel,
        DeviceSystem: item.DeviceSystem,
        NetworkType: item.NetworkType,
        Carrier: item.Carrier
    }));

    // ----- Income Wallet (Coin Purchase History) -----
    const rawIncomeWallet = utils.get(currentData, app.incomeWallet) || [];
    const incomeWallet = rawIncomeWallet.map(item => ({
        Date: item.Date,
        Type: item.Type,
        CoinAmount: item.CoinAmount
    }));

    // ----- Income Transaction (Transaction History) -----
    const rawIncomeTransaction = utils.get(currentData, app.incomeTransaction) || [];
    const incomeTransaction = rawIncomeTransaction; // keep original structure

    // ----- Build final sqlData -----
    if (!full) {
        // Preview mode: mix direct and group messages
        const directMessages = allMessages.filter(msg => msg.type === 'direct');
        const groupMessages = allMessages.filter(msg => msg.type === 'group');

        let takeDirect = Math.min(directMessages.length, Math.floor(MESSAGE_PREVIEW / 2));
        let takeGroup = Math.min(groupMessages.length, MESSAGE_PREVIEW - takeDirect);
        if (takeDirect + takeGroup < MESSAGE_PREVIEW) {
            if (directMessages.length > takeDirect) {
                takeDirect = Math.min(directMessages.length, MESSAGE_PREVIEW - takeGroup);
            } else if (groupMessages.length > takeGroup) {
                takeGroup = Math.min(groupMessages.length, MESSAGE_PREVIEW - takeDirect);
            }
        }

        const messagesPreview = [
            ...directMessages.slice(0, takeDirect),
            ...groupMessages.slice(0, takeGroup)
        ];

        const data = {
            profile: [profile],
            comments: filteredComments.slice(0, PREVIEW_LIMIT),
            blocked: blocked.slice(0, PREVIEW_LIMIT),
            following: fullFollowing.slice(0, PREVIEW_LIMIT),
            friends: friends.slice(0, PREVIEW_LIMIT),
            posts: filteredPosts.slice(0, PREVIEW_LIMIT),
            deletedPosts: filteredDeleted.slice(0, PREVIEW_LIMIT),
            messages: messagesPreview,
            favoriteCollections: favoriteCollections.slice(0, PREVIEW_LIMIT),
            favoriteComments: favoriteComments.slice(0, PREVIEW_LIMIT),
            favoriteEffects: favoriteEffects.slice(0, PREVIEW_LIMIT),
            favoriteHashtags: favoriteHashtags.slice(0, PREVIEW_LIMIT),
            favoriteSounds: favoriteSounds.slice(0, PREVIEW_LIMIT),
            favoriteVideos: favoriteVideos.slice(0, PREVIEW_LIMIT),
            favoriteLikes: favoriteLikes.slice(0, PREVIEW_LIMIT),
            reposts: reposts.slice(0, PREVIEW_LIMIT),
            searches: searches.slice(0, PREVIEW_LIMIT),
            liveHistory: liveHistory.slice(0, PREVIEW_LIMIT),
            liveModerator: liveModerator.slice(0, PREVIEW_LIMIT),
            liveWatchHistory: liveWatchHistory.slice(0, PREVIEW_LIMIT),
            loginHistory: loginHistory.slice(0, PREVIEW_LIMIT),
            incomeWallet: incomeWallet.slice(0, PREVIEW_LIMIT),
            incomeTransaction: incomeTransaction.slice(0, PREVIEW_LIMIT)
        };

        self.postMessage({ type: 'sqlData', data: { userName, data }, videoHash, isFull: false });
    } else {
        // Full mode – no slicing
        const data = {
            profile: [profile],
            comments: filteredComments,
            blocked,
            following: fullFollowing,
            friends,
            posts: filteredPosts,
            deletedPosts: filteredDeleted,
            messages: allMessages,
            favoriteCollections,
            favoriteComments,
            favoriteEffects,
            favoriteHashtags,
            favoriteSounds,
            favoriteVideos,
            favoriteLikes,
            reposts,
            searches,
            liveHistory,
            liveModerator,
            liveWatchHistory,
            loginHistory,
            incomeWallet,
            incomeTransaction
        };

        self.postMessage({ type: 'sqlData', data: { userName, data }, videoHash, isFull: true });
    }
}

// ---------- New: getExistingPaths ----------
function getExistingPaths() {
    if (!currentData) return self.postMessage({ error: 'No data' });
    const utils = JSONPathsConfig.utils;
    const app = JSONPathsConfig.myApp;
    const existing = [];

    // Map of extracted keys to their path in myApp (or direct path string)
    const pathMap = {
        profile: app.user.base,
        comments: app.comments,
        blocked: app.blocked,
        following: app.following,
        posts: app.videos,
        deletedPosts: "Post.Recently Deleted Posts.PostList",
        favoriteCollections: app.favoriteCollections,
        favoriteComments: app.favoriteComments,
        favoriteEffects: app.favoriteEffects,
        favoriteHashtags: app.favoriteHashtags,
        favoriteSounds: app.favoriteSounds,
        favoriteVideos: app.favoriteVideos,
        favoriteLikes: app.likedItems,
        reposts: app.reposts,
        searches: app.searchHistory,
        liveHistory: app.liveHistory,
        liveModerator: app.liveModerator,
        liveWatchHistory: app.liveWatchHistory,
        loginHistory: app.loginHistory,
        incomeWallet: app.incomeWallet,
        incomeTransaction: app.incomeTransaction
    };

    // Check each path
    for (const [key, path] of Object.entries(pathMap)) {
        if (utils.exists(currentData, path)) {
            existing.push(key);
        }
    }

    // For computed sections (friends, messages) check dependencies
    if (utils.exists(currentData, app.following) || utils.exists(currentData, app.followers)) {
        existing.push('friends'); // loosely mark as available
    }
    if (utils.exists(currentData, app.directMessages) || utils.exists(currentData, app.groupChats)) {
        existing.push('messages');
    }

    self.postMessage({ type: 'existingPaths', paths: existing });
}

// ---------- Message router ----------
let currentData = null;

self.onmessage = function (e) {
    const { type, payload } = e.data;
    try {
        switch (type) {
            case 'load':
                loadFile(payload);
                break;
            case 'getStats':
                getStats();
                break;
            case 'getPath':
                getPath(payload);
                break;
            case 'getSqlData':
                getSqlData(payload?.full);
                break;
            case 'getExistingPaths':
                getExistingPaths();
                break;
            default:
                self.postMessage({ error: 'Unknown command' });
        }
    } catch (err) {
        self.postMessage({ error: err.message });
    }
};

function loadFile(fileData) {
    try {
        currentData = JSON.parse(fileData.data);
        self.postMessage({
            loaded: true,
            fileInfo: {
                name: fileData.name,
                size: (fileData.size / 1024).toFixed(2) + ' KB',
                items: Array.isArray(currentData) ? currentData.length : Object.keys(currentData).length,
                type: Array.isArray(currentData) ? 'array' : 'object'
            }
        });
    } catch (err) {
        self.postMessage({ error: `Failed to parse: ${err.message}` });
    }
}

function getStats() {
    if (!currentData) return self.postMessage({ error: 'No data' });
    try {
        const utils = JSONPathsConfig.utils;
        const app = JSONPathsConfig.myApp;
        const profile = utils.get(currentData, app.user.base) || {};

        const following = utils.get(currentData, app.following) || [];
        const followers = utils.get(currentData, app.followers) || [];

        const followerMap = new Map();
        followers.forEach(f => { if (f?.UserName) followerMap.set(f.UserName, true); });
        let friendsCount = 0;
        following.forEach(f => { if (f?.UserName && followerMap.has(f.UserName)) friendsCount++; });

        const stats = {
            profile: {
                displayName: profile.displayName || 'Unknown',
                userName: profile.userName || '@username',
                likesReceived: profile.likesReceived || 0,
                followingCount: profile.followingCount || 0,
                followerCount: profile.followerCount || 0,
                birthDate: profile.birthDate || null,
                emailAddress: profile.emailAddress || null,
                bio: profile.bio || null,
                avatar: profile.avatar || null,
                age: profile.age || null,
                friendsCount
            },
            comments: utils.length(currentData, app.comments),
            blocked: utils.length(currentData, app.blocked),
            following: following.length,
            followers: followers.length,
            videos: utils.length(currentData, app.videos),
            favorites: {
                collections: utils.length(currentData, app.favoriteCollections),
                comments: utils.length(currentData, app.favoriteComments),
                effects: utils.length(currentData, app.favoriteEffects),
                hashtags: utils.length(currentData, app.favoriteHashtags),
                sounds: utils.length(currentData, app.favoriteSounds),
                videos: utils.length(currentData, app.favoriteVideos),
                likedItems: utils.length(currentData, app.likedItems)
            },
            messages: {
                direct: utils.length(currentData, app.directMessages),
                group: utils.length(currentData, app.groupChats)
            },
            activity: {
                hashtags: utils.length(currentData, app.hashtagActivity),
                logins: utils.length(currentData, app.loginHistory),
                searches: utils.length(currentData, app.searchHistory),
                reposts: utils.length(currentData, app.reposts),
                shares: utils.length(currentData, app.shareHistory),
                statuses: utils.length(currentData, app.statusList),
                stickers: utils.length(currentData, app.stickerList)
            }
        };

        stats.favorites.total = Object.values(stats.favorites).reduce((a, b) => a + b, 0);
        stats.messages.total = stats.messages.direct + stats.messages.group;
        stats.activity.total = Object.values(stats.activity).reduce((a, b) => a + b, 0);

        self.postMessage({ type: 'stats', stats });
    } catch (err) {
        self.postMessage({ error: `Stats error: ${err.message}` });
    }
}

function getPath(path) {
    if (!currentData) return self.postMessage({ error: 'No data' });
    const result = JSONPathsConfig.utils.get(currentData, path);
    if (Array.isArray(result) && result.length > 50) {
        self.postMessage({
            type: 'pathResult',
            result: {
                _preview: true,
                count: result.length,
                first10: result.slice(0, 10),
                message: `Large array (${result.length} items). Showing first 10.`
            }
        });
    } else {
        self.postMessage({ type: 'pathResult', result });
    }
}