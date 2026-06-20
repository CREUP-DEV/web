// Single source of truth for the non-Spanish locale translations of the seed-originated
// press articles (the "news"). Spanish lives inline in drizzle/seed.ts (pressData); this
// module adds en/ca/eu/gl/val, keyed by each article's stable slug.
//
// Only title + description are localized: the seed deliberately stores no press body (content_html
// is null on every locale, Spanish included — the scraped bodies are low quality). Localized rows
// therefore mirror the Spanish rows; non-Spanish locales fall back to the Spanish row at render.
//
// Consumed by the dev seed (drizzle/seed.ts) and the idempotent press-translation seed
// (drizzle/seed/press.ts -> `pnpm db:seed:press`), the forward-only, non-destructive way
// to backfill these translations into an existing database (cf. drizzle/seed/content.ts).

export interface SeedPressArticleTranslation {
  locale: string
  title: string
  description: string | null
}

/** Keyed by press article slug. */
export const seedPressArticleTranslations: Record<string, SeedPressArticleTranslation[]> = {
  'el-estudiantado-dice-basta-a-la-subida-de-precios-en-los-com-2025-12': [
    {
      locale: 'en',
      title: 'Students say enough is enough to the price rise in university canteens',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP) and the General Student Delegation of the University of Granada denounce the underfunding of universities and the failure to listen to students.',
    },
    {
      locale: 'ca',
      title: "L'estudiantat diu prou a la pujada de preus als menjadors universitaris",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) i la Delegació General d'Estudiants de la Universitat de Granada denuncien la infrafinançament universitari i la manca d'escolta a l'estudiantat.",
    },
    {
      locale: 'eu',
      title: 'Ikasleek aski dela diote unibertsitateko jangeletako prezioen igoerari',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak (CREUP) eta Granadako Unibertsitateko Ikasleen Ordezkaritza Nagusiak unibertsitateen azpifinantzaketa eta ikasleei entzuteko ezintasuna salatzen dituzte.',
    },
    {
      locale: 'gl',
      title: 'O estudantado di abondo á suba de prezos nos comedores universitarios',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) e a Delegación Xeral de Estudantes da Universidade de Granada denuncian a infrafinanciación universitaria e a falta de escoita ao estudantado.',
    },
    {
      locale: 'val',
      title: "L'estudiantat diu prou a la pujada de preus en els menjadors universitaris",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) i la Delegació General d'Estudiants de la Universitat de Granada denuncien la infrafinançament universitari i la falta d'escolta a l'estudiantat.",
    },
  ],
  'creup-exige-una-estrategia-nacional-de-salud-mental-universi-2025-10': [
    {
      locale: 'en',
      title:
        'CREUP demands a national university mental-health strategy and sufficient resources for its care',
      description:
        "The Coordinator of Student Representatives of Public Universities calls for the launch of a state-wide mental-health strategy in the university sphere and sufficient funding to guarantee students' psychological wellbeing.",
    },
    {
      locale: 'ca',
      title:
        'CREUP exigeix una estratègia nacional de salut mental universitària i recursos suficients per a la seva atenció',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques reclama la posada en marxa d'una estratègia estatal de salut mental en l'àmbit universitari i una dotació econòmica suficient per garantir el benestar psicològic de l'estudiantat.",
    },
    {
      locale: 'eu',
      title:
        'CREUPek unibertsitateko osasun mentalaren estrategia nazional bat eta hura artatzeko baliabide nahikoak eskatzen ditu',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak unibertsitate-eremuan osasun mentalaren estatu mailako estrategia bat abian jartzea eta ikasleen ongizate psikologikoa bermatzeko zuzkidura ekonomiko nahikoa eskatzen ditu.',
    },
    {
      locale: 'gl',
      title:
        'CREUP esixe unha estratexia nacional de saúde mental universitaria e recursos suficientes para a súa atención',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas reclama a posta en marcha dunha estratexia estatal de saúde mental no ámbito universitario e unha dotación económica suficiente para garantir o benestar psicolóxico do estudantado.',
    },
    {
      locale: 'val',
      title:
        'CREUP exigix una estratègia nacional de salut mental universitària i recursos suficients per a la seua atenció',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques reclama la posada en marxa d'una estratègia estatal de salut mental en l'àmbit universitari i una dotació econòmica suficient per a garantir el benestar psicològic de l'estudiantat.",
    },
  ],
  'a-la-espera-del-estatuto-de-becario-el-ministerio-de-trabajo-2025-09': [
    {
      locale: 'en',
      title:
        'Awaiting the Trainee Statute, the Ministry of Labour keeps ignoring the university community',
      description:
        'Just weeks before the scheduled approval of the Trainee Statute, the Ministry of Labour has not contacted any of the most important university stakeholders.',
    },
    {
      locale: 'ca',
      title:
        "A l'espera de l'Estatut del Becari, el Ministeri de Treball continua ignorant la comunitat universitària",
      description:
        "A menys d'unes setmanes de la data prevista de l'aprovació de l'Estatut del Becari, el Ministeri de Treball no s'ha posat en contacte amb cap dels actors universitaris més importants.",
    },
    {
      locale: 'eu',
      title:
        'Bekadunaren Estatutuaren zain, Lan Ministerioak unibertsitate-komunitateari jaramonik egiten ez dio',
      description:
        'Bekadunaren Estatutua onartzeko aurreikusitako datatik aste gutxira, Lan Ministerioak ez du harremanetan jarri unibertsitateko eragile garrantzitsuenetako batekin ere.',
    },
    {
      locale: 'gl',
      title:
        'Á espera do Estatuto do Bolseiro, o Ministerio de Traballo segue ignorando a comunidade universitaria',
      description:
        'A menos dunhas semanas da data prevista da aprobación do Estatuto do Bolseiro, o Ministerio de Traballo non se puxo en contacto con ningún dos actores universitarios máis importantes.',
    },
    {
      locale: 'val',
      title:
        "A l'espera de l'Estatut del Becari, el Ministeri de Treball continua ignorant la comunitat universitària",
      description:
        "A menys d'unes setmanes de la data prevista de l'aprovació de l'Estatut del Becari, el Ministeri de Treball no s'ha posat en contacte amb cap dels actors universitaris més importants.",
    },
  ],
  'creup-denuncia-que-la-subida-del-14-en-el-precio-de-las-habi-2025-09': [
    {
      locale: 'en',
      title:
        'CREUP denounces that the 14% rise in room prices is pushing thousands of students out of public universities',
      description:
        'The Coordinator warns that the housing crisis threatens equal opportunities and demands an urgent plan for public residences, rental aid and price regulation in university cities.',
    },
    {
      locale: 'ca',
      title:
        "CREUP denuncia que la pujada del 14 % en el preu de les habitacions expulsa milers d'estudiants de la universitat pública",
      description:
        "La Coordinadora adverteix que la crisi habitacional amenaça la igualtat d'oportunitats i exigeix un pla urgent de residències públiques, ajudes al lloguer i regulació de preus a les ciutats universitàries.",
    },
    {
      locale: 'eu',
      title:
        'CREUPek salatzen du logelen prezioan izandako % 14ko igoerak milaka ikasle kanporatzen dituela unibertsitate publikotik',
      description:
        'Koordinatzaileak ohartarazten du etxebizitza-krisiak aukera-berdintasuna mehatxatzen duela, eta egoitza publikoen, alokairurako laguntzen eta unibertsitate-hirietako prezioen erregulazioaren plan premiazko bat eskatzen du.',
    },
    {
      locale: 'gl',
      title:
        'CREUP denuncia que a suba do 14 % no prezo dos cuartos expulsa a milleiros de estudantes da universidade pública',
      description:
        'A Coordinadora advirte de que a crise habitacional ameaza a igualdade de oportunidades e esixe un plan urxente de residencias públicas, axudas ao alugueiro e regulación de prezos nas cidades universitarias.',
    },
    {
      locale: 'val',
      title:
        "CREUP denuncia que la pujada del 14 % en el preu de les habitacions expulsa milers d'estudiants de la universitat pública",
      description:
        "La Coordinadora advertix que la crisi habitacional amenaça la igualtat d'oportunitats i exigix un pla urgent de residències públiques, ajudes al lloguer i regulació de preus en les ciutats universitàries.",
    },
  ],
  'creup-denuncia-la-injerencia-en-la-autonomia-universitaria-2025-07': [
    {
      locale: 'en',
      title: 'CREUP denounces interference in university autonomy',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP) warns that the reform of the Law on Social Councils in the Canary Islands undermines university autonomy.',
    },
    {
      locale: 'ca',
      title: "CREUP denuncia la ingerència en l'autonomia universitària",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) alerta que la reforma de la Llei de Consells Socials a Canàries soscava l'autonomia universitària.",
    },
    {
      locale: 'eu',
      title: 'CREUPek unibertsitate-autonomian egindako esku-sartzea salatzen du',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak (CREUP) ohartarazten du Kanarietako Gizarte Kontseiluen Legearen erreformak unibertsitate-autonomia ahultzen duela.',
    },
    {
      locale: 'gl',
      title: 'CREUP denuncia a inxerencia na autonomía universitaria',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) alerta de que a reforma da Lei de Consellos Sociais en Canarias socava a autonomía universitaria.',
    },
    {
      locale: 'val',
      title: "CREUP denuncia la ingerència en l'autonomia universitària",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) alerta que la reforma de la Llei de Consells Socials a Canàries soscava l'autonomia universitària.",
    },
  ],
  'comunicado-de-la-representacion-del-estudiantado-en-apoyo-de-2025-07': [
    {
      locale: 'en',
      title:
        'Statement by the student representation in support of extending the Veterinary degree to 360 ECTS',
      description:
        'From the student representation of the State University Student Council, the Coordinator of Student Representatives of Public Universities and the National Council of Veterinary Students, we wish to express our support for the proposal to amend Order ECI 333/2008 of 13 February, put forward by the Conference of Deans of Veterinary Faculties of Spain. This amendment entails extending the Veterinary degree to 360 ECTS.',
    },
    {
      locale: 'ca',
      title:
        "Comunicat de la representació de l'estudiantat en suport de l'ampliació del grau en veterinària a 360 ECTS",
      description:
        "Des de la representació estudiantil del Consell d'Estudiants Universitari de l'Estat, la Coordinadora de Representants d'Estudiants d'Universitats Públiques i el Consell Nacional d'Estudiants de Veterinària volem mostrar el nostre suport a la proposta de modificació de l'Ordre ECI 333/2008 de 13 de febrer, presentada per la Conferència de Degans i Deganes de Facultats de Veterinària d'Espanya. Aquesta modificació suposa l'ampliació del grau en Veterinària a 360 ECTS.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleen ordezkaritzaren adierazpena Albaitaritzako gradua 360 ECTSetara zabaltzearen alde',
      description:
        'Estatuko Unibertsitateko Ikasleen Kontseiluaren ikasle-ordezkaritzatik, Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzailetik eta Albaitaritzako Ikasleen Kontseilu Nazionaletik, Espainiako Albaitaritza Fakultateetako Dekanoen Konferentziak aurkeztutako 2008ko otsailaren 13ko ECI 333/2008 Aginduaren aldaketa-proposamenari gure babesa adierazi nahi diogu. Aldaketa horrek Albaitaritzako gradua 360 ECTSetara zabaltzea dakar.',
    },
    {
      locale: 'gl',
      title:
        'Comunicado da representación do estudantado en apoio da ampliación do grao en veterinaria a 360 ECTS',
      description:
        'Desde a representación estudantil do Consello de Estudantes Universitario do Estado, a Coordinadora de Representantes de Estudantes de Universidades Públicas e o Consello Nacional de Estudantes de Veterinaria queremos amosar o noso respaldo á proposta de modificación da Orde ECI 333/2008 do 13 de febreiro, presentada pola Conferencia de Decanos e Decanas de Facultades de Veterinaria de España. Dita modificación supón a ampliación do grao en Veterinaria a 360 ECTS.',
    },
    {
      locale: 'val',
      title:
        "Comunicat de la representació de l'estudiantat en suport de l'ampliació del grau en veterinària a 360 ECTS",
      description:
        "Des de la representació estudiantil del Consell d'Estudiants Universitari de l'Estat, la Coordinadora de Representants d'Estudiants d'Universitats Públiques i el Consell Nacional d'Estudiants de Veterinària volem mostrar el nostre suport a la proposta de modificació de l'Orde ECI 333/2008 de 13 de febrer, presentada per la Conferència de Degans i Deganes de Facultats de Veterinària d'Espanya. Esta modificació supon l'ampliació del grau en Veterinària a 360 ECTS.",
    },
  ],
  'universidades-privadas-en-hospitales-publicos-la-conselleria-2025-07': [
    {
      locale: 'en',
      title:
        'Private universities in public hospitals: the Regional Ministry threatens medical training',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP) and the State Council of Medical Students (CEEM) denounce a critical situation that jeopardises the future of public medical education in the Valencian Community.',
    },
    {
      locale: 'ca',
      title:
        'Universitats privades en hospitals públics: la Conselleria amenaça la formació mèdica',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) i el Consell Estatal d'Estudiants de Medicina (CEEM) denuncien una situació crítica que posa en risc el futur de l'educació mèdica pública a la Comunitat Valenciana.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitate pribatuak ospitale publikoetan: Kontseilaritzak mediku-prestakuntza mehatxatzen du',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak (CREUP) eta Medikuntzako Ikasleen Estatu Kontseiluak (CEEM) Valentziar Erkidegoko osasun-arloko hezkuntza publikoaren etorkizuna arriskuan jartzen duen egoera kritiko bat salatzen dute.',
    },
    {
      locale: 'gl',
      title:
        'Universidades privadas en hospitais públicos: a Conselleria ameaza a formación médica',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) e o Consello Estatal de Estudantes de Medicina (CEEM) denuncian unha situación crítica que pon en risco o futuro da educación médica pública na Comunitat Valenciana.',
    },
    {
      locale: 'val',
      title:
        'Universitats privades en hospitals públics: la Conselleria amenaça la formació mèdica',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) i el Consell Estatal d'Estudiants de Medicina (CEEM) denuncien una situació crítica que posa en risc el futur de l'educació mèdica pública en la Comunitat Valenciana.",
    },
  ],
  'el-estudiantado-apuesta-por-una-universidad-de-calidad-2025-05': [
    {
      locale: 'en',
      title: 'Students back a quality university',
      description:
        "The Coordinator of Student Representatives of Public Universities (CREUP) expresses its support for the Government's proposed reform of Royal Decree 640/2021 on the creation, recognition and authorisation of universities and university centres, and the institutional accreditation of university centres.",
    },
    {
      locale: 'ca',
      title: "L'estudiantat aposta per una universitat de qualitat",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) mostra el seu suport al projecte presentat pel Govern de reforma del Reial Decret 640/2021 de creació, reconeixement i autorització d'universitats i centres universitaris, i acreditació institucional de centres universitaris.",
    },
    {
      locale: 'eu',
      title: 'Ikasleek kalitatezko unibertsitatearen alde egiten dute',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak (CREUP) Gobernuak aurkeztutako 640/2021 Errege Dekretuaren erreforma-proiektuari babesa adierazten dio; dekretu horrek unibertsitateak eta unibertsitate-zentroak sortzea, aitortzea eta baimentzea, eta unibertsitate-zentroen erakunde-egiaztapena arautzen ditu.',
    },
    {
      locale: 'gl',
      title: 'O estudantado aposta por unha universidade de calidade',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) amosa o seu apoio ao proxecto presentado polo Goberno de reforma do Real Decreto 640/2021 de creación, recoñecemento e autorización de universidades e centros universitarios, e acreditación institucional de centros universitarios.',
    },
    {
      locale: 'val',
      title: "L'estudiantat aposta per una universitat de qualitat",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) mostra el seu suport al projecte presentat pel Govern de reforma del Reial Decret 640/2021 de creació, reconeixement i autorització d'universitats i centres universitaris, i acreditació institucional de centres universitaris.",
    },
  ],
  'creup-celebra-su-77-asamblea-general-ordinaria-en-la-univers-2025-04': [
    {
      locale: 'en',
      title: 'CREUP holds its 77th Ordinary General Assembly at the University of Seville',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP), the highest representative body of Spanish students, holds its 77th Ordinary General Assembly at the University of Seville.',
    },
    {
      locale: 'ca',
      title: 'CREUP celebra la seva 77a assemblea general ordinària a la Universitat de Sevilla',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP), el màxim òrgan de representació de l'estudiantat espanyol, celebra la seva 77a Assemblea General Ordinària a la Universitat de Sevilla.",
    },
    {
      locale: 'eu',
      title: 'CREUPek bere 77. Ohiko Batzar Nagusia egiten du Sevillako Unibertsitatean',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak (CREUP), Espainiako ikasleen ordezkaritza-organo gorenak, bere 77. Ohiko Batzar Nagusia egiten du Sevillako Unibertsitatean.',
    },
    {
      locale: 'gl',
      title: 'CREUP celebra a súa 77.ª asemblea xeral ordinaria na Universidade de Sevilla',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP), o máximo órgano de representación do estudantado español, celebra a súa 77.ª Asemblea Xeral Ordinaria na Universidade de Sevilla.',
    },
    {
      locale: 'val',
      title: 'CREUP celebra la seua 77a assemblea general ordinària en la Universitat de Sevilla',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP), el màxim òrgan de representació de l'estudiantat espanyol, celebra la seua 77a Assemblea General Ordinària en la Universitat de Sevilla.",
    },
  ],
  'el-estudiantado-lamenta-los-hechos-producidos-por-la-dana-y-2024-10': [
    {
      locale: 'en',
      title:
        "Students mourn the events caused by the DANA and ask universities not to gamble with people's lives",
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP) has drawn up a series of measures for students and for universities.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat lamenta els fets produïts per la DANA i demana a les universitats que no juguin amb la vida de les persones",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) ha elaborat una sèrie de mesures per a l'estudiantat i per a les universitats.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek DANAk eragindako gertaerak deitoratzen dituzte eta unibertsitateei eskatzen diete pertsonen bizitzarekin ez jolasteko',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak (CREUP) ikasleentzako eta unibertsitateentzako neurri sorta bat prestatu du.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado lamenta os feitos producidos pola DANA e pide ás universidades que non xoguen coa vida das persoas',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) elaborou unha serie de medidas para o estudantado e para as universidades.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat lamenta els fets produïts per la DANA i demana a les universitats que no juguen amb la vida de les persones",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) ha elaborat una sèrie de mesures per a l'estudiantat i per a les universitats.",
    },
  ],
  'el-ministerio-de-trabajo-sigue-sin-reunirse-con-el-estudiant-2024-10': [
    {
      locale: 'en',
      title:
        'The Ministry of Labour still has not met with university students to finalise the Trainee Statute',
      description:
        'We have never supported the text agreed with the unions and the Ministry of Labour, and we hope that after the public consultation we will have a meeting with the ministry.',
    },
    {
      locale: 'ca',
      title:
        "El Ministeri de Treball continua sense reunir-se amb l'estudiantat universitari per enllestir l'Estatut del Becari",
      description:
        "En cap moment hem donat suport al text acordat amb sindicats i Treball, i esperem que després de l'audiència pública tinguem una reunió amb el ministeri.",
    },
    {
      locale: 'eu',
      title:
        'Lan Ministerioak ez du oraindik unibertsitateko ikasleekin bildu Bekadunaren Estatutua ixteko',
      description:
        'Inoiz ez dugu sindikatuekin eta Lan Ministerioarekin adostutako testua babestu, eta espero dugu entzunaldi publikoaren ondoren ministerioarekin bilera bat izatea.',
    },
    {
      locale: 'gl',
      title:
        'O Ministerio de Traballo segue sen reunirse co estudantado universitario para ultimar o Estatuto do Bolseiro',
      description:
        'En ningún momento apoiamos o texto acordado cos sindicatos e Traballo, e esperamos que tras a audiencia pública teñamos unha reunión co ministerio.',
    },
    {
      locale: 'val',
      title:
        "El Ministeri de Treball continua sense reunir-se amb l'estudiantat universitari per a enllestir l'Estatut del Becari",
      description:
        "En cap moment hem donat suport al text acordat amb sindicats i Treball, i esperem que després de l'audiència pública tingam una reunió amb el ministeri.",
    },
  ],
  'el-estudiantado-espanol-denuncia-las-violentas-actuaciones-c-2024-07': [
    {
      locale: 'en',
      title: 'Spanish students denounce the violent actions against students in Bangladesh',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP) makes clear that the repression and persecution taking place in Bangladesh must end, and denounces the killing of students.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat espanyol denuncia les violentes actuacions contra l'estudiantat de Bangladesh",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) deixa clar que les repressions i les persecucions que s'estan donant a Bangladesh han d'acabar, i denuncien els assassinats d'estudiants.",
    },
    {
      locale: 'eu',
      title: 'Espainiako ikasleek Bangladeshko ikasleen aurkako jardun bortitzak salatzen dituzte',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak (CREUP) argi uzten du Bangladeshen gertatzen ari diren errepresioek eta jazarpenek amaitu behar dutela, eta ikasleen hilketak salatzen ditu.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado español denuncia as violentas actuacións contra o estudantado de Bangladesh',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) deixa claro que as represións e as persecucións que se están dando en Bangladesh deben rematar, e denuncian os asasinatos de estudantes.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat espanyol denuncia les violentes actuacions contra l'estudiantat de Bangladesh",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) deixa clar que les repressions i les persecucions que s'estan donant a Bangladesh han d'acabar, i denuncien els assassinats d'estudiants.",
    },
  ],
  'creup-rechaza-los-acuerdos-firmados-en-el-pacto-sobre-la-pru-2024-07': [
    {
      locale: 'en',
      title:
        'CREUP rejects the agreements signed in the pact on the University Entrance Exam (PAU) in the Autonomous Communities governed by the Partido Popular',
      description:
        'We consider it essential to adapt the University Entrance Exam (PAU) to the curricular realities within our state, in order to prevent this exam from degenerating into an unfair disparity between the different autonomous communities.',
    },
    {
      locale: 'ca',
      title:
        "CREUP rebutja els acords signats en el pacte sobre la Prova d'Accés a la Universitat (PAU) a les CC. AA. governades pel Partido Popular",
      description:
        "Considerem fonamental l'adequació de la Prova d'Accés a la Universitat (PAU) a les realitats curriculars dins del nostre estat amb l'objectiu d'evitar que aquesta prova degeneri en un greuge comparatiu entre les diferents comunitats autònomes.",
    },
    {
      locale: 'eu',
      title:
        'CREUPek Partido Popularrek gobernatzen dituzten autonomia-erkidegoetan Unibertsitatera Sartzeko Probari (PAU) buruzko itunean sinatutako akordioak baztertzen ditu',
      description:
        'Funtsezkotzat jotzen dugu Unibertsitatera Sartzeko Proba (PAU) gure estatuko errealitate kurrikularretara egokitzea, proba hori autonomia-erkidego desberdinen arteko bidegabekeria konparatibo bihur ez dadin.',
    },
    {
      locale: 'gl',
      title:
        'CREUP rexeita os acordos asinados no pacto sobre a Proba de Acceso á Universidade (PAU) nas CC. AA. gobernadas polo Partido Popular',
      description:
        'Consideramos fundamental a adecuación da Proba de Acceso á Universidade (PAU) ás realidades curriculares dentro do noso estado co obxectivo de evitar que esta proba dexenere nun agravio comparativo entre as diferentes comunidades autónomas.',
    },
    {
      locale: 'val',
      title:
        "CREUP rebutja els acords signats en el pacte sobre la Prova d'Accés a la Universitat (PAU) en les CC. AA. governades pel Partido Popular",
      description:
        "Considerem fonamental l'adequació de la Prova d'Accés a la Universitat (PAU) a les realitats curriculars dins del nostre estat amb l'objectiu d'evitar que esta prova degenere en un greuge comparatiu entre les diferents comunitats autònomes.",
    },
  ],
  'creup-responde-a-las-universidades-israelies-y-al-gobierno-y-2024-05': [
    {
      locale: 'en',
      title:
        'CREUP responds to Israeli universities and to the Government and asks that Spanish universities keep their word',
      description:
        'The encampments in support of Palestine are not ending at most universities despite the recognition of Palestine by the Prime Minister; CREUP states that this is not enough and that the demands of the students at the encampments must be met.',
    },
    {
      locale: 'ca',
      title:
        'CREUP respon a les universitats israelianes i al govern i demana que les universitats espanyoles compleixin la seva paraula',
      description:
        "Les acampades a favor de Palestina no s'acaben a la majoria d'universitats malgrat el reconeixement de Palestina pel president del govern; CREUP indica que això no és suficient i que s'han d'atendre les demandes dels estudiants de les acampades.",
    },
    {
      locale: 'eu',
      title:
        'CREUPek Israelgo unibertsitateei eta gobernuari erantzuten die eta espainiar unibertsitateei hitza betetzeko eskatzen die',
      description:
        'Palestinaren aldeko kanpaldiak ez dira amaitzen unibertsitate gehienetan, gobernuko presidenteak Palestina aitortu arren; CREUPek adierazten du hori ez dela nahikoa eta kanpaldietako ikasleen eskaerak aintzat hartu behar direla.',
    },
    {
      locale: 'gl',
      title:
        'CREUP responde ás universidades israelís e ao goberno e pide que as universidades españolas cumpran a súa palabra',
      description:
        'As acampadas a favor de Palestina non rematan na maioría de universidades a pesar do recoñecemento de Palestina polo presidente do goberno; CREUP indica que isto non é suficiente e que se deben atender as demandas dos estudantes das acampadas.',
    },
    {
      locale: 'val',
      title:
        'CREUP respon a les universitats israelianes i al govern i demana que les universitats espanyoles complisquen la seua paraula',
      description:
        "Les acampades a favor de Palestina no s'acaben en la majoria d'universitats malgrat el reconeixement de Palestina pel president del govern; CREUP indica que això no és suficient i que s'han d'atendre les demandes dels estudiants de les acampades.",
    },
  ],
  'creup-defiende-las-protestas-en-apoyo-a-palestina-2024-05': [
    {
      locale: 'en',
      title: 'CREUP defends the protests in support of Palestine',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP) welcomes that, after months of student demands, the university system has finally taken a step forward in defence of the Palestinian people.',
    },
    {
      locale: 'ca',
      title: 'CREUP defensa les protestes en suport a Palestina',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) celebra que, després de mesos de reivindicacions de l'estudiantat, finalment el sistema universitari faci un pas endavant en la defensa del poble palestí.",
    },
    {
      locale: 'eu',
      title: 'CREUPek Palestinaren aldeko protestak defendatzen ditu',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak (CREUP) ospatzen du, ikasleen hilabeteetako aldarrikapenen ondoren, azkenean unibertsitate-sistemak aurrerapauso bat eman duela herri palestinarraren defentsan.',
    },
    {
      locale: 'gl',
      title: 'CREUP defende as protestas en apoio a Palestina',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) celebra que, tras meses de reivindicacións do estudantado, finalmente o sistema universitario dea un paso adiante na defensa do pobo palestino.',
    },
    {
      locale: 'val',
      title: 'CREUP defén les protestes en suport a Palestina',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) celebra que, després de mesos de reivindicacions de l'estudiantat, finalment el sistema universitari faça un pas avant en la defensa del poble palestí.",
    },
  ],
  'los-estudiantes-piden-al-gobierno-retomar-las-negociaciones-2023-12': [
    {
      locale: 'en',
      title:
        'Students ask the Government to resume negotiations on the new University Student Statute',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP) urges the Ministry of Science, Innovation and Universities to resume negotiations on the University Student Statute, which were halted before the electoral campaign.',
    },
    {
      locale: 'ca',
      title:
        "Els estudiants demanen al Govern reprendre les negociacions del nou Estatut de l'Estudiant Universitari",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) insta el Ministeri de Ciència, Innovació i Universitats a recuperar les negociacions de l'Estatut de l'Estudiant Universitari, que van ser aturades abans de la campanya electoral.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek Gobernuari Unibertsitateko Ikaslearen Estatutu berriaren negoziazioak berreskuratzeko eskatzen diote',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak (CREUP) Zientzia, Berrikuntza eta Unibertsitateen Ministerioari eskatzen dio Unibertsitateko Ikaslearen Estatutuaren negoziazioak berreskuratzeko, hauteskunde-kanpaina baino lehen geldiarazi baitziren.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes piden ao Goberno retomar as negociacións do novo Estatuto do Estudante Universitario',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) insta o Ministerio de Ciencia, Innovación e Universidades a recuperar as negociacións do Estatuto do Estudante Universitario, que foron detidas antes da campaña electoral.',
    },
    {
      locale: 'val',
      title:
        "Els estudiants demanen al Govern reprendre les negociacions del nou Estatut de l'Estudiant Universitari",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) insta el Ministeri de Ciència, Innovació i Universitats a recuperar les negociacions de l'Estatut de l'Estudiant Universitari, que van ser detingudes abans de la campanya electoral.",
    },
  ],
  'la-creup-pide-al-gobierno-que-esta-legislatura-los-estudiant-2023-11': [
    {
      locale: 'en',
      title: 'CREUP urges the Government not to make students the great forgotten again this term',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP) hopes that the same mistakes of the previous term will not be repeated and that dialogue and negotiation, also with the student body, will be prioritised.',
    },
    {
      locale: 'ca',
      title:
        'La CREUP demana al Govern que aquesta legislatura els estudiants no tornin a ser els grans oblidats',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) espera que no es tornin a repetir els mateixos errors de la legislatura passada i que s'aposti pel diàleg i la negociació, també amb l'estudiantat.",
    },
    {
      locale: 'eu',
      title:
        'CREUPek Gobernuari eskatu dio legealdi honetan ikasleak berriro ahaztuenak izan ez daitezen',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinakundeak (CREUP) espero du iragan legealdiko akats berberak ez direla errepikatuko eta elkarrizketaren eta negoziazioaren alde egingo dela, baita ikasleekin ere.',
    },
    {
      locale: 'gl',
      title:
        'A CREUP pídelle ao Goberno que esta lexislatura os estudantes non volvan ser os grandes esquecidos',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) agarda que non se volvan repetir os mesmos erros da pasada lexislatura e que se aposte polo diálogo e a negociación, tamén co estudantado.',
    },
    {
      locale: 'val',
      title:
        'La CREUP demana al Govern que esta legislatura els estudiants no tornen a ser els grans oblidats',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) espera que no es tornen a repetir els mateixos errors de la legislatura passada i que s'aposte pel diàleg i la negociació, també amb l'estudiantat.",
    },
  ],
  'aumentan-las-penalizaciones-e-intereses-economicos-para-los-2023-11': [
    {
      locale: 'en',
      title: 'Penalties and financial interest increase for the most disadvantaged students',
      description:
        'The Government of Spain again legislates without taking universities and students into account. Repaying the amount of the MEFP scholarships for the 2023/2024 academic year will entail financial interest for students who do not meet the academic criteria.',
    },
    {
      locale: 'ca',
      title:
        'Augmenten les penalitzacions i els interessos econòmics per als estudiants més desfavorits',
      description:
        "El Govern d'Espanya torna a legislar sense tenir en compte les universitats i l'estudiantat. La devolució de l'import de les beques MEFP per a l'any 2023/2024 comportarà un interès econòmic per a l'estudiantat que no superi els criteris acadèmics.",
    },
    {
      locale: 'eu',
      title: 'Zigorrak eta interes ekonomikoak handitzen dira ikasle behartsuenentzat',
      description:
        'Espainiako Gobernuak berriro legegintzan dihardu unibertsitateak eta ikasleak kontuan hartu gabe. 2023/2024 ikasturteko MEFP beken zenbatekoa itzultzeak interes ekonomikoa ekarriko die irizpide akademikoak gainditzen ez dituzten ikasleei.',
    },
    {
      locale: 'gl',
      title:
        'Aumentan as penalizacións e intereses económicos para os estudantes máis desfavorecidos',
      description:
        'O Goberno de España volve lexislar sen ter en conta as universidades e o estudantado. A devolución do importe das bolsas MEFP para o ano 2023/2024 conlevará un interese económico para o estudantado que non supere os criterios académicos.',
    },
    {
      locale: 'val',
      title:
        'Augmenten les penalitzacions i els interessos econòmics per als estudiants més desfavorits',
      description:
        "El Govern d'Espanya torna a legislar sense tindre en compte les universitats i l'estudiantat. La devolució de l'import de les beques MEFP per a l'any 2023/2024 comportarà un interés econòmic per a l'estudiantat que no supere els criteris acadèmics.",
    },
  ],
  'espana-acogera-en-zaragoza-la-46-edicion-de-la-european-stud-2023-09': [
    {
      locale: 'en',
      title: 'Spain will host the 46th edition of the European Student Convention in Zaragoza',
      description:
        "This month CREUP will hold in the Aragonese capital an event that will bring together university students from the more than 27 countries that make up the European Students' Union (ESU), the main student representation body at European level.",
    },
    {
      locale: 'ca',
      title: 'Espanya acollirà a Saragossa la 46a edició de la European Student Convention',
      description:
        "La CREUP celebrarà aquest mes a la capital aragonesa un esdeveniment que aplegarà els universitaris de més de 27 països que formen part de la European Students' Union (ESU), el principal òrgan de representació estudiantil a nivell europeu.",
    },
    {
      locale: 'eu',
      title: 'Espainiak European Student Convention ekitaldiaren 46. edizioa hartuko du Zaragozan',
      description:
        "CREUPek hilabete honetan Aragoiko hiriburuan egingo du European Students' Union (ESU) osatzen duten 27 herrialde baino gehiagotako unibertsitateko ikasleak bilduko dituen ekitaldi bat; ESU da Europa mailako ikasle-ordezkaritzako organo nagusia.",
    },
    {
      locale: 'gl',
      title: 'España acollerá en Zaragoza a 46.ª edición da European Student Convention',
      description:
        "A CREUP celebrará este mes na capital aragonesa un evento que congregará os universitarios de máis de 27 países que forman parte da European Students' Union (ESU), o principal órgano de representación estudantil a nivel europeo.",
    },
    {
      locale: 'val',
      title: 'Espanya acollirà a Saragossa la 46a edició de la European Student Convention',
      description:
        "La CREUP celebrarà este mes en la capital aragonesa un esdeveniment que aplegarà els universitaris de més de 27 països que formen part de la European Students' Union (ESU), el principal òrgan de representació estudiantil a nivell europeu.",
    },
  ],
  'el-estudiantado-de-las-universidades-publicas-condena-los-me-2023-09': [
    {
      locale: 'en',
      title: 'Students at public universities condemn the sexist messages in a hazing chat',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP) rejects the messages posted last Friday in a Teacher Training WhatsApp group at the University of La Rioja.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat de les universitats públiques condemna els missatges masclistes en un xat de novatades",
      description:
        "Des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) rebutgen els missatges emesos el divendres passat en un grup de WhatsApp de Magisteri a la Universitat de La Rioja.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitate publikoetako ikasleek nobatada txat batean egindako mezu matxistak gaitzetsi dituzte',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinakundeak (CREUP) joan den ostiralean La Riojako Unibertsitateko Magisteritzako WhatsApp talde batean igorritako mezuak gaitzesten ditu.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado das universidades públicas condena as mensaxes machistas nunha conversa de novatadas',
      description:
        'Desde a Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) rexeitan as mensaxes emitidas o pasado venres nun grupo de WhatsApp de Maxisterio na Universidade de La Rioja.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat de les universitats públiques condemna els missatges masclistes en un xat de novatades",
      description:
        "Des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) rebutgen els missatges emesos el divendres passat en un grup de WhatsApp de Magisteri en la Universitat de La Rioja.",
    },
  ],
  'maria-navarro-nueva-presidenta-de-la-creup-2023-08': [
    {
      locale: 'en',
      title: 'María Navarro, new president of CREUP',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP), the highest representative body of Spanish students, has elected at its latest assembly its new Executive Committee.',
    },
    {
      locale: 'ca',
      title: 'María Navarro, nova presidenta de la CREUP',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP), el màxim òrgan de representació de l'estudiantat espanyol, ha escollit en la seva darrera assemblea la que serà la seva nova Comissió Executiva.",
    },
    {
      locale: 'eu',
      title: 'María Navarro, CREUPeko presidente berria',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak (CREUP), Espainiako ikasleen ordezkaritza-organo gorenak, bere azken batzarrean aukeratu du bere Batzorde Betearazle berria izango dena.',
    },
    {
      locale: 'gl',
      title: 'María Navarro, nova presidenta da CREUP',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP), o máximo órgano de representación do estudantado español, elixiu na súa última asemblea a que será a súa nova Comisión Executiva.',
    },
    {
      locale: 'val',
      title: 'María Navarro, nova presidenta de la CREUP',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP), el màxim òrgan de representació de l'estudiantat espanyol, ha triat en la seua última assemblea la que serà la seua nova Comissió Executiva.",
    },
  ],
  'el-estudiantado-de-las-universidades-publicas-condena-los-me-2023-08': [
    {
      locale: 'en',
      title: 'Students at public universities condemn the sexist messages in a hazing chat',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP) rejects the messages posted last Friday in a Teacher Training WhatsApp group at the University of La Rioja.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat de les universitats públiques condemna els missatges masclistes en un xat de novatades",
      description:
        "Des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) rebutgen els missatges emesos el divendres passat en un grup de WhatsApp de Magisteri a la Universitat de La Rioja.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitate publikoetako ikasleek nobatada txat batean egindako mezu matxistak gaitzetsi dituzte',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinakundeak (CREUP) joan den ostiralean La Riojako Unibertsitateko Magisteritzako WhatsApp talde batean igorritako mezuak gaitzesten ditu.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado das universidades públicas condena as mensaxes machistas nunha conversa de novatadas',
      description:
        'Desde a Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) rexeitan as mensaxes emitidas o pasado venres nun grupo de WhatsApp de Maxisterio na Universidade de La Rioja.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat de les universitats públiques condemna els missatges masclistes en un xat de novatades",
      description:
        "Des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) rebutgen els missatges emesos el divendres passat en un grup de WhatsApp de Magisteri en la Universitat de La Rioja.",
    },
  ],
  'creup-se-reune-con-los-partidos-politicos-para-trasladar-las-2023-07': [
    {
      locale: 'en',
      title: 'CREUP meets with the political parties to convey the demands of students',
      description:
        'In an effort to secure significant improvements in the university system, the student representatives have held meetings with representatives of the Partido Popular (PP), the Partido Socialista Obrero Español (PSOE), Sumar and Esquerra Republicana de Catalunya (ERC).',
    },
    {
      locale: 'ca',
      title:
        "CREUP es reuneix amb els partits polítics per traslladar les reivindicacions de l'estudiantat",
      description:
        "En un esforç per assegurar millores significatives en el sistema universitari, els representants de l'estudiantat han mantingut trobades amb representants del Partido Popular (PP), el Partido Socialista Obrero Español (PSOE), Sumar i Esquerra Republicana de Catalunya (ERC).",
    },
    {
      locale: 'eu',
      title: 'CREUP alderdi politikoekin biltzen da ikasleen aldarrikapenak helarazteko',
      description:
        'Unibertsitate-sisteman hobekuntza esanguratsuak lortzeko ahaleginean, ikasleen ordezkariek bilerak izan dituzte Partido Popular (PP), Partido Socialista Obrero Español (PSOE), Sumar eta Esquerra Republicana de Catalunya (ERC) alderdietako ordezkariekin.',
    },
    {
      locale: 'gl',
      title:
        'CREUP reúnese cos partidos políticos para trasladar as reivindicacións do estudantado',
      description:
        'Nun esforzo por asegurar melloras significativas no sistema universitario, os representantes do estudantado mantiveron encontros con representantes do Partido Popular (PP), o Partido Socialista Obrero Español (PSOE), Sumar e Esquerra Republicana de Catalunya (ERC).',
    },
    {
      locale: 'val',
      title:
        "CREUP es reunix amb els partits polítics per a traslladar les reivindicacions de l'estudiantat",
      description:
        "En un esforç per a assegurar millores significatives en el sistema universitari, els representants de l'estudiantat han mantingut trobades amb representants del Partido Popular (PP), el Partido Socialista Obrero Español (PSOE), Sumar i Esquerra Republicana de Catalunya (ERC).",
    },
  ],
  'creup-reivindica-la-nueva-legislatura-como-una-nueva-oportun-2023-07': [
    {
      locale: 'en',
      title:
        'CREUP claims the new term of office as a fresh opportunity to improve the university system',
      description:
        'The Coordinator of Student Representatives of Public Universities calls on the political parties to take into account its demands for improving the public university system, among them reforming the Student Statute and improving the scholarship system.',
    },
    {
      locale: 'ca',
      title:
        'CREUP reivindica la nova legislatura com una nova oportunitat per millorar el sistema universitari',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques reclama als partits polítics que es tinguin en consideració les seves reivindicacions per millorar el sistema públic d'universitats, entre les quals s'inclou reformar l'Estatut de l'Estudiant o la millora del sistema de beques.",
    },
    {
      locale: 'eu',
      title:
        'CREUPek legegintzaldi berria unibertsitate-sistema hobetzeko aukera berri gisa aldarrikatzen du',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak alderdi politikoei unibertsitate-sistema publikoa hobetzeko bere aldarrikapenak kontuan har ditzaten eskatzen die; horien artean daude Ikaslearen Estatutua erreformatzea edo beken sistema hobetzea.',
    },
    {
      locale: 'gl',
      title:
        'CREUP reivindica a nova lexislatura como unha nova oportunidade para mellorar o sistema universitario',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas reclama aos partidos políticos que se teñan en consideración as súas reivindicacións para mellorar o sistema público de universidades, entre as que se inclúe reformar o Estatuto do Estudante ou a mellora do sistema de bolsas.',
    },
    {
      locale: 'val',
      title:
        'CREUP reivindica la nova legislatura com una nova oportunitat per a millorar el sistema universitari',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques reclama als partits polítics que es tinguen en consideració les seues reivindicacions per a millorar el sistema públic d'universitats, entre les quals s'inclou reformar l'Estatut de l'Estudiant o la millora del sistema de beques.",
    },
  ],
  'el-estudiantado-universitario-muestra-su-firme-oposicion-al-2023-06': [
    {
      locale: 'en',
      title:
        'University students show their firm opposition to the delay in the social-security contributions for internships',
      description:
        'The Coordinator of Student Representatives of Public Universities warns that this postponement could mean that internships will never come to be covered by social-security contributions, owing to the possible change of government.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat universitari mostra la seva ferma oposició al retard en la cotització de les pràctiques",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques evidencia que aquest ajornament podria suposar que les pràctiques no arribin mai a cotitzar a la seguretat social a causa del possible canvi de govern.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek kontra irmoa agertzen diote praktiken kotizazioaren atzerapenari',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak agerian uzten du atzerapen horrek ekar lezakeela praktikak inoiz gizarte-segurantzan kotizatuak ez izatea, balizko gobernu-aldaketagatik.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado universitario mostra a súa firme oposición ao atraso na cotización das prácticas',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas evidencia que este adiamento podería supoñer que as prácticas nunca cheguen a cotizar na seguridade social debido ao posible cambio de goberno.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat universitari mostra la seua ferma oposició al retard en la cotització de les pràctiques",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques evidencia que este ajornament podria suposar que les pràctiques no apleguen mai a cotitzar en la seguretat social a causa del possible canvi de govern.",
    },
  ],
  'creup-denuncia-la-exclusion-del-estudiantado-en-la-negociaci-2023-06': [
    {
      locale: 'en',
      title:
        'CREUP denounces the exclusion of students from the negotiation of the Trainee Statute',
      description:
        'The Coordinator of Student Representatives of Public Universities opposes the latest statements by CRUE, in which it demands the removal of any kind of compensation for the costs arising from internships, something that is essential to prevent the fraudulent use of students as free labour.',
    },
    {
      locale: 'ca',
      title: "CREUP denuncia l'exclusió de l'estudiantat en la negociació de l'Estatut del Becari",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques s'oposa a les darreres declaracions de la CRUE on exigeix que s'elimini qualsevol tipus de compensació per les despeses derivades de les pràctiques, una cosa que és imprescindible per evitar la utilització fraudulenta de l'estudiantat com a mà d'obra gratuïta.",
    },
    {
      locale: 'eu',
      title: 'CREUPek Bekadunaren Estatutuaren negoziaziotik ikasleak baztertzea salatzen du',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak CRUEren azken adierazpenen aurka egiten du; bertan praktiketatik eratorritako gastuengatiko edozein konpentsazio kentzea eskatzen da, eta hori ezinbestekoa da ikasleak lan-esku doako gisa modu iruzurtian erabiltzea saihesteko.',
    },
    {
      locale: 'gl',
      title: 'CREUP denuncia a exclusión do estudantado na negociación do Estatuto do Bolseiro',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas oponse ás últimas declaracións da CRUE onde esixe que se elimine calquera tipo de compensación polos gastos derivados das prácticas, algo que é imprescindible para evitar a utilización fraudulenta do estudantado como man de obra gratuíta.',
    },
    {
      locale: 'val',
      title: "CREUP denuncia l'exclusió de l'estudiantat en la negociació de l'Estatut del Becari",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques s'oposa a les últimes declaracions de la CRUE on exigix que s'elimine qualsevol tipus de compensació per les despeses derivades de les pràctiques, una cosa que és imprescindible per a evitar la utilització fraudulenta de l'estudiantat com a mà d'obra gratuïta.",
    },
  ],
  'el-estudiantado-universitario-denuncia-que-el-estatuto-del-b-2023-02': [
    {
      locale: 'en',
      title: 'University students denounce that the Trainee Statute is a sham',
      description:
        'After a single approach to student representatives, the Ministry of Labour is finalising the details of one of its flagship projects without taking any interest in the reality of internships at university.',
    },
    {
      locale: 'ca',
      title: "L'estudiantat universitari denuncia que l'Estatut del Becari és un frau",
      description:
        "Després d'un únic acostament amb la representació estudiantil, el Ministeri de Treball ultima els detalls d'un dels seus projectes estrella sense interessar-se per la realitat de les pràctiques a la Universitat.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitateko ikasleek Bekadunaren Estatutua iruzurra dela salatzen dute',
      description:
        'Ikasleen ordezkaritzarekin hurbilketa bakar baten ondoren, Lan Ministerioak bere proiektu izarretako baten xehetasunak ixten ari da, unibertsitateko praktiken errealitateaz arduratu gabe.',
    },
    {
      locale: 'gl',
      title: 'O estudantado universitario denuncia que o Estatuto do Bolseiro é unha fraude',
      description:
        'Tras un único achegamento coa representación estudantil, o Ministerio de Traballo ultima os detalles dun dos seus proxectos estrela sen interesarse pola realidade das prácticas na Universidade.',
    },
    {
      locale: 'val',
      title: "L'estudiantat universitari denuncia que l'Estatut del Becari és un frau",
      description:
        "Després d'un únic acostament amb la representació estudiantil, el Ministeri de Treball ultima els detalls d'un dels seus projectes estrela sense interessar-se per la realitat de les pràctiques en la Universitat.",
    },
  ],
  'bajan-las-matriculas-universitarias-los-problemas-continuan-2023-02': [
    {
      locale: 'en',
      title: 'University tuition fees fall, the problems continue',
      description:
        'The data set out in the latest report by the University System Observatory on public tuition-fee prices shows that the problems the new measures were meant to solve remain pressing for the majority of students.',
    },
    {
      locale: 'ca',
      title: 'Baixen les matrícules universitàries, els problemes continuen',
      description:
        "Les dades exposades en el darrer informe de l'Observatori del Sistema Universitari sobre els preus públics de matrícula evidencien que els problemes que les noves mesures pretenien resoldre continuen sent acuitants per a la majoria d'estudiants.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitateko matrikulak jaitsi egiten dira, arazoek bere horretan jarraitzen dute',
      description:
        'Unibertsitate Sistemaren Behatokiak matrikularen prezio publikoei buruz egindako azken txostenean azaldutako datuek agerian uzten dute neurri berriek konpondu nahi zituzten arazoek larriak izaten jarraitzen dutela ikasle gehienentzat.',
    },
    {
      locale: 'gl',
      title: 'Baixan as matrículas universitarias, os problemas continúan',
      description:
        'Os datos expostos no último informe do Observatorio do Sistema Universitario sobre os prezos públicos de matrícula evidencian que os problemas que as novas medidas pretendían resolver seguen sendo acuciantes para a maioría de estudantes.',
    },
    {
      locale: 'val',
      title: 'Baixen les matrícules universitàries, els problemes continuen',
      description:
        "Les dades exposades en l'últim informe de l'Observatori del Sistema Universitari sobre els preus públics de matrícula evidencien que els problemes que les noves mesures pretenien resoldre continuen sent acuitants per a la majoria d'estudiants.",
    },
  ],
  'querido-estudiante-que-no-te-enganen-2023-01': [
    {
      locale: 'en',
      title: "Dear student: don't let them fool you",
      description:
        'In recent weeks, texts debating the behaviour or commitment of university students have gone viral. Students have become the subject of discussion, as if they had no voice or opinion on the matter. Nothing could be further from the truth: here is the letter from the Coordinator of Student Representatives of Public Universities to the students.',
    },
    {
      locale: 'ca',
      title: "Estimat estudiant: que no t'enganyin",
      description:
        "En les darreres setmanes s'han viralitzat textos que debatien sobre el comportament o la implicació de l'estudiantat universitari. Els estudiants s'han convertit en l'objecte de discussió, com si no tinguessin veu ni opinió en això. Res més lluny de la realitat: aquí la carta de la Coordinadora de Representants d'Estudiants d'Universitats Públiques per a l'estudiantat.",
    },
    {
      locale: 'eu',
      title: 'Ikasle maitea: ez zaitzatela engaina',
      description:
        'Azken asteetan unibertsitateko ikasleen jokabideaz edo inplikazioaz eztabaidatzen zuten testuak biralak egin dira. Ikasleak eztabaidagai bihurtu dira, gai honetan ahotsik edo iritzirik ez balute bezala. Ezer ez errealitatetik urrunago: hona hemen Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak ikasleentzat idatzitako gutuna.',
    },
    {
      locale: 'gl',
      title: 'Querido estudante: que non te enganen',
      description:
        'Nas últimas semanas viralizáronse textos que debatían sobre o comportamento ou a implicación do estudantado universitario. Os estudantes convertéronse no obxecto de discusión, coma se non tivesen voz nin opinión nisto. Nada máis lonxe da realidade: aquí a carta da Coordinadora de Representantes de Estudantes de Universidades Públicas para o estudantado.',
    },
    {
      locale: 'val',
      title: "Estimat estudiant: que no t'enganyen",
      description:
        "En les últimes setmanes s'han viralitzat textos que debatien sobre el comportament o la implicació de l'estudiantat universitari. Els estudiants s'han convertit en l'objecte de discussió, com si no tingueren veu ni opinió en açò. Res més lluny de la realitat: ací la carta de la Coordinadora de Representants d'Estudiants d'Universitats Públiques per a l'estudiantat.",
    },
  ],
  'el-estudiantado-universitario-exige-cambios-urgentes-en-la-l-2022-12': [
    {
      locale: 'en',
      title:
        'University students demand urgent changes to the Organic Law of the University System',
      description:
        'The parliamentary processing of the new University Law continues its course without incorporating significant changes regarding students, once again turning its back on the needs of the largest community within the university.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat universitari exigeix canvis urgents a la Llei Orgànica del Sistema Universitari",
      description:
        "El tràmit parlamentari de la nova Llei d'Universitats continua la seva marxa sense incorporar canvis significatius en matèria d'estudiants, donant l'esquena una vegada més a les necessitats del col·lectiu majoritari de la universitat.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek aldaketa premiazkoak eskatzen dituzte Unibertsitate Sistemaren Lege Organikoan',
      description:
        'Unibertsitateei buruzko Lege berriaren izapide parlamentarioak aurrera jarraitzen du ikasleen arloan aldaketa esanguratsurik txertatu gabe, eta, beste behin, unibertsitateko kolektibo nagusiaren beharrei bizkarra ematen die.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado universitario esixe cambios urxentes na Lei Orgánica do Sistema Universitario',
      description:
        'O trámite parlamentario da nova Lei de Universidades continúa a súa marcha sen incorporar cambios significativos en materia de estudantes, dándolle as costas unha vez máis ás necesidades do colectivo maioritario da universidade.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat universitari exigix canvis urgents en la Llei Orgànica del Sistema Universitari",
      description:
        "El tràmit parlamentari de la nova Llei d'Universitats continua la seua marxa sense incorporar canvis significatius en matèria d'estudiants, donant l'esquena una vegada més a les necessitats del col·lectiu majoritari de la universitat.",
    },
  ],
  'el-ministerio-de-trabajo-abandona-al-estudiantado-en-el-esta-2022-11': [
    {
      locale: 'en',
      title:
        'The Ministry of Labour abandons students in the Statute of the Student in Practical Training',
      description:
        "After several months of demands from university students, Yolanda Díaz's Ministry has drawn up a Statute of the Student on Internships that does not guarantee the quality of academic placements, does not ensure their remuneration, and removes the possibility of carrying them out in public institutions.",
    },
    {
      locale: 'ca',
      title:
        "El Ministeri de Treball abandona l'estudiantat en l'Estatut de l'Estudiant en Formació Pràctica",
      description:
        "Després de diversos mesos de reivindicacions per part de l'estudiantat universitari, el Ministeri de Yolanda Díaz elabora un Estatut de l'Estudiant en Pràctiques que no garanteix la qualitat de les pràctiques acadèmiques, no assegura la seva remuneració i elimina la possibilitat de realitzar-les en institucions públiques.",
    },
    {
      locale: 'eu',
      title:
        'Lan Ministerioak ikasleak bertan behera uzten ditu Praktiketako Ikaslearen Estatutuan',
      description:
        'Unibertsitateko ikasleen hilabeteetako aldarrikapenen ondoren, Yolanda Díazen Ministerioak Praktiketako Ikaslearen Estatutu bat egin du, eta horrek ez du praktika akademikoen kalitatea bermatzen, ez du haien ordainsaria ziurtatzen eta erakunde publikoetan egiteko aukera kentzen du.',
    },
    {
      locale: 'gl',
      title:
        'O Ministerio de Traballo abandona o estudantado no Estatuto do Estudante en Formación Práctica',
      description:
        'Tras varios meses de reivindicacións por parte do estudantado universitario, o Ministerio de Yolanda Díaz elabora un Estatuto do Estudante en Prácticas que non garante a calidade das prácticas académicas, non asegura a súa remuneración e elimina a posibilidade de realizalas en institucións públicas.',
    },
    {
      locale: 'val',
      title:
        "El Ministeri de Treball abandona l'estudiantat en l'Estatut de l'Estudiant en Formació Pràctica",
      description:
        "Després de diversos mesos de reivindicacions per part de l'estudiantat universitari, el Ministeri de Yolanda Díaz elabora un Estatut de l'Estudiant en Pràctiques que no garantix la qualitat de les pràctiques acadèmiques, no assegura la seua remuneració i elimina la possibilitat de realitzar-les en institucions públiques.",
    },
  ],
  'el-ministerio-de-trabajo-ignora-las-reclamaciones-del-estudi-2022-10': [
    {
      locale: 'en',
      title: "The Ministry of Labour ignores students' demands for quality, paid internships",
      description:
        "The Coordinator of Student Representatives of Public Universities (CREUP) calls for a new wording of the Statute of the Student in Practical Training, noting that the current text does not go deeper into the training quality of internships nor offer viable solutions to students' current problems.",
    },
    {
      locale: 'ca',
      title:
        "El Ministeri de Treball ignora les reclamacions de l'estudiantat per aconseguir unes pràctiques remunerades i de qualitat",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) reivindica una nova redacció per a l'Estatut de l'Estudiant en Formació Pràctica, i assenyalen que l'actual text no aprofundeix en la qualitat formativa de les pràctiques ni ofereix solucions viables als problemes actuals de l'estudiantat.",
    },
    {
      locale: 'eu',
      title:
        'Lan Ministerioak ikasleen erreklamazioei ez die jaramonik egiten kalitatezko praktika ordainduak lortzeko',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak (CREUP) Praktiketako Ikaslearen Estatuturako idazketa berri bat aldarrikatzen du, eta adierazten du oraingo testuak ez duela praktiken prestakuntza-kalitatean sakontzen, ezta ikasleen egungo arazoei irtenbide bideragarririk eskaintzen ere.',
    },
    {
      locale: 'gl',
      title:
        'O Ministerio de Traballo ignora as reclamacións do estudantado para lograr unhas prácticas remuneradas e de calidade',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) reivindica unha nova redacción para o Estatuto do Estudante en Formación Práctica, e sinalan que o texto actual non afonda na calidade formativa das prácticas nin ofrece solucións viables aos problemas actuais do estudantado.',
    },
    {
      locale: 'val',
      title:
        "El Ministeri de Treball ignora les reclamacions de l'estudiantat per a aconseguir unes pràctiques remunerades i de qualitat",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) reivindica una nova redacció per a l'Estatut de l'Estudiant en Formació Pràctica, i assenyalen que el text actual no aprofundix en la qualitat formativa de les pràctiques ni oferix solucions viables als problemes actuals de l'estudiantat.",
    },
  ],
  'creup-reivindica-en-el-congreso-una-transformacion-profunda-2022-09': [
    {
      locale: 'en',
      title:
        'CREUP calls in Congress for a profound transformation of the Organic Law of the University System',
      description:
        'The president of CREUP appeared yesterday before the Committee on Science, Innovation and Universities of the Congress of Deputies to call for a transformation of the future University Law, towards a model in which students are the protagonists of their learning and of the governance of the university.',
    },
    {
      locale: 'ca',
      title:
        'CREUP reivindica al Congrés una transformació profunda de la Llei Orgànica del Sistema Universitari',
      description:
        "El president de CREUP va intervenir ahir davant la Comissió de Ciència, Innovació i Universitats del Congrés dels Diputats per reclamar una transformació de la futura Llei d'Universitats, cap a un model en què l'estudiantat sigui protagonista del seu aprenentatge i de la governança de la universitat.",
    },
    {
      locale: 'eu',
      title:
        'CREUPek Kongresuan Unibertsitate Sistemaren Lege Organikoaren eraldaketa sakona aldarrikatzen du',
      description:
        'CREUPen presidenteak atzo Diputatuen Kongresuko Zientzia, Berrikuntza eta Unibertsitateen Batzordearen aurrean hitz egin zuen, etorkizuneko Unibertsitateen Legearen eraldaketa eskatzeko, ikasleak beren ikaskuntzaren eta unibertsitatearen gobernantzaren protagonista diren eredu baterantz.',
    },
    {
      locale: 'gl',
      title:
        'CREUP reivindica no Congreso unha transformación profunda da Lei Orgánica do Sistema Universitario',
      description:
        'O presidente de CREUP interveu onte ante a Comisión de Ciencia, Innovación e Universidades do Congreso dos Deputados para reclamar unha transformación da futura Lei de Universidades, cara a un modelo no que o estudantado sexa protagonista da súa aprendizaxe e da gobernanza da universidade.',
    },
    {
      locale: 'val',
      title:
        'CREUP reivindica en el Congrés una transformació profunda de la Llei Orgànica del Sistema Universitari',
      description:
        "El president de CREUP va intervindre ahir davant la Comissió de Ciència, Innovació i Universitats del Congrés dels Diputats per a reclamar una transformació de la futura Llei d'Universitats, cap a un model en què l'estudiantat siga protagonista del seu aprenentatge i de la governança de la universitat.",
    },
  ],
  'creup-comparece-en-el-congreso-para-defender-las-reivindicac-2022-09': [
    {
      locale: 'en',
      title: 'CREUP appears in Congress to defend the demands of university students',
      description:
        "The president of CREUP, the organisation that represents the students of Spain's public universities, will appear on Wednesday the 21st before the Congress of Deputies to raise students' demands ahead of the parliamentary processing of the Organic Law of the University System.",
    },
    {
      locale: 'ca',
      title:
        "CREUP compareix al Congrés per defensar les reivindicacions de l'estudiantat universitari",
      description:
        "El president de CREUP, l'organització que representa l'estudiantat de les universitats públiques espanyoles, compareixerà dimecres 21 al Congrés dels Diputats per elevar les reivindicacions de l'estudiantat de cara a la tramitació parlamentària de la Llei Orgànica del Sistema Universitari.",
    },
    {
      locale: 'eu',
      title: 'CREUP Kongresuan agertuko da unibertsitateko ikasleen aldarrikapenak defendatzeko',
      description:
        'CREUPen presidentea, Espainiako unibertsitate publikoetako ikasleak ordezkatzen dituen erakundearena, asteazkenean, hilaren 21ean, Diputatuen Kongresuan agertuko da ikasleen aldarrikapenak helarazteko, Unibertsitate Sistemaren Lege Organikoaren izapide parlamentarioari begira.',
    },
    {
      locale: 'gl',
      title:
        'CREUP comparece no Congreso para defender as reivindicacións do estudantado universitario',
      description:
        'O presidente de CREUP, a organización que representa o estudantado das universidades públicas españolas, comparecerá o mércores 21 no Congreso dos Deputados para elevar as reivindicacións do estudantado de cara á tramitación parlamentaria da Lei Orgánica do Sistema Universitario.',
    },
    {
      locale: 'val',
      title:
        "CREUP compareix en el Congrés per a defendre les reivindicacions de l'estudiantat universitari",
      description:
        "El president de CREUP, l'organització que representa l'estudiantat de les universitats públiques espanyoles, compareixerà dimecres 21 en el Congrés dels Diputats per a elevar les reivindicacions de l'estudiantat de cara a la tramitació parlamentària de la Llei Orgànica del Sistema Universitari.",
    },
  ],
  'el-estudiantado-universitario-demanda-al-ministerio-de-traba-2022-08': [
    {
      locale: 'en',
      title:
        'University students call on the Ministry of Labour not to eliminate internships in public bodies',
      description:
        'The Statute of the Student on Internships includes turning extracurricular placements into employment relationships, which would mean the disappearance of all those carried out in public institutions, even though these account for 70 percent of all university internships.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat universitari demana al Ministeri de Treball que no elimini les pràctiques en entitats públiques",
      description:
        "L'Estatut de l'Estudiant en Pràctiques recull la laboralització de les pràctiques extracurriculars, la qual cosa implicaria la desaparició de totes aquelles que es facin en institucions públiques, tot i que aquestes representen el 70 per cent del total de les pràctiques universitàries.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek Lan Ministerioari eskatzen diote erakunde publikoetako praktikak ez ezabatzeko',
      description:
        'Praktiketako Ikaslearen Estatutuak praktika estrakurrikularren lan-bihurtzea jasotzen du, eta horrek erakunde publikoetan egiten diren guztiak desagertzea ekarriko luke, nahiz eta horiek unibertsitateko praktika guztien % 70 izan.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado universitario demanda ao Ministerio de Traballo que non elimine as prácticas en entidades públicas',
      description:
        'O Estatuto do Estudante en Prácticas recolle a laboralización das prácticas extracurriculares, o que implicaría a desaparición de todas aquelas que se realicen en institucións públicas, malia que estas representan o 70 por cento do total das prácticas universitarias.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat universitari demana al Ministeri de Treball que no elimine les pràctiques en entitats públiques",
      description:
        "L'Estatut de l'Estudiant en Pràctiques arreplega la laboralització de les pràctiques extracurriculars, la qual cosa implicaria la desaparició de totes aquelles que es facen en institucions públiques, encara que estes representen el 70 per cent del total de les pràctiques universitàries.",
    },
  ],
  'subirats-deja-de-lado-al-estudiantado-en-el-anteproyecto-de-2022-06': [
    {
      locale: 'en',
      title:
        'Subirats sidelines students in the draft bill of the Organic Law of the University System',
      description:
        'The draft bill of the Organic Law of the University System approved yesterday in the Council of Ministers includes new rights but relegates student participation to a secondary role, ignoring the demands of this community, which hopes for improvements during the parliamentary processing.',
    },
    {
      locale: 'ca',
      title:
        "Subirats deixa de banda l'estudiantat en l'avantprojecte de Llei Orgànica del Sistema Universitari",
      description:
        "L'Avantprojecte de Llei Orgànica del Sistema Universitari aprovat ahir al Consell de Ministres recull nous drets però relega la participació estudiantil a un segon pla, desoint les demandes d'aquest col·lectiu, que espera que millori en el procés de tramitació parlamentària.",
    },
    {
      locale: 'eu',
      title:
        'Subiratsek ikasleak alde batera uzten ditu Unibertsitate Sistemaren Lege Organikoaren aurreproiektuan',
      description:
        'Atzo Ministroen Kontseiluan onartutako Unibertsitate Sistemaren Lege Organikoaren Aurreproiektuak eskubide berriak jasotzen ditu, baina ikasleen parte-hartzea bigarren maila batera baztertzen du, kolektibo honen eskaerei jaramonik egin gabe; kolektibo horrek izapide parlamentarioaren prozesuan hobetuko delakoan dago.',
    },
    {
      locale: 'gl',
      title:
        'Subirats deixa de lado o estudantado no anteproxecto de Lei Orgánica do Sistema Universitario',
      description:
        'O Anteproxecto de Lei Orgánica do Sistema Universitario aprobado onte no Consello de Ministros recolle novos dereitos pero relega a participación estudantil a un segundo plano, desoíndo as demandas deste colectivo, que espera que mellore no proceso de tramitación parlamentaria.',
    },
    {
      locale: 'val',
      title:
        "Subirats deixa de costat l'estudiantat en l'avantprojecte de Llei Orgànica del Sistema Universitari",
      description:
        "L'Avantprojecte de Llei Orgànica del Sistema Universitari aprovat ahir en el Consell de Ministres arreplega nous drets però relega la participació estudiantil a un segon pla, desoint les demandes d'este col·lectiu, que espera que millore en el procés de tramitació parlamentària.",
    },
  ],
  'el-estudiantado-reivindica-cambios-al-ministerio-de-universi-2022-06': [
    {
      locale: 'en',
      title:
        'Students call for changes from the Ministry of Universities in the new draft of the LOSU',
      description:
        'At the meeting held yesterday between the student representatives and the Ministry of Universities, convened to discuss the latest draft of the Organic Law of the University System, the representatives set out their demands so that the future reform places the student at the centre.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat reivindica canvis al Ministeri d'Universitats en el nou esborrany de la LOSU",
      description:
        "En la reunió mantinguda ahir entre la representació estudiantil i el Ministeri d'Universitats, convocada per debatre el darrer esborrany de la Llei Orgànica del Sistema Universitari, els representants van exposar les seves reivindicacions perquè la futura reforma situï l'estudiant al centre.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek aldaketak aldarrikatzen dizkiote Unibertsitateen Ministerioari LOSUren zirriborro berrian',
      description:
        'Atzo ikasleen ordezkaritzaren eta Unibertsitateen Ministerioaren artean egindako bileran, Unibertsitate Sistemaren Lege Organikoaren azken zirriborroa eztabaidatzeko deitua, ordezkariek beren aldarrikapenak azaldu zituzten, etorkizuneko erreformak ikaslea erdigunean koka dezan.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado reivindica cambios ao Ministerio de Universidades no novo borrador da LOSU',
      description:
        'Na reunión mantida onte entre a representación estudantil e o Ministerio de Universidades, convocada para debater o último borrador da Lei Orgánica do Sistema Universitario, os representantes expuxeron as súas reivindicacións para que a futura reforma sitúe o estudante no centro.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat reivindica canvis al Ministeri d'Universitats en el nou esborrany de la LOSU",
      description:
        "En la reunió mantinguda ahir entre la representació estudiantil i el Ministeri d'Universitats, convocada per a debatre l'últim esborrany de la Llei Orgànica del Sistema Universitari, els representants van exposar les seues reivindicacions perquè la futura reforma situe l'estudiant al centre.",
    },
  ],
  'el-estudiantado-universitario-evidencia-que-la-losu-no-avanz-2022-05': [
    {
      locale: 'en',
      title:
        'University students show that the LOSU does not advance enough on student participation',
      description:
        "The Ministry of Universities unveiled yesterday a new text of the Organic Law of the University System, which incorporates some changes compared with the previous one, but leaves out students' demands on university governance and democracy.",
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat universitari evidencia que la LOSU no avança prou en participació estudiantil",
      description:
        "El Ministeri d'Universitats va donar a conèixer ahir un nou text de la Llei Orgànica del Sistema Universitari, que incorpora alguns canvis respecte a l'anterior, però deixa fora les reivindicacions de l'estudiantat en matèria de governança i democràcia universitària.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek agerian uzten dute LOSUk ez duela behar adina aurreratzen ikasleen parte-hartzean',
      description:
        'Unibertsitateen Ministerioak atzo Unibertsitate Sistemaren Lege Organikoaren testu berri bat ezagutzera eman zuen; aurrekoarekiko zenbait aldaketa txertatzen ditu, baina kanpoan uzten ditu ikasleen aldarrikapenak unibertsitateko gobernantzaren eta demokraziaren arloan.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado universitario evidencia que a LOSU non avanza dabondo en participación estudantil',
      description:
        'O Ministerio de Universidades deu a coñecer onte un novo texto da Lei Orgánica do Sistema Universitario, que incorpora algúns cambios respecto ao anterior, pero deixa fóra as reivindicacións do estudantado en materia de gobernanza e democracia universitaria.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat universitari evidencia que la LOSU no avança prou en participació estudiantil",
      description:
        "El Ministeri d'Universitats va donar a conéixer ahir un nou text de la Llei Orgànica del Sistema Universitari, que incorpora alguns canvis respecte a l'anterior, però deixa fora les reivindicacions de l'estudiantat en matèria de governança i democràcia universitària.",
    },
  ],
  'creup-se-reune-con-yolanda-diaz-para-analizar-los-puntos-cla-2022-05': [
    {
      locale: 'en',
      title:
        'CREUP meets with Yolanda Díaz to analyse the key points of the new Statute of the Student on Internships',
      description:
        'The regulation of academic placements, set out in the labour reform, will incorporate the main demands of university students, addressing financial compensation and the content of the training activity.',
    },
    {
      locale: 'ca',
      title:
        "CREUP es reuneix amb Yolanda Díaz per analitzar els punts clau del nou Estatut de l'Estudiant en Pràctiques",
      description:
        "La regulació de les pràctiques acadèmiques, plantejada en la reforma laboral, incorporarà les principals reivindicacions de l'estudiantat universitari, abordant la compensació econòmica o el contingut de l'activitat formativa.",
    },
    {
      locale: 'eu',
      title:
        'CREUP Yolanda Díazekin biltzen da Praktiketako Ikaslearen Estatutu berriaren funtsezko puntuak aztertzeko',
      description:
        'Praktika akademikoen erregulazioak, lan-erreforman planteatuak, unibertsitateko ikasleen aldarrikapen nagusiak jasoko ditu, konpentsazio ekonomikoa edo prestakuntza-jardueraren edukia jorratuz.',
    },
    {
      locale: 'gl',
      title:
        'CREUP reúnese con Yolanda Díaz para analizar os puntos clave do novo Estatuto do Estudante en Prácticas',
      description:
        'A regulación das prácticas académicas, formulada na reforma laboral, incorporará as principais reivindicacións do estudantado universitario, abordando a compensación económica ou o contido da actividade formativa.',
    },
    {
      locale: 'val',
      title:
        "CREUP es reunix amb Yolanda Díaz per a analitzar els punts clau del nou Estatut de l'Estudiant en Pràctiques",
      description:
        "La regulació de les pràctiques acadèmiques, plantejada en la reforma laboral, incorporarà les principals reivindicacions de l'estudiantat universitari, abordant la compensació econòmica o el contingut de l'activitat formativa.",
    },
  ],
  'el-estudiantado-universitario-reivindica-unas-practicas-form-2022-05': [
    {
      locale: 'en',
      title: 'University students call for training-based, paid internships',
      description:
        "University students call for the Trainee Statute, the regulation that will govern academic placements at universities, to include their proposals to guarantee a training-based internship model that values the student's role and ensures their remuneration.",
    },
    {
      locale: 'ca',
      title: "L'estudiantat universitari reivindica unes pràctiques formatives i remunerades",
      description:
        "L'estudiantat universitari reivindica que l'Estatut del Becari, la norma que regularà les pràctiques acadèmiques a les Universitats, reculli les seves propostes per garantir un model de pràctiques formatiu, que posi en valor el paper de l'estudiant i que garanteixi la seva remuneració.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek praktika prestakuntzazkoak eta ordainduak aldarrikatzen dituzte',
      description:
        'Unibertsitateko ikasleek aldarrikatzen dute Bekadunaren Estatutuak, unibertsitateetako praktika akademikoak arautuko dituen arauak, beren proposamenak jaso ditzala, prestakuntzazko praktika-eredu bat bermatzeko, ikaslearen papera baloratuko duena eta haren ordainsaria bermatuko duena.',
    },
    {
      locale: 'gl',
      title: 'O estudantado universitario reivindica unhas prácticas formativas e remuneradas',
      description:
        'O estudantado universitario reivindica que o Estatuto do Bolseiro, a norma que regulará as prácticas académicas nas Universidades, recolla as súas propostas para garantir un modelo de prácticas formativo, que poña en valor o papel do estudante e que garanta a súa remuneración.',
    },
    {
      locale: 'val',
      title: "L'estudiantat universitari reivindica unes pràctiques formatives i remunerades",
      description:
        "L'estudiantat universitari reivindica que l'Estatut del Becari, la norma que regularà les pràctiques acadèmiques en les Universitats, arreplegue les seues propostes per a garantir un model de pràctiques formatiu, que pose en valor el paper de l'estudiant i que garantisca la seua remuneració.",
    },
  ],
  'la-representacion-estudiantil-consigue-el-paro-academico-com-2022-05': [
    {
      locale: 'en',
      title:
        'Student representatives secure the academic strike as a right in the Organic Law of the University System',
      description:
        'At the meeting held today with the Ministry of Universities, the new text of the LOSU was discussed, which incorporates the historic demand of the academic strike and other rights of university students.',
    },
    {
      locale: 'ca',
      title:
        'La representació estudiantil aconsegueix el dret a la vaga acadèmica en la Llei Orgànica del Sistema Universitari',
      description:
        "En la reunió mantinguda avui amb el Ministeri d'Universitats s'ha tractat el nou text de la LOSU, que incorpora la reivindicació històrica de la vaga acadèmica i altres drets de l'estudiantat universitari.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleen ordezkaritzak greba akademikoa eskubide gisa lortzen du Unibertsitate Sistemaren Lege Organikoan',
      description:
        'Gaur Unibertsitateen Ministerioarekin egindako bileran LOSUren testu berria aztertu da, eta greba akademikoaren aldarrikapen historikoa eta unibertsitateko ikasleen beste eskubide batzuk jasotzen ditu.',
    },
    {
      locale: 'gl',
      title:
        'A representación estudantil consegue a folga académica como dereito na Lei Orgánica do Sistema Universitario',
      description:
        'Na reunión mantida hoxe co Ministerio de Universidades tratouse o novo texto da LOSU, que incorpora a reivindicación histórica da folga académica e outros dereitos do estudantado universitario.',
    },
    {
      locale: 'val',
      title:
        'La representació estudiantil aconseguix el dret a la vaga acadèmica en la Llei Orgànica del Sistema Universitari',
      description:
        "En la reunió mantinguda hui amb el Ministeri d'Universitats s'ha tractat el nou text de la LOSU, que incorpora la reivindicació històrica de la vaga acadèmica i altres drets de l'estudiantat universitari.",
    },
  ],
  'el-estudiantado-universitario-reivindica-unas-practicas-acad-2022-04': [
    {
      locale: 'en',
      title: 'University students call for decent academic internships',
      description:
        'The labour reform approved in December plans to address a regulation of academic placements, through the Trainee Statute, within a maximum of six months, one of the main demands of the Coordinator of Student Representatives of Public Universities (CREUP), which has spent months calling for a new regulatory framework that dignifies internships and prevents malpractice with them.',
    },
    {
      locale: 'ca',
      title: "L'estudiantat universitari reivindica unes pràctiques acadèmiques dignes",
      description:
        "La reforma laboral aprovada al desembre planteja abordar una regulació de les pràctiques acadèmiques, a través de l'Estatut del Becari, en un termini màxim de sis mesos, una de les demandes principals de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP), que fa mesos que demana un nou marc normatiu que dignifiqui les pràctiques i eviti males praxis amb aquestes.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitateko ikasleek praktika akademiko duinak aldarrikatzen dituzte',
      description:
        'Abenduan onartutako lan-erreformak praktika akademikoen erregulazio bat lantzea planteatzen du, Bekadunaren Estatutuaren bidez, gehienez sei hilabeteko epean; hori da Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzailearen (CREUP) eskaera nagusietako bat, eta hilabeteak daramatza praktikak duintzen dituen eta horiekin praxi txarrak saihesten dituen arau-esparru berri bat eskatzen.',
    },
    {
      locale: 'gl',
      title: 'O estudantado universitario reivindica unhas prácticas académicas dignas',
      description:
        'A reforma laboral aprobada en decembro propón abordar unha regulación das prácticas académicas, a través do Estatuto do Bolseiro, nun prazo máximo de seis meses, unha das demandas principais da Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP), que leva meses demandando un novo marco normativo que dignifique as prácticas e evite malas praxes con estas.',
    },
    {
      locale: 'val',
      title: "L'estudiantat universitari reivindica unes pràctiques acadèmiques dignes",
      description:
        "La reforma laboral aprovada al desembre planteja abordar una regulació de les pràctiques acadèmiques, a través de l'Estatut del Becari, en un termini màxim de sis mesos, una de les demandes principals de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP), que fa mesos que demana un nou marc normatiu que dignifique les pràctiques i evite males praxis amb estes.",
    },
  ],
  'el-estudiantado-universitario-rechaza-el-cierre-de-los-edifi-2022-04': [
    {
      locale: 'en',
      title:
        'University students reject the closure of university buildings in response to rising energy costs',
      description:
        'The measures adopted by universities following the surge in energy prices, carried out without the involvement of student representatives and including the early closure of buildings or the rescheduling of teaching hours, may limit the right to study, the quality of teaching, and university life.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat universitari rebutja el tancament dels edificis universitaris davant l'encariment de l'energia",
      description:
        "Les mesures adoptades per les Universitats arran de l'escalada de preus de l'energia, dutes a terme sense comptar amb la representació estudiantil i entre les quals s'inclou el tancament anticipat d'edificis o el reajustament dels horaris per a l'activitat docent, poden limitar el dret a l'estudi, la qualitat de la docència i la vida universitària.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek unibertsitate-eraikinen itxiera baztertzen dute energiaren garestitzearen aurrean',
      description:
        'Unibertsitateek energiaren prezioen igoeraren ondorioz hartutako neurriek, ikasleen ordezkaritzarekin kontatu gabe hartuak eta eraikinen aurretiazko itxiera edo irakaskuntza-jardueraren ordutegien doikuntza barne, ikasteko eskubidea, irakaskuntzaren kalitatea eta unibertsitate-bizitza muga ditzakete.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado universitario rexeita o peche dos edificios universitarios ante o encarecemento da enerxía',
      description:
        'As medidas adoptadas polas Universidades a raíz da escalada de prezos da enerxía, levadas a cabo sen contar coa representación estudantil e entre as que se inclúe o peche anticipado de edificios ou o reaxuste dos horarios para a actividade docente, poden limitar o dereito ao estudo, a calidade da docencia e a vida universitaria.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat universitari rebutja el tancament dels edificis universitaris davant l'encariment de l'energia",
      description:
        "Les mesures adoptades per les Universitats arran de l'escalada de preus de l'energia, portades a terme sense comptar amb la representació estudiantil i entre les quals s'inclou el tancament anticipat d'edificis o el reajust dels horaris per a l'activitat docent, poden limitar el dret a l'estudi, la qualitat de la docència i la vida universitària.",
    },
  ],
  'el-estudiantado-universitario-pide-al-gobierno-que-difunda-m-2022-02': [
    {
      locale: 'en',
      title:
        'University students call on the Government to widely publicise the changes to scholarship application deadlines',
      description:
        "CEUNE and CREUP welcome the lower grade-point average required to access scholarships for non-qualifying master's degrees, but believe progress must continue towards removing the academic requirements.",
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat universitari demana al Govern que difongui massivament els canvis en els terminis de sol·licitud de beques",
      description:
        "Des de CEUNE i CREUP celebren la reducció en la nota mitjana per accedir a les beques per als màsters no habilitants, però consideren que cal seguir avançant en l'eliminació dels requisits acadèmics.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek Gobernuari eskatzen diote beken eskaera-epeen aldaketak modu masiboan zabaltzeko',
      description:
        'CEUNEk eta CREUPek master ez-gaitzaileetako beketara sartzeko eskatzen den batezbesteko nota jaitsiera ospatzen dute, baina uste dute betekizun akademikoak ezabatzen aurrera egiten jarraitu behar dela.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado universitario pídelle ao Goberno que difunda masivamente os cambios nos prazos de solicitude de bolsas',
      description:
        'Desde CEUNE e CREUP celebran a redución na nota media para acceder ás bolsas para os mestrados non habilitantes, pero consideran que teñen que seguir avanzando na eliminación dos requisitos académicos.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat universitari demana al Govern que difonga massivament els canvis en els terminis de sol·licitud de beques",
      description:
        "Des de CEUNE i CREUP celebren la reducció en la nota mitjana per a accedir a les beques per als màsters no habilitants, però consideren que cal seguir avançant en l'eliminació dels requisits acadèmics.",
    },
  ],
  'el-estudiantado-universitario-conquista-avances-en-las-becas-2022-02': [
    {
      locale: 'en',
      title:
        "University students secure improvements in the Ministry's scholarships for the 2022/2023 academic year",
      description:
        "The Ministry's scholarships for this academic year will include several student demands, setting at 5 the grade-point average required to access scholarships for non-qualifying master's degrees, and will speed up the call's deadlines so applicants know as soon as possible whether they will receive the scholarship and its amount.",
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat universitari conquereix avenços en les beques del Ministeri per al curs 2022/2023",
      description:
        "Les beques del Ministeri per a aquest curs inclouran diverses reivindicacions de l'estudiantat, situaran en el 5 la nota mitjana exigida per accedir a les beques de màsters no habilitants, i accelerarán els terminis de la convocatòria perquè es conegui com més aviat millor si es rep la beca i la seva quantia.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek hobekuntzak lortzen dituzte Ministerioaren beketan 2022/2023 ikasturterako',
      description:
        'Ikasturte honetarako Ministerioaren bekek ikasleen hainbat aldarrikapen jasoko dituzte, master ez-gaitzaileetako beketara sartzeko eskatzen den batezbesteko nota 5ean ezarriko dute, eta deialdiaren epeak azkartuko dituzte, ahalik eta lasterren jakin dadin beka jasoko den eta zenbatekoa zein den.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado universitario conquista avances nas bolsas do Ministerio para o curso 2022/2023',
      description:
        'As bolsas do Ministerio para este curso incluirán varias reivindicacións do estudantado, situarán no 5 a nota media esixida para acceder ás bolsas de mestrados non habilitantes, e acelerarán os prazos da convocatoria para que se coñeza canto antes se se recibe a bolsa e a súa contía.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat universitari conquista avanços en les beques del Ministeri per al curs 2022/2023",
      description:
        "Les beques del Ministeri per a este curs inclouran diverses reivindicacions de l'estudiantat, situaran en el 5 la nota mitjana exigida per a accedir a les beques de màsters no habilitants, i acceleraran els terminis de la convocatòria perquè es conega com més prompte millor si es rep la beca i la seua quantia.",
    },
  ],
  'el-estudiantado-reclama-a-las-instituciones-universitarias-q-2022-02': [
    {
      locale: 'en',
      title:
        'Students demand that university institutions respect the agreement reached with student representatives on the implementation of the University Coexistence Act',
      description:
        "At the session held on Wednesday 16 February, the Senate approved a University Coexistence Act that does not respect the agreement reached among the university social agents, which had set mediation as the main mechanism for resolving conflicts, and which under the current text now depends on each University's own regulation.",
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat reclama a les institucions universitàries que respectin l'acord assolit amb la representació estudiantil en la implantació de la Llei de Convivència Universitària",
      description:
        "En la sessió celebrada el dimecres 16 de febrer, el Senat va aprovar una Llei de Convivència Universitària que no respecta l'acord assolit entre els agents socials universitaris, pel qual es fixava la mediació com el principal mecanisme per a la resolució de conflictes, i que amb el text actual passa a dependre de la regulació de cada Universitat.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek unibertsitate-erakundeei eskatzen diete ikasle-ordezkaritzarekin lortutako akordioa errespetatzeko Unibertsitateko Bizikidetza Legearen ezarpenean',
      description:
        'Otsailaren 16an, asteazkenean, egindako saioan, Senatuak Unibertsitateko Bizikidetza Lege bat onartu zuen, unibertsitateko gizarte-eragileen artean lortutako akordioa errespetatzen ez duena, gatazkak konpontzeko mekanismo nagusi gisa bitartekaritza finkatzen zuena, eta egungo testuarekin Unibertsitate bakoitzaren araudiaren mende geratzen dena.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado reclama ás institucións universitarias que respecten o acordo acadado coa representación estudantil na implantación da Lei de Convivencia Universitaria',
      description:
        'Na sesión celebrada o mércores 16 de febreiro, o Senado aprobou unha Lei de Convivencia Universitaria que non respecta o acordo acadado entre os axentes sociais universitarios, polo que se fixaba a mediación como o principal mecanismo para a resolución de conflitos, e que co texto actual pasa a depender da regulación de cada Universidade.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat reclama a les institucions universitàries que respecten l'acord assolit amb la representació estudiantil en la implantació de la Llei de Convivència Universitària",
      description:
        "En la sessió celebrada el dimecres 16 de febrer, el Senat va aprovar una Llei de Convivència Universitària que no respecta l'acord assolit entre els agents socials universitaris, pel qual es fixava la mediació com el principal mecanisme per a la resolució de conflictes, i que amb este text passa a dependre de la regulació de cada Universitat.",
    },
  ],
  'el-estudiantado-universitario-reclama-a-yolanda-diaz-acordar-2022-02': [
    {
      locale: 'en',
      title:
        'University students call on Yolanda Díaz to agree a joint position to address the reform of internships',
      description:
        'The recent approval of the labour reform commits the Ministry of Labour to begin negotiations on the future Statute of the Student in Internships within a maximum of six months, without having yet started the dialogue with university students.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat universitari reclama a Yolanda Díaz acordar una postura conjunta per abordar la reforma de les pràctiques",
      description:
        "La recent aprovació de la reforma laboral compromet el Ministeri de Treball a començar les negociacions del futur Estatut de l'Estudiant en Pràctiques en un termini màxim de sis mesos sense haver iniciat encara el diàleg amb l'estudiantat universitari.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek Yolanda Díazi eskatzen diote jarrera bateratu bat adostea praktiken erreforma lantzeko',
      description:
        'Lan-erreformaren onarpen berriak Lan Ministerioa konprometitzen du etorkizuneko Praktiketako Ikaslearen Estatutuaren negoziazioak gehienez sei hilabeteko epean hasteko, oraindik unibertsitateko ikasleekin elkarrizketa hasi gabe.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado universitario reclámalle a Yolanda Díaz acordar unha postura conxunta para abordar a reforma das prácticas',
      description:
        'A recente aprobación da reforma laboral compromete o Ministerio de Traballo a comezar as negociacións do futuro Estatuto do Estudante en Prácticas nun prazo máximo de seis meses sen ter iniciado aínda o diálogo co estudantado universitario.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat universitari reclama a Yolanda Díaz acordar una postura conjunta per a abordar la reforma de les pràctiques",
      description:
        "La recent aprovació de la reforma laboral compromet el Ministeri de Treball a començar les negociacions del futur Estatut de l'Estudiant en Pràctiques en un termini màxim de sis mesos sense haver iniciat encara el diàleg amb l'estudiantat universitari.",
    },
  ],
  'la-universidad-de-sevilla-acoge-las-reuniones-de-la-directiv-2022-02': [
    {
      locale: 'en',
      title:
        'The University of Seville hosts the meetings of the board of the Coordinator of Student Representatives of Public Universities',
      description:
        "On 4 and 5 February the University of Seville will host on its premises the meetings between the different areas of CREUP's board, which will prepare the main lines of work of university student representatives until next autumn.",
    },
    {
      locale: 'ca',
      title:
        "La Universitat de Sevilla acull les reunions de la directiva de la Coordinadora de Representants d'Estudiants d'Universitats Públiques",
      description:
        "Els dies 4 i 5 de febrer la Universitat de Sevilla acollirà a les seves instal·lacions les reunions entre les diferents àrees de la directiva de CREUP, que prepararan les principals línies de treball dels representants d'estudiants universitaris fins al pròxim tardor.",
    },
    {
      locale: 'eu',
      title:
        'Sevillako Unibertsitateak Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzailearen zuzendaritzaren bilerak hartzen ditu',
      description:
        'Otsailaren 4an eta 5ean Sevillako Unibertsitateak bere instalazioetan hartuko ditu CREUPen zuzendaritzaren arlo desberdinen arteko bilerak, datorren udazkenera arte unibertsitateko ikasle ordezkarien lan-ildo nagusiak prestatuko dituztenak.',
    },
    {
      locale: 'gl',
      title:
        'A Universidade de Sevilla acolle as reunións da directiva da Coordinadora de Representantes de Estudantes de Universidades Públicas',
      description:
        'Os días 4 e 5 de febreiro a Universidade de Sevilla acollerá nas súas instalacións as reunións entre as distintas áreas da directiva de CREUP, que prepararán as principais liñas de traballo dos representantes de estudantes universitarios ata o vindeiro outono.',
    },
    {
      locale: 'val',
      title:
        "La Universitat de Sevilla acull les reunions de la directiva de la Coordinadora de Representants d'Estudiants d'Universitats Públiques",
      description:
        "Els dies 4 i 5 de febrer la Universitat de Sevilla acollirà en les seues instal·lacions les reunions entre les distintes àrees de la directiva de CREUP, que prepararan les principals línies de treball dels representants d'estudiants universitaris fins a la pròxima tardor.",
    },
  ],
  'el-estudiantado-universitario-traslada-a-subirats-la-necesid-2022-01': [
    {
      locale: 'en',
      title:
        'University students convey to Subirats the need to place students at the centre of the new Universities Act',
      description:
        'The president of the Coordinator of Student Representatives of Public Universities, Nicolás Hernández, has met with the Minister of Universities, Joan Subirats, to convey the main issues to be addressed during the legislature.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat universitari trasllada a Subirats la necessitat de situar l'estudiant al centre de la nova Llei d'Universitats",
      description:
        "El president de la Coordinadora de Representants d'Estudiants de les Universitats Públiques, Nicolás Hernández, s'ha reunit amb el Ministre d'Universitats, Joan Subirats, per traslladar els principals temes a tractar durant la legislatura.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek Subiratsi helarazten diote ikaslea Unibertsitateen Lege berriaren erdigunean kokatzeko beharra',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileko presidenteak, Nicolás Hernándezek, Joan Subirats Unibertsitate Ministroarekin bildu da, legealdian zehar landu beharreko gai nagusiak helarazteko.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado universitario tráslada a Subirats a necesidade de situar o estudante no centro da nova Lei de Universidades',
      description:
        'O presidente da Coordinadora de Representantes de Estudantes das Universidades Públicas, Nicolás Hernández, reuniuse co Ministro de Universidades, Joan Subirats, para trasladar os principais temas a tratar durante a lexislatura.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat universitari trasllada a Subirats la necessitat de situar l'estudiant al centre de la nova Llei d'Universitats",
      description:
        "El president de la Coordinadora de Representants d'Estudiants de les Universitats Públiques, Nicolás Hernández, s'ha reunit amb el Ministre d'Universitats, Joan Subirats, per a traslladar els principals temes a tractar durant la legislatura.",
    },
  ],
  'el-estudiantado-universitario-considera-insuficiente-el-prot-2022-01': [
    {
      locale: 'en',
      title:
        'University students consider the protocol for the return to the classroom insufficient',
      description:
        'University students reproach the Ministry of Universities, as well as the various university institutions, for not having consulted their opinion when establishing the possible protocols for the return to campus.',
    },
    {
      locale: 'ca',
      title: "L'estudiantat universitari considera insuficient el protocol de tornada a les aules",
      description:
        "L'estudiantat universitari retreu al Ministeri d'Universitats, així com a les diferents institucions universitàries, no haver consultat la seva opinió de cara a establir els possibles protocols de tornada als campus.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek ikasgeletara itzultzeko protokoloa nahikoa ez dela uste dute',
      description:
        'Unibertsitateko ikasleek Unibertsitate Ministerioari, bai eta unibertsitateko erakunde desberdinei ere, leporatzen diete ez dietela beren iritzia galdetu campusera itzultzeko balizko protokoloak ezartzeko.',
    },
    {
      locale: 'gl',
      title: 'O estudantado universitario considera insuficiente o protocolo de volta ás aulas',
      description:
        'O estudantado universitario recrimínalle ao Ministerio de Universidades, así como ás diferentes institucións universitarias, non ter consultado a súa opinión de cara a establecer os posibles protocolos de volta aos campus.',
    },
    {
      locale: 'val',
      title: "L'estudiantat universitari considera insuficient el protocol de tornada a les aules",
      description:
        "L'estudiantat universitari retrau al Ministeri d'Universitats, així com a les distintes institucions universitàries, no haver consultat la seua opinió de cara a establir els possibles protocols de tornada als campus.",
    },
  ],
  'el-estudiantado-universitario-propone-a-subirats-reiniciar-l-2021-12': [
    {
      locale: 'en',
      title: "University students propose that Subirats restart the 'Castells Act'",
      description:
        'University students ask the newly appointed Minister of Universities, Joan Subirats, for a new dialogue process that makes it possible to reach an Organic Law of the University System that improves the situation on campuses.',
    },
    {
      locale: 'ca',
      title: "L'estudiantat universitari proposa a Subirats reiniciar la «llei Castells»",
      description:
        "L'estudiantat universitari sol·licita al recentment nomenat Ministre d'Universitats, Joan Subirats, un nou procés de diàleg que permeti assolir una Llei Orgànica del Sistema Universitari que millori la situació als campus.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitateko ikasleek Subiratsi proposatzen diote «Castells legea» berrabiaraztea',
      description:
        'Unibertsitateko ikasleek izendatu berri den Joan Subirats Unibertsitate Ministroari elkarrizketa-prozesu berri bat eskatzen diote, campusetako egoera hobetuko duen Unibertsitate Sistemaren Lege Organiko bat lortzeko aukera emango duena.',
    },
    {
      locale: 'gl',
      title: 'O estudantado universitario proponlle a Subirats reiniciar a «lei Castells»',
      description:
        'O estudantado universitario solicítalle ao recentemente nomeado Ministro de Universidades, Joan Subirats, un novo proceso de diálogo que permita acadar unha Lei Orgánica do Sistema Universitario que mellore a situación nos campus.',
    },
    {
      locale: 'val',
      title: "L'estudiantat universitari proposa a Subirats reiniciar la «llei Castells»",
      description:
        "L'estudiantat universitari sol·licita al nomenat recentment Ministre d'Universitats, Joan Subirats, un nou procés de diàleg que permeta assolir una Llei Orgànica del Sistema Universitari que millore la situació en els campus.",
    },
  ],
  'el-consejo-de-estudiantes-universitario-del-estado-aprueba-c-2021-11': [
    {
      locale: 'en',
      title: "The State University Students' Council approves calling a nationwide academic strike",
      description:
        'This morning the student representatives of Spanish universities met in the plenary session of CEUNE, the body chaired by the Minister, where an unfavourable report on the Organic Law of the University System was issued and support for the nationwide academic strike scheduled for 18 November was entered into the minutes.',
    },
    {
      locale: 'ca',
      title:
        "El Consell d'Estudiants Universitari de l'Estat aprova convocar una vaga acadèmica estatal",
      description:
        "Aquest matí s'han reunit els representants d'estudiants de les universitats espanyoles en el ple del CEUNE, òrgan que presideix el Ministre, en el qual s'ha emès un informe desfavorable a la Llei Orgànica del Sistema Universitari i s'ha incorporat a l'acta el suport a la vaga acadèmica estatal per al pròxim 18 de novembre.",
    },
    {
      locale: 'eu',
      title:
        'Estatuko Unibertsitate Ikasleen Kontseiluak estatu mailako greba akademikoa deitzea onartu du',
      description:
        'Gaur goizean Espainiako unibertsitateetako ikasle ordezkariak CEUNEren osoko bilkuran bildu dira, Ministroak presiditzen duen organoan, non Unibertsitate Sistemaren Lege Organikoaren aurkako txosten kontrakoa eman den eta aktan datorren azaroaren 18rako estatu mailako greba akademikoaren aldeko babesa jaso den.',
    },
    {
      locale: 'gl',
      title:
        'O Consello de Estudantes Universitario do Estado aproba convocar paro académico estatal',
      description:
        'Esta mañá reuníronse os representantes de estudantes das universidades españolas no pleno do CEUNE, órgano que preside o Ministro, no que se emitiu un informe desfavorable á Lei Orgánica do Sistema Universitario e se incorporou na acta o apoio ao paro académico estatal para o vindeiro 18 de novembro.',
    },
    {
      locale: 'val',
      title:
        "El Consell d'Estudiants Universitari de l'Estat aprova convocar una vaga acadèmica estatal",
      description:
        "Este matí s'han reunit els representants d'estudiants de les universitats espanyoles en el ple del CEUNE, òrgan que presidix el Ministre, en el qual s'ha emés un informe desfavorable a la Llei Orgànica del Sistema Universitari i s'ha incorporat en l'acta el suport a la vaga acadèmica estatal per al pròxim 18 de novembre.",
    },
  ],
  'el-estudiantado-universitario-anuncia-movilizaciones-contra-2021-11': [
    {
      locale: 'en',
      title:
        "University students announce mobilisations against Castells's university reforms for 18 November",
      description:
        'University students have announced mobilisations in various Spanish cities in protest at the amendments tabled by Esquerra Republicana, PSOE and Unidas Podemos to the University Coexistence Act and against the proposals put forward in the draft Organic Law of the University System.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat universitari anuncia mobilitzacions contra les reformes universitàries de Castells per al pròxim 18 de novembre",
      description:
        "L'estudiantat universitari ha anunciat mobilitzacions en diferents ciutats espanyoles com a protesta davant les esmenes presentades per Esquerra Republicana, PSOE i Unidas Podemos a la Llei de Convivència Universitària i contra les propostes plantejades en el projecte de Llei Orgànica del Sistema Universitari.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek Castellsen unibertsitate-erreformen aurkako mobilizazioak iragarri dituzte datorren azaroaren 18rako',
      description:
        'Unibertsitateko ikasleek mobilizazioak iragarri dituzte Espainiako hainbat hiritan, Esquerra Republicanak, PSOEk eta Unidas Podemosek Unibertsitateko Bizikidetza Legeari aurkeztutako zuzenketen aurkako protesta gisa, eta Unibertsitate Sistemaren Lege Organikoaren proiektuan planteatutako proposamenen aurka.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado universitario anuncia mobilizacións contra as reformas universitarias de Castells para o vindeiro 18 de novembro',
      description:
        'O estudantado universitario anunciou mobilizacións en distintas cidades españolas como protesta ante as emendas presentadas por Esquerra Republicana, PSOE e Unidas Podemos á Lei de Convivencia Universitaria e contra as propostas formuladas no proxecto de Lei Orgánica do Sistema Universitario.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat universitari anuncia mobilitzacions contra les reformes universitàries de Castells per al pròxim 18 de novembre",
      description:
        "L'estudiantat universitari ha anunciat mobilitzacions en distintes ciutats espanyoles com a protesta davant les esmenes presentades per Esquerra Republicana, PSOE i Unidas Podemos a la Llei de Convivència Universitària i contra les propostes plantejades en el projecte de Llei Orgànica del Sistema Universitari.",
    },
  ],
  'el-enfado-del-estudiantado-universitario-explota-y-sifueraca-2021-11': [
    {
      locale: 'en',
      title:
        "University students' anger boils over and #SiFueraCastells reaches number 3 in Twitter Trends this Friday",
      description:
        'University students staged a virtual protest this Friday, becoming one of the most prominent topics of the morning on social media through the hashtag #SiFueraCastells, showing their rejection of the latest actions by the Ministry and the parliamentary groups.',
    },
    {
      locale: 'ca',
      title:
        "L'enuig de l'estudiantat universitari esclata i #SiFueraCastells arriba aquest divendres al número 3 de Tendències de Twitter",
      description:
        "L'estudiantat universitari ha fet una protesta virtual aquest divendres, fins a esdevenir un dels temes més importants del matí a les xarxes socials a través del hashtag #SiFueraCastells, mostrant el seu rebuig a les últimes accions del Ministeri i els grups parlamentaris.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleen haserrea lehertu da eta #SiFueraCastells ostiral honetan Twitterreko Joeretako 3. zenbakira iritsi da',
      description:
        'Unibertsitateko ikasleek protesta birtual bat egin dute ostiral honetan, goizeko sare sozialetako gairik garrantzitsuenetako bat bihurtuz #SiFueraCastells traolaren bidez, Ministerioaren eta talde parlamentarioen azken ekintzen aurkako gaitzespena erakutsiz.',
    },
    {
      locale: 'gl',
      title:
        'O enfado do estudantado universitario estoupa e #SiFueraCastells chega este venres ao número 3 en Tendencias de Twitter',
      description:
        'O estudantado universitario fixo unha protesta virtual este venres, chegando a ser un dos temas máis importantes da mañá nas redes sociais a través do cancelo #SiFueraCastells, amosando o seu rexeitamento ás últimas accións do Ministerio e os grupos parlamentarios.',
    },
    {
      locale: 'val',
      title:
        "L'enuig de l'estudiantat universitari esclata i #SiFueraCastells aplega este divendres al número 3 de Tendències de Twitter",
      description:
        "L'estudiantat universitari ha fet una protesta virtual este divendres, fins a convertir-se en un dels temes més importants del matí en les xarxes socials a través de l'etiqueta #SiFueraCastells, mostrant el seu rebuig a les últimes accions del Ministeri i els grups parlamentaris.",
    },
  ],
  'el-estudiantado-denuncia-que-la-ley-castells-no-avanza-respe-2021-10': [
    {
      locale: 'en',
      title:
        'Students denounce that the "Castells Act" makes no progress compared with the LOU, abandoning student participation',
      description:
        "The Ministry of Universities has sent the second draft of the Organic Law of the University System to the Conference of Rectors, students, teachers' unions, Social Councils and Autonomous Communities, without presenting any progress compared with the 2001 Organic Law of Universities.",
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat denuncia que la «llei Castells» no avança respecte a la LOU, abandonant la participació estudiantil",
      description:
        "El Ministeri d'Universitats ha remès el segon esborrany de la Llei Orgànica del Sistema Universitari a la Conferència de Rectors, estudiants, sindicats de professors, Consells Socials i Comunitats Autònomes, sense presentar avenços respecte a la Llei Orgànica d'Universitats de 2001.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek salatzen dute «Castells legea» ez dela LOUrekiko aurreratzen, ikasleen parte-hartzea baztertuz',
      description:
        'Unibertsitate Ministerioak Unibertsitate Sistemaren Lege Organikoaren bigarren zirriborroa bidali die Errektoreen Konferentziari, ikasleei, irakasleen sindikatuei, Gizarte Kontseiluei eta Autonomia Erkidegoei, 2001eko Unibertsitateen Lege Organikoarekiko aurrerapenik aurkeztu gabe.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado denuncia que a «lei Castells» non avanza respecto á LOU, abandonando a participación estudantil',
      description:
        'O Ministerio de Universidades remitiu o segundo borrador da Lei Orgánica do Sistema Universitario á Conferencia de Reitores, estudantes, sindicatos de profesores, Consellos Sociais e Comunidades Autónomas, sen presentar avances respecto á Lei Orgánica de Universidades de 2001.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat denuncia que la «llei Castells» no avança respecte a la LOU, abandonant la participació estudiantil",
      description:
        "El Ministeri d'Universitats ha remés el segon esborrany de la Llei Orgànica del Sistema Universitari a la Conferència de Rectors, estudiants, sindicats de professors, Consells Socials i Comunitats Autònomes, sense presentar avanços respecte a la Llei Orgànica d'Universitats de 2001.",
    },
  ],
  'el-estudiantado-reclama-cambios-en-la-ley-de-convivencia-uni-2021-10': [
    {
      locale: 'en',
      title:
        'Students demand changes to the University Coexistence Act before it is approved in Congress',
      description:
        'On 7 September the Council of Ministers approved the draft University Coexistence Act repealing the 1954 Francoist decree, so it will be debated over the coming days in the Congress of Deputies, where students are calling for amendments to guarantee real coexistence.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat reclama canvis en la Llei de Convivència Universitària abans de ser aprovada al Congrés",
      description:
        'El Consell de Ministres va aprovar el passat 7 de setembre el projecte de Llei de Convivència Universitària que deroga el decret franquista de 1954, per la qual cosa serà debatuda els pròxims dies al Congrés dels Diputats, on els estudiants demanen modificacions que garanteixin una convivència real.',
    },
    {
      locale: 'eu',
      title:
        'Ikasleek Unibertsitateko Bizikidetza Legean aldaketak eskatzen dituzte Kongresuan onartu aurretik',
      description:
        'Ministroen Kontseiluak irailaren 7an onartu zuen 1954ko dekretu frankista indargabetzen duen Unibertsitateko Bizikidetza Legearen proiektua, eta, beraz, datozen egunetan Diputatuen Kongresuan eztabaidatuko da, non ikasleek benetako bizikidetza bermatuko duten aldaketak eskatzen dituzten.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado reclama cambios na Lei de Convivencia Universitaria antes de ser aprobada no Congreso',
      description:
        'O Consello de Ministros aprobou o pasado 7 de setembro o proxecto de Lei de Convivencia Universitaria que derroga o decreto franquista de 1954, polo que será debatida nos vindeiros días no Congreso dos Deputados, onde os estudantes demandan modificacións que garantan unha convivencia real.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat reclama canvis en la Llei de Convivència Universitària abans de ser aprovada al Congrés",
      description:
        'El Consell de Ministres va aprovar el passat 7 de setembre el projecte de Llei de Convivència Universitària que deroga el decret franquista de 1954, per la qual cosa serà debatuda els pròxims dies al Congrés dels Diputats, on els estudiants demanen modificacions que garantisquen una convivència real.',
    },
  ],
  'el-estudiantado-reclama-que-la-ley-castells-inicie-el-camino-2021-10': [
    {
      locale: 'en',
      title: 'Students demand that the "Castells Act" set the course towards free university fees',
      description:
        'The Ministry of Universities held a joint negotiating table yesterday with Crue, students, unions, social councils and autonomous communities, following the approval of the preliminary draft of the Organic Law of the University System, to debate the funding of public universities.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat reclama que la «llei Castells» iniciï el camí cap a la gratuïtat de les taxes universitàries",
      description:
        "El Ministeri d'Universitats va mantenir ahir una taula de negociació mixta amb Crue, estudiants, sindicats, consells socials i comunitats autònomes després de l'aprovació de l'avantprojecte de Llei Orgànica del Sistema Universitari, per debatre sobre el finançament de les universitats públiques.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek eskatzen dute «Castells legeak» unibertsitate-tasen doakotasunerako bidea has dezala',
      description:
        'Unibertsitate Ministerioak negoziazio-mahai mistoa egin zuen atzo Cruerekin, ikasleekin, sindikatuekin, gizarte-kontseiluekin eta autonomia-erkidegoekin, Unibertsitate Sistemaren Lege Organikoaren aurreproiektua onartu ondoren, unibertsitate publikoen finantzaketari buruz eztabaidatzeko.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado reclama que a «lei Castells» inicie o camiño cara á gratuidade das taxas universitarias',
      description:
        'O Ministerio de Universidades mantivo onte unha mesa de negociación mixta con Crue, estudantes, sindicatos, consellos sociais e comunidades autónomas tras a aprobación do anteproxecto de Lei Orgánica do Sistema Universitario, para debater sobre o financiamento das universidades públicas.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat reclama que la «llei Castells» inicie el camí cap a la gratuïtat de les taxes universitàries",
      description:
        "El Ministeri d'Universitats va mantindre ahir una taula de negociació mixta amb Crue, estudiants, sindicats, consells socials i comunitats autònomes després de l'aprovació de l'avantprojecte de Llei Orgànica del Sistema Universitari, per a debatre sobre el finançament de les universitats públiques.",
    },
  ],
  'el-estudiantado-denuncia-que-la-ley-castells-no-avanza-en-de-2021-10': [
    {
      locale: 'en',
      title:
        'Students denounce that the "Castells Act" makes no progress on university democracy compared with the LOU, despite the latest changes',
      description:
        'A few days ago the Minister of Universities issued a document with the changes made regarding university governance after the joint negotiating table with Crue, students, unions, social councils and autonomous communities, which has not fully convinced students, who believe it still makes no progress on this point.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat denuncia que la «llei Castells» no avança en democràcia universitària respecte a la LOU malgrat els últims canvis",
      description:
        "El Ministre d'Universitats va emetre fa uns dies un document amb les modificacions fetes respecte a la governança universitària després de la taula de negociació mixta amb Crue, estudiants, sindicats, consells socials i comunitats autònomes que no ha acabat de convèncer els estudiants, que consideren que segueix sense avançar en aquest punt.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek salatzen dute «Castells legea» ez dela unibertsitate-demokrazian aurreratzen LOUrekiko, azken aldaketak gorabehera',
      description:
        'Unibertsitate Ministroak duela egun batzuk dokumentu bat eman zuen unibertsitate-gobernantzari buruz egindako aldaketekin, Cruerekin, ikasleekin, sindikatuekin, gizarte-kontseiluekin eta autonomia-erkidegoekin egindako negoziazio-mahai mistoaren ondoren, baina ez ditu ikasleak guztiz konbentzitu, puntu honetan oraindik aurreratzen ez dela uste baitute.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado denuncia que a «lei Castells» non avanza en democracia universitaria respecto á LOU malia os últimos cambios',
      description:
        'O Ministro de Universidades emitiu hai uns días un documento coas modificacións realizadas respecto á gobernanza universitaria tras a mesa de negociación mixta con Crue, estudantes, sindicatos, consellos sociais e comunidades autónomas que non acabou de convencer os estudantes, que consideran que segue sen avanzar neste punto.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat denuncia que la «llei Castells» no avança en democràcia universitària respecte a la LOU malgrat els últims canvis",
      description:
        "El Ministre d'Universitats va emetre fa uns dies un document amb les modificacions fetes respecte a la governança universitària després de la taula de negociació mixta amb Crue, estudiants, sindicats, consells socials i comunitats autònomes que no ha acabat de convéncer els estudiants, que consideren que continua sense avançar en este punt.",
    },
  ],
  'los-estudiantes-denuncian-que-la-ley-castells-solo-ha-sido-n-2021-09': [
    {
      locale: 'en',
      title:
        'Students denounce that the "Castells Act" has only been negotiated and agreed with the Conference of Rectors',
      description:
        "The Minister of Universities held a joint negotiating table yesterday with Crue, students, unions, social councils and autonomous communities to debate university governance, following the approval of the preliminary draft of the organic law of the university system, where the rectors' influence on the drafting of the preliminary draft became evident.",
    },
    {
      locale: 'ca',
      title:
        'Els estudiants denuncien que la «llei Castells» només ha estat negociada i acordada amb la Conferència de Rectors',
      description:
        "El Ministre d'Universitats va mantenir ahir una taula de negociació mixta amb Crue, estudiants, sindicats, consells socials i comunitats autònomes per debatre la governança universitària, després de l'aprovació de l'avantprojecte de llei orgànica del sistema universitari, on va quedar palesa la influència dels rectors en la redacció de l'avantprojecte.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek salatzen dute «Castells legea» Errektoreen Konferentziarekin soilik negoziatu eta adostu dela',
      description:
        'Unibertsitate Ministroak negoziazio-mahai mistoa egin zuen atzo Cruerekin, ikasleekin, sindikatuekin, gizarte-kontseiluekin eta autonomia-erkidegoekin unibertsitate-gobernantza eztabaidatzeko, unibertsitate-sistemaren lege organikoaren aurreproiektua onartu ondoren, non agerian geratu zen errektoreek aurreproiektuaren idazketan duten eragina.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes denuncian que a «lei Castells» só foi negociada e acordada coa Conferencia de Reitores',
      description:
        'O Ministro de Universidades mantivo onte unha mesa de negociación mixta con Crue, estudantes, sindicatos, consellos sociais e comunidades autónomas para debater a gobernanza universitaria, tras a aprobación do anteproxecto de lei orgánica do sistema universitario, onde quedou patente a influencia dos reitores na redacción do anteproxecto.',
    },
    {
      locale: 'val',
      title:
        'Els estudiants denuncien que la «llei Castells» només ha sigut negociada i acordada amb la Conferència de Rectors',
      description:
        "El Ministre d'Universitats va mantindre ahir una taula de negociació mixta amb Crue, estudiants, sindicats, consells socials i comunitats autònomes per a debatre la governança universitària, després de l'aprovació de l'avantprojecte de llei orgànica del sistema universitari, on va quedar patent la influència dels rectors en la redacció de l'avantprojecte.",
    },
  ],
  'el-estudiantado-prepara-sus-alegaciones-a-una-ley-castells-p-2021-09': [
    {
      locale: 'en',
      title:
        "Students prepare their objections to a 'Castells Act' for which they are calling for structural changes",
      description:
        'The new Organic Law of the University System has generated widespread rejection among university students, who believe the Ministry of Universities must commit to internal democracy and student rights, as well as to a free, accessible and quality University.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat prepara les seves al·legacions a una «llei Castells» per a la qual sol·licita canvis estructurals",
      description:
        "La nova Llei Orgànica del Sistema Universitari ha generat un ampli rebuig entre l'estudiantat universitari, que considera que el Ministeri d'Universitats ha d'apostar per la democràcia interna i els drets estudiantils, així com per una Universitat gratuïta, accessible i de qualitat.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek «Castells legearen» aurkako alegazioak prestatzen dituzte, eta horretarako aldaketa estrukturalak eskatzen dituzte',
      description:
        'Unibertsitate Sistemaren Lege Organiko berriak gaitzespen zabala sortu du unibertsitateko ikasleen artean, eta horiek uste dute Unibertsitate Ministerioak barne-demokraziaren eta ikasleen eskubideen alde egin behar duela, bai eta Unibertsitate doako, irisgarri eta kalitatezko baten alde ere.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado prepara as súas alegacións a unha «lei Castells» para a que solicita cambios estruturais',
      description:
        'A nova Lei Orgánica do Sistema Universitario xerou un amplo rexeitamento entre o estudantado universitario, que considera que o Ministerio de Universidades debe apostar pola democracia interna e os dereitos estudantís, así como por unha Universidade gratuíta, accesible e de calidade.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat prepara les seues al·legacions a una «llei Castells» per a la qual sol·licita canvis estructurals",
      description:
        "La nova Llei Orgànica del Sistema Universitari ha generat un ampli rebuig entre l'estudiantat universitari, que considera que el Ministeri d'Universitats ha d'apostar per la democràcia interna i els drets estudiantils, així com per una Universitat gratuïta, accessible i de qualitat.",
    },
  ],
  'el-estudiantado-muestra-su-oposicion-unanime-a-la-ley-castel-2021-09': [
    {
      locale: 'en',
      title:
        "Students show their unanimous opposition to the 'Castells Act' before the Minister of Universities",
      description:
        "The Minister of Universities met yesterday, in a plenary session of the State University Students' Council, with student representatives from across Spanish universities, where students' unanimous opposition to the LOSU was expressed.",
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat mostra la seva oposició unànime a la «llei Castells» davant el Ministre d'Universitats",
      description:
        "El Ministre d'Universitats es va reunir ahir, en sessió plenària del Consell d'Estudiants Universitari de l'Estat, amb representants d'estudiants del conjunt d'universitats espanyoles, en la qual es va expressar l'oposició unànime de l'estudiantat a la LOSU.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek aho batez «Castells legearen» aurkako jarrera erakusten dute Unibertsitate Ministroaren aurrean',
      description:
        'Unibertsitate Ministroa atzo bildu zen, Estatuko Unibertsitate Ikasleen Kontseiluaren osoko bilkuran, Espainiako unibertsitate guztietako ikasle ordezkariekin, eta bertan ikasleen aho bateko aurkakotasuna adierazi zen LOSUren aurrean.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado mostra a súa oposición unánime á «lei Castells» ante o Ministro de Universidades',
      description:
        'O Ministro de Universidades reuniuse onte, en sesión plenaria do Consello de Estudantes Universitario do Estado, con representantes de estudantes do conxunto de universidades españolas, na que se expresou a oposición unánime do estudantado á LOSU.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat mostra la seua oposició unànime a la «llei Castells» davant el Ministre d'Universitats",
      description:
        "El Ministre d'Universitats es va reunir ahir, en sessió plenària del Consell d'Estudiants Universitari de l'Estat, amb representants d'estudiants del conjunt d'universitats espanyoles, en la qual es va expressar l'oposició unànime de l'estudiantat a la LOSU.",
    },
  ],
  'castells-planta-al-estudiantado-para-acudir-a-la-mesa-de-dia-2021-09': [
    {
      locale: 'en',
      title: 'Castells stands up students to attend the dialogue table with Catalonia',
      description:
        'The Ministry and students had a meeting scheduled for this Thursday, 16 September, which has been cancelled so that Castells can attend the dialogue table with Catalonia, something that has outraged students, adding to the anger over the lack of negotiation and dialogue on the new Universities Act.',
    },
    {
      locale: 'ca',
      title: "Castells deixa plantat l'estudiantat per acudir a la taula de diàleg amb Catalunya",
      description:
        "Ministeri i estudiants tenien prevista una reunió per a aquest dijous, 16 de setembre, que ha estat desconvocada perquè Castells assisteixi a la taula de diàleg amb Catalunya, cosa que ha indignat l'estudiantat, sumant-se a l'enuig per la falta de negociació i diàleg amb la nova Llei d'Universitats.",
    },
    {
      locale: 'eu',
      title:
        'Castellsek plantatu egiten ditu ikasleak Kataluniarekiko elkarrizketa-mahaira joateko',
      description:
        'Ministerioak eta ikasleek bilera bat aurreikusita zuten ostegun honetarako, irailaren 16rako, baina deuseztatu egin da Castells Kataluniarekiko elkarrizketa-mahaira joan dadin, eta horrek ikasleak haserretu egin ditu, Unibertsitateen Lege berriarekin negoziaziorik eta elkarrizketarik ezagatik sortutako haserreari gehituz.',
    },
    {
      locale: 'gl',
      title: 'Castells deixa plantado o estudantado para acudir á mesa de diálogo con Cataluña',
      description:
        'Ministerio e estudantes tiñan prevista unha reunión para este xoves, 16 de setembro, que foi desconvocada para que Castells asista á mesa de diálogo con Cataluña, algo que indignou o estudantado, sumándose ao enfado tras a falta de negociación e diálogo coa nova Lei de Universidades.',
    },
    {
      locale: 'val',
      title: "Castells deixa plantat l'estudiantat per a acudir a la taula de diàleg amb Catalunya",
      description:
        "Ministeri i estudiants tenien prevista una reunió per a este dijous, 16 de setembre, que ha sigut desconvocada perquè Castells assistisca a la taula de diàleg amb Catalunya, cosa que ha indignat l'estudiantat, sumant-se a l'enuig per la falta de negociació i diàleg amb la nova Llei d'Universitats.",
    },
  ],
  'estudiantes-demandan-avanzar-en-la-convivencia-universitaria-2021-09': [
    {
      locale: 'en',
      title:
        'Students call for progress on university coexistence and equal rights among university communities',
      description:
        'The new University Coexistence Act, a preliminary draft approved this morning by the executive, will put an end to the 1954 Francoist decree, incorporating numerous changes introduced by student representatives.',
    },
    {
      locale: 'ca',
      title:
        'Els estudiants demanen avançar en la convivència universitària i la igualtat en drets entre els col·lectius universitaris',
      description:
        "La nova Llei de Convivència Universitària, avantprojecte que ha estat aprovat aquest matí per part de l'executiu, posarà fi al decret franquista de 1954, incloent-hi nombrosos canvis introduïts per la representació estudiantil.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek unibertsitate-bizikidetzan eta unibertsitate-kolektiboen arteko eskubide-berdintasunean aurrera egitea eskatzen dute',
      description:
        'Unibertsitateko Bizikidetza Lege berriak, gaur goizean exekutiboak onartutako aurreproiektuak, 1954ko dekretu frankistari amaiera emango dio, eta ikasle-ordezkaritzak sartutako aldaketa ugari jasoko ditu.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes demandan avanzar na convivencia universitaria e a igualdade en dereitos entre os colectivos universitarios',
      description:
        'A nova Lei de Convivencia Universitaria, anteproxecto que foi aprobado esta mañá por parte do executivo, poñerá fin ao decreto franquista de 1954, incluíndo numerosos cambios introducidos pola representación estudantil.',
    },
    {
      locale: 'val',
      title:
        'Els estudiants demanen avançar en la convivència universitària i la igualtat en drets entre els col·lectius universitaris',
      description:
        "La nova Llei de Convivència Universitària, avantprojecte que ha sigut aprovat este matí per part de l'executiu, posarà fi al decret franquista de 1954, incloent-hi nombrosos canvis introduïts per la representació estudiantil.",
    },
  ],
  'el-estudiantado-denuncia-que-la-ley-castells-supone-un-atras-2021-08': [
    {
      locale: 'en',
      title:
        'Students denounce that the ‘Castells Law’ represents a step backwards for democracy and student rights',
      description:
        'The new Organic Law of the University System, whose draft bill was approved this morning by the government, aims to modernise the Spanish University System, although students consider that it represents a step backwards compared to the current legislation.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat denuncia que la «llei Castells» suposa un retrocés en democràcia i drets estudiantils",
      description:
        "La nova Llei Orgànica del Sistema Universitari, l'avantprojecte de la qual ha estat aprovat aquest matí per l'executiu, té com a objectiu modernitzar el Sistema Universitari Espanyol, tot i que l'estudiantat considera que suposa un retrocés respecte de la norma actual.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek salatu dute «Castells legeak» atzerakada dakarrela demokrazian eta ikasleen eskubideetan',
      description:
        'Unibertsitate Sistemaren Lege Organiko berriak, gobernuak gaur goizean onartu duen aurreproiektuak, Espainiako Unibertsitate Sistema modernizatzea du helburu; hala ere, ikasleek uste dute atzerakada dakarrela egungo arauarekin alderatuta.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado denuncia que a «lei Castells» supon un retroceso en democracia e dereitos estudantís',
      description:
        'A nova Lei Orgánica do Sistema Universitario, cuxo anteproxecto foi aprobado esta mañá polo executivo, ten como obxectivo modernizar o Sistema Universitario Español, aínda que o estudantado considera que supon un retroceso respecto da norma actual.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat denuncia que la «llei Castells» supon un retrocés en democràcia i drets estudiantils",
      description:
        "La nova Llei Orgànica del Sistema Universitari, l'avantprojecte de la qual ha sigut aprovat este matí per l'executiu, té com a objectiu modernitzar el Sistema Universitari Espanyol, encara que l'estudiantat considera que supon un retrocés respecte de la norma actual.",
    },
  ],
  'las-becas-del-ministerio-incluiran-reivindicaciones-del-estu-2021-08': [
    {
      locale: 'en',
      title:
        "The Ministry's scholarships will include student demands for the 2021/22 academic year",
      description:
        "From this academic year, the grade-point average required to access these scholarships will return to 5 for qualifying master's degrees, as is the case with bachelor's degrees, and victims of gender-based violence will not have to undergo a revictimisation process to receive these scholarships.",
    },
    {
      locale: 'ca',
      title:
        "Les beques del Ministeri inclouran reivindicacions de l'estudiantat per al curs 2021/22",
      description:
        "Des d'aquest curs la nota mitjana exigida per accedir a aquestes beques tornarà a situar-se en el 5 per als màsters habilitants, igual que passa amb els Graus, i les víctimes de violència de gènere no hauran de patir un procés de revictimització per rebre aquestes beques.",
    },
    {
      locale: 'eu',
      title: 'Ministerioaren bekek ikasleen aldarrikapenak jasoko dituzte 2021/22 ikasturterako',
      description:
        'Ikasturte honetatik aurrera, beka horietara sartzeko eskatzen den batez besteko nota berriz ere 5ean kokatuko da gaitze-masterretarako, Graduekin gertatzen den bezala, eta genero-indarkeriaren biktimek ez dute biktimizazio-prozesurik jasan beharko beka horiek jasotzeko.',
    },
    {
      locale: 'gl',
      title:
        'As bolsas do Ministerio incluirán reivindicacións do estudantado para o curso 2021/22',
      description:
        'Desde este curso a nota media esixida para acceder a estas bolsas volverá situarse no 5 para os másteres habilitantes, igual que ocorre cos Graos, e as vítimas de violencia de xénero non terán que sufrir un proceso de revitimización para recibir estas bolsas.',
    },
    {
      locale: 'val',
      title:
        "Les beques del Ministeri inclouran reivindicacions de l'estudiantat per al curs 2021/22",
      description:
        "Des d'este curs la nota mitjana exigida per a accedir a estes beques tornarà a situar-se en el 5 per als màsters habilitants, igual que ocorre amb els Graus, i les víctimes de violència de gènere no hauran de patir un procés de revictimització per a rebre estes beques.",
    },
  ],
  'la-universidad-de-salamanca-acoge-la-lxix-asamblea-general-o-2021-07': [
    {
      locale: 'en',
      title: "The University of Salamanca hosts CREUP's 69th Ordinary General Assembly",
      description:
        'Between 22 and 24 July, the University of Salamanca will host the 69th Assembly of the Coordinator of Student Representatives of Public Universities (CREUP).',
    },
    {
      locale: 'ca',
      title: 'La Universitat de Salamanca acull la LXIX Assemblea General Ordinària de CREUP',
      description:
        "Entre el 22 i el 24 de juliol la Universitat de Salamanca acollirà la 69a Assemblea de la Coordinadora de Representants d'Universitats Públiques (CREUP).",
    },
    {
      locale: 'eu',
      title: 'Salamancako Unibertsitateak CREUPen LXIX. Ohiko Batzar Nagusia hartuko du',
      description:
        'Uztailaren 22tik 24ra bitartean, Salamancako Unibertsitateak Unibertsitate Publikoetako Ordezkarien Koordinatzailearen (CREUP) 69. Batzarra hartuko du.',
    },
    {
      locale: 'gl',
      title: 'A Universidade de Salamanca acolle a LXIX Asemblea Xeral Ordinaria de CREUP',
      description:
        'Entre o 22 e o 24 de xullo a Universidade de Salamanca acollerá a 69ª Asemblea da Coordinadora de Representantes de Universidades Públicas (CREUP).',
    },
    {
      locale: 'val',
      title: 'La Universitat de Salamanca acull la LXIX Assemblea General Ordinària de CREUP',
      description:
        "Entre el 22 i el 24 de juliol la Universitat de Salamanca acollirà la 69a Assemblea de la Coordinadora de Representants d'Universitats Públiques (CREUP).",
    },
  ],
  'creup-y-crue-renuevan-su-compromiso-de-colaboracion-para-la-2021-06': [
    {
      locale: 'en',
      title:
        'CREUP and CRUE renew their commitment to collaboration for the improvement of the university system',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP) and Crue Spanish Universities renewed yesterday the framework collaboration agreement between the two organisations.',
    },
    {
      locale: 'ca',
      title:
        'CREUP i CRUE renoven el seu compromís de col·laboració per a la millora del sistema universitari',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) i Crue Universidades Españolas van renovar ahir el conveni marc de col·laboració entre ambdues organitzacions.",
    },
    {
      locale: 'eu',
      title:
        'CREUPek eta CRUEk unibertsitate-sistema hobetzeko lankidetza-konpromisoa berritu dute',
      description:
        'Unibertsitate Publikoetako Ikasleen Ordezkarien Koordinatzaileak (CREUP) eta Crue Universidades Españolasek atzo berritu zuten bi erakundeen arteko lankidetzarako esparru-hitzarmena.',
    },
    {
      locale: 'gl',
      title:
        'CREUP e CRUE renovan o seu compromiso de colaboración para a mellora do sistema universitario',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) e Crue Universidades Españolas renovaron onte o convenio marco de colaboración entre ambas as organizacións.',
    },
    {
      locale: 'val',
      title:
        'CREUP i CRUE renoven el seu compromís de col·laboració per a la millora del sistema universitari',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) i Crue Universidades Españolas van renovar ahir el conveni marc de col·laboració entre les dos organitzacions.",
    },
  ],
  'carta-abierta-a-las-instituciones-para-garantizar-la-segurid-2021-05': [
    {
      locale: 'en',
      title: 'Open letter to institutions to guarantee the safety of students on mobility',
      description:
        'Students on mobility programmes need guarantees ahead of the next academic year. Together with ESN Spain, we are calling for measures that guarantee the safety and vaccination of this group.',
    },
    {
      locale: 'ca',
      title:
        "Carta oberta a les institucions per garantir la seguretat de l'estudiantat en mobilitat",
      description:
        "Els estudiants en mobilitat necessiten garanties de cara al pròxim curs. Juntament amb ESN Espanya, sol·licitem mesures que garanteixin la seguretat i la vacunació d'aquest col·lectiu.",
    },
    {
      locale: 'eu',
      title: 'Gutun irekia erakundeei mugikortasunean dauden ikasleen segurtasuna bermatzeko',
      description:
        'Mugikortasunean dauden ikasleek bermeak behar dituzte datorren ikasturteari begira. ESN Espainiarekin batera, kolektibo horren segurtasuna eta txertaketa bermatzen dituzten neurriak eskatzen ditugu.',
    },
    {
      locale: 'gl',
      title: 'Carta aberta ás institucións para garantir a seguridade do estudantado en mobilidade',
      description:
        'Os estudantes en mobilidade necesitan garantías de cara ao próximo curso. Xunto a ESN España, solicitamos medidas que garantan a seguridade e vacinación deste colectivo.',
    },
    {
      locale: 'val',
      title:
        "Carta oberta a les institucions per a garantir la seguretat de l'estudiantat en mobilitat",
      description:
        "Els estudiants en mobilitat necessiten garanties de cara al pròxim curs. Junt amb ESN Espanya, sol·licitem mesures que garantisquen la seguretat i la vacunació d'este col·lectiu.",
    },
  ],
  'el-estudiantado-universitario-pide-garantias-a-la-nueva-ley-2021-05': [
    {
      locale: 'en',
      title: 'University students call for guarantees in the new University Coexistence Law',
      description:
        'CREUP denounces that this document was approved without the backing of student representatives. The will for social dialogue in the university sphere must be accompanied by a genuine inclusion of student proposals. This lack of listening has resulted in a law that does not guarantee equal rights.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat universitari demana garanties a la nova Llei de Convivència Universitària",
      description:
        "CREUP denuncia que aquest document ha estat aprovat sense comptar amb el suport dels representants d'estudiants. La voluntat de diàleg social en l'àmbit universitari ha d'anar acompanyada d'una inclusió real de les propostes de l'estudiantat. Aquesta manca d'escolta ha derivat en una llei que no garanteix la igualtat de drets.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek bermeak eskatzen dizkiote Unibertsitate Bizikidetzaren Lege berriari',
      description:
        'CREUPek salatzen du dokumentu hori ikasleen ordezkarien babesik gabe onartu dela. Unibertsitate-eremuko gizarte-elkarrizketarako borondateak ikasleen proposamenen benetako inklusioa izan behar du lagun. Entzute-falta horrek eskubide-berdintasuna bermatzen ez duen lege bat ekarri du.',
    },
    {
      locale: 'gl',
      title: 'O estudantado universitario pide garantías á nova Lei de Convivencia Universitaria',
      description:
        'CREUP denuncia que este documento foi aprobado sen contar co respaldo dos representantes de estudantes. A vontade de diálogo social no ámbito universitario ten que vir acompañada dunha inclusión real das propostas do estudantado. Esta falta de escoita derivou nunha lei que non garante a igualdade de dereitos.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat universitari demana garanties a la nova Llei de Convivència Universitària",
      description:
        "CREUP denuncia que este document ha sigut aprovat sense comptar amb el suport dels representants d'estudiants. La voluntat de diàleg social en l'àmbit universitari ha d'anar acompanyada d'una inclusió real de les propostes de l'estudiantat. Esta falta d'escolta ha derivat en una llei que no garantix la igualtat de drets.",
    },
  ],
  'el-estudiantado-de-universidades-publicas-denuncia-que-el-nu-2021-05': [
    {
      locale: 'en',
      title:
        "Students of public universities denounce that the Ministry's new royal decree will devalue the quality of education",
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP) rejects the draft Royal Decree on the Organisation of University Education that was put out for public consultation on 19 May. CREUP states that this document has aspects that may devalue the quality of university degrees and does not solve many of the current problems in higher education.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat d'universitats públiques denuncia que el nou reial decret del Ministeri devaluarà la qualitat dels ensenyaments",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) rebutja el projecte de Reial Decret d'Organització d'Ensenyaments Universitaris que va sortir a consulta pública el passat 19 de maig. CREUP manifesta que aquest document té aspectes que poden arribar a devaluar la qualitat dels títols universitaris i no resol molts dels problemes actuals de l'educació superior.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitate publikoetako ikasleek salatzen dute Ministerioaren errege-dekretu berriak irakaskuntzen kalitatea gutxituko duela',
      description:
        'Unibertsitate Publikoetako Ikasleen Ordezkarien Koordinatzaileak (CREUP) maiatzaren 19an kontsulta publikora atera zen Unibertsitate Irakaskuntzen Antolaketari buruzko Errege Dekretu proiektua baztertzen du. CREUPek adierazi du dokumentu honek unibertsitate-tituluen kalitatea gutxitu dezaketen alderdiak dituela eta ez dituela goi-mailako hezkuntzaren egungo arazo asko konpontzen.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado de universidades públicas denuncia que o novo real decreto do Ministerio devaluará a calidade dos ensinos',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) rexeita o proxecto de Real Decreto de Organización de Ensinos Universitarios que saíu a consulta pública o pasado 19 de maio. CREUP manifesta que este documento ten aspectos que poden chegar a devaluar a calidade dos títulos universitarios e non resolve moitos dos problemas actuais da educación superior.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat d'universitats públiques denuncia que el nou reial decret del Ministeri devaluarà la qualitat dels ensenyaments",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) rebutja el projecte de Reial Decret d'Organització d'Ensenyaments Universitaris que va eixir a consulta pública el passat 19 de maig. CREUP manifesta que este document té aspectes que poden arribar a devaluar la qualitat dels títols universitaris i no resol molts dels problemes actuals de l'educació superior.",
    },
  ],
  'creup-reclama-modificaciones-en-el-nuevo-real-decreto-de-bec-2021-04': [
    {
      locale: 'en',
      title: 'CREUP calls for changes to the new Royal Decree on Scholarships',
      description:
        'CREUP has conveyed to the Ministry all its proposals and concerns about the Royal Decree on Scholarships, insisting on five major key measures to make them fairer and more inclusive.',
    },
    {
      locale: 'ca',
      title: 'CREUP reclama modificacions en el nou Reial Decret de Beques',
      description:
        'CREUP ha traslladat al Ministeri totes les seves propostes i preocupacions sobre el Reial Decret de Beques, insistint en cinc grans mesures fonamentals perquè siguin més justes i inclusives.',
    },
    {
      locale: 'eu',
      title: 'CREUPek aldaketak eskatzen ditu Beken Errege Dekretu berrian',
      description:
        'CREUPek bere proposamen eta kezka guztiak helarazi dizkio Ministerioari Beken Errege Dekretuari buruz, eta bost neurri nagusi funtsezkotan azpimarratu du beka horiek bidezkoagoak eta inklusiboagoak izan daitezen.',
    },
    {
      locale: 'gl',
      title: 'CREUP reclama modificacións no novo Real Decreto de Bolsas',
      description:
        'CREUP trasladou ao Ministerio todas as súas propostas e preocupacións sobre o Real Decreto de Bolsas, insistindo en cinco grandes medidas fundamentais para que sexan máis xustas e inclusivas.',
    },
    {
      locale: 'val',
      title: 'CREUP reclama modificacions en el nou Reial Decret de Beques',
      description:
        'CREUP ha traslladat al Ministeri totes les seues propostes i preocupacions sobre el Reial Decret de Beques, insistint en cinc grans mesures fonamentals perquè siguen més justes i inclusives.',
    },
  ],
  'el-ministerio-convoca-por-primera-vez-desde-que-comenzo-la-p-2021-02': [
    {
      locale: 'en',
      title:
        "The Ministry convenes the State's university student representatives at the CEUNE Plenary for the first time since the pandemic began",
      description:
        "On Wednesday 17 February, eleven months after the previous one, the Plenary of the State University Students' Council (CEUNE) was held online. At this meeting, the proposals of each University's councils were addressed and debated, as well as those of the Regional Student Councils and representative organisations such as CREUP.",
    },
    {
      locale: 'ca',
      title:
        "El Ministeri convoca per primera vegada des que va començar la pandèmia els representants d'estudiants universitaris de l'Estat al Ple del CEUNE",
      description:
        "El passat dimecres 17 de febrer, onze mesos després de l'anterior, va tenir lloc el Ple del Consell d'Estudiants Universitaris de l'Estat (CEUNE) en format en línia. En aquest, es van tractar i debatre les propostes dels consells de cada Universitat, així com els Consells d'Estudiants Autonòmics i organitzacions de representants com CREUP.",
    },
    {
      locale: 'eu',
      title:
        'Ministerioak Estatuko unibertsitate-ikasleen ordezkariak CEUNEren Osoko Bilkurara deitu ditu pandemia hasi zenetik lehen aldiz',
      description:
        'Otsailaren 17an, asteazkenean, aurrekoa baino hamaika hilabete geroago, Estatuko Unibertsitate Ikasleen Kontseiluaren (CEUNE) Osoko Bilkura egin zen online formatuan. Bertan, Unibertsitate bakoitzeko kontseiluen proposamenak landu eta eztabaidatu ziren, bai eta Autonomia Erkidegoetako Ikasle Kontseiluenak eta CREUP bezalako ordezkarien erakundeenak ere.',
    },
    {
      locale: 'gl',
      title:
        'O Ministerio convoca por primeira vez desde que comezou a pandemia os representantes de estudantes universitarios do Estado no Pleno do CEUNE',
      description:
        'O pasado mércores 17 de febreiro, once meses despois do anterior, tivo lugar o Pleno do Consello de Estudantes Universitarios do Estado (CEUNE) en formato en liña. Neste, tratáronse e debatéronse as propostas dos consellos de cada Universidade, así como os Consellos de Estudantes Autonómicos e organizacións de representantes como CREUP.',
    },
    {
      locale: 'val',
      title:
        "El Ministeri convoca per primera vegada des que va començar la pandèmia els representants d'estudiants universitaris de l'Estat en el Ple del CEUNE",
      description:
        "El passat dimecres 17 de febrer, onze mesos després de l'anterior, va tindre lloc el Ple del Consell d'Estudiants Universitaris de l'Estat (CEUNE) en format en línia. En este, es van tractar i debatre les propostes dels consells de cada Universitat, així com els Consells d'Estudiants Autonòmics i organitzacions de representants com CREUP.",
    },
  ],
  'creup-denuncia-la-falta-de-prevision-en-las-universidades-pa-2021-01': [
    {
      locale: 'en',
      title: 'CREUP denounces the lack of foresight at universities regarding exams',
      description:
        "Faced with students' uncertainty about the format of their exams as a result of the health situation and the inadequacy of the action protocols, CREUP has met with the Ministry of Universities to discuss the current situation. At this meeting, they criticised the lack of information and preparation of the universities which, once again, is harming students, and conveyed their requests.",
    },
    {
      locale: 'ca',
      title: 'CREUP denuncia la manca de previsió a les universitats per als exàmens',
      description:
        "Davant la incertesa de l'estudiantat sobre la modalitat dels seus exàmens com a conseqüència de la situació sanitària i la deficiència dels protocols d'actuació, CREUP s'ha reunit amb el Ministeri d'Universitats per tractar la situació actual. En aquesta reunió, s'ha criticat la manca d'informació i preparació de les universitats que, de nou, està perjudicant els estudiants, i han traslladat les seves peticions.",
    },
    {
      locale: 'eu',
      title: 'CREUPek salatzen du unibertsitateetan azterketetarako aurreikuspen-falta dagoela',
      description:
        'Ikasleek osasun-egoeraren ondorioz azterketen modalitateari buruz duten ziurgabetasunaren eta jarduketa-protokoloen gabeziaren aurrean, CREUP Unibertsitate Ministerioarekin bildu da egungo egoera lantzeko. Bilera horretan, unibertsitateen informazio- eta prestaketa-falta kritikatu da, berriz ere ikasleak kaltetzen ari baita, eta beren eskaerak helarazi dituzte.',
    },
    {
      locale: 'gl',
      title: 'CREUP denuncia a falta de previsión nas universidades para os exames',
      description:
        'Ante a incerteza do estudantado sobre a modalidade dos seus exames como consecuencia da situación sanitaria e a deficiencia dos protocolos de actuación, CREUP reuniuse co Ministerio de Universidades para tratar a situación actual. Nesta reunión, criticouse a falta de información e preparación das universidades que, de novo, está prexudicando os estudantes, e trasladaron as súas peticións.',
    },
    {
      locale: 'val',
      title: 'CREUP denuncia la falta de previsió en les universitats per als exàmens',
      description:
        "Davant la incertesa de l'estudiantat sobre la modalitat dels seus exàmens com a conseqüència de la situació sanitària i la deficiència dels protocols d'actuació, CREUP s'ha reunit amb el Ministeri d'Universitats per a tractar la situació actual. En esta reunió, s'ha criticat la falta d'informació i preparació de les universitats que, novament, està perjudicant els estudiants, i han traslladat les seues peticions.",
    },
  ],
  'carta-abierta-al-ministerio-de-universidades-2021-01': [
    {
      locale: 'en',
      title: 'Open letter to the Ministry of Universities',
      description:
        "Less than a month before the United Kingdom's definitive exit from the European Union, CREUP and ESN Spain express our rejection of the United Kingdom's decision to leave the Erasmus+ mobility programme.",
    },
    {
      locale: 'ca',
      title: "Carta oberta al Ministeri d'Universitats",
      description:
        "A menys d'un mes de la sortida definitiva del Regne Unit de la Unió Europea, des de CREUP i ESN Espanya mostrem el nostre rebuig a la decisió del Regne Unit d'abandonar el programa de mobilitat Erasmus+.",
    },
    {
      locale: 'eu',
      title: 'Gutun irekia Unibertsitate Ministerioari',
      description:
        'Erresuma Batuak Europar Batasunetik behin betiko irten baino hilabete bat lehenago, CREUPetik eta ESN Espainiatik gure gaitzespena adierazten dugu Erresuma Batuak Erasmus+ mugikortasun-programa uzteko hartu duen erabakiari.',
    },
    {
      locale: 'gl',
      title: 'Carta aberta ao Ministerio de Universidades',
      description:
        'A menos dun mes da saída definitiva do Reino Unido da Unión Europea, desde CREUP e ESN España amosamos o noso rexeitamento á decisión do Reino Unido de abandonar o programa de mobilidade Erasmus+.',
    },
    {
      locale: 'val',
      title: "Carta oberta al Ministeri d'Universitats",
      description:
        "A menys d'un mes de l'eixida definitiva del Regne Unit de la Unió Europea, des de CREUP i ESN Espanya mostrem el nostre rebuig a la decisió del Regne Unit d'abandonar el programa de mobilitat Erasmus+.",
    },
  ],
  'creup-reclama-que-la-calidad-sea-un-requisito-indispensable-2020-12': [
    {
      locale: 'en',
      title: 'CREUP calls for quality to be an essential requirement for creating new universities',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP) calls for a favourable report from quality agencies to be a requirement for the creation of universities.',
    },
    {
      locale: 'ca',
      title:
        'CREUP reclama que la qualitat sigui un requisit indispensable per crear noves universitats',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) reivindica que tenir un informe favorable de les agències de qualitat sigui un requisit per a la creació d'universitats.",
    },
    {
      locale: 'eu',
      title:
        'CREUPek aldarrikatzen du kalitatea ezinbesteko baldintza izatea unibertsitate berriak sortzeko',
      description:
        'Unibertsitate Publikoetako Ikasleen Ordezkarien Koordinatzaileak (CREUP) aldarrikatzen du kalitate-agentzien aldeko txostena izatea unibertsitateak sortzeko baldintza bat izan dadin.',
    },
    {
      locale: 'gl',
      title:
        'CREUP reclama que a calidade sexa un requisito indispensable para crear novas universidades',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) reivindica que ter un informe favorable das axencias de calidade sexa un requisito para a creación de universidades.',
    },
    {
      locale: 'val',
      title:
        'CREUP reclama que la qualitat siga un requisit indispensable per a crear noves universitats',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) reivindica que tindre un informe favorable de les agències de qualitat siga un requisit per a la creació d'universitats.",
    },
  ],
  'creup-se-reune-con-los-grupos-parlamentarios-durante-el-inic-2020-09': [
    {
      locale: 'en',
      title: 'CREUP meets with parliamentary groups at the start of the academic year',
      description:
        'The meetings focused on student demands to face the challenges of this new academic year, as well as the inclusion of student representation in the negotiations of the new Statute of Teaching and Research Staff.',
    },
    {
      locale: 'ca',
      title: "CREUP es reuneix amb els grups parlamentaris durant l'inici de curs",
      description:
        "Les reunions s'han centrat en les demandes de l'estudiantat per afrontar els reptes d'aquest nou curs, així com la inclusió de representació estudiantil en les negociacions del nou Estatut del Personal Docent i Investigador.",
    },
    {
      locale: 'eu',
      title: 'CREUP talde parlamentarioekin bildu da ikasturte-hasieran',
      description:
        'Bilerak ikasturte berri honetako erronkei aurre egiteko ikasleen eskaeretan oinarritu dira, bai eta Irakasle eta Ikertzaileen Estatutu berriaren negoziazioetan ikasleen ordezkaritza sartzean ere.',
    },
    {
      locale: 'gl',
      title: 'CREUP reúnese cos grupos parlamentarios durante o inicio de curso',
      description:
        'As reunións centráronse nas demandas do estudantado para afrontar os retos deste novo curso, así como a inclusión de representación estudantil nas negociacións do novo Estatuto do Persoal Docente e Investigador.',
    },
    {
      locale: 'val',
      title: "CREUP es reunix amb els grups parlamentaris durant l'inici de curs",
      description:
        "Les reunions s'han centrat en les demandes de l'estudiantat per a afrontar els reptes d'este nou curs, així com la inclusió de representació estudiantil en les negociacions del nou Estatut del Personal Docent i Investigador.",
    },
  ],
  'estudiantes-universitarios-lanzan-sus-peticiones-para-el-com-2020-08': [
    {
      locale: 'en',
      title: 'University students put forward their demands for the start of the academic year',
      description:
        'Just days before the academic year begins, CREUP launches its proposals during a week in which the main stakeholders in higher education are meeting, highlighting the essential issues to address before the year starts so that no student is left behind.',
    },
    {
      locale: 'ca',
      title: "Els estudiants universitaris llancen les seves peticions per a l'inici de curs",
      description:
        "A pocs dies de començar el curs, la CREUP llança les seves propostes en una setmana en què es reuneixen els principals agents en matèria d'universitat, remarcant els temes imprescindibles a treballar abans de començar el curs perquè cap estudiant es quedi enrere.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitateko ikasleek ikasturte-hasierarako euren eskaerak aurkeztu dituzte',
      description:
        'Ikasturtea hasi baino egun gutxi batzuk lehenago, CREUPek bere proposamenak aurkeztu ditu unibertsitate arloko eragile nagusiak biltzen diren astean, ikasturtea hasi aurretik landu beharreko ezinbesteko gaiak nabarmenduz, ikasle bat ere atzean gera ez dadin.',
    },
    {
      locale: 'gl',
      title: 'Os estudantes universitarios lanzan as súas peticións para o comezo de curso',
      description:
        'A escasos días de comezar o curso, a CREUP lanza as súas propostas nunha semana na que se reúnen os principais axentes en materia de universidade, salientando os temas imprescindibles a traballar antes de comezar o curso para que ningún estudante quede atrás.',
    },
    {
      locale: 'val',
      title: "Els estudiants universitaris llancen les seues peticions per a l'inici de curs",
      description:
        "A pocs dies de començar el curs, la CREUP llança les seues propostes en una setmana en què es reunixen els principals agents en matèria d'universitat, remarcant els temes imprescindibles a treballar abans de començar el curs perquè cap estudiant es quede arrere.",
    },
  ],
  'miles-de-estudiantes-tendran-que-dejar-la-universidad-si-no-2020-04': [
    {
      locale: 'en',
      title:
        'Thousands of students will have to leave university if scholarships and fees are not changed',
      description:
        'With the onset of the health crisis caused by COVID-19, the countless consequences it would bring could not be foreseen. Families with university students today fear for their future, as pursuing university studies entails a heavy financial burden and scholarships barely cover 80% of the real cost.',
    },
    {
      locale: 'ca',
      title:
        "Milers d'estudiants hauran de deixar la universitat si no es modifiquen les beques i les taxes",
      description:
        "Amb l'inici de la crisi sanitària ocasionada per la COVID-19, no es podien preveure les innombrables conseqüències que comportaria. Les famílies amb estudiants universitaris avui temen pel seu futur, perquè cursar estudis universitaris suposa un gran pes econòmic i les beques tot just cobreixen el 80% del cost real.",
    },
    {
      locale: 'eu',
      title: 'Milaka ikaslek unibertsitatea utzi beharko dute bekak eta tasak aldatzen ez badira',
      description:
        'COVID-19ak eragindako osasun-krisia hastearekin batera, ezin izan ziren aurreikusi ekarriko zituen kontaezinezko ondorioak. Unibertsitate-ikasleak dituzten familiek beren etorkizunaren beldur dira gaur, unibertsitate-ikasketak egiteak karga ekonomiko handia baitakar eta bekek benetako kostuaren % 80 baino ez baitute estaltzen.',
    },
    {
      locale: 'gl',
      title:
        'Miles de estudantes terán que deixar a universidade se non se modifican as bolsas e as taxas',
      description:
        'Co inicio da crise sanitaria ocasionada pola COVID-19, non se podían prever as innumerables consecuencias que acarrearía. As familias con estudantes universitarios hoxe temen polo seu futuro, pois cursar estudos universitarios supon un gran peso económico e as bolsas apenas cobren o 80% do custo real.',
    },
    {
      locale: 'val',
      title:
        "Milers d'estudiants hauran de deixar la universitat si no es modifiquen les beques i les taxes",
      description:
        "Amb l'inici de la crisi sanitària ocasionada per la COVID-19, no es podien preveure les innombrables conseqüències que comportaria. Les famílies amb estudiants universitaris hui temen pel seu futur, perquè cursar estudis universitaris supon un gran pes econòmic i les beques a penes cobrixen el 80% del cost real.",
    },
  ],
  'el-estudiantado-sigue-sin-saber-como-finalizara-el-curso-2020-04': [
    {
      locale: 'en',
      title: 'Students still do not know how the academic year will end',
      description:
        'Without clear guidelines and without a set course is how we university students find ourselves.',
    },
    {
      locale: 'ca',
      title: "L'estudiantat continua sense saber com finalitzarà el curs",
      description:
        "Sense unes directrius clares i sense un rumb fix és com ens trobem l'estudiantat universitari.",
    },
    {
      locale: 'eu',
      title: 'Ikasleek ez dakite oraindik nola amaituko den ikasturtea',
      description:
        'Jarraibide argirik gabe eta norabide finkorik gabe gaude unibertsitateko ikasleak.',
    },
    {
      locale: 'gl',
      title: 'O estudantado segue sen saber como finalizará o curso',
      description:
        'Sen unhas directrices claras e sen un rumbo fixo é como nos atopamos o estudantado universitario.',
    },
    {
      locale: 'val',
      title: "L'estudiantat continua sense saber com finalitzarà el curs",
      description:
        "Sense unes directrius clares i sense un rumb fix és com ens trobem l'estudiantat universitari.",
    },
  ],
  'representantes-de-estudiantes-piden-a-instituciones-y-univer-2020-03': [
    {
      locale: 'en',
      title:
        'Student representatives ask institutions and universities for maximum support for Erasmus students',
      description:
        'CREUP and ESN Spain thank the Ministries, the SEPIE and the Universities for their efforts and request maximum flexibility in the application of the force majeure clause.',
    },
    {
      locale: 'ca',
      title:
        "Representants d'estudiants demanen a institucions i universitats el màxim suport per als Erasmus",
      description:
        "CREUP i ESN Espanya agraeixen els esforços dels Ministeris, el SEPIE i les Universitats i sol·liciten que es doni la màxima flexibilitat en l'aplicació de la clàusula de força major.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleen ordezkariek erakundeei eta unibertsitateei Erasmusentzako ahalik eta sostengu handiena eskatzen diete',
      description:
        'CREUPek eta ESN Espainiak eskertu egiten dituzte Ministerioen, SEPIEren eta Unibertsitateen ahaleginak, eta ahalik eta malgutasun handiena eskatzen dute ezinbesteko klausula aplikatzean.',
    },
    {
      locale: 'gl',
      title:
        'Representantes de estudantes piden a institucións e universidades o máximo apoio para os Erasmus',
      description:
        'CREUP e ESN España agradecen os esforzos dos Ministerios, o SEPIE e as Universidades e solicitan que se dea a máxima flexibilidade na aplicación da cláusula de forza maior.',
    },
    {
      locale: 'val',
      title:
        "Representants d'estudiants demanen a institucions i universitats el màxim suport per als Erasmus",
      description:
        "CREUP i ESN Espanya agraïxen els esforços dels Ministeris, el SEPIE i les Universitats i sol·liciten que es done la màxima flexibilitat en l'aplicació de la clàusula de força major.",
    },
  ],
  'el-estudiantado-reivindica-su-participacion-en-la-iniciativa-2020-02': [
    {
      locale: 'en',
      title: 'Students call for their participation in the European universities initiative',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP) and Erasmus Student Network Spain (ESN Spain) encourage Spanish universities to introduce student participation as the main objective for the new European Universities call.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat reivindica la seva participació en la iniciativa d'universitats europees",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) i Erasmus Student Network Espanya (ESN Espanya) encoratgen les universitats espanyoles a introduir la participació estudiantil com a principal objectiu de cara a la nova convocatòria d'Universitats Europees.",
    },
    {
      locale: 'eu',
      title: 'Ikasleek beren parte-hartzea aldarrikatzen dute europar unibertsitateen ekimenean',
      description:
        'Unibertsitate Publikoetako Ikasleen Ordezkarien Koordinatzaileak (CREUP) eta Erasmus Student Network Espainiak (ESN Espainia) Espainiako unibertsitateak animatzen dituzte ikasleen parte-hartzea helburu nagusi gisa sartzera Europar Unibertsitateen deialdi berriari begira.',
    },
    {
      locale: 'gl',
      title: 'O estudantado reivindica a súa participación na iniciativa de universidades europeas',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) e Erasmus Student Network España (ESN España) alentan as universidades españolas a introducir a participación estudantil como principal obxectivo de cara á nova convocatoria de Universidades Europeas.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat reivindica la seua participació en la iniciativa d'universitats europees",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) i Erasmus Student Network Espanya (ESN Espanya) animen les universitats espanyoles a introduir la participació estudiantil com a principal objectiu de cara a la nova convocatòria d'Universitats Europees.",
    },
  ],
  'esn-espana-y-creup-piden-un-aumento-de-la-cofinanciacion-nac-2019-12': [
    {
      locale: 'en',
      title:
        'ESN Spain and CREUP call for an increase in national and regional co-financing for Erasmus+',
      description:
        'The student representatives publish a report on the current situation with recommendations for more equitable mobility as part of the #DefiendeTuErasmus campaign',
    },
    {
      locale: 'ca',
      title:
        'ESN Espanya i CREUP demanen un augment del cofinançament nacional i autonòmic per a Erasmus+',
      description:
        'Els representants estudiantils publiquen un informe sobre la situació actual amb recomanacions per a una mobilitat més equitativa en el marc de la campanya #DefiendeTuErasmus',
    },
    {
      locale: 'eu',
      title:
        'ESN Espainiak eta CREUPek Erasmus+ programarako kofinantzaketa nazionala eta autonomikoa handitzeko eskatu dute',
      description:
        'Ikasleen ordezkariek egungo egoerari buruzko txosten bat argitaratu dute, mugikortasun bidezkoago baterako gomendioekin, #DefiendeTuErasmus kanpainaren barruan',
    },
    {
      locale: 'gl',
      title:
        'ESN España e CREUP piden un aumento do cofinanciamento nacional e autonómico para Erasmus+',
      description:
        'Os representantes estudantís publican un informe sobre a situación actual con recomendacións para unha mobilidade máis equitativa no marco da campaña #DefiendeTuErasmus',
    },
    {
      locale: 'val',
      title:
        'ESN Espanya i CREUP demanen un augment del cofinançament nacional i autonòmic per a Erasmus+',
      description:
        'Els representants estudiantils publiquen un informe sobre la situació actual amb recomanacions per a una mobilitat més equitativa en el marc de la campanya #DefiendeTuErasmus',
    },
  ],
  'creup-crue-y-esn-piden-al-gobierno-que-apoye-triplicar-la-fi-2019-11': [
    {
      locale: 'en',
      title: 'CREUP, CRUE and ESN call on the Government to support tripling Erasmus+ funding',
      description:
        'The president of CREUP and the presidents of Crue Universidades and ESN Spain have signed a joint letter calling on the caretaker Prime Minister to support the proposal to triple the funding of the next Erasmus+ programme, put forward by the European Parliament and promoted by the European Commission.',
    },
    {
      locale: 'ca',
      title:
        "CREUP, CRUE i ESN demanen al Govern que doni suport a triplicar el finançament d'Erasmus+",
      description:
        "El president de CREUP i els presidents de Crue Universidades i d'ESN Spain han signat una carta conjunta en què demanen al president del Govern en funcions que doni suport a la proposta per a triplicar el finançament del proper programa Erasmus+ presentada pel Parlament Europeu i promoguda per la Comissió Europea.",
    },
    {
      locale: 'eu',
      title:
        'CREUPek, CRUEk eta ESNek Gobernuari Erasmus+ finantzaketa hirukoizteari laguntzeko eskatu diote',
      description:
        'CREUPeko presidenteak eta Crue Universidades eta ESN Spain erakundeetako presidenteek gutun bateratu bat sinatu dute, eta bertan jarduneko Gobernuko presidenteari eskatu diote Europako Parlamentuak aurkeztu eta Europako Batzordeak bultzatutako hurrengo Erasmus+ programaren finantzaketa hirukoizteko proposamenari laguntzeko.',
    },
    {
      locale: 'gl',
      title:
        'CREUP, CRUE e ESN piden ao Goberno que apoie triplicar o financiamento para o Erasmus+',
      description:
        'O presidente de CREUP e os presidentes de Crue Universidades e de ESN Spain asinaron unha carta conxunta na que lle piden ao presidente do Goberno en funcións que apoie a proposta para triplicar o financiamento do próximo programa Erasmus+ presentada polo Parlamento Europeo e promovida pola Comisión Europea.',
    },
    {
      locale: 'val',
      title:
        "CREUP, CRUE i ESN demanen al Govern que done suport a triplicar el finançament d'Erasmus+",
      description:
        "El president de CREUP i els presidents de Crue Universidades i d'ESN Spain han firmat una carta conjunta en què demanen al president del Govern en funcions que done suport a la proposta per a triplicar el finançament del pròxim programa Erasmus+ presentada pel Parlament Europeu i promoguda per la Comissió Europea.",
    },
  ],
  'el-estudiantado-estrecha-lazos-por-la-internacionalizacion-d-2019-10': [
    {
      locale: 'en',
      title:
        'Students forge closer ties for the internationalisation of the Spanish university system',
      description:
        'The associations ESN and CREUP sign an agreement to work together for the internationalisation and mobility of university students.',
    },
    {
      locale: 'ca',
      title: "L'estudiantat estreny llaços per la internacionalització de la universitat espanyola",
      description:
        "Les associacions ESN i CREUP signen un conveni per treballar conjuntament per la internacionalització i mobilitat de l'estudiantat universitari.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek loturak estutzen dituzte Espainiako unibertsitatearen nazioartekotzearen alde',
      description:
        'ESN eta CREUP elkarteek hitzarmen bat sinatu dute unibertsitateko ikasleen nazioartekotzearen eta mugikortasunaren alde elkarlanean aritzeko.',
    },
    {
      locale: 'gl',
      title: 'O estudantado estreita lazos pola internacionalización da universidade española',
      description:
        'As asociacións ESN e CREUP asinan un convenio para traballar conxuntamente pola internacionalización e mobilidade do estudantado universitario.',
    },
    {
      locale: 'val',
      title: "L'estudiantat estreny llaços per la internacionalització de la universitat espanyola",
      description:
        "Les associacions ESN i CREUP firmen un conveni per a treballar conjuntament per la internacionalització i mobilitat de l'estudiantat universitari.",
    },
  ],
  'el-bloqueo-politico-deja-un-ano-mas-a-las-asociaciones-de-un-2019-10': [
    {
      locale: 'en',
      title:
        'Political deadlock leaves university associations without a grant for yet another year',
      description:
        'This academic year the grant for youth associations and for federations and confederations of university students has not been issued. It is usually called in July or September each year; by October there is still no news. The same situation occurred in 2016 with the repeat General Election.',
    },
    {
      locale: 'ca',
      title:
        "El bloqueig polític deixa un any més les associacions d'universitaris sense subvenció",
      description:
        "Aquest curs acadèmic no s'ha convocat la subvenció d'associacions juvenils i a federacions i confederacions d'estudiants universitaris. Sol convocar-se al mes de juliol o setembre de cada any; a l'octubre encara no se'n tenen notícies. La mateixa situació es va produir el 2016 amb la repetició de les eleccions generals.",
    },
    {
      locale: 'eu',
      title:
        'Blokeo politikoak beste urte batez utzi ditu unibertsitate-elkarteak diru-laguntzarik gabe',
      description:
        'Ikasturte honetan ez da deitu gazte-elkarteentzako eta unibertsitateko ikasleen federazio eta konfederazioentzako diru-laguntza. Urtero uztailean edo irailean deitu ohi da; urrian oraindik ez da berririk. Egoera bera gertatu zen 2016an hauteskunde orokorrak errepikatu zirenean.',
    },
    {
      locale: 'gl',
      title: 'O bloqueo político deixa un ano máis as asociacións de universitarios sen subvención',
      description:
        'Este curso académico non se convocou a subvención de asociacións xuvenís e a federacións e confederacións de estudantes universitarios. Adoita convocarse no mes de xullo ou setembro de cada ano; en outubro aínda non se teñen noticias. A mesma situación produciuse en 2016 coa repetición das eleccións xerais.',
    },
    {
      locale: 'val',
      title:
        "El bloqueig polític deixa un any més les associacions d'universitaris sense subvenció",
      description:
        "Este curs acadèmic no s'ha convocat la subvenció d'associacions juvenils i a federacions i confederacions d'estudiants universitaris. Sol convocar-se en el mes de juliol o setembre de cada any; en octubre encara no se'n tenen notícies. La mateixa situació es va produir en 2016 amb la repetició de les eleccions generals.",
    },
  ],
  'creup-se-reune-con-los-grupos-parlamentarios-para-plantear-l-2019-09': [
    {
      locale: 'en',
      title: 'CREUP meets with parliamentary groups to put forward lines of work',
      description:
        'The meetings focused on the need to include students in the negotiation of the new Organic Law on Universities, the amendment of the 1954 disciplinary regulations, as well as the systems of scholarships and study aid, university fees and academic internships.',
    },
    {
      locale: 'ca',
      title: 'CREUP es reuneix amb els grups parlamentaris per plantejar línies de treball',
      description:
        "Les reunions s'han centrat en la necessitat d'incloure l'estudiantat en la negociació de la nova Llei Orgànica d'Universitats, la modificació del reglament de règim disciplinari de 1954, així com els sistemes de beques i ajudes a l'estudi, taxes universitàries i pràctiques acadèmiques.",
    },
    {
      locale: 'eu',
      title: 'CREUP talde parlamentarioekin biltzen da lan-ildoak planteatzeko',
      description:
        'Bilerek ikasleak Unibertsitateei buruzko Lege Organiko berriaren negoziazioan sartzeko beharrean, 1954ko diziplina-araubidearen erregelamendua aldatzean, bai eta beken eta ikasketa-laguntzen sistemetan, unibertsitate-tasetan eta praktika akademikoetan ere jarri dute arreta.',
    },
    {
      locale: 'gl',
      title: 'CREUP reúnese cos grupos parlamentarios para formular liñas de traballo',
      description:
        'As reunións centráronse na necesidade de incluír o estudantado na negociación da nova Lei Orgánica de Universidades, a modificación do regulamento de réxime disciplinario de 1954, así como os sistemas de bolsas e axudas ao estudo, taxas universitarias e prácticas académicas.',
    },
    {
      locale: 'val',
      title: 'CREUP es reunix amb els grups parlamentaris per a plantejar línies de treball',
      description:
        "Les reunions s'han centrat en la necessitat d'incloure l'estudiantat en la negociació de la nova Llei Orgànica d'Universitats, la modificació del reglament de règim disciplinari de 1954, així com els sistemes de beques i ajudes a l'estudi, taxes universitàries i pràctiques acadèmiques.",
    },
  ],
  'la-red-espanola-de-inmigracion-y-la-coordinadora-de-represen-2019-08': [
    {
      locale: 'en',
      title:
        'The Spanish Network for Immigration and the Coordinator of Representatives of Public Universities establish the observatory of migration in the university',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP), together with the Red Española de Inmigración y Ayuda al Refugiado, signed this morning the cooperation agreement to establish the 1st Observatory of Migration and University. The aim set out by the promoting organizations will be the analysis of the problems and the […]',
    },
    {
      locale: 'ca',
      title:
        "La Xarxa Espanyola d'Immigració i la Coordinadora de Representants d'Universitats Públiques constitueixen l'observatori de les migracions a la universitat",
      description:
        "La Coordinadora de Representants d'Estudiants de les Universitats Públiques (CREUP) juntament amb la Red Española de Inmigración y Ayuda al Refugiado han signat aquest matí el conveni de col·laboració per a la constitució del 1r Observatori de Migració i Universitat. L'objectiu plantejat per les entitats promotores serà l'anàlisi de la problemàtica i els […]",
    },
    {
      locale: 'eu',
      title:
        'Immigrazioaren Espainiako Sareak eta Unibertsitate Publikoetako Ordezkarien Koordinatzaileak unibertsitateko migrazioen behatokia eratu dute',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak (CREUP), Red Española de Inmigración y Ayuda al Refugiado erakundearekin batera, lankidetza-hitzarmena sinatu du gaur goizean Migrazioaren eta Unibertsitatearen 1. Behatokia eratzeko. Erakunde sustatzaileek planteatutako helburua biztanleria migratzaileak unibertsitate-ikasketetan duen problematikaren eta […]',
    },
    {
      locale: 'gl',
      title:
        'A Rede Española de Inmigración e a Coordinadora de Representantes de Universidades Públicas constitúen o observatorio das migracións na universidade',
      description:
        'A Coordinadora de Representantes de Estudantes das Universidades Públicas (CREUP) xunto coa Red Española de Inmigración y Ayuda al Refugiado asinaron esta mañá o convenio de colaboración para a constitución do 1.º Observatorio de Migración e Universidade. O obxectivo formulado polas entidades promotoras será a análise da problemática e os […]',
    },
    {
      locale: 'val',
      title:
        "La Xarxa Espanyola d'Immigració i la Coordinadora de Representants d'Universitats Públiques constituïxen l'observatori de les migracions en la universitat",
      description:
        "La Coordinadora de Representants d'Estudiants de les Universitats Públiques (CREUP) junt amb la Red Española de Inmigración y Ayuda al Refugiado han firmat este matí el conveni de col·laboració per a la constitució del 1r Observatori de Migració i Universitat. L'objectiu plantejat per les entitats promotores serà l'anàlisi de la problemàtica i els […]",
    },
  ],
  'la-coordinadora-de-representantes-de-estudiantes-de-universi-2019-06': [
    {
      locale: 'en',
      title:
        'The Coordinator of Student Representatives of Public Universities submits amendments to the RD establishing the income and family-assets thresholds and the amounts of study scholarships and aid for the 2019 - 2020 academic year',
      description:
        'The Coordinator of Student Representatives of Public Universities, CREUP, submits a total of 10 amendments to the RD establishing the income and family-assets thresholds and the amounts of study scholarships and aid for the 2019-2020 academic year presented by the Government, having concluded that they do not match the […]',
    },
    {
      locale: 'ca',
      title:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques presenta esmenes al RD pel qual s'estableixen els llindars de renda i patrimoni familiar i les quanties de les beques i ajudes a l'estudi per al curs 2019 - 2020",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques, CREUP, presenta un total de 10 esmenes al RD pel qual s'estableixen els llindars de renda i patrimoni familiar i les quanties de les beques i ajudes a l'estudi per al curs 2019-2020 presentat pel Govern, després d'entendre que no s'adeqüen a les […]",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak zuzenketak aurkeztu ditu 2019 - 2020 ikasturterako errentaren eta familia-ondarearen atalaseak eta ikasketa-beken eta -laguntzen zenbatekoak ezartzen dituen RDari',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak, CREUP, guztira 10 zuzenketa aurkeztu dizkio Gobernuak aurkeztutako 2019-2020 ikasturterako errentaren eta familia-ondarearen atalaseak eta ikasketa-beken eta -laguntzen zenbatekoak ezartzen dituen RDari, ulertu baitu ez datozela bat […]',
    },
    {
      locale: 'gl',
      title:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas presenta emendas ao RD polo que se establecen os limiares de renda e patrimonio familiar e as contías das bolsas e axudas ao estudo para o curso 2019 - 2020',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas, CREUP, presenta un total de 10 emendas ao RD polo que se establecen os limiares de renda e patrimonio familiar e as contías das bolsas e axudas ao estudo para o curso 2019-2020 presentado polo Goberno, tras entender que non se adecúan ás […]',
    },
    {
      locale: 'val',
      title:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques presenta esmenes al RD pel qual s'establixen els llindars de renda i patrimoni familiar i les quanties de les beques i ajudes a l'estudi per al curs 2019 - 2020",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques, CREUP, presenta un total de 10 esmenes al RD pel qual s'establixen els llindars de renda i patrimoni familiar i les quanties de les beques i ajudes a l'estudi per al curs 2019-2020 presentat pel Govern, després d'entendre que no s'adeqüen a les […]",
    },
  ],
  'la-coordinadora-de-representantes-de-estudiantes-de-universi-2019-06-2': [
    {
      locale: 'en',
      title:
        'The Coordinator of Student Representatives of Public Universities sees the need to review the university entrance exams and offers to work on it',
      description:
        'Over these months the various Autonomous Communities hold the university entrance exams, which thousands of students face seeking to reach the grade that lets them enter the studies they want. As happens every year around these dates, the debate opens on what the entrance exam model should be like, but this year it seems the Government has offered to review it. From the […]',
    },
    {
      locale: 'ca',
      title:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques veu necessària la revisió de les proves d'accés a la Universitat i s'ofereix a treballar-hi",
      description:
        "Durant aquests mesos les diferents Comunitats Autònomes realitzen les proves d'accés a la Universitat, a les quals milers d'estudiants s'enfronten buscant assolir la nota que els permeti entrar als estudis que desitgen. Com cada any per aquestes dates s'obre el debat sobre com hauria de ser el model de prova d'[…]",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak beharrezkotzat jotzen du unibertsitatera sartzeko probak berrikustea, eta horretan lan egitea eskaintzen du',
      description:
        'Hilabete hauetan zehar autonomia-erkidego desberdinek unibertsitatera sartzeko probak egiten dituzte, eta milaka ikaslek egiten diete aurre nahi dituzten ikasketetan sartzeko aukera emango dien nota lortu nahian. Urtero data hauetan bezala, sarbide-probaren ereduak nolakoa izan beharko lukeen eztabaida zabaltzen da, baina aurten badirudi Gobernuak […]',
    },
    {
      locale: 'gl',
      title:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas ve necesaria a revisión das probas de acceso á Universidade e ofrécese a traballar nilo',
      description:
        'Durante estes meses as distintas Comunidades Autónomas realizan as probas de acceso á Universidade, ás que miles de estudantes se enfrontan buscando alcanzar a nota que lles permita entrar nos estudos que desexan. Como cada ano por estas datas ábrese o debate sobre como debería ser o modelo de proba de […]',
    },
    {
      locale: 'val',
      title:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques considera necessària la revisió de les proves d'accés a la Universitat i s'oferix a treballar-hi",
      description:
        "Durant estos mesos les distintes Comunitats Autònomes realitzen les proves d'accés a la Universitat, a les quals milers d'estudiants s'enfronten buscant aconseguir la nota que els permeta entrar en els estudis que desitgen. Com cada any per estes dates s'obri el debat sobre com hauria de ser el model de prova d'[…]",
    },
  ],
  'ii-congreso-creup-crue-y-x-encuentro-creup-2019-03': [
    {
      locale: 'en',
      title: 'II CREUP - CRUE Congress and X CREUP Meeting',
      description:
        'On 28, 29 and 30 March 2019, the Complutense University of Madrid will host the II Congress of the Coordinating Body of Student Representatives of Public Universities (CREUP) and the Conference of Rectors of the Universities of Spain (CRUE), together with the X Meeting of Student Representatives of Public Universities […]',
    },
    {
      locale: 'ca',
      title: 'II Congrés CREUP - CRUE i X Trobada CREUP',
      description:
        "Durant els dies 28, 29 i 30 de març de 2019 tindrà lloc a la Universitat Complutense de Madrid el II Congrés de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) i la Conferència de Rectors de les Universitats d'Espanya (CRUE) i la X Trobada de Representants d'Estudiants d'Universitats Públiques […]",
    },
    {
      locale: 'eu',
      title: 'II. CREUP - CRUE Kongresua eta X. CREUP Topaketa',
      description:
        '2019ko martxoaren 28an, 29an eta 30ean Madrilgo Unibertsitate Complutensean egingo da Unibertsitate Publikoetako Ikasle Ordezkarien Koordinakundearen (CREUP) eta Espainiako Unibertsitateetako Errektoreen Konferentziaren (CRUE) II. Kongresua, baita Unibertsitate Publikoetako Ikasle Ordezkarien X. Topaketa ere […]',
    },
    {
      locale: 'gl',
      title: 'II Congreso CREUP - CRUE e X Encontro CREUP',
      description:
        'Durante os días 28, 29 e 30 de marzo de 2019 terá lugar na Universidade Complutense de Madrid o II Congreso da Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) e a Conferencia de Reitores das Universidades de España (CRUE) e o X Encontro de Representantes de Estudantes de Universidades Públicas […]',
    },
    {
      locale: 'val',
      title: 'II Congrés CREUP - CRUE i X Trobada CREUP',
      description:
        "Durant els dies 28, 29 i 30 de març de 2019 tindrà lloc en la Universitat Complutense de Madrid el II Congrés de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) i la Conferència de Rectors de les Universitats d'Espanya (CRUE) i la X Trobada de Representants d'Estudiants d'Universitats Públiques […]",
    },
  ],
  'los-estudiantes-valoran-como-un-primer-paso-positivo-las-med-2018-10': [
    {
      locale: 'en',
      title: 'Students see the measures against the “fee hike” as a positive first step',
      description:
        "Following today's announcement of the agreement to pass the General State Budget between the Government of Spain and the confederal parliamentary group Unidos Podemos - En Comú Podem - En Marea, the Coordinating Body of Student Representatives of Public Universities wishes to express our hope that a new era is beginning to […]",
    },
    {
      locale: 'ca',
      title: 'Els estudiants valoren com un primer pas positiu les mesures contra el «tassàs»',
      description:
        "Després de l'anunci d'avui del pacte per a l'aprovació dels Pressupostos Generals de l'Estat entre el Govern d'Espanya i el Grup parlamentari confederal Unidos Podemos - En Comú Podem - En Marea, des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques desitgem manifestar la nostra esperança que un nou temps comence a […]",
    },
    {
      locale: 'eu',
      title: 'Ikasleek lehen urrats positibotzat hartzen dituzte «tasazo»aren aurkako neurriak',
      description:
        'Gaur Espainiako Gobernuaren eta Unidos Podemos - En Comú Podem - En Marea talde parlamentario konfederalaren artean Estatuko Aurrekontu Orokorrak onartzeko itundua iragarri ondoren, Unibertsitate Publikoetako Ikasle Ordezkarien Koordinakundeak gure itxaropena adierazi nahi dugu, denbora berri bat hasten ari dela […]',
    },
    {
      locale: 'gl',
      title: 'Os estudantes valoran como un primeiro paso positivo as medidas contra o «tasazo»',
      description:
        'Tras o anuncio hoxe do pacto para a aprobación dos Orzamentos Xerais do Estado entre o Goberno de España e o Grupo parlamentario confederal Unidos Podemos - En Comú Podem - En Marea, desde a Coordinadora de Representantes de Estudantes de Universidades Públicas desexamos manifestar a nosa esperanza de que un novo tempo comece a […]',
    },
    {
      locale: 'val',
      title: 'Els estudiants valoren com un primer pas positiu les mesures contra el «tassàs»',
      description:
        "Després de l'anunci de hui del pacte per a l'aprovació dels Pressupostos Generals de l'Estat entre el Govern d'Espanya i el Grup parlamentari confederal Unidos Podemos - En Comú Podem - En Marea, des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques desitgem manifestar la nostra esperança que un nou temps comence a […]",
    },
  ],
  'representantes-de-estudiantes-de-universidades-publicas-recl-2018-08': [
    {
      locale: 'en',
      title:
        'Public university student representatives call for a better scholarship system and voice their disagreement with the current royal decree',
      description:
        'The Government has gone ahead with the publication of Royal Decree 951/2018, which sets the income and family wealth thresholds and the amounts of scholarships and study grants for the 2018-2019 academic year. At the Coordinating Body of Student Representatives of Public Universities (CREUP) we feel obliged to put on record our deep disappointment […]',
    },
    {
      locale: 'ca',
      title:
        "Representants d'estudiants d'universitats públiques reclamen un millor sistema de beques i manifesten la seua disconformitat amb el reial decret actual",
      description:
        "El Govern ha fet efectiva la publicació del Reial Decret 951/2018 que fixa els llindars de renda i patrimoni familiar i les quanties de beques i ajudes a l'estudi per al curs 2018-2019. Des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) ens sentim en l'obligació de deixar palesa la nostra profunda decepció […]",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitate publikoetako ikasle ordezkariek beka sistema hobea eskatzen dute eta egungo errege dekretuarekiko desadostasuna agertzen dute',
      description:
        'Gobernuak 951/2018 Errege Dekretua argitaratu du, 2018-2019 ikasturterako familia errentaren eta ondarearen atalaseak eta beken eta ikasketa laguntzen zenbatekoak finkatzen dituena. Unibertsitate Publikoetako Ikasle Ordezkarien Koordinakundetik (CREUP) gure etsipen sakona agertzeko betebeharra sentitzen dugu […]',
    },
    {
      locale: 'gl',
      title:
        'Representantes de estudantes de universidades públicas reclaman un mellor sistema de bolsas e manifestan a súa desconformidade co real decreto actual',
      description:
        'O Goberno fixo efectiva a publicación do Real Decreto 951/2018 que fixa os limiares de renda e patrimonio familiar e as contías de bolsas e axudas ao estudo para o curso 2018-2019. Desde a Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) sentímonos na obriga de deixar presente a nosa profunda decepción […]',
    },
    {
      locale: 'val',
      title:
        "Representants d'estudiants d'universitats públiques reclamen un millor sistema de beques i manifesten la seua disconformitat amb el reial decret actual",
      description:
        "El Govern ha fet efectiva la publicació del Reial Decret 951/2018 que fixa els llindars de renda i patrimoni familiar i les quanties de beques i ajudes a l'estudi per al curs 2018-2019. Des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) ens sentim en l'obligació de deixar patent la nostra profunda decepció […]",
    },
  ],
  'carta-abierta-al-grupo-parlamentario-ciudadanos-en-el-congre-2018-06': [
    {
      locale: 'en',
      title: 'Open letter to the Ciudadanos Parliamentary Group in the Congress of Deputies',
      description:
        "To the attention of the Ciudadanos Parliamentary Group in the Congress of Deputies. Almost a month ago, the Ciudadanos Parliamentary Group put forward a bill to improve the autonomy and accountability of Spain's universities. A proposal carried out without the involvement of any of the groups that make up the University […]",
    },
    {
      locale: 'ca',
      title: 'Carta oberta al Grup Parlamentari Ciutadans al Congrés dels Diputats',
      description:
        "A l'atenció del Grup Parlamentari Ciutadans al Congrés dels Diputats. Fa gairebé un mes que el Grup Parlamentari Ciutadans presentava una proposta de llei de millora de l'autonomia i la rendició de comptes de les universitats espanyoles. Una proposta duta a terme sense la participació de cap dels col·lectius que formen la Universitat […]",
    },
    {
      locale: 'eu',
      title: 'Gutun irekia Diputatuen Kongresuko Ciudadanos Talde Parlamentarioari',
      description:
        'Diputatuen Kongresuko Ciudadanos Talde Parlamentarioaren arretarako. Duela ia hilabete Ciudadanos Talde Parlamentarioak Espainiako unibertsitateen autonomia eta kontuak ematea hobetzeko lege-proposamena aurkeztu zuen. Unibertsitatea osatzen duten kolektiboetako bat ere parte hartu gabe egindako proposamena […]',
    },
    {
      locale: 'gl',
      title: 'Carta aberta ao Grupo Parlamentario Cidadáns no Congreso dos Deputados',
      description:
        'Á atención do Grupo Parlamentario Cidadáns no Congreso dos Deputados. Fai case un mes que o Grupo Parlamentario Cidadáns presentaba unha proposta de lei de mellora da autonomía e a rendición de contas das universidades españolas. Unha proposta levada a cabo sen a participación de ningún dos colectivos que forman a Universidade […]',
    },
    {
      locale: 'val',
      title: 'Carta oberta al Grup Parlamentari Ciutadans en el Congrés dels Diputats',
      description:
        "A l'atenció del Grup Parlamentari Ciutadans en el Congrés dels Diputats. Fa quasi un mes que el Grup Parlamentari Ciutadans presentava una proposta de llei de millora de l'autonomia i la rendició de comptes de les universitats espanyoles. Una proposta duta a terme sense la participació de cap dels col·lectius que formen la Universitat […]",
    },
  ],
  'sobre-los-nuevos-criterios-para-becas-2018-05': [
    {
      locale: 'en',
      title: 'On the new criteria for scholarships',
      description:
        'From the Coordinator of Student Representatives of Public Universities (CREUP), as the voice of students, we would like to express our disagreement and disappointment with the criteria for awarding scholarships to university students for the 2018-2019 academic year announced today by Minister Méndez de Vigo. First of all, we agree that […]',
    },
    {
      locale: 'ca',
      title: 'Sobre els nous criteris per a les beques',
      description:
        "Des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP), com a veu dels estudiants, voldríem manifestar la nostra disconformitat i decepció amb els criteris per a la concessió de les beques per a estudiants universitaris durant el curs 2018-2019 anunciats avui pel ministre Méndez de Vigo. En primer lloc, estem d'acord que es […]",
    },
    {
      locale: 'eu',
      title: 'Beken irizpide berriei buruz',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinakundetik (CREUP), ikasleen ahots gisa, gaur Méndez de Vigo ministroak iragarritako 2018-2019 ikasturteko unibertsitateko ikasleentzako beken emakidarako irizpideekin dugun desadostasuna eta etsipena adierazi nahi genituzke. Lehenik eta behin, ados gaude […]',
    },
    {
      locale: 'gl',
      title: 'Sobre os novos criterios para as bolsas',
      description:
        'Desde a Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP), como voz do estudantado, queriamos manifestar a nosa disconformidade e decepción cos criterios para a concesión das bolsas para estudantes universitarios durante o curso 2018-2019 anunciados hoxe polo ministro Méndez de Vigo. En primeiro lugar, estamos de acordo en que se […]',
    },
    {
      locale: 'val',
      title: 'Sobre els nous criteris per a les beques',
      description:
        "Des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP), com a veu dels estudiants, voldríem manifestar la nostra disconformitat i decepció amb els criteris per a la concessió de les beques per a estudiants universitaris durant el curs 2018-2019 anunciats hui pel ministre Méndez de Vigo. En primer lloc, estem d'acord que es […]",
    },
  ],
  'caso-cifuentes-2018-04': [
    {
      locale: 'en',
      title: 'The Cifuentes case',
      description:
        "Last week, in connection with the events at the Universidad Rey Juan Carlos regarding the master's degree taken by Cristina Cifuentes, CREUP asked ANECA (as a Quality Agency) to review that university's master's programme and the professors involved in this case. Yesterday we received ANECA's reply and […]",
    },
    {
      locale: 'ca',
      title: 'El cas Cifuentes',
      description:
        "La setmana passada, amb motiu del que va passar a la Universidad Rey Juan Carlos respecte al màster cursat per Cristina Cifuentes, des de CREUP vam sol·licitar a l'ANECA (com a Agència de Qualitat) que revisés el màster d'aquesta universitat i el professorat implicat en aquest cas. Ahir vam rebre la resposta de l'ANECA i […]",
    },
    {
      locale: 'eu',
      title: 'Cifuentes auzia',
      description:
        'Joan den astean, Cristina Cifuentesek egindako masterrari dagokionez Universidad Rey Juan Carlosen gertatutakoa zela eta, CREUPetik ANECAri (Kalitate Agentzia gisa) unibertsitate horretako masterra eta kasu honetan inplikatutako irakasleak berrikus zitzan eskatu genion. Atzo ANECAren erantzuna jaso genuen eta […]',
    },
    {
      locale: 'gl',
      title: 'O caso Cifuentes',
      description:
        'A pasada semana, con motivo do acontecido na Universidad Rey Juan Carlos respecto ao máster cursado por Cristina Cifuentes, desde CREUP solicitamos á ANECA (como Axencia de Calidade) que revisase o máster da devandita universidade e o profesorado implicado neste caso. Onte recibimos a resposta da ANECA e […]',
    },
    {
      locale: 'val',
      title: 'El cas Cifuentes',
      description:
        "La setmana passada, amb motiu del que va passar en la Universidad Rey Juan Carlos respecte al màster cursat per Cristina Cifuentes, des de CREUP vam sol·licitar a l'ANECA (com a Agència de Qualitat) que revisara el màster d'esta universitat i el professorat implicat en este cas. Ahir vam rebre la resposta de l'ANECA i […]",
    },
  ],
  'creup-y-crue-firman-un-convenio-de-cooperacion-2018-01': [
    {
      locale: 'en',
      title: 'CREUP and CRUE sign a cooperation agreement',
      description:
        'Ties between academic and student university representation grow closer Tona, January 30, 2018 This afternoon Carmen Romero, President of CREUP, and Roberto Fernández, President of CRUE and Rector of the Universitat de Lleida, signed a cooperation agreement between the Coordinator of Student Representatives of Public Universities, which represent […]',
    },
    {
      locale: 'ca',
      title: 'CREUP i CRUE signen un conveni de cooperació',
      description:
        "S'estrenyen els llaços entre la representació acadèmica i estudiantil universitària Tona, 30 de gener de 2018 Aquesta tarda Carmen Romero, Presidenta de CREUP, i Roberto Fernández, President de CRUE i Rector de la Universitat de Lleida, han signat un conveni de cooperació entre la Coordinadora de Representants d'Estudiants d'Universitats Públiques, que representen […]",
    },
    {
      locale: 'eu',
      title: 'CREUPek eta CRUEk lankidetza-hitzarmen bat sinatu dute',
      description:
        'Unibertsitateko ordezkaritza akademikoaren eta ikasleen arteko loturak estutzen dira Tona, 2018ko urtarrilaren 30a Arratsalde honetan Carmen Romerok, CREUPeko presidenteak, eta Roberto Fernándezek, CRUEko presidenteak eta Lleidako Unibertsitateko errektoreak, lankidetza-hitzarmen bat sinatu dute Unibertsitate Publikoetako Ikasleen Ordezkarien Koordinatzailearen artean, zeinek ordezkatzen baitituzte […]',
    },
    {
      locale: 'gl',
      title: 'CREUP e CRUE asinan un convenio de cooperación',
      description:
        'Estréitanse os lazos entre a representación académica e estudantil universitaria Tona, 30 de xaneiro de 2018 Esta tarde Carmen Romero, Presidenta de CREUP, e Roberto Fernández, Presidente de CRUE e Reitor da Universitat de Lleida, asinaron un convenio de cooperación entre a Coordinadora de Representantes de Estudantes de Universidades Públicas, que representan […]',
    },
    {
      locale: 'val',
      title: 'CREUP i CRUE signen un conveni de cooperació',
      description:
        "S'estrenyen els llaços entre la representació acadèmica i estudiantil universitària Tona, 30 de gener de 2018 Esta vesprada Carmen Romero, Presidenta de CREUP, i Roberto Fernández, President de CRUE i Rector de la Universitat de Lleida, han signat un conveni de cooperació entre la Coordinadora de Representants d'Estudiants d'Universitats Públiques, que representen […]",
    },
  ],
  'creup-inaugura-el-curso-academico-20172018-2017-09': [
    {
      locale: 'en',
      title: 'CREUP opens the 2017/2018 academic year',
      description:
        'Once again, CREUP opens the 2017/2018 academic year by opening the doors of its School of Student Participation (EPE), with one of its most anticipated activities: the fourth edition of the Training Stage, from September 20 to 24. The event will bring together student representatives from the thirty-five public universities that make up CREUP […]',
    },
    {
      locale: 'ca',
      title: 'CREUP inaugura el curs acadèmic 2017/2018',
      description:
        "Un any més, CREUP inaugura el curs acadèmic 2017/2018 obrint les portes de la seva Escola de Participació Estudiantil (EPE), amb una de les seves activitats més esperades: la quarta edició de l'Stage Formatiu, durant els dies 20 a 24 de setembre. L'esdeveniment reunirà representants d'estudiants de les trenta-cinc universitats públiques que componen CREUP […]",
    },
    {
      locale: 'eu',
      title: 'CREUPek 2017/2018 ikasturtea inauguratu du',
      description:
        'Beste urte batez, CREUPek 2017/2018 ikasturtea inauguratzen du bere Ikasleen Partaidetza Eskolaren (EPE) ateak irekiz, bere jardueretako baten zain handienarekin: Prestakuntza Stagearen laugarren edizioa, irailaren 20tik 24ra. Ekitaldiak CREUP osatzen duten hogeita hamabost unibertsitate publikoetako ikasleen ordezkariak bilduko ditu […]',
    },
    {
      locale: 'gl',
      title: 'CREUP inaugura o curso académico 2017/2018',
      description:
        'Un ano máis, CREUP inaugura o curso académico 2017/2018 abrindo as portas da súa Escola de Participación Estudantil (EPE), cunha das súas actividades máis esperadas: a cuarta edición do Stage Formativo, durante os días 20 a 24 de setembro. O evento reunirá representantes de estudantes das trinta e cinco universidades públicas que compoñen CREUP […]',
    },
    {
      locale: 'val',
      title: 'CREUP inaugura el curs acadèmic 2017/2018',
      description:
        "Un any més, CREUP inaugura el curs acadèmic 2017/2018 obrint les portes de la seua Escola de Participació Estudiantil (EPE), amb una de les seues activitats més esperades: la quarta edició de l'Stage Formatiu, durant els dies 20 a 24 de setembre. L'esdeveniment reunirà representants d'estudiants de les trenta-cinc universitats públiques que componen CREUP […]",
    },
  ],
  'i-congreso-la-universidad-del-manana-2017-04': [
    {
      locale: 'en',
      title: '1st Congress "The University of Tomorrow"',
      description:
        'The 1st Congress "The University of Tomorrow" will take place at the Universidad Politécnica de Madrid on April 20 and 21, 2017, and is the first Congress held jointly by the Coordinator of Student Representatives of Public Universities (CREUP) and the Conference of Rectors of the Universities of Spain (CRUE). Throughout […]',
    },
    {
      locale: 'ca',
      title: 'I Congrés «La Universitat del Demà»',
      description:
        "El I Congrés «La Universitat del Demà» tindrà lloc a la Universidad Politécnica de Madrid el 20 i 21 d'abril de 2017, és el primer Congrés celebrat conjuntament entre la Coordinadora de Representants d'Estudiants de les Universitats Públiques (CREUP) i la Conferència de Rectors de les Universitats d'Espanya (CRUE). Al llarg […]",
    },
    {
      locale: 'eu',
      title: 'I. Kongresua «Biharko Unibertsitatea»',
      description:
        '«Biharko Unibertsitatea» I. Kongresua Madrilgo Universidad Politécnica de Madriden egingo da 2017ko apirilaren 20an eta 21ean, eta Unibertsitate Publikoetako Ikasleen Ordezkarien Koordinatzaileak (CREUP) eta Espainiako Unibertsitateetako Errektoreen Konferentziak (CRUE) elkarrekin antolatutako lehen Kongresua da. Zehar […]',
    },
    {
      locale: 'gl',
      title: 'I Congreso «A Universidade do Mañá»',
      description:
        'O I Congreso «A Universidade do Mañá» terá lugar na Universidad Politécnica de Madrid o 20 e 21 de abril de 2017, é o primeiro Congreso celebrado conxuntamente entre a Coordinadora de Representantes de Estudantes das Universidades Públicas (CREUP) e a Conferencia de Reitores das Universidades de España (CRUE). Ao longo […]',
    },
    {
      locale: 'val',
      title: 'I Congrés «La Universitat del Demà»',
      description:
        "El I Congrés «La Universitat del Demà» tindrà lloc en la Universidad Politécnica de Madrid el 20 i 21 d'abril de 2017, és el primer Congrés celebrat conjuntament entre la Coordinadora de Representants d'Estudiants de les Universitats Públiques (CREUP) i la Conferència de Rectors de les Universitats d'Espanya (CRUE). Al llarg […]",
    },
  ],
  'gorka-martin-nuevo-presidente-de-creup-2016-06': [
    {
      locale: 'en',
      title: 'Gorka Martín, new president of CREUP',
      description:
        "Gorka Martín Terrón takes office as President of the Coordinating Body of Student Representatives of Public Universities (CREUP) after the 45 days set out in its statutes. The election took place during CREUP's 56th (LVI) Ordinary General Assembly, held at the University of Castilla-La Mancha this past May […]",
    },
    {
      locale: 'ca',
      title: 'Gorka Martín, nou president de CREUP',
      description:
        "Gorka Martín Terrón pren possessió del seu càrrec com a President de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) després dels 45 dies establerts pels seus estatuts. L'elecció va tenir lloc durant la LVI Assemblea General Ordinària de CREUP, celebrada a la Universitat de Castilla-La Mancha el passat mes de maig […]",
    },
    {
      locale: 'eu',
      title: 'Gorka Martín, CREUPeko presidente berria',
      description:
        'Gorka Martín Terrónek Unibertsitate Publikoetako Ikasle Ordezkarien Koordinakundeko (CREUP) Presidente kargua hartu du, estatutuetan ezarritako 45 egunen ondoren. Hauteskundea CREUPeko LVI. Ohiko Batzar Nagusian egin zen, joan den maiatzean Castilla-La Manchako Unibertsitatean ospatua […]',
    },
    {
      locale: 'gl',
      title: 'Gorka Martín, novo presidente de CREUP',
      description:
        'Gorka Martín Terrón toma posesión do seu cargo como Presidente da Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) tras os 45 días establecidos polos seus estatutos. A elección tivo lugar durante a LVI Asemblea Xeral Ordinaria de CREUP, celebrada na Universidade de Castilla-La Mancha o pasado mes de maio […]',
    },
    {
      locale: 'val',
      title: 'Gorka Martín, nou president de CREUP',
      description:
        "Gorka Martín Terrón pren possessió del seu càrrec com a President de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) després dels 45 dies establits pels seus estatuts. L'elecció va tindre lloc durant la LVI Assemblea General Ordinària de CREUP, celebrada en la Universitat de Castilla-La Mancha el passat mes de maig […]",
    },
  ],
  'creup-traslada-a-la-defensora-del-pueblo-los-problemas-del-s-2016-06': [
    {
      locale: 'en',
      title: 'CREUP brings the problems of the scholarship and aid system to the Ombudsman',
      description:
        'This morning CREUP met with the Ombudsman, Soledad Becerril, following the letter sent by the student organisation this past 4 June requesting an investigation into the system of scholarships and study aid. The meeting, which took place at the headquarters of the […]',
    },
    {
      locale: 'ca',
      title:
        'CREUP trasllada a la Defensora del Poble els problemes del Sistema de Beques i ajudes',
      description:
        "Aquest matí CREUP s'ha reunit amb la Defensora del Poble, Soledad Becerril, després de la carta tramesa per l'Organització estudiantil el passat 4 de juny en què sol·licitava una investigació sobre el sistema de beques i ajudes a l'estudi. A la reunió, que ha tingut lloc a la seu de la […]",
    },
    {
      locale: 'eu',
      title:
        'CREUPek Herriaren Defendatzaileari Beka eta laguntzen Sistemaren arazoak helarazi dizkio',
      description:
        'Gaur goizean CREUP Herriaren Defendatzailearekin, Soledad Becerrilekin, bildu da, Ikasle erakundeak joan den ekainaren 4an bidalitako gutunaren ondoren, zeinetan beken eta ikasketa-laguntzen sistemari buruzko ikerketa eskatzen baitzen. Bilera, […]aren egoitzan egin dena, […]',
    },
    {
      locale: 'gl',
      title: 'CREUP trasládalle á Defensora do Pobo os problemas do Sistema de Bolsas e axudas',
      description:
        'Esta mañá CREUP reuniuse coa Defensora do Pobo, Soledad Becerril, tras a carta remitida pola Organización estudantil o pasado 4 de xuño na que solicitaba unha investigación sobre o sistema de bolsas e axudas ao estudo. Á reunión, que tivo lugar na sede da […]',
    },
    {
      locale: 'val',
      title:
        'CREUP trasllada a la Defensora del Poble els problemes del Sistema de Beques i ajudes',
      description:
        "Hui al matí CREUP s'ha reunit amb la Defensora del Poble, Soledad Becerril, després de la carta tramesa per l'Organització estudiantil el passat 4 de juny en què sol·licitava una investigació sobre el sistema de beques i ajudes a l'estudi. A la reunió, que ha tingut lloc en la seu de la […]",
    },
  ],
  'creup-clausura-su-lvi-asamblea-general-exigiendo-un-sistema-2015-11': [
    {
      locale: 'en',
      title: 'CREUP closes its 56th (LVI) General Assembly demanding a fee-free university system',
      description:
        'More than 70 university representatives from 30 student organisations gathered from Thursday at the University of Salamanca Salamanca, 30 November 2015 The Coordinating Body of Student Representatives of Public Universities closed its 55th (LV) General Assembly this Sunday, held since Thursday the 26th at the University of […]',
    },
    {
      locale: 'ca',
      title:
        'CREUP clausura la seva LVI Assemblea General exigint un sistema universitari lliure de taxes',
      description:
        "Més de 70 representants universitaris de 30 organitzacions estudiantils es van reunir des de dijous a la Universitat de Salamanca Salamanca, 30 de novembre de 2015 La Coordinadora de Representants d'Estudiants d'Universitats Públiques ha clausurat aquest diumenge la seva LV Assemblea General que s'ha celebrat des de dijous 26 a la Universitat de […]",
    },
    {
      locale: 'eu',
      title:
        'CREUPek bere LVI. Batzar Nagusia amaitu du tasarik gabeko unibertsitate-sistema bat exijituz',
      description:
        '30 ikasle-erakundetako 70 unibertsitate-ordezkari baino gehiago bildu ziren ostegunetik Salamancako Unibertsitatean Salamanca, 2015eko azaroaren 30a Unibertsitate Publikoetako Ikasle Ordezkarien Koordinakundeak igande honetan amaitu du bere LV. Batzar Nagusia, ostegun 26tik aurrera […]ko Unibertsitatean ospatu dena […]',
    },
    {
      locale: 'gl',
      title:
        'CREUP clausura a súa LVI Asemblea Xeral esixindo un sistema universitario libre de taxas',
      description:
        'Máis de 70 representantes universitarios de 30 organizacións estudantís déronse cita desde o xoves na Universidade de Salamanca Salamanca, 30 de novembro de 2015 A Coordinadora de Representantes de Estudantes de Universidades Públicas clausurou este domingo a súa LV Asemblea Xeral que se celebrou desde o xoves 26 na Universidade de […]',
    },
    {
      locale: 'val',
      title:
        'CREUP clausura la seua LVI Assemblea General exigint un sistema universitari lliure de taxes',
      description:
        "Més de 70 representants universitaris de 30 organitzacions estudiantils es van reunir des de dijous en la Universitat de Salamanca Salamanca, 30 de novembre de 2015 La Coordinadora de Representants d'Estudiants d'Universitats Públiques ha clausurat este diumenge la seua LV Assemblea General que s'ha celebrat des de dijous 26 en la Universitat de […]",
    },
  ],
  'creup-se-posiciona-en-contra-de-la-ley-universitaria-para-an-2026-02': [
    {
      locale: 'en',
      title: 'CREUP takes a stance against the University Law for Andalusia (LUPA)',
      description:
        'At the Coordinator of Student Representatives of Public Universities (CREUP), we express our firm rejection of the University Law for Andalusia (LUPA) being approved today in the Andalusian Parliament, a piece of legislation that directly affects the present and future of university students.',
    },
    {
      locale: 'ca',
      title: 'CREUP es posiciona en contra de la llei universitària per a Andalusia (LUPA)',
      description:
        "Des de la Coordinadora de Representants d'Estudiants de les Universitats Públiques (CREUP) manifestem el nostre ferm rebuig a la Llei Universitària per a Andalusia (LUPA) que s'aprova avui al Parlament andalús, una norma que afecta directament el present i el futur de l'estudiantat universitari.",
    },
    {
      locale: 'eu',
      title: 'CREUP Andaluziarako unibertsitate-legearen (LUPA) aurka kokatzen da',
      description:
        'Unibertsitate Publikoetako Ikasleen Ordezkarien Koordinatzailetik (CREUP) gure gaitzespen irmoa adierazten dugu gaur Andaluziako Parlamentuan onartzen den Andaluziarako Unibertsitate Legearen (LUPA) aurrean, unibertsitateko ikasleen orainari eta etorkizunari zuzenean eragiten dion arau bat.',
    },
    {
      locale: 'gl',
      title: 'CREUP posiciónase en contra da lei universitaria para Andalucía (LUPA)',
      description:
        'Desde a Coordinadora de Representantes de Estudantes das Universidades Públicas (CREUP) manifestamos o noso firme rexeitamento á Lei Universitaria para Andalucía (LUPA) que se aproba hoxe no Parlamento andaluz, unha norma que afecta directamente o presente e o futuro do estudantado universitario.',
    },
    {
      locale: 'val',
      title: 'CREUP es posiciona en contra de la llei universitària per a Andalusia (LUPA)',
      description:
        "Des de la Coordinadora de Representants d'Estudiants de les Universitats Públiques (CREUP) manifestem el nostre ferm rebuig a la Llei Universitària per a Andalusia (LUPA) que s'aprova hui en el Parlament andalús, una norma que afecta directament el present i el futur de l'estudiantat universitari.",
    },
  ],
  'comunicado-de-creup-ante-la-intervencion-militar-en-la-unive-2026-01': [
    {
      locale: 'en',
      title: 'CREUP statement on the military intervention at Birzeit University',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP) expresses its firm condemnation of the military intervention that took place on 6 January at the Palestinian University of Birzeit, in the West Bank, during academic activity, and which, according to available information, left at least eleven students injured.',
    },
    {
      locale: 'ca',
      title: 'Comunicat de CREUP davant la intervenció militar a la Universitat de Birzeit',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) expressa la seva ferma condemna davant la intervenció militar ocorreguda el passat 6 de gener a la Universitat palestina de Birzeit, a Cisjordània, durant el desenvolupament de l'activitat acadèmica, i que, segons la informació disponible, va deixar almenys onze estudiants ferits.",
    },
    {
      locale: 'eu',
      title: 'CREUPen komunikatua Birzeit Unibertsitateko esku-hartze militarraren aurrean',
      description:
        'Unibertsitate Publikoetako Ikasleen Ordezkarien Koordinatzaileak (CREUP) bere gaitzespen irmoa adierazten du urtarrilaren 6an Zisjordaniako Birzeit Unibertsitate palestinarrean jarduera akademikoa garatzen ari zela gertatu zen esku-hartze militarraren aurrean, eta, eskuragarri dagoen informazioaren arabera, gutxienez hamaika ikasle zauritu zituen.',
    },
    {
      locale: 'gl',
      title: 'Comunicado de CREUP ante a intervención militar na Universidade de Birzeit',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) expresa a súa firme condena ante a intervención militar ocorrida o pasado 6 de xaneiro na Universidade palestina de Birzeit, en Cisxordania, durante o desenvolvemento da actividade académica, e que, segundo a información dispoñible, deixou polo menos once estudantes feridos.',
    },
    {
      locale: 'val',
      title: 'Comunicat de CREUP davant la intervenció militar en la Universitat de Birzeit',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) expressa la seua ferma condemna davant la intervenció militar ocorreguda el passat 6 de gener en la Universitat palestina de Birzeit, a Cisjordània, durant el desenvolupament de l'activitat acadèmica, i que, segons la informació disponible, va deixar almenys onze estudiants ferits.",
    },
  ],
  'comunicado-de-creup-acerca-de-las-manifestaciones-de-las-uni-2025-11': [
    {
      locale: 'en',
      title: "CREUP statement on the demonstrations at Madrid's public universities",
      description:
        'At CREUP we want to express our firm support and solidarity with the university community of the six Madrid public universities that called the strike on 26 and 27 November 2025.',
    },
    {
      locale: 'ca',
      title:
        'Comunicat de CREUP sobre les manifestacions de les universitats públiques madrilenyes',
      description:
        'Des de CREUP volem mostrar el nostre ferm suport i solidaritat a la comunitat universitària de les sis universitats públiques madrilenyes convocants de la vaga del 26 i 27 de novembre de 2025.',
    },
    {
      locale: 'eu',
      title: 'CREUPen komunikatua Madrilgo unibertsitate publikoetako manifestazioei buruz',
      description:
        'CREUPetik gure sostengu eta elkartasun irmoa adierazi nahi diegu 2025eko azaroaren 26ko eta 27ko greba deitu duten Madrilgo sei unibertsitate publikoetako unibertsitate-komunitateari.',
    },
    {
      locale: 'gl',
      title: 'Comunicado de CREUP sobre as manifestacións das universidades públicas madrileñas',
      description:
        'Desde CREUP queremos amosar o noso firme apoio e solidariedade á comunidade universitaria das seis universidades públicas madrileñas convocantes da folga do 26 e 27 de novembro de 2025.',
    },
    {
      locale: 'val',
      title:
        'Comunicat de CREUP sobre les manifestacions de les universitats públiques madrilenyes',
      description:
        'Des de CREUP volem mostrar el nostre ferm suport i solidaritat a la comunitat universitària de les sis universitats públiques madrilenyes convocants de la vaga del 26 i 27 de novembre de 2025.',
    },
  ],
  'comunicado-de-creup-sobre-el-veto-a-nuevos-grados-en-univers-2025-07': [
    {
      locale: 'en',
      title:
        'CREUP statement on the ban on new degrees at Andalusian public universities in favour of private ones',
      description:
        "From the Coordinator of Student Representatives of Public Universities (CREUP), we express our disagreement with the policy being pursued by the Andalusian government regarding Andalusia's public universities.",
    },
    {
      locale: 'ca',
      title:
        'Comunicat de CREUP sobre el veto a nous graus a les universitats públiques andaluses en favor de les privades',
      description:
        "Des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) mostrem la nostra disconformitat amb la política que està duent a terme el govern andalús, en relació amb les universitats públiques d'Andalusia.",
    },
    {
      locale: 'eu',
      title:
        'CREUPen adierazpena Andaluziako unibertsitate publikoetan gradu berriei jarritako betoaz, pribatuen mesedetan',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzailetik (CREUP) Andaluziako gobernuak Andaluziako unibertsitate publikoei dagokienez gauzatzen ari den politikarekiko gure desadostasuna adierazten dugu.',
    },
    {
      locale: 'gl',
      title:
        'Comunicado de CREUP sobre o veto a novos graos nas universidades públicas andaluzas en favor das privadas',
      description:
        'Desde a Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) amosamos a nosa desconformidade coa política que está a levar a cabo o goberno andaluz, en relación coas universidades públicas de Andalucía.',
    },
    {
      locale: 'val',
      title:
        'Comunicat de CREUP sobre el veto a nous graus en les universitats públiques andaluses en favor de les privades',
      description:
        "Des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) mostrem la nostra disconformitat amb la política que està duent a terme el govern andalús, en relació amb les universitats públiques d'Andalusia.",
    },
  ],
  'comunicado-de-repulsa-a-las-agresiones-contra-las-protestas-2024-06': [
    {
      locale: 'en',
      title: 'Statement condemning the assaults on student protests at the University of Seville',
      description:
        'This attitude on the part of the State security forces is unacceptable, especially considering that the Governing Team has not established safe action guidelines for this situation.',
    },
    {
      locale: 'ca',
      title:
        'Comunicat de repulsa a les agressions contra les protestes estudiantils de la Universitat de Sevilla',
      description:
        "Aquesta actitud per part de les forces de seguretat de l'Estat és inadmissible, especialment tenint en compte que l'Equip de Govern no ha establert pautes d'actuació segures per a aquesta situació.",
    },
    {
      locale: 'eu',
      title: 'Sevillako Unibertsitateko ikasleen protesten aurkako erasoak gaitzesteko adierazpena',
      description:
        'Estatuko segurtasun indarren jarrera hau onartezina da, batez ere kontuan hartuta Gobernu Taldeak ez dituela egoera honetarako jarduketa pauta seguruak ezarri.',
    },
    {
      locale: 'gl',
      title:
        'Comunicado de repulsa ás agresións contra as protestas estudantís da Universidade de Sevilla',
      description:
        'Esta actitude por parte das forzas de seguridade do Estado é inadmisible, especialmente tendo en conta que o Equipo de Goberno non estableceu pautas de actuación seguras para esta situación.',
    },
    {
      locale: 'val',
      title:
        'Comunicat de repulsa a les agressions contra les protestes estudiantils de la Universitat de Sevilla',
      description:
        "Esta actitud per part de les forces de seguretat de l'Estat és inadmissible, especialment tenint en compte que l'Equip de Govern no ha establit pautes d'actuació segures per a esta situació.",
    },
  ],
  'comunicado-de-repulsa-al-acto-de-violencia-machista-vivido-e-2022-10': [
    {
      locale: 'en',
      title:
        'Statement condemning the act of sexist violence experienced at the Elías Ahúja Hall of Residence',
      description:
        'It is essential that universities have protocols and plans for awareness-raising, prevention and response, especially ones that attend to, protect and guarantee the safety of victims. The University must act forcefully against this retrograde and misogynistic conduct, and not look the other way.',
    },
    {
      locale: 'ca',
      title:
        "Comunicat de repulsa a l'acte de violència masclista viscut al Col·legi Major Elías Ahúja",
      description:
        "És fonamental l'existència a les universitats de protocols i plans de sensibilització, prevenció i actuació, especialment que atenguin, protegeixin i garanteixin la seguretat de les víctimes. La Universitat ha d'intervenir amb contundència davant aquestes conductes, retrògrades i misògines, i no mirar cap a una altra banda.",
    },
    {
      locale: 'eu',
      title:
        'Elías Ahúja Egoitza Nagusian bizi izandako emakumeen aurkako indarkeria ekintza gaitzesteko adierazpena',
      description:
        'Funtsezkoa da unibertsitateetan sentsibilizazio, prebentzio eta jarduketa protokoloak eta planak egotea, batez ere biktimak artatu, babestu eta haien segurtasuna bermatzen dutenak. Unibertsitateak irmotasunez esku hartu behar du jokabide atzerakoi eta misogino hauen aurrean, eta ez beste alde batera begiratu.',
    },
    {
      locale: 'gl',
      title:
        'Comunicado de repulsa ao acto de violencia machista vivido no Colexio Maior Elías Ahúja',
      description:
        'É fundamental a existencia nas universidades de protocolos e plans de sensibilización, prevención e actuación, especialmente que atendan, protexan e garantan a seguridade das vítimas. A Universidade debe intervir con contundencia ante estas condutas, retrógradas e misóxinas, e non mirar cara a outro lado.',
    },
    {
      locale: 'val',
      title:
        "Comunicat de repulsa a l'acte de violència masclista viscut en el Col·legi Major Elías Ahúja",
      description:
        "És fonamental l'existència en les universitats de protocols i plans de sensibilització, prevenció i actuació, especialment que atenguen, protegisquen i garantisquen la seguretat de les víctimes. La Universitat ha d'intervindre amb contundència davant estes conductes, retrògrades i misògines, i no mirar cap a un altre costat.",
    },
  ],
  'manifiesto-por-la-universidad-publica-2021-11': [
    {
      locale: 'en',
      title: 'Manifesto for the public university',
      description:
        'University students have announced mobilisations in various Spanish cities to protest against the amendments tabled by Esquerra Republicana, PSOE and Unidas Podemos to the University Coexistence Act and against the proposals put forward in the draft Organic Act of the University System.',
    },
    {
      locale: 'ca',
      title: 'Manifest per la universitat pública',
      description:
        "L'estudiantat universitari ha anunciat mobilitzacions en diferents ciutats espanyoles com a protesta davant les esmenes presentades per Esquerra Republicana, PSOE i Unidas Podemos a la Llei de Convivència Universitària i contra les propostes plantejades en el projecte de Llei Orgànica del Sistema Universitari.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitate publikoaren aldeko manifestua',
      description:
        'Unibertsitateko ikasleek mobilizazioak iragarri dituzte Espainiako hainbat hiritan, Esquerra Republicanak, PSOEk eta Unidas Podemosek Unibertsitate Bizikidetzaren Legeari aurkeztutako zuzenketen aurka eta Unibertsitate Sistemaren Lege Organikoaren proiektuan planteatutako proposamenen aurka protesta egiteko.',
    },
    {
      locale: 'gl',
      title: 'Manifesto pola universidade pública',
      description:
        'O estudantado universitario anunciou mobilizacións en distintas cidades españolas como protesta ante as emendas presentadas por Esquerra Republicana, PSOE e Unidas Podemos á Lei de Convivencia Universitaria e contra as propostas formuladas no proxecto de Lei Orgánica do Sistema Universitario.',
    },
    {
      locale: 'val',
      title: 'Manifest per la universitat pública',
      description:
        "L'estudiantat universitari ha anunciat mobilitzacions en distintes ciutats espanyoles com a protesta davant les esmenes presentades per Esquerra Republicana, PSOE i Unidas Podemos a la Llei de Convivència Universitària i contra les propostes plantejades en el projecte de Llei Orgànica del Sistema Universitari.",
    },
  ],
  'crue-creup-y-ceune-rechazan-las-enmiendas-pactadas-por-psoe-2021-10': [
    {
      locale: 'en',
      title:
        'CRUE, CREUP and CEUNE reject the amendments agreed by PSOE, Unidas Podemos and ERC to the draft University Coexistence Act',
      description:
        'The university community wishes to convey its displeasure to the political forces for ignoring its proposals. These amendments must be modified or withdrawn so that the Act truly distances itself from the 1954 disciplinary regime to which the Spanish University System is still subject.',
    },
    {
      locale: 'ca',
      title:
        'CRUE, CREUP i CEUNE rebutgen les esmenes pactades per PSOE, Unidas Podemos i ERC al projecte de Llei de Convivència Universitària',
      description:
        "La comunitat universitària vol traslladar el seu malestar a les forces polítiques per desoir les seves propostes. Aquestes esmenes s'han de modificar o retirar perquè la Llei s'allunyi veritablement del Règim Sancionador de 1954 al qual encara està subjecte el Sistema Universitari Espanyol.",
    },
    {
      locale: 'eu',
      title:
        'CRUE, CREUP eta CEUNEk PSOE, Unidas Podemos eta ERCk Unibertsitate Bizikidetzaren Legearen proiektuari adostutako zuzenketak baztertzen dituzte',
      description:
        'Unibertsitate komunitateak bere kezka helarazi nahi die indar politikoei, bere proposamenak entzungor egiteagatik. Zuzenketa horiek aldatu edo kendu behar dira, Legea benetan urrun dadin Espainiako Unibertsitate Sistemak oraindik lotuta duen 1954ko Zigor Erregimenetik.',
    },
    {
      locale: 'gl',
      title:
        'CRUE, CREUP e CEUNE rexeitan as emendas pactadas por PSOE, Unidas Podemos e ERC ao proxecto de Lei de Convivencia Universitaria',
      description:
        'A comunidade universitaria quere trasladar o seu malestar ás forzas políticas por desoír as súas propostas. Estas emendas deben ser modificadas ou retiradas para que a Lei se distancie verdadeiramente do Réxime Sancionador de 1954 ao que aínda está suxeito o Sistema Universitario Español.',
    },
    {
      locale: 'val',
      title:
        'CRUE, CREUP i CEUNE rebutgen les esmenes pactades per PSOE, Unidas Podemos i ERC al projecte de Llei de Convivència Universitària',
      description:
        "La comunitat universitària vol traslladar el seu malestar a les forces polítiques per desoir les seues propostes. Estes esmenes s'han de modificar o retirar perquè la Llei s'allunye veritablement del Règim Sancionador de 1954 al qual encara està subjecte el Sistema Universitari Espanyol.",
    },
  ],
  'carta-abierta-sobre-la-situacion-del-estudiantado-afgano-2021-09': [
    {
      locale: 'en',
      title: 'Open letter on the situation of Afghan students',
      description:
        "We convey to the Government of Spain an urgent appeal with specific action recommendations to support Afghanistan's teaching and research staff, students and civil society actors.",
    },
    {
      locale: 'ca',
      title: "Carta oberta sobre la situació de l'estudiantat afganès",
      description:
        "Traslladem al Govern d'Espanya una crida urgent amb recomanacions específiques d'actuació per donar suport al personal docent i investigador, l'estudiantat i els agents de la societat civil de l'Afganistan.",
    },
    {
      locale: 'eu',
      title: 'Gutun irekia Afganistango ikasleen egoerari buruz',
      description:
        'Espainiako Gobernuari dei premiazkoa helarazten diogu, Afganistango irakasle eta ikertzaileei, ikasleei eta gizarte zibileko eragileei laguntzeko jarduketa gomendio zehatzekin.',
    },
    {
      locale: 'gl',
      title: 'Carta aberta sobre a situación do estudantado afgán',
      description:
        'Trasladámoslle ao Goberno de España un chamamento urxente con recomendacións específicas de actuación para apoiar o persoal docente e investigador, o estudantado e os axentes da sociedade civil de Afganistán.',
    },
    {
      locale: 'val',
      title: "Carta oberta sobre la situació de l'estudiantat afgà",
      description:
        "Traslladem al Govern d'Espanya una crida urgent amb recomanacions específiques d'actuació per a donar suport al personal docent i investigador, l'estudiantat i els agents de la societat civil de l'Afganistan.",
    },
  ],
  'en-defensa-de-la-seguridad-de-la-comunidad-universitaria-2021-01': [
    {
      locale: 'en',
      title: 'In defence of the safety of the university community',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP) and the State University Student Council (CEUNE) issue a statement in response to the declarations of 28 January 2021 by the Conference of Rectors of Spanish Universities (CRUE), expressing their indignation at them.',
    },
    {
      locale: 'ca',
      title: 'En defensa de la seguretat de la comunitat universitària',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) i el Consell d'Estudiants Universitari de l'Estat (CEUNE) llancen un comunicat en resposta a les declaracions del 28 de gener de 2021 de la Conferència de Rectors d'Universitats Espanyoles (CRUE) mostrant la seva indignació davant aquestes.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitate komunitatearen segurtasunaren alde',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak (CREUP) eta Estatuko Unibertsitateko Ikasleen Kontseiluak (CEUNE) adierazpen bat kaleratu dute, Espainiako Unibertsitateetako Errektoreen Konferentziaren (CRUE) 2021eko urtarrilaren 28ko adierazpenei erantzuteko, haien aurrean haserrea agertuz.',
    },
    {
      locale: 'gl',
      title: 'En defensa da seguridade da comunidade universitaria',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) e o Consello de Estudantes Universitario do Estado (CEUNE) lanzan un comunicado en resposta ás declaracións do 28 de xaneiro de 2021 da Conferencia de Reitores de Universidades Españolas (CRUE), amosando a súa indignación ante estas.',
    },
    {
      locale: 'val',
      title: 'En defensa de la seguretat de la comunitat universitària',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) i el Consell d'Estudiants Universitari de l'Estat (CEUNE) llancen un comunicat en resposta a les declaracions del 28 de gener de 2021 de la Conferència de Rectors d'Universitats Espanyoles (CRUE), mostrant la seua indignació davant estes.",
    },
  ],
  'estudiantes-universitarios-lanzan-sus-peticiones-para-el-com-2020-08-2': [
    {
      locale: 'en',
      title: 'University students put forward their requests for the start of the academic year',
      description:
        'We believe teaching methodologies should be made more flexible to adapt them to the needs and circumstances of each student. Furthermore, it is necessary to ensure access to resources in order to eliminate socioeconomic gaps in higher education.',
    },
    {
      locale: 'ca',
      title: "Els estudiants universitaris llancen les seves peticions per a l'inici de curs",
      description:
        "Considerem que s'han de flexibilitzar les metodologies docents per adaptar-les a les necessitats i situacions de cada estudiant. A més, cal assegurar l'accés als mitjans per eliminar les bretxes socioeconòmiques en l'educació superior.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitateko ikasleek ikasturte hasierarako eskaerak aurkezten dituzte',
      description:
        'Irakaskuntza metodologiak malgutu behar direla uste dugu, ikasle bakoitzaren beharrei eta egoerei egokitzeko. Gainera, beharrezkoa da baliabideetarako sarbidea bermatzea, goi mailako hezkuntzako arrakala sozioekonomikoak ezabatzeko.',
    },
    {
      locale: 'gl',
      title: 'Os estudantes universitarios lanzan as súas peticións para o comezo de curso',
      description:
        'Consideramos que se deben flexibilizar as metodoloxías docentes para adaptalas ás necesidades e situacións de cada estudante. Ademais, é necesario asegurar o acceso aos medios para eliminar as fendas socioeconómicas na educación superior.',
    },
    {
      locale: 'val',
      title: "Els estudiants universitaris llancen les seues peticions per a l'inici de curs",
      description:
        "Considerem que s'han de flexibilitzar les metodologies docents per a adaptar-les a les necessitats i situacions de cada estudiant. A més, cal assegurar l'accés als mitjans per a eliminar les bretxes socioeconòmiques en l'educació superior.",
    },
  ],
  'malestar-del-estudiantado-ante-las-declaraciones-realizadas-2020-05': [
    {
      locale: 'en',
      title: "Students' displeasure at the declarations made",
      description:
        'We consider it appropriate to remind him of the delicate situation students are going through owing to the current circumstances. Neither the tone nor the substance of the message was appropriate, portraying our collective as a superficial actor and underestimating an atypical, extraordinary and damaging situation.',
    },
    {
      locale: 'ca',
      title: "Malestar de l'estudiantat davant les declaracions realitzades",
      description:
        "Considerem pertinent recordar-li la delicada situació que travessa l'estudiantat a causa de la situació actual. Ni el to ni el fons del missatge van ser els apropiats, mostrant el nostre col·lectiu com un agent superficial i infravalorant una situació atípica, extraordinària i perjudicial.",
    },
    {
      locale: 'eu',
      title: 'Ikasleen kezka egindako adierazpenen aurrean',
      description:
        'Egoki ikusten dugu gogoraraztea ikasleria zein egoera delikatutik igarotzen ari den egungo egoeraren ondorioz. Ez mezuaren tonua ez edukia ez ziren egokiak izan, gure kolektiboa eragile azalekoa balitz bezala azalduz eta egoera atipiko, ezohiko eta kaltegarri bat gutxietsiz.',
    },
    {
      locale: 'gl',
      title: 'Malestar do estudantado ante as declaracións realizadas',
      description:
        'Consideramos pertinente lembrarlle a delicada situación que está a atravesar o estudantado debido á situación actual. Nin o ton nin o fondo da mensaxe foron os apropiados, mostrando o noso colectivo como un axente superficial e infravalorando unha situación atípica, extraordinaria e prexudicial.',
    },
    {
      locale: 'val',
      title: "Malestar de l'estudiantat davant les declaracions realitzades",
      description:
        "Considerem pertinent recordar-li la delicada situació que travessa l'estudiantat a causa de la situació actual. Ni el to ni el fons del missatge van ser els apropiats, mostrant el nostre col·lectiu com un agent superficial i infravalorant una situació atípica, extraordinària i perjudicial.",
    },
  ],
  'el-ministro-de-universidades-se-reune-con-los-representantes-2020-04': [
    {
      locale: 'en',
      title: 'The Minister of Universities meets with student representatives',
      description:
        'The Minister has repeatedly highlighted the role of students in the situation we are facing and the need for university institutions to take us into account.',
    },
    {
      locale: 'ca',
      title: "El ministre d'universitats es reuneix amb els representants d'estudiants",
      description:
        "El ministre ha posat en valor en diverses ocasions el paper de l'estudiantat davant la situació en què ens trobem i la necessitat que les institucions universitàries ens tinguin en compte.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitate ministroa ikasleen ordezkariekin biltzen da',
      description:
        'Ministroak behin baino gehiagotan azpimarratu du ikasleen eginkizuna gauden egoeraren aurrean eta unibertsitate erakundeek gu kontuan hartzeko beharra.',
    },
    {
      locale: 'gl',
      title: 'O ministro de universidades reúnese cos representantes de estudantes',
      description:
        'O ministro puxo en valor en varias ocasións o papel do estudantado ante a situación na que nos atopamos e a necesidade de que as institucións universitarias nos teñan en conta.',
    },
    {
      locale: 'val',
      title: "El ministre d'universitats es reunix amb els representants d'estudiants",
      description:
        "El ministre ha posat en valor en diverses ocasions el paper de l'estudiantat davant la situació en què ens trobem i la necessitat que les institucions universitàries ens tinguen en compte.",
    },
  ],
  'recogida-de-pertenencias-de-estudiantes-2020-04': [
    {
      locale: 'en',
      title: "Collection of students' belongings",
      description:
        'COVID-19 has led the country into a state of alert in which, affected, many students returned to their family homes after it was declared. Initially, the estimated duration of the situation was two weeks, but it has been extended and most Spanish universities have chosen to end the academic year remotely.',
    },
    {
      locale: 'ca',
      title: "Recollida de pertinences d'estudiants",
      description:
        "La COVID-19 ha portat el país a un estat d'alerta en què, afectats, molts i moltes estudiants van tornar a les seves residències familiars després de la seva proclamació. En un inici, la durada estimada de la situació era de dues setmanes, però aquesta s'ha anat allargant i la majoria d'universitats espanyoles han optat per finalitzar el curs acadèmic de manera no presencial.",
    },
    {
      locale: 'eu',
      title: 'Ikasleen gauzak jasotzea',
      description:
        'COVID-19ak herrialdea alerta egoera batera eraman du, eta, kaltetuta, ikasle askok beren familia-egoitzetara itzuli ziren hura aldarrikatu ondoren. Hasieran, egoeraren iraupena bi astekoa izango zela aurreikusten zen, baina luzatuz joan da eta Espainiako unibertsitate gehienek ikasturtea ez-presentzialki amaitzea aukeratu dute.',
    },
    {
      locale: 'gl',
      title: 'Recollida de pertenzas de estudantes',
      description:
        'A COVID-19 levou o país a un estado de alerta no que, afectados, moitos e moitas estudantes volveron ás súas residencias familiares tras a súa proclamación. Nun inicio, a duración estimada da situación era de dúas semanas, pero esta foise alongando e a maioría de universidades españolas optaron por finalizar o curso académico de maneira non presencial.',
    },
    {
      locale: 'val',
      title: "Arreplega de pertinences d'estudiants",
      description:
        "La COVID-19 ha portat el país a un estat d'alerta en què, afectats, molts i moltes estudiants van tornar a les seues residències familiars després de la seua proclamació. En un inici, la duració estimada de la situació era de dues setmanes, però esta s'ha anat allargant i la majoria d'universitats espanyoles han optat per finalitzar el curs acadèmic de manera no presencial.",
    },
  ],
  'medidas-anunciadas-por-crue-en-el-articulo-las-universidades-2020-04': [
    {
      locale: 'en',
      title:
        'Measures announced by CRUE in the article "Universities will postpone content and reduce practical hours this year"',
      description:
        'This Wednesday, 1 April 2020, CRUE - Conference of Rectors of Spanish Universities - set out in an article in El País the courses of action being considered in response to the health crisis that has affected the Spanish University System.',
    },
    {
      locale: 'ca',
      title:
        'Mesures anunciades per CRUE en l\'article "Les universitats ajornaran matèria i reduiran les hores de pràctiques aquest curs"',
      description:
        "Aquest dimecres 1 d'abril de 2020, Crue - Conferència de Rectors d'Universitats Espanyoles - ha expressat en un article d'El País les línies d'actuació que s'estan plantejant davant la crisi sanitària que ha afectat el Sistema Universitari Espanyol.",
    },
    {
      locale: 'eu',
      title:
        'CRUEk "Unibertsitateek gaia atzeratu eta praktika orduak murriztuko dituzte ikasturte honetan" artikuluan iragarritako neurriak',
      description:
        'Asteazken honetan, 2020ko apirilaren 1ean, CRUEk -Espainiako Unibertsitateetako Errektoreen Konferentziak- El País egunkariko artikulu batean adierazi ditu Espainiako Unibertsitate Sistemari eragin dion osasun krisiaren aurrean planteatzen ari diren jarduketa ildoak.',
    },
    {
      locale: 'gl',
      title:
        'Medidas anunciadas por CRUE no artigo "As universidades aprazarán materia e reducirán as horas de prácticas este curso"',
      description:
        'Este mércores 1 de abril de 2020, Crue - Conferencia de Reitores de Universidades Españolas - expresou nun artigo de El País as liñas de actuación que se están formulando ante a crise sanitaria que afectou o Sistema Universitario Español.',
    },
    {
      locale: 'val',
      title:
        'Mesures anunciades per CRUE en l\'article "Les universitats ajornaran matèria i reduiran les hores de pràctiques este curs"',
      description:
        "Este dimecres 1 d'abril de 2020, Crue - Conferència de Rectors d'Universitats Espanyoles - ha expressat en un article d'El País les línies d'actuació que s'estan plantejant davant la crisi sanitària que ha afectat el Sistema Universitari Espanyol.",
    },
  ],
  'creup-se-suma-al-movimiento-yomequedoencasa-2020-03': [
    {
      locale: 'en',
      title: 'CREUP joins the #IStayAtHome movement',
      description:
        "Universities have begun to establish action protocols following the suspension of in-person teaching and other activities arising from students' academic progress. For any questions or specific issues, you should contact your universities.",
    },
    {
      locale: 'ca',
      title: 'CREUP se suma al moviment #YoMeQuedoEnCasa',
      description:
        "Les universitats han començat a establir protocols d'actuació davant la suspensió de la presencialitat en la docència i altres activitats derivades del desenvolupament acadèmic de l'estudiantat. Per a qualsevol tipus de dubte o qüestió específica heu de posar-vos en contacte amb les vostres universitats.",
    },
    {
      locale: 'eu',
      title: 'CREUP #YoMeQuedoEnCasa mugimendura batzen da',
      description:
        'Unibertsitateak jarduketa protokoloak ezartzen hasi dira, irakaskuntzaren presentzialtasuna eta ikasleen garapen akademikotik eratorritako bestelako jardueren etenduraren aurrean. Edozein zalantza edo gai zehatzetarako, zuen unibertsitateekin harremanetan jarri behar zarete.',
    },
    {
      locale: 'gl',
      title: 'CREUP súmase ao movemento #YoMeQuedoEnCasa',
      description:
        'As universidades comezaron a establecer protocolos de actuación ante a suspensión da presencialidade na docencia e outras actividades derivadas do desenvolvemento académico do estudantado. Para calquera tipo de dúbida ou cuestión específica debedes poñervos en contacto coas vosas universidades.',
    },
    {
      locale: 'val',
      title: 'CREUP se suma al moviment #YoMeQuedoEnCasa',
      description:
        "Les universitats han començat a establir protocols d'actuació davant la suspensió de la presencialitat en la docència i altres activitats derivades del desenvolupament acadèmic de l'estudiantat. Per a qualsevol tipus de dubte o qüestió específica heu de posar-vos en contacte amb les vostres universitats.",
    },
  ],
  'los-representantes-de-estudiantes-del-estado-ponen-sobre-la-2020-03': [
    {
      locale: 'en',
      title:
        "The State's student representatives put forward historic student demands at the CEUNE plenary after more than a year without being convened",
      description:
        "After more than a year without being able to convene, since 9 October 2018, at the State University Student Council (CEUNE) the State's student representatives have been able to share and debate measures with the Ministry of Universities to improve the Spanish University System (SUE).",
    },
    {
      locale: 'ca',
      title:
        "Els representants d'estudiants de l'Estat posen sobre la taula reivindicacions històriques de l'estudiantat al ple del CEUNE després de més d'un any sense convocar-se",
      description:
        "Després de més d'un any sense poder convocar-se, des del 9 d'octubre de 2018, al Consell d'Estudiants Universitari de l'Estat -CEUNE-, els representants d'estudiants de l'Estat hem pogut compartir i debatre mesures amb el Ministeri d'Universitats per a la millora del Sistema Universitari Espanyol -SUE-.",
    },
    {
      locale: 'eu',
      title:
        'Estatuko ikasleen ordezkariek ikasleen aldarrikapen historikoak mahai gainean jartzen dituzte CEUNEren osoko bilkuran, urtebete baino gehiagoz deialdirik egin gabe egon ondoren',
      description:
        'Urtebete baino gehiagoz deitu ezinik egon ondoren, 2018ko urriaren 9tik, Estatuko Unibertsitateko Ikasleen Kontseiluan -CEUNE-, Estatuko ikasleen ordezkariok neurriak partekatu eta eztabaidatu ahal izan ditugu Unibertsitate Ministerioarekin, Espainiako Unibertsitate Sistema -SUE- hobetzeko.',
    },
    {
      locale: 'gl',
      title:
        'Os representantes de estudantes do Estado poñen sobre a mesa reivindicacións históricas do estudantado no pleno do CEUNE tras máis dun ano sen convocarse',
      description:
        'Tras máis dun ano sen poder convocarse, desde o 9 de outubro de 2018, no Consello de Estudantes Universitario do Estado -CEUNE-, os representantes de estudantes do Estado puidemos compartir e debater medidas co Ministerio de Universidades para a mellora do Sistema Universitario Español -SUE-.',
    },
    {
      locale: 'val',
      title:
        "Els representants d'estudiants de l'Estat posen sobre la taula reivindicacions històriques de l'estudiantat en el ple del CEUNE després de més d'un any sense convocar-se",
      description:
        "Després de més d'un any sense poder convocar-se, des del 9 d'octubre de 2018, en el Consell d'Estudiants Universitari de l'Estat -CEUNE-, els representants d'estudiants de l'Estat hem pogut compartir i debatre mesures amb el Ministeri d'Universitats per a la millora del Sistema Universitari Espanyol -SUE-.",
    },
  ],
  'carta-abierta-al-ministerio-de-ciencia-innovacion-y-universi-2019-10': [
    {
      locale: 'en',
      title: 'Open letter to the Ministry of Science, Innovation and Universities',
      description:
        'Students demand to be heard in the working group that will examine the current model of the university entrance examination.',
    },
    {
      locale: 'ca',
      title: 'Carta oberta al Ministeri de Ciència, Innovació i Universitats',
      description:
        "Els estudiants reclamen ser escoltats en el grup de treball que estudiarà el model actual de prova d'accés a la Universitat.",
    },
    {
      locale: 'eu',
      title: 'Gutun irekia Zientzia, Berrikuntza eta Unibertsitateen Ministerioari',
      description:
        'Ikasleek unibertsitatera sartzeko probaren egungo eredua aztertuko duen lan taldean entzunak izatea eskatzen dute.',
    },
    {
      locale: 'gl',
      title: 'Carta aberta ao Ministerio de Ciencia, Innovación e Universidades',
      description:
        'Os estudantes reclaman ser escoitados no grupo de traballo que estudará o modelo actual de proba de acceso á Universidade.',
    },
    {
      locale: 'val',
      title: 'Carta oberta al Ministeri de Ciència, Innovació i Universitats',
      description:
        "Els estudiants reclamen ser escoltats en el grup de treball que estudiarà el model actual de prova d'accés a la Universitat.",
    },
  ],
  'propuestas-de-cara-a-la-xiv-legislatura-2019-09': [
    {
      locale: 'en',
      title: 'Proposals for the 14th Legislature',
      description:
        'Grants, internships, fees and the disciplinary rules are the matters of greatest concern to students, and they hope to address them in the 14th Legislature.',
    },
    {
      locale: 'ca',
      title: 'Propostes de cara a la XIV Legislatura',
      description:
        'Les beques, les pràctiques, les taxes i el reglament disciplinari són els assumptes que més preocupen els estudiants i esperen poder-los abordar a la XIV Legislatura.',
    },
    {
      locale: 'eu',
      title: 'XIV. Legealdirako proposamenak',
      description:
        'Bekak, praktikak, tasak eta diziplina araudia dira ikasleak gehien kezkatzen dituzten gaiak, eta XIV. Legealdian horiek lantzea espero dute.',
    },
    {
      locale: 'gl',
      title: 'Propostas de cara á XIV Lexislatura',
      description:
        'As bolsas, as prácticas, as taxas e o regulamento disciplinario son os asuntos que máis preocupan os estudantes e esperan poder abordalos na XIV Lexislatura.',
    },
    {
      locale: 'val',
      title: 'Propostes de cara a la XIV Legislatura',
      description:
        'Les beques, les pràctiques, les taxes i el reglament disciplinari són els assumptes que més preocupen els estudiants i esperen poder abordar-los en la XIV Legislatura.',
    },
  ],
  'creup-no-solicita-una-prueba-unica-sino-una-equiparabilidad-2019-06': [
    {
      locale: 'en',
      title:
        'CREUP does not call for a single examination, but for content and format comparability in the university entrance examination',
      description:
        'From the Coordinator of Student Representatives of Public Universities, CREUP, we would like to make a clarification regarding what was stated yesterday in relation to the unification of criteria in the content and format of the university entrance examination. CREUP does not call for a single examination across the whole territory of the […]',
    },
    {
      locale: 'ca',
      title:
        "CREUP no sol·licita una prova única, sinó una equiparabilitat de contingut i forma de la prova d'accés a la Universitat",
      description:
        "Des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques, CREUP, ens agradaria fer un aclariment respecte al que es va emetre ahir en relació amb la unificació de criteris en contingut i forma de la prova d'accés a la Universitat. CREUP no sol·licita una prova única en tot el territori de l'[…]",
    },
    {
      locale: 'eu',
      title:
        'CREUPek ez du proba bakar bat eskatzen, baizik eta unibertsitatera sartzeko probaren eduki eta formaren parekagarritasuna',
      description:
        'Unibertsitate Publikoetako Ikasleen Ordezkarien Koordinakundetik, CREUP, atzo unibertsitatera sartzeko probaren eduki eta formaren irizpideak bateratzeari buruz emandakoaren inguruko argibide bat egin nahi genuke. CREUPek ez du proba bakar bat eskatzen lurralde osoan zehar [...]',
    },
    {
      locale: 'gl',
      title:
        'CREUP non solicita unha proba única, senón unha equiparabilidade de contido e forma da proba de acceso á Universidade',
      description:
        'Desde a Coordinadora de Representantes de Estudantes de Universidades Públicas, CREUP, gustaríanos facer unha aclaración respecto ao emitido onte en relación coa unificación de criterios en contido e forma da proba de acceso á Universidade. CREUP non solicita unha proba única en todo o territorio do […]',
    },
    {
      locale: 'val',
      title:
        "CREUP no sol·licita una prova única, sinó una equiparabilitat de contingut i forma de la prova d'accés a la Universitat",
      description:
        "Des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques, CREUP, ens agradaria fer un aclariment respecte al que es va emetre ahir en relació amb la unificació de criteris en contingut i forma de la prova d'accés a la Universitat. CREUP no sol·licita una prova única en tot el territori de l'[…]",
    },
  ],
  'propuesta-de-creacion-de-una-comision-mixta-en-el-congreso-s-2019-04': [
    {
      locale: 'en',
      title:
        'Proposal to create a joint committee in Congress on the regulation of academic placements',
      description:
        'Attn: Members of Congress of the 13th Legislature. I would like to begin by congratulating you on your election and thanking you for the commitment you show in offering yourselves to the service of citizens to set policies that improve the country as a whole. As president of the Coordinator of Student Representatives of Public Universities (CREUP), the association that brings together […]',
    },
    {
      locale: 'ca',
      title:
        "Proposta de creació d'una comissió mixta al Congrés sobre la regulació de les pràctiques acadèmiques",
      description:
        "A l'atenció dels diputats i diputades de la XIII Legislatura. Volia començar felicitant-los per la seva elecció i agrair-los el compromís que demostren oferint-se al servei de la ciutadania per marcar polítiques que millorin el conjunt de l'Estat. Com a president de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP), que és l'associació que aplega […]",
    },
    {
      locale: 'eu',
      title:
        'Akademia-praktiken arautzeari buruzko batzorde mistoa Kongresuan sortzeko proposamena',
      description:
        'XIII. Legegintzaldiko diputatuen arretarako. Hasteko, zuen hautaketagatik zoriondu nahi zaituztet, eta herritarren zerbitzura jartzean erakusten duzuen konpromisoa eskertu nahi dizuet, Estatu osoa hobetzen duten politikak markatzeko. Unibertsitate Publikoetako Ikasleen Ordezkarien Koordinadorako (CREUP) presidente naizen aldetik, gure herrialdeko unibertsitateko ikasleriaren ordezkaritzarik handiena biltzen duen elkartea baita […]',
    },
    {
      locale: 'gl',
      title:
        'Proposta de creación dunha comisión mixta no Congreso sobre a regulación das prácticas académicas',
      description:
        'Á atención dos deputados e deputadas da XIII Lexislatura. Quería comezar felicitándoos pola súa elección e agradecerlles o compromiso que demostran ofrecéndose ao servizo da cidadanía para marcar políticas que melloren o conxunto do Estado. Como presidente da Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP), que é a asociación que aúna […]',
    },
    {
      locale: 'val',
      title:
        "Proposta de creació d'una comissió mixta en el Congrés sobre la regulació de les pràctiques acadèmiques",
      description:
        "A l'atenció dels diputats i diputades de la XIII Legislatura. Volia començar felicitant-los per la seua elecció i agrair-los el compromís que demostren oferint-se al servici de la ciutadania per a marcar polítiques que milloren el conjunt de l'Estat. Com a president de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP), que és l'associació que reunix […]",
    },
  ],
  'creup-lamenta-el-dano-nuevamente-causado-por-los-representan-2018-09': [
    {
      locale: 'en',
      title:
        'CREUP regrets the harm once again caused by public representatives to the image of the Spanish university system',
      description:
        "Alcalá de Henares, 11 September 2018. Following the news that has emerged since yesterday questioning the way in which former minister Carmen Montón obtained her master's degree, and the press conference held today, we at the Coordinator of Student Representatives of Public Universities consider […]",
    },
    {
      locale: 'ca',
      title:
        'CREUP lamenta el mal causat novament pels representants públics a la imatge del sistema universitari espanyol',
      description:
        "Alcalá de Henares, 11 de setembre de 2018. Després de les notícies aparegudes des d'ahir en què es qüestionava la manera en què l'exministra Carmen Montón va obtenir el seu títol de màster i de la roda de premsa oferida avui, des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques valorem […]",
    },
    {
      locale: 'eu',
      title:
        'CREUPek penaz hartzen du ordezkari publikoek Espainiako unibertsitate-sistemaren irudiari berriz ere eragindako kaltea',
      description:
        'Alcalá de Henares, 2018ko irailaren 11. Atzotik agertu diren albisteen ondoren, non Carmen Montón ministro ohiak bere master-titulua nola lortu zuen zalantzan jartzen baitzen, eta gaur eskainitako prentsaurrekoaren ostean, Unibertsitate Publikoetako Ikasleen Ordezkarien Koordinadoratik […]',
    },
    {
      locale: 'gl',
      title:
        'CREUP lamenta o dano causado novamente polos representantes públicos á imaxe do sistema universitario español',
      description:
        'Alcalá de Henares, 11 de setembro de 2018. Tras as novas aparecidas desde onte nas que se cuestionaba a forma na que a exministra Carmen Montón obtivo o seu título de máster e a rolda de prensa ofrecida hoxe, desde a Coordinadora de Representantes de Estudantes de Universidades Públicas valoramos […]',
    },
    {
      locale: 'val',
      title:
        'CREUP lamenta el mal causat novament pels representants públics a la imatge del sistema universitari espanyol',
      description:
        "Alcalá de Henares, 11 de setembre de 2018. Després de les notícies aparegudes des d'ahir en què es qüestionava la manera en què l'exministra Carmen Montón va obtindre el seu títol de màster i de la roda de premsa oferida hui, des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques valorem […]",
    },
  ],
  'comunicado-creup-28j-orgullo-lgtb-2018-06': [
    {
      locale: 'en',
      title: 'CREUP statement 28 June - LGBT+ Pride',
      description:
        'We at the Coordinator of Student Representatives of Public Universities (CREUP) express our support for the LGBT+ community and join the struggle for the equality, dignity and recognition of affective-sexual diversity. Almost half a century has passed since the riots in the New York neighbourhood of Greenwich Village, where for the first time the community […]',
    },
    {
      locale: 'ca',
      title: 'Comunicat CREUP 28J - Orgull LGTB+',
      description:
        "Des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) manifestem el nostre suport cap al col·lectiu LGTB+ i ens sumem a la lluita per la igualtat, dignitat i reconeixement de la diversitat afectivosexual. Fa gairebé mig segle dels disturbis ocorreguts al barri novaiorquès de Greenwich Village, on per primera vegada la comunitat […]",
    },
    {
      locale: 'eu',
      title: 'CREUPen komunikatua ekainaren 28a - LGTB+ Harrotasuna',
      description:
        'Unibertsitate Publikoetako Ikasleen Ordezkarien Koordinadoratik (CREUP) LGTB+ kolektiboari gure babesa adierazten diogu, eta berdintasunaren, duintasunaren eta aniztasun afektibo-sexualaren aitortzaren aldeko borrokari batzen gatzaizkio. Ia mende erdia igaro da New Yorkeko Greenwich Village auzoan gertatutako istiluetatik, non lehen aldiz komunitatea […]',
    },
    {
      locale: 'gl',
      title: 'Comunicado CREUP 28X - Orgullo LGTB+',
      description:
        'Desde a Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) manifestamos o noso apoio cara ao colectivo LGTB+ e sumámonos á loita pola igualdade, dignidade e recoñecemento da diversidade afectivo-sexual. Hai case medio século dos disturbios acaecidos no barrio neoiorquino de Greenwich Village, onde por primeira vez a comunidade […]',
    },
    {
      locale: 'val',
      title: 'Comunicat CREUP 28J - Orgull LGTB+',
      description:
        "Des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) manifestem el nostre suport cap al col·lectiu LGTB+ i ens sumem a la lluita per la igualtat, dignitat i reconeixement de la diversitat afectivosexual. Fa quasi mig segle dels disturbis ocorreguts al barri novaiorqués de Greenwich Village, on per primera vegada la comunitat […]",
    },
  ],
  'creup-muestra-todo-su-apoyo-al-estudiantado-que-ha-realizado-2018-06': [
    {
      locale: 'en',
      title: 'CREUP voices its full support for the students who sat the EBAU in Extremadura',
      description:
        "At the Coordinator of Student Representatives of Public Universities (CREUP) we want to express our full support for the students affected by the situation arising from the alleged leak of EBAU exams at the University of Extremadura, as well as for that university's Student Council in its work to defend the […]",
    },
    {
      locale: 'ca',
      title: "CREUP mostra tot el seu suport a l'estudiantat que ha fet la EBAU a Extremadura",
      description:
        "Des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) volem mostrar tot el nostre suport a l'estudiantat afectat per la situació causada arran de la presumpta filtració d'exàmens de la EBAU ocorreguda a la Universitat d'Extremadura, així com al Consell d'Estudiants d'aquesta universitat en la seua tasca de defensar les […]",
    },
    {
      locale: 'eu',
      title: 'CREUPek bere babes osoa adierazi die Extremaduran EBAU egin duten ikasleei',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinakundetik (CREUP) gure babes osoa adierazi nahi diegu Extremadurako Unibertsitatean EBAUko azterketak ustez filtratu izanaren ondorioz sortutako egoerak kaltetutako ikasleei, baita unibertsitate horretako Ikasleen Kontseiluari ere, kaltetuak defendatzeko egiten duen lanagatik […]',
    },
    {
      locale: 'gl',
      title: 'A CREUP amosa todo o seu apoio ao estudantado que fixo a EBAU en Estremadura',
      description:
        'Desde a Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) queremos amosar todo o noso apoio ao estudantado afectado pola situación causada a raíz da presunta filtración de exames da EBAU ocorrida na Universidade de Estremadura, así como ao Consello de Estudantes da devandita universidade no seu labor de defender as […]',
    },
    {
      locale: 'val',
      title: "CREUP mostra tot el seu suport a l'estudiantat que ha fet la EBAU a Extremadura",
      description:
        "Des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) volem mostrar tot el nostre suport a l'estudiantat afectat per la situació causada arran de la presumpta filtració d'exàmens de la EBAU ocorreguda en la Universitat d'Extremadura, així com al Consell d'Estudiants d'esta universitat en la seua tasca de defendre les […]",
    },
  ],
  'creup-insta-a-aneca-a-revisar-el-master-de-la-urjc-2018-03': [
    {
      locale: 'en',
      title: "CREUP urges ANECA to review the URJC master's degree",
      description:
        'At CREUP we are following with intrigue and concern what happened last week with Cristina Cifuentes at the Rey Juan Carlos University (URJC). While respecting the presumption of innocence, we consider that in any case this use and image given of the public university is intolerable, and we therefore condemn everything that has happened. The university […]',
    },
    {
      locale: 'ca',
      title: 'CREUP insta ANECA a revisar el màster de la URJC',
      description:
        "Des de CREUP seguim amb intriga i preocupació el que va passar la setmana passada amb Cristina Cifuentes a la Universitat Rey Juan Carlos (URJC). Tot respectant la presumpció d'innocència, considerem que en qualsevol cas aquest ús i imatge que es dóna de la universitat pública és intolerable i per això condemnem tot el que ha passat. La universitat […]",
    },
    {
      locale: 'eu',
      title: 'CREUPek ANECA URJCko masterra berrikustera bultzatu du',
      description:
        'CREUPetik kezkaz eta jakin-minez jarraitzen ari gara joan den astean Cristina Cifuentesekin Rey Juan Carlos Unibertsitatean (URJC) gertatutakoa. Errugabetasun presuntzioa errespetatuz, uste dugu edonola ere unibertsitate publikoaz ematen den erabilera eta irudia hori onartezina dela, eta horregatik gertatutako guztia gaitzesten dugu. Unibertsitateak […]',
    },
    {
      locale: 'gl',
      title: 'A CREUP insta a ANECA a revisar o máster da URJC',
      description:
        'Desde CREUP seguimos con intriga e preocupación o ocorrido durante a pasada semana con Cristina Cifuentes na Universidade Rey Juan Carlos (URJC). Respectando a presunción de inocencia, consideramos que en calquera caso este uso e imaxe que se dá da universidade pública é intolerable e por iso condenamos todo o ocorrido. A universidade […]',
    },
    {
      locale: 'val',
      title: 'CREUP insta ANECA a revisar el màster de la URJC',
      description:
        "Des de CREUP seguim amb intriga i preocupació el que va passar la setmana passada amb Cristina Cifuentes en la Universitat Rey Juan Carlos (URJC). Tot respectant la presumpció d'innocència, considerem que en qualsevol cas este ús i imatge que es dóna de la universitat pública és intolerable i per això condemnem tot el que ha passat. La universitat […]",
    },
  ],
  'comunicado-sobre-el-8m-2018-03': [
    {
      locale: 'en',
      title: 'Statement on 8M',
      description:
        'CREUP, like students in general, is aware of the inequality that occurs in Spain across every sector, especially in the workplace, with a worrying pay gap, a high lack of women in management positions and the growing number of sexist attacks. For all this, we consider that this strike called […]',
    },
    {
      locale: 'ca',
      title: 'Comunicat sobre el 8M',
      description:
        "CREUP, així com l'estudiantat en general, és conscient de la desigualtat que es produeix a Espanya en tots els sectors; especialment laboral, amb una preocupant bretxa salarial així com amb una elevada manca de dones en els llocs directius, a més del creixent nombre d'agressions masclistes. Per tot això, considerem que aquesta vaga convocada […]",
    },
    {
      locale: 'eu',
      title: '8Mri buruzko adierazpena',
      description:
        'CREUP, ikasleria oro har bezala, jakitun da Espainian sektore guztietan gertatzen den desberdintasunaz; bereziki lan arloan, kezkagarria den soldata-arrakalarekin, baita zuzendaritza karguetan emakume falta handiarekin ere, eta gainera eraso matxisten kopuru gero eta handiagoarekin. Horregatik guztiagatik, uste dugu deitutako greba hau […]',
    },
    {
      locale: 'gl',
      title: 'Comunicado sobre o 8M',
      description:
        'CREUP, así como o estudantado en xeral, é consciente da desigualdade que se produce en España en todos os sectores; especialmente laboral, cunha preocupante fenda salarial así como cunha elevada falta de mulleres nos postos directivos ademais do crecente número de agresións machistas. Por todo isto, consideramos que esta folga convocada […]',
    },
    {
      locale: 'val',
      title: 'Comunicat sobre el 8M',
      description:
        "CREUP, així com l'estudiantat en general, és conscient de la desigualtat que es produïx a Espanya en tots els sectors; especialment laboral, amb una preocupant bretxa salarial així com amb una elevada falta de dones en els llocs directius, a més del creixent nombre d'agressions masclistes. Per tot això, considerem que esta vaga convocada […]",
    },
  ],
  'el-dia-de-la-mujer-y-la-nina-en-la-ciencia-nos-recuerdan-las-2018-02': [
    {
      locale: 'en',
      title: "The day of women and girls in science reminds us of the university's shortcomings",
      description:
        "Days like today, 11 February, when we celebrate the International Day of Women and Girls in Science, giving visibility to women's scientific work, remind us of the very shortcomings of the Spanish university sector in this field. Women are the majority group at university; nevertheless, their […]",
    },
    {
      locale: 'ca',
      title:
        'El dia de la dona i la nena en la ciència ens recorda les mancances de la universitat',
      description:
        "Dies com el d'avui, 11 de febrer, en què celebrem el dia Internacional de la Dona i la Nena en la Ciència, fent visible la tasca científica de les dones, ens recorden les mateixes mancances en el sector universitari espanyol pel que fa a aquest àmbit. Les dones són el sector majoritari a la Universitat; no obstant això, la seva […]",
    },
    {
      locale: 'eu',
      title:
        'Emakumeen eta Nesken Zientziako Egunak unibertsitatearen gabeziak gogorarazten dizkigu',
      description:
        'Gaurkoa bezalako egunek, otsailaren 11k, Emakumeen eta Nesken Zientziako Nazioarteko Eguna ospatzen dugunean, emakumeen lan zientifikoa ikusarazten dugula, espainiar unibertsitate sektoreak arlo honetan dituen gabeziak berak gogorarazten dizkigute. Emakumeak dira Unibertsitateko sektore nagusia; hala ere, haien […]',
    },
    {
      locale: 'gl',
      title: 'O día da muller e a nena na ciencia recórdanos as carencias da universidade',
      description:
        'Días coma o de hoxe, 11 de febreiro, no que celebramos o día Internacional da Muller e a Nena na Ciencia, visibilizando o labor científico das mulleres, recórdannos as propias carencias do sector universitario español respecto a este ámbito. As mulleres son o sector maioritario na Universidade; non obstante, a súa […]',
    },
    {
      locale: 'val',
      title:
        'El dia de la dona i la xiqueta en la ciència ens recorda les mancances de la universitat',
      description:
        'Dies com el de hui, 11 de febrer, en què celebrem el dia Internacional de la Dona i la Xiqueta en la Ciència, fent visible la tasca científica de les dones, ens recorden les mateixes mancances en el sector universitari espanyol pel que fa a este àmbit. Les dones són el sector majoritari en la Universitat; no obstant això, la seua […]',
    },
  ],
  'casos-como-el-de-albacete-se-han-convertido-en-un-motivo-de-2018-01': [
    {
      locale: 'en',
      title: 'Cases like the one in Albacete have become a source of insecurity for students',
      description:
        "CREUP, like the rest of the country's students, witnessed last week what happened on the Albacete campus of the Universidad de Castilla-La Mancha. This organisation considers the events that took place unacceptable and joins the rejection expressed by the university's management and by the student council of the […]",
    },
    {
      locale: 'ca',
      title: "Casos com el d'Albacete s'han convertit en un motiu d'inseguretat dels estudiants",
      description:
        "CREUP, així com la resta d'estudiants del país, va ser testimoni la setmana passada del que va passar al campus d'Albacete de la Universidad de Castilla-La Mancha. Aquesta organització considera inacceptables els fets ocorreguts i s'adhereix al rebuig expressat per la direcció de la universitat i pel consell d'estudiants de la […]",
    },
    {
      locale: 'eu',
      title: 'Albaceteko kasua bezalakoak ikasleentzako ezegonkortasun arrazoi bihurtu dira',
      description:
        'CREUPek, herrialdeko gainerako ikasleek bezala, joan den astean Universidad de Castilla-La Manchako Albaceteko campusean gertatutakoaren lekuko izan zen. Erakunde honek onartezintzat jotzen ditu gertatutako gertaerak eta unibertsitatearen zuzendaritzak eta haren ikasle kontseiluak adierazitako gaitzespenarekin bat egiten du […]',
    },
    {
      locale: 'gl',
      title: 'Casos coma o de Albacete convertéronse nun motivo de inseguridade dos estudantes',
      description:
        'CREUP, así como o resto de estudantes do país, foi testemuña a semana pasada do ocorrido no campus de Albacete da Universidad de Castilla-La Mancha. Esta organización considera inaceptables os sucesos ocorridos e adhírese ao rexeitamento expresado pola dirección da universidade e polo consello de estudantes da […]',
    },
    {
      locale: 'val',
      title: "Casos com el d'Albacete s'han convertit en un motiu d'inseguretat dels estudiants",
      description:
        "CREUP, així com la resta d'estudiants del país, va ser testimoni la setmana passada del que va passar en el campus d'Albacete de la Universidad de Castilla-La Mancha. Esta organització considera inacceptables els fets ocorreguts i s'adherix al rebuig expressat per la direcció de la universitat i pel consell d'estudiants de la […]",
    },
  ],
  'ministro-de-educacion-repite-desplante-cita-al-estudiantado-2017-12': [
    {
      locale: 'en',
      title: 'Education Minister repeats his snub: he summons students and fails to show up',
      description:
        "Today, 22 December 2017 in Madrid, a plenary session of the State University Students' Council (CEUNE) was held, attended among others by the Coordinator of Student Representatives of Public Universities (CREUP). As happened at the last CEUNE plenary, the Minister of Education and President of this body, […]",
    },
    {
      locale: 'ca',
      title: "El ministre d'educació repeteix el menyspreu: cita l'estudiantat i no es presenta",
      description:
        "Avui, 22 de desembre de 2017 a Madrid, s'ha celebrat un ple del Consell d'Estudiants Universitaris de l'Estat (CEUNE) al qual ha assistit, entre d'altres, la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP). Com va passar en l'últim ple del CEUNE, el ministre d'Educació i president d'aquest òrgan, […]",
    },
    {
      locale: 'eu',
      title: 'Hezkuntza ministroak desplantea errepikatu du: ikasleak deitu eta ez da agertu',
      description:
        'Gaur, 2017ko abenduaren 22an Madrilen, Estatuko Unibertsitate Ikasleen Kontseiluaren (CEUNE) osoko bilkura bat egin da, eta bertan, besteak beste, Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzailea (CREUP) izan da. CEUNEren azken osoko bilkuran gertatu bezala, Hezkuntza ministroak eta organo honen presidenteak, […]',
    },
    {
      locale: 'gl',
      title: 'O ministro de educación repite o desaire: cita o estudantado e non se presenta',
      description:
        'Hoxe, 22 de decembro de 2017 en Madrid, celebrouse un pleno do Consello de Estudantes Universitarios do Estado (CEUNE) ao que asistiu, entre outros, a Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP). Como pasou no último pleno do CEUNE, o ministro de Educación e presidente deste órgano, […]',
    },
    {
      locale: 'val',
      title: "El ministre d'educació repetix el menyspreu: cita l'estudiantat i no es presenta",
      description:
        "Hui, 22 de desembre de 2017 a Madrid, s'ha celebrat un ple del Consell d'Estudiants Universitaris de l'Estat (CEUNE) al qual ha assistit, entre altres, la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP). Com va passar en l'últim ple del CEUNE, el ministre d'Educació i president d'este òrgan, […]",
    },
  ],
  'el-rd-destinado-a-garantizar-un-derecho-se-ha-convertido-en-2017-07': [
    {
      locale: 'en',
      title: 'The RD meant to guarantee a right has become a source of insecurity for students',
      description:
        'CREUP, like the entire student community across the country, watched today with anticipation the presentation of RD 726/2017, which sets the income and family wealth thresholds and the amounts of grants and study aid for the 2017-2018 academic year. This organisation regards the right to […]',
    },
    {
      locale: 'ca',
      title:
        "El RD destinat a garantir un dret s'ha convertit en motiu d'inseguretat per a l'estudiantat",
      description:
        "CREUP, així com tot el col·lectiu estudiantil del país, assistia avui amb expectació a la presentació del RD 726/2017 pel qual s'estableixen els llindars de renda i patrimoni familiar i les quanties de les beques i ajudes a l'estudi per al curs 2017-2018. Aquesta organització considera innegociable el dret a la […]",
    },
    {
      locale: 'eu',
      title: 'Eskubide bat bermatzeko zen RDa ikasleentzako segurtasun ezaren arrazoi bihurtu da',
      description:
        'CREUPek, herrialde osoko ikasle kolektibo guztiak bezala, RD 726/2017aren aurkezpenean parte hartu zuen gaur itxaropenez; arau horren bidez ezartzen dira errenta eta familia ondarearen atalaseak eta 2017-2018 ikasturterako beken eta ikasketa laguntzen zenbatekoak. Erakunde honek ukaezintzat jotzen du […]',
    },
    {
      locale: 'gl',
      title:
        'O RD destinado a garantir un dereito converteuse en motivo de inseguridade para o estudantado',
      description:
        'CREUP, así como todo o colectivo estudantil do país, asistía hoxe con expectación á presentación do RD 726/2017 polo que se establecen os limiares de renda e patrimonio familiar e as contías das bolsas e axudas ao estudo para o curso 2017-2018. Esta organización considera innegociable o dereito á […]',
    },
    {
      locale: 'val',
      title:
        "El RD destinat a garantir un dret s'ha convertit en motiu d'inseguretat per a l'estudiantat",
      description:
        "CREUP, així com tot el col·lectiu estudiantil del país, assistia hui amb expectació a la presentació del RD 726/2017 pel qual s'establixen els llindars de renda i patrimoni familiar i les quanties de les beques i ajudes a l'estudi per al curs 2017-2018. Esta organització considera innegociable el dret a la […]",
    },
  ],
  'ministro-de-educacion-menosprecia-a-los-estudiantes-una-vez-2017-07': [
    {
      locale: 'en',
      title: 'Minister of Education disparages students once again',
      description:
        'Today, 14 July 2017 in Madrid, a meeting of the State Council of University Students (CEUNE) was held after almost two years of inactivity, attended among others by the Coordinator of Student Representatives of Public Universities (CREUP). The one who did not attend, despite holding the […]',
    },
    {
      locale: 'ca',
      title: "El Ministre d'Educació menysprea els estudiants una vegada més",
      description:
        "Avui, 14 de juliol de 2017 a Madrid, s'ha celebrat després de gairebé dos anys d'inactivitat una convocatòria del Consell d'Estudiants Universitaris de l'Estat (CEUNE), a la qual ha assistit entre altres la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP). Qui no ha assistit malgrat ser qui té […]",
    },
    {
      locale: 'eu',
      title: 'Hezkuntza ministroak ikasleak gutxietsi ditu berriz ere',
      description:
        'Gaur, 2017ko uztailaren 14an Madrilen, ia bi urteko geldialdiaren ondoren, Estatuko Unibertsitate Ikasleen Kontseiluaren (CEUNE) deialdi bat egin da, eta beste batzuen artean Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak (CREUP) parte hartu du. Organo hau deitzeko ahalmena izan arren bertaratu ez dena […]',
    },
    {
      locale: 'gl',
      title: 'O Ministro de Educación menospreza os estudantes unha vez máis',
      description:
        'Hoxe, 14 de xullo de 2017 en Madrid, celebrouse despois de case dous anos de inactividade unha convocatoria do Consello de Estudantes Universitarios do Estado (CEUNE), á que asistiu entre outros a Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP). Quen non asistiu a pesar de ser quen ten […]',
    },
    {
      locale: 'val',
      title: "El Ministre d'Educació menysprea els estudiants una vegada més",
      description:
        "Hui, 14 de juliol de 2017 a Madrid, s'ha celebrat després de quasi dos anys d'inactivitat una convocatòria del Consell d'Estudiants Universitaris de l'Estat (CEUNE), a la qual ha assistit entre altres la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP). Qui no ha assistit a pesar de ser qui té […]",
    },
  ],
  'la-comunidad-estudiantil-celebra-avances-en-la-reduccion-de-2017-06': [
    {
      locale: 'en',
      title: 'The student community welcomes progress in reducing economic barriers at university',
      description:
        "The Coordinator of Student Representatives of Public Universities (CREUP) applauds the news coming from various Spanish autonomous communities (Andalusia, La Rioja and the Canary Islands) that marks a further step in reducing the economic barriers to students' access to and continuation in university life. This organisation wishes to express its satisfaction at […]",
    },
    {
      locale: 'ca',
      title:
        'La comunitat estudiantil celebra avenços en la reducció de barreres econòmiques a la universitat',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) aplaudeix les notícies que arriben de diferents comunitats autònomes espanyoles (Andalusia, La Rioja i Canàries) que suposen un pas més en la reducció de barreres econòmiques en l'accés i el manteniment dels estudiants a la vida universitària. Aquesta organització vol manifestar la seva satisfacció davant […]",
    },
    {
      locale: 'eu',
      title:
        'Ikasle komunitateak unibertsitateko oztopo ekonomikoak murrizteko aurrerapenak ospatzen ditu',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak (CREUP) txalotu egiten ditu Espainiako hainbat autonomia erkidegotatik (Andaluzia, Errioxa eta Kanariak) datozen berriak, ikasleek unibertsitate bizitzara sartzeko eta bertan jarraitzeko oztopo ekonomikoak murrizteko urrats bat gehiago baitira. Erakunde honek bere poza adierazi nahi du […]',
    },
    {
      locale: 'gl',
      title:
        'A comunidade estudantil celebra avances na redución de barreiras económicas na universidade',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) aplaude as novas que chegan de distintas comunidades autónomas españolas (Andalucía, A Rioxa e Canarias) que supoñen un paso máis na redución de barreiras económicas no acceso e mantemento dos estudantes á vida universitaria. Esta organización quere manifestar a súa satisfacción ante […]',
    },
    {
      locale: 'val',
      title:
        'La comunitat estudiantil celebra avanços en la reducció de barreres econòmiques en la universitat',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) aplaudix les notícies que arriben de diferents comunitats autònomes espanyoles (Andalusia, La Rioja i Canàries) que suposen un pas més en la reducció de barreres econòmiques en l'accés i el manteniment dels estudiants a la vida universitària. Esta organització vol manifestar la seua satisfacció davant […]",
    },
  ],
  'respecto-a-los-plagios-en-la-universidad-2016-12': [
    {
      locale: 'en',
      title: 'On plagiarism at the University',
      description:
        'In light of the news published by various media outlets regarding the alleged academic plagiarism by the rector of Universidad Rey Juan Carlos, at CREUP we want to make our deep concern on the matter clear. Encouraging the transfer of knowledge is essential so that other people can continue carrying out that research work, but […]',
    },
    {
      locale: 'ca',
      title: 'Sobre els plagis a la Universitat',
      description:
        'A la llum de les notícies publicades per diversos mitjans de comunicació en relació amb els presumptes plagis acadèmics del rector de la Universidad Rey Juan Carlos, des de CREUP volem deixar palesa la nostra gran preocupació al respecte. Fomentar el traspàs de coneixements és imprescindible perquè altres persones puguin continuar desenvolupant aquesta tasca investigadora, però […]',
    },
    {
      locale: 'eu',
      title: 'Unibertsitateko plagioei buruz',
      description:
        'Hainbat hedabidek Universidad Rey Juan Carloseko errektorearen ustezko plagio akademikoei buruz argitaratutako albisteen harira, CREUPetik gai honi buruzko gure kezka handia agerian utzi nahi dugu. Ezagutzaren transmisioa sustatzea ezinbestekoa da beste pertsona batzuek ikerketa-lan hori garatzen jarrai dezaten, baina […]',
    },
    {
      locale: 'gl',
      title: 'Sobre os plaxios na Universidade',
      description:
        'Á luz das novas publicadas por diversos medios de comunicación en relación cos presuntos plaxios académicos do reitor da Universidad Rey Juan Carlos, desde CREUP queremos deixar patente a nosa gran preocupación ao respecto. Fomentar o traspaso de coñecementos é imprescindible para que outras persoas poidan continuar desenvolvendo ese labor investigador, pero […]',
    },
    {
      locale: 'val',
      title: 'Sobre els plagis en la Universitat',
      description:
        'A la llum de les notícies publicades per diversos mitjans de comunicació en relació amb els presumptes plagis acadèmics del rector de la Universidad Rey Juan Carlos, des de CREUP volem deixar palesa la nostra gran preocupació al respecte. Fomentar el traspàs de coneixements és imprescindible perquè altres persones puguen continuar desenvolupant esta tasca investigadora, però […]',
    },
  ],
  'manifiesto-17now-2016-11': [
    {
      locale: 'en',
      title: '#17Now Manifesto',
      description:
        "Today, 17 November 2016, the world celebrates International Students' Day. At the Coordinating Body of Student Representatives of Public Universities (CREUP) we cannot allow this day to pass without notice in these times when so many university students are being forced to give up their studies because of the excessive rise in […]",
    },
    {
      locale: 'ca',
      title: 'Manifest #17Now',
      description:
        "Avui, 17 de novembre de 2016, el món celebra el Dia Internacional de l'Estudiant. Des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) no podem permetre que aquest dia passi sense pena ni glòria en aquests temps en què tants universitaris es veuen obligats a deixar els seus estudis per la desmesurada pujada de […]",
    },
    {
      locale: 'eu',
      title: '#17Now Manifestua',
      description:
        'Gaur, 2016ko azaroaren 17an, munduak Ikaslearen Nazioarteko Eguna ospatzen du. Unibertsitate Publikoetako Ikasle Ordezkarien Koordinakundetik (CREUP) ezin dugu egun hau oharkabean pasatzen utzi, hainbeste unibertsitari beren ikasketak uztera behartuta ikusten ari diren garai hauetan, neurriz gabeko igoeraren ondorioz […]',
    },
    {
      locale: 'gl',
      title: 'Manifesto #17Now',
      description:
        'Hoxe, 17 de novembro de 2016, o mundo celebra o Día Internacional do Estudante. Desde a Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) non podemos permitir que este día pase sen pena nin gloria nestes tempos en que tantos universitarios se están vendo obrigados a deixar os seus estudos pola desmesurada suba de […]',
    },
    {
      locale: 'val',
      title: 'Manifest #17Now',
      description:
        "Hui, 17 de novembre de 2016, el món celebra el Dia Internacional de l'Estudiant. Des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) no podem permetre que este dia passe sense pena ni glòria en estos temps en què tants universitaris es veuen obligats a deixar els seus estudis per la desmesurada pujada de […]",
    },
  ],
  'denuncia-de-los-abusos-en-la-universidad-de-sevilla-2016-11': [
    {
      locale: 'en',
      title: 'Complaint against the abuses at the University of Seville',
      description:
        'The recent news about the guilty verdict against the professor and former dean of the Faculty of Education Sciences of the University of Seville, Mr. Romero Granados, is yet another demonstration that, in the field of equality, it remains necessary to fight every day to resolve degrading situations such as the one that occurred at […]',
    },
    {
      locale: 'ca',
      title: 'Denúncia dels abusos a la Universitat de Sevilla',
      description:
        "Les recents notícies sobre la sentència condemnatòria del catedràtic i antic degà de la Facultat de Ciències de l'Educació de la Universitat de Sevilla, el Sr. Romero Granados, són una demostració més que, en el terreny de la igualtat, continua sent necessari lluitar cada dia per solucionar situacions denigrants com la esdevinguda a […]",
    },
    {
      locale: 'eu',
      title: 'Sevillako Unibertsitateko abusuen salaketa',
      description:
        'Sevillako Unibertsitateko Hezkuntza Zientzien Fakultateko katedradun eta dekano ohi Romero Granados jaunaren kondena epaiari buruzko azken albisteak frogatzen du berriz ere, berdintasunaren arloan, beharrezkoa dela egunero borrokatzea honako leku honetan gertatutakoa bezalako egoera lotsagarriak konpontzeko […]',
    },
    {
      locale: 'gl',
      title: 'Denuncia dos abusos na Universidade de Sevilla',
      description:
        'As recentes novas sobre a sentenza condenatoria do catedrático e antigo decano da Facultade de Ciencias da Educación da Universidade de Sevilla, o Sr. Romero Granados, son unha demostración máis de que, no terreo da igualdade, segue sendo necesario loitar cada día para solucionar situacións denigrantes como a acaecida en […]',
    },
    {
      locale: 'val',
      title: 'Denúncia dels abusos en la Universitat de Sevilla',
      description:
        "Les recents notícies sobre la sentència condemnatòria del catedràtic i antic degà de la Facultat de Ciències de l'Educació de la Universitat de Sevilla, el Sr. Romero Granados, són una demostració més que, en el terreny de la igualtat, continua sent necessari lluitar cada dia per a solucionar situacions denigrants com la esdevinguda en […]",
    },
  ],
  'los-estudiantes-celebran-la-unificacion-del-programa-erasmus-2016-07': [
    {
      locale: 'en',
      title:
        'Students welcome the unification of the Erasmus programme, but consider it insufficient',
      description:
        'The Coordinator of Representatives of Public Universities (CREUP) welcomes the withdrawal of the "Erasmus.es" programme to transfer its budget to a single European mobility grant programme, thereby removing the B2 language requirement to obtain an extraordinary aid, and the increase in the funding period from 5 months to 7. […]',
    },
    {
      locale: 'ca',
      title:
        'Els estudiants celebren la unificació del programa Erasmus, però el consideren insuficient',
      description:
        "La Coordinadora de Representants d'Universitats Públiques (CREUP) celebra la retirada del programa «Erasmus.es» per transferir el seu pressupost a un únic programa de beques de mobilitat europea i amb això eliminar el requisit del nivell B2 en idiomes per a obtenir un ajut extraordinari, i l'augment del període de finançament de 5 mesos a 7. […]",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek Erasmus programaren bateratzea ongi hartu dute, baina nahikoa ez dela uste dute',
      description:
        'Unibertsitate Publikoetako Ordezkarien Koordinakundeak (CREUP) ongi hartu du «Erasmus.es» programa kentzea, bere aurrekontua Europako mugikortasun-beken programa bakar batera transferitzeko eta horrekin laguntza berezi bat lortzeko hizkuntzetako B2 mailaren baldintza ezabatzeko, baita finantzaketa-aldia 5 hilabetetik 7ra handitzea ere. […]',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes celebran a unificación do programa Erasmus, pero considérano insuficiente',
      description:
        'A Coordinadora de Representantes de Universidades Públicas (CREUP) celebra a retirada do programa «Erasmus.es» para transferir o seu orzamento a un único programa de bolsas de mobilidade europea e con iso eliminar o requisito do nivel B2 en idiomas para obter unha axuda extraordinaria, e o aumento do período de financiamento de 5 meses a 7. […]',
    },
    {
      locale: 'val',
      title:
        'Els estudiants celebren la unificació del programa Erasmus, però el consideren insuficient',
      description:
        "La Coordinadora de Representants d'Universitats Públiques (CREUP) celebra la retirada del programa «Erasmus.es» per a transferir el seu pressupost a un únic programa de beques de mobilitat europea i amb això eliminar el requisit del nivell B2 en idiomes per a obtindre una ajuda extraordinària, i l'augment del període de finançament de 5 mesos a 7. […]",
    },
  ],
  'universitarios-rechazan-tajantemente-el-estatuto-del-becario-2026-03': [
    {
      locale: 'en',
      title:
        'University students "flatly" reject Yolanda Díaz\'s Intern Statute: "It has ignored those affected"',
      description:
        'CREUP has criticised over this period that the text "has been drawn up without the real participation of the educational community".',
    },
    {
      locale: 'ca',
      title:
        "Els universitaris rebutgen «taxativament» l'Estatut del Becari de Yolanda Díaz: «Ha ignorat els afectats»",
      description:
        "CREUP ha criticat durant aquest temps que el text «s'ha elaborat sense comptar amb la participació real de la comunitat educativa».",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitarioek «tinko» baztertzen dute Yolanda Díazen Bekadunaren Estatutua: «Kaltetuak alde batera utzi ditu»',
      description:
        'CREUPek denbora honetan kritikatu du testua «hezkuntza komunitatearen benetako parte-hartzerik gabe egin dela».',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios rexeitan «taxativamente» o Estatuto do Bolseiro de Yolanda Díaz: «Ignorou os afectados»',
      description:
        'CREUP criticou durante este tempo que o texto «se elaborou sen contar coa participación real da comunidade educativa».',
    },
    {
      locale: 'val',
      title:
        "Els universitaris rebutgen «taxativament» l'Estatut del Becari de Yolanda Díaz: «Ha ignorat els afectats»",
      description:
        "CREUP ha criticat durant este temps que el text «s'ha elaborat sense comptar amb la participació real de la comunitat educativa».",
    },
  ],
  'universitarios-rechazan-tajantemente-el-estatuto-del-becario-2026-03-2': [
    {
      locale: 'en',
      title:
        'University students "flatly" reject Yolanda Díaz\'s Intern Statute: "It has ignored the actors affected"',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP) has "flatly" rejected the draft act of the Statute of persons in non-employment practical training that is being sent to the Congress of Deputies.',
    },
    {
      locale: 'ca',
      title:
        "Els universitaris rebutgen «taxativament» l'Estatut del Becari de Yolanda Díaz: «Ha ignorat els actors afectats»",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) ha rebutjat «taxativament» el projecte de llei de l'Estatut de les persones en formació pràctica no laboral que es remet al Congrés dels Diputats.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitarioek «tinko» baztertzen dute Yolanda Díazen Bekadunaren Estatutua: «Eragindako eragileak alde batera utzi ditu»',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak (CREUP) «tinko» baztertu du Diputatuen Kongresura bidaltzen den lan-harremanik gabeko praktika prestakuntzan dauden pertsonen Estatutuaren lege proiektua.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios rexeitan «taxativamente» o Estatuto do Bolseiro de Yolanda Díaz: «Ignorou os actores afectados»',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) rexeitou «taxativamente» o proxecto de lei do Estatuto das persoas en formación práctica non laboral que se remite ao Congreso dos Deputados.',
    },
    {
      locale: 'val',
      title:
        "Els universitaris rebutgen «taxativament» l'Estatut del Becari de Yolanda Díaz: «Ha ignorat els actors afectats»",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) ha rebutjat «taxativament» el projecte de llei de l'Estatut de les persones en formació pràctica no laboral que es remet al Congrés dels Diputats.",
    },
  ],
  'estudiantes-vaticinan-que-la-ley-universitaria-para-andaluci-2026-02': [
    {
      locale: 'en',
      title:
        'Students predict that the University Act for Andalusia will affect their "present and future" and call for it to be "amended"',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP), in line with what was stated by the Association of Public Universities of Andalusia (AUPA), has called on the Regional Government of Andalusia to "correct course, open a genuine dialogue process and amend" the University Act for Andalusia (LUPA), since it "directly affects the present and future of university students".',
    },
    {
      locale: 'ca',
      title:
        'Els estudiants vaticinen que la Llei Universitària Per a Andalusia afectarà el seu «present i futur» i demanen «modificar-la»',
      description:
        "La Coordinadora de Representants d'Estudiants de les Universitats Públiques (Creup), en línia amb el que ha manifestat l'Associació d'Universitats Públiques d'Andalusia (AUPA), ha demanat a la Junta d'Andalusia que «rectifiqui el rumb, obri un procés real de diàleg i modifiqui» la Llei Universitària Per a Andalusia (LUPA), ja que aquesta «afecta directament el present i el futur de l'estudiantat universitari».",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek aurreikusten dute Andaluziarako Unibertsitate Legeak haien «orainari eta etorkizunari» eragingo diela eta «aldatzeko» eskatzen dute',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak (Creup), Andaluziako Unibertsitate Publikoen Elkarteak (AUPA) adierazitakoarekin bat etorriz, Andaluziako Juntari eskatu dio «norabidea zuzendu, benetako elkarrizketa prozesu bat ireki eta alda dezala» Andaluziarako Unibertsitate Legea (LUPA), izan ere, horrek «zuzenean eragiten dio unibertsitateko ikasleen orainari eta etorkizunari».',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes vaticinan que a Lei Universitaria Para Andalucía afectará o seu «presente e futuro» e piden «modificala»',
      description:
        'A Coordinadora de Representantes de Estudantes das Universidades Públicas (Creup), en liña co manifestado pola Asociación de Universidades Públicas de Andalucía (AUPA), pediulle á Xunta de Andalucía que «rectifique o rumbo, abra un proceso real de diálogo e modifique» a Lei Universitaria Para Andalucía (LUPA), xa que esta «afecta directamente o presente e o futuro do estudantado universitario».',
    },
    {
      locale: 'val',
      title:
        'Els estudiants vaticinen que la Llei Universitària Per a Andalusia afectarà el seu «present i futur» i demanen «modificar-la»',
      description:
        "La Coordinadora de Representants d'Estudiants de les Universitats Públiques (Creup), en línia amb el que ha manifestat l'Associació d'Universitats Públiques d'Andalusia (AUPA), ha demanat a la Junta d'Andalusia que «rectifique el rumb, òbriga un procés real de diàleg i modifique» la Llei Universitària Per a Andalusia (LUPA), ja que esta «afecta directament el present i el futur de l'estudiantat universitari».",
    },
  ],
  'los-rectores-ven-riesgo-para-las-practicas-formativas-si-las-2025-11': [
    {
      locale: 'en',
      title:
        'Rectors see a "risk" to training placements if companies do not get involved in the intern statute',
      description:
        'The Conference of Rectors views the reimbursement of students\' expenses positively, but calls for "co-responsibility" from public and private institutions.',
    },
    {
      locale: 'ca',
      title:
        "Els rectors veuen «risc» per a les pràctiques formatives si les empreses no s'impliquen en l'estatut del becari",
      description:
        'La Conferència de Rectors valora positivament la compensació de despeses dels estudiants, però reclama «coresponsabilitat» a les institucions públiques i privades.',
    },
    {
      locale: 'eu',
      title:
        'Errektoreek prestakuntza praktiketarako «arriskua» ikusten dute enpresak bekadunaren estatutuan inplikatzen ez badira',
      description:
        'Errektoreen Konferentziak positiboki baloratzen du ikasleen gastuen konpentsazioa, baina «erantzunkidetasuna» eskatzen die erakunde publiko zein pribatuei.',
    },
    {
      locale: 'gl',
      title:
        'Os reitores ven «risco» para as prácticas formativas se as empresas non se implican no estatuto do bolseiro',
      description:
        'A Conferencia de Reitores valora positivamente a compensación de gastos dos estudantes, pero reclama «corresponsabilidade» ás institucións públicas e privadas.',
    },
    {
      locale: 'val',
      title:
        "Els rectors veuen «risc» per a les pràctiques formatives si les empreses no s'impliquen en l'estatut del becari",
      description:
        'La Conferència de Rectors valora positivament la compensació de despeses dels estudiants, però reclama «coresponsabilitat» a les institucions públiques i privades.',
    },
  ],
  'estudiantes-al-limite-exigen-un-plan-urgente-ante-la-subida-2025-09': [
    {
      locale: 'en',
      title:
        'Students at breaking point: they demand an "urgent plan" in the face of rising rents and the lack of public halls of residence',
      description:
        'CREUP denounces that this situation forces many students to give up their first university choices.',
    },
    {
      locale: 'ca',
      title:
        'Estudiants al límit: exigeixen un «pla urgent» davant la pujada del lloguer i la manca de residències públiques',
      description:
        'CREUP denuncia que aquesta situació obliga molts estudiants a renunciar a les seves primeres opcions universitàries.',
    },
    {
      locale: 'eu',
      title:
        'Ikasleak mugan: «plan premiazko bat» eskatzen dute alokairuaren igoeraren eta egoitza publikoen faltaren aurrean',
      description:
        'CREUPek salatzen du egoera horrek ikasle askori beren lehen aukera unibertsitarioei uko egitera behartzen diela.',
    },
    {
      locale: 'gl',
      title:
        'Estudantes ao límite: esixen un «plan urxente» ante a suba do alugueiro e a falta de residencias públicas',
      description:
        'CREUP denuncia que esta situación obriga a moitos estudantes a renunciar ás súas primeiras opcións universitarias.',
    },
    {
      locale: 'val',
      title:
        'Estudiants al límit: exigixen un «pla urgent» davant la pujada del lloguer i la falta de residències públiques',
      description:
        'CREUP denuncia que esta situació obliga molts estudiants a renunciar a les seues primeres opcions universitàries.',
    },
  ],
  'estudiantes-universitarios-denuncian-la-amenaza-de-la-formac-2025-07': [
    {
      locale: 'en',
      title:
        'University students denounce the "threat" to medical training posed by the presence of private-university students in public hospitals',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP) and the State Council of Medical Students (CEEM) denounce a "critical situation" that "jeopardises" the future of public medical education in the Valencian Community.',
    },
    {
      locale: 'ca',
      title:
        "Els estudiants universitaris denuncien l'«amenaça» de la formació mèdica amb la presència d'alumnes de la privada en hospitals públics",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) i el Consell Estatal d'Estudiants de Medicina (CEEM) denuncien una «situació crítica» que «posa en risc» el futur de l'educació mèdica pública a la Comunitat Valenciana.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek mediku prestakuntzaren «mehatxua» salatzen dute, ospitale publikoetan unibertsitate pribatuko ikasleak egoteagatik',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak (CREUP) eta Medikuntzako Ikasleen Estatuko Kontseiluak (CEEM) «egoera kritikoa» salatzen dute, Valentziako Erkidegoko mediku hezkuntza publikoaren etorkizuna «arriskuan jartzen» duena.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes universitarios denuncian a «ameaza» da formación médica coa presenza de alumnos da privada en hospitais públicos',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) e o Consello Estatal de Estudantes de Medicina (CEEM) denuncian unha «situación crítica» que «pon en risco» o futuro da educación médica pública na Comunitat Valenciana.',
    },
    {
      locale: 'val',
      title:
        "Els estudiants universitaris denuncien l'«amenaça» de la formació mèdica amb la presència d'alumnes de la privada en hospitals públics",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) i el Consell Estatal d'Estudiants de Medicina (CEEM) denuncien una «situació crítica» que «posa en risc» el futur de l'educació mèdica pública en la Comunitat Valenciana.",
    },
  ],
  'los-estudiantes-de-las-universidades-publicas-ven-un-gran-av-2025-05': [
    {
      locale: 'en',
      title: 'Public university students see the Government\'s reform as a "major step forward"',
      description:
        "The Coordinating Body of Student Representatives of Public Universities (CREUP) has voiced its support for the Government's draft bill to reform the rules on the creation and recognition of universities, which seeks to curb the emergence of private institutions that fail to meet adequate quality standards.",
    },
    {
      locale: 'ca',
      title:
        'Els estudiants de les universitats públiques veuen com un «gran avanç» la reforma del Govern',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) ha mostrat el seu suport al projecte del Govern que reformarà la normativa per a la creació i el reconeixement d'universitats i que busca frenar l'aparició de centres privats que no compleixen amb la qualitat suficient.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitate publikoetako ikasleek «aurrerapauso handitzat» jotzen dute Gobernuaren erreforma',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinadorak (CREUP) bere babesa adierazi dio Gobernuaren proiektuari, zeinak unibertsitateak sortzeko eta aitortzeko araudia erreformatuko baitu eta nahikoa kalitate betetzen ez duten ikastetxe pribatuen agerpena gelditu nahi baitu.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes das universidades públicas ven como un «gran avance» a reforma do Goberno',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) mostrou o seu apoio ao proxecto do Goberno que reformará a normativa para a creación e o recoñecemento de universidades e que busca frear a aparición de centros privados que non cumpren coa calidade suficiente.',
    },
    {
      locale: 'val',
      title:
        'Els estudiants de les universitats públiques veuen com un «gran avanç» la reforma del Govern',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) ha mostrat el seu suport al projecte del Govern que reformarà la normativa per a la creació i el reconeixement d'universitats i que busca frenar l'aparició de centres privats que no complixen amb la qualitat suficient.",
    },
  ],
  'universitarios-destacan-su-rol-fundamental-en-la-prevencion-2024-11': [
    {
      locale: 'en',
      title:
        'University students highlight their "key role" in preventing and giving visibility to gender-based violence',
      description:
        'The Coordinating Body of Student Representatives of Public Universities (CREUP) believes that the student body "has a key role in preventing and giving visibility to gender-based violence".',
    },
    {
      locale: 'ca',
      title:
        'Els universitaris destaquen el seu «paper fonamental» en la prevenció i la visibilització de la violència masclista',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) considera que l'estudiantat «té un paper fonamental en la prevenció i la visibilització de la violència masclista».",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek beren «zeregin funtsezkoa» nabarmendu dute indarkeria matxistaren prebentzioan eta ikusgaitasunean',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinadorak (CREUP) uste du ikasleek «zeregin funtsezkoa dutela indarkeria matxistaren prebentzioan eta ikusgaitasunean».',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios destacan o seu «papel fundamental» na prevención e a visibilización da violencia machista',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) considera que o estudantado «ten un papel fundamental na prevención e a visibilización da violencia machista».',
    },
    {
      locale: 'val',
      title:
        'Els universitaris destaquen el seu «paper fonamental» en la prevenció i la visibilització de la violència masclista',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) considera que l'estudiantat «té un paper fonamental en la prevenció i la visibilització de la violència masclista».",
    },
  ],
  'creup-reivindica-que-la-universidad-sea-espacio-seguro-2024-11': [
    {
      locale: 'en',
      title: 'CREUP calls for the university to be a safe space',
      description:
        'The Coordinating Body of Student Representatives of Public Universities (CREUP) called on Monday for the challenge of eradicating gender-based violence and making the university a safe space.',
    },
    {
      locale: 'ca',
      title: 'CREUP reivindica que la universitat sigui un espai segur',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) va reivindicar aquest dilluns el repte d'eradicar la violència masclista i que la universitat sigui un espai segur.",
    },
    {
      locale: 'eu',
      title: 'CREUPek aldarrikatzen du unibertsitatea espazio seguru izan dadila',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinadorak (CREUP) astelehen honetan aldarrikatu zuen indarkeria matxista desagerrarazteko erronka eta unibertsitatea espazio seguru izan dadila.',
    },
    {
      locale: 'gl',
      title: 'CREUP reivindica que a universidade sexa un espazo seguro',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) reivindicou este luns o reto de erradicar a violencia machista e que a universidade sexa un espazo seguro.',
    },
    {
      locale: 'val',
      title: 'CREUP reivindica que la universitat siga un espai segur',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) va reivindicar este dilluns el repte d'eradicar la violència masclista i que la universitat siga un espai segur.",
    },
  ],
  'universitarios-critican-que-para-algunos-centros-la-priorida-2024-10': [
    {
      locale: 'en',
      title:
        'University students criticise that some institutions\' priority is to "resume classes as soon as possible"',
      description:
        'CREUP stresses that "students are more concerned about recovering their homes and relatives than about going to class".',
    },
    {
      locale: 'ca',
      title:
        'Els universitaris critiquen que per a alguns centres la prioritat sigui «reprendre les classes com més aviat millor»',
      description:
        'CREUP remarca que «els estudiants estan més preocupats per recuperar les seves llars i els seus familiars que no pas per anar a classe».',
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek kritikatu dute ikastetxe batzuentzat lehentasuna «klaseak ahalik eta lasterren berriz hartzea» izatea',
      description:
        'CREUPek azpimarratzen du «ikasleak gehiago kezkatuta daudela beren etxeak eta senideak berreskuratzeaz, klasera joateaz baino».',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios critican que para algúns centros a prioridade sexa «retomar as clases canto antes»',
      description:
        'CREUP remarca que «os estudantes están máis preocupados por recuperar os seus fogares e familiares que por ir a clase».',
    },
    {
      locale: 'val',
      title:
        'Els universitaris critiquen que per a alguns centres la prioritat siga «reprendre les classes com més prompte millor»',
      description:
        'CREUP remarca que «els estudiants estan més preocupats per recuperar les seues llars i els seus familiars que per anar a classe».',
    },
  ],
  'universitarios-avisan-de-que-no-pueden-seguir-las-clases-ant-2024-10': [
    {
      locale: 'en',
      title:
        'University students warn they cannot keep up with classes amid the DANA: "They want to resume classes as soon as possible"',
      description:
        'The Coordinating Body of Student Representatives of Public Universities (CREUP) has lamented the consequences of the storm battering the country this week and has asked universities "not to gamble with people\'s lives".',
    },
    {
      locale: 'ca',
      title:
        'Els universitaris avisen que no poden seguir les classes davant la DANA: «Volen reprendre les classes com més aviat millor»',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) ha lamentat les conseqüències produïdes pel temporal que assola aquesta setmana el país i ha demanat a les universitats que «no juguin amb la vida de les persones».",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek ohartarazi dute ezin dituztela klaseak jarraitu DANAren aurrean: «Klaseak ahalik eta lasterren berriz hartu nahi dituzte»',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinadorak (CREUP) deitoratu egin ditu aste honetan herrialdea astintzen ari den ekaitzak eragindako ondorioak, eta unibertsitateei eskatu die «pertsonen bizitzarekin ez jolasteko».',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios avisan de que non poden seguir as clases ante a DANA: «Queren retomar as clases canto antes»',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) lamentou as consecuencias producidas polo temporal que asola esta semana o país e pediulles ás universidades que «non xoguen coa vida das persoas».',
    },
    {
      locale: 'val',
      title:
        'Els universitaris avisen que no poden seguir les classes davant la DANA: «Volen reprendre les classes com més prompte millor»',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) ha lamentat les conseqüències produïdes pel temporal que assola esta setmana el país i ha demanat a les universitats que «no juguen amb la vida de les persones».",
    },
  ],
  'creup-afea-a-las-universidades-valencianas-la-urgencia-por-r-2024-10': [
    {
      locale: 'en',
      title: 'CREUP rebukes Valencian universities for their rush to resume classes after the DANA',
      description:
        'The DANA has left terrible scenes over the past few days, with missing people, deaths, and people left cut off.',
    },
    {
      locale: 'ca',
      title:
        'CREUP retreu a les universitats valencianes la pressa per reprendre les classes després de la DANA',
      description:
        'La DANA ha deixat imatges terribles els últims dies: hi ha desapareguts, morts i persones que es troben incomunicades.',
    },
    {
      locale: 'eu',
      title:
        'CREUPek aurpegira bota die Valentziako unibertsitateei DANAren ondoren klaseak berriz hartzeko duten presa',
      description:
        'DANAk irudi izugarriak utzi ditu azken egunotan: desagertuak, hildakoak eta pertsonak inkomunikatuta daude.',
    },
    {
      locale: 'gl',
      title:
        'CREUP recríminalles ás universidades valencianas a presa por retomar as clases tras a DANA',
      description:
        'A DANA deixou imaxes terribles nos últimos días: hai desaparecidos, falecementos e persoas que se atopan incomunicadas.',
    },
    {
      locale: 'val',
      title:
        'CREUP retrau a les universitats valencianes la pressa per reprendre les classes després de la DANA',
      description:
        'La DANA ha deixat imatges terribles estos últims dies: hi ha desapareguts, morts i persones que es troben incomunicades.',
    },
  ],
  'los-estudiantes-universitarios-piden-participar-en-la-redacc-2024-10': [
    {
      locale: 'en',
      title: 'University students ask to take part in drafting the Trainee Statute',
      description:
        'CREUP points out that "internships in public administrations are not the same as those carried out in a company".',
    },
    {
      locale: 'ca',
      title:
        "Els estudiants universitaris demanen participar en la redacció de l'Estatut del Becari",
      description:
        'Des de CREUP indiquen que «les pràctiques no són iguals a les administracions públiques que les que es fan en una empresa».',
    },
    {
      locale: 'eu',
      title: 'Unibertsitateko ikasleek Bekadunaren Estatutua idazten parte hartzeko eskatu dute',
      description:
        'CREUPetik adierazten dute «praktikak ez direla berdinak administrazio publikoetan eta enpresa batean egiten direnetan».',
    },
    {
      locale: 'gl',
      title: 'Os estudantes universitarios piden participar na redacción do Estatuto do Bolseiro',
      description:
        'Desde CREUP indican que «as prácticas non son iguais nas administracións públicas que as que se realizan nunha empresa».',
    },
    {
      locale: 'val',
      title:
        "Els estudiants universitaris demanen participar en la redacció de l'Estatut del Becari",
      description:
        'Des de CREUP indiquen que «les pràctiques no són iguals en les administracions públiques que les que es realitzen en una empresa».',
    },
  ],
  'descartar-una-carrera-o-pasar-cuatro-horas-diarias-en-el-bus-2024-09': [
    {
      locale: 'en',
      title: 'Ruling out a degree or spending four hours a day on the bus',
      description:
        'On many public campuses in cities with prohibitive rents, those enrolled commute every day from far away or lose out on applications from students from other parts of Spain.',
    },
    {
      locale: 'ca',
      title: "Descartar una carrera o passar quatre hores diàries a l'autobús",
      description:
        "En molts campus públics de ciutats amb lloguers prohibitius, els inscrits es desplacen cada dia des de molt lluny o es perden sol·licituds d'alumnes d'altres parts d'Espanya.",
    },
    {
      locale: 'eu',
      title: 'Karrera bat baztertu edo egunero lau ordu autobusean igaro',
      description:
        'Alokairu prohibitiboak dituzten hirietako campus publiko askotan, izena emandakoak egunero oso urrutitik mugitzen dira edo Espainiako beste leku batzuetako ikasleen eskaerak galtzen dituzte.',
    },
    {
      locale: 'gl',
      title: 'Descartar unha carreira ou pasar catro horas diarias no bus',
      description:
        'En moitos campus públicos de cidades con alugueres prohibitivos, os inscritos desprázanse cada día desde moi lonxe ou perden solicitudes de alumnos doutras partes de España.',
    },
    {
      locale: 'val',
      title: "Descartar una carrera o passar quatre hores diàries en l'autobús",
      description:
        "En molts campus públics de ciutats amb lloguers prohibitius, els inscrits es desplacen cada dia des de molt lluny o es perden sol·licituds d'alumnes d'altres parts d'Espanya.",
    },
  ],
  'universitarios-rechazan-la-ebau-comun-del-pp-y-avisan-de-que-2024-07': [
    {
      locale: 'en',
      title:
        'University students reject the PP\'s common EBAU and warn it could create "comparative grievance" between regions',
      description:
        'The Coordinating Body of Student Representatives of Public Universities (CREUP) has rejected the common University Entrance Examination (EBAU) model signed by the autonomous communities governed by the Partido Popular.',
    },
    {
      locale: 'ca',
      title:
        "Els universitaris rebutgen l'EBAU comuna del PP i avisen que pot generar un «greuge comparatiu» entre comunitats",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) ha rebutjat el model d'Avaluació del Batxillerat per a l'Accés a la Universitat (EBAU) comú signat per les comunitats autònomes del Partit Popular.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek PPren EBAU bateratua baztertu dute eta ohartarazi dute autonomia erkidegoen artean «bidegabekeria konparatiboa» sor dezakeela',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinadorak (CREUP) baztertu egin du Alderdi Popularreko autonomia erkidegoek sinatutako Unibertsitatera Sartzeko Batxilergoaren Ebaluazioaren (EBAU) eredu bateratua.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios rexeitan a EBAU común do PP e avisan de que pode xerar un «agravio comparativo» entre CCAA',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) rexeitou o modelo de Avaliación do Bacharelato para o Acceso á Universidade (EBAU) común asinado polas comunidades autónomas do Partido Popular.',
    },
    {
      locale: 'val',
      title:
        "Els universitaris rebutgen l'EBAU comuna del PP i avisen que pot generar un «greuge comparatiu» entre comunitats",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) ha rebutjat el model d'Avaluació del Batxillerat per a l'Accés a la Universitat (EBAU) comú firmat per les comunitats autònomes del Partit Popular.",
    },
  ],
  'creup-y-fundacion-once-firman-acuerdo-para-fomentar-la-inclu-2024-07': [
    {
      locale: 'en',
      title:
        'CREUP and Fundación ONCE sign an agreement to foster the inclusion of students with disabilities on campus',
      description:
        "Fundación ONCE and the Coordinating Body of Student Representatives of Public Universities (CREUP) have signed a collaboration agreement aimed at promoting initiatives that facilitate this group's access to and participation in university life.",
    },
    {
      locale: 'ca',
      title:
        "CREUP i la Fundació ONCE signen un acord per fomentar la inclusió d'estudiants amb discapacitat als campus",
      description:
        "La Fundació ONCE i la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) han signat un conveni de col·laboració amb l'objectiu d'impulsar iniciatives que facilitin l'accés i la participació d'aquest col·lectiu en la vida universitària.",
    },
    {
      locale: 'eu',
      title:
        'CREUPek eta ONCE Fundazioak akordioa sinatu dute campusetan desgaitasuna duten ikasleen inklusioa sustatzeko',
      description:
        'ONCE Fundazioak eta Unibertsitate Publikoetako Ikasle Ordezkarien Koordinadorak (CREUP) lankidetza-hitzarmena sinatu dute, kolektibo horren unibertsitate-bizitzarako sarbidea eta parte-hartzea errazten dituzten ekimenak bultzatzeko helburuarekin.',
    },
    {
      locale: 'gl',
      title:
        'CREUP e a Fundación ONCE asinan un acordo para fomentar a inclusión de estudantes con discapacidade nos campus',
      description:
        'A Fundación ONCE e a Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) asinaron un convenio de colaboración co obxectivo de impulsar iniciativas que faciliten o acceso e a participación deste colectivo na vida universitaria.',
    },
    {
      locale: 'val',
      title:
        "CREUP i la Fundació ONCE firmen un acord per a fomentar la inclusió d'estudiants amb discapacitat en els campus",
      description:
        "La Fundació ONCE i la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) han firmat un conveni de col·laboració amb l'objectiu d'impulsar iniciatives que faciliten l'accés i la participació d'este col·lectiu en la vida universitària.",
    },
  ],
  'las-acampadas-de-los-universitarios-continuan-al-considerar-2024-05': [
    {
      locale: 'en',
      title:
        'University students\' encampments continue as they consider the recognition of Palestine "not enough"',
      description:
        'Several universities have decided to "cut ties" with Israel thanks to student demands. The student organisation CREUP highlights the "inconsistencies" in Israeli universities\' discourse.',
    },
    {
      locale: 'ca',
      title:
        'Les acampades dels universitaris continuen perquè consideren que el reconeixement de Palestina «no és suficient»',
      description:
        "Diverses universitats han decidit «tallar llaços» amb Israel gràcies a les demandes estudiantils. L'organització estudiantil CREUP destaca les «incongruències» en el discurs de les universitats israelianes.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleen kanpaldiek aurrera jarraitzen dute, Palestinaren aitortza «nahikoa ez dela» uste baitute',
      description:
        'Hainbat unibertsitatek Israelekin «harremanak eteteko» erabakia hartu dute ikasleen aldarrikapenei esker. CREUP ikasle-erakundeak Israelgo unibertsitateen diskurtsoko «inkoherentziak» nabarmentzen ditu.',
    },
    {
      locale: 'gl',
      title:
        'As acampadas dos universitarios continúan ao considerar que o recoñecemento de Palestina «non é suficiente»',
      description:
        'Varias universidades decidiron «cortar lazos» con Israel grazas ás demandas estudantís. A organización estudantil CREUP destaca as «incongruencias» no discurso das universidades israelís.',
    },
    {
      locale: 'val',
      title:
        'Les acampades dels universitaris continuen perquè consideren que el reconeixement de Palestina «no és suficient»',
      description:
        "Diverses universitats han decidit «tallar llaços» amb Israel gràcies a les demandes estudiantils. L'organització estudiantil CREUP destaca les «incongruències» en el discurs de les universitats israelianes.",
    },
  ],
  'estudiantes-de-universidades-publicas-instan-al-ministerio-a-2024-05': [
    {
      locale: 'en',
      title:
        'Public university students urge the Ministry to "put an end to any kind of collaboration with Israel"',
      description:
        'The Coordinating Body of Student Representatives of Public Universities (CREUP) urges the Minister of Science, Innovation and Universities, Diana Morant, "to take action to improve the situation of Palestinian university students and to put an end to any kind of collaboration with Israel, particularly within the Spanish University System".',
    },
    {
      locale: 'ca',
      title:
        "Els estudiants d'universitats públiques insten el Ministeri a «posar fi a qualsevol tipus de col·laboració amb Israel»",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) insta la ministra de Ciència, Innovació i Universitats, Diana Morant, «a prendre accions per a la millora de la situació dels estudiants universitaris palestins i a posar fi a qualsevol tipus de col·laboració amb Israel, en particular en el Sistema Universitari Espanyol».",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitate publikoetako ikasleek Ministerioari eskatu diote «Israelekin edozein lankidetza mota amaitzeko»',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinadorak (CREUP) Zientzia, Berrikuntza eta Unibertsitateetako ministroari, Diana Morant, eskatu dio «ikasle palestinarren egoera hobetzeko neurriak hartzeko eta Israelekin edozein lankidetza mota amaitzeko, bereziki Espainiako Unibertsitate Sisteman».',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes de universidades públicas instan o Ministerio a «pór fin a calquera tipo de colaboración con Israel»',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) insta a ministra de Ciencia, Innovación e Universidades, Diana Morant, «a tomar accións pola mellora da situación dos estudantes universitarios palestinos e a pór fin a calquera tipo de colaboración con Israel, en particular no Sistema Universitario Español».',
    },
    {
      locale: 'val',
      title:
        "Els estudiants d'universitats públiques insten el Ministeri a «posar fi a qualsevol tipus de col·laboració amb Israel»",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) insta la ministra de Ciència, Innovació i Universitats, Diana Morant, «a prendre accions per a la millora de la situació dels estudiants universitaris palestins i a posar fi a qualsevol tipus de col·laboració amb Israel, en particular en el Sistema Universitari Espanyol».",
    },
  ],
  'estudiantes-de-universidades-publicas-analizan-en-salamanca-2024-03': [
    {
      locale: 'en',
      title: 'Public university students analyse in Salamanca the rollout of the LOSU',
      description:
        'Public university students and representatives of academic institutions analysed in Salamanca topical issues in the academic sphere, such as the rollout of the Organic Law of the University System (LOSU), the proposals for university entrance examinations, and the scholarship system.',
    },
    {
      locale: 'ca',
      title:
        "Els estudiants d'universitats públiques analitzen a Salamanca el procés d'implantació de la LOSU",
      description:
        "Estudiants d'universitats públiques i representants de les institucions acadèmiques han analitzat a Salamanca temes d'actualitat en l'àmbit acadèmic com ara el procés d'implantació de la Llei Orgànica del Sistema Universitari (LOSU), les propostes per a les proves d'accés a la universitat o el sistema de beques.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitate publikoetako ikasleek LOSUren ezarpen-prozesua aztertu dute Salamancan',
      description:
        'Unibertsitate publikoetako ikasleek eta erakunde akademikoetako ordezkariek arlo akademikoko gaurkotasuneko gaiak aztertu dituzte Salamancan, hala nola Unibertsitate Sistemaren Lege Organikoaren (LOSU) ezarpen-prozesua, unibertsitatera sartzeko probetarako proposamenak edo beken sistema.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes de universidades públicas analizan en Salamanca o proceso de implantación da LOSU',
      description:
        'Estudantes de universidades públicas e representantes das institucións académicas analizaron en Salamanca temas de actualidade no ámbito académico como o proceso de implantación da Lei Orgánica do Sistema Universitario (LOSU), as propostas para as probas de acceso á universidade ou o sistema de bolsas.',
    },
    {
      locale: 'val',
      title:
        "Els estudiants d'universitats públiques analitzen a Salamanca el procés d'implantació de la LOSU",
      description:
        "Estudiants d'universitats públiques i representants de les institucions acadèmiques han analitzat a Salamanca temes d'actualitat en l'àmbit acadèmic com ara el procés d'implantació de la Llei Orgànica del Sistema Universitari (LOSU), les propostes per a les proves d'accés a la universitat o el sistema de beques.",
    },
  ],
  'rectores-vicerrectores-y-representantes-de-estudiantes-unive-2024-03': [
    {
      locale: 'en',
      title: 'Rectors, vice-rectors and university student representatives meet in Salamanca',
      description:
        'The meeting will seek to address issues of interest that directly affect students as a crucial part of the university community.',
    },
    {
      locale: 'ca',
      title:
        "Rectors, vicerectors i representants d'estudiants universitaris es reuneixen a Salamanca",
      description:
        "En la trobada es buscarà abordar els temes d'interès que afecten directament els estudiants com a part crucial de la comunitat universitària.",
    },
    {
      locale: 'eu',
      title:
        'Errektoreak, errektoreordeak eta unibertsitateko ikasleen ordezkariak Salamancan elkartu dira',
      description:
        'Topaketan ikasleei zuzenean eragiten dieten interes-gaiei heltzen saiatuko dira, unibertsitate-komunitatearen funtsezko parte gisa.',
    },
    {
      locale: 'gl',
      title:
        'Reitores, vicerreitores e representantes de estudantes universitarios reúnense en Salamanca',
      description:
        'No encontro buscarase abordar os temas de interese que afectan directamente os estudantes como parte crucial da comunidade universitaria.',
    },
    {
      locale: 'val',
      title:
        "Rectors, vicerectors i representants d'estudiants universitaris es reunixen a Salamanca",
      description:
        "En la trobada es buscarà abordar els temes d'interés que afecten directament els estudiants com a part crucial de la comunitat universitària.",
    },
  ],
  'la-usal-acoge-el-encuentro-entre-la-coordinadora-de-represen-2024-03': [
    {
      locale: 'en',
      title:
        'The USAL hosts the meeting between the Coordinating Body of Student Representatives and the Conference of Rectors',
      description:
        'Ricardo Rivero opened this forum, which brings together students and rectors from all over Spain.',
    },
    {
      locale: 'ca',
      title:
        "La USAL acull la trobada entre la Coordinadora de Representants d'Estudiants i la Conferència de Rectors",
      description:
        'Ricardo Rivero ha inaugurat aquest fòrum, que reuneix estudiants i rectors de tot Espanya.',
    },
    {
      locale: 'eu',
      title:
        'USALek Ikasle Ordezkarien Koordinadoraren eta Errektoreen Konferentziaren arteko topaketa hartu du',
      description:
        'Ricardo Riverok inauguratu du foro hau, Espainia osoko ikasleak eta errektoreak biltzen dituena.',
    },
    {
      locale: 'gl',
      title:
        'A USAL acolle o encontro entre a Coordinadora de Representantes de Estudantes e a Conferencia de Reitores',
      description:
        'Ricardo Rivero inaugurou este foro, que reúne estudantes e reitores de toda España.',
    },
    {
      locale: 'val',
      title:
        "La USAL acull la trobada entre la Coordinadora de Representants d'Estudiants i la Conferència de Rectors",
      description:
        'Ricardo Rivero ha inaugurat este fòrum, que reunix estudiants i rectors de tota Espanya.',
    },
  ],
  'al-estatuto-del-estudiante-universitario-no-le-han-sentado-b-2024-02': [
    {
      locale: 'en',
      title: 'The University Student Statute has not aged well',
      description:
        'We have a new Organic Law of the University System (2023) and a new University Coexistence Law (2022), but we do not have a new "magna carta" for the student body.',
    },
    {
      locale: 'ca',
      title: "A l'Estatut de l'Estudiant Universitari no li han assentat bé els anys",
      description:
        "Tenim una nova Llei Orgànica del Sistema Universitari (2023) i una nova Llei de Convivència Universitària (2022), però no tenim una nova «carta magna» per a l'estudiantat.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitateko Ikaslearen Estatutuari ez zaizkio urteak ondo etorri',
      description:
        'Unibertsitate Sistemaren Lege Organiko berri bat (2023) eta Unibertsitate Bizikidetzaren Lege berri bat (2022) ditugu, baina ez dugu ikasleentzako «karta magna» berririk.',
    },
    {
      locale: 'gl',
      title: 'Ao Estatuto do Estudante Universitario non lle sentaron ben os anos',
      description:
        'Temos unha nova Lei Orgánica do Sistema Universitario (2023) e unha nova Lei de Convivencia Universitaria (2022), pero non temos unha nova «carta magna» para o estudantado.',
    },
    {
      locale: 'val',
      title: "A l'Estatut de l'Estudiant Universitari no li han assentat bé els anys",
      description:
        "Tenim una nova Llei Orgànica del Sistema Universitari (2023) i una nova Llei de Convivència Universitària (2022), però no tenim una nova «carta magna» per a l'estudiantat.",
    },
  ],
  'las-universidades-privadas-a-punto-de-superar-a-las-publicas-2024-02': [
    {
      locale: 'en',
      title:
        'Private universities, about to overtake public ones: in 25 years, 27 private campuses have been created and not a single public one',
      description:
        'Over the past 25 years, 27 private universities and not a single public one have been created in Spain, a trend that reflects the changing university map and worries various players in the education system.',
    },
    {
      locale: 'ca',
      title:
        "Les universitats privades, a punt de superar les públiques: en 25 anys s'han creat 27 campus privats i cap de públic",
      description:
        "En els últims 25 anys s'han creat a Espanya 27 universitats privades i cap de pública, una tendència que reflecteix el canvi en el mapa universitari i que preocupa diferents actors del sistema educatiu.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitate pribatuak, publikoak gainditzeko zorian: 25 urtean 27 campus pribatu sortu dira eta bat ere ez publikoa',
      description:
        'Azken 25 urteetan Espainian 27 unibertsitate pribatu sortu dira eta bat ere ez publikoa, unibertsitate-mapako aldaketa islatzen duen joera bat, hezkuntza-sistemako eragile ezberdinak kezkatzen dituena.',
    },
    {
      locale: 'gl',
      title:
        'As universidades privadas, a piques de superar as públicas: en 25 anos creáronse 27 campus privados e ningún público',
      description:
        'Nos últimos 25 anos creáronse en España 27 universidades privadas e ningunha pública, unha tendencia que reflicte o cambio no mapa universitario e preocupa distintos actores do sistema educativo.',
    },
    {
      locale: 'val',
      title:
        "Les universitats privades, a punt de superar les públiques: en 25 anys s'han creat 27 campus privats i cap de públic",
      description:
        "En els últims 25 anys s'han creat a Espanya 27 universitats privades i cap de pública, una tendència que reflectix el canvi en el mapa universitari i que preocupa diferents actors del sistema educatiu.",
    },
  ],
  'la-losu-se-aprobo-sin-tener-en-cuenta-las-necesidades-y-cons-2024-01': [
    {
      locale: 'en',
      title:
        'The LOSU was passed without taking into account the current needs and considerations of the student body',
      description:
        'Academic programmes do not provide for a real balance, either between academic and working life or between academic and personal life. At CREUP, through our draft of the new University Student Statute, we put forward measures aimed at facilitating an academic life that does not require giving up everything else.',
    },
    {
      locale: 'ca',
      title:
        "La LOSU es va aprovar sense tenir en compte les necessitats i les consideracions actuals de l'estudiantat",
      description:
        "Els programes acadèmics no preveuen una conciliació real ni entre la vida acadèmica i la laboral ni entre l'acadèmica i la personal. Des de la CREUP presentem, a través del nostre esborrany del nou Estatut de l'Estudiant Universitari, mesures encaminades a facilitar una vida acadèmica que no suposi haver de renunciar a tota la resta.",
    },
    {
      locale: 'eu',
      title:
        'LOSU ikasleen gaur egungo beharrak eta kontuan hartu beharrekoak aintzat hartu gabe onartu zen',
      description:
        'Programa akademikoek ez dute benetako kontziliaziorik aurreikusten, ez bizitza akademikoaren eta lanekoaren artean, ezta akademikoaren eta pertsonalaren artean ere. CREUPetik, Unibertsitateko Ikaslearen Estatutu berriaren gure zirriborroaren bidez, dena alde batera utzi beharrik gabeko bizitza akademikoa errazteko neurriak aurkezten ditugu.',
    },
    {
      locale: 'gl',
      title:
        'A LOSU aprobouse sen ter en conta as necesidades e consideracións actuais do estudantado',
      description:
        'Os programas académicos non contemplan unha conciliación real nin entre a vida académica e a laboral nin entre a académica e a persoal. Desde a CREUP presentamos, a través do noso borrador do novo Estatuto do Estudante Universitario, medidas encamiñadas a facilitar unha vida académica que non supoña ter que renunciar a todo o demais.',
    },
    {
      locale: 'val',
      title:
        "La LOSU es va aprovar sense tindre en compte les necessitats i les consideracions actuals de l'estudiantat",
      description:
        "Els programes acadèmics no preveuen una conciliació real ni entre la vida acadèmica i la laboral ni entre l'acadèmica i la personal. Des de la CREUP presentem, a través del nostre esborrany del nou Estatut de l'Estudiant Universitari, mesures encaminades a facilitar una vida acadèmica que no supose haver de renunciar a tota la resta.",
    },
  ],
  'por-un-estatuto-del-estudiante-universitario-adecuado-a-la-r-2024-01': [
    {
      locale: 'en',
      title: "For a University Student Statute suited to today's reality",
      description:
        'At the Coordinating Body of Student Representatives of Public Universities (CREUP) we produced an Executive Report for drawing up a new University Student Statute, which was approved unanimously at the 72nd Ordinary General Assembly.',
    },
    {
      locale: 'ca',
      title: "Per un Estatut de l'Estudiant Universitari adequat a la realitat actual",
      description:
        "Des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) vam elaborar un Informe Executiu per a l'elaboració d'un nou Estatut de l'Estudiant Universitari que es va aprovar per unanimitat a la 72a Assemblea General Ordinària.",
    },
    {
      locale: 'eu',
      title: 'Gaur egungo errealitatera egokitutako Unibertsitateko Ikaslearen Estatutu baten alde',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinadoratik (CREUP) Txosten Exekutibo bat egin genuen Unibertsitateko Ikaslearen Estatutu berri bat lantzeko, eta aho batez onartu zen 72. Ohiko Batzar Nagusian.',
    },
    {
      locale: 'gl',
      title: 'Por un Estatuto do Estudante Universitario adecuado á realidade actual',
      description:
        'Desde a Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) realizamos un Informe Executivo para a elaboración dun novo Estatuto do Estudante Universitario que se aprobou por unanimidade na 72.ª Asemblea Xeral Ordinaria.',
    },
    {
      locale: 'val',
      title: "Per un Estatut de l'Estudiant Universitari adequat a la realitat actual",
      description:
        "Des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) vam elaborar un Informe Executiu per a l'elaboració d'un nou Estatut de l'Estudiant Universitari que es va aprovar per unanimitat en la 72a Assemblea General Ordinària.",
    },
  ],
  'universitarios-exigen-renovar-el-estatuto-del-estudiante-e-i-2023-12': [
    {
      locale: 'en',
      title:
        'University students demand the renewal of the Student Statute and the inclusion of new rights, 13 years after its approval',
      description:
        'The Coordinating Body of Student Representatives of Public Universities (CREUP) demands the renewal of the University Student Statute since, 13 years after its approval, it "has become completely outdated, especially after the LOSU came into force".',
    },
    {
      locale: 'ca',
      title:
        "Els universitaris exigeixen renovar l'Estatut de l'Estudiant i incloure-hi nous drets 13 anys després de la seva aprovació",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) exigeix que es renovi l'Estatut de l'Estudiant Universitari ja que, 13 anys després de la seva aprovació, «ha quedat totalment desactualitzat, especialment després de l'entrada en vigor de la LOSU».",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek Ikaslearen Estatutua berritzea eta eskubide berriak sartzea eskatzen dute, onartu zenetik 13 urtera',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinadorak (CREUP) eskatzen du Unibertsitateko Ikaslearen Estatutua berritzeko, izan ere, onartu zenetik 13 urtera «erabat zaharkituta geratu da, batez ere LOSU indarrean sartu ondoren».',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios esixen renovar o Estatuto do Estudante e incluír novos dereitos 13 anos despois da súa aprobación',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) esixe que se renove o Estatuto do Estudante Universitario xa que, 13 anos despois da súa aprobación, «quedou totalmente desactualizado, especialmente despois da entrada en vigor da LOSU».',
    },
    {
      locale: 'val',
      title:
        "Els universitaris exigixen renovar l'Estatut de l'Estudiant i incloure-hi nous drets 13 anys després de la seua aprovació",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) exigix que es renove l'Estatut de l'Estudiant Universitari ja que, 13 anys després de la seua aprovació, «ha quedat totalment desactualitzat, especialment després de l'entrada en vigor de la LOSU».",
    },
  ],
  'puede-que-el-dinero-no-de-la-felicidad-pero-es-lo-que-la-edu-2023-12': [
    {
      locale: 'en',
      title: 'Money may not buy happiness, but it is what university education needs',
      description:
        'Funding for public universities remains far below what is needed to move towards quality higher education.',
    },
    {
      locale: 'ca',
      title:
        "Pot ser que els diners no donin la felicitat, però són el que necessita l'educació universitària",
      description:
        'El finançament de les universitats públiques continua estant molt per sota del desitjable per avançar cap a una educació superior de qualitat.',
    },
    {
      locale: 'eu',
      title:
        'Baliteke diruak zoriontasuna ez ematea, baina hori da unibertsitate-hezkuntzak behar duena',
      description:
        'Unibertsitate publikoen finantzaketak desiragarria baino askoz beherago jarraitzen du, kalitatezko goi-mailako hezkuntzarantz aurrera egiteko.',
    },
    {
      locale: 'gl',
      title:
        'Pode que o diñeiro non dea a felicidade, pero é o que necesita a educación universitaria',
      description:
        'O financiamento das universidades públicas segue estando moi por debaixo do desexable para avanzar cara a unha educación superior de calidade.',
    },
    {
      locale: 'val',
      title:
        "Pot ser que els diners no donen la felicitat, però són el que necessita l'educació universitària",
      description:
        'El finançament de les universitats públiques continua estant molt per davall del desitjable per a avançar cap a una educació superior de qualitat.',
    },
  ],
  'estudiantes-piden-a-morant-nueva-responsable-de-universidade-2023-11': [
    {
      locale: 'en',
      title:
        'Students ask Morant, the new head of Universities, for “more commitment and dialogue” than in the last term',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP) hopes that “the same mistakes will not be repeated” as in the last term and that there will be a commitment to dialogue and negotiation, including with students.',
    },
    {
      locale: 'ca',
      title:
        "Els estudiants demanen a Morant, nova responsable d'Universitats, «més compromís i diàleg» que en la passada legislatura",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) espera que «no es tornin a repetir els mateixos errors» de la passada legislatura i que s'aposti pel diàleg i la negociació, també amb l'estudiantat.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek Moranti, Unibertsitateetako arduradun berriari, «konpromiso eta elkarrizketa handiagoa» eskatu diote aurreko legealdian baino',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak (CREUP) espero du «aurreko legealdiko akats berberak ez direla berriz errepikatuko» eta elkarrizketaren eta negoziazioaren alde egingo dela, ikasleekin ere bai.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes piden a Morant, nova responsable de Universidades, «máis compromiso e diálogo» que na pasada lexislatura',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) espera que «non se volvan repetir os mesmos erros» da pasada lexislatura e que se aposte polo diálogo e a negociación, tamén co estudantado.',
    },
    {
      locale: 'val',
      title:
        "Els estudiants demanen a Morant, nova responsable d'Universitats, «més compromís i diàleg» que en la passada legislatura",
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) espera que «no es tornen a repetir els mateixos errors» de la passada legislatura i que s'aposte pel diàleg i la negociació, també amb l'estudiantat.",
    },
  ],
  'estudiantes-universitarios-denuncian-la-situacion-insostenib-2023-11': [
    {
      locale: 'en',
      title:
        'University students denounce the “unsustainable” situation of the most disadvantaged applicants for Government scholarships',
      description:
        'The Coordinator of Student Representatives of Public Universities (CREUP) denounced the “unsustainable” situation faced by the most disadvantaged students, applicants for scholarships from the Ministry of Education and Vocational Training, and the increase in penalties and financial interest applied for repaying them.',
    },
    {
      locale: 'ca',
      title:
        'Els estudiants universitaris denuncien la situació «insostenible» dels sol·licitants més desfavorits de les beques del Govern',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) va denunciar la situació «insostenible» que viuen els estudiants més desfavorits, sol·licitants de beques del Ministeri d'Educació i Formació Professional, i l'augment de penalitzacions i interessos econòmics que s'apliquen pel reintegrament d'aquestes.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek Gobernuaren beken eskatzaile behartsuenen egoera «jasanezina» salatu dute',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzaileak (CREUP) ikasle behartsuenek, Hezkuntza eta Lanbide Heziketako Ministerioaren beken eskatzaileek, bizi duten egoera «jasanezina» salatu zuen, baita bekak itzultzeagatik ezartzen diren zigorren eta interes ekonomikoen igoera ere.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes universitarios denuncian a situación «insostible» dos solicitantes máis desfavorecidos das bolsas do Goberno',
      description:
        'A Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) denunciou a situación «insostible» que viven os estudantes máis desfavorecidos, solicitantes de bolsas do Ministerio de Educación e Formación Profesional, e o aumento de penalizacións e intereses económicos que se aplican polo reintegro destas.',
    },
    {
      locale: 'val',
      title:
        'Els estudiants universitaris denuncien la situació «insostenible» dels sol·licitants més desfavorits de les beques del Govern',
      description:
        "La Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) va denunciar la situació «insostenible» que viuen els estudiants més desfavorits, sol·licitants de beques del Ministeri d'Educació i Formació Professional, i l'augment de penalitzacions i interessos econòmics que s'apliquen pel reintegrament d'estes.",
    },
  ],
  'espana-acogera-en-zaragoza-la-46-edicion-de-la-european-stud-2023-09-2': [
    {
      locale: 'en',
      title: 'Spain will host the 46th edition of the European Student Convention in Zaragoza',
      description:
        "This month CREUP will hold an event in the Aragonese capital bringing together university students from more than 27 countries that make up the European Students' Union, the leading student representation body at European level.",
    },
    {
      locale: 'ca',
      title: 'Espanya acollirà a Saragossa la 46a edició de la European Student Convention',
      description:
        "La CREUP celebrarà aquest mes a la capital aragonesa un esdeveniment que congregarà els universitaris de més de 27 països que formen part de la European Students' Union, el principal òrgan de representació estudiantil a nivell europeu.",
    },
    {
      locale: 'eu',
      title: 'Espainiak Zaragozan hartuko du European Student Convention-en 46. edizioa',
      description:
        "CREUPek hilabete honetan Aragoiko hiriburuan ospatuko du Europako Ikasleen Batasuna (European Students' Union) osatzen duten 27 herrialde baino gehiagotako unibertsitarioak bilduko dituen ekitaldia; hori da Europa mailako ikasleen ordezkaritza-organo nagusia.",
    },
    {
      locale: 'gl',
      title: 'España acollerá en Zaragoza a 46ª edición da European Student Convention',
      description:
        "A CREUP celebrará este mes na capital aragonesa un evento que congregará os universitarios de máis de 27 países que forman parte da European Students' Union, o principal órgano de representación estudantil a nivel europeo.",
    },
    {
      locale: 'val',
      title: 'Espanya acollirà a Saragossa la 46a edició de la European Student Convention',
      description:
        "La CREUP celebrarà este mes en la capital aragonesa un esdeveniment que congregarà els universitaris de més de 27 països que formen part de la European Students' Union, el principal òrgan de representació estudiantil a nivell europeu.",
    },
  ],
  'estudiantes-de-creup-condenan-los-mensajes-machistas-en-un-c-2023-09': [
    {
      locale: 'en',
      title: 'CREUP students condemn the sexist messages in a hazing chat',
      description:
        'The university students grouped in the Coordinator of Student Representatives of Public Universities (CREUP) rejected the “intolerable” messages from a WhatsApp group of the Teaching degree at the University of La Rioja.',
    },
    {
      locale: 'ca',
      title: 'Estudiants de CREUP condemnen els missatges masclistes en un xat de novatades',
      description:
        "Els estudiants universitaris agrupats en la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) van rebutjar els missatges «intolerables» d'un grup de WhatsApp de Magisteri de la Universitat de La Rioja.",
    },
    {
      locale: 'eu',
      title: 'CREUPeko ikasleek nobatada-txat bateko mezu matxistak gaitzetsi dituzte',
      description:
        'Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzailean (CREUP) bildutako unibertsitateko ikasleek La Riojako Unibertsitateko Magisteritzako WhatsApp talde bateko mezu «jasanezinak» gaitzetsi zituzten.',
    },
    {
      locale: 'gl',
      title: 'Estudantes de CREUP condenan as mensaxes machistas nunha conversa de novatadas',
      description:
        'Os estudantes universitarios agrupados na Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP) rexeitaron as mensaxes «intolerables» dun grupo de WhatsApp de Maxisterio da Universidade de La Rioja.',
    },
    {
      locale: 'val',
      title: 'Estudiants de CREUP condemnen els missatges masclistes en un xat de novatades',
      description:
        "Els estudiants universitaris arreplegats en la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP) rebutjaren els missatges «intolerables» d'un grup de WhatsApp de Magisteri de la Universitat de La Rioja.",
    },
  ],
  'la-precariedad-es-joven-los-becarios-trabajamos-como-una-per-2023-02': [
    {
      locale: 'en',
      title: 'Precarity is young: “We interns work like any other person”',
      description:
        "The Minister of Labour, Yolanda Díaz, announced “good news” about the Intern Statute in a context marked by students' complaints over the precarity of internships.",
    },
    {
      locale: 'ca',
      title: 'La precarietat és jove: «Els becaris treballem com una persona més»',
      description:
        "La ministra de Treball, Yolanda Díaz, va avançar «bones notícies» sobre l'Estatut del Becari en un context marcat per les queixes de l'estudiantat per la precarietat de les pràctiques.",
    },
    {
      locale: 'eu',
      title: 'Prekarietatea gaztea da: «Bekadunok beste pertsona bat bezala lan egiten dugu»',
      description:
        'Yolanda Díaz Lan ministroak «berri onak» aurreratu zituen Bekadunaren Estatutuari buruz, praktiken prekarietateagatik ikasleek egindako kexek markatutako testuinguru batean.',
    },
    {
      locale: 'gl',
      title: 'A precariedade é nova: «Os bolseiros traballamos como unha persoa máis»',
      description:
        'A ministra de Traballo, Yolanda Díaz, avanzou «boas novas» sobre o Estatuto do Bolseiro nun contexto marcado polas queixas do estudantado pola precariedade das prácticas.',
    },
    {
      locale: 'val',
      title: 'La precarietat és jove: «Els becaris treballem com una persona més»',
      description:
        "La ministra de Treball, Yolanda Díaz, avançà «bones notícies» sobre l'Estatut del Becari en un context marcat per les queixes de l'estudiantat per la precarietat de les pràctiques.",
    },
  ],
  'discriminacion-por-racismo-homofobia-o-edadismo-el-reto-de-a-2023-02': [
    {
      locale: 'en',
      title:
        'Discrimination through racism, homophobia or ageism: the challenge of renting decent housing',
      description:
        'Vulnerable groups such as single mothers and ethnic minorities report difficulties in finding a home, in a context where young and older people also suffer age discrimination when renting.',
    },
    {
      locale: 'ca',
      title:
        'Discriminació per racisme, homofòbia o edatisme: el repte de llogar un habitatge digne',
      description:
        "Grups vulnerables com les mares solteres i les minories ètniques denuncien dificultats a l'hora d'aconseguir una llar, en un context en què joves i grans també pateixen discriminació per edat en llogar.",
    },
    {
      locale: 'eu',
      title:
        'Arrazakeria, homofobia edo adinkeriagatiko diskriminazioa: etxebizitza duin bat alokatzeko erronka',
      description:
        'Talde ahulek, hala nola ama ezkongabeek eta gutxiengo etnikoek, etxe bat lortzeko zailtasunak salatzen dituzte, gazteek nahiz adinekoek ere alokatzean adinagatiko diskriminazioa jasaten duten testuinguru batean.',
    },
    {
      locale: 'gl',
      title:
        'Discriminación por racismo, homofobia ou idadismo: o reto de alugar unha vivenda digna',
      description:
        'Grupos vulnerables como as nais solteiras e as minorías étnicas denuncian dificultades á hora de conseguir un fogar, nun contexto no que mozos e maiores tamén sofren discriminación por idade ao alugar.',
    },
    {
      locale: 'val',
      title:
        'Discriminació per racisme, homofòbia o edatisme: el repte de llogar una vivenda digna',
      description:
        "Grups vulnerables com les mares fadrines i les minories ètniques denuncien dificultats a l'hora d'aconseguir una llar, en un context en què jóvens i majors també patixen discriminació per edat en llogar.",
    },
  ],
  'creup-alerta-de-la-bajada-continua-de-las-matriculas-univers-2023-02': [
    {
      locale: 'en',
      title: 'CREUP warns of the continuous drop in university enrolments',
      description:
        '“University enrolments are falling and the problems continue,” say the Coordinator of Student Representatives of Public Universities (CREUP).',
    },
    {
      locale: 'ca',
      title: 'CREUP alerta de la baixada contínua de les matrícules universitàries',
      description:
        "«Baixen les matrícules universitàries i els problemes continuen», assenyalen des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP).",
    },
    {
      locale: 'eu',
      title: 'CREUPek unibertsitateko matrikulen etengabeko jaitsieraz ohartarazi du',
      description:
        '«Unibertsitateko matrikulak jaisten ari dira eta arazoek bere horretan jarraitzen dute», adierazi dute Unibertsitate Publikoetako Ikasle Ordezkarien Koordinatzailetik (CREUP).',
    },
    {
      locale: 'gl',
      title: 'CREUP alerta da baixada continua das matrículas universitarias',
      description:
        '«Baixan as matrículas universitarias e os problemas continúan», sinalan desde a Coordinadora de Representantes de Estudantes de Universidades Públicas (CREUP).',
    },
    {
      locale: 'val',
      title: 'CREUP alerta de la baixada contínua de les matrícules universitàries',
      description:
        "«Baixen les matrícules universitàries i els problemes continuen», indiquen des de la Coordinadora de Representants d'Estudiants d'Universitats Públiques (CREUP).",
    },
  ],
  'los-universitarios-denuncian-que-el-estatuto-del-becario-es-2023-02': [
    {
      locale: 'en',
      title: 'University students denounce that the Intern Statute “is a fraud”',
      description:
        'CREUP denounces that the Intern Statute did not involve student collectives and calls for a proposal that tackles fraudulent practices and guarantees quality training.',
    },
    {
      locale: 'ca',
      title: "Els universitaris denuncien que l'Estatut del Becari «és un frau»",
      description:
        "CREUP denuncia que l'Estatut del Becari no ha comptat amb els col·lectius estudiantils i reclama una proposta que combati les pràctiques fraudulentes i garanteixi una formació de qualitat.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitarioek Bekadunaren Estatutua «iruzur bat» dela salatu dute',
      description:
        'CREUPek salatzen du Bekadunaren Estatutuak ez dituela ikasle-kolektiboak kontuan hartu, eta praktika iruzurtiei aurre egingo dien eta kalitatezko prestakuntza bermatuko duen proposamen bat eskatzen du.',
    },
    {
      locale: 'gl',
      title: 'Os universitarios denuncian que o Estatuto do Bolseiro «é unha fraude»',
      description:
        'CREUP denuncia que o Estatuto do Bolseiro non contou cos colectivos estudantís e reclama unha proposta que combata as prácticas fraudulentas e garanta unha formación de calidade.',
    },
    {
      locale: 'val',
      title: "Els universitaris denuncien que l'Estatut del Becari «és un frau»",
      description:
        "CREUP denuncia que l'Estatut del Becari no ha comptat amb els col·lectius estudiantils i reclama una proposta que combata les pràctiques fraudulentes i garantisca una formació de qualitat.",
    },
  ],
  'los-universitarios-denuncian-que-el-estatuto-del-becario-es-2023-02-2': [
    {
      locale: 'en',
      title: 'University students denounce that the Intern Statute “is a fraud”',
      description:
        "CREUP maintains that the Intern Statute has fallen short of students' expectations and calls for the reform to put those doing internships at the centre.",
    },
    {
      locale: 'ca',
      title: "Els universitaris denuncien que l'Estatut del Becari «és un frau»",
      description:
        "CREUP sosté que l'Estatut del Becari ha defraudat les expectatives de l'estudiantat i reclama que la reforma posi al centre qui fa pràctiques.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitarioek Bekadunaren Estatutua «iruzur bat» dela salatu dute',
      description:
        'CREUPek dio Bekadunaren Estatutuak ikasleen itxaropenak hutsalduta utzi dituela, eta erreformak praktikak egiten dituztenak erdigunean jartzea eskatzen du.',
    },
    {
      locale: 'gl',
      title: 'Os universitarios denuncian que o Estatuto do Bolseiro «é unha fraude»',
      description:
        'CREUP sostén que o Estatuto do Bolseiro defraudou as expectativas do estudantado e reclama que a reforma poña no centro a quen realiza prácticas.',
    },
    {
      locale: 'val',
      title: "Els universitaris denuncien que l'Estatut del Becari «és un frau»",
      description:
        "CREUP sosté que l'Estatut del Becari ha defraudat les expectatives de l'estudiantat i reclama que la reforma pose en el centre qui fa pràctiques.",
    },
  ],
  'las-tardes-de-rne-primera-hora-150223-2023-02': [
    {
      locale: 'en',
      title: 'Las tardes de RNE: first hour - 15/02/23',
      description:
        'Episode of Las tardes de RNE broadcast on 15 February 2023, with a review of current affairs and analysis and outreach segments.',
    },
    {
      locale: 'ca',
      title: 'Las tardes de RNE: primera hora - 15/02/23',
      description:
        "Programa de Las tardes de RNE emès el 15 de febrer de 2023, amb repàs de l'actualitat i seccions d'anàlisi i divulgació.",
    },
    {
      locale: 'eu',
      title: 'Las tardes de RNE: lehen ordua - 23/02/15',
      description:
        '2023ko otsailaren 15ean emititutako Las tardes de RNE saioa, gaurkotasunaren errepasoarekin eta analisi eta dibulgazio atalekin.',
    },
    {
      locale: 'gl',
      title: 'Las tardes de RNE: primeira hora - 15/02/23',
      description:
        'Programa de Las tardes de RNE emitido o 15 de febreiro de 2023, con repaso da actualidade e seccións de análise e divulgación.',
    },
    {
      locale: 'val',
      title: 'Las tardes de RNE: primera hora - 15/02/23',
      description:
        "Programa de Las tardes de RNE emés el 15 de febrer de 2023, amb repàs de l'actualitat i seccions d'anàlisi i divulgació.",
    },
  ],
  'los-rectores-catalanes-quieren-que-pague-igual-un-estudiante-2023-02': [
    {
      locale: 'en',
      title: 'Catalan rectors want an engineering student to pay the same as a history student',
      description:
        'The ACUP advocates removing barriers to accessing degrees and supports a single price for university enrolment, regardless of the field of study.',
    },
    {
      locale: 'ca',
      title:
        "Els rectors catalans volen que pagui igual un estudiant d'enginyeria que un d'història",
      description:
        "L'ACUP defensa eliminar barreres en l'accés als graus i dóna suport a un preu únic en les matrícules universitàries, independentment de l'especialitat.",
    },
    {
      locale: 'eu',
      title:
        'Errektore katalanek nahi dute ingeniaritzako ikasle batek historiako batek adina ordaintzea',
      description:
        'ACUPek graduetarako sarbidean oztopoak ezabatzea defendatzen du, eta unibertsitateko matrikuletan prezio bakarra babesten du, espezialitatea edozein dela ere.',
    },
    {
      locale: 'gl',
      title:
        'Os reitores cataláns queren que pague igual un estudante de enxeñaría que un de historia',
      description:
        'A ACUP defende eliminar barreiras no acceso aos graos e apoia un prezo único nas matrículas universitarias, independentemente da especialidade.',
    },
    {
      locale: 'val',
      title:
        "Els rectors catalans volen que pague igual un estudiant d'enginyeria que un d'història",
      description:
        "L'ACUP defén eliminar barreres en l'accés als graus i dóna suport a un preu únic en les matrícules universitàries, independentment de l'especialitat.",
    },
  ],
  'los-universitarios-denuncian-el-castigo-economico-por-suspen-2023-02': [
    {
      locale: 'en',
      title: 'University students denounce the “financial punishment” for failing',
      description:
        'CREUP denounces the increase in costs for second and subsequent enrolments and warns that these penalties can push students without resources out of university.',
    },
    {
      locale: 'ca',
      title: 'Els universitaris denuncien el «càstig econòmic» per suspendre',
      description:
        "CREUP denuncia l'increment de costos per segones i successives matrícules i adverteix que aquestes penalitzacions poden expulsar de la universitat estudiants sense recursos.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitarioek gainditu ezagatik jasaten duten «zigor ekonomikoa» salatu dute',
      description:
        'CREUPek bigarren eta hurrengo matrikulen kostuen igoera salatzen du, eta ohartarazten du zigor horiek baliabiderik gabeko ikasleak unibertsitatetik kanpora ditzaketela.',
    },
    {
      locale: 'gl',
      title: 'Os universitarios denuncian o «castigo económico» por suspender',
      description:
        'CREUP denuncia o incremento de custos por segundas e sucesivas matrículas e advirte de que estas penalizacións poden expulsar da universidade a estudantes sen recursos.',
    },
    {
      locale: 'val',
      title: 'Els universitaris denuncien el «càstig econòmic» per suspendre',
      description:
        "CREUP denuncia l'increment de costos per segones i successives matrícules i advertix que estes penalitzacions poden expulsar de la universitat estudiants sense recursos.",
    },
  ],
  'alumnos-de-universidades-publicas-critican-la-politica-de-pr-2023-02': [
    {
      locale: 'en',
      title:
        'Public university students criticise the “unbalanced enrolment pricing policy” with “high” costs',
      description:
        'CREUP criticises that public enrolment prices remain high and unequal across territories, which keeps economic barriers to accessing university in place.',
    },
    {
      locale: 'ca',
      title:
        "Alumnes d'universitats públiques critiquen la «política de preus de matrícula desequilibrats» amb costos «elevats»",
      description:
        "CREUP critica que els preus públics de matrícula continuïn sent elevats i desiguals entre territoris, cosa que manté barreres econòmiques d'accés a la universitat.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitate publikoetako ikasleek matrikula-prezioen «politika desorekatua» kritikatu dute kostu «altuekin»',
      description:
        'CREUPek kritikatzen du matrikularen prezio publikoek altu eta lurraldeen artean desberdin izaten jarraitzen dutela, eta horrek unibertsitatera sartzeko oztopo ekonomikoei eusten diela.',
    },
    {
      locale: 'gl',
      title:
        'Alumnos de universidades públicas critican a «política de prezos de matrícula desequilibrados» con custos «elevados»',
      description:
        'CREUP critica que os prezos públicos de matrícula sigan sendo elevados e desiguais entre territorios, o que mantén barreiras económicas de acceso á universidade.',
    },
    {
      locale: 'val',
      title:
        "Alumnes d'universitats públiques critiquen la «política de preus de matrícula desequilibrats» amb costos «elevats»",
      description:
        "CREUP critica que els preus públics de matrícula continuen sent elevats i desiguals entre territoris, cosa que manté barreres econòmiques d'accés a la universitat.",
    },
  ],
  'alumnos-de-universidades-publicas-critican-la-politica-de-pr-2023-02-2': [
    {
      locale: 'en',
      title:
        'Public university students criticise the “unbalanced enrolment pricing policy” with “high” costs',
      description:
        'CREUP denounces that the cost of university enrolment remains an obstacle for students and that significant differences between autonomous communities persist.',
    },
    {
      locale: 'ca',
      title:
        "Alumnes d'universitats públiques critiquen la «política de preus de matrícula desequilibrats» amb costos «elevats»",
      description:
        "CREUP denuncia que el cost de les matrícules universitàries continua sent un obstacle per a l'estudiantat i que persisteixen diferències rellevants entre comunitats autònomes.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitate publikoetako ikasleek matrikula-prezioen «politika desorekatua» kritikatu dute kostu «altuekin»',
      description:
        'CREUPek salatzen du unibertsitateko matrikulen kostuak ikasleentzat oztopo izaten jarraitzen duela eta autonomia-erkidegoen artean alde nabarmenak irauten dutela.',
    },
    {
      locale: 'gl',
      title:
        'Alumnos de universidades públicas critican a «política de prezos de matrícula desequilibrados» con custos «elevados»',
      description:
        'CREUP denuncia que o custo das matrículas universitarias segue sendo un obstáculo para o estudantado e que persisten diferenzas relevantes entre comunidades autónomas.',
    },
    {
      locale: 'val',
      title:
        "Alumnes d'universitats públiques critiquen la «política de preus de matrícula desequilibrats» amb costos «elevats»",
      description:
        "CREUP denuncia que el cost de les matrícules universitàries continua sent un obstacle per a l'estudiantat i que persistixen diferències rellevants entre comunitats autònomes.",
    },
  ],
  'estatuto-del-estudiante-en-practicas-telediario-15-horas-020-2023-01': [
    {
      locale: 'en',
      title: 'Student Internship Statute – Telediario – 15:00 – 02/01/23',
      description:
        "The 3 p.m. edition of the Telediario on 2 January 2023, RTVE's national and international news programme.",
    },
    {
      locale: 'ca',
      title: "Estatut de l'Estudiant en Pràctiques – Telediario – 15 hores – 02/01/23",
      description:
        'Edició del Telediario de les 15 hores del 2 de gener de 2023, espai informatiu nacional i internacional de RTVE.',
    },
    {
      locale: 'eu',
      title: 'Praktiketako Ikaslearen Estatutua – Telediario – 15:00 – 23/01/02',
      description:
        '2023ko urtarrilaren 2ko 15:00etako Telediario edizioa, RTVEren nazio eta nazioarteko albistegia.',
    },
    {
      locale: 'gl',
      title: 'Estatuto do Estudante en Prácticas – Telediario – 15 horas – 02/01/23',
      description:
        'Edición do Telediario das 15 horas do 2 de xaneiro de 2023, espazo informativo nacional e internacional de RTVE.',
    },
    {
      locale: 'val',
      title: "Estatut de l'Estudiant en Pràctiques – Telediario – 15 hores – 02/01/23",
      description:
        'Edició del Telediario emesa a les 15 hores del 2 de gener de 2023, espai informatiu nacional i internacional de RTVE.',
    },
  ],
  'exigen-cambios-urgentes-en-la-ley-organica-del-sistema-unive-2022-12': [
    {
      locale: 'en',
      title: 'They demand “urgent changes” to the Organic Law of the University System (LOSU)',
      description:
        "CREUP denounces that the LOSU ignores students' problems and calls for greater participation in governing bodies and improvements in the quality of degrees.",
    },
    {
      locale: 'ca',
      title: 'Exigeixen «canvis urgents» en la Llei Orgànica del Sistema Universitari (LOSU)',
      description:
        "CREUP denuncia que la LOSU ignora els problemes de l'estudiantat i reclama més participació en els òrgans de govern i millores en la qualitat de les titulacions.",
    },
    {
      locale: 'eu',
      title:
        '«Aldaketa premiazkoak» eskatu dituzte Unibertsitate Sistemaren Lege Organikoan (LOSU)',
      description:
        'CREUPek salatzen du LOSUk ikasleen arazoak alde batera uzten dituela, eta gobernu-organoetan parte-hartze handiagoa eta titulazioen kalitatean hobekuntzak eskatzen ditu.',
    },
    {
      locale: 'gl',
      title: 'Esixen «cambios urxentes» na Lei Orgánica do Sistema Universitario (LOSU)',
      description:
        'CREUP denuncia que a LOSU ignora os problemas do estudantado e reclama máis participación nos órganos de goberno e melloras na calidade das titulacións.',
    },
    {
      locale: 'val',
      title: 'Exigixen «canvis urgents» en la Llei Orgànica del Sistema Universitari (LOSU)',
      description:
        "CREUP denuncia que la LOSU ignora els problemes de l'estudiantat i reclama més participació en els òrgans de govern i millores en la qualitat de les titulacions.",
    },
  ],
  'los-universitarios-se-sienten-los-grandes-perjudicados-en-la-2022-12': [
    {
      locale: 'en',
      title: 'University students feel they are the “big losers” in the LOSU',
      description:
        "CREUP warns that the LOSU does not respond to students' needs and calls for changes before the vote on the amendments.",
    },
    {
      locale: 'ca',
      title: 'Els universitaris se senten els «grans perjudicats» en la LOSU',
      description:
        "CREUP adverteix que la LOSU no respon a les necessitats de l'estudiantat i reclama canvis abans de la votació de les esmenes.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitarioek LOSUn «kaltetu nagusi» direla sentitzen dute',
      description:
        'CREUPek ohartarazten du LOSUk ez diela ikasleen beharrei erantzuten, eta aldaketak eskatzen ditu zuzenketen bozketaren aurretik.',
    },
    {
      locale: 'gl',
      title: 'Os universitarios séntense os «grandes prexudicados» na LOSU',
      description:
        'CREUP advirte de que a LOSU non responde ás necesidades do estudantado e reclama cambios antes da votación das emendas.',
    },
    {
      locale: 'val',
      title: 'Els universitaris se senten els «grans perjudicats» en la LOSU',
      description:
        "CREUP advertix que la LOSU no respon a les necessitats de l'estudiantat i reclama canvis abans de la votació de les esmenes.",
    },
  ],
  'creup-reclama-cambios-urgentes-en-la-ley-organica-del-sistem-2022-12': [
    {
      locale: 'en',
      title: 'CREUP calls for urgent changes to the Organic Law of the University System',
      description:
        'CREUP urges parliamentary groups to face up to the reality of students and make the university a more accessible, democratic space focused on quality.',
    },
    {
      locale: 'ca',
      title: 'CREUP reclama canvis urgents en la Llei Orgànica del Sistema Universitari',
      description:
        "CREUP reclama als grups parlamentaris que afrontin la realitat de l'estudiantat i facin de la universitat un espai més accessible, democràtic i centrat en la qualitat.",
    },
    {
      locale: 'eu',
      title: 'CREUPek aldaketa premiazkoak eskatu ditu Unibertsitate Sistemaren Lege Organikoan',
      description:
        'CREUPek talde parlamentarioei eskatzen die ikasleen errealitateari aurre egiteko eta unibertsitatea espazio irisgarriagoa, demokratikoagoa eta kalitatean zentratua bihurtzeko.',
    },
    {
      locale: 'gl',
      title: 'CREUP reclama cambios urxentes na Lei Orgánica do Sistema Universitario',
      description:
        'CREUP reclama aos grupos parlamentarios que afronten a realidade do estudantado e fagan da universidade un espazo máis accesible, democrático e centrado na calidade.',
    },
    {
      locale: 'val',
      title: 'CREUP reclama canvis urgents en la Llei Orgànica del Sistema Universitari',
      description:
        "CREUP reclama als grups parlamentaris que afronten la realitat de l'estudiantat i facen de la universitat un espai més accessible, democràtic i centrat en la qualitat.",
    },
  ],
  'creup-exige-cambios-urgentes-en-la-ley-organica-del-sistema-2022-12': [
    {
      locale: 'en',
      title: 'CREUP demands urgent changes to the Organic Law of the University System',
      description:
        "CREUP denounces that the new Organic Law of the University System ignores students' problems and does not respond to their needs during the parliamentary process.",
    },
    {
      locale: 'ca',
      title: 'CREUP exigeix canvis urgents en la Llei Orgànica del Sistema Universitari',
      description:
        "CREUP denuncia que la nova Llei Orgànica del Sistema Universitari ignora els problemes de l'estudiantat i no respon a les seves necessitats durant la tramitació parlamentària.",
    },
    {
      locale: 'eu',
      title: 'CREUPek aldaketa premiazkoak eskatu ditu Unibertsitate Sistemaren Lege Organikoan',
      description:
        'CREUPek salatzen du Unibertsitate Sistemaren Lege Organiko berriak ikasleen arazoak alde batera uzten dituela eta ez diela haien beharrei erantzuten izapidetze parlamentarioan.',
    },
    {
      locale: 'gl',
      title: 'CREUP esixe cambios urxentes na Lei Orgánica do Sistema Universitario',
      description:
        'CREUP denuncia que a nova Lei Orgánica do Sistema Universitario ignora os problemas do estudantado e non responde ás súas necesidades durante a tramitación parlamentaria.',
    },
    {
      locale: 'val',
      title: 'CREUP exigix canvis urgents en la Llei Orgànica del Sistema Universitari',
      description:
        "CREUP denuncia que la nova Llei Orgànica del Sistema Universitari ignora els problemes de l'estudiantat i no respon a les seues necessitats durant la tramitació parlamentària.",
    },
  ],
  'creup-exige-cambios-urgentes-en-la-ley-organica-del-sistema-2022-12-2': [
    {
      locale: 'en',
      title: 'CREUP demands urgent changes to the Organic Law of the University System',
      description:
        'CREUP calls for substantial changes to the LOSU before the vote on amendments to prevent students from once again being the most harmed.',
    },
    {
      locale: 'ca',
      title: 'CREUP exigeix canvis urgents a la Llei Orgànica del Sistema Universitari',
      description:
        "CREUP demana introduir canvis substancials a la LOSU abans de la votació d'esmenes per evitar que l'estudiantat torni a ser el gran perjudicat.",
    },
    {
      locale: 'eu',
      title: 'CREUPek aldaketa premiazkoak eskatzen ditu Unibertsitate Sistemaren Lege Organikoan',
      description:
        'CREUPek aldaketa sakonak sartzeko eskatzen du LOSUn zuzenketen bozketaren aurretik, ikasleak berriz ere kaltetuenak izan ez daitezen.',
    },
    {
      locale: 'gl',
      title: 'CREUP esixe cambios urxentes na Lei Orgánica do Sistema Universitario',
      description:
        'CREUP pide introducir cambios substanciais na LOSU antes da votación de emendas para evitar que o estudantado volva ser o gran prexudicado.',
    },
    {
      locale: 'val',
      title: 'CREUP exigix canvis urgents en la Llei Orgànica del Sistema Universitari',
      description:
        "CREUP demana introduir canvis substancials en la LOSU abans de la votació d'esmenes per a evitar que l'estudiantat torne a ser el gran perjudicat.",
    },
  ],
  'creup-exige-cambios-urgentes-en-la-ley-organica-del-sistema-2022-12-3': [
    {
      locale: 'en',
      title: 'CREUP demands urgent changes to the Organic Law of the University System',
      description:
        "CREUP denounces that the LOSU does not respond to students' needs and calls for greater participation in university governance and improved degree programmes.",
    },
    {
      locale: 'ca',
      title: 'CREUP exigeix canvis urgents a la Llei Orgànica del Sistema Universitari',
      description:
        "CREUP denuncia que la LOSU no respon a les necessitats de l'estudiantat i reclama més participació en el govern universitari i la millora de les titulacions.",
    },
    {
      locale: 'eu',
      title: 'CREUPek aldaketa premiazkoak eskatzen ditu Unibertsitate Sistemaren Lege Organikoan',
      description:
        'CREUPek salatzen du LOSUk ez diela ikasleen beharrei erantzuten, eta unibertsitate gobernuan parte-hartze handiagoa eta titulazioen hobekuntza eskatzen ditu.',
    },
    {
      locale: 'gl',
      title: 'CREUP esixe cambios urxentes na Lei Orgánica do Sistema Universitario',
      description:
        'CREUP denuncia que a LOSU non responde ás necesidades do estudantado e reclama máis participación no goberno universitario e a mellora das titulacións.',
    },
    {
      locale: 'val',
      title: 'CREUP exigix canvis urgents en la Llei Orgànica del Sistema Universitari',
      description:
        "CREUP denuncia que la LOSU no respon a les necessitats de l'estudiantat i reclama més participació en el govern universitari i la millora de les titulacions.",
    },
  ],
  'los-universitarios-exigen-mas-participacion-estudiantil-en-l-2022-12': [
    {
      locale: 'en',
      title:
        'University students demand greater student participation in the governing bodies of public universities',
      description:
        "CREUP calls for an increase in student participation in university governing bodies and denounces that the LOSU ignores students' problems.",
    },
    {
      locale: 'ca',
      title:
        'Els universitaris exigeixen més participació estudiantil en els òrgans de govern de les universitats públiques',
      description:
        "CREUP demana un augment de la participació estudiantil en els òrgans de govern universitaris i denuncia que la LOSU ignora els problemes de l'estudiantat.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek ikasleen parte-hartze handiagoa eskatzen dute unibertsitate publikoetako gobernu organoetan',
      description:
        'CREUPek unibertsitateko gobernu organoetan ikasleen parte-hartzea handitzeko eskatzen du eta salatzen du LOSUk ikasleen arazoei jaramonik ez diela egiten.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios esixen máis participación estudantil nos órganos de goberno das universidades públicas',
      description:
        'CREUP demanda un aumento da participación estudantil nos órganos de goberno universitarios e denuncia que a LOSU ignora os problemas do estudantado.',
    },
    {
      locale: 'val',
      title:
        'Els universitaris exigixen més participació estudiantil en els òrgans de govern de les universitats públiques',
      description:
        "CREUP demana un augment de la participació estudiantil en els òrgans de govern universitaris i denuncia que la LOSU ignora els problemes de l'estudiantat.",
    },
  ],
  'los-universitarios-piden-mas-participacion-en-los-organos-de-2022-12': [
    {
      locale: 'en',
      title:
        'University students call for greater participation in the governing bodies of public universities',
      description:
        'CREUP calls for greater student participation in university governance and asks that the LOSU incorporate substantial changes before its vote.',
    },
    {
      locale: 'ca',
      title:
        'Els universitaris demanen més participació en els òrgans de govern de les universitats públiques',
      description:
        'CREUP reclama més participació estudiantil en la governança universitària i demana que la LOSU incorpori canvis substancials abans de la seva votació.',
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek parte-hartze handiagoa eskatzen dute unibertsitate publikoetako gobernu organoetan',
      description:
        'CREUPek ikasleen parte-hartze handiagoa eskatzen du unibertsitate gobernantzan eta LOSUk aldaketa sakonak jaso ditzala eskatzen du bozketaren aurretik.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios piden máis participación nos órganos de goberno das universidades públicas',
      description:
        'CREUP reclama máis participación estudantil na gobernanza universitaria e pide que a LOSU incorpore cambios substanciais antes da súa votación.',
    },
    {
      locale: 'val',
      title:
        'Els universitaris demanen més participació en els òrgans de govern de les universitats públiques',
      description:
        'CREUP reclama més participació estudiantil en la governança universitària i demana que la LOSU incorpore canvis substancials abans de la seua votació.',
    },
  ],
  'estudiantes-critican-que-el-estatuto-del-becario-no-garantiz-2022-11': [
    {
      locale: 'en',
      title:
        'Students criticise that the Trainee Statute "does not guarantee the quality of internships and does not ensure their remuneration"',
      description:
        'CREUP warns that the Statute of Students on Work Placement does not guarantee the quality or remuneration of internships and rules out the possibility of carrying them out in public institutions.',
    },
    {
      locale: 'ca',
      title:
        "Els estudiants critiquen que l'Estatut del Becari «no garanteix la qualitat de les pràctiques i no n'assegura la remuneració»",
      description:
        "CREUP adverteix que l'Estatut de l'Estudiant en Pràctiques no garanteix la qualitat ni la remuneració de les pràctiques i exclou la possibilitat de fer-les en institucions públiques.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek kritikatzen dute Bekadunaren Estatutuak «ez duela praktiken kalitatea bermatzen eta ez duela haien ordainsaria ziurtatzen»',
      description:
        'CREUPek ohartarazten du Praktiketako Ikaslearen Estatutuak ez duela praktiken kalitatea ez ordainsaria bermatzen, eta erakunde publikoetan egiteko aukera baztertzen duela.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes critican que o Estatuto do Bolseiro «non garante a calidade das prácticas e non asegura a súa remuneración»',
      description:
        'CREUP advirte de que o Estatuto do Estudante en Prácticas non garante a calidade nin a remuneración das prácticas e exclúe a posibilidade de realizalas en institucións públicas.',
    },
    {
      locale: 'val',
      title:
        "Els estudiants critiquen que l'Estatut del Becari «no garantix la qualitat de les pràctiques i no n'assegura la remuneració»",
      description:
        "CREUP advertix que l'Estatut de l'Estudiant en Pràctiques no garantix la qualitat ni la remuneració de les pràctiques i exclou la possibilitat de fer-les en institucions públiques.",
    },
  ],
  'estudiantes-critican-que-el-estatuto-del-becario-no-garantiz-2022-11-2': [
    {
      locale: 'en',
      title:
        'Students criticise that the Trainee Statute "does not guarantee the quality of internships" or their pay',
      description:
        "CREUP denounces that the negotiation of the Trainee Statute has left out students' voices and that the text does not include their main demands.",
    },
    {
      locale: 'ca',
      title:
        "Els estudiants critiquen que l'Estatut del Becari «no garanteix la qualitat de les pràctiques» ni la seva retribució",
      description:
        "CREUP denuncia que la negociació de l'Estatut del Becari ha omès la veu de l'estudiantat i que el text no recull les seves reivindicacions principals.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek kritikatzen dute Bekadunaren Estatutuak «ez duela praktiken kalitatea bermatzen» ezta haien ordainketa ere',
      description:
        'CREUPek salatzen du Bekadunaren Estatutuaren negoziazioak ikasleen ahotsa baztertu duela eta testuak ez dituela haien aldarrikapen nagusiak jasotzen.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes critican que o Estatuto do Bolseiro «non garante a calidade das prácticas» nin a súa retribución',
      description:
        'CREUP denuncia que a negociación do Estatuto do Bolseiro omitiu a voz do estudantado e que o texto non recolle as súas reivindicacións principais.',
    },
    {
      locale: 'val',
      title:
        "Els estudiants critiquen que l'Estatut del Becari «no garantix la qualitat de les pràctiques» ni la seua retribució",
      description:
        "CREUP denuncia que la negociació de l'Estatut del Becari ha omés la veu de l'estudiantat i que el text no arreplega les seues reivindicacions principals.",
    },
  ],
  'estudiantes-critican-que-el-estatuto-del-becario-no-garantiz-2022-11-3': [
    {
      locale: 'en',
      title:
        'Students criticise that the Trainee Statute "does not guarantee the quality of internships and does not ensure their remuneration"',
      description:
        'CREUP criticises that the Statute of Students on Work Placement does not ensure remuneration, training quality or the continuity of internships in public institutions.',
    },
    {
      locale: 'ca',
      title:
        "Els estudiants critiquen que l'Estatut del Becari «no garanteix la qualitat de les pràctiques i no n'assegura la remuneració»",
      description:
        "CREUP critica que l'Estatut de l'Estudiant en Pràctiques no asseguri remuneració, qualitat formativa ni continuïtat de les pràctiques en institucions públiques.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek kritikatzen dute Bekadunaren Estatutuak «ez duela praktiken kalitatea bermatzen eta ez duela haien ordainsaria ziurtatzen»',
      description:
        'CREUPek kritikatzen du Praktiketako Ikaslearen Estatutuak ez duela ordainsaririk, prestakuntza kalitaterik ez erakunde publikoetako praktiken jarraitutasunik ziurtatzen.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes critican que o Estatuto do Bolseiro «non garante a calidade das prácticas e non asegura a súa remuneración»',
      description:
        'CREUP critica que o Estatuto do Estudante en Prácticas non asegure remuneración, calidade formativa nin continuidade das prácticas en institucións públicas.',
    },
    {
      locale: 'val',
      title:
        "Els estudiants critiquen que l'Estatut del Becari «no garantix la qualitat de les pràctiques i no n'assegura la remuneració»",
      description:
        "CREUP critica que l'Estatut de l'Estudiant en Pràctiques no assegure remuneració, qualitat formativa ni continuïtat de les pràctiques en institucions públiques.",
    },
  ],
  'universitarios-critican-el-abandono-del-ministerio-de-trabaj-2022-11': [
    {
      locale: 'en',
      title:
        'University students criticise the Ministry of Labour\'s "abandonment" of students in the Statute of Students on Practical Training',
      description:
        'CREUP criticises that the Ministry of Labour is drafting a Statute of Students on Work Placement that does not guarantee quality, remuneration or internships in public institutions.',
    },
    {
      locale: 'ca',
      title:
        "Els universitaris critiquen l'«abandonament» del Ministeri de Treball envers l'estudiantat en l'Estatut de l'Estudiant en Formació Pràctica",
      description:
        "CREUP critica que el Ministeri de Treball elabori un Estatut de l'Estudiant en Pràctiques que no garanteix la qualitat, la remuneració ni les pràctiques en institucions públiques.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek Lan Ministerioak ikasleekiko egindako «abandonua» kritikatzen dute Praktika Prestakuntzako Ikaslearen Estatutuan',
      description:
        'CREUPek kritikatzen du Lan Ministerioak Praktiketako Ikaslearen Estatutu bat lantzen ari dela, kalitatea, ordainsaria eta erakunde publikoetako praktikak bermatzen ez dituena.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios critican o «abandono» do Ministerio de Traballo ao estudantado no Estatuto do Estudante en Formación Práctica',
      description:
        'CREUP critica que o Ministerio de Traballo elabore un Estatuto do Estudante en Prácticas que non garante a calidade, a remuneración nin as prácticas en institucións públicas.',
    },
    {
      locale: 'val',
      title:
        "Els universitaris critiquen l'«abandonament» del Ministeri de Treball cap a l'estudiantat en l'Estatut de l'Estudiant en Formació Pràctica",
      description:
        "CREUP critica que el Ministeri de Treball elabore un Estatut de l'Estudiant en Pràctiques que no garantix la qualitat, la remuneració ni les pràctiques en institucions públiques.",
    },
  ],
  'universitarios-critican-el-abandono-del-ministerio-de-trabaj-2022-11-2': [
    {
      locale: 'en',
      title:
        'University students criticise the Ministry of Labour\'s "abandonment" of students in the Statute of Students on Practical Training',
      description:
        'CREUP recalls that students asked for a paid and educational internship model, but criticises that the reform does not include those demands.',
    },
    {
      locale: 'ca',
      title:
        "Els universitaris critiquen l'«abandonament» del Ministeri de Treball envers l'estudiantat en l'Estatut de l'Estudiant en Formació Pràctica",
      description:
        "CREUP recorda que l'estudiantat va demanar un model de pràctiques remunerat i formatiu, però critica que la reforma no reculli aquestes demandes.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek Lan Ministerioak ikasleekiko egindako «abandonua» kritikatzen dute Praktika Prestakuntzako Ikaslearen Estatutuan',
      description:
        'CREUPek gogorarazten du ikasleek praktika eredu ordaindu eta formatibo bat eskatu zutela, baina kritikatzen du erreformak ez dituela eskaera horiek jasotzen.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios critican o «abandono» do Ministerio de Traballo ao estudantado no Estatuto do Estudante en Formación Práctica',
      description:
        'CREUP lembra que o estudantado pediu un modelo de prácticas remunerado e formativo, pero critica que a reforma non recolla esas demandas.',
    },
    {
      locale: 'val',
      title:
        "Els universitaris critiquen l'«abandonament» del Ministeri de Treball cap a l'estudiantat en l'Estatut de l'Estudiant en Formació Pràctica",
      description:
        "CREUP recorda que l'estudiantat va demanar un model de pràctiques remunerat i formatiu, però critica que la reforma no arreplegue estes demandes.",
    },
  ],
  'el-ministerio-de-trabajo-ultima-su-estatuto-del-becario-para-2022-11': [
    {
      locale: 'en',
      title:
        'The Ministry of Labour finalises its Trainee Statute to bring internships under labour law',
      description:
        'The Trainee Statute aims to recognise rights for those undertaking internships, in a debate marked by the reimbursement of expenses, rest periods and bringing these activities under labour law.',
    },
    {
      locale: 'ca',
      title:
        'El Ministeri de Treball ultima el seu Estatut del Becari per laboralitzar les pràctiques',
      description:
        "L'Estatut del Becari pretén reconèixer drets per a qui fa pràctiques, en un debat marcat per la compensació de despeses, els descansos i la laboralització d'aquestes activitats.",
    },
    {
      locale: 'eu',
      title:
        'Lan Ministerioa Bekadunaren Estatutua bukatzen ari da praktikak lan eremura ekartzeko',
      description:
        'Bekadunaren Estatutuak praktikak egiten dituztenei eskubideak aitortu nahi dizkie, gastuen konpentsazioak, atsedenaldiek eta jarduera horien laboralizazioak markatutako eztabaida batean.',
    },
    {
      locale: 'gl',
      title:
        'O Ministerio de Traballo ultima o seu Estatuto do Bolseiro para laboralizar as prácticas',
      description:
        'O Estatuto do Bolseiro pretende recoñecer dereitos para quen realiza prácticas, nun debate marcado pola compensación de gastos, os descansos e a laboralización destas actividades.',
    },
    {
      locale: 'val',
      title:
        'El Ministeri de Treball ultima el seu Estatut del Becari per a laboralitzar les pràctiques',
      description:
        "L'Estatut del Becari pretén reconéixer drets per a qui fa pràctiques, en un debat marcat per la compensació de despeses, els descansos i la laboralització d'estes activitats.",
    },
  ],
  'el-estatuto-del-becario-que-no-convence-a-los-estudiantes-su-2022-10': [
    {
      locale: 'en',
      title:
        'The trainee statute that fails to convince students: "They will abolish extracurricular internships"',
      description:
        'The preliminary agreement on the Trainee Statute raises reservations among students, companies and rectorates over its impact on extracurricular internships.',
    },
    {
      locale: 'ca',
      title:
        "L'estatut del becari que no convenç els estudiants: «Suprimiran les pràctiques extracurriculars»",
      description:
        "El preacord de l'Estatut del Becari genera reticències entre estudiants, empreses i rectorats pel seu impacte en les pràctiques extracurriculars.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleak konbentzitzen ez dituen bekadunaren estatutua: «Praktika estrakurrikularrak kenduko dituzte»',
      description:
        'Bekadunaren Estatutuaren aurreakordioak erreparoak sortzen ditu ikasleen, enpresen eta errektoretzen artean, praktika estrakurrikularretan duen eraginagatik.',
    },
    {
      locale: 'gl',
      title:
        'O estatuto do bolseiro que non convence os estudantes: «Suprimirán as prácticas extracurriculares»',
      description:
        'O preacordo do Estatuto do Bolseiro xera reticencias entre estudantes, empresas e rectorados polo seu impacto nas prácticas extracurriculares.',
    },
    {
      locale: 'val',
      title:
        "L'estatut del becari que no convenç els estudiants: «Suprimiran les pràctiques extracurriculars»",
      description:
        "El preacord de l'Estatut del Becari genera reticències entre estudiants, empreses i rectorats pel seu impacte en les pràctiques extracurriculars.",
    },
  ],
  'los-estudiantes-piden-frenar-el-estatuto-del-becario-para-in-2022-10': [
    {
      locale: 'en',
      title: 'Students call for the Trainee Statute to be halted to include their own requests',
      description:
        'CEUNE calls for the approval of the Trainee Statute to be halted in order to incorporate its demands and address fraud during internship periods.',
    },
    {
      locale: 'ca',
      title:
        "Els estudiants demanen frenar l'Estatut del Becari per incloure les seves pròpies peticions",
      description:
        "CEUNE demana paralitzar l'aprovació de l'Estatut del Becari per incorporar les seves reivindicacions i donar resposta al frau en els períodes de pràctiques.",
    },
    {
      locale: 'eu',
      title: 'Ikasleek Bekadunaren Estatutua geldiaraztea eskatzen dute beren eskaerak sartzeko',
      description:
        'CEUNEk Bekadunaren Estatutuaren onarpena geldiaraztea eskatzen du bere aldarrikapenak txertatzeko eta praktika aldietako iruzurrari erantzuteko.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes piden frear o Estatuto do Bolseiro para incluír as súas propias peticións',
      description:
        'CEUNE pide paralizar a aprobación do Estatuto do Bolseiro para incorporar as súas reivindicacións e dar resposta á fraude nos períodos de prácticas.',
    },
    {
      locale: 'val',
      title:
        "Els estudiants demanen frenar l'Estatut del Becari per a incloure les seues pròpies peticions",
      description:
        "CEUNE demana paralitzar l'aprovació de l'Estatut del Becari per a incorporar les seues reivindicacions i donar resposta al frau en els períodes de pràctiques.",
    },
  ],
  'un-fraude-no-tan-marginal-la-inspeccion-descubre-5000-falsos-2022-10': [
    {
      locale: 'en',
      title:
        'A not-so-marginal fraud: the Labour Inspectorate uncovers 5,000 false trainees and collects 13 million in unpaid contributions',
      description:
        'The Labour Inspectorate detects thousands of false trainees while universities and training bodies question the Trainee Statute for equating an academic activity with a working one.',
    },
    {
      locale: 'ca',
      title:
        'Un frau no tan marginal: la Inspecció descobreix 5.000 falsos becaris i recapta 13 milions en quotes degudes',
      description:
        "La Inspecció detecta milers de falsos becaris mentre universitats i entitats formatives qüestionen l'Estatut del Becari per assimilar una activitat acadèmica a una de laboral.",
    },
    {
      locale: 'eu',
      title:
        'Hain marjinala ez den iruzurra: Ikuskaritzak 5.000 bekadun faltsu aurkitu eta zor diren kuotetan 13 milioi biltzen ditu',
      description:
        'Ikuskaritzak milaka bekadun faltsu antzematen ditu, eta unibertsitateek eta prestakuntza erakundeek Bekadunaren Estatutua zalantzan jartzen dute, jarduera akademiko bat lanekoarekin parekatzeagatik.',
    },
    {
      locale: 'gl',
      title:
        'Unha fraude non tan marxinal: a Inspección descobre 5.000 falsos bolseiros e recada 13 millóns en cotas debidas',
      description:
        'A Inspección detecta milleiros de falsos bolseiros mentres universidades e entidades formativas cuestionan o Estatuto do Bolseiro por asimilar unha actividade académica a unha laboral.',
    },
    {
      locale: 'val',
      title:
        'Un frau no tan marginal: la Inspecció descobrix 5.000 falsos becaris i recapta 13 milions en quotes degudes',
      description:
        "La Inspecció detecta milers de falsos becaris mentres universitats i entitats formatives qüestionen l'Estatut del Becari per assimilar una activitat acadèmica a una de laboral.",
    },
  ],
  'yolanda-diaz-impulsa-el-estatuto-del-becario-para-poner-fin-2022-10': [
    {
      locale: 'en',
      title: 'Yolanda Díaz drives the Trainee Statute to put an end to unpaid work',
      description:
        'The Trainee Statute seeks to grant rights to those undertaking internships and to prevent this arrangement from being used as disguised unpaid work.',
    },
    {
      locale: 'ca',
      title: "Yolanda Díaz impulsa l'Estatut del Becari per posar fi al treball gratis",
      description:
        "L'Estatut del Becari busca reconèixer drets a qui fa pràctiques i evitar que aquesta figura s'utilitzi com a treball gratuït encobert.",
    },
    {
      locale: 'eu',
      title: 'Yolanda Díazek Bekadunaren Estatutua bultzatzen du doako lanari amaiera emateko',
      description:
        'Bekadunaren Estatutuak praktikak egiten dituztenei eskubideak aitortu nahi dizkie eta figura hori doako lan ezkutu gisa erabil ez dadin saihestu nahi du.',
    },
    {
      locale: 'gl',
      title: 'Yolanda Díaz impulsa o Estatuto do Bolseiro para poñer fin ao traballo gratis',
      description:
        'O Estatuto do Bolseiro busca recoñecer dereitos a quen realiza prácticas e evitar que esta figura se utilice como traballo gratuíto encuberto.',
    },
    {
      locale: 'val',
      title: "Yolanda Díaz impulsa l'Estatut del Becari per a posar fi al treball gratis",
      description:
        "L'Estatut del Becari busca reconéixer drets a qui fa pràctiques i evitar que esta figura s'utilitze com a treball gratuït encobert.",
    },
  ],
  'estatuto-del-becario-trabajo-deja-fuera-de-las-negociaciones-2022-10': [
    {
      locale: 'en',
      title:
        'Trainee Statute: Labour ministry leaves the university community out of the negotiations',
      description:
        'Aula Magna reports the discontent of CRUE and CREUP over the negotiation of the Trainee Statute without sufficient participation from the university community, as well as the criticism of how extracurricular internships are treated.',
    },
    {
      locale: 'ca',
      title:
        'Estatut del Becari: Treball deixa fora de les negociacions la comunitat universitària',
      description:
        "Aula Magna recull el malestar de CRUE i CREUP per la negociació de l'Estatut del Becari sense participació suficient de la comunitat universitària, així com les crítiques al tractament de les pràctiques extracurriculars.",
    },
    {
      locale: 'eu',
      title:
        'Bekadunaren Estatutua: Lan Ministerioak unibertsitate komunitatea negoziazioetatik kanpo uzten du',
      description:
        'Aula Magnak CRUEren eta CREUPen kezka jasotzen du Bekadunaren Estatutuaren negoziazioagatik, unibertsitate komunitatearen parte-hartze nahikorik gabe, bai eta praktika estrakurrikularren trataerari egindako kritikak ere.',
    },
    {
      locale: 'gl',
      title:
        'Estatuto do Bolseiro: Traballo deixa fóra das negociacións a comunidade universitaria',
      description:
        'Aula Magna recolle o malestar de CRUE e CREUP pola negociación do Estatuto do Bolseiro sen participación suficiente da comunidade universitaria, así como as críticas ao tratamento das prácticas extracurriculares.',
    },
    {
      locale: 'val',
      title:
        'Estatut del Becari: Treball deixa fora de les negociacions la comunitat universitària',
      description:
        "Aula Magna arreplega el malestar de CRUE i CREUP per la negociació de l'Estatut del Becari sense participació suficient de la comunitat universitària, així com les crítiques al tractament de les pràctiques extracurriculars.",
    },
  ],
  'estudiantes-piden-volver-a-redactar-el-estatuto-del-becario-2022-10': [
    {
      locale: 'en',
      title:
        'Students call for the Trainee Statute to be redrafted for failing to guarantee the remuneration and quality of internships',
      description:
        'CREUP calls for a new draft of the Trainee Statute, considering that it does not guarantee the remuneration or the training quality of academic internships.',
    },
    {
      locale: 'ca',
      title:
        "Els estudiants demanen tornar a redactar l'Estatut del Becari per no garantir la remuneració i la qualitat de les pràctiques",
      description:
        "CREUP demana una nova redacció de l'Estatut del Becari en considerar que no garanteix la remuneració ni la qualitat formativa de les pràctiques acadèmiques.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek Bekadunaren Estatutua berridazteko eskatzen dute, praktiken ordainsaria eta kalitatea bermatzen ez dituelako',
      description:
        'CREUPek Bekadunaren Estatutuaren idazketa berri bat eskatzen du, praktika akademikoen ordainsaria ez kalitate formatiboa bermatzen ez dituela uste baitu.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes piden volver redactar o Estatuto do Bolseiro por non garantir a remuneración e a calidade das prácticas',
      description:
        'CREUP pide unha nova redacción do Estatuto do Bolseiro ao considerar que non garante a remuneración nin a calidade formativa das prácticas académicas.',
    },
    {
      locale: 'val',
      title:
        "Els estudiants demanen tornar a redactar l'Estatut del Becari per no garantir la remuneració i la qualitat de les pràctiques",
      description:
        "CREUP demana una nova redacció de l'Estatut del Becari en considerar que no garantix la remuneració ni la qualitat formativa de les pràctiques acadèmiques.",
    },
  ],
  'los-estudiantes-piden-volver-a-redactar-el-estatuto-del-beca-2022-10': [
    {
      locale: 'en',
      title:
        'Students call for the Trainee Statute to be redrafted for failing to guarantee remuneration',
      description:
        'CREUP calls for a new draft of the Statute of Students on Practical Training because the text does not guarantee the remuneration or the quality of academic internships.',
    },
    {
      locale: 'ca',
      title:
        "Els estudiants demanen tornar a redactar l'Estatut del Becari per no garantir la remuneració",
      description:
        "CREUP reclama una nova redacció de l'Estatut de l'Estudiant en Formació Pràctica perquè el text no garanteix la remuneració ni la qualitat de les pràctiques acadèmiques.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek Bekadunaren Estatutua berridazteko eskatzen dute, ordainsaria bermatzen ez duelako',
      description:
        'CREUPek Praktika Prestakuntzako Ikaslearen Estatutuaren idazketa berri bat eskatzen du, testuak ez baititu praktika akademikoen ordainsaria ez kalitatea bermatzen.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes piden volver redactar o Estatuto do Bolseiro por non garantir a remuneración',
      description:
        'CREUP reclama unha nova redacción do Estatuto do Estudante en Formación Práctica porque o texto non garante a remuneración nin a calidade das prácticas académicas.',
    },
    {
      locale: 'val',
      title:
        "Els estudiants demanen tornar a redactar l'Estatut del Becari per no garantir la remuneració",
      description:
        "CREUP reclama una nova redacció de l'Estatut de l'Estudiant en Formació Pràctica perquè el text no garantix la remuneració ni la qualitat de les pràctiques acadèmiques.",
    },
  ],
  'que-es-el-estatuto-del-becario-plazos-datos-y-contexto-de-la-2022-10': [
    {
      locale: 'en',
      title:
        "What is the trainee statute: deadlines, data and context of the proposal that seeks to regulate students' conditions",
      description:
        "Maldita.es provides context on the Trainee Statute proposal and gathers the position of CREUP, which calls for a new text because the draft ignores students' demands.",
    },
    {
      locale: 'ca',
      title:
        "Què és l'estatut del becari: terminis, dades i context de la proposta que busca regular les condicions dels estudiants",
      description:
        "Maldita.es contextualitza la proposta de l'Estatut del Becari i recull la posició de CREUP, que demana un nou text perquè l'esborrany ignora reivindicacions de l'estudiantat.",
    },
    {
      locale: 'eu',
      title:
        'Zer da bekadunaren estatutua: ikasleen baldintzak arautu nahi dituen proposamenaren epeak, datuak eta testuingurua',
      description:
        'Maldita.es-ek Bekadunaren Estatutuaren proposamena testuinguruan jartzen du eta CREUPen jarrera jasotzen du, testu berri bat eskatzen baitu zirriborroak ikasleen aldarrikapenei jaramonik egiten ez dielako.',
    },
    {
      locale: 'gl',
      title:
        'Que é o estatuto do bolseiro: prazos, datos e contexto da proposta que busca regular as condicións dos estudantes',
      description:
        'Maldita.es contextualiza a proposta do Estatuto do Bolseiro e recolle a posición de CREUP, que pide un novo texto porque o borrador ignora reivindicacións do estudantado.',
    },
    {
      locale: 'val',
      title:
        "Què és l'estatut del becari: terminis, dades i context de la proposta que busca regular les condicions dels estudiants",
      description:
        "Maldita.es contextualitza la proposta de l'Estatut del Becari i arreplega la posició de CREUP, que demana un nou text perquè l'esborrany ignora reivindicacions de l'estudiantat.",
    },
  ],
  'los-estudiantes-contra-el-estatuto-del-becario-por-no-garant-2022-10': [
    {
      locale: 'en',
      title:
        'Students against the Trainee Statute for failing to guarantee the remuneration and quality of internships',
      description:
        "infoLibre reports CREUP's rejection of the Trainee Statute for ignoring its demands, not ensuring sufficient remuneration and not adequately addressing the quality of internships.",
    },
    {
      locale: 'ca',
      title:
        "Els estudiants, contra l'Estatut del Becari per no garantir la remuneració i la qualitat de les pràctiques",
      description:
        "infoLibre recull el rebuig de CREUP a l'Estatut del Becari per ignorar les seves reivindicacions, no assegurar una remuneració suficient i no abordar adequadament la qualitat de les pràctiques.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleak, Bekadunaren Estatutuaren aurka, praktiken ordainsaria eta kalitatea bermatzen ez dituelako',
      description:
        'infoLibrek CREUPek Bekadunaren Estatutuari egiten dion uko jasotzen du, bere aldarrikapenei jaramonik ez egiteagatik, ordainsari nahikorik ez ziurtatzeagatik eta praktiken kalitatea behar bezala ez lantzeagatik.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes, contra o Estatuto do Bolseiro por non garantir a remuneración e a calidade das prácticas',
      description:
        'infoLibre recolle o rexeitamento de CREUP ao Estatuto do Bolseiro por ignorar as súas reivindicacións, non asegurar unha remuneración suficiente e non abordar adecuadamente a calidade das prácticas.',
    },
    {
      locale: 'val',
      title:
        "Els estudiants, contra l'Estatut del Becari per no garantir la remuneració i la qualitat de les pràctiques",
      description:
        "infoLibre arreplega el rebuig de CREUP a l'Estatut del Becari per ignorar les seues reivindicacions, no assegurar una remuneració suficient i no abordar adequadament la qualitat de les pràctiques.",
    },
  ],
  'estudiantes-piden-cambiar-el-estatuto-del-becario-para-garan-2022-10': [
    {
      locale: 'en',
      title:
        'Students call for changes to the Trainee Statute to guarantee the remuneration and quality of internships',
      description:
        'The HuffPost reports that CREUP is requesting a comprehensive reform of academic internships to guarantee their educational nature, their remuneration, social-security contributions and quality.',
    },
    {
      locale: 'ca',
      title:
        "Els estudiants demanen canviar l'Estatut del Becari per garantir la remuneració i la qualitat de les pràctiques",
      description:
        'El HuffPost recull que CREUP sol·licita una reforma integral de les pràctiques acadèmiques per garantir-ne el caràcter formatiu, la remuneració, la cotització i la qualitat.',
    },
    {
      locale: 'eu',
      title:
        'Ikasleek Bekadunaren Estatutua aldatzeko eskatzen dute praktiken ordainsaria eta kalitatea bermatzeko',
      description:
        'HuffPost-ek jasotzen du CREUPek praktika akademikoen erreforma integral bat eskatzen duela, haien izaera formatiboa, ordainsaria, kotizazioa eta kalitatea bermatzeko.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes piden cambiar o Estatuto do Bolseiro para garantir a remuneración e a calidade das prácticas',
      description:
        'O HuffPost recolle que CREUP solicita unha reforma integral das prácticas académicas para garantir o seu carácter formativo, a súa remuneración, a cotización e a calidade.',
    },
    {
      locale: 'val',
      title:
        "Els estudiants demanen canviar l'Estatut del Becari per a garantir la remuneració i la qualitat de les pràctiques",
      description:
        'El HuffPost arreplega que CREUP sol·licita una reforma integral de les pràctiques acadèmiques per a garantir-ne el caràcter formatiu, la remuneració, la cotització i la qualitat.',
    },
  ],
  'estudiantes-piden-volver-a-redactar-el-estatuto-del-becario-2022-10-2': [
    {
      locale: 'en',
      title:
        'Students call for the Trainee Statute to be redrafted because it does not guarantee the pay and quality of placements',
      description:
        'Europa Press reports that CREUP is calling for a new draft of the Trainee Statute because, in its view, the agreed text guarantees neither the pay nor the quality of academic placements.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat demana tornar a redactar l'Estatut del Becari perquè no garanteix la remuneració ni la qualitat de les pràctiques",
      description:
        "Europa Press informa que CREUP demana una nova redacció de l'Estatut del Becari perquè, al seu parer, el text pactat no garanteix la remuneració ni la qualitat de les pràctiques acadèmiques.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek Bekadunaren Estatutua berridaztea eskatzen dute, praktiken ordainsaria eta kalitatea bermatzen ez dituelako',
      description:
        'Europa Pressek jakinarazi du CREUPek Bekadunaren Estatutuaren idazketa berria eskatzen duela, bere ustez adostutako testuak ez baititu bermatzen praktika akademikoen ordainsaria eta kalitatea.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado pide volver a redactar o Estatuto do Bolseiro por non garantir a remuneración nin a calidade das prácticas',
      description:
        'Europa Press informa de que CREUP pide unha nova redacción do Estatuto do Bolseiro porque, ao seu xuízo, o texto pactado non garante a remuneración nin a calidade das prácticas académicas.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat demana tornar a redactar l'Estatut del Becari perquè no garantix la remuneració ni la qualitat de les pràctiques",
      description:
        "Europa Press informa que CREUP demana una nova redacció de l'Estatut del Becari perquè, al seu parer, el text pactat no garantix la remuneració ni la qualitat de les pràctiques acadèmiques.",
    },
  ],
  'criticas-al-nuevo-estatuto-del-becario-de-yolanda-diaz-no-me-2022-10': [
    {
      locale: 'en',
      title:
        'Criticism of Yolanda Díaz\'s new Trainee Statute: "It does not improve training quality"',
      description:
        "El Liberal collects the criticism of the Trainee Statute for failing to improve the training quality of placements and for not offering enough solutions to students' problems.",
    },
    {
      locale: 'ca',
      title:
        'Crítiques al nou Estatut del Becari de Yolanda Díaz: «No millora la qualitat formativa»',
      description:
        "El Liberal recull les crítiques a l'Estatut del Becari per no millorar la qualitat formativa de les pràctiques i per no oferir solucions suficients als problemes de l'estudiantat.",
    },
    {
      locale: 'eu',
      title:
        'Kritikak Yolanda Díazen Bekadunaren Estatutu berriari: «Ez du prestakuntza-kalitatea hobetzen»',
      description:
        'El Liberalek Bekadunaren Estatutuari egindako kritikak jaso ditu, praktiken prestakuntza-kalitatea hobetzen ez duelako eta ikasleen arazoei nahikoa irtenbide eskaintzen ez dielako.',
    },
    {
      locale: 'gl',
      title:
        'Críticas ao novo Estatuto do Bolseiro de Yolanda Díaz: «Non mellora a calidade formativa»',
      description:
        'El Liberal recolle as críticas ao Estatuto do Bolseiro por non mellorar a calidade formativa das prácticas e por non ofrecer solucións suficientes aos problemas do estudantado.',
    },
    {
      locale: 'val',
      title:
        'Crítiques al nou Estatut del Becari de Yolanda Díaz: «No millora la qualitat formativa»',
      description:
        "El Liberal arreplega les crítiques a l'Estatut del Becari per no millorar la qualitat formativa de les pràctiques i per no oferir solucions suficients als problemes de l'estudiantat.",
    },
  ],
  'los-universitarios-acusan-a-yolanda-diaz-de-ignorarles-en-el-2022-10': [
    {
      locale: 'en',
      title: 'University students accuse Yolanda Díaz of ignoring them in the Trainee Statute',
      description:
        'The Objective reports that CREUP accuses the Ministry of Labour of disregarding its demands for paid, quality placements.',
    },
    {
      locale: 'ca',
      title: "L'estudiantat universitari acusa Yolanda Díaz d'ignorar-lo en l'Estatut del Becari",
      description:
        'The Objective recull que CREUP acusa el Ministeri de Treball de no tenir en compte les seves reclamacions per aconseguir unes pràctiques remunerades i de qualitat.',
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek Yolanda Díaz salatzen dute Bekadunaren Estatutuan haiei jaramonik ez egiteaz',
      description:
        'The Objectivek jaso du CREUPek Lan Ministerioa salatzen duela ordaindutako eta kalitatezko praktikak lortzeko egindako eskaerak kontuan hartzen ez dituelako.',
    },
    {
      locale: 'gl',
      title: 'O estudantado universitario acusa a Yolanda Díaz de ignoralo no Estatuto do Bolseiro',
      description:
        'The Objective recolle que CREUP acusa o Ministerio de Traballo de non ter en conta as súas reclamacións para lograr unhas prácticas remuneradas e de calidade.',
    },
    {
      locale: 'val',
      title: "L'estudiantat universitari acusa Yolanda Díaz d'ignorar-lo en l'Estatut del Becari",
      description:
        'The Objective arreplega que CREUP acusa el Ministeri de Treball de no tindre en compte les seues reclamacions per a aconseguir unes pràctiques remunerades i de qualitat.',
    },
  ],
  'universitarios-acusan-a-yolanda-diaz-de-ignorarles-en-el-est-2022-10': [
    {
      locale: 'en',
      title: 'University students accuse Yolanda Díaz of ignoring them in the Trainee Statute',
      description:
        'Andalucía Información reports that CREUP accuses the Ministry of Labour of ignoring students in the drafting of the Trainee Statute and calls for a new proposal.',
    },
    {
      locale: 'ca',
      title: "L'estudiantat universitari acusa Yolanda Díaz d'ignorar-lo en l'Estatut del Becari",
      description:
        "Andalucía Información recull que CREUP acusa el Ministeri de Treball d'ignorar l'estudiantat en la redacció de l'Estatut del Becari i reclama una nova proposta.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek Yolanda Díaz salatzen dute Bekadunaren Estatutuan haiei jaramonik ez egiteaz',
      description:
        'Andalucía Informaciónek jaso du CREUPek Lan Ministerioa salatzen duela Bekadunaren Estatutuaren idazketan ikasleei jaramonik ez egiteaz, eta proposamen berri bat eskatzen du.',
    },
    {
      locale: 'gl',
      title: 'O estudantado universitario acusa a Yolanda Díaz de ignoralo no Estatuto do Bolseiro',
      description:
        'Andalucía Información recolle que CREUP acusa o Ministerio de Traballo de ignorar o estudantado na redacción do Estatuto do Bolseiro e reclama unha nova proposta.',
    },
    {
      locale: 'val',
      title: "L'estudiantat universitari acusa Yolanda Díaz d'ignorar-lo en l'Estatut del Becari",
      description:
        "Andalucía Información arreplega que CREUP acusa el Ministeri de Treball d'ignorar l'estudiantat en la redacció de l'Estatut del Becari i reclama una nova proposta.",
    },
  ],
  'estudiantes-condenan-los-gritos-machistas-en-un-colegio-mayo-2022-10': [
    {
      locale: 'en',
      title:
        'Students condemn the sexist chants at a hall of residence in Madrid: "It makes your hair stand on end to see it"',
      description:
        "Europa Press reports CREUP's condemnation of the sexist chants at the Elías Ahúja hall of residence and its support for the affected students of the Santa Mónica hall of residence.",
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat condemna els crits masclistes en un col·legi major de Madrid: «Se't posen els pèls de punta en veure-ho»",
      description:
        'Europa Press recull la condemna de CREUP als crits masclistes del Col·legi Major Elías Ahúja i el seu suport a les estudiants afectades del Col·legi Major Santa Mónica.',
    },
    {
      locale: 'eu',
      title:
        'Ikasleek Madrilgo ikastetxe nagusi bateko aldarri matxistak gaitzesten dituzte: «Ilea laztu egiten zaizu hori ikustean»',
      description:
        'Europa Pressek jaso du CREUPek Elías Ahúja Ikastetxe Nagusiko aldarri matxistak gaitzesten dituela, eta Santa Mónica Ikastetxe Nagusiko ikasle kaltetuei babesa ematen diela.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado condena os berros machistas nun colexio maior de Madrid: «Pónsenche os pelos de punta ao velo»',
      description:
        'Europa Press recolle a condena de CREUP aos berros machistas do Colexio Maior Elías Ahúja e o seu apoio ás estudantes afectadas do Colexio Maior Santa Mónica.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat condemna els crits masclistes en un col·legi major de Madrid: «Se't posen els pèls de punta en vore-ho»",
      description:
        'Europa Press arreplega la condemna de CREUP als crits masclistes del Col·legi Major Elías Ahúja i el seu suport a les estudiants afectades del Col·legi Major Santa Mónica.',
    },
  ],
  'diego-losada-no-se-corta-ante-lo-que-le-dice-el-subdirector-2022-10': [
    {
      locale: 'en',
      title:
        'Diego Losada does not hold back at what the hall of residence\'s deputy director tells him: "Excuse me…"',
      description:
        "El HuffPost reports CREUP's statements against the sexist chants at the Elías Ahúja hall of residence and its demand for genuine prevention and victim-support protocols.",
    },
    {
      locale: 'ca',
      title:
        "Diego Losada no es talla davant del que li diu el sotsdirector del col·legi major: «Disculpi'm…»",
      description:
        'El HuffPost recull les declaracions de CREUP contra els crits masclistes del Col·legi Major Elías Ahúja i la seva exigència de protocols reals de prevenció i atenció a les víctimes.',
    },
    {
      locale: 'eu',
      title:
        'Diego Losadak ez du isiltzen ikastetxe nagusiko zuzendariordeak esaten diona: «Barkatu…»',
      description:
        'El HuffPostek jaso ditu CREUPek Elías Ahúja Ikastetxe Nagusiko aldarri matxisten aurka egindako adierazpenak eta biktimak prebenitu eta artatzeko benetako protokoloen eskaria.',
    },
    {
      locale: 'gl',
      title:
        'Diego Losada non se corta ante o que lle di o subdirector do colexio maior: «Desculpe…»',
      description:
        'El HuffPost recolle as declaracións de CREUP contra os berros machistas do Colexio Maior Elías Ahúja e a súa esixencia de protocolos reais de prevención e atención ás vítimas.',
    },
    {
      locale: 'val',
      title:
        "Diego Losada no es talla davant del que li diu el sotsdirector del col·legi major: «Disculpe'm…»",
      description:
        'El HuffPost arreplega les declaracions de CREUP contra els crits masclistes del Col·legi Major Elías Ahúja i la seua exigència de protocols reals de prevenció i atenció a les víctimes.',
    },
  ],
  'creup-reivindica-en-el-congreso-una-transformacion-profunda-2022-09-2': [
    {
      locale: 'en',
      title: 'CREUP calls in Congress for a "profound transformation" of the LOSU',
      description:
        "Aula Magna reports CREUP's appearance in Congress to call for a profound transformation of the LOSU, with a greater role for students in university governance.",
    },
    {
      locale: 'ca',
      title: 'CREUP reivindica al Congrés una «transformació profunda» de la LOSU',
      description:
        "Aula Magna recull la compareixença de CREUP al Congrés per reclamar una transformació profunda de la LOSU, amb més protagonisme de l'estudiantat en la governança universitària.",
    },
    {
      locale: 'eu',
      title: 'CREUPek Kongresuan LOSUren «eraldaketa sakona» aldarrikatzen du',
      description:
        'Aula Magnak jaso du CREUPen agerraldia Kongresuan, LOSUren eraldaketa sakona eskatzeko, ikasleek unibertsitate-gobernantzan protagonismo handiagoa izan dezaten.',
    },
    {
      locale: 'gl',
      title: 'CREUP reivindica no Congreso unha «transformación profunda» da LOSU',
      description:
        'Aula Magna recolle a comparecencia de CREUP no Congreso para reclamar unha transformación profunda da LOSU, con máis protagonismo do estudantado na gobernanza universitaria.',
    },
    {
      locale: 'val',
      title: 'CREUP reivindica en el Congrés una «transformació profunda» de la LOSU',
      description:
        "Aula Magna arreplega la compareixença de CREUP en el Congrés per a reclamar una transformació profunda de la LOSU, amb més protagonisme de l'estudiantat en la governança universitària.",
    },
  ],
  'los-estudiantes-reivindican-que-la-losu-garantice-una-presen-2022-09': [
    {
      locale: 'en',
      title:
        "Students call for the LOSU to guarantee a 35% presence in universities' governing bodies",
      description:
        "La Vanguardia reports CREUP's request for the future LOSU to guarantee a 35% student presence in university governing bodies.",
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat reivindica que la LOSU garanteixi una presència del 35% en els òrgans de govern de les universitats",
      description:
        "La Vanguardia recull la petició de CREUP perquè la futura LOSU garanteixi una presència del 35% de l'estudiantat en els òrgans de govern universitaris.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek LOSUk unibertsitateen gobernu-organoetan % 35eko presentzia bermatzea aldarrikatzen dute',
      description:
        'La Vanguardiak jaso du CREUPen eskaera, etorkizuneko LOSUk unibertsitateen gobernu-organoetan ikasleen % 35eko presentzia berma dezan.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado reivindica que a LOSU garanta unha presenza do 35% nos órganos de goberno das universidades',
      description:
        'La Vanguardia recolle a petición de CREUP para que a futura LOSU garanta unha presenza do 35% do estudantado nos órganos de goberno universitarios.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat reivindica que la LOSU garantisca una presència del 35% en els òrgans de govern de les universitats",
      description:
        "La Vanguardia arreplega la petició de CREUP perquè la futura LOSU garantisca una presència del 35% de l'estudiantat en els òrgans de govern universitaris.",
    },
  ],
  'los-estudiantes-reivindican-que-la-losu-garantice-una-presen-2022-09-2': [
    {
      locale: 'en',
      title:
        "Students call for the LOSU to guarantee a 35% presence in universities' governing bodies",
      description:
        'Servimedia reports that CREUP will ask in Congress for the LOSU to guarantee a 35% student presence in university governing bodies.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat reivindica que la LOSU garanteixi una presència del 35% en els òrgans de govern de les universitats",
      description:
        "Servimedia informa que CREUP demanarà al Congrés que la LOSU garanteixi una presència del 35% de l'alumnat en els òrgans de govern universitaris.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek LOSUk unibertsitateen gobernu-organoetan % 35eko presentzia bermatzea aldarrikatzen dute',
      description:
        'Servimediak jakinarazi du CREUPek Kongresuan eskatuko duela LOSUk unibertsitateen gobernu-organoetan ikasleen % 35eko presentzia berma dezan.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado reivindica que a LOSU garanta unha presenza do 35% nos órganos de goberno das universidades',
      description:
        'Servimedia informa de que CREUP pedirá no Congreso que a LOSU garanta unha presenza do 35% do alumnado nos órganos de goberno universitarios.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat reivindica que la LOSU garantisca una presència del 35% en els òrgans de govern de les universitats",
      description:
        "Servimedia informa que CREUP demanarà en el Congrés que la LOSU garantisca una presència del 35% de l'alumnat en els òrgans de govern universitaris.",
    },
  ],
  'universitarios-trabajaran-en-el-proceso-de-tramitacion-parla-2022-09': [
    {
      locale: 'en',
      title:
        'University students will "work" on the parliamentary processing of the LOSU on matters affecting students',
      description:
        'Europa Press reports that CREUP will take part in the parliamentary processing of the LOSU, especially on the aspects affecting student participation.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat universitari «treballarà» en el procés de tramitació parlamentària de la LOSU en aspectes que afecten l'estudiantat",
      description:
        'Europa Press recull que CREUP participarà en el procés de tramitació parlamentària de la LOSU, especialment en els aspectes que afecten la participació estudiantil.',
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek LOSUren izapidetze parlamentarioan «lan egingo dute» ikasleei eragiten dieten alderdietan',
      description:
        'Europa Pressek jaso du CREUPek LOSUren izapidetze parlamentarioan parte hartuko duela, batez ere ikasleen partaidetzari eragiten dioten alderdietan.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado universitario «traballará» no proceso de tramitación parlamentaria da LOSU en aspectos que afectan o estudantado',
      description:
        'Europa Press recolle que CREUP participará no proceso de tramitación parlamentaria da LOSU, especialmente nos aspectos que afectan a participación estudantil.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat universitari «treballarà» en el procés de tramitació parlamentària de la LOSU en aspectes que afecten l'estudiantat",
      description:
        'Europa Press arreplega que CREUP participarà en el procés de tramitació parlamentària de la LOSU, especialment en els aspectes que afecten la participació estudiantil.',
    },
  ],
  'los-universitarios-piden-que-no-se-eliminen-las-practicas-en-2022-09': [
    {
      locale: 'en',
      title: 'University students ask that placements in public bodies not be eliminated',
      description:
        "Aula Magna reports CREUP's request that the Trainee Statute not eliminate placements in public bodies, which are especially relevant for many degree programmes.",
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat universitari demana que no s'eliminin les pràctiques en entitats públiques",
      description:
        "Aula Magna recull la petició de CREUP perquè l'Estatut del Becari no elimini les pràctiques en entitats públiques, especialment rellevants per a moltes titulacions.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitateko ikasleek erakunde publikoetako praktikak ez ezabatzeko eskatzen dute',
      description:
        'Aula Magnak jaso du CREUPen eskaera, Bekadunaren Estatutuak erakunde publikoetako praktikak ezaba ez ditzan, titulazio askorentzat bereziki garrantzitsuak baitira.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado universitario pide que non se eliminen as prácticas en entidades públicas',
      description:
        'Aula Magna recolle a petición de CREUP para que o Estatuto do Bolseiro non elimine as prácticas en entidades públicas, especialmente relevantes para moitas titulacións.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat universitari demana que no s'eliminen les pràctiques en entitats públiques",
      description:
        "Aula Magna arreplega la petició de CREUP perquè l'Estatut del Becari no elimine les pràctiques en entitats públiques, especialment rellevants per a moltes titulacions.",
    },
  ],
  'no-eliminar-las-practicas-en-entidades-publicas-2022-09': [
    {
      locale: 'en',
      title: 'Do not eliminate placements in public bodies',
      description:
        "Revista NUVE reports CREUP's position against eliminating extracurricular placements in public bodies and in favour of effective oversight, training quality and fair pay.",
    },
    {
      locale: 'ca',
      title: 'No eliminar les pràctiques en entitats públiques',
      description:
        "Revista NUVE recull la posició de CREUP contra l'eliminació de les pràctiques extracurriculars en entitats públiques i a favor de controls efectius, qualitat formativa i remuneració justa.",
    },
    {
      locale: 'eu',
      title: 'Ez ezabatu erakunde publikoetako praktikak',
      description:
        'Revista NUVEk jaso du CREUPen jarrera erakunde publikoetako kurrikulumetik kanpoko praktikak ezabatzearen aurka eta kontrol eraginkorren, prestakuntza-kalitatearen eta ordainsari bidezkoaren alde.',
    },
    {
      locale: 'gl',
      title: 'Non eliminar as prácticas en entidades públicas',
      description:
        'Revista NUVE recolle a posición de CREUP contra a eliminación das prácticas extracurriculares en entidades públicas e a favor de controis efectivos, calidade formativa e remuneración xusta.',
    },
    {
      locale: 'val',
      title: 'No eliminar les pràctiques en entitats públiques',
      description:
        "Revista NUVE arreplega la posició de CREUP contra l'eliminació de les pràctiques extracurriculars en entitats públiques i a favor de controls efectius, qualitat formativa i remuneració justa.",
    },
  ],
  'estudiantes-denuncian-la-exclusion-de-las-practicas-en-el-se-2022-08': [
    {
      locale: 'en',
      title: 'Students denounce the exclusion of placements in the public sector',
      description:
        "Magisnet reports CREUP's warning about a draft of the Trainee Statute that could prevent students from carrying out extracurricular placements in public bodies.",
    },
    {
      locale: 'ca',
      title: "L'estudiantat denuncia l'exclusió de les pràctiques en el sector públic",
      description:
        "Magisnet recull l'alerta de CREUP davant un esborrany de l'Estatut del Becari que podria impedir a l'estudiantat fer pràctiques extracurriculars en entitats públiques.",
    },
    {
      locale: 'eu',
      title: 'Ikasleek sektore publikoko praktiken bazterketa salatzen dute',
      description:
        'Magisnetek jaso du CREUPen abisua Bekadunaren Estatutuaren zirriborro baten aurrean, ikasleei erakunde publikoetan kurrikulumetik kanpoko praktikak egitea galaraz baitiezaieke.',
    },
    {
      locale: 'gl',
      title: 'O estudantado denuncia a exclusión das prácticas no sector público',
      description:
        'Magisnet recolle a alerta de CREUP ante un borrador do Estatuto do Bolseiro que podería impedir ao estudantado realizar prácticas extracurriculares en entidades públicas.',
    },
    {
      locale: 'val',
      title: "L'estudiantat denuncia l'exclusió de les pràctiques en el sector públic",
      description:
        "Magisnet arreplega l'alerta de CREUP davant un esborrany de l'Estatut del Becari que podria impedir a l'estudiantat fer pràctiques extracurriculars en entitats públiques.",
    },
  ],
  'universitarios-piden-al-ministerio-de-trabajo-que-no-elimine-2022-08': [
    {
      locale: 'en',
      title:
        'University students ask the Ministry of Labour not to eliminate placements in public bodies',
      description:
        'CREUP asks the Ministry of Labour that the future Statute for Students on Placement not eliminate extracurricular placements in public bodies and calls for paid placements with social-security contributions and quality.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat universitari demana al Ministeri de Treball que no elimini les pràctiques en entitats públiques",
      description:
        "CREUP demana al Ministeri de Treball que el futur Estatut de l'Estudiant en Pràctiques no elimini les pràctiques extracurriculars en entitats públiques i reclama pràctiques remunerades, cotitzades i de qualitat.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek Lan Ministerioari eskatzen diote erakunde publikoetako praktikak ez ezabatzeko',
      description:
        'CREUPek Lan Ministerioari eskatzen dio etorkizuneko Praktiketako Ikaslearen Estatutuak erakunde publikoetako kurrikulumetik kanpoko praktikak ezaba ez ditzan, eta praktika ordainduak, kotizatuak eta kalitatezkoak eskatzen ditu.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado universitario pide ao Ministerio de Traballo que non elimine as prácticas en entidades públicas',
      description:
        'CREUP pide ao Ministerio de Traballo que o futuro Estatuto do Estudante en Prácticas non elimine as prácticas extracurriculares en entidades públicas e reclama prácticas remuneradas, cotizadas e de calidade.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat universitari demana al Ministeri de Treball que no elimine les pràctiques en entitats públiques",
      description:
        "CREUP demana al Ministeri de Treball que el futur Estatut de l'Estudiant en Pràctiques no elimine les pràctiques extracurriculars en entitats públiques i reclama pràctiques remunerades, cotitzades i de qualitat.",
    },
  ],
  'estudiantes-denuncian-la-exclusion-de-las-practicas-en-el-se-2022-08-2': [
    {
      locale: 'en',
      title: 'Students denounce the exclusion of placements in the public sector',
      description:
        'CREUP calls for extracurricular placements in public institutions not to be left out of the Statute for Students on Placement and warns that their exclusion would harm degree programmes without curricular placements.',
    },
    {
      locale: 'ca',
      title: "L'estudiantat denuncia l'exclusió de les pràctiques en el sector públic",
      description:
        "CREUP reclama que les pràctiques extracurriculars en institucions públiques no quedin fora de l'Estatut de l'Estudiant en Pràctiques i adverteix que la seva exclusió perjudicaria titulacions sense pràctiques curriculars.",
    },
    {
      locale: 'eu',
      title: 'Ikasleek sektore publikoko praktiken bazterketa salatzen dute',
      description:
        'CREUPek eskatzen du erakunde publikoetako kurrikulumetik kanpoko praktikak Praktiketako Ikaslearen Estatututik kanpo gera ez daitezen, eta ohartarazten du haien bazterketak kurrikulumeko praktikarik gabeko titulazioei kalte egingo liekeela.',
    },
    {
      locale: 'gl',
      title: 'O estudantado denuncia a exclusión das prácticas no sector público',
      description:
        'CREUP reclama que as prácticas extracurriculares en institucións públicas non queden fóra do Estatuto do Estudante en Prácticas e advirte de que a súa exclusión prexudicaría titulacións sen prácticas curriculares.',
    },
    {
      locale: 'val',
      title: "L'estudiantat denuncia l'exclusió de les pràctiques en el sector públic",
      description:
        "CREUP reclama que les pràctiques extracurriculars en institucions públiques no queden fora de l'Estatut de l'Estudiant en Pràctiques i advertix que la seua exclusió perjudicaria titulacions sense pràctiques curriculars.",
    },
  ],
  'universitarios-solicitan-al-ministerio-de-trabajo-que-no-eli-2022-08': [
    {
      locale: 'en',
      title:
        'University students ask the Ministry of Labour not to eliminate placements in public bodies',
      description:
        'CREUP asks the Ministry of Labour not to eliminate extracurricular placements in public bodies and argues that precariousness is tackled with effective oversight, training value and fair pay.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat universitari sol·licita al Ministeri de Treball que no elimini les pràctiques en entitats públiques",
      description:
        'CREUP sol·licita al Ministeri de Treball que no elimini les pràctiques extracurriculars en entitats públiques i defensa que la precarietat es combat amb un control eficaç, formativitat i remuneració justa.',
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek Lan Ministerioari eskatzen diote erakunde publikoetako praktikak ez ezabatzeko',
      description:
        'CREUPek Lan Ministerioari eskatzen dio erakunde publikoetako kurrikulumetik kanpoko praktikak ezaba ez ditzan, eta defendatzen du prekarietatea kontrol eraginkorrarekin, prestakuntza-balioarekin eta ordainsari bidezkoarekin borrokatzen dela.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado universitario solicita ao Ministerio de Traballo que non elimine as prácticas en entidades públicas',
      description:
        'CREUP solicita ao Ministerio de Traballo que non elimine as prácticas extracurriculares en entidades públicas e defende que a precariedade se combate cun control eficaz, formatividade e remuneración xusta.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat universitari sol·licita al Ministeri de Treball que no elimine les pràctiques en entitats públiques",
      description:
        'CREUP sol·licita al Ministeri de Treball que no elimine les pràctiques extracurriculars en entitats públiques i defén que la precarietat es combat amb un control eficaç, formativitat i remuneració justa.',
    },
  ],
  'estudiantes-denuncian-la-exclusion-de-las-practicas-en-el-se-2022-08-3': [
    {
      locale: 'en',
      title: 'Students denounce the exclusion of placements in the public sector',
      description:
        'CREUP denounces that the draft of the Statute for Students on Placement may leave out extracurricular placements in public institutions and calls for their training quality to be guaranteed.',
    },
    {
      locale: 'ca',
      title: "L'estudiantat denuncia l'exclusió de les pràctiques en el sector públic",
      description:
        "CREUP denuncia que l'esborrany de l'Estatut de l'Estudiant en Pràctiques pot deixar fora les pràctiques extracurriculars en institucions públiques i reclama que se'n garanteixi la qualitat formativa.",
    },
    {
      locale: 'eu',
      title: 'Ikasleek sektore publikoko praktiken bazterketa salatzen dute',
      description:
        'CREUPek salatzen du Praktiketako Ikaslearen Estatutuaren zirriborroak erakunde publikoetako kurrikulumetik kanpoko praktikak kanpoan utz ditzakeela, eta haien prestakuntza-kalitatea bermatzeko eskatzen du.',
    },
    {
      locale: 'gl',
      title: 'O estudantado denuncia a exclusión das prácticas no sector público',
      description:
        'CREUP denuncia que o borrador do Estatuto do Estudante en Prácticas pode deixar fóra as prácticas extracurriculares en institucións públicas e reclama que se garanta a súa calidade formativa.',
    },
    {
      locale: 'val',
      title: "L'estudiantat denuncia l'exclusió de les pràctiques en el sector públic",
      description:
        "CREUP denuncia que l'esborrany de l'Estatut de l'Estudiant en Pràctiques pot deixar fora les pràctiques extracurriculars en institucions públiques i reclama que se'n garantisca la qualitat formativa.",
    },
  ],
  'universitarios-piden-al-ministerio-de-trabajo-que-no-elimine-2022-08-2': [
    {
      locale: 'en',
      title:
        'University students ask the Ministry of Labour not to eliminate placements in public bodies',
      description:
        'CREUP asks the Ministry of Labour not to eliminate extracurricular placements in public bodies and calls on universities to take greater responsibility for the oversight and quality of placements.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat universitari demana al Ministeri de Treball que no elimini les pràctiques en entitats públiques",
      description:
        'CREUP demana al Ministeri de Treball que no elimini les pràctiques extracurriculars en entitats públiques i reclama a les universitats una major responsabilitat sobre el control i la qualitat de les pràctiques.',
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek Lan Ministerioari eskatzen diote erakunde publikoetako praktikak ez ezabatzeko',
      description:
        'CREUPek Lan Ministerioari eskatzen dio erakunde publikoetako kurrikulumetik kanpoko praktikak ezaba ez ditzan, eta unibertsitateei eskatzen die praktiken kontrolaren eta kalitatearen gaineko erantzukizun handiagoa har dezaten.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado universitario pide ao Ministerio de Traballo que non elimine as prácticas en entidades públicas',
      description:
        'CREUP pide ao Ministerio de Traballo que non elimine as prácticas extracurriculares en entidades públicas e reclama ás universidades unha maior responsabilidade sobre o control e a calidade das prácticas.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat universitari demana al Ministeri de Treball que no elimine les pràctiques en entitats públiques",
      description:
        'CREUP demana al Ministeri de Treball que no elimine les pràctiques extracurriculars en entitats públiques i reclama a les universitats una major responsabilitat sobre el control i la qualitat de les pràctiques.',
    },
  ],
  'unos-30000-estudiantes-de-granada-pueden-beneficiarse-de-la-2022-07': [
    {
      locale: 'en',
      title:
        'Around 30,000 students in Granada could benefit from the 100-euro monthly grant announced by Pedro Sánchez',
      description:
        'Around 30,000 students in Granada could benefit from the additional 100-euro monthly aid announced by the Government for students over 16 who already receive a grant.',
    },
    {
      locale: 'ca',
      title:
        'Uns 30.000 estudiants de Granada poden beneficiar-se de la beca de 100 euros mensuals anunciada per Pedro Sánchez',
      description:
        "Uns 30.000 estudiants de Granada podrien beneficiar-se de l'ajuda addicional de 100 euros mensuals anunciada pel Govern per a l'alumnat major de 16 anys que ja rep beca.",
    },
    {
      locale: 'eu',
      title:
        'Granadako 30.000 ikasle inguruk Pedro Sánchezek iragarritako hileko 100 euroko bekaz balia daitezke',
      description:
        'Granadako 30.000 ikasle inguruk Gobernuak iragarritako hileko 100 euroko laguntza osagarriaz balia litezke, jada beka jasotzen duten 16 urtetik gorako ikasleentzat.',
    },
    {
      locale: 'gl',
      title:
        'Uns 30.000 estudantes de Granada poden beneficiarse da bolsa de 100 euros mensuais anunciada por Pedro Sánchez',
      description:
        'Uns 30.000 estudantes de Granada poderían beneficiarse da axuda adicional de 100 euros mensuais anunciada polo Goberno para o alumnado maior de 16 anos que xa recibe bolsa.',
    },
    {
      locale: 'val',
      title:
        'Uns 30.000 estudiants de Granada poden beneficiar-se de la beca de 100 euros mensuals anunciada per Pedro Sánchez',
      description:
        "Uns 30.000 estudiants de Granada podrien beneficiar-se de l'ajuda addicional de 100 euros mensuals anunciada pel Govern per a l'alumnat major de 16 anys que ja rep beca.",
    },
  ],
  'la-comunidad-educativa-pide-medidas-adicionales-a-la-beca-ex-2022-07': [
    {
      locale: 'en',
      title:
        'The educational community calls for additional measures alongside the extra 100-euro grant announced by Sánchez',
      description:
        'The educational community calls for the extra 100-euro monthly grant to be accompanied by additional measures to support students and families amid the economic crisis.',
    },
    {
      locale: 'ca',
      title:
        'La comunitat educativa demana mesures addicionals a la beca extra de 100 euros anunciada per Sánchez',
      description:
        "La comunitat educativa reclama que la beca extra de 100 euros mensuals vagi acompanyada de mesures addicionals de suport a l'alumnat i a les famílies davant la crisi econòmica.",
    },
    {
      locale: 'eu',
      title:
        'Hezkuntza-komunitateak neurri osagarriak eskatzen ditu Sánchezek iragarritako 100 euroko beka osagarriarekin batera',
      description:
        'Hezkuntza-komunitateak eskatzen du hileko 100 euroko beka osagarriak ikasleei eta familiei laguntzeko neurri osagarriak izan ditzala, krisi ekonomikoaren aurrean.',
    },
    {
      locale: 'gl',
      title:
        'A comunidade educativa pide medidas adicionais á bolsa extra de 100 euros anunciada por Sánchez',
      description:
        'A comunidade educativa reclama que a bolsa extra de 100 euros mensuais vaia acompañada de medidas adicionais de apoio ao alumnado e ás familias ante a crise económica.',
    },
    {
      locale: 'val',
      title:
        'La comunitat educativa demana mesures addicionals a la beca extra de 100 euros anunciada per Sánchez',
      description:
        "La comunitat educativa reclama que la beca extra de 100 euros mensuals vaja acompanyada de mesures addicionals de suport a l'alumnat i a les famílies davant la crisi econòmica.",
    },
  ],
  'trabajo-quiere-eliminar-las-practicas-extracurriculares-en-2-2022-07': [
    {
      locale: 'en',
      title: 'Ministry of Labour wants to abolish extracurricular internships in 2026',
      description:
        "The article addresses the proposal to abolish extracurricular internships in 2026 within the negotiation of the Trainee Statute and covers CREUP's participation in the dialogue process.",
    },
    {
      locale: 'ca',
      title: 'Treball vol eliminar les pràctiques extracurriculars el 2026',
      description:
        "L'article aborda la proposta d'eliminar les pràctiques extracurriculars el 2026 dins de la negociació de l'Estatut del Becari i recull la participació de CREUP en el procés de diàleg.",
    },
    {
      locale: 'eu',
      title: 'Lan Ministerioak praktika kurrikularetik kanpokoak ezabatu nahi ditu 2026an',
      description:
        'Artikuluak 2026an praktika kurrikularetik kanpokoak ezabatzeko proposamena lantzen du, Bekadunaren Estatutuaren negoziazioaren barruan, eta CREUPek elkarrizketa-prozesuan izandako parte-hartzea jasotzen du.',
    },
    {
      locale: 'gl',
      title: 'Traballo quere eliminar as prácticas extracurriculares en 2026',
      description:
        'O artigo aborda a proposta de eliminar as prácticas extracurriculares en 2026 dentro da negociación do Estatuto do Bolseiro e recolle a participación de CREUP no proceso de diálogo.',
    },
    {
      locale: 'val',
      title: 'Treball vol eliminar les pràctiques extracurriculars en 2026',
      description:
        "L'article aborda la proposta d'eliminar les pràctiques extracurriculars en 2026 dins de la negociació de l'Estatut del Becari i arreplega la participació de CREUP en el procés de diàleg.",
    },
  ],
  'creup-denuncia-que-subirats-ignore-sus-demandas-en-el-antepr-2022-06': [
    {
      locale: 'en',
      title: 'CREUP denounces that Subirats ignores its demands in the LOSU draft bill',
      description:
        'CREUP denounces that the LOSU draft bill leaves out key student demands, especially regarding co-governance, participation and real guarantees of rights.',
    },
    {
      locale: 'ca',
      title: "CREUP denuncia que Subirats ignori les seves demandes en l'avantprojecte de la LOSU",
      description:
        "CREUP denuncia que l'avantprojecte de la LOSU deixa fora demandes clau de l'estudiantat, especialment en matèria de cogovernança, participació i garanties reals de drets.",
    },
    {
      locale: 'eu',
      title:
        'CREUPek salatzen du Subiratsek bere eskaerak alde batera uzten dituela LOSUren aurreproiektuan',
      description:
        'CREUPek salatzen du LOSUren aurreproiektuak ikasleen funtsezko eskaerak kanpoan uzten dituela, bereziki kogobernantzaren, parte-hartzearen eta eskubideen benetako bermeen arloan.',
    },
    {
      locale: 'gl',
      title: 'CREUP denuncia que Subirats ignore as súas demandas no anteproxecto da LOSU',
      description:
        'CREUP denuncia que o anteproxecto da LOSU deixa fóra demandas clave do estudantado, especialmente en materia de cogobernanza, participación e garantías reais de dereitos.',
    },
    {
      locale: 'val',
      title: "CREUP denuncia que Subirats ignore les seues demandes en l'avantprojecte de la LOSU",
      description:
        "CREUP denuncia que l'avantprojecte de la LOSU deixa fora demandes clau de l'estudiantat, especialment en matèria de cogovernança, participació i garanties reals de drets.",
    },
  ],
  'creup-critica-que-la-losu-deja-de-lado-al-estudiantado-al-no-2022-06': [
    {
      locale: 'en',
      title:
        'CREUP criticises that the LOSU "sidelines" students by failing to introduce mechanisms "that guarantee their rights"',
      description:
        'CREUP criticises that the LOSU sidelines students by not introducing sufficient mechanisms to guarantee their rights, and calls for a greater presence in governing bodies and elections.',
    },
    {
      locale: 'ca',
      title:
        "CREUP critica que la LOSU «deixa de banda» l'estudiantat en no introduir mecanismes «que garanteixin els seus drets»",
      description:
        "CREUP critica que la LOSU deixa de banda l'estudiantat en no introduir mecanismes suficients per garantir els seus drets i reclama més presència en òrgans de govern i eleccions.",
    },
    {
      locale: 'eu',
      title:
        'CREUPek kritikatzen du LOSUk ikasleak «bazterrean uzten» dituela «haien eskubideak bermatzen dituzten» mekanismorik sartzen ez duelako',
      description:
        'CREUPek kritikatzen du LOSUk ikasleak bazterrean uzten dituela haien eskubideak bermatzeko mekanismo nahikorik sartzen ez duelako, eta gobernu-organoetan eta hauteskundeetan presentzia handiagoa eskatzen du.',
    },
    {
      locale: 'gl',
      title:
        'CREUP critica que a LOSU «deixa de lado» o estudantado ao non introducir mecanismos «que garantan os seus dereitos»',
      description:
        'CREUP critica que a LOSU deixa de lado o estudantado ao non introducir mecanismos suficientes para garantir os seus dereitos e reclama maior presenza en órganos de goberno e eleccións.',
    },
    {
      locale: 'val',
      title:
        "CREUP critica que la LOSU «deixa de costat» l'estudiantat en no introduir mecanismes «que garantisquen els seus drets»",
      description:
        "CREUP critica que la LOSU deixa de costat l'estudiantat en no introduir mecanismes suficients per a garantir els seus drets i reclama major presència en òrgans de govern i eleccions.",
    },
  ],
  'creup-critica-que-la-losu-deja-de-lado-al-estudiantado-al-no-2022-06-2': [
    {
      locale: 'en',
      title:
        'CREUP criticises that the LOSU "sidelines" students by failing to introduce mechanisms "that guarantee their rights"',
      description:
        "CREUP maintains that the LOSU draft bill relegates student participation to the background and calls for mechanisms that make the students' voice binding in decisions that affect them.",
    },
    {
      locale: 'ca',
      title:
        "CREUP critica que la LOSU «deixa de banda» l'estudiantat en no introduir mecanismes «que garanteixin els seus drets»",
      description:
        "CREUP sosté que l'avantprojecte de la LOSU relega la participació estudiantil a un segon pla i reclama mecanismes que facin vinculant la veu de l'estudiantat en decisions que l'afectin.",
    },
    {
      locale: 'eu',
      title:
        'CREUPek kritikatzen du LOSUk ikasleak «bazterrean uzten» dituela «haien eskubideak bermatzen dituzten» mekanismorik sartzen ez duelako',
      description:
        'CREUPek dio LOSUren aurreproiektuak ikasleen parte-hartzea bigarren mailara baztertzen duela, eta ikasleen ahotsa eragiten dieten erabakietan lotesle bihurtuko duten mekanismoak eskatzen ditu.',
    },
    {
      locale: 'gl',
      title:
        'CREUP critica que a LOSU «deixa de lado» o estudantado ao non introducir mecanismos «que garantan os seus dereitos»',
      description:
        'CREUP sostén que o anteproxecto da LOSU relega a participación estudantil a un segundo plano e reclama mecanismos que fagan vinculante a voz do estudantado en decisións que o afecten.',
    },
    {
      locale: 'val',
      title:
        "CREUP critica que la LOSU «deixa de costat» l'estudiantat en no introduir mecanismes «que garantisquen els seus drets»",
      description:
        "CREUP sosté que l'avantprojecte de la LOSU relega la participació estudiantil a un segon pla i reclama mecanismes que facen vinculant la veu de l'estudiantat en decisions que l'afecten.",
    },
  ],
  'la-ley-de-universidades-de-subirats-invertir-el-1-del-pib-re-2022-06': [
    {
      locale: 'en',
      title:
        "Subirats's university law: investing 1% of GDP, reducing temporary employment and recognising the right to academic strike",
      description:
        "Newtral analyses the key points of Subirats's university law, including funding, the reduction of temporary employment, the right to academic strike and changes in the election of the rector.",
    },
    {
      locale: 'ca',
      title:
        "La llei d'Universitats de Subirats: invertir l'1 % del PIB, reduir la temporalitat i reconèixer el dret a la vaga acadèmica",
      description:
        "Newtral analitza les claus de la llei d'universitats de Subirats, incloent-hi el finançament, la reducció de la temporalitat, el dret a la vaga acadèmica i els canvis en l'elecció del rector.",
    },
    {
      locale: 'eu',
      title:
        'Subiratsen Unibertsitateen legea: BPGaren % 1 inbertitzea, behin-behinekotasuna murriztea eta greba akademikorako eskubidea aitortzea',
      description:
        'Newtralek Subiratsen unibertsitateen legearen gakoak aztertzen ditu, finantzaketa, behin-behinekotasunaren murrizketa, greba akademikorako eskubidea eta errektorearen hautaketan izandako aldaketak barne.',
    },
    {
      locale: 'gl',
      title:
        'A lei de Universidades de Subirats: investir o 1 % do PIB, reducir a temporalidade e recoñecer o dereito á folga académica',
      description:
        'Newtral analiza as claves da lei de universidades de Subirats, incluíndo o financiamento, a redución da temporalidade, o dereito á folga académica e os cambios na elección do reitor.',
    },
    {
      locale: 'val',
      title:
        "La llei d'Universitats de Subirats: invertir l'1 % del PIB, reduir la temporalitat i reconéixer el dret a la vaga acadèmica",
      description:
        "Newtral analitza les claus de la llei d'universitats de Subirats, incloent-hi el finançament, la reducció de la temporalitat, el dret a la vaga acadèmica i els canvis en l'elecció del rector.",
    },
  ],
  'asociaciones-de-estudiantes-denuncian-que-subirats-los-deja-2022-06': [
    {
      locale: 'en',
      title:
        'Student associations denounce that Subirats leaves them "to one side" in the reform of the university law',
      description:
        "CREUP denounces that Subirats sidelines students' demands in the university reform and calls for a more democratic, participatory and high-quality university.",
    },
    {
      locale: 'ca',
      title:
        "Associacions d'estudiants denuncien que Subirats els deixa «de banda» en la reforma de la llei d'Universitats",
      description:
        "CREUP denuncia que Subirats deixa de banda les demandes de l'estudiantat en la reforma universitària i reclama una universitat més democràtica, participativa i de qualitat.",
    },
    {
      locale: 'eu',
      title:
        'Ikasle-elkarteek salatzen dute Subiratsek «alde batera» uzten dituela Unibertsitateen legearen erreforman',
      description:
        'CREUPek salatzen du Subiratsek ikasleen eskaerak alde batera uzten dituela unibertsitate-erreforman, eta unibertsitate demokratikoago, parte-hartzaileago eta kalitatezkoago bat eskatzen du.',
    },
    {
      locale: 'gl',
      title:
        'Asociacións de estudantes denuncian que Subirats os deixa «de lado» na reforma da lei de Universidades',
      description:
        'CREUP denuncia que Subirats deixa de lado as demandas do estudantado na reforma universitaria e reclama unha universidade máis democrática, participativa e de calidade.',
    },
    {
      locale: 'val',
      title:
        "Associacions d'estudiants denuncien que Subirats els deixa «de costat» en la reforma de la llei d'Universitats",
      description:
        "CREUP denuncia que Subirats deixa de costat les demandes de l'estudiantat en la reforma universitària i reclama una universitat més democràtica, participativa i de qualitat.",
    },
  ],
  'luz-verde-al-anteproyecto-de-la-ley-organica-de-universidade-2022-06': [
    {
      locale: 'en',
      title:
        'Green light for the draft bill of the Organic Law on Universities today in the Council of Ministers',
      description:
        'Aprendemas summarises the LOSU draft bill, with measures on the temporary employment of academic staff, academic strike, the range of studies offered and student representation.',
    },
    {
      locale: 'ca',
      title:
        "Llum verd a l'avantprojecte de la Llei Orgànica d'Universitats avui en el Consell de Ministres",
      description:
        "Aprendemas resumeix l'avantprojecte de la LOSU, amb mesures sobre la temporalitat del professorat, la vaga acadèmica, l'oferta d'estudis i la representació estudiantil.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateen Lege Organikoaren aurreproiektuari argi berdea gaur Ministroen Kontseiluan',
      description:
        'Aprendemasek LOSUren aurreproiektua laburbiltzen du, irakasleen behin-behinekotasunari, greba akademikoari, ikasketa-eskaintzari eta ikasleen ordezkaritzari buruzko neurriekin.',
    },
    {
      locale: 'gl',
      title:
        'Luz verde ao anteproxecto da Lei Orgánica de Universidades hoxe no Consello de Ministros',
      description:
        'Aprendemas resume o anteproxecto da LOSU, con medidas sobre a temporalidade do profesorado, a folga académica, a oferta de estudos e a representación estudantil.',
    },
    {
      locale: 'val',
      title:
        "Llum verda a l'avantprojecte de la Llei Orgànica d'Universitats hui en el Consell de Ministres",
      description:
        "Aprendemas resumix l'avantprojecte de la LOSU, amb mesures sobre la temporalitat del professorat, la vaga acadèmica, l'oferta d'estudis i la representació estudiantil.",
    },
  ],
  'xxx-jornadas-crue-sostenibilidad-los-ods-en-la-formacion-uni-2022-06': [
    {
      locale: 'en',
      title: '30th Crue-Sustainability Conference: the SDGs in university education',
      description:
        "CRUE reports on the holding of the 30th Crue-Sustainability Conference, focused on integrating the SDGs into university education and with the participation of CREUP's president.",
    },
    {
      locale: 'ca',
      title: 'XXX Jornades Crue-Sostenibilitat: els ODS en la formació universitària',
      description:
        'CRUE recull la celebració de les XXX Jornades Crue-Sostenibilitat, centrades en la integració dels ODS en la formació universitària i amb la participació del president de CREUP.',
    },
    {
      locale: 'eu',
      title: 'XXX. Crue-Iraunkortasuna Jardunaldiak: GIHak unibertsitate-prestakuntzan',
      description:
        'CRUEk XXX. Crue-Iraunkortasuna Jardunaldiak egin izana jasotzen du; GIHak unibertsitate-prestakuntzan txertatzean oinarrituak daude eta CREUPeko presidenteak parte hartu du.',
    },
    {
      locale: 'gl',
      title: 'XXX Xornadas Crue-Sustentabilidade: os ODS na formación universitaria',
      description:
        'CRUE recolle a celebración das XXX Xornadas Crue-Sustentabilidade, centradas na integración dos ODS na formación universitaria e coa participación do presidente de CREUP.',
    },
    {
      locale: 'val',
      title: 'XXX Jornades Crue-Sostenibilitat: els ODS en la formació universitària',
      description:
        'CRUE arreplega la celebració de les XXX Jornades Crue-Sostenibilitat, centrades en la integració dels ODS en la formació universitària i amb la participació del president de CREUP.',
    },
  ],
  'los-estudiantes-reclaman-al-ministerio-cambios-en-el-nuevo-b-2022-06': [
    {
      locale: 'en',
      title: 'Students demand changes from the Ministry in the new LOSU draft',
      description:
        'Students demand changes in the new LOSU draft, with particular attention to university governance, rectoral terms, study plans and resources for student representation.',
    },
    {
      locale: 'ca',
      title: "L'estudiantat reclama al Ministeri canvis en el nou esborrany de la LOSU",
      description:
        "L'estudiantat reclama canvis en el nou esborrany de la LOSU, amb especial atenció a la governança universitària, els mandats rectorals, els plans d'estudi i els recursos per a la representació estudiantil.",
    },
    {
      locale: 'eu',
      title: 'Ikasleek Ministerioari LOSUren zirriborro berrian aldaketak eskatzen dizkiote',
      description:
        'Ikasleek LOSUren zirriborro berrian aldaketak eskatzen dituzte, arreta berezia jarriz unibertsitate-gobernantzan, errektore-aginteetan, ikasketa-planetan eta ikasleen ordezkaritzarako baliabideetan.',
    },
    {
      locale: 'gl',
      title: 'O estudantado reclama ao Ministerio cambios no novo borrador da LOSU',
      description:
        'O estudantado reclama cambios no novo borrador da LOSU, con especial atención á gobernanza universitaria, os mandatos reitorais, os plans de estudo e os recursos para a representación estudantil.',
    },
    {
      locale: 'val',
      title: "L'estudiantat reclama al Ministeri canvis en el nou esborrany de la LOSU",
      description:
        "L'estudiantat reclama canvis en el nou esborrany de la LOSU, amb especial atenció a la governança universitària, els mandats rectorals, els plans d'estudi i els recursos per a la representació estudiantil.",
    },
  ],
  'estudiantes-piden-participar-en-los-planes-de-estudios-unive-2022-06': [
    {
      locale: 'en',
      title:
        'Students ask to take part in university study plans and to be able to study in Catalan or Basque',
      description:
        'CREUP and CEUNE reject the LOSU draft and call for binding student participation in study plans, course guides and governing bodies.',
    },
    {
      locale: 'ca',
      title:
        "Els estudiants demanen participar en els plans d'estudis universitaris i poder estudiar en català o euskera",
      description:
        "CREUP i CEUNE rebutgen l'esborrany de la LOSU i reclamen la participació vinculant de l'estudiantat en els plans d'estudi, les guies docents i els òrgans de govern.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek unibertsitateko ikasketa-planetan parte hartzea eta katalanez edo euskaraz ikasi ahal izatea eskatzen dute',
      description:
        'CREUPek eta CEUNEk LOSUren zirriborroa baztertzen dute eta ikasleen parte-hartze loteslea eskatzen dute ikasketa-planetan, irakas-gidetan eta gobernu-organoetan.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes piden participar nos plans de estudos universitarios e poder estudar en catalán ou éuscaro',
      description:
        'CREUP e CEUNE rexeitan o borrador da LOSU e reclaman a participación vinculante do estudantado nos plans de estudo, as guías docentes e os órganos de goberno.',
    },
    {
      locale: 'val',
      title:
        "Els estudiants demanen participar en els plans d'estudis universitaris i poder estudiar en català o basc",
      description:
        "CREUP i CEUNE rebutgen l'esborrany de la LOSU i reclamen la participació vinculant de l'estudiantat en els plans d'estudi, les guies docents i els òrgans de govern.",
    },
  ],
  'el-gobierno-presenta-una-ley-de-universidades-abierta-para-e-2022-05': [
    {
      locale: 'en',
      title: 'The Government presents an "open" university law to dodge criticism',
      description:
        'The new LOSU draft expands the autonomy of universities, reduces the requirements to become rector and keeps open the debate on the weight of students in governance.',
    },
    {
      locale: 'ca',
      title: "El Govern presenta una llei d'universitats «oberta» per esquivar les crítiques",
      description:
        "El nou esborrany de la LOSU amplia l'autonomia de les universitats, redueix els requisits per ser rector i manté obert el debat sobre el pes de l'estudiantat en la governança.",
    },
    {
      locale: 'eu',
      title: 'Gobernuak unibertsitateen lege «ireki» bat aurkezten du kritikak saihesteko',
      description:
        'LOSUren zirriborro berriak unibertsitateen autonomia zabaltzen du, errektore izateko baldintzak murrizten ditu eta ikasleek gobernantzan duten pisuari buruzko eztabaida irekita uzten du.',
    },
    {
      locale: 'gl',
      title: 'O Goberno presenta unha lei de universidades «aberta» para esquivar as críticas',
      description:
        'O novo borrador da LOSU amplía a autonomía das universidades, reduce os requisitos para ser reitor e mantén aberto o debate sobre o peso do estudantado na gobernanza.',
    },
    {
      locale: 'val',
      title: "El Govern presenta una llei d'universitats «oberta» per a esquivar les crítiques",
      description:
        "El nou esborrany de la LOSU amplia l'autonomia de les universitats, reduïx els requisits per a ser rector i manté obert el debat sobre el pes de l'estudiantat en la governança.",
    },
  ],
  'lestatut-del-becari-una-nova-oportunitat-per-a-frenar-larbit-2022-05': [
    {
      locale: 'en',
      title: 'The Trainee Statute, a new opportunity to curb arbitrariness in internships',
      description:
        "À Punt analyses the future Trainee Statute and gathers student representatives' assessment of the opportunity to place students at the centre of the reform of internships.",
    },
    {
      locale: 'ca',
      title:
        "L'Estatut del Becari, una nova oportunitat per frenar l'arbitrarietat en les pràctiques",
      description:
        "À Punt analitza el futur Estatut del Becari i recull la valoració de representants estudiantils sobre l'oportunitat de situar l'alumnat al centre de la reforma de les pràctiques.",
    },
    {
      locale: 'eu',
      title: 'Bekadunaren Estatutua, praktiketan arbitrariotasuna geldiarazteko aukera berri bat',
      description:
        'À Puntek etorkizuneko Bekadunaren Estatutua aztertzen du, eta ikasle-ordezkarien balorazioa jasotzen du, ikasleak praktiken erreformaren erdigunean kokatzeko aukerari buruz.',
    },
    {
      locale: 'gl',
      title:
        'O Estatuto do Bolseiro, unha nova oportunidade para frear a arbitrariedade nas prácticas',
      description:
        'À Punt analiza o futuro Estatuto do Bolseiro e recolle a valoración de representantes estudantís sobre a oportunidade de situar o alumnado no centro da reforma das prácticas.',
    },
    {
      locale: 'val',
      title:
        "L'Estatut del Becari, una nova oportunitat per a frenar l'arbitrarietat en les pràctiques",
      description:
        "À Punt analitza el futur Estatut del Becari i arreplega la valoració de representants estudiantils sobre l'oportunitat de situar l'alumnat en el centre de la reforma de les pràctiques.",
    },
  ],
  'sindicatos-y-estudiantes-aplauden-las-novedades-en-la-ley-de-2022-05': [
    {
      locale: 'en',
      title:
        'Unions and students applaud the new features in the university law, but criticise that it keeps "generic" points',
      description:
        'CREUP and CEUNE welcome some advances in the new LOSU draft, but warn that it does not guarantee genuine student participation or greater governance.',
    },
    {
      locale: 'ca',
      title:
        "Sindicats i estudiants aplaudeixen les novetats en la llei d'universitats, però retreuen que mantingui punts «generalistes»",
      description:
        "CREUP i CEUNE valoren alguns avenços del nou esborrany de la LOSU, però adverteixen que no garanteix una participació real de l'estudiantat ni una major governança.",
    },
    {
      locale: 'eu',
      title:
        'Sindikatuek eta ikasleek unibertsitateen legearen berritasunak txalotzen dituzte, baina puntu «orokorrak» mantentzea aurpegiratzen diote',
      description:
        'CREUPek eta CEUNEk LOSUren zirriborro berriaren zenbait aurrerapauso baloratzen dituzte, baina ohartarazten dute ez duela ikasleen benetako parte-hartzerik ez gobernantza handiagorik bermatzen.',
    },
    {
      locale: 'gl',
      title:
        'Sindicatos e estudantes aplauden as novidades na lei de universidades, pero reprochan que manteña puntos «xeneralistas»',
      description:
        'CREUP e CEUNE valoran algúns avances do novo borrador da LOSU, pero advirten de que non garante unha participación real do estudantado nin unha maior gobernanza.',
    },
    {
      locale: 'val',
      title:
        "Sindicats i estudiants aplaudixen les novetats en la llei d'universitats, però retrauen que mantinga punts «generalistes»",
      description:
        "CREUP i CEUNE valoren alguns avanços del nou esborrany de la LOSU, però advertixen que no garantix una participació real de l'estudiantat ni una major governança.",
    },
  ],
  'creup-y-ceune-denuncian-que-la-losu-no-avanza-lo-suficiente-2022-05': [
    {
      locale: 'en',
      title: 'CREUP and CEUNE denounce that "the LOSU does not go far enough"',
      description:
        'CREUP and CEUNE consider that the new LOSU draft ignores the reality of students and maintains insufficient representation in governing bodies.',
    },
    {
      locale: 'ca',
      title: 'CREUP i CEUNE denuncien que «la LOSU no avança prou»',
      description:
        "CREUP i CEUNE consideren que el nou esborrany de la LOSU ignora la realitat de l'estudiantat i manté una representació insuficient en els òrgans de govern.",
    },
    {
      locale: 'eu',
      title: 'CREUPek eta CEUNEk salatzen dute «LOSUk ez duela behar bezainbeste aurrera egiten»',
      description:
        'CREUPek eta CEUNEk uste dute LOSUren zirriborro berriak ikasleen errealitateari jaramonik egiten ez diola eta gobernu-organoetan ordezkaritza eskasa mantentzen duela.',
    },
    {
      locale: 'gl',
      title: 'CREUP e CEUNE denuncian que «a LOSU non avanza o suficiente»',
      description:
        'CREUP e CEUNE consideran que o novo borrador da LOSU ignora a realidade do estudantado e mantén unha representación insuficiente nos órganos de goberno.',
    },
    {
      locale: 'val',
      title: 'CREUP i CEUNE denuncien que «la LOSU no avança el suficient»',
      description:
        "CREUP i CEUNE consideren que el nou esborrany de la LOSU ignora la realitat de l'estudiantat i manté una representació insuficient en els òrgans de govern.",
    },
  ],
  'los-becarios-podrian-tener-derecho-a-paro-si-prospera-la-pro-2022-05': [
    {
      locale: 'en',
      title:
        "Trainees could be entitled to unemployment benefit if the Ministry of Labour's proposal goes ahead",
      description:
        'The Ministry of Labour is studying whether internships should generate entitlement to unemployment benefit and announces that it will bring young people into the Trainee Statute debate after meeting with CREUP and the Youth Council.',
    },
    {
      locale: 'ca',
      title: "Els becaris podrien tenir dret a l'atur si prospera la proposta de Treball",
      description:
        "Treball estudia que les pràctiques generin dret a prestació per desocupació i anuncia que incorporarà els joves al debat de l'Estatut del Becari després de reunir-se amb CREUP i el Consell de la Joventut.",
    },
    {
      locale: 'eu',
      title:
        'Bekadunek langabezia-prestaziorako eskubidea izan lezakete Lan Ministerioaren proposamenak aurrera egiten badu',
      description:
        'Lan Ministerioak praktikek langabezia-prestaziorako eskubidea sor dezaten aztertzen ari da, eta iragarri du gazteak Bekadunaren Estatutuaren eztabaidan sartuko dituela, CREUPekin eta Gazteriaren Kontseiluarekin bildu ondoren.',
    },
    {
      locale: 'gl',
      title: 'Os bolseiros poderían ter dereito ao paro se prospera a proposta de Traballo',
      description:
        'Traballo estuda que as prácticas xeren dereito a prestación por desemprego e anuncia que incorporará a mocidade ao debate do Estatuto do Bolseiro tras reunirse con CREUP e o Consello da Xuventude.',
    },
    {
      locale: 'val',
      title: "Els becaris podrien tindre dret a l'atur si prospera la proposta de Treball",
      description:
        "Treball estudia que les pràctiques generen dret a prestació per desocupació i anuncia que incorporarà els jóvens al debat de l'Estatut del Becari després de reunir-se amb CREUP i el Consell de la Joventut.",
    },
  ],
  'reunion-creup-yolanda-diaz-por-el-estatuto-del-becario-2022-05': [
    {
      locale: 'en',
      title: 'CREUP-Yolanda Díaz meeting on the Trainee Statute',
      description:
        'CREUP meets with Yolanda Díaz to convey its demands on training internships, financial compensation, control of labour fraud and student participation in the design of internships.',
    },
    {
      locale: 'ca',
      title: "Reunió CREUP-Yolanda Díaz per l'Estatut del Becari",
      description:
        "CREUP es reuneix amb Yolanda Díaz per traslladar les seves reivindicacions sobre pràctiques formatives, compensació econòmica, control del frau laboral i participació de l'estudiantat en el disseny de les pràctiques.",
    },
    {
      locale: 'eu',
      title: 'CREUP-Yolanda Díaz bilera Bekadunaren Estatutuagatik',
      description:
        'CREUP Yolanda Díazekin biltzen da bere aldarrikapenak helarazteko prestakuntza-praktiken, konpentsazio ekonomikoaren, lan-iruzurraren kontrolaren eta ikasleek praktiken diseinuan duten parte-hartzearen inguruan.',
    },
    {
      locale: 'gl',
      title: 'Reunión CREUP-Yolanda Díaz polo Estatuto do Bolseiro',
      description:
        'CREUP reúnese con Yolanda Díaz para trasladar as súas reivindicacións sobre prácticas formativas, compensación económica, control da fraude laboral e participación do estudantado no deseño das prácticas.',
    },
    {
      locale: 'val',
      title: "Reunió CREUP-Yolanda Díaz per l'Estatut del Becari",
      description:
        "CREUP es reunix amb Yolanda Díaz per a traslladar les seues reivindicacions sobre pràctiques formatives, compensació econòmica, control del frau laboral i participació de l'estudiantat en el disseny de les pràctiques.",
    },
  ],
  'la-nueva-ley-de-universidades-elimina-los-requisitos-para-se-2022-05': [
    {
      locale: 'en',
      title:
        'The new university law removes the requirements to become rector and leaves syllabus and exams in the hands of students',
      description:
        'The draft bill reduces the state requirements to become rector and recognises binding student participation in study plans and course guides, although it does not increase their weight in governing bodies.',
    },
    {
      locale: 'ca',
      title:
        "La nova llei d'Universitats elimina els requisits per ser rector i deixa en mans de l'alumnat el temari i els exàmens",
      description:
        "L'avantprojecte redueix els requisits estatals per ser rector i reconeix la participació vinculant de l'estudiantat en plans d'estudi i guies docents, encara que no augmenta el seu pes en els òrgans de govern.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateen lege berriak errektore izateko baldintzak ezabatzen ditu eta gaitegia eta azterketak ikasleen esku uzten ditu',
      description:
        'Aurreproiektuak errektore izateko estatu-baldintzak murrizten ditu eta ikasleen parte-hartze loteslea aitortzen du ikasketa-planetan eta irakas-gidetan, nahiz eta gobernu-organoetan duten pisua handitzen ez duen.',
    },
    {
      locale: 'gl',
      title:
        'A nova lei de Universidades elimina os requisitos para ser reitor e deixa en mans do alumnado o temario e os exames',
      description:
        'O anteproxecto reduce os requisitos estatais para ser reitor e recoñece a participación vinculante do estudantado en plans de estudo e guías docentes, aínda que non aumenta o seu peso nos órganos de goberno.',
    },
    {
      locale: 'val',
      title:
        "La nova llei d'Universitats elimina els requisits per a ser rector i deixa en mans de l'alumnat el temari i els exàmens",
      description:
        "L'avantprojecte reduïx els requisits estatals per a ser rector i reconeix la participació vinculant de l'estudiantat en plans d'estudi i guies docents, encara que no augmenta el seu pes en els òrgans de govern.",
    },
  ],
  'estudiantes-valoran-los-avances-de-la-ley-de-universidades-p-2022-05': [
    {
      locale: 'en',
      title:
        'Students value the "advances" of the university law but ask to be given "greater governance"',
      description:
        'CREUP and CEUNE acknowledge advances in the LOSU draft bill, but consider the text insufficient and call for greater governance for students.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat valora els «avenços» de la Llei d'Universitats però demana que se'l doti de «major governança»",
      description:
        "CREUP i CEUNE reconeixen avenços en l'avantprojecte de la LOSU, però consideren insuficient el text i reclamen més governança per a l'estudiantat.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek Unibertsitateen Legearen «aurrerapausoak» baloratzen dituzte, baina «gobernantza handiagoa» emateko eskatzen dute',
      description:
        'CREUPek eta CEUNEk LOSUren aurreproiektuko aurrerapausoak aitortzen dituzte, baina testua nahikoa ez dela uste dute eta ikasleentzako gobernantza handiagoa eskatzen dute.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado valora os «avances» da Lei de Universidades pero pide que se lle dote de «maior gobernanza»',
      description:
        'CREUP e CEUNE recoñecen avances no anteproxecto da LOSU, pero consideran insuficiente o texto e reclaman maior gobernanza para o estudantado.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat valora els «avanços» de la Llei d'Universitats però demana que se li dote de «major governança»",
      description:
        "CREUP i CEUNE reconeixen avanços en l'avantprojecte de la LOSU, però consideren insuficient el text i reclamen major governança per a l'estudiantat.",
    },
  ],
  'estudiantes-valoran-los-avances-de-la-ley-de-universidades-p-2022-05-2': [
    {
      locale: 'en',
      title:
        'Students value the "advances" of the university law but ask to be given "greater governance"',
      description:
        'CREUP and CEUNE value the new rights set out in the LOSU draft bill, but call for sufficient student representation in bodies and votes.',
    },
    {
      locale: 'ca',
      title:
        "L'estudiantat valora els «avenços» de la Llei d'Universitats però demana que se'l doti de «major governança»",
      description:
        "CREUP i CEUNE valoren els nous drets recollits en l'avantprojecte de la LOSU, però reclamen una representació estudiantil suficient en òrgans i votacions.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek Unibertsitateen Legearen «aurrerapausoak» baloratzen dituzte, baina «gobernantza handiagoa» emateko eskatzen dute',
      description:
        'CREUPek eta CEUNEk LOSUren aurreproiektuan jasotako eskubide berriak baloratzen dituzte, baina organoetan eta bozketetan ikasleen ordezkaritza nahikoa eskatzen dute.',
    },
    {
      locale: 'gl',
      title:
        'O estudantado valora os «avances» da Lei de Universidades pero pide que se lle dote de «maior gobernanza»',
      description:
        'CREUP e CEUNE valoran os novos dereitos recollidos no anteproxecto da LOSU, pero reclaman unha representación estudantil suficiente en órganos e votacións.',
    },
    {
      locale: 'val',
      title:
        "L'estudiantat valora els «avanços» de la Llei d'Universitats però demana que se li dote de «major governança»",
      description:
        "CREUP i CEUNE valoren els nous drets arreplegats en l'avantprojecte de la LOSU, però reclamen una representació estudiantil suficient en òrgans i votacions.",
    },
  ],
  'yolanda-diaz-impone-la-compensacion-de-gastos-a-becarios-fre-2022-05': [
    {
      locale: 'en',
      title:
        'Yolanda Díaz imposes the reimbursement of expenses for trainees against the reluctance of rectors',
      description:
        'Yolanda Díaz argues that people on internships should not have to bear expenses in order to train, and commits to listening to CREUP and the Youth Council on the Trainee Statute.',
    },
    {
      locale: 'ca',
      title:
        'Yolanda Díaz imposa la compensació de despeses als becaris davant les reticències dels rectors',
      description:
        "Yolanda Díaz defensa que les persones en pràctiques no hagin d'assumir despeses per formar-se i es compromet a escoltar CREUP i el Consell de la Joventut en l'Estatut del Becari.",
    },
    {
      locale: 'eu',
      title:
        'Yolanda Díazek bekadunei gastuen konpentsazioa ezartzen die errektoreen erreparoen aurrean',
      description:
        'Yolanda Díazek defendatzen du praktiketan dauden pertsonek ez dutela gastuak ordaindu behar prestatzeko, eta CREUP eta Gazteriaren Kontseilua entzuteko konpromisoa hartzen du Bekadunaren Estatutuan.',
    },
    {
      locale: 'gl',
      title:
        'Yolanda Díaz impón a compensación de gastos aos bolseiros fronte ás reticencias dos reitores',
      description:
        'Yolanda Díaz defende que as persoas en prácticas non teñan que asumir gastos para formarse e comprométese a escoitar CREUP e o Consello da Xuventude no Estatuto do Bolseiro.',
    },
    {
      locale: 'val',
      title:
        'Yolanda Díaz impon la compensació de despeses als becaris davant les reticències dels rectors',
      description:
        "Yolanda Díaz defén que les persones en pràctiques no hagen d'assumir despeses per a formar-se i es compromet a escoltar CREUP i el Consell de la Joventut en l'Estatut del Becari.",
    },
  ],
  'subirats-permitira-en-su-nueva-ley-de-universidades-que-los-2022-05': [
    {
      locale: 'en',
      title:
        'Subirats will allow students to "oversee" exams and study plans in his new Universities Act',
      description:
        'The LOSU draft bill recognises binding student participation in study plans and teaching guides, a measure welcomed by CREUP.',
    },
    {
      locale: 'ca',
      title:
        "Subirats permetrà en la seua nova Llei d'Universitats que l'alumnat «controle» els exàmens i els plans d'estudis",
      description:
        "L'avantprojecte de la LOSU reconeix la participació vinculant de l'estudiantat en els plans d'estudi i les guies docents, una mesura valorada positivament per CREUP.",
    },
    {
      locale: 'eu',
      title:
        'Subiratsek bere Unibertsitateen Lege berrian ikasleek azterketak eta ikasketa-planak «kontrolatzea» ahalbidetuko du',
      description:
        'LOSUren aurreproiektuak ikasketa-planetan eta irakaskuntza-gidetan ikasleriaren parte-hartze loteslea aitortzen du, CREUPek positiboki balioetsitako neurria.',
    },
    {
      locale: 'gl',
      title:
        'Subirats permitirá na súa nova Lei de Universidades que o alumnado «controle» os exames e os plans de estudos',
      description:
        'O anteproxecto da LOSU recoñece a participación vinculante do estudantado nos plans de estudo e nas guías docentes, unha medida valorada positivamente por CREUP.',
    },
    {
      locale: 'val',
      title:
        "Subirats permetrà en esta nova Llei d'Universitats que l'alumnat «controle» els exàmens i els plans d'estudis",
      description:
        "L'avantprojecte de la LOSU reconeix la participació vinculant de l'estudiantat en els plans d'estudi i les guies docents, una mesura valorada positivament per CREUP.",
    },
  ],
  'diaz-avisa-a-los-rectores-universitarios-de-que-no-pueden-se-2022-05': [
    {
      locale: 'en',
      title:
        'Díaz warns university rectors that they "cannot be an island removed" from the fight against precariousness',
      description:
        'Yolanda Díaz urges rectors to commit against precariousness and argues that the Intern Statute should include expense reimbursement for students on placements.',
    },
    {
      locale: 'ca',
      title:
        'Díaz avisa els rectors universitaris que «no poden ser una illa allunyada» de la lluita contra la precarietat',
      description:
        "Yolanda Díaz demana als rectors compromís davant la precarietat i defensa que l'Estatut del Becari incloga la compensació de despeses per a l'estudiantat en pràctiques.",
    },
    {
      locale: 'eu',
      title:
        'Díazek unibertsitateko errektoreei ohartarazi die «ezin direla urruneko irla bat izan» prekarietatearen aurkako borrokan',
      description:
        'Yolanda Díazek errektoreei prekarietatearen aurrean konpromisoa eskatu die, eta Bekadunaren Estatutuak praktiketako ikasleentzat gastuen konpentsazioa jasotzea defendatzen du.',
    },
    {
      locale: 'gl',
      title:
        'Díaz advirte aos reitores universitarios de que «non poden ser unha illa afastada» da loita contra a precariedade',
      description:
        'Yolanda Díaz pídelles aos reitores compromiso fronte á precariedade e defende que o Estatuto do Bolseiro inclúa a compensación de gastos para o estudantado en prácticas.',
    },
    {
      locale: 'val',
      title:
        'Díaz avisa els rectors universitaris que «no poden ser una illa allunyada» de la lluita contra la precarietat',
      description:
        "Yolanda Díaz demana als rectors compromís davant la precarietat i defén que l'Estatut del Becari incloga la compensació de despeses per a l'estudiantat en pràctiques.",
    },
  ],
  'yolanda-diaz-se-compromete-a-escuchar-las-reivindicaciones-d-2022-05': [
    {
      locale: 'en',
      title:
        "Yolanda Díaz pledges to listen to young people's demands in drafting the future Intern Statute",
      description:
        'Yolanda Díaz pledges to listen to CREUP and the Youth Council in drafting the Intern Statute, with measures on expense reimbursement, social-security contributions and mentoring.',
    },
    {
      locale: 'ca',
      title:
        'Yolanda Díaz es compromet a escoltar les reivindicacions dels joves per elaborar el futur Estatut del Becari',
      description:
        "Yolanda Díaz es compromet a escoltar CREUP i el Consell de la Joventut en l'elaboració de l'Estatut del Becari, amb mesures sobre la compensació de despeses, la cotització i la tutorització.",
    },
    {
      locale: 'eu',
      title:
        'Yolanda Díazek gazteen aldarrikapenak entzuteko konpromisoa hartu du etorkizuneko Bekadunaren Estatutua lantzeko',
      description:
        'Yolanda Díazek CREUP eta Gazteriaren Kontseilua entzuteko konpromisoa hartu du Bekadunaren Estatutua lantzean, gastuen konpentsazioari, kotizazioari eta tutoretzari buruzko neurriekin.',
    },
    {
      locale: 'gl',
      title:
        'Yolanda Díaz comprométese a escoitar as reivindicacións dos mozos para elaborar o futuro Estatuto do Bolseiro',
      description:
        'Yolanda Díaz comprométese a escoitar CREUP e o Consello da Xuventude na elaboración do Estatuto do Bolseiro, con medidas sobre a compensación de gastos, a cotización e a titorización.',
    },
    {
      locale: 'val',
      title:
        'Yolanda Díaz es compromet a escoltar les reivindicacions dels jóvens per a elaborar el futur Estatut del Becari',
      description:
        "Yolanda Díaz es compromet a escoltar CREUP i el Consell de la Joventut en l'elaboració de l'Estatut del Becari, amb mesures sobre la compensació de despeses, la cotització i la tutorització.",
    },
  ],
  'claves-del-estatuto-del-becario-que-ya-planea-el-gobierno-su-2022-05': [
    {
      locale: 'en',
      title: 'Keys to the "Intern Statute" the Government is already planning: pay, holidays…',
      description:
        'The Intern Statute proposal aims to protect the rights of those on non-employment placements, while CREUP calls for genuine training value, fraud control and fair pay.',
    },
    {
      locale: 'ca',
      title: "Claus de l'«Estatut del Becari» que ja planeja el Govern: sou, vacances…",
      description:
        "La proposta de l'Estatut del Becari planteja protegir els drets de qui fa pràctiques no laborals, mentre CREUP reclama caràcter formatiu, control del frau i una remuneració justa.",
    },
    {
      locale: 'eu',
      title:
        'Gobernuak dagoeneko aurreikusten duen «Bekadunaren Estatutuaren» gakoak: soldata, oporrak…',
      description:
        'Bekadunaren Estatutuaren proposamenak lan-harremanik gabeko praktikak egiten dituztenen eskubideak babestea planteatzen du, eta CREUPek prestakuntza-izaera, iruzurraren kontrola eta ordainsari bidezkoa eskatzen ditu.',
    },
    {
      locale: 'gl',
      title: 'Claves do «Estatuto do Bolseiro» que xa planea o Goberno: soldo, vacacións…',
      description:
        'A proposta do Estatuto do Bolseiro formula protexer os dereitos de quen fai prácticas non laborais, mentres CREUP reclama carácter formativo, control da fraude e unha remuneración xusta.',
    },
    {
      locale: 'val',
      title: "Claus de l'«Estatut del Becari» que ja planeja el Govern: sou, vacacions…",
      description:
        "La proposta de l'Estatut del Becari planteja protegir els drets de qui fa pràctiques no laborals, mentres CREUP reclama caràcter formatiu, control del frau i una remuneració justa.",
    },
  ],
  'yolanda-diaz-se-compromete-a-escuchar-las-reivindicaciones-d-2022-05-2': [
    {
      locale: 'en',
      title:
        "Yolanda Díaz pledges to listen to young people's demands in drafting the future Intern Statute",
      description:
        'Díaz announces that she will listen to CREUP and the Youth Council to draft the Intern Statute and states that she wants to end the fraudulent use of placements.',
    },
    {
      locale: 'ca',
      title:
        'Yolanda Díaz es compromet a escoltar les reivindicacions dels joves per elaborar el futur Estatut del Becari',
      description:
        "Díaz anuncia que escoltarà CREUP i el Consell de la Joventut per elaborar l'Estatut del Becari i afirma que vol acabar amb l'ús fraudulent de les pràctiques.",
    },
    {
      locale: 'eu',
      title:
        'Yolanda Díazek gazteen aldarrikapenak entzuteko konpromisoa hartu du etorkizuneko Bekadunaren Estatutua lantzeko',
      description:
        'Díazek iragarri du CREUP eta Gazteriaren Kontseilua entzungo dituela Bekadunaren Estatutua lantzeko, eta praktiken erabilera iruzurtia amaitu nahi duela adierazi du.',
    },
    {
      locale: 'gl',
      title:
        'Yolanda Díaz comprométese a escoitar as reivindicacións dos mozos para elaborar o futuro Estatuto do Bolseiro',
      description:
        'Díaz anuncia que escoitará CREUP e o Consello da Xuventude para elaborar o Estatuto do Bolseiro e afirma que quere acabar co uso fraudulento das prácticas.',
    },
    {
      locale: 'val',
      title:
        'Yolanda Díaz es compromet a escoltar les reivindicacions dels jóvens per a elaborar el futur Estatut del Becari',
      description:
        "Díaz anuncia que escoltarà CREUP i el Consell de la Joventut per a elaborar l'Estatut del Becari i afirma que vol acabar amb l'ús fraudulent de les pràctiques.",
    },
  ],
  'diaz-se-reune-con-representantes-de-la-creup-para-la-elabora-2022-05': [
    {
      locale: 'en',
      title: 'Díaz meets with CREUP representatives to draft the Intern Statute',
      description:
        'Europa Press TV captures footage of the meeting between Yolanda Díaz and CREUP representatives at the Ministry of Labour to address the drafting of the Intern Statute.',
    },
    {
      locale: 'ca',
      title:
        "Díaz es reuneix amb representants de CREUP per a l'elaboració de l'Estatut del Becari",
      description:
        "Europa Press TV recull imatges de la reunió entre Yolanda Díaz i representants de CREUP al Ministeri de Treball per abordar l'elaboració de l'Estatut del Becari.",
    },
    {
      locale: 'eu',
      title: 'Díaz CREUPeko ordezkariekin bildu da Bekadunaren Estatutua lantzeko',
      description:
        'Europa Press TV-k Yolanda Díazen eta CREUPeko ordezkarien arteko bileraren irudiak jaso ditu, Lan Ministerioan, Bekadunaren Estatutuaren elaborazioa lantzeko.',
    },
    {
      locale: 'gl',
      title: 'Díaz reúnese con representantes de CREUP para a elaboración do Estatuto do Bolseiro',
      description:
        'Europa Press TV recolle imaxes da reunión entre Yolanda Díaz e representantes de CREUP no Ministerio de Traballo para abordar a elaboración do Estatuto do Bolseiro.',
    },
    {
      locale: 'val',
      title: "Díaz es reunix amb representants de CREUP per a l'elaboració de l'Estatut del Becari",
      description:
        "Europa Press TV arreplega imatges de la reunió entre Yolanda Díaz i representants de CREUP en el Ministeri de Treball per a abordar l'elaboració de l'Estatut del Becari.",
    },
  ],
  'los-becarios-celebran-su-futuro-estatuto-y-piden-practicas-d-2022-05': [
    {
      locale: 'en',
      title:
        'Interns celebrate their future statute and call for dignified placements: "They don\'t train you, they don\'t pay you, and they make money off you"',
      description:
        'RTVE gathers testimonies from students on placements who denounce a lack of pay, the absence of real training and situations of abuse that the future Intern Statute should correct.',
    },
    {
      locale: 'ca',
      title:
        'Els becaris celebren el seu futur estatut i demanen pràctiques dignes: «No et formen, no et paguen i guanyen diners amb tu»',
      description:
        "RTVE recull testimonis d'estudiants en pràctiques que denuncien la manca de remuneració, l'absència de formació real i situacions d'abús que el futur Estatut del Becari hauria de corregir.",
    },
    {
      locale: 'eu',
      title:
        'Bekadunek euren etorkizuneko estatutua ospatu eta praktika duinak eskatu dituzte: «Ez zaituzte prestatzen, ez zaituzte ordaintzen eta zurekin dirua irabazten dute»',
      description:
        'RTVE-k praktiketako ikasleen testigantzak jaso ditu, ordainsaririk eza, benetako prestakuntzarik eza eta etorkizuneko Bekadunaren Estatutuak zuzendu beharko lituzkeen abusu-egoerak salatzen dituztenak.',
    },
    {
      locale: 'gl',
      title:
        'Os bolseiros celebran o seu futuro estatuto e piden prácticas dignas: «Non te forman, non te pagan e gañan diñeiro contigo»',
      description:
        'RTVE recolle testemuños de estudantes en prácticas que denuncian a falta de remuneración, a ausencia de formación real e situacións de abuso que o futuro Estatuto do Bolseiro debería corrixir.',
    },
    {
      locale: 'val',
      title:
        'Els becaris celebren el seu futur estatut i demanen pràctiques dignes: «No et formen, no et paguen i guanyen diners amb tu»',
      description:
        "RTVE arreplega testimonis d'estudiants en pràctiques que denuncien la falta de remuneració, l'absència de formació real i situacions d'abús que el futur Estatut del Becari hauria de corregir.",
    },
  ],
  'los-universitarios-piden-practicas-formativas-y-remuneradas-2022-05': [
    {
      locale: 'en',
      title: 'University students call for training-focused, paid placements in the Intern Statute',
      description:
        'CREUP demands that the Intern Statute guarantee academic placements that are training-focused and paid, with oversight mechanisms, effective mentoring and limits compatible with work-life balance.',
    },
    {
      locale: 'ca',
      title:
        "Els universitaris demanen pràctiques formatives i remunerades en l'Estatut del Becari",
      description:
        "CREUP reclama que l'Estatut del Becari garantisca pràctiques acadèmiques formatives, remunerades, amb mecanismes de control, tutorització efectiva i límits compatibles amb la conciliació.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek prestakuntza-praktikak eta ordainduak eskatu dituzte Bekadunaren Estatutuan',
      description:
        'CREUPek eskatzen du Bekadunaren Estatutuak praktika akademiko prestatzaileak eta ordainduak bermatzea, kontrol-mekanismoekin, tutoretza eraginkorrarekin eta kontziliazioarekin bateragarriak diren mugekin.',
    },
    {
      locale: 'gl',
      title: 'Os universitarios piden prácticas formativas e remuneradas no Estatuto do Bolseiro',
      description:
        'CREUP reclama que o Estatuto do Bolseiro garanta prácticas académicas formativas, remuneradas, con mecanismos de control, titorización efectiva e límites compatibles coa conciliación.',
    },
    {
      locale: 'val',
      title:
        "Els universitaris demanen pràctiques formatives i remunerades en l'Estatut del Becari",
      description:
        "CREUP reclama que l'Estatut del Becari garantisca unes pràctiques acadèmiques formatives i remunerades, amb mecanismes de control, tutorització efectiva i límits compatibles amb la conciliació.",
    },
  ],
  'estudiantes-universitarios-reclaman-practicas-formativas-y-r-2022-05': [
    {
      locale: 'en',
      title:
        'University students demand training-focused, paid placements in the future Intern Statute',
      description:
        "CREUP calls for the future Intern Statute to incorporate university students' demands, guarantee the quality of placements and prevent labour fraud.",
    },
    {
      locale: 'ca',
      title:
        'Els estudiants universitaris reclamen pràctiques formatives i remunerades en el futur Estatut del Becari',
      description:
        "CREUP demana que el futur Estatut del Becari incorpore les reivindicacions de l'estudiantat universitari, garantisca la qualitat de les pràctiques i evite el frau laboral.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek prestakuntza-praktikak eta ordainduak eskatzen dituzte etorkizuneko Bekadunaren Estatutuan',
      description:
        'CREUPek eskatzen du etorkizuneko Bekadunaren Estatutuak unibertsitateko ikasleriaren aldarrikapenak jasotzea, praktiken kalitatea bermatzea eta lan-iruzurra saihestea.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes universitarios reclaman prácticas formativas e remuneradas no futuro Estatuto do Bolseiro',
      description:
        'CREUP pide que o futuro Estatuto do Bolseiro incorpore as reivindicacións do estudantado universitario, garanta a calidade das prácticas e evite a fraude laboral.',
    },
    {
      locale: 'val',
      title:
        'Els estudiants universitaris reclamen pràctiques formatives i remunerades en el futur Estatut del Becari',
      description:
        "CREUP demana que el futur Estatut del Becari arreplegue les reivindicacions de l'estudiantat universitari, garantisca la qualitat de les pràctiques i evite el frau laboral.",
    },
  ],
  'estudiantes-universitarios-reclaman-practicas-formativas-y-r-2022-05-2': [
    {
      locale: 'en',
      title:
        'University students demand training-focused, paid placements in the future Intern Statute',
      description:
        'CREUP demands that the Intern Statute guarantee the training value of academic placements, prevent labour fraud and set fair pay.',
    },
    {
      locale: 'ca',
      title:
        'Els estudiants universitaris reclamen pràctiques formatives i remunerades en el futur Estatut del Becari',
      description:
        "CREUP reclama que l'Estatut del Becari garantisca el caràcter formatiu de les pràctiques acadèmiques, evite el frau laboral i establisca una remuneració justa.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek prestakuntza-praktikak eta ordainduak eskatzen dituzte etorkizuneko Bekadunaren Estatutuan',
      description:
        'CREUPek eskatzen du Bekadunaren Estatutuak praktika akademikoen prestakuntza-izaera bermatzea, lan-iruzurra saihestea eta ordainsari bidezkoa ezartzea.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes universitarios reclaman prácticas formativas e remuneradas no futuro Estatuto do Bolseiro',
      description:
        'CREUP reclama que o Estatuto do Bolseiro garanta o carácter formativo das prácticas académicas, evite a fraude laboral e estableza unha remuneración xusta.',
    },
    {
      locale: 'val',
      title:
        'Els estudiants universitaris reclamen pràctiques formatives i remunerades en el futur Estatut del Becari',
      description:
        "CREUP reclama que l'Estatut del Becari garantisca el caràcter formatiu de les pràctiques acadèmiques, evite el frau laboral i fixe una remuneració justa.",
    },
  ],
  'los-representantes-de-los-estudiantes-consiguen-que-el-derec-2022-05': [
    {
      locale: 'en',
      title: 'Student representatives secure the right to strike in the Universities Act',
      description:
        "Student representation welcomes the LOSU's recognition of the right to academic walkout, a long-standing demand to safeguard protest without academic consequences.",
    },
    {
      locale: 'ca',
      title:
        "Els representants dels estudiants aconsegueixen que el dret de vaga entre en la Llei d'Universitats",
      description:
        "La representació estudiantil celebra que la LOSU reconega el dret a l'aturada acadèmica, una reivindicació històrica per blindar la protesta sense conseqüències acadèmiques.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleen ordezkariek greba egiteko eskubidea Unibertsitateen Legean sartzea lortu dute',
      description:
        'Ikasleen ordezkaritzak ospatzen du LOSUk etenaldi akademikorako eskubidea aitortzea, protesta ondorio akademikorik gabe blindatzeko aldarrikapen historikoa.',
    },
    {
      locale: 'gl',
      title:
        'Os representantes dos estudantes conseguen que o dereito á folga entre na Lei de Universidades',
      description:
        'A representación estudantil celebra que a LOSU recoñeza o dereito ao paro académico, unha reivindicación histórica para blindar a protesta sen consecuencias académicas.',
    },
    {
      locale: 'val',
      title:
        "Els representants dels estudiants aconseguixen que el dret de vaga entre en la Llei d'Universitats",
      description:
        "La representació estudiantil celebra que la LOSU reconega el dret a l'aturada acadèmica, una reivindicació històrica per a blindar la protesta sense conseqüències acadèmiques.",
    },
  ],
  'diaz-afirma-que-se-compensaran-los-gastos-del-becario-en-nue-2022-05': [
    {
      locale: 'en',
      title:
        'Díaz states that interns\' expenses will be reimbursed: "In our country you cannot have to pay to be an intern, and this is happening"',
      description:
        'Yolanda Díaz states that the Intern Statute will provide for expense reimbursement and argues that people on placements should not have to pay to receive training.',
    },
    {
      locale: 'ca',
      title:
        'Díaz afirma que es compensaran les despeses del becari: «Al nostre país no es pot pagar per ser becari i això passa»',
      description:
        "Yolanda Díaz afirma que l'Estatut del Becari preveurà una compensació de despeses i defensa que les persones en pràctiques no hagen de pagar per formar-se.",
    },
    {
      locale: 'eu',
      title:
        'Díazek baieztatu du bekadunaren gastuak konpentsatuko direla: «Gure herrialdean ezin da bekadun izateagatik ordaindu, eta hori gertatzen ari da»',
      description:
        'Yolanda Díazek baieztatu du Bekadunaren Estatutuak gastuen konpentsazioa aurreikusiko duela, eta praktiketako pertsonek prestatzeagatik ordaindu behar ez izatea defendatzen du.',
    },
    {
      locale: 'gl',
      title:
        'Díaz afirma que se compensarán os gastos do bolseiro: «No noso país non se pode pagar por ser bolseiro e isto pasa»',
      description:
        'Yolanda Díaz afirma que o Estatuto do Bolseiro contemplará unha compensación de gastos e defende que as persoas en prácticas non teñan que pagar por formarse.',
    },
    {
      locale: 'val',
      title:
        'Díaz afirma que es compensaran les despeses del becari: «En el nostre país no es pot pagar per ser becari i això passa»',
      description:
        "Yolanda Díaz afirma que l'Estatut del Becari preveurà una compensació de despeses i defén que les persones en pràctiques no hagen de pagar per a formar-se.",
    },
  ],
  'estudiantes-universitarios-reclaman-practicas-formativas-y-r-2022-05-3': [
    {
      locale: 'en',
      title:
        'University students demand training-focused, paid placements in the future Intern Statute',
      description:
        "CREUP calls for the future Intern Statute to incorporate students' demands, guarantee training-focused and paid placements and strengthen oversight mechanisms.",
    },
    {
      locale: 'ca',
      title:
        'Els estudiants universitaris reclamen pràctiques formatives i remunerades en el futur Estatut del Becari',
      description:
        "CREUP reclama que el futur Estatut del Becari incorpore les reivindicacions de l'estudiantat, garantisca pràctiques formatives i remunerades i reforce els mecanismes de control.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek prestakuntza-praktikak eta ordainduak eskatzen dituzte etorkizuneko Bekadunaren Estatutuan',
      description:
        'CREUPek eskatzen du etorkizuneko Bekadunaren Estatutuak ikasleriaren aldarrikapenak jasotzea, prestakuntza-praktikak eta ordainduak bermatzea eta kontrol-mekanismoak indartzea.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes universitarios reclaman prácticas formativas e remuneradas no futuro Estatuto do Bolseiro',
      description:
        'CREUP reclama que o futuro Estatuto do Bolseiro incorpore as reivindicacións do estudantado, garanta prácticas formativas e remuneradas e reforce os mecanismos de control.',
    },
    {
      locale: 'val',
      title:
        'Els estudiants universitaris reclamen pràctiques formatives i remunerades en el futur Estatut del Becari',
      description:
        "CREUP reclama que el futur Estatut del Becari arreplegue les reivindicacions de l'estudiantat, garantisca pràctiques formatives i remunerades i reforce els mecanismes de control.",
    },
  ],
  'estudiantes-universitarios-piden-unas-practicas-formativas-y-2022-05': [
    {
      locale: 'en',
      title: 'University students call for "training-focused and paid" placements',
      description:
        'Students demand that the Intern Statute guarantee training-focused placements, quality mentoring, effective oversight and fair pay to prevent labour fraud.',
    },
    {
      locale: 'ca',
      title: 'Els estudiants universitaris demanen unes pràctiques «formatives i remunerades»',
      description:
        "L'estudiantat reclama que l'Estatut del Becari garantisca pràctiques formatives, qualitat en la tutorització, control efectiu i una remuneració justa per evitar el frau laboral.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitateko ikasleek praktika «prestatzaileak eta ordainduak» eskatu dituzte',
      description:
        'Ikasleriak eskatzen du Bekadunaren Estatutuak praktika prestatzaileak, tutoretzaren kalitatea, kontrol eraginkorra eta ordainsari bidezkoa bermatzea, lan-iruzurra saihesteko.',
    },
    {
      locale: 'gl',
      title: 'Os estudantes universitarios piden unhas prácticas «formativas e remuneradas»',
      description:
        'O estudantado reclama que o Estatuto do Bolseiro garanta prácticas formativas, calidade na titorización, control efectivo e unha remuneración xusta para evitar a fraude laboral.',
    },
    {
      locale: 'val',
      title: 'Els estudiants universitaris demanen unes pràctiques «formatives i remunerades»',
      description:
        "L'estudiantat reclama que l'Estatut del Becari garantisca pràctiques formatives, qualitat en la tutorització, control efectiu i una remuneració justa per a evitar el frau laboral.",
    },
  ],
  'la-losu-reconocera-el-paro-academico-como-un-derecho-de-los-2022-05': [
    {
      locale: 'en',
      title: 'The LOSU will recognise the academic walkout as a student right',
      description:
        'CREUP and CEUNE welcome that the future LOSU will recognise the academic walkout as a student right and safeguard the right to protest without academic consequences.',
    },
    {
      locale: 'ca',
      title: "La LOSU reconeixerà l'aturada acadèmica com un dret dels estudiants",
      description:
        "CREUP i CEUNE celebren que la futura LOSU reconega l'aturada acadèmica com a dret de l'estudiantat i blinde el dret a la protesta sense conseqüències acadèmiques.",
    },
    {
      locale: 'eu',
      title: 'LOSUk etenaldi akademikoa ikasleen eskubide gisa aitortuko du',
      description:
        'CREUPek eta CEUNEk ospatzen dute etorkizuneko LOSUk etenaldi akademikoa ikasleriaren eskubide gisa aitortzea eta protesta egiteko eskubidea ondorio akademikorik gabe blindatzea.',
    },
    {
      locale: 'gl',
      title: 'A LOSU recoñecerá o paro académico como un dereito dos estudantes',
      description:
        'CREUP e CEUNE celebran que a futura LOSU recoñeza o paro académico como dereito do estudantado e blinde o dereito á protesta sen consecuencias académicas.',
    },
    {
      locale: 'val',
      title: "La LOSU reconeixerà l'aturada acadèmica com un dret dels estudiants",
      description:
        "CREUP i CEUNE celebren que la futura LOSU reconega l'aturada acadèmica com a dret de l'estudiantat i protegisca el dret a la protesta sense conseqüències acadèmiques.",
    },
  ],
  'el-paro-academico-sera-un-derecho-recogido-por-ley-2022-05': [
    {
      locale: 'en',
      title: 'The academic walkout will be a right enshrined in law',
      description:
        'The LOSU will incorporate the right to academic walkout, so that students cannot face academic consequences for taking part in it under the established mechanisms.',
    },
    {
      locale: 'ca',
      title: "L'aturada acadèmica serà un dret recollit per llei",
      description:
        "La LOSU incorporarà el dret a l'aturada acadèmica, de manera que l'alumnat no puga patir conseqüències acadèmiques per secundar-la d'acord amb els mecanismes previstos.",
    },
    {
      locale: 'eu',
      title: 'Etenaldi akademikoa legez jasotako eskubidea izango da',
      description:
        'LOSUk etenaldi akademikorako eskubidea jasoko du, ikasleek hari jarraitzeagatik ondorio akademikorik jasan ezin izan dezaten, aurreikusitako mekanismoen arabera.',
    },
    {
      locale: 'gl',
      title: 'O paro académico será un dereito recollido por lei',
      description:
        'A LOSU incorporará o dereito ao paro académico, de xeito que o alumnado non poida sufrir consecuencias académicas por secundalo conforme aos mecanismos previstos.',
    },
    {
      locale: 'val',
      title: "L'aturada acadèmica serà un dret arreplegat per llei",
      description:
        "La LOSU incorporarà el dret a l'aturada acadèmica, de manera que l'alumnat no puga patir conseqüències acadèmiques per secundar-la d'acord amb els mecanismes previstos.",
    },
  ],
  'la-nueva-ley-de-universidades-recogera-el-derecho-a-huelga-d-2022-05': [
    {
      locale: 'en',
      title: "The new Universities Act will include students' right to strike",
      description:
        "The LOSU draft bill will include students' right to academic walkout and will require universities to set up mechanisms for exercising it.",
    },
    {
      locale: 'ca',
      title: "La nova Llei d'Universitats recollirà el dret de vaga dels estudiants",
      description:
        "L'avantprojecte de la LOSU recollirà el dret a l'aturada acadèmica de l'estudiantat i obligarà les universitats a habilitar mecanismes per exercir-lo.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitateen Lege berriak ikasleen greba egiteko eskubidea jasoko du',
      description:
        'LOSUren aurreproiektuak ikasleriaren etenaldi akademikorako eskubidea jasoko du, eta unibertsitateak hura erabiltzeko mekanismoak gaitzera behartuko ditu.',
    },
    {
      locale: 'gl',
      title: 'A nova Lei de Universidades recollerá o dereito á folga dos estudantes',
      description:
        'O anteproxecto da LOSU recollerá o dereito ao paro académico do estudantado e obrigará as universidades a habilitar mecanismos para exercelo.',
    },
    {
      locale: 'val',
      title: "La nova Llei d'Universitats arreplegarà el dret de vaga dels estudiants",
      description:
        "L'avantprojecte de la LOSU arreplegarà el dret a l'aturada acadèmica de l'estudiantat i obligarà les universitats a habilitar mecanismes per a exercir-lo.",
    },
  ],
  'la-nueva-ley-de-universidades-recogera-el-derecho-a-huelga-d-2022-05-2': [
    {
      locale: 'en',
      title: "The new Universities Act will include students' right to strike",
      description:
        'The LOSU will recognise the academic walkout as a long-standing student demand, with conditions for calling it and guarantees for those who join it or not.',
    },
    {
      locale: 'ca',
      title: "La nova Llei d'Universitats recollirà el dret de vaga dels estudiants",
      description:
        "La LOSU reconeixerà l'aturada acadèmica com a reivindicació històrica de l'estudiantat, amb condicions de convocatòria i garanties per a qui la secunde o no.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitateen Lege berriak ikasleen greba egiteko eskubidea jasoko du',
      description:
        'LOSUk etenaldi akademikoa ikasleriaren aldarrikapen historiko gisa aitortuko du, deialdi-baldintzekin eta hari jarraitzen dioten edo ez dioten pertsonentzako bermeekin.',
    },
    {
      locale: 'gl',
      title: 'A nova Lei de Universidades recollerá o dereito á folga dos estudantes',
      description:
        'A LOSU recoñecerá o paro académico como reivindicación histórica do estudantado, con condicións de convocatoria e garantías para quen o secunde ou non.',
    },
    {
      locale: 'val',
      title: "La nova Llei d'Universitats arreplegarà el dret de vaga dels estudiants",
      description:
        "La LOSU reconeixerà l'aturada acadèmica com a reivindicació històrica de l'estudiantat, amb condicions de convocatòria i garanties per a qui la secunde o no.",
    },
  ],
  'los-estudiantes-no-podran-suspender-por-hacer-un-paro-academ-2022-05': [
    {
      locale: 'en',
      title:
        'Students will not be able to fail for holding an academic walkout: the new Universities Act will protect their right to strike',
      description:
        'The Ministry and student groups agree to incorporate the right to academic walkout into the LOSU, avoiding academic consequences for exercising it.',
    },
    {
      locale: 'ca',
      title:
        "Els estudiants no podran suspendre per fer una aturada acadèmica: la nova Llei d'Universitats emparararà el seu dret de vaga",
      description:
        "El Ministeri i els col·lectius estudiantils acorden incorporar el dret a l'aturada acadèmica en la LOSU, evitant conseqüències acadèmiques per exercir-lo.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek ezin izango dute suspenditu etenaldi akademiko bat egiteagatik: Unibertsitateen Lege berriak haien greba egiteko eskubidea babestuko du',
      description:
        'Ministerioak eta ikasle-kolektiboek adostu dute etenaldi akademikorako eskubidea LOSUn sartzea, hura erabiltzeagatik ondorio akademikoak saihestuz.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes non poderán suspender por facer un paro académico: a nova Lei de Universidades amparará o seu dereito á folga',
      description:
        'O Ministerio e os colectivos estudantís acordan incorporar o dereito ao paro académico na LOSU, evitando consecuencias académicas por exercelo.',
    },
    {
      locale: 'val',
      title:
        "Els estudiants no podran suspendre per fer una aturada acadèmica: la nova Llei d'Universitats empararà el seu dret de vaga",
      description:
        "El Ministeri i els col·lectius estudiantils acorden incorporar el dret a l'aturada acadèmica en la LOSU, evitant conseqüències acadèmiques per exercir-lo.",
    },
  ],
  'espana-desbloquea-el-derecho-a-huelga-para-los-estudiantes-d-2022-05': [
    {
      locale: 'en',
      title: 'Spain unblocks the right to strike for Medicine students',
      description:
        'The new Universities Act will include the academic walkout as a student right, also for Health Sciences degrees, without academic penalty.',
    },
    {
      locale: 'ca',
      title: 'Espanya desbloqueja el dret de vaga per als estudiants de Medicina',
      description:
        "La nova Llei d'Universitats inclourà l'aturada acadèmica com a dret de l'estudiantat, també per als graus de Ciències de la Salut, sense perjudici acadèmic.",
    },
    {
      locale: 'eu',
      title: 'Espainiak greba egiteko eskubidea desblokeatu du Medikuntzako ikasleentzat',
      description:
        'Unibertsitateen Lege berriak etenaldi akademikoa ikasleriaren eskubide gisa jasoko du, baita Osasun Zientzietako graduetan ere, kalte akademikorik gabe.',
    },
    {
      locale: 'gl',
      title: 'España desbloquea o dereito á folga para os estudantes de Medicina',
      description:
        'A nova Lei de Universidades incluirá o paro académico como dereito do estudantado, tamén para os graos de Ciencias da Saúde, sen prexuízo académico.',
    },
    {
      locale: 'val',
      title: 'Espanya desbloqueja el dret de vaga per als estudiants de Medicina',
      description:
        "La nova Llei d'Universitats inclourà l'aturada acadèmica com a dret de l'estudiantat, també per als graus de Ciències de la Salut, sense perjuí acadèmic.",
    },
  ],
  'la-nueva-ley-de-universidades-recogera-el-derecho-a-huelga-d-2022-05-3': [
    {
      locale: 'en',
      title: "The new Universities Act will enshrine students' right to strike",
      description:
        'The LOSU bill will recognise the right to academic stoppage, linked to the exercise of freedom of expression, assembly and association at the university.',
    },
    {
      locale: 'ca',
      title: "La nova Llei d'Universitats recollirà el dret de vaga dels estudiants",
      description:
        "L'avantprojecte de la LOSU reconeixerà el dret a l'aturada acadèmica, vinculat a l'exercici de la llibertat d'expressió, reunió i associació a la universitat.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitateen Lege berriak ikasleen greba egiteko eskubidea jasoko du',
      description:
        'LOSUren aurreproiektuak etenaldi akademikorako eskubidea aitortuko du, unibertsitatean adierazpen, bilera eta elkartzeko askatasuna baliatzeari lotua.',
    },
    {
      locale: 'gl',
      title: 'A nova Lei de Universidades recollerá o dereito á folga do estudantado',
      description:
        'O anteproxecto da LOSU recoñecerá o dereito á paralización académica, vinculado ao exercicio da liberdade de expresión, reunión e asociación na universidade.',
    },
    {
      locale: 'val',
      title: "La nova Llei d'Universitats arreplegarà el dret de vaga dels estudiants",
      description:
        "L'avantprojecte de la LOSU reconeixerà el dret a l'aturada acadèmica, vinculat a l'exercici de la llibertat d'expressió, reunió i associació en la universitat.",
    },
  ],
  'la-nueva-ley-universitaria-reconocera-el-derecho-al-paro-aca-2022-05': [
    {
      locale: 'en',
      title: 'The new university law will recognise the right to academic stoppage',
      description:
        'The LOSU will introduce the right to academic stoppage and will require universities to set up mechanisms that safeguard teaching and assessment.',
    },
    {
      locale: 'ca',
      title: "La nova llei universitària reconeixerà el dret a l'aturada acadèmica",
      description:
        "La LOSU introduirà el dret a l'aturada acadèmica i obligarà les universitats a articular mecanismes que preservin la docència i l'avaluació.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitate lege berriak etenaldi akademikorako eskubidea aitortuko du',
      description:
        'LOSUk etenaldi akademikorako eskubidea sartuko du eta unibertsitateak behartuko ditu irakaskuntza eta ebaluazioa babesten dituzten mekanismoak antolatzera.',
    },
    {
      locale: 'gl',
      title: 'A nova lei universitaria recoñecerá o dereito á paralización académica',
      description:
        'A LOSU introducirá o dereito á paralización académica e obrigará as universidades a articular mecanismos que preserven a docencia e a avaliación.',
    },
    {
      locale: 'val',
      title: "La nova llei universitària reconeixerà el dret a l'aturada acadèmica",
      description:
        "La LOSU introduirà el dret a l'aturada acadèmica i obligarà les universitats a articular mecanismes que preserven la docència i l'avaluació.",
    },
  ],
  'el-gobierno-reconocera-el-derecho-a-la-huelga-de-los-estudia-2022-05': [
    {
      locale: 'en',
      title: "The Government will recognise students' right to strike in the new universities act",
      description:
        'The new university law will recognise the academic stoppage and will require mechanisms so that Student Councils can call it without affecting the right to teaching.',
    },
    {
      locale: 'ca',
      title: "El Govern reconeixerà el dret de vaga dels estudiants a la nova llei d'universitats",
      description:
        "La nova llei universitària reconeixerà l'aturada acadèmica i exigirà mecanismes perquè els Consells d'Estudiants la puguin convocar sense afectar el dret a la docència.",
    },
    {
      locale: 'eu',
      title: 'Gobernuak ikasleen greba egiteko eskubidea aitortuko du unibertsitateen lege berrian',
      description:
        'Unibertsitate lege berriak etenaldi akademikoa aitortuko du eta mekanismoak eskatuko ditu Ikasle Kontseiluek hura deitu ahal izan dezaten irakaskuntzarako eskubidea kaltetu gabe.',
    },
    {
      locale: 'gl',
      title: 'O Goberno recoñecerá o dereito á folga do estudantado na nova lei de universidades',
      description:
        'A nova lei universitaria recoñecerá a paralización académica e esixirá mecanismos para que os Consellos de Estudantes a poidan convocar sen afectar o dereito á docencia.',
    },
    {
      locale: 'val',
      title: "El Govern reconeixerà el dret de vaga dels estudiants en la nova llei d'universitats",
      description:
        "La nova llei universitària reconeixerà l'aturada acadèmica i exigirà mecanismes perquè els Consells d'Estudiants la puguen convocar sense afectar el dret a la docència.",
    },
  ],
  'la-nueva-ley-universitaria-reconocera-el-derecho-al-paro-aca-2022-05-2': [
    {
      locale: 'en',
      title: 'The new university law will recognise the right to academic stoppage',
      description:
        'The recognition of the academic stoppage in the LOSU is presented as a historic demand of student representation and of the right to demonstrate.',
    },
    {
      locale: 'ca',
      title: "La nova llei universitària reconeixerà el dret a l'aturada acadèmica",
      description:
        "El reconeixement de l'aturada acadèmica a la LOSU es presenta com una reivindicació històrica de la representació estudiantil i del dret a manifestació.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitate lege berriak etenaldi akademikorako eskubidea aitortuko du',
      description:
        'LOSUn etenaldi akademikoaren aitorpena ikasleen ordezkaritzaren eta manifestatzeko eskubidearen aldarrikapen historiko gisa aurkezten da.',
    },
    {
      locale: 'gl',
      title: 'A nova lei universitaria recoñecerá o dereito á paralización académica',
      description:
        'O recoñecemento da paralización académica na LOSU preséntase como unha reivindicación histórica da representación estudantil e do dereito á manifestación.',
    },
    {
      locale: 'val',
      title: "La nova llei universitària reconeixerà el dret a l'aturada acadèmica",
      description:
        "El reconeixement de l'aturada acadèmica en la LOSU es presenta com una reivindicació històrica de la representació estudiantil i del dret a manifestació.",
    },
  ],
  'la-nueva-ley-de-universidades-reconocera-el-derecho-a-la-hue-2022-05': [
    {
      locale: 'en',
      title: "The new universities act will recognise students' right to strike",
      description:
        "The new universities act will recognise the student body's right to strike, with conditions for calling it and advance notice to the academic authorities.",
    },
    {
      locale: 'ca',
      title: "La nova llei d'universitats reconeixerà el dret de vaga dels estudiants",
      description:
        "La nova llei d'universitats reconeixerà el dret de l'estudiantat a la vaga, amb condicions de convocatòria i preavís davant les autoritats acadèmiques.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitateen lege berriak ikasleen greba egiteko eskubidea aitortuko du',
      description:
        'Unibertsitateen lege berriak ikasleriaren greba egiteko eskubidea aitortuko du, deialdi-baldintzekin eta agintaritza akademikoei aurretiaz jakinarazi beharrarekin.',
    },
    {
      locale: 'gl',
      title: 'A nova lei de universidades recoñecerá o dereito á folga do estudantado',
      description:
        'A nova lei de universidades recoñecerá o dereito do estudantado á folga, con condicións de convocatoria e preaviso ante as autoridades académicas.',
    },
    {
      locale: 'val',
      title: "La nova llei d'universitats reconeixerà el dret de vaga dels estudiants",
      description:
        "La nova llei d'universitats reconeixerà el dret de l'estudiantat a la vaga, amb condicions de convocatòria i preavís davant les autoritats acadèmiques.",
    },
  ],
  'la-ley-de-universidades-reconocera-por-primera-vez-el-derech-2022-05': [
    {
      locale: 'en',
      title: "The Universities Act will recognise students' right to strike for the first time",
      description:
        'For the first time the LOSU will include the academic stoppage as a subjective right of the student body, responding to a historic demand from CREUP.',
    },
    {
      locale: 'ca',
      title:
        "La Llei d'Universitats reconeixerà per primera vegada el dret de vaga dels estudiants",
      description:
        "La LOSU inclourà per primera vegada l'aturada acadèmica com a dret subjectiu de l'estudiantat, donant resposta a una reivindicació històrica de CREUP.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitateen Legeak lehen aldiz aitortuko du ikasleen greba egiteko eskubidea',
      description:
        'LOSUk lehen aldiz jasoko du etenaldi akademikoa ikasleriaren eskubide subjektibo gisa, CREUPen aldarrikapen historiko bati erantzunez.',
    },
    {
      locale: 'gl',
      title: 'A Lei de Universidades recoñecerá por primeira vez o dereito á folga do estudantado',
      description:
        'A LOSU incluirá por primeira vez a paralización académica como dereito subxectivo do estudantado, dando resposta a unha reivindicación histórica de CREUP.',
    },
    {
      locale: 'val',
      title:
        "La Llei d'Universitats reconeixerà per primera vegada el dret de vaga dels estudiants",
      description:
        "La LOSU inclourà per primera vegada l'aturada acadèmica com a dret subjectiu de l'estudiantat, donant resposta a una reivindicació històrica de CREUP.",
    },
  ],
  'las-universidades-sufren-la-subida-del-precio-de-la-luz-y-li-2022-05': [
    {
      locale: 'en',
      title: 'Universities hit by rising electricity prices and limit hours and building openings',
      description:
        'CREUP criticises the cuts to university hours and services driven by higher energy costs, arguing that they restrict academic life and access to resources.',
    },
    {
      locale: 'ca',
      title:
        "Les universitats pateixen la pujada del preu de la llum i limiten horaris i obertures d'edificis",
      description:
        "CREUP critica les retallades d'horaris i serveis universitaris per l'encariment energètic, ja que considera que limiten la vida acadèmica i l'accés als recursos.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateek argindarraren prezioaren igoera jasaten dute eta ordutegiak eta eraikinen irekierak murrizten dituzte',
      description:
        'CREUPek unibertsitateen ordutegi eta zerbitzuen murrizketak kritikatzen ditu energiaren garestitzeagatik, bizitza akademikoa eta baliabideetarako sarbidea mugatzen dituztela uste baitu.',
    },
    {
      locale: 'gl',
      title:
        'As universidades sofren a suba do prezo da luz e limitan horarios e aperturas de edificios',
      description:
        'CREUP critica os recortes de horarios e servizos universitarios polo encarecemento enerxético, ao considerar que limitan a vida académica e o acceso aos recursos.',
    },
    {
      locale: 'val',
      title:
        "Les universitats patixen la pujada del preu de la llum i limiten horaris i obertures d'edificis",
      description:
        "CREUP critica les retallades d'horaris i servicis universitaris per l'encariment energètic, ja que considera que limiten la vida acadèmica i l'accés als recursos.",
    },
  ],
  'con-el-estatuto-del-becario-los-universitarios-reivindican-u-2022-04': [
    {
      locale: 'en',
      title: 'With the Trainee Statute, university students demand decent academic internships',
      description:
        'CREUP calls for a seat in negotiating the Trainee Statute to guarantee academic internships that are formative, supervised, paid and free of fraud.',
    },
    {
      locale: 'ca',
      title:
        "Amb l'Estatut del Becari, els universitaris reivindiquen unes pràctiques acadèmiques dignes",
      description:
        "CREUP reclama participar en la negociació de l'Estatut del Becari per garantir pràctiques acadèmiques formatives, tutoritzades, remunerades i lliures de frau.",
    },
    {
      locale: 'eu',
      title:
        'Bekadunaren Estatutuarekin, unibertsitarioek praktika akademiko duinak aldarrikatzen dituzte',
      description:
        'CREUPek Bekadunaren Estatutuaren negoziazioan parte hartzea eskatzen du, praktika akademiko prestatzaileak, tutoretzapekoak, ordainduak eta iruzurrik gabekoak bermatzeko.',
    },
    {
      locale: 'gl',
      title:
        'Co Estatuto do Bolseiro, os universitarios reivindican unhas prácticas académicas dignas',
      description:
        'CREUP reclama participar na negociación do Estatuto do Bolseiro para garantir prácticas académicas formativas, titorizadas, remuneradas e libres de fraude.',
    },
    {
      locale: 'val',
      title:
        "Amb l'Estatut del Becari, els universitaris reivindiquen unes pràctiques acadèmiques dignes",
      description:
        "CREUP reclama participar en la negociació de l'Estatut del Becari per a garantir pràctiques acadèmiques formatives, tutoritzades, remunerades i lliures de frau.",
    },
  ],
  'crue-sostenibilidad-aconseja-seguir-usando-este-curso-mascar-2022-04': [
    {
      locale: 'en',
      title:
        'Crue-Sostenibilidad advises continuing to wear masks this year in classrooms, laboratories, workshops and meeting rooms',
      description:
        'CREUP calls for caution and for the safety measures to be continued gradually, following the guidance of the health authorities.',
    },
    {
      locale: 'ca',
      title:
        'Crue-Sostenibilidad aconsella continuar utilitzant aquest curs la mascareta a aules, laboratoris, tallers o sales de reunions',
      description:
        'CREUP crida a mantenir la prudència i a continuar de manera progressiva amb les mesures de seguretat, seguint les indicacions de les autoritats sanitàries.',
    },
    {
      locale: 'eu',
      title:
        'Crue-Sostenibilidadek ikasturte honetan maskara erabiltzen jarraitzea gomendatzen du ikasgeletan, laborategietan, tailerretan edo bilera-geletan',
      description:
        'CREUPek zuhurtzia mantentzeko eta segurtasun neurriekin pixkanaka jarraitzeko deia egiten du, osasun agintarien jarraibideei jarraituz.',
    },
    {
      locale: 'gl',
      title:
        'Crue-Sostenibilidad aconsella seguir usando este curso a máscara en aulas, laboratorios, talleres ou salas de reunións',
      description:
        'CREUP chama a manter a prudencia e a continuar de forma progresiva coas medidas de seguridade, seguindo as indicacións das autoridades sanitarias.',
    },
    {
      locale: 'val',
      title:
        'Crue-Sostenibilidad aconsella continuar utilitzant este curs la mascareta en aules, laboratoris, tallers o sales de reunions',
      description:
        'CREUP crida a mantindre la prudència i a continuar de manera progressiva amb les mesures de seguretat, seguint les indicacions de les autoritats sanitàries.',
    },
  ],
  'crue-sostenibilidad-aconseja-seguir-usando-este-curso-mascar-2022-04-2': [
    {
      locale: 'en',
      title:
        'Crue-Sostenibilidad advises continuing to wear masks this year in classrooms, laboratories, workshops and meeting rooms',
      description:
        'Crue-Sostenibilidad recommends keeping masks on in shared university spaces, and CREUP advocates a cautious, gradual lifting of the measures.',
    },
    {
      locale: 'ca',
      title:
        'Crue-Sostenibilidad aconsella continuar utilitzant aquest curs la mascareta a aules, laboratoris, tallers o sales de reunions',
      description:
        'Crue-Sostenibilidad recomana mantenir la mascareta als espais universitaris compartits i CREUP defensa una retirada prudent i progressiva de les mesures.',
    },
    {
      locale: 'eu',
      title:
        'Crue-Sostenibilidadek ikasturte honetan maskara erabiltzen jarraitzea gomendatzen du ikasgeletan, laborategietan, tailerretan edo bilera-geletan',
      description:
        'Crue-Sostenibilidadek maskara erabiltzeari eustea gomendatzen du unibertsitateko espazio partekatuetan, eta CREUPek neurriak zuhur eta pixkanaka kentzea defendatzen du.',
    },
    {
      locale: 'gl',
      title:
        'Crue-Sostenibilidad aconsella seguir usando este curso a máscara en aulas, laboratorios, talleres ou salas de reunións',
      description:
        'Crue-Sostenibilidad recomenda manter a máscara nos espazos universitarios compartidos e CREUP defende unha retirada prudente e progresiva das medidas.',
    },
    {
      locale: 'val',
      title:
        'Crue-Sostenibilidad aconsella continuar utilitzant este curs la mascareta en aules, laboratoris, tallers o sales de reunions',
      description:
        'Crue-Sostenibilidad recomana mantindre la mascareta en els espais universitaris compartits i CREUP defén una retirada prudent i progressiva de les mesures.',
    },
  ],
  'creup-denuncia-que-cerrar-instalaciones-universitarias-por-e-2022-04': [
    {
      locale: 'en',
      title:
        'CREUP denounces that closing university facilities over energy prices restricts the right to study',
      description:
        'CREUP rejects the early closure of facilities and the schedule changes driven by higher energy costs, arguing that they restrict the right to study.',
    },
    {
      locale: 'ca',
      title:
        "CREUP denuncia que tancar instal·lacions universitàries pel preu de l'energia limita el dret a l'estudi",
      description:
        "CREUP rebutja el tancament anticipat d'instal·lacions i els reajustaments d'horaris per l'encariment energètic, ja que considera que limiten el dret a l'estudi.",
    },
    {
      locale: 'eu',
      title:
        'CREUPek salatzen du unibertsitateko instalazioak energiaren prezioagatik ixteak ikasteko eskubidea mugatzen duela',
      description:
        'CREUPek instalazioen aurretiazko itxiera eta ordutegien doiketak baztertzen ditu energiaren garestitzeagatik, ikasteko eskubidea mugatzen dutela uste baitu.',
    },
    {
      locale: 'gl',
      title:
        'CREUP denuncia que pechar instalacións universitarias polo prezo da enerxía limita o dereito ao estudo',
      description:
        'CREUP rexeita o peche anticipado de instalacións e os reaxustes de horarios polo encarecemento enerxético, ao considerar que limitan o dereito ao estudo.',
    },
    {
      locale: 'val',
      title:
        "CREUP denuncia que tancar instal·lacions universitàries pel preu de l'energia limita el dret a l'estudi",
      description:
        "CREUP rebutja el tancament anticipat d'instal·lacions i els reajustaments d'horaris per l'encariment energètic, ja que considera que limiten el dret a l'estudi.",
    },
  ],
  'universitarios-denuncian-el-cierre-de-los-edificios-universi-2022-04': [
    {
      locale: 'en',
      title:
        'University students denounce the closure of university buildings amid rising energy costs',
      description:
        'CREUP demands the reopening of university facilities and specific funding to cope with rising energy costs without eroding rights.',
    },
    {
      locale: 'ca',
      title:
        "Els universitaris denuncien el tancament dels edificis universitaris davant l'encariment de l'energia",
      description:
        "CREUP exigeix la reobertura d'instal·lacions universitàries i una dotació específica d'ajudes per afrontar l'encariment de l'energia sense deteriorar drets.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitarioek unibertsitateko eraikinen itxiera salatzen dute energiaren garestitzearen aurrean',
      description:
        'CREUPek unibertsitateko instalazioak berriz irekitzea eta laguntzen berariazko zuzkidura bat eskatzen du, energiaren garestitzeari aurre egiteko eskubideak hondatu gabe.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios denuncian o peche dos edificios universitarios ante o encarecemento da enerxía',
      description:
        'CREUP esixe a reapertura de instalacións universitarias e unha dotación específica de axudas para afrontar o encarecemento da enerxía sen deteriorar dereitos.',
    },
    {
      locale: 'val',
      title:
        "Els universitaris denuncien el tancament dels edificis universitaris davant l'encariment de l'energia",
      description:
        "CREUP exigix la reobertura d'instal·lacions universitàries i una dotació específica d'ajudes per a afrontar l'encariment de l'energia sense deteriorar drets.",
    },
  ],
  'el-cierre-de-edificios-por-el-encarecimiento-de-la-energia-i-2022-04': [
    {
      locale: 'en',
      title: 'The closure of buildings over rising energy costs angers university students',
      description:
        'The student body rejects the closure of university buildings and the schedule changes resulting from higher energy costs because they restrict the right to study.',
    },
    {
      locale: 'ca',
      title: "El tancament d'edificis per l'encariment de l'energia indigna els universitaris",
      description:
        "L'estudiantat rebutja el tancament d'edificis universitaris i els reajustaments d'horaris derivats de l'encariment energètic per limitar el dret a l'estudi.",
    },
    {
      locale: 'eu',
      title: 'Energiaren garestitzeagatik eraikinak ixteak unibertsitarioak haserretzen ditu',
      description:
        'Ikasleriak unibertsitateko eraikinen itxiera eta energiaren garestitzetik eratorritako ordutegi-doiketak baztertzen ditu, ikasteko eskubidea mugatzen dutelako.',
    },
    {
      locale: 'gl',
      title: 'O peche de edificios polo encarecemento da enerxía indigna os universitarios',
      description:
        'O estudantado rexeita o peche de edificios universitarios e os reaxustes de horarios derivados do encarecemento enerxético por limitar o dereito ao estudo.',
    },
    {
      locale: 'val',
      title: "El tancament d'edificis per l'encariment de l'energia indigna els universitaris",
      description:
        "L'estudiantat rebutja el tancament d'edificis universitaris i els reajustaments d'horaris derivats de l'encariment energètic per limitar el dret a l'estudi.",
    },
  ],
  'la-uah-acoge-la-asamblea-general-ordinaria-de-la-coordinador-2022-04': [
    {
      locale: 'en',
      title:
        'The UAH hosts the Ordinary General Assembly of the Coordinating Body of Student Representatives of Public Universities',
      description:
        "The University of Alcalá hosts CREUP's Ordinary General Assembly, bringing together student representatives from public universities to address issues in the university system.",
    },
    {
      locale: 'ca',
      title:
        "La UAH acull l'Assemblea General Ordinària de la Coordinadora de Representants d'Estudiants d'Universitats Públiques",
      description:
        "La Universitat d'Alcalá acull l'Assemblea General Ordinària de CREUP, que reuneix representants estudiantils d'universitats públiques per abordar qüestions del sistema universitari.",
    },
    {
      locale: 'eu',
      title:
        'UAHk Unibertsitate Publikoetako Ikasle Ordezkarien Koordinakundearen Ohiko Batzar Nagusia hartzen du',
      description:
        'Alcaláko Unibertsitateak CREUPen Ohiko Batzar Nagusia hartzen du, unibertsitate publikoetako ikasle ordezkariak bilduz unibertsitate sistemaren gaiak jorratzeko.',
    },
    {
      locale: 'gl',
      title:
        'A UAH acolle a Asemblea Xeral Ordinaria da Coordinadora de Representantes de Estudantes de Universidades Públicas',
      description:
        'A Universidade de Alcalá acolle a Asemblea Xeral Ordinaria de CREUP, que reúne representantes estudantís de universidades públicas para abordar cuestións do sistema universitario.',
    },
    {
      locale: 'val',
      title:
        "La UAH acull l'Assemblea General Ordinària de la Coordinadora de Representants d'Estudiants d'Universitats Públiques",
      description:
        "La Universitat d'Alcalá acull l'Assemblea General Ordinària de CREUP, que reunix representants estudiantils d'universitats públiques per a abordar qüestions del sistema universitari.",
    },
  ],
  'la-coordinadora-de-estudiantes-de-universidades-se-da-cita-e-2022-04': [
    {
      locale: 'en',
      title: 'The Coordinating Body of University Students gathers in Alcalá',
      description:
        'Student representatives from public universities meet in Alcalá at a CREUP gathering focused on student participation and university improvement.',
    },
    {
      locale: 'ca',
      title: "La Coordinadora d'Estudiants d'Universitats es dóna cita a Alcalá",
      description:
        "Representants d'estudiants d'universitats públiques es reuneixen a Alcalá en el marc d'una cita de CREUP centrada en la participació estudiantil i la millora universitària.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitateetako Ikasleen Koordinakundea Alcalán biltzen da',
      description:
        'Unibertsitate publikoetako ikasle ordezkariak Alcalán biltzen dira, ikasleen parte-hartzean eta unibertsitatearen hobekuntzan ardaztutako CREUPen hitzordu baten baitan.',
    },
    {
      locale: 'gl',
      title: 'A Coordinadora de Estudantes de Universidades dáse cita en Alcalá',
      description:
        'Representantes de estudantes de universidades públicas reúnense en Alcalá no marco dunha cita de CREUP centrada na participación estudantil e na mellora universitaria.',
    },
    {
      locale: 'val',
      title: "La Coordinadora d'Estudiants d'Universitats es dóna cita en Alcalá",
      description:
        "Representants d'estudiants d'universitats públiques es reunixen en Alcalá en el marc d'una cita de CREUP centrada en la participació estudiantil i la millora universitària.",
    },
  ],
  'los-estudiantes-convocan-una-huelga-contra-la-reforma-educat-2022-03': [
    {
      locale: 'en',
      title:
        'Students call a strike against the Government\'s education reform: "It carries on from the PP\'s"',
      description:
        "The student body calls a strike against the Government's education reform, which it accuses of keeping elements that carry on from the previous legislation.",
    },
    {
      locale: 'ca',
      title:
        'Els estudiants convoquen una vaga contra la reforma educativa del Govern: «És continuista amb la del PP»',
      description:
        "L'estudiantat convoca una vaga contra la reforma educativa del Govern, a la qual acusa de mantenir elements continuistes respecte a la normativa anterior.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek greba deitu dute Gobernuaren hezkuntza erreformaren aurka: «PPrenarekin jarraitzailea da»',
      description:
        'Ikasleriak greba deitu du Gobernuaren hezkuntza erreformaren aurka, eta aurreko araudiarekiko jarraitzaileak diren elementuak mantentzea egotzi dio.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes convocan unha folga contra a reforma educativa do Goberno: «É continuísta coa do PP»',
      description:
        'O estudantado convoca unha folga contra a reforma educativa do Goberno, á que acusa de manter elementos continuístas respecto da normativa anterior.',
    },
    {
      locale: 'val',
      title:
        'Els estudiants convoquen una vaga contra la reforma educativa del Govern: «És continuista amb la del PP»',
      description:
        "L'estudiantat convoca una vaga contra la reforma educativa del Govern, a la qual acusa de mantindre elements continuistes respecte a la normativa anterior.",
    },
  ],
  'acpua-estudiantes-reunion-con-creup-2022-03': [
    {
      locale: 'en',
      title: 'ACPUA + students: meeting with CREUP',
      description:
        'ACPUA holds a meeting with CREUP to address student participation in the quality and assessment processes of the university system.',
    },
    {
      locale: 'ca',
      title: 'ACPUA + estudiants: reunió amb CREUP',
      description:
        "ACPUA manté una reunió amb CREUP per abordar la participació de l'estudiantat en els processos de qualitat i avaluació del sistema universitari.",
    },
    {
      locale: 'eu',
      title: 'ACPUA + ikasleak: CREUPekin bilera',
      description:
        'ACPUAk CREUPekin bilera bat egiten du, ikasleen parte-hartzea jorratzeko unibertsitate sistemaren kalitate eta ebaluazio prozesuetan.',
    },
    {
      locale: 'gl',
      title: 'ACPUA + estudantes: reunión con CREUP',
      description:
        'ACPUA mantén unha reunión con CREUP para abordar a participación do estudantado nos procesos de calidade e avaliación do sistema universitario.',
    },
    {
      locale: 'val',
      title: 'ACPUA + estudiants: reunió amb CREUP',
      description:
        "ACPUA manté una reunió amb CREUP per a abordar la participació de l'estudiantat en els processos de qualitat i avaluació del sistema universitari.",
    },
  ],
  'la-universitat-acoge-el-iii-congreso-creup-crue-para-abordar-2022-03': [
    {
      locale: 'en',
      title: 'The Universitat hosts the 3rd CREUP-CRUE Congress to address the LOSU',
      description:
        'The Universitat de València hosts the 3rd CREUP-CRUE Congress, focused on the debate over the LOSU and the improvement of the Spanish university system.',
    },
    {
      locale: 'ca',
      title: 'La Universitat acull el III Congrés CREUP-CRUE per abordar la LOSU',
      description:
        'La Universitat de València acull el III Congrés CREUP-CRUE, centrat en el debat sobre la LOSU i la millora del sistema universitari espanyol.',
    },
    {
      locale: 'eu',
      title: 'Universitatek III. CREUP-CRUE Kongresua hartzen du LOSU jorratzeko',
      description:
        'Valentziako Universitatek III. CREUP-CRUE Kongresua hartzen du, LOSUri buruzko eztabaidan eta Espainiako unibertsitate sistemaren hobekuntzan ardaztua.',
    },
    {
      locale: 'gl',
      title: 'A Universitat acolle o III Congreso CREUP-CRUE para abordar a LOSU',
      description:
        'A Universitat de València acolle o III Congreso CREUP-CRUE, centrado no debate sobre a LOSU e a mellora do sistema universitario español.',
    },
    {
      locale: 'val',
      title: 'La Universitat acull el III Congrés CREUP-CRUE per a abordar la LOSU',
      description:
        'La Universitat de València acull el III Congrés CREUP-CRUE, centrat en el debat sobre la LOSU i la millora del sistema universitari espanyol.',
    },
  ],
  'el-cermi-expresa-su-temor-a-que-la-nueva-ley-de-universidade-2022-03': [
    {
      locale: 'en',
      title:
        'Cermi voices its fear that the new Universities Act may be regressive for the inclusion of people with disabilities',
      description:
        'At the 3rd CREUP-CRUE Congress, Cermi warns that the new Universities Act may mean a step backwards in inclusion if it does not incorporate effective support measures.',
    },
    {
      locale: 'ca',
      title:
        "El Cermi expressa el seu temor que la nova Llei d'Universitats sigui regressiva per a la inclusió de les persones amb discapacitat",
      description:
        "El Cermi adverteix al III Congrés CREUP-CRUE que la nova Llei d'Universitats pot suposar un retrocés en inclusió si no incorpora suports efectius.",
    },
    {
      locale: 'eu',
      title:
        'Cermik bere kezka adierazi du Unibertsitateen Lege berria desgaitasuna duten pertsonen inklusiorako atzerakoia izan daitekeelako',
      description:
        'Cermik III. CREUP-CRUE Kongresuan ohartarazi du Unibertsitateen Lege berriak inklusioan atzerapausoa ekar dezakeela laguntza eraginkorrik txertatzen ez badu.',
    },
    {
      locale: 'gl',
      title:
        'O Cermi expresa o seu temor a que a nova Lei de Universidades sexa regresiva para a inclusión das persoas con discapacidade',
      description:
        'O Cermi advirte no III Congreso CREUP-CRUE de que a nova Lei de Universidades pode supoñer un retroceso en inclusión se non incorpora apoios efectivos.',
    },
    {
      locale: 'val',
      title:
        "El Cermi expressa el seu temor que la nova Llei d'Universitats siga regressiva per a la inclusió de les persones amb discapacitat",
      description:
        "El Cermi advertix en el III Congrés CREUP-CRUE que la nova Llei d'Universitats pot suposar un retrocés en inclusió si no incorpora suports efectius.",
    },
  ],
  'los-doctores-que-ejercen-como-profesores-ayudantes-ante-la-i-2022-03': [
    {
      locale: 'en',
      title:
        'Doctorate holders working as assistant lecturers, faced with the idea of training to teach: "It is a requirement that comes at the wrong time"',
      description:
        'The debate on the teaching training of assistant doctor lecturers places CREUP among the organisations that advocate strengthening university pedagogical preparation.',
    },
    {
      locale: 'ca',
      title:
        'Els doctors que exerceixen com a professors ajudants, davant la idea de formar-se per ensenyar: «És un requisit a deshora»',
      description:
        'El debat sobre la formació docent del professorat ajudant doctor situa CREUP entre les organitzacions que defensen reforçar la preparació pedagògica universitària.',
    },
    {
      locale: 'eu',
      title:
        'Irakasle laguntzaile gisa diharduten doktoreak, irakasteko prestatzeko ideiaren aurrean: «Garaiz kanpoko betebeharra da»',
      description:
        'Doktore laguntzaileen irakaskuntza prestakuntzari buruzko eztabaidak CREUP unibertsitateko prestakuntza pedagogikoa indartzea defendatzen duten erakundeen artean kokatzen du.',
    },
    {
      locale: 'gl',
      title:
        'Os doutores que exercen como profesores axudantes, ante a idea de formarse para ensinar: «É un requisito a destempo»',
      description:
        'O debate sobre a formación docente do profesorado axudante doutor sitúa CREUP entre as organizacións que defenden reforzar a preparación pedagóxica universitaria.',
    },
    {
      locale: 'val',
      title:
        'Els doctors que exercixen com a professors ajudants, davant la idea de formar-se per a ensenyar: «És un requisit a deshora»',
      description:
        'El debat sobre la formació docent del professorat ajudant doctor situa CREUP entre les organitzacions que defenen reforçar la preparació pedagògica universitària.',
    },
  ],
  'estudiantes-piden-al-gobierno-que-difunda-masivamente-los-ca-2022-02': [
    {
      locale: 'en',
      title:
        'Students ask the Government to widely publicise the changes to scholarship application deadlines',
      description:
        'CREUP calls on the Government to widely publicise the new scholarship application deadlines to prevent students from losing access to this support.',
    },
    {
      locale: 'ca',
      title:
        'Els estudiants demanen al Govern que difongui massivament els canvis en els terminis de sol·licitud de les beques',
      description:
        "CREUP reclama al Govern una difusió massiva dels nous terminis de sol·licitud de beques per evitar que l'estudiantat perdi l'accés a aquests ajuts.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek Gobernuari eskatzen diote beken eskaera-epeen aldaketak modu masiboan zabaltzeko',
      description:
        'CREUPek Gobernuari eskatzen dio beken eskaera-epe berriak modu masiboan zabaltzeko, ikasleek laguntza horietarako sarbidea gal ez dezaten.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes piden ao Goberno que difunda masivamente os cambios nos prazos de solicitude das bolsas',
      description:
        'CREUP reclama ao Goberno unha difusión masiva dos novos prazos de solicitude de bolsas para evitar que o estudantado perda o acceso a estas axudas.',
    },
    {
      locale: 'val',
      title:
        'Els estudiants demanen al Govern que difonga massivament els canvis en els terminis de sol·licitud de les beques',
      description:
        "CREUP reclama al Govern una difusió massiva dels nous terminis de sol·licitud de beques per a evitar que l'estudiantat perda l'accés a estes ajudes.",
    },
  ],
  'la-creup-consigue-mejoras-en-las-becas-del-ministerio-para-e-2022-02': [
    {
      locale: 'en',
      title:
        "CREUP secures improvements in the Ministry's scholarships for the 2022/2023 academic year",
      description:
        "CREUP welcomes progress on the Ministry's scholarships for the 2022/2023 academic year, although it maintains the need to keep improving the support system.",
    },
    {
      locale: 'ca',
      title: 'La CREUP aconsegueix millores en les beques del Ministeri per al curs 2022/2023',
      description:
        "CREUP valora avenços en les beques del Ministeri per al curs 2022/2023, tot i que manté la necessitat de continuar millorant el sistema d'ajuts.",
    },
    {
      locale: 'eu',
      title: 'CREUPek hobekuntzak lortzen ditu Ministerioaren beketan 2022/2023 ikasturterako',
      description:
        'CREUPek aurrerapausoak baloratzen ditu Ministerioaren beketan 2022/2023 ikasturterako, baina laguntza-sistema hobetzen jarraitzeko beharra mantentzen du.',
    },
    {
      locale: 'gl',
      title: 'A CREUP consegue melloras nas bolsas do Ministerio para o curso 2022/2023',
      description:
        'CREUP valora avances nas bolsas do Ministerio para o curso 2022/2023, aínda que mantén a necesidade de seguir mellorando o sistema de axudas.',
    },
    {
      locale: 'val',
      title: 'La CREUP aconseguix millores en les beques del Ministeri per al curs 2022/2023',
      description:
        "CREUP valora avanços en les beques del Ministeri per al curs 2022/2023, encara que manté la necessitat de continuar millorant el sistema d'ajudes.",
    },
  ],
  'los-estudiantes-creen-que-la-ley-de-convivencia-universitari-2022-02': [
    {
      locale: 'en',
      title:
        'Students believe the University Coexistence Act "does not respect" the "agreement" on the role of mediation',
      description:
        'CREUP denounces that the University Coexistence Act does not respect the agreement reached on mediation as the main mechanism for resolving conflicts.',
    },
    {
      locale: 'ca',
      title:
        "Els estudiants creuen que la Llei de Convivència Universitària «no respecta» l'«acord» sobre el paper de la mediació",
      description:
        "CREUP denuncia que la Llei de Convivència Universitària no respecta l'acord assolit sobre la mediació com a mecanisme principal de resolució de conflictes.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleen ustez, Unibertsitate Bizikidetza Legeak «ez du errespetatzen» bitartekaritzaren zereginari buruzko «akordioa»',
      description:
        'CREUPek salatzen du Unibertsitate Bizikidetza Legeak ez duela errespetatzen bitartekaritza gatazkak konpontzeko mekanismo nagusi gisa lortutako akordioa.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes cren que a Lei de Convivencia Universitaria «non respecta» o «acordo» sobre o papel da mediación',
      description:
        'CREUP denuncia que a Lei de Convivencia Universitaria non respecta o acordo acadado sobre a mediación como mecanismo principal de resolución de conflitos.',
    },
    {
      locale: 'val',
      title:
        "Els estudiants creuen que la Llei de Convivència Universitària «no respecta» l'«acord» sobre el paper de la mediació",
      description:
        "CREUP denuncia que la Llei de Convivència Universitària no respecta l'acord aconseguit sobre la mediació com a mecanisme principal de resolució de conflictes.",
    },
  ],
  'estudiantes-piden-a-los-rectores-respetar-el-acuerdo-con-ell-2022-02': [
    {
      locale: 'en',
      title:
        'Students ask vice-chancellors to respect the agreement reached with them when implementing the University Coexistence Act',
      description:
        'Students call on university institutions to respect the agreements reached with their representatives during the implementation of the University Coexistence Act.',
    },
    {
      locale: 'ca',
      title:
        "Els estudiants demanen als rectors respectar l'acord amb ells en implantar la Llei de Convivència Universitària",
      description:
        "L'estudiantat reclama a les institucions universitàries que respectin els acords assolits amb la seva representació durant la implantació de la Llei de Convivència Universitària.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek errektoreei eskatzen diete haiekin lortutako akordioa errespetatzeko Unibertsitate Bizikidetza Legea ezartzean',
      description:
        'Ikasleek unibertsitate-erakundeei eskatzen diete haien ordezkaritzarekin lortutako akordioak errespetatzeko Unibertsitate Bizikidetza Legea ezartzean.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes piden aos reitores respectar o acordo con eles ao implantar a Lei de Convivencia Universitaria',
      description:
        'O estudantado reclama ás institucións universitarias que respecten os acordos acadados coa súa representación durante a implantación da Lei de Convivencia Universitaria.',
    },
    {
      locale: 'val',
      title:
        "Els estudiants demanen als rectors respectar l'acord amb ells en implantar la Llei de Convivència Universitària",
      description:
        "L'estudiantat reclama a les institucions universitàries que respecten els acords aconseguits amb la seua representació durant la implantació de la Llei de Convivència Universitària.",
    },
  ],
  'los-universitarios-exigen-a-yolanda-diaz-que-se-les-tenga-en-2022-02': [
    {
      locale: 'en',
      title:
        'University students demand that Yolanda Díaz take them into account in drafting the Trainee Statute',
      description:
        'University students call for a say in drafting the Trainee Statute so that the reform of internships takes their demands into account.',
    },
    {
      locale: 'ca',
      title:
        "Els universitaris exigeixen a Yolanda Díaz que se'ls tingui en compte en l'elaboració de l'Estatut del Becari",
      description:
        "L'estudiantat universitari reclama participar en l'elaboració de l'Estatut del Becari perquè la reforma de les pràctiques tingui en compte les seves demandes.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek Yolanda Díazi eskatzen diote kontuan har ditzala Bekadunaren Estatutua egiterakoan',
      description:
        'Unibertsitateko ikasleek Bekadunaren Estatutua egiten parte hartzea eskatzen dute, praktiken erreformak haien eskaerak kontuan har ditzan.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios esixen a Yolanda Díaz que se os teña en conta na elaboración do Estatuto do Bolseiro',
      description:
        'O estudantado universitario reclama participar na elaboración do Estatuto do Bolseiro para que a reforma das prácticas teña en conta as súas demandas.',
    },
    {
      locale: 'val',
      title:
        "Els universitaris exigixen a Yolanda Díaz que se'ls tinga en compte en l'elaboració de l'Estatut del Becari",
      description:
        "L'estudiantat universitari reclama participar en l'elaboració de l'Estatut del Becari perquè la reforma de les pràctiques tinga en compte les seues demandes.",
    },
  ],
  'universitarios-piden-a-yolanda-diaz-que-comience-la-negociac-2022-02': [
    {
      locale: 'en',
      title:
        'University students ask Yolanda Díaz to begin negotiations on the Statute for Students on Work Placement',
      description:
        'CREUP asks the Ministry of Labour to start negotiating the Statute for Students on Work Placement and to agree a common position with students.',
    },
    {
      locale: 'ca',
      title:
        "Els universitaris demanen a Yolanda Díaz que comenci la negociació de l'Estatut de l'Estudiant en Pràctiques",
      description:
        "CREUP demana al Ministeri de Treball iniciar la negociació de l'Estatut de l'Estudiant en Pràctiques i acordar una posició comuna amb l'estudiantat.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek Yolanda Díazi eskatzen diote Praktiketako Ikaslearen Estatutuaren negoziazioa has dezala',
      description:
        'CREUPek Lan Ministerioari eskatzen dio Praktiketako Ikaslearen Estatutuaren negoziazioa hasteko eta ikasleekin jarrera komun bat adosteko.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios piden a Yolanda Díaz que comece a negociación do Estatuto do Estudante en Prácticas',
      description:
        'CREUP pide ao Ministerio de Traballo iniciar a negociación do Estatuto do Estudante en Prácticas e acordar unha posición común co estudantado.',
    },
    {
      locale: 'val',
      title:
        "Els universitaris demanen a Yolanda Díaz que comence la negociació de l'Estatut de l'Estudiant en Pràctiques",
      description:
        "CREUP demana al Ministeri de Treball iniciar la negociació de l'Estatut de l'Estudiant en Pràctiques i acordar una posició comuna amb l'estudiantat.",
    },
  ],
  'estudiantes-piden-a-subirats-que-les-situe-en-el-centro-de-l-2022-01': [
    {
      locale: 'en',
      title: 'Students ask Subirats to place them "at the heart of the new Universities Act"',
      description:
        'Student representatives ask Minister Joan Subirats to place students at the heart of the new Universities Act.',
    },
    {
      locale: 'ca',
      title:
        "Els estudiants demanen a Subirats que els situï «al centre de la nova Llei d'Universitats»",
      description:
        "La representació estudiantil demana al ministre Joan Subirats que col·loqui l'estudiantat al centre de la nova Llei d'Universitats.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek Subiratsi eskatzen diote «Unibertsitateen Lege berriaren erdigunean» koka ditzala',
      description:
        'Ikasleen ordezkaritzak Joan Subirats ministroari eskatzen dio ikasleak Unibertsitateen Lege berriaren erdigunean kokatzeko.',
    },
    {
      locale: 'gl',
      title: 'Os estudantes piden a Subirats que os sitúe «no centro da nova Lei de Universidades»',
      description:
        'A representación estudantil pide ao ministro Joan Subirats que coloque o estudantado no centro da nova Lei de Universidades.',
    },
    {
      locale: 'val',
      title:
        "Els estudiants demanen a Subirats que els situe «al centre de la nova Llei d'Universitats»",
      description:
        "La representació estudiantil demana al ministre Joan Subirats que col·loque l'estudiantat al centre de la nova Llei d'Universitats.",
    },
  ],
  'subirats-traslada-a-los-estudiantes-su-voluntad-de-seguir-ad-2022-01': [
    {
      locale: 'en',
      title:
        'Subirats conveys to students his "willingness" to press ahead with the LOSU and to "rethink" some issues',
      description:
        'Minister Joan Subirats tells students of his willingness to continue with the LOSU and to review some aspects of the university project.',
    },
    {
      locale: 'ca',
      title:
        'Subirats trasllada als estudiants la seva «voluntat» de tirar endavant amb la LOSU i de «repensar» alguns temes',
      description:
        "El ministre Joan Subirats comunica a l'estudiantat la seva voluntat de continuar amb la LOSU i revisar alguns aspectes del projecte universitari.",
    },
    {
      locale: 'eu',
      title:
        'Subiratsek ikasleei jakinarazi die LOSUrekin aurrera egiteko eta zenbait gai «berraztertzeko» «borondatea» duela',
      description:
        'Joan Subirats ministroak ikasleei jakinarazi die LOSUrekin jarraitzeko eta unibertsitate-proiektuaren zenbait alderdi berrikusteko borondatea duela.',
    },
    {
      locale: 'gl',
      title:
        'Subirats traslada aos estudantes a súa «vontade» de seguir adiante coa LOSU e de «repensar» algúns temas',
      description:
        'O ministro Joan Subirats comunica ao estudantado a súa vontade de continuar coa LOSU e revisar algúns aspectos do proxecto universitario.',
    },
    {
      locale: 'val',
      title:
        'Subirats trasllada als estudiants la seua «voluntat» de tirar avant amb la LOSU i de «repensar» alguns temes',
      description:
        "El ministre Joan Subirats comunica a l'estudiantat la seua voluntat de continuar amb la LOSU i revisar alguns aspectes del projecte universitari.",
    },
  ],
  'el-ministerio-de-subirats-busca-su-propio-espacio-2022-01': [
    {
      locale: 'en',
      title: "Subirats's ministry seeks its own space",
      description:
        'Joan Subirats begins his term as Minister of Universities aiming to give the department greater visibility and to open a new phase of dialogue with the university community.',
    },
    {
      locale: 'ca',
      title: 'El ministeri de Subirats busca el seu propi espai',
      description:
        "Joan Subirats inicia la seva etapa com a ministre d'Universitats amb la intenció de donar més visibilitat al departament i obrir una nova fase d'interlocució amb la comunitat universitària.",
    },
    {
      locale: 'eu',
      title: 'Subiratsen ministerioak bere espazio propioa bilatzen du',
      description:
        'Joan Subiratsek Unibertsitate ministro gisa bere etapa hasi du, sailari ikusgarritasun handiagoa emateko eta unibertsitate-komunitatearekin elkarrizketa-fase berri bat irekitzeko asmoz.',
    },
    {
      locale: 'gl',
      title: 'O ministerio de Subirats busca o seu propio espazo',
      description:
        'Joan Subirats inicia a súa etapa como ministro de Universidades coa intención de dar maior visibilidade ao departamento e abrir unha nova fase de interlocución coa comunidade universitaria.',
    },
    {
      locale: 'val',
      title: 'El ministeri de Subirats busca el seu propi espai',
      description:
        "Joan Subirats inicia la seua etapa com a ministre d'Universitats amb la intenció de donar més visibilitat al departament i obrir una nova fase d'interlocució amb la comunitat universitària.",
    },
  ],
  'subirats-no-secunda-a-castells-y-defiende-la-existencia-de-u-2022-01': [
    {
      locale: 'en',
      title:
        'Subirats does not back Castells and defends the existence of a Ministry of Universities',
      description:
        'Joan Subirats defends the existence of a stand-alone Ministry of Universities and announces that he will begin talks with vice-chancellors, regional officials and students.',
    },
    {
      locale: 'ca',
      title: "Subirats no secunda Castells i defensa l'existència d'un Ministeri d'Universitats",
      description:
        "Joan Subirats defensa l'existència d'un Ministeri d'Universitats propi i anuncia que iniciarà contactes amb rectors, consellers i estudiants.",
    },
    {
      locale: 'eu',
      title:
        'Subiratsek ez du Castells babesten eta Unibertsitate Ministerio baten existentzia defendatzen du',
      description:
        'Joan Subiratsek Unibertsitate Ministerio propio baten existentzia defendatzen du eta errektoreekin, sailburuekin eta ikasleekin harremanak hasiko dituela iragartzen du.',
    },
    {
      locale: 'gl',
      title:
        'Subirats non secunda a Castells e defende a existencia dun Ministerio de Universidades',
      description:
        'Joan Subirats defende a existencia dun Ministerio de Universidades propio e anuncia que comezará contactos con reitores, conselleiros e estudantes.',
    },
    {
      locale: 'val',
      title: "Subirats no secunda Castells i defén l'existència d'un Ministeri d'Universitats",
      description:
        "Joan Subirats defén l'existència d'un Ministeri d'Universitats propi i anuncia que iniciarà contactes amb rectors, consellers i estudiants.",
    },
  ],
  'la-comunidad-educativa-universitaria-aboga-por-no-retrasar-l-2022-01': [
    {
      locale: 'en',
      title:
        'The university education community advocates not delaying classes and defends in-person teaching',
      description:
        'The university education community is in favour of not delaying the return after the Christmas holidays and of keeping in-person teaching with preventive measures.',
    },
    {
      locale: 'ca',
      title:
        'La comunitat educativa universitària advoca per no endarrerir les classes i defensa la presencialitat',
      description:
        'La comunitat educativa universitària es mostra partidària de no endarrerir la tornada després de les vacances de Nadal i de mantenir la presencialitat amb mesures de prevenció.',
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko hezkuntza-komunitateak eskolak ez atzeratzearen alde egiten du eta presentzialtasuna defendatzen du',
      description:
        'Unibertsitateko hezkuntza-komunitatea Gabonetako oporren ondoren itzulera ez atzeratzearen eta prebentzio-neurriekin presentzialtasunari eustearen alde agertzen da.',
    },
    {
      locale: 'gl',
      title:
        'A comunidade educativa universitaria avoga por non atrasar as clases e defende a presencialidade',
      description:
        'A comunidade educativa universitaria móstrase partidaria de non atrasar a volta tras as vacacións de Nadal e de manter a presencialidade con medidas de prevención.',
    },
    {
      locale: 'val',
      title:
        'La comunitat educativa universitària advoca per no endarrerir les classes i defén la presencialitat',
      description:
        'La comunitat educativa universitària es mostra partidària de no endarrerir la tornada després de les vacacions de Nadal i de mantindre la presencialitat amb mesures de prevenció.',
    },
  ],
  'el-gobierno-mantiene-su-idea-de-la-vuelta-al-cole-presencial-2022-01': [
    {
      locale: 'en',
      title: 'The Government sticks to its plan for an in-person return to school on 10 January',
      description:
        'The Government maintains its forecast of an in-person return to classrooms on 10 January, after analysing the health situation with the autonomous communities.',
    },
    {
      locale: 'ca',
      title: "El Govern manté la seva idea de la tornada a l'escola presencial el 10 de gener",
      description:
        "El Govern manté la previsió de retorn presencial a les aules el 10 de gener, després d'analitzar la situació sanitària amb les comunitats autònomes.",
    },
    {
      locale: 'eu',
      title:
        'Gobernuak eskolarako itzulera presentziala urtarrilaren 10ean egiteko asmoari eusten dio',
      description:
        'Gobernuak ikasgeletarako itzulera presentziala urtarrilaren 10ean egiteko aurreikuspenari eusten dio, autonomia-erkidegoekin osasun-egoera aztertu ondoren.',
    },
    {
      locale: 'gl',
      title: 'O Goberno mantén a súa idea da volta ao cole presencial o 10 de xaneiro',
      description:
        'O Goberno mantén a previsión de retorno presencial ás aulas o 10 de xaneiro, tras analizar a situación sanitaria coas comunidades autónomas.',
    },
    {
      locale: 'val',
      title: "El Govern manté la seua idea de la tornada a l'escola presencial el 10 de gener",
      description:
        "El Govern manté la previsió de retorn presencial a les aules el 10 de gener, després d'analitzar la situació sanitària amb les comunitats autònomes.",
    },
  ],
  'educacion-sanidad-y-universidades-analizan-manana-el-regreso-2022-01': [
    {
      locale: 'en',
      title:
        'Education, Health and Universities to analyse the return to classrooms after Christmas tomorrow',
      description:
        'Health, Education and Universities are convening a joint meeting with the autonomous communities to analyse the return to classrooms after the Christmas holidays.',
    },
    {
      locale: 'ca',
      title:
        'Educació, Sanitat i Universitats analitzen demà la tornada a les aules després del Nadal',
      description:
        'Sanitat, Educació i Universitats convoquen una reunió conjunta amb les comunitats autònomes per analitzar la tornada a les aules després de les vacances de Nadal.',
    },
    {
      locale: 'eu',
      title:
        'Hezkuntzak, Osasunak eta Unibertsitateek bihar aztertuko dute Gabonen ondoren ikasgeletara itzultzea',
      description:
        'Osasunak, Hezkuntzak eta Unibertsitateek autonomia-erkidegoekin bilera bateratua deitu dute Gabonetako oporren ondoren ikasgeletara itzultzea aztertzeko.',
    },
    {
      locale: 'gl',
      title: 'Educación, Sanidade e Universidades analizan mañá a volta ás aulas tras o Nadal',
      description:
        'Sanidade, Educación e Universidades convocan unha reunión conxunta coas comunidades autónomas para analizar a volta ás aulas tras as vacacións de Nadal.',
    },
    {
      locale: 'val',
      title:
        'Educació, Sanitat i Universitats analitzen demà la tornada a les aules després del Nadal',
      description:
        'Sanitat, Educació i Universitats convoquen una reunió conjunta amb les comunitats autònomes per a analitzar la tornada a les aules després de les vacacions de Nadal.',
    },
  ],
  'universitarios-piden-no-retrasar-la-vuelta-a-las-clases-y-to-2022-01': [
    {
      locale: 'en',
      title:
        'University students ask not to delay the return to classes and for full in-person teaching',
      description:
        'CREUP asks not to delay the return to classrooms after Christmas and calls for the return to be in-person, safe and accompanied by revised protocols.',
    },
    {
      locale: 'ca',
      title:
        'Els universitaris demanen no endarrerir la tornada a les classes i presencialitat total',
      description:
        'CREUP demana no endarrerir la tornada a les aules després del Nadal i reclama que el retorn sigui presencial, segur i acompanyat de protocols revisats.',
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek eskoletara itzultzea ez atzeratzeko eta presentzialtasun osoa izateko eskatzen dute',
      description:
        'CREUPek Gabonen ondoren ikasgeletara itzultzea ez atzeratzeko eskatzen du, eta itzulera presentziala, segurua eta protokolo berrikusiekin lagundua izatea aldarrikatzen du.',
    },
    {
      locale: 'gl',
      title: 'Os universitarios piden non atrasar a volta ás clases e presencialidade total',
      description:
        'CREUP pide non atrasar a volta ás aulas tras o Nadal e reclama que o retorno sexa presencial, seguro e acompañado de protocolos revisados.',
    },
    {
      locale: 'val',
      title:
        'Els universitaris demanen no endarrerir la tornada a les classes i presencialitat total',
      description:
        'CREUP demana no endarrerir la tornada a les aules després del Nadal i reclama que el retorn siga presencial, segur i acompanyat de protocols revisats.',
    },
  ],
  'las-reformas-universitarias-impulsadas-por-castells-retos-de-2022-01': [
    {
      locale: 'en',
      title:
        'The university reforms driven by Castells, challenges for 2022 with Subirats as minister',
      description:
        'The LOSU and the University Coexistence Act remain the main university challenges for 2022, with Joan Subirats heading the Ministry.',
    },
    {
      locale: 'ca',
      title:
        'Les reformes universitàries impulsades per Castells, reptes del 2022 amb Subirats com a ministre',
      description:
        'La LOSU i la Llei de Convivència Universitària queden com a principals reptes universitaris per al 2022 amb Joan Subirats al capdavant del Ministeri.',
    },
    {
      locale: 'eu',
      title:
        'Castellsek bultzatutako unibertsitate-erreformak, 2022ko erronkak Subirats ministro dela',
      description:
        'LOSU eta Unibertsitate Bizikidetza Legea dira 2022rako unibertsitate-erronka nagusiak, Joan Subirats Ministerioaren buru dela.',
    },
    {
      locale: 'gl',
      title:
        'As reformas universitarias impulsadas por Castells, retos de 2022 con Subirats como ministro',
      description:
        'A LOSU e a Lei de Convivencia Universitaria quedan como principais retos universitarios para 2022 con Joan Subirats á fronte do Ministerio.',
    },
    {
      locale: 'val',
      title:
        'Les reformes universitàries impulsades per Castells, reptes del 2022 amb Subirats com a ministre',
      description:
        'La LOSU i la Llei de Convivència Universitària queden com a principals reptes universitaris per al 2022 amb Joan Subirats al capdavant del Ministeri.',
    },
  ],
  'los-estudiantes-universitarios-piden-al-nuevo-ministro-subir-2021-12': [
    {
      locale: 'en',
      title: 'University students ask the new minister Subirats to "restart" the "Castells Act"',
      description:
        'CREUP asks Joan Subirats to restart the LOSU project and to reconvene the negotiating tables in order to reach agreements with the university community.',
    },
    {
      locale: 'ca',
      title:
        'Els estudiants universitaris demanen al nou ministre Subirats «reiniciar» la «Llei Castells»',
      description:
        'CREUP sol·licita a Joan Subirats reiniciar el projecte de LOSU i tornar a convocar les meses de negociació per assolir acords amb la comunitat universitària.',
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek Subirats ministro berriari «Castells Legea» «berrabiarazteko» eskatzen diote',
      description:
        'CREUPek Joan Subiratsi eskatzen dio LOSUren proiektua berrabiarazteko eta negoziazio-mahaiak berriz deitzeko, unibertsitate-komunitatearekin akordioak lortzeko.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes universitarios piden ao novo ministro Subirats «reiniciar» a «Lei Castells»',
      description:
        'CREUP solicita a Joan Subirats reiniciar o proxecto de LOSU e volver convocar as mesas de negociación para acadar acordos coa comunidade universitaria.',
    },
    {
      locale: 'val',
      title:
        'Els estudiants universitaris demanen al nou ministre Subirats «reiniciar» la «Llei Castells»',
      description:
        'CREUP sol·licita a Joan Subirats reiniciar el projecte de LOSU i tornar a convocar les meses de negociació per a aconseguir acords amb la comunitat universitària.',
    },
  ],
  'los-estudiantes-universitarios-piden-al-nuevo-ministro-subir-2021-12-2': [
    {
      locale: 'en',
      title: 'University students ask the new minister Subirats to "restart" the "Castells Act"',
      description:
        'CREUP asks the new Minister of Universities to reopen the LOSU negotiations, as it considers the project does not bring enough progress for students.',
    },
    {
      locale: 'ca',
      title:
        'Els estudiants universitaris demanen al nou ministre Subirats «reiniciar» la «Llei Castells»',
      description:
        "CREUP demana al nou ministre d'Universitats reobrir la negociació de la LOSU perquè considera que el projecte no aporta avenços suficients per a l'estudiantat.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek Subirats ministro berriari «Castells Legea» «berrabiarazteko» eskatzen diote',
      description:
        'CREUPek Unibertsitate ministro berriari LOSUren negoziazioa berriro irekitzeko eskatzen dio, proiektuak ikasleentzat aurrerapauso nahikorik ez dakarrela uste baitu.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes universitarios piden ao novo ministro Subirats «reiniciar» a «Lei Castells»',
      description:
        'CREUP pide ao novo ministro de Universidades reabrir a negociación da LOSU ao considerar que o proxecto non achega avances suficientes para o estudantado.',
    },
    {
      locale: 'val',
      title:
        'Els estudiants universitaris demanen al nou ministre Subirats «reiniciar» la «Llei Castells»',
      description:
        "CREUP demana al nou ministre d'Universitats reobrir la negociació de la LOSU perquè considera que el projecte no aporta avanços suficients per a l'estudiantat.",
    },
  ],
  'joan-subirats-apela-al-consenso-al-asumir-el-cargo-de-nuevo-2021-12': [
    {
      locale: 'en',
      title:
        'Joan Subirats appeals for "consensus" as he takes office as the new Minister of Universities',
      description:
        'Joan Subirats takes over the Ministry of Universities appealing for consensus and for continuity of the legislative project begun by Manuel Castells.',
    },
    {
      locale: 'ca',
      title:
        "Joan Subirats apel·la al «consens» en assumir el càrrec de nou ministre d'Universitats",
      description:
        "Joan Subirats assumeix el Ministeri d'Universitats apel·lant al consens i a la continuïtat del projecte normatiu iniciat per Manuel Castells.",
    },
    {
      locale: 'eu',
      title:
        'Joan Subiratsek «adostasunari» dei egiten dio Unibertsitate ministro berri kargua hartzean',
      description:
        'Joan Subiratsek Unibertsitate Ministerioa bere gain hartzen du, adostasunari eta Manuel Castellsek hasitako arau-proiektuaren jarraipenari dei eginez.',
    },
    {
      locale: 'gl',
      title:
        'Joan Subirats apela ao «consenso» ao asumir o cargo de novo ministro de Universidades',
      description:
        'Joan Subirats asume o Ministerio de Universidades apelando ao consenso e á continuidade do proxecto normativo iniciado por Manuel Castells.',
    },
    {
      locale: 'val',
      title:
        "Joan Subirats apel·la al «consens» en assumir el càrrec de nou ministre d'Universitats",
      description:
        "Joan Subirats assumix el Ministeri d'Universitats apel·lant al consens i a la continuïtat del projecte normatiu iniciat per Manuel Castells.",
    },
  ],
  'estudiantes-piden-al-nuevo-ministro-de-universidades-que-esc-2021-12': [
    {
      locale: 'en',
      title:
        'Students ask the new Minister of Universities to listen to their demands after Castells\'s "disastrous" tenure',
      description:
        "Student organisations ask Joan Subirats to listen to their demands in the new LOSU and criticise Manuel Castells's management.",
    },
    {
      locale: 'ca',
      title:
        "Els estudiants demanen al nou ministre d'Universitats que escolti les seves demandes després del pas «desastrós» de Castells",
      description:
        'Organitzacions estudiantils demanen a Joan Subirats que escolti les seves reivindicacions en la nova LOSU i critiquen la gestió de Manuel Castells.',
    },
    {
      locale: 'eu',
      title:
        'Ikasleek Unibertsitate ministro berriari haien eskaerak entzuteko eskatzen diote Castellsen ibilbide «hondatzailearen» ondoren',
      description:
        'Ikasle-erakundeek Joan Subiratsi eskatzen diote haien aldarrikapenak entzuteko LOSU berrian, eta Manuel Castellsen kudeaketa kritikatzen dute.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes piden ao novo ministro de Universidades que escoite as súas demandas tras o paso «desastroso» de Castells',
      description:
        'Organizacións estudantís piden a Joan Subirats que escoite as súas reivindicacións na nova LOSU e critican a xestión de Manuel Castells.',
    },
    {
      locale: 'val',
      title:
        "Els estudiants demanen al nou ministre d'Universitats que escolte les seues demandes després del pas «desastrós» de Castells",
      description:
        'Organitzacions estudiantils demanen a Joan Subirats que escolte les seues reivindicacions en la nova LOSU i critiquen la gestió de Manuel Castells.',
    },
  ],
  'estudiantes-piden-al-nuevo-ministro-de-universidades-que-esc-2021-12-2': [
    {
      locale: 'en',
      title: 'Students ask the new Minister of Universities to listen to their demands',
      description:
        'Student representatives call on the new minister Joan Subirats to take their demands into account in the drafting of the LOSU.',
    },
    {
      locale: 'ca',
      title: "Els estudiants demanen al nou ministre d'Universitats que escolti les seves demandes",
      description:
        'Representants estudiantils reclamen al nou ministre Joan Subirats que tingui en compte les seves demandes en la redacció de la LOSU.',
    },
    {
      locale: 'eu',
      title: 'Ikasleek Unibertsitate ministro berriari haien eskaerak entzuteko eskatzen diote',
      description:
        'Ikasle-ordezkariek Joan Subirats ministro berriari eskatzen diote haien eskaerak kontuan har ditzala LOSUren idazketan.',
    },
    {
      locale: 'gl',
      title: 'Os estudantes piden ao novo ministro de Universidades que escoite as súas demandas',
      description:
        'Representantes estudantís reclaman ao novo ministro Joan Subirats que teña en conta as súas demandas na redacción da LOSU.',
    },
    {
      locale: 'val',
      title: "Els estudiants demanen al nou ministre d'Universitats que escolte les seues demandes",
      description:
        'Representants estudiantils reclamen al nou ministre Joan Subirats que tinga en compte les seues demandes en la redacció de la LOSU.',
    },
  ],
  'estudiantes-y-rectores-se-sublevan-contra-castells-y-dejan-s-2021-11': [
    {
      locale: 'en',
      title:
        'Students and rectors rise up against Castells and leave his university reform up in the air',
      description:
        "Students and rectors reject central aspects of Castells's university reform, with student protests and CRUE criticism of the LOSU draft bill.",
    },
    {
      locale: 'ca',
      title:
        "Estudiants i rectors es revolten contra Castells i deixen la seva reforma universitària en l'aire",
      description:
        "Estudiants i rectors rebutgen aspectes centrals de la reforma universitària de Castells, amb protestes estudiantils i crítiques de la CRUE a l'avantprojecte de la LOSU.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleak eta errektoreak Castellsen aurka altxatu dira eta haren unibertsitate erreforma airean utzi dute',
      description:
        'Ikasleek eta errektoreek Castellsen unibertsitate erreformaren funtsezko alderdiak baztertu dituzte, ikasleen protestekin eta CRUEk LOSUren aurreproiektuari egindako kritikekin.',
    },
    {
      locale: 'gl',
      title:
        'Estudantes e reitores sublévanse contra Castells e deixan a súa reforma universitaria no aire',
      description:
        'Estudantes e reitores rexeitan aspectos centrais da reforma universitaria de Castells, con protestas estudantís e críticas da CRUE ao anteproxecto da LOSU.',
    },
    {
      locale: 'val',
      title:
        "Estudiants i rectors es revolten contra Castells i deixen la seua reforma universitària en l'aire",
      description:
        "Estudiants i rectors rebutgen aspectes centrals de la reforma universitària de Castells, amb protestes estudiantils i les crítiques que la CRUE adreça a l'avantprojecte de la LOSU.",
    },
  ],
  'universitarios-piden-que-la-ley-castells-inicie-el-camino-ha-2021-10': [
    {
      locale: 'en',
      title:
        'University students call for the "Castells Law" to start the path towards free university tuition fees',
      description:
        'CREUP and CEUNE call for the LOSU to include a funding system that allows progress towards making public university fees free of charge.',
    },
    {
      locale: 'ca',
      title:
        'Els universitaris demanen que la «Llei Castells» iniciï el camí cap a la gratuïtat de les taxes universitàries',
      description:
        'CREUP i CEUNE demanen que la LOSU inclogui un sistema de finançament que permeti avançar cap a la gratuïtat dels preus públics universitaris.',
    },
    {
      locale: 'eu',
      title:
        'Unibertsitarioek «Castells Legeak» unibertsitate tasen doakotasunerako bidea has dezala eskatzen dute',
      description:
        'CREUPek eta CEUNEk eskatzen dute LOSUk unibertsitateko prezio publikoen doakotasunerantz aurreratzeko aukera emango duen finantzaketa sistema bat barne hartzea.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios piden que a «Lei Castells» inicie o camiño cara á gratuidade das taxas universitarias',
      description:
        'CREUP e CEUNE piden que a LOSU inclúa un sistema de financiamento que permita avanzar cara á gratuidade dos prezos públicos universitarios.',
    },
    {
      locale: 'val',
      title:
        'Els universitaris demanen que la «Llei Castells» inicie el camí cap a la gratuïtat de les taxes universitàries',
      description:
        'CREUP i CEUNE demanen que la LOSU incloga un sistema de finançament que permeta avançar cap a la gratuïtat dels preus públics universitaris.',
    },
  ],
  'castells-rectifica-con-la-ley-universitaria-y-retira-algunas-2021-10': [
    {
      locale: 'en',
      title:
        'Castells backtracks on the university law and withdraws some of his most questioned proposals',
      description:
        'The Ministry of Universities withdraws several LOSU proposals that had drawn opposition from rectors, unions and students in order to seek greater consensus.',
    },
    {
      locale: 'ca',
      title:
        'Castells rectifica amb la llei universitària i retira algunes de les seves propostes més qüestionades',
      description:
        "El Ministeri d'Universitats retira diverses propostes de la LOSU que havien generat rebuig entre rectors, sindicats i estudiants per buscar un consens més ampli.",
    },
    {
      locale: 'eu',
      title:
        'Castellsek unibertsitate legea zuzendu eta bere proposamen zalantzagarrienetako batzuk kendu ditu',
      description:
        'Unibertsitate Ministerioak errektoreen, sindikatuen eta ikasleen artean atxikimendurik eza sortu zuten LOSUren hainbat proposamen kentzen ditu, adostasun handiagoa bilatzeko.',
    },
    {
      locale: 'gl',
      title:
        'Castells rectifica coa lei universitaria e retira algunhas das súas propostas máis cuestionadas',
      description:
        'O Ministerio de Universidades retira varias propostas da LOSU que xeraran rexeitamento entre reitores, sindicatos e estudantes para buscar un maior consenso.',
    },
    {
      locale: 'val',
      title:
        'Castells rectifica amb la llei universitària i retira algunes de les seues propostes més qüestionades',
      description:
        "El Ministeri d'Universitats retira diverses propostes de la LOSU que havien generat rebuig entre rectors, sindicats i estudiants per a buscar un consens més ampli.",
    },
  ],
  'las-lineas-rojas-de-los-rectores-a-la-ley-castells-ni-plazas-2021-10': [
    {
      locale: 'en',
      title:
        'The rectors\' red lines on the "Castells Law": no permanent posts for associate lecturers and no assistant professors governing',
      description:
        'The Conference of Rectors rejects several aspects of the LOSU draft bill, arguing that they encroach on university autonomy and propose measures that are hard to apply.',
    },
    {
      locale: 'ca',
      title:
        'Les línies vermelles dels rectors a la «Llei Castells»: ni places fixes per a associats ni professors titulars governant',
      description:
        "La Conferència de Rectors rebutja diversos aspectes de l'avantprojecte de la LOSU per considerar que envaeixen l'autonomia universitària i plantegen mesures difícils d'aplicar.",
    },
    {
      locale: 'eu',
      title:
        'Errektoreen lerro gorriak «Castells Legeari»: ez plaza finkorik irakasle elkartuentzat, ezta irakasle titularrik gobernuan ere',
      description:
        'Errektoreen Konferentziak LOSUren aurreproiektuaren hainbat alderdi baztertzen ditu, unibertsitate autonomia urratzen dutela eta aplikatzen zailak diren neurriak planteatzen dituztela uste baitu.',
    },
    {
      locale: 'gl',
      title:
        'As liñas vermellas dos reitores á «Lei Castells»: nin prazas fixas para asociados nin profesores titulares gobernando',
      description:
        'A Conferencia de Reitores rexeita varios aspectos do anteproxecto da LOSU por considerar que invaden a autonomía universitaria e formulan medidas difíciles de aplicar.',
    },
    {
      locale: 'val',
      title:
        'Les línies roges dels rectors a la «Llei Castells»: ni places fixes per a associats ni professors titulars governant',
      description:
        "La Conferència de Rectors rebutja diversos aspectes de l'avantprojecte de la LOSU perquè considera que envaïxen l'autonomia universitària i plantegen mesures difícils d'aplicar.",
    },
  ],
  'organizaciones-estudiantiles-denuncian-que-la-ley-castells-s-2021-09': [
    {
      locale: 'en',
      title:
        'Student organisations denounce that the "Castells Law" has only been negotiated with the rectors',
      description:
        'CREUP and CEUNE denounce that the LOSU draft bill has been negotiated mainly with CRUE and call for a real debate with the student body.',
    },
    {
      locale: 'ca',
      title:
        "Organitzacions estudiantils denuncien que la «Llei Castells» només s'ha negociat amb els rectors",
      description:
        "CREUP i CEUNE denuncien que l'avantprojecte de la LOSU s'ha negociat principalment amb la CRUE i reclamen un debat real amb l'estudiantat.",
    },
    {
      locale: 'eu',
      title: 'Ikasle erakundeek «Castells Legea» errektoreekin soilik negoziatu dela salatzen dute',
      description:
        'CREUPek eta CEUNEk salatzen dute LOSUren aurreproiektua nagusiki CRUErekin negoziatu dela eta ikasleekin benetako eztabaida bat eskatzen dute.',
    },
    {
      locale: 'gl',
      title:
        'Organizacións estudantís denuncian que a «Lei Castells» só foi negociada cos reitores',
      description:
        'CREUP e CEUNE denuncian que o anteproxecto da LOSU foi negociado principalmente coa CRUE e reclaman un debate real co estudantado.',
    },
    {
      locale: 'val',
      title:
        "Organitzacions estudiantils denuncien que la «Llei Castells» només s'ha negociat amb els rectors",
      description:
        "CREUP i CEUNE denuncien que este avantprojecte de la LOSU s'ha negociat principalment amb la CRUE i reclamen un debat real amb l'estudiantat.",
    },
  ],
  'las-universidades-espanolas-avanzan-positivamente-pero-sigue-2021-09': [
    {
      locale: 'en',
      title:
        'Spanish universities are making positive progress, but underfunding and overqualification persist',
      description:
        'The CYD Foundation report points to progress in Spanish universities, but still flags low funding, limited autonomy and overqualification as problems.',
    },
    {
      locale: 'ca',
      title:
        'Les universitats espanyoles avancen positivament, però segueix havent-hi manca de finançament i sobrequalificació',
      description:
        "L'informe de la Fundació CYD apunta avenços a la universitat espanyola, però manté com a problemes el baix finançament, l'autonomia limitada i la sobrequalificació.",
    },
    {
      locale: 'eu',
      title:
        'Espainiako unibertsitateek aurrera egiten dute modu positiboan, baina finantzaketa falta eta gainkualifikazioa irauten dute',
      description:
        'CYD Fundazioaren txostenak aurrerapenak nabarmentzen ditu Espainiako unibertsitatean, baina arazo gisa mantentzen ditu finantzaketa eskasa, autonomia mugatua eta gainkualifikazioa.',
    },
    {
      locale: 'gl',
      title:
        'As universidades españolas avanzan positivamente, pero segue existindo falta de financiamento e sobrecualificación',
      description:
        'O informe da Fundación CYD apunta avances na universidade española, pero mantén como problemas o baixo financiamento, a limitada autonomía e a sobrecualificación.',
    },
    {
      locale: 'val',
      title:
        'Les universitats espanyoles avancen positivament, però continua havent-hi falta de finançament i sobrequalificació',
      description:
        "L'informe de la Fundació CYD apunta avanços en la universitat espanyola, però manté com a problemes el baix finançament, l'autonomia limitada i la sobrequalificació.",
    },
  ],
  'los-refugios-impenitentes-de-las-novatadas-universitarias-en-2021-09': [
    {
      locale: 'en',
      title:
        'The unrepentant strongholds of university hazing: pastes of flour, vinegar and oil over the head to make friends',
      description:
        "El País examines the persistence of university hazing and gathers CREUP's position on power relations and practices that may border on harassment.",
    },
    {
      locale: 'ca',
      title:
        'Els refugis impenitents de les novatades universitàries: pastes de farina, vinagre i oli pel cap per fer amics',
      description:
        "El País analitza la persistència de les novatades universitàries i recull la posició de CREUP sobre les relacions de poder i les pràctiques que poden vorejar l'assetjament.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitate notatxen aterpe damugabeak: irin, ozpin eta olio orea buruan lagunak egiteko',
      description:
        'El Paísek unibertsitate notatxen iraupena aztertzen du eta CREUPen jarrera jasotzen du botere harremanei eta jazarpenetik gertu egon daitezkeen praktikei buruz.',
    },
    {
      locale: 'gl',
      title:
        'Os refuxios impenitentes das novatadas universitarias: engrudos de fariña, vinagre e aceite pola cabeza para facer amigos',
      description:
        'El País analiza a persistencia das novatadas universitarias e recolle a posición de CREUP sobre as relacións de poder e as prácticas que poden rozar o acoso.',
    },
    {
      locale: 'val',
      title:
        'Els refugis impenitents de les novatades universitàries: pastes de farina, vinagre i oli pel cap per a fer amics',
      description:
        "El País analitza la persistència de les novatades universitàries i arreplega la posició de CREUP sobre les relacions de poder i les pràctiques que poden vorejar l'assetjament.",
    },
  ],
  'los-estudiantes-rechazan-de-forma-unanime-la-ley-castells-ti-2021-09': [
    {
      locale: 'en',
      title: 'Students unanimously reject the "Castells Law": "It has undemocratic parts"',
      description:
        "ABC reports the CEUNE's rejection of the LOSU draft bill, arguing that it cuts the student body's rights and guarantees and reduces their participation in the university community.",
    },
    {
      locale: 'ca',
      title:
        'Els estudiants rebutgen de manera unànime la «llei Castells»: «Té parts antidemocràtiques»',
      description:
        "ABC recull el rebuig del CEUNE a l'avantprojecte de la LOSU per considerar que redueix drets i garanties de l'estudiantat i minva la seva participació en la comunitat universitària.",
    },
    {
      locale: 'eu',
      title: 'Ikasleek aho batez baztertzen dute «Castells legea»: «Zati antidemokratikoak ditu»',
      description:
        'ABCk CEUNEk LOSUren aurreproiektuari egindako ezezkoa jasotzen du, ikasleen eskubideak eta bermeak murrizten dituela eta unibertsitate komunitatean duten parte-hartzea gutxitzen duela uste baitu.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes rexeitan de forma unánime a «lei Castells»: «Ten partes antidemocráticas»',
      description:
        'ABC recolle o rexeitamento do CEUNE ao anteproxecto da LOSU por considerar que reduce dereitos e garantías do estudantado e minora a súa participación na comunidade universitaria.',
    },
    {
      locale: 'val',
      title:
        'Els estudiants rebutgen de manera unànime la «llei Castells»: «Té parts antidemocràtiques»',
      description:
        "ABC arreplega el rebuig del CEUNE a l'avantprojecte de la LOSU perquè considera que reduïx drets i garanties de l'estudiantat i minva la seua participació en la comunitat universitària.",
    },
  ],
  'suspenso-a-la-nueva-ley-universitaria-por-la-perdida-de-pode-2021-09': [
    {
      locale: 'en',
      title: "Failing grade for the new university law over the student body's loss of power",
      description:
        "El Salto addresses students' criticism of the LOSU draft bill over the student body's reduced weight in university governance and the concentration of power in other bodies.",
    },
    {
      locale: 'ca',
      title: "Suspens a la nova llei universitària per la pèrdua de poder de l'estudiantat",
      description:
        "El Salto aborda les crítiques estudiantils a l'avantprojecte de la LOSU per la pèrdua de pes de l'estudiantat en la governança universitària i la concentració de poder en altres òrgans.",
    },
    {
      locale: 'eu',
      title: 'Gainditu gabe unibertsitate lege berria, ikasleen botere galeragatik',
      description:
        'El Saltok ikasleek LOSUren aurreproiektuari egindako kritikak jorratzen ditu, ikasleek unibertsitate gobernantzan duten pisua galtzeagatik eta botereak beste organo batzuetan pilatzeagatik.',
    },
    {
      locale: 'gl',
      title: 'Suspenso á nova lei universitaria pola perda de poder do estudantado',
      description:
        'El Salto aborda as críticas estudantís ao anteproxecto da LOSU pola perda de peso do estudantado na gobernanza universitaria e a concentración de poder noutros órganos.',
    },
    {
      locale: 'val',
      title: "Suspens a la nova llei universitària per la pèrdua de poder de l'estudiantat",
      description:
        "El Salto aborda les crítiques estudiantils a este avantprojecte de la LOSU per la pèrdua de pes de l'estudiantat en la governança universitària i la concentració de poder en altres òrgans.",
    },
  ],
  'sindicatos-docentes-y-estudiantes-insatisfechos-con-la-losu-2021-09': [
    {
      locale: 'en',
      title: "Unions, teaching staff and students dissatisfied with Minister Castells's LOSU",
      description:
        'Catalunya Press reports the discontent of unions, teaching staff and students with the LOSU draft bill and its effects on university governance, funding and participation.',
    },
    {
      locale: 'ca',
      title: 'Sindicats, docents i estudiants, insatisfets amb la LOSU del ministre Castells',
      description:
        "Catalunya Press recull el malestar de sindicats, docents i estudiants davant l'avantprojecte de la LOSU i els seus efectes sobre la governança, el finançament i la participació universitària.",
    },
    {
      locale: 'eu',
      title: 'Sindikatuak, irakasleak eta ikasleak, Castells ministroaren LOSUrekin asegabe',
      description:
        'Catalunya Pressek sindikatuen, irakasleen eta ikasleen kezka jasotzen du LOSUren aurreproiektuaren aurrean eta unibertsitate gobernantzan, finantzaketan eta parte-hartzean dituen ondorioen aurrean.',
    },
    {
      locale: 'gl',
      title: 'Sindicatos, docentes e estudantes, insatisfeitos coa LOSU do ministro Castells',
      description:
        'Catalunya Press recolle o malestar de sindicatos, docentes e estudantes ante o anteproxecto da LOSU e os seus efectos sobre a gobernanza, o financiamento e a participación universitaria.',
    },
    {
      locale: 'val',
      title: 'Sindicats, docents i estudiants, insatisfets amb la LOSU del ministre Castells',
      description:
        "Catalunya Press arreplega el malestar de sindicats, docents i estudiants davant l'avantprojecte de la LOSU i els seus efectes sobre la governança, el finançament i la participació universitària.",
    },
  ],
  'rebelion-estudiantil-contra-castells-por-dejarles-plantados-2021-09': [
    {
      locale: 'en',
      title: 'Student rebellion against Castells for standing them up to go to Catalonia',
      description:
        'EsDiario reports student discontent with the Ministry of Universities over its handling of the dialogue on the university reform and the meeting planned with the student body.',
    },
    {
      locale: 'ca',
      title: 'Rebel·lió estudiantil contra Castells per deixar-los plantats per anar a Catalunya',
      description:
        "EsDiario informa del malestar estudiantil amb el Ministeri d'Universitats per la gestió del diàleg sobre la reforma universitària i la reunió prevista amb l'estudiantat.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleen matxinada Castellsen aurka, Kataluniara joateagatik plantatuta utzi zituelako',
      description:
        'EsDiariok ikasleek Unibertsitate Ministerioarekin duten kezkaren berri ematen du, unibertsitate erreformari buruzko elkarrizketaren kudeaketagatik eta ikasleekin aurreikusitako bileragatik.',
    },
    {
      locale: 'gl',
      title: 'Rebelión estudantil contra Castells por deixalos plantados para ir a Cataluña',
      description:
        'EsDiario informa do malestar estudantil co Ministerio de Universidades pola xestión do diálogo sobre a reforma universitaria e a reunión prevista co estudantado.',
    },
    {
      locale: 'val',
      title: 'Rebel·lió estudiantil contra Castells per deixar-los plantats per a anar a Catalunya',
      description:
        "EsDiario informa del malestar estudiantil amb el Ministeri d'Universitats per la gestió del diàleg sobre la reforma universitària i per la reunió que estava prevista amb l'estudiantat.",
    },
  ],
  'objetivo-de-la-universidad-para-el-nuevo-curso-retomar-la-pl-2021-09': [
    {
      locale: 'en',
      title:
        "The university's goal for the new academic year: returning to full in-person teaching",
      description:
        'El País examines the goal shared by CRUE and CREUP of restoring in-person university teaching, conditioned by the health situation, infrastructure and available resources.',
    },
    {
      locale: 'ca',
      title: 'Objectiu de la universitat per al nou curs: recuperar la plena presencialitat',
      description:
        "El País analitza l'objectiu compartit per la CRUE i CREUP de recuperar la presencialitat universitària, condicionat per la situació sanitària, les infraestructures i els recursos disponibles.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitatearen helburua ikasturte berrirako: presentzialtasun osoa berreskuratzea',
      description:
        'El Paísek CRUEk eta CREUPek partekatutako helburua aztertzen du, unibertsitateko presentzialtasuna berreskuratzekoa, osasun egoerak, azpiegiturek eta eskuragarri dauden baliabideek baldintzatua.',
    },
    {
      locale: 'gl',
      title: 'Obxectivo da universidade para o novo curso: retomar a plena presencialidade',
      description:
        'El País analiza o obxectivo compartido pola CRUE e CREUP de recuperar a presencialidade universitaria, condicionado pola situación sanitaria, as infraestruturas e os recursos dispoñibles.',
    },
    {
      locale: 'val',
      title: 'Objectiu de la universitat per al nou curs: recuperar la plena presencialitat',
      description:
        "El País analitza l'objectiu compartit per la CRUE i CREUP de recuperar la presencialitat universitària, condicionat per la situació sanitària, per les infraestructures i pels recursos disponibles.",
    },
  ],
  'estudiantes-valoran-que-la-ley-de-convivencia-universitaria-2021-09': [
    {
      locale: 'en',
      title: 'Students welcome the University Coexistence Law punishing harassment',
      description:
        "COPE reports the student body's positive assessment of a University Coexistence Law that introduces penalties against harassment and mediation measures on campuses.",
    },
    {
      locale: 'ca',
      title:
        "Els estudiants valoren que la Llei de Convivència Universitària castigui l'assetjament",
      description:
        "COPE recull la valoració positiva de l'estudiantat davant una Llei de Convivència Universitària que incorpora sancions contra l'assetjament i mesures de mediació als campus.",
    },
    {
      locale: 'eu',
      title: 'Ikasleek ontzat jotzen dute Unibertsitate Bizikidetza Legeak jazarpena zigortzea',
      description:
        'COPEk ikasleen balorazio positiboa jasotzen du jazarpenaren aurkako zigorrak eta campusetan bitartekaritza neurriak barne hartzen dituen Unibertsitate Bizikidetza Legearen aurrean.',
    },
    {
      locale: 'gl',
      title: 'Os estudantes valoran que a Lei de Convivencia Universitaria castigue o acoso',
      description:
        'COPE recolle a valoración positiva do estudantado ante unha Lei de Convivencia Universitaria que incorpora sancións contra o acoso e medidas de mediación nos campus.',
    },
    {
      locale: 'val',
      title:
        "Els estudiants valoren que la Llei de Convivència Universitària castigue l'assetjament",
      description:
        "COPE arreplega la valoració positiva de l'estudiantat davant una Llei de Convivència Universitària que incorpora sancions contra l'assetjament i mesures de mediació en els campus.",
    },
  ],
  'estudiantes-celebran-la-ley-de-convivencia-universitaria-por-2021-09': [
    {
      locale: 'en',
      title:
        'Students welcome the University Coexistence Law because it includes several of their proposals',
      description:
        'Europa Press reports that the student body welcomes the University Coexistence Law including several of their proposals, especially on mediation, harassment and university rights.',
    },
    {
      locale: 'ca',
      title:
        'Els estudiants celebren la Llei de Convivència Universitària perquè recull diverses de les seves propostes',
      description:
        "Europa Press informa que l'estudiantat celebra que la Llei de Convivència Universitària reculli diverses de les seves propostes, especialment en mediació, assetjament i drets universitaris.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek Unibertsitate Bizikidetza Legea ospatzen dute haien proposamen batzuk jasotzen dituelako',
      description:
        'Europa Pressek jakinarazi du ikasleek ospatzen dutela Unibertsitate Bizikidetza Legeak haien hainbat proposamen jasotzea, bereziki bitartekaritzan, jazarpenean eta unibertsitate eskubideetan.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes celebran a Lei de Convivencia Universitaria porque recolle varias das súas propostas',
      description:
        'Europa Press informa de que o estudantado celebra que a Lei de Convivencia Universitaria recolla varias das súas propostas, especialmente en mediación, acoso e dereitos universitarios.',
    },
    {
      locale: 'val',
      title:
        'Els estudiants celebren la Llei de Convivència Universitària perquè arreplega diverses de les seues propostes',
      description:
        "Europa Press informa que l'estudiantat celebra que la Llei de Convivència Universitària arreplegue diverses de les seues propostes, especialment en mediació, assetjament i drets universitaris.",
    },
  ],
  'creup-la-universidad-debe-seguir-avanzando-en-convivencia-2021-09': [
    {
      locale: 'en',
      title: 'CREUP: "The university must keep moving forward on coexistence"',
      description:
        "RTVE gathers CREUP's position on the need for the university to keep moving forward on coexistence, mediation and the protection of rights within the university community.",
    },
    {
      locale: 'ca',
      title: 'CREUP: «La universitat ha de seguir avançant en convivència»',
      description:
        'RTVE recull la posició de CREUP sobre la necessitat que la universitat segueixi avançant en convivència, mediació i protecció de drets dins de la comunitat universitària.',
    },
    {
      locale: 'eu',
      title: 'CREUP: «Unibertsitateak bizikidetzan aurrera egiten jarraitu behar du»',
      description:
        'RTVEk CREUPen jarrera jasotzen du unibertsitateak bizikidetzan, bitartekaritzan eta unibertsitate komunitatearen barneko eskubideen babesean aurrera egiten jarraitu beharraz.',
    },
    {
      locale: 'gl',
      title: 'CREUP: «A universidade debe seguir avanzando en convivencia»',
      description:
        'RTVE recolle a posición de CREUP sobre a necesidade de que a universidade siga avanzando en convivencia, mediación e protección de dereitos dentro da comunidade universitaria.',
    },
    {
      locale: 'val',
      title: 'CREUP: «La universitat ha de continuar avançant en convivència»',
      description:
        'RTVE arreplega la posició de CREUP sobre la necessitat que la universitat continue avançant en convivència, mediació i protecció de drets dins de la comunitat universitària.',
    },
  ],
  'perder-la-beca-podria-suponer-un-doble-castigo-y-la-expulsio-2021-09': [
    {
      locale: 'en',
      title:
        '"Losing your scholarship could mean a double punishment and expulsion from university for economic rather than academic reasons"',
      description:
        "ABC gathers students' criticism that certain penalties could entail the loss of scholarships, which could expel students from university for economic reasons.",
    },
    {
      locale: 'ca',
      title:
        "«Perdre la beca podria suposar un doble càstig i l'expulsió de la universitat per motius econòmics i no acadèmics»",
      description:
        "ABC recull les crítiques estudiantils al fet que determinades sancions puguin implicar la pèrdua de beques, cosa que podria expulsar de la universitat l'alumnat per motius econòmics.",
    },
    {
      locale: 'eu',
      title:
        '«Beka galtzeak zigor bikoitza eta unibertsitatetik kanporatzea ekar lezake, arrazoi ekonomikoengatik eta ez akademikoengatik»',
      description:
        'ABCk ikasleek egindako kritikak jasotzen ditu zenbait zigorrek beken galera ekar dezaketelako, eta horrek ikasleak arrazoi ekonomikoengatik unibertsitatetik kanporatu litzake.',
    },
    {
      locale: 'gl',
      title:
        '«Perder a bolsa podería supoñer un dobre castigo e a expulsión da universidade por motivos económicos e non académicos»',
      description:
        'ABC recolle as críticas estudantís a que determinadas sancións poidan implicar a perda de bolsas, o que podería expulsar da universidade o alumnado por motivos económicos.',
    },
    {
      locale: 'val',
      title:
        "«Perdre la beca podria suposar un doble càstig i l'expulsió de la universitat per motius econòmics i no acadèmics»",
      description:
        "ABC arreplega les crítiques estudiantils al fet que determinades sancions puguen implicar la pèrdua de beques, cosa que podria expulsar de la universitat l'alumnat per motius econòmics.",
    },
  ],
  'lluvia-de-criticas-a-la-ley-castells-por-regresiva-2021-09': [
    {
      locale: 'en',
      title: 'A flood of criticism of the "Castells Law" for being "regressive"',
      description:
        'La Razón gathers criticism of the LOSU draft bill for considering it regressive for student participation, university governance and certain rights of the student body.',
    },
    {
      locale: 'ca',
      title: 'Pluja de crítiques a la «Llei Castells» per «regressiva»',
      description:
        "La Razón recull crítiques a l'avantprojecte de la LOSU per considerar-lo regressiu per a la participació estudiantil, la governança universitària i determinats drets de l'estudiantat.",
    },
    {
      locale: 'eu',
      title: 'Kritika ugari «Castells Legeari» «atzerakoia» izateagatik',
      description:
        'La Razónek LOSUren aurreproiektuari egindako kritikak jasotzen ditu, ikasleen parte-hartzerako, unibertsitate gobernantzarako eta ikasleen zenbait eskubiderako atzerakoitzat jotzen baitu.',
    },
    {
      locale: 'gl',
      title: 'Choiva de críticas á «Lei Castells» por «regresiva»',
      description:
        'La Razón recolle críticas ao anteproxecto da LOSU por consideralo regresivo para a participación estudantil, a gobernanza universitaria e determinados dereitos do estudantado.',
    },
    {
      locale: 'val',
      title: 'Pluja de crítiques a la «Llei Castells» per «regressiva»',
      description:
        "La Razón arreplega crítiques a l'avantprojecte de la LOSU perquè el considera regressiu per a la participació estudiantil, la governança universitària i determinats drets de l'estudiantat.",
    },
  ],
  'estudiantes-y-docentes-rechazan-el-borrador-de-la-nueva-ley-2021-09': [
    {
      locale: 'en',
      title: 'Students and teaching staff reject the draft of the new University Law',
      description:
        'Cadena SER reports the rejection by students and teaching staff of the LOSU draft, especially over the changes to the election of rector and student participation.',
    },
    {
      locale: 'ca',
      title: "Estudiants i docents rebutgen l'esborrany de la nova Llei d'Universitats",
      description:
        "Cadena SER informa del rebuig d'estudiants i docents a l'esborrany de la LOSU, especialment pels canvis en l'elecció del rector i la participació estudiantil.",
    },
    {
      locale: 'eu',
      title: 'Ikasleek eta irakasleek Unibertsitate Lege berriaren zirriborroa baztertzen dute',
      description:
        'Cadena SERek ikasleek eta irakasleek LOSUren zirriborroari egindako ezezkoaren berri ematen du, bereziki errektorea hautatzeko aldaketengatik eta ikasleen parte-hartzeagatik.',
    },
    {
      locale: 'gl',
      title: 'Estudantes e docentes rexeitan o borrador da nova Lei de Universidades',
      description:
        'Cadena SER informa do rexeitamento de estudantes e docentes ao borrador da LOSU, especialmente polos cambios na elección de reitor e a participación estudantil.',
    },
    {
      locale: 'val',
      title: "Estudiants i docents rebutgen l'esborrany de la nova Llei d'Universitats",
      description:
        "Cadena SER informa del rebuig d'estudiants i docents a l'esborrany de la LOSU, especialment pels canvis en l'elecció del rector i en la participació estudiantil.",
    },
  ],
  'universitarios-piden-al-gobierno-un-programa-de-becas-de-la-2021-08': [
    {
      locale: 'en',
      title:
        'University students ask the Government for an EU and national scholarship programme for at-risk students and teaching and research staff',
      description:
        "Europa Press gathers CREUP's request to create European and national scholarships for Afghan students, teaching and research staff (PDI) and academic agents at risk.",
    },
    {
      locale: 'ca',
      title:
        'Els universitaris demanen al Govern un programa de beques de la UE i nacionals per a estudiants i PDI en risc',
      description:
        'Europa Press recull la petició de CREUP de crear beques europees i nacionals per a estudiantat, PDI i agents acadèmics afganesos en situació de risc.',
    },
    {
      locale: 'eu',
      title:
        'Unibertsitarioek Gobernuari EBko eta estatuko beka programa bat eskatzen diote arriskuan dauden ikasleentzat eta PDIarentzat',
      description:
        'Europa Pressek CREUPen eskaera jasotzen du, arriskuan dauden ikasle, PDI eta eragile akademiko afganiarrentzat europar eta estatuko bekak sortzekoa.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios piden ao Goberno un programa de bolsas da UE e nacionais para estudantes e PDI en risco',
      description:
        'Europa Press recolle a petición de CREUP de crear bolsas europeas e nacionais para estudantado, PDI e axentes académicos afgáns en situación de risco.',
    },
    {
      locale: 'val',
      title:
        'Els universitaris demanen al Govern un programa de beques de la UE i nacionals per a estudiants i PDI en risc',
      description:
        'Europa Press arreplega la petició de CREUP de crear beques europees i nacionals per a estudiantat, PDI i agents acadèmics afgans en situació de risc.',
    },
  ],
  'los-profesores-de-universidad-con-contrato-temporal-no-podra-2021-08': [
    {
      locale: 'en',
      title:
        'University lecturers on temporary contracts will not be able to exceed 20% of the workforce, according to the draft bill',
      description:
        'El País examines the draft of the new University Law, which limits temporary employment among teaching staff and introduces changes in governance, funding and academic careers.',
    },
    {
      locale: 'ca',
      title:
        "Els professors d'universitat amb contracte temporal no podran superar el 20% de la plantilla, segons l'avantprojecte de llei",
      description:
        "El País analitza l'avantprojecte de la nova Llei d'Universitats, que limita la temporalitat del professorat i introdueix canvis en governança, finançament i carrera acadèmica.",
    },
    {
      locale: 'eu',
      title:
        'Aldi baterako kontratua duten unibertsitateko irakasleek ezin izango dute plantillaren % 20 gainditu, lege aurreproiektuaren arabera',
      description:
        'El Paísek Unibertsitate Lege berriaren aurreproiektua aztertzen du, irakasleen behin-behinekotasuna mugatzen duena eta gobernantzan, finantzaketan eta ibilbide akademikoan aldaketak sartzen dituena.',
    },
    {
      locale: 'gl',
      title:
        'Os profesores de universidade con contrato temporal non poderán superar o 20% do cadro de persoal, segundo o anteproxecto de lei',
      description:
        'El País analiza o anteproxecto da nova Lei de Universidades, que limita a temporalidade do profesorado e introduce cambios en gobernanza, financiamento e carreira académica.',
    },
    {
      locale: 'val',
      title:
        "Els professors d'universitat amb contracte temporal no podran superar el 20% de la plantilla, segons l'avantprojecte de llei",
      description:
        "El País analitza l'avantprojecte de la nova Llei d'Universitats, que limita la temporalitat del professorat i introduïx canvis en governança, finançament i carrera acadèmica.",
    },
  ],
  'los-universitarios-se-oponen-a-la-nueva-ley-de-universidades-2021-08': [
    {
      locale: 'en',
      title:
        'University students oppose the new University Law: “It will mean a setback for student rights”',
      description:
        "Europa Press reports CREUP's opposition to the draft LOSU, which it considers a setback for student rights and university participation.",
    },
    {
      locale: 'ca',
      title:
        "Els universitaris s'oposen a la nova Llei d'Universitats: «Suposarà un retrocés en els drets estudiantils»",
      description:
        "Europa Press recull l'oposició de CREUP a l'avantprojecte de la LOSU per considerar que suposa un retrocés en drets estudiantils i en participació universitària.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleak Unibertsitateen Lege berriaren aurka daude: «Ikasleen eskubideetan atzerakada bat ekarriko du»',
      description:
        'Europa Pressek CREUPek LOSUren aurreproiektuari egiten dion oposizioa jasotzen du, ikasleen eskubideetan eta unibertsitate-partaidetzan atzerakada bat dakarrela uste duelako.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios opóñense á nova Lei de Universidades: «Suporá un retroceso nos dereitos estudantís»',
      description:
        'Europa Press recolle a oposición de CREUP ao anteproxecto da LOSU por considerar que supón un retroceso en dereitos estudantís e en participación universitaria.',
    },
    {
      locale: 'val',
      title:
        "Els universitaris s'oposen a la nova Llei d'Universitats: «Suposarà un retrocés en els drets estudiantils»",
      description:
        "Europa Press arreplega l'oposició de CREUP a l'avantprojecte de la LOSU per considerar que suposa un retrocés en drets estudiantils i en participació universitària.",
    },
  ],
  'los-rectores-avisan-pedir-el-pasaporte-covid-no-es-competenc-2021-08': [
    {
      locale: 'en',
      title: "Rectors warn: requiring the “covid passport” is not within universities' remit",
      description:
        "Vozpópuli addresses the debate on the possible requirement of the covid passport at university and reports the limits of campuses' powers regarding this measure.",
    },
    {
      locale: 'ca',
      title:
        'Els rectors adverteixen: demanar el «passaport covid» no és competència de les universitats',
      description:
        'Vozpópuli aborda el debat sobre la possible exigència del passaport covid a la universitat i recull les limitacions competèncials dels campus davant aquesta mesura.',
    },
    {
      locale: 'eu',
      title:
        'Errektoreek ohartarazi dute: «covid pasaportea» eskatzea ez da unibertsitateen eskumena',
      description:
        'Vozpópulik unibertsitatean covid pasaportea eskatzeko aukerari buruzko eztabaida jorratzen du, eta neurri honen aurrean campusek dituzten eskumen-mugak jasotzen ditu.',
    },
    {
      locale: 'gl',
      title: 'Os reitores advirten: pedir o «pasaporte covid» non é competencia das universidades',
      description:
        'Vozpópuli aborda o debate sobre a posible esixencia do pasaporte covid na universidade e recolle as limitacións competenciais dos campus ante esta medida.',
    },
    {
      locale: 'val',
      title:
        'Els rectors adverteixen: demanar el «passaport covid» no és competència de les universitats',
      description:
        'Vozpópuli aborda el debat sobre la possible exigència del passaport covid en la universitat i arreplega les limitacions competèncials dels campus davant esta mesura.',
    },
  ],
  'las-becas-del-ministerio-incluiran-reivindicaciones-del-estu-2021-08-2': [
    {
      locale: 'en',
      title:
        "The Ministry's scholarships will include student demands for the 2021/22 academic year",
      description:
        "El Economista reports that the Ministry's scholarships will incorporate student demands, especially regarding disability, inclusion, and fairness in the aid system.",
    },
    {
      locale: 'ca',
      title:
        "Les beques del Ministeri inclouran reivindicacions de l'estudiantat per al curs 2021/22",
      description:
        "El Economista recull que les beques del Ministeri incorporaran reivindicacions de l'estudiantat, especialment en matèria de discapacitat, inclusió i justícia en el sistema d'ajudes.",
    },
    {
      locale: 'eu',
      title: 'Ministerioaren bekek ikasleen aldarrikapenak jasoko dituzte 2021/22 ikasturterako',
      description:
        'El Economistak jasotzen du Ministerioaren bekek ikasleen aldarrikapenak txertatuko dituztela, bereziki desgaitasun, inklusio eta laguntza-sistemaren justizia arloan.',
    },
    {
      locale: 'gl',
      title:
        'As bolsas do Ministerio incluirán reivindicacións do estudantado para o curso 2021/22',
      description:
        'El Economista recolle que as bolsas do Ministerio incorporarán reivindicacións do estudantado, especialmente en materia de discapacidade, inclusión e xustiza no sistema de axudas.',
    },
    {
      locale: 'val',
      title:
        "Les beques del Ministeri inclouran reivindicacions de l'estudiantat per al curs 2021/22",
      description:
        "El Economista arreplega que les beques del Ministeri incorporaran reivindicacions de l'estudiantat, especialment en matèria de discapacitat, inclusió i justícia en el sistema d'ajudes.",
    },
  ],
  'el-rector-angel-pazos-se-reune-con-la-presidenta-de-creup-2021-07': [
    {
      locale: 'en',
      title: 'Rector Ángel Pazos meets the president of CREUP',
      description:
        "The University of Cantabria reports on the meeting between its rector, Ángel Pazos, and the president of CREUP, Andrea Paricio, to address the challenges of Spain's public university.",
    },
    {
      locale: 'ca',
      title: 'El rector Ángel Pazos es reuneix amb la presidenta de CREUP',
      description:
        'La Universitat de Cantabria informa de la reunió entre el seu rector, Ángel Pazos, i la presidenta de CREUP, Andrea Paricio, per abordar reptes de la universitat pública espanyola.',
    },
    {
      locale: 'eu',
      title: 'Ángel Pazos errektorea CREUPeko presidentearekin bildu da',
      description:
        'Kantabriako Unibertsitateak bere errektorea, Ángel Pazos, eta CREUPeko presidentea, Andrea Paricio, bildu izana jakinarazi du, Espainiako unibertsitate publikoaren erronkak jorratzeko.',
    },
    {
      locale: 'gl',
      title: 'O reitor Ángel Pazos reúnese coa presidenta de CREUP',
      description:
        'A Universidade de Cantabria informa da reunión entre o seu reitor, Ángel Pazos, e a presidenta de CREUP, Andrea Paricio, para abordar retos da universidade pública española.',
    },
    {
      locale: 'val',
      title: 'El rector Ángel Pazos es reunix amb la presidenta de CREUP',
      description:
        'La Universitat de Cantabria informa de la reunió entre el seu rector, Ángel Pazos, i la presidenta de CREUP, Andrea Paricio, per a abordar reptes de la universitat pública espanyola.',
    },
  ],
  'la-universidad-de-salamanca-acoge-la-69-asamblea-de-creup-2021-07': [
    {
      locale: 'en',
      title: "The University of Salamanca hosts CREUP's 69th Assembly",
      description:
        "The University of Salamanca hosts CREUP's 69th Assembly, a gathering focused on debating positions on current university affairs, academic internships, and the University Coexistence Law.",
    },
    {
      locale: 'ca',
      title: 'La Universitat de Salamanca acull la 69a Assemblea de CREUP',
      description:
        "La Universitat de Salamanca acull la 69a Assemblea de CREUP, una trobada centrada a debatre posicionaments sobre l'actualitat universitària, les pràctiques acadèmiques i la Llei de Convivència Universitària.",
    },
    {
      locale: 'eu',
      title: 'Salamancako Unibertsitateak CREUPen 69. Batzarra hartuko du',
      description:
        'Salamancako Unibertsitateak CREUPen 69. Batzarra hartzen du, unibertsitateko gaurkotasunari, praktika akademikoei eta Unibertsitateko Bizikidetza Legeari buruzko jarrerak eztabaidatzera bideratutako topaketa.',
    },
    {
      locale: 'gl',
      title: 'A Universidade de Salamanca acolle a 69.ª Asemblea de CREUP',
      description:
        'A Universidade de Salamanca acolle a 69.ª Asemblea de CREUP, un encontro centrado en debater posicionamentos sobre a actualidade universitaria, as prácticas académicas e a Lei de Convivencia Universitaria.',
    },
    {
      locale: 'val',
      title: 'La Universitat de Salamanca acull la 69a Assemblea de CREUP',
      description:
        "La Universitat de Salamanca acull la 69a Assemblea de CREUP, una trobada centrada a debatre posicionaments sobre l'actualitat universitària, les pràctiques acadèmiques i la Llei de Convivència Universitària.",
    },
  ],
  'la-universidad-de-salamanca-acoge-la-69-asamblea-de-represen-2021-07': [
    {
      locale: 'en',
      title:
        'The University of Salamanca hosts the 69th assembly of student representatives from public universities',
      description:
        "The University of Salamanca brings together 88 students from 25 universities at CREUP's 69th Assembly, with reinforced health measures and institutional participation.",
    },
    {
      locale: 'ca',
      title:
        "La Universitat de Salamanca acull la 69a assemblea de representants estudiantils d'universitats públiques",
      description:
        'La Universitat de Salamanca reúneix 88 estudiants de 25 universitats a la 69a Assemblea de CREUP, amb mesures sanitàries reforçades i participació institucional.',
    },
    {
      locale: 'eu',
      title:
        'Salamancako Unibertsitateak unibertsitate publikoetako ikasle ordezkarien 69. batzarra hartuko du',
      description:
        'Salamancako Unibertsitateak 25 unibertsitatetako 88 ikasle bildu ditu CREUPen 69. Batzarrean, osasun-neurri indartuekin eta erakunde-partaidetzarekin.',
    },
    {
      locale: 'gl',
      title:
        'A Universidade de Salamanca acolle a 69.ª asemblea de representantes estudantís de universidades públicas',
      description:
        'A Universidade de Salamanca reúne 88 estudantes de 25 universidades na 69.ª Asemblea de CREUP, con medidas sanitarias reforzadas e participación institucional.',
    },
    {
      locale: 'val',
      title:
        "La Universitat de Salamanca acull la 69a assemblea de representants estudiantils d'universitats públiques",
      description:
        'La Universitat de Salamanca reunix 88 estudiants de 25 universitats en la 69a Assemblea de CREUP, amb mesures sanitàries reforçades i participació institucional.',
    },
  ],
  'campus-rural-para-universitarios-una-inmersion-emocional-aca-2021-07': [
    {
      locale: 'en',
      title: 'Rural Campus for university students: an emotional, academic, and paid immersion',
      description:
        'Magisterio explains the Rural Campus programme, a paid practical-training initiative to bring university students closer to small municipalities.',
    },
    {
      locale: 'ca',
      title: 'Campus Rural per a universitaris: una immersió emocional, acadèmica i pagada',
      description:
        'Magisterio explica el programa Campus Rural, una iniciativa de pràctiques formatives remunerades per acostar els estudiants universitaris a municipis petits.',
    },
    {
      locale: 'eu',
      title: 'Landa Campusa unibertsitarioentzat: murgiltze emozional, akademiko eta ordaindua',
      description:
        'Magisteriok Landa Campus programa azaltzen du, unibertsitateko ikasleak udalerri txikietara hurbiltzeko prestakuntza-praktika ordainduen ekimena.',
    },
    {
      locale: 'gl',
      title: 'Campus Rural para universitarios: unha inmersión emocional, académica e pagada',
      description:
        'Magisterio explica o programa Campus Rural, unha iniciativa de prácticas formativas remuneradas para achegar os estudantes universitarios a municipios pequenos.',
    },
    {
      locale: 'val',
      title: 'Campus Rural per a universitaris: una immersió emocional, acadèmica i pagada',
      description:
        'Magisterio explica el programa Campus Rural, una iniciativa de pràctiques formatives remunerades per a acostar els estudiants universitaris a municipis xicotets.',
    },
  ],
  'crue-impulsa-junto-con-los-ministerios-de-transicion-ecologi-2021-07': [
    {
      locale: 'en',
      title:
        'CRUE, together with the Ministries for the Ecological Transition and Demographic Challenge and for Universities, launches the new Rural Campus Programme',
      description:
        'El Economista reports the launch of the Rural Campus programme, designed to offer university students a paid immersive training experience in rural municipalities.',
    },
    {
      locale: 'ca',
      title:
        "CRUE impulsa, juntament amb els ministeris de Transició Ecològica i Repte Demogràfic i d'Universitats, el nou Programa Campus Rural",
      description:
        "El Economista recull l'impuls del programa Campus Rural, orientat a oferir a l'estudiantat universitari una experiència formativa remunerada d'immersió en municipis rurals.",
    },
    {
      locale: 'eu',
      title:
        'CRUEk Trantsizio Ekologiko eta Erronka Demografikoaren eta Unibertsitateen ministerioekin batera Landa Campus programa berria bultzatzen du',
      description:
        'El Economistak Landa Campus programaren bultzada jasotzen du, unibertsitateko ikasleei landa-udalerrietan murgiltzeko prestakuntza-esperientzia ordaindua eskaintzera bideratua.',
    },
    {
      locale: 'gl',
      title:
        'CRUE impulsa, xunto cos ministerios de Transición Ecolóxica e Reto Demográfico e de Universidades, o novo Programa Campus Rural',
      description:
        'El Economista recolle o impulso do programa Campus Rural, orientado a ofrecer ao estudantado universitario unha experiencia formativa remunerada de inmersión en municipios rurais.',
    },
    {
      locale: 'val',
      title:
        "CRUE impulsa, juntament amb els ministeris de Transició Ecològica i Repte Demogràfic i d'Universitats, el nou Programa Campus Rural",
      description:
        "El Economista arreplega l'impuls del programa Campus Rural, orientat a oferir a l'estudiantat universitari una experiència formativa remunerada d'immersió en municipis rurals.",
    },
  ],
  'la-reforma-universitaria-podria-perjudicar-la-calidad-de-la-2021-06': [
    {
      locale: 'en',
      title: 'The university reform could harm the quality of education',
      description:
        'Éxito Educativo interviews David López Maturén, spokesperson for CREUP, about the assessment of the academic year and the risks the university reform poses to the quality of education.',
    },
    {
      locale: 'ca',
      title: "La reforma universitària podria perjudicar la qualitat de l'ensenyament",
      description:
        "Éxito Educativo entrevista David López Maturén, portaveu de CREUP, sobre el balanç del curs universitari i els riscos de la reforma universitària per a la qualitat de l'ensenyament.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitate-erreformak irakaskuntzaren kalitatea kaltetu lezake',
      description:
        'Éxito Educativok David López Maturén CREUPeko bozeramaileari elkarrizketa egin dio, unibertsitate-ikasturtearen balantzeari eta unibertsitate-erreformak irakaskuntzaren kalitaterako dituen arriskuei buruz.',
    },
    {
      locale: 'gl',
      title: 'A reforma universitaria podería prexudicar a calidade do ensino',
      description:
        'Éxito Educativo entrevista David López Maturén, voceiro de CREUP, sobre o balance do curso universitario e os riscos da reforma universitaria para a calidade do ensino.',
    },
    {
      locale: 'val',
      title: "La reforma universitària podria perjudicar la qualitat de l'ensenyament",
      description:
        "Éxito Educativo entrevista David López Maturén, portaveu de CREUP, sobre el balanç del curs universitari i els riscos de la reforma universitària per a la qualitat de l'ensenyament.",
    },
  ],
  'rectores-y-universitarios-continuaran-trabajando-juntos-por-2021-06': [
    {
      locale: 'en',
      title:
        'Rectors and university students will continue working together for the quality of the university system',
      description:
        'CRUE and CREUP renew their framework cooperation agreement to work together for a social, high-quality, and adequately funded university system.',
    },
    {
      locale: 'ca',
      title:
        'Rectors i universitaris continuaran treballant junts per la qualitat del sistema universitari',
      description:
        'CRUE i CREUP renoven el seu conveni marc de col·laboració per treballar conjuntament per un sistema universitari social, de qualitat i amb finançament suficient.',
    },
    {
      locale: 'eu',
      title:
        'Errektoreek eta unibertsitarioek elkarrekin lanean jarraituko dute unibertsitate-sistemaren kalitatearen alde',
      description:
        'CRUEk eta CREUPek beren lankidetza-hitzarmen markoa berritu dute, unibertsitate-sistema sozial, kalitatezko eta finantzaketa nahikoa duen baten alde elkarrekin lan egiteko.',
    },
    {
      locale: 'gl',
      title:
        'Reitores e universitarios continuarán traballando xuntos pola calidade do sistema universitario',
      description:
        'CRUE e CREUP renovan o seu convenio marco de colaboración para traballar conxuntamente por un sistema universitario social, de calidade e con financiamento suficiente.',
    },
    {
      locale: 'val',
      title:
        'Rectors i universitaris continuaran treballant junts per la qualitat del sistema universitari',
      description:
        'CRUE i CREUP renoven el seu conveni marc de col·laboració per a treballar conjuntament per un sistema universitari social, de qualitat i amb finançament suficient.',
    },
  ],
  'crue-y-creup-renuevan-su-marco-de-colaboracion-2021-06': [
    {
      locale: 'en',
      title: 'CRUE and CREUP renew their cooperation framework',
      description:
        'Cinco Días reports the renewal of the cooperation agreement between CRUE and CREUP to work for a social, high-quality university system.',
    },
    {
      locale: 'ca',
      title: 'CRUE i CREUP renoven el seu marc de col·laboració',
      description:
        'Cinco Días recull la renovació del conveni de col·laboració entre CRUE i CREUP per treballar per un sistema universitari social i de qualitat.',
    },
    {
      locale: 'eu',
      title: 'CRUEk eta CREUPek beren lankidetza-markoa berritu dute',
      description:
        'Cinco Díasek CRUEren eta CREUPen arteko lankidetza-hitzarmenaren berritzea jasotzen du, unibertsitate-sistema sozial eta kalitatezko baten alde lan egiteko.',
    },
    {
      locale: 'gl',
      title: 'CRUE e CREUP renovan o seu marco de colaboración',
      description:
        'Cinco Días recolle a renovación do convenio de colaboración entre CRUE e CREUP para traballar por un sistema universitario social e de calidade.',
    },
    {
      locale: 'val',
      title: 'CRUE i CREUP renoven el seu marc de col·laboració',
      description:
        'Cinco Días arreplega la renovació del conveni de col·laboració entre CRUE i CREUP per a treballar per un sistema universitari social i de qualitat.',
    },
  ],
  'crue-y-creup-renuevan-su-compromiso-para-trabajar-por-la-cal-2021-06': [
    {
      locale: 'en',
      title:
        'CRUE and CREUP renew their commitment to work for the quality of the university system',
      description:
        'Servimedia reports the renewal of the agreement between CRUE and CREUP, focused on education, training, solidarity-based cooperation, and collaboration with public bodies.',
    },
    {
      locale: 'ca',
      title:
        'CRUE i CREUP renoven el seu compromís per treballar per la qualitat del sistema universitari',
      description:
        'Servimedia informa de la renovació del conveni entre CRUE i CREUP, centrat en educació, formació, cooperació solidària i col·laboració amb organismes públics.',
    },
    {
      locale: 'eu',
      title:
        'CRUEk eta CREUPek unibertsitate-sistemaren kalitatearen alde lan egiteko konpromisoa berritu dute',
      description:
        'Servimediak CRUEren eta CREUPen arteko hitzarmenaren berritzea jakinarazten du, hezkuntzan, prestakuntzan, elkartasunezko lankidetzan eta erakunde publikoekiko lankidetzan oinarritua.',
    },
    {
      locale: 'gl',
      title:
        'CRUE e CREUP renovan o seu compromiso para traballar pola calidade do sistema universitario',
      description:
        'Servimedia informa da renovación do convenio entre CRUE e CREUP, centrado en educación, formación, cooperación solidaria e colaboración con organismos públicos.',
    },
    {
      locale: 'val',
      title:
        'CRUE i CREUP renoven el seu compromís per a treballar per la qualitat del sistema universitari',
      description:
        'Servimedia informa de la renovació del conveni entre CRUE i CREUP, centrat en educació, formació, cooperació solidària i col·laboració amb organismes públics.',
    },
  ],
  'creup-y-crue-renuevan-su-compromiso-de-colaboracion-para-la-2021-06-2': [
    {
      locale: 'en',
      title: 'CREUP and CRUE renew their cooperation commitment to improve the university system',
      description:
        'Aula Magna reports the renewal of the framework agreement between CREUP and CRUE to drive joint actions in favour of a social, high-quality university system.',
    },
    {
      locale: 'ca',
      title:
        'CREUP i CRUE renoven el seu compromís de col·laboració per a la millora del sistema universitari',
      description:
        "Aula Magna recull la renovació del conveni marc entre CREUP i CRUE per impulsar actuacions conjuntes en favor d'un sistema universitari social i de qualitat.",
    },
    {
      locale: 'eu',
      title:
        'CREUPek eta CRUEk unibertsitate-sistema hobetzeko lankidetza-konpromisoa berritu dute',
      description:
        'Aula Magnak CREUPen eta CRUEren arteko hitzarmen markoaren berritzea jasotzen du, unibertsitate-sistema sozial eta kalitatezko baten alde ekintza bateratuak bultzatzeko.',
    },
    {
      locale: 'gl',
      title:
        'CREUP e CRUE renovan o seu compromiso de colaboración para a mellora do sistema universitario',
      description:
        'Aula Magna recolle a renovación do convenio marco entre CREUP e CRUE para impulsar actuacións conxuntas en favor dun sistema universitario social e de calidade.',
    },
    {
      locale: 'val',
      title:
        'CREUP i CRUE renoven el seu compromís de col·laboració per a la millora del sistema universitari',
      description:
        "Aula Magna arreplega la renovació del conveni marc entre CREUP i CRUE per a impulsar actuacions conjuntes en favor d'un sistema universitari social i de qualitat.",
    },
  ],
  'estudiantes-y-familiares-protagonizan-el-cuarto-foro-de-deba-2021-06': [
    {
      locale: 'en',
      title:
        'Students and families take centre stage at the fourth debate forum on the new curriculum organised by the Ministry of Education and Vocational Training',
      description:
        'La Moncloa reports on the students and families forum, the fourth event in the “New curriculum for new challenges” series, aimed at reflecting on the curricular reform.',
    },
    {
      locale: 'ca',
      title:
        "Estudiants i familiars protagonitzen el quart fòrum de debat al voltant del nou currículum organitzat pel Ministeri d'Educació i Formació Professional",
      description:
        "La Moncloa informa del fòrum d'estudiants i famílies, quarta trobada del cicle «Nou currículum per a nous reptes», orientat a reflexionar sobre la reforma curricular.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleak eta senideak Hezkuntza eta Lanbide Heziketa Ministerioak antolatutako curriculum berriari buruzko laugarren eztabaida-foroaren protagonista dira',
      description:
        'La Moncloák ikasleen eta familien foroaren berri ematen du, «Curriculum berria erronka berrietarako» zikloko laugarren topaketa, curriculum-erreformari buruz hausnartzera bideratua.',
    },
    {
      locale: 'gl',
      title:
        'Estudantes e familiares protagonizan o cuarto foro de debate arredor do novo currículo organizado polo Ministerio de Educación e Formación Profesional',
      description:
        'La Moncloa informa do foro de estudantes e familias, cuarto encontro do ciclo «Novo currículo para novos desafíos», orientado a reflexionar sobre a reforma curricular.',
    },
    {
      locale: 'val',
      title:
        "Estudiants i familiars protagonitzen el quart fòrum de debat entorn del nou currículum organitzat pel Ministeri d'Educació i Formació Professional",
      description:
        "La Moncloa informa del fòrum d'estudiants i famílies, quarta trobada del cicle «Nou currículum per a nous reptes», orientat a reflexionar sobre la reforma curricular.",
    },
  ],
  'estudiantes-y-familiares-protagonizan-el-cuarto-foro-de-deba-2021-06-2': [
    {
      locale: 'en',
      title:
        'Students and families take centre stage at the fourth debate forum on the new curriculum organised by the Ministry of Education and Vocational Training',
      description:
        "Murcia.com reproduces the Government's information on the students and families forum dedicated to debating the curricular reform within the “New curriculum for new challenges” series.",
    },
    {
      locale: 'ca',
      title:
        "Estudiants i familiars protagonitzen el quart fòrum de debat al voltant del nou currículum organitzat pel Ministeri d'Educació i Formació Professional",
      description:
        "Murcia.com reprodueix la informació del Govern sobre el fòrum d'estudiants i famílies dedicat a debatre la reforma curricular dins del cicle «Nou currículum per a nous reptes».",
    },
    {
      locale: 'eu',
      title:
        'Ikasleak eta senideak Hezkuntza eta Lanbide Heziketa Ministerioak antolatutako curriculum berriari buruzko laugarren eztabaida-foroaren protagonista dira',
      description:
        'Murcia.com-ek Gobernuaren informazioa berregiten du ikasleen eta familien foroari buruz, «Curriculum berria erronka berrietarako» zikloaren barruan curriculum-erreforma eztabaidatzera bideratua.',
    },
    {
      locale: 'gl',
      title:
        'Estudantes e familiares protagonizan o cuarto foro de debate arredor do novo currículo organizado polo Ministerio de Educación e Formación Profesional',
      description:
        'Murcia.com reproduce a información do Goberno sobre o foro de estudantes e familias dedicado a debater a reforma curricular dentro do ciclo «Novo currículo para novos desafíos».',
    },
    {
      locale: 'val',
      title:
        "Estudiants i familiars protagonitzen el quart fòrum de debat entorn del nou currículum organitzat pel Ministeri d'Educació i Formació Professional",
      description:
        "Murcia.com reproduïx la informació del Govern sobre el fòrum d'estudiants i famílies dedicat a debatre la reforma curricular dins del cicle «Nou currículum per a nous reptes».",
    },
  ],
  'argimon-insta-al-gobierno-a-permitir-que-las-mascarillas-dej-2021-06': [
    {
      locale: 'en',
      title: 'Argimon urges the Government to allow masks to stop being mandatory outdoors',
      description:
        'La Vanguardia reports the requests by CREUP and ESN to ease the vaccination of Erasmus students and to cover mandatory PCR or antigen tests.',
    },
    {
      locale: 'ca',
      title:
        "Argimon insta el Govern a permetre que les mascaretes deixin de ser obligatòries a l'exterior",
      description:
        "La Vanguardia recull les peticions de CREUP i ESN per flexibilitzar la vacunació d'estudiants Erasmus i sufragar proves PCR o antígens obligatòries.",
    },
    {
      locale: 'eu',
      title:
        'Argimonek Gobernuari eskatu dio maskarak kanpoaldean nahitaezkoak izateari uztea baimentzeko',
      description:
        'La Vanguardiak CREUPen eta ESNen eskaerak jasotzen ditu, Erasmus ikasleen txertaketa malgutzeko eta nahitaezko PCR edo antigeno probak ordaintzeko.',
    },
    {
      locale: 'gl',
      title:
        'Argimon insta o Goberno a permitir que as máscaras deixen de ser obrigatorias no exterior',
      description:
        'La Vanguardia recolle as peticións de CREUP e ESN para flexibilizar a vacinación de estudantes Erasmus e sufragar probas PCR ou antíxenos obrigatorias.',
    },
    {
      locale: 'val',
      title:
        "Argimon insta el Govern a permetre que les mascaretes deixen de ser obligatòries a l'exterior",
      description:
        "La Vanguardia arreplega les peticions de CREUP i ESN per a flexibilitzar la vacunació d'estudiants Erasmus i sufragar proves PCR o antígens obligatòries.",
    },
  ],
  'la-ebau-una-prueba-desigual-que-puede-pasar-factura-en-el-an-2021-06': [
    {
      locale: 'en',
      title: 'The EBAU, an unequal exam that may take its toll in the year of the pandemic',
      description:
        "Público analyses the inequalities of the EBAU and reports CREUP's position in favour of a common framework of minimum content without imposing a single state-wide exam.",
    },
    {
      locale: 'ca',
      title: "L'EBAU, una prova desigual que pot passar factura en l'any de la pandèmia",
      description:
        "Público analitza les desigualtats de l'EBAU i recull la posició de CREUP a favor d'un marc comú de continguts mínims sense imposar una prova única estatal.",
    },
    {
      locale: 'eu',
      title: 'EBAU, pandemiaren urtean ondorioak ekar ditzakeen proba desorekatua',
      description:
        'Públicok EBAUren desberdintasunak aztertzen ditu eta CREUPen jarrera jasotzen du, gutxieneko edukien esparru komun baten alde, estatu mailako proba bakar bat ezarri gabe.',
    },
    {
      locale: 'gl',
      title: 'A EBAU, unha proba desigual que pode pasar factura no ano da pandemia',
      description:
        'Público analiza as desigualdades da EBAU e recolle a posición de CREUP a favor dun marco común de contidos mínimos sen impor unha proba única estatal.',
    },
    {
      locale: 'val',
      title: "L'EBAU, una prova desigual que pot passar factura en l'any de la pandèmia",
      description:
        "Público analitza les desigualtats de l'EBAU i arreplega la posició de CREUP a favor d'un marc comú de continguts mínims sense imposar una prova única estatal.",
    },
  ],
  'la-universitat-jaume-i-pagara-las-pruebas-pcr-a-los-estudian-2021-06': [
    {
      locale: 'en',
      title:
        'The Universitat Jaume I will pay for PCR tests for Erasmus students in the upcoming 2021-22 academic year',
      description:
        "Castellón Información reports the UJI's decision to cover PCR tests for Erasmus students and links the measure to the demands of CREUP and ESN Spain.",
    },
    {
      locale: 'ca',
      title:
        'La Universitat Jaume I pagarà les proves PCR als estudiants Erasmus el proper curs 2021-22',
      description:
        'Castellón Información informa de la decisió de la UJI de sufragar proves PCR a estudiants Erasmus i relaciona la mesura amb les reivindicacions de CREUP i ESN Espanya.',
    },
    {
      locale: 'eu',
      title:
        'Universitat Jaume I-k Erasmus ikasleei PCR probak ordainduko dizkie datorren 2021-22 ikasturtean',
      description:
        'Castellón Informaciónek UJIren erabakiaren berri ematen du, Erasmus ikasleei PCR probak ordaintzekoa, eta neurria CREUPen eta ESN Espainiaren aldarrikapenekin lotzen du.',
    },
    {
      locale: 'gl',
      title:
        'A Universitat Jaume I pagará as probas PCR aos estudantes Erasmus o vindeiro curso 2021-22',
      description:
        'Castellón Información informa da decisión da UJI de sufragar probas PCR a estudantes Erasmus e relaciona a medida coas reivindicacións de CREUP e ESN España.',
    },
    {
      locale: 'val',
      title:
        'La Universitat Jaume I pagarà les proves PCR als estudiants Erasmus el pròxim curs 2021-22',
      description:
        'Castellón Información informa de la decisió de la UJI de sufragar proves PCR a estudiants Erasmus i relaciona la mesura amb les reivindicacions de CREUP i ESN Espanya.',
    },
  ],
  'la-ley-de-convivencia-deja-fuera-a-las-universidades-privada-2021-06': [
    {
      locale: 'en',
      title: 'The Coexistence Law leaves private universities out',
      description:
        'El Economista analyses the draft University Coexistence Law, a regulation that updates the university disciplinary regime and leaves private universities out.',
    },
    {
      locale: 'ca',
      title: 'La Llei de Convivència deixa fora les universitats privades',
      description:
        "El Economista analitza l'avantprojecte de Llei de Convivència Universitària, una norma que actualitza el règim sancionador universitari i deixa fora les universitats privades.",
    },
    {
      locale: 'eu',
      title: 'Bizikidetza Legeak unibertsitate pribatuak kanpoan uzten ditu',
      description:
        'El Economistak Unibertsitateko Bizikidetza Legearen aurreproiektua aztertzen du, unibertsitateko zigor-erregimena eguneratzen duen eta unibertsitate pribatuak kanpoan uzten dituen araua.',
    },
    {
      locale: 'gl',
      title: 'A Lei de Convivencia deixa fóra as universidades privadas',
      description:
        'El Economista analiza o anteproxecto de Lei de Convivencia Universitaria, unha norma que actualiza o réxime sancionador universitario e deixa fóra as universidades privadas.',
    },
    {
      locale: 'val',
      title: 'La Llei de Convivència deixa fora les universitats privades',
      description:
        "El Economista analitza l'avantprojecte de Llei de Convivència Universitària, una norma que actualitza el règim sancionador universitari i deixa fora les universitats privades.",
    },
  ],
  'fin-a-las-novatadas-las-universidades-expulsaran-a-quienes-p-2021-05': [
    {
      locale: 'en',
      title: 'End to hazing; universities will expel those who take part',
      description:
        'Murcia Economía explains that the future University Coexistence Law provides for penalties for hazing, plagiarism, academic fraud, and other serious conduct within the university sphere.',
    },
    {
      locale: 'ca',
      title: 'Fi a les novatades; les universitats expulsaran qui hi participi',
      description:
        "Murcia Economía explica que la futura Llei de Convivència Universitària preveu sancions per novatades, plagi, frau acadèmic i altres conductes greus dins de l'àmbit universitari.",
    },
    {
      locale: 'eu',
      title: 'Amaiera nobatadei; unibertsitateek parte hartzen dutenak kanporatuko dituzte',
      description:
        'Murcia Economíak azaltzen du etorkizuneko Unibertsitateko Bizikidetza Legeak zigorrak aurreikusten dituela nobatadengatik, plagiogatik, iruzur akademikoagatik eta unibertsitate-eremuko beste jokabide larri batzuengatik.',
    },
    {
      locale: 'gl',
      title: 'Fin ás novatadas; as universidades expulsarán a quen participe',
      description:
        'Murcia Economía explica que a futura Lei de Convivencia Universitaria contempla sancións por novatadas, plaxio, fraude académico e outras condutas graves dentro do ámbito universitario.',
    },
    {
      locale: 'val',
      title: 'Fi a les novatades; les universitats expulsaran qui hi participe',
      description:
        "Murcia Economía explica que la futura Llei de Convivència Universitària preveu sancions per novatades, plagi, frau acadèmic i altres conductes greus dins de l'àmbit universitari.",
    },
  ],
  'la-ley-de-convivencia-universitaria-sancionara-el-plagio-y-l-2021-05': [
    {
      locale: 'en',
      title: 'The University Coexistence Act will penalise plagiarism and hazing',
      description:
        'Cadena SER reports that the draft University Coexistence Act provides for penalties for plagiarism, hazing, falsification of records and other very serious offences.',
    },
    {
      locale: 'ca',
      title: 'La Llei de Convivència Universitària sancionarà el plagi i les novatades',
      description:
        "Cadena SER informa que el projecte de Llei de Convivència Universitària preveu sancions per plagi, novatades, falsificació d'actes i altres faltes molt greus.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitateko Bizikidetza Legeak plagioa eta nobatadak zigortuko ditu',
      description:
        'Cadena SER-ek jakinarazi du Unibertsitateko Bizikidetza Legearen proiektuak plagioa, nobatadak, akten faltsutzea eta beste hutsegite oso larri batzuk zigortzea aurreikusten duela.',
    },
    {
      locale: 'gl',
      title: 'A Lei de Convivencia Universitaria sancionará o plaxio e as novatadas',
      description:
        'Cadena SER informa de que o proxecto de Lei de Convivencia Universitaria prevé sancións por plaxio, novatadas, falsificación de actas e outras faltas moi graves.',
    },
    {
      locale: 'val',
      title: 'La Llei de Convivència Universitària sancionarà el plagi i les novatades',
      description:
        "Cadena SER informa que el projecte de Llei de Convivència Universitària preveu sancions per plagi, novatades, falsificació d'actes i altres infraccions molt greus.",
    },
  ],
  'aragon-pone-en-marcha-en-septiembre-una-plataforma-para-valo-2021-05': [
    {
      locale: 'en',
      title: 'Aragon launches a platform in September to assess "hybrid teaching" at university',
      description:
        "Heraldo reports on an online platform to evaluate hybrid teaching at Aragonese universities and gather students' opinions.",
    },
    {
      locale: 'ca',
      title:
        "Aragó posa en marxa al setembre una plataforma per valorar l'«ensenyament híbrid» a la universitat",
      description:
        "Heraldo informa d'una plataforma en línia per avaluar l'ensenyament híbrid a les universitats aragoneses i recollir l'opinió de l'estudiantat.",
    },
    {
      locale: 'eu',
      title:
        'Aragoik plataforma bat jarriko du martxan irailean unibertsitateko «irakaskuntza hibridoa» baloratzeko',
      description:
        'Heraldo-k Aragoiko unibertsitateetako irakaskuntza hibridoa ebaluatzeko eta ikasleen iritzia jasotzeko lineako plataforma baten berri ematen du.',
    },
    {
      locale: 'gl',
      title:
        'Aragón pon en marcha en setembro unha plataforma para valorar o «ensino híbrido» na universidade',
      description:
        'Heraldo informa dunha plataforma en liña para avaliar o ensino híbrido nas universidades aragonesas e recoller a opinión do estudantado.',
    },
    {
      locale: 'val',
      title:
        "Aragó posa en marxa en setembre una plataforma per a valorar l'«ensenyament híbrid» en la universitat",
      description:
        "Heraldo informa d'una plataforma en línia per a avaluar l'ensenyament híbrid en les universitats aragoneses i arreplegar l'opinió de l'estudiantat.",
    },
  ],
  'la-creup-pide-al-gobierno-que-se-mejoren-las-becas-para-estu-2021-04': [
    {
      locale: 'en',
      title: 'CREUP calls on the Government to improve scholarships for students with disabilities',
      description:
        "GN Diario covers CREUP's proposals to make scholarships fairer and more inclusive, especially for students with disabilities.",
    },
    {
      locale: 'ca',
      title:
        'La CREUP demana al Govern que es millorin les beques per a estudiants amb discapacitat',
      description:
        'GN Diario recull les propostes de CREUP perquè les beques siguin més justes i inclusives, especialment per a estudiants amb discapacitat.',
    },
    {
      locale: 'eu',
      title: 'CREUPek Gobernuari eskatu dio desgaitasuna duten ikasleentzako bekak hobetzeko',
      description:
        'GN Diario-k CREUPen proposamenak jasotzen ditu bekak bidezkoagoak eta inklusiboagoak izan daitezen, bereziki desgaitasuna duten ikasleentzat.',
    },
    {
      locale: 'gl',
      title: 'A CREUP pide ao Goberno que se melloren as bolsas para estudantes con discapacidade',
      description:
        'GN Diario recolle as propostas de CREUP para que as bolsas sexan máis xustas e inclusivas, especialmente para estudantes con discapacidade.',
    },
    {
      locale: 'val',
      title:
        'La CREUP demana al Govern que es milloren les beques per a estudiants amb discapacitat',
      description:
        'GN Diario arreplega les propostes de CREUP perquè les beques siguen més justes i inclusives, especialment per a estudiants amb discapacitat.',
    },
  ],
  'la-reforma-de-las-becas-dobla-en-un-ano-el-numero-de-estudia-2021-04': [
    {
      locale: 'en',
      title:
        'The scholarship reform doubles in one year the number of students who have obtained the maximum aid',
      description:
        "elDiario.es analyses the impact of the scholarship reform and covers CREUP's demands on income thresholds, residence, disability and academic requirements.",
    },
    {
      locale: 'ca',
      title:
        "La reforma de les beques dobla en un any el nombre d'estudiants que han aconseguit els ajuts màxims",
      description:
        "elDiario.es analitza l'impacte de la reforma de beques i recull les demandes de CREUP sobre llindars de renda, residència, discapacitat i requisits acadèmics.",
    },
    {
      locale: 'eu',
      title:
        'Beken erreformak urtebetean bikoiztu du gehieneko laguntzak lortu dituzten ikasleen kopurua',
      description:
        'elDiario.es-ek beken erreformaren eragina aztertzen du eta CREUPen eskaerak jasotzen ditu errenta atalaseei, egoitzari, desgaitasunari eta baldintza akademikoei buruz.',
    },
    {
      locale: 'gl',
      title:
        'A reforma das bolsas dobra nun ano o número de estudantes que conseguiron as axudas máximas',
      description:
        'elDiario.es analiza o impacto da reforma de bolsas e recolle as demandas de CREUP sobre limiares de renda, residencia, discapacidade e requisitos académicos.',
    },
    {
      locale: 'val',
      title:
        "La reforma de les beques dobla en un any el nombre d'estudiants que han aconseguit els ajuts màxims",
      description:
        "elDiario.es analitza l'impacte de la reforma de beques i arreplega les demandes de CREUP sobre llindars de renda, residència, discapacitat i requisits acadèmics.",
    },
  ],
  'el-numero-de-universitarios-con-becas-completas-se-dispara-e-2021-04': [
    {
      locale: 'en',
      title:
        'The number of university students with full scholarships soars in three years: from 90,000 to 215,000',
      description:
        "El País analyses the rise in university students with full scholarships and covers students' concern about the adequacy of the aid budget.",
    },
    {
      locale: 'ca',
      title:
        "El nombre d'universitaris amb beques completes es dispara en tres anys: de 90.000 a 215.000",
      description:
        "El País analitza l'augment d'estudiants universitaris amb beques completes i recull la preocupació de l'estudiantat per la suficiència de la partida d'ajuts.",
    },
    {
      locale: 'eu',
      title:
        'Beka osoak dituzten unibertsitate-ikasleen kopurua hirukoiztu da hiru urtetan: 90.000tik 215.000ra',
      description:
        'El País-ek beka osoak dituzten unibertsitate-ikasleen igoera aztertzen du eta ikasleen kezka jasotzen du laguntza-partidaren nahikotasunari buruz.',
    },
    {
      locale: 'gl',
      title:
        'O número de universitarios con bolsas completas dispárase en tres anos: de 90.000 a 215.000',
      description:
        'El País analiza o aumento de estudantes universitarios con bolsas completas e recolle a preocupación do estudantado pola suficiencia da partida de axudas.',
    },
    {
      locale: 'val',
      title:
        "El nombre d'universitaris amb beques completes es dispara en tres anys: de 90.000 a 215.000",
      description:
        "El País analitza l'augment d'estudiants universitaris amb beques completes i arreplega la preocupació de l'estudiantat per la suficiència de la partida d'ajuts.",
    },
  ],
  'el-gobierno-plantea-bajar-a-un-5-la-nota-para-becar-a-estudi-2021-04': [
    {
      locale: 'en',
      title:
        "The Government proposes lowering to 5 the grade required to grant scholarships to students in qualifying master's degrees",
      description:
        "Europa Press reports that the Government was proposing to lower to 5 the grade required to access scholarships in qualifying master's degrees, while CREUP advocated eliminating the academic requirements for the aid.",
    },
    {
      locale: 'ca',
      title:
        'El Govern planteja abaixar a un 5 la nota per becar estudiants de màsters habilitants',
      description:
        'Europa Press recull que el Govern plantejava reduir a 5 la nota exigida per accedir a beques en màsters habilitants, mentre que CREUP defensava eliminar els requisits acadèmics dels ajuts.',
    },
    {
      locale: 'eu',
      title:
        'Gobernuak 5era jaistea proposatzen du master gaitzaileetako ikasleak bekatzeko eskatutako nota',
      description:
        'Europa Press-ek jaso du Gobernuak master gaitzaileetako beketara sartzeko eskatutako nota 5era jaistea proposatzen zuela, CREUPek laguntzen baldintza akademikoak ezabatzea defendatzen zuen bitartean.',
    },
    {
      locale: 'gl',
      title:
        'O Goberno formula baixar a un 5 a nota para becar estudantes de mestrados habilitantes',
      description:
        'Europa Press recolle que o Goberno formulaba reducir a 5 a nota esixida para acceder a bolsas en mestrados habilitantes, mentres que CREUP defendía eliminar os requisitos académicos das axudas.',
    },
    {
      locale: 'val',
      title:
        'El Govern planteja abaixar a un 5 la nota per a becar estudiants de màsters habilitants',
      description:
        'Europa Press arreplega que el Govern plantejava reduir a 5 la nota exigida per a accedir a beques en màsters habilitants, mentre que CREUP defenia eliminar els requisits acadèmics dels ajuts.',
    },
  ],
  'las-claves-sobre-el-modelo-universitario-32-quien-lo-aprobo-2021-03': [
    {
      locale: 'en',
      title:
        'Key facts about the "3+2" university model: who approved it, what it involves and why it is controversial',
      description:
        '20 Minutos explains the "3+2" university model, its legislative origin, its impact on the structure of bachelor\'s and master\'s degrees and the reasons behind the controversy it has generated.',
    },
    {
      locale: 'ca',
      title:
        'Les claus sobre el model universitari «3+2»: qui el va aprovar, en què consisteix i per què genera polèmica',
      description:
        "20 Minutos explica el model universitari «3+2», el seu origen normatiu, el seu impacte en l'estructura de graus i màsters i els motius de la controvèrsia generada.",
    },
    {
      locale: 'eu',
      title:
        '«3+2» unibertsitate-ereduari buruzko gakoak: nork onartu zuen, zertan datzan eta zergatik sortzen duen eztabaida',
      description:
        '20 Minutos-ek «3+2» unibertsitate-eredua azaltzen du, haren jatorri arautzailea, gradu eta masterren egituran duen eragina eta sortutako eztabaidaren arrazoiak.',
    },
    {
      locale: 'gl',
      title:
        'As claves sobre o modelo universitario «3+2»: quen o aprobou, en que consiste e por que xera polémica',
      description:
        '20 Minutos explica o modelo universitario «3+2», a súa orixe normativa, o seu impacto na estrutura de graos e mestrados e os motivos da controversia xerada.',
    },
    {
      locale: 'val',
      title:
        'Les claus sobre el model universitari «3+2»: qui el va aprovar, en què consistix i per què genera polèmica',
      description:
        "20 Minutos explica el model universitari «3+2», el seu origen normatiu, el seu impacte en l'estructura de graus i màsters i els motius de la controvèrsia generada.",
    },
  ],
  'los-estudiantes-acusan-a-la-universidad-de-exigencias-desmed-2021-01': [
    {
      locale: 'en',
      title:
        'Students accuse the university of "excessive demands" and "inability to adapt to the digital age"',
      description:
        "La Razón reports students' criticism of the conditions for in-person attendance and assessment at university during the pandemic, pointing to a lack of digital adaptation.",
    },
    {
      locale: 'ca',
      title:
        "Els estudiants acusen la universitat d'«exigències desmesurades» i d'«incapacitat per adaptar-se a l'era digital»",
      description:
        "La Razón recull les crítiques de l'estudiantat davant les condicions de presencialitat i avaluació a la universitat durant la pandèmia, assenyalant manca d'adaptació digital.",
    },
    {
      locale: 'eu',
      title:
        'Ikasleek unibertsitatea «gehiegizko eskakizunez» eta «aro digitalera egokitzeko ezgaitasunaz» salatu dute',
      description:
        'La Razón-ek ikasleen kritikak jasotzen ditu pandemian zehar unibertsitateko presentzialtasun eta ebaluazio baldintzen aurrean, egokitzapen digitalik eza nabarmenduz.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes acusan a universidade de «esixencias desmesuradas» e de «incapacidade para adaptarse á era dixital»',
      description:
        'La Razón recolle as críticas do estudantado ante as condicións de presencialidade e avaliación na universidade durante a pandemia, sinalando falta de adaptación dixital.',
    },
    {
      locale: 'val',
      title:
        "Els estudiants acusen la universitat d'«exigències desmesurades» i d'«incapacitat per a adaptar-se a l'era digital»",
      description:
        "La Razón arreplega les crítiques de l'estudiantat davant les condicions de presencialitat i avaluació en la universitat durant la pandèmia, assenyalant falta d'adaptació digital.",
    },
  ],
  'la-presencialidad-en-las-universidades-enfrenta-a-los-univer-2021-01': [
    {
      locale: 'en',
      title: 'In-person attendance at universities divides university students',
      description:
        'Aula Magna addresses the disagreement between student representatives, CRUE and the Ministry of Universities over in-person attendance for exams and academic activity.',
    },
    {
      locale: 'ca',
      title: 'La presencialitat a les universitats enfronta els universitaris',
      description:
        "Aula Magna aborda el desacord entre representants estudiantils, CRUE i el Ministeri d'Universitats sobre la presencialitat en exàmens i activitat acadèmica.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitateetako presentzialtasunak unibertsitate-ikasleak banatzen ditu',
      description:
        'Aula Magna-k ikasleen ordezkarien, CRUEren eta Unibertsitate Ministerioaren arteko desadostasuna jorratzen du azterketetako eta jarduera akademikoko presentzialtasunari buruz.',
    },
    {
      locale: 'gl',
      title: 'A presencialidade nas universidades enfronta os universitarios',
      description:
        'Aula Magna aborda o desacordo entre representantes estudantís, CRUE e o Ministerio de Universidades sobre a presencialidade en exames e actividade académica.',
    },
    {
      locale: 'val',
      title: 'La presencialitat en les universitats enfronta els universitaris',
      description:
        "Aula Magna aborda el desacord entre representants estudiantils, CRUE i el Ministeri d'Universitats sobre la presencialitat en exàmens i activitat acadèmica.",
    },
  ],
  'examenes-presenciales-en-las-universidades-aulas-seguras-pel-2021-01': [
    {
      locale: 'en',
      title: 'In-person exams at universities: safe classrooms, danger at the doors',
      description:
        'El País analyses the debate on in-person exams at university, distinguishing between the safety of classrooms and the risks of crowding at entrances and common areas.',
    },
    {
      locale: 'ca',
      title: 'Exàmens presencials a les universitats: aules segures, perill a les portes',
      description:
        "El País analitza el debat sobre els exàmens presencials a la universitat, distingint entre la seguretat de les aules i els riscos d'aglomeracions en accessos i espais comuns.",
    },
    {
      locale: 'eu',
      title: 'Aurrez aurreko azterketak unibertsitateetan: gela seguruak, arriskua ateetan',
      description:
        'El País-ek unibertsitateko aurrez aurreko azterketei buruzko eztabaida aztertzen du, gelen segurtasuna eta sarbide eta gune komunetako pilaketen arriskuak bereiziz.',
    },
    {
      locale: 'gl',
      title: 'Exames presenciais nas universidades: aulas seguras, perigo nas portas',
      description:
        'El País analiza o debate sobre os exames presenciais na universidade, distinguindo entre a seguridade das aulas e os riscos de aglomeracións en accesos e espazos comúns.',
    },
    {
      locale: 'val',
      title: 'Exàmens presencials en les universitats: aules segures, perill en les portes',
      description:
        "El País analitza el debat sobre els exàmens presencials en la universitat, distingint entre la seguretat de les aules i els riscos d'aglomeracions en accessos i espais comuns.",
    },
  ],
  'son-las-universidades-focos-de-supercontagio-2021-01': [
    {
      locale: 'en',
      title: 'Are universities super-spreading hotspots?',
      description:
        'El País reviews studies on the potential of universities as spaces of contagion and covers the student position in favour of reducing in-person attendance to avoid crowding.',
    },
    {
      locale: 'ca',
      title: 'Són les universitats focus de supercontagi?',
      description:
        'El País revisa estudis sobre el potencial de les universitats com a espais de contagi i recull la posició estudiantil favorable a reduir la presencialitat per evitar aglomeracions.',
    },
    {
      locale: 'eu',
      title: 'Unibertsitateak superkutsatze gune al dira?',
      description:
        'El País-ek unibertsitateek kutsatze-gune gisa duten potentzialari buruzko ikerketak berrikusten ditu eta ikasleen jarrera jasotzen du, pilaketak saihesteko presentzialtasuna murriztearen aldekoa.',
    },
    {
      locale: 'gl',
      title: 'Son as universidades focos de supercontaxio?',
      description:
        'El País revisa estudos sobre o potencial das universidades como espazos de contaxio e recolle a posición estudantil favorable a reducir a presencialidade para evitar aglomeracións.',
    },
    {
      locale: 'val',
      title: 'Són les universitats focus de supercontagi?',
      description:
        'El País revisa estudis sobre el potencial de les universitats com a espais de contagi i arreplega la posició estudiantil favorable a reduir la presencialitat per a evitar aglomeracions.',
    },
  ],
  'el-62-de-los-estudiantes-abandonan-los-grados-online-2020-11': [
    {
      locale: 'en',
      title: '62% of students drop out of "online" degrees',
      description:
        'El Economista reports the high dropout rate in "online" degrees, with a figure notably higher than that recorded at in-person universities.',
    },
    {
      locale: 'ca',
      title: 'El 62% dels estudiants abandonen els graus «online»',
      description:
        "El Economista informa de l'elevat abandonament en els graus «online», amb una taxa notablement superior a la registrada en universitats presencials.",
    },
    {
      locale: 'eu',
      title: 'Ikasleen %62k «online» graduak uzten dituzte',
      description:
        'El Economista-k «online» graduetako abandonu altuaren berri ematen du, aurrez aurreko unibertsitateetan erregistratutakoa baino tasa nabarmen handiagoarekin.',
    },
    {
      locale: 'gl',
      title: 'O 62% dos estudantes abandonan os graos «online»',
      description:
        'El Economista informa do elevado abandono nos graos «online», cunha taxa notablemente superior á rexistrada en universidades presenciais.',
    },
    {
      locale: 'val',
      title: 'El 62% dels estudiants abandonen els graus «online»',
      description:
        "El Economista informa de l'elevat abandó en els graus «online», amb una taxa notablement superior a la registrada en universitats presencials.",
    },
  ],
  'como-afecta-la-modalidad-online-a-los-estudiantes-universita-2020-11': [
    {
      locale: 'en',
      title: 'How does the "online" mode affect university students?',
      description:
        'El Economista addresses the impact of the "online" mode on university students, with special attention to motivation and the academic experience.',
    },
    {
      locale: 'ca',
      title: 'Com afecta la modalitat «online» els estudiants universitaris?',
      description:
        "El Economista aborda l'impacte de la modalitat «online» en l'estudiantat universitari, amb especial atenció a la motivació i l'experiència acadèmica.",
    },
    {
      locale: 'eu',
      title: 'Nola eragiten die «online» moduak unibertsitate-ikasleei?',
      description:
        'El Economista-k «online» moduak unibertsitate-ikasleengan duen eragina jorratzen du, motibazioari eta esperientzia akademikoari arreta berezia jarriz.',
    },
    {
      locale: 'gl',
      title: 'Como afecta a modalidade «online» os estudantes universitarios?',
      description:
        'El Economista aborda o impacto da modalidade «online» no estudantado universitario, con especial atención á motivación e á experiencia académica.',
    },
    {
      locale: 'val',
      title: 'Com afecta la modalitat «online» els estudiants universitaris?',
      description:
        "El Economista aborda l'impacte de la modalitat «online» en l'estudiantat universitari, amb especial atenció a la motivació i a l'experiència acadèmica.",
    },
  ],
  'la-universidad-se-juega-el-desencanto-y-abandono-de-sus-nuev-2020-11': [
    {
      locale: 'en',
      title: 'The university risks the disenchantment and dropout of its new students',
      description:
        'El País analyses the risk of disenchantment and dropout among newly enrolled students in a context shaped by teaching adapted to the pandemic.',
    },
    {
      locale: 'ca',
      title: "La universitat es juga el desencant i l'abandonament dels seus nous alumnes",
      description:
        "El País analitza el risc de desencant i abandonament entre l'alumnat de nou ingrés en un context marcat per la docència adaptada a la pandèmia.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitateak bere ikasle berrien desilusioa eta abandonua jokoan ditu',
      description:
        'El País-ek sarrera berriko ikasleen artean desilusio eta abandonu arriskua aztertzen du pandemiara egokitutako irakaskuntzak markatutako testuinguruan.',
    },
    {
      locale: 'gl',
      title: 'A universidade xógase o desencanto e abandono dos seus novos alumnos',
      description:
        'El País analiza o risco de desencanto e abandono entre o alumnado de novo ingreso nun contexto marcado pola docencia adaptada á pandemia.',
    },
    {
      locale: 'val',
      title: "La universitat es juga el desencant i l'abandó dels seus nous alumnes",
      description:
        "El País analitza el risc de desencant i abandó entre l'alumnat de nou ingrés en un context marcat per la docència adaptada a la pandèmia.",
    },
  ],
  'no-es-cuestion-de-edad-sino-de-responsabilidad-fernando-simo-2020-10': [
    {
      locale: 'en',
      title:
        '"It is not a question of age, but of responsibility", Fernando Simón at the conference on young people and the health crisis',
      description:
        'UNED reports on a conference on young people and the health crisis that addressed responsibility, youth participation and the social effects of the pandemic.',
    },
    {
      locale: 'ca',
      title:
        "«No és qüestió d'edat, sinó de responsabilitat», Fernando Simón a la jornada de recerca sobre joves i crisi sanitària",
      description:
        "La UNED informa d'una jornada sobre joves i crisi sanitària en què es van abordar la responsabilitat, la participació juvenil i els efectes socials de la pandèmia.",
    },
    {
      locale: 'eu',
      title:
        '«Ez da adin kontua, erantzukizun kontua baizik», Fernando Simón gazteei eta osasun krisiari buruzko ikerketa jardunaldian',
      description:
        'UNEDek gazteei eta osasun krisiari buruzko jardunaldi baten berri ematen du, non erantzukizuna, gazteen parte-hartzea eta pandemiaren ondorio sozialak jorratu ziren.',
    },
    {
      locale: 'gl',
      title:
        '«Non é cuestión de idade, senón de responsabilidade», Fernando Simón na xornada de investigación sobre mozos e crise sanitaria',
      description:
        'A UNED informa dunha xornada sobre mozos e crise sanitaria na que se abordaron a responsabilidade, a participación xuvenil e os efectos sociais da pandemia.',
    },
    {
      locale: 'val',
      title:
        "«No és qüestió d'edat, sinó de responsabilitat», Fernando Simón en la jornada d'investigació sobre joves i crisi sanitària",
      description:
        "La UNED informa d'una jornada sobre joves i crisi sanitària en què es van abordar la responsabilitat, la participació juvenil i els efectes socials de la pandèmia.",
    },
  ],
  'los-retos-de-la-universidad-ante-la-segunda-ola-de-la-pandem-2020-10': [
    {
      locale: 'en',
      title: 'The challenges facing the university in the second wave of the pandemic',
      description:
        'Educaweb examines the challenges facing universities in the second wave of the pandemic, including in-person attendance, hybrid teaching, safety and academic adaptation.',
    },
    {
      locale: 'ca',
      title: 'Els reptes de la universitat davant la segona onada de la pandèmia',
      description:
        'Educaweb examina els reptes universitaris davant la segona onada de la pandèmia, incloent-hi presencialitat, docència híbrida, seguretat i adaptació acadèmica.',
    },
    {
      locale: 'eu',
      title: 'Unibertsitatearen erronkak pandemiaren bigarren olatuaren aurrean',
      description:
        'Educaweb-ek unibertsitate-erronkak aztertzen ditu pandemiaren bigarren olatuaren aurrean, presentzialtasuna, irakaskuntza hibridoa, segurtasuna eta egokitzapen akademikoa barne.',
    },
    {
      locale: 'gl',
      title: 'Os retos da universidade ante a segunda onda da pandemia',
      description:
        'Educaweb examina os retos universitarios ante a segunda onda da pandemia, incluíndo presencialidade, docencia híbrida, seguridade e adaptación académica.',
    },
    {
      locale: 'val',
      title: 'Els reptes de la universitat davant de la segona onada de la pandèmia',
      description:
        'Educaweb examina els reptes universitaris davant de la segona onada de la pandèmia, incloent-hi presencialitat, docència híbrida, seguretat i adaptació acadèmica.',
    },
  ],
  'la-acpua-se-reune-con-representantes-de-estudiantes-de-la-uz-2020-10': [
    {
      locale: 'en',
      title:
        'ACPUA meets with student representatives from UZ and across the country to discuss quality',
      description:
        'ACPUA reports on its meetings with student representatives from the University of Zaragoza and CREUP to address training, assessment and student participation in university quality.',
    },
    {
      locale: 'ca',
      title:
        "L'ACPUA es reuneix amb representants d'estudiants de la UZ i de tot l'Estat per parlar de qualitat",
      description:
        'ACPUA informa de les seves reunions amb representants estudiantils de la Universitat de Saragossa i CREUP per tractar formació, avaluació i participació estudiantil en qualitat universitària.',
    },
    {
      locale: 'eu',
      title: 'ACPUA UZko eta Estatu osoko ikasle ordezkariekin bildu da kalitateaz hitz egiteko',
      description:
        'ACPUA-k Zaragozako Unibertsitateko eta CREUPeko ikasle ordezkariekin egindako bilketen berri ematen du, prestakuntza, ebaluazioa eta ikasleen parte-hartzea unibertsitate-kalitatean jorratzeko.',
    },
    {
      locale: 'gl',
      title:
        'A ACPUA reúnese con representantes de estudantes da UZ e de todo o Estado para falar de calidade',
      description:
        'ACPUA informa das súas reunións con representantes estudantís da Universidade de Zaragoza e CREUP para tratar formación, avaliación e participación estudantil en calidade universitaria.',
    },
    {
      locale: 'val',
      title:
        "L'ACPUA es reunix amb representants d'estudiants de la UZ i de tot l'Estat per a parlar de qualitat",
      description:
        'ACPUA informa de les seues reunions amb representants estudiantils de la Universitat de Saragossa i CREUP per a tractar formació, avaluació i participació estudiantil en qualitat universitària.',
    },
  ],
  'la-segunda-ola-interrumpe-las-clases-presenciales-de-300000-2020-10': [
    {
      locale: 'en',
      title: 'The second wave interrupts in-person classes for 300,000 university students',
      description:
        "El País reports the temporary closure of campuses in Catalonia, Valencia and Granada, and covers CREUP's concern about the quality of teaching and the digital divide.",
    },
    {
      locale: 'ca',
      title: 'La segona onada interromp les classes presencials de 300.000 universitaris',
      description:
        'El País informa del tancament temporal de campus a Catalunya, València i Granada, i recull la preocupació de CREUP per la qualitat de la docència i la bretxa digital.',
    },
    {
      locale: 'eu',
      title: 'Bigarren olatuak 300.000 unibertsitate-ikasleren aurrez aurreko klaseak eten ditu',
      description:
        'El País-ek Kataluniako, Valentziako eta Granadako campusen aldi baterako itxieraren berri ematen du, eta CREUPen kezka jasotzen du irakaskuntzaren kalitateari eta eten digitalari buruz.',
    },
    {
      locale: 'gl',
      title: 'A segunda onda interrompe as clases presenciais de 300.000 universitarios',
      description:
        'El País informa do peche temporal de campus en Cataluña, Valencia e Granada, e recolle a preocupación de CREUP pola calidade da docencia e a fenda dixital.',
    },
    {
      locale: 'val',
      title: 'La segona onada interromp les classes presencials de 300.000 universitaris',
      description:
        'El País informa del tancament temporal de campus a Catalunya, València i Granada, i arreplega la preocupació de CREUP per la qualitat de la docència i la bretxa digital.',
    },
  ],
  'unas-jornadas-analizaran-la-situacion-actual-de-los-jovenes-2020-10': [
    {
      locale: 'en',
      title:
        'A conference will analyse the current situation of young people from Murcia after the pandemic',
      description:
        'Murcia.com reports on a conference dedicated to analysing the situation of young people from Murcia after the pandemic and its social, educational and economic effects.',
    },
    {
      locale: 'ca',
      title:
        'Unes jornades analitzaran la situació actual dels joves murcians després de la pandèmia',
      description:
        "Murcia.com informa d'unes jornades dedicades a analitzar la situació de la joventut murciana després de la pandèmia i els seus efectes socials, educatius i econòmics.",
    },
    {
      locale: 'eu',
      title:
        'Jardunaldi batzuek Murtziako gazteen egungo egoera aztertuko dute pandemiaren ondoren',
      description:
        'Murcia.com-ek Murtziako gazteriaren egoera pandemiaren ondoren eta haren ondorio sozial, hezkuntzako eta ekonomikoak aztertzeko jardunaldi batzuen berri ematen du.',
    },
    {
      locale: 'gl',
      title: 'Unhas xornadas analizarán a situación actual dos mozos murcianos tras a pandemia',
      description:
        'Murcia.com informa dunhas xornadas dedicadas a analizar a situación da mocidade murciana tras a pandemia e os seus efectos sociais, educativos e económicos.',
    },
    {
      locale: 'val',
      title:
        'Unes jornades analitzaran la situació actual dels joves murcians després de la pandèmia',
      description:
        "Murcia.com informa d'unes jornades dedicades a analitzar la situació de la joventut murciana després de la pandèmia i els seus efectes socials, educatius i econòmics.",
    },
  ],
  'la-universidad-dice-adios-al-siglo-xx-2020-09': [
    {
      locale: 'en',
      title: 'The university says goodbye to the 20th century',
      description:
        'El País Semanal addresses the transformation of the university after the pandemic and the debate on digitalisation, teaching and the adaptation of the university system.',
    },
    {
      locale: 'ca',
      title: 'La universitat diu adéu al segle XX',
      description:
        'El País Semanal aborda la transformació de la universitat després de la pandèmia i el debat sobre digitalització, docència i adaptació del sistema universitari.',
    },
    {
      locale: 'eu',
      title: 'Unibertsitateak agur esaten dio XX. mendeari',
      description:
        'El País Semanal-ek pandemiaren ondorengo unibertsitatearen eraldaketa jorratzen du, baita digitalizazioari, irakaskuntzari eta unibertsitate-sistemaren egokitzapenari buruzko eztabaida ere.',
    },
    {
      locale: 'gl',
      title: 'A universidade dille adeus ao século XX',
      description:
        'El País Semanal aborda a transformación da universidade tras a pandemia e o debate sobre dixitalización, docencia e adaptación do sistema universitario.',
    },
    {
      locale: 'val',
      title: "La universitat s'acomiada del segle XX",
      description:
        "El País Semanal aborda la transformació de la universitat després de la pandèmia i el debat sobre la digitalització, la docència i l'adaptació del sistema universitari.",
    },
  ],
  'el-ceem-se-integra-en-el-maximo-organo-de-representacion-uni-2020-09': [
    {
      locale: 'en',
      title: 'The CEEM joins the highest body of university representation',
      description:
        'Redacción Médica reports on the agreement under which the State Council of Medical Students joins CREUP to coordinate the demands of medical students.',
    },
    {
      locale: 'ca',
      title: "El CEEM s'integra en el màxim òrgan de representació universitària",
      description:
        "Redacción Médica informa del conveni pel qual el Consell Estatal d'Estudiants de Medicina s'integra en CREUP per coordinar les reivindicacions de l'estudiantat de Medicina.",
    },
    {
      locale: 'eu',
      title: 'CEEM unibertsitate-ordezkaritzako organo gorenean sartzen da',
      description:
        'Redacción Médicak Medikuntzako Ikasleen Estatu Kontseilua CREUPen sartzeko hitzarmenaren berri ematen du, Medikuntzako ikasleen aldarrikapenak koordinatzeko.',
    },
    {
      locale: 'gl',
      title: 'O CEEM intégrase no máximo órgano de representación universitaria',
      description:
        'Redacción Médica informa do convenio polo que o Consello Estatal de Estudantes de Medicina se integra en CREUP para coordinar as reivindicacións do estudantado de Medicina.',
    },
    {
      locale: 'val',
      title: "El CEEM s'integra en el màxim òrgan de representació universitària",
      description:
        "Redacción Médica informa del conveni pel qual el Consell Estatal d'Estudiants de Medicina s'integra en CREUP per a coordinar les reivindicacions de l'estudiantat de Medicina.",
    },
  ],
  'estudiantes-de-universidades-publicas-piden-un-nuevo-modelo-2020-09': [
    {
      locale: 'en',
      title:
        'Public university students call for a new scholarship model and a say in the Teaching Staff Statute',
      description:
        "Europa Press gathers CREUP's demands to move towards a new scholarship model and to take part in the future Statute of Teaching and Research Staff.",
    },
    {
      locale: 'ca',
      title:
        "Estudiants d'universitats públiques demanen un nou model de beques i participar en l'Estatut del Personal Docent",
      description:
        'Europa Press recull les demandes de CREUP per avançar cap a un nou model de beques i participar en el futur Estatut del Personal Docent i Investigador.',
    },
    {
      locale: 'eu',
      title:
        'Unibertsitate publikoetako ikasleek beka-eredu berria eta Irakasleen Estatutuan parte hartzea eskatzen dute',
      description:
        'Europa Pressek CREUPen eskaerak biltzen ditu, beka-eredu berri baterantz aurrera egiteko eta etorkizuneko Irakasle eta Ikertzaileen Estatutuan parte hartzeko.',
    },
    {
      locale: 'gl',
      title:
        'Estudantes de universidades públicas piden un novo modelo de bolsas e participar no Estatuto do Persoal Docente',
      description:
        'Europa Press recolle as demandas de CREUP para avanzar cara a un novo modelo de bolsas e participar no futuro Estatuto do Persoal Docente e Investigador.',
    },
    {
      locale: 'val',
      title:
        "Estudiants d'universitats públiques demanen un nou model de beques i participar en l'Estatut del Personal Docent",
      description:
        'Europa Press arreplega les demandes de CREUP per a avançar cap a un nou model de beques i participar en el futur Estatut del Personal Docent i Investigador.',
    },
  ],
  'creup-se-reune-con-los-grupos-parlamentarios-durante-el-inic-2020-09-2': [
    {
      locale: 'en',
      title: 'CREUP meets with parliamentary groups at the start of the academic year',
      description:
        "Aula Magna reports on CREUP's meetings with parliamentary groups to convey its priorities at the start of the university academic year.",
    },
    {
      locale: 'ca',
      title: "CREUP es reuneix amb els grups parlamentaris durant l'inici de curs",
      description:
        'Aula Magna informa de les reunions de CREUP amb grups parlamentaris per traslladar les seves prioritats al començament del curs universitari.',
    },
    {
      locale: 'eu',
      title: 'CREUP talde parlamentarioekin biltzen da ikasturte-hasieran',
      description:
        'Aula Magnak CREUPek talde parlamentarioekin egindako bileren berri ematen du, ikasturte-hasieran bere lehentasunak helarazteko.',
    },
    {
      locale: 'gl',
      title: 'CREUP reúnese cos grupos parlamentarios durante o inicio de curso',
      description:
        'Aula Magna informa das reunións de CREUP con grupos parlamentarios para trasladar as súas prioridades ao comezo do curso universitario.',
    },
    {
      locale: 'val',
      title: "CREUP es reunix amb els grups parlamentaris durant l'inici de curs",
      description:
        'Aula Magna informa de les reunions de CREUP amb grups parlamentaris per a traslladar les seues prioritats al començament del curs universitari.',
    },
  ],
  'las-donaciones-privadas-a-la-universidad-publica-la-polemica-2020-09': [
    {
      locale: 'en',
      title:
        'Private donations to the public university: the controversial and underused route Minister Castells is pointing to',
      description:
        "elDiario.es analyses private funding of the public university and gathers students' caution that it should not replace sufficient public funding.",
    },
    {
      locale: 'ca',
      title:
        'Les donacions privades a la universitat pública: la polèmica i poc explotada via cap a la qual apunta el ministre Castells',
      description:
        "elDiario.es analitza el finançament privat de la universitat pública i recull les cauteles de l'estudiantat perquè no substitueixi un finançament públic suficient.",
    },
    {
      locale: 'eu',
      title:
        'Dohaintza pribatuak unibertsitate publikora: Castells ministroak seinalatzen duen bide polemiko eta gutxi ustiatua',
      description:
        'elDiario.esek unibertsitate publikoaren finantzaketa pribatua aztertzen du eta ikasleen zuhurtziak biltzen ditu, finantzaketa publiko nahikoa ordezka ez dezan.',
    },
    {
      locale: 'gl',
      title:
        'As doazóns privadas á universidade pública: a polémica e pouco explotada vía á que apunta o ministro Castells',
      description:
        'elDiario.es analiza o financiamento privado da universidade pública e recolle as cautelas do estudantado para que non substitúa un financiamento público suficiente.',
    },
    {
      locale: 'val',
      title:
        'Les donacions privades a la universitat pública: la polèmica i poc explotada via cap a la qual apunta el ministre Castells',
      description:
        "elDiario.es analitza el finançament privat de la universitat pública i arreplega les cauteles de l'estudiantat perquè no substituïsca un finançament públic suficient.",
    },
  ],
  'manuel-castells-el-ministro-mas-imprevisible-ante-el-curso-u-2020-09': [
    {
      locale: 'en',
      title: 'Manuel Castells, the most unpredictable minister facing the toughest academic year',
      description:
        "elDiario.es profiles Manuel Castells' management ahead of a university academic year marked by health uncertainty, in-person teaching and teaching adaptation.",
    },
    {
      locale: 'ca',
      title:
        'Manuel Castells, el ministre més imprevisible davant el curs universitari més difícil',
      description:
        "elDiario.es perfila la gestió de Manuel Castells davant un curs universitari marcat per la incertesa sanitària, la presencialitat i l'adaptació docent.",
    },
    {
      locale: 'eu',
      title: 'Manuel Castells, ministro ezustekoena unibertsitate-ikasturte zailenaren aurrean',
      description:
        'elDiario.esek Manuel Castellsen kudeaketa zirriborratzen du, ziurgabetasun sanitarioak, presentzialtasunak eta irakaskuntzaren egokitzapenak markatutako unibertsitate-ikasturte baten aurrean.',
    },
    {
      locale: 'gl',
      title:
        'Manuel Castells, o ministro máis imprevisible ante o curso universitario máis difícil',
      description:
        'elDiario.es perfila a xestión de Manuel Castells ante un curso universitario marcado pola incerteza sanitaria, a presencialidade e a adaptación docente.',
    },
    {
      locale: 'val',
      title:
        'Manuel Castells, el ministre més imprevisible davant el curs universitari més difícil',
      description:
        "elDiario.es perfila la gestió de Manuel Castells davant un curs universitari marcat per la incertesa sanitària, la presencialitat i l'adaptació docent.",
    },
  ],
  'la-universitat-de-valencia-acoge-el-encuentro-de-creup-2020-09': [
    {
      locale: 'en',
      title: 'The Universitat de València hosts the CREUP meeting',
      description:
        "The Universitat de València reports on the meeting of CREUP's extended executive committee to prepare proposals for the start of the university academic year during the pandemic.",
    },
    {
      locale: 'ca',
      title: 'La Universitat de València acull la trobada de CREUP',
      description:
        "La Universitat de València informa de la reunió de la comissió executiva ampliada de CREUP per preparar propostes davant l'inici del curs universitari durant la pandèmia.",
    },
    {
      locale: 'eu',
      title: 'Universitat de Valènciak CREUPen topaketa hartzen du',
      description:
        'Universitat de Valènciak CREUPen batzorde betearazle zabalduaren bileraren berri ematen du, pandemia garaian unibertsitate-ikasturtearen hasierari begira proposamenak prestatzeko.',
    },
    {
      locale: 'gl',
      title: 'A Universitat de València acolle o encontro de CREUP',
      description:
        'A Universitat de València informa da reunión da comisión executiva ampliada de CREUP para preparar propostas ante o inicio do curso universitario durante a pandemia.',
    },
    {
      locale: 'val',
      title: 'La Universitat de València acull la trobada de CREUP',
      description:
        "La Universitat de València informa de la reunió de la comissió executiva ampliada de CREUP per a preparar propostes davant l'inici del curs universitari durant la pandèmia.",
    },
  ],
  'los-protocolos-universitarios-se-olvidan-de-las-residencias-2020-09': [
    {
      locale: 'en',
      title: 'University protocols "overlook" halls of residence and residential colleges',
      description:
        'Vozpópuli reports on the lack of specific protocols for halls of residence and residential colleges at the start of the university academic year during the pandemic.',
    },
    {
      locale: 'ca',
      title: "Els protocols universitaris s'«obliden» de les residències i col·legis majors",
      description:
        "Vozpópuli informa de l'absència de protocols específics per a residències i col·legis majors a l'inici del curs universitari durant la pandèmia.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitate-protokoloek egoitzak eta ikastetxe nagusiak «ahazten» dituzte',
      description:
        'Vozpópulik egoitzentzat eta ikastetxe nagusientzat protokolo espezifikorik ez dagoela jakinarazten du, pandemia garaian unibertsitate-ikasturtearen hasieran.',
    },
    {
      locale: 'gl',
      title: 'Os protocolos universitarios «esquécense» das residencias e colexios maiores',
      description:
        'Vozpópuli informa da ausencia de protocolos específicos para residencias e colexios maiores no inicio do curso universitario durante a pandemia.',
    },
    {
      locale: 'val',
      title: "Els protocols universitaris s'«obliden» de les residències i col·legis majors",
      description:
        "Vozpópuli informa de l'absència de protocols específics per a residències i col·legis majors en l'inici del curs universitari durant la pandèmia.",
    },
  ],
  'los-universitarios-llevaran-mascarilla-obligatoria-dentro-y-2020-09': [
    {
      locale: 'en',
      title: 'University students will have to wear masks both inside and outside the classroom',
      description:
        'La Vanguardia reports on the measures agreed for the university academic year, including the compulsory use of masks both inside and outside the classroom.',
    },
    {
      locale: 'ca',
      title: "Els universitaris portaran mascareta obligatòria dins i fora de l'aula",
      description:
        "La Vanguardia recull les mesures acordades per al curs universitari, inclosa la mascareta obligatòria dins i fora de l'aula.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek maskara nahitaez eramango dute ikasgelaren barruan eta kanpoan',
      description:
        'La Vanguardiak unibertsitate-ikasturterako adostutako neurriak biltzen ditu, ikasgelaren barruan eta kanpoan maskara nahitaezkoa izatea barne.',
    },
    {
      locale: 'gl',
      title: 'Os universitarios levarán máscara obrigatoria dentro e fóra da aula',
      description:
        'La Vanguardia recolle as medidas acordadas para o curso universitario, incluída a máscara obrigatoria dentro e fóra da aula.',
    },
    {
      locale: 'val',
      title: "Els universitaris portaran mascareta obligatòria dins i fora de l'aula",
      description:
        "La Vanguardia arreplega les mesures acordades per al curs universitari, inclosa la mascareta obligatòria dins i fora de l'aula.",
    },
  ],
  'manuel-castells-el-ministro-fuera-de-combate-2020-09': [
    {
      locale: 'en',
      title: 'Manuel Castells, the minister out of action',
      description:
        "El País analyses Manuel Castells' role at the start of the university academic year and the criticism of his management amid high uncertainty.",
    },
    {
      locale: 'ca',
      title: 'Manuel Castells, el ministre fora de combat',
      description:
        "El País analitza el paper de Manuel Castells davant l'inici del curs universitari i les crítiques per la seva gestió en un context d'elevada incertesa.",
    },
    {
      locale: 'eu',
      title: 'Manuel Castells, borrokatik kanpo geratu den ministroa',
      description:
        'El Paísek Manuel Castellsen papera aztertzen du unibertsitate-ikasturtearen hasieraren aurrean, baita haren kudeaketagatiko kritikak ere, ziurgabetasun handiko testuinguru batean.',
    },
    {
      locale: 'gl',
      title: 'Manuel Castells, o ministro fóra de combate',
      description:
        'El País analiza o papel de Manuel Castells ante o inicio do curso universitario e as críticas pola súa xestión nun contexto de elevada incerteza.',
    },
    {
      locale: 'val',
      title: 'Manuel Castells, el ministre fora de combat',
      description:
        "El País analitza el paper de Manuel Castells davant l'inici del curs universitari i les crítiques per la seua gestió en un context d'elevada incertesa.",
    },
  ],
  'creup-lanza-sus-demandas-para-el-nuevo-curso-academico-2020-08': [
    {
      locale: 'en',
      title: 'CREUP launches its demands for the new academic year',
      description:
        "Aula Magna gathers CREUP's demands for the 2020/2021 academic year, focused on safety protocols, continuous assessment, universal accessibility and guarantees of teaching quality.",
    },
    {
      locale: 'ca',
      title: 'CREUP llança les seves demandes per al nou curs acadèmic',
      description:
        'Aula Magna recull les demandes de CREUP per al curs 2020/2021, centrades en protocols de seguretat, avaluació contínua, accessibilitat universal i garanties de qualitat docent.',
    },
    {
      locale: 'eu',
      title: 'CREUPek bere eskaerak aurkezten ditu ikasturte berrirako',
      description:
        'Aula Magnak CREUPen eskaerak biltzen ditu 2020/2021 ikasturterako, segurtasun-protokoloetan, etengabeko ebaluazioan, irisgarritasun unibertsalean eta irakaskuntza-kalitatearen bermeetan oinarrituak.',
    },
    {
      locale: 'gl',
      title: 'CREUP lanza as súas demandas para o novo curso académico',
      description:
        'Aula Magna recolle as demandas de CREUP para o curso 2020/2021, centradas en protocolos de seguridade, avaliación continua, accesibilidade universal e garantías de calidade docente.',
    },
    {
      locale: 'val',
      title: 'CREUP llança les seues demandes per al nou curs acadèmic',
      description:
        'Aula Magna arreplega les demandes de CREUP per al curs 2020/2021, centrades en protocols de seguretat, avaluació contínua, accessibilitat universal i garanties de qualitat docent.',
    },
  ],
  'universitarios-piden-priorizar-la-evaluacion-continua-y-gara-2020-08': [
    {
      locale: 'en',
      title:
        'University students call for prioritising continuous assessment and guaranteeing access to materials',
      description:
        "Qué! reports on CREUP's proposals for the start of the academic year, including prioritising continuous assessment and guaranteeing students' access to the materials of each subject.",
    },
    {
      locale: 'ca',
      title:
        "Universitaris demanen prioritzar l'avaluació contínua i garantir l'accés als materials",
      description:
        "Qué! informa de les propostes de CREUP per a l'inici del curs, entre elles prioritzar l'avaluació contínua i garantir l'accés de l'estudiantat als materials de cada assignatura.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek etengabeko ebaluazioari lehentasuna ematea eta materialetarako sarbidea bermatzea eskatzen dute',
      description:
        'Qué!-k CREUPen proposamenen berri ematen du ikasturtearen hasierarako, besteak beste etengabeko ebaluazioari lehentasuna ematea eta ikasleek irakasgai bakoitzeko materialetarako sarbidea bermatzea.',
    },
    {
      locale: 'gl',
      title:
        'Universitarios piden priorizar a avaliación continua e garantir o acceso aos materiais',
      description:
        'Qué! informa das propostas de CREUP para o inicio do curso, entre elas priorizar a avaliación continua e garantir o acceso do estudantado aos materiais de cada materia.',
    },
    {
      locale: 'val',
      title:
        "Universitaris demanen prioritzar l'avaluació contínua i garantir l'accés als materials",
      description:
        "Qué! informa de les propostes de CREUP per a l'inici del curs, entre elles prioritzar l'avaluació contínua i garantir l'accés de l'estudiantat als materials de cada assignatura.",
    },
  ],
  'estudiantes-universitarios-piden-que-se-priorice-la-evaluaci-2020-08': [
    {
      locale: 'en',
      title:
        'University students call for continuous assessment to be prioritised and access to materials guaranteed',
      description:
        'Lanza Digital reports that CREUP calls for continuous assessment, permanent access to materials, alternatives for placements and final projects, and measures to reduce socio-economic gaps.',
    },
    {
      locale: 'ca',
      title:
        "Estudiants universitaris demanen que es prioritzi l'avaluació contínua i es garanteixi l'accés als materials",
      description:
        'Lanza Digital recull que CREUP demana avaluació contínua, accés permanent als materials, alternatives per a les pràctiques i treballs finals i mesures per reduir les bretxes socioeconòmiques.',
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek etengabeko ebaluazioari lehentasuna ematea eta materialetarako sarbidea bermatzea eskatzen dute',
      description:
        'Lanza Digitalek jakinarazten du CREUPek etengabeko ebaluazioa, materialetarako sarbide iraunkorra, praktiketarako eta amaierako lanetarako alternatibak eta arrakala sozioekonomikoak murrizteko neurriak eskatu zituela.',
    },
    {
      locale: 'gl',
      title:
        'Estudantes universitarios piden que se priorice a avaliación continua e se garanta o acceso aos materiais',
      description:
        'Lanza Digital recolle que CREUP pide avaliación continua, acceso permanente aos materiais, alternativas para prácticas e traballos finais e medidas para reducir as fendas socioeconómicas.',
    },
    {
      locale: 'val',
      title:
        "Estudiants universitaris demanen que es prioritze l'avaluació contínua i es garantisca l'accés als materials",
      description:
        'Lanza Digital arreplega que CREUP demana avaluació contínua, accés permanent als materials, alternatives per a les pràctiques i treballs finals i mesures per a reduir les bretxes socioeconòmiques.',
    },
  ],
  'estudiantes-universitarios-piden-priorizar-la-evaluacion-con-2020-08': [
    {
      locale: 'en',
      title:
        'University students call for prioritising continuous assessment and guaranteeing access to materials',
      description:
        "La Vanguardia gathers CREUP's call to take part in decisions on university protocols and to prioritise continuous assessment amid the uncertainty at the start of the academic year.",
    },
    {
      locale: 'ca',
      title:
        "Estudiants universitaris demanen prioritzar l'avaluació contínua i garantir l'accés als materials",
      description:
        "La Vanguardia recull la petició de CREUP de participar en les decisions sobre els protocols universitaris i de prioritzar l'avaluació contínua davant la incertesa de l'inici de curs.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek etengabeko ebaluazioari lehentasuna ematea eta materialetarako sarbidea bermatzea eskatzen dute',
      description:
        'La Vanguardiak CREUPen eskaera biltzen du: unibertsitate-protokoloei buruzko erabakietan parte hartzea eta etengabeko ebaluazioari lehentasuna ematea, ikasturte-hasierako ziurgabetasunaren aurrean.',
    },
    {
      locale: 'gl',
      title:
        'Estudantes universitarios piden priorizar a avaliación continua e garantir o acceso aos materiais',
      description:
        'La Vanguardia recolle a petición de CREUP de participar nas decisións sobre os protocolos universitarios e de priorizar a avaliación continua ante a incerteza do inicio de curso.',
    },
    {
      locale: 'val',
      title:
        "Estudiants universitaris demanen prioritzar l'avaluació contínua i garantir l'accés als materials",
      description:
        "La Vanguardia arreplega la petició de CREUP de participar en les decisions sobre els protocols universitaris i de prioritzar l'avaluació contínua davant la incertesa de l'inici de curs.",
    },
  ],
  'estudiantes-universitarios-piden-priorizar-la-evaluacion-con-2020-08-2': [
    {
      locale: 'en',
      title:
        'University students call for prioritising continuous assessment and guaranteeing access to materials',
      description:
        'Europa Press reports that CREUP demanded continuous assessment, flexible access to materials, contingency plans and student participation in the guidelines for the new academic year.',
    },
    {
      locale: 'ca',
      title:
        "Estudiants universitaris demanen prioritzar l'avaluació contínua i garantir l'accés als materials",
      description:
        'Europa Press informa que CREUP va reclamar avaluació contínua, accés flexible als materials, plans de contingència i participació estudiantil en les directrius del nou curs.',
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek etengabeko ebaluazioari lehentasuna ematea eta materialetarako sarbidea bermatzea eskatzen dute',
      description:
        'Europa Pressek jakinarazten du CREUPek etengabeko ebaluazioa, materialetarako sarbide malgua, kontingentzia-planak eta ikasturte berriko jarraibideetan ikasleen parte-hartzea eskatu zituela.',
    },
    {
      locale: 'gl',
      title:
        'Estudantes universitarios piden priorizar a avaliación continua e garantir o acceso aos materiais',
      description:
        'Europa Press informa de que CREUP reclamou avaliación continua, acceso flexible aos materiais, plans de continxencia e participación estudantil nas directrices do novo curso.',
    },
    {
      locale: 'val',
      title:
        "Estudiants universitaris demanen prioritzar l'avaluació contínua i garantir l'accés als materials",
      description:
        'Europa Press informa que CREUP va reclamar avaluació contínua, accés flexible als materials, plans de contingència i participació estudiantil en les directrius del nou curs.',
    },
  ],
  'las-pellas-de-castells-donde-esta-el-ministro-ante-las-dudas-2020-08': [
    {
      locale: 'en',
      title:
        'Castells playing truant: where is the minister amid the doubts of 1.5 million university students',
      description:
        "El Español addresses Manuel Castells' public absence in the face of the uncertainty over the return to university and the doubts of around 1.5 million students.",
    },
    {
      locale: 'ca',
      title:
        "Les «campanes» de Castells: on és el ministre davant els dubtes d'1,5 milions d'universitaris",
      description:
        "El Español aborda l'absència pública de Manuel Castells davant la incertesa del retorn universitari i els dubtes d'al voltant d'1,5 milions d'estudiants.",
    },
    {
      locale: 'eu',
      title:
        'Castellsen «eskola-iruzurra»: non dago ministroa 1,5 milioi unibertsitate-ikasleren zalantzen aurrean',
      description:
        'El Españolek Manuel Castellsen jendaurreko gabezia lantzen du, unibertsitatera itzultzeko ziurgabetasunaren eta 1,5 milioi ikasle ingururen zalantzen aurrean.',
    },
    {
      locale: 'gl',
      title:
        'As «pelas» de Castells: onde está o ministro ante as dúbidas de 1,5 millóns de universitarios',
      description:
        'El Español aborda a ausencia pública de Manuel Castells ante a incerteza do regreso universitario e as dúbidas de arredor de 1,5 millóns de estudantes.',
    },
    {
      locale: 'val',
      title:
        "Les «campanes» de Castells: on és el ministre davant els dubtes d'1,5 milions d'universitaris",
      description:
        "El Español aborda l'absència pública de Manuel Castells davant la incertesa del retorn universitari i els dubtes d'al voltant d'1,5 milions d'estudiants.",
    },
  ],
  'colectivo-estudiantil-cree-que-contratar-a-una-empresa-para-2020-08': [
    {
      locale: 'en',
      title:
        "Student collective believes hiring a company for contact tracing undermines the UCM's call for volunteers",
      description:
        "La Vanguardia gathers CREUP's criticism of the UCM's call for volunteer contact tracers after a private company was hired for that work in Madrid.",
    },
    {
      locale: 'ca',
      title:
        'Un col·lectiu estudiantil creu que contractar una empresa per al rastreig desmunta la petició de voluntaris de la UCM',
      description:
        "La Vanguardia recull la crítica de CREUP a la petició de rastrejadors voluntaris de la UCM després de la contractació d'una empresa privada per a aquestes tasques a Madrid.",
    },
    {
      locale: 'eu',
      title:
        'Ikasle-kolektibo batek uste du jarraipenerako enpresa bat kontratatzeak UCMren boluntario-eskaera deuseztatzen duela',
      description:
        'La Vanguardiak CREUPek UCMren kontaktu-jarraipeneko boluntarioen eskaerari egindako kritika biltzen du, Madrilen lan horietarako enpresa pribatu bat kontratatu ondoren.',
    },
    {
      locale: 'gl',
      title:
        'Un colectivo estudantil cre que contratar unha empresa para o rastrexo desmonta a petición de voluntarios da UCM',
      description:
        'La Vanguardia recolle a crítica de CREUP á petición de rastrexadores voluntarios da UCM tras a contratación dunha empresa privada para esas labores en Madrid.',
    },
    {
      locale: 'val',
      title:
        'Un col·lectiu estudiantil creu que contractar una empresa per al rastreig desmunta la petició de voluntaris de la UCM',
      description:
        "La Vanguardia arreplega la crítica de CREUP a la petició de rastrejadors voluntaris de la UCM després de la contractació d'una empresa privada per a estes tasques a Madrid.",
    },
  ],
  'estudiantes-de-universidades-publicas-critican-la-gestion-on-2020-08': [
    {
      locale: 'en',
      title:
        'Public university students criticise the online management: "We have almost become self-taught"',
      description:
        "Cadena SER analyses students' criticism of the management of online teaching during the pandemic, marked by the digital divide, unstable communication and a lack of teaching adaptation.",
    },
    {
      locale: 'ca',
      title:
        "Estudiants d'universitats públiques critiquen la gestió en línia: «Ens hem convertit gairebé en autodidactes»",
      description:
        "Cadena SER analitza les crítiques estudiantils a la gestió de la docència en línia durant la pandèmia, marcada per la bretxa digital, la comunicació inestable i la manca d'adaptació docent.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitate publikoetako ikasleek lineako kudeaketa kritikatzen dute: «Ia autodidakta bihurtu gara»',
      description:
        'Cadena SERek pandemia garaian lineako irakaskuntzaren kudeaketari ikasleek egindako kritikak aztertzen ditu, arrakala digitalak, komunikazio ezegonkorrak eta irakaskuntzaren egokitzapen-faltak markatuak.',
    },
    {
      locale: 'gl',
      title:
        'Estudantes de universidades públicas critican a xestión en liña: «Convertémonos case en autodidactas»',
      description:
        'Cadena SER analiza as críticas estudantís á xestión da docencia en liña durante a pandemia, marcada pola fenda dixital, a comunicación inestable e a falta de adaptación docente.',
    },
    {
      locale: 'val',
      title:
        "Estudiants d'universitats públiques critiquen la gestió en línia: «Ens hem convertit quasi en autodidactes»",
      description:
        "Cadena SER analitza les crítiques estudiantils a la gestió de la docència en línia durant la pandèmia, marcada per la bretxa digital, la comunicació inestable i la falta d'adaptació docent.",
    },
  ],
  'colectivo-estudiantil-cree-que-contratar-a-una-empresa-para-2020-08-2': [
    {
      locale: 'en',
      title:
        "Student collective believes hiring a company for contact tracing undermines the UCM's call for volunteers",
      description:
        'Europa Press reports that CREUP considers it inconsistent to ask for volunteer university contact tracers while the Community of Madrid awarded the service to a private company.',
    },
    {
      locale: 'ca',
      title:
        'Un col·lectiu estudiantil creu que contractar una empresa per al rastreig desmunta la petició de voluntaris de la UCM',
      description:
        'Europa Press recull que CREUP considera incoherent sol·licitar rastrejadors voluntaris universitaris mentre la Comunitat de Madrid adjudicava el servei a una empresa privada.',
    },
    {
      locale: 'eu',
      title:
        'Ikasle-kolektibo batek uste du jarraipenerako enpresa bat kontratatzeak UCMren boluntario-eskaera deuseztatzen duela',
      description:
        'Europa Pressek jasotzen du CREUPek inkoherentetzat jotzen duela unibertsitateko kontaktu-jarraipeneko boluntarioak eskatzea, Madrilgo Erkidegoak zerbitzua enpresa pribatu bati esleitzen zion bitartean.',
    },
    {
      locale: 'gl',
      title:
        'Un colectivo estudantil cre que contratar unha empresa para o rastrexo desmonta a petición de voluntarios da UCM',
      description:
        'Europa Press recolle que CREUP considera incoherente solicitar rastrexadores voluntarios universitarios mentres a Comunidade de Madrid adxudicaba o servizo a unha empresa privada.',
    },
    {
      locale: 'val',
      title:
        'Un col·lectiu estudiantil creu que contractar una empresa per al rastreig desmunta la petició de voluntaris de la UCM',
      description:
        'Europa Press arreplega que CREUP considera incoherent sol·licitar rastrejadors voluntaris universitaris mentres la Comunitat de Madrid adjudicava el servei a una empresa privada.',
    },
  ],
  'dos-carreras-en-asturias-o-galicia-por-el-precio-de-una-en-c-2020-08': [
    {
      locale: 'en',
      title: 'Two degrees in Asturias or Galicia for the price of one in Catalonia or Madrid',
      description:
        'El País analyses the wide differences in public tuition fees between autonomous communities and the impact of the gradual reduction of fees driven by the Ministry of Universities.',
    },
    {
      locale: 'ca',
      title: "Dues carreres a Astúries o Galícia pel preu d'una a Catalunya o Madrid",
      description:
        "El País analitza les fortes diferències de preus públics universitaris entre comunitats autònomes i l'impacte de la reducció progressiva de taxes impulsada per Universitats.",
    },
    {
      locale: 'eu',
      title: 'Bi karrera Asturiasen edo Galizian Katalunian edo Madrilen bat ordaintzeko prezioan',
      description:
        'El Paísek autonomia-erkidegoen arteko unibertsitateko prezio publikoen alde handiak aztertzen ditu, baita Unibertsitateek bultzatutako tasen murrizketa progresiboaren eragina ere.',
    },
    {
      locale: 'gl',
      title: 'Dúas carreiras en Asturias ou Galicia polo prezo dunha en Cataluña ou Madrid',
      description:
        'El País analiza as fortes diferenzas de prezos públicos universitarios entre comunidades autónomas e o impacto da redución progresiva de taxas impulsada por Universidades.',
    },
    {
      locale: 'val',
      title: "Dos carreres a Astúries o Galícia pel preu d'una a Catalunya o Madrid",
      description:
        "El País analitza les fortes diferències de preus públics universitaris entre comunitats autònomes i l'impacte de la reducció progressiva de taxes impulsada per Universitats.",
    },
  ],
  'toman-impulso-las-carreras-online-por-el-coronavirus-2020-07': [
    {
      locale: 'en',
      title: 'Are "online" degrees gaining momentum because of the coronavirus?',
      description:
        "Heraldo examines whether the experience of online teaching and assessment during the pandemic may increase interest in studying bachelor's and master's degrees remotely or in a hybrid format.",
    },
    {
      locale: 'ca',
      title: 'Prenen impuls les carreres «en línia» pel coronavirus?',
      description:
        "Heraldo analitza si l'experiència de docència i avaluació en línia durant la pandèmia pot augmentar l'interès per estudiar graus i màsters a distància o en modalitat híbrida.",
    },
    {
      locale: 'eu',
      title: 'Indartzen ari dira «lineako» karrerak koronabirusagatik?',
      description:
        'Heraldok aztertzen du ea pandemia garaiko lineako irakaskuntzaren eta ebaluazioaren esperientziak gradoak eta masterrak urrutitik edo modalitate hibridoan ikasteko interesa areagotu dezakeen.',
    },
    {
      locale: 'gl',
      title: 'Toman impulso as carreiras «en liña» polo coronavirus?',
      description:
        'Heraldo analiza se a experiencia de docencia e avaliación en liña durante a pandemia pode aumentar o interese por estudar graos e mestrados a distancia ou en modalidade híbrida.',
    },
    {
      locale: 'val',
      title: 'Prenen impuls les carreres «en línia» pel coronavirus?',
      description:
        "Heraldo analitza si l'experiència de docència i avaluació en línia durant la pandèmia pot augmentar l'interés per estudiar graus i màsters a distància o en modalitat híbrida.",
    },
  ],
  'toman-impulso-las-carreras-online-por-el-coronavirus-2020-07-2': [
    {
      locale: 'en',
      title: 'Are "online" degrees gaining momentum because of the coronavirus?',
      description:
        'La Vanguardia features an EFE analysis on the possible boost to online university education following the lockdown and the forced shift of classes and exams.',
    },
    {
      locale: 'ca',
      title: 'Prenen impuls les carreres «online» per culpa del coronavirus?',
      description:
        "La Vanguardia recull una anàlisi d'EFE sobre el possible impuls de la formació universitària en línia després del confinament i l'adaptació forçada de classes i exàmens.",
    },
    {
      locale: 'eu',
      title: 'Bultza hartzen ari al dira «online» karrerak koronabirusagatik?',
      description:
        'La Vanguardiak EFEren analisi bat jasotzen du, konfinamenduaren ondoren eta klaseak eta azterketak behartuta egokitu ostean unibertsitateko prestakuntza online posible duen bultzadari buruz.',
    },
    {
      locale: 'gl',
      title: 'Toman impulso as carreiras «online» polo coronavirus?',
      description:
        'La Vanguardia recolle unha análise de EFE sobre o posible impulso da formación universitaria en liña tras o confinamento e a adaptación forzada de clases e exames.',
    },
    {
      locale: 'val',
      title: 'Prenen impuls les carreres «online» per culpa del coronavirus?',
      description:
        "La Vanguardia arreplega una anàlisi d'EFE sobre el possible impuls de la formació universitària en línia després del confinament i l'adaptació forçada de classes i exàmens.",
    },
  ],
  'los-estudiantes-universitarios-piden-mecanismos-y-garantias-2020-06': [
    {
      locale: 'en',
      title:
        'University students call for "mechanisms" and "guarantees" to make online teaching "of quality"',
      description:
        'Lanza Digital reports that CREUP and CANAE called for guarantees of quality online teaching, attention to specific needs, and targeted measures for first-year students.',
    },
    {
      locale: 'ca',
      title:
        'Els estudiants universitaris demanen «mecanismes» i «garanties» perquè la docència en línia sigui de «qualitat»',
      description:
        "Lanza Digital recull que CREUP i CANAE van demanar garanties per a una docència en línia de qualitat, atenció a necessitats particulars i mesures específiques per a l'estudiantat de primer curs.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek «mekanismoak» eta «bermeak» eskatzen dituzte online irakaskuntza «kalitatezkoa» izan dadin',
      description:
        'Lanza Digitalek jaso duenez, CREUPek eta CANAEk kalitatezko online irakaskuntzarako bermeak, behar partikularrei arreta eta lehen mailako ikasleentzako neurri espezifikoak eskatu zituzten.',
    },
    {
      locale: 'gl',
      title:
        'Os estudantes universitarios piden «mecanismos» e «garantías» para que a docencia en liña sexa de «calidade»',
      description:
        'Lanza Digital recolle que CREUP e CANAE pediron garantías para unha docencia en liña de calidade, atención a necesidades particulares e medidas específicas para o estudantado de primeiro curso.',
    },
    {
      locale: 'val',
      title:
        'Els estudiants universitaris demanen «mecanismes» i «garanties» perquè la docència en línia siga de «qualitat»',
      description:
        "Lanza Digital arreplega que CREUP i CANAE van demanar garanties per a una docència en línia de qualitat, atenció a necessitats particulars i mesures específiques per a l'estudiantat de primer curs.",
    },
  ],
  'el-gobierno-plantea-que-los-alumnos-roten-para-ir-a-la-unive-2020-06': [
    {
      locale: 'en',
      title:
        'The Government proposes that students rotate their attendance at university next year',
      description:
        'El País explains the Universities recommendations for adapted in-person attendance, with student rotation, face masks, social distancing, and hybrid teaching.',
    },
    {
      locale: 'ca',
      title:
        'El Govern planteja que els alumnes facin torns per anar a la universitat el curs vinent',
      description:
        "El País explica les recomanacions d'Universitats per a una presencialitat adaptada, amb rotació de l'alumnat, mascaretes, distància interpersonal i docència híbrida.",
    },
    {
      locale: 'eu',
      title:
        'Gobernuak ikasleek txandaka unibertsitatera joatea proposatzen du datorren ikasturtean',
      description:
        'El Paísek Unibertsitateen gomendioak azaltzen ditu presentzialitate egokitu baterako, ikasleen txandakatzearekin, maskarekin, pertsonen arteko distantziarekin eta irakaskuntza hibridoarekin.',
    },
    {
      locale: 'gl',
      title: 'O Goberno propón que os alumnos roten para ir á universidade o curso vindeiro',
      description:
        'El País explica as recomendacións de Universidades para unha presencialidade adaptada, con rotación do alumnado, máscaras, distancia interpersoal e docencia híbrida.',
    },
    {
      locale: 'val',
      title:
        'El Govern planteja que els alumnes facen torns per anar a la universitat el curs vinent',
      description:
        "El País explica les recomanacions d'Universitats per a una presencialitat adaptada, amb rotació de l'alumnat, mascaretes, distància interpersonal i docència híbrida.",
    },
  ],
  'la-creatividad-y-la-tecnologia-auxilian-a-las-titulaciones-m-2020-06': [
    {
      locale: 'en',
      title: 'Creativity and technology come to the aid of the most hands-on degrees',
      description:
        'Cinco Días analyses how simulations, virtual reality, and teaching resources helped adapt degrees with a strong practical component during the closure of classrooms and laboratories.',
    },
    {
      locale: 'ca',
      title: 'La creativitat i la tecnologia auxilien les titulacions més pràctiques',
      description:
        "Cinco Días analitza com les simulacions, la realitat virtual i els recursos docents van ajudar a adaptar titulacions amb un alt component pràctic durant el tancament d'aules i laboratoris.",
    },
    {
      locale: 'eu',
      title: 'Sormenak eta teknologiak titulazio praktikoenak laguntzen dituzte',
      description:
        'Cinco Díasek aztertzen du nola lagundu zuten simulazioek, errealitate birtualak eta irakaskuntza-baliabideek osagai praktiko handiko titulazioak egokitzen, ikasgelak eta laborategiak itxita zeuden bitartean.',
    },
    {
      locale: 'gl',
      title: 'A creatividade e a tecnoloxía auxilian as titulacións máis prácticas',
      description:
        'Cinco Días analiza como as simulacións, a realidade virtual e os recursos docentes axudaron a adaptar titulacións cun alto compoñente práctico durante o peche de aulas e laboratorios.',
    },
    {
      locale: 'val',
      title: 'La creativitat i la tecnologia auxilien les titulacions més pràctiques',
      description:
        "Cinco Días analitza com les simulacions, la realitat virtual i els recursos docents van ajudar a adaptar titulacions amb un alt component pràctic durant el tancament d'aules i laboratoris.",
    },
  ],
  'coronavirus-espana-se-elimina-el-requisito-de-merito-y-sube-2020-05': [
    {
      locale: 'en',
      title:
        'Coronavirus, Spain: the merit requirement is dropped and the income threshold for accessing scholarships is raised. Beneficiaries will double',
      description:
        "Il Fatto Quotidiano reports on Spain's scholarship reform during the pandemic, with the removal of academic requirements and higher income thresholds to widen the number of beneficiaries.",
    },
    {
      locale: 'ca',
      title:
        "Coronavirus, Espanya: s'elimina el requisit de mèrit i puja el llindar de renda per accedir a beques. Els beneficiaris es duplicaran",
      description:
        "Il Fatto Quotidiano informa sobre la reforma espanyola de beques durant la pandèmia, amb l'eliminació de requisits acadèmics i l'augment de llindars de renda per ampliar els beneficiaris.",
    },
    {
      locale: 'eu',
      title:
        'Koronabirusa, Espainia: meritu-baldintza ezabatu egiten da eta beketara sartzeko errenta-atalasea igotzen da. Onuradunak bikoiztu egingo dira',
      description:
        'Il Fatto Quotidianok Espainiako beken erreformaren berri ematen du pandemia garaian, baldintza akademikoak ezabatuz eta errenta-atalaseak igoz onuradunak gehitzeko.',
    },
    {
      locale: 'gl',
      title:
        'Coronavirus, España: elimínase o requisito de mérito e sobe o limiar de renda para acceder a bolsas. Os beneficiarios duplicaranse',
      description:
        'Il Fatto Quotidiano informa sobre a reforma española de bolsas durante a pandemia, coa eliminación de requisitos académicos e o aumento de limiares de renda para ampliar os beneficiarios.',
    },
    {
      locale: 'val',
      title:
        "Coronavirus, Espanya: s'elimina el requisit de mèrit i puja el llindar de renda per a accedir a beques. Els beneficiaris es duplicaran",
      description:
        "Il Fatto Quotidiano informa sobre la reforma espanyola de beques durant la pandèmia, amb l'eliminació de requisits acadèmics i l'augment de llindars de renda per a ampliar els beneficiaris.",
    },
  ],
  'como-crear-e-innovar-sin-laboratorios-ni-aulas-2020-05': [
    {
      locale: 'en',
      title: 'How to create and innovate without laboratories or classrooms',
      description:
        'El País addresses the adaptation of health and technical degrees during the pandemic, especially those whose practical training depends on laboratories, workshops, or specific equipment.',
    },
    {
      locale: 'ca',
      title: 'Com crear i innovar sense laboratoris ni aules',
      description:
        "El País aborda l'adaptació de carreres sanitàries i tècniques durant la pandèmia, especialment aquelles amb pràctiques que depenen de laboratoris, tallers o equipament específic.",
    },
    {
      locale: 'eu',
      title: 'Nola sortu eta berritu laborategirik edo ikasgelarik gabe',
      description:
        'El Paísek pandemia garaian osasun- eta teknika-karreren egokitzapena jorratzen du, bereziki laborategien, lantegien edo ekipamendu espezifikoaren mende dauden praktikak dituztenak.',
    },
    {
      locale: 'gl',
      title: 'Como crear e innovar sen laboratorios nin aulas',
      description:
        'El País aborda a adaptación de carreiras sanitarias e técnicas durante a pandemia, especialmente aquelas con prácticas que dependen de laboratorios, talleres ou equipamento específico.',
    },
    {
      locale: 'val',
      title: 'Com crear i innovar sense laboratoris ni aules',
      description:
        "El País aborda l'adaptació de carreres sanitàries i tècniques durant la pandèmia, especialment aquelles amb pràctiques que depenen de laboratoris, tallers o equipament específic.",
    },
  ],
  'los-rectores-no-contemplan-ensenar-100-presencial-ni-en-el-m-2020-05': [
    {
      locale: 'en',
      title: 'Rectors do not envisage 100% in-person teaching even in the best-case scenario',
      description:
        'El País reports that CRUE was working with hybrid scenarios for September, with part of the theoretical teaching delivered remotely and practicals or seminars held in person in small groups.',
    },
    {
      locale: 'ca',
      title: 'Els rectors no preveuen ensenyar 100% presencial ni en el millor escenari',
      description:
        'El País recull que CRUE treballava amb escenaris híbrids per al setembre, amb part de la docència teòrica en remot i pràctiques o seminaris presencials en grups reduïts.',
    },
    {
      locale: 'eu',
      title:
        'Errektoreek ez dute aurreikusten % 100 presentzialki irakastea, eszenatokirik onenean ere',
      description:
        'El Paísek jaso duenez, CRUE eszenatoki hibridoekin lanean ari zen irailerako, irakaskuntza teorikoaren zati bat urrunetik eta praktikak edo mintegiak talde txikietan presentzialki.',
    },
    {
      locale: 'gl',
      title: 'Os reitores non contemplan ensinar 100% presencial nin no mellor escenario',
      description:
        'El País recolle que CRUE traballaba con escenarios híbridos para setembro, con parte da docencia teórica en remoto e prácticas ou seminarios presenciais en grupos reducidos.',
    },
    {
      locale: 'val',
      title: 'Els rectors no preveuen ensenyar 100% presencial ni en el millor escenari',
      description:
        'El País arreplega que CRUE treballava amb escenaris híbrids per al setembre, amb part de la docència teòrica en remot i pràctiques o seminaris presencials en grups reduïts.',
    },
  ],
  'es-legal-la-monitorizacion-de-los-estudiantes-durante-sus-ex-2020-05': [
    {
      locale: 'en',
      title: 'Is it legal to monitor students during their exams at home?',
      description:
        'Canal Sur examines the monitoring of online exams, with input from Carol García, of CREUP, and a legal analysis of recording, surveillance, and data protection.',
    },
    {
      locale: 'ca',
      title: 'És legal la monitorització dels estudiants durant els seus exàmens a casa?',
      description:
        "Canal Sur aborda la monitorització d'exàmens en línia, amb la intervenció de Carol García, de CREUP, i una anàlisi jurídica sobre gravació, vigilància i protecció de dades.",
    },
    {
      locale: 'eu',
      title: 'Legezkoa al da ikasleak etxean azterketak egiten dituzten bitartean monitorizatzea?',
      description:
        'Canal Surrek online azterketen monitorizazioa jorratzen du, CREUPeko Carol Garcíaren parte-hartzearekin, eta grabazioari, zaintzari eta datu-babesari buruzko analisi juridiko batekin.',
    },
    {
      locale: 'gl',
      title: 'É legal a monitorización dos estudantes durante os seus exames na casa?',
      description:
        'Canal Sur aborda a monitorización de exames en liña, coa intervención de Carol García, de CREUP, e unha análise xurídica sobre gravación, vixilancia e protección de datos.',
    },
    {
      locale: 'val',
      title: 'És legal la monitorització dels estudiants durant els seus exàmens a casa?',
      description:
        "Canal Sur aborda la monitorització d'exàmens en línia, amb la intervenció de Carol García, de CREUP, i una anàlisi jurídica sobre gravació, vigilància i protecció de dades.",
    },
  ],
  'el-cje-considera-insuficiente-la-reforma-de-becas-anunciada-2020-05': [
    {
      locale: 'en',
      title: 'The CJE considers the announced scholarship reform "insufficient"',
      description:
        "Moncloa.com features the CJE's assessment of the scholarship reform, regarded as positive but insufficient, and its call to speed up the payment of study aid.",
    },
    {
      locale: 'ca',
      title: 'El CJE considera «insuficient» la reforma de beques anunciada',
      description:
        "Moncloa.com recull la valoració del CJE sobre la reforma de beques, considerada positiva però insuficient, i la demanda d'agilitzar el pagament de les ajudes a l'estudi.",
    },
    {
      locale: 'eu',
      title: 'CJEk «nahikoa ez» dela jotzen du iragarritako beken erreforma',
      description:
        'Moncloa.comek CJEren balorazioa jasotzen du beken erreformari buruz, positibotzat baina nahikoa ez dela jota, eta ikasketetarako laguntzen ordainketa bizkortzeko eskaria.',
    },
    {
      locale: 'gl',
      title: 'O CJE considera «insuficiente» a reforma de bolsas anunciada',
      description:
        'Moncloa.com recolle a valoración do CJE sobre a reforma de bolsas, considerada positiva pero insuficiente, e a demanda de axilizar o pagamento das axudas ao estudo.',
    },
    {
      locale: 'val',
      title: 'El CJE considera «insuficient» la reforma de beques anunciada',
      description:
        "Moncloa.com arreplega la valoració del CJE sobre la reforma de beques, considerada positiva però insuficient, i la demanda d'agilitzar el pagament de les ajudes a l'estudi.",
    },
  ],
  'el-vertigo-de-un-abandono-masivo-de-las-aulas-2020-05': [
    {
      locale: 'en',
      title: 'The dizzying prospect of a mass dropout from classrooms',
      description:
        'El País analyses the risk of educational dropout for economic reasons after the pandemic and the scholarship reforms aimed at curbing the desertion of vulnerable students.',
    },
    {
      locale: 'ca',
      title: "El vertigen d'un abandonament massiu de les aules",
      description:
        "El País analitza el risc d'abandonament educatiu per motius econòmics després de la pandèmia i les reformes de beques destinades a contenir la deserció de l'alumnat vulnerable.",
    },
    {
      locale: 'eu',
      title: 'Ikasgeletako abandonu masibo baten zorabioa',
      description:
        'El Paísek pandemiaren ondoren arrazoi ekonomikoengatik hezkuntza uzteko arriskua aztertzen du, baita ikasle ahulen abandonua eusteko zuzendutako beken erreformak ere.',
    },
    {
      locale: 'gl',
      title: 'O vertixe dun abandono masivo das aulas',
      description:
        'El País analiza o risco de abandono educativo por motivos económicos tras a pandemia e as reformas de bolsas destinadas a conter a deserción do alumnado vulnerable.',
    },
    {
      locale: 'val',
      title: "El vertigen d'un abandó massiu de les aules",
      description:
        "El País analitza el risc d'abandó educatiu per motius econòmics després de la pandèmia i les reformes de beques destinades a contindre la deserció de l'alumnat vulnerable.",
    },
  ],
  'los-estudiantes-valoran-la-subida-pero-piden-adelantar-el-pa-2020-05': [
    {
      locale: 'en',
      title: 'Students welcome the increase but call for the payment to be brought forward',
      description:
        'Diario de León reports that student associations and NGOs welcomed the scholarship reform, although they called for payments to be brought forward and for the management of the aid to be improved.',
    },
    {
      locale: 'ca',
      title: 'Els estudiants valoren la pujada però demanen avançar el pagament',
      description:
        "Diario de León recull que associacions d'estudiants i ONG van valorar la reforma de beques, encara que van demanar avançar els pagaments i millorar la gestió de les ajudes.",
    },
    {
      locale: 'eu',
      title: 'Ikasleek igoera ondo baloratu arren, ordainketa aurreratzeko eskatzen dute',
      description:
        'Diario de Leónek jaso duenez, ikasle-elkarteek eta GKEek beken erreforma baloratu zuten, nahiz eta ordainketak aurreratzeko eta laguntzen kudeaketa hobetzeko eskatu zuten.',
    },
    {
      locale: 'gl',
      title: 'Os estudantes valoran a suba pero piden adiantar o pagamento',
      description:
        'Diario de León recolle que asociacións de estudantes e ONG valoraron a reforma de bolsas, aínda que pediron adiantar os pagamentos e mellorar a xestión das axudas.',
    },
    {
      locale: 'val',
      title: 'Els estudiants valoren la pujada però demanen avançar el pagament',
      description:
        "Diario de León arreplega que associacions d'estudiants i ONG van valorar la reforma de beques, encara que van demanar avançar els pagaments i millorar la gestió de les ajudes.",
    },
  ],
  'estudiantes-y-ong-valoran-la-subida-en-becas-pero-piden-adel-2020-05': [
    {
      locale: 'en',
      title:
        'Students and NGOs welcome the increase in scholarships but call for the payment to be brought forward',
      description:
        'Student associations and NGOs welcome the scholarship reform, but call for payments to be brought forward so that the aid arrives before families take on the expense.',
    },
    {
      locale: 'ca',
      title: 'Estudiants i ONG valoren la pujada en beques però demanen avançar el pagament',
      description:
        'Associacions estudiantils i ONG valoren positivament la reforma de les beques, però reclamen avançar els pagaments perquè les ajudes arribin abans que les famílies assumeixin la despesa.',
    },
    {
      locale: 'eu',
      title:
        'Ikasleek eta GKEek beken igoera baloratzen dute, baina ordainketa aurreratzeko eskatzen dute',
      description:
        'Ikasle-elkarteek eta GKEek positiboki baloratzen dute beken erreforma, baina ordainketak aurreratzeko eskatzen dute, laguntzak familiek gastua hartu baino lehen iristeko.',
    },
    {
      locale: 'gl',
      title: 'Estudantes e ONG valoran a suba en bolsas pero piden adiantar o pagamento',
      description:
        'Asociacións estudantís e ONG valoran positivamente a reforma das bolsas, pero reclaman adiantar os pagamentos para que as axudas cheguen antes de que as familias asuman o gasto.',
    },
    {
      locale: 'val',
      title: 'Estudiants i ONG valoren la pujada en beques però demanen avançar el pagament',
      description:
        'Associacions estudiantils i ONG valoren positivament la reforma de les beques, però reclamen avançar els pagaments perquè les ajudes arriben abans que les famílies assumisquen la despesa.',
    },
  ],
  'quieromisapuntes-los-estudiantes-solicitan-poder-desplazarse-2020-05': [
    {
      locale: 'en',
      title:
        '#QuieroMisApuntes: students ask to be allowed to travel to their flats and halls of residence',
      description:
        'CREUP launches the #QuieroMisApuntes campaign to demand that students be allowed to travel to collect the materials, notes, and equipment they need to tackle their assessment.',
    },
    {
      locale: 'ca',
      title:
        '#QuieroMisApuntes: els estudiants sol·liciten poder desplaçar-se als seus pisos i residències',
      description:
        "CREUP impulsa la campanya #QuieroMisApuntes per reclamar que l'estudiantat pugui desplaçar-se a recollir materials, apunts i equips necessaris per afrontar l'avaluació.",
    },
    {
      locale: 'eu',
      title:
        '#QuieroMisApuntes: ikasleek beren pisuetara eta egoitzetara joan ahal izatea eskatzen dute',
      description:
        'CREUPek #QuieroMisApuntes kanpaina bultzatzen du, ikasleek ebaluazioari aurre egiteko behar dituzten materialak, apunteak eta ekipoak jasotzera joan ahal izatea aldarrikatzeko.',
    },
    {
      locale: 'gl',
      title:
        '#QuieroMisApuntes: os estudantes solicitan poder desprazarse aos seus pisos e residencias',
      description:
        'CREUP impulsa a campaña #QuieroMisApuntes para reclamar que o estudantado poida desprazarse a recoller materiais, apuntamentos e equipos necesarios para afrontar a avaliación.',
    },
    {
      locale: 'val',
      title:
        '#QuieroMisApuntes: els estudiants sol·liciten poder desplaçar-se als seus pisos i residències',
      description:
        "CREUP impulsa la campanya #QuieroMisApuntes per a reclamar que l'estudiantat puga desplaçar-se a arreplegar materials, apunts i equips necessaris per a afrontar l'avaluació.",
    },
  ],
  'asi-van-a-ser-las-evaluaciones-online-en-la-universidad-por-2020-05': [
    {
      locale: 'en',
      title: 'This is what online university assessments will look like because of the coronavirus',
      description:
        'The article examines the debate on how to carry out university assessments online, with special attention to surveillance, unequal access to resources, and alternatives to final exams.',
    },
    {
      locale: 'ca',
      title: 'Així seran les avaluacions en línia a la universitat per culpa del coronavirus',
      description:
        "L'article analitza el debat sobre com fer les avaluacions universitàries en línia, amb especial atenció a la vigilància, la desigualtat de mitjans i les alternatives als exàmens finals.",
    },
    {
      locale: 'eu',
      title: 'Honelakoak izango dira unibertsitateko online ebaluazioak koronabirusagatik',
      description:
        'Artikuluak unibertsitateko ebaluazioak online nola egin eztabaida aztertzen du, zaintzari, baliabideen desberdintasunari eta azken azterketen alternatibei arreta berezia eskainiz.',
    },
    {
      locale: 'gl',
      title: 'Así van ser as avaliacións en liña na universidade polo coronavirus',
      description:
        'O artigo analiza o debate sobre como realizar as avaliacións universitarias en liña, con especial atención á vixilancia, á desigualdade de medios e ás alternativas aos exames finais.',
    },
    {
      locale: 'val',
      title: 'Així seran les avaluacions en línia a la universitat per culpa del coronavirus',
      description:
        "L'article analitza el debat sobre com fer les avaluacions universitàries en línia, amb especial atenció a la vigilància, la desigualtat de mitjans i les alternatives als exàmens finals.",
    },
  ],
  'los-universitarios-se-rebelan-no-se-dan-las-condiciones-para-2020-05': [
    {
      locale: 'en',
      title: 'University students rebel: "The conditions to sit exams are not there"',
      description:
        'University students question the assessment conditions during the pandemic and denounce that there are not enough guarantees to sit exams on an equal footing.',
    },
    {
      locale: 'ca',
      title: 'Els universitaris es rebel·len: «No es donen les condicions per examinar-se»',
      description:
        "L'estudiantat universitari qüestiona les condicions d'avaluació durant la pandèmia i denuncia que no hi ha garanties suficients per examinar-se en igualtat de condicions.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleak matxinatu egiten dira: «Ez dira betetzen azterketak egiteko baldintzak»',
      description:
        'Unibertsitateko ikasleek pandemia garaiko ebaluazio-baldintzak zalantzan jartzen dituzte eta salatzen dute ez dagoela nahikoa bermerik baldintza berdinetan azterketak egiteko.',
    },
    {
      locale: 'gl',
      title: 'Os universitarios rebélanse: «Non se dan as condicións para examinarse»',
      description:
        'O estudantado universitario cuestiona as condicións de avaliación durante a pandemia e denuncia que non existen garantías suficientes para examinarse en igualdade de condicións.',
    },
    {
      locale: 'val',
      title: 'Els universitaris es rebel·len: «No es donen les condicions per a examinar-se»',
      description:
        "L'estudiantat universitari qüestiona les condicions d'avaluació durant la pandèmia i denuncia que no hi ha garanties suficients per a examinar-se en igualtat de condicions.",
    },
  ],
  'el-consejo-de-universitarios-denuncia-la-imposicion-de-exame-2020-04': [
    {
      locale: 'en',
      title:
        'The Council of University Students denounces the imposition of "disproportionate" exams recorded with cameras',
      description:
        "The CEUNE denounces the imposition of remote exams with surveillance and recording measures that it deems disproportionate and contrary to students' privacy.",
    },
    {
      locale: 'ca',
      title:
        "El Consell d'Universitaris denuncia la imposició d'exàmens «desproporcionats» gravats amb càmeres",
      description:
        "El CEUNE denuncia la imposició d'exàmens telemàtics amb mesures de vigilància i gravació que considera desproporcionades i contràries a la intimitat de l'estudiantat.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitarioen Kontseiluak kamerekin grabatutako azterketa «neurrigabeak» ezartzea salatzen du',
      description:
        'CEUNEk azterketa telematikoak ezartzea salatzen du, ikasleen intimitatearen aurka eta neurrigabetzat jotzen dituen zaintza- eta grabazio-neurriekin.',
    },
    {
      locale: 'gl',
      title:
        'O Consello de Universitarios denuncia a imposición de exames «desproporcionados» gravados con cámaras',
      description:
        'O CEUNE denuncia a imposición de exames telemáticos con medidas de vixilancia e gravación que considera desproporcionadas e contrarias á intimidade do estudantado.',
    },
    {
      locale: 'val',
      title:
        "El Consell d'Universitaris denuncia la imposició d'exàmens «desproporcionats» gravats amb càmeres",
      description:
        "El CEUNE denuncia la imposició d'exàmens telemàtics amb mesures de vigilància i gravació que considera desproporcionades i contràries a la intimitat de l'estudiantat.",
    },
  ],
  'las-claves-sobre-como-acabara-el-curso-2020-04': [
    {
      locale: 'en',
      title: 'The key points on how the academic year will end',
      description:
        'Educaweb summarises the measures for closing the 2019-2020 academic year, including the adaptation of university assessment to remote methods and the consultation of students.',
    },
    {
      locale: 'ca',
      title: 'Les claus sobre com acabarà el curs',
      description:
        "Educaweb resumeix les mesures per tancar el curs 2019-2020, incloent-hi l'adaptació de l'avaluació universitària a mitjans no presencials i la consulta a l'estudiantat.",
    },
    {
      locale: 'eu',
      title: 'Ikasturtea nola amaituko den jakiteko gakoak',
      description:
        'Educawebek 2019-2020 ikasturtea ixteko neurriak laburbiltzen ditu, unibertsitateko ebaluazioa modu ez-presentzialetara egokitzea eta ikasleei kontsulta egitea barne.',
    },
    {
      locale: 'gl',
      title: 'As claves sobre como acabará o curso',
      description:
        'Educaweb resume as medidas para pechar o curso 2019-2020, incluíndo a adaptación da avaliación universitaria a medios non presenciais e a consulta ao estudantado.',
    },
    {
      locale: 'val',
      title: 'Les claus sobre com acabarà el curs',
      description:
        "Educaweb resumix les mesures per a tancar el curs 2019-2020, incloent-hi l'adaptació de l'avaluació universitària a mitjans no presencials i la consulta a l'estudiantat.",
    },
  ],
  'el-ministro-castells-urge-a-las-universidades-a-consultar-co-2020-04': [
    {
      locale: 'en',
      title:
        'Minister Castells urges universities to consult students on the criteria for taking online exams',
      description:
        'The Ministry of Universities urges universities to consult students on the criteria for holding online exams and to adapt assessment to the health situation.',
    },
    {
      locale: 'ca',
      title:
        'El ministre Castells insta les universitats a consultar amb els alumnes els criteris per fer els exàmens en línia',
      description:
        "El Ministeri d'Universitats insta les universitats a consultar amb l'estudiantat els criteris per fer exàmens en línia i adaptar l'avaluació a la situació sanitària.",
    },
    {
      locale: 'eu',
      title:
        'Castells ministroak unibertsitateei eskatzen die online azterketak egiteko irizpideak ikasleekin kontsultatzeko',
      description:
        'Unibertsitate Ministerioak unibertsitateei eskatzen die online azterketak egiteko irizpideak ikasleekin kontsultatzeko eta ebaluazioa egoera sanitariora egokitzeko.',
    },
    {
      locale: 'gl',
      title:
        'O ministro Castells insta as universidades a consultar cos alumnos os criterios para facer os exames en liña',
      description:
        'O Ministerio de Universidades insta as universidades a consultar co estudantado os criterios para realizar exames en liña e adaptar a avaliación á situación sanitaria.',
    },
    {
      locale: 'val',
      title:
        'El ministre Castells insta les universitats a consultar amb els alumnes els criteris per a fer els exàmens en línia',
      description:
        "El Ministeri d'Universitats insta les universitats a consultar amb l'estudiantat els criteris per a fer exàmens en línia i adaptar l'avaluació a la situació sanitària.",
    },
  ],
  'ministro-de-universidades-se-reune-con-estudiantes-2020-04': [
    {
      locale: 'en',
      title: 'Minister of Universities meets with students',
      description:
        "The Minister of Universities meets with representatives of the CEUNE and CREUP to address the remote completion of the academic year and students' situation during the health crisis.",
    },
    {
      locale: 'ca',
      title: "El ministre d'Universitats es reuneix amb estudiants",
      description:
        "El ministre d'Universitats es reuneix amb representants del CEUNE i de CREUP per abordar la finalització telemàtica del curs i la situació de l'estudiantat durant la crisi sanitària.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitate ministroak ikasleekin bilera egiten du',
      description:
        'Unibertsitate ministroak CEUNEko eta CREUPeko ordezkariekin bilera egiten du, ikasturtearen amaiera telematikoa eta osasun-krisian zehar ikasleen egoera jorratzeko.',
    },
    {
      locale: 'gl',
      title: 'O ministro de Universidades reúnese con estudantes',
      description:
        'O ministro de Universidades reúnese con representantes do CEUNE e de CREUP para abordar a finalización telemática do curso e a situación do estudantado durante a crise sanitaria.',
    },
    {
      locale: 'val',
      title: "El ministre d'Universitats es reunix amb estudiants",
      description:
        "El ministre d'Universitats es reunix amb representants del CEUNE i de CREUP per a abordar la finalització telemàtica del curs i la situació de l'estudiantat durant la crisi sanitària.",
    },
  ],
  'los-estudiantes-se-posicionan-contra-la-grabacion-online-dur-2020-04': [
    {
      locale: 'en',
      title: 'Students take a stand against online recording during exams',
      description:
        "The CEUNE and CREUP oppose recording and surveillance systems during online exams, arguing that they invade students' privacy.",
    },
    {
      locale: 'ca',
      title: 'Els estudiants es posicionen en contra de la gravació en línia durant els exàmens',
      description:
        "El CEUNE i CREUP es mostren contraris a sistemes de gravació i vigilància durant els exàmens en línia perquè consideren que envaeixen la intimitat de l'estudiantat.",
    },
    {
      locale: 'eu',
      title: 'Ikasleak azterketetan zehar online grabazioaren aurka azaltzen dira',
      description:
        'CEUNE eta CREUP online azterketetan zehar grabazio- eta zaintza-sistemen aurka azaltzen dira, ikasleen intimitatea inbaditzen dutela uste baitute.',
    },
    {
      locale: 'gl',
      title: 'Os estudantes posiciónanse contra a gravación en liña durante os exames',
      description:
        'O CEUNE e CREUP móstranse contrarios a sistemas de gravación e vixilancia durante os exames en liña por consideraren que invaden a intimidade do estudantado.',
    },
    {
      locale: 'val',
      title: 'Els estudiants es posicionen en contra de la gravació en línia durant els exàmens',
      description:
        "El CEUNE i CREUP es mostren contraris a sistemes de gravació i vigilància durant els exàmens en línia perquè consideren que invadixen la intimitat de l'estudiantat.",
    },
  ],
  'universitarios-exigen-la-eliminacion-de-los-criterios-academ-2020-04': [
    {
      locale: 'en',
      title:
        'University students demand that academic criteria be scrapped as a requirement for obtaining a grant',
      description:
        'CREUP calls for academic criteria to be removed from grant eligibility and demands urgent measures to prevent thousands of students from dropping out of university for financial reasons.',
    },
    {
      locale: 'ca',
      title:
        "Els universitaris exigeixen l'eliminació dels criteris acadèmics com a requisit per a obtenir una beca",
      description:
        "CREUP reclama eliminar els criteris acadèmics per a accedir a les beques i demana mesures urgents per a evitar que milers d'estudiants abandonin la universitat per motius econòmics.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek beka bat lortzeko baldintza gisa irizpide akademikoak kentzea eskatzen dute',
      description:
        'CREUPek bekak eskuratzeko irizpide akademikoak kentzea eskatzen du eta premiazko neurriak eskatzen ditu milaka ikaslek arrazoi ekonomikoengatik unibertsitatea utz ez dezaten.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios esixen a eliminación dos criterios académicos como requisito para obter unha bolsa',
      description:
        'CREUP reclama eliminar os criterios académicos para acceder ás bolsas e pide medidas urxentes para evitar que milleiros de estudantes abandonen a universidade por motivos económicos.',
    },
    {
      locale: 'val',
      title:
        "Els universitaris exigixen l'eliminació dels criteris acadèmics com a requisit per a obtindre una beca",
      description:
        "CREUP reclama eliminar els criteris acadèmics per a accedir a les beques i demana mesures urgents per a evitar que milers d'estudiants abandonen la universitat per motius econòmics.",
    },
  ],
  'universitarios-exigen-la-eliminacion-de-los-criterios-academ-2020-04-2': [
    {
      locale: 'en',
      title:
        'University students demand that academic criteria be scrapped as a requirement for obtaining a grant',
      description:
        'CREUP demands the removal of academic criteria for obtaining grants and warns that the economic consequences of the pandemic could push students out of university.',
    },
    {
      locale: 'ca',
      title:
        "Els universitaris exigeixen l'eliminació dels criteris acadèmics com a requisit per a obtenir una beca",
      description:
        'CREUP exigeix eliminar els criteris acadèmics per a obtenir beques i adverteix que les conseqüències econòmiques de la pandèmia poden expulsar estudiants de la universitat.',
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek beka bat lortzeko baldintza gisa irizpide akademikoak kentzea eskatzen dute',
      description:
        'CREUPek bekak lortzeko irizpide akademikoak kentzea eskatzen du eta ohartarazten du pandemiaren ondorio ekonomikoek ikasleak unibertsitatetik kanpora bota ditzaketela.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios esixen a eliminación dos criterios académicos como requisito para obter unha bolsa',
      description:
        'CREUP esixe eliminar os criterios académicos para obter bolsas e advirte de que as consecuencias económicas da pandemia poden expulsar estudantes da universidade.',
    },
    {
      locale: 'val',
      title:
        "Els universitaris exigixen l'eliminació dels criteris acadèmics com a requisit per a obtindre una beca",
      description:
        'CREUP exigix eliminar els criteris acadèmics per a obtindre beques i advertix que les conseqüències econòmiques de la pandèmia poden expulsar estudiants de la universitat.',
    },
  ],
  'la-creup-senala-que-miles-de-estudiantes-tendran-que-dejar-l-2020-04': [
    {
      locale: 'en',
      title:
        'CREUP warns that thousands of students will have to leave university unless grants and fees are changed',
      description:
        'CREUP warns that the economic crisis caused by COVID-19 will worsen the cost of studying and calls for changes to grants, fees and aid to prevent dropouts.',
    },
    {
      locale: 'ca',
      title:
        "CREUP assenyala que milers d'estudiants hauran de deixar la universitat si no es modifiquen les beques i les taxes",
      description:
        "CREUP adverteix que la crisi econòmica derivada de la COVID-19 agreujarà el cost d'estudiar i reclama modificar beques, taxes i ajuts per a evitar abandonaments.",
    },
    {
      locale: 'eu',
      title:
        'CREUPek ohartarazi du milaka ikaslek unibertsitatea utzi beharko dutela bekak eta tasak aldatzen ez badira',
      description:
        'CREUPek ohartarazten du COVID-19aren ondoriozko krisi ekonomikoak ikasteko kostua larriagotuko duela eta bekak, tasak eta laguntzak aldatzea eskatzen du, abandonuak saihesteko.',
    },
    {
      locale: 'gl',
      title:
        'CREUP sinala que milleiros de estudantes terán que deixar a universidade se non se modifican as bolsas e as taxas',
      description:
        'CREUP advirte de que a crise económica derivada da COVID-19 agravará o custo de estudar e reclama modificar bolsas, taxas e axudas para evitar abandonos.',
    },
    {
      locale: 'val',
      title:
        "CREUP assenyala que milers d'estudiants hauran de deixar la universitat si no es modifiquen les beques i les taxes",
      description:
        "CREUP advertix que la crisi econòmica derivada de la COVID-19 agreujarà el cost d'estudiar i reclama modificar beques, taxes i ajudes per a evitar abandonaments.",
    },
  ],
  'los-estudiantes-advierten-de-un-aluvion-de-abandonos-en-la-u-2020-04': [
    {
      locale: 'en',
      title: 'Students warn of a wave of dropouts at the public university',
      description:
        'CREUP warns that many families will not be able to cover the cost of university studies and calls on the Government to act to prevent mass dropouts.',
    },
    {
      locale: 'ca',
      title: "Els estudiants adverteixen d'una allau d'abandonaments a la universitat pública",
      description:
        'CREUP alerta que moltes famílies no podran assumir el cost dels estudis universitaris i demana al Govern que actuï per a evitar abandonaments massius.',
    },
    {
      locale: 'eu',
      title: 'Ikasleek unibertsitate publikoan abandonu uholde baten berri ematen dute',
      description:
        'CREUPek ohartarazten du familia askok ezingo dutela unibertsitate-ikasketen kostua jasan eta Gobernuari eskatzen dio neurriak hartzeko abandonu masiboak saihesteko.',
    },
    {
      locale: 'gl',
      title: 'Os estudantes advirten dunha avalancha de abandonos na universidade pública',
      description:
        'CREUP alerta de que moitas familias non poderán asumir o custo dos estudos universitarios e pídelle ao Goberno que actúe para evitar abandonos masivos.',
    },
    {
      locale: 'val',
      title: "Els estudiants advertixen d'una allau d'abandonaments en la universitat pública",
      description:
        'CREUP alerta que moltes famílies no podran assumir el cost dels estudis universitaris i demana al Govern que actue per a evitar abandonaments massius.',
    },
  ],
  'universitarios-exigen-la-eliminacion-de-los-criterios-academ-2020-04-3': [
    {
      locale: 'en',
      title:
        'University students demand that academic criteria be scrapped as a requirement for obtaining a grant',
      description:
        'CREUP argues that academic criteria in grants exclude students with fewer resources and calls for the economic situation to be prioritised in access to aid.',
    },
    {
      locale: 'ca',
      title:
        "Els universitaris exigeixen l'eliminació dels criteris acadèmics com a requisit per a obtenir una beca",
      description:
        "CREUP defensa que els criteris acadèmics en les beques exclouen estudiants amb menys recursos i reclama prioritzar la situació econòmica en l'accés als ajuts.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek beka bat lortzeko baldintza gisa irizpide akademikoak kentzea eskatzen dute',
      description:
        'CREUPek dio bauketako irizpide akademikoek baliabide gutxiago dituzten ikasleak baztertzen dituztela eta egoera ekonomikoari lehentasuna ematea eskatzen du laguntzak eskuratzeko.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios esixen a eliminación dos criterios académicos como requisito para obter unha bolsa',
      description:
        'CREUP defende que os criterios académicos nas bolsas exclúen estudantes con menos recursos e reclama priorizar a situación económica no acceso ás axudas.',
    },
    {
      locale: 'val',
      title:
        "Els universitaris exigixen l'eliminació dels criteris acadèmics com a requisit per a obtindre una beca",
      description:
        "CREUP defén que els criteris acadèmics en les beques exclouen estudiants amb menys recursos i reclama prioritzar la situació econòmica en l'accés a les ajudes.",
    },
  ],
  'asi-son-los-cientificos-que-conviviran-con-el-covid-19-2020-04': [
    {
      locale: 'en',
      title: 'Meet the scientists who will live alongside Covid-19',
      description:
        'La Razón gathers the experience of Biomedical Engineering students during the health crisis and how the pandemic transformed their university life and their relationship with science.',
    },
    {
      locale: 'ca',
      title: 'Així són els científics que conviuran amb la Covid-19',
      description:
        "La Razón recull l'experiència d'estudiants d'Enginyeria Biomèdica durant la crisi sanitària i com la pandèmia va transformar la seva vida universitària i la seva relació amb la ciència.",
    },
    {
      locale: 'eu',
      title: 'Hauek dira Covid-19arekin biziko diren zientzialariak',
      description:
        'La Razónek Ingeniaritza Biomedikoko ikasleen esperientzia jasotzen du osasun-krisian zehar, eta pandemiak haien unibertsitate-bizitza eta zientziarekiko harremana nola eraldatu zituen.',
    },
    {
      locale: 'gl',
      title: 'Así son os científicos que convivirán coa Covid-19',
      description:
        'La Razón recolle a experiencia de estudantes de Enxeñaría Biomédica durante a crise sanitaria e como a pandemia transformou a súa vida universitaria e a súa relación coa ciencia.',
    },
    {
      locale: 'val',
      title: 'Així són els científics que conviuran amb la Covid-19',
      description:
        "La Razón arreplega l'experiència d'estudiants d'Enginyeria Biomèdica durant la crisi sanitària i com la pandèmia va transformar la seua vida universitària i la seua relació amb la ciència.",
    },
  ],
  'el-consejo-de-estudiantes-universitarios-denuncia-la-imposic-2020-04': [
    {
      locale: 'en',
      title:
        'The University Students\' Council denounces the imposition of "disproportionate" camera-recorded exams',
      description:
        'The CEUNE denounces that some university institutions are imposing online exams with recording and surveillance, and calls for proportionate assessment alternatives.',
    },
    {
      locale: 'ca',
      title:
        "El Consell d'Estudiants Universitaris denuncia la imposició d'exàmens «desproporcionats» gravats amb càmeres",
      description:
        "El CEUNE denuncia que alguns centres universitaris imposen exàmens en línia amb gravació i vigilància, i reclama alternatives d'avaluació proporcionades.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko Ikasleen Kontseiluak kamerekin grabatutako azterketa «neurrigabeen» ezarpena salatzen du',
      description:
        'CEUNEk salatzen du zenbait unibertsitate-zentrok grabazioarekin eta zaintzarekin online azterketak ezartzen dituztela, eta ebaluazio-alternatiba neurrizkoak eskatzen ditu.',
    },
    {
      locale: 'gl',
      title:
        'O Consello de Estudantes Universitarios denuncia a imposición de exames «desproporcionados» gravados con cámaras',
      description:
        'O CEUNE denuncia que algúns centros universitarios impoñen exames en liña con gravación e vixilancia, e reclama alternativas de avaliación proporcionadas.',
    },
    {
      locale: 'val',
      title:
        "El Consell d'Estudiants Universitaris denuncia la imposició d'exàmens «desproporcionats» gravats amb càmeres",
      description:
        "El CEUNE denuncia que alguns centres universitaris imposen exàmens en línia amb gravació i vigilància, i reclama alternatives d'avaluació proporcionades.",
    },
  ],
  '20-preguntas-en-30-minutos-como-evaluar-y-evitar-fraudes-sig-2020-04': [
    {
      locale: 'en',
      title:
        '20 questions in 30 minutes: how to assess and prevent cheating remains at the centre of the university debate',
      description:
        'Online university assessment is at the heart of the debate due to the combination of rushed tests, digital surveillance, the risk of cheating and unequal conditions among students.',
    },
    {
      locale: 'ca',
      title:
        '20 preguntes en 30 minuts: com avaluar i evitar fraus continua al centre del debat universitari',
      description:
        "L'avaluació universitària en línia centra el debat per la combinació de proves accelerades, vigilància digital, risc de frau i desigualtat de condicions entre l'estudiantat.",
    },
    {
      locale: 'eu',
      title:
        '20 galdera 30 minutuan: nola ebaluatu eta iruzurra nola saihestu unibertsitate-eztabaidaren erdigunean dago oraindik',
      description:
        'Unibertsitateko online ebaluazioa eztabaidaren erdigunean dago proba bizkortuen, zaintza digitalaren, iruzur-arriskuaren eta ikasleen arteko baldintza desberdintasunaren konbinazioagatik.',
    },
    {
      locale: 'gl',
      title:
        '20 preguntas en 30 minutos: como avaliar e evitar fraudes segue no centro do debate universitario',
      description:
        'A avaliación universitaria en liña centra o debate pola combinación de probas aceleradas, vixilancia dixital, risco de fraude e desigualdade de condicións entre o estudantado.',
    },
    {
      locale: 'val',
      title:
        '20 preguntes en 30 minuts: com avaluar i evitar fraus continua al centre del debat universitari',
      description:
        "L'avaluació universitària en línia centra el debat per la combinació de proves accelerades, vigilància digital, risc de frau i desigualtat de condicions entre l'estudiantat.",
    },
  ],
  'el-alumnado-de-la-ulpgc-exige-en-las-redes-que-se-le-tenga-e-2020-04': [
    {
      locale: 'en',
      title:
        'ULPGC students demand on social media to be taken into account in decision-making: "We are invisible"',
      description:
        'ULPGC students denounce on social media that they are not being sufficiently taken into account in academic decision-making during the pandemic.',
    },
    {
      locale: 'ca',
      title:
        "L'alumnat de la ULPGC exigeix a les xarxes que se'l tingui en compte per a prendre decisions: «Som invisibles»",
      description:
        "L'alumnat de la ULPGC denuncia a les xarxes socials que no se'l té prou en compte en la presa de decisions acadèmiques durant la pandèmia.",
    },
    {
      locale: 'eu',
      title:
        'ULPGCko ikasleek sareetan eskatzen dute erabakiak hartzeko kontuan har ditzaten: «Ikusezinak gara»',
      description:
        'ULPGCko ikasleek sare sozialetan salatzen dute ez dituztela behar bezala kontuan hartzen pandemian zehar erabaki akademikoak hartzeko orduan.',
    },
    {
      locale: 'gl',
      title:
        'O alumnado da ULPGC esixe nas redes que se lle teña en conta para tomar decisións: «Somos invisibles»',
      description:
        'O alumnado da ULPGC denuncia nas redes sociais que non se lle está tendo suficientemente en conta na toma de decisións académicas durante a pandemia.',
    },
    {
      locale: 'val',
      title:
        "L'alumnat de la ULPGC exigix en les xarxes que se'l tinga en compte per a prendre decisions: «Som invisibles»",
      description:
        "L'alumnat de la ULPGC denuncia en les xarxes socials que no se'l té prou en compte en la presa de decisions acadèmiques durant la pandèmia.",
    },
  ],
  'los-universitarios-en-pie-de-guerra-ante-un-sistema-de-evalu-2020-04': [
    {
      locale: 'en',
      title: 'University students up in arms over an assessment system they consider "unfair"',
      description:
        'University students denounce problems with online teaching and assessment during lockdown, and CREUP calls for fair, inclusive models that respect privacy.',
    },
    {
      locale: 'ca',
      title:
        "Els universitaris, en peu de guerra davant d'un sistema d'avaluació que consideren «injust»",
      description:
        "L'estudiantat universitari denuncia problemes de docència i avaluació en línia durant el confinament, i CREUP reclama models justos, inclusius i respectuosos amb la intimitat.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleak, gerran «bidegabea» iruditzen zaien ebaluazio-sistemaren aurka',
      description:
        'Unibertsitateko ikasleek konfinamenduan zeharreko online irakaskuntza eta ebaluazioaren arazoak salatzen dituzte, eta CREUPek eredu zuzenak, inklusiboak eta intimitatearekiko begirunetsuak eskatzen ditu.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios, en pé de guerra ante un sistema de avaliación que consideran «inxusto»',
      description:
        'O estudantado universitario denuncia problemas de docencia e avaliación en liña durante o confinamento, e CREUP reclama modelos xustos, inclusivos e respectuosos coa intimidade.',
    },
    {
      locale: 'val',
      title:
        "Els universitaris, en peu de guerra davant d'un sistema d'avaluació que consideren «injust»",
      description:
        "L'estudiantat universitari denuncia problemes de docència i avaluació en línia durant el confinament, i CREUP reclama models justos, inclusius i respectuosos amb la intimitat.",
    },
  ],
  'castells-sigue-sin-despejar-la-incognita-del-curso-universit-2020-04': [
    {
      locale: 'en',
      title: 'Castells still leaves the fate of the academic year unresolved as incidents grow',
      description:
        'The article addresses the uncertainty over the end of the academic year, the incidents affecting online teaching and the recommendations of the Ministry of Universities.',
    },
    {
      locale: 'ca',
      title:
        'Castells continua sense aclarir la incògnita del curs universitari i les incidències creixen',
      description:
        "L'article aborda la incertesa sobre el tancament del curs universitari, les incidències en la docència en línia i les recomanacions del Ministeri d'Universitats.",
    },
    {
      locale: 'eu',
      title:
        'Castellsek oraindik ez du argitu unibertsitate-ikasturtearen ezezaguna eta gorabeherak ugaritzen ari dira',
      description:
        'Artikuluak unibertsitate-ikasturtearen amaierari buruzko ziurgabetasuna, online irakaskuntzaren gorabeherak eta Unibertsitate Ministerioaren gomendioak jorratzen ditu.',
    },
    {
      locale: 'gl',
      title:
        'Castells segue sen despexar a incógnita do curso universitario e as incidencias medran',
      description:
        'O artigo aborda a incerteza sobre o peche do curso universitario, as incidencias na docencia en liña e as recomendacións do Ministerio de Universidades.',
    },
    {
      locale: 'val',
      title:
        'Castells continua sense aclarir la incògnita del curs universitari i les incidències creixen',
      description:
        "L'article aborda la incertesa sobre el tancament del curs universitari, les incidències en la docència en línia i les recomanacions del Ministeri d'Universitats.",
    },
  ],
  'el-curso-universitario-acabara-segun-los-plazos-previstos-y-2020-04': [
    {
      locale: 'en',
      title: 'The academic year will end on schedule and with online teaching as the priority',
      description:
        'The Minister of Universities maintains that the academic year will end on schedule and that teaching and assessment will have to adapt primarily to the online format.',
    },
    {
      locale: 'ca',
      title: 'El curs universitari acabarà segons els terminis previstos i amb prioritat en línia',
      description:
        "El ministre d'Universitats defensa que el curs finalitzarà en els terminis previstos i que la docència i l'avaluació s'hauran d'adaptar prioritàriament al format en línia.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitate-ikasturtea aurreikusitako epeetan amaituko da eta online lehentasunarekin',
      description:
        'Unibertsitate ministroak dio ikasturtea aurreikusitako epeetan amaituko dela eta irakaskuntza eta ebaluazioa lehentasunez online formatura egokitu beharko direla.',
    },
    {
      locale: 'gl',
      title: 'O curso universitario acabará segundo os prazos previstos e con prioridade en liña',
      description:
        'O ministro de Universidades defende que o curso finalizará nos prazos previstos e que a docencia e a avaliación deberán adaptarse prioritariamente ao formato en liña.',
    },
    {
      locale: 'val',
      title: 'El curs universitari acabarà segons els terminis previstos i amb prioritat en línia',
      description:
        "El ministre d'Universitats defén que el curs finalitzarà en els terminis previstos i que la docència i l'avaluació s'hauran d'adaptar prioritàriament al format en línia.",
    },
  ],
  'universitarios-piden-al-gobierno-que-se-les-permita-volver-a-2020-04': [
    {
      locale: 'en',
      title:
        'University students ask the Government to let them return to their halls of residence to collect notes and computers',
      description:
        'Student organisations call for a common mechanism so that students can collect notes, computers and materials needed to complete the academic year remotely.',
    },
    {
      locale: 'ca',
      title:
        "Els universitaris demanen al Govern que se'ls permeti tornar a les seves residències per a recollir apunts i ordinadors",
      description:
        "Les organitzacions estudiantils demanen un mecanisme comú perquè l'alumnat pugui recollir apunts, ordinadors i materials necessaris per a completar el curs a distància.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek Gobernuari eskatzen diote apunteak eta ordenagailuak jasotzeko egoitzetara itzultzen uzteko',
      description:
        'Ikasle-erakundeek mekanismo komun bat eskatzen dute ikasleek ikasturtea urrutitik osatzeko behar dituzten apunteak, ordenagailuak eta materialak jaso ahal izan ditzaten.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios pídenlle ao Goberno que se lles permita volver ás súas residencias para recoller apuntamentos e ordenadores',
      description:
        'As organizacións estudantís piden un mecanismo común para que o alumnado poida recoller apuntamentos, ordenadores e materiais necesarios para completar o curso a distancia.',
    },
    {
      locale: 'val',
      title:
        "Els universitaris demanen al Govern que se'ls permeta tornar a les seues residències per a arreplegar apunts i ordinadors",
      description:
        "Les organitzacions estudiantils demanen un mecanisme comú perquè l'alumnat puga arreplegar apunts, ordinadors i materials necessaris per a completar el curs a distància.",
    },
  ],
  'universitarios-piden-al-gobierno-que-se-les-permita-volver-a-2020-04-2': [
    {
      locale: 'en',
      title:
        'University students ask the Government to let them return to their halls of residence to collect notes and computers',
      description:
        'CREUP and CEUNE call on the Government for a common solution to allow safe travel for students who need to retrieve academic materials.',
    },
    {
      locale: 'ca',
      title:
        "Els universitaris demanen al Govern que se'ls permeti tornar a les seves residències per a recollir apunts i ordinadors",
      description:
        "CREUP i CEUNE reclamen al Govern una solució comuna per a permetre desplaçaments segurs de l'estudiantat que necessita recuperar materials acadèmics.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek Gobernuari eskatzen diote apunteak eta ordenagailuak jasotzeko egoitzetara itzultzen uzteko',
      description:
        'CREUPek eta CEUNEk Gobernuari konponbide komun bat eskatzen diote material akademikoak berreskuratu behar dituzten ikasleen joan-etorri seguruak ahalbidetzeko.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios pídenlle ao Goberno que se lles permita volver ás súas residencias para recoller apuntamentos e ordenadores',
      description:
        'CREUP e CEUNE reclámanlle ao Goberno unha solución común para permitir desprazamentos seguros do estudantado que necesita recuperar materiais académicos.',
    },
    {
      locale: 'val',
      title:
        "Els universitaris demanen al Govern que se'ls permeta tornar a les seues residències per a arreplegar apunts i ordinadors",
      description:
        "CREUP i CEUNE reclamen al Govern una solució comuna per a permetre desplaçaments segurs de l'estudiantat que necessita recuperar materials acadèmics.",
    },
  ],
  'las-universidades-deberan-consultar-con-los-alumnos-los-meto-2020-04': [
    {
      locale: 'en',
      title: 'Universities will have to consult students on online assessment methods',
      description:
        'The Ministry of Universities urges universities to consult students before setting the general criteria for remote assessment.',
    },
    {
      locale: 'ca',
      title: "Les universitats hauran de consultar amb l'alumnat els mètodes d'avaluació en línia",
      description:
        "El Ministeri d'Universitats insta les universitats a consultar l'estudiantat abans de fixar els criteris generals d'avaluació no presencial.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitateek ikasleekin kontsultatu beharko dituzte online ebaluazio-metodoak',
      description:
        'Unibertsitate Ministerioak unibertsitateei eskatzen die ikasleekin kontsultatzeko aurrez aurrekoa ez den ebaluazioaren irizpide orokorrak finkatu aurretik.',
    },
    {
      locale: 'gl',
      title: 'As universidades deberán consultar co alumnado os métodos de avaliación en liña',
      description:
        'O Ministerio de Universidades insta as universidades a consultar o estudantado antes de fixar os criterios xerais de avaliación non presencial.',
    },
    {
      locale: 'val',
      title: "Les universitats hauran de consultar amb l'alumnat els mètodes d'avaluació en línia",
      description:
        "El Ministeri d'Universitats insta les universitats a consultar l'estudiantat abans de fixar els criteris generals d'avaluació no presencial.",
    },
  ],
  'castells-sigue-sin-despejar-la-incognita-del-curso-universit-2020-04-2': [
    {
      locale: 'en',
      title: 'Castells still leaves the fate of the academic year unresolved as incidents grow',
      description:
        'The article analyses the open questions about the end of the academic year, the technical problems of online teaching and the role of continuous assessment.',
    },
    {
      locale: 'ca',
      title:
        'Castells continua sense aclarir la incògnita del curs universitari i les incidències creixen',
      description:
        "L'article analitza els dubtes oberts sobre el final del curs universitari, els problemes tècnics de l'ensenyament en línia i el paper de l'avaluació contínua.",
    },
    {
      locale: 'eu',
      title:
        'Castellsek oraindik ez du argitu unibertsitate-ikasturtearen ezezaguna eta gorabeherak ugaritzen ari dira',
      description:
        'Artikuluak unibertsitate-ikasturtearen amaierari buruz irekita dauden zalantzak, online irakaskuntzaren arazo teknikoak eta etengabeko ebaluazioaren papera aztertzen ditu.',
    },
    {
      locale: 'gl',
      title:
        'Castells segue sen despexar a incógnita do curso universitario e as incidencias medran',
      description:
        'O artigo analiza as dúbidas abertas sobre o final do curso universitario, os problemas técnicos do ensino en liña e o papel da avaliación continua.',
    },
    {
      locale: 'val',
      title:
        'Castells continua sense aclarir la incògnita del curs universitari i les incidències creixen',
      description:
        "L'article analitza els dubtes oberts sobre el final del curs universitari, els problemes tècnics de l'ensenyament en línia i el paper de l'avaluació contínua.",
    },
  ],
  'las-administraciones-se-conjuran-para-rescatar-a-los-estudia-2020-04': [
    {
      locale: 'en',
      title: 'The public administrations join forces to rescue impoverished students',
      description:
        'The Government and the autonomous communities are studying ways to grant aid to students economically affected by the pandemic, even though their 2019 incomes do not reflect their current situation.',
    },
    {
      locale: 'ca',
      title: "Les administracions s'alien per a rescatar els estudiants empobrits",
      description:
        'El Govern i les comunitats autònomes estudien fórmules per a becar estudiants afectats econòmicament per la pandèmia, encara que les seves rendes de 2019 no reflecteixin la seva situació actual.',
    },
    {
      locale: 'eu',
      title: 'Administrazioak elkartu egiten dira pobretutako ikasleak erreskatatzeko',
      description:
        'Gobernuak eta autonomia-erkidegoek pandemiak ekonomikoki kaltetutako ikasleei bekak emateko formulak aztertzen dituzte, nahiz eta haien 2019ko errentek ez duten egungo egoera islatzen.',
    },
    {
      locale: 'gl',
      title: 'As administracións alíanse para rescatar os estudantes empobrecidos',
      description:
        'O Goberno e as comunidades autónomas estudan fórmulas para conceder bolsas a estudantes afectados economicamente pola pandemia, aínda que as súas rendas de 2019 non reflictan a súa situación actual.',
    },
    {
      locale: 'val',
      title: "Les administracions s'alien per a rescatar els estudiants empobrits",
      description:
        'El Govern i les comunitats autònomes estudien fórmules per a becar estudiants afectats econòmicament per la pandèmia, encara que les seues rendes de 2019 no reflectisquen la seua situació actual.',
    },
  ],
  'castells-urge-a-las-universidades-a-consultar-con-los-alumno-2020-04': [
    {
      locale: 'en',
      title:
        'Castells urges universities to consult students on the criteria for taking online exams',
      description:
        'The Ministry of Universities asks institutions to consult students on the conditions for online exams before finalising the assessment criteria.',
    },
    {
      locale: 'ca',
      title:
        "Castells insta les universitats a consultar amb l'alumnat els criteris per a fer els exàmens en línia",
      description:
        "El Ministeri d'Universitats demana als centres que consultin amb l'estudiantat les condicions dels exàmens en línia abans de tancar els criteris d'avaluació.",
    },
    {
      locale: 'eu',
      title:
        'Castellsek unibertsitateei eskatzen die ikasleekin kontsultatzeko online azterketak egiteko irizpideak',
      description:
        'Unibertsitate Ministerioak zentroei eskatzen die ikasleekin kontsultatzeko online azterketen baldintzak ebaluazio-irizpideak itxi aurretik.',
    },
    {
      locale: 'gl',
      title:
        'Castells insta as universidades a consultar co alumnado os criterios para facer os exames en liña',
      description:
        'O Ministerio de Universidades pídelles aos centros que consulten co estudantado as condicións dos exames en liña antes de pechar os criterios de avaliación.',
    },
    {
      locale: 'val',
      title:
        "Castells insta les universitats a consultar amb l'alumnat els criteris per a fer els exàmens en línia",
      description:
        "El Ministeri d'Universitats demana als centres que consulten amb l'estudiantat les condicions dels exàmens en línia abans de tancar els criteris d'avaluació.",
    },
  ],
  'carolina-garcia-muchas-veces-solo-se-nos-tiene-en-cuenta-par-2020-04': [
    {
      locale: 'en',
      title:
        'Carolina García: "Many times we are only taken into account for a non-binding consultation or to be informed"',
      description:
        'Carolina García, acting president of CREUP, calls for effective student participation in decisions on teaching, assessment and support measures during the health crisis.',
    },
    {
      locale: 'ca',
      title:
        "Carolina García: «Moltes vegades només se'ns té en compte per a fer-nos una consulta no vinculant o per a informar-nos»",
      description:
        "Carolina García, presidenta en funcions de CREUP, reclama participació efectiva de l'estudiantat en les decisions sobre docència, avaluació i mesures de suport durant la crisi sanitària.",
    },
    {
      locale: 'eu',
      title:
        'Carolina García: «Askotan kontsulta ez lotesle bat egiteko edo informatzeko baino ez gaituzte kontuan hartzen»',
      description:
        'Carolina García, CREUPeko presidente kargudunak, ikasleen benetako parte-hartzea eskatzen du irakaskuntzari, ebaluazioari eta laguntza-neurriei buruzko erabakietan osasun-krisian zehar.',
    },
    {
      locale: 'gl',
      title:
        'Carolina García: «Moitas veces só se nos ten en conta para facernos unha consulta non vinculante ou para informarnos»',
      description:
        'Carolina García, presidenta en funcións de CREUP, reclama participación efectiva do estudantado nas decisións sobre docencia, avaliación e medidas de apoio durante a crise sanitaria.',
    },
    {
      locale: 'val',
      title:
        "Carolina García: «Moltes vegades només se'ns té en compte per a fer-nos una consulta no vinculant o per a informar-nos»",
      description:
        "Carolina García, presidenta en funcions de CREUP, reclama participació efectiva de l'estudiantat en les decisions sobre docència, avaluació i mesures de suport durant la crisi sanitària.",
    },
  ],
  'los-universitarios-en-pie-de-guerra-ante-un-sistema-de-evalu-2020-04-2': [
    {
      locale: 'en',
      title: 'University students up in arms over an assessment system they consider "unfair"',
      description:
        'Students denounce uncertainty, the digital divide and unequal assessment criteria; CREUP rejects invasive surveillance systems during online exams.',
    },
    {
      locale: 'ca',
      title:
        "Els universitaris, en peu de guerra davant d'un sistema d'avaluació que consideren «injust»",
      description:
        "L'estudiantat denuncia incertesa, bretxa digital i criteris d'avaluació desiguals; CREUP rebutja sistemes de vigilància invasius durant els exàmens en línia.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleak, gerran «bidegabea» iruditzen zaien ebaluazio-sistemaren aurka',
      description:
        'Ikasleek ziurgabetasuna, eten digitala eta ebaluazio-irizpide desberdinak salatzen dituzte; CREUPek online azterketetan zaintza-sistema inbaditzaileak baztertzen ditu.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios, en pé de guerra ante un sistema de avaliación que consideran «inxusto»',
      description:
        'O estudantado denuncia incerteza, fenda dixital e criterios de avaliación desiguais; CREUP rexeita sistemas de vixilancia invasivos durante os exames en liña.',
    },
    {
      locale: 'val',
      title:
        "Els universitaris, en peu de guerra davant d'un sistema d'avaluació que consideren «injust»",
      description:
        "L'estudiantat denuncia incertesa, bretxa digital i criteris d'avaluació desiguals; CREUP rebutja sistemes de vigilància invasius durant els exàmens en línia.",
    },
  ],
  'estudiantes-quieren-opinar-sobre-modelos-de-evaluacion-en-la-2020-04': [
    {
      locale: 'en',
      title: 'Students want a say on assessment models at universities',
      description:
        'Students are calling to take part in defining university assessment models during the pandemic, in the face of the urgent shift to remote formats.',
    },
    {
      locale: 'ca',
      title: "L'estudiantat vol opinar sobre els models d'avaluació a les universitats",
      description:
        "L'estudiantat reclama participar en la definició dels models d'avaluació universitària durant la pandèmia, davant l'adaptació urgent a formats no presencials.",
    },
    {
      locale: 'eu',
      title: 'Ikasleek unibertsitateetako ebaluazio ereduez iritzia eman nahi dute',
      description:
        'Ikasleriak unibertsitateko ebaluazio ereduak definitzen parte hartzea aldarrikatzen du pandemia garaian, presako modu ez presentzialetara egokitu behar denean.',
    },
    {
      locale: 'gl',
      title: 'O estudantado quere opinar sobre os modelos de avaliación nas universidades',
      description:
        'O estudantado reclama participar na definición dos modelos de avaliación universitaria durante a pandemia, ante a adaptación urxente a formatos non presenciais.',
    },
    {
      locale: 'val',
      title: "L'estudiantat vol opinar sobre els models d'avaluació en les universitats",
      description:
        "L'estudiantat reclama participar en la definició dels models d'avaluació universitària durant la pandèmia, davant l'adaptació urgent a formats no presencials.",
    },
  ],
  'la-uclm-pide-a-interior-que-reconsidere-su-decision-y-resuel-2020-04': [
    {
      locale: 'en',
      title:
        'UCLM asks the Interior Ministry to reconsider its decision and resolve the situation of thousands of students who need to collect their belongings',
      description:
        'UCLM, CRUE and CREUP ask the Ministry of the Interior to allow orderly travel so that students can collect the materials they need to finish the academic year.',
    },
    {
      locale: 'ca',
      title:
        "La UCLM demana a Interior que reconsideri la seva decisió i resolgui la situació de milers d'estudiants que necessiten recollir les seves pertinences",
      description:
        "La UCLM, la CRUE i la CREUP demanen al Ministeri de l'Interior que permeti desplaçaments ordenats perquè l'estudiantat pugui recollir els materials necessaris per acabar el curs.",
    },
    {
      locale: 'eu',
      title:
        'UCLMek Barne Ministerioari bere erabakia berraztertzeko eta beren gauzak jaso behar dituzten milaka ikasleren egoera konpontzeko eskatu dio',
      description:
        'UCLMek, CRUEk eta CREUPek Barne Ministerioari eskatu diote lekualdaketa antolatuak baimentzeko, ikasleek ikasturtea amaitzeko behar dituzten materialak jaso ahal izan ditzaten.',
    },
    {
      locale: 'gl',
      title:
        'A UCLM pídelle a Interior que reconsidere a súa decisión e resolva a situación de miles de estudantes que precisan recoller as súas pertenzas',
      description:
        'A UCLM, a CRUE e a CREUP pídenlle ao Ministerio do Interior que permita desprazamentos ordenados para que o estudantado poida recoller os materiais necesarios para rematar o curso.',
    },
    {
      locale: 'val',
      title:
        "La UCLM demana a Interior que reconsidere la seua decisió i resolga la situació de milers d'estudiants que necessiten arreplegar les seues pertinences",
      description:
        "La UCLM, la CRUE i la CREUP demanen al Ministeri de l'Interior que permeta desplaçaments ordenats perquè l'estudiantat puga arreplegar els materials necessaris per a acabar el curs.",
    },
  ],
  'suspendido-el-salvoconducto-de-la-uclm-para-que-el-alumnado-2020-04': [
    {
      locale: 'en',
      title: "UCLM's safe-conduct passes for students to collect their notes are suspended",
      description:
        'UCLM announces the suspension of the safe-conduct passes for collecting notes and materials following the change of criteria on travel during the state of alarm.',
    },
    {
      locale: 'ca',
      title: "Suspès el salconduit de la UCLM perquè l'alumnat pugui recollir els apunts",
      description:
        "La UCLM comunica la suspensió dels salconduits per recollir apunts i materials després del canvi de criteri sobre els desplaçaments durant l'estat d'alarma.",
    },
    {
      locale: 'eu',
      title: 'UCLMen salbokondutua eten dute, ikasleek apunteak jaso ahal izan ditzaten',
      description:
        'UCLMek apunteak eta materialak jasotzeko salbokonduktuak eten dituela jakinarazi du, alarma egoeran zehar lekualdaketei buruzko irizpidea aldatu ondoren.',
    },
    {
      locale: 'gl',
      title: 'Suspendido o salvoconduto da UCLM para que o alumnado poida recoller os apuntamentos',
      description:
        'A UCLM comunica a suspensión dos salvocondutos para recoller apuntamentos e materiais tras o cambio de criterio sobre os desprazamentos durante o estado de alarma.',
    },
    {
      locale: 'val',
      title: "Suspés el salconduit de la UCLM perquè l'alumnat puga arreplegar els apunts",
      description:
        "La UCLM comunica la suspensió dels salconduits per a arreplegar apunts i materials després del canvi de criteri sobre els desplaçaments durant l'estat d'alarma.",
    },
  ],
  'las-universidades-publicas-calificaran-con-trabajos-pregunta-2020-04': [
    {
      locale: 'en',
      title:
        'Public universities will grade with assignments, short or reflective questions and video calls',
      description:
        'Public universities are preparing remote assessment methods through assignments, reflective questions, video calls and mechanisms adapted to the lockdown situation.',
    },
    {
      locale: 'ca',
      title:
        'Les universitats públiques qualificaran amb treballs, preguntes curtes o reflexives i videoconferències',
      description:
        "Les universitats públiques preparen fórmules d'avaluació no presencial mitjançant treballs, preguntes reflexives, videoconferències i mecanismes adaptats a la situació de confinament.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitate publikoek lanen, galdera laburren edo gogoetatsuen eta bideokonferentzien bidez kalifikatuko dute',
      description:
        'Unibertsitate publikoek modu ez presentzialean ebaluatzeko formulak prestatzen ari dira, lanen, galdera gogoetatsuen, bideokonferentzien eta konfinamendu egoerara egokitutako mekanismoen bidez.',
    },
    {
      locale: 'gl',
      title:
        'As universidades públicas cualificarán con traballos, preguntas curtas ou reflexivas e videoconferencias',
      description:
        'As universidades públicas preparan fórmulas de avaliación non presencial mediante traballos, preguntas reflexivas, videoconferencias e mecanismos adaptados á situación de confinamento.',
    },
    {
      locale: 'val',
      title:
        'Les universitats públiques qualificaran amb treballs, preguntes curtes o reflexives i videoconferències',
      description:
        "Les universitats públiques preparen fórmules d'avaluació no presencial per mitjà de treballs, preguntes reflexives, videoconferències i mecanismes adaptats a la situació de confinament.",
    },
  ],
  'universitarios-piden-fomentar-la-evaluacion-continua-ante-la-2020-04': [
    {
      locale: 'en',
      title:
        'University students call for promoting continuous assessment given the difficulty of holding in-person exams',
      description:
        "CREUP proposes making the year's assessment more flexible and prioritising continuous assessment given the difficulty of holding in-person exams during the pandemic.",
    },
    {
      locale: 'ca',
      title:
        "Els universitaris demanen fomentar l'avaluació contínua davant la dificultat de fer exàmens presencials",
      description:
        "La CREUP proposa flexibilitzar l'avaluació del curs i prioritzar l'avaluació contínua davant la dificultat de celebrar exàmens presencials durant la pandèmia.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek etengabeko ebaluazioa sustatzeko eskatu dute, azterketa presentzialak egiteko zailtasunaren aurrean',
      description:
        'CREUPek ikasturteko ebaluazioa malgutzea eta etengabeko ebaluazioari lehentasuna ematea proposatzen du, pandemia garaian azterketa presentzialak egiteko zailtasunaren aurrean.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios piden fomentar a avaliación continua ante a dificultade de realizar exames presenciais',
      description:
        'A CREUP propón flexibilizar a avaliación do curso e priorizar a avaliación continua ante a dificultade de celebrar exames presenciais durante a pandemia.',
    },
    {
      locale: 'val',
      title:
        "Els universitaris demanen fomentar l'avaluació contínua davant la dificultat de fer exàmens presencials",
      description:
        "La CREUP proposa flexibilitzar l'avaluació del curs i prioritzar l'avaluació contínua davant de la dificultat de fer exàmens presencials durant la pandèmia.",
    },
  ],
  'universitarios-piden-fomentar-la-evaluacion-continua-ante-la-2020-04-2': [
    {
      locale: 'en',
      title:
        'University students call for promoting continuous assessment given the difficulty of holding in-person exams',
      description:
        'CREUP proposes making university assessment more flexible and helping students pass their subjects through continuous assessment given the limitations caused by COVID-19.',
    },
    {
      locale: 'ca',
      title:
        "Els universitaris demanen fomentar l'avaluació contínua davant la dificultat de fer exàmens presencials",
      description:
        "La CREUP planteja flexibilitzar l'avaluació universitària i facilitar la superació d'assignatures mitjançant l'avaluació contínua davant les limitacions provocades per la COVID-19.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek etengabeko ebaluazioa sustatzeko eskatu dute, azterketa presentzialak egiteko zailtasunaren aurrean',
      description:
        'CREUPek unibertsitateko ebaluazioa malgutzea eta etengabeko ebaluazioaren bidez ikasgaiak gainditzea erraztea proposatzen du, COVID-19ak eragindako mugen aurrean.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios piden fomentar a avaliación continua ante a dificultade de realizar exames presenciais',
      description:
        'A CREUP propón flexibilizar a avaliación universitaria e facilitar a superación de materias mediante a avaliación continua ante as limitacións provocadas pola COVID-19.',
    },
    {
      locale: 'val',
      title:
        "Els universitaris demanen fomentar l'avaluació contínua davant la dificultat de fer exàmens presencials",
      description:
        "La CREUP planteja flexibilitzar l'avaluació universitària i facilitar la superació d'assignatures per mitjà de l'avaluació contínua davant de les limitacions provocades per la COVID-19.",
    },
  ],
  'una-treintena-de-universidades-no-volveran-a-las-clases-pres-2020-04': [
    {
      locale: 'en',
      title: 'Around thirty universities will not return to in-person classes this academic year',
      description:
        'Spanish universities are starting to confirm that they will not resume in-person classes because of the pandemic and are preparing to finish the year with online teaching and assessment.',
    },
    {
      locale: 'ca',
      title: "Una trentena d'universitats no tornaran a les classes presencials aquest curs",
      description:
        'Les universitats espanyoles comencen a confirmar que no reprendran les classes presencials per la pandèmia i preparen la finalització del curs amb docència i avaluació en línia.',
    },
    {
      locale: 'eu',
      title:
        'Hogeita hamar bat unibertsitate ez dira ikasturte honetan klase presentzialetara itzuliko',
      description:
        'Espainiako unibertsitateak baieztatzen hasi dira ez dituztela klase presentzialak berrartuko pandemiagatik, eta ikasturtea sareko irakaskuntza eta ebaluazioarekin amaitzeko prestatzen ari dira.',
    },
    {
      locale: 'gl',
      title: 'Unha trintena de universidades non volverán ás clases presenciais este curso',
      description:
        'As universidades españolas comezan a confirmar que non retomarán as clases presenciais pola pandemia e preparan a finalización do curso con docencia e avaliación en liña.',
    },
    {
      locale: 'val',
      title: "Una trentena d'universitats no tornaran a les classes presencials este curs",
      description:
        'Les universitats espanyoles comencen a confirmar que no reprendran les classes presencials per la pandèmia i preparen la finalització del curs amb docència i avaluació en línia.',
    },
  ],
  'esn-y-creup-piden-facilidades-para-aplicar-la-clausula-de-fu-2020-03': [
    {
      locale: 'en',
      title: 'ESN and CREUP call for flexibility in applying the force majeure clause',
      description:
        'CREUP and ESN Spain request flexibility for Erasmus students affected by the suspension of classes and the international health crisis.',
    },
    {
      locale: 'ca',
      title: 'ESN i CREUP demanen facilitats per aplicar la clàusula de força major',
      description:
        "La CREUP i ESN Espanya sol·liciten flexibilitat per a l'estudiantat Erasmus afectat per la suspensió de classes i la crisi sanitària internacional.",
    },
    {
      locale: 'eu',
      title: 'ESNek eta CREUPek ezinbesteko klausula aplikatzeko erraztasunak eskatu dituzte',
      description:
        'CREUPek eta ESN Espainiak malgutasuna eskatzen dute klaseen etenak eta nazioarteko osasun krisiak kaltetutako Erasmus ikasleentzat.',
    },
    {
      locale: 'gl',
      title: 'ESN e CREUP piden facilidades para aplicar a cláusula de forza maior',
      description:
        'A CREUP e ESN España solicitan flexibilidade para o estudantado Erasmus afectado pola suspensión de clases e a crise sanitaria internacional.',
    },
    {
      locale: 'val',
      title: 'ESN i CREUP demanen facilitats per a aplicar la clàusula de força major',
      description:
        "La CREUP i ESN Espanya sol·liciten flexibilitat per a l'estudiantat Erasmus afectat per la suspensió de classes i la crisi sanitària internacional.",
    },
  ],
  'organizaciones-de-estudiantes-piden-ayudas-para-los-erasmus-2020-03': [
    {
      locale: 'en',
      title:
        'Student organisations call for aid for the "Erasmus" students affected by the suspension of classes due to the coronavirus',
      description:
        'Student organisations are demanding support measures and aid for those on Erasmus mobility who have been affected by the suspension of academic activity.',
    },
    {
      locale: 'ca',
      title:
        "Organitzacions d'estudiants demanen ajudes per als «Erasmus» afectats per la suspensió de classes pel coronavirus",
      description:
        "Organitzacions estudiantils reclamen mesures de suport i ajudes per a qui fa mobilitat Erasmus i s'ha vist afectat per la suspensió de l'activitat acadèmica.",
    },
    {
      locale: 'eu',
      title:
        'Ikasle erakundeek koronabirusagatik klaseak eten izanak kaltetutako «Erasmus» ikasleentzako laguntzak eskatu dituzte',
      description:
        'Ikasle erakundeek laguntza neurriak eta diru laguntzak aldarrikatzen dituzte jarduera akademikoaren etenak kaltetutako Erasmus mugikortasuneko ikasleentzat.',
    },
    {
      locale: 'gl',
      title:
        'Organizacións de estudantes piden axudas para os «Erasmus» afectados pola suspensión de clases polo coronavirus',
      description:
        'Organizacións estudantís reclaman medidas de apoio e axudas para quen fai mobilidade Erasmus e se viu afectado pola suspensión da actividade académica.',
    },
    {
      locale: 'val',
      title:
        "Organitzacions d'estudiants demanen ajudes per als «Erasmus» afectats per la suspensió de classes pel coronavirus",
      description:
        "Organitzacions estudiantils reclamen mesures de suport i ajudes per a qui realitza mobilitat Erasmus i s'ha vist afectat per la suspensió de l'activitat acadèmica.",
    },
  ],
  'organizaciones-estudiantiles-animan-a-no-cancelar-las-estanc-2020-03': [
    {
      locale: 'en',
      title: 'Student organisations encourage people not to cancel their Erasmus stays',
      description:
        'Student organisations recommend not cancelling Erasmus stays hastily and call for institutional coordination in the face of the evolving pandemic.',
    },
    {
      locale: 'ca',
      title: 'Organitzacions estudiantils animen a no cancel·lar les estades Erasmus',
      description:
        "Les organitzacions estudiantils recomanen no cancel·lar de manera precipitada les estades Erasmus i demanen coordinació institucional davant l'evolució de la pandèmia.",
    },
    {
      locale: 'eu',
      title: 'Ikasle erakundeek Erasmus egonaldiak ez bertan behera uztera animatzen dute',
      description:
        'Ikasle erakundeek Erasmus egonaldiak presaka bertan behera ez uztea gomendatzen dute, eta erakundeen arteko koordinazioa eskatzen dute pandemiaren bilakaeraren aurrean.',
    },
    {
      locale: 'gl',
      title: 'Organizacións estudantís animan a non cancelar as estadías Erasmus',
      description:
        'As organizacións estudantís recomendan non cancelar de forma precipitada as estadías Erasmus e piden coordinación institucional ante a evolución da pandemia.',
    },
    {
      locale: 'val',
      title: 'Organitzacions estudiantils animen a no cancel·lar les estades Erasmus',
      description:
        "Les organitzacions estudiantils recomanen no cancel·lar de manera precipitada les estades Erasmus i demanen coordinació institucional davant de l'evolució de la pandèmia.",
    },
  ],
  'asociaciones-de-estudiantes-piden-poder-participar-en-el-pro-2020-02': [
    {
      locale: 'en',
      title: 'Student associations ask to take part in the European Universities project',
      description:
        'CREUP and ESN call for student participation to be built into the European Universities initiatives and the development of the European Education Area.',
    },
    {
      locale: 'ca',
      title:
        "Associacions d'estudiants demanen poder participar en el projecte d'Universitats Europees",
      description:
        "La CREUP i ESN reclamen que la participació estudiantil s'incorpori a les iniciatives d'Universitats Europees i a la construcció de l'Espai Europeu d'Educació.",
    },
    {
      locale: 'eu',
      title: 'Ikasle elkarteek Europako Unibertsitateen proiektuan parte hartzeko eskatu dute',
      description:
        'CREUPek eta ESNek ikasleen parte hartzea Europako Unibertsitateen ekimenetan eta Europako Hezkuntza Esparruaren eraikuntzan txertatzea aldarrikatzen dute.',
    },
    {
      locale: 'gl',
      title:
        'Asociacións de estudantes piden poder participar no proxecto de Universidades Europeas',
      description:
        'A CREUP e ESN reclaman que a participación estudantil se incorpore ás iniciativas de Universidades Europeas e á construción do Espazo Europeo de Educación.',
    },
    {
      locale: 'val',
      title:
        "Associacions d'estudiants demanen poder participar en el projecte d'Universitats Europees",
      description:
        "La CREUP i ESN reclamen que la participació estudiantil s'incorpore a les iniciatives d'Universitats Europees i a la construcció de l'Espai Europeu d'Educació.",
    },
  ],
  'creup-y-esn-creen-que-la-participacion-estudiantil-debe-ser-2020-02': [
    {
      locale: 'en',
      title:
        'CREUP and ESN believe student participation should be the foundation of European initiatives',
      description:
        'CREUP and ESN Spain argue that students should take part in the decision-making of European initiatives and call for more public funding for Erasmus+.',
    },
    {
      locale: 'ca',
      title:
        'La CREUP i ESN creuen que la participació estudiantil ha de ser la base de les iniciatives europees',
      description:
        "La CREUP i ESN Espanya defensen que l'estudiantat participi en la presa de decisions de les iniciatives europees i reclamen més finançament públic per a Erasmus+.",
    },
    {
      locale: 'eu',
      title:
        'CREUPek eta ESNek uste dute ikasleen parte hartzeak Europako ekimenen oinarria izan behar duela',
      description:
        'CREUPek eta ESN Espainiak defendatzen dute ikasleek Europako ekimenen erabakiak hartzen parte hartu behar dutela, eta Erasmus+entzat finantzaketa publiko gehiago eskatzen dute.',
    },
    {
      locale: 'gl',
      title:
        'A CREUP e ESN cren que a participación estudantil debe ser a base das iniciativas europeas',
      description:
        'A CREUP e ESN España defenden que o estudantado participe na toma de decisións das iniciativas europeas e reclaman máis financiamento público para Erasmus+.',
    },
    {
      locale: 'val',
      title:
        'La CREUP i ESN creuen que la participació estudiantil ha de ser la base de les iniciatives europees',
      description:
        "La CREUP i ESN Espanya defenen que l'estudiantat participe en la presa de decisions de les iniciatives europees i reclamen més finançament públic per a Erasmus+.",
    },
  ],
  'la-reforma-de-selectividad-se-aplaza-y-cada-autonomia-correg-2020-02': [
    {
      locale: 'en',
      title:
        'The reform of the university entrance exam is postponed and each region will mark in its own way',
      description:
        'The technical committee on the university entrance exam has been postponed due to the electoral standstill, keeping the regional differences in content and marking criteria.',
    },
    {
      locale: 'ca',
      title: "La reforma de la selectivitat s'ajorna i cada autonomia corregirà a la seva manera",
      description:
        'La comissió tècnica sobre la selectivitat queda ajornada pel parèntesi electoral, i es mantenen les diferències autonòmiques en continguts i criteris de correcció.',
    },
    {
      locale: 'eu',
      title:
        'Selektibitatearen erreforma atzeratu egin da eta autonomia erkidego bakoitzak bere erara zuzenduko du',
      description:
        'Selektibitateari buruzko batzorde teknikoa atzeratu egin da hauteskunde geldialdiagatik, eta autonomia erkidegoen arteko desberdintasunak mantentzen dira edukietan eta zuzenketa irizpideetan.',
    },
    {
      locale: 'gl',
      title: 'A reforma da selectividade aprázase e cada autonomía corrixirá á súa maneira',
      description:
        'A comisión técnica sobre a selectividade queda aprazada polo parón electoral, mantendo as diferenzas autonómicas en contidos e criterios de corrección.',
    },
    {
      locale: 'val',
      title: "La reforma de la selectivitat s'ajorna i cada autonomia corregirà a la seua manera",
      description:
        'La comissió tècnica sobre la selectivitat queda ajornada pel parèntesi electoral, i es mantenen les diferències autonòmiques en continguts i criteris de correcció.',
    },
  ],
  'el-futuro-incierto-de-las-becas-erasmus-tras-el-brexit-2020-02': [
    {
      locale: 'en',
      title: 'The uncertain future of Erasmus grants after Brexit',
      description:
        "The United Kingdom's departure from the European Union creates uncertainty about the future of Erasmus grants, although the mobilities awarded until December are guaranteed.",
    },
    {
      locale: 'ca',
      title: 'El futur incert de les beques Erasmus després del Brexit',
      description:
        'La sortida del Regne Unit de la Unió Europea genera incertesa sobre el futur de les beques Erasmus, tot i que les mobilitats concedides fins al desembre queden garantides.',
    },
    {
      locale: 'eu',
      title: 'Erasmus beken etorkizun ezegonkorra Brexit-aren ondoren',
      description:
        'Erresuma Batua Europar Batasunetik ateratzeak ziurgabetasuna sortzen du Erasmus beken etorkizunaz, nahiz eta abendura arte emandako mugikortasunak bermatuta gelditu.',
    },
    {
      locale: 'gl',
      title: 'O futuro incerto das bolsas Erasmus tras o Brexit',
      description:
        'A saída do Reino Unido da Unión Europea xera incerteza sobre o futuro das bolsas Erasmus, aínda que as mobilidades concedidas ata decembro quedan garantidas.',
    },
    {
      locale: 'val',
      title: 'El futur incert de les beques Erasmus després del Brexit',
      description:
        "L'eixida del Regne Unit de la Unió Europea genera incertesa sobre el futur de les beques Erasmus, encara que les mobilitats concedides fins al desembre queden garantides.",
    },
  ],
  'las-universidades-espanolas-se-comprometen-a-luchar-contra-e-2019-12': [
    {
      locale: 'en',
      title: 'Spanish universities commit to fighting climate change',
      description:
        'Spanish universities sign a commitment against climate change and assert their institutional, scientific and educational responsibility in the face of this challenge.',
    },
    {
      locale: 'ca',
      title: 'Les universitats espanyoles es comprometen a lluitar contra el canvi climàtic',
      description:
        'Les universitats espanyoles subscriuen un compromís davant el canvi climàtic i reivindiquen la seva responsabilitat institucional, científica i formativa davant aquest repte.',
    },
    {
      locale: 'eu',
      title:
        'Espainiako unibertsitateek klima aldaketaren aurka borrokatzeko konpromisoa hartu dute',
      description:
        'Espainiako unibertsitateek klima aldaketaren aurkako konpromisoa sinatzen dute eta erronka honen aurrean duten erantzukizun instituzional, zientifiko eta prestakuntzakoa aldarrikatzen dute.',
    },
    {
      locale: 'gl',
      title: 'As universidades españolas comprométense a loitar contra o cambio climático',
      description:
        'As universidades españolas subscriben un compromiso fronte ao cambio climático e reivindican a súa responsabilidade institucional, científica e formativa ante este reto.',
    },
    {
      locale: 'val',
      title: 'Les universitats espanyoles es comprometen a lluitar contra el canvi climàtic',
      description:
        'Les universitats espanyoles subscriuen un compromís davant el canvi climàtic i reivindiquen la seua responsabilitat institucional, científica i formativa davant este repte.',
    },
  ],
  'universitarios-reclaman-mas-financiacion-del-estado-y-las-co-2019-12': [
    {
      locale: 'en',
      title: 'University students demand more funding from the State and the regions for Erasmus+',
      description:
        'University representatives call for greater state and regional co-funding of the Erasmus+ programme to make it fairer and more inclusive.',
    },
    {
      locale: 'ca',
      title:
        "Els universitaris reclamen més finançament de l'Estat i les comunitats autònomes per a Erasmus+",
      description:
        'Representants universitaris reclamen un major cofinançament estatal i autonòmic del programa Erasmus+ per fer-lo més equitatiu i inclusiu.',
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateko ikasleek Estatuaren eta autonomia erkidegoen finantzaketa handiagoa eskatzen dute Erasmus+entzat',
      description:
        'Unibertsitateko ordezkariek Erasmus+ programaren estatuko eta autonomia erkidegoetako kofinantzaketa handiagoa eskatzen dute, bidezkoagoa eta inklusiboagoa egiteko.',
    },
    {
      locale: 'gl',
      title:
        'Os universitarios reclaman máis financiamento do Estado e as comunidades autónomas para Erasmus+',
      description:
        'Representantes universitarios reclaman un maior cofinanciamento estatal e autonómico do programa Erasmus+ para facelo máis equitativo e inclusivo.',
    },
    {
      locale: 'val',
      title:
        "Els universitaris reclamen més finançament de l'Estat i les comunitats autònomes per a Erasmus+",
      description:
        'Representants universitaris reclamen un major cofinançament estatal i autonòmic del programa Erasmus+ per a fer-lo més equitatiu i inclusiu.',
    },
  ],
  'esn-espana-y-creup-piden-un-aumento-de-la-cofinanciacion-nac-2019-12-2': [
    {
      locale: 'en',
      title:
        'ESN Spain and CREUP call for an increase in national and regional co-funding for Erasmus+',
      description:
        'ESN Spain and CREUP call for increasing the national and regional co-funding of Erasmus+ to reduce inequalities in access to international mobility.',
    },
    {
      locale: 'ca',
      title:
        'ESN Espanya i CREUP demanen un augment del cofinançament nacional i autonòmic per a Erasmus+',
      description:
        "ESN Espanya i la CREUP reclamen incrementar el cofinançament nacional i autonòmic d'Erasmus+ per reduir desigualtats en l'accés a la mobilitat internacional.",
    },
    {
      locale: 'eu',
      title:
        'ESN Espainiak eta CREUPek Erasmus+entzako estatuko eta autonomia erkidegoetako kofinantzaketa handitzeko eskatu dute',
      description:
        'ESN Espainiak eta CREUPek Erasmus+en estatuko eta autonomia erkidegoetako kofinantzaketa handitzeko eskatzen dute, nazioarteko mugikortasunerako sarbidean dauden desberdintasunak murrizteko.',
    },
    {
      locale: 'gl',
      title:
        'ESN España e CREUP piden un aumento do cofinanciamento nacional e autonómico para Erasmus+',
      description:
        'ESN España e a CREUP reclaman incrementar o cofinanciamento nacional e autonómico de Erasmus+ para reducir desigualdades no acceso á mobilidade internacional.',
    },
    {
      locale: 'val',
      title:
        'ESN Espanya i CREUP demanen un augment del cofinançament nacional i autonòmic per a Erasmus+',
      description:
        "ESN Espanya i la CREUP reclamen incrementar el cofinançament nacional i autonòmic d'Erasmus+ per a reduir desigualtats en l'accés a la mobilitat internacional.",
    },
  ],
  'universidades-y-estudiantes-piden-al-gobierno-que-ayude-a-tr-2019-11': [
    {
      locale: 'en',
      title:
        'Universities and students ask the Government to help triple the funding of the Erasmus programme',
      description:
        'Universities and student representatives ask the Government to support in Brussels the proposal to triple the funding of Erasmus+ 2021-2027.',
    },
    {
      locale: 'ca',
      title:
        'Universitats i estudiants demanen al Govern que ajudi a triplicar el finançament del programa Erasmus',
      description:
        "Universitats i representants estudiantils sol·liciten al Govern que doni suport a Brussel·les a la proposta per triplicar el finançament d'Erasmus+ 2021-2027.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitateek eta ikasleek Gobernuari Erasmus programaren finantzaketa hirukoizten laguntzeko eskatu diote',
      description:
        'Unibertsitateek eta ikasleen ordezkariek Gobernuari eskatzen diote Bruselan Erasmus+ 2021-2027 finantzaketa hirukoizteko proposamena babesteko.',
    },
    {
      locale: 'gl',
      title:
        'Universidades e estudantes piden ao Goberno que axude a triplicar o financiamento do programa Erasmus',
      description:
        'Universidades e representantes estudantís solicitan ao Goberno que apoie en Bruxelas a proposta para triplicar o financiamento de Erasmus+ 2021-2027.',
    },
    {
      locale: 'val',
      title:
        'Universitats i estudiants demanen al Govern que ajude a triplicar el finançament del programa Erasmus',
      description:
        "Universitats i representants estudiantils sol·liciten al Govern que done suport a Brussel·les a la proposta per a triplicar el finançament d'Erasmus+ 2021-2027.",
    },
  ],
  'el-gobierno-da-el-primer-paso-para-lograr-una-selectividad-m-2019-10': [
    {
      locale: 'en',
      title: 'The Government takes the first step towards a more uniform university entrance exam',
      description:
        'The Government is setting up a working group to review the university entrance exam model and move towards more uniform criteria across the regions.',
    },
    {
      locale: 'ca',
      title: 'El Govern fa el primer pas per aconseguir una selectivitat més homogènia',
      description:
        'El Govern impulsa un grup de treball per revisar el model de selectivitat i avançar cap a criteris més homogenis entre comunitats autònomes.',
    },
    {
      locale: 'eu',
      title: 'Gobernuak lehen urratsa eman du selektibitate homogeneoago bat lortzeko',
      description:
        'Gobernuak lan talde bat sustatzen du selektibitate eredua berrikusteko eta autonomia erkidegoen arteko irizpide homogeneoagoetarantz aurrera egiteko.',
    },
    {
      locale: 'gl',
      title: 'O Goberno dá o primeiro paso para lograr unha selectividade máis homoxénea',
      description:
        'O Goberno impulsa un grupo de traballo para revisar o modelo de selectividade e avanzar cara a criterios máis homoxéneos entre comunidades autónomas.',
    },
    {
      locale: 'val',
      title: 'El Govern fa el primer pas per a aconseguir una selectivitat més homogènia',
      description:
        'El Govern impulsa un grup de treball per a revisar el model de selectivitat i avançar cap a criteris més homogenis entre comunitats autònomes.',
    },
  ],
  'grupo-de-trabajo-revisara-las-nuevas-pruebas-de-acceso-a-la-2019-10': [
    {
      locale: 'en',
      title: 'Working group will review the new university entrance exams',
      description:
        'The working group on the university entrance exams will address the review of the model and student participation in the process.',
    },
    {
      locale: 'ca',
      title: "Un grup de treball revisarà les noves proves d'accés a la universitat",
      description:
        "El grup de treball sobre les proves d'accés a la universitat abordarà la revisió del model i la participació de l'estudiantat en el procés.",
    },
    {
      locale: 'eu',
      title: 'Lan talde batek unibertsitaterako sarbide proba berriak berrikusiko ditu',
      description:
        'Unibertsitaterako sarbide probei buruzko lan taldeak ereduaren berrikuspena eta ikasleen parte hartzea jorratuko ditu prozesuan.',
    },
    {
      locale: 'gl',
      title: 'Un grupo de traballo revisará as novas probas de acceso á universidade',
      description:
        'O grupo de traballo sobre as probas de acceso á universidade abordará a revisión do modelo e a participación do estudantado no proceso.',
    },
    {
      locale: 'val',
      title: "Un grup de treball revisarà les noves proves d'accés a la universitat",
      description:
        "El grup de treball sobre les proves d'accés a la universitat tractarà la revisió del model i la participació de l'estudiantat en el procés.",
    },
  ],
  'una-comision-revisara-el-contenido-y-la-forma-de-corregir-la-2019-10': [
    {
      locale: 'en',
      title:
        'A committee will review the content and the way the university entrance exams are marked',
      description:
        'The Government, regional authorities, vice-chancellors and students will take part in a technical committee to review the content and marking criteria of the university entrance exams.',
    },
    {
      locale: 'ca',
      title: 'Una comissió revisarà el contingut i la manera de corregir la selectivitat',
      description:
        'Govern, comunitats autònomes, rectors i estudiants participaran en una comissió tècnica per revisar el contingut i els criteris de correcció de la selectivitat.',
    },
    {
      locale: 'eu',
      title: 'Batzorde batek selektibitatea zuzentzeko edukia eta modua berrikusiko ditu',
      description:
        'Gobernua, autonomia-erkidegoak, errektoreak eta ikasleak batzorde tekniko batean parte hartuko dute selektibitatearen edukia eta zuzenketa-irizpideak berrikusteko.',
    },
    {
      locale: 'gl',
      title: 'Unha comisión revisará o contido e a forma de corrixir a selectividade',
      description:
        'Goberno, comunidades autónomas, reitores e estudantes participarán nunha comisión técnica para revisar o contido e os criterios de corrección da selectividade.',
    },
    {
      locale: 'val',
      title: 'Una comissió revisarà el contingut i la manera de corregir la selectivitat',
      description:
        'Govern, comunitats autònomes, rectors i estudiants participaran en una comissió tècnica per a revisar el contingut i els criteris de correcció de la selectivitat.',
    },
  ],
  'el-gobierno-contara-con-los-estudiantes-para-evaluar-el-actu-2019-10': [
    {
      locale: 'en',
      title:
        'The Government will involve students in evaluating the current university entrance exam model',
      description:
        'The Government plans to bring student representatives into the working group tasked with evaluating and correcting the current university entrance exam model.',
    },
    {
      locale: 'ca',
      title: "El Govern comptarà amb els estudiants per avaluar l'actual model de selectivitat",
      description:
        "El Govern preveu incorporar representants de l'estudiantat al grup de treball encarregat d'avaluar i corregir el model actual de selectivitat.",
    },
    {
      locale: 'eu',
      title: 'Gobernuak ikasleak kontuan hartuko ditu egungo selektibitate eredua ebaluatzeko',
      description:
        'Gobernuak ikasleen ordezkariak sartzea aurreikusten du egungo selektibitate eredua ebaluatu eta zuzentzeaz arduratzen den lan-taldean.',
    },
    {
      locale: 'gl',
      title: 'O Goberno contará cos estudantes para avaliar o actual modelo de selectividade',
      description:
        'O Goberno prevé incorporar representantes do estudantado ao grupo de traballo encargado de avaliar e corrixir o modelo actual de selectividade.',
    },
    {
      locale: 'val',
      title: "El Govern comptarà amb els estudiants per a avaluar l'actual model de selectivitat",
      description:
        "El Govern preveu incorporar representants de l'estudiantat al grup de treball encarregat d'avaluar i corregir el model actual de selectivitat.",
    },
  ],
  'el-gobierno-central-incluira-al-alumnado-en-el-grupo-de-trab-2019-10': [
    {
      locale: 'en',
      title:
        'The central Government will include students in the working group that will review the current university entrance exam model',
      description:
        "The central Government will include students in the working group that will review the university entrance exam model, following students' demands for participation.",
    },
    {
      locale: 'ca',
      title:
        "El Govern central inclourà l'alumnat al grup de treball que revisarà l'actual model de selectivitat",
      description:
        "El Govern central inclourà l'alumnat al grup de treball que revisarà el model de selectivitat, després de les demandes de participació de l'estudiantat.",
    },
    {
      locale: 'eu',
      title:
        'Gobernu zentralak ikasleak sartuko ditu egungo selektibitate eredua berrikusiko duen lan-taldean',
      description:
        'Gobernu zentralak ikasleak sartuko ditu selektibitate eredua berrikusiko duen lan-taldean, ikasleriak parte hartzeko egindako eskaeren ostean.',
    },
    {
      locale: 'gl',
      title:
        'O Goberno central incluirá o alumnado no grupo de traballo que revisará o actual modelo de selectividade',
      description:
        'O Goberno central incluirá o alumnado no grupo de traballo que revisará o modelo de selectividade, tras as demandas de participación do estudantado.',
    },
    {
      locale: 'val',
      title:
        "El Govern central inclourà l'alumnat en el grup de treball que revisarà l'actual model de selectivitat",
      description:
        "El Govern central inclourà l'alumnat en el grup de treball que revisarà el model de selectivitat, després de les demandes de participació de l'estudiantat.",
    },
  ],
  'el-gobierno-contara-con-los-estudiantes-para-evaluar-el-actu-2019-10-2': [
    {
      locale: 'en',
      title:
        'The Government will involve students in evaluating the current university entrance exam model',
      description:
        'The Government will involve student representatives in reviewing the university entrance exam model and respond to the demands for participation put forward by CREUP.',
    },
    {
      locale: 'ca',
      title: "El Govern comptarà amb els estudiants per avaluar l'actual model de selectivitat",
      description:
        'El Govern comptarà amb representants estudiantils per revisar el model de selectivitat i respondre a les demandes de participació traslladades per CREUP.',
    },
    {
      locale: 'eu',
      title: 'Gobernuak ikasleak kontuan hartuko ditu egungo selektibitate eredua ebaluatzeko',
      description:
        'Gobernuak ikasleen ordezkariak kontuan hartuko ditu selektibitate eredua berrikusteko eta CREUPek helarazitako parte hartzeko eskaerei erantzuteko.',
    },
    {
      locale: 'gl',
      title: 'O Goberno contará cos estudantes para avaliar o actual modelo de selectividade',
      description:
        'O Goberno contará con representantes estudantís para revisar o modelo de selectividade e responder ás demandas de participación trasladadas por CREUP.',
    },
    {
      locale: 'val',
      title: "El Govern comptarà amb els estudiants per a avaluar l'actual model de selectivitat",
      description:
        'El Govern comptarà amb representants estudiantils per a revisar el model de selectivitat i respondre a les demandes de participació traslladades per CREUP.',
    },
  ],
  'el-gobierno-contara-con-los-estudiantes-para-evaluar-el-actu-2019-10-3': [
    {
      locale: 'en',
      title:
        'The Government will involve students in evaluating the current university entrance exam (Selectividad)',
      description:
        'The Government will invite university and upper-secondary student representatives to the working group tasked with evaluating and correcting the Selectividad model.',
    },
    {
      locale: 'ca',
      title: "El Govern comptarà amb els estudiants per avaluar l'actual model de la selectivitat",
      description:
        "El Govern convidarà representants d'estudiants universitaris i de Batxillerat al grup de treball encarregat d'avaluar i corregir el model de selectivitat.",
    },
    {
      locale: 'eu',
      title: 'Gobernuak ikasleak kontuan hartuko ditu egungo selektibitate eredua ebaluatzeko',
      description:
        'Gobernuak unibertsitateko eta Batxilergoko ikasleen ordezkariak gonbidatuko ditu selektibitate eredua ebaluatu eta zuzentzeaz arduratzen den lan-taldera.',
    },
    {
      locale: 'gl',
      title: 'O Goberno contará cos estudantes para avaliar o actual modelo da selectividade',
      description:
        'O Goberno convidará a representantes de estudantes universitarios e de Bacharelato ao grupo de traballo encargado de avaliar e corrixir o modelo de selectividade.',
    },
    {
      locale: 'val',
      title:
        "El Govern comptarà amb els estudiants per a avaluar l'actual model de la selectivitat",
      description:
        "El Govern convidarà representants d'estudiants universitaris i de Batxillerat al grup de treball encarregat d'avaluar i corregir el model de selectivitat.",
    },
  ],
  'universitarios-formaran-parte-del-grupo-de-trabajo-para-deba-2019-10': [
    {
      locale: 'en',
      title: 'University students will join the working group to debate the EBAU',
      description:
        "University and upper-secondary student representatives will take part in the working group that will review the EBAU model, after CREUP's call to give students a voice.",
    },
    {
      locale: 'ca',
      title: "Universitaris formaran part del grup de treball per debatre sobre l'EBAU",
      description:
        "Representants universitaris i de Batxillerat participaran en el grup de treball que revisarà el model de l'EBAU, després de la petició de CREUP de comptar amb la veu de l'estudiantat.",
    },
    {
      locale: 'eu',
      title: 'Unibertsitarioak lan-taldearen parte izango dira EBAUri buruz eztabaidatzeko',
      description:
        'Unibertsitateko eta Batxilergoko ordezkariek EBAUren eredua berrikusiko duen lan-taldean parte hartuko dute, CREUPek ikasleriaren ahotsa kontuan hartzeko eskaeraren ostean.',
    },
    {
      locale: 'gl',
      title: 'Universitarios formarán parte do grupo de traballo para debater sobre a EBAU',
      description:
        'Representantes universitarios e de Bacharelato participarán no grupo de traballo que revisará o modelo da EBAU, tras a petición de CREUP de contar coa voz do estudantado.',
    },
    {
      locale: 'val',
      title: "Universitaris formaran part del grup de treball per a debatre sobre l'EBAU",
      description:
        "Representants universitaris i de Batxillerat participaran en el grup de treball que revisarà el model de l'EBAU, després de la petició de CREUP de comptar amb la veu de l'estudiantat.",
    },
  ],
  'creup-pide-la-inclusion-de-los-estudiantes-en-la-reforma-de-2019-10': [
    {
      locale: 'en',
      title: 'CREUP calls for students to be included in the university entrance exam reform',
      description:
        'CREUP demands that students be part of the working group on the university entrance exam reform so that the review of the model reflects the perspective of those who sit the test.',
    },
    {
      locale: 'ca',
      title: 'CREUP demana la inclusió dels estudiants en la reforma de la selectivitat',
      description:
        "CREUP reclama que l'estudiantat formi part del grup de treball sobre la reforma de la selectivitat perquè la revisió del model incorpori la perspectiva de qui fa la prova.",
    },
    {
      locale: 'eu',
      title: 'CREUPek ikasleak selektibitatearen erreforman sartzeko eskatu du',
      description:
        'CREUPek eskatzen du ikasleria selektibitatearen erreformari buruzko lan-taldearen parte izatea, eredua berrikustean proba egiten dutenen ikuspegia jaso dadin.',
    },
    {
      locale: 'gl',
      title: 'CREUP pide a inclusión dos estudantes na reforma da selectividade',
      description:
        'CREUP reclama que o estudantado forme parte do grupo de traballo sobre a reforma da selectividade para que a revisión do modelo incorpore a perspectiva de quen realiza a proba.',
    },
    {
      locale: 'val',
      title: 'CREUP demana la inclusió dels estudiants en la reforma de la selectivitat',
      description:
        "CREUP reclama que l'estudiantat forme part del grup de treball sobre la reforma de la selectivitat perquè la revisió del model incorpore la perspectiva de qui fa la prova.",
    },
  ],
  'creup-denuncia-el-bloqueo-a-la-financiacion-de-las-asociacio-2019-10': [
    {
      locale: 'en',
      title: 'CREUP denounces the blockage of funding for associations',
      description:
        'CREUP denounces the delay in the call for grants for student associations and warns of its impact on university associative activity.',
    },
    {
      locale: 'ca',
      title: 'CREUP denuncia el bloqueig al finançament de les associacions',
      description:
        "CREUP denuncia el retard en la convocatòria de subvencions per a associacions estudiantils i alerta de l'impacte que té sobre l'activitat associativa universitària.",
    },
    {
      locale: 'eu',
      title: 'CREUPek elkarteen finantzaketaren blokeoa salatu du',
      description:
        'CREUPek ikasle-elkarteentzako diru-laguntzen deialdiaren atzerapena salatu du eta unibertsitateko elkarte-jardueran duen eraginaz ohartarazi du.',
    },
    {
      locale: 'gl',
      title: 'CREUP denuncia o bloqueo ao financiamento das asociacións',
      description:
        'CREUP denuncia o atraso na convocatoria de subvencións para asociacións estudantís e alerta do impacto que ten sobre a actividade asociativa universitaria.',
    },
    {
      locale: 'val',
      title: 'CREUP denuncia el bloqueig al finançament de les associacions',
      description:
        "CREUP denuncia el retard en la convocatòria de subvencions per a associacions estudiantils i alerta de l'impacte que té sobre l'activitat associativa universitària.",
    },
  ],
  'universitarios-denuncian-que-el-bloqueo-politico-tiene-paral-2019-10': [
    {
      locale: 'en',
      title:
        'University students denounce that the "political deadlock" has frozen grants to student organisations',
      description:
        'CREUP denounces that the political deadlock has frozen the call for grants to youth associations and student federations, funding it considers essential.',
    },
    {
      locale: 'ca',
      title:
        "Universitaris denuncien que el «bloqueig polític» té paralitzades les subvencions a organitzacions d'estudiants",
      description:
        "CREUP denuncia que el bloqueig polític manté paralitzada la convocatòria de subvencions a associacions juvenils i federacions d'estudiants, un finançament que considera imprescindible.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitarioek salatu dute «blokeo politikoak» ikasle-erakundeen diru-laguntzak geldituta dituela',
      description:
        'CREUPek salatu du blokeo politikoak geldituta mantentzen duela gazte-elkarteei eta ikasle-federazioei zuzendutako diru-laguntzen deialdia, ezinbestekotzat jotzen duen finantzaketa.',
    },
    {
      locale: 'gl',
      title:
        'Universitarios denuncian que o «bloqueo político» ten paralizadas as subvencións a organizacións de estudantes',
      description:
        'CREUP denuncia que o bloqueo político mantén paralizada a convocatoria de subvencións a asociacións xuvenís e federacións de estudantes, un financiamento que considera imprescindible.',
    },
    {
      locale: 'val',
      title:
        "Universitaris denuncien que el «bloqueig polític» té paralitzades les subvencions a organitzacions d'estudiants",
      description:
        "CREUP denuncia que el bloqueig polític manté paralitzada la convocatòria de subvencions a associacions juvenils i federacions d'estudiants, un finançament que considera imprescindible.",
    },
  ],
  'creup-incide-en-la-importancia-de-que-el-estudiantado-partic-2019-09': [
    {
      locale: 'en',
      title:
        'CREUP stresses the importance of students taking part in the negotiation of the new University Act',
      description:
        'CREUP stresses to the parliamentary groups the need to include students in the negotiation of the new Organic Act on Universities and to address grants, fees, internships and the disciplinary regime.',
    },
    {
      locale: 'ca',
      title:
        "CREUP incideix en la importància que l'estudiantat participi en la negociació de la nova Llei d'Universitats",
      description:
        "CREUP subratlla davant els grups parlamentaris la necessitat d'incloure l'estudiantat en la negociació de la nova Llei Orgànica d'Universitats i abordar beques, taxes, pràctiques i règim disciplinari.",
    },
    {
      locale: 'eu',
      title:
        'CREUPek azpimarratzen du garrantzitsua dela ikasleriak Unibertsitateen Lege berriaren negoziazioan parte hartzea',
      description:
        'CREUPek talde parlamentarioen aurrean azpimarratzen du ikasleria Unibertsitateen Lege Organiko berriaren negoziazioan sartzeko beharra, eta bekak, tasak, praktikak eta diziplina-araubidea jorratzekoa.',
    },
    {
      locale: 'gl',
      title:
        'CREUP incide na importancia de que o estudantado participe na negociación da nova Lei de Universidades',
      description:
        'CREUP subliña ante os grupos parlamentarios a necesidade de incluír o estudantado na negociación da nova Lei Orgánica de Universidades e abordar bolsas, taxas, prácticas e réxime disciplinario.',
    },
    {
      locale: 'val',
      title:
        "CREUP incidix en la importància que l'estudiantat participe en la negociació de la nova Llei d'Universitats",
      description:
        "CREUP subratlla davant els grups parlamentaris la necessitat d'incloure l'estudiantat en la negociació de la nova Llei Orgànica d'Universitats i abordar beques, taxes, pràctiques i règim disciplinari.",
    },
  ],
  'universitarios-piden-a-psoe-pp-y-cs-la-modificacion-del-regl-2019-09': [
    {
      locale: 'en',
      title:
        'University students ask PSOE, PP and Cs to amend the Francoist disciplinary regulation in force since 1954',
      description:
        'CREUP asks PSOE, PP, Ciudadanos and nationalist parties to reform the 1954 Academic Discipline Regulation and for greater student participation in the new University Act.',
    },
    {
      locale: 'ca',
      title:
        'Universitaris demanen a PSOE, PP i Cs la modificació del reglament disciplinari franquista vigent des de 1954',
      description:
        "CREUP sol·licita a PSOE, PP, Ciudadanos i partits nacionalistes la reforma del Reglament de Disciplina Acadèmica de 1954 i més participació estudiantil en la nova Llei d'Universitats.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitarioek PSOE, PP eta Csi 1954tik indarrean dagoen diziplina-arautegi frankista aldatzeko eskatu diete',
      description:
        'CREUPek PSOE, PP, Ciudadanos eta alderdi nazionalistei eskatu die 1954ko Diziplina Akademikoaren Arautegia erreformatzeko eta ikasleen parte-hartze handiagoa Unibertsitateen Lege berrian.',
    },
    {
      locale: 'gl',
      title:
        'Universitarios piden a PSOE, PP e Cs a modificación do regulamento disciplinario franquista vixente desde 1954',
      description:
        'CREUP solicita a PSOE, PP, Ciudadanos e partidos nacionalistas a reforma do Regulamento de Disciplina Académica de 1954 e máis participación estudantil na nova Lei de Universidades.',
    },
    {
      locale: 'val',
      title:
        'Universitaris demanen a PSOE, PP i Cs la modificació del reglament disciplinari franquista vigent des de 1954',
      description:
        "CREUP sol·licita a PSOE, PP, Ciudadanos i partits nacionalistes la reforma del Reglament de Disciplina Acadèmica de 1954 i més participació estudiantil en la nova Llei d'Universitats.",
    },
  ],
  'representantes-del-sector-universitario-piden-a-sanchez-que-2019-08': [
    {
      locale: 'en',
      title:
        'University sector representatives ask Sánchez to seek a broad pact for a new universities act',
      description:
        'University sector representatives call on Pedro Sánchez for a new universities act built on a broad pact among stakeholders, institutions and political parties.',
    },
    {
      locale: 'ca',
      title:
        "Representants del sector universitari demanen a Sánchez que busqui un gran pacte per a una nova llei d'universitats",
      description:
        "Representants del sector universitari reclamen a Pedro Sánchez una nova llei d'universitats basada en un gran pacte entre agents, institucions i partits polítics.",
    },
    {
      locale: 'eu',
      title:
        'Unibertsitate-sektoreko ordezkariek Sánchezi eskatu diote unibertsitateen lege berri baterako akordio handi bat bilatzeko',
      description:
        'Unibertsitate-sektoreko ordezkariek Pedro Sánchezi eskatzen diote eragile, erakunde eta alderdi politikoen arteko akordio handi batean oinarritutako unibertsitateen lege berri bat.',
    },
    {
      locale: 'gl',
      title:
        'Representantes do sector universitario piden a Sánchez que busque un gran pacto para unha nova lei de universidades',
      description:
        'Representantes do sector universitario reclaman a Pedro Sánchez unha nova lei de universidades baseada nun gran pacto entre axentes, institucións e partidos políticos.',
    },
    {
      locale: 'val',
      title:
        "Representants del sector universitari demanen a Sánchez que busque un gran pacte per a una nova llei d'universitats",
      description:
        "Representants del sector universitari reclamen a Pedro Sánchez una nova llei d'universitats basada en un gran pacte entre agents, institucions i partits polítics.",
    },
  ],
  'un-observatorio-de-integracion-de-inmigrantes-y-refugiados-p-2019-08': [
    {
      locale: 'en',
      title:
        'An observatory on the integration of immigrants and refugees could be set up in Palma',
      description:
        'CREUP and the Spanish Immigration Network are considering setting up in Palma a branch of the Observatory on the integration of migrants and refugees in the Spanish university system.',
    },
    {
      locale: 'ca',
      title: "Un observatori d'integració d'immigrants i refugiats podria instal·lar-se a Palma",
      description:
        "CREUP i la Xarxa Espanyola d'Immigració estudien instal·lar a Palma una seu de l'Observatori d'integració de població migrant i refugiada en el sistema universitari espanyol.",
    },
    {
      locale: 'eu',
      title: 'Etorkinen eta errefuxiatuen integrazio-behatoki bat Palman ezar liteke',
      description:
        'CREUPek eta Immigrazioaren Espainiako Sareak Palman behatoki baten egoitza bat ezartzea aztertzen ari dira, Espainiako unibertsitate-sistemako migratzaileen eta errefuxiatuen integraziorako.',
    },
    {
      locale: 'gl',
      title:
        'Un observatorio de integración de inmigrantes e refuxiados podería instalarse en Palma',
      description:
        'CREUP e a Rede Española de Inmigración estudan instalar en Palma unha sede do Observatorio de integración de poboación migrante e refuxiada no sistema universitario español.',
    },
    {
      locale: 'val',
      title: "Un observatori d'integració d'immigrants i refugiats podria instal·lar-se a Palma",
      description:
        "CREUP i la Xarxa Espanyola d'Immigració estudien instal·lar a Palma una seu de l'Observatori d'integració de població migrant i refugiada en el sistema universitari espanyol.",
    },
  ],
  'representantes-de-red-espanola-de-inmigracion-y-la-coordinad-2019-08': [
    {
      locale: 'en',
      title:
        'Representatives of the Spanish Immigration Network and the Coordinator of Public Universities CREUP meet with Palma City Council',
      description:
        'Representatives of the Spanish Immigration Network and of CREUP meet with Palma City Council to present the Observatory on the integration of migrant and refugee populations at university.',
    },
    {
      locale: 'ca',
      title:
        "Representants de la Xarxa Espanyola d'Immigració i la Coordinadora de les Universitats Públiques CREUP es reuneixen amb l'Ajuntament de Palma",
      description:
        "Representants de la Xarxa Espanyola d'Immigració i de CREUP es reuneixen amb l'Ajuntament de Palma per presentar l'Observatori sobre integració de població migrada i refugiada a la universitat.",
    },
    {
      locale: 'eu',
      title:
        'Immigrazioaren Espainiako Sareko eta Unibertsitate Publikoen Koordinatzaile CREUPeko ordezkariak Palmako Udalarekin bildu dira',
      description:
        'Immigrazioaren Espainiako Sareko eta CREUPeko ordezkariak Palmako Udalarekin bildu dira unibertsitateko migratutako eta errefuxiatutako populazioaren integrazioari buruzko Behatokia aurkezteko.',
    },
    {
      locale: 'gl',
      title:
        'Representantes da Rede Española de Inmigración e a Coordinadora das Universidades Públicas CREUP reúnense co Concello de Palma',
      description:
        'Representantes da Rede Española de Inmigración e de CREUP reúnense co Concello de Palma para presentar o Observatorio sobre integración de poboación migrada e refuxiada na universidade.',
    },
    {
      locale: 'val',
      title:
        "Representants de la Xarxa Espanyola d'Immigració i la Coordinadora de les Universitats Públiques CREUP es reunixen amb l'Ajuntament de Palma",
      description:
        "Representants de la Xarxa Espanyola d'Immigració i de CREUP es reunixen amb l'Ajuntament de Palma per a presentar l'Observatori sobre integració de població migrada i refugiada a la universitat.",
    },
  ],
  'la-red-espanola-de-inmigracion-y-creup-constituyen-el-primer-2019-08': [
    {
      locale: 'en',
      title:
        'The Spanish Immigration Network and CREUP set up the first Observatory on Migration and University',
      description:
        'CREUP and the Spanish Immigration Network set up the first Observatory on Migration and University to analyse access to and retention of migrant populations in higher education.',
    },
    {
      locale: 'ca',
      title:
        "La Xarxa Espanyola d'Immigració i CREUP constitueixen el primer Observatori de Migració i Universitat",
      description:
        "CREUP i la Xarxa Espanyola d'Immigració constitueixen el primer Observatori de Migració i Universitat per analitzar l'accés i la permanència de la població migrant en els estudis superiors.",
    },
    {
      locale: 'eu',
      title:
        'Immigrazioaren Espainiako Sareak eta CREUPek Migrazio eta Unibertsitate lehen Behatokia eratu dute',
      description:
        'CREUPek eta Immigrazioaren Espainiako Sareak Migrazio eta Unibertsitate lehen Behatokia eratu dute migratzaileen populazioak goi-mailako ikasketetan duen sarbidea eta iraupena aztertzeko.',
    },
    {
      locale: 'gl',
      title:
        'A Rede Española de Inmigración e CREUP constitúen o primeiro Observatorio de Migración e Universidade',
      description:
        'CREUP e a Rede Española de Inmigración constitúen o primeiro Observatorio de Migración e Universidade para analizar o acceso e a permanencia da poboación migrante nos estudos superiores.',
    },
    {
      locale: 'val',
      title:
        "La Xarxa Espanyola d'Immigració i CREUP constituïxen el primer Observatori de Migració i Universitat",
      description:
        "CREUP i la Xarxa Espanyola d'Immigració constituïxen el primer Observatori de Migració i Universitat per a analitzar l'accés i la permanència de la població migrant en els estudis superiors.",
    },
  ],
  'constituido-el-primer-observatorio-de-migracion-y-universida-2019-08': [
    {
      locale: 'en',
      title: 'First Observatory on Migration and University set up in Spain',
      description:
        "CREUP and the Spanish Immigration Network will launch the first Observatory on Migration and University to address the lack of data on migrants' access to higher education.",
    },
    {
      locale: 'ca',
      title: 'Constituït el primer Observatori de Migració i Universitat a Espanya',
      description:
        "CREUP i la Xarxa Espanyola d'Immigració posaran en marxa el primer Observatori de Migració i Universitat per abordar la manca de dades sobre l'accés de persones migrants als estudis superiors.",
    },
    {
      locale: 'eu',
      title: 'Migrazio eta Unibertsitate lehen Behatokia eratu da Espainian',
      description:
        'CREUPek eta Immigrazioaren Espainiako Sareak Migrazio eta Unibertsitate lehen Behatokia abian jarriko dute, migratzaileek goi-mailako ikasketetarako duten sarbideari buruzko daturik ezari aurre egiteko.',
    },
    {
      locale: 'gl',
      title: 'Constituído o primeiro Observatorio de Migración e Universidade en España',
      description:
        'CREUP e a Rede Española de Inmigración porán en marcha o primeiro Observatorio de Migración e Universidade para abordar a falta de datos sobre o acceso de persoas migrantes aos estudos superiores.',
    },
    {
      locale: 'val',
      title: 'Constituït el primer Observatori de Migració i Universitat a Espanya',
      description:
        "CREUP i la Xarxa Espanyola d'Immigració posaran en marxa el primer Observatori de Migració i Universitat per a abordar la falta de dades sobre l'accés de persones migrants als estudis superiors.",
    },
  ],
  'representantes-de-red-espanola-de-inmigracion-y-la-coordinad-2019-08-2': [
    {
      locale: 'en',
      title:
        'Representatives of the Spanish Immigration Network and the Coordinator of Public Universities CREUP meet with Palma City Council',
      description:
        'CREUP and the Spanish Immigration Network meet with representatives of Palma City Council to present the Observatory on the integration of migrant and refugee populations in the university system.',
    },
    {
      locale: 'ca',
      title:
        "Representants de la Xarxa Espanyola d'Immigració i la Coordinadora de les Universitats Públiques CREUP es reuneixen amb l'Ajuntament de Palma",
      description:
        "CREUP i la Xarxa Espanyola d'Immigració es reuneixen amb representants de l'Ajuntament de Palma per presentar l'Observatori d'integració de població migrada i refugiada en el sistema universitari.",
    },
    {
      locale: 'eu',
      title:
        'Immigrazioaren Espainiako Sareko eta Unibertsitate Publikoen Koordinatzaile CREUPeko ordezkariak Palmako Udalarekin bildu dira',
      description:
        'CREUP eta Immigrazioaren Espainiako Sarea Palmako Udaleko ordezkariekin bildu dira unibertsitate-sistemako migratutako eta errefuxiatutako populazioaren integrazioari buruzko Behatokia aurkezteko.',
    },
    {
      locale: 'gl',
      title:
        'Representantes da Rede Española de Inmigración e a Coordinadora das Universidades Públicas CREUP reúnense co Concello de Palma',
      description:
        'CREUP e a Rede Española de Inmigración reúnense con representantes do Concello de Palma para presentar o Observatorio de integración de poboación migrada e refuxiada no sistema universitario.',
    },
    {
      locale: 'val',
      title:
        "Representants de la Xarxa Espanyola d'Immigració i la Coordinadora de les Universitats Públiques CREUP es reunixen amb l'Ajuntament de Palma",
      description:
        "CREUP i la Xarxa Espanyola d'Immigració es reunixen amb representants de l'Ajuntament de Palma per a presentar l'Observatori d'integració de població migrada i refugiada en el sistema universitari.",
    },
  ],
  'estudian-instalar-una-sede-del-observatorio-de-integracion-d-2019-08': [
    {
      locale: 'en',
      title:
        'They are considering setting up a branch of the observatory on the integration of migrant and refugee populations at the University',
      description:
        "CREUP raises the possibility of setting up in Palma a physical branch of the observatory on the integration of migrant and refugee populations at university, given the city's Mediterranean symbolism.",
    },
    {
      locale: 'ca',
      title:
        "Estudien instal·lar una seu de l'observatori d'integració de la població migrant i refugiada a la Universitat",
      description:
        "CREUP planteja la possibilitat d'instal·lar a Palma una seu física de l'observatori sobre integració de població migrant i refugiada a la universitat pel simbolisme mediterrani de la ciutat.",
    },
    {
      locale: 'eu',
      title:
        'Migratzaileen eta errefuxiatuen integrazio-behatokiaren egoitza bat Unibertsitatean ezartzea aztertzen ari dira',
      description:
        'CREUPek Palman migratzaileen eta errefuxiatuen integrazioari buruzko behatokiaren egoitza fisiko bat ezartzeko aukera planteatu du, hiriaren Mediterraneoko sinbolismoa dela eta.',
    },
    {
      locale: 'gl',
      title:
        'Estudan instalar unha sede do observatorio de integración da poboación migrante e refuxiada na Universidade',
      description:
        'CREUP formula a posibilidade de instalar en Palma unha sede física do observatorio sobre integración de poboación migrante e refuxiada na universidade polo simbolismo mediterráneo da cidade.',
    },
    {
      locale: 'val',
      title:
        "Estudien instal·lar una seu de l'observatori d'integració de la població migrant i refugiada en la Universitat",
      description:
        "CREUP planteja la possibilitat d'instal·lar a Palma una seu física de l'observatori sobre integració de població migrant i refugiada en la universitat pel simbolisme mediterrani de la ciutat.",
    },
  ],
  'universitarios-creen-que-a-la-bonificacion-de-creditos-deben-2019-07': [
    {
      locale: 'en',
      title:
        'University students believe credit fee reductions should be accompanied by more grants',
      description:
        'Student representatives welcome the reduction in university credit fees but call for an adequate grant system to cover the cost of materials, transport and housing.',
    },
    {
      locale: 'ca',
      title: "Universitaris creuen que a la bonificació de crèdits s'hi han de sumar més beques",
      description:
        'Representants estudiantils valoren positivament la bonificació de crèdits universitaris, però reclamen un sistema de beques suficient per cobrir despeses de material, transport i habitatge.',
    },
    {
      locale: 'eu',
      title: 'Unibertsitarioek uste dute kredituen hobariari beka gehiago gehitu behar zaizkiola',
      description:
        'Ikasleen ordezkariek positiboki baloratzen dute unibertsitate-kredituen hobaria, baina material-, garraio- eta etxebizitza-gastuak estaltzeko beka-sistema nahikoa eskatzen dute.',
    },
    {
      locale: 'gl',
      title: 'Universitarios cren que á bonificación de créditos deben sumarse máis bolsas',
      description:
        'Representantes estudantís valoran positivamente a bonificación de créditos universitarios, pero reclaman un sistema de bolsas suficiente para cubrir gastos de material, transporte e vivenda.',
    },
    {
      locale: 'val',
      title: "Universitaris creuen que a la bonificació de crèdits s'hi han de sumar més beques",
      description:
        'Representants estudiantils valoren positivament la bonificació de crèdits universitaris, però reclamen un sistema de beques suficient per a cobrir despeses de material, transport i vivenda.',
    },
  ],
}
