/** Route of the student rights guide (the page under `app/pages/politica/`). */
export const STUDENT_RIGHTS_PATH = '/politica/tus-derechos'

/** The Estatuto del Estudiantado Universitario (Real Decreto 855/2026) in the BOE. */
export const STUDENT_RIGHTS_STATUTE_URL = 'https://www.boe.es/buscar/doc.php?id=BOE-A-2026-21955'

export interface StudentRightsSection {
  /** Key of the section in the guide text (`StudentRightsText`). */
  key: string
  /** Anchor id. Not translated, so a shared link works in every locale. */
  anchor: string
  icon: string
  /** Keys of the section's rights in the guide text, in display order. */
  rights: readonly string[]
}

/**
 * Structure of the guide: sections and the rights in each. The titles, explanations and article
 * references live in `app/content/studentRights/<locale>.json`, typed as `StudentRightsText` so a
 * locale that misses a section or a right fails the typecheck.
 */
export const STUDENT_RIGHTS_SECTIONS = [
  {
    key: 'general',
    anchor: 'derechos-generales',
    icon: 'i-tabler-scale',
    rights: [
      'equalRights',
      'noDiscrimination',
      'qualityEducation',
      'chooseUniversity',
      'informedOfRights',
    ],
  },
  {
    key: 'evaluation',
    anchor: 'evaluacion-y-revision',
    icon: 'i-tabler-clipboard-check',
    rights: [
      'objectiveEvaluation',
      'criteriaLocked',
      'examDatesInAdvance',
      'rescheduleExam',
      'noTwoGlobalExams',
      'twoSittings',
      'examLanguage',
      'adaptedExams',
      'proofOfSitting',
      'privateGrades',
      'reviewAndExplanation',
      'reviewedExamCopy',
      'reviewCannotLowerGrade',
      'reviewNoClash',
      'appealDecision',
    ],
  },
  {
    key: 'guides',
    anchor: 'guias-docentes-y-tutorias',
    icon: 'i-tabler-notebook',
    rights: [
      'knowGuidesBeforeEnrolling',
      'virtualCourseGuides',
      'teachingLanguage',
      'tutoringPerCourse',
      'tutoringSchedule',
      'thesisSupervision',
      'synchronousTutoring',
      'degreeCoordination',
      'degreeOrientation',
    ],
  },
  {
    key: 'enrolment',
    anchor: 'matricula-permanencia-y-conciliacion',
    icon: 'i-tabler-calendar-time',
    rights: [
      'enrolmentDeadlines',
      'progressRules',
      'workAndStudy',
      'partTime',
      'workLifeBalance',
      'academicExemption',
      'suspendStudies',
      'digitalDisconnection',
      'socialSecurity',
    ],
  },
  {
    key: 'wellbeing',
    anchor: 'salud-mental-igualdad-y-bienestar',
    icon: 'i-tabler-heart-handshake',
    rights: [
      'mentalHealthCare',
      'supportUnits',
      'protocols',
      'disabilitySupport',
      'accessibleSpaces',
      'nonSexistTreatment',
      'nameAndSexRectification',
      'healthyFood',
    ],
  },
  {
    key: 'mobility',
    anchor: 'movilidad',
    icon: 'i-tabler-plane',
    rights: [
      'mobilityRight',
      'mobilityDuration',
      'mobilityCompatible',
      'learningAgreement',
      'gradesRecognised',
      'mobilityGrants',
      'mobilitySupport',
    ],
  },
  {
    key: 'internships',
    anchor: 'practicas-academicas-externas',
    icon: 'i-tabler-briefcase',
    rights: [
      'qualityInternships',
      'trainingProject',
      'internshipTutors',
      'notAJob',
      'internshipSocialSecurity',
      'evaluateInternships',
      'agreementsAndRatios',
      'dualTraining',
    ],
  },
  {
    key: 'scholarships',
    anchor: 'becas-y-ayudas',
    icon: 'i-tabler-coin-euro',
    rights: [
      'noDroppingOut',
      'fitSituation',
      'livingCosts',
      'applyAndPortability',
      'studentsInScholarships',
      'swiftResolution',
    ],
  },
  {
    key: 'representation',
    anchor: 'representacion-y-participacion',
    icon: 'i-tabler-users-group',
    rights: [
      'freedoms',
      'governingBodies',
      'academicStrike',
      'informationAndParticipation',
      'studentCouncil',
      'rulemaking',
      'commissions',
      'representativesRights',
      'representativesResources',
      'complaintsChannel',
      'legalAdvice',
      'associations',
      'ombudsman',
    ],
  },
  {
    key: 'services',
    anchor: 'servicios-y-vida-universitaria',
    icon: 'i-tabler-building-community',
    rights: [
      'studentServices',
      'rightsAdvice',
      'housingInformation',
      'universityHousing',
      'administration',
      'studentSpaces',
      'digitalSkills',
      'riskPrevention',
    ],
  },
  {
    key: 'recognition',
    anchor: 'reconocimiento-de-tu-trabajo-y-tu-participacion',
    icon: 'i-tabler-award',
    rights: [
      'creditRecognition',
      'europeanSupplement',
      'workExperience',
      'authorship',
      'publicationConsent',
      'volunteering',
    ],
  },
  {
    key: 'doctorate',
    anchor: 'doctorado-y-formacion-permanente',
    icon: 'i-tabler-certificate',
    rights: ['doctorate', 'lifelongLearning'],
  },
] as const satisfies readonly StudentRightsSection[]

export interface StudentRightText {
  title: string
  description: string
  /** Where the Estatuto sets the right, e.g. "Arts. 6.1 a) y 12". */
  article: string
}

type StudentRightsSectionDefinition = (typeof STUDENT_RIGHTS_SECTIONS)[number]

/** The guide's text in one language: every section of `STUDENT_RIGHTS_SECTIONS` and its rights. */
export type StudentRightsText = {
  [Section in StudentRightsSectionDefinition as Section['key']]: {
    title: string
    rights: Record<Section['rights'][number], StudentRightText>
  }
}
