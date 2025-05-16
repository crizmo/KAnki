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
- **Star/favorite system**: Mark important cards and filter by starred items
- **Reversible cards**: Switch between target language → native and native → target language modes
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
10. Done! Your KAnki app is now updated with the latest features including the new star/favorite functionality

**Note for users updating to the starred cards version**: When updating from a previous version without the star functionality, all your existing cards will initially be unstarred. You'll need to manually star your important cards after updating.

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
- Card objects include a `starred` property that persists with the deck data

## Known Issues

- Font not loading properly in some cases
- UI rendering issues due to Kindle's limited CSS support

## Acknowledgements

- Inspired by the Anki spaced repetition software
- Special thanks to the Kindle jailbreak community

## Using the Star/Favorite Card Feature

KAnki now includes the ability to star or favorite important cards and filter by your starred items:

### How to Star Cards

1. When viewing a flashcard, you'll notice a star button (☆) in the top-left corner of the card
2. Tap the star button to mark a card as a favorite - the star will fill (★) to indicate it's starred
3. Tap again to unstar the card
4. A toast notification will confirm when you star or unstar a card

### Filtering by Starred Cards

1. In the level selection area, there's now a "★ Starred" button along with the regular level filters
2. Tap this button to show only your starred cards
3. The level display will show "(Starred Only)" when the filter is active
4. You can combine this with level filters to show only starred cards within a specific level
5. Tap the button again to turn off the starred filter and show all cards

### Additional Notes

- Star status persists even when resetting progress (but is cleared with "Reset All Data")
- The star filter works alongside the existing level filter system
- Starring cards is particularly useful for:
  - Marking difficult words you want to focus on
  - Creating a custom subset of vocabulary for intensive study
  - Flagging cards you want to review more frequently

## Using the Card Reversal Feature

KAnki now includes the ability to reverse your flashcards, allowing you to practice in both directions:

### How to Use Card Reversal

1. In the level selection area, there's now a "↔ Reverse" button
2. Tap this button to toggle between:
   - **Normal Mode** (Target → Native): Shows the target language on the front and your native language on the back
   - **Reversed Mode** (Native → Target): Shows your native language on the front and the target language on the back
3. A toast notification will confirm when you change modes
4. The level display will indicate which mode you're in with "Target → Native" or "Native → Target"

### Additional Notes

- Card reversal mode works with all other features, including:
  - Level filtering
  - Star/favorite filtering
  - Error review mode
- The reversal setting is reset when using "Reset All Data"

## Todo
Per-card stats showing how many times each card has been seen and when it was last reviewed
