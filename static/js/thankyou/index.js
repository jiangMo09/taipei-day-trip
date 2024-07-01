import { fetchData } from "../utils/fetchData.js";

window.addEventListener("load", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const orderNumber = urlParams.get("number");

  if (!orderNumber) {
    return;
  }

  const authToken = localStorage.getItem("authToken");
  if (!authToken) {
    return;
  }

  const { data } = await fetchData(`/api/order/${orderNumber}`, {
    headers: { authToken }
  });

  const orderNumberElement = document.querySelector(".order-number");
  orderNumberElement.textContent = data.number;
});
