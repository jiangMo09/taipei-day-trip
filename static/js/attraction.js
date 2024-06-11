import { fetchData } from "./utils/fetchData.js";
import { createState } from "./utils/createState.js";

const currentImageIndex = createState(0);
const imagesCount = createState(0);
const MORNING_COST = 2000;
const AFTERNOON_COST = 2500;

const appendImage = (src, index, imagesDiv) => {
  const img = document.createElement("img");
  img.src = src;
  img.className = `image image-${index}`;
  imagesDiv.appendChild(img);
};

const appendCircles = (imagesDiv, circlesCount) => {
  const circlesDiv = document.createElement("div");
  circlesDiv.className = "circles";

  for (let i = 0; i < circlesCount; i++) {
    const circle = document.createElement("span");
    circle.className = `circle circle-${i} ${i === 0 ? "active" : ""}`;
    circlesDiv.appendChild(circle);
  }

  imagesDiv.appendChild(circlesDiv);
};

const appendBooking = (bookingDiv, { name, category, mrt }) => {
  bookingDiv.innerHTML = `
    <div class="title">${name}</div>
    <div class="type">
      <span class="category">${category}</span> at <span class="mrt">${mrt}</span>
    </div>
    <div class="tour">
      <div class="title">訂購導覽行程</div>
      <div class="description">以此景點為中心的一日行程，帶您探索城市角落故事</div>
      <div class="date">
        選擇日期：<input type="date" /><img class="icon-calendar" src="/static/images/icon-calendar.svg" />
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

const appendInfo = (bottomDiv, { description, address, transport }) => {
  bottomDiv.innerHTML = `
    <div class="info">${description}</div>
    <div class="address"><div class="title">景點地址：</div>${address}</div>
    <div class="transport"><div class="title">交通方式：</div>${transport}</div>
  `;
};

const getAttraction = async () => {
  const apiPath = "/api" + window.location.pathname;
  const imagesDiv = document.querySelector(".images");
  const bookingDiv = document.querySelector(".booking");
  const bottomDiv = document.querySelector(".bottom");

  try {
    const { data, error } = await fetchData(apiPath);

    if (error) {
      alert(attraction.message);
      window.location.href = "/";
      return;
    }

    const { images, name, category, mrt, description, address, transport } =
      data;

    images.forEach((src, index) => appendImage(src, index, imagesDiv));
    imagesCount.setState(images.length);

    appendCircles(imagesDiv, images.length);
    appendBooking(bookingDiv, { name, category, mrt });
    appendInfo(bottomDiv, { description, address, transport });
  } catch (error) {
    alert(error.message);
    window.location.href = "/";
  }
};

const updateImageDisplay = () => {
  const images = document.querySelectorAll(".image");
  const circles = document.querySelectorAll(".circle");
  const currentIndex = currentImageIndex.getState();

  images.forEach((img, index) => {
    img.style.display = index === currentIndex ? "block" : "none";
    circles[index].classList.toggle("active", index === currentIndex);
  });
};

const onArrowRightClick = () => {
  const newIndex = (currentImageIndex.getState() + 1) % imagesCount.getState();
  currentImageIndex.setState(newIndex);
  updateImageDisplay();
};

const onArrowLeftClick = () => {
  const newIndex =
    (currentImageIndex.getState() - 1 + imagesCount.getState()) %
    imagesCount.getState();
  currentImageIndex.setState(newIndex);
  updateImageDisplay();
};

window.addEventListener("load", async () => {
  await getAttraction();

  const costAmount = document.getElementById("cost-amount");
  document.querySelector(".time").addEventListener("change", (event) => {
    costAmount.textContent =
      event.target.value === "morning" ? MORNING_COST : AFTERNOON_COST;
  });
});

window.onArrowRightClick = onArrowRightClick;
window.onArrowLeftClick = onArrowLeftClick;
