import { setupTapPay, getTappayStatus, getPrime } from "./tappay.js";
import { fetchData } from "../utils/fetchData.js";
import { validateUserInfo } from "./userInfoValidator.js";

export class PaymentHandler {
  constructor(authToken) {
    this.authToken = authToken;
  }

  async setup() {
    await setupTapPay();

    const loginRegister = document.getElementById("booking-submit");
    loginRegister.onclick = () => this.handlePayment();
  }

  async handlePayment() {
    const contactInfo = validateUserInfo();
    if (!contactInfo) return;

    const tappayStatus = getTappayStatus();
    if (!tappayStatus.canGetPrime) {
      alert("請填寫正確的信用卡資訊");
      return;
    }

    getPrime(async (result) => {
      if (result.status !== 0) {
        alert("獲取 prime 失敗: " + result.msg);
        return;
      }

      try {
        await this.createOrder(result.card.prime, contactInfo);
      } catch (error) {
        console.error("付款失敗:", error);
        alert("訂單創建失敗，請稍後再試");
      }
    });
  }

  async createOrder(prime, contactInfo) {
    if (!this.authToken) {
      alert("未登錄，請先登錄");
      return;
    }

    const totalPrice = parseInt(
      document.querySelector(".total-cost").textContent
    );
    const trips = this.getTripsData();

    const requestBody = {
      prime,
      order: {
        price: totalPrice,
        trips,
        contact: contactInfo
      }
    };

    const response = await fetchData(`/api/orders`, {
      method: "POST",
      headers: {
        authToken: this.authToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (response.error) {
      alert(`訂單創建失敗: ${response.message || "未知錯誤"}`);
      console.error("訂單創建失敗:", response);
    } else if (response?.data?.number) {
      window.location.href = `/thankyou?number=${response.data.number}`;
    }
  }

  getTripsData() {
    return Array.from(document.querySelectorAll(".schedule")).map(
      (schedule) => ({
        attraction: {
          id: parseInt(schedule.querySelector(".delete").dataset.itemId),
          name: schedule.querySelector(".attraction").textContent,
          address: schedule.querySelector(".place-value").textContent,
          image: schedule.querySelector("img").src
        },
        date: schedule.querySelector(".date-value").textContent,
        time: schedule.querySelector(".time-value").textContent.toLowerCase()
      })
    );
  }
}

export const setupPaymentHandler = (authToken) => {
  const handler = new PaymentHandler(authToken);
  handler.setup();
};
