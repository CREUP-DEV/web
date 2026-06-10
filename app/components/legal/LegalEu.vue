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
      <h2 class="text-xl font-bold">I. Informazio orokorra</h2>

      <p class="text-sm leading-relaxed">
        Informazioaren Gizartearen eta Merkataritza Elektronikoaren Zerbitzuei buruzko uztailaren
        11ko 34/2002 Legean (LSSI-CE) jasotako informatzeko betebeharra betez, jarraian webgune
        honen informazio orokorreko datuak ematen dira:
      </p>

      <p class="text-sm leading-relaxed">
        Webgune honen, creup.es eta hari lotutako azpidomeinuen (aurrerantzean, Webgunea)
        titulartasuna COORDINADORA DE REPRESENTANTES DE ESTUDIANTES DE UNIVERSIDADES PÚBLICAS
        erakundeak du, G95324281 IFK duena eta Elkarteen Erregistro Nazionalean 171330 zenbakiarekin
        inskribatua, honako harremanetarako datu hauekin:
      </p>

      <UCard variant="subtle" class="motion-card-subtle">
        <div class="flex flex-col gap-3 text-sm">
          <div class="flex items-start gap-2">
            <UIcon name="i-tabler-map-pin" class="text-primary mt-0.5 size-4 shrink-0" />
            <span
              >Edificio de Estudiantes, Avenida Complutense S/N, Moncloa - Aravaca, 28040, Madrid
              (Madrid), Espainia</span
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
      <h2 class="text-xl font-bold">II. Erabilera-baldintza orokorrak</h2>

      <h3 class="text-base font-semibold">Baldintzen xedea: Webgunea</h3>

      <p class="text-sm leading-relaxed">
        Erabilera Baldintza Orokor hauen (aurrerantzean, Baldintzak) xedea Webgunerako sarbidea eta
        haren erabilera arautzea da. Baldintza hauen ondorioetarako, Webgunetzat hartuko dira
        pantaila-interfazeen kanpoko itxura, bai modu estatikoan bai dinamikoan, nabigazio-zuhaitza,
        integratutako elementu guztiak (aurrerantzean, Edukiak) eta Erabiltzaileei eskaintzen
        zaizkien lineako zerbitzu edo baliabide guztiak (aurrerantzean, Zerbitzuak).
      </p>

      <p class="text-sm leading-relaxed">
        CREUPek Webgunearen eta bertan dauden Edukien eta Zerbitzuen aurkezpena eta konfigurazioa
        edozein unetan eta aurrez abisatu gabe aldatzeko ahalmena gordetzen du. Erabiltzaileak
        onartzen du CREUPek edozein unetan elementu horietako edozein edo haietarako sarbidea eten,
        desaktibatu edota baliogabetu dezakeela.
      </p>

      <p class="text-sm leading-relaxed">
        Webgunerako sarbidea, oro har, doakoa da, Erabiltzaileak kontratatutako
        telekomunikazio-sarearen bidezko konexio-kostuak izan ezik. Eduki edo Zerbitzu jakin batzuen
        erabilerak aldez aurreko harpidetza edo izen-ematea eska dezake.
      </p>

      <h3 class="text-base font-semibold">Erabiltzailea</h3>

      <p class="text-sm leading-relaxed">
        Webgunerako sarbideak, nabigazioak eta erabilerak Erabiltzaile-izaera ematen dute eta,
        nabigazioaren hasieratik, hemen ezarritako Baldintza guztiak onartzea dakarte, baita haien
        ondorengo aldaketak ere, nahitaez bete beharreko legeria aplikagarriari kalterik egin gabe.
      </p>

      <p class="text-sm leading-relaxed">
        Erabiltzaileak Webgunearen erabilera zuzenaren ardura bere gain hartzen du. Erantzukizun
        hori honako hauei zabalduko zaie:
      </p>

      <ul class="list-disc space-y-1 pl-6 text-sm">
        <li>
          CREUPek eskaintzen dituen informazioa, Edukiak edota Zerbitzuak Baldintza hauen, legearen,
          moralaren eta ordena publikoaren arabera egoki erabiltzea.
        </li>
        <li>
          Eduki edo Zerbitzu jakin batzuetarako sarbiderako CREUPek emandako inprimakietan
          Erabiltzaileak emandako datuen egiazkotasuna eta zilegitasuna.
        </li>
      </ul>

      <p class="text-sm leading-relaxed">
        Webgune honetarako sarbide hutsak ez dakar CREUPen eta Erabiltzailearen arteko inolako
        merkataritza-harremanik ezartzea.
      </p>

      <p class="text-sm leading-relaxed">
        Indarrean dagoen legeria betez, Webgune hau bertara sartu edota nabigatu dezaketen pertsona
        guztiei zuzenduta dago. Webgunea batez ere Espainian bizi diren erabiltzaileei zuzenduta
        dago. Erabiltzaile batek beste herrialde batetik sartzen bada, bere ardurapean egiten du eta
        ziurtatu beharko du sarbide horrek tokiko legeria betetzen duela.
      </p>
    </section>

    <USeparator />

    <section id="garantias" class="space-y-4">
      <h2 class="text-xl font-bold">
        III. Sarbidea eta nabigazioa: berme- eta erantzukizun-salbuespena
      </h2>

      <p class="text-sm leading-relaxed">
        CREUPek ez du bermatzen Webgunearen ezta Edukien edo Zerbitzuen jarraitutasuna,
        eskuragarritasuna eta erabilgarritasuna. CREUPek ahalegin guztiak egingo ditu Webguneak ondo
        funtziona dezan, baina ez du bermatzen etenik gabeko ezta akatsik gabeko sarbiderik.
      </p>

      <p class="text-sm leading-relaxed">
        CREUPek ez du bermatzen Webgune honen bidez eskuragarri dagoen edukia edo softwarea akatsik
        gabe dagoenik, ezta Erabiltzailearen sistemei (softwarea eta hardwarea) kalterik eragingo ez
        dienik ere. Inola ere CREUP ez da izango Webgunerako sarbidetik, nabigaziotik edo
        erabileratik eratorritako galera edo kalteen erantzule, besteak beste, sistema informatikoei
        eragindako kalteak edo birusek eragindakoak barne, mugarik gabe.
      </p>

      <p class="text-sm leading-relaxed">
        CREUP ez da izango, halaber, Webgune honen erabilera desegokiagatik gerta litezkeen kalteen
        erantzule, telekomunikazioetako jausiak, etenak edo akatsak barne.
      </p>
    </section>

    <USeparator />

    <section id="privacidad" class="space-y-4">
      <h2 class="text-xl font-bold">IV. Pribatutasun- eta datuen babes-politika</h2>

      <p class="text-sm leading-relaxed">
        CREUPek konpromisoa hartzen du beharrezko neurri tekniko eta antolakuntzakoak hartzeko,
        jasotako datuen arriskuari egokitutako segurtasun-mailaren arabera.
      </p>

      <h3 class="text-base font-semibold">Lege-esparru aplikagarria</h3>

      <ul class="list-disc space-y-1 pl-6 text-sm">
        <li>2016/679 (EB) Erregelamendua (RGPD).</li>
        <li>
          Datu Pertsonalak Babesteari eta Eskubide Digitalak Bermatzeari buruzko 3/2018 Lege
          Organikoa.
        </li>
        <li>1720/2007 Errege Dekretua eta 34/2002 Legea (LSSI-CE), aplikagarria den neurrian.</li>
      </ul>

      <h3 class="text-base font-semibold">Tratamenduaren arduradunaren identitatea</h3>

      <p class="text-sm leading-relaxed">
        Datuen tratamenduaren arduraduna COORDINADORA DE REPRESENTANTES DE ESTUDIANTES DE
        UNIVERSIDADES PÚBLICAS da, G95324281 IFK duena, Elkarteen Erregistro Nazionalean 171330
        zenbakiarekin inskribatua.
      </p>

      <h3 class="text-base font-semibold">Tratamendu-jardueren erregistroa</h3>

      <p class="text-sm leading-relaxed">
        CREUPek webguneko inprimakien bidez jasotako datu pertsonalak arduradunaren erantzukizunpean
        tratatzen dira, kontsultei erantzuteko, newsletterrerako harpidetzak kudeatzeko,
        erabiltzaileekin harremana mantentzeko eta betebehar aplikagarriak betetzeko. Espainiako
        kontrol-agintaritzari buruzko informazioa hemen dago eskuragarri:
        <a
          href="https://www.aepd.es"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline underline-offset-2 hover:no-underline"
          >aepd.es</a
        >.
      </p>

      <h3 class="text-base font-semibold">
        Datu pertsonalen tratamenduari aplikagarri zaizkion printzipioak
      </h3>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <UCard
          v-for="principle in [
            'Zilegitasuna, leialtasuna eta gardentasuna',
            'Helburuaren mugaketa',
            'Datuen minimizazioa',
            'Zehaztasuna',
            'Kontserbazio-epearen mugaketa',
            'Osotasuna eta konfidentzialtasuna',
            'Erantzukizun proaktiboa',
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

      <h3 class="text-base font-semibold">Datu pertsonalen kategoriak</h3>

      <p class="text-sm leading-relaxed">
        CREUPek tratatzen dituen datu-kategoriak datu identifikatzaileak baino ez dira. Ez da
        tratatzen RGPDren 9. artikuluaren zentzuko datu-kategoria berezirik.
      </p>

      <h3 class="text-base font-semibold">Tratamenduaren oinarri juridikoa</h3>

      <p class="text-sm leading-relaxed">
        Oinarri juridikoa helburu zehatzaren araberakoa da. Newsletterrean, oinarri juridikoa
        interesdunaren adostasuna da, ekintza baieztatzaile argi baten bidez jasoa eta double opt-in
        prozedura baten bidez berretsia. Harremanetarako inprimakian, oinarri juridikoa interesdunak
        bidalitako eskaerari erantzutea da eta, hala badagokio, hark eskatutako kontratu aurreko
        neurriak aplikatzea. Umamiren auto-ostatatutako instantziaren bidez webgunearen erabileraren
        neurketa agregatua egiteko, CREUPek bere interes legitimoa aplikatzen du, webgunearen
        oinarrizko erabilera, errendimendua eta akatsak ezagutzeko, cookierik ezta identifikatzaile
        iraunkorrik erabili gabe.
      </p>

      <h3 class="text-base font-semibold">Tratamenduaren helburuak</h3>

      <p class="text-sm leading-relaxed">
        Datu pertsonalak eskaerei eta kontsultei erantzuteko, erabiltzaileekin harremana errazteko
        eta, adostasun espresua dagoenean, newsletterrerako harpidetza kudeatzeko eta haren
        komunikazioak bidaltzeko jasotzen eta kudeatzen dira. Halaber, CREUPek webgunearen
        erabileraren informazio agregatua lortzen du helburu estatistiko, tekniko eta zerbitzua
        hobetzekoetarako, cookierik ezta identifikatzaile iraunkorrik gabe konfiguratutako Umamiren
        instantzia propio baten bidez.
      </p>

      <h3 class="text-base font-semibold">Web-analitika cookierik gabe</h3>

      <p class="text-sm leading-relaxed">
        Webgune honek CREUPek berak kudeatutako Umamiren auto-ostatatutako instantzia bat erabiltzen
        du, erabileraren estatistika agregatuak lortzeko, jarraipen-cookierik ezta identifikatzaile
        iraunkorrik erabili gabe. Umamiren dokumentazio ofizialaren arabera, neurketak honako datu
        hauek izan ditzake: bisitatutako orriaren URLa eta titulua, jatorrizko orria,
        nabigatzailearen hizkuntza, nabigatzailea, sistema eragilea, gailu-mota, pantailaren
        bereizmena eta errendimendu-metrikak.
      </p>

      <p class="text-sm leading-relaxed">
        URLan kanpaina-parametroak daudenean, horiek ere erregistratu daitezke esleipen agregatuko
        helburuetarako. Gutxi gorabeherako kokapena geolokalizazio-goiburuetatik edo eskaerarako
        erabilitako IParen bitartez ondoriozta daiteke, baina IP helbidea ez da gordetzen, Umamiren
        dokumentazio ofizialaren arabera. Neurketa honek ez du erabiltzailea pertsonalki
        identifikatzen, ezta guneen arteko jarraipenik egiten ere. Tresnaren funtzionamenduari
        buruzko erreferentzia orokor gisa, Umamiren dokumentazio ofiziala kontsulta daiteke hemen:
        <a
          href="https://docs.umami.is/docs"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline underline-offset-2 hover:no-underline"
          >docs.umami.is/docs</a
        >
        eta haren pribatutasun-oharra hemen:
        <a
          href="https://umami.is/privacy"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline underline-offset-2 hover:no-underline"
          >umami.is/privacy</a
        >.
      </p>

      <h3 class="text-base font-semibold">Kontserbazio-epeak</h3>

      <p class="text-sm leading-relaxed">
        Datu pertsonalak dagokion helburuetarako beharrezkoa den denboran soilik gordeko dira.
        Harremanetarako inprimakiaren bidez bidalitako mezuak posta korporatiboan gordeko dira
        kontsulta kudeatzeko beharrezkoa den denboran eta, hala badagokio, legez exijigarriak diren
        epeetan. Newsletterreko datuak harpidetza aktibo dagoen bitartean gordeko dira. Baja eman
        ondoren, CREUPek ezabaketaren gutxieneko erregistro bat gordeko du nahi ez diren bidalketa
        berriak saihesteko eta gerta litezkeen gorabeherak edo erreklamazioak artatzeko.
      </p>

      <h3 class="text-base font-semibold">Datu pertsonalen hartzaileak</h3>

      <p class="text-sm leading-relaxed">
        Datu pertsonalak ez zaizkie hirugarrenei lagatzen, legezko betebeharra dagoenean izan ezik.
        Webgunearen erabileraren metrika agregatuak CREUPen azpiegitura propioan prozesatzen dira
        Umamiren auto-ostatatutako instantziaren bidez, eta, beraz, ez dakarte kanpoko
        analitika-hornitzaile bat kontratatzea arrazoi horregatik.
      </p>

      <h3 class="text-base font-semibold">Adingabeen datuak</h3>

      <p class="text-sm leading-relaxed">
        Indarrean dagoen legeriaren arabera, 14 urtetik beherakoek gurasoen edo legezko tutoreen
        adostasuna behar dute beren datu pertsonalen tratamendu zilegirako.
      </p>

      <h3 class="text-base font-semibold">Konfidentzialtasuna eta segurtasuna</h3>

      <p class="text-sm leading-relaxed">
        CREUPek konpromisoa hartzen du datu pertsonalen segurtasuna eta konfidentzialtasuna
        bermatzeko neurri tekniko eta antolakuntzako egokiak hartzeko. Webguneak SSL/TLS zifratzea
        erabiltzen du datuak transmititzeko.
      </p>

      <h3 class="text-base font-semibold">Interesdunen eskubideak</h3>

      <p class="text-sm leading-relaxed">
        Erabiltzaileek honako eskubide hauek balia ditzakete RGPDren arabera:
      </p>

      <ul class="list-disc space-y-1 pl-6 text-sm">
        <li>Sarbide-eskubidea.</li>
        <li>Zuzentze-eskubidea.</li>
        <li>Ezabatze-eskubidea (ahazteko eskubidea).</li>
        <li>Tratamendua mugatzeko eskubidea.</li>
        <li>Datuak eramangarri izateko eskubidea.</li>
        <li>Aurka egiteko eskubidea.</li>
        <li>
          Tratamendu automatizatuetan soilik oinarritutako erabakien xede ez izateko eskubidea.
        </li>
      </ul>

      <p class="text-sm leading-relaxed">
        Eskubideak arduradunari zuzendutako idatzizko komunikazioaren bidez balia daitezke,
        «RGPD-creup.es» erreferentziarekin, datu identifikatzaileak, eskaera zehatza, data eta
        sinadura, eta egiaztatze-dokumentazioa barne.
      </p>

      <h3 class="text-base font-semibold">Hirugarrenen webguneak</h3>

      <p class="text-sm leading-relaxed">
        Webguneak CREUPek kudeatzen ez dituen hirugarrenen webguneetarako estekak izan ditzake.
        Hirugarren horiek beren pribatutasun- eta cookie-politika propioak dituzte eta beren
        fitxategi eta datu-praktiken erantzule dira.
      </p>

      <h3 class="text-base font-semibold">Kontrol-agintaritzaren aurreko erreklamazioak</h3>

      <p class="text-sm leading-relaxed">
        Erabiltzaile batek datuen tratamenduak legeria aplikagarria urratzen duela uste badu,
        erreklamazioa aurkez dezake Datuak Babesteko Espainiako Agentziaren aurrean:
        <a
          href="https://www.aepd.es"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline underline-offset-2 hover:no-underline"
          >aepd.es</a
        >.
      </p>

      <h3 class="text-base font-semibold">Onarpena eta aldaketak</h3>

      <p class="text-sm leading-relaxed">
        Webgunearen erabilerak Pribatutasun Politika hau onartzea dakar. CREUPek politika hau
        aldaketa legegile, jurisprudentzial edo antolakuntzakoengatik aldatzeko eskubidea gordetzen
        du.
      </p>
    </section>

    <USeparator />

    <section id="cookies" class="space-y-4">
      <h2 class="text-xl font-bold">V. Cookie- eta tokiko biltegiratze-politika</h2>

      <p class="text-sm leading-relaxed">
        Webgune honetan hizkuntza gogoratzeko, administrazio-saioak mantentzeko eta interfazeko eta
        irisgarritasuneko hobespen tekniko jakin batzuk gordetzeko beharrezkoak diren cookieak eta
        tokiko biltegiratze-mekanismoak baino ez dira erabiltzen. Umamirekin egiten den neurketa
        agregatua hemen eta Pribatutasun Politikan deskribatzen da, cookierik gabe konfiguratuta
        dagoelako.
      </p>

      <h3 class="text-base font-semibold">
        Webgune honetan erabiltzen diren cookieak eta teknologiak
      </h3>

      <UCard variant="subtle" class="motion-card-subtle">
        <template #header>
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold">Funtsezko cookieak eta biltegiratze teknikoa</p>
            <UBadge color="primary" variant="subtle" size="sm">Beti aktibo</UBadge>
          </div>
        </template>

        <div class="space-y-3 text-sm">
          <p class="text-muted">
            Jarraian, webgunearen funtzionamendurako beharrezkoak diren teknologia teknikoak
            identifikatzen dira. Ezin dira webgunetik bertatik desaktibatu, zerbitzua emateko
            beharrezkoak direlako.
          </p>

          <div class="divide-default space-y-2 divide-y">
            <div class="pt-2 first:pt-0">
              <p class="font-medium">
                Hizkuntza-cookiea (<code class="text-xs">user-locale</code>)
              </p>
              <p class="text-muted text-xs">
                Erabiltzaileak hautatutako hizkuntza gordetzen du hobespena saioen artean
                mantentzeko. Iraupena: urtebete.
              </p>
            </div>
            <div class="pt-2">
              <p class="font-medium">Autentifikazio- eta saio-cookieak (better-auth)</p>
              <p class="text-muted text-xs">
                Administratzaile batek administrazio-panelean saioa hasten duenean soilik erabiltzen
                dira. Saio-tokenak eta OAuth autentifikazioa barne hartzen dituzte. Ez dira
                erabiltzen webguneko bisitari publikoentzat.
              </p>
            </div>
            <div class="pt-2">
              <p class="font-medium">Interfaze-hobespenen tokiko biltegiratzea</p>
              <p class="text-muted text-xs">
                Nabigatzailearen tokiko biltegiratzea (localStorage) interfaze-hobespenak
                gogoratzeko erabiltzen da, hala nola kolore-modua (<code class="text-xs"
                  >nuxt-color-mode</code
                >) eta irisgarritasun-aukerak (<code class="text-xs">nuxt-a11y-*</code>). Informazio
                hori ez da zerbitzarira transmititzen eta erabiltzailearen gailuan soilik geratzen
                da.
              </p>
            </div>
          </div>
        </div>
      </UCard>

      <UCard variant="subtle" class="motion-card-subtle">
        <template #header>
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold">Neurketa agregatua cookierik gabe</p>
            <UBadge color="neutral" variant="subtle" size="sm">Auto-ostatatua</UBadge>
          </div>
        </template>

        <div class="space-y-3 text-sm">
          <p class="text-muted">
            Ezinbesteko teknologia teknikoez gain, webguneak erabileraren neurketa agregatu bat
            egiten du bere funtzionamendua hobetzeko eta gorabeherak detektatzeko.
          </p>

          <div>
            <p class="font-medium">Umami Analytics</p>
            <p class="text-muted text-xs">
              CREUPek kudeatutako Umamiren auto-ostatatutako instantzia bat erabiltzen dugu. Umamik
              ez du cookierik erabiltzen, ez du identifikatzaile iraunkorrik erabiltzen, ez du
              guneen arteko jarraipenik egiten eta informazioa modu agregatuan tratatzen du.
              Tresnari buruzko informazio orokorra Umamiren dokumentazio ofizialean kontsulta
              daiteke.
            </p>
          </div>
        </div>
      </UCard>

      <h3 class="text-base font-semibold">Hirugarrenen cookieak eta sare sozialak</h3>

      <p class="text-sm leading-relaxed">
        Webgune honek kanpoko zerbitzuetarako estekak izan ditzake (adibidez, sare sozialak).
        Erabiltzaileak zerbitzu horietara sartzen bada, dagozkien hirugarrenak dira beren cookie eta
        datu-tratamenduaren erantzule.
      </p>

      <h3 class="text-base font-semibold">Cookieak desaktibatzea, baztertzea eta ezabatzea</h3>

      <p class="text-sm leading-relaxed">
        Erabiltzaileek cookieak desaktibatu, baztertu edo ezabatu ditzakete nabigatzailearen
        konfigurazioaren bidez. Cookie teknikoak blokeatzen badira, baliteke webguneko
        funtzionalitate batzuk eskuragarri ez egotea. Umamirekin egiten den neurketa agregatua
        cookierik ezta identifikatzaile iraunkorrik gabe konfiguratuta dago; konfigurazio hori
        aldatuko balitz, politika hau horren arabera eguneratuko litzateke.
      </p>
    </section>

    <USeparator />

    <section id="enlaces" class="space-y-4">
      <h2 class="text-xl font-bold">VI. Esteka-politika</h2>

      <p class="text-sm leading-relaxed">
        CREUPek Erabiltzailearen eskura jar ditzake hirugarrenen webguneetarako sarbidea
        ahalbidetzen duten estekak, direktorioak eta bilatzaileak. Helburua interneten eskuragarri
        dagoen informaziorako sarbidea erraztea da.
      </p>

      <p class="text-sm leading-relaxed">
        CREUPek ez ditu estekatutako webguneen produktuak/zerbitzuak merkaturatzen eta ez du
        bermatzen haien eskuragarritasun teknikoa, zehaztasuna, egiazkotasuna, baliozkotasuna edo
        legezkotasuna.
      </p>

      <p class="text-sm leading-relaxed">
        CREUPek ez du inolako erantzukizunik hartzen CREUPek kudeatzen ez dituen webguneen
        edukiaren, komunikazioen, iritzien, produktuen edo zerbitzuen sarbidetik, erabileratik,
        kalitatetik edo legezkotasunetik eratorritako kalteengatik.
      </p>

      <p class="text-sm leading-relaxed">
        Beste webgune batetik CREUPen Webgunerako hiperesteka bat sortzen duen edozein Erabiltzailek
        edo hirugarrenek jakin behar du:
      </p>

      <ul class="list-disc space-y-1 pl-6 text-sm">
        <li>
          Ez dela onartzen Webgunearen edukia/zerbitzuak osorik edo zati batean berregitea
          berariazko baimenik gabe.
        </li>
        <li>
          Ez direla onartzen CREUPi edo haren Webguneari buruzko adierazpen faltsu, zehaztugabe edo
          okerrak.
        </li>
        <li>
          Hiperesteka baten sorrerak ez duela inolako harremanik ekartzen CREUPen eta hura ezartzen
          duen webgunearen titularraren artean.
        </li>
      </ul>
    </section>

    <USeparator />

    <section id="propiedad-intelectual" class="space-y-4">
      <h2 class="text-xl font-bold">VII. Jabetza intelektuala eta industriala</h2>

      <p class="text-sm leading-relaxed">
        CREUP, bere kabuz edo lagapen-hartzaile gisa, Webgunearen eta hura osatzen duten elementuen
        (besteak beste, testuak, irudiak, logotipoak, diseinua eta softwarea) jabetza intelektual
        eta industrialeko eskubide guztien titularra da. Eskubide guztiak erreserbatuta.
      </p>

      <p class="text-sm leading-relaxed">
        Berariaz debekatuta dago webguneko edukien osotasuna edo zati bat helburu komertzialekin
        berregitea, banatzea eta jendaurrean jakinaraztea, publikoaren eskura jartzea barne, CREUPen
        baimenik gabe.
      </p>

      <p class="text-sm leading-relaxed">
        Erabiltzaile edo hirugarren batek uste badu Webguneko edukiren batek jabetza intelektualeko
        eskubideak urratzen dituela, berehala jakinarazi beharko dio CREUPi, INFORMAZIO OROKORRA
        ataleko harremanetarako datuak erabiliz.
      </p>
    </section>

    <USeparator />

    <section id="acciones-legales" class="space-y-4">
      <h2 class="text-xl font-bold">VIII. Lege-ekintzak, legeria aplikagarria eta jurisdikzioa</h2>

      <p class="text-sm leading-relaxed">
        CREUPek Webgunearen eta haren edukien erabilera desegokiaren edo Baldintza hauen
        ez-betetzearen aurrean egoki iritzitako ekintza zibil edo penalak aurkezteko ahalmena
        gordetzen du.
      </p>

      <p class="text-sm leading-relaxed">
        Erabiltzailearen eta CREUPen arteko harremana Espainiako legeriaren arabera arautzen da.
        Baldintza hauen interpretazioari edota aplikazioari buruzko edozein auzi tribunal eskudunen
        jurisdikzio arruntaren mende egongo da.
      </p>
    </section>
  </article>
</template>
