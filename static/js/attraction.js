import { fetchData } from "./utils/fetchData.js";

const appendImage = (src, index, imagesDiv) => {
  const img = document.createElement("img");
  img.src = src;
  img.className = `image image-${index}`;
  imagesDiv.appendChild(img);
};

const appendCircles = (imagesDiv,circlesCount) => {
  const circlesDiv = document.createElement("div");
  circlesDiv.className = "circles";

  for (let i = 0; i < circlesCount; i++) {
    const circle = document.createElement("span");
    circle.className = `circle circle-${i}`;
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
  appendCircles(imagesDiv, images.length);

  return data;
};

window.addEventListener("load", function () {
  getAttraction();
});
