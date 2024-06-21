export const loadHeader = async () => {
  const response = await fetch("/static/share/header.html");
  const html = await response.text();
  document.body.insertAdjacentHTML("afterbegin", html);
};
