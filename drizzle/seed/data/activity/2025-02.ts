/**
 * January–February 2025 "Actividad" seed module, migrated from the discontinued monthly newsletter
 * PDF (public/prensa/newsletter/documentos/newsletter-2025-02.pdf), which covered enero–febrero 2025.
 *
 * Spanish-only on purpose: parents + the `es` translation are seeded; the other five locales are
 * backfilled later (same staged approach the press seed uses). Inserted idempotently by the
 * aggregator (./index.ts → drizzle/seed/content.ts) on the natural keys, so re-running is safe.
 *
 * Mandate: this edition belongs to the previous org chart → PREVIOUS_AREAS.
 */
import type { SeedNewsletterMonth } from './types'
import { PREVIOUS_AREAS } from './areas'

const PLACEHOLDER_DATE = '2025-02-01'

const month: SeedNewsletterMonth = {
  monthKey: '2025-02',
  coversFrom: '2025-01',
  entries: [
    {
      slug: 'observatorio-emancipacion-cje-febrero-2025',
      kind: 'creup',
      startDate: '2025-01-16',
      image: '/transparencia/actividad/imagenes/observatorio-emancipacion-cje-febrero-2025.webp',
      es: {
        title: 'CREUP acude a la presentación del Observatorio de Emancipación del CJE',
        excerpt:
          'Nicolás Pingarrón representó a CREUP en el Observatorio de Emancipación del Consejo de la Juventud de España.',
        contentHtml:
          '<p>El pasado 16 de enero, Nicolás Pingarrón, Vicepresidente de Institucionales y Proyectos de la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP), acudió en representación de la organización al Observatorio de Emancipación del Consejo de la Juventud de España (CJE).</p><p>El encuentro contó con la presencia de la ministra de Juventud e Infancia, Sira Rego, y reunió a diversas entidades y representantes juveniles para abordar la situación actual de la emancipación en España. Durante la sesión, se puso de manifiesto la dificultad que enfrentan los jóvenes para acceder a una vivienda, especialmente debido al elevado porcentaje de sus ingresos que deben destinar al pago del alquiler. Asimismo, se debatieron y aclararon datos sobre la compatibilización de estudios y empleo entre la población joven, desmontando cifras erróneas que han circulado en el ámbito público.</p><p>Desde CREUP, se destacó la importancia de contar con datos fiables y una representación juvenil activa en la toma de decisiones que afectan directamente al futuro de los jóvenes, subrayando la necesidad de políticas que faciliten el acceso a la vivienda y a condiciones laborales dignas.</p>',
        alt: 'Presentación del Observatorio de Emancipación del Consejo de la Juventud de España.',
      },
    },
    {
      slug: 'jornadas-discursos-odio-esn-febrero-2025',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      image: '/transparencia/actividad/imagenes/jornadas-discursos-odio-esn-febrero-2025.webp',
      es: {
        title:
          'CREUP participa en las jornadas de formación sobre discursos de odio y espacios seguros de ESN',
        excerpt:
          'Nuestra vocal de Igualdad participó en unas jornadas de ESN España sobre discursos de odio y entornos seguros.',
        contentHtml:
          '<p>La asociación ESN España ha celebrado unas jornadas de formación dirigidas a sus miembros con el objetivo de abordar los discursos de odio y promover entornos más seguros y feministas dentro de la organización. Hasta allí se desplazó nuestra compañera Marta Díaz, vocal de Igualdad y Cooperación al Desarrollo. A lo largo del encuentro, los asistentes debatieron sobre la situación actual de la sociedad en materia de discriminación y violencia verbal, así como sobre estrategias para reducir estos comportamientos en espacios de asociacionismo.</p><p>Durante la jornada, se llevó a cabo una mesa redonda en la que participaron destacadas voces en materia de igualdad. Lucía, representante de ESN, presentó el plan de igualdad de la organización, detallando las iniciativas en marcha para garantizar un entorno más inclusivo. Andrea, del Consejo de la Juventud de España (CJE) en Valencia, aportó su visión sobre el papel del asociacionismo juvenil en la lucha contra el odio y la discriminación. Por su parte, Marta, vocal de Igualdad de CREUP, expuso las acciones emprendidas en el ámbito universitario para fomentar la equidad y la seguridad dentro de las entidades estudiantiles.</p>',
        alt: 'Asistentes a las jornadas de formación sobre discursos de odio y espacios seguros de ESN.',
      },
    },
    {
      slug: 'aneca-creup-dobles-titulaciones-docentia-febrero-2025',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      isOnline: true,
      location: null,
      image: null,
      es: {
        title:
          'ANECA y CREUP analizan la regulación de las dobles titulaciones y el programa DOCENTIA',
        excerpt:
          'Reunión con ANECA sobre la regulación de las dobles titulaciones y la evaluación del profesorado en el programa DOCENTIA.',
        contentHtml:
          '<p>La Agencia Nacional de Evaluación de la Calidad y Acreditación (ANECA) ha mantenido una reunión con CREUP para abordar la regulación vigente de las dobles titulaciones en España, establecida en el Real Decreto 822/2021, así como diversos aspectos relacionados con el programa DOCENTIA.</p><p>Durante el encuentro, se discutieron los criterios y requisitos que deben cumplir las universidades para la implantación y acreditación de estos programas de estudio, con especial énfasis en la flexibilidad y compatibilidad de los planes formativos. Asimismo, se analizaron los retos que plantea la evaluación del profesorado en el marco del programa DOCENTIA, diseñado para garantizar la calidad docente en las instituciones de educación superior.</p>',
      },
    },
    {
      slug: 'encuesta-juventud-emancipacion-febrero-2025',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      image: '/transparencia/actividad/imagenes/encuesta-juventud-emancipacion-febrero-2025.webp',
      es: {
        title: 'Presentación de la encuesta a la juventud sobre las condiciones de la emancipación',
        excerpt:
          'Nuestro Vicepresidente de Institucionales asistió a la presentación de una encuesta del EsdeES sobre la satisfacción del estudiantado.',
        contentHtml:
          '<p>Nuestro Vicepresidente de Institucionales, Nicolás Pingarrón, asistió a la presentación de los resultados de una encuesta realizada por el EsdeES, en la que se analizaba la percepción y satisfacción del estudiantado en diversos ámbitos de la educación superior en España.</p><p>Durante la presentación, se expusieron datos comparativos sobre la satisfacción de los estudiantes en universidades públicas y privadas, abordando aspectos clave como la calidad de la enseñanza, los recursos disponibles y la accesibilidad a oportunidades académicas y profesionales. Asimismo, se analizó el impacto de la modalidad de estudio, contrastando la experiencia del alumnado en programas presenciales frente a aquellos que cursan estudios de forma telemática.</p><p>Uno de los puntos centrales del debate fue la identificación de los principales desafíos que enfrenta el sistema universitario para mejorar la experiencia estudiantil.</p>',
        alt: 'Nicolás Pingarrón en la presentación de la encuesta sobre las condiciones de la emancipación.',
      },
    },
    {
      slug: 'encuesta-esdees-estudiantes-febrero-2025',
      kind: 'creup',
      startDate: '2025-02-03',
      location: 'Institución Libre de Enseñanza',
      image: '/transparencia/actividad/imagenes/encuesta-esdees-estudiantes-febrero-2025.webp',
      es: {
        title: 'Presentación de la encuesta del EsdeES a los estudiantes',
        excerpt:
          'El 3 de febrero, Nicolás Pingarrón participó en la presentación de una encuesta del EsdeES sobre la educación de los estudiantes.',
        contentHtml:
          '<p>El pasado 3 de febrero, Nicolás Pingarrón, en representación de la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP), asistió al evento organizado por el Espacio de Educación Superior en España (EsdeES). Durante la jornada, se presentó una encuesta que recoge la valoración de los estudiantes sobre distintos aspectos de su educación, incluyendo la calidad de la enseñanza, el profesorado y las condiciones generales de las universidades.</p><p>Pingarrón participó en una mesa redonda celebrada en la Institución Libre de Enseñanza, donde se debatieron los resultados del estudio y se abordaron las principales preocupaciones del alumnado. En el encuentro, representantes del ámbito académico y estudiantil reflexionaron sobre las áreas de mejora en el sistema universitario y la necesidad de adaptar la educación superior a las nuevas demandas del estudiantado.</p>',
        alt: 'Mesa redonda de la presentación de la encuesta del EsdeES a los estudiantes.',
      },
    },
    {
      slug: 'pleno-sectorial-asuntos-estudiantiles-crue-febrero-2025',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      image:
        '/transparencia/actividad/imagenes/pleno-sectorial-asuntos-estudiantiles-crue-febrero-2025.webp',
      es: {
        title: 'Pleno de la Sectorial de Asuntos Estudiantiles de CRUE',
        excerpt:
          'CREUP defendió la perspectiva del estudiantado sobre el Estatuto del Estudiante Universitario y el Estatuto del Becario.',
        contentHtml:
          '<p>Asistimos al Pleno de CRUE Estudiantes con el objetivo de presentar y defender la perspectiva del estudiantado sobre el Estatuto del Estudiante Universitario (EEU) y el Estatuto del Becario (EB). Durante nuestra intervención, expusimos las principales preocupaciones, demandas y propuestas de los estudiantes en relación con estos marcos normativos, destacando la necesidad de garantizar derechos, mejorar las condiciones de participación y reforzar la protección de los becarios en su ámbito formativo y laboral.</p><p>Además, el encuentro permitió generar un espacio de diálogo en el que pudimos acercar posiciones con otros actores del ámbito universitario. A través de una mesa de debate, diferentes representantes con posturas diversas compartieron sus puntos de vista, lo que facilitó un intercambio enriquecedor de ideas y la búsqueda de consensos en cuestiones clave para la comunidad estudiantil.</p>',
        alt: 'Mesa del Pleno de la Sectorial de Asuntos Estudiantiles de CRUE.',
      },
    },
    {
      slug: 'cea-presencial-valencia-febrero-2025',
      kind: 'creup',
      startDate: '2025-02-07',
      endDate: '2025-02-10',
      location: 'Universitat Politècnica de València',
      image: '/transparencia/actividad/imagenes/cea-presencial-valencia-febrero-2025.webp',
      es: {
        title: 'CEA presencial en Valencia',
        excerpt:
          'Del 7 al 10 de febrero celebramos en la UPV la reunión presencial de la Comisión Ejecutiva Ampliada de CREUP.',
        contentHtml:
          '<p>Entre los días 7 y 10 de este mes, celebramos en la Universitat Politècnica de València la reunión presencial de la Comisión Ejecutiva Ampliada de CREUP. Durante estos días de trabajo intensivo, planificamos y coordinamos las próximas líneas de acción de cara a los dos grandes eventos que marcarán nuestra agenda en los próximos meses: el Congreso CREUP-CRUE y el Encuentro de CREUP, así como la 77ª Asamblea General Ordinaria, que tendrá lugar en la Universidad de Sevilla.</p><p>En esta reunión, abordamos estrategias clave para fortalecer la representación estudiantil a nivel nacional, revisamos el estado de los proyectos en curso y establecimos las prioridades de trabajo para garantizar el éxito de estos encuentros. Además, profundizamos en el desarrollo de iniciativas que permitan mejorar la incidencia de los estudiantes en la política universitaria y la calidad educativa en nuestras universidades.</p><p>Queremos expresar nuestro más sincero agradecimiento al Consejo de Estudiantes de la Universitat Politècnica de València por su hospitalidad y por facilitarnos el uso de sus instalaciones.</p>',
        alt: 'Foto de grupo de la Comisión Ejecutiva Ampliada de CREUP reunida en la UPV.',
      },
    },
    {
      slug: 'evento-ods-universidad-murcia-febrero-2025',
      kind: 'creup',
      startDate: PLACEHOLDER_DATE,
      location: 'Universidad de Murcia',
      image: '/transparencia/actividad/imagenes/evento-ods-universidad-murcia-febrero-2025.webp',
      es: {
        title:
          'Participación de CREUP en el evento sobre los Objetivos de Desarrollo Sostenible en la Universidad de Murcia',
        excerpt:
          'Varios representantes de CREUP asistieron a un evento de la Universidad de Murcia sobre la implementación de los ODS en el ámbito universitario.',
        contentHtml:
          '<p>Varios representantes de la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) asistieron a un evento organizado por la Universidad de Murcia centrado en la implementación de los Objetivos de Desarrollo Sostenible (ODS) en el ámbito universitario. Durante el encuentro, se abordaron diversas estrategias para integrar estos objetivos en la gestión y actividad académica de las universidades, promoviendo un compromiso real con la sostenibilidad y la responsabilidad social.</p><p>Uno de los aspectos más relevantes del evento fue la presentación de oportunidades de financiación para proyectos estudiantiles alineados con los ODS. Se expusieron distintas vías de apoyo económico destinadas a iniciativas que fomenten la sostenibilidad, la equidad social y la innovación dentro de las universidades públicas. Además, se ofrecieron pautas sobre cómo diseñar y presentar proyectos con mayor impacto, facilitando su viabilidad y ejecución.</p>',
        alt: 'Foto de grupo de los asistentes al evento sobre los ODS en la Universidad de Murcia.',
      },
    },
    {
      slug: 'encuentro-uam-uah-febrero-2025',
      kind: 'creup',
      startDate: '2025-02-27',
      endDate: '2025-03-02',
      image: null,
      es: {
        title: 'Encuentro UAM/UAH',
        excerpt:
          'Del 27 de febrero al 2 de marzo se celebrarán en la UAM y la UAH el XI Congreso CREUP-CRUE y el XIV Encuentro de CREUP.',
        contentHtml:
          '<p>Durante los días comprendidos entre el 27 de febrero y el 2 de marzo, tendrá lugar la celebración conjunta del XI Congreso CREUP-CRUE y el XIV Encuentro de CREUP, dos eventos clave en el ámbito de la representación estudiantil universitaria en España.</p><p>Las sedes elegidas para albergar estas jornadas serán la Universidad Autónoma de Madrid (UAM) y la Universidad de Alcalá (UAH), dos instituciones de prestigio que acogerán a representantes estudiantiles de universidades públicas de todo el país.</p><p>A lo largo de estos días, se llevarán a cabo diversas sesiones de trabajo, debates y ponencias que abordarán temas estratégicos para el futuro de la educación superior en España. Se espera la participación de miembros de CREUP, así como de representantes de la Conferencia de Rectores de las Universidades Españolas (CRUE), quienes intercambiarán ideas y propuestas sobre la mejora del sistema universitario, la participación estudiantil y las políticas de calidad académica.</p>',
      },
    },
  ],
  areaReports: [
    {
      area: PREVIOUS_AREAS.PRESIDENCIA,
      image: '/transparencia/informes-areas/imagenes/informe-presidencia-febrero-2025.webp',
      es: {
        contentHtml:
          '<p>Durante los últimos dos meses, el área de Presidencia ha trabajado activamente en varias líneas de acción. Desde el área de Igualdad y Cooperación al Desarrollo, se ha retomado la resolución sobre paridad en la representación estudiantil y se han establecido contactos con distintas entidades sociales para involucrarlas en CREUP como agentes de cambio en el XIV Encuentro de Representantes. También se ha mantenido una reunión con la nueva Presidenta de CRUE-Sostenibilidad para avanzar en la resolución sobre oficinas de sostenibilidad.</p><p>En cuanto a las microformaciones ONCE, se celebró la primera sesión con la participación de 200 inscritos. Además, la Fundación ONCE ha incluido a la organización en el diseño del Congreso Internacional de Discapacidad, previsto para noviembre de 2025 en Granada.</p><p>Desde el CAI y el área de Internacionales, se ha trabajado en la organización del European Students Congress en Irlanda y en el desarrollo de un proyecto de protección universitaria para inmigrantes en peligro, enfocándose especialmente en la situación del colectivo estudiantil saharaui.</p><p>En el ámbito institucional, se participó en la sectorial de CRUE-Asuntos Estudiantiles, donde se discutió el futuro papel de las universidades tras la aprobación del Estatuto del Estudiante Universitario. También se mantuvieron reuniones con el grupo parlamentario Sumar en relación con el Estatuto del Estudiante en formación práctica.</p><p>Finalmente, junto con el área de Tesorería, se ha comenzado a trabajar en posibles proyectos Erasmus+ en los que el área de Presidencia pueda colaborar.</p>',
        alt: 'Equipo del área de Presidencia de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.SECRETARIA,
      image: '/transparencia/informes-areas/imagenes/informe-secretaria-febrero-2025.webp',
      es: {
        contentHtml:
          '<p>Durante este mes, desde la Secretaría se han elaborado los primeros borradores del Reglamento del Pool de Calidad y del Reglamento de Funcionamiento del CAS. Para ambos documentos, se han mantenido reuniones con el área de Política Universitaria. En el caso del RFCAS, se ha celebrado una reunión con el Coordinador del CAS, acordándose una próxima reunión de trabajo con el propio CAS, donde se revisará el texto propuesto por la Secretaría antes de su aprobación en la AGO.</p><p>Asimismo, se han iniciado los trámites de admisión de la Universitat Pompeu Fabra y de la sectorial NUSGREM.</p><p>Por otro lado, han comenzado los trabajos de modificación de los convenios modelo de sede y de sectoriales, cuya aprobación está prevista en la AGO. Además, para garantizar la adaptación a la normativa vigente en materia de protección de datos, se está elaborando una Política de Protección de Datos para CREUP, junto con la creación de un nuevo correo electrónico (proteccion.datos@creup.es) destinado a la gestión de los derechos legalmente reconocidos en esta materia.</p><p>En cuanto a digitalización, se ha iniciado el proceso de migración de la infraestructura digital de CREUP a un nuevo alojamiento.</p>',
        alt: 'Integrante del área de Secretaría Ejecutiva de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.TESORERIA,
      image: '/transparencia/informes-areas/imagenes/informe-tesoreria-febrero-2025.webp',
      es: {
        contentHtml:
          '<p>Desde esta área se ha trabajado en el cierre del ejercicio económico, revisando la facturación y la justificación de gastos, lo que ha permitido mejorar estos procesos. Se han gestionado las cuotas de membresía y analizado las solicitudes presentadas por los MOREs, además de avanzar en la implementación del sistema de facturación electrónica, que ya cubre aproximadamente al 86,5% de los miembros.</p><p>En cuanto a subvenciones y proyectos, en enero se trabajó en la subvención del Ministerio de Ciencia, Innovación y Universidades para asociaciones juveniles de ámbito universitario, solicitando financiación para dos actividades y elaborando un dossier con objetivos, beneficiarios y presupuesto detallado. Además, se ha iniciado un plan de trabajo para acceder a subvenciones europeas que impulsen el crecimiento en distintos ámbitos.</p><p>Por otro lado, en febrero se fijaron líneas estratégicas de cara a la próxima asamblea y se avanzó en proyectos previamente iniciados, fortaleciendo el trabajo en equipo entre distintas áreas.</p>',
        alt: 'Equipo del área de Tesorería de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.RRII,
      image:
        '/transparencia/informes-areas/imagenes/informe-relaciones-institucionales-y-proyectos-febrero-2025.webp',
      es: {
        contentHtml:
          '<p>Este mes se inició con la presentación de una encuesta del estudiantado por parte del EsdeES, donde se comparaba la satisfacción de los estudiantes en universidades públicas y privadas, así como entre estudios telemáticos y presenciales, identificando desafíos para mejorar.</p><p>A continuación, junto al Presidente, participamos en el Pleno de CRUE Estudiantes para exponer la perspectiva del estudiantado sobre el EEU y el EB. También se abrió un espacio de diálogo para acercar posturas entre distintas posiciones.</p><p>Como resultado del trabajo realizado, se han creado dos grupos de trabajo: uno sobre la financiación en el SUE y otro sobre vivienda. Ya se ha celebrado la primera sesión, avanzando en la documentación correspondiente.</p>',
        alt: 'Equipo de la Vicepresidencia de Relaciones Institucionales de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.POLITICA,
      image:
        '/transparencia/informes-areas/imagenes/informe-politica-universitaria-febrero-2025.webp',
      es: {
        contentHtml:
          '<p>Se llevó a cabo una reunión con ANECA para evaluar posibles modificaciones en el borrador sobre la regulación de los Documentos de Transparencia y Evaluación Institucional (DTIEs), recopilando información clave de ANECA y REACU para mejorar su aplicación en el ámbito universitario.</p><p>Asimismo, se organizó la convocatoria de los distintos Grupos de Trabajo (GTs), estableciendo la distribución de tareas y el calendario de reuniones.</p><p>Por último, en el encuentro con el Grupo de Trabajo de Participación Estudiantil de CRUE, se abordó la creación de un pasaporte cultural estandarizado para fomentar el acceso a la cultura en el ámbito universitario y se planificarán las próximas Jornadas de Participación Estudiantil.</p>',
        alt: 'Integrante de la Vicepresidencia de Política Universitaria de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.ORGANIZACION,
      image: '/transparencia/informes-areas/imagenes/informe-organizacion-febrero-2025.webp',
      es: {
        contentHtml:
          '<p>El área de Organización ha trabajado en la planificación y logística del VI Congreso CREUP-CRUE y el XIV Encuentro de Representantes, coordinando reuniones con las sedes y ultimando detalles. Además, se está preparando la 77ª Asamblea General Ordinaria en colaboración con la Universidad de Sevilla, avanzando en aspectos clave para su viabilidad.</p>',
        alt: 'Equipo de la Vicepresidencia de Organización de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.COMUNICACION,
      image: '/transparencia/informes-areas/imagenes/informe-comunicacion-febrero-2025.webp',
      es: {
        contentHtml:
          '<p>Durante los meses de enero y febrero, el área de Comunicación ha trabajado intensamente para potenciar el Instagram de la Coordinadora, creando contenido más dinámico y alineado con nuestro público objetivo.</p><p>Para acercar CREUP a la comunidad estudiantil, hemos lanzado nuevas secciones en redes sociales donde explicamos la estructura de la organización, el trabajo de cada área y otros temas de interés. Además, hemos desarrollado vídeos y campañas sobre cuestiones clave, como la infrafinanciación de las universidades y los problemas asociados a las becas FPU.</p><p>En el ámbito del diseño, nos hemos encargado de la identidad visual del XIV Encuentro de CREUP y el VI Congreso CREUP-CRUE, asegurándonos de que se adaptara de la mejor manera a las necesidades de la doble sede. También hemos iniciado el desarrollo de la identidad visual de la 77ª AGO, que tendrá lugar en Sevilla.</p><p>Como cada mes, dedicamos una parte fundamental de nuestro esfuerzo a esta newsletter, para que todas vosotras podáis estar al tanto de los avances de la Coordinadora.</p>',
        alt: 'Equipo del área de Comunicación de CREUP.',
      },
    },
  ],
}

export default month
