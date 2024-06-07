const createState = (initialValue) => {
  let value = initialValue;

  return {
    getState: function () {
      return value;
    },
    setState: function (newValue) {
      value = newValue;
    }
  };
};

export { createState };
