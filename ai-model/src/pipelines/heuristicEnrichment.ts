import { ActivityEnrichmentResponse } from '../schemas/activityEnrichment.schema.js';

const SKILLS_MAP: { [key: string]: RegExp } = {
  'TypeScript': /\b(typescript|ts)\b/i,
  'JavaScript': /\b(javascript|js)\b/i,
  'React': /\b(react|reactjs|jsx|tsx)\b/i,
  'Node.js': /\b(node|nodejs)\b/i,
  'Express': /\b(express|expressjs)\b/i,
  'NestJS': /\bnestjs\b/i,
  'MongoDB': /\b(mongo|mongodb|mongoose)\b/i,
  'PostgreSQL': /\b(postgres|postgresql|psql)\b/i,
  'Redis': /\b(redis|ioredis)\b/i,
  'Docker': /\bdocker\b/i,
  'Kubernetes': /\b(kubernetes|k8s)\b/i,
  'AWS': /\b(aws|amazon web services|s3|ec2|lambda)\b/i,
  'Python': /\b(python|py)\b/i,
  'Go': /\b(golang|go)\b/i,
  'GraphQL': /\bgraphql\b/i,
  'REST API': /\b(rest|restful|api|endpoints?)\b/i,
  'Kafka': /\bkafka\b/i,
  'RabbitMQ': /\brabbitmq\b/i,
  'BullMQ': /\bbullmq\b/i,
  'JWT': /\b(jwt|json web token|tokens?)\b/i,
  'OAuth': /\boauth\b/i,
  'TailwindCSS': /\btailwind(css)?\b/i,
  'CSS': /\b(css|styling|sass|scss)\b/i,
  'HTML': /\bhtml\b/i,
  'Next.js': /\bnextjs|next\.js\b/i,
  'Vite': /\bvite\b/i,
  'Jest': /\bjest\b/i,
  'Vitest': /\bvitest\b/i,
  'Pinecone': /\bpinecone\b/i,
  'Vector DB': /\b(vector\s*db|vector\s*store|embeddings?)\b/i,
  'LLM': /\b(llm|gemini|openai|claude|rag)\b/i,
  'CI/CD': /\b(ci\/cd|pipeline|github actions)\b/i,
  'Git': /\b(git|github|gitlab)\b/i,
  'Linux': /\b(linux|ubuntu|bash|shell)\b/i,
  'Performance Tuning': /\b(latency|profiling|throughput|memory leak|bottleneck)\b/i,
  'System Design': /\b(architecture|system design|scalability|microservices)\b/i,
};

const CATEGORY_RULES: { category: ActivityEnrichmentResponse['category']; regex: RegExp }[] = [
  {
    category: 'Production Issue',
    regex: /\b(outage|downtime|incident|production|sev-?1|sev-?2|p0|p1|post-?mortem|rollback)\b/i,
  },
  {
    category: 'Bug Fix',
    regex: /\b(fix(ed|es|ing)?|bugs?|patch(ed|es)?|errors?|crash(ed|es)?|issues?|hotfix|repaired|resolved|defect)\b/i,
  },
  {
    category: 'Optimization',
    regex: /\b(optimi[zs](e|ed|ing|ation)|speed(ed)?|performance|latency|throughput|faster|reduced|memory leak|cache|caching|cargobike)\b/i,
  },
  {
    category: 'Refactor',
    regex: /\b(refactor(ed|ing)?|cleanup|clean-up|reorganiz(e|ed|ing)|modulariz(e|ed|ing)|restructur(e|ed|ing)|deprecat(e|ed))\b/i,
  },
  {
    category: 'Documentation',
    regex: /\b(docs?|documentation|readme|guide|specs?|specification|wiki|rfc|diagram)\b/i,
  },
  {
    category: 'Learning',
    regex: /\b(learn(ed|ing)?|stud(y|ied|ying)|research(ed|ing)?|explor(e|ed|ing)|course|tutorial|poc|prototype)\b/i,
  },
  {
    category: 'Discussion',
    regex: /\b(meet(ing)?|sync(ed)?|discuss(ed|ion)?|interview(ed)?|review(ed|ing)?|retro|standup|demo|planning)\b/i,
  },
  {
    category: 'Feature',
    regex: /\b(feature|build|built|implement(ed|ing)?|add(ed|ing)?|creat(e|ed|ing)|support|new|endpoint|integration)\b/i,
  },
];

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'were', 'been',
  'will', 'when', 'what', 'where', 'which', 'there', 'their', 'about', 'would',
  'should', 'could', 'some', 'than', 'them', 'into', 'also', 'after', 'before',
  'under', 'while', 'fixed', 'implemented', 'added', 'updated', 'worked', 'today'
]);

export function heuristicEnrich(text: string): ActivityEnrichmentResponse {
  const normalizedText = text.trim();

  // 1. Detect Category
  let category: ActivityEnrichmentResponse['category'] = 'Feature';
  for (const rule of CATEGORY_RULES) {
    if (rule.regex.test(normalizedText)) {
      category = rule.category;
      break;
    }
  }

  // 2. Detect Work Type
  let workType: ActivityEnrichmentResponse['workType'] = 'Technical';
  if (category === 'Learning') {
    workType = 'Learning';
  } else if (category === 'Discussion' || category === 'Documentation') {
    workType = 'Non-Technical';
  }

  // 3. Extract Skills
  const detectedSkills: string[] = [];
  for (const [skill, regex] of Object.entries(SKILLS_MAP)) {
    if (regex.test(normalizedText)) {
      detectedSkills.push(skill);
    }
  }

  // 4. Extract Keywords
  const words = normalizedText
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));

  const uniqueWords = Array.from(new Set(words)).slice(0, 6);

  // 5. Detect Project if mentioned
  let project: string | null = null;
  const projectMatch = normalizedText.match(/\b(?:in|on|for)\s+([A-Z][A-Za-z0-9_-]+(?:\s+[A-Z][A-Za-z0-9_-]+)?)\b/);
  if (projectMatch && projectMatch[1]) {
    const candidate = projectMatch[1].trim();
    if (!['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].includes(candidate)) {
      project = candidate;
    }
  }

  // 6. Generate Refined Summary
  let refined = normalizedText;
  if (!refined.endsWith('.')) refined += '.';

  // Polish prefix based on category
  const firstChar = refined.charAt(0).toUpperCase();
  refined = firstChar + refined.slice(1);

  return {
    category,
    project,
    skills: detectedSkills.length > 0 ? detectedSkills : ['General Engineering'],
    keywords: uniqueWords,
    workType,
    aiRefinedText: refined,
  };
}
