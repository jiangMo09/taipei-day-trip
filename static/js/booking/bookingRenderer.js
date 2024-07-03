import { decodeJWT } from "../utils/decodeJwt.js";
import { fetchData } from "../utils/fetchData.js";

export const renderBooking = async (authToken, websocket = false) => {
  if (!authToken) return;

  try {
    const { data } = await fetchData("/api/booking", {
      headers: { authToken }
    });

    const userInfo = decodeJWT(authToken);
    updateUserInfo(userInfo);
    renderBookingData(data, websocket);
  } catch (error) {
    console.error("Failed to render booking:", error);
  }
};

const updateUserInfo = ({ name, email }) => {
  document.querySelector(".user-name").textContent = name;
  document.querySelector("#contact-name").value = name;
  document.querySelector("#contact-email").value = email;
};

const renderBookingData = (data, websocket) => {
  const schedulesContainer = document.querySelector(".schedules");
  const elements = getElements();

  if (!data || data.length === 0) {
    renderNoBookings(schedulesContainer, elements);
    return;
  }

  if (websocket && schedulesContainer.innerHTML) {
    schedulesContainer.innerHTML = "";
    showBookingElements(elements);
  }

  let totalCost = 0;
  data.forEach((item) => {
    const scheduleElement = createScheduleElement(item);
    schedulesContainer.appendChild(scheduleElement);
    totalCost += item.price;
  });

  document.querySelector(".total-cost").textContent = totalCost;
};

const getElements = () => ({
  contact: document.querySelector(".contact"),
  payment: document.querySelector(".credit-card-payment"),
  confirmOrder: document.querySelector(".confirm-order"),
  footer: document.querySelector("footer"),
  hr: document.querySelectorAll("hr")
});

const renderNoBookings = (container, elements) => {
  const noBookingsMessage = document.createElement("div");
  noBookingsMessage.textContent = "目前沒有任何待預訂的行程";
  container.appendChild(noBookingsMessage);

  hideBookingElements(elements);
};

const createScheduleElement = (item) => {
  const scheduleElement = document.createElement("div");
  scheduleElement.classList.add("schedule");
  scheduleElement.innerHTML = `
    <div class="image">
      <img src="${item.attraction.image}" alt="${item.attraction.name}" />
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
        <img src="/static/images/delete.svg" alt="Delete" />
      </div>
    </div>
  `;
  return scheduleElement;
};

const showBookingElements = (elements) => {
  Object.values(elements).forEach((el) => {
    if (el instanceof NodeList) {
      el.forEach((item) => (item.style.display = "")); //多個元素
    } else {
      el.style.display = ""; //單個元素
    }
  });
  elements.footer.style.position = "";
};

const hideBookingElements = (elements) => {
  Object.values(elements).forEach((el) => {
    if (el instanceof NodeList) {
      el.forEach((item) => (item.style.display = "none"));
    } else {
      el.style.display = "none";
    }
  });
  elements.footer.style.position = "fixed";
  elements.footer.style.bottom = 0;
};
