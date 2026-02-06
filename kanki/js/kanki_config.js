/**
 * KAnki Configuration
 * Edit these settings to customize the app for your language
 */
var KANKI_CONFIG = {
  language: "Japanese",  // Change this to your language name
  levels: ["N5", "N4"],   // These should match the keys in your VOCABULARY object
  imageBasePath: "deckimages/"  // Base path for card images, can be relative path or URL
};

/**
 * JLPT Vocabulary Data
 * Organized by JLPT level
 * 
 * IMPORTANT: Front, Back, and Notes can now be:
 * - Text only: "こんにちは"
 * - Image only: "https://example.com/image.jpg"
 * 
 * Each field is EITHER image OR text - not both!
 */
var VOCABULARY = {
  "N5": [
    {"front": "https://japanesque-cafe.com/wp-content/uploads/2020/01/%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF-1024x576.jpg", "back": "Hello", "notes": "Common greeting"},
    {"front": "ありがとう", "back": "https://via.placeholder.com/200x100?text=Thank+You", "notes": "Express gratitude"},
    {"front": "https://picsum.photos/200/150?random=goodbye", "back": "Goodbye", "notes": "Parting phrase"},
    {"front": "はい", "back": "Yes - Affirmation", "notes": "Positive response"},
    {"front": "いいえ", "back": "No - Negation", "notes": "Negative response"},
    {"front": "https://via.placeholder.com/200x100?text=Please", "back": "Please", "notes": "Polite request"},
    {"front": "すみません", "back": "https://via.placeholder.com/200x100?text=Sorry", "notes": "Apology"},
    {"front": "いくらですか", "back": "How much is it?", "notes": "Price question"},
    {"front": "https://picsum.photos/200/150?random=confused", "back": "I don't understand", "notes": "Confusion"},
    {"front": "あなた", "back": "You - Pronoun", "notes": "Second person"},
    {"front": "https://picsum.photos/200/150?random=water", "back": "Water - 水 (みず)", "notes": "Essential N5 vocabulary"},
    {"front": "人", "back": "https://picsum.photos/200/150?random=people", "notes": "Person - common noun"},
    {"front": "https://picsum.photos/200/150?random=book", "back": "Book - 本 (ほん)", "notes": "Common noun"},
    {"front": "一", "back": "https://via.placeholder.com/200x100?text=One", "notes": "Number 1"},
    {"front": "二", "back": "https://via.placeholder.com/200x100?text=Two", "notes": "Number 2"},
    {"front": "三", "back": "https://via.placeholder.com/200x100?text=Three", "notes": "Number 3"},
    {"front": "https://via.placeholder.com/200x100?text=Four", "back": "Four - 四 (よん)", "notes": "Number 4"},
    {"front": "五", "back": "https://via.placeholder.com/200x100?text=Five", "notes": "Number 5"},
    {"front": "https://picsum.photos/200/150?random=eating", "back": "To eat - 食べる (たべる)", "notes": "Essential verb"},
    {"front": "飲む", "back": "https://picsum.photos/200/150?random=drinking", "notes": "To drink"},
    {"front": "おはよう", "back": "https://via.placeholder.com/200x100?text=Good+Morning", "notes": "Morning greeting"},
    {"front": "こんばんは", "back": "https://via.placeholder.com/200x100?text=Good+Evening", "notes": "Evening greeting"},
    {"front": "https://picsum.photos/200/150?random=sleep", "back": "Good night - おやすみ", "notes": "Night greeting"},
    {"front": "名前", "back": "https://via.placeholder.com/200x100?text=Name", "notes": "Identity"},
    {"front": "https://picsum.photos/200/150?random=japan", "back": "Japan - 日本 (にほん)", "notes": "Country"},
    {"front": "学生", "back": "https://picsum.photos/200/150?random=student", "notes": "Student - occupation"},
    {"front": "https://picsum.photos/200/150?random=teacher", "back": "Teacher - 先生 (せんせい)", "notes": "Educational role"},
    {"front": "医者", "back": "https://picsum.photos/200/150?random=doctor", "notes": "Doctor - healthcare"},
    {"front": "https://picsum.photos/200/150?random=friends", "back": "Friend - 友達 (ともだち)", "notes": "Relationship"},
    {"front": "家族", "back": "https://picsum.photos/200/150?random=family", "notes": "Family - relations"},
    {"front": "https://picsum.photos/200/150?random=house", "back": "House/Home - 家 (いえ)", "notes": "Building"},
    {"front": "学校", "back": "https://picsum.photos/200/150?random=school", "notes": "School - education"},
    {"front": "https://picsum.photos/200/150?random=hospital", "back": "Hospital - 病院 (びょういん)", "notes": "Healthcare"},
    {"front": "駅", "back": "https://picsum.photos/200/150?random=station", "notes": "Station - transportation"},
    {"front": "https://picsum.photos/200/150?random=shop", "back": "Shop/Store - 店 (みせ)", "notes": "Commerce"},
    {"front": "行く", "back": "https://via.placeholder.com/200x100?text=To+Go", "notes": "Movement verb"},
    {"front": "https://picsum.photos/200/150?random=arrival", "back": "To come - 来る (くる)", "notes": "Movement"},
    {"front": "見る", "back": "https://via.placeholder.com/200x100?text=To+See", "notes": "Perception verb"},
    {"front": "https://picsum.photos/200/150?random=listening", "back": "To hear/ask - 聞く (きく)", "notes": "Listening"},
    {"front": "話す", "back": "https://via.placeholder.com/200x100?text=To+Speak", "notes": "Communication"},
    {"front": "https://picsum.photos/200/150?random=reading", "back": "To read - 読む (よむ)", "notes": "Literacy"},
    {"front": "書く", "back": "https://via.placeholder.com/200x100?text=To+Write", "notes": "Writing"},
    {"front": "https://picsum.photos/200/150?random=shopping", "back": "To buy - 買う (かう)", "notes": "Commerce"},
    {"front": "する", "back": "https://via.placeholder.com/200x100?text=To+Do", "notes": "Action verb"},
    {"front": "https://via.placeholder.com/200x100?text=To+Become", "back": "To become - なる", "notes": "Change"},
    {"front": "大きい", "back": "https://via.placeholder.com/200x100/FF0000/FFFFFF?text=Big", "notes": "Size adjective"},
    {"front": "https://via.placeholder.com/200x100?text=Small", "back": "Small - 小さい (ちいさい)", "notes": "Size adjective"},
    {"front": "新しい", "back": "https://via.placeholder.com/200x100?text=New", "notes": "Condition adjective"},
    {"front": "https://via.placeholder.com/200x100?text=Old", "back": "Old - 古い (ふるい)", "notes": "Condition adjective"},
    {"front": "高い", "back": "https://via.placeholder.com/200x100?text=Expensive", "notes": "Value adjective"}
  ],
  "N4": [
    {"front": "https://picsum.photos/200/150?random=hurry", "back": "To hurry - 急ぐ (いそぐ)", "notes": "Speed verb"},
    {"front": "同じ", "back": "https://via.placeholder.com/200x100?text=Same", "notes": "Similarity"},
    {"front": "https://via.placeholder.com/200x100?text=Different", "back": "Different - 違う (ちがう)", "notes": "Comparison"},
    {"front": "表", "back": "https://via.placeholder.com/200x100?text=Table", "notes": "Data structure"},
    {"front": "https://via.placeholder.com/200x100?text=Necessary", "back": "Necessary - 必要 (ひつよう)", "notes": "Requirement"},
    {"front": "決める", "back": "https://via.placeholder.com/200x100?text=To+Decide", "notes": "Decision"},
    {"front": "https://via.placeholder.com/200x100?text=Danger", "back": "Danger - 危険 (きけん)", "notes": "Safety"},
    {"front": "似ている", "back": "https://via.placeholder.com/200x100?text=Resembling", "notes": "Similarity"},
    {"front": "https://via.placeholder.com/200x100?text=Reply", "back": "Reply - 返事 (へんじ)", "notes": "Communication"},
    {"front": "楽しい", "back": "https://via.placeholder.com/200x100/00FF00/000000?text=Fun", "notes": "Emotion adjective"},
    {"front": "https://via.placeholder.com/200x100?text=Sorry", "back": "Excuse me/Sorry - 失礼 (しつれい)", "notes": "Politeness"},
    {"front": "遅れる", "back": "https://via.placeholder.com/200x100?text=Late", "notes": "Timing"},
    {"front": "https://via.placeholder.com/200x100?text=Continue", "back": "To continue - 続く (つづく)", "notes": "Duration"},
    {"front": "経験", "back": "https://via.placeholder.com/200x100?text=Experience", "notes": "Noun"},
    {"front": "https://via.placeholder.com/200x100?text=Practice", "back": "Practice - 練習 (れんしゅう)", "notes": "Learning"},
    {"front": "準備", "back": "https://via.placeholder.com/200x100?text=Preparation", "notes": "Planning"},
    {"front": "https://via.placeholder.com/200x100?text=Explanation", "back": "Explanation - 説明 (せつめい)", "notes": "Communication"},
    {"front": "注意", "back": "https://via.placeholder.com/200x100?text=Attention", "notes": "Caution"},
    {"front": "https://via.placeholder.com/200x100?text=Invitation", "back": "Invitation - 招待 (しょうたい)", "notes": "Social"},
    {"front": "迷う", "back": "https://via.placeholder.com/200x100?text=Lost", "notes": "Confusion"},
    {"front": "https://via.placeholder.com/200x100?text=In+Time", "back": "To be in time - 間に合う (まにあう)", "notes": "Timing"},
    {"front": "思い出す", "back": "https://via.placeholder.com/200x100?text=Remember", "notes": "Memory"},
    {"front": "https://via.placeholder.com/200x100?text=Promise", "back": "Promise - 約束 (やくそく)", "notes": "Commitment"},
    {"front": "自由", "back": "https://via.placeholder.com/200x100?text=Freedom", "notes": "Liberty"},
    {"front": "https://via.placeholder.com/200x100?text=Quiet", "back": "Quiet - 静か (しずか)", "notes": "Sound level"},
    {"front": "特別", "back": "https://via.placeholder.com/200x100?text=Special", "notes": "Uniqueness"},
    {"front": "https://via.placeholder.com/200x100?text=Famous", "back": "Famous - 有名 (ゆうめい)", "notes": "Reputation"},
    {"front": "簡単", "back": "https://via.placeholder.com/200x100?text=Simple", "notes": "Difficulty"},
    {"front": "https://via.placeholder.com/200x100?text=Complicated", "back": "Complicated - 複雑 (ふくざつ)", "notes": "Complexity"},
    {"front": "暇", "back": "https://via.placeholder.com/200x100?text=Free+Time", "notes": "Leisure"},
    {"front": "https://via.placeholder.com/200x100?text=Wonderful", "back": "Wonderful - 素晴らしい (すばらしい)", "notes": "Quality"},
    {"front": "優しい", "back": "https://via.placeholder.com/200x100?text=Kind", "notes": "Personality"},
    {"front": "https://via.placeholder.com/200x100?text=Interesting", "back": "Interesting - 面白い (おもしろい)", "notes": "Entertainment"},
    {"front": "楽しい", "back": "https://via.placeholder.com/200x100?text=Enjoyable", "notes": "Emotion"},
    {"front": "https://via.placeholder.com/200x100?text=Important", "back": "Important - 大切 (たいせつ)", "notes": "Value"},
    {"front": "大好き", "back": "https://via.placeholder.com/200x100?text=Love", "notes": "Strong like"},
    {"front": "https://via.placeholder.com/200x100?text=Serious", "back": "Serious/Difficult - 大変 (たいへん)", "notes": "Intensity"},
    {"front": "元気", "back": "https://via.placeholder.com/200x100?text=Healthy", "notes": "Health/Energy"},
    {"front": "https://via.placeholder.com/200x100?text=Troublesome", "back": "Troublesome - 面倒 (めんどう)", "notes": "Burden"},
    {"front": "楽しい", "back": "https://via.placeholder.com/200x100/00FF00/000000?text=Fun", "notes": "Joy"},
    {"front": "https://via.placeholder.com/200x100?text=Gentle", "back": "Gentle/Kind - 優しい (やさしい)", "notes": "Personality"},
    {"front": "親切", "back": "https://via.placeholder.com/200x100?text=Helpful", "notes": "Kindness"},
    {"front": "https://via.placeholder.com/200x100/0000FF/FFFFFF?text=Large", "back": "Big/Large - 大きい (おおきい)", "notes": "Size"},
    {"front": "小さい", "back": "https://via.placeholder.com/200x100?text=Small", "notes": "Size"},
    {"front": "https://via.placeholder.com/200x100?text=High", "back": "High/Tall/Expensive - 高い (たかい)", "notes": "Measurement"},
    {"front": "安い", "back": "https://via.placeholder.com/200x100?text=Cheap", "notes": "Price"},
    {"front": "https://via.placeholder.com/200x100?text=Long", "back": "Long - 長い (ながい)", "notes": "Length"},
    {"front": "短い", "back": "https://via.placeholder.com/200x100?text=Short", "notes": "Length"},
    {"front": "https://via.placeholder.com/200x100?text=Bright", "back": "Bright/Cheerful - 明るい (あかるい)", "notes": "Light/Mood"},
    {"front": "暗い", "back": "https://via.placeholder.com/200x100?text=Dark", "notes": "Dark/Gloomy"}
  ]
};