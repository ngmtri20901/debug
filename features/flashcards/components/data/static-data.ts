/**
 * Static flashcard data - Topics, Word Types, and Others
 * Extracted from page.tsx for better organization and reusability
 */

// Static topics data with counts (from MongoDB analysis)
// IDs updated to match backend database topic ID generation
export const STATIC_TOPICS = [
  {
    id: "society-and-the-world",
    title: "Society & the World",
    description: "Society, politics, and global affairs",
    counts: { all: 351, simple: 234, complex: 117 },
    imageUrl: "/images/flashcards/SocietyTheWorld.webp"
  },
  {
    id: "business-and-work",
    title: "Business & Work",
    description: "Business vocabulary and workplace terms", 
    counts: { all: 310, simple: 251, complex: 59 },
    imageUrl: "/images/flashcards/BusinessWork.webp"
  },
  {
    id: "education-and-learning",
    title: "Education & Learning", 
    description: "Educational terms and learning vocabulary",
    counts: { all: 267, simple: 149, complex: 118 },
    imageUrl: "/images/flashcards/EducationLearning.webp"
  },
  {
    id: "art-culture-and-history",
    title: "Art, Culture & History", 
    description: "Arts, culture, and Vietnamese history",
    counts: { all: 244, simple: 128, complex: 116 },
    imageUrl: "/images/flashcards/ArtCulture.webp"
  },
  {
    id: "communication-and-relationships", 
    title: "Communication & Relationships",
    description: "Communication and interpersonal relationships",
    counts: { all: 215, simple: 154, complex: 61 },
    imageUrl: "/images/flashcards/Communication.webp"
  },
  {
    id: "nature-environment-and-geography", 
    title: "Nature, Environment & Geography",
    description: "Nature, environment, and geography terms",
    counts: { all: 207, simple: 149, complex: 58 },
    imageUrl: "/images/flashcards/Environment.webp"
  },
  {
    id: "emotions-and-psychology",
    title: "Emotions & Psychology",
    description: "Emotional states and psychological concepts", 
    counts: { all: 159, simple: 74, complex: 85 },
    imageUrl: "/images/flashcards/EmotionsPsychology.webp"
  },
  {
    id: "health-and-lifestyle", 
    title: "Health & Lifestyle",
    description: "Health, wellness, and lifestyle vocabulary",
    counts: { all: 133, simple: 105, complex: 28 },
    imageUrl: "/images/flashcards/HealthLifestyle.webp"
  },
  {
    id: "science-technology-and-innovation",
    title: "Science, Technology & Innovation", 
    description: "Science, technology, and innovation vocabulary",
    counts: { all: 126, simple: 102, complex: 24 },
    imageUrl: "/images/flashcards/ScienceTechnology.webp"
  },
  {
    id: "home-family-and-activities",
    title: "Home, Family & Activities", 
    description: "Family, home life, and daily activities",
    counts: { all: 114, simple: 83, complex: 31 },
    imageUrl: "/images/flashcards/HomeFamily.webp"
  },
  {
    id: "shopping-and-consumer-life",
    title: "Shopping & Consumer Life",
    description: "Shopping and consumer-related terms", 
    counts: { all: 67, simple: 58, complex: 9 },
    imageUrl: "/images/flashcards/Shopping.webp"
  },
  {
    id: "travel-and-transportation",
    title: "Travel & Transportation", 
    description: "Travel and transportation vocabulary",
    counts: { all: 65, simple: 55, complex: 10 },
    imageUrl: "/images/flashcards/TravelTransport.webp"
  },
  {
    id: "food-and-cooking",
    title: "Food & Cooking",
    description: "Food, cooking, and culinary terms",
    counts: { all: 60, simple: 41, complex: 19 },
    imageUrl: "/images/flashcards/FoodCooking.webp"
  },
  {
    id: "others",
    title: "Others",
    description: "Miscellaneous vocabulary and expressions",
    counts: { all: 47, simple: 41, complex: 6 },
    imageUrl: "/images/flashcards/Others.webp"
  }
] as const

// Static word types data with counts (from MongoDB analysis)
export const STATIC_WORD_TYPES = [
  {
    id: "adj",
    name: "ADJ", 
    title: "Adjectives",
    description: "Descriptive words and qualities",
    counts: { all: 1042, simple: 680, complex: 362 },
    imageUrl: "/images/flashcards/Adjective.webp"
  },
  {
    id: "adv",
    name: "ADV",
    title: "Adverbs", 
    description: "Words that modify verbs and adjectives",
    counts: { all: 137, simple: 128, complex: 9 },
    imageUrl: "/images/flashcards/Adverb.webp"
  },
  {
    id: "conj", 
    name: "CONJ",
    title: "Conjunctions",
    description: "Connecting words and phrases",
    counts: { all: 71, simple: 61, complex: 10 },
    imageUrl: "/images/flashcards/Conjunction.webp"
  },
  {
    id: "noun",
    name: "NOUN", 
    title: "Nouns",
    description: "People, places, things, and concepts",
    counts: { all: 2051, simple: 1487, complex: 564 },
    imageUrl: "/images/flashcards/Noun.webp"
  },
  {
    id: "prep",
    name: "PREP",
    title: "Prepositions", 
    description: "Words showing relationships",
    counts: { all: 3, simple: 3, complex: 0 },
    imageUrl: "/images/flashcards/Preposition.webp"
  },
  {
    id: "pronn",
    name: "PRONN", 
    title: "Pronouns",
    description: "Words that replace nouns",
    counts: { all: 55, simple: 54, complex: 1 },
    imageUrl: "/images/flashcards/Pronoun.webp"
  },
  {
    id: "verb",
    name: "VERB",
    title: "Verbs", 
    description: "Action words and states of being",
    counts: { all: 1552, simple: 1133, complex: 419 },
    imageUrl: "/images/flashcards/Verb.webp"
  }
] as const

// Static others data with counts (from MongoDB analysis)
export const STATIC_OTHERS = [
  {
    id: "multi-meaning",
    title: "Multi-meaning Words", 
    description: "Words with multiple meanings",
    counts: { all: 543, simple: 488, complex: 55 },
    imageUrl: "/images/flashcards/Others.webp"
  },
  {
    id: "multi-word", 
    title: "Multi-word Expressions",
    description: "Common multi-word Vietnamese expressions",
    counts: { all: 1730, simple: 833, complex: 897 },
    imageUrl: "/images/flashcards/Communication.webp"
  }
] as const

// Helper function to convert static topic data to API format
export function convertToTopicFormat(
  staticTopic: typeof STATIC_TOPICS[number], 
  complexity: string = "all"
) {
  return {
    id: staticTopic.id,
    title: staticTopic.title,
    description: staticTopic.description,
    count: staticTopic.counts[complexity as keyof typeof staticTopic.counts],
    imageUrl: staticTopic.imageUrl
  }
}

// Helper function to convert static word type data to API format
export function convertToWordTypeFormat(
  staticWordType: typeof STATIC_WORD_TYPES[number], 
  complexity: string = "all"
) {
  return {
    id: staticWordType.id,
    name: staticWordType.name,
    title: staticWordType.title,
    description: staticWordType.description,
    count: staticWordType.counts[complexity as keyof typeof staticWordType.counts],
    imageUrl: staticWordType.imageUrl
  }
}

// Calculate total complexity counts from all static data
export function calculateTotalComplexityCounts() {
  return {
    all: STATIC_TOPICS.reduce((sum, topic) => sum + topic.counts.all, 0) +
         STATIC_WORD_TYPES.reduce((sum, wordType) => sum + wordType.counts.all, 0) +
         STATIC_OTHERS.reduce((sum, other) => sum + other.counts.all, 0),
    simple: STATIC_TOPICS.reduce((sum, topic) => sum + topic.counts.simple, 0) +
            STATIC_WORD_TYPES.reduce((sum, wordType) => sum + wordType.counts.simple, 0) +
            STATIC_OTHERS.reduce((sum, other) => sum + other.counts.simple, 0),
    complex: STATIC_TOPICS.reduce((sum, topic) => sum + topic.counts.complex, 0) +
             STATIC_WORD_TYPES.reduce((sum, wordType) => sum + wordType.counts.complex, 0) +
             STATIC_OTHERS.reduce((sum, other) => sum + other.counts.complex, 0)
  }
}
