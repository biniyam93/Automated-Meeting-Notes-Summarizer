# Meeting Notes Summarizer

![Project Screenshot](static/screenshot.png) <!-- Add a screenshot if available -->

An AI-powered web application that automatically transcribes and summarizes meeting recordings into concise notes.

## Features

- 🎙️ Audio file upload (MP3, WAV, M4A)
- ✍️ Automatic transcription using AssemblyAI
- 📝 AI-powered summarization using Gemini Pro
- 📋 Clean, formatted output with key points
- 📱 Responsive design (works on mobile & desktop)
- 📋 Copy-to-clipboard functionality

## Technologies Used

### Frontend
- HTML5, CSS3, JavaScript
- Tailwind CSS for styling
- Drag-and-drop file upload

### Backend
- Python 3
- Flask web framework
- AssemblyAI API (speech-to-text)
- Google Gemini API (text summarization)

## Installation

### Prerequisites
- Python 3.8+
- Node.js (for optional frontend builds)
- Google Gemini API key
- AssemblyAI API key

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/meeting-notes-summarizer.git
   cd meeting-notes-summarizer
