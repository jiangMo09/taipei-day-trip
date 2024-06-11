export const Info = ({ bottomDiv, description, address, transport }) => {
  bottomDiv.innerHTML = `
    <div class="info">${description}</div>
    <div class="address"><div class="title">景點地址：</div>${address}</div>
    <div class="transport"><div class="title">交通方式：</div>${transport}</div>
  `;
};
