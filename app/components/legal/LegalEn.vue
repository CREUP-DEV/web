<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <article class="mx-auto max-w-4xl space-y-10">
    <!-- Header -->
    <header class="space-y-2">
      <h1 class="text-3xl font-bold sm:text-4xl">
        {{ title }}
      </h1>
      <p class="text-muted text-sm">Last updated: March 6, 2026</p>
    </header>

    <!-- I. GENERAL INFORMATION -->
    <section id="general-information" class="space-y-4">
      <h2 class="text-xl font-bold">I. General information</h2>

      <p class="text-sm leading-relaxed">
        In compliance with the information duty set out in Law 34/2002 of July 11 on Information
        Society Services and Electronic Commerce (LSSI-CE), the following general information about
        this website is provided:
      </p>

      <p class="text-sm leading-relaxed">
        Ownership of this website, creup.es and associated subdomains (hereinafter, the Website),
        belongs to COORDINADORA DE REPRESENTANTES DE ESTUDIANTES DE UNIVERSIDADES PÚBLICAS, holder
        of tax ID number G95324281 and registered in the National Register of Associations under
        number 171330. Contact details:
      </p>

      <UCard variant="subtle">
        <div class="flex flex-col gap-3 text-sm">
          <div class="flex items-start gap-2">
            <UIcon name="i-tabler-map-pin" class="text-primary mt-0.5 size-4 shrink-0" />
            <span
              >Edificio de Estudiantes, Avenida Complutense S/N, Moncloa - Aravaca, 28040, Madrid
              (Madrid), Spain</span
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

    <!-- II. GENERAL TERMS AND CONDITIONS OF USE -->
    <section id="terms" class="space-y-4">
      <h2 class="text-xl font-bold">II. General terms and conditions of use</h2>

      <h3 class="text-base font-semibold">Purpose of the terms: the Website</h3>

      <p class="text-sm leading-relaxed">
        The purpose of these General Terms of Use (hereinafter, the Terms) is to regulate access to
        and use of the Website. For the purposes of these Terms, the Website includes the external
        appearance of screen interfaces, whether static or dynamic, the navigation tree, all
        integrated elements (hereinafter, Content), and all online services or resources that may be
        made available to Users (hereinafter, Services).
      </p>

      <p class="text-sm leading-relaxed">
        CREUP reserves the right to modify, at any time and without prior notice, the presentation
        and configuration of the Website and any Content or Services incorporated in it. The User
        acknowledges and accepts that CREUP may interrupt, disable and/or cancel any of these
        elements or access to them at any time.
      </p>

      <p class="text-sm leading-relaxed">
        Access to the Website is free of charge in general, without prejudice to the connection
        costs through the telecommunications network contracted by the User. Use of certain Content
        or Services may require prior subscription or registration.
      </p>

      <h3 class="text-base font-semibold">The User</h3>

      <p class="text-sm leading-relaxed">
        Access, browsing and use of the Website grants the status of User and implies acceptance,
        from the start of browsing, of all Terms established herein, as well as any subsequent
        amendments, without prejudice to mandatory applicable law.
      </p>

      <p class="text-sm leading-relaxed">
        The User assumes responsibility for proper use of the Website. This responsibility includes:
      </p>

      <ul class="list-disc space-y-1 pl-6 text-sm">
        <li>
          Proper use of information, Content and/or Services provided by CREUP, in accordance with
          these Terms, the law, morality and public order.
        </li>
        <li>
          Truthfulness and legality of data provided by the User in forms made available by CREUP to
          access certain Content or Services.
        </li>
      </ul>

      <p class="text-sm leading-relaxed">
        Mere access to this Website does not establish any commercial relationship between CREUP and
        the User.
      </p>

      <p class="text-sm leading-relaxed">
        In compliance with applicable legislation, this Website is intended for all persons who may
        access and/or browse it. The Website is mainly intended for users resident in Spain. If a
        User accesses the Website from another country, they do so under their own responsibility
        and must ensure such access complies with local law.
      </p>
    </section>

    <USeparator />

    <!-- III. ACCESS AND BROWSING: DISCLAIMER -->
    <section id="warranties" class="space-y-4">
      <h2 class="text-xl font-bold">
        III. Access and browsing: disclaimer of warranties and liability
      </h2>

      <p class="text-sm leading-relaxed">
        CREUP does not guarantee continuity, availability or usefulness of the Website, or of the
        Content or Services. CREUP will make every effort for proper operation of the Website, but
        does not guarantee uninterrupted or error-free access.
      </p>

      <p class="text-sm leading-relaxed">
        CREUP does not guarantee that content or software accessible through this Website is
        error-free or will not cause damage to the User's systems (software and hardware). Under no
        circumstances shall CREUP be liable for losses or damages arising from access, browsing or
        use of the Website, including but not limited to damage to IT systems or caused by viruses.
      </p>

      <p class="text-sm leading-relaxed">
        CREUP is also not liable for damages resulting from improper use of this Website, including
        outages, interruptions, or telecommunications failures.
      </p>
    </section>

    <USeparator />

    <!-- IV. PRIVACY POLICY AND DATA PROTECTION -->
    <section id="privacy" class="space-y-4">
      <h2 class="text-xl font-bold">IV. Privacy policy and data protection</h2>

      <p class="text-sm leading-relaxed">
        CREUP undertakes to adopt the technical and organizational measures necessary, according to
        the security level appropriate to the risk of the data collected.
      </p>

      <h3 class="text-base font-semibold">Applicable legal framework</h3>

      <ul class="list-disc space-y-1 pl-6 text-sm">
        <li>Regulation (EU) 2016/679 (GDPR).</li>
        <li>
          Spanish Organic Law 3/2018 on Personal Data Protection and guarantee of digital rights.
        </li>
        <li>Royal Decree 1720/2007 and Law 34/2002 (LSSI-CE), where applicable.</li>
      </ul>

      <h3 class="text-base font-semibold">Data controller identity</h3>

      <p class="text-sm leading-relaxed">
        The data controller is COORDINADORA DE REPRESENTANTES DE ESTUDIANTES DE UNIVERSIDADES
        PÚBLICAS, tax ID G95324281, registered in the National Register of Associations under number
        171330.
      </p>

      <h3 class="text-base font-semibold">Personal data processing record</h3>

      <p class="text-sm leading-relaxed">
        Personal data collected by CREUP through website forms are processed under the controller's
        responsibility to handle inquiries, manage newsletter subscriptions, maintain the
        relationship with users and comply with applicable obligations. Information about the
        Spanish supervisory authority is available at
        <a
          href="https://www.aepd.es"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline underline-offset-2 hover:no-underline"
          >aepd.es</a
        >.
      </p>

      <h3 class="text-base font-semibold">Principles applicable to personal data processing</h3>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <UCard
          v-for="principle in [
            'Lawfulness, fairness and transparency',
            'Purpose limitation',
            'Data minimization',
            'Accuracy',
            'Storage limitation',
            'Integrity and confidentiality',
            'Accountability',
          ]"
          :key="principle"
          variant="subtle"
          :ui="{ body: 'p-3' }"
        >
          <div class="flex items-center gap-2 text-sm">
            <UIcon name="i-tabler-check" class="text-primary size-4 shrink-0" />
            <span>{{ principle }}</span>
          </div>
        </UCard>
      </div>

      <h3 class="text-base font-semibold">Categories of personal data</h3>

      <p class="text-sm leading-relaxed">
        The categories of data processed by CREUP are identification data only. No special
        categories of data are processed within the meaning of Article 9 GDPR.
      </p>

      <h3 class="text-base font-semibold">Legal basis for processing</h3>

      <p class="text-sm leading-relaxed">
        The legal basis depends on the specific purpose. For the newsletter, the legal basis is the
        data subject's consent, obtained through a clear affirmative action and confirmed through a
        double opt-in process. For the contact form, the legal basis is handling the request sent by
        the data subject and, where applicable, taking steps requested by the data subject before
        entering into a relationship.
      </p>

      <h3 class="text-base font-semibold">Processing purposes</h3>

      <p class="text-sm leading-relaxed">
        Personal data are collected and managed to respond to requests and inquiries, facilitate the
        relationship with users and, where explicit consent exists, manage newsletter subscriptions
        and send related communications.
      </p>

      <h3 class="text-base font-semibold">Retention periods</h3>

      <p class="text-sm leading-relaxed">
        Personal data are retained only for the time necessary for the relevant purpose. Messages
        sent through the contact form are kept in the corporate mailbox for the time needed to
        handle the inquiry and, where applicable, for legally required periods. Newsletter data are
        retained while the subscription remains active. After unsubscribing, CREUP keeps a minimal
        suppression record to prevent unwanted future mailings and to handle potential incidents or
        complaints.
      </p>

      <h3 class="text-base font-semibold">Recipients of personal data</h3>

      <p class="text-sm leading-relaxed">
        Personal data are not disclosed to third parties, except where legally required.
      </p>

      <h3 class="text-base font-semibold">Data of minors</h3>

      <p class="text-sm leading-relaxed">
        In accordance with applicable law, minors under 14 require consent from parents or legal
        guardians for lawful processing of personal data.
      </p>

      <h3 class="text-base font-semibold">Confidentiality and security</h3>

      <p class="text-sm leading-relaxed">
        CREUP undertakes to implement appropriate technical and organizational measures to ensure
        personal data security and confidentiality. The Website uses SSL/TLS encryption for data
        transmission.
      </p>

      <h3 class="text-base font-semibold">Rights of data subjects</h3>

      <p class="text-sm leading-relaxed">Users may exercise the following rights under GDPR:</p>

      <ul class="list-disc space-y-1 pl-6 text-sm">
        <li>Right of access.</li>
        <li>Right to rectification.</li>
        <li>Right to erasure (right to be forgotten).</li>
        <li>Right to restriction of processing.</li>
        <li>Right to data portability.</li>
        <li>Right to object.</li>
        <li>Right not to be subject to decisions based solely on automated processing.</li>
      </ul>

      <p class="text-sm leading-relaxed">
        Rights can be exercised by written communication to the data controller, with reference
        "RGPD-creup.es", including identity details, specific request, date and signature, and
        supporting documentation.
      </p>

      <UCard variant="subtle">
        <div class="flex flex-col gap-3 text-sm">
          <div class="flex items-start gap-2">
            <UIcon name="i-tabler-map-pin" class="text-primary mt-0.5 size-4 shrink-0" />
            <span
              >Colegio de Sta Mª Catalina Callejón de Sta Mª S/N 28801 Alcalá de Henares (Madrid),
              Spain</span
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

      <h3 class="text-base font-semibold">Third-party websites</h3>

      <p class="text-sm leading-relaxed">
        The Website may contain links to third-party websites not operated by CREUP. Those third
        parties have their own privacy and cookie policies and are responsible for their own data
        files and practices.
      </p>

      <h3 class="text-base font-semibold">Complaints to supervisory authority</h3>

      <p class="text-sm leading-relaxed">
        If a User believes data processing infringes applicable law, they may file a complaint with
        the Spanish Data Protection Agency:
        <a
          href="https://www.aepd.es"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary underline underline-offset-2 hover:no-underline"
          >aepd.es</a
        >.
      </p>

      <h3 class="text-base font-semibold">Acceptance and changes</h3>

      <p class="text-sm leading-relaxed">
        Use of the Website implies acceptance of this Privacy Policy. CREUP reserves the right to
        amend this policy due to legal, jurisprudential or organizational changes.
      </p>
    </section>

    <USeparator />

    <!-- V. COOKIE POLICY -->
    <section id="cookies" class="space-y-4">
      <h2 class="text-xl font-bold">V. Cookie policy</h2>

      <p class="text-sm leading-relaxed">
        Access to this Website involves the use of cookies and browser local storage. Cookies are
        small information files stored in the User's browser to improve navigation and user
        experience.
      </p>

      <h3 class="text-base font-semibold">Cookies used on this website</h3>

      <!-- Essential cookies card -->
      <UCard variant="subtle">
        <template #header>
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold">Essential cookies</p>
            <UBadge color="primary" variant="subtle" size="sm">Always active</UBadge>
          </div>
        </template>

        <div class="space-y-3 text-sm">
          <p class="text-muted">
            Cookies strictly necessary for the operation of the website. These cannot be disabled.
          </p>

          <div class="divide-default space-y-2 divide-y">
            <div class="pt-2 first:pt-0">
              <p class="font-medium">Language cookie (<code class="text-xs">user-locale</code>)</p>
              <p class="text-muted text-xs">
                Stores the language selected by the User to maintain the preference between
                sessions. Duration: 1 year.
              </p>
            </div>
            <div class="pt-2">
              <p class="font-medium">
                Consent cookie (<code class="text-xs">cookie-consent</code>)
              </p>
              <p class="text-muted text-xs">
                Records the User's cookie consent preferences. Duration: 1 year.
              </p>
            </div>
            <div class="pt-2">
              <p class="font-medium">Authentication and session cookies (better-auth)</p>
              <p class="text-muted text-xs">
                Used exclusively when an administrator signs in to the administration panel.
                Includes session tokens and OAuth authentication. Not used for public site visitors.
              </p>
            </div>
            <div class="pt-2">
              <p class="font-medium">Interface preference local storage</p>
              <p class="text-muted text-xs">
                Browser local storage (localStorage) is used to remember interface preferences such
                as color mode (<code class="text-xs">nuxt-color-mode</code>) and accessibility
                options (<code class="text-xs">nuxt-a11y-*</code>). This information is not
                transmitted to the server and remains only on the User's device.
              </p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Analytics cookies card -->
      <UCard variant="subtle">
        <template #header>
          <div class="flex items-center justify-between">
            <p class="text-sm font-semibold">Analytics cookies</p>
            <UBadge color="neutral" variant="subtle" size="sm">Consent required</UBadge>
          </div>
        </template>

        <div class="space-y-3 text-sm">
          <p class="text-muted">
            These cookies allow us to measure website usage in an aggregated and anonymous way to
            improve its performance.
          </p>

          <div>
            <p class="font-medium">Umami Analytics</p>
            <p class="text-muted text-xs">
              We use Umami, a privacy-focused web analytics solution. Umami does not use persistent
              cookies, does not collect personally identifiable data, does not perform cross-site
              tracking, and all data is stored in an aggregated and anonymized form. Users can
              enable or disable this category at any time through the cookie preferences.
            </p>
          </div>
        </div>
      </UCard>

      <h3 class="text-base font-semibold">Consent management</h3>

      <p class="text-sm leading-relaxed">
        When visiting this website for the first time, a cookie notice is displayed that allows you
        to accept all categories, accept only essential cookies, or customize preferences
        individually. You can change your preferences at any time using the "Cookie preferences"
        link in the website footer.
      </p>

      <h3 class="text-base font-semibold">Third-party and social media cookies</h3>

      <p class="text-sm leading-relaxed">
        This Website may include links to external services (for example, social media). If the User
        accesses those services, the relevant third parties are responsible for their own cookies
        and data processing.
      </p>

      <h3 class="text-base font-semibold">Disabling, rejecting and deleting cookies</h3>

      <p class="text-sm leading-relaxed">
        Users may disable, reject or delete cookies through browser settings. If technical cookies
        are blocked, some website functionalities may not be available.
      </p>

      <h3 class="text-base font-semibold">Changes to the Cookie Policy</h3>

      <p class="text-sm leading-relaxed">
        This Cookie Policy may be modified or updated; users are advised to review it periodically.
      </p>
    </section>

    <USeparator />

    <!-- VI. LINKS POLICY -->
    <section id="links" class="space-y-4">
      <h2 class="text-xl font-bold">VI. Links policy</h2>

      <p class="text-sm leading-relaxed">
        CREUP may provide users with links, directories and search tools that allow access to
        third-party websites. Their purpose is to facilitate access to information available on the
        internet.
      </p>

      <p class="text-sm leading-relaxed">
        CREUP does not market products/services from linked websites and does not guarantee their
        technical availability, accuracy, truthfulness, validity or legality.
      </p>

      <p class="text-sm leading-relaxed">
        CREUP assumes no liability for damages arising from access, use, quality or legality of
        content, communications, opinions, products or services on websites not managed by CREUP.
      </p>

      <p class="text-sm leading-relaxed">
        Any User or third party creating a hyperlink from another website to CREUP's Website must
        know that:
      </p>

      <ul class="list-disc space-y-1 pl-6 text-sm">
        <li>
          Total or partial reproduction of Website content/services is not allowed without express
          authorization.
        </li>
        <li>
          False, inaccurate or incorrect statements about CREUP or its Website are not allowed.
        </li>
        <li>
          Creating a hyperlink does not imply any relationship between CREUP and the linking website
          owner.
        </li>
      </ul>
    </section>

    <USeparator />

    <!-- VII. INTELLECTUAL AND INDUSTRIAL PROPERTY -->
    <section id="intellectual-property" class="space-y-4">
      <h2 class="text-xl font-bold">VII. Intellectual and industrial property</h2>

      <p class="text-sm leading-relaxed">
        CREUP, by itself or as assignee, owns all intellectual and industrial property rights to the
        Website and its elements (including, among others, texts, images, logos, design and
        software). All rights reserved.
      </p>

      <p class="text-sm leading-relaxed">
        Reproduction, distribution and public communication, including making available all or part
        of website content for commercial purposes, are expressly prohibited without CREUP's
        authorization.
      </p>

      <p class="text-sm leading-relaxed">
        If a User or third party believes any Website content infringes intellectual property
        rights, they must immediately notify CREUP using the contact details in the GENERAL
        INFORMATION section.
      </p>
    </section>

    <USeparator />

    <!-- VIII. LEGAL ACTIONS -->
    <section id="legal-actions" class="space-y-4">
      <h2 class="text-xl font-bold">VIII. Legal actions, applicable law and jurisdiction</h2>

      <p class="text-sm leading-relaxed">
        CREUP reserves the right to bring civil or criminal actions it deems appropriate in cases of
        misuse of the Website and its content or breach of these Terms.
      </p>

      <p class="text-sm leading-relaxed">
        The relationship between the User and CREUP is governed by Spanish law. Any dispute
        regarding interpretation and/or application of these Terms shall be submitted to the
        ordinary jurisdiction of the competent courts.
      </p>

      <p class="text-muted text-sm">
        <strong>Last updated: February 13, 2026</strong>
      </p>
    </section>
  </article>
</template>
