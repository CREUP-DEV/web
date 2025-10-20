export const useSocials = () => {
  const { t } = useI18n();

  return computed(() => [
    {
      label: t("social.instagram"),
      icon: "tabler-brand-instagram",
      to: "https://www.instagram.com/CREUPCREUP",
    },
    {
      label: t("social.tiktok"),
      icon: "tabler-brand-tiktok",
      to: "https://www.tiktok.com/@creupestudiantes",
    },
    {
      label: t("social.x"),
      icon: "tabler-brand-x",
      to: "https://x.com/CREUPCREUP",
    },
    {
      label: t("social.linkedin"),
      icon: "tabler-brand-linkedin",
      to: "https://www.linkedin.com/company/creup",
    },
    {
      label: t("social.facebook"),
      icon: "tabler-brand-facebook",
      to: "https://www.facebook.com/CREUPCREUP",
    },
    {
      label: t("social.telegram"),
      icon: "tabler-brand-telegram",
      to: "https://telegram.me/CREUP",
    },
  ]);
};
