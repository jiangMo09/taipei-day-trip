import { spellCdnUrl } from "./utils/spellCdnUrl.js";

let nextPage = 0;
let loading = false;
let defaultKeyword = "";

const appendAttraction = (attraction, attractionsDiv) => {
  const attractionLink = document.createElement("a");
  attractionLink.href = `attraction/${attraction.id}`;

  const attractionDiv = document.createElement("div");
  attractionDiv.classList.add("attraction");

  const imageDiv = document.createElement("div");
  imageDiv.classList.add("image");
  imageDiv.style.backgroundImage = `url("${spellCdnUrl(
    attraction.images[0]
  )}")`;

  const nameDiv = document.createElement("div");
  nameDiv.classList.add("name");
  nameDiv.textContent = attraction.name;

  const infoDiv = document.createElement("div");
  infoDiv.classList.add("info");

  const mrtSpan = document.createElement("span");
  mrtSpan.classList.add("mrt");
  mrtSpan.textContent = attraction.mrt;

  const categorySpan = document.createElement("span");
  categorySpan.classList.add("category");
  categorySpan.textContent = attraction.category;

  imageDiv.appendChild(nameDiv);
  infoDiv.appendChild(mrtSpan);
  infoDiv.appendChild(categorySpan);
  attractionDiv.appendChild(imageDiv);
  attractionDiv.appendChild(infoDiv);
  attractionLink.appendChild(attractionDiv);
  attractionsDiv.appendChild(attractionLink);
};

const getAttractions = (keyword) => {
  const attractionsDiv = document.querySelector(".attractions");

  if (keyword) {
    nextPage =
      defaultKeyword === "" || defaultKeyword !== keyword ? 0 : nextPage;

    if (defaultKeyword != keyword) {
      attractionsDiv.innerHTML = "";
    }

    defaultKeyword = keyword;
  }

  const apiPath = keyword
    ? `/api/attractions?page=${nextPage}&keyword=${keyword}`
    : `/api/attractions?page=${nextPage}`;

  loading = true;
  fetch(apiPath)
    .then((response) => response.json())
    .then((data) => {
      if (!data || data?.data?.length === 0) {
        alert("沒有景點，請更換關鍵字");
        return;
      }

      nextPage = data.nextPage;
      data.data.forEach((attraction) => {
        appendAttraction(attraction, attractionsDiv);
      });
    })
    .catch((error) => {
      console.error("Error fetching attractions:", error);
    })
    .finally(() => {
      loading = false;
    });
};

const onMRTclick = (mrtName) => {
  const inputElement = document.querySelector(".search");
  inputElement.value = mrtName;
  getAttractions(mrtName);
};

const getMRTs = () => {
  fetch("/api/mrts")
    .then((response) => response.json())
    .then((data) => {
      const mrtsDiv = document.querySelector(".mrts");

      if (data && data.data && data.data.length > 0) {
        data.data.forEach((mrtName) => {
          const mrtSpan = document.createElement("span");
          mrtSpan.classList.add("mrt");
          mrtSpan.textContent = mrtName;
          mrtSpan.addEventListener("click", function () {
            onMRTclick(mrtName);
          });

          mrtsDiv.appendChild(mrtSpan);
        });
      }
    })
    .catch((error) => {
      console.error("Error fetching MRTs:", error);
    });
};

const onSearchBtnClick = () => {
  const inputElement = document.querySelector(".search");
  const searchValue = inputElement.value;

  if (!searchValue || searchValue.trim() === "") {
    alert("請輸入關鍵字");
    return;
  }

  getAttractions(searchValue);
};

const attachEventListeners = () => {
  const mrtList = document.querySelector(".mrt-list");
  const mrts = mrtList.querySelector(".mrts");
  const arrowLeft = mrtList.querySelector(".arrow-left");
  const arrowRight = mrtList.querySelector(".arrow-right");

  arrowLeft.addEventListener("click", function () {
    const scrollAmount = mrts.clientWidth * 0.9;
    mrts.scrollBy({
      left: -scrollAmount,
      behavior: "smooth"
    });
  });

  arrowRight.addEventListener("click", function () {
    const scrollAmount = mrts.clientWidth * 0.9;
    mrts.scrollBy({
      left: scrollAmount,
      behavior: "smooth"
    });
  });

  window.addEventListener("scroll", () => {
    if (loading || !nextPage) {
      return;
    }

    if (
      window.innerHeight + window.scrollY >=
      document.body.offsetHeight - 300
    ) {
      getAttractions(defaultKeyword);
    }
  });
};

window.addEventListener("load", function () {
  getMRTs();
  getAttractions();
  attachEventListeners();
});
