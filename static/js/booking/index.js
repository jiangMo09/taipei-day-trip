import { fetchData } from "../utils/fetchData.js";
import { decodeJWT } from "../utils/decodeJwt.js";

const deleteBooking = async (bookingId) => {
  const authToken = localStorage.getItem("authToken");
  if (!authToken) {
    return;
  }

  try {
    const { error, message } = await fetchData(`/api/booking/${bookingId}`, {
      method: "DELETE",
      headers: { authToken }
    });

    if (error) {
      alert(message);
      return;
    }
    location.reload();
  } catch (error) {
    console.error("刪除預訂失敗:", error);
  }
};

const renderBooking = async () => {
  const authToken = localStorage.getItem("authToken");
  if (!authToken) {
    return;
  }

  const decodedPayload = decodeJWT(authToken);
  try {
    const { data } = await fetchData("/api/booking", {
      headers: { authToken }
    });

    document.querySelector(".user-name").textContent = decodedPayload.name;
    document.querySelector("#contact-name").value = decodedPayload.name;
    document.querySelector("#contact-email").value = decodedPayload.email;

    const schedulesContainer = document.querySelector(".schedules");
    const contactContainer = document.querySelector(".contact");
    const paymentContainer = document.querySelector(".credit-card-payment");
    const confirmOrderContainer = document.querySelector(".confirm-order");
    const hrElements = document.querySelectorAll("hr");
    const footerElements = document.querySelector("footer");

    if (!data || data.length === 0) {
      const noBookingsMessage = document.createElement("div");
      noBookingsMessage.textContent = "目前沒有任何待預訂的行程";
      schedulesContainer.appendChild(noBookingsMessage);

      contactContainer.style.display = "none";
      paymentContainer.style.display = "none";
      confirmOrderContainer.style.display = "none";
      footerElements.style.position = "fixed";
      footerElements.style.bottom = 0;
      hrElements.forEach((hr) => (hr.style.display = "none"));
      return;
    }
    let totalCost = 0;
    data.forEach((item) => {
      const scheduleElement = document.createElement("div");
      scheduleElement.classList.add("schedule");
      totalCost += item.price;

      scheduleElement.innerHTML = `
        <div class="image">
          <img src="${item.attraction.image}" />
        </div>
        <div class="info">
          <div class="detail">
            <div class="title font-weight-700">
              <div>
                <span>台北一日遊：</span>
                <span class="attraction">${item.attraction.name}</span>
              </div>
            </div>
            <div class="date">
              <span class="font-weight-700">日期：</span>
              <span class="date-value">${item.date}</span>
            </div>
            <div class="time">
              <span class="font-weight-700">時間：</span>
              <span class="time-value">${item.time}</span>
            </div>
            <div class="cost">
              <span class="font-weight-700">費用：</span>
              <span class="cost-value">${item.price}</span>
            </div>
            <div class="place">
              <span class="font-weight-700">地點：</span>
              <span class="place-value">${item.attraction.address}</span>
            </div>
          </div>
          <div class="delete" data-item-id="${item.id}">
            <img src="/static/images/delete.svg" />
          </div>
        </div>
      `;

      schedulesContainer.appendChild(scheduleElement);
    });
    document.querySelector(".total-cost").textContent = totalCost;
    document.querySelectorAll(".delete").forEach((deleteButton) => {
      const itemId = deleteButton.dataset.itemId;
      deleteButton.addEventListener("click", () => deleteBooking(itemId));
    });
  } catch (error) {
    console.error(error);
  }
};

const TPDirectCardSetupAndCheck = async () => {
  await TPDirect.setupSDK(
    151559,
    "app_c6fxgnloCMZySMjCi5lhPZa5j9D3CNuHZTJDIy2xCc9Z6VE7RzAtROT23Ejp",
    "sandbox"
  );

  TPDirect.card.setup({
    fields: {
      number: {
        element: "#card-number",
        placeholder: "**** **** **** ****"
      },
      expirationDate: {
        element: "#card-expiration-date",
        placeholder: "MM / YY"
      },
      ccv: {
        element: "#card-ccv",
        placeholder: "CVV"
      }
    },
    styles: {
      input: {
        color: "gray"
      },
      ":focus": {
        color: "black"
      },
      ".valid": {
        color: "green"
      },
      ".invalid": {
        color: "red"
      }
    },
    isMaskCreditCardNumber: true,
    maskCreditCardNumberRange: {
      beginIndex: 6,
      endIndex: 11
    }
  });

  const loginRegister = document.getElementById("booking-submit");
  loginRegister.onclick = () => {
    const contactInfo = checkUserInfo();
    if (!contactInfo) {
      return;
    }

    const getTappayFieldsStatus = TPDirect.card.getTappayFieldsStatus();
    if (!getTappayFieldsStatus.canGetPrime) {
      alert("請填寫正確的信用卡資訊");
      return;
    }

    const { name, email, phone } = contactInfo;

    TPDirect.card.getPrime(async (result) => {
      if (result.status !== 0) {
        alert("獲取 prime 失敗: " + result.msg);
        return;
      }

      try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) {
          alert("未登錄，請先登錄");
          return;
        }

        const totalPrice = parseInt(
          document.querySelector(".total-cost").textContent
        );

        const trips = Array.from(document.querySelectorAll(".schedule")).map(
          (schedule) => {
            return {
              attraction: {
                id: parseInt(schedule.querySelector(".delete").dataset.itemId),
                name: schedule.querySelector(".attraction").textContent,
                address: schedule.querySelector(".place-value").textContent,
                image: schedule.querySelector("img").src
              },
              date: schedule.querySelector(".date-value").textContent,
              time: schedule
                .querySelector(".time-value")
                .textContent.toLowerCase()
            };
          }
        );

        const contactInfo = checkUserInfo();
        if (!contactInfo) {
          return;
        }

        const requestBody = {
          prime: result.card.prime,
          order: {
            price: totalPrice,
            trips: trips,
            contact: {
              name: name,
              email: email,
              phone: phone
            }
          }
        };

        const response = await fetchData(`/api/orders`, {
          method: "POST",
          headers: {
            authToken: authToken,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        });

        if (response.error) {
          alert(`訂單創建失敗: ${response.message || "未知錯誤"}`);
          console.error("訂單創建失敗:", response);
        } else {
          alert("訂單創建成功！");
        }
      } catch (error) {
        console.error("付款失敗:", error);
        alert("訂單創建失敗，請稍後再試");
      }
    });
  };
};

const checkUserInfo = () => {
  const contactName = document.getElementById("contact-name").value;
  const contactEmail = document.getElementById("contact-email").value;
  const contactPhone = document.getElementById("contact-phone").value;

  if (!contactName) {
    alert("請填寫姓名");
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!contactEmail || !emailRegex.test(contactEmail)) {
    alert("請填寫正確的電子郵件地址");
    return false;
  }

  const phoneRegex = /^09\d{8}$/;
  if (!contactPhone || !phoneRegex.test(contactPhone)) {
    alert("請填寫正確的手機號碼");
    return false;
  }

  return {
    name: contactName,
    email: contactEmail,
    phone: contactPhone
  };
};

window.addEventListener("load", async () => {
  await renderBooking();
  await TPDirectCardSetupAndCheck();
});
