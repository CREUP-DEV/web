/**
 * November 2024 "Actividad" seed module, migrated from the discontinued monthly newsletter PDF
 * (public/prensa/newsletter/documentos/newsletter-2024-11.pdf).
 *
 * Spanish-only on purpose: parents + the `es` translation are seeded; the other five locales are
 * backfilled later (same staged approach the press seed uses). Inserted idempotently by the
 * aggregator (./index.ts → drizzle/seed/content.ts) on the natural keys, so re-running is safe.
 *
 * Mandate: this edition belongs to the previous org chart → PREVIOUS_AREAS.
 * The newsletter's "Ponte al día" section carried area reports from six of the seven areas
 * (Tesorería did not report), which populate areaReports below.
 */
import type { SeedNewsletterMonth } from './types'
import { PREVIOUS_AREAS } from './areas'

const month: SeedNewsletterMonth = {
  monthKey: '2024-11',
  coversFrom: null,
  entries: [
    {
      slug: '76-asamblea-general-ordinaria-granada-noviembre-2024',
      kind: 'creup',
      startDate: '2024-11-20',
      endDate: '2024-11-24',
      location: 'Universidad de Granada',
      image:
        '/transparencia/actividad/imagenes/76-asamblea-general-ordinaria-granada-noviembre-2024.webp',
      es: {
        title:
          'Granada acoge la 76ª Asamblea General de CREUP con más de 100 representantes estudiantiles',
        excerpt:
          'Del 20 al 24 de noviembre, Granada reunió a más de 100 representantes estudiantiles de más de 35 universidades en la 76ª Asamblea General Ordinaria de CREUP.',
        contentHtml:
          '<p>Del 20 al 24 de noviembre, Granada se convirtió en el epicentro de la representación estudiantil universitaria con la celebración de la 76ª Asamblea General Ordinaria de la Coordinadora de Representantes de Universidades Públicas (CREUP). El evento reunió a más de 100 representantes estudiantiles de más de 35 universidades de toda España, consolidándose como un espacio clave para el debate y la toma de decisiones sobre el futuro del sistema universitario público.</p><p>Durante los cinco días de la asamblea, los asistentes trabajaron en sesiones plenarias para abordar temas como la financiación universitaria, la implementación de nuevos proyectos educativos y la defensa de los derechos del estudiantado. Además, se debatieron propuestas para garantizar una educación pública inclusiva, accesible y de calidad. Entre las iniciativas destacadas, se aprobó un plan de acción para reforzar la comunicación entre las universidades y la representación estudiantil, así como para fomentar la participación activa del estudiantado en los órganos colegiados.</p><p>El evento contó con la colaboración de la Universidad de Granada, que ofreció sus instalaciones para el desarrollo de las actividades, y el apoyo de instituciones locales, que facilitaron el alojamiento y la logística del encuentro. El presidente de CREUP, en su discurso de clausura, subrayó la importancia de estos espacios para «defender los intereses del estudiantado en un momento crucial para la universidad pública».</p><p>La 76ª Asamblea General de CREUP no solo destacó por su capacidad organizativa, sino también por su impacto en la representación estudiantil, reafirmando el compromiso de los jóvenes con la mejora del sistema universitario español.</p>',
        alt: 'Foto de grupo de los representantes estudiantiles asistentes a la 76ª Asamblea General Ordinaria de CREUP en Granada.',
      },
    },
    {
      slug: 'reunion-comite-asuntos-sectoriales-noviembre-2024',
      kind: 'creup',
      startDate: '2024-11-13',
      isOnline: true,
      location: null,
      image:
        '/transparencia/actividad/imagenes/reunion-comite-asuntos-sectoriales-noviembre-2024.webp',
      es: {
        title: 'Reunión del Comité de Asuntos Sectoriales (CAS)',
        excerpt:
          'El 13 de noviembre, el Comité de Asuntos Sectoriales se reunió de forma telemática para revisar la documentación de la 76ª AGO de CREUP.',
        contentHtml:
          '<p>El pasado 13 de noviembre, el Comité de Asuntos Sectoriales se reunió de forma telemática. Entre los puntos más destacados de la reunión estuvieron la revisión de la documentación que se presentaría en la 76ª AGO de CREUP.</p><p>También se mantuvo un debate sobre la creación de comisiones de trabajo y la propuesta de nuevos métodos de participación para implementar en las sectoriales.</p>',
        alt: 'Mosaico de la videollamada de la reunión telemática del Comité de Asuntos Sectoriales de CREUP.',
      },
    },
    {
      slug: 'reunion-junts-jnc-noviembre-2024',
      kind: 'creup',
      startDate: '2024-11-19',
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-junts-jnc-noviembre-2024.webp',
      es: {
        title: 'CREUP se reúne con Junts y JNC',
        excerpt:
          'El 19 de noviembre, el Presidente de Relaciones Institucionales se reunió con representantes de Junts y JNC para tratar la LOSU, la defensa de las lenguas, juventud y el estatuto del becario.',
        contentHtml:
          '<p>El pasado día 19 de noviembre, nuestro Presidente de Relaciones Institucionales (Germán Gutiérrez) se reunió con Judith Toronjo de Junts y Joan Grané y Narcís Junquera de JNC para hablar sobre la LOSU, la defensa de las lenguas en las universidades, juventud y el estatuto del becario.</p><p>También estuvo presente el coordinador del Comité de Garantías, Jan Butí.</p>',
        alt: 'Mosaico de la videollamada de la reunión de CREUP con representantes de Junts y JNC.',
      },
    },
    {
      slug: 'vi-jornadas-formativas-ceuam-noviembre-2024',
      kind: 'creup',
      startDate: '2024-11-15',
      endDate: '2024-11-17',
      location: 'Universidad Autónoma de Madrid',
      image: '/transparencia/actividad/imagenes/vi-jornadas-formativas-ceuam-noviembre-2024.webp',
      es: {
        title: 'CREUP participa en las VI Jornadas Formativas del CEUAM',
        excerpt:
          'Los días 15, 16 y 17 de noviembre, CREUP participó en las VI Jornadas Formativas organizadas por el Consejo de Estudiantes de la Universidad Autónoma de Madrid.',
        contentHtml:
          '<p>El Consejo de Estudiantes de la Universidad Autónoma de Madrid (CEUAM) organizó las VI Jornadas Formativas los días 15, 16 y 17 de noviembre, un evento que contó con la participación de destacados representantes estudiantiles y expertos en temas de educación superior y habilidades comunicativas.</p><p>Entre las ponencias más destacadas, Nico, de la Vocalía de Desarrollo Normativo, y Germán, desde la Vicepresidencia de Relaciones Institucionales y Proyectos, lideraron una sesión dedicada al Espacio Europeo de Educación Superior (EEES) y el Sistema Universitario Español. Durante esta charla, se abordaron las principales características del EEES, su impacto en la organización de las universidades españolas y los retos actuales en la adaptación a este marco.</p><p>Otra sesión clave estuvo centrada en el desarrollo de habilidades de diálogo, negociación y oratoria, esenciales para la representación estudiantil y la gestión universitaria. En esta actividad, los asistentes pudieron adquirir herramientas prácticas para comunicar de manera efectiva, negociar acuerdos y manejar situaciones de debate en contextos académicos e institucionales.</p>',
        alt: 'Foto de grupo de los asistentes a las VI Jornadas Formativas del CEUAM.',
      },
    },
    {
      slug: 'jornadas-formativas-ceum-noviembre-2024',
      kind: 'creup',
      startDate: '2024-11-15',
      endDate: '2024-11-17',
      location: 'Universidad de Murcia',
      image: '/transparencia/actividad/imagenes/jornadas-formativas-ceum-noviembre-2024.webp',
      es: {
        title: 'CREUP acude a las Jornadas Formativas del CEUM',
        excerpt:
          'Del 15 al 17 de noviembre, el presidente de CREUP, Alfonso Campuzano, asistió como formador a las Jornadas Formativas del Consejo de Estudiantes de la Universidad de Murcia.',
        contentHtml:
          '<p>Del 15 al 17 de noviembre, Alfonso Campuzano, presidente de la Coordinadora de Representantes de Universidades Públicas (CREUP), asistió como formador a las Jornadas Formativas organizadas por el Consejo de Estudiantes de la Universidad de Murcia (CEUM). Durante el evento, impartió sesiones centradas en temas clave como la Política Universitaria y el marco normativo estatal, fortaleciendo el conocimiento de los representantes estudiantiles en estas áreas.</p><p>Este tipo de encuentros subraya la importancia de la formación continua y la cooperación entre los diferentes órganos de representación estudiantil, promoviendo el intercambio de experiencias y buenas prácticas para mejorar la calidad de la representación universitaria en todo el país. La participación de Alfonso también permitió estrechar lazos con el equipo del CEUM, aprendiendo sobre su funcionamiento interno y los desafíos específicos de la representación estudiantil en la Universidad de Murcia.</p>',
        alt: 'Mesa de ponentes durante las Jornadas Formativas del CEUM en el Instituto de la Juventud de la Región de Murcia.',
      },
    },
    {
      slug: '88-board-meeting-esu-oslo-noviembre-2024',
      kind: 'creup',
      startDate: '2024-11-17',
      endDate: '2024-11-23',
      location: 'Oslo, Noruega',
      image: '/transparencia/actividad/imagenes/88-board-meeting-esu-oslo-noviembre-2024.webp',
      es: {
        title: 'Oslo acoge el 88º Board Meeting del European Students’ Union (ESU)',
        excerpt:
          'Del 17 al 23 de noviembre, Oslo albergó el 88º Board Meeting de la European Students’ Union, con representantes de 44 uniones estudiantiles de 40 países.',
        contentHtml:
          '<p>Del 17 al 23 de noviembre de 2024, Oslo se convirtió en el epicentro del debate sobre educación superior y democracia al albergar el 88º Board Meeting (BM) de European Students’ Union (ESU). Este evento, organizado en colaboración con la Unión Nacional de Estudiantes de Noruega (NSO), congregó a representantes de 44 uniones estudiantiles provenientes de 40 países, subrayando el papel de la cooperación internacional en la defensa de los valores democráticos y la libertad académica.</p><p>Además de los debates sobre democracia, la reunión sirvió como plataforma para la presentación de una nueva política sobre sostenibilidad, que busca integrar prácticas más responsables en las universidades europeas. También se revisaron las responsabilidades públicas en la gobernanza de la educación superior, abogando por modelos inclusivos y transparentes.</p>',
        alt: 'Dos representantes de CREUP junto al photocall de la European Students’ Union en el 88º Board Meeting de Oslo.',
      },
    },
    {
      slug: 'comisiones-especializadas-cje-noviembre-2024',
      kind: 'creup',
      startDate: '2024-11-28',
      endDate: '2024-12-01',
      location: null,
      image: '/transparencia/actividad/imagenes/comisiones-especializadas-cje-noviembre-2024.webp',
      es: {
        title: 'CREUP participa en las Comisiones Especializadas del CJE',
        excerpt:
          'Del 28 de noviembre al 1 de diciembre, representantes de CREUP participaron en las Comisiones Especializadas del Consejo de la Juventud de España.',
        contentHtml:
          '<p>Del 28 de noviembre al 1 de diciembre, representantes de CREUP participaron en las Comisiones Especializadas del Consejo de la Juventud de España. Durante estas jornadas, se trabajó en los grupos de Financiación, Espacios de Participación y Prioridades Estratégicas, aportando propuestas para fortalecer el impacto de la juventud en la toma de decisiones y garantizar un enfoque inclusivo y sostenible en las políticas juveniles.</p>',
        alt: 'Foto de grupo de los representantes participantes en las Comisiones Especializadas del Consejo de la Juventud de España.',
      },
    },
    {
      slug: 'convenio-aneca-noviembre-2024',
      kind: 'creup',
      startDate: '2024-11-29',
      location: null,
      image: '/transparencia/actividad/imagenes/convenio-aneca-noviembre-2024.webp',
      es: {
        title: 'CREUP y ANECA sellan un convenio para fortalecer la calidad educativa',
        excerpt:
          'El 29 de noviembre, el presidente de CREUP y la Vocal de Vida Universitaria firmaron un convenio con la Agencia Nacional de Evaluación de la Calidad y Acreditación (ANECA).',
        contentHtml:
          '<p>El presidente, Alfonso Campuzano, y la Vocal de Vida Universitaria, Irene Olivero, se reunieron el día 29 de noviembre para la firma del convenio con la Agencia Nacional de Evaluación de la Calidad y Acreditación (ANECA). Donde discutieron sobre los objetivos de la agencia durante el año 2025 y cómo estos se alinean con los de CREUP.</p><p>Fue un placer contar con Pilar Paneque, directora de la Agencia, para esta firma donde se pudieron acercar aún más los compromisos de ambas partes.</p>',
        alt: 'Pilar Paneque, directora de ANECA, y Alfonso Campuzano, presidente de CREUP, firmando el convenio.',
      },
    },
    {
      slug: 'feef-xlvii-asamblea-general-noviembre-2024',
      kind: 'member',
      startDate: '2024-10-26',
      endDate: '2024-10-27',
      location: 'Sevilla',
      memberOrgKey: 'FEEF',
      image: '/transparencia/actividad/imagenes/feef-xlvii-asamblea-general-noviembre-2024.webp',
      es: {
        title: 'La FEEF celebra su XLVII Asamblea General en Sevilla',
        excerpt:
          'Los días 26 y 27 de octubre, la Federación Española de Estudiantes de Farmacia celebró su XLVII Asamblea General en la Facultad de Farmacia de Sevilla y eligió a su nueva Ejecutiva Federal.',
        contentHtml:
          '<p>La Federación Española de Estudiantes de Farmacia (FEEF), entidad miembro del Comité de Asuntos Sectoriales de CREUP, celebró su Asamblea General los días 26 y 27 de octubre de 2024 en la Facultad de Farmacia de Sevilla, con la participación de delegados de numerosas facultades de Farmacia del país. Este encuentro, definido como el máximo órgano de gobierno de la entidad, permitió revisar las acciones realizadas en el último cuatrimestre y establecer los objetivos estratégicos para el futuro. Asimismo, se eligió la nueva Ejecutiva Federal, consolidando el compromiso de la organización con la transparencia y la participación estudiantil.</p><p>La FEEF representa a unos 20.000 estudiantes de Farmacia y se define como una entidad laica, sin ánimo de lucro ni afiliaciones políticas, cuyo objetivo es la representación y defensa del estudiantado, así como la promoción de la Farmacia en diversos ámbitos. Durante la Asamblea, se destacó la labor de la ejecutiva saliente, liderada por Ana María Mitroi Marinescu, que impulsó convenios estratégicos, eventos como Infarma y el Congreso Nacional de Farmacéuticos, y reformas normativas en beneficio de los estudiantes.</p><p>La nueva ejecutiva estará presidida por Natalia Bascones Delgado, acompañada de Paloma Cuéllar como Secretaria General, Ahlam Hacini como Vicepresidenta de Comunicación, Irene López-Fuensalida en Relaciones Internacionales Europeas, Gina Alhakim en Relaciones Intercontinentales, María Fuxin Zaldúa en Movilidad, Manuel Peinado en Educación y Jorge Juan Echeveste, quien renueva como Tesorero. Este equipo asumirá el reto de fortalecer el prestigio de la FEEF y trabajar en la mejora de los planes de estudio, la igualdad entre estudiantes y la proyección nacional e internacional en todos los foros donde sea necesario.</p>',
        alt: 'Foto de grupo de la nueva Ejecutiva Federal elegida en la XLVII Asamblea General de la FEEF.',
      },
    },
  ],
  areaReports: [
    {
      area: PREVIOUS_AREAS.PRESIDENCIA,
      image: null,
      es: {
        contentHtml:
          '<p>Durante el mes de noviembre el área de Presidencia se ha visto sumergida en distintas áreas de trabajo. Una que no es sorpresa para nadie, la preparación de la AGO por toda la parte que respecta a presidencia como es la documentación que se presentó. Además del apoyo al resto de áreas en aquellas tareas que se necesitase, también se ha asistido a las jornadas de formación del Consejo de Estudiantes de la Universidad de Murcia donde ha podido aportar su granito además de aprender cómo trabajan en esta universidad.</p><p>En la parte de relaciones internacionales, se ha trabajado durante el mes de noviembre en preparar toda la documentación del Board Meeting de ESU, conjunto el CAI. Y también podemos dar la bienvenida a Izhan, Francesc y Juan Alfonso que se unen al Comité tras presentarse en la Asamblea de CREUP en Granada.</p><p>Con respecto a Igualdad y Cooperación al Desarrollo, se ha trabajado en terminar de desarrollar las formativas de FONCE que empezarán dentro de poco, al igual que aportar todo lo posible al documento de CRUE sobre Palestina. También se ha trabajado con comunicación la campaña del 25N como el que se ve en la propia Newsletter.</p>',
      },
    },
    {
      area: PREVIOUS_AREAS.RRII,
      image:
        '/transparencia/informes-areas/imagenes/informe-relaciones-institucionales-y-proyectos-noviembre-2024.webp',
      es: {
        contentHtml:
          '<p>Desde el área de Institucionales y Proyectos, se ha avanzado en diversas iniciativas clave durante el mes de noviembre. Entre los trabajos destacados, se ha desarrollado un acto conmemorativo para el Día Internacional del Estudiantado de 2025 y se ha colaborado en la creación de formaciones en calidad, en coordinación con las agencias estatales especializadas en este ámbito. Asimismo, se elaboraron y remitieron alegaciones al proyecto de Ley de Juventud y Justicia Intergeneracional, en defensa de los intereses del estudiantado.</p><p>Entre las actividades realizadas, se participó en las VI Jornadas de Formación del Consejo de Estudiantes de la Universidad Autónoma de Madrid, celebradas los días 15, 16 y 17 de noviembre, donde se abordaron temas como liderazgo estudiantil y mejora de la representación universitaria. El 18 de noviembre, se llevó a cabo una reunión con representantes del partido Junts y la Juventut Nacionalista de Catalunya, con el objetivo de tratar temas relacionados con juventud y educación en el contexto estatal y autonómico.</p><p>Finalmente, el día 26, se asistió a la reunión del Grupo de Trabajo sobre la Ley de Juventud y Justicia Intergeneracional, organizada por el Consejo de la Juventud de España, donde se debatieron propuestas para fortalecer el enfoque intergeneracional en la normativa y garantizar su impacto positivo en los jóvenes.</p>',
        alt: 'Equipo de la Vicepresidencia de Relaciones Institucionales y Proyectos de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.SECRETARIA,
      image: '/transparencia/informes-areas/imagenes/informe-secretaria-noviembre-2024.webp',
      es: {
        contentHtml:
          '<p>Desde el Área, se ha trabajado intensamente en la organización de la 76ª Asamblea General Ordinaria (AGO). Entre las tareas realizadas, destaca la preparación de los documentos propios del Área, la revisión de la documentación presentada por el resto de la Comisión Ejecutiva Ampliada (CEA), así como por todos los miembros y sectoriales. Además, se llevó a cabo la subida y envío de toda la documentación correspondiente a la Asamblea.</p><p>Asimismo, se gestionaron las convocatorias de los diversos procesos electorales que tuvieron lugar durante la AGO, asegurando el cumplimiento de los plazos y normativas establecidos.</p><p>Por último, se desarrolló un nuevo apartado en la intranet, diseñado específicamente para mejorar la accesibilidad a la documentación de las Asambleas Generales, facilitando su consulta por parte de todos los miembros.</p>',
        alt: 'Equipo de la Secretaría Ejecutiva de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.POLITICA,
      image:
        '/transparencia/informes-areas/imagenes/informe-politica-universitaria-noviembre-2024.webp',
      es: {
        contentHtml:
          '<p>En el contexto de los preparativos para la 76ª Asamblea General Ordinaria, se han desarrollado importantes trabajos en diversas áreas clave para el estudiantado universitario:</p><p>Vida Universitaria: Se ha trabajado junto al Grupo de Trabajo específico en la elaboración de una Resolución sobre los servicios de atención a la salud mental dirigidos al estudiantado universitario. Este documento busca responder a la creciente demanda de apoyo psicológico y bienestar dentro de las universidades, proponiendo medidas concretas para reforzar estos servicios.</p><p>Garantía de la Calidad: Se ha elaborado un Informe Ejecutivo centrado en los programas académicos de simultaneidad de dobles titulaciones con itinerarios específicos. Este informe analiza las oportunidades y desafíos de estos programas, con el objetivo de optimizar su implementación y mejorar la oferta educativa para el estudiantado.</p><p>Política Universitaria: En esta área se han concluido los trabajos finales para la redacción del Posicionamiento sobre la prueba de acceso a la universidad, un documento que aborda las principales problemáticas del actual modelo de acceso y propone reformas orientadas a garantizar la igualdad de oportunidades. Asimismo, se ha elaborado una Resolución sobre el problema del acceso a la vivienda para estudiantes universitarios, planteando soluciones frente a la crisis habitacional que afecta al colectivo.</p>',
        alt: 'Equipo de la Vicepresidencia de Política Universitaria de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.ORGANIZACION,
      image: '/transparencia/informes-areas/imagenes/informe-organizacion-noviembre-2024.webp',
      es: {
        contentHtml:
          '<p>En noviembre, el área de organización se enfocó en la planificación de la 76ª Asamblea General Ordinaria, abordando desde la logística hasta la creación de un formulario de valoración para futuras mejoras. Agradecen al Consejo General de Estudiantes de la Universidad de Granada por su apoyo.</p><p>En cuanto a cambios internos, celebran la incorporación de Sara Abad como nueva vicepresidenta de organización, aunque lamentan la salida de Adrián Rivero de la vocalía de formación por incompatibilidades con su puesto en CESED.</p><p>Además, se trabajó en ampliar la membresía de CREUP, destacando la participación como invitadas de la Universidad Pablo de Olavide y la Universidad de Málaga, y retomando conversaciones con la Universitat Politècnica de Catalunya para futuras adhesiones.</p>',
        alt: 'Equipo de la Vicepresidencia de Organización de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.COMUNICACION,
      image: '/transparencia/informes-areas/imagenes/informe-comunicacion-noviembre-2024.webp',
      es: {
        contentHtml:
          '<p>Durante este mes, el equipo ha centrado sus esfuerzos en el diseño de los elementos identificativos para la 76ª Asamblea General Ordinaria de CREUP, celebrada en Granada.</p><p>Además, se finalizaron los ajustes necesarios para el nuevo Manual de Identidad Corporativa, que fue presentado y aprobado en el marco de dicha asamblea.</p><p>En colaboración con la Vocalía de Igualdad y Cooperación al Desarrollo, se llevó a cabo la campaña del 25 de noviembre contra las Violencias Machistas, mostrando el compromiso de la organización con esta causa.</p><p>El equipo también dedicó tiempo a la difusión de la Asamblea General Ordinaria y a la creación de contenido que será compartido próximamente en las redes sociales. Como es habitual, se trasladaron todas las actividades y eventos realizados a los canales de comunicación correspondientes, asegurando la transparencia y la visibilidad del trabajo realizado.</p>',
        alt: 'Equipo de la Dirección de Comunicación de CREUP.',
      },
    },
  ],
}

export default month
