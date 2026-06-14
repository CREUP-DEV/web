// Single source of truth for the locale translations of the seed-originated content that
// ships every locale (tags, the carousel slide, featured links, equality documents).
//
// These strings previously lived inline in drizzle/seed.ts AND were copied into the SQL
// backfill migrations 0003 (ca) / 0005 (eu). Those migrations are frozen history (drizzle
// hashes the journal) and must not change; this module is the forward-only single source
// that both the dev seed (drizzle/seed.ts) and the idempotent content seed
// (drizzle/seed/content.ts → `pnpm db:seed:content`) consume, so the locale strings can no
// longer drift. Keyed by each parent's stable natural key (tag slug, carousel/link href,
// equality document pdf_url).

import { EQUALITY_DOCUMENTS_PUBLIC_PATH } from '../../../shared/constants/assetPaths'

export interface SeedTagTranslation {
  locale: string
  name: string
}

export interface SeedCarouselTranslation {
  locale: string
  title: string
  buttonText: string
}

export interface SeedFeaturedLinkTranslation {
  locale: string
  title: string
}

export interface SeedEqualityDocumentTranslation {
  locale: string
  title: string
  description: string
  meta: string
}

/**
 * Looks up the translations for a parent's natural key, throwing if absent so any future
 * drift between the seed parents and this single source fails loudly instead of silently
 * seeding an entry with no translations.
 */
export function getRequiredSeedTranslations<T>(
  map: Record<string, T[]>,
  key: string,
  scope: string
): T[] {
  const translations = map[key]
  if (!translations) {
    throw new Error(`Missing seed ${scope} translations for natural key "${key}".`)
  }
  return translations
}

/** Keyed by tag slug. */
export const seedTagTranslations: Record<string, SeedTagTranslation[]> = {
  all: [
    { locale: 'es', name: 'Todas' },
    { locale: 'en', name: 'All' },
    { locale: 'ca', name: 'Totes' },
    { locale: 'eu', name: 'Guztiak' },
    { locale: 'gl', name: 'Todas' },
    { locale: 'val', name: 'Totes' },
  ],
  'university-policy': [
    { locale: 'es', name: 'Política universitaria' },
    { locale: 'en', name: 'University policy' },
    { locale: 'ca', name: 'Política universitària' },
    { locale: 'eu', name: 'Unibertsitate politika' },
    { locale: 'gl', name: 'Política universitaria' },
    { locale: 'val', name: 'Política universitària' },
  ],
  'scholarships-funding': [
    { locale: 'es', name: 'Becas y financiación' },
    { locale: 'en', name: 'Scholarships and funding' },
    { locale: 'ca', name: 'Beques i finançament' },
    { locale: 'eu', name: 'Bekak eta finantzaketa' },
    { locale: 'gl', name: 'Bolsas e financiamento' },
    { locale: 'val', name: 'Beques i finançament' },
  ],
  'student-economy': [
    { locale: 'es', name: 'Economía estudiantil' },
    { locale: 'en', name: 'Student economy' },
    { locale: 'ca', name: 'Economia estudiantil' },
    { locale: 'eu', name: 'Ikasleen ekonomia' },
    { locale: 'gl', name: 'Economía estudantil' },
    { locale: 'val', name: 'Economia estudiantil' },
  ],
  'internships-employability': [
    { locale: 'es', name: 'Prácticas y empleabilidad' },
    { locale: 'en', name: 'Internships and employability' },
    { locale: 'ca', name: 'Pràctiques i ocupabilitat' },
    { locale: 'eu', name: 'Praktikak eta enplegagarritasuna' },
    { locale: 'gl', name: 'Prácticas e empregabilidade' },
    { locale: 'val', name: 'Pràctiques i ocupabilitat' },
  ],
  'rights-coexistence-equality': [
    { locale: 'es', name: 'Derechos, convivencia e igualdad' },
    { locale: 'en', name: 'Rights, coexistence and equality' },
    { locale: 'ca', name: 'Drets, convivència i igualtat' },
    { locale: 'eu', name: 'Eskubideak, bizikidetza eta berdintasuna' },
    { locale: 'gl', name: 'Dereitos, convivencia e igualdade' },
    { locale: 'val', name: 'Drets, convivència i igualtat' },
  ],
  'university-quality': [
    { locale: 'es', name: 'Calidad universitaria' },
    { locale: 'en', name: 'University quality' },
    { locale: 'ca', name: 'Qualitat universitària' },
    { locale: 'eu', name: 'Unibertsitate kalitatea' },
    { locale: 'gl', name: 'Calidade universitaria' },
    { locale: 'val', name: 'Qualitat universitària' },
  ],
  'university-life-wellbeing': [
    { locale: 'es', name: 'Vida universitaria y bienestar' },
    { locale: 'en', name: 'University life and wellbeing' },
    { locale: 'ca', name: 'Vida universitària i benestar' },
    { locale: 'eu', name: 'Unibertsitate bizitza eta ongizatea' },
    { locale: 'gl', name: 'Vida universitaria e benestar' },
    { locale: 'val', name: 'Vida universitària i benestar' },
  ],
  'access-to-university': [
    { locale: 'es', name: 'Acceso a la universidad' },
    { locale: 'en', name: 'Access to university' },
    { locale: 'ca', name: 'Accés a la universitat' },
    { locale: 'eu', name: 'Unibertsitaterako sarbidea' },
    { locale: 'gl', name: 'Acceso á universidade' },
    { locale: 'val', name: 'Accés a la universitat' },
  ],
  'international-mobility': [
    { locale: 'es', name: 'Internacional y movilidad' },
    { locale: 'en', name: 'Internationalisation and mobility' },
    { locale: 'ca', name: 'Internacional i mobilitat' },
    { locale: 'eu', name: 'Nazioartekoa eta mugikortasuna' },
    { locale: 'gl', name: 'Internacional e mobilidade' },
    { locale: 'val', name: 'Internacional i mobilitat' },
  ],
  'student-representation': [
    { locale: 'es', name: 'Representación estudiantil' },
    { locale: 'en', name: 'Student representation' },
    { locale: 'ca', name: 'Representació estudiantil' },
    { locale: 'eu', name: 'Ikasleen ordezkaritza' },
    { locale: 'gl', name: 'Representación estudantil' },
    { locale: 'val', name: 'Representació estudiantil' },
  ],
}

/** Keyed by carousel item href. */
export const seedCarouselTranslations: Record<string, SeedCarouselTranslation[]> = {
  '/conocenos/que-es': [
    {
      locale: 'es',
      title: 'Conoce a la asociación que representa a más de 1.000.000 de estudiantes.',
      buttonText: '¿Qué es CREUP?',
    },
    {
      locale: 'en',
      title: 'Meet the association that represents more than 1,000,000 students.',
      buttonText: 'What is CREUP?',
    },
    {
      locale: 'ca',
      title: "Coneix l'associació que representa més d'1.000.000 d'estudiants.",
      buttonText: 'Què és CREUP?',
    },
    {
      locale: 'eu',
      title: 'Ezagutu 1.000.000 ikasle baino gehiago ordezkatzen dituen elkartea.',
      buttonText: 'Zer da CREUP?',
    },
    {
      locale: 'gl',
      title: 'Coñece a asociación que representa a máis de 1.000.000 de estudantes.',
      buttonText: 'Que é CREUP?',
    },
    {
      locale: 'val',
      title: "Coneix l'associació que representa més d'1.000.000 d'estudiants.",
      buttonText: 'Què és CREUP?',
    },
  ],
}

/** Keyed by featured link `to` (href). */
export const seedFeaturedLinkTranslations: Record<string, SeedFeaturedLinkTranslation[]> = {
  '/transparencia/mic/': [
    { locale: 'es', title: 'Manual de Identidad Corporativa' },
    { locale: 'en', title: 'Corporate Identity Manual' },
    { locale: 'ca', title: "Manual d'Identitat Corporativa" },
    { locale: 'eu', title: 'Identitate Korporatiboaren Eskuliburua' },
    { locale: 'gl', title: 'Manual de Identidade Corporativa' },
    { locale: 'val', title: "Manual d'Identitat Corporativa" },
  ],
  '/prensa/newsletter/': [
    { locale: 'es', title: 'Suscríbete a nuestra Newsletter' },
    { locale: 'en', title: 'Subscribe to our Newsletter' },
    { locale: 'ca', title: 'Subscriu-te a la nostra Newsletter' },
    { locale: 'eu', title: 'Harpidetu gure Newsletterera' },
    { locale: 'gl', title: 'Subscríbete á nosa Newsletter' },
    { locale: 'val', title: 'Subscriu-te a la nostra Newsletter' },
  ],
  '/transparencia/igualdad': [
    { locale: 'es', title: 'Igualdad y prevención del acoso' },
    { locale: 'en', title: 'Equality and Harassment Prevention' },
    { locale: 'ca', title: "Igualtat i prevenció de l'assetjament" },
    { locale: 'eu', title: 'Berdintasuna eta jazarpenaren prebentzioa' },
    { locale: 'gl', title: 'Igualdade e prevención do acoso' },
    { locale: 'val', title: "Igualtat i prevenció de l'assetjament" },
  ],
  'https://www.boe.es/buscar/doc.php?id=BOE-A-2010-20147': [
    { locale: 'es', title: 'Estatuto del Estudiante Universitario' },
    { locale: 'en', title: 'University Student Statute' },
    { locale: 'ca', title: "Estatut de l'Estudiant Universitari" },
    { locale: 'eu', title: 'Unibertsitateko Ikaslearen Estatutua' },
    { locale: 'gl', title: 'Estatuto do Estudante Universitario' },
    { locale: 'val', title: "Estatut de l'Estudiant Universitari" },
  ],
  'https://www.becaseducacion.gob.es/': [
    { locale: 'es', title: 'Becas y ayudas para el estudiantado' },
    { locale: 'en', title: 'Scholarships and Student Aid' },
    { locale: 'ca', title: "Beques i ajudes per a l'estudiantat" },
    { locale: 'eu', title: 'Bekak eta laguntzak ikasleentzat' },
    { locale: 'gl', title: 'Bolsas e axudas para o estudantado' },
    { locale: 'val', title: "Beques i ajudes per a l'estudiantat" },
  ],
  'https://www.esu-online.org/': [
    { locale: 'es', title: "European Students' Union (ESU)" },
    { locale: 'en', title: "European Students' Union (ESU)" },
    { locale: 'ca', title: "European Students' Union (ESU)" },
    { locale: 'eu', title: "European Students' Union (ESU)" },
    { locale: 'gl', title: "European Students' Union (ESU)" },
    { locale: 'val', title: "European Students' Union (ESU)" },
  ],
}

/** Keyed by equality document pdf_url. */
export const seedEqualityDocumentTranslations: Record<string, SeedEqualityDocumentTranslation[]> = {
  [`${EQUALITY_DOCUMENTS_PUBLIC_PATH}/posicionamiento-igualdad-diversidad.pdf`]: [
    {
      locale: 'es',
      title: 'Posicionamiento político en materia de Igualdad y Diversidad',
      description:
        'Nuestro documento marco sobre igualdad, diversidad, discriminaciones en la universidad y medidas que reclamamos a las instituciones públicas.',
      meta: 'Documento político · Igualdad y diversidad',
    },
    {
      locale: 'en',
      title: 'Policy position on Equality and Diversity',
      description:
        'Our core document on equality, diversity, discrimination in universities, and the measures we call for from public institutions.',
      meta: 'Policy document · Equality and diversity',
    },
    {
      locale: 'ca',
      title: "Posicionament polític en matèria d'Igualtat i Diversitat",
      description:
        'El nostre document marc sobre igualtat, diversitat, discriminacions a la universitat i mesures que reclamem a les institucions públiques.',
      meta: 'Document polític · Igualtat i diversitat',
    },
    {
      locale: 'eu',
      title: 'Berdintasun eta Aniztasunari buruzko posizionamendu politikoa',
      description:
        'Berdintasunari, aniztasunari, unibertsitateko diskriminazioei eta erakunde publikoei eskatzen dizkiegun neurriei buruzko gure esparru-dokumentua.',
      meta: 'Dokumentu politikoa · Berdintasuna eta aniztasuna',
    },
    {
      locale: 'gl',
      title: 'Posicionamento político en materia de Igualdade e Diversidade',
      description:
        'O noso documento marco sobre igualdade, diversidade, discriminacións na universidade e medidas que reclamamos ás institucións públicas.',
      meta: 'Documento político · Igualdade e diversidade',
    },
    {
      locale: 'val',
      title: "Posicionament polític en matèria d'Igualtat i Diversitat",
      description:
        'El nostre document marc sobre igualtat, diversitat, discriminacions a la universitat i mesures que reclamem a les institucions públiques.',
      meta: 'Document polític · Igualtat i diversitat',
    },
  ],
  [`${EQUALITY_DOCUMENTS_PUBLIC_PATH}/protocolo-de-prevencion-y-actuacion-frente-a-casos-de-acoso.pdf`]:
    [
      {
        locale: 'es',
        title: 'Protocolo de prevención y actuación frente a casos de acoso sexual',
        description:
          'Aprobado en la 77.ª Asamblea General Ordinaria, recoge medidas preventivas, principios de confidencialidad, el funcionamiento del Punto Seguro y el procedimiento de actuación ante conductas contrarias a la libertad sexual.',
        meta: '77.ª Asamblea General Ordinaria · 4 de abril de 2025',
      },
      {
        locale: 'en',
        title: 'Protocol for prevention and response to sexual harassment cases',
        description:
          'Approved at the 77th Ordinary General Assembly, it sets out preventive measures, confidentiality principles, how the Safe Point works, and the response procedure for conduct against sexual freedom.',
        meta: '77th Ordinary General Assembly · April 4, 2025',
      },
      {
        locale: 'ca',
        title: "Protocol de prevenció i actuació davant casos d'assetjament sexual",
        description:
          "Aprovat a la 77a Assemblea General Ordinària, recull mesures preventives, principis de confidencialitat, el funcionament del Punt Segur i el procediment d'actuació davant conductes contràries a la llibertat sexual.",
        meta: "77a Assemblea General Ordinària · 4 d'abril de 2025",
      },
      {
        locale: 'eu',
        title: 'Sexu-jazarpen kasuen prebentzio eta jarduketa protokoloa',
        description:
          '77. Ohiko Batzar Nagusian onartua, neurri prebentiboak, konfidentzialtasun printzipioak, Puntu Seguruaren funtzionamendua eta sexu-askatasunaren aurkako jokabideen aurrean jarduteko prozedura jasotzen ditu.',
        meta: '77. Ohiko Batzar Nagusia · 2025eko apirilaren 4a',
      },
      {
        locale: 'gl',
        title: 'Protocolo de prevención e actuación fronte a casos de acoso sexual',
        description:
          'Aprobado na 77.ª Asemblea Xeral Ordinaria, recolle medidas preventivas, principios de confidencialidade, o funcionamento do Punto Seguro e o procedemento de actuación ante condutas contrarias á liberdade sexual.',
        meta: '77.ª Asemblea Xeral Ordinaria · 4 de abril de 2025',
      },
      {
        locale: 'val',
        title: "Protocol de prevenció i actuació davant casos d'assetjament sexual",
        description:
          "Aprovat en la 77a Assemblea General Ordinària, arreplega mesures preventives, principis de confidencialitat, el funcionament del Punt Segur i el procediment d'actuació davant conductes contràries a la llibertat sexual.",
        meta: "77a Assemblea General Ordinària · 4 d'abril de 2025",
      },
    ],
  [`${EQUALITY_DOCUMENTS_PUBLIC_PATH}/protocolo-discriminacion-creup.pdf`]: [
    {
      locale: 'es',
      title: 'Protocolo de prevención y actuación frente a casos de discriminación',
      description:
        'Aprobado en la 77.ª Asamblea General Ordinaria, define supuestos de discriminación, garantías, Punto Seguro y niveles de intervención ante violencia o acoso por diversidad.',
      meta: '77.ª Asamblea General Ordinaria · 4 de abril de 2025',
    },
    {
      locale: 'en',
      title: 'Protocol for prevention and response to discrimination cases',
      description:
        'Approved at the 77th Ordinary General Assembly, it defines situations of discrimination, safeguards, the Safe Point, and response levels for violence or harassment linked to diversity.',
      meta: '77th Ordinary General Assembly · April 4, 2025',
    },
    {
      locale: 'ca',
      title: 'Protocol de prevenció i actuació davant casos de discriminació',
      description:
        "Aprovat a la 77a Assemblea General Ordinària, defineix supòsits de discriminació, garanties, Punt Segur i nivells d'intervenció davant violència o assetjament per diversitat.",
      meta: "77a Assemblea General Ordinària · 4 d'abril de 2025",
    },
    {
      locale: 'eu',
      title: 'Diskriminazio kasuen prebentzio eta jarduketa protokoloa',
      description:
        '77. Ohiko Batzar Nagusian onartua, diskriminazio kasuak, bermeak, Puntu Segurua eta aniztasunagatiko indarkeria edo jazarpenaren aurrean esku hartzeko mailak definitzen ditu.',
      meta: '77. Ohiko Batzar Nagusia · 2025eko apirilaren 4a',
    },
    {
      locale: 'gl',
      title: 'Protocolo de prevención e actuación fronte a casos de discriminación',
      description:
        'Aprobado na 77.ª Asemblea Xeral Ordinaria, define supostos de discriminación, garantías, Punto Seguro e niveis de intervención ante violencia ou acoso por diversidade.',
      meta: '77.ª Asemblea Xeral Ordinaria · 4 de abril de 2025',
    },
    {
      locale: 'val',
      title: 'Protocol de prevenció i actuació davant casos de discriminació',
      description:
        "Aprovat en la 77a Assemblea General Ordinària, definix supòsits de discriminació, garanties, Punt Segur i nivells d'intervenció davant violència o assetjament per diversitat.",
      meta: "77a Assemblea General Ordinària · 4 d'abril de 2025",
    },
  ],
  [`${EQUALITY_DOCUMENTS_PUBLIC_PATH}/guia-comunicacion-inclusiva.pdf`]: [
    {
      locale: 'es',
      title: 'Guía de Comunicación Inclusiva',
      description:
        'Recoge recomendaciones prácticas sobre lenguaje, recursos visuales y criterios de accesibilidad para una comunicación más inclusiva.',
      meta: 'Guía práctica · Lenguaje, visualidad y accesibilidad',
    },
    {
      locale: 'en',
      title: 'Inclusive Communication Guide',
      description:
        'Practical recommendations on language, visual resources, and accessibility for more inclusive communication.',
      meta: 'Practical guide · Language, visuals, and accessibility',
    },
    {
      locale: 'ca',
      title: 'Guia de Comunicació Inclusiva',
      description:
        "Recull recomanacions pràctiques sobre llenguatge, recursos visuals i criteris d'accessibilitat per a una comunicació més inclusiva.",
      meta: 'Guia pràctica · Llenguatge, visualitat i accessibilitat',
    },
    {
      locale: 'eu',
      title: 'Komunikazio Inklusiboaren Gida',
      description:
        'Komunikazio inklusiboagoa lortzeko hizkuntzari, baliabide bisualei eta irisgarritasun irizpideei buruzko gomendio praktikoak biltzen ditu.',
      meta: 'Gida praktikoa · Hizkuntza, ikusgarritasuna eta irisgarritasuna',
    },
    {
      locale: 'gl',
      title: 'Guía de Comunicación Inclusiva',
      description:
        'Recolle recomendacións prácticas sobre linguaxe, recursos visuais e criterios de accesibilidade para unha comunicación máis inclusiva.',
      meta: 'Guía práctica · Linguaxe, visualidade e accesibilidade',
    },
    {
      locale: 'val',
      title: 'Guia de Comunicació Inclusiva',
      description:
        "Arreplega recomanacions pràctiques sobre llenguatge, recursos visuals i criteris d'accessibilitat per a una comunicació més inclusiva.",
      meta: 'Guia pràctica · Llenguatge, visualitat i accessibilitat',
    },
  ],
}
