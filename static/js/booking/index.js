import { fetchData } from "../utils/fetchData.js";
import { decodeJWT } from "../utils/decodeJwt.js";
const renderBooking = async () => {
  const authToken = localStorage.getItem("authToken");
  if (!authToken) return false;
  const decodedPayload = decodeJWT(authToken);
  try {
    const { data } = await fetchData("/api/booking", {
      headers: { authToken }
    });

    document.querySelector(".user-name").textContent = decodedPayload.name;
    document.querySelector("#contact-name").value = decodedPayload.name;
    document.querySelector("#contact-email").value = decodedPayload.email;

    const schedulesContainer = document.querySelector(".schedules");

    data.forEach((item) => {
      const scheduleElement = document.createElement("div");
      scheduleElement.classList.add("schedule");

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
          <div class="delete">
            <img src="/static/images/delete.svg" />
          </div>
        </div>
      `;

      schedulesContainer.appendChild(scheduleElement);
    });
  } catch (error) {
    console.error(error);
  }
};

window.addEventListener("load", renderBooking);
