/**
 * November 2025 "Actividad" seed module, migrated from the discontinued monthly newsletter PDF
 * (public/prensa/newsletter/documentos/newsletter-2025-11.pdf).
 *
 * Spanish-only on purpose: parents + the `es` translation are seeded; the other five locales are
 * backfilled later (same staged approach the press seed uses). Inserted idempotently by the
 * aggregator (./index.ts → drizzle/seed/content.ts) on the natural keys, so re-running is safe.
 *
 * Mandate: this edition belongs to the previous org chart → PREVIOUS_AREAS.
 * This newsletter shipped no "Informe mensual de áreas" section → areaReports is empty.
 */
import type { SeedNewsletterMonth } from './types'

const month: SeedNewsletterMonth = {
  monthKey: '2025-11',
  coversFrom: null,
  entries: [
    {
      slug: '78-asamblea-general-ordinaria-barcelona-noviembre-2025',
      kind: 'creup',
      startDate: '2025-11-04',
      endDate: '2025-11-08',
      location: 'Universitat de Barcelona',
      image:
        '/transparencia/actividad/imagenes/78-asamblea-general-ordinaria-barcelona-noviembre-2025.webp',
      es: {
        title: 'CREUP celebra su 78ª Asamblea General Ordinaria en Barcelona',
        excerpt:
          'Entre el 4 y el 8 de noviembre, la Universitat de Barcelona acogió la 78ª AGO de CREUP y la elección de su nueva Comisión Ejecutiva.',
        contentHtml:
          '<p>Entre los días 4 y 8 de noviembre, la Universitat de Barcelona acogió la 78ª Asamblea General Ordinaria de CREUP, un encuentro clave que reunió a los máximos órganos de representación estudiantiles de todo el Estado para debatir, consensuar y marcar el rumbo político y organizativo de la coordinadora para los próximos meses.</p><p>Durante esta Asamblea, se aprobaron nuevos posicionamientos y resoluciones en materia educativa, orientados a reforzar la defensa de los derechos del estudiantado y mejorar la calidad del sistema universitario. También se aprobaron resoluciones de carácter social, entre las que destacó la relativa al reconocimiento de Palestina, reflejo del compromiso del estudiantado con la justicia global y la defensa de los derechos humanos.</p><p>Uno de los momentos más relevantes del encuentro fue la elección de la nueva Comisión Ejecutiva, que asumirá la dirección de CREUP durante el próximo año y medio. La nueva Ejecutiva estará liderada por Alfonso Campuzano, estudiante de posgrado de la Universidad de Granada, quien, junto a su equipo, trabajará para seguir fortaleciendo la representación estudiantil, impulsar políticas universitarias más justas y consolidar la participación activa del estudiantado en la vida académica.</p><p>La 78ª Asamblea deja tras de sí una hoja de ruta renovada, un equipo motivado y un compromiso firme con la mejora de la universidad pública.</p>',
        alt: 'Sesión de trabajo de la 78ª Asamblea General Ordinaria de CREUP en la Universitat de Barcelona.',
      },
    },
    {
      slug: '29-asamblea-general-extraordinaria-telematica-noviembre-2025',
      kind: 'creup',
      startDate: '2025-11-21',
      isOnline: true,
      location: null,
      image:
        '/transparencia/actividad/imagenes/29-asamblea-general-extraordinaria-telematica-noviembre-2025.webp',
      es: {
        title: '29ª Asamblea General Extraordinaria Telemática (AGET)',
        excerpt:
          'El 21 de noviembre se celebró la 29ª AGET de CREUP, centrada en la ratificación del acta de acuerdos de la última AGO.',
        contentHtml:
          '<p>El pasado 21 de noviembre tuvo lugar la 29ª Asamblea General Extraordinaria Telemática (AGET) de CREUP. La sesión estuvo centrada exclusivamente en la ratificación del acta de acuerdos de la última Asamblea General Ordinaria (AGO).</p><p>Durante la reunión, se presentó la dimisión del actual tesorero de la Asociación, motivada por cuestiones relacionadas con la transparencia. Asimismo, no se registraron intervenciones en el turno de ruegos y preguntas.</p>',
        alt: 'Mosaico de la videollamada de la 29ª Asamblea General Extraordinaria Telemática de CREUP.',
      },
    },
    {
      slug: 'acto-apertura-nacional-curso-universitat-valencia-noviembre-2025',
      kind: 'creup',
      startDate: '2025-11-25',
      location: 'Universitat de València',
      image:
        '/transparencia/actividad/imagenes/acto-apertura-nacional-curso-universitat-valencia-noviembre-2025.webp',
      es: {
        title:
          'CREUP asiste al Acto de Apertura Nacional del curso 2025-2026 en la Universitat de València',
        excerpt:
          'El 25 de noviembre, la Vicepresidenta de Política Universitaria asistió al Acto de Apertura Nacional del curso, presidido por Su Majestad el Rey.',
        contentHtml:
          '<p>El pasado 25 de noviembre, la Vicepresidenta de Política Universitaria de CREUP asistió al Acto de Apertura Nacional del Curso 2025-2026 de las Universidades Españolas, celebrado en la Universitat de València.</p><p>El evento, presidido por Su Majestad el Rey, inauguró oficialmente el nuevo curso académico. La sesión contó con una lección magistral a cargo de la Dra. María Elena Olmos, que abrió el acto con una reflexión académica de alto nivel.</p><p>También intervinieron María Vicenta Mestre, rectora de la Universitat de València; Eva Alcón, presidenta de CRUE; Diana Morant, ministra de Universidades; y Su Majestad el Rey, quienes compartieron sus visiones sobre los retos y oportunidades del sistema universitario en el inicio de este nuevo curso académico.</p><p>El acto puso de relieve los desafíos actuales del sistema universitario y reafirmó el compromiso con una universidad pública de calidad, inclusiva y orientada al progreso social.</p>',
        alt: 'La Vicepresidenta de Política Universitaria de CREUP en el Acto de Apertura Nacional del Curso en la Universitat de València.',
      },
    },
    {
      slug: 'encuentro-asociacionismo-democracia-cje-noviembre-2025',
      kind: 'creup',
      startDate: '2025-11-28',
      endDate: '2025-11-30',
      image:
        '/transparencia/actividad/imagenes/encuentro-asociacionismo-democracia-cje-noviembre-2025.webp',
      es: {
        title:
          'CREUP participa en el Encuentro de Asociacionismo y Democracia del Consejo de la Juventud de España',
        excerpt:
          'Entre el 28 y el 30 de noviembre, el Presidente y la Vicepresidenta de Comunicación participaron en el Encuentro de Asociacionismo y Democracia del CJE.',
        contentHtml:
          '<p>Entre los días 28 y 30 de noviembre, el Presidente y la Vicepresidenta de Comunicación y Difusión de CREUP participaron en el Encuentro de Asociacionismo y Democracia organizado por el Consejo de la Juventud de España (CJE).</p><p>Este espacio permitió compartir reflexiones y experiencias con diversas entidades juveniles de todo el país, generando un diálogo enriquecedor en torno a la participación juvenil, la política y el fortalecimiento de la democracia.</p><p>A lo largo del encuentro, se analizaron los retos actuales del movimiento asociativo y se exploraron vías para impulsar una mayor implicación de la juventud en los procesos democráticos y en la vida pública.</p>',
        alt: 'Representantes de CREUP en el Encuentro de Asociacionismo y Democracia del Consejo de la Juventud de España.',
      },
    },
    {
      slug: 'movilizacion-ley-ordenacion-profesionales-deporte-noviembre-2025',
      kind: 'creup',
      startDate: '2025-11-24',
      image:
        '/transparencia/actividad/imagenes/movilizacion-ley-ordenacion-profesionales-deporte-noviembre-2025.webp',
      es: {
        title:
          'Movilización histórica: más de 45 universidades exigen una Ley Estatal de Ordenación de los Profesionales del Deporte',
        excerpt:
          'El 24 de noviembre, más de 4.500 estudiantes participaron en la Sentada Nacional de CCAFD para exigir una Ley Estatal de Ordenación de los Profesionales del Deporte.',
        contentHtml:
          '<p>Más de 4.500 estudiantes y cerca de 6.000 personas participaron este lunes 24 de noviembre en la Sentada Nacional de CCAFD, una movilización simultánea en 45 universidades de 14 comunidades autónomas, organizada por la ANECAFYDE. La acción, pacífica y coordinada, se desarrolló en espacios visibles de las facultades, donde el estudiantado acudió vestido de verde, portando pancartas bajo el mensaje común: «Ordenación de los Profesionales del Deporte YA».</p><p>El objetivo ha sido visibilizar la situación crítica ante la ausencia de una Ley Estatal de Ordenación de las Profesiones del Deporte, un mandato legal pendiente que genera inseguridad jurídica, desigualdad territorial, intrusismo, precariedad laboral y una progresiva devaluación del Grado en CCAFD.</p><p>La movilización contó con el respaldo del Consejo COLEF, numerosos COLEF autonómicos, decanatos universitarios, profesorado y profesionales del sector, convirtiéndose en la mayor acción conjunta del estudiantado de CCAFD en la última década. «Ordenar la profesión no es un privilegio, sino una necesidad para garantizar la calidad y seguridad de los servicios físico-deportivos que recibe la ciudadanía».</p>',
        alt: 'Estudiantado de CCAFD durante la Sentada Nacional en defensa de una Ley Estatal de Ordenación de los Profesionales del Deporte.',
      },
    },
    {
      slug: 'siueh-vii-asamblea-general-ordinaria-jaen-noviembre-2025',
      kind: 'member',
      startDate: '2025-11-20',
      endDate: '2025-11-23',
      location: 'Jaén',
      memberOrgKey: 'SIUEH',
      image:
        '/transparencia/actividad/imagenes/siueh-vii-asamblea-general-ordinaria-jaen-noviembre-2025.webp',
      es: {
        title: 'SIUEH celebra su VII Asamblea General Ordinaria en Jaén',
        excerpt:
          'Entre el 20 y el 23 de noviembre, la Sectorial Interuniversitaria de Estudiantes de Humanidades reunió en Jaén a representantes de distintas universidades.',
        contentHtml:
          '<p>La Sectorial Interuniversitaria de Estudiantes de Humanidades celebró su VII Asamblea General Ordinaria en Jaén entre los días 20 y 23 de noviembre, reuniendo a representantes de distintas universidades para analizar los retos actuales del ámbito humanístico y definir líneas de acción comunes. Durante las jornadas se abordaron cuestiones de especial relevancia para el sistema universitario.</p><p>Uno de los ejes centrales fue la reflexión sobre la memoria democrática y el papel que las humanidades deben desempeñar en su fortalecimiento: desde la formación del estudiantado hasta la investigación y la transferencia social del conocimiento. También se dedicó un espacio significativo al debate en torno a las menciones duales, su implantación práctica y las oportunidades y dificultades que presentan para los grados vinculados a las humanidades.</p><p>Asimismo, la Asamblea analizó con detenimiento cómo la LESUC (Ley de Enseñanzas Superiores, Universidades y Ciencia de la Comunidad de Madrid) puede afectar a la estructura y al futuro de las titulaciones humanísticas, planteando escenarios y estrategias para defender su calidad, su especificidad y su valor social. A esto se sumó un intercambio enriquecedor sobre la creciente precariedad laboral en el sector, un problema que impacta tanto al personal docente e investigador como a quienes se incorporan a la carrera académica.</p><p>Además, el encuentro incluyó la celebración de las elecciones a la nueva Junta Directiva, encabezada por Jonay Rodríguez, un equipo que expresó su firme compromiso y energías renovadas para continuar trabajando en defensa de las humanidades.</p>',
        alt: 'Foto de grupo de la VII Asamblea General Ordinaria de SIUEH en Jaén.',
      },
    },
  ],
  areaReports: [],
}

export default month
