export const fetchData = async (url) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`Error fetching ${url}:`, err);
    alert("遇到了某些問題，請聯繫工程師");
    window.location.href = "/";
  }
};
