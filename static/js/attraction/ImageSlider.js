import { createState } from "../utils/createState.js";

const currentImageIndex = createState(0);
const imagesCount = createState(0);

export const ImageSlider = ({ imagesDiv, images }) => {
  imagesCount.setState(images.length);

  const appendImage = (src, index) => {
    const isFirst = index === 0;
    const img = document.createElement("img");
    img.src = src;
    img.className = isFirst
      ? `image image-${index} active`
      : `image image-${index}`;
    imagesDiv.appendChild(img);
  };

  const appendCircles = () => {
    const circlesDiv = document.createElement("div");
    circlesDiv.className = "circles";

    for (let i = 0; i < imagesCount.getState(); i++) {
      const circle = document.createElement("span");
      circle.className = `circle circle-${i} ${i === 0 ? "active" : ""}`;
      circle.addEventListener("click", () => {
        currentImageIndex.setState(i);
        updateImageDisplay();
      });

      circlesDiv.appendChild(circle);
    }
    imagesDiv.appendChild(circlesDiv);
  };

  const updateImageDisplay = () => {
    const images = imagesDiv.querySelectorAll(".image");
    const circles = imagesDiv.querySelectorAll(".circle");
    const currentIndex = currentImageIndex.getState();

    images.forEach((img, index) => {
      img.classList.toggle("active", index === currentIndex);
      circles[index].classList.toggle("active", index === currentIndex);
    });
  };

  const onArrowRightClick = () => {
    const newIndex =
      (currentImageIndex.getState() + 1) % imagesCount.getState();
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

  images.forEach(appendImage);
  appendCircles();

  return {
    onArrowRightClick,
    onArrowLeftClick
  };
};
