export const loadHeader = async () => {
  const response = await fetch("https://dal3kbb5hx215.cloudfront.net/static/share/header.html");
  const html = await response.text();
  document.body.insertAdjacentHTML("afterbegin", html);
};
