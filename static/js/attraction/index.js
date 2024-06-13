import { fetchData } from "../utils/fetchData.js";
import { ImageSlider } from "./ImageSlider.js";
import { Booking } from "./Booking.js";
import { Info } from "./Info.js";

const renderAttraction = async () => {
  const apiPath = "/api" + window.location.pathname;

  try {
    const { data, error } = await fetchData(apiPath);

    if (error) {
      alert(attraction.message);
      window.location.href = "/";
      return;
    }

    const { images, name, category, mrt, description, address, transport } =
      data;

    const imagesDiv = document.querySelector(".images");
    const { onArrowRightClick, onArrowLeftClick } = ImageSlider( {imagesDiv,
      images
    });

    const bookingDiv = document.querySelector(".booking");
    Booking({ bookingDiv,name, category, mrt });

    const bottomDiv = document.querySelector(".bottom");
    Info({ bottomDiv,description, address, transport });

    window.onArrowRightClick = onArrowRightClick;
    window.onArrowLeftClick = onArrowLeftClick;
  } catch (error) {
    alert(error.message);
    window.location.href = "/";
  }
};

window.addEventListener("load", renderAttraction);
