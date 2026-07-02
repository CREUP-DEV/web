/**
 * February 2026 "Actividad" seed module, migrated from the discontinued monthly newsletter PDF
 * (public/prensa/newsletter/documentos/newsletter-2026-02.pdf).
 *
 * Spanish-only on purpose: parents + the `es` translation are seeded; the other five locales are
 * backfilled later (same staged approach the press seed uses). Inserted idempotently by the
 * aggregator (./index.ts → drizzle/seed/content.ts) on the natural keys, so re-running is safe.
 *
 * Mandate: this edition belongs to the current org chart → CURRENT_AREAS.
 */
import type { SeedNewsletterMonth } from './types'
import { CURRENT_AREAS } from './areas'

const PLACEHOLDER_DATE = '2026-02-01'

const month: SeedNewsletterMonth = {
  monthKey: '2026-02',
  coversFrom: null,
  entries: [
    {
      slug: 'reunion-ceule-febrero-2026',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-ceule-febrero-2026.webp',
      es: {
        title: 'Reunión con CEULE',
        excerpt:
          'Reunión de contacto para resolver dudas sobre las actividades de CREUP del primer semestre.',
        contentHtml:
          '<p>Reunión de contacto para resolver dudas acerca de las actividades de CREUP previstas para el primer semestre del año. Además de conocer el estado del MORE y en qué se podría trabajar conjuntamente en un futuro.</p>',
        alt: 'Captura de la reunión por videollamada entre CREUP y CEULE.',
      },
    },
    {
      slug: 'reunion-ceuex-febrero-2026',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-ceuex-febrero-2026.webp',
      es: {
        title: 'Reunión con CEUEX',
        excerpt:
          'Reunión de contacto para resolver dudas sobre las actividades de CREUP del primer semestre.',
        contentHtml:
          '<p>Reunión de contacto para resolver dudas acerca de las actividades de CREUP previstas para el primer semestre del año. Además de conocer el estado del MORE y en qué se podría trabajar conjuntamente en un futuro.</p>',
        alt: 'Captura de la reunión por videollamada entre CREUP y CEUEX.',
      },
    },
    {
      slug: 'reunion-aeae-febrero-2026',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-aeae-febrero-2026.webp',
      es: {
        title: 'Reunión con AEAE',
        excerpt:
          'Reunión de contacto para resolver dudas sobre las actividades de CREUP del primer semestre.',
        contentHtml:
          '<p>Reunión de contacto para resolver dudas acerca de las actividades de CREUP previstas para el primer semestre del año. Además de conocer el estado de la sectorial y en qué se podría trabajar conjuntamente en un futuro.</p>',
        alt: 'Captura de la reunión por videollamada entre CREUP y AEAE.',
      },
    },
    {
      slug: 'reunion-caruh-febrero-2026',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-caruh-febrero-2026.webp',
      es: {
        title: 'Reunión con CARUH',
        excerpt: 'Reunión de contacto para conocer la nueva junta directiva y resolver dudas.',
        contentHtml:
          '<p>Reunión de contacto para conocer la nueva junta directiva y resolver dudas acerca de las actividades de CREUP previstas para el primer semestre del año. Además de conocer el estado del MORE y en qué se podría trabajar conjuntamente en un futuro.</p>',
        alt: 'Captura de la reunión por videollamada entre CREUP y CARUH.',
      },
    },
    {
      slug: 'reunion-subdireccion-general-coordinacion-iniciativas-febrero-2026',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      isOnline: true,
      location: null,
      image:
        '/transparencia/actividad/imagenes/reunion-subdireccion-general-coordinacion-iniciativas-febrero-2026.webp',
      es: {
        title: 'Reunión con la Subdirección General de Coordinación e Iniciativas',
        excerpt:
          'Encuentro con el Ministerio para la Transición Ecológica para avanzar en el Programa Campus Rural.',
        contentHtml:
          '<p>Desde CREUP nos reunimos con la Subdirección General de Coordinación e Iniciativas del Ministerio para la Transición Ecológica y el Reto Demográfico para seguir trabajando en el Programa Campus Rural, los próximos pasos y el papel de CREUP en este programa y su apoyo al estudiantado en prácticas en zonas rurales.</p>',
        alt: 'Captura de la videollamada de CREUP con la Subdirección General de Coordinación e Iniciativas.',
      },
    },
    {
      slug: 'reunion-lejsee-febrero-2026',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-lejsee-febrero-2026.webp',
      es: {
        title: 'Reunión con la Liga de Estudiantes y Jóvenes Saharauis',
        excerpt:
          'Reunión con LEJSEE para establecer líneas de colaboración y dar visibilidad a la causa saharaui.',
        contentHtml:
          '<p>Reunión con LEJSEE (Liga de Estudiantes y Jóvenes Saharauis en el Estado Español) para establecer líneas de colaboración, dar visibilidad a la causa y conocer las necesidades del colectivo. Así, CREUP ha conocido un poco más sobre la situación que viven y sus reclamaciones, ofreciendo su ayuda para establecer acciones y dar visibilidad.</p>',
        alt: 'Captura de la videollamada de CREUP con la Liga de Estudiantes y Jóvenes Saharauis.',
      },
    },
    {
      slug: 'reunion-extraordinaria-cas-febrero-2026',
      kind: 'creup',
      startDate: '2026-02-08',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-extraordinaria-cas-febrero-2026.webp',
      es: {
        title: 'Reunión extraordinaria del CAS',
        excerpt:
          'El 8 de febrero se eligió a la nueva coordinación del Comité de Asuntos Sectoriales.',
        contentHtml:
          '<p>El 8 de febrero realizamos una reunión extraordinaria del Comité de Asuntos Sectoriales para elegir a su nueva coordinación. Aritz Amor (SIUEH) y Jose Arcos (AEAE) fueron elegidos como coordinador y secretario del CAS, respectivamente.</p>',
        alt: 'Mosaico de la videollamada de la reunión extraordinaria del Comité de Asuntos Sectoriales.',
      },
    },
    {
      slug: 'reunion-guia-buenas-practicas-sectoriales-febrero-2026',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      isOnline: true,
      location: null,
      image:
        '/transparencia/actividad/imagenes/reunion-guia-buenas-practicas-sectoriales-febrero-2026.webp',
      es: {
        title: 'Reunión del proyecto de guía de buenas prácticas con sectoriales',
        excerpt:
          'Primera reunión para presentar una guía estatal de buenas prácticas en bienestar estudiantil.',
        contentHtml:
          '<p>Hemos mantenido una primera reunión de contacto para presentar un proyecto impulsado desde la Vocalía de Bienestar orientado a la elaboración de una guía estatal de buenas prácticas en bienestar estudiantil. La iniciativa busca poner en el centro el trabajo de las sectoriales del ámbito de la salud, recopilando y sistematizando sus experiencias y modelos internos. Como próximos pasos, se planteará una reunión abierta con las sectoriales interesadas y la creación de un grupo de trabajo para desarrollar el contenido.</p>',
        alt: 'Mosaico de la videollamada del proyecto de guía de buenas prácticas con las sectoriales.',
      },
    },
    {
      slug: 'reunion-siueh-febrero-2026',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-siueh-febrero-2026.webp',
      es: {
        title: 'Reunión con SIUEH',
        excerpt:
          'Reunión de contacto para resolver dudas sobre las actividades de CREUP del primer semestre.',
        contentHtml:
          '<p>Reunión de contacto para resolver dudas acerca de las actividades de CREUP previstas para el primer semestre del año. Además de conocer el estado del MORE y en qué se podría trabajar conjuntamente en un futuro.</p>',
        alt: 'Captura de la reunión por videollamada entre CREUP y SIUEH.',
      },
    },
    {
      slug: 'reunion-semanal-cai-febrero-2026',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-semanal-cai-febrero-2026.webp',
      es: {
        title: 'Reunión semanal del CAI',
        excerpt:
          'Inscripción en el European Student Convention de ESU y apoyo a la unión estudiantil neerlandesa.',
        contentHtml:
          '<p>Hemos realizado la inscripción al European Student Convention de ESU. Además, hemos decidido apoyar la resolución de la unión estudiantil de los Países Bajos (Landelijke Studentenvakbond) condenando la violencia hacia estudiantes palestinos, en línea con nuestra resolución sobre Palestina.</p>',
        alt: 'Mosaico de la videollamada de la reunión semanal del Comité de Asuntos Internacionales.',
      },
    },
    {
      slug: 'reunion-cestulpgc-febrero-2026',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-cestulpgc-febrero-2026.webp',
      es: {
        title: 'Reunión con CESTULPGC',
        excerpt:
          'Reunión de contacto para resolver dudas sobre las actividades de CREUP del primer semestre.',
        contentHtml:
          '<p>Reunión de contacto para resolver dudas acerca de las actividades de CREUP previstas para el primer semestre del año. Además de conocer el estado del MORE y en qué se podría trabajar conjuntamente en un futuro.</p>',
        alt: 'Captura de la reunión por videollamada entre CREUP y CESTULPGC.',
      },
    },
    {
      slug: 'reunion-coordinacion-cas-febrero-2026',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-coordinacion-cas-febrero-2026.webp',
      es: {
        title: 'Reunión de coordinación del CAS',
        excerpt: 'Reunión de toma de contacto con la nueva coordinación del CAS.',
        contentHtml:
          '<p>Tras haber elegido recientemente a la nueva coordinación del CAS, hemos llevado a cabo una reunión de toma de contacto con el coordinador y el secretario del comité.</p>',
        alt: 'Mosaico de la videollamada de la reunión de coordinación del Comité de Asuntos Sectoriales.',
      },
    },
    {
      slug: 'v-jornadas-crue-asuntos-estudiantiles-febrero-2026',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      image:
        '/transparencia/actividad/imagenes/v-jornadas-crue-asuntos-estudiantiles-febrero-2026.webp',
      es: {
        title: 'V Jornadas CRUE-Asuntos Estudiantiles',
        excerpt:
          'Encuentro con los vicerrectores de estudiantes para tratar la PAU, la IA y la vivienda.',
        contentHtml:
          '<p>Asistimos a las V Jornadas de CRUE-Asuntos Estudiantiles, donde pudimos encontrarnos con los vicerrectores de estudiantes y tratar diferentes temáticas como el modelo de la PAU, la IA o el problema de la vivienda. Nuestro Secretario Ejecutivo, César González, formó parte de la mesa.</p>',
        alt: 'Foto de grupo de los asistentes a las V Jornadas CRUE-Asuntos Estudiantiles.',
      },
    },
    {
      slug: 'xlvii-jornadas-colegios-mayores-febrero-2026',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      image: '/transparencia/actividad/imagenes/xlvii-jornadas-colegios-mayores-febrero-2026.webp',
      es: {
        title: 'XLVII Jornadas de Colegios Mayores',
        excerpt:
          'Sesión de trabajo sobre las necesidades de alojamiento estudiantil y acto de clausura.',
        contentHtml:
          '<p>Dentro de las Jornadas de Colegios Mayores Universitarios, se realizó una sesión de trabajo entre los vicerrectores y vicerrectoras con competencias en colegios mayores, junto con la Junta Directiva del Consejo y CREUP. En esta sesión se abordaron las líneas de actuación conjuntas que se iban a establecer frente a las necesidades de alojamiento estudiantil presentes en el país. Posteriormente, también asistimos al acto de clausura de las Jornadas.</p>',
        alt: 'Foto de grupo de los asistentes a las XLVII Jornadas de Colegios Mayores.',
      },
    },
    {
      slug: 'reunion-grupo-parlamentario-sumar-febrero-2026',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      image:
        '/transparencia/actividad/imagenes/reunion-grupo-parlamentario-sumar-febrero-2026.webp',
      es: {
        title: 'Reunión con el Grupo Parlamentario de Sumar',
        excerpt:
          'Encuentro de trabajo con la diputada Tesh Sidi sobre el estado de las universidades públicas.',
        contentHtml:
          '<p>Desde CREUP hemos mantenido un encuentro de trabajo con Tesh Sidi, diputada en el Congreso por Sumar, con el objetivo de analizar en profundidad el estado actual de las universidades públicas. Durante la reunión, hemos puesto sobre la mesa los retos estructurales y las prioridades legislativas del estudiantado para este 2026.</p>',
        alt: 'CREUP reunida con la diputada Tesh Sidi del Grupo Parlamentario de Sumar.',
      },
    },
    {
      slug: 'toma-posesion-consell-estudiants-uib-febrero-2026',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      image:
        '/transparencia/actividad/imagenes/toma-posesion-consell-estudiants-uib-febrero-2026.webp',
      es: {
        title: "Toma de posesión del Consell d'Estudiants de la UIB",
        excerpt:
          'Nuestra Vicepresidenta de Organización asistió en representación de la Comisión Ejecutiva.',
        contentHtml:
          "<p>Nuestra Vicepresidenta de Organización, Lorena Villalba, ha asistido en representación de la Comisión Ejecutiva de CREUP al acto de toma de posesión de la nueva comisión permanente del Consell d'Estudiants de la Universitat de les Illes Balears.</p>",
        alt: "Acto de toma de posesión del Consell d'Estudiants de la Universitat de les Illes Balears.",
      },
    },
    {
      slug: 'presentacion-informe-cultura-inclusiva-once-febrero-2026',
      kind: 'creup',
      startDate: '2026-02-24',
      image:
        '/transparencia/actividad/imagenes/presentacion-informe-cultura-inclusiva-once-febrero-2026.webp',
      es: {
        title:
          'Presentación del informe «Promoción y desarrollo de una cultura inclusiva en las universidades españolas»',
        excerpt:
          'La Fundación ONCE presentó su informe sobre cultura inclusiva en las universidades.',
        contentHtml:
          '<p>Desde CREUP asistimos a la presentación del informe «Promoción y Desarrollo de una Cultura Inclusiva en las Universidades Españolas». El pasado 24 de febrero, la Fundación ONCE presentó su informe sobre cultura inclusiva en las universidades, una hoja de ruta que redefine la excelencia académica bajo una premisa clara: no hay conocimiento de calidad sin talento diverso.</p><p>Ejes principales del cambio:</p><ul><li><strong>Participación holística:</strong> debemos superar el modelo de «ajustes puntuales» para que las personas con discapacidad sean agentes activos de creación y no meros espectadores de la vida universitaria.</li><li><strong>Más allá de las rampas:</strong> el informe señala que, aunque las barreras físicas persisten, el mayor obstáculo es el capacitismo. Las barreras actitudinales (expectativas bajas e infantilización) son las que más limitan el potencial del estudiantado.</li><li><strong>Diseño universal:</strong> es urgente que las instituciones integren la accesibilidad desde el origen de cualquier proyecto, garantizando autonomía, recursos digitales múltiples y formación obligatoria para eliminar sesgos en toda la comunidad.</li></ul><p>En definitiva, la inclusión no es un «añadido», sino el único camino para que la universidad responda a la sociedad actual y aproveche todo el saber colectivo.</p>',
        alt: 'Presentación del informe de la Fundación ONCE sobre cultura inclusiva en las universidades.',
      },
    },
    {
      slug: 'vii-encuentro-creup-crue-xv-encuentro-representantes-upv-febrero-2026',
      kind: 'creup',
      startDate: '2026-02-26',
      endDate: '2026-03-01',
      location: 'Universitat Politècnica de València',
      image:
        '/transparencia/actividad/imagenes/vii-encuentro-creup-crue-xv-encuentro-representantes-upv-febrero-2026.webp',
      es: {
        title: 'VII Encuentro CREUP-CRUE y XV Encuentro de Representantes en la UPV',
        excerpt:
          'Del 26 de febrero al 1 de marzo en la UPV, con la presencia de la Ministra Diana Morant.',
        contentHtml:
          '<p>Del 26 de febrero al 1 de marzo llevamos a cabo el VII Encuentro CREUP-CRUE y el XV Encuentro de Representantes en la Universitat Politècnica de València. Un espacio que ha sido vital para el diálogo sobre el presente y futuro de nuestra universidad pública, al que también asistió por primera vez en la historia de nuestra entidad la Ministra de Ciencia, Innovación y Universidades, Diana Morant.</p><p>A través de diversas mesas de trabajo, profundizamos en temas tan diversos como la autonomía universitaria y el impacto del RD 822/2021. Además, dada la realidad climática actual, pusimos el foco en la creación de protocolos de actuación ante emergencias sobrevenidas, como inundaciones o fenómenos tipo DANA, asegurando que nuestras instituciones estén preparadas para proteger a la comunidad universitaria.</p><p>Nada de esto hubiera sido posible sin la excelente labor del Consejo de Estudiantes de la UPV. Gracias por una organización ejemplar que ha permitido que este evento sea un éxito de participación y propuestas.</p>',
        alt: 'Foto de grupo del VII Encuentro CREUP-CRUE y XV Encuentro de Representantes en la UPV.',
      },
    },
    {
      slug: 'paellas-2026-ceuji-febrero-2026',
      kind: 'member',
      startDate: PLACEHOLDER_DATE,
      location: 'Universitat Jaume I',
      memberOrgKey: 'CEUJI',
      image: '/transparencia/actividad/imagenes/paellas-2026-ceuji-febrero-2026.webp',
      es: {
        title: "El Consell de l'Estudiantat organiza «Paellas 2026»",
        excerpt:
          "El Consell de l'Estudiantat de la Universitat Jaume I celebró las Paellas 2026, un evento festivo por el aniversario de la institución.",
        contentHtml:
          "<p>El Consell de l'Estudiantat de la Universitat Jaume I organizó la edición Paellas 2026, un evento festivo dirigido al estudiantado de la Universitat Jaume I para celebrar el aniversario de la institución.</p><p>La jornada reunió a numerosos estudiantes en un ambiente de convivencia y celebración, donde la música y la gastronomía fueron protagonistas. Durante el evento, los asistentes pudieron disfrutar de una tradicional paella mientras participaban en distintas actividades festivas, generando un espacio de encuentro entre estudiantes de diferentes grados y cursos.</p><p>Además de la comida, la música y la animación contribuyeron a crear un ambiente dinámico y participativo que se prolongó durante toda la jornada. El evento permitió reforzar los lazos entre el estudiantado y fomentar la participación en la vida universitaria, convirtiéndose en una de las celebraciones más esperadas dentro del calendario académico.</p><p>Uno de los elementos más característicos de la celebración fue la vestimenta del estudiantado. Muchos participantes acudieron con camisetas personalizadas que incluían frases, diseños o logotipos representativos de sus respectivas carreras, convirtiendo el encuentro en una muestra de identidad y orgullo académico. Estas camisetas, en muchos casos diseñadas por los propios estudiantes, aportaron un toque creativo y distintivo al evento, reflejando el compañerismo y el sentido de pertenencia a cada titulación.</p><p>En conjunto, Paellas 2026 volvió a consolidarse como una cita destacada para la comunidad universitaria, combinando tradición, participación y espíritu festivo en un día pensado para compartir, celebrar y fortalecer la vida estudiantil dentro de la universidad.</p>",
        alt: "Cartel de las Paellas 2026 del Consell de l'Estudiantat de la Universitat Jaume I.",
      },
    },
    {
      slug: 'ritsi-xv-jornadas-formacion-sevilla-febrero-2026',
      kind: 'member',
      startDate: '2026-02-03',
      endDate: '2026-02-06',
      location: 'Universidad de Sevilla',
      memberOrgKey: 'RITSI',
      image:
        '/transparencia/actividad/imagenes/ritsi-xv-jornadas-formacion-sevilla-febrero-2026.webp',
      es: {
        title: 'RITSI realiza sus XV Jornadas de Formación en la Universidad de Sevilla',
        excerpt:
          'Del 3 al 6 de febrero, RITSI reunió en Sevilla a representantes de estudiantes de toda España en sus XV Jornadas de Formación.',
        contentHtml:
          '<p>Las XV Jornadas de Formación de RITSI, que este año han tenido lugar en Sevilla del 3 al 6 de febrero, han reunido a representantes de estudiantes de Delegaciones y Consejos de Universidades de toda España con el objetivo de dotarse de herramientas y conocimientos que les faciliten su labor diaria en la defensa de los derechos de sus compañeros, fomentando el intercambio de experiencias y la colaboración entre universidades.</p><p>En el programa formativo de estas Jornadas de Formación, se cuenta con las siguientes líneas formativas:</p><ul><li><strong>Línea Básica:</strong> orientada a quienes inician su camino en la representación, aprendiendo la historia de RITSI, la legislación universitaria y las habilidades de liderazgo.</li><li><strong>Línea de Política Universitaria y Calidad:</strong> dirigida a representantes con experiencia que deseen profundizar en el estado actual del Sistema Universitario Español (SUE), procesos de calidad de la ANECA y reformas educativas.</li><li><strong>Línea de Comunicación y Vida Universitaria:</strong> enfocada en la gestión de redes sociales, diseño de imagen de marca, negociación y organización de eventos institucionales.</li></ul>',
        alt: 'Foto de grupo de las XV Jornadas de Formación de RITSI en la Universidad de Sevilla.',
      },
    },
  ],
  areaReports: [
    {
      area: CURRENT_AREAS.PRESIDENCIA,
      image: '/transparencia/informes-areas/imagenes/informe-presidencia-febrero-2026.webp',
      es: {
        contentHtml:
          '<p>A lo largo de febrero, el área de Presidencia ha trabajado por desarrollar lo discutido en la CEA presencial. Nos hemos reunido con distintos grupos políticos para presentarles las prioridades del estudiantado universitario para el 2026. Se ha colaborado con CANAE, ESN, Cruz Roja Juventud y ACNUR para organizar una campaña de sensibilización en materia de inmigración y personas refugiadas. Además, con la celebración del VII Congreso CREUP-CRUE, se ha colaborado en el envío de invitaciones y la elaboración de la línea del Encuentro de Representantes.</p>',
        alt: 'Equipo del área de Presidencia de CREUP frente a la entrada de un edificio.',
      },
    },
    {
      area: CURRENT_AREAS.SECRETARIA,
      image: '/transparencia/informes-areas/imagenes/informe-secretaria-febrero-2026.webp',
      es: {
        contentHtml:
          '<p>Desde el área de Secretaría Ejecutiva y la Dirección de Gabinete se prepararon las elecciones al Órgano de Coordinación del Comité de Asuntos Sectoriales y, posteriormente, se mantuvo una reunión de traspaso junto con la candidatura electa.</p><p>Por otro lado, el Secretario Ejecutivo y Director de Gabinete colaboró en la organización del VII Congreso CREUP-CRUE y el XV Encuentro de Representantes, en especial en la coordinación del protocolo del acto de inauguración.</p>',
        alt: 'Equipo del área de Secretaría Ejecutiva y Dirección de Gabinete de CREUP.',
      },
    },
    {
      area: CURRENT_AREAS.TESORERIA,
      image: '/transparencia/informes-areas/imagenes/informe-tesoreria-febrero-2026.webp',
      es: {
        contentHtml:
          '<p>Durante este periodo, el área de Tesorería de CREUP se enfocó activamente en el saneamiento del estado de las deudas que se deben a la asociación y en la revisión del estado de las facturas pendientes del anterior periodo fiscal.</p><p>Junto al área de Secretaría y a la Vocalía de Digitalización, se ha seguido añadiendo nuevas herramientas para facilitar la gestión económica en la intranet. Por otro lado, la Vocalía de Proyectos se ha centrado en la búsqueda de subvenciones, especialmente centrada en proyectos europeos.</p>',
        alt: 'Equipo del área de Tesorería de CREUP.',
      },
    },
    {
      area: CURRENT_AREAS.COMUNICACION,
      image: '/transparencia/informes-areas/imagenes/informe-comunicacion-febrero-2026.webp',
      es: {
        contentHtml:
          '<p>Durante este mes, el área de Comunicación ha estado ultimando los detalles de la identidad visual del XV Encuentro de Representantes y el VII Congreso CREUP-CRUE.</p><p>Además, hemos planteado algunas campañas junto a la Vocalía de Igualdad para el 8 de marzo y otras centradas en las personas con discapacidad. Asimismo, hemos cubierto algunos eventos a los que ha asistido la Comisión Ejecutiva Ampliada.</p>',
        alt: 'Equipo del área de Comunicación de CREUP.',
      },
    },
    {
      area: CURRENT_AREAS.POLITICA,
      image:
        '/transparencia/informes-areas/imagenes/informe-politica-universitaria-febrero-2026.webp',
      es: {
        contentHtml:
          '<p>Durante el mes de febrero, desde el área de Política Universitaria hemos seguido trabajando la documentación que presentaremos en la 79 AGO. Además, hemos estado preparando las diferentes mesas de debate del Encuentro de Representantes. Por otro lado, nos hemos estado reuniendo con distintas entidades sociales para llevar a cabo proyectos de colaboración e hicimos una sesión abierta para trabajar el documento del reconocimiento de competencias.</p>',
        alt: 'Equipo del área de Política Universitaria de CREUP.',
      },
    },
    {
      area: CURRENT_AREAS.COORDINACION,
      image:
        '/transparencia/informes-areas/imagenes/informe-coordinacion-interna-y-formacion-febrero-2026.webp',
      es: {
        contentHtml:
          '<p>Durante este mes, desde el área de Coordinación Interna y Formación hemos continuado reforzando el contacto con los MOREs y las sectoriales de la entidad, manteniendo un seguimiento activo para conocer sus necesidades actuales, resolver dudas y acompañar sus procesos internos. Este trabajo se ha desarrollado tanto a través de reuniones directas como mediante el contacto continuo en los distintos canales de comunicación habituales.</p><p>Asimismo, hemos colaborado estrechamente con el área de Organización en la preparación y el desarrollo del VII Congreso CREUP-CRUE y del XV Encuentro de Representantes Estudiantiles.</p>',
        alt: 'Equipo del área de Coordinación Interna y Formación de CREUP.',
      },
    },
    {
      area: CURRENT_AREAS.ORGANIZACION,
      image: '/transparencia/informes-areas/imagenes/informe-organizacion-febrero-2026.webp',
      es: {
        contentHtml:
          '<p>Este mes, el área se ha centrado en la coordinación logística del VII Encuentro CREUP-CRUE y el XV Encuentro de Representantes junto al Consell de la UPV. Durante el evento, el área ha mantenido labores constantes de apoyo y logística en la sede. En cuanto al trabajo interno, destaca la finalización de la Guía de presentación de sede.</p>',
        alt: 'Equipo del área de Organización de CREUP.',
      },
    },
  ],
}

export default month
