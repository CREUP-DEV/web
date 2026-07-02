/**
 * December 2024 "Actividad" seed module, migrated from the discontinued monthly newsletter PDF
 * (public/prensa/newsletter/documentos/newsletter-2024-12.pdf).
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
  monthKey: '2024-12',
  coversFrom: null,
  entries: [
    {
      slug: 'iii-encuentro-jovenes-constitucion-diciembre-2024',
      kind: 'creup',
      startDate: '2024-12-03',
      endDate: '2024-12-07',
      location: null,
      image:
        '/transparencia/actividad/imagenes/iii-encuentro-jovenes-constitucion-diciembre-2024.webp',
      es: {
        title: 'III Encuentro de Jóvenes con la Constitución de 1978',
        excerpt:
          'Del 3 al 7 de diciembre, el Vocal de Política Universitaria Adrián García participó en la tercera edición del Encuentro de Jóvenes con la Constitución de 1978.',
        contentHtml:
          '<p>Del 3 al 7 de diciembre, Adrián García, nuestro Vocal de Política Universitaria, formó parte de la tercera edición de un programa impulsado por el Secretario de Estado de Relaciones con las Cortes y Asuntos Constitucionales, en colaboración con el Consejo de la Juventud de España y la Federación Española de Municipios y Provincias.</p><p>Esta iniciativa reunió a 25 jóvenes de entre 18 y 20 años provenientes de distintos puntos de España con motivo de la celebración del Día de la Constitución. Durante la semana, los participantes visitaron algunas de las instituciones más emblemáticas del país, como el Palacio de La Moncloa, el Congreso de los Diputados, el Senado, el Tribunal Constitucional y el Consejo General del Poder Judicial.</p><p>El recorrido contó con la participación de figuras clave de la política nacional, entre ellas Félix Bolaños García, ministro de la Presidencia, Relaciones con las Cortes y Memoria Democrática; Francesca Lluc Armengol, presidenta del Congreso de los Diputados; Ángel Gabilondo Pujol, Defensor del Pueblo; Eva Ortiz Vilella, senadora; y Rafael Simancas Simancas, secretario general del Congreso.</p><p>El programa se consolidó como una oportunidad única para acercar a los jóvenes a las instituciones y fomentar su implicación en los valores democráticos y constitucionales de España.</p>',
        alt: 'Foto de grupo de los participantes en el III Encuentro de Jóvenes con la Constitución de 1978.',
      },
    },
    {
      slug: 'jornadas-hablamos-universidad-bien-comun-negocio-diciembre-2024',
      kind: 'creup',
      startDate: '2024-12-09',
      location: 'Congreso de los Diputados',
      image:
        '/transparencia/actividad/imagenes/jornadas-hablamos-universidad-bien-comun-negocio-diciembre-2024.webp',
      es: {
        title: 'Jornadas «Hablamos de Universidad: bien común o negocio»',
        excerpt:
          'El 9 de diciembre, el Secretario Ejecutivo César González participó en las jornadas «Hablamos de Universidad: bien común o negocio» en el Congreso de los Diputados.',
        contentHtml:
          '<p>El pasado 9 de diciembre, César González, Secretario Ejecutivo de CREUP, participó en unas jornadas organizadas por el Grupo Parlamentario Plurinacional Sumar e Izquierda Unida en el Congreso de los Diputados. El evento reunió a expertos, representantes académicos y políticos para analizar los desafíos más urgentes que enfrenta el sistema universitario en España.</p><p>Durante las sesiones, se debatieron en profundidad las problemáticas relacionadas con la financiación universitaria, identificada como uno de los principales obstáculos para garantizar la calidad educativa y la igualdad de oportunidades. Asimismo, se reflexionó sobre el modelo que debería adoptar la universidad del futuro, planteando la necesidad de reformar las estructuras actuales para adaptarlas a las demandas sociales, económicas y tecnológicas de los próximos años.</p>',
        alt: 'César González, Secretario Ejecutivo de CREUP, interviene en el atril del Congreso de los Diputados.',
      },
    },
    {
      slug: 'reunion-creup-crue-diciembre-2024',
      kind: 'creup',
      startDate: '2024-12-16',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/reunion-creup-crue-diciembre-2024.webp',
      es: {
        title: 'Reunión CREUP - CRUE',
        excerpt:
          'El 16 de diciembre, el presidente de CREUP y el vicepresidente de Política Universitaria se reunieron con representantes de la CRUE.',
        contentHtml:
          '<p>El pasado 16 de diciembre, el presidente de la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP), Alfonso Campuzano, y el vicepresidente de Política Universitaria, Jorge Lahoz, mantuvieron una reunión con representantes de la Conferencia de Rectores de Universidades Españolas (CRUE).</p><p>Durante el encuentro, ambas entidades compartieron sus principales preocupaciones y buscaron puntos en común para reforzar su incidencia ante el Ministerio de Universidades.</p><p>Entre los temas tratados destacaron las becas, el Estatuto del Estudiante, la reforma de los Reales Decretos 822/2021 y 640/2021, la creación de nuevos grupos de trabajo, la financiación universitaria, el acceso de estudiantes extranjeros al Sistema Universitario Español (SUE), la salud mental, la soberanía digital de las universidades públicas y la implementación de oficinas de sostenibilidad en los campus.</p><p>Esta reunión no solo sirvió para reforzar los canales de comunicación entre estudiantes y rectores, sino también para sentar las bases de futuras colaboraciones que permitan avanzar en soluciones concretas a los desafíos actuales. Ambas partes destacaron la importancia de una agenda conjunta para garantizar que las universidades españolas sean espacios inclusivos, sostenibles y adaptados a las necesidades del alumnado y del personal académico.</p>',
        alt: 'Mosaico de la videollamada de la reunión entre CREUP y la CRUE.',
      },
    },
    {
      slug: 'iii-gala-navidad-ceuah-diciembre-2024',
      kind: 'creup',
      startDate: '2024-12-13',
      location: 'Universidad de Alcalá',
      image: '/transparencia/actividad/imagenes/iii-gala-navidad-ceuah-diciembre-2024.webp',
      es: {
        title: 'CREUP asiste a la III Gala de Navidad de la CEUAH',
        excerpt:
          'El 13 de diciembre, el Vicepresidente de Relaciones Institucionales asistió a la III Gala de Navidad del Consejo de Estudiantes de la Universidad de Alcalá.',
        contentHtml:
          '<p>El pasado 13 de diciembre tuvo lugar la III Gala de Navidad del Consejo de Estudiantes de la Universidad de Alcalá, un evento diseñado para destacar y reconocer la destacada labor del estudiantado en su compromiso con la comunidad universitaria.</p><p>La gala, que se ha consolidado como una cita significativa en el calendario estudiantil, contó con la presencia de Nicolás Pingarrón, Vicepresidente de Relaciones Institucionales de CREUP, quien participó activamente en la celebración y mostró su apoyo al esfuerzo y dedicación del estudiantado.</p>',
        alt: 'Nicolás Pingarrón, Vicepresidente de Relaciones Institucionales de CREUP, en la III Gala de Navidad del Consejo de Estudiantes de la Universidad de Alcalá.',
      },
    },
    {
      slug: 'grupo-trabajo-1-financiacion-diciembre-2024',
      kind: 'creup',
      startDate: '2024-12-18',
      location: null,
      image: '/transparencia/actividad/imagenes/grupo-trabajo-1-financiacion-diciembre-2024.webp',
      es: {
        title: 'CREUP participa en el Grupo de Trabajo 1% Financiación',
        excerpt:
          'El 18 de diciembre, el Vicepresidente de Relaciones Institucionales asistió a la segunda sesión del grupo de trabajo que busca alcanzar el 1% del PIB en financiación universitaria.',
        contentHtml:
          '<p>El pasado 18 de diciembre se celebró la segunda sesión del grupo de trabajo que busca alcanzar el 1% del PIB en financiación para las universidades españolas. En el encuentro, al que asistió Nicolás Pingarrón, vicepresidente de Relaciones Institucionales de la Coordinadora de Representantes de Universidades Públicas (CREUP), los estudiantes compartieron espacio con representantes del Gobierno, rectores, sindicatos y otros colectivos clave.</p><p>Durante la jornada, se abordaron las diferentes perspectivas en torno al desafío financiero y se trazaron las bases para el trabajo conjunto que permita alcanzar esta meta. La participación activa de los estudiantes refuerza su compromiso por una financiación más justa y sostenible para la educación superior en España.</p>',
        alt: 'Sesión del grupo de trabajo del 1% de financiación universitaria, reunida en torno a una mesa en una sala del Ministerio.',
      },
    },
    {
      slug: 'creup-la-sexta-xplica-diciembre-2024',
      kind: 'creup',
      startDate: '2024-12-14',
      endDate: '2024-12-21',
      image: '/transparencia/actividad/imagenes/creup-la-sexta-xplica-diciembre-2024.webp',
      es: {
        title: 'CREUP participa en «La Sexta Xplica»',
        excerpt:
          'Los días 14 y 21 de diciembre, los estudiantes Gabriel Suárez y Nicolás Pingarrón participaron como invitados en el programa «La Sexta Xplica».',
        contentHtml:
          '<p>Los días 14 y 21 de diciembre, los estudiantes universitarios Gabriel Suárez y Nicolás Pingarrón participaron como invitados en el programa La Sexta Xplica, respectivamente, donde abordaron temas sociales de gran relevancia para la juventud.</p><p>En el caso de Gabriel, dio voz al estudiantado universitario exponiendo las dificultades que enfrentan ante la escasez de vivienda y el incremento de los precios del alquiler, una problemática que afecta especialmente a los jóvenes y estudiantes en grandes ciudades.</p><p>Por otro lado, Nicolás intervino en el programa donde se trató el impacto en la Educación de la subida de impuestos implementada, haciendo hincapié en la importancia de mantener una financiación justa en nuestras universidades.</p>',
        alt: 'Nicolás Pingarrón, Vicepresidente de CREUP, interviene en el plató del programa «La Sexta Xplica».',
      },
    },
    {
      slug: 'xxvi-aget-creup-diciembre-2024',
      kind: 'creup',
      startDate: '2024-12-18',
      isOnline: true,
      location: null,
      image: '/transparencia/actividad/imagenes/xxvi-aget-creup-diciembre-2024.webp',
      es: {
        title: 'XXVI AGET de CREUP',
        excerpt:
          'El 18 de diciembre, CREUP celebró su XXVI Asamblea General Extraordinaria Telemática, centrada en los aspectos económicos y la incorporación de la Universidad de Málaga.',
        contentHtml:
          '<p>El pasado 18 de diciembre, la Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) celebró su XXVI Asamblea General Extraordinaria, desarrollada de manera telemática y con la participación de representantes estudiantiles de universidades públicas de toda España.</p><p>La sesión estuvo marcada por un enfoque prioritario en los aspectos económicos que afectan a la Coordinadora, con la exposición detallada del estado financiero de la Coordinadora, así como la planificación de los recursos para los proyectos previstos en el próximo año.</p><p>Los delegados discutieron las estrategias de sostenibilidad económica y se revisaron propuestas para mejorar la eficiencia en la gestión de los fondos de CREUP, destacando el compromiso con la transparencia y la rendición de cuentas.</p><p>Además, uno de los momentos más relevantes de la asamblea fue la aprobación oficial de la incorporación de la Universidad de Málaga como nuevo miembro de la Coordinadora.</p>',
        alt: 'Mosaico de la videollamada de la XXVI Asamblea General Extraordinaria Telemática de CREUP.',
      },
    },
    {
      slug: 'movilizacion-financiacion-comunidad-madrid-diciembre-2024',
      kind: 'member',
      startDate: '2024-12-05',
      endDate: '2024-12-19',
      location: 'Asamblea de Madrid',
      memberOrgKey: 'DCEUCM',
      image:
        '/transparencia/actividad/imagenes/movilizacion-financiacion-comunidad-madrid-diciembre-2024.webp',
      es: {
        title:
          'Movilización del estudiantado ante la falta de financiación en la Comunidad de Madrid',
        excerpt:
          'Los días 5 y 19 de diciembre, centenares de estudiantes se movilizaron frente a la Asamblea de Madrid para denunciar la falta de financiación a las universidades públicas madrileñas.',
        contentHtml:
          '<p>Centenares de estudiantes se movilizaron los pasados 5 y 19 de diciembre de 2024 frente a la Asamblea de Madrid para denunciar la falta de financiación por parte de la Comunidad de Madrid a las universidades públicas. Las convocatorias, organizadas por sindicatos, las Plataformas de Universidades por la Pública y la Delegación de Estudiantes, se llevaron a cabo durante las sesiones plenarias en las que se debatieron y aprobaron las enmiendas a la totalidad del proyecto de ley de Presupuestos de la Comunidad de Madrid para 2025.</p><p>Desde la crisis de 2008, las universidades públicas madrileñas han experimentado un abandono progresivo debido a una financiación insuficiente por parte del Gobierno regional. Esta infrafinanciación acumulada, sumada a los escasos recursos destinados a estas instituciones en el proyecto de presupuestos para el próximo año, pone en riesgo su viabilidad económica y la calidad del servicio que ofrecen.</p><p>El borrador de presupuestos para 2025 asigna 1.052 millones de euros a todas las universidades públicas, lo que supone un incremento del 0,9% respecto al año anterior. Sin embargo, esta financiación es insuficiente para cubrir los costes derivados de la Ley Orgánica del Sistema Universitario (LOSU), el aumento de los costes salariales, y el encarecimiento de la energía y otros servicios.</p><p>La Conferencia de Rectores de las Universidades Madrileñas (CRUMA) advirtió que se necesitan 200 millones de euros adicionales para garantizar el mantenimiento del servicio actual. Sin embargo, tras una reunión celebrada el 3 de diciembre con los rectores, la Comunidad de Madrid ofreció una ayuda de solo 47 millones de euros, una cifra considerada insuficiente y que evidenció la falta de compromiso con la universidad pública.</p><p>El sistema universitario madrileño, que acoge a cerca de 220.000 estudiantes, es uno de los más grandes de España. A pesar de que la Comunidad de Madrid cuenta con un PIB per cápita un 36,5% superior a la media nacional, destina un 21% menos por estudiante que la media del país. Esta situación, ya preocupante, podría derivar en una crisis catastrófica en los próximos años si no se toman medidas.</p><p>Los estudiantes madrileños exigen una financiación adecuada que valore el papel esencial de la universidad pública en la sociedad y garantice su sostenibilidad.</p>',
        alt: 'Concentración de estudiantes con banderas frente a la Asamblea de Madrid en protesta por la falta de financiación universitaria.',
      },
    },
  ],
  areaReports: [
    {
      area: PREVIOUS_AREAS.PRESIDENCIA,
      image: '/transparencia/informes-areas/imagenes/informe-presidencia-diciembre-2024.webp',
      es: {
        contentHtml:
          '<p>El área de Presidencia concluye el mes de diciembre con importantes avances en diversas iniciativas y evaluaciones internas. Durante este periodo, se llevó a cabo un análisis exhaustivo del primer periodo interasambleario y de la propia asamblea, con el objetivo de identificar fortalezas y áreas de mejora en los procesos desarrollados.</p><p>Entre los proyectos destacados, se inició ODSesionad@s, en colaboración con la Universidad de Murcia, una iniciativa enfocada en la implementación de los Objetivos de Desarrollo Sostenible (ODS) que tendrá su fase presencial en febrero. Asimismo, se cerraron las formaciones programadas con FONCE, consolidando el plan formativo previsto.</p><p>En el ámbito internacional, se dio la bienvenida a los nuevos integrantes del Comité de Asuntos Internacionales (CAI), quienes sostuvieron reuniones para planificar acciones futuras tras el reciente Board Meeting.</p><p>Por último, se prestó apoyo al desarrollo del Encuentro de Representantes, un evento que contará con sesiones dedicadas a promover la cooperación y la implicación universitaria en diversos asuntos sociales, reforzando el compromiso del área con la incidencia en temáticas de relevancia global.</p>',
        alt: 'Equipo del área de Presidencia de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.RRII,
      image: null,
      es: {
        contentHtml:
          '<p>La Vicepresidencia de Relaciones Institucionales y Proyectos ha comenzado el mes con la reestructuración de su área, dando continuidad a las labores realizadas anteriormente. Entre las actividades destacadas, se asistió a la Gala de Navidad organizada por el Consejo de la Universidad de Alcalá, un evento clave en el ámbito académico.</p><p>Además, se participó en la Comisión del Ministerio para abordar la financiación del 1% destinada a las universidades públicas, un tema crucial para el sostenimiento y desarrollo del sistema universitario. En el ámbito mediático, se realizó una intervención en el programa La Sexta Xplica, donde se discutieron problemáticas relacionadas con la educación superior.</p><p>Por otro lado, se avanzó en el análisis del anteproyecto de ley del Estatuto del Becario, una medida que busca regularizar las condiciones de los estudiantes en prácticas. En esta línea, se llevaron a cabo reuniones con el CEUNE para trabajar en las actualizaciones del Estatuto del Estudiante Universitario.</p><p>Finalmente, se celebró una reunión de coordinación con el área de Presidencia y la Vicepresidencia de Política Universitaria, con el objetivo de alinear estrategias y planificar el trabajo para los próximos meses.</p>',
        alt: null,
      },
    },
    {
      area: PREVIOUS_AREAS.SECRETARIA,
      image: '/transparencia/informes-areas/imagenes/informe-secretaria-diciembre-2024.webp',
      es: {
        contentHtml:
          '<p>La Secretaría de CREUP ha tramitado la inscripción de los nuevos estatutos en el Registro de Asociaciones del Ministerio del Interior, además de actualizar la sede fiscal ante la Agencia Tributaria. Estas gestiones buscan reforzar la estructura organizativa de la asociación.</p><p>En paralelo, se han modificado el convenio de sedes y el convenio marco de sectoriales, con el objetivo de mejorar técnicamente ambos documentos y adaptarlos a las necesidades actuales de la organización.</p><p>En el ámbito institucional, el Secretario Ejecutivo, en colaboración con el área de Relaciones Institucionales, participó en la reunión de la Comisión Permanente del Consejo de Estudiantes Universitario del Estado (CEUNE), representando a CREUP. Además, asistió a las jornadas «Hablemos de Universidad. Bien común o negocio», celebradas en el Congreso de los Diputados, reforzando el papel de CREUP en el debate sobre el futuro de la educación superior en España.</p>',
        alt: 'Equipo del área de Secretaría de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.POLITICA,
      image:
        '/transparencia/informes-areas/imagenes/informe-politica-universitaria-diciembre-2024.webp',
      es: {
        contentHtml:
          '<p>Desde la Vicepresidencia de Política Universitaria y Asistencia a los CCEE del Consejo de la Juventud de España (CJE), se ha llevado a cabo una participación activa en el grupo de prioridades estratégicas. Durante este período, se ha realizado una reunión de análisis del área de Política Universitaria, donde se discutieron nuevas líneas y métodos de trabajo.</p><p>Además, se ha coordinado estrechamente con la nueva Vicepresidencia de Relaciones Internacionales para fortalecer la colaboración institucional. Esta labor también incluyó la definición de mesas y talleres para el Encuentro, donde se abordaron diversas temáticas clave para el futuro del sistema universitario.</p><p>En paralelo, se ha trabajado en el análisis y planificación de nuevos Grupos de Trabajo (GTs) que impulsarán proyectos innovadores. Finalmente, se celebró una reunión con la Presidenta de la Conferencia de Rectores de Universidades Españolas (CRUE) el 16 de diciembre, en la que se trataron cuestiones fundamentales para el desarrollo y la mejora de la educación superior en España.</p>',
        alt: 'Equipo del área de Política Universitaria de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.ORGANIZACION,
      image: '/transparencia/informes-areas/imagenes/informe-organizacion-diciembre-2024.webp',
      es: {
        contentHtml:
          '<p>El área de Organización ha mantenido reuniones con las sedes del VI Congreso CREUP-CRUE y el XIV Encuentro, que se celebrarán en Madrid con la colaboración de la Universidad de Alcalá y la Universidad Autónoma de Madrid. Estos encuentros han permitido establecer un canal de comunicación directo con las universidades organizadoras, coordinar esfuerzos y definir las bases del evento, que será un punto de referencia para la representación estudiantil universitaria.</p><p>Además, se realizaron reuniones con la sede de la 77ª Asamblea General Ordinaria, que tendrá lugar en Sevilla, con el objetivo de garantizar una adecuada coordinación y dar seguimiento a los preparativos de este importante encuentro.</p><p>Por otro lado, el área trabaja activamente en la planificación de la próxima Comisión Ejecutiva Ampliada (CEA) presencial, programada para el siguiente cuatrimestre, lo que reafirma su compromiso con el fortalecimiento de la organización y la participación estudiantil a nivel nacional.</p>',
        alt: 'Equipo del área de Organización de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.COMUNICACION,
      image: '/transparencia/informes-areas/imagenes/informe-comunicacion-diciembre-2024.webp',
      es: {
        contentHtml:
          '<p>El área de Comunicación de la Coordinadora de Representantes de Universidades Públicas (CREUP) ha desarrollado diversas iniciativas durante este mes para reforzar su presencia y mejorar su estrategia comunicativa.</p><p>El vocal de diseño de contenido, Gabriel Suárez González, participó en el programa La Sexta Xplica, donde representó a la organización en un debate sobre la vivienda estudiantil en España.</p><p>Además, se ha trabajado intensamente en la creación de la identidad visual y la estética del VI Encuentro CREUP-CRUE, un evento que se celebrará próximamente en las universidades de Alcalá y la Autónoma de Madrid. Este encuentro reunirá a representantes de estudiantes y rectores para abordar retos comunes en el ámbito de la educación superior.</p><p>Por último, se ha avanzado en el desarrollo de la campaña «Mente del Estudiante», una iniciativa enfocada en visibilizar y reflexionar sobre los desafíos psicológicos que enfrentan los/as universitarios/as en su día a día. La campaña busca promover el bienestar mental y emocional entre el estudiantado de todo el país.</p>',
        alt: 'Equipo de la Dirección de Comunicación de CREUP.',
      },
    },
    {
      area: PREVIOUS_AREAS.TESORERIA,
      image: null,
      es: {
        contentHtml:
          '<p>La actividad en el área de tesorería de CREUP se ha intensificado este mes debido al cierre del ejercicio económico de la asociación. Entre las tareas realizadas, se destaca la finalización de la facturación de la 76ª AGO y la revisión de todo el ejercicio económico, con especial atención a la resolución de expedientes problemáticos.</p><p>Además, se avanzó en la recuperación de deudas pendientes de algunos MOREs y sectoriales, logrando, entre otros hitos, el pago de parte de la deuda histórica que mantenía la Universidad Pablo de Olavide (UPO) desde hace varios años. Aunque el balance general es positivo, se reconoce que aún queda trabajo por hacer en este ámbito.</p><p>En paralelo, se ha trabajado en la redacción y firma de diversos convenios. Este mes se concretó el acuerdo con FONCE para el XI Stage Formativo y se avanzó en la preparación de convenios con las sedes del VI Congreso CREUP-CRUE y del XIII Encuentro de Representantes, previstos para febrero. Asimismo, se inició la redacción de un convenio específico con CRUE para este evento y se comenzaron a plantear mejoras de cara al convenio con la sede de la 77ª AGO.</p><p>En relación con los eventos, se completaron los pagos pendientes de la 76ª AGO a cargo de CREUP y se mantuvo una comunicación constante con las futuras sedes para asegurar el buen desarrollo de las actividades programadas.</p><p>Por otro lado, el mes culminó con la celebración de la 26ª Asamblea General Extraordinaria de Tesorería (AGET), centrada principalmente en temas económicos. Durante las semanas previas, se ultimaron diversos documentos clave, como informes económicos de eventos y del ejercicio 2023, el sistema de cuotas para 2024 y los presupuestos de 2025. La documentación presentada fue bien recibida por los miembros de CREUP, lo que refuerza el rumbo estratégico de la asociación para los próximos meses.</p><p>En conjunto, diciembre ha sido un mes de intenso trabajo y avances significativos en la gestión económica y en la planificación de futuros proyectos de CREUP.</p>',
        alt: null,
      },
    },
  ],
}

export default month
