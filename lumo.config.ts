export default {
  // Languages are managed in Settings (Admin UI)
  // These are fallback values used if database settings are not found
  languages: ['en'],
  defaultLanguage: 'en',

  media: {
    maxImageSize: 10 * 1024 * 1024,
    maxVideoSize: 100 * 1024 * 1024,
    maxAudioSize: 50 * 1024 * 1024,
    maxDocumentSize: 20 * 1024 * 1024
  }
}
