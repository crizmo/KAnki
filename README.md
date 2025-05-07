# KAnki: Japanese Flashcard App for Kindle

KAnki is a spaced repetition flashcard application designed specifically for jailbroken Kindle devices. Inspired by Anki, it helps users learn Japanese vocabulary through digital flashcards with a spaced repetition system.
> Huge thanks to [PolishPenguin](https://github.com/polish-penguin-dev) for lending a hand — couldn’t do it without them!


## ⚠️ Project Status: Active Development

**NOTE:** This project is now functional, with key features like vocabulary flashcards and JLPT level filtering working as intended. Contributions are still welcome to enhance the app further!

## Features

- Spaced repetition system to optimize learning
- Japanese vocabulary flashcards with JLPT levels (N5-N4 included by default)
- Built-in default deck with 100 vocabulary words (50 N5 and 50 N4)
- Filtering by JLPT level (N5-N4)
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
3. Unzip the downloaded file ( Make sure the name is KAnki ) 
4. Copy the KAnki folder and the `kanki.sh` script to the `documents` folder on your Kindle
5. And done ! Disconnect your Kindle from the computer
6. Open the Kindle's home screen and run the KAnki app

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
      japanese.ttf     # Japanese font file
  js/
    polyfill.min.js  # ES5 polyfills
    sdk.js           # Kindle-specific functions
    vocabulary.js    # Default vocabulary
```

### Technical Details

- The app uses ES5 JavaScript for compatibility with Kindle's older browser
- XMLHttpRequest is used instead of fetch for API calls
- A custom Japanese font is included for proper character rendering
- Local storage is used to save flashcard progress

## Known Issues

- Japanese font not loading properly.
- UI rendering issues due to Kindle's limited CSS support

## Acknowledgements

- Inspired by the Anki spaced repetition software
- Special thanks to the Kindle jailbreak community
