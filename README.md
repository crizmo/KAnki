# KAnki: Japanese Flashcard App for Kindle

KAnki is a spaced repetition flashcard application designed specifically for jailbroken Kindle devices. Inspired by Anki, it helps users learn Japanese vocabulary through digital flashcards with a spaced repetition system.

## ⚠️ Project Status: Under Development

**NOTE:** This project is currently in early development and doesn't work fully yet. Some features may be broken or incomplete. Actively looking for developers to contribute!

## Features

- Spaced repetition system to optimize learning
- Japanese vocabulary flashcards with JLPT levels
- Built-in default deck with basic vocabulary
- Option to download additional JLPT vocabulary from an online API
- Ability to add custom flashcards
- Filtering by JLPT level (N5-N1)
- Progress tracking

## Technical Limitations

- The app is designed for jailbroken Kindle devices with very limited browser capabilities
- Uses older ES5 JavaScript only (no modern JS features)
- Limited CSS support (no flexbox, grid, CSS variables, etc.)
- No fetch API support (uses XMLHttpRequest instead)
- Japanese font rendering requires a custom font

## Setup Instructions

### Prerequisites

- A jailbroken Kindle device
- Access to the Kindle's filesystem
- Basic knowledge of file transfer to Kindle

### Installation

1. Clone this repository or download it as a ZIP file
2. Connect your Kindle to a computer via USB
3. Create a directory on your Kindle where you want to install KAnki
4. Copy the entire contents of this repository to that directory5
5. Ensure the directory structure is preserved, especially the `assets/fonts` directory
6. Disconnect your Kindle and run the `kanki.sh` script using the terminal on your Kindle

## Running the Application

1. Download And Unzip The Latest Release, Copy assets, kanki And kanki.sh To The documents Folder On Your Kindle, Then Run!

## Development

### Project Structure

```
kanki.sh             # Startup script
assets/
  fonts/
    japanese.ttf     # Japanese font file
kanki/
  config.xml         # Application configuration
  index.html         # Main HTML file
  main.css           # Styles
  main.js            # Application logic
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
- API connectivity may be unreliable on some Kindle models
- UI rendering issues due to Kindle's limited CSS support
- Some JLPT levels may not download correctly
- Heavy lag , alert dont work

## Call for Developers

We're actively looking for developers who are interested in:

- Improving Kindle browser compatibility
- Enhancing the spaced repetition algorithm
- Adding offline vocabulary datasets
- Fixing font loading issues
- Improving the overall UI/UX within Kindle's limitations

If you're interested in contributing, please feel free to:
- Fork the repository
- Submit pull requests
- Open issues for bugs or feature suggestions
- Contact the maintainers for more information

## Acknowledgements

- Inspired by the Anki spaced repetition software
- Uses JLPT vocabulary data from the jlpt-vocab-api
- Special thanks to the Kindle jailbreak community