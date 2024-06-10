import { fetchData } from "./utils/fetchData.js";
import { createState } from "./utils/createState.js";

const currentImageIndex = createState(0);
const imagesCount = createState(0);

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
    const active = i == 0;
    circle.className = `circle circle-${i} ${active ? "active" : ""}`;
    circlesDiv.appendChild(circle);
  }

  imagesDiv.appendChild(circlesDiv);
};

const appendBooking = (bookingDiv, data) => {
  const { name, category, mrt } = data;
  const titleDiv = document.createElement("div");
  titleDiv.className = "title";
  titleDiv.textContent = name;
  bookingDiv.appendChild(titleDiv);

  const typeDiv = document.createElement("div");
  typeDiv.className = "type";
  typeDiv.innerHTML = `<span class="category">${category}</span> at <span class="mrt">${mrt}</span>`;
  bookingDiv.appendChild(typeDiv);

  const tourDiv = document.createElement("div");
  tourDiv.className = "tour";

  const tourTitleDiv = document.createElement("div");
  tourTitleDiv.className = "title";
  tourTitleDiv.textContent = "訂購導覽行程";
  tourDiv.appendChild(tourTitleDiv);

  const descriptionDiv = document.createElement("div");
  descriptionDiv.className = "description";
  descriptionDiv.textContent = "以此景點為中心的一日行程，帶您探索城市角落故事";
  tourDiv.appendChild(descriptionDiv);

  const dateDiv = document.createElement("div");
  dateDiv.className = "date";
  dateDiv.innerHTML =
    '選擇日期：<input type="date" /><img class="icon-calendar" src="/static/images/icon-calendar.svg" />';
  tourDiv.appendChild(dateDiv);

  const timeDiv = document.createElement("div");
  timeDiv.className = "time";
  timeDiv.innerHTML = `
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
`;
  tourDiv.appendChild(timeDiv);

  const costDiv = document.createElement("div");
  costDiv.className = "cost";
  costDiv.innerHTML = '導覽費用：新台幣 <span id="cost-amount">2000</span> 元';
  tourDiv.appendChild(costDiv);

  const btnDiv = document.createElement("div");
  btnDiv.className = "btn";
  btnDiv.textContent = "開始預約行程";
  tourDiv.appendChild(btnDiv);

  bookingDiv.appendChild(tourDiv);
};

const appendInfo = (bottomDiv, data) => {
  const { description, address, transport } = data;

  const infoDiv = document.createElement("div");
  infoDiv.className = "info";
  infoDiv.textContent = description;
  bottomDiv.appendChild(infoDiv);

  const addressDiv = document.createElement("div");
  addressDiv.className = "address";
  addressDiv.innerHTML = `<div class="title">景點地址：</div>${address}`;
  bottomDiv.appendChild(addressDiv);

  const transportDiv = document.createElement("div");
  transportDiv.className = "transport";
  transportDiv.innerHTML = `<div class="title">交通方式：</div>${transport}`;
  bottomDiv.appendChild(transportDiv);

  bottomDiv.appendChild(bottomDiv);
};

const getAttraction = async () => {
  const apiPath = "/api" + window.location.pathname;
  const attraction = await fetchData(apiPath);
  const { data, error } = attraction;

  if (error) {
    alert(attraction.message);
    window.location.href = "/";
    return;
  }

  const images = data.images;
  const imagesDiv = document.querySelector(".images");

  images.forEach((src, index) => {
    appendImage(src, index, imagesDiv);
  });

  imagesCount.setState(images.length);
  appendCircles(imagesDiv, images.length);

  const bookingDiv = document.querySelector(".booking");
  appendBooking(bookingDiv, {
    name: data.name,
    category: data.category,
    mrt: data.mrt
  });

  const bottomDiv = document.querySelector(".bottom");
  appendInfo(bottomDiv, {
    description: data.description,
    address: data.address,
    transport: data.transport
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

const updateImageDisplay = () => {
  const images = document.querySelectorAll(".image");
  const circles = document.querySelectorAll(".circle");
  const currentIndex = currentImageIndex.getState();

  images.forEach((img, index) => {
    img.style.display = index === currentIndex ? "block" : "none";
    circles[index].classList.toggle("active", index === currentIndex);
  });
};

window.addEventListener("load", function () {
  getAttraction();

  const costAmount = document.getElementById("cost-amount");
  const timeRadios = document.querySelectorAll('input[name="time"]');

  timeRadios.forEach((radio) => {
    radio.addEventListener("change", (event) => {
      if (event.target.value === "morning") {
        costAmount.textContent = "2000";
      } else if (event.target.value === "afternoon") {
        costAmount.textContent = "2500";
      }
    });
  });
});

window.onArrowRightClick = onArrowRightClick;
window.onArrowLeftClick = onArrowLeftClick;
