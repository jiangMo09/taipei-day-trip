import { initializeWebSocket } from "./webSocketManager.js";
import { renderBooking } from "./bookingRenderer.js";
import { setupPaymentHandler } from "./paymentHandler.js";
import { fetchData } from "../utils/fetchData.js";

export class BookingManager {
  constructor() {
    this.authToken = localStorage.getItem("authToken");
  }

  init() {
    initializeWebSocket(this.authToken, () =>
      renderBooking(this.authToken, true)
    );
    renderBooking(this.authToken);
    setupPaymentHandler(this.authToken);
    this.setupDeleteListeners();
  }

  async deleteBooking(bookingId) {
    if (!this.authToken) {
      console.error("No auth token available");
      return;
    }

    try {
      const response = await fetchData(`/api/booking/${bookingId}`, {
        method: "DELETE",
        headers: { authToken: this.authToken }
      });

      if (response.error) {
        console.error("Error deleting booking:", response.message);
        alert(response.message);
        return;
      }
      location.reload();
    } catch (error) {
      console.error("Exception when deleting booking:", error);
      alert("刪除預訂時發生錯誤，請稍後再試");
    }
  }

  setupDeleteListeners() {
    const schedulesContainer = document.querySelector(".schedules");
    if (!schedulesContainer) {
      console.error("Schedules container not found");
      return;
    }

    schedulesContainer.addEventListener("click", (event) => {
      const deleteButton = event.target.closest(".delete");
      if (!deleteButton) {
        return;
      }

      const itemId = deleteButton.dataset.itemId;
      this.deleteBooking(itemId);
    });
  }
}

window.addEventListener("load", () => {
  const bookingManager = new BookingManager();
  bookingManager.init();
});
