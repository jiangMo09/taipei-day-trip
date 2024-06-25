import { fetchData } from "../utils/fetchData.js";
import { decodeJWT } from "../utils/decodeJwt.js";

const deleteBooking = async (bookingId) => {
  const authToken = localStorage.getItem("authToken");
  if (!authToken) {
    return;
  }

  try {
    const { error, message } = await fetchData(`/api/booking/${bookingId}`, {
      method: "DELETE",
      headers: { authToken }
    });

    if (error) {
      alert(message);
      return;
    }
    location.reload();
  } catch (error) {
    console.error("刪除預訂失敗:", error);
  }
};

const renderBooking = async () => {
  const authToken = localStorage.getItem("authToken");
  if (!authToken) {
    return;
  }

  const decodedPayload = decodeJWT(authToken);
  try {
    const { data } = await fetchData("/api/booking", {
      headers: { authToken }
    });

    document.querySelector(".user-name").textContent = decodedPayload.name;
    document.querySelector("#contact-name").value = decodedPayload.name;
    document.querySelector("#contact-email").value = decodedPayload.email;

    const schedulesContainer = document.querySelector(".schedules");
    const contactContainer = document.querySelector(".contact");
    const paymentContainer = document.querySelector(".credit-card-payment");
    const confirmOrderContainer = document.querySelector(".confirm-order");
    const hrElements = document.querySelectorAll("hr");
    const footerElements = document.querySelector("footer");

    if (!data || data.length === 0) {
      const noBookingsMessage = document.createElement("div");
      noBookingsMessage.textContent = "目前沒有任何待預訂的行程";
      schedulesContainer.appendChild(noBookingsMessage);

      contactContainer.style.display = "none";
      paymentContainer.style.display = "none";
      confirmOrderContainer.style.display = "none";
      footerElements.style.position = "fixed";
      footerElements.style.bottom = 0;
      hrElements.forEach((hr) => (hr.style.display = "none"));
      return;
    }
    let totalCost = 0;
    data.forEach((item) => {
      const scheduleElement = document.createElement("div");
      scheduleElement.classList.add("schedule");
      totalCost += item.price;

      scheduleElement.innerHTML = `
        <div class="image">
          <img src="${item.attraction.image}" />
        </div>
        <div class="info">
          <div class="detail">
            <div class="title font-weight-700">
              <div>
                <span>台北一日遊：</span>
                <span class="attraction">${item.attraction.name}</span>
              </div>
            </div>
            <div class="date">
              <span class="font-weight-700">日期：</span>
              <span class="date-value">${item.date}</span>
            </div>
            <div class="time">
              <span class="font-weight-700">時間：</span>
              <span class="time-value">${item.time}</span>
            </div>
            <div class="cost">
              <span class="font-weight-700">費用：</span>
              <span class="cost-value">${item.price}</span>
            </div>
            <div class="place">
              <span class="font-weight-700">地點：</span>
              <span class="place-value">${item.attraction.address}</span>
            </div>
          </div>
          <div class="delete" data-item-id="${item.id}">
            <img src="/static/images/delete.svg" />
          </div>
        </div>
      `;

      schedulesContainer.appendChild(scheduleElement);
    });
    document.querySelector(".total-cost").textContent = totalCost;
    document.querySelectorAll(".delete").forEach((deleteButton) => {
      const itemId = deleteButton.dataset.itemId;
      deleteButton.addEventListener("click", () => deleteBooking(itemId));
    });
  } catch (error) {
    console.error(error);
  }
};

window.addEventListener("load", renderBooking);
