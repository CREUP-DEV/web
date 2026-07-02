/**
 * October 2024 "Actividad" seed module, migrated from the discontinued monthly newsletter PDF
 * (public/prensa/newsletter/documentos/newsletter-2024-10.pdf).
 *
 * Spanish-only on purpose: parents + the `es` translation are seeded; the other five locales are
 * backfilled later (same staged approach the press seed uses). Inserted idempotently by the
 * aggregator (./index.ts → drizzle/seed/content.ts) on the natural keys, so re-running is safe.
 *
 * Mandate: this edition belongs to the previous org chart → PREVIOUS_AREAS.
 */
import type { SeedNewsletterMonth } from './types'
import { PREVIOUS_AREAS } from './areas'

const PLACEHOLDER_DATE = '2024-10-01'

const month: SeedNewsletterMonth = {
  monthKey: '2024-10',
  coversFrom: null,
  entries: [
    {
      slug: 'xi-stage-formativo-isin-octubre-2024',
      kind: 'creup',
      startDate: '2024-10-17',
      endDate: '2024-10-20',
      location: 'Isín, Huesca',
      image: '/transparencia/actividad/imagenes/xi-stage-formativo-isin-octubre-2024.webp',
      es: {
        title: 'XI Stage Formativo de CREUP en Isín',
        excerpt:
          'Del 17 al 20 de octubre, más de 80 representantes estudiantiles se formaron en el XI Stage Formativo de CREUP en Isín (Huesca).',
        contentHtml:
          '<p>Del 17 al 20 de octubre, más de 80 representantes estudiantiles de diversas universidades españolas participaron en el XI Stage Formativo de la Coordinadora de Representantes de Universidades Públicas (CREUP), que tuvo lugar en la localidad de Isín, Huesca. El evento fue una oportunidad para que los asistentes se formaran en distintas áreas fundamentales, como la Calidad Educativa, la Política Universitaria, la Comunicación y las habilidades básicas para la gestión estudiantil.</p><p>El encuentro se llevó a cabo en un entorno natural único, lo que facilitó un ambiente de reflexión y trabajo en equipo entre los representantes. Durante los cuatro días de actividades, los estudiantes participaron en talleres y sesiones formativas intensivas diseñadas para dotarles de herramientas útiles en su labor de representación.</p><p>Además de las sesiones de formación, el evento sirvió para que los participantes intercambiaran experiencias y propuestas de mejora para sus respectivas universidades. Se abordaron cuestiones clave como la participación estudiantil en la toma de decisiones, el fomento de una comunicación efectiva y la defensa de los derechos del estudiantado.</p><p>Uno de los puntos más destacados fue la colaboración del Instituto Aragonés de la Juventud, que facilitó la red de albergues juveniles de Aragón como sede del evento, y de la Fundación ONCE (FONCE), que jugó un papel clave en la organización del encuentro, apoyando la formación y el fortalecimiento de la representación estudiantil.</p>',
        alt: 'Foto de grupo de los más de 80 representantes asistentes al XI Stage Formativo de CREUP en Isín.',
      },
    },
    {
      slug: 'reunion-acsug-octubre-2024',
      kind: 'creup',
      startDate: '2024-10-02',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-acsug-octubre-2024.webp',
      es: {
        title: 'Reunión de CREUP con ACSUG',
        excerpt:
          'El 2 de octubre, CREUP se reunió con la ACSUG para abordar la oferta de dobles grados, las microcredenciales y el «Pool» de calidad.',
        contentHtml:
          '<p>Durante el 2 de octubre, CREUP se reunió con la Axencia para a Calidade do Sistema Universitario de Galicia (ACSUG) para abordar temas claves, como la oferta de dobles grados, la implementación de microcredenciales y la presentación del «Pool» de calidad. En esta reunión participaron el Vocal de Garantía de Calidad (Pablo Nieto) y el Vicepresidente de Política Universitaria (Jorge Lahoz).</p>',
        alt: 'Captura de la reunión por videollamada de CREUP con la ACSUG.',
      },
    },
    {
      slug: 'reunion-comite-asuntos-sectoriales-octubre-2024',
      kind: 'creup',
      startDate: '2024-10-06',
      isOnline: true,
      location: null,
      image:
        '/transparencia/actividad/imagenes/reunion-comite-asuntos-sectoriales-octubre-2024.webp',
      es: {
        title: 'Reunión del Comité de Asuntos Sectoriales',
        excerpt:
          'El 6 de octubre se celebró la primera reunión del CAS, donde se presentó a su nueva coordinación y se fijaron las líneas de trabajo del curso.',
        contentHtml:
          '<p>El pasado 6 de octubre tuvo lugar la primera reunión del Comité de Asuntos Sectoriales (CAS). Durante dicha reunión se presentó al nuevo coordinador (Sergio, de CREARQ) y al nuevo secretario (Alejandro, de ARELL).</p><p>También se aprovechó para poner en común los objetivos para este nuevo curso académico y la creación de nuevas líneas de trabajo.</p>',
        alt: 'Mosaico de la videollamada de la primera reunión del Comité de Asuntos Sectoriales.',
      },
    },
    {
      slug: 'posicionamiento-salud-mental-octubre-2024',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      location: null,
      image: '/transparencia/actividad/imagenes/posicionamiento-salud-mental-octubre-2024.webp',
      es: {
        title: 'La salud mental: un pilar en la vida universitaria',
        excerpt:
          'CREUP publicó un artículo de posicionamiento por el Día Internacional de la Salud Mental que reclama Unidades de Atención Psicológica de calidad en todas las universidades.',
        contentHtml:
          '<p>La salud mental ha pasado de ser un tema secundario a una prioridad en los últimos años, especialmente en el contexto universitario. CREUP ha manifestado con claridad su postura: es imprescindible que todas las universidades del Estado cuenten con Unidades de Atención Psicológica y Promoción de la Salud. Y no solo es necesario que existan, sino que deben ser de calidad, accesibles y estar adecuadamente financiadas.</p><p>La vida universitaria es un período de grandes cambios: los estudiantes enfrentan decisiones trascendentales, mayor responsabilidad y presión académica y social, lo que los hace especialmente vulnerables a problemas de salud mental. Según datos presentados por CREUP, casi la mitad de los estudiantes ha experimentado algún tipo de trastorno mental a lo largo de su vida universitaria. A pesar de lo alarmante de las cifras, el sistema universitario español sigue sin garantizar la existencia obligatoria de estos servicios en sus centros: el apoyo psicológico sigue siendo opcional y depende de la decisión de cada universidad.</p><p>¿Por qué es tan crucial la salud mental en la universidad? Un 50% de los trastornos mentales se desarrolla antes de los 14 años, y un 75% antes de los 18, según datos de la Confederación Salud Mental España. Esto significa que cuando los jóvenes ingresan a la universidad ya son vulnerables, y la presión académica puede intensificar estos problemas. Por ello, CREUP insiste en que las universidades deben contar con servicios psicológicos que vayan más allá de la asistencia puntual: deben ser espacios que promuevan la salud mental de manera activa y preventiva, ofreciendo herramientas para gestionar el estrés y la ansiedad antes de que se conviertan en problemas graves.</p><p>La pandemia de COVID-19 ha dejado claro que el bienestar mental es una prioridad global. No obstante, es preocupante que la nueva Ley Orgánica del Sistema Universitario (LOSU) no contemple de manera obligatoria la prestación de estos servicios. CREUP ha propuesto que estas Unidades de Atención Psicológica sean de fácil acceso, con personal cualificado y con garantías de calidad, y sugiere que también sirvan como espacios de formación y prácticas para los estudiantes de psicología, de modo que el aprendizaje y la atención se retroalimenten.</p><p>La salud mental es, sin lugar a dudas, uno de los pilares del bienestar. Las universidades tienen el deber de proporcionar a los estudiantes las herramientas necesarias para cuidar su salud mental de la misma manera en que les ofrecen una educación de calidad.</p><p>Artículo elaborado por Gabriel Suárez, Vocal de Diseño de Contenido de CREUP, en base al posicionamiento de CREUP por el Día Internacional de la Salud Mental, celebrado el 10 de octubre. El artículo fue publicado en el digital «Espacios de educación superior».</p>',
        alt: 'Interior de una sala de estudio universitaria con filas de mesas junto a una pared acristalada.',
      },
    },
    {
      slug: 'creup-la-sexta-xplica-vivienda-octubre-2024',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      image: '/transparencia/actividad/imagenes/creup-la-sexta-xplica-vivienda-octubre-2024.webp',
      es: {
        title: 'CREUP alza la voz sobre el problema de la vivienda en «La Sexta Xplica»',
        excerpt:
          'Mª Ángeles Guzmán intervino en «La Sexta Xplica» para visibilizar la precariedad en el acceso a la vivienda del estudiantado universitario.',
        contentHtml:
          '<p>La vivienda se ha convertido en la segunda mayor preocupación de los españoles, según datos recientes, solo superada por la política. Esta problemática afecta de manera significativa al estudiantado universitario, especialmente a quienes deben migrar para cursar sus estudios. En este contexto, Mª Ángeles Guzmán, en representación de CREUP, intervino en el programa «La Sexta Xplica» para visibilizar la situación de precariedad que sufren muchos jóvenes.</p><p>Durante su intervención, Guzmán destacó la importancia de garantizar una vivienda digna para los estudiantes y defendió la universidad pública como un pilar fundamental para el acceso igualitario a la educación. Además, señaló que los altos costos de los alquileres y la escasez de residencias universitarias asequibles están limitando las oportunidades de formación y el bienestar del estudiantado, generando un entorno de desigualdad.</p><p>«Es inaceptable que los estudiantes se vean obligados a migrar en condiciones de precariedad para acceder a una educación superior de calidad», subrayó la Directora de Comunicación, reclamando la necesidad de políticas públicas que aborden de manera urgente esta problemática y garanticen el derecho a la vivienda.</p><p>La participación de Guzmán en el programa se enmarca dentro de una serie de acciones emprendidas por CREUP para sensibilizar a la opinión pública y a las instituciones sobre las dificultades que enfrenta el estudiantado universitario en materia de vivienda.</p>',
        alt: 'Intervención de la representante de CREUP en el programa «La Sexta Xplica» sobre el problema de la vivienda.',
      },
    },
    {
      slug: 'xxvi-encuentro-defensorias-universitarias-octubre-2024',
      kind: 'creup',
      startDate: '2024-10-24',
      endDate: '2024-10-25',
      location: 'Huelva',
      image:
        '/transparencia/actividad/imagenes/xxvi-encuentro-defensorias-universitarias-octubre-2024.webp',
      es: {
        title: 'XXVI Encuentro Estatal de Defensorías Universitarias',
        excerpt:
          'Los días 24 y 25 de octubre, el Vicepresidente de Relaciones Institucionales y Proyectos asistió al XXVI Encuentro Estatal de Defensorías en Huelva.',
        contentHtml:
          '<p>Los días 24 y 25 de octubre, nuestro Vicepresidente de Relaciones Institucionales y Proyectos, Germán Gutiérrez, asistió al XXVI Encuentro Estatal de Defensorías Universitarias en Huelva. Este evento fue organizado por la Conferencia Estatal de Defensores Universitarios.</p><p>En dicho evento pudo plasmar las problemáticas del estudiantado de las universidades y el posicionamiento de CREUP.</p>',
        alt: 'Mesa del XXVI Encuentro Estatal de Defensorías Universitarias en la Universidad de Huelva.',
      },
    },
    {
      slug: 'i-jornada-participacion-estudiantil-crue-creup-octubre-2024',
      kind: 'creup',
      startDate: '2024-10-28',
      location: 'Universidad de Córdoba',
      image:
        '/transparencia/actividad/imagenes/i-jornada-participacion-estudiantil-crue-creup-octubre-2024.webp',
      es: {
        title: 'I Jornada de Participación Estudiantil CRUE - CREUP',
        excerpt:
          'El 28 de octubre se celebró en la Universidad de Córdoba la I Jornada de Participación Estudiantil, organizada por CRUE y CREUP.',
        contentHtml:
          '<p>El 28 de octubre se celebró la I Jornada de Participación Estudiantil en la Universidad de Córdoba. Este evento fue organizado por CRUE y la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP).</p><p>En él, la Vocal de Vida Universitaria (Irene Olivero) participó en una mesa redonda sobre cómo impulsar la participación estudiantil. Por otro lado, tanto ella como el Presidente de CREUP (Alfonso Campuzano) pudieron plasmar las necesidades del estudiantado en la mesa redonda «Barreras en la participación estudiantil».</p><p>En este espacio, ambos pudieron exponer las diferentes causas por las que el estudiantado opta por no participar en la vida universitaria, a pesar de que esta sea uno de los grandes pilares de las universidades.</p>',
        alt: 'Asistentes a la I Jornada de Participación Estudiantil CRUE - CREUP en la Universidad de Córdoba.',
      },
    },
    {
      slug: 'i-congreso-internacional-participacion-estudiantil-octubre-2024',
      kind: 'creup',
      startDate: '2024-10-29',
      endDate: '2024-10-30',
      location: 'Sevilla y Córdoba',
      image:
        '/transparencia/actividad/imagenes/i-congreso-internacional-participacion-estudiantil-octubre-2024.webp',
      es: {
        title: 'I Congreso Internacional de Participación Estudiantil',
        excerpt:
          'Los días 29 y 30 de octubre, Sevilla y Córdoba acogieron el I Congreso Internacional de Participación Estudiantil, con presencia de CREUP.',
        contentHtml:
          '<p>Durante los días 29 y 30 de octubre, las ciudades de Sevilla y Córdoba acogieron el I Congreso Internacional de Participación Estudiantil, un evento pionero en el ámbito de la representación universitaria. Organizado conjuntamente por la Universidad de Córdoba y la Universidad Pablo de Olavide, el congreso reunió a delegaciones de estudiantes y expertos en representación estudiantil de diversas universidades, tanto nacionales como internacionales, con el objetivo de crear un espacio de diálogo sobre los retos y oportunidades en la participación estudiantil.</p><p>Al evento asistieron miembros de la Coordinadora de Representantes de Universidades Públicas (CREUP), quienes presentaron iniciativas y estrategias sobre participación estudiantil en el ámbito nacional e internacional.</p><p>Las ponencias abarcaron temas clave como la implicación de los estudiantes en la toma de decisiones académicas, el fortalecimiento de la representación estudiantil en las estructuras de gobierno universitario y la promoción de una cultura participativa en los centros educativos.</p>',
        alt: 'Foto de grupo de los asistentes al I Congreso Internacional de Participación Estudiantil.',
      },
    },
    {
      slug: 'jornadas-salud-mental-dceucm-octubre-2024',
      kind: 'member',
      startDate: '2024-10-10',
      location: 'Universidad Complutense de Madrid',
      memberOrgKey: 'DCEUCM',
      image: '/transparencia/actividad/imagenes/jornadas-salud-mental-dceucm-octubre-2024.webp',
      es: {
        title: 'La DCE de la Universidad Complutense organiza unas Jornadas de Salud Mental',
        excerpt:
          'La Delegación Central de Estudiantes de la UCM celebró el 10 de octubre la jornada «Tenemos que hablar de tu Salud Mental» con motivo del Día Mundial de la Salud Mental.',
        contentHtml:
          '<p>La Delegación Central de Estudiantes de la Universidad Complutense de Madrid realizó el pasado 10 de octubre la jornada «Tenemos que hablar de tu Salud Mental» con motivo del Día Mundial de la Salud Mental. Contó con una mesa redonda en la que participaron, como moderadora, Rosa de la Fuente (Vicerrectora de Estudiantes de la UCM), y como ponentes Noelia Morán (profesora de psicología), Andrés Pemau (Director de la Cátedra UCM-Grupo 5 Contra el Estigma) y Manuel Muñoz (representante de la Fundación ANAR).</p><p>Además, se realizó un taller de autocuidados de la mano del servicio de atención psicológica de la Universidad, «PsiCall». La jornada terminó con el concierto del cantante Álvaro de Luna junto al Edificio de Estudiantes.</p><p>El propósito de esta jornada fue evidenciar la importancia de la autoobservación y del cuidado colectivo para cuidar nuestra salud y la de todo el estudiantado universitario. Un mensaje que quedó claro con las diferentes intervenciones de los y las ponentes: cuando se habla de salud mental no solo se trata de trastornos mentales, sino también de cómo enfrentar los retos diarios como el estrés.</p><p>No solo debemos preocuparnos de nosotros mismos, sino también de los demás. Esta función es clave para poder ayudar a las personas que nos rodean; muchas veces basta con una simple frase: «Estoy aquí, ¿necesitas algo?». Y son muchas las señales que nos pueden indicar la necesidad de ayuda de otra persona: trastornos del sueño o del apetito, cambios de humor, caída del rendimiento en clase...</p><p>No llegar a las personas que lo necesitan —desde uno mismo y desde las propias instituciones—, o incluso llegar a estigmatizarlo, puede conllevar situaciones extremas que pueden derivar en conductas como el suicidio, por lo que debe ser un tema que hay que tratar de forma pública y con normalidad. Como dijo Andrés Pemau, «no somos una sociedad débil, somos una sociedad que por fin está prestando atención a su salud mental».</p>',
        alt: 'Mesa redonda y público de las Jornadas de Salud Mental de la DCE de la Universidad Complutense de Madrid.',
      },
    },
    {
      slug: 'ii-cumbre-consejos-estudiantes-canarias-octubre-2024',
      kind: 'member',
      startDate: '2024-10-04',
      endDate: '2024-10-06',
      memberOrgKey: 'CEULL',
      image:
        '/transparencia/actividad/imagenes/ii-cumbre-consejos-estudiantes-canarias-octubre-2024.webp',
      es: {
        title: 'II Cumbre de Consejos de Estudiantes de las Universidades Públicas de Canarias',
        excerpt:
          'Del 4 al 6 de octubre, los consejos de estudiantes de la ULL y la ULPGC celebraron la II Cumbre de Consejos de Estudiantes de las Universidades Públicas de Canarias.',
        contentHtml:
          '<p>La «II Cumbre de Consejos de Estudiantes de las Universidades Públicas de Canarias» fue un evento clave para promover el diálogo y la cooperación entre los estudiantes de las universidades públicas canarias: la Universidad de La Laguna (ULL) y la Universidad de Las Palmas de Gran Canaria (ULPGC). Este evento se llevó a cabo del 4 al 6 de octubre de 2024 y abordó tres temas principales que reflejan los problemas críticos que enfrentan estas instituciones y su estudiantado.</p><p><strong>Financiación y becas:</strong> los estudiantes subrayan la importancia de establecer un contrato de financiación estable entre ambas universidades. También propusieron buscar financiación adicional a través de colaboraciones externas y destacaron la necesidad de solicitar apoyo de los cabildos insulares de todas las islas.</p><p><strong>Participación estudiantil y gobernanza:</strong> los estudiantes expresaron la necesidad de mejorar la comunicación y la formación de los representantes estudiantiles para incentivar su participación y reconocer formalmente su labor.</p><p><strong>Calidad educativa y planes de estudio:</strong> los estudiantes sugirieron fortalecer la Agencia Canaria de Calidad Universitaria para que pueda adaptarse a los cambios en el panorama académico, especialmente ante la competencia de universidades privadas. También propusieron actualizar los planes de estudio e implementar un programa de Atención a Estudiantes con Necesidades Específicas de Apoyo Educativo en la ULPGC.</p><p>La «II Cumbre de Consejos de Estudiantes de las Universidades Públicas de Canarias» marcó un paso importante en la construcción de un espacio común entre los estudiantes de la Universidad de La Laguna y la Universidad de Las Palmas de Gran Canaria. Uno de los logros destacados de esta cumbre fue la creación de una asociación conjunta entre los consejos de estudiantes de ambas universidades, destinada a fomentar la participación estudiantil de manera sostenida y coordinada.</p>',
        alt: 'Foto de grupo de la II Cumbre de Consejos de Estudiantes de las Universidades Públicas de Canarias.',
      },
    },
    {
      slug: 'asambleas-estatutos-universidad-sevilla-octubre-2024',
      kind: 'member',
      startDate: PLACEHOLDER_DATE,
      location: 'Universidad de Sevilla',
      memberOrgKey: 'CADUS',
      image:
        '/transparencia/actividad/imagenes/asambleas-estatutos-universidad-sevilla-octubre-2024.webp',
      es: {
        title:
          'Asambleas multitudinarias por el anteproyecto de los estatutos de la Universidad de Sevilla',
        excerpt:
          'El Consejo de Alumnos de la Universidad de Sevilla reunió a más de 10.000 personas en sus asambleas sobre los derechos del estudiantado.',
        contentHtml:
          '<p>El Consejo de Alumnos de la Universidad de Sevilla se ha convertido en un referente para el resto de órganos estudiantiles tras las asambleas celebradas para dar a conocer los derechos del estudiantado universitario.</p><p>En estas asambleas se trataron aspectos básicos como la docencia, los sistemas de evaluación, las becas, etc. Tras una gran colaboración por parte del estudiantado, las asambleas tuvieron una gran acogida por este sector, llegando a asistir un total de 10.100 personas.</p><p>Este movimiento ha sido de enorme trascendencia en la vida universitaria y, por ello, queremos regalarles un pequeño espacio donde reconocer el gran esfuerzo que ha hecho todo el equipo del CADUS, especialmente a Luis Gonzalo, Lucía Domínguez, Ángel Ruiz y Alejandro Alcántara. Gracias por luchar de esta manera por los derechos del estudiantado y por una universidad de calidad.</p>',
        alt: 'Asamblea multitudinaria del Consejo de Alumnos de la Universidad de Sevilla en un aula abarrotada.',
      },
    },
    {
      slug: 'ceuja-coordinacion-acua-octubre-2024',
      kind: 'member',
      startDate: '2024-10-25',
      endDate: '2024-10-27',
      location: 'Universidad de Jaén',
      memberOrgKey: 'CEUJA',
      image: '/transparencia/actividad/imagenes/ceuja-coordinacion-acua-octubre-2024.webp',
      es: {
        title: 'El Consejo de Estudiantes de la Universidad de Jaén asume la coordinación de ACUA',
        excerpt:
          'Entre el 25 y el 27 de octubre, la Universidad de Jaén acogió la XIV Asamblea General Ordinaria de ACUA, en la que el CEUJA asumió su coordinación.',
        contentHtml:
          '<p>Entre el 25 y el 27 de octubre, la Universidad de Jaén acogió la celebración de la XIV Asamblea General Ordinaria de la Asamblea de los Consejos Universitarios de Andalucía (ACUA).</p><p>En el transcurso de la Asamblea se trataron diversos asuntos de gran actualidad para el estudiantado, tales como la tramitación de la Ley Universitaria para Andalucía y la Ley de la Ciencia, así como los retos a los que se enfrentan estas organizaciones, entre otras cuestiones.</p><p>Por último, tras las elecciones realizadas en esta Asamblea, el CEUJA asume la responsabilidad de llevar a cabo su coordinación para este curso.</p>',
        alt: 'Foto de grupo de la XIV Asamblea General Ordinaria de ACUA en la Universidad de Jaén.',
      },
    },
  ],
  areaReports: [
    {
      area: PREVIOUS_AREAS.PRESIDENCIA,
      image: '/transparencia/informes-areas/imagenes/informe-presidencia-octubre-2024.webp',
      es: {
        contentHtml:
          '<p>Durante el mes de octubre, el área de Presidencia de CREUP centró sus esfuerzos en el Stage Formativo. A la par, el equipo avanzó en iniciativas de cooperación y desarrollo, contactando con expertas en feminismo y espacios seguros para integrar estas prácticas en CREUP, además de continuar la colaboración con la Fundación ONCE para el Stage y desarrollar microformaciones dirigidas al estudiantado en temas de inclusión, cuyo lanzamiento está previsto para este curso. Asimismo, se mantuvo el diálogo con la ONCE para aportar una perspectiva estudiantil en el análisis de la inclusión en las universidades españolas.</p><p>En el ámbito internacional, CREUP participó en varios grupos de trabajo de MedNet, incluyendo el de comunicación y estatutos, y actuó como enlace informativo para otras uniones estudiantiles que asistirán al ISPN, donde CREUP también fue ponente. En paralelo, se reactivó la colaboración con OCLAE para abordar el Espacio Iberoamericano del Conocimiento desde una perspectiva estudiantil.</p><p>Finalmente, el Comité de Asuntos Internacionales avanzó en la organización del próximo Board Meeting de la European Students Union en Oslo, y convocó una reunión abierta para explicar su misión y fomentar la participación en candidaturas a las vacantes.</p>',
        alt: 'Equipo del área de Presidencia de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.SECRETARIA,
      image: '/transparencia/informes-areas/imagenes/informe-secretaria-octubre-2024.webp',
      es: {
        contentHtml:
          '<p>La Secretaría de CREUP ha avanzado en la renovación de la documentación, la creación de un archivo histórico y la colaboración con Tesorería para mejorar la normativa económica. Además, trabajó con el área de Relaciones Institucionales en la adaptación de CREUP al Consejo de la Juventud de España (CJE) y participó activamente en el XI Stage Formativo como formadora.</p><p>Se ha implementado un espacio en la web para alojar las newsletters y una nueva herramienta para encuestas y votaciones secretas accesible a todos los miembros. También se realizaron mejoras en la página principal, la intranet y el dominio, y se desarrolló una plataforma de registro de asistencia mediante códigos QR en el Stage Formativo para facilitar la emisión de certificados.</p>',
        alt: 'Equipo del área de Secretaría de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.RRII,
      image:
        '/transparencia/informes-areas/imagenes/informe-relaciones-institucionales-y-proyectos-octubre-2024.webp',
      es: {
        contentHtml:
          '<p>En octubre, la Vicepresidencia de Relaciones Institucionales de CREUP ha llevado a cabo una serie de actividades estratégicas en el ámbito universitario y de la juventud. Entre las principales, destaca la reunión con Pilar Paneque, directora de la ANECA, donde se discutió la calidad del sistema universitario. En paralelo, se ha trabajado en la búsqueda de nuevas fórmulas de financiación para CREUP y en alternativas para mejorar la situación de la vivienda estudiantil en España.</p><p>Además, CREUP ha gestionado la participación de Mª Ángeles Guzmán y Nicolás Pingarrón en el programa «La Sexta Xplica» para exponer temas de interés estudiantil. También se ha impulsado un proyecto en conmemoración del Día Internacional del Estudiantado y se ha mantenido una reunión con el partido Más Madrid, seguida de la asistencia a una manifestación en Madrid en defensa del derecho a la vivienda y una reunión con Alumni España.</p><p>El equipo de CREUP participó en el XI Stage, en la Asamblea Ejecutiva Extraordinaria del Consejo de la Juventud de España y en el XXVI Encuentro Estatal de Defensorías Universitarias, organizado por la Conferencia Estatal de Defensores Universitarios.</p>',
        alt: 'Equipo del área de Relaciones Institucionales y Proyectos de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.POLITICA,
      image:
        '/transparencia/informes-areas/imagenes/informe-politica-universitaria-octubre-2024.webp',
      es: {
        contentHtml:
          '<p>En el ámbito de la calidad educativa, se celebró el pasado día 2 una reunión con la Agencia para la Calidad del Sistema Universitario de Galicia (ACSUG). En este encuentro, se fortaleció el contacto con la agencia y se transmitieron demandas clave para mejorar la calidad en las dobles titulaciones, buscando que la estructura y el desarrollo de estos programas se adapten mejor a las necesidades de los estudiantes.</p><p>En relación con la Política Universitaria, se ha trabajado en un análisis exhaustivo sobre la Prueba de Acceso a la Universidad (PAU) para ofrecer una respuesta frente a sus cambios recientes y, a su vez, mejorar su posicionamiento en el sistema educativo. También se ha brindado asesoramiento en la reforma de los estatutos universitarios a través del proyecto MOREs, contribuyendo a una mayor coherencia en la normativa de las universidades.</p><p>Por último, en Participación Universitaria, se ha elaborado un plan de participación que involucra a universidades de toda España, en colaboración con la CRUE. Este plan fue presentado en el Congreso de Participación, en el cual se coorganizaron ponencias para promover una cultura de colaboración activa entre las instituciones. Además, en un esfuerzo por abordar el bienestar estudiantil, se ha lanzado y difundido una encuesta sobre salud mental en el entorno universitario, buscando conocer y mejorar el estado de salud de los estudiantes.</p>',
        alt: 'Equipo del área de Política Universitaria de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.ORGANIZACION,
      image: '/transparencia/informes-areas/imagenes/informe-organizacion-octubre-2024.webp',
      es: {
        contentHtml:
          '<p>Durante octubre, el área de Organización ha intensificado sus esfuerzos en la planificación y el desarrollo del Plan Formativo Anual, el cual será implementado el próximo año con el objetivo de fortalecer la formación de sus miembros.</p><p>Además, el mes marcó un hito importante con la realización del XI Stage Formativo, celebrado en Isín del 17 al 20 de octubre. Este evento ha requerido una cuidadosa planificación y el trabajo de todo el equipo, enfocado en garantizar una experiencia enriquecedora para los asistentes, desde la logística de los desplazamientos hasta la creación de un formulario de valoración final, con el fin de identificar oportunidades de mejora en futuros encuentros.</p><p>Por otro lado, también se abrió el periodo de inscripciones para la 76ª Asamblea General Ordinaria, que se celebrará en la Universidad de Granada del 20 al 24 de noviembre. Este evento, de gran magnitud, ha requerido una serie de reuniones con la sede anfitriona para coordinar los detalles logísticos y prever las necesidades operativas que implica reunir a un gran número de participantes.</p>',
        alt: 'Equipo del área de Organización de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.COMUNICACION,
      image: '/transparencia/informes-areas/imagenes/informe-comunicacion-octubre-2024.webp',
      es: {
        contentHtml:
          '<p>Durante el reciente XI Stage Formativo de la Coordinadora de Representantes de Universidades Públicas (CREUP), se llevaron a cabo diversas actividades que fomentaron el aprendizaje y el intercambio de ideas entre más de 80 representantes estudiantiles. A través de una serie de formaciones y talleres, los asistentes pudieron adquirir nuevas habilidades y conocimientos esenciales para su labor como representantes.</p><p>Uno de los momentos destacados fue la participación de Mª Ángeles Guzmán en el programa «La Sexta Xplica», donde compartió sus experiencias y reflexiones sobre la importancia de una vivienda digna para el estudiantado. Además, se publicó un artículo realizado por Gabriel Suárez, en el que se abordó el tema de la salud mental en las universidades.</p><p>En un esfuerzo por mantener a todos informados sobre lo sucedido en el XI Stage, el equipo ha estado creando contenido multimedia. A través de reels y publicaciones en redes sociales, queremos que podáis conocer de primera mano todo lo que hicimos y aprendimos durante este evento formativo. Por último, seguimos avanzando en los diseños para la Asamblea General Ordinaria (AGO), con el objetivo de facilitar la comunicación y la participación de todos los estudiantes en este importante encuentro.</p>',
        alt: 'Equipo de la Dirección de Comunicación de CREUP.',
      },
    },
  ],
}

export default month
