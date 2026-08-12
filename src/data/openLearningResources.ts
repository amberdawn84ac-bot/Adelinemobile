export type ResourceUsePolicy = 'LINK' | 'ADAPT_WITH_LICENSE_CHECK' | 'OPEN_REUSE'
export type ResourceKind = 'curriculum' | 'game' | 'simulation' | 'primary_sources' | 'coding' | 'reference'

export interface OpenLearningResource {
  id: string
  title: string
  provider: string
  description: string
  url: string
  subjects: string[]
  gradeBands: string[]
  kind: ResourceKind
  policy: ResourceUsePolicy
  licenseNote: string
  missionIdeas: string[]
  featured?: boolean
}

/**
 * Curated external learning resources for Dear Adeline.
 *
 * IMPORTANT: "free" does not mean "free to copy into Dear Adeline".
 * `policy` is intentionally conservative. Before ingesting, remixing, mirroring,
 * embedding, or AI-transforming third-party content, verify the current license
 * for the exact item/edition being used.
 */
export const OPEN_LEARNING_RESOURCES: OpenLearningResource[] = [
  {
    id: 'makecode-arcade',
    title: 'MakeCode Arcade',
    provider: 'Microsoft MakeCode',
    description: 'Build real retro-style games with blocks and code. Best used as a Computer Lab creation portal.',
    url: 'https://arcade.makecode.com/',
    subjects: ['Computer Science', 'Game Design', 'Math'],
    gradeBands: ['5-8', '9-12'],
    kind: 'coding',
    policy: 'LINK',
    licenseNote: 'Link to the live tool. Do not copy Microsoft branding, lessons, or assets into Dear Adeline without checking the license for that material.',
    missionIdeas: [
      'Build a game with a player, enemy, score, and win condition.',
      'Remix a starter game and explain three changes you made.',
      'Create a game that models a science or history concept.'
    ],
    featured: true,
  },
  {
    id: 'loc-primary-sources',
    title: 'Primary Source Sets',
    provider: 'Library of Congress',
    description: 'Curated historical documents, photographs, newspapers, maps, recordings, and teacher guides.',
    url: 'https://www.loc.gov/programs/teachers/classroom-materials/primary-source-sets/',
    subjects: ['History', 'Government', 'Justice', 'English'],
    gradeBands: ['3-5', '6-8', '9-12'],
    kind: 'primary_sources',
    policy: 'ADAPT_WITH_LICENSE_CHECK',
    licenseNote: 'The Library provides extensive free access, but rights can vary by item. Prefer its “Free to Use and Reuse” sets and verify the rights statement on each item before republishing.',
    missionIdeas: [
      'Build an evidence board using only primary sources.',
      'Compare two contemporary accounts of the same event.',
      'Identify what a source proves, suggests, and cannot establish.'
    ],
    featured: true,
  },
  {
    id: 'loc-child-labor',
    title: 'Child Labor Primary Source Set',
    provider: 'Library of Congress',
    description: 'Photographs, cartoons, interviews, newspapers, and historical context for investigating child labor and reform.',
    url: 'https://www.loc.gov/classroom-materials/child-labor/',
    subjects: ['Justice', 'History', 'Economics', 'English'],
    gradeBands: ['6-8', '9-12'],
    kind: 'primary_sources',
    policy: 'ADAPT_WITH_LICENSE_CHECK',
    licenseNote: 'Use as an external evidence source. Check each primary source item’s rights statement before hosting or republishing it.',
    missionIdeas: [
      'Justice Center case: Why did businesses employ children, who benefited, and what changed?',
      'Calculate wages and family income from historical scenarios.',
      'Write a reform argument supported by primary evidence.'
    ],
    featured: true,
  },
  {
    id: 'core-knowledge',
    title: 'Core Knowledge Curriculum',
    provider: 'Core Knowledge Foundation',
    description: 'Large free curriculum library for K–8 language arts, history/geography, science, math, music, and more.',
    url: 'https://www.coreknowledge.org/download-free-curriculum/',
    subjects: ['English', 'History', 'Geography', 'Science', 'Math', 'Arts'],
    gradeBands: ['K-2', '3-5', '6-8'],
    kind: 'curriculum',
    policy: 'ADAPT_WITH_LICENSE_CHECK',
    licenseNote: 'Many Core Knowledge resources have reuse permissions, but terms differ by publication. Verify the exact resource license before adapting or importing it.',
    missionIdeas: [
      'Use its knowledge sequence to check that a mission has enough academic depth.',
      'Pull background reading into a student mission only when that exact resource license permits adaptation.',
      'Use topic coverage to identify curriculum gaps.'
    ],
    featured: true,
  },
  {
    id: 'ck12-flexbooks',
    title: 'CK-12 FlexBooks',
    provider: 'CK-12 Foundation',
    description: 'Customizable digital textbooks, interactives, simulations, and practice across middle and high school math and science.',
    url: 'https://www.ck12.org/fbbrowse/',
    subjects: ['Math', 'Biology', 'Chemistry', 'Physics', 'Earth Science'],
    gradeBands: ['6-8', '9-12'],
    kind: 'curriculum',
    policy: 'ADAPT_WITH_LICENSE_CHECK',
    licenseNote: 'CK-12 licenses vary by product/version and may include noncommercial restrictions. Verify the exact FlexBook/resource before importing or adapting.',
    missionIdeas: [
      'Use a FlexBook concept as the academic backbone for a game mission.',
      'Send students to an interactive after they encounter a problem in-world.',
      'Use high-school biology/physics coverage to validate graduation-level rigor.'
    ],
    featured: true,
  },
  {
    id: 'openstax',
    title: 'OpenStax',
    provider: 'Rice University',
    description: 'Free, peer-reviewed textbooks and K–12 resources, especially useful for upper-level academic depth.',
    url: 'https://openstax.org/',
    subjects: ['Math', 'Science', 'History', 'Government', 'Economics', 'Writing'],
    gradeBands: ['9-12'],
    kind: 'curriculum',
    policy: 'ADAPT_WITH_LICENSE_CHECK',
    licenseNote: 'OpenStax is openly licensed, but exact licenses can differ by book/edition and may include noncommercial/share-alike terms. Store the exact edition license before adaptation.',
    missionIdeas: [
      'Use chapters as reference depth behind advanced missions.',
      'Map mission competencies against high-school/college-level concepts.',
      'Offer optional Deep Dive reading for students who want more.'
    ],
    featured: true,
  },
  {
    id: 'mission-us',
    title: 'Mission US',
    provider: 'Mission US / WNET',
    description: 'Free, research-based interactive history games that put students inside major moments in U.S. history.',
    url: 'https://www.mission-us.org/',
    subjects: ['History', 'Justice', 'Government', 'English'],
    gradeBands: ['6-8', '9-12'],
    kind: 'game',
    policy: 'LINK',
    licenseNote: 'Use as an external game portal unless the license for a specific educator resource explicitly permits reuse.',
    missionIdeas: [
      'Play a mission, then return to Dear Adeline to build an evidence timeline.',
      'Compare player choices with primary-source evidence.',
      'Write what the game helped you understand and what it could not prove.'
    ],
    featured: true,
  },
  {
    id: 'phet',
    title: 'PhET Interactive Simulations',
    provider: 'University of Colorado Boulder',
    description: 'Interactive science and math simulations covering physics, chemistry, earth science, biology, and math.',
    url: 'https://phet.colorado.edu/',
    subjects: ['Physics', 'Chemistry', 'Math', 'Earth Science', 'Biology'],
    gradeBands: ['3-5', '6-8', '9-12'],
    kind: 'simulation',
    policy: 'LINK',
    licenseNote: 'PhET licensing has changed over time and current terms may restrict commercial/paid-product redistribution. Link to simulations by default; verify the current license before embedding or redistributing.',
    missionIdeas: [
      'Predict what will happen before opening the simulation, then test the prediction.',
      'Collect measurements from a sim and graph the results.',
      'Use a simulation to solve an in-world engineering problem.'
    ],
    featured: true,
  },
]

export const RESOURCE_POLICY_LABELS: Record<ResourceUsePolicy, { label: string; short: string }> = {
  LINK: { label: 'Portal only', short: 'Link' },
  ADAPT_WITH_LICENSE_CHECK: { label: 'Check exact license before adapting', short: 'Check license' },
  OPEN_REUSE: { label: 'Open reuse allowed with stated terms', short: 'Open' },
}
