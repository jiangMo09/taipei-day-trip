import { fetchData } from "../utils/fetchData.js";
import { handleLoginRegister } from "../share/loginRegister.js";
import { createState } from "../utils/createState.js";

const MORNING_COST = 2000;
const AFTERNOON_COST = 2500;

const isLoggedIn = createState(false);

const checkLoginStatus = async () => {
  const authToken = localStorage.getItem("authToken");
  if (!authToken) return false;

  try {
    const data = await fetchData("/api/user/auth", {
      headers: { authToken }
    });
    return data.data !== null;
  } catch (error) {
    console.error("Error checking login status:", error);
    return false;
  }
};

const createBookingHTML = (name, category, mrt) => `
  <div class="title">${name}</div>
  <div class="type">
    <span class="category">${category}</span> at <span class="mrt">${mrt}</span>
  </div>
  <div class="tour">
    <div class="title">訂購導覽行程</div>
    <div class="description">以此景點為中心的一日行程，帶您探索城市角落故事</div>
    <div class="date">
      選擇日期：<input type="date" />
    </div>
    <div class="time">
      選擇時間：
      <label class="custom-radio">
        <input type="radio" name="time" value="morning" checked />
        <span class="radio-checkmark"></span>
        <span class="label-text">上半天</span>
      </label>
      <label class="custom-radio">
        <input type="radio" name="time" value="afternoon" />
        <span class="radio-checkmark"></span>
        <span class="label-text">下半天</span>
      </label>
    </div>
    <div class="cost">導覽費用：新台幣 <span id="cost-amount">${MORNING_COST}</span> 元</div>
    <div class="btn" id="attractionBookingBtn">開始預約行程</div>
  </div>
`;

export const Booking = async ({ bookingDiv, name, category, mrt }) => {
  bookingDiv.innerHTML = createBookingHTML(name, category, mrt);

  const loginStatus = await checkLoginStatus();
  isLoggedIn.setState(loginStatus);

  const loginRegister = document.getElementById("login-register");
  const loginDialog = document.getElementById("loginDialog");
  const attractionBookingBtn = bookingDiv.querySelector(
    "#attractionBookingBtn"
  );
  const timeRadios = bookingDiv.querySelectorAll('input[name="time"]');

  const handleBooking = async () => {
    if (!isLoggedIn.getState()) {
      handleLoginRegister(loginRegister, loginDialog, true);
      return;
    }

    const authToken = localStorage.getItem("authToken");
    const data = await fetchData("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json", authToken: authToken },
      body: JSON.stringify({
        attractionId: 10,
        date: "2022-01-31",
        time: "afternoon",
        price: 2500
      })
    });
  };

  const updateCost = (event) => {
    const costAmount = bookingDiv.querySelector("#cost-amount");
    costAmount.textContent =
      event.target.value === "morning" ? MORNING_COST : AFTERNOON_COST;
  };

  attractionBookingBtn.addEventListener("click", handleBooking);
  timeRadios.forEach((radio) => radio.addEventListener("change", updateCost));
};
