/**
 * KAnki Configuration
 * Edit these settings to customize the app for your language
 */
var KANKI_CONFIG = {
  language: "Japanese",  // Change this to your language name
  levels: ["N5", "N4"]   // These should match the keys in your VOCABULARY object
};

/**
 * JLPT Vocabulary Data
 * Organized by JLPT level
 */
var VOCABULARY = {
  "N5": [
    {"front": "こんにちは", "back": "Hello", "notes": "Greeting"},
    {"front": "ありがとう", "back": "Thank you", "notes": "Gratitude"},
    {"front": "さようなら", "back": "Goodbye", "notes": "Parting"},
    {"front": "はい", "back": "Yes", "notes": "Affirmation"},
    {"front": "いいえ", "back": "No", "notes": "Negation"},
    {"front": "お願いします", "back": "Please", "notes": "Request"},
    {"front": "すみません", "back": "Excuse me / Sorry", "notes": "Apology"},
    {"front": "いくらですか", "back": "How much is it?", "notes": "Question"},
    {"front": "わかりません", "back": "I don't understand", "notes": "Phrase"},
    {"front": "あなた", "back": "You", "notes": "Pronoun"},
    {"front": "水", "reading": "みず", "back": "Water", "notes": "Noun"},
    {"front": "人", "reading": "ひと", "back": "Person", "notes": "Noun"},
    {"front": "本", "reading": "ほん", "back": "Book", "notes": "Noun"},
    {"front": "一", "reading": "いち", "back": "One", "notes": "Number"},
    {"front": "二", "reading": "に", "back": "Two", "notes": "Number"},
    {"front": "三", "reading": "さん", "back": "Three", "notes": "Number"},
    {"front": "四", "reading": "よん", "back": "Four", "notes": "Number"},
    {"front": "五", "reading": "ご", "back": "Five", "notes": "Number"},
    {"front": "食べる", "reading": "たべる", "back": "To eat", "notes": "Verb"},
    {"front": "飲む", "reading": "のむ", "back": "To drink", "notes": "Verb"},
    {"front": "おはよう", "back": "Good morning", "notes": "Greeting"},
    {"front": "こんばんは", "back": "Good evening", "notes": "Greeting"},
    {"front": "おやすみ", "back": "Good night", "notes": "Greeting"},
    {"front": "名前", "reading": "なまえ", "back": "Name", "notes": "Noun"},
    {"front": "日本", "reading": "にほん", "back": "Japan", "notes": "Noun"},
    {"front": "学生", "reading": "がくせい", "back": "Student", "notes": "Noun"},
    {"front": "先生", "reading": "せんせい", "back": "Teacher", "notes": "Noun"},
    {"front": "医者", "reading": "いしゃ", "back": "Doctor", "notes": "Noun"},
    {"front": "友達", "reading": "ともだち", "back": "Friend", "notes": "Noun"},
    {"front": "家族", "reading": "かぞく", "back": "Family", "notes": "Noun"},
    {"front": "家", "reading": "いえ", "back": "House/Home", "notes": "Noun"},
    {"front": "学校", "reading": "がっこう", "back": "School", "notes": "Noun"},
    {"front": "病院", "reading": "びょういん", "back": "Hospital", "notes": "Noun"},
    {"front": "駅", "reading": "えき", "back": "Station", "notes": "Noun"},
    {"front": "店", "reading": "みせ", "back": "Shop/Store", "notes": "Noun"},
    {"front": "行く", "reading": "いく", "back": "To go", "notes": "Verb"},
    {"front": "来る", "reading": "くる", "back": "To come", "notes": "Verb"},
    {"front": "見る", "reading": "みる", "back": "To see", "notes": "Verb"},
    {"front": "聞く", "reading": "きく", "back": "To hear/ask", "notes": "Verb"},
    {"front": "話す", "reading": "はなす", "back": "To speak", "notes": "Verb"},
    {"front": "読む", "reading": "よむ", "back": "To read", "notes": "Verb"},
    {"front": "書く", "reading": "かく", "back": "To write", "notes": "Verb"},
    {"front": "買う", "reading": "かう", "back": "To buy", "notes": "Verb"},
    {"front": "する", "back": "To do", "notes": "Verb"},
    {"front": "なる", "back": "To become", "notes": "Verb"},
    {"front": "大きい", "reading": "おおきい", "back": "Big", "notes": "Adjective"},
    {"front": "小さい", "reading": "ちいさい", "back": "Small", "notes": "Adjective"},
    {"front": "新しい", "reading": "あたらしい", "back": "New", "notes": "Adjective"},
    {"front": "古い", "reading": "ふるい", "back": "Old", "notes": "Adjective"},
    {"front": "高い", "reading": "たかい", "back": "Expensive/Tall", "notes": "Adjective"}
  ],
  "N4": [
    {"front": "急ぐ", "reading": "いそぐ", "back": "To hurry", "notes": "Verb"},
    {"front": "同じ", "reading": "おなじ", "back": "Same", "notes": "Adjective"},
    {"front": "違う", "reading": "ちがう", "back": "Different", "notes": "Verb"},
    {"front": "表", "reading": "ひょう", "back": "Table/Chart", "notes": "Noun"},
    {"front": "必要", "reading": "ひつよう", "back": "Necessary", "notes": "Na-Adjective"},
    {"front": "決める", "reading": "きめる", "back": "To decide", "notes": "Verb"},
    {"front": "危険", "reading": "きけん", "back": "Danger", "notes": "Na-Adjective"},
    {"front": "似ている", "reading": "にている", "back": "Resembling", "notes": "Verb"},
    {"front": "返事", "reading": "へんじ", "back": "Reply", "notes": "Noun"},
    {"front": "楽しい", "reading": "たのしい", "back": "Fun", "notes": "Adjective"},
    {"front": "失礼", "reading": "しつれい", "back": "Excuse me/Sorry", "notes": "Na-Adjective"},
    {"front": "遅れる", "reading": "おくれる", "back": "To be late", "notes": "Verb"},
    {"front": "続く", "reading": "つづく", "back": "To continue", "notes": "Verb"},
    {"front": "経験", "reading": "けいけん", "back": "Experience", "notes": "Noun"},
    {"front": "練習", "reading": "れんしゅう", "back": "Practice", "notes": "Noun/Suru-verb"},
    {"front": "準備", "reading": "じゅんび", "back": "Preparation", "notes": "Noun/Suru-verb"},
    {"front": "説明", "reading": "せつめい", "back": "Explanation", "notes": "Noun/Suru-verb"},
    {"front": "注意", "reading": "ちゅうい", "back": "Attention/Caution", "notes": "Noun/Suru-verb"},
    {"front": "招待", "reading": "しょうたい", "back": "Invitation", "notes": "Noun/Suru-verb"},
    {"front": "迷う", "reading": "まよう", "back": "To get lost/hesitate", "notes": "Verb"},
    {"front": "間に合う", "reading": "まにあう", "back": "To be in time", "notes": "Verb"},
    {"front": "思い出す", "reading": "おもいだす", "back": "To remember", "notes": "Verb"},
    {"front": "約束", "reading": "やくそく", "back": "Promise", "notes": "Noun/Suru-verb"},
    {"front": "自由", "reading": "じゆう", "back": "Freedom", "notes": "Na-Adjective"},
    {"front": "静か", "reading": "しずか", "back": "Quiet", "notes": "Na-Adjective"},
    {"front": "特別", "reading": "とくべつ", "back": "Special", "notes": "Na-Adjective"},
    {"front": "有名", "reading": "ゆうめい", "back": "Famous", "notes": "Na-Adjective"},
    {"front": "簡単", "reading": "かんたん", "back": "Simple/Easy", "notes": "Na-Adjective"},
    {"front": "複雑", "reading": "ふくざつ", "back": "Complicated", "notes": "Na-Adjective"},
    {"front": "暇", "reading": "ひま", "back": "Free time", "notes": "Na-Adjective"},
    {"front": "素晴らしい", "reading": "すばらしい", "back": "Wonderful", "notes": "Adjective"},
    {"front": "優しい", "reading": "やさしい", "back": "Kind", "notes": "Adjective"},
    {"front": "面白い", "reading": "おもしろい", "back": "Interesting", "notes": "Adjective"},
    {"front": "楽しい", "reading": "たのしい", "back": "Enjoyable", "notes": "Adjective"},
    {"front": "大切", "reading": "たいせつ", "back": "Important", "notes": "Na-Adjective"},
    {"front": "大好き", "reading": "だいすき", "back": "Love (like very much)", "notes": "Na-Adjective"},
    {"front": "大変", "reading": "たいへん", "back": "Serious/Difficult", "notes": "Na-Adjective"},
    {"front": "元気", "reading": "げんき", "back": "Healthy/Energetic", "notes": "Na-Adjective"},
    {"front": "面倒", "reading": "めんどう", "back": "Troublesome", "notes": "Na-Adjective"},
    {"front": "楽しい", "reading": "たのしい", "back": "Fun", "notes": "Adjective"},
    {"front": "優しい", "reading": "やさしい", "back": "Gentle/Kind", "notes": "Adjective"},
    {"front": "親切", "reading": "しんせつ", "back": "Kind/Helpful", "notes": "Na-Adjective"},
    {"front": "大きい", "reading": "おおきい", "back": "Big/Large", "notes": "Adjective"},
    {"front": "小さい", "reading": "ちいさい", "back": "Small/Little", "notes": "Adjective"},
    {"front": "高い", "reading": "たかい", "back": "High/Tall/Expensive", "notes": "Adjective"},
    {"front": "安い", "reading": "やすい", "back": "Cheap/Inexpensive", "notes": "Adjective"},
    {"front": "長い", "reading": "ながい", "back": "Long", "notes": "Adjective"},
    {"front": "短い", "reading": "みじかい", "back": "Short", "notes": "Adjective"},
    {"front": "明るい", "reading": "あかるい", "back": "Bright/Cheerful", "notes": "Adjective"},
    {"front": "暗い", "reading": "くらい", "back": "Dark/Gloomy", "notes": "Adjective"}
  ]
};
