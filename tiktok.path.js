// ============================================================
// JSON PATHS CONFIGURATION
// ============================================================

const JSONPathsConfig = {
    // Your specific paths
    myApp: {
        // Comments
        comments: "Comment.Comments.CommentsList",
        
        // Block list
        blocked: "Profile And Settings.Block List.BlockList",
        
        // Following / Followers
        following: "Profile And Settings.Following.Following",
        followers: "Profile And Settings.Follower.FansList",
        
        // Posts / Videos
        videos: "Post.Posts.VideoList",
        
        // Profile & Settings
        profileMap: "Profile And Settings.Profile Info.ProfileMap",
        settingsMap: "Profile And Settings.Settings.SettingsMap",
        
        // ===== USER OBJECT (all user-related paths) =====
        user: {
            // Base path for user profile
            base: "Profile And Settings.Profile Info.ProfileMap",
            
            // Individual user fields
            displayName: "Profile And Settings.Profile Info.ProfileMap.displayName",
            userName: "Profile And Settings.Profile Info.ProfileMap.userName",
            likesReceived: "Profile And Settings.Profile Info.ProfileMap.likesReceived",
            followingCount: "Profile And Settings.Profile Info.ProfileMap.followingCount",
            followerName: "Profile And Settings.Profile Info.ProfileMap.followerName",
            emailAddress: "Profile And Settings.Profile Info.ProfileMap.emailAddress",
            birthDate: "Profile And Settings.Profile Info.ProfileMap.birthDate",
            
            // Additional helpful paths
            fullProfile: "Profile And Settings.Profile Info.ProfileMap",
            profileAge: "Profile And Settings.Profile Info.ProfileMap.age",
            profileBio: "Profile And Settings.Profile Info.ProfileMap.bio",
            profileAvatar: "Profile And Settings.Profile Info.ProfileMap.avatar"
        },
        
        // ===== LIKES AND FAVORITES =====
        favoriteCollections: "Likes and Favorites.Favorite Collection.FavoriteCollectionList",
        favoriteComments: "Likes and Favorites.Favorite Comment.FavoriteCommentList",
        favoriteEffects: "Likes and Favorites.Favorite Effects.FavoriteEffectsList",
        favoriteHashtags: "Likes and Favorites.Favorite Hashtags.FavoriteHashtagList",
        favoriteSounds: "Likes and Favorites.Favorite Sounds.FavoriteSoundList",
        favoriteVideos: "Likes and Favorites.Favorite Videos.FavoriteVideoList",
        likedItems: "Likes and Favorites.Like List.ItemFavoriteList",
        
        // ===== DIRECT MESSAGES =====
        directMessages: "Direct Message.Direct Messages.ChatHistory",
        groupChats: "Direct Message.Group Chat.GroupChat",
        
        // ===== YOUR ACTIVITY =====
        hashtagActivity: "Your Activity.Hashtag.HashtagList",
        loginHistory: "Your Activity.Login History.LoginHistoryList",
        searchHistory: "Your Activity.Searches.SearchList",
        reposts: "Your Activity.Reposts.RepostList",
        shareHistory: "Your Activity.Share History.ShareHistoryList",
        statusList: "Your Activity.Status.Status List",
        stickerList: "Your Activity.Stickers.StickerList",
        
        // ===== LIVE RELATED =====
        liveHistory: "TikTok Live.Go Live History.GoLiveList",
        liveModerator: "TikTok Live.Go Live Settings.SettingsMap.People you assigned to moderate your LIVE",
        liveWatchHistory: "TikTok Live.Watch Live History.WatchLiveMap",
        
        // ===== INCOME RELATED =====
        incomeWallet: "Income+ Wallet.Coin Purchase History.CoinPurchaseHistoryList",
        incomeTransaction: "Income+ Wallet.Transaction History.TransactionsHistoryList"
    },
    
    // User helper object for easy access
    user: {
        // Get full user profile object
        getProfile: (data) => {
            return JSONPathsConfig.utils.get(data, JSONPathsConfig.myApp.user.base);
        },
        
        // Get specific user field
        get: (data, field) => {
            const path = JSONPathsConfig.myApp.user[field];
            return path ? JSONPathsConfig.utils.get(data, path) : undefined;
        },
        
        // Get all user fields at once
        getAll: (data) => {
            const profile = JSONPathsConfig.user.getProfile(data);
            if (!profile) return null;
            
            return {
                displayName: profile.displayName,
                userName: profile.userName,
                likesReceived: profile.likesReceived,
                followingCount: profile.followingCount,
                followerName: profile.followerName,
                emailAddress: profile.emailAddress,
                birthDate: profile.birthDate,
                // Include any other fields that might exist
                ...profile
            };
        },
        
        // Check if user profile exists
        exists: (data) => {
            return JSONPathsConfig.utils.exists(data, JSONPathsConfig.myApp.user.base);
        },
        
        // Get user stats as formatted string
        getStats: (data) => {
            const profile = JSONPathsConfig.user.getProfile(data);
            if (!profile) return "No user data";
            
            return `👤 ${profile.displayName || profile.userName || 'User'} | ` +
                   `❤️ ${profile.likesReceived || 0} likes | ` +
                   `👥 ${profile.followingCount || 0} following`;
        }
    },
    
    // Category grouping for UI
    categories: {
        "👤 User Profile": [
            { name: "Display Name", path: "Profile And Settings.Profile Info.ProfileMap.displayName", icon: "📝", type: "string" },
            { name: "Username", path: "Profile And Settings.Profile Info.ProfileMap.userName", icon: "@", type: "string" },
            { name: "Email", path: "Profile And Settings.Profile Info.ProfileMap.emailAddress", icon: "📧", type: "string" },
            { name: "Birth Date", path: "Profile And Settings.Profile Info.ProfileMap.birthDate", icon: "🎂", type: "string" },
            { name: "Likes Received", path: "Profile And Settings.Profile Info.ProfileMap.likesReceived", icon: "❤️", type: "number" },
            { name: "Following Count", path: "Profile And Settings.Profile Info.ProfileMap.followingCount", icon: "👥", type: "number" },
            { name: "Follower Name", path: "Profile And Settings.Profile Info.ProfileMap.followerName", icon: "👤", type: "string" },
            { name: "Full Profile", path: "Profile And Settings.Profile Info.ProfileMap", icon: "📋", type: "object" }
        ],
        "Social Interactions": [
            { name: "Comments", path: "Comment.Comments.CommentsList", icon: "💬", type: "array" },
            { name: "Following", path: "Profile And Settings.Following.Following", icon: "👥", type: "array" },
            { name: "Followers", path: "Profile And Settings.Follower.FansList", icon: "👤", type: "array" },
            { name: "Blocked Users", path: "Profile And Settings.Block List.BlockList", icon: "🚫", type: "array" }
        ],
        "Content": [
            { name: "Videos", path: "Post.Posts.VideoList", icon: "🎥", type: "array" }
        ],
        "❤️ Likes & Favorites": [
            { name: "Favorite Collections", path: "Likes and Favorites.Favorite Collection.FavoriteCollectionList", icon: "📁", type: "array" },
            { name: "Favorite Comments", path: "Likes and Favorites.Favorite Comment.FavoriteCommentList", icon: "💬", type: "array" },
            { name: "Favorite Effects", path: "Likes and Favorites.Favorite Effects.FavoriteEffectsList", icon: "✨", type: "array" },
            { name: "Favorite Hashtags", path: "Likes and Favorites.Favorite Hashtags.FavoriteHashtagList", icon: "#️⃣", type: "array" },
            { name: "Favorite Sounds", path: "Likes and Favorites.Favorite Sounds.FavoriteSoundList", icon: "🔊", type: "array" },
            { name: "Favorite Videos", path: "Likes and Favorites.Favorite Videos.FavoriteVideoList", icon: "🎬", type: "array" },
            { name: "Liked Items", path: "Likes and Favorites.Like List.ItemFavoriteList", icon: "❤️", type: "array" }
        ],
        "💬 Direct Messages": [
            { name: "Chat History", path: "Direct Message.Direct Messages.ChatHistory", icon: "💬", type: "array" },
            { name: "Group Chats", path: "Direct Message.Group Chat.GroupChat", icon: "👥", type: "array" }
        ],
        "📊 Your Activity": [
            { name: "Hashtag Activity", path: "Your Activity.Hashtag.HashtagList", icon: "#️⃣", type: "array" },
            { name: "Login History", path: "Your Activity.Login History.LoginHistoryList", icon: "🔐", type: "array" },
            { name: "Search History", path: "Your Activity.Searches.SearchList", icon: "🔍", type: "array" },
            { name: "Reposts", path: "Your Activity.Reposts.RepostList", icon: "🔄", type: "array" },
            { name: "Share History", path: "Your Activity.Share History.ShareHistoryList", icon: "📤", type: "array" },
            { name: "Status List", path: "Your Activity.Status.Status List", icon: "📌", type: "array" },
            { name: "Stickers", path: "Your Activity.Stickers.StickerList", icon: "🎨", type: "array" }
        ]
    },
    
    // Path type information
    types: {
        // Existing paths
        "Comment.Comments.CommentsList": "array",
        "Profile And Settings.Block List.BlockList": "array",
        "Profile And Settings.Following.Following": "array",
        "Profile And Settings.Follower.FansList": "array",
        "Post.Posts.VideoList": "array",
        "Profile And Settings.Profile Info.ProfileMap": "object",
        "Profile And Settings.Settings.SettingsMap": "object",
        
        // User profile fields
        "Profile And Settings.Profile Info.ProfileMap.displayName": "string",
        "Profile And Settings.Profile Info.ProfileMap.userName": "string",
        "Profile And Settings.Profile Info.ProfileMap.likesReceived": "number",
        "Profile And Settings.Profile Info.ProfileMap.followingCount": "number",
        "Profile And Settings.Profile Info.ProfileMap.followerName": "string",
        "Profile And Settings.Profile Info.ProfileMap.emailAddress": "string",
        "Profile And Settings.Profile Info.ProfileMap.birthDate": "string",
        
        // Likes and Favorites paths
        "Likes and Favorites.Favorite Collection.FavoriteCollectionList": "array",
        "Likes and Favorites.Favorite Comment.FavoriteCommentList": "array",
        "Likes and Favorites.Favorite Effects.FavoriteEffectsList": "array",
        "Likes and Favorites.Favorite Hashtags.FavoriteHashtagList": "array",
        "Likes and Favorites.Favorite Sounds.FavoriteSoundList": "array",
        "Likes and Favorites.Favorite Videos.FavoriteVideoList": "array",
        "Likes and Favorites.Like List.ItemFavoriteList": "array",
        
        // Direct Messages
        "Direct Message.Direct Messages.ChatHistory": "array",
        "Direct Message.Group Chat.GroupChat": "array",
        
        // Your Activity paths
        "Your Activity.Hashtag.HashtagList": "array",
        "Your Activity.Login History.LoginHistoryList": "array",
        "Your Activity.Searches.SearchList": "array",
        "Your Activity.Reposts.RepostList": "array",
        "Your Activity.Share History.ShareHistoryList": "array",
        "Your Activity.Status.Status List": "array",
        "Your Activity.Stickers.StickerList": "array",
        
        // ===== NEW PATHS =====
        // Live related
        "TikTok Live.Go Live History.GoLiveList": "array",
        "TikTok Live.Go Live Settings.SettingsMap.People you assigned to moderate your LIVE": "array",
        "TikTok Live.Watch Live History.WatchLiveMap": "object",
        
        // Income related
        "Income+ Wallet.Coin Purchase History.CoinPurchaseHistoryList": "array",
        "Income+ Wallet.Transaction History.TransactionsHistoryList": "array"
    },
    
    // Helper utilities for working with paths
    utils: {
        // Split path into parts (handles spaces correctly)
        split: (path) => path.split('.'),
        
        // Get value at path (handles keys with spaces)
        get: (data, path) => {
            const parts = path.split('.');
            let current = data;
            
            for (const part of parts) {
                if (current === null || current === undefined) return undefined;
                current = current[part];
            }
            return current;
        },
        
        // Check if path exists
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
        
        // Get type of value at path
        getType: (data, path) => {
            const value = JSONPathsConfig.utils.get(data, path);
            if (value === null) return 'null';
            if (Array.isArray(value)) return 'array';
            return typeof value;
        },
        
        // Get array length if path points to an array
        length: (data, path) => {
            const value = JSONPathsConfig.utils.get(data, path);
            return Array.isArray(value) ? value.length : 0;
        },
        
        // Get object keys if path points to an object
        keys: (data, path) => {
            const value = JSONPathsConfig.utils.get(data, path);
            return (value && typeof value === 'object' && !Array.isArray(value)) 
                ? Object.keys(value) 
                : [];
        },
        
        // Get first item from array path
        first: (data, path) => {
            const value = JSONPathsConfig.utils.get(data, path);
            return Array.isArray(value) && value.length > 0 ? value[0] : undefined;
        },
        
        // Get all paths that exist in the data
        findExisting: (data, paths) => {
            const existing = [];
            for (const [key, path] of Object.entries(paths)) {
                if (JSONPathsConfig.utils.exists(data, path)) {
                    const type = JSONPathsConfig.types[path] || 
                                JSONPathsConfig.utils.getType(data, path);
                    existing.push({ key, path, type });
                }
            }
            return existing;
        },
        
        // Get counts for all favorite types
        getFavoriteCounts: (data) => {
            const favorites = {
                collections: JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.favoriteCollections),
                comments: JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.favoriteComments),
                effects: JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.favoriteEffects),
                hashtags: JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.favoriteHashtags),
                sounds: JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.favoriteSounds),
                videos: JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.favoriteVideos),
                likedItems: JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.likedItems)
            };
            
            favorites.total = Object.values(favorites).reduce((a, b) => a + b, 0);
            return favorites;
        },
        
        // Get counts for messages
        getMessageCounts: (data) => {
            return {
                direct: JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.directMessages),
                group: JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.groupChats),
                total: JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.directMessages) +
                       JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.groupChats)
            };
        },
        
        // Get counts for activity
        getActivityCounts: (data) => {
            return {
                hashtags: JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.hashtagActivity),
                logins: JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.loginHistory),
                searches: JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.searchHistory),
                reposts: JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.reposts),
                shares: JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.shareHistory),
                statuses: JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.statusList),
                stickers: JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.stickerList),
                total: JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.hashtagActivity) +
                       JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.loginHistory) +
                       JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.searchHistory) +
                       JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.reposts) +
                       JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.shareHistory) +
                       JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.statusList) +
                       JSONPathsConfig.utils.length(data, JSONPathsConfig.myApp.stickerList)
            };
        }
    },
    
    // Path builders for common patterns
    builders: {
        // Build path from parts (handles spaces)
        build: (...parts) => parts.join('.'),
        
        // Add index to array path
        itemAt: (path, index) => `${path}[${index}]`,
        
        // Add property to path
        property: (path, prop) => `${path}.${prop}`,
        
        // Get specific user field
        userField: (field) => `Profile And Settings.Profile Info.ProfileMap.${field}`,
        
        // Get specific item from arrays
        followingAt: (index) => `Profile And Settings.Following.Following[${index}]`,
        followerAt: (index) => `Profile And Settings.Follower.FansList[${index}]`,
        commentAt: (index) => `Comment.Comments.CommentsList[${index}]`,
        blockedAt: (index) => `Profile And Settings.Block List.BlockList[${index}]`,
        videoAt: (index) => `Post.Posts.VideoList[${index}]`,
        
        // Favorite items at index
        favoriteCollectionAt: (index) => `Likes and Favorites.Favorite Collection.FavoriteCollectionList[${index}]`,
        favoriteCommentAt: (index) => `Likes and Favorites.Favorite Comment.FavoriteCommentList[${index}]`,
        favoriteEffectAt: (index) => `Likes and Favorites.Favorite Effects.FavoriteEffectsList[${index}]`,
        favoriteHashtagAt: (index) => `Likes and Favorites.Favorite Hashtags.FavoriteHashtagList[${index}]`,
        favoriteSoundAt: (index) => `Likes and Favorites.Favorite Sounds.FavoriteSoundList[${index}]`,
        favoriteVideoAt: (index) => `Likes and Favorites.Favorite Videos.FavoriteVideoList[${index}]`,
        likedItemAt: (index) => `Likes and Favorites.Like List.ItemFavoriteList[${index}]`,
        
        // Message items at index
        chatAt: (index) => `Direct Message.Direct Messages.ChatHistory[${index}]`,
        groupChatAt: (index) => `Direct Message.Group Chat.GroupChat[${index}]`,
        
        // Activity items at index
        hashtagActivityAt: (index) => `Your Activity.Hashtag.HashtagList[${index}]`,
        loginAt: (index) => `Your Activity.Login History.LoginHistoryList[${index}]`,
        searchAt: (index) => `Your Activity.Searches.SearchList[${index}]`,
        repostAt: (index) => `Your Activity.Reposts.RepostList[${index}]`,
        shareAt: (index) => `Your Activity.Share History.ShareHistoryList[${index}]`,
        statusAt: (index) => `Your Activity.Status.Status List[${index}]`,
        stickerAt: (index) => `Your Activity.Stickers.StickerList[${index}]`,
        
        // Get specific property from profile/settings
        profileProperty: (prop) => `Profile And Settings.Profile Info.ProfileMap.${prop}`,
        settingsProperty: (prop) => `Profile And Settings.Settings.SettingsMap.${prop}`
    },
    
    // Common property paths
    properties: {
        user: {
            id: ".id",
            name: ".name",
            username: ".username",
            email: ".email",
            avatar: ".avatar",
            joinedAt: ".joinedAt",
            displayName: ".displayName",
            userName: ".userName",
            likesReceived: ".likesReceived",
            followingCount: ".followingCount",
            followerName: ".followerName",
            emailAddress: ".emailAddress",
            birthDate: ".birthDate"
        },
        comment: {
            id: ".id",
            text: ".text",
            userId: ".userId",
            likes: ".likes",
            createdAt: ".createdAt"
        },
        follow: {
            userId: ".userId",
            username: ".username",
            followedAt: ".followedAt"
        },
        video: {
            id: ".id",
            title: ".title",
            url: ".url",
            duration: ".duration",
            views: ".views",
            likes: ".likes",
            uploadedAt: ".uploadedAt"
        },
        profile: {
            displayName: ".displayName",
            userName: ".userName",
            likesReceived: ".likesReceived",
            followingCount: ".followingCount",
            followerName: ".followerName",
            emailAddress: ".emailAddress",
            birthDate: ".birthDate",
            bio: ".bio",
            avatar: ".avatar",
            age: ".age"
        },
        settings: {
            theme: ".theme",
            notifications: ".notifications",
            privacy: ".privacy",
            language: ".language"
        },
        // Favorite item properties
        favoriteCollection: {
            id: ".id",
            name: ".name",
            itemCount: ".itemCount",
            createdAt: ".createdAt",
            thumbnail: ".thumbnail"
        },
        favoriteEffect: {
            id: ".id",
            name: ".name",
            type: ".type",
            preview: ".preview",
            downloadedAt: ".downloadedAt"
        },
        favoriteHashtag: {
            tag: ".tag",
            postCount: ".postCount",
            lastUsed: ".lastUsed"
        },
        favoriteSound: {
            id: ".id",
            title: ".title",
            artist: ".artist",
            duration: ".duration",
            addedAt: ".addedAt"
        },
        likedItem: {
            id: ".id",
            type: ".type",
            likedAt: ".likedAt",
            source: ".source"
        },
        // Message properties
        message: {
            id: ".id",
            from: ".from",
            to: ".to",
            text: ".text",
            timestamp: ".timestamp",
            read: ".read"
        },
        groupChat: {
            id: ".id",
            name: ".name",
            members: ".members",
            lastMessage: ".lastMessage",
            createdAt: ".createdAt"
        },
        // Activity properties
        loginRecord: {
            id: ".id",
            timestamp: ".timestamp",
            device: ".device",
            location: ".location",
            ip: ".ip"
        },
        searchRecord: {
            id: ".id",
            query: ".query",
            timestamp: ".timestamp",
            results: ".results"
        },
        hashtagActivity: {
            tag: ".tag",
            usedAt: ".usedAt",
            count: ".count"
        },
        repost: {
            id: ".id",
            originalId: ".originalId",
            repostedAt: ".repostedAt",
            type: ".type"
        },
        share: {
            id: ".id",
            sharedTo: ".sharedTo",
            sharedAt: ".sharedAt",
            platform: ".platform"
        },
        status: {
            id: ".id",
            status: ".status",
            updatedAt: ".updatedAt",
            message: ".message"
        },
        sticker: {
            id: ".id",
            name: ".name",
            usedAt: ".usedAt",
            pack: ".pack"
        }
    }
};

// Make it globally available
window.JSONPathsConfig = JSONPathsConfig;