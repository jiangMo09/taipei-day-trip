export const setupTapPay = async () => {
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
};

export const getTappayStatus = () => {
  return TPDirect.card.getTappayFieldsStatus();
};

export const getPrime = (callback) => {
  TPDirect.card.getPrime(callback);
};
