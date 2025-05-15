// Mock avatar configuration data to simulate backend responses
export const mockAvatarConfig = {
  id: "av-001",
  userId: "1",
  name: "My AI Avatar",
  isActive: true,
  isTraining: false,
  trainingProgress: 0,
  lastTrainingDate: "2023-05-01T10:30:00Z",
  
  // Tone settings
  toneSettings: {
    primaryTone: "friendly",
    casualToFormalRatio: 65,
    enthusiasmLevel: 75,
    useEmojis: true,
    responseLength: 2 // 1=short, 2=medium, 3=long
  },
  
  // Response style
  responseStyle: {
    isShortAndDirect: false,
    isDetailedAndThorough: true,
    isEmojiHeavy: false,
    forbiddenPhrases: [
      "obviously",
      "as I said before",
      "you should know",
      "I already told you"
    ],
    preferredPhrases: [
      "Thanks for asking!",
      "Great question!",
      "I appreciate your message",
      "Feel free to reach out again"
    ],
    maxCharacters: 300
  },
  
  // Moderation settings
  moderationRules: {
    blockOffensiveLanguage: true,
    routePersonalQuestions: true,
    blockPoliticalTopics: false,
    customBlockedKeywords: [
      "spam",
      "affiliate link",
      "discount code"
    ],
    customRoutedKeywords: [
      "collaboration",
      "business",
      "sponsor",
      "payment"
    ]
  },
  
  // Connected platforms
  connectedPlatforms: {
    instagram: true,
    youtube: true
  }
};