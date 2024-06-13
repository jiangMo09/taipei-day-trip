const MORNING_COST = 2000;
const AFTERNOON_COST = 2500;

export const Booking = ({ bookingDiv, name, category, mrt }) => {
  const appendBooking = () => {
    bookingDiv.innerHTML = `
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
        <div class="btn">開始預約行程</div>
      </div>
    `;
  };

  const updateCost = (event) => {
    const costAmount = bookingDiv.querySelector("#cost-amount");
    costAmount.textContent =
      event.target.value === "morning" ? MORNING_COST : AFTERNOON_COST;
  };

  appendBooking();
  bookingDiv.querySelector(".time").addEventListener("change", updateCost);
};
