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
      <h2 class="text-xl font-bold">I. Informació general</h2>

      <p class="text-sm leading-relaxed">
        En compliment del deure d'informació recollit a la Llei 34/2002, d'11 de juliol, de Serveis
        de la Societat de la Informació i del Comerç Electrònic (LSSI-CE), es faciliten tot seguit
        les dades d'informació general d'aquest lloc web:
      </p>

      <p class="text-sm leading-relaxed">
        La titularitat d'aquest lloc web, creup.es i els subdominis associats (d'ara endavant, el
        Lloc Web), correspon a la COORDINADORA DE REPRESENTANTES DE ESTUDIANTES DE UNIVERSIDADES
        PÚBLICAS, proveïda de NIF G95324281 i inscrita al Registre Nacional d'Associacions amb el
        número 171330, amb les dades de contacte següents:
      </p>

      <UCard variant="subtle" class="motion-card-subtle">
        <div class="flex flex-col gap-3 text-sm">
          <div class="flex items-start gap-2">
            <UIcon name="i-tabler-map-pin" class="text-primary mt-0.5 size-4 shrink-0" />
            <span
              >Edificio de Estudiantes, Avenida Complutense S/N, Moncloa - Aravaca, 28040, Madrid
              (Madrid), Espanya</span
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
      <h2 class="text-xl font-bold">II. Condicions generals d'ús</h2>

      <h3 class="text-base font-semibold">Objecte de les condicions: el Lloc Web</h3>

      <p class="text-sm leading-relaxed">
        L'objecte d'aquestes Condicions Generals d'Ús (d'ara endavant, Condicions) és regular
        l'accés i la utilització del Lloc Web. Als efectes d'aquestes Condicions, s'entendrà com a
        Lloc Web l'aparença externa de les interfícies de pantalla, tant de manera estàtica com
        dinàmica, l'arbre de navegació, tots els elements integrats (d'ara endavant, Continguts) i
        tots aquells serveis o recursos en línia que s'ofereixin als Usuaris (d'ara endavant,
        Serveis).
      </p>

      <p class="text-sm leading-relaxed">
        CREUP es reserva la facultat de modificar, en qualsevol moment i sense avís previ, la
        presentació i configuració del Lloc Web i dels Continguts i Serveis que s'hi incorporen.
        L'Usuari reconeix i accepta que en qualsevol moment CREUP pugui interrompre, desactivar i/o
        cancel·lar qualsevol d'aquests elements o l'accés als mateixos.
      </p>

      <p class="text-sm leading-relaxed">
        L'accés al Lloc Web és gratuït amb caràcter general, llevat dels costos de connexió a través
        de la xarxa de telecomunicacions contractada per l'Usuari. L'ús de determinats Continguts o
        Serveis pot requerir subscripció o registre previ.
      </p>

      <h3 class="text-base font-semibold">L'Usuari</h3>

      <p class="text-sm leading-relaxed">
        L'accés, la navegació i l'ús del Lloc Web confereixen la condició d'Usuari i impliquen
        l'acceptació, des de l'inici de la navegació, de totes les Condicions establertes aquí, així
        com de les seves modificacions ulteriors, sens perjudici de la legislació aplicable
        d'obligat compliment.
      </p>

      <p class="text-sm leading-relaxed">
        L'Usuari assumeix la seva responsabilitat d'un ús correcte del Lloc Web. Aquesta
        responsabilitat s'estendrà a:
      </p>

      <ul class="list-disc space-y-1 pl-6 text-sm">
        <li>
          Fer un ús adequat de la informació, Continguts i/o Serveis que CREUP ofereix conforme a
          aquestes Condicions, la llei, la moral i l'ordre públic.
        </li>
        <li>
          La veracitat i licitud de les dades aportades per l'Usuari als formularis facilitats per
          CREUP per a l'accés a determinats Continguts o Serveis.
        </li>
      </ul>

      <p class="text-sm leading-relaxed">
        El simple accés a aquest Lloc Web no suposa establir cap tipus de relació de caràcter
        comercial entre CREUP i l'Usuari.
      </p>

      <p class="text-sm leading-relaxed">
        En compliment de la legislació vigent, aquest Lloc Web s'adreça a totes les persones que hi
        puguin accedir i/o navegar-hi. El Lloc Web s'adreça principalment a usuaris residents a
        Espanya. Si un usuari hi accedeix des d'un altre país, ho fa sota la seva pròpia
        responsabilitat i haurà d'assegurar-se que aquest accés compleix amb la legislació local.
      </p>
    </section>

    <USeparator />

    <section id="garantias" class="space-y-4">
      <h2 class="text-xl font-bold">
        III. Accés i navegació: exempció de garanties i responsabilitat
      </h2>

      <p class="text-sm leading-relaxed">
        CREUP no garanteix la continuïtat, disponibilitat i utilitat del Lloc Web ni dels Continguts
        o Serveis. CREUP farà tot el possible pel bon funcionament del Lloc Web, però no garanteix
        un accés sense interrupcions ni lliure d'errors.
      </p>

      <p class="text-sm leading-relaxed">
        CREUP no garanteix que el contingut o programari accessible a través d'aquest Lloc Web
        estigui lliure d'errors ni que causi danys als sistemes de l'Usuari (programari i
        maquinari). En cap cas CREUP serà responsable de les pèrdues o danys derivats de l'accés,
        navegació o ús del Lloc Web, inclosos, sense limitació, els danys als sistemes informàtics o
        els ocasionats per virus.
      </p>

      <p class="text-sm leading-relaxed">
        CREUP tampoc serà responsable dels danys que es puguin produir per un ús inadequat d'aquest
        Lloc Web, incloent-hi caigudes, interrupcions o fallades en les telecomunicacions.
      </p>
    </section>

    <USeparator />

    <section id="privacidad" class="space-y-4">
      <h2 class="text-xl font-bold">IV. Política de privacitat i protecció de dades</h2>

      <p class="text-sm leading-relaxed">
        CREUP es compromet a adoptar les mesures tècniques i organitzatives necessàries, conforme al
        nivell de seguretat adequat al risc de les dades recollides.
      </p>

      <h3 class="text-base font-semibold">Marc legal aplicable</h3>

      <ul class="list-disc space-y-1 pl-6 text-sm">
        <li>Reglament (UE) 2016/679 (RGPD).</li>
        <li>
          Llei Orgànica 3/2018 de Protecció de Dades Personals i garantia dels drets digitals.
        </li>
        <li>Reial Decret 1720/2007 i Llei 34/2002 (LSSI-CE), en allò que resulti aplicable.</li>
      </ul>

      <h3 class="text-base font-semibold">Identitat del responsable del tractament</h3>

      <p class="text-sm leading-relaxed">
        El responsable del tractament de les dades és la COORDINADORA DE REPRESENTANTES DE
        ESTUDIANTES DE UNIVERSIDADES PÚBLICAS, amb NIF G95324281, inscrita al Registre Nacional
        d'Associacions amb el número 171330.
      </p>

      <h3 class="text-base font-semibold">Registre d'activitats de tractament</h3>

      <p class="text-sm leading-relaxed">
        Les dades personals recollides per CREUP mitjançant els formularis del lloc web es tracten
        sota la responsabilitat del responsable per atendre consultes, gestionar subscripcions a la
        newsletter, mantenir la relació amb les persones usuàries i complir les obligacions
        aplicables. La informació sobre l'autoritat de control espanyola està disponible a
        <a
          href="https://www.aepd.es"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline underline-offset-2 hover:no-underline"
          >aepd.es</a
        >.
      </p>

      <h3 class="text-base font-semibold">Principis aplicables al tractament de dades personals</h3>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <UCard
          v-for="principle in [
            'Licitud, lleialtat i transparència',
            'Limitació de la finalitat',
            'Minimització de dades',
            'Exactitud',
            'Limitació del termini de conservació',
            'Integritat i confidencialitat',
            'Responsabilitat proactiva',
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

      <h3 class="text-base font-semibold">Categories de dades personals</h3>

      <p class="text-sm leading-relaxed">
        Les categories de dades que tracta CREUP són únicament dades identificatives. No es tracten
        categories especials de dades en el sentit de l'article 9 del RGPD.
      </p>

      <h3 class="text-base font-semibold">Base jurídica del tractament</h3>

      <p class="text-sm leading-relaxed">
        La base jurídica depèn de la finalitat concreta. A la newsletter, la base jurídica és el
        consentiment de la persona interessada, recollit mitjançant una acció afirmativa clara i
        confirmat mitjançant un procediment de doble opt-in. Al formulari de contacte, la base
        jurídica és l'atenció de la sol·licitud tramesa per la persona interessada i, si escau,
        l'aplicació de mesures precontractuals sol·licitades per aquesta. Per a la mesura agregada
        de l'ús del lloc mitjançant la instància autoallotjada d'Umami, CREUP aplica el seu interès
        legítim a conèixer l'ús bàsic, el rendiment i els errors del lloc sense utilitzar galetes ni
        identificadors persistents.
      </p>

      <h3 class="text-base font-semibold">Finalitats del tractament</h3>

      <p class="text-sm leading-relaxed">
        Les dades personals es recullen i gestionen per atendre sol·licituds i consultes, facilitar
        la relació amb les persones usuàries i, quan existeixi consentiment exprés, gestionar la
        subscripció a la newsletter i trametre les seves comunicacions. Així mateix, CREUP obté
        informació agregada d'ús del lloc amb finalitats estadístiques, tècniques i de millora del
        servei mitjançant una instància pròpia d'Umami configurada sense galetes ni identificadors
        persistents.
      </p>

      <h3 class="text-base font-semibold">Analítica web sense galetes</h3>

      <p class="text-sm leading-relaxed">
        Aquest Lloc Web utilitza una instància autoallotjada d'Umami, gestionada per la mateixa
        CREUP, per obtenir estadístiques agregades d'ús sense emprar galetes de seguiment ni
        identificadors persistents. Segons la documentació oficial d'Umami, la mesura pot incloure
        dades com la URL i el títol de la pàgina visitada, la pàgina de procedència, l'idioma del
        navegador, el navegador, el sistema operatiu, el tipus de dispositiu, la resolució de
        pantalla i mètriques de rendiment.
      </p>

      <p class="text-sm leading-relaxed">
        Quan hi ha paràmetres de campanya a la URL, aquests també es poden registrar amb finalitats
        d'atribució agregada. La localització aproximada es pot inferir a partir de capçaleres de
        geolocalització o de la IP emprada per a la sol·licitud, però l'adreça IP no s'emmagatzema,
        conforme a la documentació oficial d'Umami. Aquesta mesura no identifica personalment
        l'usuari ni fa seguiment entre llocs. Com a referència general sobre el funcionament de
        l'eina, es pot consultar la documentació oficial d'Umami a
        <a
          href="https://docs.umami.is/docs"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline underline-offset-2 hover:no-underline"
          >docs.umami.is/docs</a
        >
        i el seu avís de privacitat a
        <a
          href="https://umami.is/privacy"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline underline-offset-2 hover:no-underline"
          >umami.is/privacy</a
        >.
      </p>

      <h3 class="text-base font-semibold">Terminis de conservació</h3>

      <p class="text-sm leading-relaxed">
        Les dades personals es conservaran únicament durant el temps necessari per a la finalitat
        corresponent. Els missatges enviats pel formulari de contacte es conservaran al correu
        corporatiu durant el temps necessari per gestionar la consulta i, si escau, durant els
        terminis legalment exigibles. Les dades de la newsletter es conservaran mentre la
        subscripció romangui activa. Després de la baixa, CREUP conservarà un registre mínim de
        supressió per evitar nous enviaments no desitjats i atendre possibles incidències o
        reclamacions.
      </p>

      <h3 class="text-base font-semibold">Destinataris de les dades personals</h3>

      <p class="text-sm leading-relaxed">
        Les dades personals no se cedeixen a tercers, llevat d'obligació legal. Les mètriques
        agregades d'ús del lloc es processen en infraestructura pròpia de CREUP mitjançant la seva
        instància autoallotjada d'Umami, per la qual cosa no impliquen la contractació d'un
        proveïdor analític extern per aquest motiu.
      </p>

      <h3 class="text-base font-semibold">Dades de menors</h3>

      <p class="text-sm leading-relaxed">
        De conformitat amb la legislació vigent, els menors de 14 anys necessiten el consentiment de
        pares o tutors legals per al tractament lícit de les seves dades personals.
      </p>

      <h3 class="text-base font-semibold">Confidencialitat i seguretat</h3>

      <p class="text-sm leading-relaxed">
        CREUP es compromet a adoptar les mesures tècniques i organitzatives adequades per garantir
        la seguretat i confidencialitat de les dades personals. El Lloc Web utilitza xifratge
        SSL/TLS per a la transmissió de dades.
      </p>

      <h3 class="text-base font-semibold">Drets de les persones interessades</h3>

      <p class="text-sm leading-relaxed">
        Els usuaris poden exercir els drets següents en virtut del RGPD:
      </p>

      <ul class="list-disc space-y-1 pl-6 text-sm">
        <li>Dret d'accés.</li>
        <li>Dret de rectificació.</li>
        <li>Dret de supressió (dret a l'oblit).</li>
        <li>Dret a la limitació del tractament.</li>
        <li>Dret a la portabilitat de les dades.</li>
        <li>Dret d'oposició.</li>
        <li>Dret a no ser objecte de decisions basades únicament en tractaments automatitzats.</li>
      </ul>

      <p class="text-sm leading-relaxed">
        Els drets es poden exercir mitjançant comunicació escrita adreçada al responsable, amb la
        referència «RGPD-creup.es», incloent-hi dades identificatives, sol·licitud concreta, data i
        signatura, i documentació acreditativa.
      </p>

      <h3 class="text-base font-semibold">Llocs web de tercers</h3>

      <p class="text-sm leading-relaxed">
        El Lloc Web pot contenir enllaços a llocs web de tercers no operats per CREUP. Aquests
        tercers disposen de les seves pròpies polítiques de privacitat i galetes i són responsables
        dels seus propis fitxers i pràctiques de dades.
      </p>

      <h3 class="text-base font-semibold">Reclamacions davant l'autoritat de control</h3>

      <p class="text-sm leading-relaxed">
        Si un usuari considera que el tractament de dades infringeix la legislació aplicable, pot
        presentar una reclamació davant l'Agència Espanyola de Protecció de Dades:
        <a
          href="https://www.aepd.es"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline underline-offset-2 hover:no-underline"
          >aepd.es</a
        >.
      </p>

      <h3 class="text-base font-semibold">Acceptació i canvis</h3>

      <p class="text-sm leading-relaxed">
        L'ús del Lloc Web implica l'acceptació d'aquesta Política de Privacitat. CREUP es reserva el
        dret a modificar aquesta política per canvis legislatius, jurisprudencials o organitzatius.
      </p>
    </section>

    <USeparator />

    <section id="cookies" class="space-y-4">
      <h2 class="text-xl font-bold">V. Política de galetes i emmagatzematge local</h2>

      <p class="text-sm leading-relaxed">
        En aquest lloc web s'utilitzen únicament galetes i mecanismes d'emmagatzematge local
        necessaris per recordar l'idioma, mantenir les sessions d'administració i conservar
        determinades preferències tècniques d'interfície i accessibilitat. La mesura agregada amb
        Umami es descriu aquí i a la Política de Privacitat perquè està configurada sense galetes.
      </p>

      <h3 class="text-base font-semibold">Galetes i tecnologies utilitzades en aquest lloc web</h3>

      <UCard variant="subtle" class="motion-card-subtle">
        <template #header>
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold">Galetes i emmagatzematge tècnic essencials</p>
            <UBadge color="primary" variant="subtle" size="sm">Sempre actives</UBadge>
          </div>
        </template>

        <div class="space-y-3 text-sm">
          <p class="text-muted">
            A continuació s'identifiquen les tecnologies tècniques necessàries per al funcionament
            del lloc web. No es poden desactivar des del mateix lloc perquè són necessàries per
            prestar el servei.
          </p>

          <div class="divide-default space-y-2 divide-y">
            <div class="pt-2 first:pt-0">
              <p class="font-medium">Galeta d'idioma (<code class="text-xs">user-locale</code>)</p>
              <p class="text-muted text-xs">
                Emmagatzema l'idioma seleccionat per l'usuari per mantenir la preferència entre
                sessions. Durada: 1 any.
              </p>
            </div>
            <div class="pt-2">
              <p class="font-medium">Galetes d'autenticació i sessió (better-auth)</p>
              <p class="text-muted text-xs">
                S'utilitzen exclusivament quan un administrador inicia sessió al panell
                d'administració. Inclouen tokens de sessió i autenticació OAuth. No s'empren per als
                visitants públics del lloc.
              </p>
            </div>
            <div class="pt-2">
              <p class="font-medium">Emmagatzematge local de preferències d'interfície</p>
              <p class="text-muted text-xs">
                L'emmagatzematge local del navegador (localStorage) s'empra per recordar
                preferències d'interfície com el mode de color (<code class="text-xs"
                  >nuxt-color-mode</code
                >) i opcions d'accessibilitat (<code class="text-xs">nuxt-a11y-*</code>). Aquesta
                informació no es transmet al servidor i roman únicament al dispositiu de l'usuari.
              </p>
            </div>
          </div>
        </div>
      </UCard>

      <UCard variant="subtle" class="motion-card-subtle">
        <template #header>
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold">Mesura agregada sense galetes</p>
            <UBadge color="neutral" variant="subtle" size="sm">Autoallotjada</UBadge>
          </div>
        </template>

        <div class="space-y-3 text-sm">
          <p class="text-muted">
            A més de les tecnologies tècniques imprescindibles, el lloc realitza una mesura agregada
            de l'ús per millorar-ne el funcionament i detectar incidències.
          </p>

          <div>
            <p class="font-medium">Umami Analytics</p>
            <p class="text-muted text-xs">
              Utilitzem una instància autoallotjada d'Umami gestionada per CREUP. Umami no empra
              galetes, no utilitza identificadors persistents, no fa seguiment entre llocs i tracta
              la informació de manera agregada. La informació general sobre l'eina es pot consultar
              a la documentació oficial d'Umami.
            </p>
          </div>
        </div>
      </UCard>

      <h3 class="text-base font-semibold">Galetes de tercers i xarxes socials</h3>

      <p class="text-sm leading-relaxed">
        Aquest Lloc Web pot incloure enllaços a serveis externs (per exemple, xarxes socials). Si
        l'Usuari accedeix a aquests serveis, els tercers corresponents són responsables de les seves
        pròpies galetes i tractament de dades.
      </p>

      <h3 class="text-base font-semibold">Desactivació, rebuig i eliminació de galetes</h3>

      <p class="text-sm leading-relaxed">
        Els usuaris poden desactivar, rebutjar o eliminar galetes a través de la configuració del
        navegador. Si es bloquegen les galetes tècniques, és possible que algunes funcionalitats del
        lloc web no estiguin disponibles. La mesura agregada amb Umami està configurada sense
        galetes ni identificadors persistents; si aquesta configuració canviés, aquesta política
        s'actualitzaria en conseqüència.
      </p>
    </section>

    <USeparator />

    <section id="enlaces" class="space-y-4">
      <h2 class="text-xl font-bold">VI. Política d'enllaços</h2>

      <p class="text-sm leading-relaxed">
        CREUP podrà posar a disposició de l'Usuari enllaços, directoris i motors de cerca que
        permetin l'accés a llocs web de tercers. El propòsit és facilitar l'accés a la informació
        disponible a internet.
      </p>

      <p class="text-sm leading-relaxed">
        CREUP no comercialitza productes/serveis dels llocs web enllaçats i no garanteix la seva
        disponibilitat tècnica, exactitud, veracitat, validesa o legalitat.
      </p>

      <p class="text-sm leading-relaxed">
        CREUP no assumeix cap responsabilitat pels danys derivats de l'accés, ús, qualitat o
        legalitat del contingut, comunicacions, opinions, productes o serveis de llocs web no
        gestionats per CREUP.
      </p>

      <p class="text-sm leading-relaxed">
        Qualsevol Usuari o tercer que creï un hipervincle des d'un altre lloc web cap al Lloc Web de
        CREUP ha de saber que:
      </p>

      <ul class="list-disc space-y-1 pl-6 text-sm">
        <li>
          No es permet la reproducció total o parcial del contingut/serveis del Lloc Web sense
          autorització expressa.
        </li>
        <li>
          No es permeten declaracions falses, inexactes o incorrectes sobre CREUP o el seu Lloc Web.
        </li>
        <li>
          La creació d'un hipervincle no implica cap relació entre CREUP i el titular del lloc que
          l'estableix.
        </li>
      </ul>
    </section>

    <USeparator />

    <section id="propiedad-intelectual" class="space-y-4">
      <h2 class="text-xl font-bold">VII. Propietat intel·lectual i industrial</h2>

      <p class="text-sm leading-relaxed">
        CREUP, per si mateixa o com a cessionària, és titular de tots els drets de propietat
        intel·lectual i industrial del Lloc Web i dels elements que el componen (incloent-hi, entre
        d'altres, textos, imatges, logotips, disseny i programari). Tots els drets reservats.
      </p>

      <p class="text-sm leading-relaxed">
        Queda expressament prohibida la reproducció, distribució i comunicació pública, inclosa la
        posada a disposició del públic, de tot o part dels continguts del lloc web amb finalitats
        comercials, sense l'autorització de CREUP.
      </p>

      <p class="text-sm leading-relaxed">
        Si un Usuari o tercer considera que algun contingut del Lloc Web vulnera drets de propietat
        intel·lectual, ho haurà de notificar immediatament a CREUP utilitzant les dades de contacte
        de la secció INFORMACIÓ GENERAL.
      </p>
    </section>

    <USeparator />

    <section id="acciones-legales" class="space-y-4">
      <h2 class="text-xl font-bold">VIII. Accions legals, legislació aplicable i jurisdicció</h2>

      <p class="text-sm leading-relaxed">
        CREUP es reserva la facultat de presentar les accions civils o penals que consideri
        oportunes davant l'ús indegut del Lloc Web i els seus continguts o l'incompliment d'aquestes
        Condicions.
      </p>

      <p class="text-sm leading-relaxed">
        La relació entre l'Usuari i CREUP es regeix per la legislació espanyola. Qualsevol
        controvèrsia relativa a la interpretació i/o aplicació d'aquestes Condicions se sotmetrà a
        la jurisdicció ordinària dels tribunals competents.
      </p>
    </section>
  </article>
</template>
