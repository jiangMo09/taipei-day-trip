export const fetchData = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error(`Error fetching ${url}:`, err);
    alert("遇到了某些問題，請聯繫工程師");
  }
};
