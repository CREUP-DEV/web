/**
 * October 2025 "Actividad" seed module, migrated from the discontinued monthly newsletter PDF
 * (public/prensa/newsletter/documentos/newsletter-2025-10.pdf).
 *
 * Spanish-only on purpose: parents + the `es` translation are seeded; the other five locales are
 * backfilled later (same staged approach the press seed uses). Inserted idempotently by the
 * aggregator (./index.ts → drizzle/seed/content.ts) on the natural keys, so re-running is safe.
 *
 * Mandate: this edition belongs to the previous org chart → PREVIOUS_AREAS.
 * The newsletter shipped a "Ponte al día — Informe de trabajo mensual" section, mapped to
 * areaReports below. The combined "Secretaría Ejecutiva y Tesorería" informe is a single block
 * whose prose covers Secretaría's work, so it is seeded as one report under PREVIOUS_AREAS.SECRETARIA.
 */
import type { SeedNewsletterMonth } from './types'
import { PREVIOUS_AREAS } from './areas'

const month: SeedNewsletterMonth = {
  monthKey: '2025-10',
  coversFrom: null,
  entries: [
    {
      slug: 'reunion-cas-conede-octubre-2025',
      kind: 'creup',
      startDate: '2025-09-30',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-cas-conede-octubre-2025.webp',
      es: {
        title: 'El coordinador del CAS se reúne con CONEDE',
        excerpt:
          'El 30 de septiembre, el coordinador del Comité de Asuntos Sectoriales se reunió con el Consejo Nacional de Estudiantes de Derecho para explorar vías de colaboración.',
        contentHtml:
          '<p>El 30 de septiembre, el coordinador del Comité de Asuntos Sectoriales (CAS) se reunió con el Consejo Nacional de Estudiantes de Derecho (CONEDE) para conocer su funcionamiento, proyectos y líneas de trabajo.</p><p>El encuentro sirvió para explorar posibles vías de colaboración y recuperar el vínculo entre ambas entidades, ya que CONEDE no forma parte actualmente del CAS.</p>',
        alt: 'Mosaico de la videollamada entre el coordinador del CAS de CREUP y CONEDE.',
      },
    },
    {
      slug: 'iii-cumbre-ceupca-canarias-octubre-2025',
      kind: 'creup',
      startDate: '2025-10-03',
      endDate: '2025-10-06',
      location: 'La Gomera',
      image: '/transparencia/actividad/imagenes/iii-cumbre-ceupca-canarias-octubre-2025.webp',
      es: {
        title:
          'CREUP asiste a la III Cumbre de los Consejos de Estudiantes de las Universidades Públicas de Canarias',
        excerpt:
          'Entre el 3 y el 6 de octubre se celebró en La Gomera la III edición de la Cumbre de los Consejos de Estudiantes de las Universidades Públicas de Canarias (CEUPCA).',
        contentHtml:
          '<p>Durante los días 3 al 6 de octubre se celebró en La Gomera la III edición de la Cumbre de los Consejos de Estudiantes de las Universidades Públicas de Canarias (CEUPCA), un espacio de reflexión común entre los consejos de las dos universidades públicas de Canarias.</p><p>En este encuentro se llevaron a cabo posicionamientos en materia de vivienda, becas y autonomía universitaria, entre otros.</p><p>CREUP colaboró en el evento con la participación en la mesa redonda sobre vivienda y con una formación en materia de comunicación como estrategia para la representación estudiantil.</p>',
        alt: 'Foto de grupo de los participantes en la III Cumbre CEUPCA en La Gomera.',
      },
    },
    {
      slug: 'reunion-cas-aeae-octubre-2025',
      kind: 'creup',
      startDate: '2025-10-06',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-cas-aeae-octubre-2025.webp',
      es: {
        title: 'El CAS se reúne con la Asociación de Estudiantes de Aeronáutica y Espacio',
        excerpt:
          'El 6 de octubre, el coordinador del CAS mantuvo una reunión con la Asociación de Estudiantes de Aeronáutica y Espacio para abordar el trabajo futuro y la firma del convenio con CREUP.',
        contentHtml:
          '<p>El 6 de octubre, el coordinador del Comité de Asuntos Sectoriales (CAS) mantuvo una reunión con la Asociación de Estudiantes de Aeronáutica y Espacio (AEEA). Durante el encuentro se abordaron temas como el funcionamiento de la sectorial, el trabajo futuro del CAS, la documentación para la próxima asamblea, los próximos eventos y la firma del convenio de colaboración con CREUP.</p><p>Esta reunión refuerza la cooperación entre ambas entidades y el compromiso con una representación estudiantil más coordinada.</p>',
        alt: 'Videollamada entre la Presidencia de CREUP y la Asociación de Estudiantes de Aeronáutica y Espacio.',
      },
    },
    {
      slug: 'xxviii-aget-octubre-2025',
      kind: 'creup',
      startDate: '2025-10-10',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/xxviii-aget-octubre-2025.webp',
      es: {
        title: 'La XXVIII AGET de CREUP aprueba importantes avances internos',
        excerpt:
          'El 10 de octubre, CREUP celebró su XXVIII Asamblea General Extraordinaria Telemática, en la que se aprobaron reglamentos clave y la entrada de la Universidade da Coruña como nuevo miembro.',
        contentHtml:
          '<p>El pasado 10 de octubre, CREUP celebró su XXVIII Asamblea General Extraordinaria Telemática (AGET), en la que se ratificaron las vocalías de la Comisión Ejecutiva Ampliada y se aprobaron el Reglamento para la reforma del Reglamento de Régimen Interno y el Reglamento de Funcionamiento de la Asamblea General.</p><p>Además, se aprobó la entrada de la Universidade da Coruña (UDC) como nuevo miembro de la Coordinadora y se eligieron los nuevos integrantes del Comité de Asuntos Internacionales (CAI), fortaleciendo así la estructura y representatividad de CREUP.</p>',
        alt: 'Mosaico de la videollamada de la XXVIII Asamblea General Extraordinaria Telemática de CREUP.',
      },
    },
    {
      slug: 'inauguracion-aebe-octubre-2025',
      kind: 'creup',
      startDate: '2025-10-10',
      location: null,
      image: '/transparencia/actividad/imagenes/inauguracion-aebe-octubre-2025.webp',
      es: {
        title:
          'CREUP participa en la inauguración de la Asociación de Estudiantes de Biociencias de España',
        excerpt:
          'El 10 de octubre, el presidente de CREUP, Alfonso Campuzano, asistió a la inauguración de la Asociación de Estudiantes de Biociencias de España (AEBE).',
        contentHtml:
          '<p>El pasado viernes 10 de octubre, el presidente de CREUP, Alfonso Campuzano, asistió a la inauguración de la Asociación de Estudiantes de Biociencias de España (AEBE).</p><p>Durante el acto, agradeció el esfuerzo que supone la representación estudiantil y subrayó la importancia de ocupar espacios de defensa del estudiantado en un momento en el que la universidad pública se ve amenazada y las titulaciones de biociencias sufren una pérdida de calidad.</p><p>CREUP celebra la creación de esta nueva asociación como un paso adelante en la coordinación del estudiantado.</p>',
        alt: 'Acto de inauguración de la Asociación de Estudiantes de Biociencias de España.',
      },
    },
    {
      slug: 'reunion-ministra-morant-octubre-2025',
      kind: 'creup',
      startDate: '2025-10-13',
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-ministra-morant-octubre-2025.webp',
      es: {
        title:
          'CREUP se reúne con la ministra Diana Morant para abordar los principales retos del estudiantado',
        excerpt:
          'El 13 de octubre, el presidente de CREUP, junto al secretario ejecutivo y la vocal de Incidencia Política, se reunió con la ministra Diana Morant.',
        contentHtml:
          '<p>El pasado 13 de octubre, el presidente de la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP), junto al secretario ejecutivo y la vocal de Incidencia Política, mantuvieron una reunión con Diana Morant, ministra de Ciencia, Innovación y Universidades.</p><p>Durante el encuentro, celebrado en el marco del evento «Pacto de Estado por la Emergencia Climática», los representantes estudiantiles trasladaron a la ministra las principales preocupaciones del estudiantado universitario. Entre los temas tratados destacaron la falta de acceso a la vivienda, la privatización progresiva de la educación superior, la infrafinanciación del sistema universitario público y la necesidad de avanzar en políticas reales frente a la emergencia climática.</p>',
        alt: 'El presidente de CREUP conversa con la ministra Diana Morant durante el Pacto de Estado por la Emergencia Climática.',
      },
    },
    {
      slug: 'reunion-cas-aerraaiti-octubre-2025',
      kind: 'creup',
      startDate: '2025-10-13',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-cas-aerraaiti-octubre-2025.webp',
      es: {
        title:
          'Reunión del CAS con la Asociación de Ingenierías de Ámbito Industrial para avanzar en nuevas líneas de colaboración',
        excerpt:
          'El 13 de octubre, la Coordinación del CAS se reunió con la Asociación Estatal de Representantes de Alumnos de Ingenierías de Ámbito Industrial.',
        contentHtml:
          '<p>El pasado 13 de octubre, la Coordinación del CAS se reunió con la Asociación Estatal de Representantes de Alumnos de Ingenierías de Ámbito Industrial.</p><p>En el encuentro se trataron temas como el funcionamiento de la sectorial, el trabajo futuro del CAS, la próxima asamblea, la firma del convenio con CREUP y la relación con directores y colegios profesionales.</p>',
        alt: 'Videollamada entre la Coordinación del CAS y la Asociación Estatal de Representantes de Alumnos de Ingenierías de Ámbito Industrial.',
      },
    },
    {
      slug: 'reunion-extraordinaria-cas-octubre-2025',
      kind: 'creup',
      startDate: '2025-10-16',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-extraordinaria-cas-octubre-2025.webp',
      es: {
        title:
          'El CAS celebra una reunión extraordinaria para avanzar en los preparativos de la próxima asamblea',
        excerpt:
          'El 16 de octubre se celebró una reunión del Comité de Asuntos Sectoriales para coordinar acciones y planificar el trabajo de las próximas semanas.',
        contentHtml:
          '<p>El pasado 16 de octubre se celebró una reunión del Comité de Asuntos Sectoriales (CAS), en la que se abordaron asuntos clave para el desarrollo del trabajo estudiantil.</p><p>Entre los temas tratados se incluyeron el informe de la Coordinación, la documentación presentada por las sectoriales para la próxima asamblea, la participación en CEUNE y el convenio marco. La sesión permitió al CAS coordinar acciones y planificar el trabajo conjunto de las próximas semanas.</p>',
        alt: 'Mosaico de la videollamada de la reunión extraordinaria del Comité de Asuntos Sectoriales de CREUP.',
      },
    },
    {
      slug: 'iii-encuentro-delegaciones-cadus-octubre-2025',
      kind: 'creup',
      startDate: '2025-10-17',
      endDate: '2025-10-19',
      location: 'Torremolinos',
      image: '/transparencia/actividad/imagenes/iii-encuentro-delegaciones-cadus-octubre-2025.webp',
      es: {
        title:
          'CREUP participa en el III Encuentro de Delegaciones del CADUS con formación y trabajo en comunicación e igualdad',
        excerpt:
          'Entre el 17 y el 19 de octubre, CREUP participó en el III Encuentro de Delegaciones del CADUS con una formación en Igualdad y una Mesa de Trabajo sobre Comunicación.',
        contentHtml:
          '<p>Entre los días 17 y 19 de octubre se celebró el III Encuentro de Delegaciones del CADUS, en el que participó CREUP para abordar uno de los temas transversales del evento.</p><p>Durante las jornadas, representantes de CREUP impartieron una formación en Igualdad y colaboraron en una Mesa de Trabajo centrada en la Comunicación dentro del ámbito de la representación estudiantil.</p><p>La participación permitió compartir experiencias, fortalecer la cooperación entre delegaciones y promover una representación más inclusiva y efectiva.</p>',
        alt: 'Representantes de CREUP impartiendo una formación en Igualdad en el III Encuentro de Delegaciones del CADUS.',
      },
    },
    {
      slug: 'reunion-cas-crearq-octubre-2025',
      kind: 'creup',
      startDate: '2025-10-21',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-cas-crearq-octubre-2025.webp',
      es: {
        title:
          'Encuentro entre la Coordinación del CAS y el Consejo de Representantes de Estudiantes de Arquitectura',
        excerpt:
          'El 21 de octubre tuvo lugar una reunión entre la Coordinación del CAS y el Consejo de Representantes de Estudiantes de Arquitectura.',
        contentHtml:
          '<p>El pasado 21 de octubre tuvo lugar una reunión entre la Coordinación del CAS y el Consejo de Representantes de Estudiantes de Arquitectura. Durante el encuentro se abordaron temas como el funcionamiento de la sectorial, la documentación que se tratará en la próxima asamblea y el avance en la firma del convenio con CREUP.</p><p>La reunión permitió reforzar la comunicación entre ambas partes y avanzar en la coordinación del trabajo estudiantil en el ámbito de la arquitectura.</p>',
        alt: 'Videollamada entre la Coordinación del CAS y el Consejo de Representantes de Estudiantes de Arquitectura.',
      },
    },
    {
      slug: 'reunion-cas-arell-octubre-2025',
      kind: 'creup',
      startDate: '2025-10-21',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-cas-arell-octubre-2025.webp',
      es: {
        title:
          'La Coordinación del CAS se reúne con la Asociación de Representantes de Estudiantes de Lenguas y Literaturas',
        excerpt:
          'El 21 de octubre tuvo lugar una reunión entre la Coordinación del CAS y la Asociación de Representantes de Estudiantes de Lenguas y Literaturas.',
        contentHtml:
          '<p>El 21 de octubre tuvo lugar una reunión entre la Coordinación del CAS y la Asociación de Representantes de Estudiantes de Lenguas y Literaturas.</p><p>Durante el encuentro se abordaron diversos temas, como el funcionamiento de la sectorial, la documentación a tratar en la próxima asamblea y el avance en la firma del convenio con CREUP. Esta reunión permitió estrechar la colaboración y seguir impulsando el trabajo conjunto en representación del estudiantado del ámbito de las lenguas y literaturas.</p>',
        alt: 'Videollamada entre la Coordinación del CAS y la Asociación de Representantes de Estudiantes de Lenguas y Literaturas.',
      },
    },
    {
      slug: 'asamblea-ejecutiva-cje-octubre-2025',
      kind: 'creup',
      startDate: '2025-10-24',
      endDate: '2025-10-26',
      location: 'Santander',
      image: '/transparencia/actividad/imagenes/asamblea-ejecutiva-cje-octubre-2025.webp',
      es: {
        title:
          'CREUP participa en la Asamblea Ejecutiva del Consejo de la Juventud para abordar los retos de la vivienda, el empleo y la acción climática',
        excerpt:
          'Entre el 24 y el 26 de octubre se celebró la Asamblea Ejecutiva del Consejo de la Juventud de España, que reunió a las principales asociaciones juveniles del país.',
        contentHtml:
          '<p>Entre los días 24 y 26 de octubre se celebró la Asamblea Ejecutiva del Consejo de la Juventud de España, un espacio que reunió a las principales asociaciones juveniles del país.</p><p>Durante el encuentro se debatieron cuestiones clave como el acceso a la vivienda, la situación laboral de la juventud y las políticas de acción climática.</p><p>La participación de CREUP reafirmó su compromiso con la defensa de los derechos e intereses del estudiantado dentro del marco de la representación juvenil.</p>',
        alt: 'Representante de CREUP junto al cartel del Consejo de la Juventud de España en su Asamblea Ejecutiva.',
      },
    },
    {
      slug: 'xii-stage-formativo-isin-octubre-2025',
      kind: 'creup',
      startDate: '2025-10-22',
      endDate: '2025-10-26',
      location: 'Isín (Huesca)',
      image: '/transparencia/actividad/imagenes/xii-stage-formativo-isin-octubre-2025.webp',
      es: {
        title:
          'Más de un centenar de representantes estudiantiles se forman en el XII Stage Formativo de CREUP en Isín',
        excerpt:
          'Entre el 22 y el 26 de octubre se celebró en Isín (Huesca) el XII Stage Formativo de CREUP, que reunió a más de un centenar de representantes estudiantiles de las universidades públicas españolas.',
        contentHtml:
          '<p>Entre los días 22 y 26 de octubre se celebró en Isín (Huesca) el XII Stage Formativo de CREUP, un evento que reunió a más de un centenar de representantes estudiantiles de todas las universidades públicas españolas. Este encuentro anual tiene como objetivo ofrecer formación de calidad, fomentar el intercambio de experiencias y fortalecer las competencias de liderazgo y representación del estudiantado universitario.</p><p>Durante las jornadas, las y los participantes asistieron a diversas sesiones formativas estructuradas en diferentes líneas de trabajo, entre ellas calidad universitaria, política universitaria, formación básica y comunicación. Estas actividades fueron impartidas por integrantes de CREUP y personas expertas en cada ámbito, combinando dinámicas teóricas y prácticas que permitieron a los asistentes adquirir herramientas útiles para aplicar en sus propios consejos y asociaciones.</p><p>El stage también sirvió como espacio para compartir buenas prácticas entre los distintos MOREs y para reflexionar sobre los retos de la representación estudiantil en el contexto actual, marcado por los procesos de transformación digital, las políticas de igualdad y los desafíos en materia de calidad educativa.</p>',
        alt: 'Foto de grupo de los participantes en el XII Stage Formativo de CREUP en Isín (Huesca).',
      },
    },
    {
      slug: 'convenio-auip-octubre-2025',
      kind: 'creup',
      startDate: '2025-10-27',
      location: 'Universidad Pablo de Olavide, Sevilla',
      image: '/transparencia/actividad/imagenes/convenio-auip-octubre-2025.webp',
      es: {
        title:
          'CREUP y la AUIP firman un convenio marco para impulsar la cooperación académica iberoamericana',
        excerpt:
          'El 27 de octubre, la AUIP y CREUP firmaron un Convenio Marco de Colaboración en la Universidad Pablo de Olavide de Sevilla.',
        contentHtml:
          '<p>El lunes 27 de octubre, la Asociación Universitaria Iberoamericana de Postgrado (AUIP) y la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) firmaron un Convenio Marco de Colaboración en la Universidad Pablo de Olavide de Sevilla.</p><p>El acuerdo tiene como objetivo fortalecer la participación estudiantil, fomentar la cooperación académica y promover la formación universitaria en Iberoamérica. Entre las principales líneas de trabajo se incluye la creación de la Plataforma Iberoamericana de Estudiantes, así como el impulso de iniciativas conjuntas en materia de movilidad, posgrado e innovación.</p><p>Con una vigencia inicial de cuatro años, este convenio consolida el compromiso de ambas organizaciones con una educación superior más inclusiva, participativa y de excelencia.</p>',
        alt: 'Firma del Convenio Marco de Colaboración entre CREUP y la AUIP en la Universidad Pablo de Olavide de Sevilla.',
      },
    },
    {
      slug: 'reunion-cas-siueh-octubre-2025',
      kind: 'creup',
      startDate: '2025-10-28',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-cas-siueh-octubre-2025.webp',
      es: {
        title: 'La Coordinación del CAS se reúne con la Sectorial de Estudiantes de Humanidades',
        excerpt:
          'El 28 de octubre tuvo lugar una reunión entre la Coordinación del CAS y la Sectorial Interuniversitaria de Estudiantes de Humanidades.',
        contentHtml:
          '<p>El 28 de octubre tuvo lugar una reunión entre la Coordinación del CAS y la Sectorial Interuniversitaria de Estudiantes de Humanidades. Durante el encuentro se abordaron cuestiones como el funcionamiento de la sectorial, la documentación que se preparará para la próxima asamblea y el progreso en la firma del convenio con CREUP.</p><p>La reunión sirvió para consolidar la cooperación entre ambas partes y continuar fortaleciendo la representación estudiantil en el ámbito de las humanidades.</p>',
        alt: 'Videollamada entre la Coordinación del CAS y la Sectorial Interuniversitaria de Estudiantes de Humanidades.',
      },
    },
    {
      slug: 'cestusc-iii-jornadas-convivencia-formacion-octubre-2025',
      kind: 'member',
      startDate: '2025-10-14',
      endDate: '2025-10-22',
      location: 'Lugo y Santiago de Compostela',
      memberOrgKey: 'CEstUSC',
      image:
        '/transparencia/actividad/imagenes/cestusc-iii-jornadas-convivencia-formacion-octubre-2025.webp',
      es: {
        title:
          'III Jornadas de Convivencia y Formación Universitaria: dos días para conocer, participar y construir comunidad en la USC',
        excerpt:
          'El CEstUSC organizó los días 14 y 22 de octubre las III Jornadas de Convivencia y Formación Universitaria en los campus de Lugo y Santiago de Compostela.',
        contentHtml:
          '<p>El Consello do Estudantado da Universidade de Santiago de Compostela (CEstUSC) organizó los días 14 y 22 de octubre las III Jornadas de Convivencia y Formación Universitaria, celebradas en los campus de Lugo y Santiago de Compostela.</p><p>Durante dos intensas jornadas, más de un centenar de estudiantes participaron en charlas, mesas teóricas y competenciales, talleres y actividades participativas como gymkanas, con el objetivo de fomentar la formación cívica, el conocimiento de la universidad y la participación activa en la vida universitaria.</p><p>Entre las propuestas más destacadas se incluyeron talleres de oratoria, negociación y primeros auxilios, así como encuentros con el equipo rectoral y el Valedor de la Comunidad Universitaria. Además, se promovió el uso del gallego mediante un sorteo de material oficial de la USC entre quienes intervinieron en esta lengua durante las sesiones.</p><p>Las jornadas concluyeron con una foliada universitaria, un espacio de convivencia y celebración que cerró el evento en un ambiente de comunidad. Esta actividad, ya consolidada como una cita anual, refleja el compromiso del CEstUSC con la participación estudiantil, la formación y la cohesión universitaria.</p>',
        alt: 'Estudiantes participando en una de las actividades de las III Jornadas de Convivencia y Formación Universitaria del CEstUSC.',
      },
    },
  ],
  areaReports: [
    {
      area: PREVIOUS_AREAS.PRESIDENCIA,
      image: '/transparencia/informes-areas/imagenes/informe-presidencia-octubre-2025.webp',
      es: {
        contentHtml:
          '<p>Durante este último mes de mandato, el Área de Presidencia ha centrado sus esfuerzos en cerrar diferentes asuntos y reforzar la presencia institucional de CREUP en distintos espacios. En el ámbito internacional, se ha impulsado un debate interno en el seno de MedNet sobre la continuidad de NUIS dentro del lobby europeo, siguiendo lo planteado en la AGET. Desde el área de igualdad, se ha continuado trabajando con distintas entidades para elaborar el posicionamiento sobre barreras, que será presentado en la próxima Asamblea General Ordinaria.</p><p>A lo largo del mes, la Presidencia ha participado en diversos encuentros clave. El presidente asistió a las jornadas del Pacto de Estado frente a la Emergencia Climática, donde mantuvo un encuentro con la ministra de Ciencia, Innovación y Universidades para abordar algunos de los temas prioritarios para CREUP. También se participó en el III Encuentro de Delegaciones del CADUS en Torremolinos, con formaciones en igualdad y comunicación.</p><p>Del 22 al 26 de octubre, el área tuvo una participación activa en el XII Stage Formativo, impartiendo sesiones en igualdad, asuntos internacionales y planificación estratégica. Finalmente, el 30 de octubre, el presidente asistió a las jornadas de Campus Rural en Beas de Segura, donde conoció de cerca la realidad del programa y firmó el protocolo que reafirma el compromiso de CREUP con esta iniciativa.</p>',
        alt: 'Equipo del Área de Presidencia de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.SECRETARIA,
      image: '/transparencia/informes-areas/imagenes/informe-secretaria-octubre-2025.webp',
      es: {
        contentHtml:
          '<p>Durante este periodo, el Área de Secretaría de CREUP ha desempeñado un papel clave en la elaboración y revisión de la aportación de la organización al Pacto de Estado contra el Cambio Climático, garantizando la coherencia institucional y la integración de la perspectiva estudiantil.</p><p>Asimismo, el área participó activamente en la organización de la AGET y en la coordinación del XII Stage Formativo, colaborando en su gestión documental y en el correcto desarrollo del evento.</p><p>Por último, se ha trabajado en la preparación de la próxima Asamblea General Ordinaria, cuidando el cumplimiento de los plazos y la adecuación de la documentación necesaria para su correcta celebración.</p>',
        alt: 'Integrantes del Área de Secretaría Ejecutiva y Tesorería de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.RRII,
      image:
        '/transparencia/informes-areas/imagenes/informe-relaciones-institucionales-y-proyectos-octubre-2025.webp',
      es: {
        contentHtml:
          '<p>Durante el mes de octubre, el Área de Institucionales de CREUP centró su trabajo en la finalización de la documentación para la próxima Asamblea de noviembre y en la participación en las formaciones del XII Stage Formativo.</p><p>Asimismo, se mantuvieron reuniones con entidades sociales como FELGBTI y SOS Racismo para abordar conjuntamente las barreras que afectan al estudiantado. CREUP participó en el acto de inauguración de la XXV Asamblea Confederal de CANAE y en la Asamblea Ejecutiva del CJE en Santander, donde defendió la regulación de las prácticas extracurriculares. También asistió a una reunión con el Ministerio para avanzar hacia el objetivo del 1% de financiación universitaria.</p><p>Además, CREUP participó en la presentación del libro «Talento universitario y empresa. Valoración de perfiles, contratación y futuro del empleo en España», organizado por CRUE, interviniendo en la mesa redonda para trasladar la perspectiva del estudiantado sobre la empleabilidad y sus principales preocupaciones.</p>',
        alt: 'Integrantes del Área de Relaciones Institucionales y Proyectos de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.POLITICA,
      image:
        '/transparencia/informes-areas/imagenes/informe-politica-universitaria-octubre-2025.webp',
      es: {
        contentHtml:
          '<p>Durante este mes, el Área de Política Universitaria ha avanzado en la coordinación del grupo de trabajo sobre las Becas FPU, promoviendo su seguimiento y desarrollo. Además, se elaboró la documentación para la próxima Asamblea General Ordinaria, incluyendo resoluciones e informes sobre temas clave como Menciones Duales, Gobernanza Universitaria, infraestructuras, participación estudiantil y los Reales Decretos 1721/2007 y 822/2021.</p><p>El área también coordinó la planificación e impartición de diversas formaciones en el XII Stage Formativo, centradas en la garantía de calidad, los derechos estudiantiles y el Espacio Europeo de Educación Superior.</p><p>Finalmente, colaboró en las tareas logísticas de montaje y desmontaje de la sede del evento, contribuyendo a su correcto desarrollo y éxito organizativo.</p>',
        alt: 'Integrantes del Área de Política Universitaria de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.ORGANIZACION,
      image: '/transparencia/informes-areas/imagenes/informe-organizacion-octubre-2025.webp',
      es: {
        contentHtml:
          '<p>Durante octubre, el Área de Organización centró sus esfuerzos en el XII Stage Formativo, celebrado en Isín (Huesca) del 22 al 26, gestionando la organización y logística del evento. La Vocalía de Formación elaboró el dossier con la estructura de las sesiones formativas.</p><p>Además, la Vicepresidencia de Organización y la Vocalía de Logística avanzaron en la preparación de la 78ª Asamblea General Ordinaria junto a la sede de Barcelona. La Vocalía de Formación también mantuvo reuniones con distintos miembros de la asociación y participó en la reunión extraordinaria del CAS el 16 de octubre.</p>',
        alt: 'Integrantes del Área de Organización de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.COMUNICACION,
      image: '/transparencia/informes-areas/imagenes/informe-comunicacion-octubre-2025.webp',
      es: {
        contentHtml:
          '<p>Durante este periodo, el Área de Comunicación de CREUP ha trabajado en fortalecer la presencia institucional de la organización y en situar la salud mental como un eje transversal dentro del discurso estudiantil. Se ha potenciado la participación activa en medios de comunicación y prensa, consolidando la visibilidad y el posicionamiento público de CREUP ante los principales temas de la agenda universitaria.</p><p>Además, el área ha desarrollado la identidad visual de la 78ª Asamblea General Ordinaria, garantizando una imagen cohesionada y representativa del evento. Por último, el equipo de Comunicación diseñó e impartió formaciones en el XII Stage Formativo centradas en la mejora de las capacidades comunicativas y estratégicas del estudiantado, reforzando su papel dentro de la representación universitaria.</p>',
        alt: 'Integrantes del Área de Comunicación de CREUP.',
      },
    },
  ],
}

export default month
