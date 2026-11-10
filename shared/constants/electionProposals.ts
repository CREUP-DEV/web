/** Route of CREUP's proposals for the 2026 general election (the page under `app/pages/politica/`). */
export const ELECTION_PROPOSALS_PATH = '/politica/elecciones-generales-2026'

/**
 * The page's share image (1200×630). A static file in `public/politica/`, not under `/og`, which
 * is an admin upload base stripped from the build.
 */
export const ELECTION_PROPOSALS_SHARE_IMAGE_PATH =
  '/politica/elecciones-generales-2026-compartir.jpg'

export interface ElectionProposalsSection {
  /** Key of the block in the proposals text (`ElectionProposalsText`). */
  key: string
  /** Anchor id. Not translated, so a shared link works in every locale. */
  anchor: string
  icon: string
  /** Keys of the block's proposals in the proposals text, in display order. */
  proposals: readonly string[]
}

/**
 * Structure of the document: thematic blocks and the proposals in each. The titles, context
 * paragraphs and proposals live in `app/content/electionProposals/<locale>.json`, typed as
 * `ElectionProposalsText` so a locale that misses a block or a proposal fails the typecheck.
 */
export const ELECTION_PROPOSALS_SECTIONS = [
  {
    key: 'funding',
    anchor: 'financiacion-y-precios-publicos',
    icon: 'i-tabler-coin-euro',
    proposals: [
      'gdpTarget',
      'fundingObservatory',
      'minimumPerStudent',
      'lowerFees',
      'nonQualifyingMasters',
      'repeatEnrolmentSurcharges',
      'morePlaces',
    ],
  },
  {
    key: 'scholarships',
    anchor: 'becas',
    icon: 'i-tabler-school',
    proposals: [
      'updateAmounts',
      'moreIncomeThresholds',
      'removeExcellenceShare',
      'reviewPerformanceRequirements',
      'noRepayment',
      'housingAmountByTerritory',
    ],
  },
  {
    key: 'equality',
    anchor: 'igualdad',
    icon: 'i-tabler-heart-handshake',
    proposals: [
      'positiveDiscrimination',
      'refugeeStudents',
      'equalityTraining',
      'equityData',
      'mentalHealthStudy',
      'scienceSocialDimension',
    ],
  },
  {
    key: 'housing',
    anchor: 'vivienda',
    icon: 'i-tabler-home',
    proposals: [
      'rentCaps',
      'touristRentals',
      'publicResidences',
      'residentialRehabilitation',
      'roomRentals',
    ],
  },
  {
    key: 'internships',
    anchor: 'practicas-academicas-externas',
    icon: 'i-tabler-briefcase',
    proposals: [
      'reformDecree',
      'expenseCompensation',
      'vulnerableStudentGrants',
      'publicServicesExclusivity',
    ],
  },
  {
    key: 'mobility',
    anchor: 'internacionalizacion-y-movilidad',
    icon: 'i-tabler-plane',
    proposals: [
      'mobilityFunding',
      'iberoamericanMobility',
      'segibCooperation',
      'iberoamericanRepresentation',
      'bolognaFollowUp',
      'studentVisas',
      'internshipMobilityGrants',
    ],
  },
  {
    key: 'science',
    anchor: 'ciencia',
    icon: 'i-tabler-flask',
    proposals: [
      'sustainedFunding',
      'allKnowledgeAreas',
      'researchContracts',
      'evaluationCriteria',
      'simplerAdministration',
      'openScience',
    ],
  },
  {
    key: 'governance',
    anchor: 'gobernanza-y-participacion-democratica',
    icon: 'i-tabler-users-group',
    proposals: [
      'oneThirdRepresentation',
      'universityAutonomy',
      'socialCouncil',
      'conflictsOfInterest',
      'studentCouncilFunding',
    ],
  },
  {
    key: 'quality',
    anchor: 'garantia-de-la-calidad',
    icon: 'i-tabler-shield-check',
    proposals: [
      'agencyIndependence',
      'continuousEvaluation',
      'teachingQuality',
      'qualityTransparency',
      'degreeMap',
      'stricterRequirements',
      'closureGuarantees',
      'privateUniversityInspection',
      'privateUniversityMoratorium',
      'privateAffiliatedCentres',
      'privateUniversityTransparency',
    ],
  },
  {
    key: 'sustainability',
    anchor: 'sostenibilidad',
    icon: 'i-tabler-leaf',
    proposals: ['climateShelters', 'sustainabilityResearch', 'sustainabilityPlans'],
  },
] as const satisfies readonly ElectionProposalsSection[]

type ElectionProposalsSectionDefinition = (typeof ELECTION_PROPOSALS_SECTIONS)[number]

/** Key figures shown in the page header, each linked to the block it comes from. */
export const ELECTION_PROPOSALS_HIGHLIGHTS = [
  { key: 'gdp', section: 'funding' },
  { key: 'perStudent', section: 'funding' },
  { key: 'representation', section: 'governance' },
] as const satisfies readonly { key: string; section: ElectionProposalsSectionDefinition['key'] }[]

export interface ElectionProposalText {
  title: string
  description: string
}

/** The document's text in one language: intro, key figures, every block and its proposals, closing. */
export interface ElectionProposalsText {
  /** Paragraphs of the presentation that opens the document. */
  intro: string[]
  highlights: Record<
    (typeof ELECTION_PROPOSALS_HIGHLIGHTS)[number]['key'],
    { value: string; label: string }
  >
  sections: {
    [Section in ElectionProposalsSectionDefinition as Section['key']]: {
      title: string
      /** Paragraphs that explain the block before its proposals. */
      context: string[]
      proposals: Record<Section['proposals'][number], ElectionProposalText>
    }
  }
  /** Paragraphs of the conclusion that closes the document. */
  closing: string[]
}
