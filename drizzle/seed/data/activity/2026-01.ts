/**
 * January 2026 "Actividad" seed module, migrated from the discontinued monthly newsletter PDF
 * (public/prensa/newsletter/documentos/newsletter-2026-01.pdf).
 *
 * Spanish-only on purpose: parents + the `es` translation are seeded; the other five locales are
 * backfilled later (same staged approach the press seed uses). Inserted idempotently by the
 * aggregator (./index.ts → drizzle/seed/content.ts) on the natural keys, so re-running is safe.
 *
 * Mandate: this edition belongs to the current org chart → CURRENT_AREAS.
 */
import type { SeedNewsletterMonth } from './types'
import { CURRENT_AREAS } from './areas'

const PLACEHOLDER_DATE = '2026-01-01'

const month: SeedNewsletterMonth = {
  monthKey: '2026-01',
  coversFrom: null,
  entries: [
    {
      slug: 'reunion-coordinacion-encuentro-congreso-creup-crue-enero-2026',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      isOnline: true,
      location: null,
      image:
        '/transparencia/actividad/imagenes/reunion-coordinacion-encuentro-congreso-creup-crue-enero-2026.webp',
      es: {
        title: 'Reunión de coordinación para la preparación del Encuentro y el Congreso CREUP-CRUE',
        excerpt:
          'Reunión de trabajo para definir los contenidos del próximo Encuentro de Estudiantes y del Congreso CREUP-CRUE.',
        contentHtml:
          '<p>El Área de Coordinación Interna y Formación mantuvo una reunión de trabajo junto con la Presidencia y la Vicepresidencia de Política Universitaria con el objetivo de definir los contenidos del próximo Encuentro de Estudiantes y del Congreso CREUP-CRUE.</p><p>Durante la sesión, en la que participaron la Presidencia, la Vicepresidencia de Política Universitaria y la Vicepresidencia de Coordinación Interna y Formación, se abordaron y consensuaron las principales temáticas que articularán ambos espacios de debate y participación estudiantil.</p>',
        alt: 'Captura de la reunión por videollamada de coordinación del Encuentro y el Congreso CREUP-CRUE.',
      },
    },
    {
      slug: 'reunion-excoordinador-cientifico-eurostudent-enero-2026',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      isOnline: true,
      location: null,
      image:
        '/transparencia/actividad/imagenes/reunion-excoordinador-cientifico-eurostudent-enero-2026.webp',
      es: {
        title: 'Reunión con el excoordinador científico de EUROSTUDENT',
        excerpt:
          'Reunión sobre los resultados de la última ronda de EUROSTUDENT y la posible inclusión de España.',
        contentHtml:
          '<p>La Dirección de Relaciones Institucionales mantuvo una reunión con el excoordinador científico de EUROSTUDENT en la que se abordaron los resultados de la última ronda del proyecto y el análisis posterior de los mismos.</p><p>Asimismo, se trató la posible inclusión de España en la próxima ronda de EUROSTUDENT.</p>',
        alt: 'Captura de la videollamada de CREUP con el excoordinador científico de EUROSTUDENT.',
      },
    },
    {
      slug: 'reunion-grupo-trabajo-ii-jornadas-participacion-enero-2026',
      kind: 'creup',
      startDate: '2026-01-15',
      isOnline: true,
      location: null,
      image:
        '/transparencia/actividad/imagenes/reunion-grupo-trabajo-ii-jornadas-participacion-enero-2026.webp',
      es: {
        title: 'Reunión del grupo de trabajo de las II Jornadas de Participación CREUP-CRUE',
        excerpt:
          'El 15 de enero se cerró el cronograma y los contenidos de las II Jornadas de Participación CREUP-CRUE.',
        contentHtml:
          '<p>El pasado 15 de enero se llevó a cabo la reunión del grupo de trabajo para las II Jornadas de Participación CREUP-CRUE. Durante la sesión, la Vicepresidenta de Política Universitaria ha trabajado en el cierre definitivo del cronograma y de los contenidos que estructurarán las jornadas.</p><p>Estas jornadas, que se celebrarán los próximos 18 y 19 de marzo, tienen como objetivo seguir reforzando los espacios de participación estudiantil y el diálogo entre representantes del estudiantado y las universidades, consolidándose como un punto de encuentro clave para el debate y la mejora de la política universitaria.</p>',
        alt: 'Captura de la videollamada del grupo de trabajo de las II Jornadas de Participación CREUP-CRUE.',
      },
    },
    {
      slug: 'lanzamiento-campus-rural-2026-enero-2026',
      kind: 'creup',
      startDate: '2026-01-15',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/lanzamiento-campus-rural-2026-enero-2026.webp',
      es: {
        title: 'Lanzamiento de Campus Rural 2026',
        excerpt:
          'El 15 de enero se celebró la reunión de lanzamiento de Campus Rural 2026, con balance de la edición anterior y novedades.',
        contentHtml:
          '<p>El pasado 15 de enero se celebró la Reunión de Lanzamiento de Campus Rural 2026, un encuentro clave para hacer balance de la edición anterior y presentar las principales novedades de la próxima convocatoria del programa.</p><p>Durante la sesión se expusieron los datos relativos a la participación en la última edición, destacando el alto grado de satisfacción del estudiantado, así como la colaboración establecida con centros de acogida y entidades interesadas.</p><p>Asimismo, se presentó la hoja de ruta de Campus Rural 2026, detallando los plazos y líneas estratégicas de la próxima convocatoria. La reunión incluyó también un espacio dedicado al intercambio de buenas prácticas entre las universidades participantes, fomentando la mejora continua del programa.</p>',
        alt: 'Pantalla de portátil mostrando la presentación de lanzamiento de Campus Rural 2026.',
      },
    },
    {
      slug: 'firma-convenio-canae-enero-2026',
      kind: 'creup',
      startDate: '2026-01-17',
      location: 'Universidad de Granada',
      image: '/transparencia/actividad/imagenes/firma-convenio-canae-enero-2026.webp',
      es: {
        title:
          'CREUP firma un convenio con la Confederación Estatal de Asociaciones de Estudiantes (CANAE)',
        excerpt:
          'El 17 de enero se firmó en la Universidad de Granada el convenio de colaboración entre CREUP y CANAE.',
        contentHtml:
          '<p>El pasado 17 de enero tuvo lugar la firma del convenio de colaboración entre la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) y la Confederación Estatal de Asociaciones de Estudiantes (CANAE).</p><p>Este acuerdo, aprobado previamente en la 30ª Asamblea General Extraordinaria de CREUP, se formalizó en la Universidad de Granada. Tras la firma, se celebró una reunión de trabajo conjunta con la presidenta de CANAE, en la que se abordaron líneas de colaboración y objetivos comunes entre ambas organizaciones.</p>',
        alt: 'Firma del convenio de colaboración entre CREUP y CANAE en la Universidad de Granada.',
      },
    },
    {
      slug: 'xxxi-asamblea-general-extraordinaria-telematica-enero-2026',
      kind: 'creup',
      startDate: '2026-01-28',
      isOnline: true,
      location: null,
      image:
        '/transparencia/actividad/imagenes/xxxi-asamblea-general-extraordinaria-telematica-enero-2026.webp',
      es: {
        title: 'XXXI Asamblea General Extraordinaria Telemática',
        excerpt:
          'El 28 de enero se celebró la 31ª Asamblea General Extraordinaria Telemática de CREUP, con la ratificación de acuerdos y la elección de la sede de la 80ª AGO.',
        contentHtml:
          '<p>El pasado 28 de enero se celebró la 31ª Asamblea General Extraordinaria Telemática (AGET) de CREUP, en la que se abordaron diversos asuntos clave para el funcionamiento y la representación estudiantil a nivel estatal. Durante la sesión se procedió a la ratificación de los acuerdos adoptados por la Comisión Ejecutiva, así como de los miembros de la Comisión Ejecutiva Ampliada.</p><p>Asimismo, se revisaron y aprobaron los puntos del orden del día del Consejo de Estudiantes Universitario del Estado (CEUNE), se eligieron los miembros asamblearios del Comité de Asuntos Internacionales y se acordó la sede de la 80ª Asamblea General Ordinaria.</p>',
        alt: 'Pantalla de portátil con la cuadrícula de participantes de la Asamblea General Extraordinaria Telemática de CREUP.',
      },
    },
  ],
  areaReports: [
    {
      area: CURRENT_AREAS.PRESIDENCIA,
      image: '/transparencia/informes-areas/imagenes/informe-presidencia-enero-2026.webp',
      es: {
        contentHtml:
          '<p>Durante este mes, el área de Presidencia de CREUP ha reforzado su actividad en los ámbitos internacional, de cooperación y de relaciones institucionales. Hemos mantenido reuniones de área en las que hemos coordinado nuestra actividad y preparado la CEA, que tendrá lugar a finales de mes. En el plano internacional, España ha sido el país con mayor participación en la encuesta de doctorado de ESU, y Daniel y Carlos se han incorporado al CAI, fortaleciendo el trabajo en iniciativas que ya teníamos iniciadas, como el proyecto Students At Risk (StAR) y el seguimiento de los ESG.</p><p>En el ámbito de la cooperación, se ha avanzado en conversaciones con la Red Reconoce para explorar posibles vías de colaboración; hemos consultado a YOUNGO sobre el papel que podría desempeñar CREUP en las dinámicas de las conferencias locales de la ONU sobre el clima, y hemos asistido al lanzamiento del programa Campus Rural 2026.</p><p>En cuanto a las relaciones institucionales, se han mantenido reuniones para trabajar el EEU; hemos contactado con el Ministerio para analizar qué acciones se podrían llevar a cabo en el marco del proyecto Eurostudent, así como con Cruz Roja Juventud para idear posibles colaboraciones en materia de sensibilización, consolidando líneas de colaboración.</p>',
        alt: 'Retrato del responsable del área de Presidencia de CREUP.',
      },
    },
    {
      area: CURRENT_AREAS.SECRETARIA,
      image:
        '/transparencia/informes-areas/imagenes/informe-secretaria-ejecutiva-y-direccion-de-gabinete-enero-2026.webp',
      es: {
        contentHtml:
          '<p>Desde el Área de Secretaría Ejecutiva y Dirección de Gabinete se ha estado trabajando en tres líneas fundamentales durante este mes. En primer lugar, se ha priorizado, por parte de la Vocalía de Digitalización y en colaboración con el Secretario Ejecutivo y el Tesorero, la modificación del apartado de gestión económica de la intranet, con el fin de adecuarlo al nuevo sistema presupuestario de la asociación, realizando una mejora significativa para un mayor control de los gastos e ingresos de la misma.</p><p>En segundo lugar, en la actividad común de la Secretaría Ejecutiva, se han concluido los procesos de selección de las dos últimas vocalías vacantes, además de haberse dado comienzo al procedimiento de elección del nuevo Órgano de Coordinación del Comité de Asuntos Sectoriales. Asimismo, el Secretario Ejecutivo acudió a la firma del convenio con CANAE, celebrada en la Universidad de Granada.</p><p>Por último, en lo relativo a la Dirección de Gabinete, junto con la Presidencia y la Dirección de Relaciones Institucionales, así como con el apoyo del Área de Política Universitaria, se ha estado trabajando en el anteproyecto del Estatuto del Estudiante Universitario.</p>',
        alt: 'Retrato del responsable del área de Secretaría Ejecutiva y Dirección de Gabinete de CREUP.',
      },
    },
    {
      area: CURRENT_AREAS.TESORERIA,
      image: '/transparencia/informes-areas/imagenes/informe-tesoreria-enero-2026.webp',
      es: {
        contentHtml:
          '<p>Durante este periodo, el Área de Tesorería de CREUP participó activamente en la 30.ª AGET y en el trabajo burocrático de la organización del encuentro. Asimismo, centró su labor en poner al día la contabilidad de la asociación, abordando los retrasos acumulados durante el año, así como en la revisión de la contabilidad de los últimos ejercicios.</p><p>Además, junto al área de Secretaría y a la Vocalía de Digitalización, se ha realizado un importante trabajo de rediseño de la intranet, especialmente en el apartado de gestión económica, y se han incorporado los presupuestos de 2026. También se ha iniciado la facturación de las cuotas correspondientes a 2026.</p><p>Por último, se ha elaborado y enviado la solicitud de subvención para asociaciones del Ministerio de Universidades, se ha llevado a cabo un seguimiento de los deudores y se han creado protocolos para poder solucionar su situación.</p>',
        alt: 'Retrato del responsable del área de Tesorería de CREUP.',
      },
    },
    {
      area: CURRENT_AREAS.COMUNICACION,
      image: '/transparencia/informes-areas/imagenes/informe-comunicacion-enero-2026.webp',
      es: {
        contentHtml:
          '<p>El Área de Comunicación ha estado trabajando, sobre todo, en la identidad visual del VII Congreso CREUP-CRUE y del XV Encuentro de Representantes, que se celebrará en el mes de febrero.</p><p>Además, nos hemos centrado en organizar todas las cuestiones relativas a la comunicación interna, tanto de la CEA como las correspondientes a la Asamblea, con el objetivo de que el trabajo sea más efectivo, reestructurando formularios y algunos procesos. Se ha creado el Grupo de Trabajo de Comunicación, que empezará a funcionar el próximo mes. Asimismo, hemos mantenido informada a la comunidad sobre la actividad de CREUP a través de las redes sociales y estamos planificando nuevas estrategias y campañas para el año 2026.</p>',
        alt: 'Retrato de la responsable del área de Comunicación y Difusión de CREUP.',
      },
    },
    {
      area: CURRENT_AREAS.POLITICA,
      image:
        '/transparencia/informes-areas/imagenes/informe-politica-universitaria-enero-2026.webp',
      es: {
        contentHtml:
          '<p>Este mes, desde el área de Política Universitaria, hemos estado trabajando principalmente de manera interna con el objetivo de plantear y estructurar la documentación necesaria de cara a la próxima asamblea. Asimismo, se ha avanzado en la definición de los contenidos del próximo Congreso CREUP-CRUE y del Encuentro de Representantes de Estudiantes, que tendrá lugar el próximo 26 de febrero.</p><p>Paralelamente a este trabajo, hemos diseñado y fijado las estrategias de comunicación que acompañarán a cada uno de los documentos elaborados, con el fin de reforzar su difusión y garantizar una mayor incidencia en el conjunto del Sistema Universitario Español (SUE).</p>',
        alt: 'Retrato de la responsable del área de Política Universitaria de CREUP.',
      },
    },
    {
      area: CURRENT_AREAS.COORDINACION,
      image:
        '/transparencia/informes-areas/imagenes/informe-coordinacion-interna-y-formacion-enero-2026.webp',
      es: {
        contentHtml:
          '<p>Durante este mes, desde el área de Coordinación Interna y Formación hemos centrado nuestro trabajo en el refuerzo del contacto con los MOREs y las sectoriales de la entidad. Se han mantenido reuniones de toma de contacto con el objetivo de conocer de primera mano sus necesidades, su realidad actual y las posibles líneas de trabajo conjunto con CREUP, así como de resolver dudas relacionadas con el funcionamiento interno y los próximos eventos.</p><p>Asimismo, hemos participado en reuniones de coordinación con sede en el marco del encuentro CREUP-CRUE, en las que se han abordado aspectos logísticos y organizativos junto a diferentes áreas de CREUP. De forma paralela, se ha continuado con el contacto directo y permanente con los MOREs y las sectoriales a través de los grupos de Telegram, revisando la información disponible en la intranet y actualizando los datos de los distintos canales de comunicación.</p><p>También se ha avanzado en la preparación de contenidos dinámicos de cara a la próxima CEA, en la definición de los contenidos del encuentro CREUP-CRUE y en la planificación general del curso.</p>',
        alt: 'Retrato de la responsable del área de Coordinación Interna y Formación de CREUP.',
      },
    },
    {
      area: CURRENT_AREAS.ORGANIZACION,
      image: '/transparencia/informes-areas/imagenes/informe-organizacion-enero-2026.webp',
      es: {
        contentHtml:
          '<p>Durante este periodo, el Área de Organización se ha conformado definitivamente con la elección de la Vocalía de Logística. De este modo, se celebró en primer lugar una reunión de toma de contacto y formación sobre las herramientas disponibles para la CEA.</p><p>Nuestro trabajo se ha centrado en los eventos que tendrán lugar en este primer cuatrimestre del año:</p><ul><li>La CEA presencial en Sevilla, organizando los viajes de todos los miembros y la logística necesaria para el alojamiento y las sesiones de trabajo.</li><li>El VII Congreso CREUP-CRUE y el XV Encuentro de Representantes en la UPV, coordinándonos con la sede mediante reuniones y un seguimiento continuo del trabajo. Se han abierto las inscripciones para ambos eventos y se están atendiendo todas las dudas recibidas.</li><li>La 79.ª AGO en la UJI, tomando contacto con la sede e iniciando las primeras tareas organizativas.</li></ul><p>Además, se envió a los MOREs y a las sectoriales un formulario en el que se recogía su disponibilidad para asistir a los eventos de la primera parte del año.</p>',
        alt: 'Retrato de la responsable del área de Organización de CREUP.',
      },
    },
  ],
}

export default month
