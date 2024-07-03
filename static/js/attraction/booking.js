import { fetchData } from "../utils/fetchData.js";
import { handleLoginRegister } from "../share/loginRegister.js";
import { isLoggedIn } from "../share/user.js";

const MORNING_COST = 2000;
const AFTERNOON_COST = 2500;

const createBookingHTML = (name, category, mrt) => `
  <div class="title">${name}</div>
  <div class="type">
    <span class="category">${category}</span> at <span class="mrt">${mrt}</span>
  </div>
  <div class="tour">
    <div class="title">訂購導覽行程</div>
    <div class="description">以此景點為中心的一日行程，帶您探索城市角落故事</div>
    <div class="date">
      選擇日期：<input id="dateInput" type="date" />
    </div>
    <div class="time">
      選擇時間：
      <label class="custom-radio">
        <input  id="morningRadio" type="radio" name="time" value="morning" checked />
        <span class="radio-checkmark"></span>
        <span class="label-text">上半天</span>
      </label>
      <label class="custom-radio">
        <input id="afternoonRadio" type="radio" name="time" value="afternoon" />
        <span class="radio-checkmark"></span>
        <span class="label-text">下半天</span>
      </label>
    </div>
    <div class="cost">導覽費用：新台幣 <span id="cost-amount">${MORNING_COST}</span> 元</div>
    <div class="btn" id="attractionBookingBtn">開始預約行程</div>
  </div>
`;

export const booking = async ({ bookingDiv, name, category, mrt }) => {
  bookingDiv.innerHTML = createBookingHTML(name, category, mrt);

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
    const attractionId = window.location.pathname.split("/")[2];
    const date = document.getElementById("dateInput").value;
    const morningRadio = document.getElementById("morningRadio").checked;
    const time = morningRadio ? "morning" : "afternoon";
    const price = morningRadio ? 2000 : 2500;

    if (!authToken) {
      alert("authToken 無效或不存在，請重新登入");
      return;
    }

    if (!attractionId || isNaN(attractionId)) {
      alert("景點無效或不存在");
      return;
    }

    if (!date || new Date(date) <= new Date()) {
      alert("日期未選擇、無效或是過去時間");
      return;
    }

    const data = await fetchData("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json", authToken: authToken },
      body: JSON.stringify({
        attractionId: attractionId,
        date: date,
        time: time,
        price: price
      })
    });

    if (data.error) {
      alert(data.message);
      return;
    }
    alert("預訂成功！請查看您的預訂頁面。");
    return;
  };

  const updateCost = (event) => {
    const costAmount = bookingDiv.querySelector("#cost-amount");
    costAmount.textContent =
      event.target.value === "morning" ? MORNING_COST : AFTERNOON_COST;
  };

  attractionBookingBtn.addEventListener("click", handleBooking);
  timeRadios.forEach((radio) => radio.addEventListener("change", updateCost));
};
