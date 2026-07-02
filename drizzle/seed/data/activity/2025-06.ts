/**
 * June 2025 "Actividad" seed module, migrated from the discontinued monthly newsletter PDF
 * (public/prensa/newsletter/documentos/newsletter-2025-06.pdf).
 *
 * Spanish-only on purpose: parents + the `es` translation are seeded; the other five locales are
 * backfilled later (same staged approach the press seed uses). Inserted idempotently by the
 * aggregator (./index.ts → drizzle/seed/content.ts) on the natural keys, so re-running is safe.
 *
 * Mandate: this edition belongs to the previous org chart → PREVIOUS_AREAS.
 */
import type { SeedNewsletterMonth } from './types'
import { PREVIOUS_AREAS } from './areas'

const PLACEHOLDER_DATE = '2025-06-01'

const month: SeedNewsletterMonth = {
  monthKey: '2025-06',
  coversFrom: null,
  entries: [
    {
      slug: 'xl-aniversario-adhesion-espana-comunidades-europeas-junio-2025',
      kind: 'creup',
      startDate: '2025-06-12',
      location: 'Palacio Real de Madrid',
      image: null,
      es: {
        title: 'XL Aniversario de la adhesión de España a las Comunidades Europeas',
        excerpt:
          'CREUP asistió en el Palacio Real al acto institucional por el aniversario de la adhesión de España a las Comunidades Europeas.',
        contentHtml:
          '<p>El pasado 12 de junio, CREUP estuvo presente en el acto institucional celebrado en el Palacio Real de Madrid con motivo de la conmemoración del aniversario de la adhesión de España a las Comunidades Europeas, hoy Unión Europea.</p><p>El evento contó con la intervención de Su Majestad el Rey, el presidente del Gobierno y el presidente del Consejo Europeo, en una ceremonia que sirvió para poner en valor el papel de España dentro del proyecto europeo, los beneficios de la colaboración entre Estados miembros y el compromiso común por preservar la unidad y los valores europeos.</p><p>Desde CREUP, reafirmamos nuestra apuesta por una Europa cohesionada, inclusiva y comprometida con la juventud y el futuro común del continente.</p>',
      },
    },
    {
      slug: 'comparecencia-asamblea-madrid-junio-2025',
      kind: 'creup',
      startDate: '2025-06-17',
      location: 'Asamblea de Madrid',
      image: null,
      es: {
        title: 'CREUP comparece en la Asamblea de Madrid',
        excerpt:
          'César Gamonal, secretario general de CREUP, compareció ante la Comisión de Educación, Ciencia y Universidades de la Asamblea de Madrid.',
        contentHtml:
          '<p>El pasado 17 de junio, César Gamonal, secretario general de CREUP, compareció ante la Comisión de Educación, Ciencia y Universidades de la Asamblea de Madrid para abordar la situación actual de las universidades públicas madrileñas. Durante su intervención, trasladó la preocupación del estudiantado ante la infrafinanciación que sufre el sistema universitario público, destacando las consecuencias que esta situación tiene sobre la calidad de la enseñanza, la equidad y el acceso a los recursos.</p><p>Desde CREUP se insistió en la necesidad de un compromiso firme por parte de las administraciones públicas con la financiación suficiente, justa y estable de las universidades, como condición imprescindible para garantizar una educación superior de calidad y accesible para todas las personas.</p>',
      },
    },
    {
      slug: 'encuentro-esdees-america-latina-caribe-union-europea-junio-2025',
      kind: 'creup',
      startDate: '2025-06-13',
      image:
        '/transparencia/actividad/imagenes/encuentro-esdees-america-latina-caribe-union-europea-junio-2025.webp',
      es: {
        title:
          'CREUP asiste al encuentro del Espacio de Educación Superior entre América Latina, el Caribe y la Unión Europea',
        excerpt:
          'CREUP participó en el evento de EsdeES sobre la construcción de un espacio común de educación entre América Latina, el Caribe y la Unión Europea.',
        contentHtml:
          '<p>El pasado 13 de junio, CREUP participó en el evento organizado por el Espacio de Educación Superior (EsdeES), centrado en los desafíos y oportunidades de construir un espacio común de educación entre América Latina, el Caribe y la Unión Europea.</p><p>La jornada abordó el tema desde una triple perspectiva: académica, política y de gestión institucional. Se pusieron en valor las similitudes con iniciativas como el programa Erasmus+, así como los convenios de cooperación ya existentes entre universidades españolas y asociaciones como la CRUE. Un espacio de reflexión y diálogo que busca fortalecer la colaboración internacional y avanzar hacia una educación superior más integrada y equitativa entre ambas regiones.</p>',
        alt: 'Dos asistentes de CREUP en el encuentro del Espacio de Educación Superior entre América Latina, el Caribe y la Unión Europea.',
      },
    },
    {
      slug: 'reunion-gt-participacion-estudiantil-crue-junio-2025',
      kind: 'creup',
      startDate: '2025-06-19',
      isOnline: true,
      location: null,
      image:
        '/transparencia/actividad/imagenes/reunion-gt-participacion-estudiantil-crue-junio-2025.webp',
      es: {
        title: 'Reunión del GT de Participación Estudiantil de CRUE',
        excerpt:
          'Reunión de seguimiento del Grupo de Trabajo de Participación de la CRUE sobre la certificación de competencias transversales.',
        contentHtml:
          '<p>El pasado 19 de junio se celebró una reunión de seguimiento del Grupo de Trabajo de Participación de la CRUE, en la que se abordaron los avances en torno a la certificación de las competencias transversales, uno de los principales objetivos marcados en reuniones previas.</p><p>Durante el encuentro también se puso sobre la mesa la organización de las II Jornadas de Participación, que seguirán la estela de las celebradas el pasado año en Córdoba y que pretenden consolidarse como un espacio de referencia para el intercambio de buenas prácticas en materia de representación estudiantil.</p><p>Desde CREUP continuaremos trabajando en este espacio para garantizar una participación estudiantil real, efectiva y reconocida dentro del sistema universitario.</p>',
        alt: 'Mosaico de la videollamada del Grupo de Trabajo de Participación de la CRUE.',
      },
    },
    {
      slug: 'cas-ronda-encuentros-colectivos-sectoriales-junio-2025',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      isOnline: true,
      location: null,
      image: null,
      es: {
        title: 'El CAS inicia su ronda de encuentros con colectivos sectoriales de estudiantes',
        excerpt:
          'La Coordinación del CAS mantuvo reuniones introductorias con ANEM, CEP-PIE, ANECAFYDE y FEBiotec para fijar una hoja de ruta común.',
        contentHtml:
          '<p>Durante el mes de junio, la Coordinación del Comité de Asuntos Sectoriales (CAS) de CREUP mantuvo diversas reuniones introductorias con colectivos nacionales de estudiantes universitarios, con el objetivo de establecer una hoja de ruta común de cara a los próximos meses de trabajo conjunto.</p><p>El 15 de junio se celebró el primer encuentro con la Asociación Nacional de Estudiantes de Matemáticas (ANEM), en el que se abordaron cuestiones como el funcionamiento interno del CAS, la documentación a preparar para la próxima asamblea y los pasos para formalizar el convenio con CREUP.</p><p>El 16 de junio tuvieron lugar dos reuniones clave: por un lado, con el Colectivo de Estudiantes de Psicología, y por otro, con la Asamblea Nacional de Estudiantes de Ciencias de la Actividad Física y del Deporte (ANECAFYDE). En ambos encuentros se compartieron las líneas estratégicas del CAS y se abrieron vías de colaboración para los próximos meses, incluyendo la firma de los respectivos convenios.</p><p>Por último, el 19 de junio, la Coordinación del CAS se reunió con la Federación Española de Biotecnólogos (FEBiotec), en una cita que también sirvió como punto de partida para el trabajo conjunto, centrado en la participación sectorial y en los preparativos de la próxima asamblea.</p><p>Estas reuniones marcan el inicio de una etapa de coordinación más estrecha entre CREUP y las distintas asociaciones estudiantiles sectoriales, reforzando así el compromiso conjunto por la representación y mejora de la calidad universitaria en cada ámbito de conocimiento.</p>',
      },
    },
    {
      slug: 'reunion-fonce-inclusion-formacion-junio-2025',
      kind: 'creup',
      startDate: '2025-06-19',
      image: '/transparencia/actividad/imagenes/reunion-fonce-inclusion-formacion-junio-2025.webp',
      es: {
        title: 'CREUP y FONCE refuerzan su colaboración en materia de inclusión y formación',
        excerpt:
          'CREUP se reunió con la Fundación ONCE (FONCE) para avanzar en las microformaciones y nuevas iniciativas de inclusión universitaria.',
        contentHtml:
          '<p>El pasado 19 de junio, desde CREUP mantuvimos una reunión de trabajo con la Fundación ONCE para la Cooperación e Inclusión Social de Personas con Discapacidad (FONCE), en el marco de los encuentros periódicos que ambas organizaciones celebran para avanzar en líneas de colaboración conjunta.</p><p>Durante la sesión, se abordaron aspectos clave para el desarrollo de las microformaciones previstas para el próximo año, así como nuevas iniciativas orientadas a seguir promoviendo la inclusión en el ámbito universitario. Ambas entidades reafirmaron su compromiso de trabajar de manera coordinada para mejorar la accesibilidad y la participación plena del estudiantado con discapacidad en la educación superior.</p>',
        alt: 'Cuatro representantes de CREUP frente al mural de la Fundación ONCE.',
      },
    },
    {
      slug: 'reunion-eacnur-estudiantes-refugiados-junio-2025',
      kind: 'creup',
      startDate: '2025-06-19',
      image:
        '/transparencia/actividad/imagenes/reunion-eacnur-estudiantes-refugiados-junio-2025.webp',
      es: {
        title:
          'CREUP y EACNUR abordan la acogida a estudiantes refugiados en el sistema universitario',
        excerpt:
          'CREUP se reunió con el Comité Español de ACNUR para avanzar en los planes de acogida a estudiantes refugiados y solicitantes de asilo.',
        contentHtml:
          '<p>El pasado 19 de junio, representantes de CREUP mantuvieron una reunión con el Comité Español de ACNUR (EACNUR) con el objetivo de avanzar en la resolución conjunta sobre los planes de acogida a estudiantes refugiados y solicitantes de asilo en las universidades públicas españolas.</p><p>Durante el encuentro, se abordaron propuestas concretas para reforzar los mecanismos de inclusión en el sistema universitario, así como iniciativas de sensibilización y concienciación dirigidas a la comunidad universitaria. La reunión forma parte del compromiso de CREUP por garantizar una educación superior accesible y comprometida con los derechos humanos.</p>',
        alt: 'Representantes de CREUP junto al cartel «Refugio y ODS» tras la reunión con EACNUR.',
      },
    },
    {
      slug: 'reunion-segib-cooperacion-iberoamerica-junio-2025',
      kind: 'creup',
      startDate: '2025-06-20',
      image:
        '/transparencia/actividad/imagenes/reunion-segib-cooperacion-iberoamerica-junio-2025.webp',
      es: {
        title:
          'CREUP se reúne con la SEGIB para reforzar la cooperación estudiantil en Iberoamérica',
        excerpt:
          'CREUP se reunió con la Secretaría General Iberoamericana para avanzar en el desarrollo de la Plataforma Iberoamericana Estudiantil.',
        contentHtml:
          '<p>El pasado 20 de junio, CREUP mantuvo una reunión con la Secretaría General Iberoamericana (SEGIB) con el objetivo de avanzar en el desarrollo de la Plataforma Iberoamericana Estudiantil. Durante el encuentro, se abordaron diversas líneas de trabajo para fortalecer la participación de CREUP en el Espacio Iberoamericano del Conocimiento y fomentar una mayor cooperación entre organizaciones estudiantiles de la región.</p><p>Este acercamiento representa un paso clave para posicionar a CREUP como actor relevante en el ámbito internacional y contribuir activamente a la integración educativa y académica en Iberoamérica.</p>',
        alt: 'Representantes de CREUP en la reunión con la SEGIB, ante un fondo de banderas iberoamericanas.',
      },
    },
    {
      slug: 'iv-jornadas-crue-docencia-junio-2025',
      kind: 'creup',
      startDate: '2025-06-18',
      endDate: '2025-06-21',
      location: 'Universidad Pública de Navarra',
      image: '/transparencia/actividad/imagenes/iv-jornadas-crue-docencia-junio-2025.webp',
      es: {
        title: 'CREUP participa en las IV Jornadas CRUE-Docencia',
        excerpt:
          'Del 18 al 21 de junio, CREUP participó en las IV Jornadas CRUE-Docencia en la UPNA con una ponencia sobre la IA en la docencia universitaria.',
        contentHtml:
          '<p>Del 18 al 21 de junio se celebraron en la Universidad Pública de Navarra (UPNA) las IV Jornadas CRUE-Docencia, la reunión anual de la sectorial de Docencia de CRUE Universidades Españolas. El encuentro estuvo presidido por el rector de la UPNA y reunió a representantes de todas las universidades miembro, incluyendo a los vicerrectorados con competencias en materia docente.</p><p>CREUP estuvo presente en el evento con la participación de uno de sus miembros como ponente invitado en una mesa redonda sobre el uso de la inteligencia artificial en la docencia universitaria, una de las temáticas clave abordadas durante las jornadas. En el acto también estuvieron presentes representantes del Ministerio de Universidades y de la Agencia Nacional de Evaluación de la Calidad y Acreditación (ANECA), consolidando así un espacio de diálogo interinstitucional sobre el presente y futuro de la educación superior.</p><p>Estas jornadas continúan posicionándose como un foro de referencia para la reflexión y la innovación en las metodologías de enseñanza en el sistema universitario español.</p>',
        alt: 'Foto de grupo de los asistentes a las IV Jornadas CRUE-Docencia en la Universidad Pública de Navarra.',
      },
    },
  ],
  areaReports: [
    {
      area: PREVIOUS_AREAS.PRESIDENCIA,
      image: '/transparencia/informes-areas/imagenes/informe-presidencia-junio-2025.webp',
      es: {
        contentHtml:
          '<p>Durante el mes de junio, desde el área de Presidencia de CREUP se ha trabajado intensamente en el fortalecimiento de alianzas estratégicas y el impulso de proyectos conjuntos con diversas entidades. Para ello, nuestro presidente, Alfonso, se desplazó durante varios días a Madrid con el objetivo de mantener reuniones clave para el desarrollo de nuestras líneas de trabajo.</p><p>Entre los encuentros más destacados, se celebró una reunión con EACNUR centrada en los planes de acogida a estudiantes refugiados, una línea prioritaria en nuestra agenda social. También se mantuvieron reuniones con FONCE, con el objetivo de consolidar y mejorar las relaciones ya existentes, y con la SEGIB, donde se avanzó en la puesta en marcha de la futura Plataforma Iberoamericana de Representación Estudiantil. Además, CREUP asistió a la presentación de las conclusiones del proceso abierto para la elaboración de la nueva Ley de Juventud, reafirmando nuestro compromiso con la participación activa en las políticas juveniles.</p><p>Desde el área de Internacionales, el trabajo también ha sido notable. El CEUCA, a quienes agradecemos especialmente su implicación, acogió la II reunión presencial de la red MEDNET, un espacio en el que el CAI pudo avanzar en la definición de los próximos pasos de la representación estudiantil mediterránea. Por último, se han abierto las inscripciones para el I Foro de Estudiantes y Alianzas Europeas, una iniciativa en la que animamos a toda la comunidad estudiantil a participar activamente.</p>',
        alt: 'Equipo del área de Presidencia de CREUP apoyado en una balaustrada.',
      },
    },
    {
      area: PREVIOUS_AREAS.SECRETARIA,
      image: '/transparencia/informes-areas/imagenes/informe-secretaria-junio-2025.webp',
      es: {
        contentHtml:
          '<p>Durante el mes de junio, la Secretaría General de CREUP ha centrado su labor en el acompañamiento y respaldo a las reuniones estratégicas impulsadas desde Presidencia y el área de Relaciones Institucionales con diversos actores políticos.</p><p>Uno de los hitos más destacados ha sido la comparecencia del Secretario Ejecutivo ante la Comisión de Educación, Ciencia y Universidades de la Asamblea de la Comunidad de Madrid, en la que trasladó las demandas y preocupaciones del estudiantado universitario.</p><p>En materia de gestión interna, se han implementado mejoras en la intranet de la Comisión Ejecutiva Ampliada (CEA) para optimizar la organización del trabajo, así como una actualización del sistema de registro de convenios. Finalmente, se ha iniciado la redacción de un proyecto normativo que plantea la modificación de los plazos de entrega de documentación y enmiendas en las Asambleas Generales Ordinarias.</p>',
        alt: 'Integrante del área de Secretaría Ejecutiva de CREUP sentada en un sofá.',
      },
    },
    {
      area: PREVIOUS_AREAS.TESORERIA,
      image: '/transparencia/informes-areas/imagenes/informe-tesoreria-junio-2025.webp',
      es: {
        contentHtml:
          '<p>El mes de junio ha traído consigo una notable disminución del volumen de trabajo habitual, lo que ha permitido centrar los esfuerzos de Tesorería en tareas estratégicas a medio plazo, especialmente en materia de planificación y organización de recursos.</p><p>Desde la vocalía de Proyectos, se ha avanzado significativamente en la adaptación de la proyección de actividades futuras, con especial atención al desarrollo del XII Stage. Entre las acciones destacadas se encuentra la elaboración de un dossier dirigido a potenciales colaboradores, así como el diseño de una estrategia para su captación. Paralelamente, se ha iniciado la calendarización de subvenciones, un documento que recoge las ayudas a las que CREUP ha optado o pretende optar, con el fin de anticipar los plazos y optimizar la preparación de solicitudes.</p><p>En el ámbito estrictamente económico, se ha elaborado una guía de comisiones de gasto destinada a los miembros de la Comisión Ejecutiva Ampliada (CEA), con el objetivo de facilitar y sistematizar la justificación de gastos. Asimismo, Tesorería ha prestado apoyo al área de Internacionales, brindando soporte económico para la celebración del MEDNET.</p>',
        alt: 'Equipo del área de Tesorería de CREUP apoyado en una balaustrada.',
      },
    },
    {
      area: PREVIOUS_AREAS.RRII,
      image:
        '/transparencia/informes-areas/imagenes/informe-relaciones-institucionales-y-proyectos-junio-2025.webp',
      es: {
        contentHtml:
          '<p>Durante el mes de junio, la Vicepresidencia de Relaciones Institucionales de CREUP ha intensificado su agenda de trabajo manteniendo reuniones con diversos agentes sociales para reforzar el seguimiento y las líneas de colaboración estratégica.</p><p>En coordinación con la Presidencia, se celebraron varios encuentros con el Ministerio de Universidades para actualizar documentación clave y continuar el trabajo conjunto en la elaboración y revisión de distintos reales decretos que afectan al sistema universitario. En este marco, también se avanzó en el desarrollo del documento sobre el Estudiante Universitario, una labor que proseguirá durante el mes de julio junto al propio Ministerio, el CEUNE y la CRUE.</p>',
        alt: 'Equipo del área de Relaciones Institucionales y Proyectos de CREUP apoyado en una balaustrada.',
      },
    },
    {
      area: PREVIOUS_AREAS.POLITICA,
      image:
        '/transparencia/informes-areas/imagenes/informe-politica-universitaria-junio-2025.webp',
      es: {
        contentHtml:
          '<p>Durante el mes de junio, desde la Vicepresidencia de Política Universitaria se ha llevado a cabo una revisión del plan de trabajo del área, con el objetivo de incorporar nuevos temas de actualidad que deberán abordarse en el corto y medio plazo. Esta actualización responde a la evolución del contexto universitario y a las demandas recogidas en los espacios de representación.</p><p>Asimismo, se ha avanzado en la planificación de los próximos Grupos de Trabajo, cuya convocatoria será publicada próximamente, y que permitirán seguir profundizando en cuestiones clave para el estudiantado.</p><p>En el plano institucional, la Vicepresidencia fue invitada a participar en las IV Jornadas CRUE-Docencia celebradas en la Universidad Pública de Navarra (UPNA). En este espacio, representantes de CREUP intervinieron en una mesa redonda dedicada al uso de la inteligencia artificial generativa en la docencia, aportando la perspectiva estudiantil sobre los retos y oportunidades que plantea esta herramienta en el ámbito universitario.</p>',
        alt: 'Integrante del área de Política Universitaria de CREUP sentado en un sofá.',
      },
    },
    {
      area: PREVIOUS_AREAS.ORGANIZACION,
      image: '/transparencia/informes-areas/imagenes/informe-organizacion-junio-2025.webp',
      es: {
        contentHtml:
          '<p>La Vicepresidencia de Organización continúa avanzando en la planificación de los próximos eventos clave para la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP). Durante el mes de junio, el área ha centrado sus esfuerzos en la organización de la próxima Comisión Ejecutiva Ampliada (CEA) presencial, que se celebrará en la primera semana de septiembre, así como en el XII Stage Formativo, previsto para el mes de octubre.</p><p>En relación con la CEA, ya se está trabajando en el diseño logístico del encuentro, que incluye la gestión de asistentes, dietas, viajes y otros aspectos necesarios para su correcto desarrollo.</p><p>Paralelamente, se está llevando a cabo un seguimiento personalizado a las nuevas incorporaciones, con el objetivo de resolver dudas y facilitar una acogida cercana y efectiva a quienes se suman a la estructura de CREUP.</p>',
        alt: 'Equipo del área de Organización de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.COMUNICACION,
      image: '/transparencia/informes-areas/imagenes/informe-comunicacion-junio-2025.webp',
      es: {
        contentHtml:
          '<p>Durante los últimos meses, el área de Comunicación de CREUP ha centrado sus esfuerzos en el impulso de campañas clave para el estudiantado, poniendo el foco en tres ejes prioritarios: vivienda, financiación y salud mental.</p><p>En este marco, se han desarrollado distintas piezas comunicativas y artículos que visibilizan las necesidades reales del alumnado, especialmente en lo relativo al bienestar psicológico. Estas acciones han contribuido a reforzar la voz del estudiantado en el debate público y a trasladar sus demandas a los distintos actores sociales y políticos.</p>',
        alt: 'Equipo del área de Dirección de Comunicación de CREUP.',
      },
    },
  ],
}

export default month
