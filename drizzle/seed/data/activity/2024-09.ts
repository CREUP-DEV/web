/**
 * September 2024 "Actividad" seed module, migrated from the discontinued monthly newsletter PDF
 * (public/prensa/newsletter/documentos/newsletter-2024-09.pdf).
 *
 * Spanish-only on purpose: parents + the `es` translation are seeded; the other five locales are
 * backfilled later (same staged approach the press seed uses). Inserted idempotently by the
 * aggregator (./index.ts → drizzle/seed/content.ts) on the natural keys, so re-running is safe.
 *
 * Mandate: this edition belongs to the previous org chart → PREVIOUS_AREAS.
 * Structure of this edition: a "NOTICIAS" section (CREUP's own meetings/events → kind:'creup') and
 * a "PONTE AL DÍA / Informe de trabajo mensual" section (the monthly area reports). There is no
 * "Mi asamblea" section in this newsletter, so there are no member-organisation events.
 */
import type { SeedNewsletterMonth } from './types'
import { PREVIOUS_AREAS } from './areas'

const month: SeedNewsletterMonth = {
  monthKey: '2024-09',
  coversFrom: null,
  entries: [
    {
      slug: 'cea-presencial-toledo-septiembre-2024',
      kind: 'creup',
      startDate: '2024-09-11',
      endDate: '2024-09-14',
      location: 'Toledo',
      image: '/transparencia/actividad/imagenes/cea-presencial-toledo-septiembre-2024.webp',
      es: {
        title: 'La Comisión Ejecutiva Ampliada de CREUP se reúne de forma presencial en Toledo',
        excerpt:
          'Del 11 al 14 de septiembre, la Comisión Ejecutiva Ampliada de CREUP se reunió en Toledo para definir la hoja de ruta del curso 24/25.',
        contentHtml:
          '<p>Los pasados días 11 al 14 de septiembre, la Comisión Ejecutiva Ampliada de CREUP se dio cita en Toledo. Allí pudieron poner en común la hoja de ruta que llevará el equipo durante el próximo curso 24/25.</p><p>Durante las jornadas, se trabajó en la planificación de las principales iniciativas y proyectos que marcarán el año académico, poniendo especial énfasis en la mejora de los servicios al estudiantado, la promoción de actividades relacionadas con este ámbito, así como el fortalecimiento de la representación estudiantil en los diferentes órganos de la universidad.</p><p>Se destacaron varios puntos clave, entre ellos, el impulso a la participación estudiantil en la toma de decisiones, la modernización de los canales de comunicación con el alumnado, y el desarrollo de nuevos programas de formación complementaria que respondan a las demandas actuales del mercado laboral. Asimismo, se discutió la importancia de fomentar el bienestar emocional de los estudiantes, con propuestas de actividades de apoyo psicológico y gestión del estrés académico.</p><p>El encuentro en Toledo permitió reforzar la cohesión entre los miembros de la comisión y sentar las bases de un curso que se proyecta dinámico y lleno de retos. Entre las próximas acciones, se contempla la organización de eventos de bienvenida para el nuevo alumnado, campañas de sensibilización en temas de sostenibilidad y diversidad, y la creación de nuevas plataformas digitales para una mayor accesibilidad a los recursos universitarios.</p>',
        alt: 'Equipo de CREUP reunido en Toledo durante la Comisión Ejecutiva Ampliada presencial, con el Alcázar de Toledo al fondo.',
      },
    },
    {
      slug: 'reunion-grupo-parlamentario-socialista-septiembre-2024',
      kind: 'creup',
      startDate: '2024-09-03',
      location: 'Congreso de los Diputados, Madrid',
      image:
        '/transparencia/actividad/imagenes/reunion-grupo-parlamentario-socialista-septiembre-2024.webp',
      es: {
        title: 'CREUP se reúne con el Grupo Parlamentario Socialista',
        excerpt:
          'El 3 de septiembre, Germán y César presentaron al Grupo Parlamentario Socialista en el Congreso las propuestas de CREUP sobre el Estatuto del Becario.',
        contentHtml:
          '<p>El día 3 de septiembre los compañeros Germán (Vicepresidente de Relaciones Institucionales y Proyectos) y César (Secretaría Ejecutiva) se reunieron con el Grupo Parlamentario Socialista en el Congreso. En dicha reunión se mostró a los parlamentarios las propuestas de CREUP sobre el Estatuto del Becario.</p>',
        alt: 'Representantes de CREUP con miembros del Grupo Parlamentario Socialista en el Congreso de los Diputados.',
      },
    },
    {
      slug: 'cursos-uimp-santander-septiembre-2024',
      kind: 'creup',
      startDate: '2024-09-05',
      location: 'Santander',
      image: '/transparencia/actividad/imagenes/cursos-uimp-santander-septiembre-2024.webp',
      es: {
        title: 'CREUP acude a los cursos de la UIMP',
        excerpt:
          'El 5 de septiembre, el presidente Alfonso Campuzano participó en Santander en la mesa redonda "LOSU: Desafíos y oportunidades en su implementación".',
        contentHtml:
          '<p>El día 5 de septiembre, el presidente de CREUP, Alfonso Campuzano, estuvo presente en el curso de la UIMP celebrado en Santander. En dicho curso, Alfonso participó en la mesa redonda titulada "LOSU: Desafíos y oportunidades en su implementación".</p><p>Durante la mesa redonda, se abordaron temas clave sobre cómo la nueva Ley Orgánica del Sistema Universitario (LOSU) afectará a las instituciones académicas en España. Alfonso Campuzano compartió la visión de CREUP sobre los retos que enfrentarán las universidades en la adaptación a esta normativa, destacando la importancia de aprovechar las oportunidades para mejorar la calidad educativa y la gestión institucional.</p>',
        alt: 'Mesa redonda sobre la LOSU en el curso de la UIMP celebrado en Santander.',
      },
    },
    {
      slug: '25-ago-cje-septiembre-2024',
      kind: 'creup',
      startDate: '2024-09-07',
      endDate: '2024-09-08',
      image: '/transparencia/actividad/imagenes/25-ago-cje-septiembre-2024.webp',
      es: {
        title: 'CREUP asiste a la 25ª AGO del Consejo de la Juventud de España (CJE)',
        excerpt:
          'Los días 7 y 8 de septiembre, el presidente Alfonso Campuzano y la Vocal de Igualdad y Cooperación al Desarrollo, Marta Díaz, asistieron a la 25ª AGO del CJE.',
        contentHtml:
          '<p>El presidente de CREUP, Alfonso Campuzano, y la Vocal de Igualdad y Cooperación al Desarrollo, Marta Díaz, asistieron durante los días 7 y 8 de septiembre a la 25ª AGO del CJE.</p><p>En dicha asamblea, los representantes de CREUP llevaron la voz de los estudiantes a las políticas que afectan a la juventud. Desde CREUP se sigue trabajando para que las propuestas se escuchen y se traduzcan en acciones concretas.</p>',
        alt: 'Representantes de CREUP en la 25ª Asamblea General Ordinaria del Consejo de la Juventud de España.',
      },
    },
    {
      slug: 'dia-mundial-prevencion-suicidio-septiembre-2024',
      kind: 'creup',
      startDate: '2024-09-10',
      image:
        '/transparencia/actividad/imagenes/dia-mundial-prevencion-suicidio-septiembre-2024.webp',
      es: {
        title: 'CREUP conmemora el Día Mundial de la Prevención del Suicidio',
        excerpt:
          'El 10 de septiembre, CREUP se sumó al Día Mundial de la Prevención del Suicidio, reclamando un mayor compromiso con la salud mental de la comunidad universitaria.',
        contentHtml:
          '<p>El día 10 de septiembre se conmemora el Día Mundial de la Prevención del Suicidio. Cada año más de 800.000 personas pierden la vida por suicidio, siendo la segunda causa de muerte entre jóvenes de 15 a 29 años.</p><p>En España, la tasa de suicidio ha aumentado, y cada vez afecta más al estudiantado universitario. Desde CREUP se recuerda que «NO ESTÁS SOLO/A». Por ello, se solicita que el Sistema Universitario Español y todos sus agentes implicados aboguen por el compromiso hacia la salud mental de la comunidad universitaria.</p>',
        alt: 'Cartel de CREUP por el Día Mundial de la Prevención del Suicidio, con un lazo amarillo entre dos manos.',
      },
    },
    {
      slug: 'esc-european-students-convention-varsovia-septiembre-2024',
      kind: 'creup',
      startDate: '2024-09-19',
      location: 'Varsovia, Polonia',
      image:
        '/transparencia/actividad/imagenes/esc-european-students-convention-varsovia-septiembre-2024.webp',
      es: {
        title: 'CREUP acude a la European Students’ Convention de la European Students’ Union',
        excerpt:
          'El 19 de septiembre, la Vocal de Internacionalización, Ainhoa Serrano, se desplazó a Varsovia para participar en la European Students’ Convention.',
        contentHtml:
          '<p>El día 19 de septiembre la Vocal de Internacionalización de CREUP, Ainhoa Serrano, se desplazó hasta Varsovia para participar en la European Students’ Convention.</p><p>CREUP sigue aprendiendo de las políticas de los países vecinos en materia de juventud y derechos estudiantiles. De esta manera marca sus líneas de trabajo en materia de internacionalización y política universitaria.</p>',
        alt: 'Estudiantes en la European Students’ Convention celebrada en Varsovia.',
      },
    },
    {
      slug: 'reunion-consejo-estudiantes-uclm-toledo-septiembre-2024',
      kind: 'creup',
      startDate: '2024-09-11',
      endDate: '2024-09-14',
      location: 'Toledo',
      image:
        '/transparencia/actividad/imagenes/reunion-consejo-estudiantes-uclm-toledo-septiembre-2024.webp',
      es: {
        title:
          'CREUP se reúne con el Consejo de Estudiantes de la UCLM durante la CEA presencial en Toledo',
        excerpt:
          'Durante la CEA presencial en Toledo, CREUP aprovechó para reunirse con el Consejo de Estudiantes de la Universidad de Castilla-La Mancha (UCLM).',
        contentHtml:
          '<p>Durante la celebración de la CEA presencial en Toledo, CREUP aprovechó para reunirse con el Consejo de Estudiantes de la Universidad de Castilla-La Mancha (UCLM).</p><p>Tanto CREUP como el Consejo de Estudiantes de la UCLM reafirmaron su compromiso de seguir colaborando estrechamente para garantizar que las voces de los estudiantes sean escuchadas en todos los niveles de la toma de decisiones.</p>',
        alt: 'Encuentro entre CREUP y el Consejo de Estudiantes de la Universidad de Castilla-La Mancha en Toledo.',
      },
    },
    {
      slug: 'xv-aniversario-creic-septiembre-2024',
      kind: 'creup',
      startDate: '2024-09-22',
      image: '/transparencia/actividad/imagenes/xv-aniversario-creic-septiembre-2024.webp',
      es: {
        title: 'CREUP está presente en el XV aniversario de CREIC',
        excerpt:
          'El 22 de septiembre, el Vicepresidente de Relaciones Institucionales y Proyectos, Germán Gutiérrez, asistió al XV aniversario de CREIC.',
        contentHtml:
          '<p>El día 22 de septiembre el Vicepresidente de Relaciones Institucionales y Proyectos, Germán Gutiérrez, estuvo presente en el XV aniversario de CREIC (Colectivo de Representantes de Estudiantes de Ingeniería de Caminos, Canales y Puertos y la Ingeniería Civil).</p>',
        alt: 'El Vicepresidente de Relaciones Institucionales y Proyectos de CREUP en el XV aniversario de CREIC.',
      },
    },
    {
      slug: 'evaluacion-externa-madrid-mas-d-septiembre-2024',
      kind: 'creup',
      startDate: '2024-09-26',
      image:
        '/transparencia/actividad/imagenes/evaluacion-externa-madrid-mas-d-septiembre-2024.webp',
      es: {
        title: 'CREUP participa en la evaluación externa de Madri+d',
        excerpt:
          'El 26 de septiembre, el Vicepresidente de Relaciones Institucionales y Proyectos participó en la evaluación externa de la Fundación para el Conocimiento Madri+d.',
        contentHtml:
          '<p>El día 26 de septiembre el Vicepresidente de Relaciones Institucionales y Proyectos participó en el proceso de evaluación externa de la Fundación para el Conocimiento Madri+d, coordinado por la European Association for Quality Assurance in Higher Education (ENQA).</p>',
        alt: 'El Vicepresidente de Relaciones Institucionales y Proyectos de CREUP en el proceso de evaluación externa de Madri+d.',
      },
    },
    {
      slug: 'iii-jornadas-formacion-ceeina-zaragoza-septiembre-2024',
      kind: 'creup',
      startDate: '2024-09-17',
      endDate: '2024-09-22',
      location: 'Universidad de Zaragoza',
      image:
        '/transparencia/actividad/imagenes/iii-jornadas-formacion-ceeina-zaragoza-septiembre-2024.webp',
      es: {
        title: 'CREUP colabora en las III Jornadas de Formación de CEEINA',
        excerpt:
          'Entre el 17 y el 22 de septiembre, tres representantes de CREUP participaron como formadores en las jornadas de capacitación organizadas por el CEEINA de la Universidad de Zaragoza.',
        contentHtml:
          '<p>Entre los días 17 y 22 de septiembre, tres representantes clave de la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) participaron como formadores en las jornadas de capacitación organizadas por el Consejo de Estudiantes de la Escuela de Ingeniería y Arquitectura de la Universidad de Zaragoza. El evento, presidido por Jorge Lahoz, vicepresidente de Política Universitaria de CREUP, contó con la participación de Alfonso Campuzano, Mª Ángeles Guzmán y Pablo Nieto, quienes ofrecieron una formación especializada en base a sus respectivos cargos.</p><p>Alfonso Campuzano, como presidente de CREUP, centró su intervención en la importancia del liderazgo estudiantil y la capacidad de los representantes para influir en los procesos de toma de decisiones dentro del ámbito universitario.</p><p>Mari Ángeles Guzmán, como vicepresidenta de Comunicación de CREUP, ofreció una formación centrada en el desarrollo de estrategias de comunicación y la gestión de la imagen institucional del Consejo de Estudiantes.</p><p>Pablo Nieto, vocal de Garantía de Calidad de CREUP, se enfocó en la relevancia de los sistemas de evaluación y mejora continua en la calidad educativa. Nieto explicó a los asistentes cómo funciona el proceso de garantía de calidad dentro de las universidades, desde la autoevaluación interna hasta las auditorías externas, destacando el papel esencial que juegan los representantes estudiantiles en estos procesos. Además, brindó una guía sobre cómo recopilar y analizar datos para identificar áreas de mejora en los programas académicos y cómo hacer que las propuestas de mejora sean escuchadas y ejecutadas por las administraciones universitarias.</p>',
        alt: 'Representantes de CREUP que participaron como formadores en las III Jornadas de Formación de CEEINA en la Universidad de Zaragoza.',
      },
    },
  ],
  areaReports: [
    {
      area: PREVIOUS_AREAS.PRESIDENCIA,
      image: '/transparencia/informes-areas/imagenes/informe-presidencia-septiembre-2024.webp',
      es: {
        contentHtml:
          '<p>Durante el mes de septiembre, el área de Presidencia de CREUP ha centrado sus esfuerzos en varios proyectos importantes destinados a fortalecer la representación estudiantil y la inclusión social. Entre los avances más destacados, se encuentra la finalización de los acuerdos con FONCE, que permitirá el inicio de un curso especializado para representantes en materia de inclusión de la discapacidad.</p><p>En el ámbito internacional, CREUP ha trabajado en conjunto con el Comité de Asuntos Internacionales (CAI) para definir los objetivos del curso 2024/2025. Además, se han restablecido comunicaciones con MEDNET, la Red Mediterránea de Estudiantes, con el fin de retomar proyectos conjuntos y analizar el futuro de esta colaboración. En representación de CREUP, Ainhoa y Celia asistieron al European Students’ Convention (ESC), donde tuvieron la oportunidad de intercambiar ideas con otras uniones estudiantiles europeas, abordando temas tan relevantes como la inteligencia artificial y su impacto en la educación.</p><p>Finalmente, el área de Presidencia también ha estado trabajando en la planificación operativa de la organización para el nuevo mandato, estableciendo objetivos basados en un análisis exhaustivo de la situación actual de la Asociación y las necesidades del estudiantado español. Estos esfuerzos pretenden reforzar la estrategia de CREUP y garantizar que las voces de los estudiantes sean escuchadas a nivel nacional e internacional.</p>',
        alt: 'Tres miembros del equipo de Presidencia de CREUP durante la Comisión Ejecutiva Ampliada en Toledo.',
      },
    },
    {
      area: PREVIOUS_AREAS.RRII,
      image:
        '/transparencia/informes-areas/imagenes/informe-relaciones-institucionales-y-proyectos-septiembre-2024.webp',
      es: {
        contentHtml:
          '<p>Durante el mes de septiembre, la Vicepresidencia de Relaciones Institucionales y Proyectos de CREUP ha llevado a cabo una serie de importantes encuentros y participaciones.</p><p>Del 6 al 8 de septiembre, se asistió a la Asamblea General Ordinaria del Consejo de la Juventud de España, y el día 20 se sostuvo una reunión con Enrique Hernández Díez, profesor de Derecho Administrativo de la Universidad de Extremadura, para tratar temas relacionados con la incorporación plena de CREUP en el CJE y la obtención de subvenciones para asociaciones juveniles.</p><p>Finalmente, el 27 de septiembre, la Vicepresidencia asistió a la Comisión Permanente del Consejo de Estudiantes Universitario del Estado junto al Secretario General de Universidades y participó en una entrevista para el estudio "Negotiating a University Law in Spain: Actors, Conflicts, and Innovations: the case of the LOSU".</p>',
        alt: 'Dos miembros de la Vicepresidencia de Relaciones Institucionales y Proyectos de CREUP durante la Comisión Ejecutiva Ampliada en Toledo.',
      },
    },
    {
      area: PREVIOUS_AREAS.SECRETARIA,
      image: '/transparencia/informes-areas/imagenes/informe-secretaria-septiembre-2024.webp',
      es: {
        contentHtml:
          '<p>Durante el mes de septiembre, la Secretaría General ha finalizado su planificación estratégica, estableciendo objetivos clave en dos áreas fundamentales: la reforma normativa y la transformación digital. Durante la Comisión Ejecutiva Ampliada Presencial, se ultimaron los borradores de diversas reformas normativas y se diseñó un plan de mejoras en los soportes digitales de la asociación.</p><p>Además, el equipo ha avanzado en la actualización de la documentación interna y la optimización de los procesos de archivo y consulta. Se llevaron a cabo reuniones con Tesorería para revisar la situación de deudas y establecer un plan de actuación concreto.</p><p>Asimismo, se supervisaron las elecciones a la Coordinación del Comité de Asuntos Internacionales y al Órgano de Coordinación del Comité de Asuntos Sectoriales. La Secretaría General continúa dando soporte a la CEA y gestionando las consultas recibidas, mientras mantiene el soporte informático de la organización.</p>',
        alt: 'Tres miembros del equipo de Secretaría de CREUP durante la Comisión Ejecutiva Ampliada en Toledo.',
      },
    },
    {
      area: PREVIOUS_AREAS.POLITICA,
      image:
        '/transparencia/informes-areas/imagenes/informe-politica-universitaria-septiembre-2024.webp',
      es: {
        contentHtml:
          '<p>Septiembre ha sido un mes intenso para la Vicepresidencia de Política Universitaria de CREUP, con una serie de reuniones y colaboraciones importantes. El 4 de septiembre, se realizó un encuentro con la Agencia de Calidad (ACCUA), donde se revisaron propuestas para mejorar los estándares educativos en las universidades públicas.</p><p>El 11 de septiembre, CREUP cerró el documento final del Plan de Participación con CRUE, definiendo los detalles del Congreso de Participación que se celebrará en octubre en Córdoba. Entre el 17 y el 22, CREUP colaboró en la formación de talleres en las Jornadas CEEINA-UZ, reforzando la capacitación de los representantes estudiantiles.</p><p>El 23 de septiembre, se lanzó un nuevo grupo de trabajo sobre salud mental, con la primera reunión programada para la próxima semana. Ese mismo día, CREUP estuvo presente en el acto de apertura del curso académico en Zaragoza. Para culminar el mes, el 28 de septiembre, se llevó a cabo una reunión con el grupo de participación para definir las mesas redondas del Congreso de octubre.</p><p>Estas acciones subrayan el compromiso de CREUP con la calidad educativa y la participación activa del estudiantado.</p>',
        alt: 'Cuatro miembros del equipo de Política Universitaria de CREUP durante la Comisión Ejecutiva Ampliada en Toledo.',
      },
    },
    {
      area: PREVIOUS_AREAS.ORGANIZACION,
      image: '/transparencia/informes-areas/imagenes/informe-organizacion-septiembre-2024.webp',
      es: {
        contentHtml:
          '<p>La Vicepresidencia de Organización de CREUP ha tenido un mes de septiembre cargado de actividades clave para el desarrollo y fortalecimiento de la red estudiantil.</p><p>Del 11 al 14 de septiembre, se celebró en Toledo la Comisión Ejecutiva Ampliada (CEA) de CREUP, donde se abordaron temas fundamentales para la organización. Durante la reunión se trabajó en la planificación del XI Stage, la 76ª AGO, la organización interna y el desarrollo del Plan Formativo Anual. Además, se mantuvieron encuentros con otras áreas para alinear proyectos conjuntos.</p><p>En septiembre, se ultimaron los detalles del XI Stage, con la apertura de inscripciones a mediados de mes. La Vicepresidencia de Organización, en colaboración con el área de tesorería, ha trabajado en la logística de transporte y en asegurar las infraestructuras necesarias para el evento. También se definieron las líneas formativas, supervisando que cada formación cumpla con los criterios establecidos en un dossier detallado.</p><p>Se lanzó un cuestionario de asistencia provisional para la 76ª Asamblea General Ordinaria (AGO), obteniendo una alta participación. La sede ha avanzado en la planificación de horarios, alojamiento y espacios para el evento, mientras que el equipo organizador continúa trabajando para ofrecer detalles completos en las próximas semanas. La Vicepresidencia de Organización ha lanzado el Plan Formativo Anual, con el objetivo de mejorar el impacto de las formaciones y reducir las desigualdades entre los miembros de CREUP.</p>',
        alt: 'Dos miembros del equipo de Organización de CREUP durante la Comisión Ejecutiva Ampliada en Toledo.',
      },
    },
    {
      area: PREVIOUS_AREAS.COMUNICACION,
      image: '/transparencia/informes-areas/imagenes/informe-comunicacion-septiembre-2024.webp',
      es: {
        contentHtml:
          '<p>A lo largo del mes de septiembre, el Área de Comunicación de CREUP ha trabajado arduamente para visibilizar toda la actividad de la Coordinadora a través de redes sociales. Durante los primeros días del mes, el equipo se dedicó a planificar diversas campañas para los próximos meses y explorar nuevas vías de contacto con el público, apostando también por medios tradicionales.</p><p>Uno de los hitos del mes fue la aparición de la Directora de Comunicación en El País, donde abordó el creciente problema de la vivienda estudiantil. Asimismo, del 17 al 22 de septiembre, Mª Ángeles, miembro del equipo, participó en las Jornadas de Formación de CEEINA, impartiendo una formación sobre Diseño y Comunicación.</p><p>En paralelo, se definió la estética para la 76ª Asamblea General Ordinaria (AGO) de CREUP, inspirada en los elementos culturales de la ciudad de Granada, sede del evento. También se activó el Grupo de Trabajo de Comunicación, abierto a todos los MOREs y sectoriales de la Coordinadora, lo que permitirá una mayor colaboración en futuras campañas.</p><p>El mes culmina con la creación de esta newsletter, un esfuerzo que busca compartir los logros de la Coordinadora con todos sus miembros.</p>',
        alt: 'Dos miembros del equipo de Comunicación de CREUP durante la Comisión Ejecutiva Ampliada en Toledo.',
      },
    },
  ],
}

export default month
