# KAnki: Universal Flashcard App for Kindle

KAnki is a spaced repetition flashcard application designed specifically for jailbroken Kindle devices. It helps users learn vocabulary in any language through digital flashcards with a spaced repetition system.
> Huge thanks to [PolishPenguin](https://github.com/polish-penguin-dev) for lending a hand — couldn't do it without them!


## ⚠️ Project Status: Active Development

**NOTE:** This project is now functional, with universal language support and key features like vocabulary flashcards and level filtering working as intended. Contributions are still welcome to enhance the app further!

## Features

- **Universal language support**: Learn any language by simply changing the font and vocabulary
- Spaced repetition system to optimize learning
- Customizable vocabulary flashcards with any proficiency levels
- Filtering by level (JLPT, CEFR, HSK, or any custom system)
- Progress tracking

## Technical Limitations

- The app is designed for jailbroken Kindle devices with very limited browser capabilities
- Uses older ES5 JavaScript only (no modern JS features)
- Limited CSS support (no flexbox, grid, CSS variables, etc.)

## Setup Instructions

### Prerequisites

- A jailbroken Kindle device
- Access to the Kindle's filesystem
- Basic knowledge of file transfer to Kindle

### Running the Application

1. Clone this repository or download it as a ZIP file
2. Connect your Kindle to a computer via USB
3. Unzip the downloaded file (Make sure the name is KAnki) 
4. Copy the KAnki folder and the `kanki.sh` script to the `documents` folder on your Kindle
5. And done! Disconnect your Kindle from the computer
6. Open the Kindle's home screen and run the KAnki app

## Customizing for Your Language

KAnki makes it easy to study any language by changing just a few files:

### 1. Prepare the font for your target language

Download or convert a TTF/OTF font file that supports your target language. Rename it to `language.ttf` and place it in:
```
kanki/assets/fonts/language.ttf
```

### 2. Update the vocabulary file

Edit `kanki/js/vocabulary.js` to include vocabulary for your target language:

```javascript
/**
 * Vocabulary Data for KAnki
 * Organized by proficiency level
 */
var VOCABULARY = {
  "A1": [
    {"front": "hello", "back": "hola", "notes": "Greeting"},
    {"front": "thank you", "back": "gracias", "notes": "Gratitude"},
    // Add more words...
  ],
  "A2": [
    {"front": "tomorrow", "back": "mañana", "notes": "Time"},
    {"front": "yesterday", "back": "ayer", "notes": "Time"},
    // Add more words...
  ]
};
```

For languages with different writing systems, use the `reading` property:

```javascript
{"front": "こんにちは", "reading": "konnichiwa", "back": "Hello", "notes": "Greeting"}
```

### 3. Configure language settings

Open `kanki/main.js` and update these two variables:

```javascript
var appLanguage = "Spanish"; // Change to your language name
var appLevels = ["A1", "A2", "B1"]; // Change to match your vocabulary levels
```

That's it! KAnki will automatically:
- Load your language font
- Generate level buttons based on your defined levels
- Display cards with proper formatting for your language

## Development

### Project Structure

```
kanki.sh             # Startup script
kanki/
  config.xml         # Application configuration
  index.html         # Main HTML file
  main.css           # Styles
  main.js            # Application logic
  assets/
    fonts/
      language.ttf     # Language font file
  js/
    polyfill.min.js  # ES5 polyfills
    sdk.js           # Kindle-specific functions
    vocabulary.js    # Default vocabulary
```

### Technical Details

- The app uses ES5 JavaScript for compatibility with Kindle's older browser
- XMLHttpRequest is used instead of fetch for API calls
- Custom language fonts are supported for proper character rendering
- Local storage is used to save flashcard progress

## Known Issues

- Font not loading properly in some cases
- UI rendering issues due to Kindle's limited CSS support

## Acknowledgements

- Inspired by the Anki spaced repetition software
- Special thanks to the Kindle jailbreak community
