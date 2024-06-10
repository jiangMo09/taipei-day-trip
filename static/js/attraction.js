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

  return data;
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
});

window.onArrowRightClick = onArrowRightClick;
window.onArrowLeftClick = onArrowLeftClick;
