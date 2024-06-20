const CDN_URL = "https://dal3kbb5hx215.cloudfront.net/";

export const spellCdnUrl = (url) => {
  const parts = url.split("/");
  return CDN_URL + parts[parts.length - 1];
};
