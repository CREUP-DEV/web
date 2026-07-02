/**
 * September 2025 "Actividad" seed module, migrated from the discontinued monthly newsletter PDF
 * (public/prensa/newsletter/documentos/newsletter-2025-09.pdf).
 *
 * Spanish-only on purpose: parents + the `es` translation are seeded; the other five locales are
 * backfilled later (same staged approach the press seed uses). Inserted idempotently by the
 * aggregator (./index.ts → drizzle/seed/content.ts) on the natural keys, so re-running is safe.
 *
 * Mandate: this edition belongs to the previous org chart → PREVIOUS_AREAS.
 * This newsletter shipped no "Mi asamblea" (member-organised) section, so every NOTICIAS item is a
 * CREUP event; the CAS-* meetings are CREUP's Comité de Asuntos Sectoriales presentations, not
 * member events. The "Ponte al día" report folds Secretaría and Tesorería under a single printed
 * header; here they are split along the previous-mandate vocalía boundaries (Digitalización →
 * Secretaría, Proyectos → Tesorería), keeping one report per area.
 */
import type { SeedNewsletterMonth } from './types'
import { PREVIOUS_AREAS } from './areas'

const PLACEHOLDER_DATE = '2025-09-01'

const month: SeedNewsletterMonth = {
  monthKey: '2025-09',
  coversFrom: null,
  entries: [
    {
      slug: 'cea-presencial-cantabria-septiembre-2025',
      kind: 'creup',
      startDate: '2025-09-01',
      endDate: '2025-09-05',
      location: 'Cantabria',
      image: '/transparencia/actividad/imagenes/cea-presencial-cantabria-septiembre-2025.webp',
      es: {
        title: 'III Comisión Ejecutiva Ampliada (CEA) presencial en Cantabria',
        excerpt:
          'Del 1 al 5 de septiembre, CREUP celebró en Cantabria su III Comisión Ejecutiva Ampliada presencial para definir las líneas de trabajo del curso 2025-2026.',
        contentHtml:
          '<p>Del 1 al 5 de septiembre tuvo lugar en Cantabria la III Comisión Ejecutiva Ampliada (CEA) presencial de CREUP, un espacio de encuentro para trabajar de manera conjunta.</p><p>Durante la reunión se definieron las principales líneas de trabajo para el curso 2025-2026, poniendo el foco en la representación estudiantil, la defensa de los derechos del estudiantado y la consolidación de los proyectos estratégicos de la organización.</p><p>Este encuentro presencial permitió fortalecer la coordinación interna y marcar objetivos compartidos que guiarán la labor de CREUP en los próximos meses.</p>',
        alt: 'Foto de grupo de la Comisión Ejecutiva Ampliada de CREUP en la CEA presencial de Cantabria.',
      },
    },
    {
      slug: 'reunion-cas-anem-septiembre-2025',
      kind: 'creup',
      startDate: '2025-09-03',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-cas-anem-septiembre-2025.webp',
      es: {
        title: 'Reunión CAS-ANEM',
        excerpt:
          'El 3 de septiembre, el coordinador del CAS de CREUP se presentó ante la nueva Junta Directiva de la Asociación Nacional de Estudiantes de Matemáticas (ANEM).',
        contentHtml:
          '<p>El pasado 3 de septiembre, el coordinador del Comité de Asuntos Sectoriales (CAS) de CREUP se presentó oficialmente ante la nueva Junta Directiva de la Asociación Nacional de Estudiantes de Matemáticas (ANEM).</p><p>Durante la reunión se compartieron ideas de trabajo para los próximos meses y se trasladaron las fechas de los próximos eventos, con el objetivo de seguir fomentando la colaboración entre ambas organizaciones y reforzar la voz del estudiantado en el ámbito universitario.</p>',
        alt: 'Mosaico de la videollamada de la reunión entre el CAS de CREUP y la ANEM.',
      },
    },
    {
      slug: 'reunion-cas-aealcee-septiembre-2025',
      kind: 'creup',
      startDate: '2025-09-11',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-cas-aealcee-septiembre-2025.webp',
      es: {
        title: 'Reunión CAS-AEALCEE',
        excerpt:
          'El 11 de septiembre, el coordinador del CAS se presentó ante la Asociación Española de Alumnos de Ciencias Económicas y Empresariales (AEALCEE).',
        contentHtml:
          '<p>El pasado 11 de septiembre, el coordinador del CAS se presentó ante la Asociación Española de Alumnos de Ciencias Económicas y Empresariales (AEALCEE), en un encuentro en el que se repasó el funcionamiento de esta organización estudiantil.</p><p>Durante la sesión se explicó la estructura de la asociación, su comisión ejecutiva, los cargos que la integran, así como la representación que ostentan en 40 universidades de todo el país. Además, se expusieron algunas de sus principales actividades, como los congresos de representantes y el torneo de debate en economía.</p><p>También se abordaron los temas en los que actualmente centra su trabajo la AEALCEE, entre los que destacan el Estatuto del Becario, la revisión de las guías docentes y la creación de grupos de trabajo en cada congreso.</p><p>Finalmente, se planteó la posibilidad de que la AEALCEE vuelva a unirse a CREUP a través del Comité de Asuntos Sectoriales (CAS). Para ello, se acordó que la asociación participe en la próxima reunión del CAS, no con la intención de adherirse de inmediato, sino para conocer de primera mano el funcionamiento de este espacio y valorar su incorporación en el futuro.</p>',
        alt: 'Mosaico de la videollamada de la reunión entre el CAS de CREUP y la AEALCEE.',
      },
    },
    {
      slug: 'reunion-cas-creic-septiembre-2025',
      kind: 'creup',
      startDate: '2025-09-16',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-cas-creic-septiembre-2025.webp',
      es: {
        title: 'Reunión CAS-CREIC',
        excerpt:
          'El 16 de septiembre, el coordinador del CAS mantuvo una reunión introductoria con el Colectivo de Representantes de Estudiantes de Ingeniería de Caminos, Canales y Puertos e Ingeniería Civil.',
        contentHtml:
          '<p>El pasado 16 de septiembre, el coordinador del Comité de Asuntos Sectoriales (CAS) mantuvo una reunión introductoria con el Colectivo de Representantes de Estudiantes de Ingeniería de Caminos, Canales y Puertos e Ingeniería Civil.</p><p>Durante el encuentro se abordaron diversos temas clave, como el funcionamiento de la sectorial, el trabajo futuro del CAS, la documentación a tratar en la próxima asamblea, así como la firma del convenio con CREUP. Esta primera toma de contacto permitió establecer las bases de colaboración para los próximos meses de trabajo conjunto.</p>',
        alt: 'Mosaico de la videollamada de la reunión introductoria entre el CAS de CREUP y el CREIC.',
      },
    },
    {
      slug: 'reunion-cas-ritsi-septiembre-2025',
      kind: 'creup',
      startDate: '2025-09-17',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-cas-ritsi-septiembre-2025.webp',
      es: {
        title: 'Reunión CAS-RITSI',
        excerpt:
          'El 17 de septiembre, el coordinador del CAS de CREUP participó en una reunión introductoria con la Reunión de Estudiantes de Ingenierías Técnicas y Superiores en Informática.',
        contentHtml:
          '<p>El pasado 17 de septiembre, el coordinador del Comité de Asuntos Sectoriales (CAS) de CREUP participó en una reunión introductoria con la Reunión de Estudiantes de Ingenierías Técnicas y Superiores en Informática.</p><p>Este primer encuentro sirvió para establecer la hoja de ruta de los próximos meses de trabajo, abordando cuestiones como el funcionamiento de la sectorial, las líneas de trabajo futuro del CAS, la preparación de la documentación para la próxima asamblea y el avance en la firma del convenio con CREUP.</p><p>Con esta reunión se refuerza la colaboración entre ambas organizaciones y se sientan las bases para un trabajo conjunto más sólido en beneficio del estudiantado.</p>',
        alt: 'Mosaico de la videollamada de la reunión introductoria entre el CAS de CREUP y RITSI.',
      },
    },
    {
      slug: 'jornadas-formacion-ceeina-septiembre-2025',
      kind: 'creup',
      startDate: '2025-09-16',
      endDate: '2025-09-22',
      location: 'Universidad de Zaragoza',
      image: '/transparencia/actividad/imagenes/jornadas-formacion-ceeina-septiembre-2025.webp',
      es: {
        title: 'CREUP participa en las Jornadas de Formación del CEEINA',
        excerpt:
          'Del 16 al 22 de septiembre, parte de la Comisión Ejecutiva Ampliada de CREUP participó en las Jornadas de Formación organizadas por el CEEINA en la Universidad de Zaragoza.',
        contentHtml:
          '<p>Del 16 al 22 de septiembre, parte de la Comisión Ejecutiva Ampliada de CREUP participó en las Jornadas de Formación organizadas por el CEEINA (Consejo de Estudiantes de la Escuela de Ingeniería y Arquitectura de la Universidad de Zaragoza).</p><p>Durante estas jornadas, el estudiantado recibió formación en ámbitos clave como representación, política universitaria, comunicación, organización, sostenibilidad e igualdad, entre otros temas esenciales para fortalecer su papel dentro de la vida universitaria.</p><p>Un espacio de aprendizaje, intercambio y motivación para seguir impulsando una participación estudiantil activa y transformadora.</p>',
        alt: 'Miembros de CREUP ante el cartel de las IV Jornadas de Formación del CEEINA.',
      },
    },
    {
      slug: 'i-foro-estudiantes-alianzas-europeas-septiembre-2025',
      kind: 'creup',
      startDate: '2025-09-22',
      endDate: '2025-09-25',
      location: 'Toledo',
      image:
        '/transparencia/actividad/imagenes/i-foro-estudiantes-alianzas-europeas-septiembre-2025.webp',
      es: {
        title: 'I Foro de Estudiantes y Alianzas Europeas organizado por CREUP',
        excerpt:
          'Del 22 al 25 de septiembre, CREUP celebró el I Foro de Estudiantes y Alianzas Europeas, que reunió a representantes de distintas alianzas universitarias.',
        contentHtml:
          '<p>Del 22 al 25 de septiembre se celebró el I Foro de Estudiantes y Alianzas Europeas, un espacio impulsado por CREUP que reunió a representantes de distintas alianzas universitarias.</p><p>En ella participaron más de una decena de representantes de universidades públicas y responsables de alianzas europeas.</p><p>Durante el encuentro, las y los participantes compartieron experiencias, buenas prácticas y proyectos en común, con el objetivo de fortalecer la cooperación estudiantil y avanzar en la construcción de una educación superior más conectada a nivel europeo.</p><p>Este primer foro se consolidó como un punto de encuentro clave para estrechar lazos entre estudiantes y alianzas, reforzando el papel del estudiantado en la dimensión internacional de la universidad.</p>',
        alt: 'Foto de grupo de las y los participantes del I Foro de Estudiantes y Alianzas Europeas en Toledo.',
      },
    },
    {
      slug: 'colaboracion-eacnur-septiembre-2025',
      kind: 'creup',
      startDate: '2025-09-23',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/colaboracion-eacnur-septiembre-2025.webp',
      es: {
        title: 'CREUP explora vías de colaboración con EACNUR',
        excerpt:
          'El 23 de septiembre, la Vocal de Incidencia Política de CREUP se reunió con EACNUR para analizar posibles formas de colaboración.',
        contentHtml:
          '<p>El pasado 23 de septiembre, nuestra Vocal de Incidencia Política mantuvo una reunión con EACNUR para analizar posibles formas de colaboración.</p><p>Entre las propuestas trabajadas destacó la creación de un programa estatal de becas dirigido a representantes estudiantiles refugiados o en situación de vulnerabilidad procedentes de otros países, con el fin de garantizar su acceso y participación plena en la vida universitaria.</p><p>Asimismo, se abordó el posicionamiento de CREUP sobre las barreras existentes en la universidad, reafirmando el compromiso de la Coordinadora con la igualdad de oportunidades y la defensa de los derechos del estudiantado.</p>',
        alt: 'Mosaico de la videollamada entre la Vocal de Incidencia Política de CREUP y EACNUR.',
      },
    },
    {
      slug: 'esc50-barcelos-portugal-septiembre-2025',
      kind: 'creup',
      startDate: '2025-09-21',
      endDate: '2025-09-25',
      location: 'Barcelos (Portugal)',
      image: '/transparencia/actividad/imagenes/esc50-barcelos-portugal-septiembre-2025.webp',
      es: {
        title: 'CREUP participa en la ESC50 celebrada en Barcelos, Portugal',
        excerpt:
          'Del 21 al 25 de septiembre, la coordinadora del CAI de CREUP participó en la 50ª European Students’ Convention (ESC50), celebrada en Barcelos (Portugal).',
        contentHtml:
          '<p>La coordinadora del Comité de Asuntos Internacionales (CAI) de CREUP se desplazó a Barcelos (Portugal) para participar en la 50ª European Students’ Convention (ESC50), organizada por la European Students’ Union (ESU) junto con FAIRe, la unión nacional de estudiantes portuguesa.</p><p>El encuentro tuvo lugar del 21 al 25 de septiembre y reunió a representantes estudiantiles de toda Europa. Durante las jornadas se abordaron temas clave para el futuro del estudiantado, como el Marco Financiero Plurianual (MFF) y el programa Erasmus+.</p><p>La convención combinó formaciones, simulaciones, debates, planificación y consultas, lo que permitió generar un espacio enriquecedor de diálogo y colaboración que refuerza la voz del estudiantado a nivel europeo.</p>',
        alt: 'Representantes estudiantiles europeos en la 50ª European Students’ Convention en Barcelos.',
      },
    },
    {
      slug: 'grupo-trabajo-participacion-crue-septiembre-2025',
      kind: 'creup',
      startDate: '2025-09-23',
      isOnline: true,
      location: null,
      image:
        '/transparencia/actividad/imagenes/grupo-trabajo-participacion-crue-septiembre-2025.webp',
      es: {
        title: 'CREUP participa en el Grupo de Trabajo de Participación de CRUE',
        excerpt:
          'El 23 de septiembre, la Vocal de Incidencia Política de CREUP asistió a la reunión ordinaria del Grupo de Trabajo de Participación de CRUE.',
        contentHtml:
          '<p>El pasado 23 de septiembre, nuestra Vocal de Incidencia Política asistió a la reunión ordinaria del Grupo de Trabajo de Participación de CRUE.</p><p>En este encuentro se abordaron diversos asuntos relacionados con la participación estudiantil, entre ellos la preparación de las próximas Jornadas de Participación.</p><p>La presencia de CREUP en este grupo de trabajo refuerza el compromiso de la organización con la defensa de los derechos de los estudiantes y con la promoción de su papel activo dentro del sistema universitario.</p>',
        alt: 'Mosaico de la videollamada del Grupo de Trabajo de Participación de CRUE.',
      },
    },
    {
      slug: 'grupo-trabajo-ley-juventud-cje-septiembre-2025',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      isOnline: true,
      location: null,
      image:
        '/transparencia/actividad/imagenes/grupo-trabajo-ley-juventud-cje-septiembre-2025.webp',
      es: {
        title: 'CREUP avanza en la elaboración de la nueva Ley de Juventud',
        excerpt:
          'El Vicepresidente de Relaciones Institucionales de CREUP participó en la reunión del Grupo de Trabajo para la Ley de Juventud del CJE.',
        contentHtml:
          '<p>El Vicepresidente de Relaciones Institucionales de CREUP participó recientemente en la reunión del Grupo de Trabajo para la Ley de Juventud del CJE, centrada en el desarrollo del proyecto de la nueva normativa.</p><p>Durante el encuentro se abordaron aspectos clave como la personalidad jurídica de la ley, las actualizaciones ministeriales recientes y los diferentes apartados que podrían incluirse en el borrador, con el objetivo de garantizar que la normativa responda a las necesidades y derechos del colectivo juvenil.</p><p>Esta participación refuerza el compromiso de CREUP con la defensa de los intereses de los estudiantes y su implicación activa en la construcción de políticas de juventud a nivel nacional.</p>',
        alt: 'Mosaico de la videollamada del Grupo de Trabajo para la Ley de Juventud del CJE.',
      },
    },
  ],
  areaReports: [
    {
      area: PREVIOUS_AREAS.PRESIDENCIA,
      image: '/transparencia/informes-areas/imagenes/informe-presidencia-septiembre-2025.webp',
      es: {
        contentHtml:
          '<p>Durante el mes de septiembre, el área de Presidencia ha centrado sus esfuerzos principalmente en el desarrollo del I Foro de Estudiantes y Alianzas Europeas. Al ser un evento directamente vinculado a nuestra área, hemos trabajado de manera estrecha con el CAI, especialmente con Juan Alfonso, a quien queremos agradecer por su implicación y contribución en la organización del foro.</p><p>Asimismo, hemos colaborado junto a FONCE en el proyecto de inclusión de personas con discapacidad en el Stage Formativo, reforzando nuestro compromiso con la accesibilidad y la participación de todo el estudiantado.</p><p>Por otra parte, nuestra coordinadora del CAI, Ainhoa, ha participado en el 50º European Students’ Convention (ESC) celebrado en Portugal, organizado por nuestras compañeras de FAIRE, fortaleciendo así las relaciones internacionales y la presencia de CREUP en foros europeos.</p><p>Finalmente, la celebración de la CEA durante la primera semana de septiembre nos ha permitido retomar proyectos y mantener conversaciones con distintas entidades, organismos y partidos, con el objetivo de seguir trabajando por una Universidad Pública de calidad.</p>',
        alt: 'Equipo del área de Presidencia de CREUP en un entorno natural.',
      },
    },
    {
      area: PREVIOUS_AREAS.SECRETARIA,
      image: '/transparencia/informes-areas/imagenes/informe-secretaria-septiembre-2025.webp',
      es: {
        contentHtml:
          '<p>La Vocalía de Digitalización y Transparencia ha avanzado en la integración de la intranet con FACe, lo que permite ahorrar pasos en la emisión de facturas y mantener un control centralizado sobre su estado. Además, se han continuado desarrollando actualizaciones en la intranet relacionadas con eventos, certificación y la incorporación de nuevos apartados dentro del perfil de los MOREs.</p><p>En lo que respecta a las funciones propias de la Secretaría, se han realizado las labores cotidianas del cargo y la preparación de la documentación necesaria para la 78.ª Asamblea General Ordinaria.</p><p>Por último, los tres miembros del área participaron como formadores en las IV Jornadas de Formación del CEEINA, contribuyendo a la capacitación y desarrollo del personal asociado.</p>',
        alt: 'Integrantes del área de Secretaría Ejecutiva de CREUP en un entorno natural.',
      },
    },
    {
      area: PREVIOUS_AREAS.TESORERIA,
      image: '/transparencia/informes-areas/imagenes/informe-tesoreria-septiembre-2025.webp',
      es: {
        contentHtml:
          '<p>Durante este mes, la Tesorería ha centrado su labor en poner al día la contabilidad de la asociación, abordando los retrasos acumulados durante el año, así como en la revisión de la contabilidad correspondiente al 2024, garantizando la transparencia y el correcto registro de las cuentas.</p><p>Por su parte, la Vocalía de Proyectos ha llevado a cabo estudios sobre posibles convocatorias a las que la asociación podría presentarse, así como contactos con empresas y entidades para lograr patrocinios de los eventos planificados para los próximos meses.</p>',
        alt: 'Integrantes del área de Tesorería de CREUP en un entorno natural.',
      },
    },
    {
      area: PREVIOUS_AREAS.RRII,
      image:
        '/transparencia/informes-areas/imagenes/informe-relaciones-institucionales-y-proyectos-septiembre-2025.webp',
      es: {
        contentHtml:
          '<p>Durante septiembre, el área de Relaciones Institucionales inició el curso académico con una agenda diversa y activa. En la CEA presencial se definieron las líneas de actuación para este periodo.</p><p>Se participó en el I Foro de Estudiantes y Alianzas Europeas, así como en las jornadas del Consejo de Estudiantes de la Universidad de Extremadura como formadores, consolidando la presencia de CREUP en espacios de representación externa.</p><p>Asimismo, se trabajó en la reforma del Estatuto del Estudiante Universitario con FONCE, en la Ley de Juventud del CJE, y en la comisión universidades-empresas de la Cámara de Comercio, además de apoyar a Presidencia en reuniones con Amnistía Internacional y el Consejo de la Juventud de España.</p><p>Por último, se avanzó en la elaboración del informe de precios públicos y en el posicionamiento en política social, fortaleciendo la labor institucional de CREUP.</p>',
        alt: 'Integrantes del área de Relaciones Institucionales de CREUP en un entorno natural.',
      },
    },
    {
      area: PREVIOUS_AREAS.POLITICA,
      image:
        '/transparencia/informes-areas/imagenes/informe-politica-universitaria-septiembre-2025.webp',
      es: {
        contentHtml:
          '<p>Desde el área de Política Universitaria se ha avanzado en la redacción de los borradores de la documentación que, en las próximas semanas, será sometida a debate y mejora en los diferentes Grupos de Trabajo.</p><p>Asimismo, se ha concluido con éxito el proceso de inscripción de las personas miembros de la Asamblea en dichos grupos. Queremos agradecer el alto nivel de participación registrado y confiamos en que esta implicación se traduzca en numerosas aportaciones enriquecedoras para los documentos en desarrollo.</p><p>Por otro lado, se está trabajando de manera intensa y coordinada con el resto de áreas en la organización del XII Stage Formativo, tanto en lo relativo a las cuestiones logísticas como en la planificación de las líneas formativas específicas de esta vicepresidencia.</p>',
        alt: 'Integrantes del área de Política Universitaria de CREUP en un entorno natural.',
      },
    },
    {
      area: PREVIOUS_AREAS.ORGANIZACION,
      image: '/transparencia/informes-areas/imagenes/informe-organizacion-septiembre-2025.webp',
      es: {
        contentHtml:
          '<p>Septiembre ha sido un mes marcado por dos eventos clave para el Área de Organización: la CEA presencial en Riaño (Cantabria), del 1 al 4 de septiembre, cuya preparación comenzó antes del verano y permitió reforzar la coordinación de la Comisión Ejecutiva Ampliada; y el I Foro de Estudiantes y Alianzas Europeas en Toledo, del 23 al 26 de septiembre, organizado principalmente por la Vocalía de Logística junto al Área de Presidencia.</p><p>Además, desde la Vocalía de Formación y Contacto con los Miembros se han iniciado reuniones con asociados y se ha mantenido contacto con el Comité de Asuntos Sectoriales.</p><p>El XII Stage Formativo y la 78ª Asamblea General Ordinaria continúan siendo los principales focos de trabajo, con avances en la logística, el plan formativo y el dossier para las personas formadoras.</p>',
        alt: 'Integrantes del área de Organización de CREUP en un entorno natural.',
      },
    },
    {
      area: PREVIOUS_AREAS.COMUNICACION,
      image: '/transparencia/informes-areas/imagenes/informe-comunicacion-septiembre-2025.webp',
      es: {
        contentHtml:
          '<p>Durante el mes de septiembre, el área de Comunicación de CREUP ha centrado sus esfuerzos en el impulso de campañas clave para el estudiantado, poniendo el foco en tres ejes prioritarios: vivienda, financiación y salud mental.</p><p>Para ello, se han desarrollado distintas piezas audiovisuales y artículos que visibilizan las necesidades reales del estudiantado, especialmente en lo relativo al bienestar en el entorno universitario. Estas acciones han contribuido a reforzar la voz del estudiantado en el debate público y a trasladar sus demandas a los distintos actores sociales y políticos.</p>',
        alt: 'Equipo del área de Dirección de Comunicación de CREUP en un entorno natural.',
      },
    },
  ],
}

export default month
