// Real school information (sourced from the official Rosemary Branch School website)
export const SCHOOL = {
  name: 'Rosemary',
  fullName: 'Rosemary Matric Hr. Sec. School',
  trust: 'Jeya Priya Educational & Charitable Trust',
  since: 1992,
  address: 'No. 1, Ram Nagar, Maharaja Nagar Post, Tirunelveli – 627 011, Tamil Nadu',
  phone: '+91 462 2530837',
  phoneMobile: '+91 92800 94836',
  phoneMobile2: '+91 92800 94822',
  email: 'rosemarybranch_school@yahoo.in',
  emailGmail: 'rosemarybranchschools@gmail.com',
  principal: 'Mrs. C. Indumathy',
  principalQual: 'M.Sc., B.Ed., M.Phil.',
  vision: 'Creating enlightened individuals',
  motto: 'Bless us to be a Blessing',
  board: 'Tamil Nadu Matriculation Board (Pre-KG – X) & Tamil Nadu State Board (XI–XII)',
  libraryBooks: 10000,
  whatsapp: 'https://wa.me/914622530837'
}

export const NAV = [
  { label: 'About', href: 'about.html' },
  { label: 'Academics', href: 'academics.html' },
  { label: 'Facilities', href: 'facilities.html' },
  { label: 'Admissions', href: 'admissions.html' },
  { label: 'Contact', href: 'contact.html' }
]

// One caption block per story scene
export const CAPTIONS = [
  {
    overline: 'Since 1992 · Tirunelveli',
    title: ['Where stories', 'begin'],
    italic: 1,
    body: 'Rosemary Matric Hr. Sec. School — three decades of nurturing confident, principled young people.'
  },
  {
    overline: 'The Campus',
    title: ['A world rises from', 'every page'],
    italic: 1,
    body: 'Three storeys of sunlit corridors around the big ground — smart classrooms, labs and the NextGen library. Hover over the campus to explore.'
  },
  {
    overline: 'Academics · Pre-KG to Class XII',
    title: ['Sciences, languages', '& code'],
    italic: 0,
    body: 'Higher secondary streams built for ambition:',
    chips: ['Maths · Physics · Chemistry', 'Biology Stream', 'Computer Science', 'Linguistic Lab', 'Smart Classrooms']
  },
  {
    overline: 'Achievements',
    title: ['Three decades of', 'shining'],
    italic: 1,
    body: 'Toppers, athletes, choir singers and leaders — every Rosemarian leaves a trail of light.',
    stats: [
      { n: 30, suffix: '+', label: 'Years of excellence' },
      { n: 1200, suffix: '+', label: 'Students' },
      { n: 10000, suffix: '+', label: 'Library books' },
      { n: 100, suffix: '%', label: 'Board pass rate' }
    ]
  },
  {
    overline: 'Tomorrow',
    title: ['From Ram Nagar', 'to the world'],
    italic: 1,
    body: 'Doctors, engineers, innovators, entrepreneurs — the Rosemary story continues with you.',
    cta: true
  }
]

// Interactive campus zones — matched to the real building layout
export const BUILDINGS = {
  main: {
    name: 'Central Block',
    line: 'Entrance · admin · smart classrooms',
    blurb: 'The heart of Rosemary — the curved entrance tower, the school board and three storeys of sunlit corridors where every day begins with the school choir.',
    link: 'about.html',
    cam: { pos: [1.7, 1.6, 1.5], look: [0, 1.05, -1.3] }
  },
  library: {
    name: 'Left Wing · Library & NextGen Hub',
    line: 'Reading hall · digital learning',
    blurb: 'Smart classrooms upstairs, the library and NextGen digital hub below — where readers become leaders and ideas take flight.',
    link: 'facilities.html',
    cam: { pos: [-0.3, 1.45, 2.7], look: [-2.35, 0.85, 0.45] }
  },
  science: {
    name: 'Right Wing · Science & Computer Labs',
    line: 'Physics · Chemistry · Biology · Coding',
    blurb: 'Fully equipped Physics, Chemistry, Biology and Computer labs where Rosemarians test, titrate, code and discover for themselves.',
    link: 'facilities.html',
    cam: { pos: [0.3, 1.45, 2.3], look: [2.35, 0.85, 0.05] }
  },
  sports: {
    name: 'The Big Ground',
    line: 'Morning assembly · sports day',
    blurb: 'The wide open ground where the whole school gathers for assembly, where house colours fly on sports day and champions are made every evening.',
    link: 'facilities.html',
    cam: { pos: [0.1, 2.6, 3.5], look: [0.25, 0.25, 1.0] }
  },
  playground: {
    name: 'Play Corner',
    line: 'Kindergarten play zone',
    blurb: 'Swings, slides and laughter — a safe, joyful corner where our youngest Rosemarians learn through play.',
    link: 'facilities.html',
    cam: { pos: [-0.5, 1.1, 4.0], look: [-1.7, 0.5, 2.7] }
  }
}
