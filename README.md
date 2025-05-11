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
- **Error review mode**: Review cards you answered incorrectly right after completing a session
- **Centralized configuration**: Easy customization through a single configuration file

## Technical Limitations

- The app is designed for jailbroken Kindle devices with very limited browser capabilities
- Uses older ES5 JavaScript only (no modern JS features)
- Limited CSS support (no flexbox, grid, CSS variables, etc.)

## Setup Instructions

## Prerequisites

- A jailbroken Kindle device
- Access to the Kindle's filesystem
- Basic knowledge of file transfer to Kindle

## How to Install KAnki ( New Users )
1. Clone this repository or download it as a ZIP file
2. Connect your Kindle to a computer via USB
3. Unzip the downloaded file (Make sure the name is KAnki) 
4. Copy the KAnki folder and the `kanki.sh` script to the `documents` folder on your Kindle
5. Open the `kanki/js/kanki_config.js` file and edit the configuration to match your language.
6. Download or convert a TTF font file that supports your target language. Rename it to `language.ttf` and place it in:
   ```
   kanki/assets/fonts/language.ttf
   ```
7. Disconnect your Kindle from the computer
8. Open the Kindle's home screen and run the KAnki app

## 🔧 How to Update ( New Users ignore this )

1. Back up your current `kanki/js/vocabulary.js` or `kanki/js/kanki_config.js` file if you have been using KAnki, ignore if you are a new user
2. Download the new KAnki release
3. Replace your old KAnki folder with the new one
4. Copy your vocabulary data to the new `kanki/js/kanki_config.js` file
5. Optional: Customize language settings in `kanki_config.js`
6. Copy your `language.ttf` font file to the new `kanki/assets/fonts/language.ttf` location
7. Disconnect your Kindle from the computer
8. Open the Kindle's home screen and run the KAnki app
9. Hit the `Update` button in the app to apply changes
10. Done! Your KAnki app is now updated with the latest features

## Customizing for Your Language

KAnki makes it easy to study any language by changing just a few files:

### 1. Prepare the font for your target language

Download or convert a TTF font file that supports your target language. Rename it to `language.ttf` and place it in:
```
kanki/assets/fonts/language.ttf
```

### 2. Update the configuration file

Edit `kanki/js/kanki_config.js` to include your language configuration and vocabulary:

```javascript
/**
 * KAnki Configuration
 * Edit these settings to customize the app for your language
 */
var KANKI_CONFIG = {
  language: "Spanish",  // Change this to your language name
  levels: ["A1", "A2", "B1"]   // These should match the keys in your VOCABULARY object
};

/**
 * Vocabulary Data
 * Organized by proficiency level
 */
var VOCABULARY = {
  "A1": [
    {"front": "hello", "back": "hola", "notes": "Greeting"},
    // Add more words...
  ],
  "A2": [
    {"front": "tomorrow", "back": "mañana", "notes": "Time"},
    // Add more words...
  ],
  // Add more levels...
};
```

For languages with different writing systems, use the `reading` property:

```javascript
{"front": "こんにちは", "reading": "konnichiwa", "back": "Hello", "notes": "Greeting"}
```

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
    kanki_config.js  # Language configuration and vocabulary
    polyfill.min.js  # ES5 polyfills
    sdk.js           # Kindle-specific functions
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
