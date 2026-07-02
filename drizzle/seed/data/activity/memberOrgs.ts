/**
 * Member-organisation reference data for the "Actividad" seed (auto-generated, do not hand-edit).
 *
 * Keyed by the organisation's initials. `id` is the EXACT slug the runtime member loader
 * (server/utils/public/publicMembers.ts) generates, so a member event seeded with this id matches
 * the one the admin panel would resolve from the live org-chart — a later "actualizar desde el
 * organigrama" finds the same organisation. Logos are intentionally null in the seed (the snapshot
 * only needs to be non-null; the public overlay renders only when a logo exists, and the real
 * versioned proxy logos are added later from admin).
 */
import type { MemberOrgSource } from '../../../../server/db/schema/activity'

export interface SeedMemberOrg {
  source: MemberOrgSource
  /** Stable slug, identical to what the runtime member loader produces. */
  id: string
  denomination: string
  initials: string
  /** Only present for `asociado` orgs (informational; not stored). */
  university?: string
}

export const MEMBER_ORGS: Record<string, SeedMemberOrg> = {
  EHUIK: {
    source: 'asociado',
    id: 'ehuik-ikasle-kontseilua-euskal-herriko-unibertsitatea-pais-vasco',
    denomination: 'Ikasle Kontseilua',
    initials: 'EHUIK',
    university: 'Euskal Herriko Unibertsitatea',
  },
  'DA-UPM': {
    source: 'asociado',
    id: 'da-upm-delegacion-de-alumnos-universidad-politecnica-de-madrid-comunidad-de-madrid',
    denomination: 'Delegación de Alumnos',
    initials: 'DA-UPM',
    university: 'Universidad Politécnica de Madrid',
  },
  DCEUCM: {
    source: 'asociado',
    id: 'dceucm-delegacion-central-de-estudiantes-universidad-complutense-de-madrid-comunidad-de-madrid',
    denomination: 'Delegación Central de Estudiantes',
    initials: 'DCEUCM',
    university: 'Universidad Complutense de Madrid',
  },
  CEUniOvi: {
    source: 'asociado',
    id: 'ceuniovi-conseyu-d-estudiantes-universidad-de-oviedo-principado-de-asturias',
    denomination: 'Conseyu d’Estudiantes',
    initials: 'CEUniOvi',
    university: 'Universidad de Oviedo',
  },
  CEstUSC: {
    source: 'asociado',
    id: 'cestusc-consello-do-estudantado-universidade-de-santiago-de-compostela-galicia',
    denomination: 'Consello do Estudantado',
    initials: 'CEstUSC',
    university: 'Universidade de Santiago de Compostela',
  },
  CEUDC: {
    source: 'asociado',
    id: 'ceudc-consello-do-estudantado-universidade-da-coruna-galicia',
    denomination: 'Consello do Estudantado',
    initials: 'CEUDC',
    university: 'Universidade da Coruña',
  },
  CEUVI: {
    source: 'asociado',
    id: 'ceuvi-consello-de-estudantes-universidade-de-vigo-galicia',
    denomination: 'Consello de Estudantes',
    initials: 'CEUVI',
    university: 'Universidade de Vigo',
  },
  CAUB: {
    source: 'asociado',
    id: 'caub-consell-de-l-alumnat-universitat-de-barcelona-cataluna',
    denomination: 'Consell de l’Alumnat',
    initials: 'CAUB',
    university: 'Universitat de Barcelona',
  },
  CEUJI: {
    source: 'asociado',
    id: 'ceuji-consell-de-l-estudiantat-universitat-jaume-i-comunitat-valenciana',
    denomination: "Consell de l'Estudiantat",
    initials: 'CEUJI',
    university: 'Universitat Jaume I',
  },
  CEUdL: {
    source: 'asociado',
    id: 'ceudl-consell-de-l-estudiantat-universitat-de-lleida-cataluna',
    denomination: "Consell de l'Estudiantat",
    initials: 'CEUdL',
    university: 'Universitat de Lleida',
  },
  CEURV: {
    source: 'asociado',
    id: 'ceurv-consell-d-estudiants-universitat-rovira-i-virgili-cataluna',
    denomination: "Consell d'Estudiants",
    initials: 'CEURV',
    university: 'Universitat Rovira i Virgili',
  },
  CEUPF: {
    source: 'asociado',
    id: 'ceupf-consell-d-estudiants-universitat-pompeu-fabra-cataluna',
    denomination: "Consell d'Estudiants",
    initials: 'CEUPF',
    university: 'Universitat Pompeu Fabra',
  },
  CEUPV: {
    source: 'asociado',
    id: 'ceupv-consell-d-estudiants-universitat-politecnica-de-valencia-comunitat-valenciana',
    denomination: "Consell d'Estudiants",
    initials: 'CEUPV',
    university: 'Universitat Politècnica de València',
  },
  CEUIB: {
    source: 'asociado',
    id: 'ceuib-consell-d-estudiants-universitat-de-les-illes-balears-illes-balears',
    denomination: "Consell d'Estudiants",
    initials: 'CEUIB',
    university: 'Universitat de les Illes Balears',
  },
  CGEUNED: {
    source: 'asociado',
    id: 'cgeuned-consejo-general-de-estudiantes-universidad-nacional-de-educacion-a-distancia-comunidad-de-madrid',
    denomination: 'Consejo General de Estudiantes',
    initials: 'CGEUNED',
    university: 'Universidad Nacional de Educación a Distancia',
  },
  CGEUGR: {
    source: 'asociado',
    id: 'cgeugr-consejo-general-de-estudiantes-universidad-de-granada-andalucia',
    denomination: 'Consejo General de Estudiantes',
    initials: 'CGEUGR',
    university: 'Universidad de Granada',
  },
  'CRE-UCLM': {
    source: 'asociado',
    id: 'cre-uclm-consejo-de-representantes-de-estudiantes-universidad-de-castilla-la-mancha-castilla-la-mancha',
    denomination: 'Consejo de Representantes de Estudiantes',
    initials: 'CRE-UCLM',
    university: 'Universidad de Castilla-La Mancha',
  },
  CEURJC: {
    source: 'asociado',
    id: 'ceurjc-consejo-de-estudiantes-universidad-rey-juan-carlos-comunidad-de-madrid',
    denomination: 'Consejo de Estudiantes',
    initials: 'CEURJC',
    university: 'Universidad Rey Juan Carlos',
  },
  CEUPNA: {
    source: 'asociado',
    id: 'ceupna-consejo-de-estudiantes-universidad-publica-de-navarra-comunidad-foral-de-navarra',
    denomination: 'Consejo de Estudiantes',
    initials: 'CEUPNA',
    university: 'Universidad Pública de Navarra',
  },
  CEUPCT: {
    source: 'asociado',
    id: 'ceupct-consejo-de-estudiantes-universidad-politecnica-de-cartagena-region-de-murcia',
    denomination: 'Consejo de Estudiantes',
    initials: 'CEUPCT',
    university: 'Universidad Politécnica de Cartagena',
  },
  CEUZ: {
    source: 'asociado',
    id: 'ceuz-consejo-de-estudiantes-universidad-de-zaragoza-aragon',
    denomination: 'Consejo de Estudiantes',
    initials: 'CEUZ',
    university: 'Universidad de Zaragoza',
  },
  CEUM: {
    source: 'asociado',
    id: 'ceum-consejo-de-estudiantes-universidad-de-murcia-region-de-murcia',
    denomination: 'Consejo de Estudiantes',
    initials: 'CEUM',
    university: 'Universidad de Murcia',
  },
  CEUMA: {
    source: 'asociado',
    id: 'ceuma-consejo-de-estudiantes-universidad-de-malaga-andalucia',
    denomination: 'Consejo de Estudiantes',
    initials: 'CEUMA',
    university: 'Universidad de Málaga',
  },
  CEULe: {
    source: 'asociado',
    id: 'ceule-consejo-de-estudiantes-universidad-de-leon-castilla-y-leon',
    denomination: 'Consejo de Estudiantes',
    initials: 'CEULe',
    university: 'Universidad de León',
  },
  CESTULPGC: {
    source: 'asociado',
    id: 'cestulpgc-consejo-de-estudiantes-universidad-de-las-palmas-de-gran-canaria-canarias',
    denomination: 'Consejo de Estudiantes',
    initials: 'CESTULPGC',
    university: 'Universidad de Las Palmas de Gran Canaria',
  },
  CEUR: {
    source: 'asociado',
    id: 'ceur-consejo-de-estudiantes-universidad-de-la-rioja-la-rioja',
    denomination: 'Consejo de Estudiantes',
    initials: 'CEUR',
    university: 'Universidad de La Rioja',
  },
  CEULL: {
    source: 'asociado',
    id: 'ceull-consejo-de-estudiantes-universidad-de-la-laguna-canarias',
    denomination: 'Consejo de Estudiantes',
    initials: 'CEULL',
    university: 'Universidad de La Laguna',
  },
  CEUJA: {
    source: 'asociado',
    id: 'ceuja-consejo-de-estudiantes-universidad-de-jaen-andalucia',
    denomination: 'Consejo de Estudiantes',
    initials: 'CEUJA',
    university: 'Universidad de Jaén',
  },
  CEUEx: {
    source: 'asociado',
    id: 'ceuex-consejo-de-estudiantes-universidad-de-extremadura-extremadura',
    denomination: 'Consejo de Estudiantes',
    initials: 'CEUEx',
    university: 'Universidad de Extremadura',
  },
  CEUCO: {
    source: 'asociado',
    id: 'ceuco-consejo-de-estudiantes-universidad-de-cordoba-andalucia',
    denomination: 'Consejo de Estudiantes',
    initials: 'CEUCO',
    university: 'Universidad de Córdoba',
  },
  CEUC: {
    source: 'asociado',
    id: 'ceuc-consejo-de-estudiantes-universidad-de-cantabria-cantabria',
    denomination: 'Consejo de Estudiantes',
    initials: 'CEUC',
    university: 'Universidad de Cantabria',
  },
  CEUCA: {
    source: 'asociado',
    id: 'ceuca-consejo-de-estudiantes-universidad-de-cadiz-andalucia',
    denomination: 'Consejo de Estudiantes',
    initials: 'CEUCA',
    university: 'Universidad de Cádiz',
  },
  CEUBU: {
    source: 'asociado',
    id: 'ceubu-consejo-de-estudiantes-universidad-de-burgos-castilla-y-leon',
    denomination: 'Consejo de Estudiantes',
    initials: 'CEUBU',
    university: 'Universidad de Burgos',
  },
  CEUAL: {
    source: 'asociado',
    id: 'ceual-consejo-de-estudiantes-universidad-de-almeria-andalucia',
    denomination: 'Consejo de Estudiantes',
    initials: 'CEUAL',
    university: 'Universidad de Almería',
  },
  CEUAH: {
    source: 'asociado',
    id: 'ceuah-consejo-de-estudiantes-universidad-de-alcala-comunidad-de-madrid',
    denomination: 'Consejo de Estudiantes',
    initials: 'CEUAH',
    university: 'Universidad de Alcalá',
  },
  CEUAM: {
    source: 'asociado',
    id: 'ceuam-consejo-de-estudiantes-universidad-autonoma-de-madrid-comunidad-de-madrid',
    denomination: 'Consejo de Estudiantes',
    initials: 'CEUAM',
    university: 'Universidad Autónoma de Madrid',
  },
  CONDELE: {
    source: 'asociado',
    id: 'condele-consejo-de-delegaciones-de-estudiantes-universidad-de-salamanca-castilla-y-leon',
    denomination: 'Consejo de Delegaciones de Estudiantes',
    initials: 'CONDELE',
    university: 'Universidad de Salamanca',
  },
  CARUH: {
    source: 'asociado',
    id: 'caruh-consejo-de-alumnos-y-representantes-universidad-de-huelva-andalucia',
    denomination: 'Consejo de Alumnos y Representantes',
    initials: 'CARUH',
    university: 'Universidad de Huelva',
  },
  CADUS: {
    source: 'asociado',
    id: 'cadus-consejo-de-alumnos-universidad-de-sevilla-andalucia',
    denomination: 'Consejo de Alumnos',
    initials: 'CADUS',
    university: 'Universidad de Sevilla',
  },
  AGEUV: {
    source: 'asociado',
    id: 'ageuv-assemblea-general-d-estudiants-universitat-de-valencia-comunitat-valenciana',
    denomination: "Assemblea General d'Estudiants",
    initials: 'AGEUV',
    university: 'Universitat de València',
  },
  ANECAFYDE: {
    source: 'sectorial',
    id: 'anecafyde-asamblea-nacional-de-estudiantes-de-ciencias-de-la-actividad-fisica-y-del-deporte',
    denomination:
      'Asamblea Nacional de Estudiantes de Ciencias de la Actividad Física y del Deporte',
    initials: 'ANECAFYDE',
  },
  AERRAAITI: {
    source: 'sectorial',
    id: 'aerraaiti-asociacion-estatal-de-representantes-de-alumnos-de-ingenierias-de-ambito-industrial',
    denomination:
      'Asociación Estatal de Representantes de Alumnos de Ingenierías de ámbito Industrial',
    initials: 'AERRAAITI',
  },
  CESED: {
    source: 'sectorial',
    id: 'cesed-asociacion-nacional-de-estudiantes-de-educacion-y-formacion-del-profesorado',
    denomination: 'Asociación Nacional de Estudiantes de Educación y Formación del Profesorado',
    initials: 'CESED',
  },
  AEAE: {
    source: 'sectorial',
    id: 'aeae-asociacion-de-estudiantes-de-aeronautica-y-espacio-la-asociacion-de-estudiantes-de-aeronautica-y-espacio-es-una-asociacion-sin-animo-de-lucro-que-representa-a-los-estudiantes-espanoles-de-todas-las-facultades-y-escuelas-universitarias-que-imparten-todo-tipo-de-titulaciones-relacionadas-con-la-aeronautica-y-el-espacio',
    denomination: 'Asociación de Estudiantes de Aeronáutica y Espacio',
    initials: 'AEAE',
  },
  AEBE: {
    source: 'sectorial',
    id: 'aebe-asociacion-de-estudiantes-de-biologia-de-espana',
    denomination: 'Asociación de Estudiantes de Biología de España',
    initials: 'AEBE',
  },
  AEEE: {
    source: 'sectorial',
    id: 'aeee-asociacion-estatal-de-estudiantes-de-enfermeria',
    denomination: 'Asociación Estatal de Estudiantes de Enfermería',
    initials: 'AEEE',
  },
  AERELABO: {
    source: 'sectorial',
    id: 'aerelabo-asociacion-interuniversitaria-de-estudiantes-de-relaciones-laborales-y-recursos-humanos-graduados-sociales',
    denomination:
      'Asociación Interuniversitaria de Estudiantes de Relaciones Laborales y Recursos Humanos / Graduados Sociales',
    initials: 'AERELABO',
  },
  NUSGREM: {
    source: 'sectorial',
    id: 'nusgrem-asociacion-nacional-de-estudiantes-de-ciencias-fisicas',
    denomination: 'Asociación Nacional de Estudiantes de Ciencias Físicas',
    initials: 'NUSGREM',
  },
  ANEM: {
    source: 'sectorial',
    id: 'anem-asociacion-nacional-de-estudiantes-de-matematicas',
    denomination: 'Asociación Nacional de Estudiantes de Matemáticas',
    initials: 'ANEM',
  },
  ARELL: {
    source: 'sectorial',
    id: 'arell-asociacion-de-representantes-de-estudiantes-de-lenguas-y-literaturas',
    denomination: 'Asociación de Representantes de Estudiantes de Lenguas y Literaturas',
    initials: 'ARELL',
  },
  ASEQ: {
    source: 'sectorial',
    id: 'aseq-asociacion-sectorial-de-estudiantes-de-quimica',
    denomination: 'Asociación Sectorial de Estudiantes de Química',
    initials: 'ASEQ',
  },
  CREIC: {
    source: 'sectorial',
    id: 'creic-colectivo-de-representantes-de-estudiantes-de-ingenieria-de-caminos-canales-y-puertos-y-la-ingenieria-civil',
    denomination:
      'Colectivo de Representantes de Estudiantes de Ingeniería de Caminos, Canales y Puertos y la Ingeniería Civil',
    initials: 'CREIC',
  },
  'CEP-PIE': {
    source: 'sectorial',
    id: 'cep-pie-colectivo-de-estudiantes-de-psicologia',
    denomination: 'Colectivo de Estudiantes de Psicología',
    initials: 'CEP-PIE',
  },
  CREARQ: {
    source: 'sectorial',
    id: 'crearq-consejo-de-representantes-de-estudiantes-de-arquitectura',
    denomination: 'Consejo de Representantes de Estudiantes de Arquitectura',
    initials: 'CREARQ',
  },
  CEEM: {
    source: 'sectorial',
    id: 'ceem-consejo-de-estudiantes-de-medicina',
    denomination: 'Consejo de Estudiantes de Medicina',
    initials: 'CEEM',
  },
  CEET: {
    source: 'sectorial',
    id: 'ceet-consejo-estatal-de-estudiantes-de-telecomunicacion',
    denomination: 'Consejo Estatal de Estudiantes de Telecomunicación',
    initials: 'CEET',
  },
  FEEF: {
    source: 'sectorial',
    id: 'feef-federacion-espanola-de-estudiantes-de-farmacia',
    denomination: 'Federación Española de Estudiantes de Farmacia',
    initials: 'FEEF',
  },
  RITSI: {
    source: 'sectorial',
    id: 'ritsi-reunion-de-estudiantes-de-ingenierias-y-titulaciones-del-sector-de-la-informatica-somos-una-asociacion-a-nivel-estatal-fundada-en-el-ano-1992-que-tiene-por-objetivo-coordinar-y-representar-a-todo-el-estudiantado-de-ingenierias-en-informatica-y-otras-titulaciones-del-ambito-a-traves-de-sus-delegaciones-o-consejos',
    denomination:
      'Reunión de Estudiantes de Ingenierías y Titulaciones del Sector de la Informática',
    initials: 'RITSI',
  },
  SIUEH: {
    source: 'sectorial',
    id: 'siueh-sectorial-interuniversitaria-de-estudiantes-de-humanidades',
    denomination: 'Sectorial Interuniversitaria de Estudiantes de Humanidades',
    initials: 'SIUEH',
  },
  SIEC: {
    source: 'sectorial',
    id: 'siec-sociedad-interuniversitaria-de-estudiantes-de-criminologia',
    denomination: 'Sociedad Interuniversitaria de Estudiantes de Criminología',
    initials: 'SIEC',
  },
}

/** Look up a seed member org by its initials, throwing if unknown (fail fast in the seed). */
export function memberOrg(initials: string): SeedMemberOrg {
  const org = MEMBER_ORGS[initials]
  if (!org) throw new Error(`Unknown member org initials: ${initials}`)
  return org
}
