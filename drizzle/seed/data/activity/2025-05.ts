/**
 * April–May 2025 "Actividad" seed module, migrated from the discontinued monthly newsletter PDF
 * (public/prensa/newsletter/documentos/newsletter-2025-05.pdf).
 *
 * Spanish-only on purpose: parents + the `es` translation are seeded; the other five locales are
 * backfilled later (same staged approach the press seed uses). Inserted idempotently by the
 * aggregator (./index.ts → drizzle/seed/content.ts) on the natural keys, so re-running is safe.
 *
 * Mandate: this edition belongs to the previous org chart → PREVIOUS_AREAS.
 * The cover spans "ABRIL - MAYO 2025", so the edition covers April–May: monthKey is the anchor
 * (end of range) and coversFrom marks the start. The "Informe mensual de áreas" section ("Ponte al
 * día") reported on all seven previous-mandate areas.
 */
import type { SeedNewsletterMonth } from './types'
import { PREVIOUS_AREAS } from './areas'

const month: SeedNewsletterMonth = {
  monthKey: '2025-05',
  coversFrom: '2025-04',
  entries: [
    {
      slug: '77-asamblea-general-ordinaria-sevilla-mayo-2025',
      kind: 'creup',
      startDate: '2025-04-02',
      endDate: '2025-04-06',
      location: 'Universidad de Sevilla',
      image:
        '/transparencia/actividad/imagenes/77-asamblea-general-ordinaria-sevilla-mayo-2025.webp',
      es: {
        title: 'CREUP celebra su 77ª AGO en la Universidad de Sevilla',
        excerpt:
          'Entre el 2 y el 6 de abril, la Universidad de Sevilla acogió la 77ª Asamblea General Ordinaria de CREUP, con más de 120 representantes de 41 universidades públicas.',
        contentHtml:
          '<p>La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) celebró su 77ª Asamblea General Ordinaria en la Universidad de Sevilla, un encuentro que reunió a más de 120 representantes estudiantiles de 41 universidades públicas de toda España. El evento, que comenzó el 2 de abril y se extendió hasta el día 6, se consolida como uno de los espacios más relevantes para la representación estudiantil a nivel estatal.</p><p>Durante la Asamblea se abordaron temas fundamentales para el presente y futuro del sistema universitario español. Entre los puntos más destacados del orden del día se encontraron la financiación de las universidades públicas, la salud mental del estudiantado, los criterios de concesión de becas del Ministerio de Educación y el acceso a la vivienda para estudiantes.</p><p>También se debatieron protocolos frente al acoso y la discriminación, así como posicionamientos sobre el Estatuto del Estudiante Universitario y el Estatuto del Estudiante en Prácticas, todo ello en el marco de las reformas introducidas por la nueva Ley Orgánica del Sistema Universitario (LOSU).</p><p>En el ámbito interno, CREUP continuó avanzando en el fortalecimiento de su estructura organizativa con la aprobación de nuevas regulaciones y convenios. Entre ellos destacaron el Reglamento del Comité de Asuntos Sectoriales y la creación del Pool de Estudiantes con Formación en Garantía de Calidad, que contribuirán a una representación más especializada y efectiva.</p><p>La Universidad de Sevilla, a través de su Consejo de Alumnos (CADUS), fue la anfitriona de este evento, brindando sus espacios y recursos para garantizar el éxito organizativo y logístico del encuentro.</p>',
        alt: 'Foto de grupo de la 77ª Asamblea General Ordinaria de CREUP en la Universidad de Sevilla.',
      },
    },
    {
      slug: 'reunion-gt-participacion-estudiantil-crue-mayo-2025',
      kind: 'creup',
      startDate: '2025-04-09',
      isOnline: true,
      location: null,
      image:
        '/transparencia/actividad/imagenes/reunion-gt-participacion-estudiantil-crue-mayo-2025.webp',
      es: {
        title: 'Reunión del Grupo de Trabajo de Participación Estudiantil con CRUE',
        excerpt:
          'El 9 de abril, CREUP participó en la reunión mensual del Grupo de Trabajo de Participación Estudiantil con CRUE, donde se presentó el Pasaporte y Sello de Empleabilidad.',
        contentHtml:
          '<p>El pasado 9 de abril tuvo lugar la reunión mensual del Grupo de Trabajo de Participación Estudiantil con CRUE, en la que CREUP participó activamente. Durante el encuentro, Mili, representante de la Universidad de Salamanca, presentó el Pasaporte y Sello de Empleabilidad, una iniciativa implantada el pasado febrero en dicha universidad.</p><p>Desde este grupo de trabajo se está avanzando en la creación de un pasaporte de reconocimiento de competencias extraacadémicas estandarizado para todas las universidades españolas, con el objetivo de visibilizar y poner en valor las habilidades desarrolladas fuera del aula por el estudiantado.</p>',
        alt: 'Mosaico de la videollamada del Grupo de Trabajo de Participación Estudiantil con CRUE.',
      },
    },
    {
      slug: 'reunion-docentia-aneca-mayo-2025',
      kind: 'creup',
      startDate: '2025-04-24',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-docentia-aneca-mayo-2025.webp',
      es: {
        title: 'Reunión sobre DOCENTIA, nuevas modalidades docentes y colaboración con ANECA',
        excerpt:
          'El 24 de abril, CREUP se reunió con ANECA para abordar la reforma del programa DOCENTIA y las nuevas modalidades de enseñanza del Real Decreto 822/2021.',
        contentHtml:
          '<p>El pasado 24 de abril, representantes de CREUP participaron en una reunión periódica con la Agencia Nacional de Evaluación de la Calidad y Acreditación (ANECA), enmarcada en el trabajo conjunto que ambas entidades mantienen para garantizar la calidad del sistema universitario desde una perspectiva participativa e inclusiva.</p><p>Durante el encuentro, se abordó el estado actual de la reforma del programa DOCENTIA, que tiene como objetivo renovar y mejorar los mecanismos de evaluación de la actividad docente del profesorado universitario. CREUP reiteró la importancia de que estos procesos incorporen la voz del estudiantado de manera estructural, reconociendo su experiencia directa en el aula como parte esencial de la evaluación.</p><p>Asimismo, se debatieron las implicaciones de las nuevas modalidades de enseñanza recogidas en el Real Decreto 822/2021, especialmente en lo referente a la docencia híbrida, virtual o intensiva, y se exploraron mecanismos para asegurar su calidad, trazabilidad y coherencia con los principios de equidad y accesibilidad. La representación estudiantil mostró su preocupación por el correcto seguimiento de estas modalidades y por el impacto que pueden tener en la experiencia formativa del estudiantado.</p><p>Finalmente, la reunión sirvió para explorar nuevas vías de colaboración entre ANECA y CREUP, con el objetivo de fortalecer el papel del estudiantado en los procesos de evaluación, acreditación y diseño de titulaciones. Ambas partes coincidieron en la necesidad de seguir construyendo un modelo de aseguramiento de la calidad que sea transparente, participativo y orientado a la mejora continua del sistema universitario.</p>',
        alt: 'Mosaico de la videollamada de la reunión de CREUP con ANECA sobre DOCENTIA.',
      },
    },
    {
      slug: 'jornada-cje-ayudas-desarrollo-mayo-2025',
      kind: 'creup',
      startDate: '2025-05-05',
      location: null,
      image: '/transparencia/actividad/imagenes/jornada-cje-ayudas-desarrollo-mayo-2025.webp',
      es: {
        title: 'CREUP participa en la jornada del CJE sobre ayudas al desarrollo',
        excerpt:
          'El 5 de mayo, CREUP participó en una jornada del Consejo de la Juventud de España sobre cómo repensar las políticas de ayuda al desarrollo desde una perspectiva juvenil.',
        contentHtml:
          '<p>El pasado 5 de mayo tuvimos la oportunidad de participar en una jornada organizada por el Consejo de la Juventud de España (CJE), centrada en uno de los grandes retos de nuestro tiempo: cómo repensar las políticas de ayuda al desarrollo desde una perspectiva juvenil y transformadora.</p><p>Durante el encuentro, jóvenes de distintas organizaciones y realidades —entre ellas, representantes del ámbito universitario— nos reunimos en diversas mesas de trabajo para debatir y reflexionar sobre temas tan cruciales como el comercio justo, la fiscalidad global o la digitalización de los procesos de cooperación internacional.</p><p>Este espacio de diálogo no solo permitió poner en común propuestas, sino también visibilizar el papel activo que la juventud universitaria tiene en la defensa de una cooperación más justa, eficaz y alineada con los derechos humanos.</p>',
        alt: 'Representantes de CREUP en la jornada del Consejo de la Juventud de España sobre ayudas al desarrollo.',
      },
    },
    {
      slug: 'xxv-encuentro-siou-rovira-virgili-mayo-2025',
      kind: 'creup',
      startDate: '2025-05-05',
      location: 'Universidad Rovira i Virgili, Tarragona',
      image: '/transparencia/actividad/imagenes/xxv-encuentro-siou-rovira-virgili-mayo-2025.webp',
      es: {
        title: 'CREUP defiende la participación estudiantil en el XXV Encuentro Anual de los SIOU',
        excerpt:
          'El 5 de mayo, CREUP participó en el XXV Encuentro Anual de los SIOU, en la Universidad Rovira i Virgili, en una mesa de debate sobre la reforma del Estatuto del Estudiante Universitario.',
        contentHtml:
          '<p>El pasado 5 de mayo, la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) participó en una mesa de debate centrada en la reforma del Estatuto del Estudiante Universitario. En el encuentro, se presentaron propuestas clave para su modificación, con especial énfasis en la necesidad de implementar medidas que faciliten y fomenten la participación del estudiantado en la vida universitaria.</p><p>La intervención tuvo lugar en el marco del XXV Encuentro Anual de los Servicios de Información y Orientación Universitarios (SIOU), celebrado este año en la Universidad Rovira i Virgili, en Tarragona. CREUP aprovechó el espacio para reivindicar una mayor implicación del estudiantado en los procesos de toma de decisiones dentro del sistema universitario y subrayar el papel esencial que desempeñan los órganos de representación en la mejora de la calidad educativa.</p>',
        alt: 'Representantes de CREUP en el XXV Encuentro Anual de los SIOU en la Universidad Rovira i Virgili.',
      },
    },
    {
      slug: 'reunion-cje-canae-asociaciones-estudiantiles-mayo-2025',
      kind: 'creup',
      startDate: '2025-05-19',
      isOnline: true,
      location: null,
      image:
        '/transparencia/actividad/imagenes/reunion-cje-canae-asociaciones-estudiantiles-mayo-2025.webp',
      es: {
        title:
          'Reunión con el CJE para abordar la situación de las asociaciones estudiantiles en España',
        excerpt:
          'El 19 de mayo, CREUP participó junto a CANAE en una reunión convocada por el CJE para poner en común la situación de las principales organizaciones estudiantiles del país.',
        contentHtml:
          '<p>El pasado 19 de mayo, CREUP participó en una reunión convocada por el Consejo de la Juventud de España (CJE) junto a CANAE con el objetivo de poner en común la situación actual de las principales organizaciones estudiantiles del país.</p><p>Durante el encuentro, ambas entidades expusieron los retos y necesidades que enfrentan en su labor de representación estudiantil, así como los avances recientes en sus respectivas estructuras.</p><p>Esta reunión permitió al CJE recabar información de primera mano para mejorar su interlocución con las administraciones públicas y reforzar su apoyo al tejido asociativo juvenil en el ámbito educativo.</p>',
        alt: 'Mosaico de la videollamada de la reunión de CREUP y CANAE con el Consejo de la Juventud de España.',
      },
    },
    {
      slug: 'iii-jornada-alumni-microcredenciales-mayo-2025',
      kind: 'creup',
      startDate: '2025-05-20',
      location: null,
      image:
        '/transparencia/actividad/imagenes/iii-jornada-alumni-microcredenciales-mayo-2025.webp',
      es: {
        title:
          'CREUP participa en la III Jornada de Trabajo de Alumni sobre microcredenciales universitarias',
        excerpt:
          'El 20 de mayo, CREUP participó en la III Jornada de Trabajo de Alumni España sobre la implantación y mejora de las microcredenciales en el ámbito universitario.',
        contentHtml:
          '<p>El pasado 20 de mayo tuvo lugar la III Jornada de Trabajo organizada por Alumni España, un espacio de encuentro donde representantes de distintas entidades universitarias compartieron experiencias y buenas prácticas relacionadas con las microcredenciales en el ámbito universitario.</p><p>Durante la jornada se abordaron propuestas y estrategias para la implantación y mejora de estas herramientas formativas, cada vez más relevantes en el contexto de la educación superior europea. Las microcredenciales permiten a estudiantes y egresados certificar competencias específicas y facilitar su empleabilidad, adaptándose así a los nuevos retos del mercado laboral.</p><p>El evento también sirvió como plataforma para conocer cómo se están aplicando estas iniciativas en distintos territorios, destacando enfoques innovadores y modelos de colaboración entre universidades, empresas y asociaciones de egresados.</p><p>Desde CREUP valoramos positivamente este tipo de espacios que refuerzan la conexión entre universidad, estudiantes y mundo profesional, y que permiten avanzar hacia una formación más flexible, inclusiva y adaptada a las necesidades del estudiantado.</p>',
        alt: 'Representante de CREUP en la III Jornada de Trabajo de Alumni España sobre microcredenciales.',
      },
    },
    {
      slug: 'reunion-psm-universidades-madrid-mayo-2025',
      kind: 'creup',
      startDate: '2025-05-21',
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-psm-universidades-madrid-mayo-2025.webp',
      es: {
        title:
          'CREUP y los consejos de estudiantes madrileños se reúnen con el PSM para abordar la situación de las universidades en Madrid',
        excerpt:
          'El 21 de mayo, CREUP se reunió junto a los consejos de estudiantes madrileños con el Partido Socialista de Madrid, encabezado por Óscar López, para trasladar la preocupación por la infrafinanciación universitaria.',
        contentHtml:
          '<p>El pasado martes 21 de mayo, la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) participó en una reunión clave junto a los consejos de estudiantes de las universidades públicas madrileñas y representantes del Partido Socialista de Madrid (PSM), encabezados por Óscar López. El encuentro tuvo como objetivo principal trasladar la preocupación del estudiantado ante la situación de infrafinanciación que atraviesan las universidades públicas en la Comunidad de Madrid, así como debatir sobre el nuevo proyecto de Ley de Enseñanzas Superiores que pretende aprobar el ejecutivo autonómico.</p><p>Durante la reunión, se expuso cómo la insuficiente financiación pública está afectando de forma directa a la calidad de la enseñanza, a la infraestructura universitaria y a los recursos disponibles para estudiantes, profesorado y personal de administración y servicios. Los representantes estudiantiles advirtieron que esta situación no solo compromete el presente de las universidades, sino también su futuro.</p>',
        alt: 'Reunión de CREUP y los consejos de estudiantes madrileños con el Partido Socialista de Madrid.',
      },
    },
    {
      slug: 'reunion-gt-participacion-crue-jaume-i-mayo-2025',
      kind: 'creup',
      startDate: '2025-05-25',
      endDate: '2025-05-27',
      location: 'Universidad Jaume I',
      image:
        '/transparencia/actividad/imagenes/reunion-gt-participacion-crue-jaume-i-mayo-2025.webp',
      es: {
        title: 'El Grupo de Trabajo sobre Participación de CRUE se reúne en la Universidad Jaume I',
        excerpt:
          'Entre el 25 y el 27 de mayo, la Universidad Jaume I acogió la reunión presencial del Grupo de Trabajo sobre Participación de CRUE, sobre el reconocimiento formal de las competencias adquiridas por el estudiantado.',
        contentHtml:
          '<p>Entre los días 25 y 27 de mayo tuvo lugar en la Universidad Jaume I la reunión presencial del Grupo de Trabajo sobre Participación de CRUE, en la que representantes de distintas universidades reflexionaron sobre la necesidad de acreditar formalmente las competencias que el estudiantado adquiere a través de su implicación en la vida universitaria.</p><p>Durante las sesiones de trabajo se debatieron posibles vías de reconocimiento institucional, se definieron las competencias clave asociadas a la participación estudiantil —como la comunicación, el liderazgo, la gestión de proyectos o el trabajo en equipo— y se establecieron los próximos pasos para dar continuidad al plan de participación diseñado previamente por este grupo.</p>',
        alt: 'Sesión presencial del Grupo de Trabajo sobre Participación de CRUE en la Universidad Jaume I.',
      },
    },
    {
      slug: 'siueh-vi-asamblea-general-ordinaria-las-palmas-mayo-2025',
      kind: 'member',
      startDate: '2025-04-24',
      endDate: '2025-04-27',
      location: 'Las Palmas de Gran Canaria',
      memberOrgKey: 'SIUEH',
      image:
        '/transparencia/actividad/imagenes/siueh-vi-asamblea-general-ordinaria-las-palmas-mayo-2025.webp',
      es: {
        title: 'SIUEH celebra su VI AGO en Las Palmas de Gran Canaria',
        excerpt:
          'Entre el 24 y el 27 de abril, la Sectorial Interuniversitaria de Estudiantes de Humanidades celebró su VI Asamblea General Ordinaria en Las Palmas de Gran Canaria.',
        contentHtml:
          '<p>Entre el 24 y el 27 de abril, la Sectorial Interuniversitaria de Estudiantes de Humanidades (SIUEH) celebró su VI Asamblea General Ordinaria en Las Palmas de Gran Canaria. Este evento reunió a representantes del área de las Humanidades de toda España y permitió que se debatieran temas de suma importancia para dicha área del conocimiento.</p><p>El evento comenzó con la mesa redonda «Islas del Saber», donde varios expertos expusieron la riqueza cultural e histórica de las Islas Canarias. Durante los días de la asamblea, el estudiantado puso sobre la mesa problemáticas que sufren las Humanidades y se buscaron algunas alternativas al respecto. Concretamente, se aprobaron varios posicionamientos que atañen al estudiantado. Entre ellos, se pueden destacar el Posicionamiento sobre Prácticas Académicas, el acceso a información en archivos, la interpretación responsable del patrimonio y la Filosofía Aplicada. Además, se reestructuró la Junta Directiva, se ratificaron los puestos de la Junta Directiva Ampliada y se aprobó la sede de la VII AGO de SIUEH: la Universidad de Jaén.</p>',
        alt: 'Foto de grupo de la VI Asamblea General Ordinaria de SIUEH en Las Palmas de Gran Canaria.',
      },
    },
  ],
  areaReports: [
    {
      area: PREVIOUS_AREAS.PRESIDENCIA,
      image: '/transparencia/informes-areas/imagenes/informe-presidencia-mayo-2025.webp',
      es: {
        contentHtml:
          '<p>Tras la celebración de la 77ª Asamblea General Ordinaria (AGO) en Sevilla, desde Presidencia hemos iniciado los trabajos de incidencia relacionados con los documentos aprobados durante el encuentro. Entre las primeras acciones, destaca la interlocución con el rector de la Universidad Pablo de Olavide y miembro del Comité Permanente de CRUE, para abordar el documento relativo al Estatuto del Estudiante en Formación Práctica No Laboral en el Ámbito de la Empresa. Además, participamos en el Pleno del Consejo de Estudiantes Universitarios del Estado (CEUNE), donde se formalizó la entrada de la nueva Comisión Permanente.</p><p>El Área de Internacionales ha continuado impulsando las líneas aprobadas tanto en Sevilla como en asambleas anteriores. Se ha avanzado en los proyectos sobre estudiantado refugiado, la situación del Sáhara Occidental y las alianzas universitarias europeas. También hemos organizado una reunión presencial de Mednet en la Universidad de Cádiz y asistido al Board Meeting en Banja Luka. En este encuentro, se aprobaron dos resoluciones impulsadas por el Comité de Asuntos Internacionales (CAI): la inclusión del Sáhara Occidental en las políticas universitarias y una denuncia sobre la situación de la vivienda para el estudiantado.</p><p>Desde el área de Igualdad se dio por finalizado el ciclo de píldoras formativas impulsadas junto a FONCE, centradas en la discapacidad y dirigidas al estudiantado. Agradecemos profundamente el compromiso de FONCE con la formación inclusiva y su labor en esta iniciativa.</p>',
        alt: 'Equipo de Presidencia de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.SECRETARIA,
      image: '/transparencia/informes-areas/imagenes/informe-secretaria-mayo-2025.webp',
      es: {
        contentHtml:
          '<p>Desde Secretaría se ha publicado en la intranet y web toda la documentación aprobada en la 77.ª Asamblea General Ordinaria. Además, se completó el cambio de sede social tras la inscripción de la reforma de estatutos en el Registro de Asociaciones.</p><p>Se organizaron las elecciones del Órgano de Coordinación del CAS y de la Coordinación del CAI, gestionando toda la documentación y procedimientos necesarios. También se participó en la administración electoral para la convocatoria de vocalías.</p><p>Se inició la firma de nuevos convenios con las sectoriales y se colaboró con Tesorería en la preparación de la documentación para la subvención del INJUVE.</p><p>El Secretario Ejecutivo representó a CREUP en la Comisión Permanente del CEUNE y en reuniones con el Secretario General de Universidades, además de acompañar al presidente en diversos actos en Madrid, incluyendo encuentros con el PSOE y otros MOREs.</p><p>Por último, avanzan los preparativos de la 78.ª Asamblea General Ordinaria y se mantienen reuniones para organizar la actividad interna, la incidencia política y la comunicación.</p>',
        alt: 'Equipo de la Secretaría Ejecutiva de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.TESORERIA,
      image: '/transparencia/informes-areas/imagenes/informe-tesoreria-mayo-2025.webp',
      es: {
        contentHtml:
          '<p>En las semanas posteriores a la 77 Asamblea General Ordinaria (AGO), el área de Tesorería ha centrado sus esfuerzos en la facturación a los asistentes y en la gestión de pagos pendientes relacionados con el evento. Además, se ha continuado con las tareas de gestión ordinaria y se ha elaborado una guía de comisiones de gasto destinada a los miembros de la Comisión Ejecutiva Ampliada, para mejorar la transparencia y el control en el uso de recursos.</p><p>Tras la AGO, se realizó una valoración exhaustiva del periodo interasambleario con el fin de detectar aspectos que requerían replanteamiento. Esta revisión ha impulsado una reestructuración en la planificación operativa de la vocalía de proyectos, orientando los esfuerzos hacia las necesidades reales identificadas durante este análisis.</p><p>Entre las acciones más destacadas del periodo, desde Tesorería se ha llevado a cabo un intenso trabajo en la gestión de la subvención del Instituto de la Juventud (INJUVE) para asociaciones juveniles. Este proceso ha contado con la coordinación estrecha entre distintas áreas de la Comisión Ejecutiva Ampliada para maximizar el apoyo a la mayor cantidad posible de iniciativas juveniles.</p>',
        alt: 'Responsable de Tesorería de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.RRII,
      image:
        '/transparencia/informes-areas/imagenes/informe-relaciones-institucionales-y-proyectos-mayo-2025.webp',
      es: {
        contentHtml:
          '<p>Tras la 77ª AGO, la Vicepresidencia ha trabajado con el área de Política Universitaria en el RD 640 sobre creación de universidades, trasladando nuestras propuestas al Secretario General de Universidades. También se ha colaborado con el área de Comunicación para preparar futuras campañas.</p><p>Se participó en una jornada con Alumni España sobre buenas prácticas y microcredenciales, y en una reunión con el PSOE de Madrid para tratar la financiación y la nueva ley autonómica de universidades.</p><p>Además, se mantuvieron encuentros con el CJE sobre la situación de las asociaciones juveniles, y se participó en unas jornadas junto al Ministerio de Exteriores sobre temas como comercio digital, desarrollo, fiscalidad internacional y tecnología.</p>',
        alt: 'Responsable de la Vicepresidencia de Relaciones Institucionales de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.POLITICA,
      image: '/transparencia/informes-areas/imagenes/informe-politica-universitaria-mayo-2025.webp',
      es: {
        contentHtml:
          '<p>La Vicepresidencia de Política Universitaria de CREUP ha avanzado en varios frentes clave durante las últimas semanas.</p><p>Se ha formalizado el traspaso de la Vocalía de Gobernanza y Coordinación, asegurando una transición fluida y la continuidad del trabajo dentro del área.</p><p>Además, CREUP participó en el encuentro presencial del Grupo de Trabajo de Participación de CRUE, donde se abordaron cuestiones sobre representación estudiantil y estructuras de participación en las universidades.</p><p>En el ámbito institucional, se mantuvieron reuniones con el Ministerio de Educación, Formación Profesional y Deportes para tratar la próxima convocatoria de becas, y con el Ministerio de Ciencia, Innovación y Universidades en relación con la modificación del Real Decreto 640/2021, así como otros asuntos de política universitaria.</p><p>Finalmente, el área de Política Universitaria celebró una reunión interna para coordinar líneas estratégicas y preparar futuras acciones.</p>',
        alt: 'Equipo de la Vicepresidencia de Política Universitaria de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.ORGANIZACION,
      image: '/transparencia/informes-areas/imagenes/informe-organizacion-mayo-2025.webp',
      es: {
        contentHtml:
          '<p>El área de Organización comenzó abril trabajando en la 77ª AGO en Sevilla, colaborando con la sede en la ejecución del evento y la gestión de imprevistos.</p><p>Tras la Asamblea, se renovaron las vocalías: Carla Sosa asumió Formación y Lorena Villalba, Logística. Desde entonces, se ha avanzado en la organización de la próxima CEA presencial y del XII Stage Formativo, para el que ya se ha lanzado una encuesta a la Asamblea con el fin de definir sus contenidos.</p><p>Además, ya se han iniciado los preparativos y reuniones para la 78ª AGO, que tendrá lugar en la Universitat de Barcelona.</p>',
        alt: 'Equipo de la Vicepresidencia de Organización de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.COMUNICACION,
      image: '/transparencia/informes-areas/imagenes/informe-comunicacion-mayo-2025.webp',
      es: {
        contentHtml:
          '<p>Durante los últimos meses, el área de Comunicación de CREUP ha centrado sus esfuerzos en el impulso de campañas clave para el estudiantado, poniendo el foco en tres ejes prioritarios: vivienda, financiación y salud mental.</p><p>En este marco, se han desarrollado distintas piezas comunicativas y artículos que visibilizan las necesidades reales del alumnado, especialmente en lo relativo al bienestar psicológico. Estas acciones han contribuido a reforzar la voz del estudiantado en el debate público y a trasladar sus demandas a los distintos actores sociales y políticos.</p>',
        alt: 'Equipo de la Dirección de Comunicación de CREUP.',
      },
    },
  ],
}

export default month
