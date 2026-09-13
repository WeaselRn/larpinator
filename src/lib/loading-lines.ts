export const LOADING_LINES: string[] = [
  "Consulting the council of certified LARPers...",
  "Measuring buzzword density per square inch...",
  "Cross-referencing your claims with reality...",
  "Reality check in progress. Reality is losing...",
  "Counting how many times you said 'scalable'...",
  "Asking Taylor Swift why she's your top artist...",
  "Reading your README. All 400 lines of it...",
  "Calculating aura. Warning: aura levels critical...",
  "Detecting cringe via advanced ick-detection arrays...",
  "Translating corporate speak into human emotions...",
  "Checking if 'expert' means what you think it means...",
  "Your self-assessment has been flagged for review...",
  "Summoning the roast engine. It just had a Celsius...",
  "Verifying that your 14-user app is 'enterprise-grade'...",
  "Estimating how many tutorial repos you forked...",
  "Comparing your LinkedIn energy to your actual commits...",
  "Running vibe checks on your job titles...",
  "AI is judging you. AI is enjoying this...",
  "Determining if you're an NPC or just humble...",
  "Almost done. The damage is... substantial...",
  "Mewing in your general direction...",
  "Checking if your playlist is for the aesthetic...",
  "Separating the main character from the side quest...",
  "Detecting delulu in the group chat...",
];

export function randomLoadingLine(exclude?: string): string {
  const pool = exclude ? LOADING_LINES.filter((l) => l !== exclude) : LOADING_LINES;
  return pool[Math.floor(Math.random() * pool.length)];
}
