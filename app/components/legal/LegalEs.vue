<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <article class="mx-auto max-w-4xl space-y-10">
    <header class="space-y-2">
      <h1 class="text-3xl font-bold sm:text-4xl">
        {{ title }}
      </h1>
    </header>

    <section id="informacion-general" class="space-y-4">
      <h2 class="text-xl font-bold">I. Información general</h2>

      <p class="text-sm leading-relaxed">
        En cumplimiento con el deber de información recogido en la Ley 34/2002, de 11 de julio, de
        Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE), se
        facilitan a continuación los siguientes datos de información general de este sitio web:
      </p>

      <p class="text-sm leading-relaxed">
        La titularidad de este sitio web, creup.es y los subdominios asociados (en adelante, el
        Sitio Web), la ostenta la COORDINADORA DE REPRESENTANTES DE ESTUDIANTES DE UNIVERSIDADES
        PÚBLICAS, provista de NIF G95324281 e inscrita en el Registro Nacional de Asociaciones con
        el número 171330, con los siguientes datos de contacto:
      </p>

      <UCard variant="subtle" class="motion-card-subtle">
        <div class="flex flex-col gap-3 text-sm">
          <div class="flex items-start gap-2">
            <UIcon name="i-tabler-map-pin" class="text-primary mt-0.5 size-4 shrink-0" />
            <span
              >Edificio de Estudiantes, Avenida Complutense S/N, Moncloa - Aravaca, 28040, Madrid
              (Madrid), España</span
            >
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-tabler-mail" class="text-primary size-4 shrink-0" />
            <a
              href="mailto:info@creup.es"
              class="text-primary underline underline-offset-2 hover:no-underline"
              >info@creup.es</a
            >
          </div>
        </div>
      </UCard>
    </section>

    <USeparator />

    <section id="terminos" class="space-y-4">
      <h2 class="text-xl font-bold">II. Condiciones generales de uso</h2>

      <h3 class="text-base font-semibold">Objeto de las condiciones: el Sitio Web</h3>

      <p class="text-sm leading-relaxed">
        El objeto de las presentes Condiciones Generales de Uso (en adelante, Condiciones) es
        regular el acceso y la utilización del Sitio Web. A los efectos de las presentes
        Condiciones, se entenderá como Sitio Web la apariencia externa de las interfaces de
        pantalla, tanto de forma estática como dinámica, el árbol de navegación, todos los elementos
        integrados (en adelante, Contenidos) y todos aquellos servicios o recursos en línea que se
        ofrezcan a los Usuarios (en adelante, Servicios).
      </p>

      <p class="text-sm leading-relaxed">
        CREUP se reserva la facultad de modificar, en cualquier momento y sin aviso previo, la
        presentación y configuración del Sitio Web y de los Contenidos y Servicios que en él se
        incorporan. El Usuario reconoce y acepta que en cualquier momento CREUP pueda interrumpir,
        desactivar y/o cancelar cualquiera de estos elementos o el acceso a los mismos.
      </p>

      <p class="text-sm leading-relaxed">
        El acceso al Sitio Web es gratuito con carácter general, salvo los costes de conexión a
        través de la red de telecomunicaciones contratada por el Usuario. El uso de ciertos
        Contenidos o Servicios puede requerir suscripción o registro previo.
      </p>

      <h3 class="text-base font-semibold">El Usuario</h3>

      <p class="text-sm leading-relaxed">
        El acceso, la navegación y uso del Sitio Web confiere la condición de Usuario e implica la
        aceptación, desde el inicio de la navegación, de todas las Condiciones aquí establecidas,
        así como de sus ulteriores modificaciones, sin perjuicio de la legislación aplicable de
        obligado cumplimiento.
      </p>

      <p class="text-sm leading-relaxed">
        El Usuario asume su responsabilidad de un uso correcto del Sitio Web. Esta responsabilidad
        se extenderá a:
      </p>

      <ul class="list-disc space-y-1 pl-6 text-sm">
        <li>
          Hacer uso adecuado de la información, Contenidos y/o Servicios que CREUP ofrece conforme a
          las presentes Condiciones, la ley, la moral y el orden público.
        </li>
        <li>
          La veracidad y licitud de los datos aportados por el Usuario en los formularios
          facilitados por CREUP para el acceso a ciertos Contenidos o Servicios.
        </li>
      </ul>

      <p class="text-sm leading-relaxed">
        El mero acceso a este Sitio Web no supone entablar ningún tipo de relación de carácter
        comercial entre CREUP y el Usuario.
      </p>

      <p class="text-sm leading-relaxed">
        En cumplimiento de la legislación vigente, este Sitio Web está dirigido a todas las personas
        que puedan acceder al mismo y/o navegar por él. El Sitio Web está dirigido principalmente a
        usuarios residentes en España. Si un usuario accede desde otro país, lo hace bajo su propia
        responsabilidad y deberá asegurarse de que dicho acceso cumple con la legislación local.
      </p>
    </section>

    <USeparator />

    <section id="garantias" class="space-y-4">
      <h2 class="text-xl font-bold">
        III. Acceso y navegación: exención de garantías y responsabilidad
      </h2>

      <p class="text-sm leading-relaxed">
        CREUP no garantiza la continuidad, disponibilidad y utilidad del Sitio Web ni de los
        Contenidos o Servicios. CREUP hará todo lo posible por el buen funcionamiento del Sitio Web,
        pero no garantiza un acceso sin interrupciones ni libre de errores.
      </p>

      <p class="text-sm leading-relaxed">
        CREUP no garantiza que el contenido o software accesible a través de este Sitio Web esté
        libre de errores ni que cause daños en los sistemas del Usuario (software y hardware). En
        ningún caso CREUP será responsable de las pérdidas o daños derivados del acceso, navegación
        o uso del Sitio Web, incluidos, sin limitación, los daños a los sistemas informáticos o los
        ocasionados por virus.
      </p>

      <p class="text-sm leading-relaxed">
        CREUP tampoco será responsable de los daños que pudieran producirse por un uso inadecuado de
        este Sitio Web, incluyendo caídas, interrupciones o fallos en las telecomunicaciones.
      </p>
    </section>

    <USeparator />

    <section id="privacidad" class="space-y-4">
      <h2 class="text-xl font-bold">IV. Política de privacidad y protección de datos</h2>

      <p class="text-sm leading-relaxed">
        CREUP se compromete a adoptar las medidas técnicas y organizativas necesarias, conforme al
        nivel de seguridad adecuado al riesgo de los datos recogidos.
      </p>

      <h3 class="text-base font-semibold">Marco legal aplicable</h3>

      <ul class="list-disc space-y-1 pl-6 text-sm">
        <li>Reglamento (UE) 2016/679 (RGPD).</li>
        <li>
          Ley Orgánica 3/2018 de Protección de Datos Personales y garantía de los derechos
          digitales.
        </li>
        <li>Real Decreto 1720/2007 y Ley 34/2002 (LSSI-CE), en lo que resulte aplicable.</li>
      </ul>

      <h3 class="text-base font-semibold">Identidad del responsable del tratamiento</h3>

      <p class="text-sm leading-relaxed">
        El responsable del tratamiento de los datos es la COORDINADORA DE REPRESENTANTES DE
        ESTUDIANTES DE UNIVERSIDADES PÚBLICAS, con NIF G95324281, inscrita en el Registro Nacional
        de Asociaciones con el número 171330.
      </p>

      <h3 class="text-base font-semibold">Registro de actividades de tratamiento</h3>

      <p class="text-sm leading-relaxed">
        Los datos personales recogidos por CREUP mediante los formularios del sitio web se tratan
        bajo la responsabilidad del responsable para atender consultas, gestionar suscripciones a la
        newsletter, mantener la relación con las personas usuarias y cumplir las obligaciones
        aplicables. La información sobre la autoridad de control española está disponible en
        <a
          href="https://www.aepd.es"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline underline-offset-2 hover:no-underline"
          >aepd.es</a
        >.
      </p>

      <h3 class="text-base font-semibold">
        Principios aplicables al tratamiento de datos personales
      </h3>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <UCard
          v-for="principle in [
            'Licitud, lealtad y transparencia',
            'Limitación de la finalidad',
            'Minimización de datos',
            'Exactitud',
            'Limitación del plazo de conservación',
            'Integridad y confidencialidad',
            'Responsabilidad proactiva',
          ]"
          :key="principle"
          variant="subtle"
          class="motion-card-subtle"
          :ui="{ body: 'p-3' }"
        >
          <div class="flex items-center gap-2 text-sm">
            <UIcon name="i-tabler-check" class="text-primary size-4 shrink-0" />
            <span>{{ principle }}</span>
          </div>
        </UCard>
      </div>

      <h3 class="text-base font-semibold">Categorías de datos personales</h3>

      <p class="text-sm leading-relaxed">
        Las categorías de datos que trata CREUP son únicamente datos identificativos. No se tratan
        categorías especiales de datos en el sentido del artículo 9 del RGPD.
      </p>

      <h3 class="text-base font-semibold">Base jurídica del tratamiento</h3>

      <p class="text-sm leading-relaxed">
        La base jurídica depende de la finalidad concreta. En la newsletter, la base jurídica es el
        consentimiento de la persona interesada, recabado mediante una acción afirmativa clara y
        confirmado mediante un procedimiento de doble opt-in. En el formulario de contacto, la base
        jurídica es la atención de la solicitud remitida por la persona interesada y, en su caso, la
        aplicación de medidas precontractuales solicitadas por esta. Para la medición agregada del
        uso del sitio mediante la instancia autoalojada de Umami, CREUP aplica su interés legítimo
        en conocer el uso básico, el rendimiento y los errores del sitio sin utilizar cookies ni
        identificadores persistentes.
      </p>

      <h3 class="text-base font-semibold">Finalidades del tratamiento</h3>

      <p class="text-sm leading-relaxed">
        Los datos personales se recogen y gestionan para atender solicitudes y consultas, facilitar
        la relación con las personas usuarias y, cuando exista consentimiento expreso, gestionar la
        suscripción a la newsletter y remitir sus comunicaciones. Asimismo, CREUP obtiene
        información agregada de uso del sitio para fines estadísticos, técnicos y de mejora del
        servicio mediante una instancia propia de Umami configurada sin cookies ni identificadores
        persistentes.
      </p>

      <h3 class="text-base font-semibold">Analítica web sin cookies</h3>

      <p class="text-sm leading-relaxed">
        Este Sitio Web utiliza una instancia autoalojada de Umami, gestionada por la propia CREUP,
        para obtener estadísticas agregadas de uso sin emplear cookies de seguimiento ni
        identificadores persistentes. Según la documentación oficial de Umami, la medición puede
        incluir datos como la URL y el título de la página visitada, la página de procedencia, el
        idioma del navegador, el navegador, el sistema operativo, el tipo de dispositivo, la
        resolución de pantalla y métricas de rendimiento.
      </p>

      <p class="text-sm leading-relaxed">
        Cuando existen parámetros de campaña en la URL, estos también pueden registrarse con fines
        de atribución agregada. La localización aproximada puede inferirse a partir de cabeceras de
        geolocalización o de la IP empleada para la solicitud, pero la dirección IP no se almacena,
        conforme a la documentación oficial de Umami. Esta medición no identifica personalmente al
        usuario ni realiza seguimiento entre sitios. Como referencia general sobre el funcionamiento
        de la herramienta, puede consultarse la documentación oficial de Umami en
        <a
          href="https://docs.umami.is/docs"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline underline-offset-2 hover:no-underline"
          >docs.umami.is/docs</a
        >
        y su aviso de privacidad en
        <a
          href="https://umami.is/privacy"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline underline-offset-2 hover:no-underline"
          >umami.is/privacy</a
        >.
      </p>

      <h3 class="text-base font-semibold">Plazos de conservación</h3>

      <p class="text-sm leading-relaxed">
        Los datos personales se conservarán únicamente durante el tiempo necesario para la finalidad
        correspondiente. Los mensajes enviados por el formulario de contacto se conservarán en el
        correo corporativo durante el tiempo necesario para gestionar la consulta y, en su caso,
        durante los plazos legalmente exigibles. Los datos de la newsletter se conservarán mientras
        la suscripción permanezca activa. Tras la baja, CREUP conservará un registro mínimo de
        supresión para evitar nuevos envíos no deseados y atender posibles incidencias o
        reclamaciones.
      </p>

      <h3 class="text-base font-semibold">Destinatarios de los datos personales</h3>

      <p class="text-sm leading-relaxed">
        Los datos personales no se ceden a terceros, salvo obligación legal. Las métricas agregadas
        de uso del sitio se procesan en infraestructura propia de CREUP mediante su instancia
        autoalojada de Umami, por lo que no implican la contratación de un proveedor analítico
        externo por ese motivo.
      </p>

      <h3 class="text-base font-semibold">Datos de menores</h3>

      <p class="text-sm leading-relaxed">
        De conformidad con la legislación vigente, los menores de 14 años necesitan el
        consentimiento de padres o tutores legales para el tratamiento lícito de sus datos
        personales.
      </p>

      <h3 class="text-base font-semibold">Confidencialidad y seguridad</h3>

      <p class="text-sm leading-relaxed">
        CREUP se compromete a adoptar las medidas técnicas y organizativas adecuadas para garantizar
        la seguridad y confidencialidad de los datos personales. El Sitio Web utiliza cifrado
        SSL/TLS para la transmisión de datos.
      </p>

      <h3 class="text-base font-semibold">Derechos de los interesados</h3>

      <p class="text-sm leading-relaxed">
        Los usuarios pueden ejercer los siguientes derechos en virtud del RGPD:
      </p>

      <ul class="list-disc space-y-1 pl-6 text-sm">
        <li>Derecho de acceso.</li>
        <li>Derecho de rectificación.</li>
        <li>Derecho de supresión (derecho al olvido).</li>
        <li>Derecho a la limitación del tratamiento.</li>
        <li>Derecho a la portabilidad de los datos.</li>
        <li>Derecho de oposición.</li>
        <li>
          Derecho a no ser objeto de decisiones basadas únicamente en tratamientos automatizados.
        </li>
      </ul>

      <p class="text-sm leading-relaxed">
        Los derechos se pueden ejercer mediante comunicación escrita dirigida al responsable, con la
        referencia «RGPD-creup.es», incluyendo datos identificativos, solicitud concreta, fecha y
        firma, y documentación acreditativa.
      </p>

      <h3 class="text-base font-semibold">Sitios web de terceros</h3>

      <p class="text-sm leading-relaxed">
        El Sitio Web puede contener enlaces a sitios web de terceros no operados por CREUP. Dichos
        terceros disponen de sus propias políticas de privacidad y cookies y son responsables de sus
        propios ficheros y prácticas de datos.
      </p>

      <h3 class="text-base font-semibold">Reclamaciones ante la autoridad de control</h3>

      <p class="text-sm leading-relaxed">
        Si un usuario considera que el tratamiento de datos infringe la legislación aplicable, puede
        presentar una reclamación ante la Agencia Española de Protección de Datos:
        <a
          href="https://www.aepd.es"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline underline-offset-2 hover:no-underline"
          >aepd.es</a
        >.
      </p>

      <h3 class="text-base font-semibold">Aceptación y cambios</h3>

      <p class="text-sm leading-relaxed">
        El uso del Sitio Web implica la aceptación de esta Política de Privacidad. CREUP se reserva
        el derecho a modificar esta política por cambios legislativos, jurisprudenciales u
        organizativos.
      </p>
    </section>

    <USeparator />

    <section id="cookies" class="space-y-4">
      <h2 class="text-xl font-bold">V. Política de cookies y almacenamiento local</h2>

      <p class="text-sm leading-relaxed">
        En este sitio web se utilizan únicamente cookies y mecanismos de almacenamiento local
        necesarios para recordar el idioma, mantener las sesiones de administración y conservar
        determinadas preferencias técnicas de interfaz y accesibilidad. La medición agregada con
        Umami se describe aquí y en la Política de Privacidad porque está configurada sin cookies.
      </p>

      <h3 class="text-base font-semibold">Cookies y tecnologías utilizadas en este sitio web</h3>

      <UCard variant="subtle" class="motion-card-subtle">
        <template #header>
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold">Cookies y almacenamiento técnico esenciales</p>
            <UBadge color="primary" variant="subtle" size="sm">Siempre activas</UBadge>
          </div>
        </template>

        <div class="space-y-3 text-sm">
          <p class="text-muted">
            A continuación se identifican las tecnologías técnicas necesarias para el funcionamiento
            del sitio web. No pueden desactivarse desde el propio sitio porque son necesarias para
            prestar el servicio.
          </p>

          <div class="divide-default space-y-2 divide-y">
            <div class="pt-2 first:pt-0">
              <p class="font-medium">Cookie de idioma (<code class="text-xs">user-locale</code>)</p>
              <p class="text-muted text-xs">
                Almacena el idioma seleccionado por el usuario para mantener la preferencia entre
                sesiones. Duración: 1 año.
              </p>
            </div>
            <div class="pt-2">
              <p class="font-medium">Cookies de autenticación y sesión (better-auth)</p>
              <p class="text-muted text-xs">
                Se utilizan exclusivamente cuando un administrador inicia sesión en el panel de
                administración. Incluyen tokens de sesión y autenticación OAuth. No se emplean para
                los visitantes públicos del sitio.
              </p>
            </div>
            <div class="pt-2">
              <p class="font-medium">Almacenamiento local de preferencias de interfaz</p>
              <p class="text-muted text-xs">
                El almacenamiento local del navegador (localStorage) se emplea para recordar
                preferencias de interfaz como el modo de color (<code class="text-xs"
                  >nuxt-color-mode</code
                >) y opciones de accesibilidad (<code class="text-xs">nuxt-a11y-*</code>). Esta
                información no se transmite al servidor y permanece únicamente en el dispositivo del
                usuario.
              </p>
            </div>
          </div>
        </div>
      </UCard>

      <UCard variant="subtle" class="motion-card-subtle">
        <template #header>
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold">Medición agregada sin cookies</p>
            <UBadge color="neutral" variant="subtle" size="sm">Autoalojada</UBadge>
          </div>
        </template>

        <div class="space-y-3 text-sm">
          <p class="text-muted">
            Además de las tecnologías técnicas imprescindibles, el sitio realiza una medición
            agregada del uso para mejorar su funcionamiento y detectar incidencias.
          </p>

          <div>
            <p class="font-medium">Umami Analytics</p>
            <p class="text-muted text-xs">
              Utilizamos una instancia autoalojada de Umami gestionada por CREUP. Umami no emplea
              cookies, no utiliza identificadores persistentes, no realiza seguimiento entre sitios
              y trata la información de forma agregada. La información general sobre la herramienta
              puede consultarse en la documentación oficial de Umami.
            </p>
          </div>
        </div>
      </UCard>

      <h3 class="text-base font-semibold">Cookies de terceros y redes sociales</h3>

      <p class="text-sm leading-relaxed">
        Este Sitio Web puede incluir enlaces a servicios externos (por ejemplo, redes sociales). Si
        el Usuario accede a dichos servicios, los terceros correspondientes son responsables de sus
        propias cookies y tratamiento de datos.
      </p>

      <h3 class="text-base font-semibold">Desactivación, rechazo y eliminación de cookies</h3>

      <p class="text-sm leading-relaxed">
        Los usuarios pueden desactivar, rechazar o eliminar cookies a través de la configuración del
        navegador. Si se bloquean las cookies técnicas, es posible que algunas funcionalidades del
        sitio web no estén disponibles. La medición agregada con Umami está configurada sin cookies
        ni identificadores persistentes; si esta configuración cambiara, esta política se
        actualizaría en consecuencia.
      </p>
    </section>

    <USeparator />

    <section id="enlaces" class="space-y-4">
      <h2 class="text-xl font-bold">VI. Política de enlaces</h2>

      <p class="text-sm leading-relaxed">
        CREUP podrá poner a disposición del Usuario enlaces, directorios y motores de búsqueda que
        permitan el acceso a sitios web de terceros. El propósito es facilitar el acceso a la
        información disponible en internet.
      </p>

      <p class="text-sm leading-relaxed">
        CREUP no comercializa productos/servicios de los sitios web enlazados y no garantiza su
        disponibilidad técnica, exactitud, veracidad, validez o legalidad.
      </p>

      <p class="text-sm leading-relaxed">
        CREUP no asume ninguna responsabilidad por los daños derivados del acceso, uso, calidad o
        legalidad del contenido, comunicaciones, opiniones, productos o servicios de sitios web no
        gestionados por CREUP.
      </p>

      <p class="text-sm leading-relaxed">
        Cualquier Usuario o tercero que cree un hipervínculo desde otro sitio web al Sitio Web de
        CREUP debe saber que:
      </p>

      <ul class="list-disc space-y-1 pl-6 text-sm">
        <li>
          No se permite la reproducción total o parcial del contenido/servicios del Sitio Web sin
          autorización expresa.
        </li>
        <li>
          No se permiten declaraciones falsas, inexactas o incorrectas sobre CREUP o su Sitio Web.
        </li>
        <li>
          La creación de un hipervínculo no implica ninguna relación entre CREUP y el titular del
          sitio que lo establece.
        </li>
      </ul>
    </section>

    <USeparator />

    <section id="propiedad-intelectual" class="space-y-4">
      <h2 class="text-xl font-bold">VII. Propiedad intelectual e industrial</h2>

      <p class="text-sm leading-relaxed">
        CREUP, por sí o como cesionaria, es titular de todos los derechos de propiedad intelectual e
        industrial del Sitio Web y de los elementos que lo componen (incluyendo, entre otros,
        textos, imágenes, logotipos, diseño y software). Todos los derechos reservados.
      </p>

      <p class="text-sm leading-relaxed">
        Queda expresamente prohibida la reproducción, distribución y comunicación pública, incluida
        la puesta a disposición del público, de todo o parte de los contenidos del sitio web con
        fines comerciales, sin la autorización de CREUP.
      </p>

      <p class="text-sm leading-relaxed">
        Si un Usuario o tercero considera que algún contenido del Sitio Web vulnera derechos de
        propiedad intelectual, deberá notificarlo de inmediato a CREUP utilizando los datos de
        contacto de la sección INFORMACIÓN GENERAL.
      </p>
    </section>

    <USeparator />

    <section id="acciones-legales" class="space-y-4">
      <h2 class="text-xl font-bold">
        VIII. Acciones legales, legislación aplicable y jurisdicción
      </h2>

      <p class="text-sm leading-relaxed">
        CREUP se reserva la facultad de presentar las acciones civiles o penales que considere
        oportunas ante el uso indebido del Sitio Web y sus contenidos o el incumplimiento de las
        presentes Condiciones.
      </p>

      <p class="text-sm leading-relaxed">
        La relación entre el Usuario y CREUP se rige por la legislación española. Cualquier
        controversia relativa a la interpretación y/o aplicación de las presentes Condiciones será
        sometida a la jurisdicción ordinaria de los tribunales competentes.
      </p>
    </section>
  </article>
</template>
