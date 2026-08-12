export type Shelf = 'public_domain' | 'homestead' | 'oklahoma_history'

export interface LibraryBook {
  id: string
  title: string
  author: string
  year: number
  shelf: Shelf
  description: string
  subjects: string[]
  gradeBands: string[]
  publicDomainUS: boolean
  sourceUrl: string
  readingUrl?: string
  coverEmoji: string
  notes?: string
}

export interface HomesteadSource {
  id: string
  title: string
  provider: string
  description: string
  url: string
  topics: string[]
  usePolicy: 'LINK_ONLY' | 'CHECK_PERMISSION'
}

export const PUBLIC_DOMAIN_BOOKS: LibraryBook[] = [
  {
    id: 'childrens-gardening',
    title: "The Children's Book of Gardening",
    author: 'Mrs. Alfred Sidgwick and Mrs. Paynter',
    year: 1909,
    shelf: 'public_domain',
    description: 'A practical gardening book written for young readers, with period illustrations and hands-on growing advice.',
    subjects: ['Gardening', 'Botany', 'Homesteading'],
    gradeBands: ['6-8', '9-12'],
    publicDomainUS: true,
    sourceUrl: 'https://www.gutenberg.org/ebooks/47616',
    readingUrl: 'https://www.gutenberg.org/cache/epub/47616/pg47616-images.html',
    coverEmoji: '🌱',
    notes: 'Verified by Project Gutenberg as public domain in the USA.'
  },
  {
    id: 'plants-and-their-children',
    title: 'Plants and Their Children',
    author: 'Frances Theodora Parsons',
    year: 1896,
    shelf: 'public_domain',
    description: 'A child-friendly introduction to plant life that could be reillustrated and paired with modern field observations.',
    subjects: ['Botany', 'Nature Study', 'Science'],
    gradeBands: ['3-5', '6-8'],
    publicDomainUS: true,
    sourceUrl: 'https://www.gutenberg.org/ebooks/71942',
    readingUrl: 'https://www.gutenberg.org/cache/epub/71942/pg71942-images.html',
    coverEmoji: '🌿',
    notes: 'Verified by Project Gutenberg as public domain in the USA.'
  },
  {
    id: 'book-of-herbs',
    title: 'The Book of Herbs',
    author: 'Rosalind Northcote',
    year: 1903,
    shelf: 'public_domain',
    description: 'Historic gardening and herb lore. Useful as a source for comparison with modern botany and herbal practice.',
    subjects: ['Herbs', 'Gardening', 'History of Medicine'],
    gradeBands: ['6-8', '9-12'],
    publicDomainUS: true,
    sourceUrl: 'https://www.gutenberg.org/ebooks/60050',
    readingUrl: 'https://www.gutenberg.org/cache/epub/60050/pg60050-images.html',
    coverEmoji: '🌿',
    notes: 'Historic medical claims should be labeled as historical rather than presented as current clinical guidance.'
  },
  {
    id: 'manual-of-gardening',
    title: 'Manual of Gardening',
    author: 'L. H. Bailey',
    year: 1910,
    shelf: 'public_domain',
    description: 'A broad practical guide to home grounds, flowers, fruits, and vegetables.',
    subjects: ['Gardening', 'Horticulture', 'Homesteading'],
    gradeBands: ['6-8', '9-12'],
    publicDomainUS: true,
    sourceUrl: 'https://www.gutenberg.org/ebooks/9550',
    readingUrl: 'https://www.gutenberg.org/cache/epub/9550/pg9550-images.html',
    coverEmoji: '🪴',
    notes: 'Verified by Project Gutenberg as public domain in the USA.'
  },
  {
    id: 'childs-history-world',
    title: "A Child's History of the World",
    author: 'V. M. Hillyer',
    year: 1924,
    shelf: 'public_domain',
    description: 'An older narrative history for children that can be used critically, annotated, corrected, and compared with primary sources.',
    subjects: ['World History', 'Historiography', 'English'],
    gradeBands: ['6-8'],
    publicDomainUS: true,
    sourceUrl: 'https://www.gutenberg.org/ebooks/67149',
    readingUrl: 'https://www.gutenberg.org/cache/epub/67149/pg67149-images.html',
    coverEmoji: '🌍',
    notes: 'Useful partly because students can identify outdated assumptions, omissions, and framing.'
  }
]

export const HOMESTEAD_SOURCES: HomesteadSource[] = [
  {
    id: 'baker-creek',
    title: 'Baker Creek Heirloom Seeds Articles',
    provider: 'Baker Creek Heirloom Seed Company',
    description: 'Articles on heirloom varieties, seed saving, open pollination, growing methods, and garden history.',
    url: 'https://www.rareseeds.com/blog',
    topics: ['Seed Saving', 'Heirloom Seeds', 'Gardening', 'Plant Breeding'],
    usePolicy: 'LINK_ONLY'
  },
  {
    id: 'mountain-rose',
    title: 'Mountain Rose Herbs Learning Library',
    provider: 'Mountain Rose Herbs',
    description: 'A large collection of articles, recipes, herbal education, sustainable-living material, and the Free Herbalism Project.',
    url: 'https://mountainroseherbs.com/',
    topics: ['Herbalism', 'Botany', 'Sustainable Living', 'Home Skills'],
    usePolicy: 'LINK_ONLY'
  }
]

export const OKLAHOMA_HISTORY_PROJECT = {
  title: 'Oklahoma: What the Textbook Left Out',
  status: 'in_development' as const,
  description: 'An original Dear Adeline Oklahoma history book built around primary sources, competing narratives, land, power, money, Indigenous history, labor, race, oil, government, and ordinary people.',
  designPrinciples: [
    'Start with the familiar textbook story, then test it against primary evidence.',
    'Separate what is documented from what is interpretation.',
    'Follow land, money, law, and political power.',
    'Center human stories without flattening people into heroes and villains.',
    'Include Cherokee, Osage, Muscogee, Choctaw, Chickasaw, Freedmen, Black towns, settlers, laborers, women, children, and immigrant communities as historical actors.',
    'Use maps, court records, newspapers, oral histories, photographs, treaties, and government records wherever possible.'
  ]
}
