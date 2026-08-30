import type { H3Event } from 'h3'
import { pickLocalizedValue } from '~~/shared/utils/locale'
import { getRequestLocaleContext } from './requestLocale'

/**
 * Locale-aware messages for admin API errors. Mirrors the public helper
 * (`getPublicApiErrorMessage`) but scoped to the admin surface. Grow this map as Phase 3 migrates
 * the remaining server-side admin strings.
 */
const es = {
  // Generic
  duplicateRecord: 'Ya existe un registro con esos datos',
  mutationFailed: 'Error al procesar la solicitud',
  invalidInput: 'Datos de entrada no válidos',
  internalError: 'Error interno del servidor',
  notFound: 'No encontrado',
  requestNotAllowed: 'Solicitud no permitida.',
  // Per-resource optimistic lock
  mediaOptimisticLock:
    'El medio fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.',
  linkOptimisticLock:
    'El enlace fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.',
  carouselOptimisticLock:
    'El elemento del carrusel fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.',
  equalityOptimisticLock:
    'El documento fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.',
  financialReportOptimisticLock:
    'El informe fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.',
  pressArticleOptimisticLock:
    'El artículo fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.',
  aboutOptimisticLock:
    'El contenido de Qué es CREUP fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.',
  tagOptimisticLock:
    'La etiqueta fue modificada por otro usuario. Recarga la página para ver los cambios más recientes.',
  pressDossierOptimisticLock:
    'El dossier de prensa fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.',
  siteDefaultImagesOptimisticLock:
    'Las imágenes por defecto fueron modificadas por otro usuario. Recarga la página para ver los cambios más recientes.',
  newsletterOptimisticLock:
    'La newsletter fue modificada por otro usuario. Recarga la página para ver los cambios más recientes.',
  mediaDeleteBlocked:
    'No se puede eliminar este medio porque está asignado a una o más apariciones en los medios.',
  smtpIncomplete:
    'La configuración SMTP es incompleta. Configura el servidor SMTP antes de enviar newsletters.',
  smtpConnectionFailed:
    'No se puede conectar al servidor de correo. Verifica la configuración SMTP antes de enviar.',
  // Per-resource create/update failures
  pressArticleCreateFailed: 'Error al crear el artículo',
  pressArticleSlugFailed: 'No se pudo generar un slug único para el artículo',
  pressArticleTagsMissing:
    'Una o varias etiquetas seleccionadas ya no existen. Recarga la página e inténtalo de nuevo.',
  mediaCreateFailed: 'No se pudo crear el medio',
  mediaUpdateFailed: 'No se pudo actualizar el medio',
  linkCreateFailed: 'No se pudo crear el enlace',
  linkUpdateFailed: 'No se pudo actualizar el enlace',
  carouselCreateFailed: 'No se pudo crear el elemento del carrusel',
  carouselUpdateFailed: 'No se pudo actualizar el elemento del carrusel',
  equalityCreateFailed: 'No se pudo crear el documento de igualdad',
  equalityUpdateFailed: 'No se pudo actualizar el documento de igualdad',
  financialReportCreateFailed: 'No se pudo crear el informe económico',
  financialReportUpdateFailed: 'No se pudo actualizar el informe económico',
  activityCreateFailed: 'No se pudo crear la actividad',
  activityUpdateFailed: 'No se pudo actualizar la actividad',
  activitySlugFailed: 'No se pudo generar un slug único para la actividad',
  activityOptimisticLock:
    'La actividad fue modificada por otro usuario. Recarga la página para ver los cambios más recientes.',
  activityMemberOrgMissing:
    'La organización seleccionada ya no existe. Recarga la página e inténtalo de nuevo.',
  areaReportOverlap:
    'El periodo de la edición se solapa con el de otra. Ajusta el rango antes de guardar.',
  areaReportOptimisticLock:
    'El informe de área fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.',
  areaReportSaveFailed: 'No se pudo guardar el informe de área',
  areaReportAreaMissing:
    'El área seleccionada ya no existe en el organigrama. Recarga la página e inténtalo de nuevo.',
  // Area / member-org catalogs
  areaCatalogEntryOptimisticLock:
    'El área fue modificada por otro usuario. Recarga la página para ver los cambios más recientes.',
  memberOrgCatalogEntryOptimisticLock:
    'La organización fue modificada por otro usuario. Recarga la página para ver los cambios más recientes.',
  areaCatalogEntryDeleteBlocked:
    'No se puede eliminar esta área porque está asignada a uno o más informes de área.',
  memberOrgCatalogEntryDeleteBlocked:
    'No se puede eliminar esta organización porque está asignada a una o más actividades.',
  memberOrgCatalogSupersedeSourceMismatch:
    'Solo puedes marcar una organización como sustituida por otra del mismo tipo (asociado o sectorial).',
  memberOrgCatalogSupersedeSelfReference: 'Una organización no puede sustituirse a sí misma.',
  memberOrgCatalogEntrySupersededByReference:
    'No se puede eliminar esta organización porque otra organización la tiene marcada como sustituta. Quita esa referencia primero.',
  // Access
  accessNotFound: 'Acceso no encontrado',
  accessUpdateFailed: 'No se pudo actualizar el acceso',
  accessEmailRegistered: 'Ese correo ya está registrado en la lista de accesos.',
  accessEnvImmutable: 'No puedes modificar un acceso definido en el archivo de entorno.',
  accessNoActiveAdmins: 'No puedes dejar el panel sin administradores activos.',
  // Newsletter + subscribers
  newsletterCreateFailed: 'Error al crear la newsletter',
  newsletterNotSending: 'La newsletter no se está enviando en este momento',
  newsletterNotFound: 'Newsletter no encontrada',
  newsletterAlreadySent: 'La newsletter ya se ha enviado',
  newsletterAlreadySending: 'La newsletter ya se está enviando',
  newsletterCannotSend: 'No se puede enviar la newsletter',
  subscriberSaveFailed: 'No se pudo guardar el suscriptor',
  subscriberUpdateFailed: 'No se pudo actualizar el suscriptor',
  subscriberEmailRegistered: 'Este correo ya está registrado',
  // Jobs
  jobGone: 'El trabajo ya no existe.',
  jobNotFailed: 'El trabajo ya no estaba en estado fallido.',
  // About / press dossier / tags / images
  aboutSaveFailed: 'No se pudo guardar el contenido',
  pressDossierSaveFailed: 'No se pudo guardar el dossier',
  slotConfigInvalid: 'Configuración de slot no válida',
  tagNotFound: 'Etiqueta no encontrada',
  tagReserved: 'La etiqueta «Todas» es del sistema y no se puede editar ni eliminar.',
  requiredNameEs: 'El nombre en español es requerido',
  requiredTitleEs: 'El título en español es obligatorio',
  // Reorder
  reorderInvalidState: 'El estado actual no es válido para reordenar',
  reorderDuplicates: 'La lista contiene elementos duplicados',
  reorderMismatch:
    'La lista enviada no coincide con el estado actual. Recarga la página antes de reordenar.',
  // Assets / uploads
  assetFileNotFound: 'Archivo no encontrado',
  assetInvalidPath: 'La ruta del archivo no es válida',
  assetUnavailable: 'El archivo ya no está disponible',
  fileMissing: 'No se ha enviado ningún archivo',
  fileInvalid: 'Archivo no válido',
  fileTooLargeMb: 'El archivo supera el tamaño máximo ({mb}MB)',
  requestTooLarge: 'Solicitud demasiado grande',
  pdfInvalid: 'El PDF subido no es válido',
  svgForbidden: 'El SVG contiene elementos no permitidos',
  svgInvalid: 'El SVG subido no es válido',
  rasterImageInvalid: 'La imagen subida no es válida',
  formatNotAllowed: 'Formato no permitido. Formatos admitidos: {formats}',
  imageProcessFailed: 'La imagen subida no se ha podido procesar',
  filenameUnavailable: 'No se ha podido generar un nombre de archivo disponible',
} as const

export type AdminApiErrorMessageKey = keyof typeof es

const en: Record<AdminApiErrorMessageKey, string> = {
  // Generic
  duplicateRecord: 'A record with that data already exists',
  mutationFailed: 'The request could not be processed',
  invalidInput: 'Invalid input data',
  internalError: 'Internal server error',
  notFound: 'Not found',
  requestNotAllowed: 'Request not allowed.',
  // Per-resource optimistic lock
  mediaOptimisticLock:
    'The media outlet was modified by another user. Reload the page to see the most recent changes.',
  linkOptimisticLock:
    'The link was modified by another user. Reload the page to see the most recent changes.',
  carouselOptimisticLock:
    'The carousel item was modified by another user. Reload the page to see the most recent changes.',
  equalityOptimisticLock:
    'The document was modified by another user. Reload the page to see the most recent changes.',
  financialReportOptimisticLock:
    'The report was modified by another user. Reload the page to see the most recent changes.',
  pressArticleOptimisticLock:
    'The article was modified by another user. Reload the page to see the most recent changes.',
  aboutOptimisticLock:
    'The "What is CREUP" content was modified by another user. Reload the page to see the most recent changes.',
  tagOptimisticLock:
    'The tag was modified by another user. Reload the page to see the most recent changes.',
  pressDossierOptimisticLock:
    'The press kit was modified by another user. Reload the page to see the most recent changes.',
  siteDefaultImagesOptimisticLock:
    'The default images were modified by another user. Reload the page to see the most recent changes.',
  newsletterOptimisticLock:
    'The newsletter was modified by another user. Reload the page to see the most recent changes.',
  mediaDeleteBlocked:
    'This media outlet cannot be deleted because it is linked to one or more media appearances.',
  smtpIncomplete:
    'The SMTP configuration is incomplete. Configure the SMTP server before sending newsletters.',
  smtpConnectionFailed:
    'Cannot connect to the mail server. Check the SMTP configuration before sending.',
  // Per-resource create/update failures
  pressArticleCreateFailed: 'Could not create the article',
  pressArticleSlugFailed: 'Could not generate a unique slug for the article',
  pressArticleTagsMissing:
    'One or more selected tags no longer exist. Reload the page and try again.',
  mediaCreateFailed: 'Could not create the media outlet',
  mediaUpdateFailed: 'Could not update the media outlet',
  linkCreateFailed: 'Could not create the link',
  linkUpdateFailed: 'Could not update the link',
  carouselCreateFailed: 'Could not create the carousel item',
  carouselUpdateFailed: 'Could not update the carousel item',
  equalityCreateFailed: 'Could not create the equality document',
  equalityUpdateFailed: 'Could not update the equality document',
  financialReportCreateFailed: 'Could not create the financial report',
  financialReportUpdateFailed: 'Could not update the financial report',
  activityCreateFailed: 'Could not create the activity',
  activityUpdateFailed: 'Could not update the activity',
  activitySlugFailed: 'Could not generate a unique slug for the activity',
  activityOptimisticLock:
    'The activity was modified by another user. Reload the page to see the most recent changes.',
  activityMemberOrgMissing:
    'The selected organisation no longer exists. Reload the page and try again.',
  areaReportOverlap:
    "The edition's period overlaps another edition. Adjust the range before saving.",
  areaReportOptimisticLock:
    'The area report was modified by another user. Reload the page to see the most recent changes.',
  areaReportSaveFailed: 'Could not save the area report',
  areaReportAreaMissing:
    'The selected area no longer exists in the org chart. Reload the page and try again.',
  // Area / member-org catalogs
  areaCatalogEntryOptimisticLock:
    'The area was modified by another user. Reload the page to see the most recent changes.',
  memberOrgCatalogEntryOptimisticLock:
    'The organisation was modified by another user. Reload the page to see the most recent changes.',
  areaCatalogEntryDeleteBlocked:
    'This area cannot be deleted because it is assigned to one or more area reports.',
  memberOrgCatalogEntryDeleteBlocked:
    'This organisation cannot be deleted because it is assigned to one or more activities.',
  memberOrgCatalogSupersedeSourceMismatch:
    'You can only mark an organisation as superseded by another of the same type (asociado or sectorial).',
  memberOrgCatalogSupersedeSelfReference: 'An organisation cannot supersede itself.',
  memberOrgCatalogEntrySupersededByReference:
    'This organisation cannot be deleted because another organisation marks it as its replacement. Clear that reference first.',
  // Access
  accessNotFound: 'Access not found',
  accessUpdateFailed: 'Could not update the access',
  accessEmailRegistered: 'That email is already registered in the access list.',
  accessEnvImmutable: 'You cannot modify an access defined in the environment file.',
  accessNoActiveAdmins: 'You cannot leave the panel without active administrators.',
  // Newsletter + subscribers
  newsletterCreateFailed: 'Could not create the newsletter',
  newsletterNotSending: 'The newsletter is not being sent right now',
  newsletterNotFound: 'Newsletter not found',
  newsletterAlreadySent: 'The newsletter has already been sent',
  newsletterAlreadySending: 'The newsletter is already being sent',
  newsletterCannotSend: 'The newsletter cannot be sent',
  subscriberSaveFailed: 'Could not save the subscriber',
  subscriberUpdateFailed: 'Could not update the subscriber',
  subscriberEmailRegistered: 'This email is already registered',
  // Jobs
  jobGone: 'The job no longer exists.',
  jobNotFailed: 'The job was no longer in a failed state.',
  // About / press dossier / tags / images
  aboutSaveFailed: 'Could not save the content',
  pressDossierSaveFailed: 'Could not save the press kit',
  slotConfigInvalid: 'Invalid slot configuration',
  tagNotFound: 'Tag not found',
  tagReserved: 'The “All” tag is a system tag and cannot be edited or deleted.',
  requiredNameEs: 'The Spanish name is required',
  requiredTitleEs: 'The Spanish title is required',
  // Reorder
  reorderInvalidState: 'The current state is not valid for reordering',
  reorderDuplicates: 'The list contains duplicate items',
  reorderMismatch:
    'The submitted list does not match the current state. Reload the page before reordering.',
  // Assets / uploads
  assetFileNotFound: 'File not found',
  assetInvalidPath: 'Invalid file path',
  assetUnavailable: 'The file is no longer available',
  fileMissing: 'No file was uploaded',
  fileInvalid: 'Invalid file',
  fileTooLargeMb: 'The file exceeds the maximum size ({mb}MB)',
  requestTooLarge: 'The request is too large',
  pdfInvalid: 'The uploaded PDF is not valid',
  svgForbidden: 'The SVG contains disallowed elements',
  svgInvalid: 'The uploaded SVG is not valid',
  rasterImageInvalid: 'The uploaded image is not valid',
  formatNotAllowed: 'Format not allowed. Allowed formats: {formats}',
  imageProcessFailed: 'The uploaded image could not be processed',
  filenameUnavailable: 'Could not generate an available file name',
}

const ca: Record<AdminApiErrorMessageKey, string> = {
  // Generic
  duplicateRecord: 'Ja existeix un registre amb aquestes dades',
  mutationFailed: 'Error en processar la sol·licitud',
  invalidInput: "Dades d'entrada no vàlides",
  internalError: 'Error intern del servidor',
  notFound: "No s'ha trobat",
  requestNotAllowed: 'Sol·licitud no permesa.',
  // Per-resource optimistic lock
  mediaOptimisticLock:
    'El mitjà ha estat modificat per un altre usuari. Torna a carregar la pàgina per veure els canvis més recents.',
  linkOptimisticLock:
    "L'enllaç ha estat modificat per un altre usuari. Torna a carregar la pàgina per veure els canvis més recents.",
  carouselOptimisticLock:
    "L'element del carrusel ha estat modificat per un altre usuari. Torna a carregar la pàgina per veure els canvis més recents.",
  equalityOptimisticLock:
    'El document ha estat modificat per un altre usuari. Torna a carregar la pàgina per veure els canvis més recents.',
  financialReportOptimisticLock:
    "L'informe ha estat modificat per un altre usuari. Torna a carregar la pàgina per veure els canvis més recents.",
  pressArticleOptimisticLock:
    "L'article ha estat modificat per un altre usuari. Torna a carregar la pàgina per veure els canvis més recents.",
  aboutOptimisticLock:
    'El contingut de Què és CREUP ha estat modificat per un altre usuari. Torna a carregar la pàgina per veure els canvis més recents.',
  tagOptimisticLock:
    "L'etiqueta ha estat modificada per un altre usuari. Torna a carregar la pàgina per veure els canvis més recents.",
  pressDossierOptimisticLock:
    'El dossier de premsa ha estat modificat per un altre usuari. Torna a carregar la pàgina per veure els canvis més recents.',
  siteDefaultImagesOptimisticLock:
    'Les imatges per defecte han estat modificades per un altre usuari. Torna a carregar la pàgina per veure els canvis més recents.',
  newsletterOptimisticLock:
    'La newsletter ha estat modificada per un altre usuari. Torna a carregar la pàgina per veure els canvis més recents.',
  mediaDeleteBlocked:
    'No es pot eliminar aquest mitjà perquè està assignat a una o més aparicions als mitjans.',
  smtpIncomplete:
    "La configuració SMTP és incompleta. Configura el servidor SMTP abans d'enviar newsletters.",
  smtpConnectionFailed:
    "No es pot connectar al servidor de correu. Comprova la configuració SMTP abans d'enviar.",
  // Per-resource create/update failures
  pressArticleCreateFailed: "Error en crear l'article",
  pressArticleSlugFailed: "No s'ha pogut generar un slug únic per a l'article",
  pressArticleTagsMissing:
    'Una o més etiquetes seleccionades ja no existeixen. Torna a carregar la pàgina i torna-ho a provar.',
  mediaCreateFailed: "No s'ha pogut crear el mitjà",
  mediaUpdateFailed: "No s'ha pogut actualitzar el mitjà",
  linkCreateFailed: "No s'ha pogut crear l'enllaç",
  linkUpdateFailed: "No s'ha pogut actualitzar l'enllaç",
  carouselCreateFailed: "No s'ha pogut crear l'element del carrusel",
  carouselUpdateFailed: "No s'ha pogut actualitzar l'element del carrusel",
  equalityCreateFailed: "No s'ha pogut crear el document d'igualtat",
  equalityUpdateFailed: "No s'ha pogut actualitzar el document d'igualtat",
  financialReportCreateFailed: "No s'ha pogut crear l'informe econòmic",
  financialReportUpdateFailed: "No s'ha pogut actualitzar l'informe econòmic",
  activityCreateFailed: "No s'ha pogut crear l'activitat",
  activityUpdateFailed: "No s'ha pogut actualitzar l'activitat",
  activitySlugFailed: "No s'ha pogut generar un slug únic per a l'activitat",
  activityOptimisticLock:
    "L'activitat ha estat modificada per un altre usuari. Torna a carregar la pàgina per veure els canvis més recents.",
  activityMemberOrgMissing:
    "L'organització seleccionada ja no existeix. Torna a carregar la pàgina i torna-ho a provar.",
  areaReportOverlap:
    "El període de l'edició se solapa amb el d'una altra. Ajusta el rang abans de desar.",
  areaReportOptimisticLock:
    "L'informe d'àrea ha estat modificat per un altre usuari. Torna a carregar la pàgina per veure els canvis més recents.",
  areaReportSaveFailed: "No s'ha pogut desar l'informe d'àrea",
  areaReportAreaMissing:
    "L'àrea seleccionada ja no existeix a l'organigrama. Torna a carregar la pàgina i torna-ho a provar.",
  // Area / member-org catalogs
  areaCatalogEntryOptimisticLock:
    "L'àrea ha estat modificada per un altre usuari. Torna a carregar la pàgina per veure els canvis més recents.",
  memberOrgCatalogEntryOptimisticLock:
    "L'organització ha estat modificada per un altre usuari. Torna a carregar la pàgina per veure els canvis més recents.",
  areaCatalogEntryDeleteBlocked:
    "No es pot eliminar aquesta àrea perquè està assignada a un o més informes d'àrea.",
  memberOrgCatalogEntryDeleteBlocked:
    'No es pot eliminar aquesta organització perquè està assignada a una o més activitats.',
  memberOrgCatalogSupersedeSourceMismatch:
    'Només pots marcar una organització com a substituïda per una altra del mateix tipus (associat o sectorial).',
  memberOrgCatalogSupersedeSelfReference: 'Una organització no es pot substituir a si mateixa.',
  memberOrgCatalogEntrySupersededByReference:
    'No es pot eliminar aquesta organització perquè una altra organització la té marcada com a substituta. Elimina primer aquesta referència.',
  // Access
  accessNotFound: 'Accés no trobat',
  accessUpdateFailed: "No s'ha pogut actualitzar l'accés",
  accessEmailRegistered: "Aquest correu ja està registrat a la llista d'accessos.",
  accessEnvImmutable: "No pots modificar un accés definit al fitxer d'entorn.",
  accessNoActiveAdmins: 'No pots deixar el panell sense administradors actius.',
  // Newsletter + subscribers
  newsletterCreateFailed: 'Error en crear la newsletter',
  newsletterNotSending: "La newsletter no s'està enviant en aquest moment",
  newsletterNotFound: 'Newsletter no trobada',
  newsletterAlreadySent: "La newsletter ja s'ha enviat",
  newsletterAlreadySending: "La newsletter ja s'està enviant",
  newsletterCannotSend: 'No es pot enviar la newsletter',
  subscriberSaveFailed: "No s'ha pogut desar el subscriptor",
  subscriberUpdateFailed: "No s'ha pogut actualitzar el subscriptor",
  subscriberEmailRegistered: 'Aquest correu ja està registrat',
  // Jobs
  jobGone: 'La tasca ja no existeix.',
  jobNotFailed: 'La tasca ja no estava en estat fallit.',
  // About / press dossier / tags / images
  aboutSaveFailed: "No s'ha pogut desar el contingut",
  pressDossierSaveFailed: "No s'ha pogut desar el dossier",
  slotConfigInvalid: 'Configuració de slot no vàlida',
  tagNotFound: 'Etiqueta no trobada',
  tagReserved: "L'etiqueta «Totes» és del sistema i no es pot editar ni eliminar.",
  requiredNameEs: 'El nom en espanyol és obligatori',
  requiredTitleEs: 'El títol en espanyol és obligatori',
  // Reorder
  reorderInvalidState: "L'estat actual no és vàlid per reordenar",
  reorderDuplicates: 'La llista conté elements duplicats',
  reorderMismatch:
    "La llista enviada no coincideix amb l'estat actual. Torna a carregar la pàgina abans de reordenar.",
  // Assets / uploads
  assetFileNotFound: 'Fitxer no trobat',
  assetInvalidPath: 'La ruta del fitxer no és vàlida',
  assetUnavailable: 'El fitxer ja no està disponible',
  fileMissing: "No s'ha enviat cap fitxer",
  fileInvalid: 'Fitxer no vàlid',
  fileTooLargeMb: 'El fitxer supera la mida màxima ({mb}MB)',
  requestTooLarge: 'Sol·licitud massa gran',
  pdfInvalid: 'El PDF pujat no és vàlid',
  svgForbidden: "L'SVG conté elements no permesos",
  svgInvalid: "L'SVG pujat no és vàlid",
  rasterImageInvalid: 'La imatge pujada no és vàlida',
  formatNotAllowed: 'Format no permès. Formats admesos: {formats}',
  imageProcessFailed: "La imatge pujada no s'ha pogut processar",
  filenameUnavailable: "No s'ha pogut generar un nom de fitxer disponible",
}

const eu: Record<AdminApiErrorMessageKey, string> = {
  // Generic
  duplicateRecord: 'Datu horiekin erregistro bat existitzen da jada',
  mutationFailed: 'Errorea eskaera prozesatzean',
  invalidInput: 'Sarrerako datuak ez dira baliozkoak',
  internalError: 'Zerbitzariaren barne-errorea',
  notFound: 'Ez da aurkitu',
  requestNotAllowed: 'Eskaera ez da onartzen.',
  // Per-resource optimistic lock
  mediaOptimisticLock:
    'Beste erabiltzaile batek aldatu du hedabidea. Birkargatu orria azken aldaketak ikusteko.',
  linkOptimisticLock:
    'Beste erabiltzaile batek aldatu du esteka. Birkargatu orria azken aldaketak ikusteko.',
  carouselOptimisticLock:
    'Beste erabiltzaile batek aldatu du karruseleko elementua. Birkargatu orria azken aldaketak ikusteko.',
  equalityOptimisticLock:
    'Beste erabiltzaile batek aldatu du dokumentua. Birkargatu orria azken aldaketak ikusteko.',
  financialReportOptimisticLock:
    'Beste erabiltzaile batek aldatu du txostena. Birkargatu orria azken aldaketak ikusteko.',
  pressArticleOptimisticLock:
    'Beste erabiltzaile batek aldatu du artikulua. Birkargatu orria azken aldaketak ikusteko.',
  aboutOptimisticLock:
    'Beste erabiltzaile batek aldatu du Zer da CREUP edukia. Birkargatu orria azken aldaketak ikusteko.',
  tagOptimisticLock:
    'Beste erabiltzaile batek aldatu du etiketa. Birkargatu orria azken aldaketak ikusteko.',
  pressDossierOptimisticLock:
    'Beste erabiltzaile batek aldatu du prentsa-dosierra. Birkargatu orria azken aldaketak ikusteko.',
  siteDefaultImagesOptimisticLock:
    'Beste erabiltzaile batek aldatu ditu lehenetsitako irudiak. Birkargatu orria azken aldaketak ikusteko.',
  newsletterOptimisticLock:
    'Beste erabiltzaile batek aldatu du newsletter-a. Birkargatu orria azken aldaketak ikusteko.',
  mediaDeleteBlocked:
    'Ezin da hedabide hau ezabatu, hedabideetako agerraldi batekin edo gehiagorekin lotuta dagoelako.',
  smtpIncomplete:
    'SMTP konfigurazioa osatu gabe dago. Konfiguratu SMTP zerbitzaria newsletter-ak bidali aurretik.',
  smtpConnectionFailed:
    'Ezin da posta-zerbitzariarekin konektatu. Egiaztatu SMTP konfigurazioa bidali aurretik.',
  // Per-resource create/update failures
  pressArticleCreateFailed: 'Errorea artikulua sortzean',
  pressArticleSlugFailed: 'Ezin izan da slug bakar bat sortu artikulurako',
  pressArticleTagsMissing:
    'Hautatutako etiketa bat edo gehiago jada ez daude erabilgarri. Kargatu orria berriro eta saiatu berriz.',
  mediaCreateFailed: 'Ezin izan da hedabidea sortu',
  mediaUpdateFailed: 'Ezin izan da hedabidea eguneratu',
  linkCreateFailed: 'Ezin izan da esteka sortu',
  linkUpdateFailed: 'Ezin izan da esteka eguneratu',
  carouselCreateFailed: 'Ezin izan da karruseleko elementua sortu',
  carouselUpdateFailed: 'Ezin izan da karruseleko elementua eguneratu',
  equalityCreateFailed: 'Ezin izan da berdintasun-dokumentua sortu',
  equalityUpdateFailed: 'Ezin izan da berdintasun-dokumentua eguneratu',
  financialReportCreateFailed: 'Ezin izan da txosten ekonomikoa sortu',
  financialReportUpdateFailed: 'Ezin izan da txosten ekonomikoa eguneratu',
  activityCreateFailed: 'Ezin izan da jarduera sortu',
  activityUpdateFailed: 'Ezin izan da jarduera eguneratu',
  activitySlugFailed: 'Ezin izan da slug bakar bat sortu jarduerarako',
  activityOptimisticLock:
    'Beste erabiltzaile batek aldatu du jarduera. Birkargatu orria azken aldaketak ikusteko.',
  activityMemberOrgMissing:
    'Hautatutako erakundea jada ez dago erabilgarri. Kargatu orria berriro eta saiatu berriz.',
  areaReportOverlap:
    'Edizioaren epea beste edizio batekin gainjartzen da. Doitu tartea gorde aurretik.',
  areaReportOptimisticLock:
    'Beste erabiltzaile batek aldatu du arloaren txostena. Birkargatu orria azken aldaketak ikusteko.',
  areaReportSaveFailed: 'Ezin izan da arloaren txostena gorde',
  areaReportAreaMissing:
    'Hautatutako arloa jada ez dago organigraman. Kargatu orria berriro eta saiatu berriz.',
  // Area / member-org catalogs
  areaCatalogEntryOptimisticLock:
    'Beste erabiltzaile batek aldatu du arloa. Birkargatu orria azken aldaketak ikusteko.',
  memberOrgCatalogEntryOptimisticLock:
    'Beste erabiltzaile batek aldatu du erakundea. Birkargatu orria azken aldaketak ikusteko.',
  areaCatalogEntryDeleteBlocked:
    'Ezin da arlo hau ezabatu, arlo-txosten batekin edo gehiagorekin lotuta dagoelako.',
  memberOrgCatalogEntryDeleteBlocked:
    'Ezin da erakunde hau ezabatu, jarduera batekin edo gehiagorekin lotuta dagoelako.',
  memberOrgCatalogSupersedeSourceMismatch:
    'Erakunde bat mota bereko beste batek ordezkatu duela soilik markatu dezakezu (elkartea edo sektoriala).',
  memberOrgCatalogSupersedeSelfReference: 'Erakunde batek ezin du bere burua ordezkatu.',
  memberOrgCatalogEntrySupersededByReference:
    'Ezin da erakunde hau ezabatu, beste erakunde batek ordezko gisa markatuta baitauka. Kendu erreferentzia hori lehenik.',
  // Access
  accessNotFound: 'Sarbidea ez da aurkitu',
  accessUpdateFailed: 'Ezin izan da sarbidea eguneratu',
  accessEmailRegistered: 'Helbide elektroniko hori jada erregistratuta dago sarbideen zerrendan.',
  accessEnvImmutable: 'Ezin duzu ingurune-fitxategian definitutako sarbide bat aldatu.',
  accessNoActiveAdmins: 'Ezin duzu panela administratzaile aktiborik gabe utzi.',
  // Newsletter + subscribers
  newsletterCreateFailed: 'Errorea newsletter-a sortzean',
  newsletterNotSending: 'Newsletter-a ez da une honetan bidaltzen ari',
  newsletterNotFound: 'Newsletter-a ez da aurkitu',
  newsletterAlreadySent: 'Newsletter-a jada bidali da',
  newsletterAlreadySending: 'Newsletter-a jada bidaltzen ari da',
  newsletterCannotSend: 'Ezin da newsletter-a bidali',
  subscriberSaveFailed: 'Ezin izan da harpideduna gorde',
  subscriberUpdateFailed: 'Ezin izan da harpideduna eguneratu',
  subscriberEmailRegistered: 'Helbide elektroniko hau jada erregistratuta dago',
  // Jobs
  jobGone: 'Lana jada ez da existitzen.',
  jobNotFailed: 'Lana jada ez zegoen huts egindako egoeran.',
  // About / press dossier / tags / images
  aboutSaveFailed: 'Ezin izan da edukia gorde',
  pressDossierSaveFailed: 'Ezin izan da dosierra gorde',
  slotConfigInvalid: 'Slot-konfigurazioa ez da baliozkoa',
  tagNotFound: 'Etiketa ez da aurkitu',
  tagReserved: '«Guztiak» etiketa sistemakoa da, eta ezin da editatu edo ezabatu.',
  requiredNameEs: 'Gaztelaniazko izena beharrezkoa da',
  requiredTitleEs: 'Gaztelaniazko izenburua beharrezkoa da',
  // Reorder
  reorderInvalidState: 'Uneko egoera ez da baliozkoa berrordenatzeko',
  reorderDuplicates: 'Zerrendak elementu bikoiztuak ditu',
  reorderMismatch:
    'Bidalitako zerrenda ez dator bat uneko egoerarekin. Birkargatu orria berrordenatu aurretik.',
  // Assets / uploads
  assetFileNotFound: 'Fitxategia ez da aurkitu',
  assetInvalidPath: 'Fitxategiaren bidea ez da baliozkoa',
  assetUnavailable: 'Fitxategia jada ez dago erabilgarri',
  fileMissing: 'Ez da fitxategirik bidali',
  fileInvalid: 'Fitxategia ez da baliozkoa',
  fileTooLargeMb: 'Fitxategiak gehienezko tamaina gainditzen du ({mb}MB)',
  requestTooLarge: 'Eskaera handiegia da',
  pdfInvalid: 'Igotako PDFa ez da baliozkoa',
  svgForbidden: 'SVGak onartzen ez diren elementuak ditu',
  svgInvalid: 'Igotako SVGa ez da baliozkoa',
  rasterImageInvalid: 'Igotako irudia ez da baliozkoa',
  formatNotAllowed: 'Formatua ez da onartzen. Onartzen diren formatuak: {formats}',
  imageProcessFailed: 'Ezin izan da igotako irudia prozesatu',
  filenameUnavailable: 'Ezin izan da fitxategi-izen erabilgarri bat sortu',
}

const gl: Record<AdminApiErrorMessageKey, string> = {
  // Generic
  duplicateRecord: 'Xa existe un rexistro con eses datos',
  mutationFailed: 'Erro ao procesar a solicitude',
  invalidInput: 'Datos de entrada non válidos',
  internalError: 'Erro interno do servidor',
  notFound: 'Non atopado',
  requestNotAllowed: 'Solicitude non permitida.',
  // Per-resource optimistic lock
  mediaOptimisticLock:
    'O medio foi modificado por outro usuario. Recarga a páxina para ver os cambios máis recentes.',
  linkOptimisticLock:
    'A ligazón foi modificada por outro usuario. Recarga a páxina para ver os cambios máis recentes.',
  carouselOptimisticLock:
    'O elemento do carrusel foi modificado por outro usuario. Recarga a páxina para ver os cambios máis recentes.',
  equalityOptimisticLock:
    'O documento foi modificado por outro usuario. Recarga a páxina para ver os cambios máis recentes.',
  financialReportOptimisticLock:
    'O informe foi modificado por outro usuario. Recarga a páxina para ver os cambios máis recentes.',
  pressArticleOptimisticLock:
    'O artigo foi modificado por outro usuario. Recarga a páxina para ver os cambios máis recentes.',
  aboutOptimisticLock:
    'O contido de Que é CREUP foi modificado por outro usuario. Recarga a páxina para ver os cambios máis recentes.',
  tagOptimisticLock:
    'A etiqueta foi modificada por outro usuario. Recarga a páxina para ver os cambios máis recentes.',
  pressDossierOptimisticLock:
    'O dossier de prensa foi modificado por outro usuario. Recarga a páxina para ver os cambios máis recentes.',
  siteDefaultImagesOptimisticLock:
    'As imaxes por defecto foron modificadas por outro usuario. Recarga a páxina para ver os cambios máis recentes.',
  newsletterOptimisticLock:
    'A newsletter foi modificada por outro usuario. Recarga a páxina para ver os cambios máis recentes.',
  mediaDeleteBlocked:
    'Non se pode eliminar este medio porque está asignado a unha ou máis aparicións nos medios.',
  smtpIncomplete:
    'A configuración SMTP é incompleta. Configura o servidor SMTP antes de enviar newsletters.',
  smtpConnectionFailed:
    'Non se pode conectar ao servidor de correo. Verifica a configuración SMTP antes de enviar.',
  // Per-resource create/update failures
  pressArticleCreateFailed: 'Erro ao crear o artigo',
  pressArticleSlugFailed: 'Non se puido xerar un slug único para o artigo',
  pressArticleTagsMissing:
    'Unha ou varias etiquetas seleccionadas xa non existen. Recarga a páxina e téntao de novo.',
  mediaCreateFailed: 'Non se puido crear o medio',
  mediaUpdateFailed: 'Non se puido actualizar o medio',
  linkCreateFailed: 'Non se puido crear a ligazón',
  linkUpdateFailed: 'Non se puido actualizar a ligazón',
  carouselCreateFailed: 'Non se puido crear o elemento do carrusel',
  carouselUpdateFailed: 'Non se puido actualizar o elemento do carrusel',
  equalityCreateFailed: 'Non se puido crear o documento de igualdade',
  equalityUpdateFailed: 'Non se puido actualizar o documento de igualdade',
  financialReportCreateFailed: 'Non se puido crear o informe económico',
  financialReportUpdateFailed: 'Non se puido actualizar o informe económico',
  activityCreateFailed: 'Non se puido crear a actividade',
  activityUpdateFailed: 'Non se puido actualizar a actividade',
  activitySlugFailed: 'Non se puido xerar un slug único para a actividade',
  activityOptimisticLock:
    'A actividade foi modificada por outro usuario. Recarga a páxina para ver os cambios máis recentes.',
  activityMemberOrgMissing:
    'A organización seleccionada xa non existe. Recarga a páxina e téntao de novo.',
  areaReportOverlap:
    'O período da edición sobreponse co doutra edición. Axusta o rango antes de gardar.',
  areaReportOptimisticLock:
    'O informe de área foi modificado por outro usuario. Recarga a páxina para ver os cambios máis recentes.',
  areaReportSaveFailed: 'Non se puido gardar o informe de área',
  areaReportAreaMissing:
    'A área seleccionada xa non existe no organigrama. Recarga a páxina e téntao de novo.',
  // Area / member-org catalogs
  areaCatalogEntryOptimisticLock:
    'A área foi modificada por outro usuario. Recarga a páxina para ver os cambios máis recentes.',
  memberOrgCatalogEntryOptimisticLock:
    'A organización foi modificada por outro usuario. Recarga a páxina para ver os cambios máis recentes.',
  areaCatalogEntryDeleteBlocked:
    'Non se pode eliminar esta área porque está asignada a un ou máis informes de área.',
  memberOrgCatalogEntryDeleteBlocked:
    'Non se pode eliminar esta organización porque está asignada a unha ou máis actividades.',
  memberOrgCatalogSupersedeSourceMismatch:
    'Só podes marcar unha organización como substituída por outra do mesmo tipo (asociado ou sectorial).',
  memberOrgCatalogSupersedeSelfReference: 'Unha organización non pode substituírse a si mesma.',
  memberOrgCatalogEntrySupersededByReference:
    'Non se pode eliminar esta organización porque outra organización a ten marcada como substituta. Elimina esa referencia primeiro.',
  // Access
  accessNotFound: 'Acceso non atopado',
  accessUpdateFailed: 'Non se puido actualizar o acceso',
  accessEmailRegistered: 'Ese correo xa está rexistrado na lista de accesos.',
  accessEnvImmutable: 'Non podes modificar un acceso definido no arquivo de contorno.',
  accessNoActiveAdmins: 'Non podes deixar o panel sen administradores activos.',
  // Newsletter + subscribers
  newsletterCreateFailed: 'Erro ao crear a newsletter',
  newsletterNotSending: 'A newsletter non se está enviando neste momento',
  newsletterNotFound: 'Newsletter non atopada',
  newsletterAlreadySent: 'A newsletter xa se enviou',
  newsletterAlreadySending: 'A newsletter xa se está enviando',
  newsletterCannotSend: 'Non se pode enviar a newsletter',
  subscriberSaveFailed: 'Non se puido gardar o subscritor',
  subscriberUpdateFailed: 'Non se puido actualizar o subscritor',
  subscriberEmailRegistered: 'Este correo xa está rexistrado',
  // Jobs
  jobGone: 'O traballo xa non existe.',
  jobNotFailed: 'O traballo xa non estaba en estado fallido.',
  // About / press dossier / tags / images
  aboutSaveFailed: 'Non se puido gardar o contido',
  pressDossierSaveFailed: 'Non se puido gardar o dossier',
  slotConfigInvalid: 'Configuración de slot non válida',
  tagNotFound: 'Etiqueta non atopada',
  tagReserved: 'A etiqueta «Todas» é do sistema e non se pode editar nin eliminar.',
  requiredNameEs: 'O nome en español é requirido',
  requiredTitleEs: 'O título en español é obrigatorio',
  // Reorder
  reorderInvalidState: 'O estado actual non é válido para reordenar',
  reorderDuplicates: 'A lista contén elementos duplicados',
  reorderMismatch:
    'A lista enviada non coincide co estado actual. Recarga a páxina antes de reordenar.',
  // Assets / uploads
  assetFileNotFound: 'Arquivo non atopado',
  assetInvalidPath: 'A ruta do arquivo non é válida',
  assetUnavailable: 'O arquivo xa non está dispoñible',
  fileMissing: 'Non se enviou ningún arquivo',
  fileInvalid: 'Arquivo non válido',
  fileTooLargeMb: 'O arquivo supera o tamaño máximo ({mb}MB)',
  requestTooLarge: 'Solicitude demasiado grande',
  pdfInvalid: 'O PDF subido non é válido',
  svgForbidden: 'O SVG contén elementos non permitidos',
  svgInvalid: 'O SVG subido non é válido',
  rasterImageInvalid: 'A imaxe subida non é válida',
  formatNotAllowed: 'Formato non permitido. Formatos admitidos: {formats}',
  imageProcessFailed: 'A imaxe subida non se puido procesar',
  filenameUnavailable: 'Non se puido xerar un nome de arquivo dispoñible',
}

const val: Record<AdminApiErrorMessageKey, string> = {
  // Generic
  duplicateRecord: 'Ja existix un registre amb estes dades',
  mutationFailed: 'Error en processar la sol·licitud',
  invalidInput: "Dades d'entrada no vàlides",
  internalError: 'Error intern del servidor',
  notFound: "No s'ha trobat",
  requestNotAllowed: 'Sol·licitud no permesa.',
  // Per-resource optimistic lock
  mediaOptimisticLock:
    'El mitjà ha sigut modificat per un altre usuari. Torna a carregar la pàgina per a vore els canvis més recents.',
  linkOptimisticLock:
    "L'enllaç ha sigut modificat per un altre usuari. Torna a carregar la pàgina per a vore els canvis més recents.",
  carouselOptimisticLock:
    "L'element del carrusel ha sigut modificat per un altre usuari. Torna a carregar la pàgina per a vore els canvis més recents.",
  equalityOptimisticLock:
    'El document ha sigut modificat per un altre usuari. Torna a carregar la pàgina per a vore els canvis més recents.',
  financialReportOptimisticLock:
    "L'informe ha sigut modificat per un altre usuari. Torna a carregar la pàgina per a vore els canvis més recents.",
  pressArticleOptimisticLock:
    "L'article ha sigut modificat per un altre usuari. Torna a carregar la pàgina per a vore els canvis més recents.",
  aboutOptimisticLock:
    'El contingut de Què és CREUP ha sigut modificat per un altre usuari. Torna a carregar la pàgina per a vore els canvis més recents.',
  tagOptimisticLock:
    "L'etiqueta ha sigut modificada per un altre usuari. Torna a carregar la pàgina per a vore els canvis més recents.",
  pressDossierOptimisticLock:
    'El dossier de premsa ha sigut modificat per un altre usuari. Torna a carregar la pàgina per a vore els canvis més recents.',
  siteDefaultImagesOptimisticLock:
    'Les imatges per defecte han sigut modificades per un altre usuari. Torna a carregar la pàgina per a vore els canvis més recents.',
  newsletterOptimisticLock:
    'La newsletter ha sigut modificada per un altre usuari. Torna a carregar la pàgina per a vore els canvis més recents.',
  mediaDeleteBlocked:
    'No es pot eliminar este mitjà perquè està assignat a una o més aparicions als mitjans.',
  smtpIncomplete:
    "La configuració SMTP és incompleta. Configura el servidor SMTP abans d'enviar newsletters.",
  smtpConnectionFailed:
    "No es pot connectar al servidor de correu. Comprova la configuració SMTP abans d'enviar.",
  // Per-resource create/update failures
  pressArticleCreateFailed: "Error en crear l'article",
  pressArticleSlugFailed: "No s'ha pogut generar un slug únic per a l'article",
  pressArticleTagsMissing:
    'Una o més etiquetes seleccionades ja no existixen. Torna a carregar la pàgina i torna-ho a provar.',
  mediaCreateFailed: "No s'ha pogut crear el mitjà",
  mediaUpdateFailed: "No s'ha pogut actualitzar el mitjà",
  linkCreateFailed: "No s'ha pogut crear l'enllaç",
  linkUpdateFailed: "No s'ha pogut actualitzar l'enllaç",
  carouselCreateFailed: "No s'ha pogut crear l'element del carrusel",
  carouselUpdateFailed: "No s'ha pogut actualitzar l'element del carrusel",
  equalityCreateFailed: "No s'ha pogut crear el document d'igualtat",
  equalityUpdateFailed: "No s'ha pogut actualitzar el document d'igualtat",
  financialReportCreateFailed: "No s'ha pogut crear l'informe econòmic",
  financialReportUpdateFailed: "No s'ha pogut actualitzar l'informe econòmic",
  activityCreateFailed: "No s'ha pogut crear l'activitat",
  activityUpdateFailed: "No s'ha pogut actualitzar l'activitat",
  activitySlugFailed: "No s'ha pogut generar un slug únic per a l'activitat",
  activityOptimisticLock:
    "L'activitat ha sigut modificada per un altre usuari. Torna a carregar la pàgina per a vore els canvis més recents.",
  activityMemberOrgMissing:
    "L'organització seleccionada ja no existix. Torna a carregar la pàgina i torna-ho a provar.",
  areaReportOverlap:
    "El període de l'edició se solapa amb el d'una altra. Ajusta el rang abans de guardar.",
  areaReportOptimisticLock:
    "L'informe d'àrea ha sigut modificat per un altre usuari. Torna a carregar la pàgina per a vore els canvis més recents.",
  areaReportSaveFailed: "No s'ha pogut guardar l'informe d'àrea",
  areaReportAreaMissing:
    "L'àrea seleccionada ja no existix a l'organigrama. Torna a carregar la pàgina i torna-ho a provar.",
  // Area / member-org catalogs
  areaCatalogEntryOptimisticLock:
    "L'àrea ha sigut modificada per un altre usuari. Torna a carregar la pàgina per a vore els canvis més recents.",
  memberOrgCatalogEntryOptimisticLock:
    "L'organització ha sigut modificada per un altre usuari. Torna a carregar la pàgina per a vore els canvis més recents.",
  areaCatalogEntryDeleteBlocked:
    "No es pot eliminar esta àrea perquè està assignada a un o més informes d'àrea.",
  memberOrgCatalogEntryDeleteBlocked:
    'No es pot eliminar esta organització perquè està assignada a una o més activitats.',
  memberOrgCatalogSupersedeSourceMismatch:
    'Només pots marcar una organització com a substituïda per una altra del mateix tipus (associat o sectorial).',
  memberOrgCatalogSupersedeSelfReference: 'Una organització no es pot substituir a si mateixa.',
  memberOrgCatalogEntrySupersededByReference:
    'No es pot eliminar esta organització perquè una altra organització la té marcada com a substituta. Elimina primer eixa referència.',
  // Access
  accessNotFound: 'Accés no trobat',
  accessUpdateFailed: "No s'ha pogut actualitzar l'accés",
  accessEmailRegistered: "Este correu ja està registrat a la llista d'accessos.",
  accessEnvImmutable: "No pots modificar un accés definit al fitxer d'entorn.",
  accessNoActiveAdmins: 'No pots deixar el panell sense administradors actius.',
  // Newsletter + subscribers
  newsletterCreateFailed: 'Error en crear la newsletter',
  newsletterNotSending: "La newsletter no s'està enviant en este moment",
  newsletterNotFound: 'Newsletter no trobada',
  newsletterAlreadySent: "La newsletter ja s'ha enviat",
  newsletterAlreadySending: "La newsletter ja s'està enviant",
  newsletterCannotSend: 'No es pot enviar la newsletter',
  subscriberSaveFailed: "No s'ha pogut guardar el subscriptor",
  subscriberUpdateFailed: "No s'ha pogut actualitzar el subscriptor",
  subscriberEmailRegistered: 'Este correu ja està registrat',
  // Jobs
  jobGone: 'La tasca ja no existix.',
  jobNotFailed: 'La tasca ja no estava en estat fallit.',
  // About / press dossier / tags / images
  aboutSaveFailed: "No s'ha pogut guardar el contingut",
  pressDossierSaveFailed: "No s'ha pogut guardar el dossier",
  slotConfigInvalid: 'Configuració de slot no vàlida',
  tagNotFound: 'Etiqueta no trobada',
  tagReserved: "L'etiqueta «Totes» és del sistema i no es pot editar ni eliminar.",
  requiredNameEs: 'El nom en espanyol és obligatori',
  requiredTitleEs: 'El títol en espanyol és obligatori',
  // Reorder
  reorderInvalidState: "L'estat actual no és vàlid per a reordenar",
  reorderDuplicates: 'La llista conté elements duplicats',
  reorderMismatch:
    "La llista enviada no coincidix amb l'estat actual. Torna a carregar la pàgina abans de reordenar.",
  // Assets / uploads
  assetFileNotFound: 'Fitxer no trobat',
  assetInvalidPath: 'La ruta del fitxer no és vàlida',
  assetUnavailable: 'El fitxer ja no està disponible',
  fileMissing: "No s'ha enviat cap fitxer",
  fileInvalid: 'Fitxer no vàlid',
  fileTooLargeMb: 'El fitxer supera la mida màxima ({mb}MB)',
  requestTooLarge: 'Sol·licitud massa gran',
  pdfInvalid: 'El PDF pujat no és vàlid',
  svgForbidden: "L'SVG conté elements no permesos",
  svgInvalid: "L'SVG pujat no és vàlid",
  rasterImageInvalid: 'La imatge pujada no és vàlida',
  formatNotAllowed: 'Format no permés. Formats admesos: {formats}',
  imageProcessFailed: "La imatge pujada no s'ha pogut processar",
  filenameUnavailable: "No s'ha pogut generar un nom de fitxer disponible",
}

const adminApiErrorMessagesByLocale = { es, en, ca, eu, gl, val }

export const getDefaultAdminApiErrorMessage = (
  key: AdminApiErrorMessageKey,
  locale: keyof typeof adminApiErrorMessagesByLocale = 'es'
): string => {
  return adminApiErrorMessagesByLocale[locale][key]
}

export const getAdminApiErrorMessage = (event: H3Event, key: AdminApiErrorMessageKey): string => {
  const { locale, fallbackLocale } = getRequestLocaleContext(event)
  const messages =
    pickLocalizedValue(adminApiErrorMessagesByLocale, locale, fallbackLocale) ??
    adminApiErrorMessagesByLocale.es

  return messages[key]
}

/**
 * Resolve an admin message for the request locale, falling back to the default (es) when no `event`
 * is available (e.g. deep helpers reached outside a request). Single source for the
 * `event ? getAdminApiErrorMessage : getDefaultAdminApiErrorMessage` pattern.
 */
export const resolveAdminApiMessage = (key: AdminApiErrorMessageKey, event?: H3Event): string =>
  event ? getAdminApiErrorMessage(event, key) : getDefaultAdminApiErrorMessage(key)
