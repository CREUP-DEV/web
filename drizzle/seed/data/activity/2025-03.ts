/**
 * March 2025 "Actividad" seed module, migrated from the discontinued monthly newsletter PDF
 * (public/prensa/newsletter/documentos/newsletter-2025-03.pdf).
 *
 * Spanish-only on purpose: parents + the `es` translation are seeded; the other five locales are
 * backfilled later (same staged approach the press seed uses). Inserted idempotently by the
 * aggregator (./index.ts → drizzle/seed/content.ts) on the natural keys, so re-running is safe.
 *
 * Mandate: this edition belongs to the previous org chart → PREVIOUS_AREAS.
 */
import type { SeedNewsletterMonth } from './types'
import { PREVIOUS_AREAS } from './areas'

const month: SeedNewsletterMonth = {
  monthKey: '2025-03',
  coversFrom: null,
  entries: [
    {
      slug: 'reunion-comite-asuntos-sectoriales-marzo-2025',
      kind: 'creup',
      startDate: '2025-03-09',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-comite-asuntos-sectoriales-marzo-2025.webp',
      es: {
        title: 'Reunión del Comité de Asuntos Sectoriales',
        excerpt:
          'El 9 de marzo, el CAS preparó la documentación para la próxima AGO y debatió sobre las becas FPU.',
        contentHtml:
          '<p>El pasado 9 de marzo se celebró una importante reunión del Comité de Asuntos Sectoriales, en la que se discutieron diversos temas relevantes para el ámbito universitario. Uno de los puntos más destacados de la sesión fue la preparación de la documentación que cada sectorial presentará en la próxima Asamblea General Ordinaria (AGO) de CREUP.</p><p>Además, se dedicó un tiempo significativo a debatir sobre la situación de las becas FPU (Formación de Profesorado Universitario), un tema que sigue generando preocupación entre los estudiantes debido a las dificultades que enfrentan algunos aspirantes para acceder a estas ayudas.</p><p>Por otro lado, se continuó trabajando en la redacción del nuevo Reglamento del Comité de Asuntos Sectoriales (CAS), que pretende actualizar y mejorar el funcionamiento interno de este órgano, con el fin de hacer más eficientes y transparentes sus procesos y decisiones.</p><p>Finalmente, la reunión también estuvo marcada por la dimisión de Alejandro como Secretario del Comité.</p>',
        alt: 'Mosaico de la videollamada de la reunión del Comité de Asuntos Sectoriales.',
      },
    },
    {
      slug: 'students-rights-chapter-esu-estrasburgo-marzo-2025',
      kind: 'creup',
      startDate: '2025-03-03',
      endDate: '2025-03-08',
      location: 'Estrasburgo',
      image:
        '/transparencia/actividad/imagenes/students-rights-chapter-esu-estrasburgo-marzo-2025.webp',
      es: {
        title: 'Students’ Rights Chapter de ESU en Estrasburgo',
        excerpt:
          'Del 3 al 8 de marzo, CREUP participó en el Students’ Rights Chapter de la European Students’ Union en Estrasburgo.',
        contentHtml:
          '<p>Del 3 al 8 de marzo, CREUP participó en el Students’ Rights Chapter organizado por la European Students’ Union (ESU) en Estrasburgo. Durante el encuentro, representantes de diversas uniones estudiantiles europeas compartieron experiencias sobre la situación del Estatuto del Estudiante Universitario en sus respectivos países y trabajaron en la posibilidad de impulsar un estatuto a nivel europeo.</p><p>En representación de CREUP, asistieron su presidente, Alfonso Campuzano, y la vocal de Relaciones Internacionales, Ainhoa Serrano, quienes expusieron la realidad del estudiantado en España y debatieron sobre iniciativas para mejorar sus derechos en el ámbito universitario europeo.</p>',
        alt: 'Foto de grupo de la delegación en el Students’ Rights Chapter de ESU en Estrasburgo.',
      },
    },
    {
      slug: 'reunion-cje-ley-juventud-marzo-2025',
      kind: 'creup',
      startDate: '2025-03-04',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-cje-ley-juventud-marzo-2025.webp',
      es: {
        title: 'Reunión del Consejo de la Juventud de España sobre la Ley de Juventud',
        excerpt:
          'El 4 de marzo, el Vicepresidente de Relaciones Institucionales asistió a la presentación del CJE sobre la Ley de Juventud.',
        contentHtml:
          '<p>El pasado 4 de marzo, el Vicepresidente de Relaciones Institucionales, Nicolás Pingarrón, asistió a la presentación organizada por el Consejo de la Juventud de España (CJE), donde se expuso el trabajo desarrollado en colaboración con el Ministerio de Juventud y el Instituto de la Juventud (INJUVE).</p><p>Durante la sesión, se abordaron los principales avances en la Ley de Juventud, destacando propuestas y mejoras dirigidas a fortalecer los derechos y oportunidades de los jóvenes en distintos ámbitos. El encuentro permitió un intercambio de ideas sobre los retos actuales en materia de políticas juveniles y el papel de las instituciones en su desarrollo.</p>',
        alt: 'Mosaico de la videollamada de la presentación del Consejo de la Juventud de España sobre la Ley de Juventud.',
      },
    },
    {
      slug: 'reunion-grupo-trabajo-reforma-rd-640-2021-marzo-2025',
      kind: 'creup',
      startDate: '2025-03-10',
      isOnline: true,
      location: null,
      image:
        '/transparencia/actividad/imagenes/reunion-grupo-trabajo-reforma-rd-640-2021-marzo-2025.webp',
      es: {
        title: 'Reunión del grupo de trabajo sobre la reforma del RD 640/2021',
        excerpt:
          'El 10 de marzo, el grupo de trabajo revisó el primer borrador del informe ejecutivo sobre la reforma del RD 640/2021.',
        contentHtml:
          '<p>El pasado 10 de marzo se llevó a cabo una reunión de trabajo, coordinada por nuestro vocal de Garantía de la Calidad, Pablo Nieto-Sandoval, en la que se revisó y analizó el primer borrador del informe ejecutivo sobre la reforma del Real Decreto 640/2021.</p><p>Durante la sesión, los participantes debatieron en profundidad los aspectos clave del documento y presentaron diversas propuestas y alternativas con el objetivo de optimizar su contenido. El encuentro permitió avanzar en la definición de estrategias y lineamientos que contribuirán a una versión más precisa y efectiva del informe final.</p>',
        alt: 'Mosaico de la videollamada del grupo de trabajo sobre la reforma del RD 640/2021.',
      },
    },
    {
      slug: 'reunion-grupo-trabajo-vivienda-marzo-2025',
      kind: 'creup',
      startDate: '2025-03-15',
      endDate: '2025-03-18',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-grupo-trabajo-vivienda-marzo-2025.webp',
      es: {
        title: 'Reuniones del grupo de trabajo de vivienda',
        excerpt:
          'Los días 15 y 18 de marzo, el grupo de trabajo de vivienda debatió estrategias frente a la crisis habitacional y cerró su documento para la AGO.',
        contentHtml:
          '<p>Los días 15 y 18 de marzo, el grupo de trabajo de vivienda llevó a cabo dos reuniones clave en las que se debatieron diversas estrategias y soluciones para enfrentar la crisis habitacional que afecta a los estudiantes.</p><p>Durante las sesiones, los participantes analizaron las principales problemáticas relacionadas con el acceso a la vivienda y evaluaron posibles medidas que podrían implementarse para mejorar la situación. Entre los temas discutidos, se destacaron la necesidad de impulsar políticas de apoyo al alquiler, el acceso a residencias asequibles y la regulación de precios en zonas cercanas a centros educativos.</p><p>En la segunda reunión, el grupo se enfocó en la revisión y cierre del documento que será presentado en la próxima Asamblea Ordinaria. En este documento se consolidaron las propuestas trabajadas previamente, incorporando ajustes y mejoras tras el debate colectivo. El objetivo es llevar a la Asamblea una postura sólida y bien fundamentada, que refleje las preocupaciones y demandas del estudiantado en materia de vivienda.</p>',
        alt: 'Mosaico de la videollamada del grupo de trabajo de vivienda.',
      },
    },
    {
      slug: 'formacion-representantes-usal-marzo-2025',
      kind: 'creup',
      startDate: '2025-03-21',
      endDate: '2025-03-22',
      location: 'Universidad de Salamanca',
      image: '/transparencia/actividad/imagenes/formacion-representantes-usal-marzo-2025.webp',
      es: {
        title: 'Formación de Representantes de la Universidad de Salamanca',
        excerpt:
          'Los días 21 y 22 de marzo, el Vicepresidente de Relaciones Institucionales impartió una ponencia sobre oratoria en las jornadas formativas de la USAL.',
        contentHtml:
          '<p>Los pasados días 21 y 22 de marzo, el Vicepresidente de Relaciones Institucionales de CREUP se desplazó hasta la Universidad de Salamanca (USAL) para participar en las jornadas formativas organizadas por el Consejo de Delegaciones de esta institución.</p><p>Durante su intervención, impartió una ponencia sobre oratoria, en la que abordó la importancia de la comunicación efectiva en el ámbito académico y de la representación estudiantil. En su exposición, destacó técnicas clave para mejorar la capacidad de expresión en público, un aspecto fundamental para el liderazgo y la defensa de los intereses del estudiantado.</p><p>Además, su presencia en estas jornadas sirvió para dar a conocer el trabajo de CREUP ante las distintas delegaciones estudiantiles de la USAL. El evento reunió a estudiantes y representantes de diversas facultades, generando un espacio de intercambio de ideas y fortalecimiento de la representación estudiantil.</p><p>Con esta participación, CREUP refuerza su compromiso con la formación de los representantes estudiantiles y su labor de visibilización en el ámbito universitario, consolidando así su papel como referente en la representación del estudiantado a nivel estatal.</p>',
        alt: 'Foto de grupo de los asistentes a las jornadas formativas del Consejo de Delegaciones de la Universidad de Salamanca.',
      },
    },
  ],
  areaReports: [
    {
      area: PREVIOUS_AREAS.PRESIDENCIA,
      image: '/transparencia/informes-areas/imagenes/informe-presidencia-marzo-2025.webp',
      es: {
        contentHtml:
          '<p>El área de Presidencia ha vivido un mes de intensa actividad marcado por encuentros clave y la preparación de documentación institucional. Tras la celebración del Congreso CREUP-CRUE, los representantes Ainhoa y Alfonso viajaron a Estrasburgo para participar en sesiones de trabajo organizadas por la European Students’ Union (ESU) sobre el estatuto del estudiante universitario.</p><p>Durante este periodo, la preparación de la asamblea ha sido una de las principales prioridades, con esfuerzos dedicados a la elaboración de protocolos, resoluciones y reuniones estratégicas para establecer convenios con otras entidades.</p><p>Además, la agenda ha incluido la asistencia a reuniones de la comisión de atención psicológica, la sesión permanente del CEUNE y la inauguración de la feria educativa AULA en Madrid, donde los representantes tuvieron la oportunidad de compartir impresiones con la ministra Diana Morant. Asimismo, el área de Presidencia estuvo presente en la inauguración del I Congreso de Estudiantes de la Universidad de Barcelona (UB).</p><p>Estas actividades reflejan el compromiso del área con la representación estudiantil y la consolidación de relaciones institucionales clave para el futuro de la comunidad universitaria.</p>',
        alt: 'Equipo del área de Presidencia de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.SECRETARIA,
      image: '/transparencia/informes-areas/imagenes/informe-secretaria-marzo-2025.webp',
      es: {
        contentHtml:
          '<p>El área de Secretaría ha concluido los preparativos para la 77ª Asamblea General Ordinaria, gestionando la convocatoria, el orden del día y la documentación correspondiente. En paralelo, se ha finalizado la elaboración de los nuevos reglamentos, con especial énfasis en el del CAS, cuya revisión fue abordada en una reunión de trabajo.</p><p>Asimismo, se ha trabajado en conjunto con la Vocalía de Igualdad y Cooperación al Desarrollo en la redacción de los protocolos contra el acoso y la discriminación. Además, se ha colaborado con otras áreas en la revisión de la documentación de la AGO.</p><p>En el ámbito institucional, se han firmado nuevos convenios con diversas entidades contactadas desde la Presidencia. Además, Secretaría ha brindado apoyo al presidente en sus relaciones institucionales, acompañándolo a los distintos eventos celebrados durante el mes.</p>',
        alt: 'Integrante del área de Secretaría Ejecutiva de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.TESORERIA,
      image: '/transparencia/informes-areas/imagenes/informe-tesoreria-marzo-2025.webp',
      es: {
        contentHtml:
          '<p>El mes de marzo ha transcurrido con relativa calma en el área de Tesorería, donde se ha llevado a cabo la facturación correspondiente al VI Congreso CREUP-CRUE y al XIV Encuentro de Representantes. Además, se ha continuado con la gestión de cuotas de membresía que presentaban particularidades.</p><p>En el ámbito interno, el equipo ha trabajado en la preparación de documentación para la próxima asamblea, incluyendo dos informes económicos que reflejan la situación financiera actual, así como informes personales y anexos complementarios.</p><p>Desde la coordinación de proyectos, se ha colaborado activamente con la sede de la 77 AGO en la búsqueda de colaboradores. Asimismo, se han analizado diversas subvenciones con potencial para su solicitud. Hacia el cierre del mes, el esfuerzo se ha centrado en la subvención del INJUVE, cuya convocatoria se espera en abril; en este sentido, se ha adelantado documentación basándose en ediciones anteriores y se ha avanzado en la estructuración del proyecto. Paralelamente, el área de Tesorería ha continuado brindando apoyo a la organización de la 77 AGO.</p><p>A pesar de que el impacto de las actividades realizadas no ha sido ampliamente visible para los MOREs y las sectoriales, el equipo ha mantenido el ritmo de trabajo y las dinámicas establecidas en semanas previas, asegurando la continuidad de los procesos internos.</p>',
        alt: 'Equipo del área de Tesorería de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.RRII,
      image:
        '/transparencia/informes-areas/imagenes/informe-relaciones-institucionales-y-proyectos-marzo-2025.webp',
      es: {
        contentHtml:
          '<p>Este mes nuestra área se ha basado en el VI Congreso CREUP-CRUE, donde se abordaron temas clave en las mesas de conciliación y política universitaria, cuyos debates derivaron en una serie de conclusiones que están siendo trabajadas.</p><p>Tras el evento, se elaboró la documentación que será presentada en la asamblea, con especial atención al posicionamiento sobre vivienda. En este aspecto, se colaboró con el grupo de trabajo para avanzar y finalizar el documento. De manera similar, se continuó con el desarrollo del informe sobre financiación universitaria.</p><p>Además, participamos en la presentación del informe sobre becas Erasmus de ESN, donde se expusieron los principales desafíos que enfrentan los estudiantes en la movilidad internacional.</p>',
        alt: 'Integrante del área de Relaciones Institucionales y Proyectos de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.POLITICA,
      image:
        '/transparencia/informes-areas/imagenes/informe-politica-universitaria-marzo-2025.webp',
      es: {
        contentHtml:
          '<p>En el área de Política Universitaria se ha trabajado en varios documentos de cara a la próxima asamblea. En Garantía de la Calidad, se ha avanzado en la redacción de la documentación para la Asamblea General Ordinaria (AGO), coordinando el grupo de trabajo sobre la reforma del Real Decreto 640/2021. Además, se ha iniciado la renovación de dos convenios con agencias de calidad, de los cuales uno ya ha sido formalizado.</p><p>En Vida Universitaria, se ha concluido el posicionamiento sobre salud mental en el estudiantado universitario, un documento que será presentado en la 77ª AGO junto al grupo de trabajo encargado de su elaboración.</p><p>Por su parte, en Política Universitaria, se ha finalizado la redacción de dos informes ejecutivos: uno sobre becas y ayudas al estudio y otro sobre normativas universitarias, ambos desarrollados en colaboración con los grupos de trabajo correspondientes.</p>',
        alt: 'Integrante del área de Política Universitaria de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.ORGANIZACION,
      image: '/transparencia/informes-areas/imagenes/informe-organizacion-marzo-2025.webp',
      es: {
        contentHtml:
          '<p>Tras su participación en el VI Congreso CREUP-CRUE y el XIV Encuentro, el área de Organización ha intensificado los preparativos para la 77ª Asamblea General Ordinaria, que tendrá lugar en Sevilla del 2 al 6 de abril. Paralelamente, se han llevado a cabo evaluaciones sobre distintos aspectos relacionados con la organización y el contenido del Encuentro, con el objetivo de mejorar futuras ediciones.</p>',
        alt: 'Equipo del área de Organización de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.COMUNICACION,
      image: '/transparencia/informes-areas/imagenes/informe-comunicacion-marzo-2025.webp',
      es: {
        contentHtml:
          '<p>El área de Comunicación ha desarrollado diversas acciones clave en las últimas semanas. Entre ellas, destaca el trabajo en la identidad visual de la AGO, así como en la cartelería y materiales gráficos del evento, incluyendo acreditaciones y otros elementos.</p><p>Además, se ha dado inicio a la campaña de financiación, con la producción de artículos y vídeos promocionales. Paralelamente, se ha puesto en marcha la campaña de becas, acompañada de un tutorial explicativo para facilitar el acceso a las personas interesadas.</p><p>Otro de los puntos abordados ha sido el proyecto de Campus Rural, cuyo desarrollo continúa en marcha. Finalmente, se ha establecido contacto con distintos medios de comunicación para garantizar la difusión y visibilidad de estas iniciativas.</p>',
        alt: 'Equipo del área de Comunicación de CREUP.',
      },
    },
  ],
}

export default month
