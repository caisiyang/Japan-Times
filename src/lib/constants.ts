export const CATEGORIES = [
    { key: "all", label: "全部", color: "all" },
    { key: "politics", label: "时政", color: "politics" },
    { key: "military", label: "军事", color: "military" }, // ✅ 新增
    { key: "economy", label: "经济", color: "economy" },
    { key: "society", label: "社会", color: "society" },
    { key: "entertainment", label: "娱乐", color: "entertainment" },
    // ❌ 已删除 科技
    { key: "sports", label: "体育", color: "sports" },
    { key: "other", label: "其他", color: "other" },
] as const;

export type CategoryKey = typeof CATEGORIES[number]["key"];

export const CATEGORY_MAP: Record<string, string> = {
    '时政': 'politics', '政治': 'politics',
    '军事': 'military', // ✅ 新增
    '经济': 'economy',
    '社会': 'society',
    '娱乐': 'entertainment',
    // ❌ 已删除 科技
    '体育': 'sports',
    '其他': 'other'
};

export const CATEGORY_DOT_COLORS: Record<string, string> = {
    "politics": "bg-red-500",
    "military": "bg-orange-600", // ✅ 新增：军事类别使用深橙色/军橙色
    "economy": "bg-emerald-500",
    "society": "bg-amber-500",
    "entertainment": "bg-pink-500",
    // ❌ 已删除 tech
    "sports": "bg-indigo-500",
    "other": "bg-gray-400",
    "all": "bg-gray-900"
};

export const MEDIA_LOGOS: Record<string, string> = {
    "NHK": "https://www3.nhk.or.jp/favicon.ico",
    "Yahoo": "https://s.yimg.jp/c/icon/s/bsc/2.0/favicon.ico",
    "共同": "https://www.kyodo.co.jp/favicon.ico",
    "共同通信": "https://www.kyodo.co.jp/favicon.ico",
    "朝日": "https://www.asahi.com/favicon.ico",
    "読売": "https://www.yomiuri.co.jp/favicon.ico",
    "每日": "https://mainichi.jp/favicon.ico",
    "毎日": "https://mainichi.jp/favicon.ico",
    "日経": "https://www.nikkei.com/favicon.ico",
    "产经": "https://www.sankei.com/favicon.ico",
    "産経": "https://www.sankei.com/favicon.ico",
    "时事": "https://www.jiji.com/favicon.ico",
    "TBS": "https://news.tbs.co.jp/favicon.ico",
    "FNN": "https://www.fnn.jp/favicon.ico",
    "Bloomberg": "https://assets.bloomberg.com/static/images/favicon.ico",
    "CNN": "https://cnn.co.jp/favicon.ico",
    "Reuters": "https://www.reuters.com/favicon.ico",
    "路透": "https://www.reuters.com/favicon.ico",
    "BBC": "https://www.bbc.com/favicon.ico",
    "Record China": "https://d36u79445858l5.cloudfront.net/static/img/favicon.ico",
    "東洋経済": "https://toyokeizai.net/favicon.ico",
    "JBpress": "https://jbpress.ismedia.jp/favicon.ico"
};

// --- Bulletin Board Presets ---
// --- Bulletin Board Presets ---
export const BULLETIN_PRESETS = [
    { sc: "支持日本+1", tc: "支持日本+1" },
    { sc: "支持中国+1", tc: "支持中國+1" },
    { sc: "兼听则明", tc: "兼聽則明" },
    { sc: "保持独立思考", tc: "保持獨立思考" },
    { sc: "想去日本旅游啊", tc: "想去日本旅遊啊" },
    { sc: "理性吃瓜", tc: "理性吃瓜" },
    { sc: "愿中日友好", tc: "願中日友好" },
    { sc: "願世界和平", tc: "願世界和平" },
    { sc: "山川异域，风月同天", tc: "山川異域，風月同天" },
    { sc: "期待更多民间交流", tc: "期待更多民間交流" },
    { sc: "合作共赢才是硬道理", tc: "合作共贏才是硬道理" },
    { sc: "希望中日关系早日恢复", tc: "希望中日關係早日復原" },
];

export const SYSTEM_BULLETINS = [
    { id: "sys-1", content: "點擊“發聲”參與討論", isSystem: true },
];
