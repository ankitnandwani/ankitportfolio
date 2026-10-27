import { buildPhraseIndex, indexHasPhrase, tokenize } from './text.ts';
import {
  SENSITIVITY_PROFILES,
  type GuardrailOptions,
  type GuardrailProfile,
  type GuardrailSensitivity,
  type TopicClassification,
  type TopicId,
} from './types.ts';

/**
 * How much a word counts for.
 *
 * A word that only has an innocent reading counts for less, so a question
 * like "what do you think about politics" does not pass as a question about
 * the professional profile.
 */
const STRONG_WEIGHT = 1;
const WEAK_WEIGHT = 0.5;

/**
 * How much a question that only mentions Ankit counts for.
 */
const ANCHOR_WEIGHT = 0.5;

/**
 * A subject a question can be about, with the words that point at it.
 */
interface TopicDefinition {
  /**
   * The id of the subject.
   */
  id: TopicId;

  /**
   * The name of the subject, for a message that names it.
   */
  label: string;

  /**
   * The words that point at the subject.
   */
  keywords: string[];

  /**
   * The words that point at the subject, but that also have an innocent
   * reading.
   */
  weakKeywords?: string[];
}

/**
 * The subjects a question can be about.
 *
 * The list follows the goals of the assistant in PRD §28 and the source
 * types of the knowledge base: experience, skills, projects, career,
 * technologies, achievements, engineering philosophy, domains, education,
 * certifications, the professional profile, role fit and interview topics.
 */
export const TOPIC_DEFINITIONS: readonly TopicDefinition[] = [
  {
    id: 'experience',
    label: 'professional experience',
    keywords: [
      'experience',
      'worked',
      'work history',
      'responsibilities',
      'day to day',
      'roles',
      'employment',
      'years of experience',
      'involved in',
    ],
    weakKeywords: ['background'],
  },
  {
    id: 'skills',
    label: 'skills and strengths',
    keywords: [
      'skills',
      'skill',
      'strengths',
      'strongest',
      'expertise',
      'specialize',
      'specialises',
      'specializes',
      'specialization',
      'proficient',
      'good at',
      'technical areas',
      'competencies',
    ],
  },
  {
    id: 'projects',
    label: 'projects',
    keywords: [
      'projects',
      'project',
      'built',
      'developed',
      'implemented',
      'repository',
      'repos',
      'codebase',
    ],
  },
  {
    id: 'career',
    label: 'career',
    keywords: [
      'career',
      'timeline',
      'employer',
      'previous company',
      'previous role',
      'current role',
      'current company',
    ],
    weakKeywords: ['journey', 'path', 'growth'],
  },
  {
    id: 'technologies',
    label: 'technologies',
    keywords: [
      'technologies',
      'technology',
      'stack',
      'languages',
      'frameworks',
      'backend',
      'frontend',
      'rest api',
      'api testing',
      'ci cd',
      'devops',
      'cloud',
      'infrastructure',
      'automation',
      'test automation',
    ],
    weakKeywords: [
      'tools',
      'selenium',
      'java',
      'python',
      'kafka',
      'kubernetes',
      'jenkins',
      'postman',
      'github actions',
    ],
  },
  {
    id: 'achievements',
    label: 'achievements',
    keywords: [
      'achievements',
      'achievement',
      'accomplishments',
      'accomplished',
    ],
    weakKeywords: ['impact', 'outcomes', 'results'],
  },
  {
    id: 'philosophy',
    label: 'engineering philosophy',
    keywords: [
      'philosophy',
      'principles',
      'mentoring',
      'mentor',
      'code review',
      'best practices',
    ],
    weakKeywords: ['approach', 'values', 'quality'],
  },
  {
    id: 'domains',
    label: 'domains',
    keywords: [
      'domains',
      'domain',
      'industry',
      'industries',
      'sectors',
      'networking',
      'telecom',
      'telecommunications',
      'fintech',
      'banking',
      'financial services',
    ],
  },
  {
    id: 'education',
    label: 'education',
    keywords: [
      'education',
      'educational',
      'degree',
      'university',
      'college',
      'school',
      'studied',
      'graduated',
      'bachelor',
      'master',
    ],
  },
  {
    id: 'certifications',
    label: 'certifications',
    keywords: [
      'certifications',
      'certification',
      'certified',
      'certificates',
      'certificate',
    ],
  },
  {
    id: 'profile',
    label: 'professional profile',
    keywords: [
      'profile',
      'resume',
      'cv',
      'bio',
      'introduction',
      'professional background',
    ],
    weakKeywords: ['about', 'summary', 'overview', 'highlights'],
  },
  {
    id: 'job_fit',
    label: 'role fit',
    keywords: [
      'fit',
      'suitable',
      'role',
      'position',
      'job',
      'hiring',
      'recruiter',
      'candidate',
      'job description',
      'my team',
      'our team',
      'our role',
      'your team',
      'your role',
      'your position',
      'your job',
    ],
  },
  {
    id: 'interview',
    label: 'interview topics',
    keywords: [
      'interview',
      'interviewing',
      'availability',
      'questions to ask',
      'why should we hire',
      'should we hire',
    ],
  },
];

/**
 * The words that point at Ankit himself.
 *
 * A question that only mentions him still counts for something, but not
 * enough on its own in the balanced profile.
 */
const PERSONAL_ANCHORS = ['ankit', 'he', 'his', 'him'];

/**
 * The confidence a question gets for the weight it carries.
 *
 * The steps are the ones the three sensitivity levels are built on: a
 * question with one strong signal is allowed in the balanced profile, a
 * question with two is allowed in the strict one.
 */
const CONFIDENCE_STEPS: readonly { weight: number; confidence: number }[] = [
  { weight: 4, confidence: 0.95 },
  { weight: 3, confidence: 0.9 },
  { weight: 2, confidence: 0.8 },
  { weight: 1, confidence: 0.6 },
];

/**
 * The confidence a question gets when it only carries a weak signal.
 */
const WEAK_CONFIDENCE = 0.4;

/**
 * Returns the settings of a sensitivity level.
 *
 * @param sensitivity The level to look up.
 */
export function resolveProfile(
  sensitivity: GuardrailSensitivity = 'balanced'
): GuardrailProfile {
  return SENSITIVITY_PROFILES[sensitivity] ?? SENSITIVITY_PROFILES.balanced;
}

/**
 * Works out how sure a classification is.
 *
 * @param weight The weight the question carries.
 */
function confidenceFor(weight: number): number {
  if (weight <= 0) return 0;

  for (const step of CONFIDENCE_STEPS) {
    if (weight >= step.weight) return step.confidence;
  }

  return WEAK_CONFIDENCE;
}

/**
 * The longest phrase the topic keywords hold.
 */
const MAX_TOPIC_PHRASE_LENGTH = 3;

/**
 * A subject with its words already split into tokens.
 */
interface CompiledTopic {
  /**
   * The subject.
   */
  definition: TopicDefinition;

  /**
   * The tokens of the words that point at the subject.
   */
  strong: string[][];

  /**
   * The tokens of the words that point at the subject, but that also have an
   * innocent reading.
   */
  weak: string[][];
}

/**
 * The subjects with their words already split into tokens.
 *
 * The split happens once, when the module is loaded, so a question does not
 * have to pay for it.
 */
const COMPILED_TOPICS: CompiledTopic[] = TOPIC_DEFINITIONS.map((definition) => ({
  definition,
  strong: definition.keywords.map((keyword) => tokenize(keyword)),
  weak: (definition.weakKeywords ?? []).map((keyword) => tokenize(keyword)),
}));

/**
 * The signals of one subject.
 */
interface TopicSignals {
  /**
   * How much the subject matched for.
   */
  weight: number;

  /**
   * The words that matched.
   */
  keywords: string[];
}

/**
 * Finds the professional signals in a question.
 *
 * @param tokens The tokens of the question.
 * @param index The index of the phrases of the question.
 * @returns The signals of every subject that was matched.
 */
function findSignals(
  tokens: string[],
  index: Set<string>
): Map<TopicId, TopicSignals> {
  const signals = new Map<TopicId, TopicSignals>();

  for (const compiled of COMPILED_TOPICS) {
    let weight = 0;
    const keywords: string[] = [];

    for (let position = 0; position < compiled.strong.length; position++) {
      if (indexHasPhrase(index, compiled.strong[position])) {
        weight += STRONG_WEIGHT;
        keywords.push(compiled.definition.keywords[position]);
      }
    }

    for (let position = 0; position < compiled.weak.length; position++) {
      if (indexHasPhrase(index, compiled.weak[position])) {
        weight += WEAK_WEIGHT;
        keywords.push(
          (compiled.definition.weakKeywords ?? [])[position]
        );
      }
    }

    if (weight > 0) {
      signals.set(compiled.definition.id, { weight, keywords });
    }
  }

  return signals;
}

/**
 * Reports whether a question mentions Ankit.
 *
 * @param tokens The tokens of the question.
 */
function hasPersonalAnchor(tokens: string[]): boolean {
  return tokens.some((token) => PERSONAL_ANCHORS.includes(token));
}

/**
 * Classifies a question as professional or off topic.
 *
 * The classification is keyword based, which keeps it fast enough to run on
 * every question and keeps it free of a model call (PRD §35 asks for a
 * lightweight first layer).
 *
 * @param query The question to classify.
 * @param options The sensitivity and the other options.
 * @returns What the question is about and how sure that is.
 */
export function classifyTopic(
  query: string,
  options: GuardrailOptions = {}
): TopicClassification {
  const profile = resolveProfile(options.sensitivity);
  const tokens = tokenize(query);
  const index = buildPhraseIndex(tokens, MAX_TOPIC_PHRASE_LENGTH);
  const signals = findSignals(tokens, index);

  let weight = 0;
  let bestTopic: TopicId = 'off_topic';
  let bestWeight = 0;

  for (const definition of TOPIC_DEFINITIONS) {
    const topicSignals = signals.get(definition.id);
    if (!topicSignals) continue;

    weight += topicSignals.weight;

    if (topicSignals.weight > bestWeight) {
      bestWeight = topicSignals.weight;
      bestTopic = definition.id;
    }
  }

  if (hasPersonalAnchor(tokens)) weight += ANCHOR_WEIGHT;

  const confidence = confidenceFor(weight);
  const isAllowed = confidence >= profile.topicThreshold;

  if (!isAllowed) {
    return {
      isAllowed: false,
      topic: 'off_topic',
      name: 'off topic',
      confidence,
      matches: [],
      reason:
        weight === 0
          ? 'the question does not mention anything about the professional profile'
          : `the question carries ${weight} in professional signal, which is not enough for the ${options.sensitivity ?? 'balanced'} profile`,
    };
  }

  if (bestTopic === 'off_topic') {
    return {
      isAllowed: true,
      topic: 'profile',
      name: 'professional profile',
      confidence,
      matches: [],
      reason: 'the question mentions Ankit without naming a subject',
    };
  }

  const definition = TOPIC_DEFINITIONS.find(
    (candidate) => candidate.id === bestTopic
  );

  return {
    isAllowed: true,
    topic: bestTopic,
    name: definition?.label ?? 'professional profile',
    confidence,
    matches: signals.get(bestTopic)?.keywords ?? [],
    reason: `the question carries ${weight} in professional signal`,
  };
}
